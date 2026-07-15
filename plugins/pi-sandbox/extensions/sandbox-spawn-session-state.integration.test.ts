import { afterEach, expect, mock, test } from "bun:test";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createSandboxBridge } from "../../background-tasks/extensions/sandbox-bridge";
import {
	SANDBOX_SPAWN_SESSION_STATE_SYMBOL,
	readSandboxSpawnSessionState,
} from "./sandbox-config";

const tempDirs: string[] = [];
const hasBwrap = process.platform === "linux" && Bun.spawnSync(["bwrap", "--version"], { stdout: "pipe", stderr: "pipe" }).success;
const bwrapTest = hasBwrap ? test : test.skip;

async function makeTempDir(prefix: string): Promise<string> {
	const dir = await mkdtemp(join(tmpdir(), prefix));
	tempDirs.push(dir);
	return dir;
}

function sequenceIndex(args: string[], sequence: string[]): number {
	for (let i = 0; i <= args.length - sequence.length; i += 1) {
		if (sequence.every((part, offset) => args[i + offset] === part)) return i;
	}
	return -1;
}

afterEach(async () => {
	delete (globalThis as typeof globalThis & Record<symbol, unknown>)[SANDBOX_SPAWN_SESSION_STATE_SYMBOL];
	while (tempDirs.length > 0) {
		const dir = tempDirs.pop();
		if (dir) await rm(dir, { recursive: true, force: true });
	}
});

