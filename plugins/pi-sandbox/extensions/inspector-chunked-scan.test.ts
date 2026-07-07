import { describe, expect, test } from "bun:test";
import { inspectToolInput, type ToolInspector } from "./sandbox-config";

const SECRET = "sk-ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890abcd";
const API_KEY_PATTERN = "sk-[A-Za-z0-9]{20,}";
const MAX_SCAN_LENGTH = 10_000;

function redactingInspector(): ToolInspector {
	return {
		secrets: [{ name: "api-key", pattern: API_KEY_PATTERN, action: "redact", keywords: ["sk-"] }],
		onNoMatch: "allow",
	};
}

function redactionCount(value: unknown): number {
	expect(typeof value).toBe("string");
	return ((value as string).match(/\[REDACTED:api-key\]/g) ?? []).length;
}

describe("tool input inspector chunked scanning", () => {
	test("catches a secret after 10KB of padding in an auto-policy field", () => {
		const input: Record<string, unknown> = {
			body: `${"x".repeat(MAX_SCAN_LENGTH + 5)}OPENAI_API_KEY=${SECRET}`,
		};

		const verdict = inspectToolInput("agent_send", input, redactingInspector());

		expect(verdict.action).toBe("allow");
		expect(input.body).toContain("OPENAI_API_KEY=[REDACTED:api-key]");
		expect(input.body).not.toContain(SECRET);
	});

	test("100K-char fields return promptly without a secret match", () => {
		const input: Record<string, unknown> = { body: "x".repeat(100_000) };
		const start = performance.now();

		const verdict = inspectToolInput("agent_send", input, redactingInspector());
		const elapsedMs = performance.now() - start;

		expect(verdict.action).toBe("allow");
		expect(input.body).toBe("x".repeat(100_000));
		expect(elapsedMs).toBeLessThan(1_000);
	});

	for (const [label, offset] of [
		["start", 0],
		["middle", 50_000],
		["end", 99_900],
	] as const) {
		test(`catches a secret at the ${label} of a >10K field`, () => {
			const input: Record<string, unknown> = {
				body: `${"x".repeat(offset)}${SECRET}${".".repeat(100_000 - offset)}`,
			};

			const verdict = inspectToolInput("agent_send", input, redactingInspector());

			expect(verdict.action).toBe("allow");
			expect(input.body).not.toContain(SECRET);
			expect(redactionCount(input.body)).toBe(1);
		});
	}

	test("redacts a secret straddling a scan-window boundary exactly once", () => {
		const credential = `OPENAI_API_KEY=${SECRET}`;
		const input: Record<string, unknown> = {
			body: `${"x".repeat(MAX_SCAN_LENGTH - 20)}${credential}${".".repeat(MAX_SCAN_LENGTH)}`,
		};

		const verdict = inspectToolInput("agent_send", input, redactingInspector());

		expect(verdict.action).toBe("allow");
		expect(input.body).toContain("OPENAI_API_KEY=[REDACTED:api-key]");
		expect(input.body).not.toContain(SECRET);
		expect(redactionCount(input.body)).toBe(1);
	});

	test("bounded windows preserve the ReDoS guard on a pathologically nested regex", () => {
		const input: Record<string, unknown> = { body: "a".repeat(50_000) };
		const inspector: ToolInspector = {
			secrets: [{ name: "nested", pattern: "(a+)+", action: "redact" }],
		};
		const start = performance.now();

		const verdict = inspectToolInput("agent_send", input, inspector);
		const elapsedMs = performance.now() - start;

		expect(verdict.action).toBe("allow");
		expect(typeof input.body).toBe("string");
		expect(elapsedMs).toBeLessThan(2_000);
	});

	test("fields under the cap keep byte-identical redaction placement", () => {
		const prefix = "x".repeat(100);
		const suffix = ".".repeat(5_000 - prefix.length - SECRET.length);
		const input: Record<string, unknown> = { body: `${prefix}${SECRET}${suffix}` };

		const verdict = inspectToolInput("agent_send", input, redactingInspector());

		expect(verdict.action).toBe("allow");
		expect(input.body).toBe(`${prefix}[REDACTED:api-key]${suffix}`);
	});

	test("keyword pre-filter gates the whole field, not per window (B1-2)", () => {
		// A keyword at byte 9_700 and a secret beyond the scan overlap at byte ~10_050
		// must still match: the keyword is checked against the full field text once,
		// not the per-window slice. Before the fix the secret's window had no keyword
		// and the shape was skipped -> secret evaded.
		const keyword = "OPENAI_API_KEY";
		const secretOffset = MAX_SCAN_LENGTH + 50;
		const input: Record<string, unknown> = {
			body: `${"x".repeat(9_700)}${keyword}${"x".repeat(secretOffset - 9_700 - keyword.length)}${SECRET}${".".repeat(5_000)}`,
		};

		const verdict = inspectToolInput("agent_send", input, redactingInspector());

		expect(verdict.action).toBe("allow");
		expect(input.body).not.toContain(SECRET);
		expect(redactionCount(input.body)).toBe(1);
	});

	test("a long (>256) secret split across a window boundary is caught (B1-3)", () => {
		// The token must start before the next window's start (so it isn't fully in
		// window N+1) and extend past window N's end (so it isn't fully in window N).
		// Under the old 256 overlap (stride 9744): window 0 [0,10000) sees `sk-` +
		// 397 A's (< 400 -> no match); window 1 [9744,19744) sees A's with no `sk-`
		// prefix -> no match -> secret MISSED. Under the raised 2048 overlap
		// (stride 7952): window 1 [7952,17952) fully contains the token -> caught.
		const longToken = `sk-${"A".repeat(500)}`;
		const inspector: ToolInspector = {
			secrets: [{ name: "long-token", pattern: "sk-[A-Za-z0-9]{400,}", action: "redact" }],
			onNoMatch: "allow",
		};
		const splitAt = 9_600; // < stride-old (9744), so window 1 (old) misses the `sk-` prefix
		const input: Record<string, unknown> = {
			body: `${"x".repeat(splitAt)}${longToken}${".".repeat(MAX_SCAN_LENGTH)}`,
		};

		const verdict = inspectToolInput("agent_send", input, inspector);

		expect(verdict.action).toBe("allow");
		expect(input.body).not.toContain(longToken);
		expect((input.body as string).match(/\[REDACTED:long-token\]/g)?.length ?? 0).toBe(1);
	});

	test("redact-cap overflow fails closed and blocks a real secret after decoys (B1-1)", () => {
		// The original B1-1 bug: 10K decoy matches consumed the redaction cap,
		// then a real secret was scanned but not pushed to redactRanges and the
		// call allowed — the real key egressed unredacted. Now the cap is enforced
		// AFTER dedup and overflow fails closed (block), so the real secret cannot
		// survive. Uses a shape that matches both decoys and the real key.
		const decoy = "sk-AAAAAAAAAAAAAAAAAAAA"; // 23 chars, matches sk-[A-Za-z0-9]{20,}
		const realKey = "sk-BBBBBBBBBBBBBBBBBBBB";
		// Need > 10K unique dedup'd ranges across all windows. At ~434 matches per
		// 10K window (stride 7952), ~24 windows of decoys clears the cap.
		const decoys = decoy.repeat(24_000); // ~552K chars -> > 10K ranges post-dedup
		const input: Record<string, unknown> = { body: `${decoys}${realKey}` };

		const verdict = inspectToolInput("agent_send", input, redactingInspector());

		expect(verdict.action).toBe("block");
		expect(verdict.reason).toContain("redaction cap exceeded");
		// The real key must not have egressed unredacted (blocked, so input is untouched).
		expect(input.body).toContain(realKey); // untouched because blocked, not because allowed
	});
});
