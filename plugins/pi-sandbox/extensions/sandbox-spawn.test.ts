import { afterEach, describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { chmod, mkdtemp, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { delimiter, dirname, isAbsolute, join, resolve } from "node:path";
import { loadConfig, validateConfig } from "./sandbox-config";
import { PROVIDER_SECRET_ENV_NAMES, buildSandboxedSpawnArgs, findExecutableOnPath } from "./sandbox-spawn";
import { makeBwrapIntegrationTest } from "./sandbox-bwrap.test";

const tempDirs: string[] = [];
const isLinux = process.platform === "linux";
const hasBwrap = isLinux && (() => {
	try {
		return Bun.spawnSync(["bwrap", "--version"], { stdout: "pipe", stderr: "pipe" }).success;
	} catch {
		return false;
	}
})();
const bwrapIntegrationTest = makeBwrapIntegrationTest({ isLinux, hasBwrap });

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
			configCwd: cwd,
			agentDir,
			platform: "linux",
			bwrapAvailable: true,
			tmpBackend: "host-tmpfs",
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

	test("preserves caller envAdd over the minimal-env allowlist, scrubbing provider secrets", async () => {
		const cwd = await makeTempDir();
		const agentDir = await makeAgentDir();
		const result = buildSandboxedSpawnArgs({
			command: "env",
			cwd,
			configCwd: cwd,
			agentDir,
			platform: "linux",
			bwrapAvailable: true,
			tmpBackend: "host-tmpfs",
			baseEnv: { PATH: "/usr/bin" },
			envAdd: { TERM: "xterm-256color", LC_ALL: "C", FOO_CONFIG: "keep-me", OPENAI_API_KEY: "sk-leak" },
		});

		expect(result.state).toBe("ok");
		if (result.state !== "ok") throw new Error(`expected ok, got ${result.state}`);
		expect(result.env.PATH).toBe("/usr/bin");
		expect(result.env.TERM).toBe("xterm-256color");
		expect(result.env.LC_ALL).toBe("C");
		// Caller-supplied envAdd vars survive the minimal-env allowlist: the tool
		// schema promises env is "merged over the inherited environment," so a
		// custom var the caller set must reach the child command.
		expect(result.env.FOO_CONFIG).toBe("keep-me");
		// Provider secrets are still scrubbed even when placed in envAdd, so a
		// caller cannot exfiltrate a credential by injecting it as an env var.
		expect(result.env.OPENAI_API_KEY).toBeUndefined();

		// The env must reach the CHILD via the bwrap --setenv args, not just on
		// result.env. buildBwrapArgs previously re-ran buildMinimalEnv on the
		// prepared env, dropping caller envAdd vars from the actual --setenv argv
		// even though result.env carried them. Assert the bwrap args carry the
		// caller var and omit the scrubbed secret.
		if (result.state !== "ok") throw new Error(`expected ok, got ${result.state}`);
		const setenvPairs: Record<string, string> = {};
		for (let i = 0; i < result.args.length; i += 1) {
			if (result.args[i] === "--setenv") setenvPairs[result.args[i + 1]] = result.args[i + 2];
		}
		expect(setenvPairs.FOO_CONFIG).toBe("keep-me");
		expect(setenvPairs.OPENAI_API_KEY).toBeUndefined();
	});

	test("honors envScrub for LC_* values in the healthy bwrap environment", async () => {
		const cwd = await makeTempDir();
		const agentDir = await makeAgentDir({ envScrub: { names: ["LC_FORGE_TOKEN"] } });
		const result = buildSandboxedSpawnArgs({
			command: "env",
			cwd,
			configCwd: cwd,
			agentDir,
			platform: "linux",
			bwrapAvailable: true,
			tmpBackend: "host-tmpfs",
			baseEnv: { PATH: "/usr/bin", LC_ALL: "C.UTF-8", LC_FORGE_TOKEN: "secret-forge-token" },
		});

		expect(result.state).toBe("ok");
		if (result.state !== "ok") throw new Error(`expected ok, got ${result.state}`);
		expect(result.env.LC_FORGE_TOKEN).toBeUndefined();
		expect(result.env.LC_ALL).toBe("C.UTF-8");
	});

	test("resolves the bwrap wrapper from the trusted allowlist, not user envAdd PATH", async () => {
		const realBwrap = findExecutableOnPath("bwrap", { PATH: "/usr/bin:/bin" });
		if (!realBwrap) throw new Error("expected bwrap in the trusted allowlist for PATH-poisoning regression test");
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
			configCwd: cwd,
			agentDir,
			platform: "linux",
			baseEnv: process.env,
			tmpBackend: "host-tmpfs",
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
			configCwd: cwd,
			agentDir,
			platform: "linux",
			bwrapAvailable: true,
			tmpBackend: "host-tmpfs",
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
			configCwd: cwd,
			agentDir,
			platform: "darwin",
			bwrapAvailable: false,
			tmpBackend: "host-tmpfs",
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

	type DegradeModeCase = {
		name: "integration-off" | "sandbox-disabled" | "unsupported-platform";
		platform: NodeJS.Platform;
		bwrapAvailable: boolean;
		agentConfig?: Record<string, unknown>;
		projectConfig?: Record<string, unknown>;
	};

	for (const caseData of [
		{
			name: "integration-off" as const,
			platform: "linux" as const,
			bwrapAvailable: true,
			agentConfig: {
				backgroundTasks: { sandboxIntegration: "off" },
				envScrub: { names: ["PI_SANDBOX_TEST_CUSTOM_NAME"], patterns: ["CUSTOM_SECRET_*"] },
			},
		},
		{
			name: "sandbox-disabled" as const,
			platform: "linux" as const,
			bwrapAvailable: true,
			agentConfig: {
				enabled: false,
				envScrub: { names: ["PI_SANDBOX_TEST_CUSTOM_NAME"], patterns: ["CUSTOM_SECRET_*"] },
			},
		},
		{
			name: "unsupported-platform" as const,
			platform: "darwin" as const,
			bwrapAvailable: false,
			agentConfig: {
				envScrub: { names: ["PI_SANDBOX_TEST_CUSTOM_NAME"], patterns: ["CUSTOM_SECRET_*"] },
			},
		},
	] as DegradeModeCase[]) {
		test(`degraded modes strip provider secret env vars: ${caseData.name}`, async () => {
			const { name, platform, bwrapAvailable, agentConfig, projectConfig } = caseData;
			const cwd = await makeTempDir();
			const agentDir = await makeAgentDir(agentConfig);
			if (projectConfig) {
				await mkdir(join(cwd, ".pi"), { recursive: true });
				await writeFile(join(cwd, ".pi", "sandbox.json"), JSON.stringify(projectConfig));
			}

			const baseProviderEnv: NodeJS.ProcessEnv = {};
			for (const envName of PROVIDER_SECRET_ENV_NAMES) {
				baseProviderEnv[envName] = `${envName}-leak`;
			}
			const result = buildSandboxedSpawnArgs({
				command: "echo hi",
				cwd,
				configCwd: cwd,
				agentDir,
				platform,
				bwrapAvailable,
				baseEnv: {
					...baseProviderEnv,
					GITHUB_TOKEN: "github-operator-token",
					GH_TOKEN: "github-cli-alternate-token",
					CUSTOM_SECRET_TOKEN: "custom-pattern-match",
					PI_SANDBOX_TEST_CUSTOM_NAME: "custom-name-match",
					CUSTOM_KEEP: "kept-in-degrade",
					PATH: "/usr/bin",
					HOME: "/tmp",
				},
			});

			expect(result.state).toBe("degraded");
			expect(result).toMatchObject({
				integration: "inactive",
				reason: name,
				executable: null,
				args: [],
			});
			expect(result.env.PATH).toBe("/usr/bin");
			expect(result.env.HOME).toBe("/tmp");
			expect(result.env.CUSTOM_KEEP).toBe("kept-in-degrade");
			for (const envName of PROVIDER_SECRET_ENV_NAMES) {
				expect((result.env as NodeJS.ProcessEnv)[envName]).toBeUndefined();
			}
			expect(result.env.GITHUB_TOKEN).toBeUndefined();
			expect(result.env.GH_TOKEN).toBeUndefined();
			expect(result.env.CUSTOM_SECRET_TOKEN).toBeUndefined();
			expect(result.env.PI_SANDBOX_TEST_CUSTOM_NAME).toBeUndefined();
		});
	}

	test("fails closed when network filter mode is requested", async () => {
		const cwd = await makeTempDir();
		const agentDir = await makeAgentDir();
		await mkdir(join(cwd, ".pi"), { recursive: true });
		await writeFile(join(cwd, ".pi", "sandbox.json"), JSON.stringify({ network: { mode: "filter" } }));

		const result = buildSandboxedSpawnArgs({
			command: "echo blocked",
			cwd,
			configCwd: cwd,
			agentDir,
			platform: "linux",
			bwrapAvailable: true,
			tmpBackend: "host-tmpfs",
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
			configCwd: cwd,
			agentDir,
			platform: "linux",
			bwrapAvailable: false,
			tmpBackend: "host-tmpfs",
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
			configCwd: cwd,
			agentDir,
			platform: "linux",
			bwrapAvailable: true,
			tmpBackend: "host-tmpfs",
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

	test("trusted configCwd, not caller cwd, controls config loading and relative allowWrite mounts", async () => {
		const configCwd = await makeTempDir();
		const agentDir = await makeAgentDir();
		await mkdir(join(configCwd, ".pi"), { recursive: true });
		await writeFile(join(configCwd, "secret.txt"), "SUPER-SECRET\n");
		await writeFile(join(configCwd, ".pi", "sandbox.json"), JSON.stringify({
			network: { mode: "block" },
			filesystem: { allowWrite: ["."], denyRead: ["secret.txt"] },
		}));

		const result = buildSandboxedSpawnArgs({
			command: "id",
			cwd: "/",
			configCwd,
			agentDir,
			platform: "linux",
			bwrapAvailable: true,
			tmpBackend: "host-tmpfs",
			baseEnv: { PATH: "/usr/bin" },
		});

		expect(result.state).toBe("ok");
		if (result.state !== "ok") throw new Error(`expected ok, got ${result.state}`);
		expect(sequenceIndex(result.args, ["--bind", "/", "/"])).toBe(-1);
		expect(sequenceIndex(result.args, ["--bind", configCwd, configCwd])).toBeGreaterThanOrEqual(0);
		expect(sequenceIndex(result.args, ["--ro-bind", "/dev/null", join(configCwd, "secret.txt")])).toBeGreaterThanOrEqual(0);
		expect(result.args).toContain("--unshare-net");
		expect(sequenceIndex(result.args, ["--chdir", "/"])).toBeGreaterThanOrEqual(0);
	});

	test("caller cwd controls only --chdir while allowWrite dot resolves against configCwd", async () => {
		const configCwd = await makeTempDir();
		const agentDir = await makeAgentDir();
		const commandCwd = "/some/path";

		const result = buildSandboxedSpawnArgs({
			command: "pwd",
			cwd: commandCwd,
			configCwd,
			agentDir,
			platform: "linux",
			bwrapAvailable: true,
			tmpBackend: "host-tmpfs",
			baseEnv: { PATH: "/usr/bin" },
		});

		expect(result.state).toBe("ok");
		if (result.state !== "ok") throw new Error(`expected ok, got ${result.state}`);
		expect(sequenceIndex(result.args, ["--chdir", commandCwd])).toBeGreaterThanOrEqual(0);
		expect(sequenceIndex(result.args, ["--bind", configCwd, configCwd])).toBeGreaterThanOrEqual(0);
		expect(sequenceIndex(result.args, ["--bind", "/", "/"])).toBe(-1);
	});
});

describe("buildSandboxedSpawnArgs bwrap integration", () => {
	bwrapIntegrationTest("caller cwd slash cannot expand writes or bypass trusted denyRead config", async () => {
		const configCwd = await makeTempDir();
		const agentDir = await makeAgentDir();
		const secret = join(configCwd, "secret.txt");
		const rootProbe = `/pi-sandbox-root-write-probe-${process.pid}-${Date.now()}`;
		await mkdir(join(configCwd, ".pi"), { recursive: true });
		await writeFile(secret, "SUPER-SECRET\n");
		await writeFile(join(configCwd, ".pi", "sandbox.json"), JSON.stringify({
			filesystem: { allowWrite: ["."], denyRead: ["secret.txt"] },
		}));

		const result = buildSandboxedSpawnArgs({
			command: "ignored until appended by caller",
			cwd: "/",
			configCwd,
			agentDir,
			platform: "linux",
			baseEnv: process.env,
			tmpBackend: "host-tmpfs",
		});

		expect(result.state).toBe("ok");
		if (result.state !== "ok") throw new Error(`expected ok, got ${result.state}`);
		expect(sequenceIndex(result.args, ["--bind", "/", "/"])).toBe(-1);
		expect(sequenceIndex(result.args, ["--bind", configCwd, configCwd])).toBeGreaterThanOrEqual(0);
		expect(sequenceIndex(result.args, ["--chdir", "/"])).toBeGreaterThanOrEqual(0);

		const command = `printf 'pwd=%s\\n' "$PWD"; if [ ! -s ${JSON.stringify(secret)} ]; then echo denied; else echo LEAK:$(cat ${JSON.stringify(secret)}); fi; if touch ${JSON.stringify(rootProbe)} 2>/dev/null; then echo ROOT_WRITABLE; else echo ROOT_NOT_WRITABLE; fi`;
		const run = Bun.spawnSync([result.executable, ...result.args, command], {
			cwd: result.cwd,
			env: result.env,
			stdout: "pipe",
			stderr: "pipe",
		});
		const stdout = Buffer.from(run.stdout).toString("utf8");
		const stderr = Buffer.from(run.stderr).toString("utf8");

		expect(run.exitCode, stderr).toBe(0);
		expect(stdout).toContain("pwd=/");
		expect(stdout).toContain("denied");
		expect(stdout).toContain("ROOT_NOT_WRITABLE");
		expect(stdout).not.toContain("SUPER-SECRET");
		expect(existsSync(rootProbe)).toBe(false);
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