bwrapTest("a cache-busted live extension and cached real bridge helper share fresh session temp state", async () => {
	const agentDir = await makeTempDir("pi-sandbox-session-state-agent-");
	const cacheHome = await makeTempDir("pi-sandbox-session-state-cache-");
	const projectA = await makeTempDir("pi-sandbox-session-state-project-a-");
	const projectB = await makeTempDir("pi-sandbox-session-state-project-b-");
	await mkdir(join(agentDir, "extensions"), { recursive: true });
	await writeFile(join(agentDir, "extensions", "sandbox.json"), JSON.stringify({
		filesystem: { tmpBackend: "session-disk", allowWrite: ["."] },
	}));

	const previousCacheHome = process.env.XDG_CACHE_HOME;
	process.env.XDG_CACHE_HOME = cacheHome;
	try {
		const tool = (name: string) => ({
			name,
			description: `${name} test stub`,
			parameters: {},
			execute: async () => ({ content: [{ type: "text", text: "stub" }] }),
		});
		mock.module("@earendil-works/pi-coding-agent", () => ({
			getAgentDir: () => agentDir,
			createBashTool: () => tool("bash"),
			createReadTool: () => tool("read"),
			createWriteTool: () => tool("write"),
			createEditTool: () => tool("edit"),
		}));
		mock.module("typebox", () => ({
			Type: {
				Object: (properties: unknown, options?: Record<string, unknown>) => ({ type: "object", properties, ...options }),
				String: (options?: Record<string, unknown>) => ({ type: "string", ...options }),
				Number: (options?: Record<string, unknown>) => ({ type: "number", ...options }),
				Optional: (schema: Record<string, unknown>) => ({ ...schema, optional: true }),
				Array: (items: unknown, options?: Record<string, unknown>) => ({ type: "array", items, ...options }),
			},
		}));

		// These are intentionally distinct module identities. Before the snapshot
		// contract, the helper's relative sandbox import observed its own inactive
		// module state rather than this live extension's lifecycle state.
		const live = await import(`${new URL("./sandbox.ts", import.meta.url).href}?live=${crypto.randomUUID()}`);
		const helper = await import(`${new URL("./sandbox-spawn.ts", import.meta.url).href}?helper=${crypto.randomUUID()}`);
		const bridge = createSandboxBridge(async () => ({ buildSandboxedSpawnArgs: helper.buildSandboxedSpawnArgs }));
		const resolvedBridge = await bridge.resolveSandboxSpawnBuilder();
		expect(resolvedBridge.state).toBe("loaded");
		if (resolvedBridge.state !== "loaded") throw new Error("expected live sandbox spawn helper");
		const cachedBuilder = resolvedBridge.buildSandboxedSpawnArgs;

		const handlers = new Map<string, Array<(event: unknown, ctx: unknown) => Promise<void> | void>>();
		const pi = {
			registerFlag: () => {},
			getFlag: () => false,
			registerTool: () => {},
			registerCommand: () => {},
			on: (event: string, handler: (event: unknown, ctx: unknown) => Promise<void> | void) => {
				(handlers.get(event) ?? (handlers.set(event, []), handlers.get(event)!)).push(handler);
			},
		};
		live.default(pi);
		const context = (cwd: string) => ({
			cwd,
			hasUI: false,
			ui: { notify: () => {}, setStatus: () => {}, theme: { fg: (_name: string, text: string) => text }, confirm: async () => false },
		});
		const run = async (event: "session_start" | "session_shutdown", cwd: string) => {
			for (const handler of handlers.get(event) ?? []) await handler({ reason: "test" }, context(cwd));
		};
		const build = (cwd: string) => cachedBuilder({
			command: "printf '%s' \"$TMPDIR\"",
			cwd,
			configCwd: cwd,
			agentDir,
			platform: "linux",
			bwrapAvailable: true,
			baseEnv: { PATH: process.env.PATH, HOME: process.env.HOME },
		});

		// Before any lifecycle start, the cached real bridge helper fails closed.
		expect(build(projectA)).toMatchObject({ state: "fail-closed", reason: "session-state-unavailable" });

		await run("session_start", projectA);
		const stateA = readSandboxSpawnSessionState();
		expect(stateA.ok).toBe(true);
		if (!stateA.ok || stateA.value.state !== "ready") throw new Error("project A session state was not ready");
		const resultA = build(projectA);
		expect(resultA.state).toBe("ok");
		if (resultA.state !== "ok") throw new Error(resultA.message);
		expect(sequenceIndex(resultA.args, ["--bind", stateA.value.projectTmpDir!, stateA.value.projectTmpDir!])).toBeGreaterThanOrEqual(0);
		expect(sequenceIndex(resultA.args, ["--setenv", "TMPDIR", stateA.value.projectTmpDir!])).toBeGreaterThanOrEqual(0);
		const childA = Bun.spawnSync([resultA.executable, ...resultA.args, "printf '%s' \"$TMPDIR\""], {
			cwd: resultA.cwd,
			env: resultA.env,
			stdout: "pipe",
			stderr: "pipe",
		});
		expect(childA.exitCode, Buffer.from(childA.stderr).toString("utf8")).toBe(0);
		expect(Buffer.from(childA.stdout).toString("utf8")).toBe(stateA.value.projectTmpDir);

		await run("session_shutdown", projectA);
		expect(build(projectA)).toMatchObject({ state: "fail-closed", reason: "session-state-unavailable" });

		// Reuse the same cached bridge builder after a replacement session. It must
		// observe B's new path, never retain A's snapshot.
		await run("session_start", projectB);
		const stateB = readSandboxSpawnSessionState();
		expect(stateB.ok).toBe(true);
		if (!stateB.ok || stateB.value.state !== "ready") throw new Error("project B session state was not ready");
		const resultB = build(projectB);
		expect(resultB.state).toBe("ok");
		if (resultB.state !== "ok") throw new Error(resultB.message);
		expect(sequenceIndex(resultB.args, ["--setenv", "TMPDIR", stateB.value.projectTmpDir!])).toBeGreaterThanOrEqual(0);
		expect(resultB.args).not.toContain(stateA.value.projectTmpDir!);

		// A stale ready state must be invalidated before a failing replacement
		// initialization reaches config parsing.
		await writeFile(join(agentDir, "extensions", "sandbox.json"), "{");
		await run("session_start", projectB);
		// Config parsing fails before the helper reaches snapshot resolution, but
		// the stale ready state is still invalidated and no spawn can be prepared.
		expect(readSandboxSpawnSessionState()).toMatchObject({ ok: true, value: { state: "inactive", reason: "fail-closed" } });
		expect(build(projectB)).toMatchObject({ state: "fail-closed", reason: "config-parse-error" });
	} finally {
		process.env.XDG_CACHE_HOME = previousCacheHome;
	}
});
