import { afterEach, expect, mock, test } from "bun:test";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import backgroundTasksExtension from "../../background-tasks/extensions/background-tasks";
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
		// The stale ready state is invalidated before parsing completes, so no
		// caller can use an override or parse-driven degraded escape branch.
		expect(readSandboxSpawnSessionState()).toMatchObject({ ok: true, value: { state: "inactive", reason: "fail-closed" } });
		expect(build(projectB)).toMatchObject({ state: "fail-closed", reason: "session-state-unavailable" });
	} finally {
		process.env.XDG_CACHE_HOME = previousCacheHome;
	}
});

test("a live disabled session permits registered degraded tools only while its pinned identity matches", async () => {
	const agentDir = await makeTempDir("pi-sandbox-disabled-agent-");
	const project = await makeTempDir("pi-sandbox-disabled-project-");
	const otherProject = await makeTempDir("pi-sandbox-disabled-other-project-");
	await mkdir(join(agentDir, "extensions"), { recursive: true });
	await writeFile(join(agentDir, "extensions", "sandbox.json"), JSON.stringify({ enabled: false }));
	const tool = (name: string) => ({ name, description: `${name} test stub`, parameters: {}, execute: async () => ({ content: [{ type: "text", text: "stub" }] }) });
	mock.module("@earendil-works/pi-coding-agent", () => ({
		getAgentDir: () => agentDir,
		createBashTool: () => tool("bash"), createReadTool: () => tool("read"), createWriteTool: () => tool("write"), createEditTool: () => tool("edit"),
	}));
	mock.module("typebox", () => ({ Type: {
		Object: (properties: unknown, options?: Record<string, unknown>) => ({ type: "object", properties, ...options }),
		String: (options?: Record<string, unknown>) => ({ type: "string", ...options }), Number: (options?: Record<string, unknown>) => ({ type: "number", ...options }),
		Optional: (schema: Record<string, unknown>) => ({ ...schema, optional: true }), Array: (items: unknown, options?: Record<string, unknown>) => ({ type: "array", items, ...options }),
	} }));

	const live = await import(`${new URL("./sandbox.ts", import.meta.url).href}?disabled-live=${crypto.randomUUID()}`);
	const helper = await import(`${new URL("./sandbox-spawn.ts", import.meta.url).href}?disabled-helper=${crypto.randomUUID()}`);
	const handlers = new Map<string, Array<(event: unknown, ctx: any) => Promise<void> | void>>();
	live.default({
		registerFlag: () => {}, getFlag: () => false, registerTool: () => {}, registerCommand: () => {},
		on: (event: string, handler: (event: unknown, ctx: any) => Promise<void> | void) => (handlers.get(event) ?? (handlers.set(event, []), handlers.get(event)!)).push(handler),
	});
	const context = (cwd: string) => ({ cwd, hasUI: false, ui: { notify: () => {}, setStatus: () => {}, theme: { fg: (_name: string, text: string) => text }, confirm: async () => false } });
	for (const handler of handlers.get("session_start") ?? []) await handler({ reason: "test" }, context(project));
	const state = readSandboxSpawnSessionState();
	expect(state).toMatchObject({ ok: true, value: { state: "inactive", reason: "disabled", configCwd: project, agentDir } });
	if (!state.ok || state.value.state !== "inactive" || state.value.reason !== "disabled") throw new Error("disabled session did not publish a pinned inactive state");
	expect(state.value.policyFingerprint).toMatch(/^sha256:/);

	const tools = new Map<string, any>();
	const bridge = createSandboxBridge(async () => ({ buildSandboxedSpawnArgs: helper.buildSandboxedSpawnArgs }));
	backgroundTasksExtension({
		registerTool: (definition: { name: string }) => tools.set(definition.name, definition),
		sendMessage: () => {}, appendEntry: () => {}, on: () => {},
		exec: async () => ({ stdout: "", stderr: "", code: 0 }),
	}, { sandboxResolver: bridge.resolveSandboxSpawnBuilder });
	const background = tools.get("background");
	const monitor = tools.get("monitor");
	const execute = (definition: any, params: Record<string, unknown>, cwd = project) => definition.execute("disabled", params, undefined, undefined, context(cwd));

	const disabledBackground = await execute(background, { command: "true", label: "disabled-background" });
	expect(disabledBackground).toMatchObject({ details: { sandbox: "degraded" } });
	const disabledMonitor = await execute(monitor, { command: "true", satisfy_on: "exit_zero", interval_seconds: 1, timeout_seconds: 5, label: "disabled-monitor" });
	expect(disabledMonitor).toMatchObject({ details: { sandbox: "degraded" } });
	const wrongProject = await execute(background, { command: "true", label: "wrong-project" }, otherProject);
	expect(wrongProject).toMatchObject({ isError: true, details: { sandbox: "blocked", reason: "session-state-unavailable" } });

	await writeFile(join(agentDir, "extensions", "sandbox.json"), JSON.stringify({ enabled: true }));
	const drifted = await execute(monitor, { command: "true", satisfy_on: "exit_zero", interval_seconds: 1, timeout_seconds: 5, label: "drifted-disabled-monitor" });
	expect(drifted).toMatchObject({ isError: true, details: { sandbox: "blocked", reason: "session-state-unavailable" } });
});

