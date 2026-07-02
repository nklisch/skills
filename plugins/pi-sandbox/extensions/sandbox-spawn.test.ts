import { afterEach, describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { chmod, mkdtemp, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { delimiter, dirname, isAbsolute, join, resolve } from "node:path";
import { loadConfig, validateConfig } from "./sandbox-config";
import { buildSandboxedSpawnArgs, findExecutableOnPath } from "./sandbox-spawn";

const tempDirs: string[] = [];

async function makeTempDir(): Promise<string> {
	const dir = await mkdtemp(join(tmpdir(), "pi-sandbox-spawn-test-"));
	tempDirs.push(dir);
	return dir;
}

async function makeAgentDir(config?: unknown): Promise<string> {
	const agentDir = await makeTempDir();
	await mkdir(join(agentDir, "extensions"), { recursive: true });
	if (config !== undefined) {
		await writeFile(join(agentDir, "extensions", "sandbox.json"), JSON.stringify(config));
	}
	return agentDir;
}

afterEach(async () => {
	while (tempDirs.length > 0) {
		const dir = tempDirs.pop();
		if (dir) await rm(dir, { recursive: true, force: true });
	}
});

function sequenceIndex(args: string[], sequence: string[]): number {
	for (let i = 0; i <= args.length - sequence.length; i += 1) {
		if (sequence.every((part, offset) => args[i + offset] === part)) return i;
	}
	return -1;
}

describe("buildSandboxedSpawnArgs", () => {
	test("returns a bwrap spawn prefix and minimal env in the ok state", async () => {
		const cwd = await makeTempDir();
		const agentDir = await makeAgentDir();
		const result = buildSandboxedSpawnArgs({
			command: "echo ok",
			cwd,
			agentDir,
			platform: "linux",
			bwrapAvailable: true,
			baseEnv: {
				PATH: "/usr/bin",
				HOME: "/home/test",
				LANG: "C.UTF-8",
				OPENAI_API_KEY: "must-not-leak",
			},
		});

		expect(result.state).toBe("ok");
		if (result.state !== "ok") throw new Error(`expected ok, got ${result.state}`);
		expect(result.executable).toBe(findExecutableOnPath("bwrap", { PATH: "/usr/bin" }));
		expect(isAbsolute(result.executable)).toBe(true);
		expect(sequenceIndex(result.args, ["--ro-bind", "/", "/"])).toBeGreaterThanOrEqual(0);
		expect(result.args.slice(-3)).toEqual(["--", "bash", "-c"]);
		expect(result.args).not.toContain("echo ok");
		expect(result.env).toEqual({ PATH: "/usr/bin", HOME: "/home/test", LANG: "C.UTF-8" });
		expect(result.env.OPENAI_API_KEY).toBeUndefined();
	});

	test("filters envAdd through the sandbox minimal-env allowlist", async () => {
		const cwd = await makeTempDir();
		const agentDir = await makeAgentDir();
		const result = buildSandboxedSpawnArgs({
			command: "env",
			cwd,
			agentDir,
			platform: "linux",
			bwrapAvailable: true,
			baseEnv: { PATH: "/usr/bin" },
			envAdd: { TERM: "xterm-256color", LC_ALL: "C", FOO_SECRET: "drop-me" },
		});

		expect(result.state).toBe("ok");
		if (result.state !== "ok") throw new Error(`expected ok, got ${result.state}`);
		expect(result.env.PATH).toBe("/usr/bin");
		expect(result.env.TERM).toBe("xterm-256color");
		expect(result.env.LC_ALL).toBe("C");
		expect(result.env.FOO_SECRET).toBeUndefined();
	});

	test("resolves the bwrap wrapper from trusted PATH, not user envAdd PATH", async () => {
		const realBwrap = findExecutableOnPath("bwrap", process.env);
		if (!realBwrap) throw new Error("expected bwrap on trusted PATH for PATH-poisoning regression test");
		const cwd = await makeTempDir();
		const agentDir = await makeAgentDir();
		const attackerDir = await makeTempDir();
		const marker = join(cwd, "fake-bwrap-ran.txt");
		const secret = join(cwd, "secret.txt");
		const leak = join(cwd, "secret-leaked.txt");
		const fakeBwrap = join(attackerDir, "bwrap");
		await writeFile(secret, "SUPER-SECRET\n");
		await writeFile(fakeBwrap, `#!/bin/sh\necho fake > ${JSON.stringify(marker)}\ncat ${JSON.stringify(secret)} > ${JSON.stringify(leak)} 2>/dev/null\nexit 0\n`);
		await chmod(fakeBwrap, 0o755);

		const poisonedPath = `${attackerDir}${delimiter}${process.env.PATH ?? dirname(realBwrap)}`;
		const result = buildSandboxedSpawnArgs({
			command: "cat secret.txt",
			cwd,
			agentDir,
			platform: "linux",
			baseEnv: process.env,
			envAdd: { PATH: poisonedPath },
		});

		expect(result.state).toBe("ok");
		if (result.state !== "ok") throw new Error(`expected ok, got ${result.state}`);
		expect(result.executable).toBe(realBwrap);
		expect(result.executable).not.toBe(fakeBwrap);
		expect(result.executable.startsWith(attackerDir)).toBe(false);
		expect(isAbsolute(result.executable)).toBe(true);
		expect(result.env.PATH?.startsWith(`${attackerDir}${delimiter}`)).toBe(true);

		const probe = Bun.spawnSync([result.executable, "--version"], {
			env: result.env,
			stdout: "pipe",
			stderr: "pipe",
		});
		expect(probe.success).toBe(true);
		expect(existsSync(marker)).toBe(false);
		expect(existsSync(leak)).toBe(false);
	});

	test("degrades for a global operator integration opt-out", async () => {
		const cwd = await makeTempDir();
		const agentDir = await makeAgentDir({ backgroundTasks: { sandboxIntegration: "off" } });
		const result = buildSandboxedSpawnArgs({
			command: "echo unsandboxed",
			cwd,
			agentDir,
			platform: "linux",
			bwrapAvailable: true,
			baseEnv: { PATH: "/usr/bin", FOO_SECRET: "kept-in-degrade" },
		});

		expect(result).toMatchObject({
			state: "degraded",
			integration: "inactive",
			reason: "integration-off",
			executable: null,
			args: [],
		});
		expect(result.env.FOO_SECRET).toBe("kept-in-degrade");
	});

	test("degrades on non-Linux platforms with the normal merged env", async () => {
		const cwd = await makeTempDir();
		const agentDir = await makeAgentDir();
		const result = buildSandboxedSpawnArgs({
			command: "echo unsupported",
			cwd,
			agentDir,
			platform: "darwin",
			bwrapAvailable: false,
			baseEnv: { PATH: "/usr/bin" },
			envAdd: { FOO_SECRET: "still-present-when-unsandboxed" },
		});

		expect(result).toMatchObject({
			state: "degraded",
			integration: "inactive",
			reason: "unsupported-platform",
			executable: null,
			args: [],
		});
		expect(result.env.FOO_SECRET).toBe("still-present-when-unsandboxed");
		expect(result.message).toContain("OS backend unavailable");
	});

	test("fails closed when network filter mode is requested", async () => {
		const cwd = await makeTempDir();
		const agentDir = await makeAgentDir();
		await mkdir(join(cwd, ".pi"), { recursive: true });
		await writeFile(join(cwd, ".pi", "sandbox.json"), JSON.stringify({ network: { mode: "filter" } }));

		const result = buildSandboxedSpawnArgs({
			command: "echo blocked",
			cwd,
			agentDir,
			platform: "linux",
			bwrapAvailable: true,
			baseEnv: { PATH: "/usr/bin" },
		});

		expect(result).toMatchObject({
			state: "fail-closed",
			integration: "blocked",
			reason: "filter-deferred",
			executable: null,
			args: [],
		});
		expect(result.message).toContain("network.mode=filter");
	});

	test("fails closed on Linux when bwrap is missing", async () => {
		const cwd = await makeTempDir();
		const agentDir = await makeAgentDir();
		const result = buildSandboxedSpawnArgs({
			command: "echo blocked",
			cwd,
			agentDir,
			platform: "linux",
			bwrapAvailable: false,
			baseEnv: { PATH: "/usr/bin" },
		});

		expect(result).toMatchObject({
			state: "fail-closed",
			integration: "blocked",
			reason: "bwrap-missing",
			executable: null,
			args: [],
		});
		expect(result.message).toContain("bwrap is not available");
	});

	test("invalid config fails closed before returning runnable args", async () => {
		const cwd = await makeTempDir();
		const agentDir = await makeAgentDir();
		await mkdir(join(cwd, ".pi"), { recursive: true });
		await writeFile(join(cwd, ".pi", "sandbox.json"), "{ not json");

		const result = buildSandboxedSpawnArgs({
			command: "echo blocked",
			cwd,
			agentDir,
			platform: "linux",
			bwrapAvailable: true,
			baseEnv: { PATH: "/usr/bin" },
		});

		expect(result).toMatchObject({
			state: "fail-closed",
			integration: "blocked",
			reason: "config-parse-error",
			executable: null,
			args: [],
		});
		expect(result.errors?.join("\n")).toContain("project");
	});
});

describe("backgroundTasks sandboxIntegration config", () => {
	test("validates integration values", () => {
		expect(validateConfig({ backgroundTasks: { sandboxIntegration: "auto" } })).toEqual([]);
		expect(validateConfig({ backgroundTasks: { sandboxIntegration: "off" } })).toEqual([]);
		expect(validateConfig({ backgroundTasks: { sandboxIntegration: "maybe" } }).join("\n")).toContain("backgroundTasks.sandboxIntegration");
	});

	test("project config cannot loosen global auto integration to off", async () => {
		const cwd = await makeTempDir();
		const agentDir = await makeAgentDir({ backgroundTasks: { sandboxIntegration: "auto" } });
		await mkdir(join(cwd, ".pi"), { recursive: true });
		await writeFile(join(cwd, ".pi", "sandbox.json"), JSON.stringify({ backgroundTasks: { sandboxIntegration: "off" } }));

		const loaded = loadConfig(cwd, { agentDir });

		expect(loaded.config.backgroundTasks?.sandboxIntegration).toBe("auto");
		expect(loaded.additiveWarnings.join("\n")).toContain("backgroundTasks.sandboxIntegration (auto -> off)");
	});

	test("project config may tighten a global off opt-out back to auto", async () => {
		const cwd = await makeTempDir();
		const agentDir = await makeAgentDir({ backgroundTasks: { sandboxIntegration: "off" } });
		await mkdir(join(cwd, ".pi"), { recursive: true });
		await writeFile(join(cwd, ".pi", "sandbox.json"), JSON.stringify({ backgroundTasks: { sandboxIntegration: "auto" } }));

		const loaded = loadConfig(cwd, { agentDir });

		expect(loaded.config.backgroundTasks?.sandboxIntegration).toBe("auto");
		expect(loaded.additiveWarnings).toEqual([]);
	});
});

describe("package metadata exports", () => {
	test("exposes only the sandbox-spawn subpath", async () => {
		const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8")) as {
			exports?: Record<string, { types?: string; import?: string } | string>;
		};

		expect(packageJson.exports).toEqual({
			"./sandbox-spawn": {
				types: "./extensions/sandbox-spawn.ts",
				import: "./extensions/sandbox-spawn.ts",
			},
		});
		expect(packageJson.exports?.["./bwrap"]).toBeUndefined();
		expect(packageJson.exports?.["./sandbox-config"]).toBeUndefined();
	});

	test("runtime package subpath resolves buildSandboxedSpawnArgs", async () => {
		const sandboxCwd = await makeTempDir();
		const scopeDir = join(sandboxCwd, "node_modules", "@nklisch");
		await mkdir(scopeDir, { recursive: true });
		await symlink(resolve(new URL("..", import.meta.url).pathname), join(scopeDir, "pi-sandbox"));

		const script = `const mod = await import("@nklisch/pi-sandbox/sandbox-spawn");\nif (typeof mod.buildSandboxedSpawnArgs !== "function") {\n  console.error("buildSandboxedSpawnArgs missing");\n  process.exit(2);\n}\n`;
		const result = Bun.spawnSync([process.execPath, "--eval", script], {
			cwd: sandboxCwd,
			stdout: "pipe",
			stderr: "pipe",
		});
		const stderr = Buffer.from(result.stderr).toString("utf8");
		expect(result.exitCode, stderr || "subpath import failed").toBe(0);
	});
});
