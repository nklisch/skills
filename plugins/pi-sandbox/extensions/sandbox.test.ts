import { describe, expect, test } from "bun:test";
import { shouldBypassSandbox } from "./sandbox-bwrap";

describe("sandbox enabled/disabled bypass guard", () => {
	test("enabled:false bypasses sandbox even without --no-sandbox", () => {
		expect(shouldBypassSandbox(false, true)).toBe(true);
	});

	test("enabled:true keeps the normal sandboxed path when --no-sandbox is absent", () => {
		expect(shouldBypassSandbox(false, false)).toBe(false);
	});

	test("--no-sandbox bypasses regardless of config state", () => {
		expect(shouldBypassSandbox(true, false)).toBe(true);
		expect(shouldBypassSandbox(true, true)).toBe(true);
	});
});
