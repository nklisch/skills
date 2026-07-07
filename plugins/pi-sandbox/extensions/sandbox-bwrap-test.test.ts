import { describe, expect, test } from "bun:test";
import { assertBwrapRequiredForIntegration, resolveBwrapMode } from "./sandbox-bwrap-test";

describe("sandbox bwrap test guard", () => {
	test("treats present bwrap as runnable", () => {
		expect(resolveBwrapMode({ isLinux: true, hasBwrap: true, requireBwrap: false }).mode).toBe("run");
		expect(resolveBwrapMode({ isLinux: true, hasBwrap: true, requireBwrap: true }).mode).toBe("run");
	});

	test("forces fail mode when PI_SANDBOX_REQUIRE_BWRAP is set and bwrap is missing", () => {
		expect(resolveBwrapMode({ isLinux: true, hasBwrap: false, requireBwrap: true }).mode).toBe("require-fail");
	});

	test("throws when helper is forced into required mode with missing bwrap", () => {
		expect(() => {
			assertBwrapRequiredForIntegration("forced guard", { isLinux: true, hasBwrap: false, requireBwrap: true });
		}).toThrowError("PI_SANDBOX_REQUIRE_BWRAP=1");
	});
});
