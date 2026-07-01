import { afterEach, describe, expect, test } from "bun:test";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadConfig, validateConfig } from "./sandbox-config";
import { buildSandboxedSpawnArgs } from "./sandbox-spawn";

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
		expect(result.executable).toBe("bwrap");
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
	test("exposes bwrap, sandbox-spawn, and sandbox-config subpaths", async () => {
		const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8")) as {
			exports?: Record<string, { types?: string; import?: string } | string>;
		};

		expect(packageJson.exports?.["./bwrap"]).toEqual({
			types: "./extensions/sandbox-bwrap.ts",
			import: "./extensions/sandbox-bwrap.ts",
		});
		expect(packageJson.exports?.["./sandbox-spawn"]).toEqual({
			types: "./extensions/sandbox-spawn.ts",
			import: "./extensions/sandbox-spawn.ts",
		});
		expect(packageJson.exports?.["./sandbox-config"]).toEqual({
			types: "./extensions/sandbox-config.ts",
			import: "./extensions/sandbox-config.ts",
		});
	});
});
