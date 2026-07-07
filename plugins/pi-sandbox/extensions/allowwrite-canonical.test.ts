import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync, symlinkSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { enforceDenyRead, enforceWritePolicy, type SandboxPolicy } from "./sandbox-file-policy";

const tempDirs: string[] = [];

function makeTempDir(): string {
	const dir = mkdtempSync(join(tmpdir(), "pi-sandbox-allowwrite-test-"));
	tempDirs.push(dir);
	return dir;
}

afterEach(() => {
	while (tempDirs.length > 0) {
		const dir = tempDirs.pop();
		if (dir) rmSync(dir, { recursive: true, force: true });
	}
});

function policyFor(cwd: string, overrides: Partial<SandboxPolicy> = {}): SandboxPolicy {
	return {
		cwd,
		denyRead: [],
		denyWrite: [],
		allowWrite: [],
		networkMode: "open",
		...overrides,
	};
}

function expectWriteAllowed(absolutePath: string, cwd: string, policy: SandboxPolicy): void {
	expect(() => enforceWritePolicy(absolutePath, cwd, policy)).not.toThrow();
}

function expectAllowWriteDenied(absolutePath: string, cwd: string, policy: SandboxPolicy): void {
	expect(() => enforceWritePolicy(absolutePath, cwd, policy)).toThrow(/allowWrite/);
}

describe("allowWrite canonical target confinement", () => {
	test("project symlink to /etc does not widen writes under allowWrite dot", () => {
		const cwd = makeTempDir();
		symlinkSync("/etc", join(cwd, "passwd-link"), "dir");

		expectAllowWriteDenied(join(cwd, "passwd-link", "passwd"), cwd, policyFor(cwd, { allowWrite: ["."] }));
	});

	test("project symlink to an allowed resolved directory remains writable", () => {
		const cwd = makeTempDir();
		const cacheDir = makeTempDir();
		const linkPath = join(cwd, "cache-link");
		symlinkSync(cacheDir, linkPath, "dir");

		expectWriteAllowed(join(linkPath, "file.txt"), cwd, policyFor(cwd, { allowWrite: [cacheDir] }));
		expectWriteAllowed(join(linkPath, "via-link.txt"), cwd, policyFor(cwd, { allowWrite: [linkPath] }));
	});

	test("deny still catches a symlinked leaf via its lexical glob name", () => {
		const cwd = makeTempDir();
		writeFileSync(join(cwd, "secret-key"), "secret");
		symlinkSync("secret-key", join(cwd, "key.pem"));

		expect(() => enforceDenyRead(join(cwd, "key.pem"), cwd, policyFor(cwd, { denyRead: ["*.pem"] }))).toThrow(
			/denyRead.*\*\.pem/,
		);
	});

	test("glob allowWrite entries match canonical targets only", () => {
		const cwd = makeTempDir();
		const realLog = join(cwd, "real.log");
		writeFileSync(realLog, "existing log");
		symlinkSync("/etc/passwd", join(cwd, "passwd.log"));
		symlinkSync("/etc", join(cwd, "link"), "dir");

		expectWriteAllowed(realLog, cwd, policyFor(cwd, { allowWrite: ["*.log"] }));
		expectAllowWriteDenied(join(cwd, "passwd.log"), cwd, policyFor(cwd, { allowWrite: ["*.log"] }));
		expectAllowWriteDenied(join(cwd, "link", "data.log"), cwd, policyFor(cwd, { allowWrite: ["link/*.log"] }));
	});

	test("new files through project symlinks resolve to the canonical parent before allowWrite", () => {
		const cwd = makeTempDir();
		symlinkSync("/etc", join(cwd, "link"), "dir");

		expectAllowWriteDenied(join(cwd, "link", "new.txt"), cwd, policyFor(cwd, { allowWrite: ["."] }));
	});

	test("dangling symlink leaf to a denyRead target is blocked (not treated as a new in-cwd file)", () => {
		// Regression: a symlink whose target does not yet exist used to fall through
		// canonicalizeExistingPath (existsSync follows symlinks → false) and be
		// treated as an ordinary new file under its lexical parent, so writeFile
		// followed the symlink and created the target inside denyRead / outside
		// allowWrite. The write-policy resolver must readlink the symlink first.
		const cwd = makeTempDir();
		const outside = makeTempDir();
		const deniedDir = join(outside, ".ssh");
		mkdirSync(deniedDir, { recursive: true });
		// Dangling symlink: target /outside/.ssh/new_key does not exist yet.
		symlinkSync(join(deniedDir, "new_key"), join(cwd, "link"));

		expect(() => enforceWritePolicy(join(cwd, "link"), cwd, policyFor(cwd, { allowWrite: ["."], denyRead: [deniedDir] }))).toThrow(
			/denyRead/,
		);
	});

	test("dangling symlink leaf to a path outside allowWrite is blocked even without denyRead", () => {
		const cwd = makeTempDir();
		const outside = makeTempDir();
		symlinkSync(join(outside, "escape.txt"), join(cwd, "link"));

		expectAllowWriteDenied(join(cwd, "link"), cwd, policyFor(cwd, { allowWrite: ["."] }));
	});

	test("dangling symlink leaf into an allowed canonical directory remains writable", () => {
		// Positive control: a dangling symlink whose target resolves into an
		// allowWrite directory must still be writable (the fix must not over-block).
		const cwd = makeTempDir();
		const allowedSub = join(cwd, "sub");
		mkdirSync(allowedSub, { recursive: true });
		// Dangling symlink: target cwd/sub/real.txt does not exist yet, but its
		// parent (cwd/sub) is allowed via allowWrite:["."] and canonicalizes in-cwd.
		symlinkSync(join(allowedSub, "real.txt"), join(cwd, "link"));

		expectWriteAllowed(join(cwd, "link"), cwd, policyFor(cwd, { allowWrite: ["."] }));
	});
});
