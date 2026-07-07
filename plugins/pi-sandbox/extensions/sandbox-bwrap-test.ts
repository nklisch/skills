import { test } from "bun:test";

const BWRAP_COMMAND = "bwrap";

type BwrapGuardOverride = {
	isLinux?: boolean;
	hasBwrap?: boolean;
	requireBwrap?: boolean;
};

export type BwrapMode = "run" | "skip" | "require-fail";

export type BwrapGuardResult = {
	mode: BwrapMode;
	isLinux: boolean;
	hasBwrap: boolean;
	requireBwrap: boolean;
};

function isBwrapPresent(isLinux: boolean): boolean {
	return isLinux && Bun.spawnSync([BWRAP_COMMAND, "--version"], { stdout: "pipe", stderr: "pipe" }).success;
}

export function resolveBwrapMode(overrides: BwrapGuardOverride = {}): BwrapGuardResult {
	const isLinux = overrides.isLinux ?? process.platform === "linux";
	const hasBwrap = overrides.hasBwrap ?? isBwrapPresent(isLinux);
	const requireBwrap = overrides.requireBwrap ?? process.env.PI_SANDBOX_REQUIRE_BWRAP === "1";

	if (isLinux && hasBwrap) return { mode: "run", isLinux, hasBwrap, requireBwrap };
	if (requireBwrap) return { mode: "require-fail", isLinux, hasBwrap, requireBwrap };
	return { mode: "skip", isLinux, hasBwrap, requireBwrap };
}

export function assertBwrapRequiredForIntegration(testName: string, overrides: BwrapGuardOverride = {}): never {
	const resolved = resolveBwrapMode(overrides);

	if (!resolved.requireBwrap) {
		throw new Error(`Bwrap integration test ${JSON.stringify(testName)} is currently optional. Set PI_SANDBOX_REQUIRE_BWRAP=1 to make missing bubblewrap a hard failure.`);
	}
	if (!resolved.isLinux) {
		throw new Error(`PI_SANDBOX_REQUIRE_BWRAP=1 is set, but ${JSON.stringify(testName)} requires bwrap on Linux.`);
	}
	if (!resolved.hasBwrap) {
		throw new Error(`PI_SANDBOX_REQUIRE_BWRAP=1 is set, but ${JSON.stringify(testName)} requires bubblewrap, and no working bwrap binary was detected.`);
	}

	throw new Error(`Unexpected bwrap guard state for ${JSON.stringify(testName)}.`);
}

export function makeBwrapIntegrationTest(overrides: BwrapGuardOverride = {}, testImpl = test): (name: string, fn: () => void | Promise<void>) => void {
	const resolved = resolveBwrapMode(overrides);

	switch (resolved.mode) {
		case "run":
			return testImpl;
		case "require-fail":
			return (name, _fn) => {
				testImpl(name, () => {
					assertBwrapRequiredForIntegration(name, overrides);
				});
			};
		case "skip":
		default:
			return (name, fn) => testImpl.skip(name, fn);
	}
}
