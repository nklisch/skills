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
});