bwrapTest("registered background and monitor tools honor live agent-dir policy and fail closed after invalidation", async () => {
	const agentDir = await makeTempDir("pi-sandbox-real-tools-agent-");
	const cacheHome = await makeTempDir("pi-sandbox-real-tools-cache-");
	const project = await makeTempDir("pi-sandbox-real-tools-project-");
	const secret = join(project, "strict-secret.txt");
	const blockedBackgroundMarker = join(project, "blocked-background-marker.txt");
	const blockedMonitorMarker = join(project, "blocked-monitor-marker.txt");
	await mkdir(join(agentDir, "extensions"), { recursive: true });
	await writeFile(join(agentDir, "extensions", "sandbox.json"), JSON.stringify({
		filesystem: { tmpBackend: "session-disk", denyRead: ["strict-secret.txt"], allowWrite: ["."] },
	}));
	await writeFile(secret, "LIVE-POLICY-SECRET\n");
	await mkdir(join(project, ".pi"), { recursive: true });
	await writeFile(join(project, ".pi", "sandbox.json"), "{}");

	const previousCacheHome = process.env.XDG_CACHE_HOME;
	process.env.XDG_CACHE_HOME = cacheHome;
	try {
		const tool = (name: string) => ({ name, description: `${name} test stub`, parameters: {}, execute: async () => ({ content: [{ type: "text", text: "stub" }] }) });
		mock.module("@earendil-works/pi-coding-agent", () => ({
			getAgentDir: () => agentDir,
			createBashTool: () => tool("bash"),
			createReadTool: () => tool("read"),
			createWriteTool: () => tool("write"),
			createEditTool: () => tool("edit"),
		}));
		mock.module("typebox", () => ({ Type: {
			Object: (properties: unknown, options?: Record<string, unknown>) => ({ type: "object", properties, ...options }),
			String: (options?: Record<string, unknown>) => ({ type: "string", ...options }),
			Number: (options?: Record<string, unknown>) => ({ type: "number", ...options }),
			Optional: (schema: Record<string, unknown>) => ({ ...schema, optional: true }),
			Array: (items: unknown, options?: Record<string, unknown>) => ({ type: "array", items, ...options }),
		} }));

		const live = await import(`${new URL("./sandbox.ts", import.meta.url).href}?real-tools-live=${crypto.randomUUID()}`);
		const helper = await import(`${new URL("./sandbox-spawn.ts", import.meta.url).href}?real-tools-helper=${crypto.randomUUID()}`);
		const handlers = new Map<string, Array<(event: unknown, ctx: any) => Promise<void> | void>>();
		const sandboxPi = {
			registerFlag: () => {}, getFlag: () => false, registerTool: () => {}, registerCommand: () => {},
			on: (event: string, handler: (event: unknown, ctx: any) => Promise<void> | void) => (handlers.get(event) ?? (handlers.set(event, []), handlers.get(event)!)).push(handler),
		};
		live.default(sandboxPi);
		const context = {
			cwd: project, hasUI: false,
			ui: { notify: () => {}, setStatus: () => {}, theme: { fg: (_name: string, text: string) => text }, confirm: async () => false },
		};
		const runSandbox = async (event: "session_start" | "session_shutdown") => {
			for (const handler of handlers.get(event) ?? []) await handler({ reason: "test" }, context);
		};
		await runSandbox("session_start");
		const state = readSandboxSpawnSessionState();
		expect(state).toMatchObject({ ok: true, value: { state: "ready", agentDir } });
		if (!state.ok || state.value.state !== "ready") throw new Error("live session did not publish ready state");

		const tools = new Map<string, any>();
		const wakes: unknown[] = [];
		const bridge = createSandboxBridge(async () => ({ buildSandboxedSpawnArgs: helper.buildSandboxedSpawnArgs }));
		backgroundTasksExtension({
			registerTool: (definition: { name: string }) => tools.set(definition.name, definition),
			sendMessage: (message: unknown) => { wakes.push(message); },
			appendEntry: () => {},
			on: () => {},
		}, { sandboxResolver: bridge.resolveSandboxSpawnBuilder });
		const background = tools.get("background");
		const monitor = tools.get("monitor");
		const jobs = tools.get("jobs");
		const execute = (definition: any, params: Record<string, unknown>) => definition.execute("test", params, undefined, undefined, context);
		const callThroughSandboxGate = async (definition: any, params: Record<string, unknown>, id = "test") => {
			const event = { toolName: definition.name, input: { ...params } };
			for (const handler of handlers.get("tool_call") ?? []) {
				const decision = await handler(event, context) as { block?: boolean; reason?: string } | undefined;
				if (decision?.block) return { blocked: true, reason: decision.reason };
			}
			return { blocked: false, result: await definition.execute(id, params, undefined, undefined, context) };
		};
		const status = async (jobId: number) => (await execute(jobs, { action: "status", jobId })).content[0].text as string;
		const waitFor = async (predicate: () => Promise<boolean>): Promise<void> => {
			const deadline = Date.now() + 8_000;
			while (!(await predicate())) {
				if (Date.now() > deadline) throw new Error("timed out waiting for real tool job");
				await new Promise((resolve) => setTimeout(resolve, 20));
			}
		};
		const command = "if [ ! -s strict-secret.txt ]; then printf 'denied tmp=%s' \"$TMPDIR\"; else printf 'LEAK:%s' \"$(cat strict-secret.txt)\"; fi";

		// No agentDir/tmp overrides are supplied to these registered tool calls.
		const startedBackground = await execute(background, { command, label: "live-agent-policy-background" });
		expect(startedBackground.details.sandbox).toBe("active");
		await waitFor(async () => (await status(startedBackground.details.jobId)).includes("[completed"));
		const backgroundTail = (await execute(jobs, { action: "tail", jobId: startedBackground.details.jobId, lines: 20 })).content[0].text;
		expect(backgroundTail).toContain(`denied tmp=${state.value.projectTmpDir}`);
		expect(backgroundTail).not.toContain("LIVE-POLICY-SECRET");

		const startedMonitor = await execute(monitor, { command, satisfy_on: "stdout_matches", pattern: "denied tmp=", interval_seconds: 1, timeout_seconds: 5, label: "live-agent-policy-monitor" });
		expect(startedMonitor.details.sandbox).toBe("active");
		await waitFor(async () => (await status(startedMonitor.details.jobId)).includes("[satisfied"));
		const monitorTail = (await execute(jobs, { action: "tail", jobId: startedMonitor.details.jobId, lines: 20 })).content[0].text;
		expect(monitorTail).toContain(`denied tmp=${state.value.projectTmpDir}`);
		expect(monitorTail).not.toContain("LIVE-POLICY-SECRET");

		// A second registered-tool instance shares the already-cached real bridge
		// but starts with an empty registry, making rejected-call side effects
		// observable without confusing them with the healthy jobs above.
		const refusalTools = new Map<string, any>();
		const refusalWakes: unknown[] = [];
		backgroundTasksExtension({
			registerTool: (definition: { name: string }) => refusalTools.set(definition.name, definition),
			sendMessage: (message: unknown) => { refusalWakes.push(message); },
			appendEntry: () => {},
			on: () => {},
		}, { sandboxResolver: bridge.resolveSandboxSpawnBuilder });
		const refusalBackground = refusalTools.get("background");
		const refusalMonitor = refusalTools.get("monitor");
		const refusalJobs = refusalTools.get("jobs");
		const refuse = (definition: any, params: Record<string, unknown>) => definition.execute("refusal", params, undefined, undefined, context);
		const assertEmptyRegistry = async () => {
			expect((await refuse(refusalJobs, { action: "list" })).content[0].text).toBe("No background jobs or monitors registered.");
		};

		// The live tool_call gate still permits these tools under its session-pinned
		// policy. The real helper must independently refuse after project policy
		// drift, before either registered tool can create a job, wake, marker, or
		// disclose the denied secret.
		await writeFile(join(project, ".pi", "sandbox.json"), JSON.stringify({ filesystem: { denyRead: ["drift-only-secret.txt"] } }));
		const mutatedBackground = await callThroughSandboxGate(refusalBackground, {
			command: `cat ${JSON.stringify(secret)} > ${JSON.stringify(blockedBackgroundMarker)}`,
		}, "mutated-background");
		expect(mutatedBackground.blocked).toBe(false);
		expect(mutatedBackground.result?.isError).toBe(true);
		expect(mutatedBackground.result?.details).toMatchObject({ sandbox: "blocked", reason: "session-state-unavailable" });

		await rm(join(project, ".pi", "sandbox.json"));
		const removedMonitor = await callThroughSandboxGate(refusalMonitor, {
			command: `cat ${JSON.stringify(secret)} > ${JSON.stringify(blockedMonitorMarker)}`,
			satisfy_on: "exit_zero", interval_seconds: 1, timeout_seconds: 5,
		}, "removed-monitor");
		expect(removedMonitor.blocked).toBe(false);
		expect(removedMonitor.result?.isError).toBe(true);
		expect(removedMonitor.result?.details).toMatchObject({ sandbox: "blocked", reason: "session-state-unavailable" });
		expect(JSON.stringify([mutatedBackground, removedMonitor])).not.toContain("LIVE-POLICY-SECRET");
		expect(refusalWakes).toHaveLength(0);
		expect(await Bun.file(blockedBackgroundMarker).exists()).toBe(false);
		expect(await Bun.file(blockedMonitorMarker).exists()).toBe(false);
		await assertEmptyRegistry();

		await runSandbox("session_shutdown");
		for (const [definition, params] of [
			[refusalBackground, { command: `printf ran > ${JSON.stringify(blockedBackgroundMarker)}` }],
			[refusalMonitor, { command: `printf ran > ${JSON.stringify(blockedMonitorMarker)}`, satisfy_on: "exit_zero", interval_seconds: 1, timeout_seconds: 5 }],
		] as const) {
			const refused = await refuse(definition, params);
			expect(refused.isError).toBe(true);
			expect(refused.details).toMatchObject({ sandbox: "blocked", reason: "session-state-unavailable" });
		}
		expect(refusalWakes).toHaveLength(0);
		expect(await Bun.file(blockedBackgroundMarker).exists()).toBe(false);
		expect(await Bun.file(blockedMonitorMarker).exists()).toBe(false);
		await assertEmptyRegistry();

		await writeFile(join(agentDir, "extensions", "sandbox.json"), "{");
		await runSandbox("session_start");
		for (const [definition, params] of [
			[refusalBackground, { command: `printf ran > ${JSON.stringify(blockedBackgroundMarker)}` }],
			[refusalMonitor, { command: `printf ran > ${JSON.stringify(blockedMonitorMarker)}`, satisfy_on: "exit_zero", interval_seconds: 1, timeout_seconds: 5 }],
		] as const) {
			const failedReplacement = await refuse(definition, params);
			expect(failedReplacement.isError).toBe(true);
			expect(failedReplacement.details).toMatchObject({ sandbox: "blocked", reason: "session-state-unavailable" });
		}
		expect(refusalWakes).toHaveLength(0);
		expect(await Bun.file(blockedBackgroundMarker).exists()).toBe(false);
		expect(await Bun.file(blockedMonitorMarker).exists()).toBe(false);
		await assertEmptyRegistry();
	} finally {
		process.env.XDG_CACHE_HOME = previousCacheHome;
	}
});
