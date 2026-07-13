import { afterEach, describe, expect, test } from "bun:test";
import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, join } from "node:path";
import { loadConfig, validateConfig } from "./sandbox-config";
import { resolveTrustedBwrap } from "./sandbox-bwrap";

const tempDirs: string[] = [];

function makeTempDir(): string {
	const dir = mkdtempSync(join(tmpdir(), "pi-sandbox-bwrap-pin-test-"));
	tempDirs.push(dir);
	return dir;
}

function makeExecutable(path: string, body = "#!/bin/sh\nexit 0\n"): string {
	writeFileSync(path, body);
	chmodSync(path, 0o755);
	return path;
}

afterEach(() => {
	while (tempDirs.length > 0) {
		const dir = tempDirs.pop();
		if (dir) rmSync(dir, { recursive: true, force: true });
	}
});

describe("trusted bwrap pinning", () => {
	test("accepts /usr/bin/bwrap with no config", () => {
		const resolved = resolveTrustedBwrap({ env: { PATH: "" } });

		expect(resolved.ok).toBe(true);
		if (!resolved.ok) throw new Error(resolved.reason);
		expect(resolved.path).toBe("/usr/bin/bwrap");
	});

	test("ignores hostile PATH entries and never selects a fake bwrap", () => {
		const attackerDir = makeTempDir();
		const fakeBwrap = makeExecutable(join(attackerDir, "bwrap"), "#!/bin/sh\necho pwned\nexit 0\n");
		const env = { PATH: `${attackerDir}${delimiter}/usr/bin:/bin` };

		const resolved = resolveTrustedBwrap({ env });

		if (resolved.ok) {
			expect(resolved.path).not.toBe(fakeBwrap);
			expect(resolved.path.startsWith(attackerDir)).toBe(false);
			expect(["/usr/bin/bwrap", "/bin/bwrap"]).toContain(resolved.path);
		} else {
			expect(resolved.rejectedPath).not.toBe(fakeBwrap);
			expect(resolved.reason).toContain("allowlist");
		}
	});

	test("rejects a configured bwrapPath that is not executable and names the path", () => {
		const dir = makeTempDir();
		const configuredPath = join(dir, "bwrap");
		writeFileSync(configuredPath, "not executable\n");
		chmodSync(configuredPath, 0o644);

		const resolved = resolveTrustedBwrap({ bwrapPath: configuredPath, env: { PATH: "/usr/bin" } });

		expect(resolved.ok).toBe(false);
		if (resolved.ok) throw new Error(`expected failure, got ${resolved.path}`);
		expect(resolved.rejectedPath).toBe(configuredPath);
		expect(resolved.reason).toContain("not executable");
		expect(resolved.reason).toContain(configuredPath);
	});

	test("rejects a configured bwrapPath that points at a directory, not a regular file", () => {
		const dir = makeTempDir();
		// A directory is X_OK (executable bit on dirs means searchable), so the old
		// X_OK-only check accepted it — passing init and failing later at spawn.
		// The isFile() guard rejects directories and special files at validation.
		const resolved = resolveTrustedBwrap({ bwrapPath: dir, env: { PATH: "/usr/bin" } });

		expect(resolved.ok).toBe(false);
		if (resolved.ok) throw new Error(`expected failure, got ${resolved.path}`);
		expect(resolved.rejectedPath).toBe(dir);
		expect(resolved.reason).toContain("not a regular file");
		expect(resolved.reason).toContain(dir);
	});

	test("uses an executable configured bwrapPath exclusively", () => {
		const attackerDir = makeTempDir();
		const configuredPath = makeExecutable(join(attackerDir, "custom-bwrap"));
		const fakePathBwrap = makeExecutable(join(attackerDir, "bwrap"), "#!/bin/sh\necho pwned\nexit 0\n");
		const env = { PATH: `${attackerDir}${delimiter}/usr/bin:/bin` };

		const resolved = resolveTrustedBwrap({ bwrapPath: configuredPath, env });

		expect(resolved.ok).toBe(true);
		if (!resolved.ok) throw new Error(resolved.reason);
		expect(resolved.path).toBe(configuredPath);
		expect(resolved.path).not.toBe(fakePathBwrap);
		expect(resolved.path).not.toBe("/usr/bin/bwrap");
	});

	test("validates bwrapPath shape without resolving the filesystem", () => {
		expect(validateConfig({ bwrapPath: "/custom/bwrap" })).toEqual([]);
		expect(validateConfig({ bwrapPath: 42 }).join("\n")).toContain("bwrapPath must be a string");
	});

	test("rejects project-local bwrapPath as a global/operator-only trust decision", () => {
		const cwd = makeTempDir();
		const agentDir = makeTempDir();
		mkdirSync(join(cwd, ".pi"), { recursive: true });
		mkdirSync(join(agentDir, "extensions"), { recursive: true });
		// A malicious checkout must not be able to pin a hostile bwrap via
		// project-local config — bwrapPath selects the binary that runs bash
		// OUTSIDE the sandbox, so it is the most privileged trust decision in
		// the system. Project-local bwrapPath is rejected (additive-only contract).
		writeFileSync(join(cwd, ".pi", "sandbox.json"), JSON.stringify({ bwrapPath: "/tmp/evil-bwrap" }));

		const loaded = loadConfig(cwd, { agentDir });

		expect(loaded.parseErrors).toEqual([]);
		expect(loaded.config.bwrapPath).toBeUndefined();
		expect(loaded.additiveWarnings.some((w) => w.includes("bwrapPath") && w.includes("ignored"))).toBe(true);
	});
});
