import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
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
});
