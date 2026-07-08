import { afterEach, describe, expect, mock, test } from "bun:test";
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile, link, chmod } from "node:fs/promises";
import { realpathSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import {
	assertNoHardlinkedDeniedFiles,
	buildBwrapArgs,
	buildMinimalEnv,
	decidePlatformState,
	findExecutableOnPath,
	shouldBypassBashSandbox,
	shouldBypassSandbox,
	type BuildBwrapArgsOptions,
	validateBwrapInit,
} from "./sandbox-bwrap";
import { makeBwrapIntegrationTest } from "./sandbox-bwrap.test";
import {
	DEFAULT_CONFIG,
	FILTER_DEFERRED_BACKLOG_ITEM,
	SANDBOX_FAIL_CLOSED_MESSAGE,
	SANDBOX_UNINITIALIZED_MESSAGE,
	applyBypassToolDefaults,
	createSandboxCommandHandler,
	createUserBashBlockResult,
	decideBackgroundTasksIntegrationState,
	decideToolPolicy,
	decideUserBash,
	deepMerge,
	inspectToolInput,
	loadConfig,
	mergeProjectAdditive,
	scrubEnv,
	validateConfig,
	type LoadedConfig,
	type BypassToolIntegrationState,
	type SandboxConfig,
} from "./sandbox-config";
import {
	createFailClosedPolicy,
	createPermissivePolicy,
	enforceDenyRead,
	enforceWritePolicy,
	makeEditOperations,
	makeReadOperations,
	makeWriteOperations,
	type SandboxPolicy,
} from "./sandbox-file-policy";

const tempDirs: string[] = [];
const bwrapPath = "bwrap";
const isLinux = process.platform === "linux";
const hasBwrap = isLinux && (() => {
	try {
		return Bun.spawnSync([bwrapPath, "--version"], { stdout: "pipe", stderr: "pipe" }).success;
	} catch {
		return false;
	}
})();
const integrationTest = makeBwrapIntegrationTest({ isLinux, hasBwrap });

async function makeTempDir(): Promise<string> {
	const dir = await mkdtemp(join(tmpdir(), "pi-sandbox-test-"));
	tempDirs.push(dir);
	return dir;
}

async function makeRepoTempDir(): Promise<string> {
	const dir = await mkdtemp(resolve(".pi-sandbox-test-"));
	tempDirs.push(dir);
	return dir;
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

function expectSequence(args: string[], sequence: string[]): number {
	const index = sequenceIndex(args, sequence);
	expect(index).toBeGreaterThanOrEqual(0);
	return index;
}

function runSandboxed(
	command: string,
	opts: Omit<BuildBwrapArgsOptions, "env">,
	env: NodeJS.ProcessEnv = process.env,
): ReturnType<typeof Bun.spawnSync> {
	const minimalEnv = buildMinimalEnv(env);
	const args = [
		...buildBwrapArgs({ ...opts, configCwd: opts.configCwd ?? opts.cwd, env: minimalEnv }),
		"--",
		"bash",
		"-c",
		command,
	];
	return Bun.spawnSync([bwrapPath, ...args], {
		cwd: opts.cwd,
		env: minimalEnv,
		stdout: "pipe",
		stderr: "pipe",
	});
}

function text(buffer: Buffer | Uint8Array): string {
	return Buffer.from(buffer).toString("utf8");
}

function shellQuote(value: string): string {
	return `'${value.replaceAll("'", "'\\''")}'`;
}

describe("sandbox enabled/disabled bypass guard", () => {
	test("enabled:false bypasses sandbox even without --no-sandbox", () => {
		expect(shouldBypassSandbox(false, true)).toBe(true);
	});

	test("enabled:true keeps the normal sandboxed path when --no-sandbox is absent", () => {
		expect(shouldBypassSandbox(false, false)).toBe(false);
	});

	test("--no-sandbox bypasses regardless of config state", () => {
		expect(shouldBypassSandbox(true, false)).toBe(true);
		expect(shouldBypassSandbox(true, true)).toBe(true);
	});

	test("OS backend graceful degrade bypasses only bash sandboxing", () => {
		expect(shouldBypassBashSandbox(false, false, true)).toBe(true);
		expect(shouldBypassSandbox(false, false)).toBe(false);
	});
});

describe("user_bash routing", () => {
	test("fail-closed and uninitialized states return block decisions, not fall-through", () => {
		expect(decideUserBash({
			noSandbox: false,
			disabledViaConfig: false,
			failClosed: true,
			sandboxEnabled: false,
			sandboxInitialized: false,
		})).toEqual({ action: "block-failclosed", reason: SANDBOX_FAIL_CLOSED_MESSAGE });

		expect(decideUserBash({
			noSandbox: false,
			disabledViaConfig: false,
			failClosed: false,
			sandboxEnabled: false,
			sandboxInitialized: false,
		})).toEqual({ action: "block-uninitialized", reason: SANDBOX_UNINITIALIZED_MESSAGE });
	});

	test("intentional bypasses are the only user_bash fall-through decisions", () => {
		expect(decideUserBash({
			noSandbox: true,
			disabledViaConfig: false,
			failClosed: true,
			sandboxEnabled: false,
			sandboxInitialized: false,
		})).toEqual({ action: "bypass" });

		expect(decideUserBash({
			noSandbox: false,
			disabledViaConfig: true,
			failClosed: true,
			sandboxEnabled: false,
			sandboxInitialized: false,
		})).toEqual({ action: "bypass" });
	});

	test("OS backend graceful degrade falls through for user_bash without becoming fail-closed", () => {
		expect(decideUserBash({
			noSandbox: false,
			disabledViaConfig: false,
			osSandboxUnavailable: true,
			failClosed: false,
			sandboxEnabled: false,
			sandboxInitialized: false,
		})).toEqual({
			action: "bypass",
			reason: "OS bash sandbox backend unavailable; user_bash runs through pi's local shell backend while in-process file/tool policy remains active.",
		});
	});

	test("fail-closed still blocks user_bash when OS backend is available", () => {
		expect(decideUserBash({
			noSandbox: false,
			disabledViaConfig: false,
			osSandboxUnavailable: false,
			failClosed: true,
			sandboxEnabled: false,
			sandboxInitialized: false,
		})).toEqual({ action: "block-failclosed", reason: SANDBOX_FAIL_CLOSED_MESSAGE });
	});

	test("healthy user_bash state chooses sandboxed operations", () => {
		expect(decideUserBash({
			noSandbox: false,
			disabledViaConfig: false,
			failClosed: false,
			sandboxEnabled: true,
			sandboxInitialized: true,
		})).toEqual({ action: "sandboxed" });
	});

	test("block result uses pi user_bash full BashResult replacement shape", () => {
		const result = createUserBashBlockResult(SANDBOX_FAIL_CLOSED_MESSAGE);

		expect(result).toEqual({
			result: {
				output: `${SANDBOX_FAIL_CLOSED_MESSAGE}\n`,
				exitCode: 1,
				cancelled: false,
				truncated: false,
			},
		});
	});
});

describe("extension init validation", () => {
	test("platform state separates non-Linux degrade from Linux fail-closed states", () => {
		expect(decidePlatformState({ networkMode: "open", platform: "darwin", bwrapAvailable: false })).toEqual({
			state: "degrade",
			reason: "unsupported-platform",
			platform: "darwin",
			message: "Sandbox OS backend unavailable on darwin; bash runs unsandboxed, file/tool policy still enforced.",
			status: "🔒 Sandbox: OS bash sandbox unavailable on darwin; in-process file/tool policy active",
		});
		expect(decidePlatformState({ networkMode: "open", platform: "linux", bwrapAvailable: true })).toEqual({ state: "ok" });
		expect(decidePlatformState({ networkMode: "open", platform: "linux", bwrapAvailable: false }).state).toBe("fail-closed");
		expect(decidePlatformState({ networkMode: "filter", platform: "linux", bwrapAvailable: true }).state).toBe("fail-closed");
	});

	test("unsupported platforms degrade instead of failing closed", () => {
		const validation = validateBwrapInit({ networkMode: "open", platform: "win32", bwrapAvailable: false });

		expect(validation.ok).toBe(false);
		if (!validation.ok) {
			expect(validation.reason).toBe("unsupported-platform");
			expect(validation.message).toContain("bash runs unsandboxed");
			expect(validation.message).toContain("file/tool policy still enforced");
			expect(validation.message).not.toContain("fail-closed");
		}
	});

	test("filter mode fails closed before initialization", () => {
		const validation = validateBwrapInit({ networkMode: "filter", platform: "linux", bwrapAvailable: true });

		expect(validation.ok).toBe(false);
		if (!validation.ok) {
			expect(validation.reason).toBe("filter-deferred");
			expect(validation.message).toContain("network.mode=filter is deferred");
			expect(validation.message).toContain("fail-closed");
		}
	});

	test("missing bwrap fails closed before initialization", () => {
		const validation = validateBwrapInit({ networkMode: "open", platform: "linux", bwrapAvailable: false });

		expect(validation.ok).toBe(false);
		if (!validation.ok) {
			expect(validation.reason).toBe("bwrap-missing");
			expect(validation.message).toContain("bwrap is not available");
			expect(validation.message).toContain("fail-closed");
		}
	});
});

describe("package metadata", () => {
	test("does not declare the removed external sandbox dependency", async () => {
		const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8")) as {
			dependencies?: Record<string, string>;
			optionalDependencies?: Record<string, string>;
		};
		const forbiddenDependency = ["@anthropic-ai", "sandbox" + "-runtime"].join("/");

		expect(packageJson.dependencies?.[forbiddenDependency]).toBeUndefined();
		expect(packageJson.optionalDependencies?.[forbiddenDependency]).toBeUndefined();
	});

	test("package manifest exposes only the extension entrypoint", async () => {
		const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8")) as {
			pi?: { extensions?: string[] };
			peerDependencies?: Record<string, string>;
			keywords?: string[];
		};
		const extensionPackageJson = JSON.parse(await readFile(new URL("./package.json", import.meta.url), "utf8")) as {
			pi?: { extensions?: string[] };
		};

		expect(packageJson.keywords).toContain("pi-package");
		expect(packageJson.peerDependencies?.["@earendil-works/pi-coding-agent"]).toBe("*");
		expect(packageJson.peerDependencies?.typebox).toBe("*");
		expect(packageJson.pi?.extensions).toEqual(["./extensions"]);
		expect(extensionPackageJson.pi?.extensions).toEqual(["./sandbox.ts"]);
	});
});

describe("sandbox extension entrypoint", () => {
	async function loadSandboxEntrypoint(agentDir: string): Promise<(pi: unknown) => void> {
		const tool = (name: string) => ({
			name,
			description: `${name} stub`,
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
				Object: (properties: unknown, options?: unknown) => ({ type: "object", properties, ...(options as Record<string, unknown> | undefined) }),
				String: (options?: unknown) => ({ type: "string", ...(options as Record<string, unknown> | undefined) }),
				Number: (options?: unknown) => ({ type: "number", ...(options as Record<string, unknown> | undefined) }),
				Optional: (schema: unknown) => ({ ...(schema as Record<string, unknown>), optional: true }),
				Array: (items: unknown, options?: unknown) => ({ type: "array", items, ...(options as Record<string, unknown> | undefined) }),
			},
		}));
		return (await import(`${new URL("./sandbox.ts", import.meta.url).href}?entrypoint=${Date.now()}`)).default as (pi: unknown) => void;
	}

	test("loads, registers sandboxed tool overrides and command, and refreshes /sandbox handshake state", async () => {
		const cwd = await makeTempDir();
		const agentDir = await makeTempDir();
		const flags: string[] = [];
		const tools: string[] = [];
		const commands = new Map<string, { handler: (args: string | undefined, ctx: unknown) => Promise<void> | void }>();
		const handlers = new Map<string, Array<(event: unknown, ctx: unknown) => Promise<void> | void>>();
		const notifications: string[] = [];
		const statuses: Array<{ key: string; message: string | undefined }> = [];
		const pi = {
			registerFlag: (name: string) => flags.push(name),
			getFlag: () => false,
			registerTool: (def: { name: string }) => tools.push(def.name),
			registerCommand: (name: string, options: { handler: (args: string | undefined, ctx: unknown) => Promise<void> | void }) => commands.set(name, options),
			on: (event: string, handler: (event: unknown, ctx: unknown) => Promise<void> | void) => {
				(handlers.get(event) ?? (handlers.set(event, []), handlers.get(event)!)).push(handler);
			},
		};
		const ctx = {
			cwd,
			hasUI: false,
			ui: {
				notify: (message: string) => notifications.push(message),
				setStatus: (key: string, message: string | undefined) => statuses.push({ key, message }),
				theme: { fg: (_name: string, text: string) => text },
				confirm: async () => false,
			},
		};
		const handshakeKey = Symbol.for("@nklisch/pi-sandbox.background-tasks-integration");
		delete (globalThis as typeof globalThis & Record<symbol, unknown>)[handshakeKey];
		try {
			const extension = await loadSandboxEntrypoint(agentDir);
			extension(pi);

			expect(flags).toContain("no-sandbox");
			expect(tools).toEqual(expect.arrayContaining(["bash", "read", "write", "edit"]));
			expect(commands.has("sandbox")).toBe(true);
			expect(handlers.get("session_start")?.length).toBeGreaterThan(0);

			for (const handler of handlers.get("session_start") ?? []) {
				await handler({ reason: "startup" }, ctx);
			}
			expect(statuses.length + notifications.length).toBeGreaterThan(0);

			(globalThis as typeof globalThis & Record<symbol, unknown>)[handshakeKey] = { integrated: true, bridgeState: "loaded" };
			await commands.get("sandbox")!.handler(undefined, ctx);
			expect(notifications.at(-1)).toContain("Background tasks sandbox: active");
		} finally {
			delete (globalThis as typeof globalThis & Record<symbol, unknown>)[handshakeKey];
		}
	});
});

describe("config boundary contract", () => {
	test("deepMerge strips ASRT-only fields instead of carrying inert security knobs", () => {
		const legacyConfig = {
			ignoreViolations: { bash: ["legacy"] },
			enableWeakerNestedSandbox: true,
			httpProxyPort: 8080,
			socksProxyPort: 1080,
			filesystem: {
				allowGitConfig: true,
				denyRead: ["secret"],
			},
			network: {
				mode: "open",
				httpProxyPort: 8080,
				socksProxyPort: 1080,
			},
		} as Partial<SandboxConfig> & Record<string, unknown>;

		const merged = deepMerge(DEFAULT_CONFIG, legacyConfig);

		expect((merged as Record<string, unknown>).ignoreViolations).toBeUndefined();
		expect((merged as Record<string, unknown>).enableWeakerNestedSandbox).toBeUndefined();
		expect((merged as Record<string, unknown>).httpProxyPort).toBeUndefined();
		expect((merged as Record<string, unknown>).socksProxyPort).toBeUndefined();
		expect((merged.filesystem as Record<string, unknown>).allowGitConfig).toBeUndefined();
		expect((merged.network as Record<string, unknown>).httpProxyPort).toBeUndefined();
		expect((merged.network as Record<string, unknown>).socksProxyPort).toBeUndefined();
	});

	test("mergeProjectAdditive lets projects tighten but not loosen global policy", () => {
		const warnings: string[] = [];
		const merged = mergeProjectAdditive(
			{
				enabled: true,
				filesystem: {
					denyRead: ["global-secret"],
					denyWrite: ["global-protected"],
					allowWrite: [".", "allowed"],
				},
				network: {
					mode: "filter",
					allowedDomains: ["a.example", "b.example"],
					deniedDomains: ["bad.example"],
				},
				tools: { default: "confirm", rules: { bash: "block" } },
			},
			{
				enabled: false,
				filesystem: {
					denyRead: ["project-secret"],
					denyWrite: ["project-protected"],
					allowWrite: ["allowed", "new-allow"],
				},
				network: {
					mode: "open",
					allowedDomains: ["a.example", "evil.example"],
					deniedDomains: ["worse.example"],
				},
				tools: { default: "allow", rules: { bash: "allow", read: "block" } },
			},
			warnings,
		);

		expect(merged.enabled).toBe(true);
		expect(merged.filesystem?.denyRead).toEqual(["global-secret", "project-secret"]);
		expect(merged.filesystem?.denyWrite).toEqual(["global-protected", "project-protected"]);
		expect(merged.filesystem?.allowWrite).toEqual(["allowed", "new-allow"]);
		expect(merged.network?.mode).toBe("filter");
		expect(merged.network?.allowedDomains).toEqual(["a.example"]);
		expect(merged.network?.deniedDomains).toEqual(["bad.example", "worse.example"]);
		expect(merged.tools?.default).toBe("confirm");
		expect(merged.tools?.rules).toEqual({ bash: "block", read: "block" });
		expect(warnings.join("\n")).toContain("disable sandbox");
		expect(warnings.join("\n")).toContain("loosen network.mode");
		expect(warnings.join("\n")).toContain("loosen tool policy");
	});

	test("mergeProjectAdditive narrows allowWrite by canonical containment, not raw exact string", async () => {
		// A project may narrow global allowWrite to a subpath (nested-under) without
		// being silently rejected as `[]`. Widening beyond global is rejected + warned.
		const tmp = await mkdtemp(join(tmpdir(), "aw-narrow-"));
		await mkdir(join(tmp, "plugins"), { recursive: true });
		await mkdir(join(tmp, "allowed"), { recursive: true });
		const global = {
			enabled: true as const,
			filesystem: { denyRead: ["~/.ssh"], allowWrite: [".", "allowed"], denyWrite: [".env"] },
		};
		const warns: string[] = [];
		const narrowed = mergeProjectAdditive(global, { filesystem: { allowWrite: ["plugins"] } }, warns, tmp);
		expect(narrowed.filesystem?.allowWrite).toEqual(["plugins"]);
		expect(warns.join("\n")).not.toContain("plugins");

		// Widening to a path outside every global entry is rejected.
		const widenWarns: string[] = [];
		const widened = mergeProjectAdditive(global, { filesystem: { allowWrite: ["/etc"] } }, widenWarns, tmp);
		expect(widened.filesystem?.allowWrite).toEqual([]);
		expect(widenWarns.join("\n")).toContain("outside the global writable set");

		await rm(tmp, { recursive: true, force: true });
	});

	test("network mode additive rank treats fail-closed filter as stricter than block", () => {
		const cases: Array<{
			globalMode: "open" | "block" | "filter";
			projectMode: "open" | "block" | "filter";
			expectedMode: "open" | "block" | "filter";
			warned: boolean;
		}> = [
			{ globalMode: "filter", projectMode: "block", expectedMode: "filter", warned: true },
			{ globalMode: "open", projectMode: "block", expectedMode: "block", warned: false },
			{ globalMode: "open", projectMode: "filter", expectedMode: "filter", warned: false },
			{ globalMode: "block", projectMode: "filter", expectedMode: "filter", warned: false },
			{ globalMode: "block", projectMode: "open", expectedMode: "block", warned: true },
		];

		for (const { globalMode, projectMode, expectedMode, warned } of cases) {
			const warnings: string[] = [];
			const merged = mergeProjectAdditive(
				{ enabled: true, network: { mode: globalMode } },
				{ network: { mode: projectMode } },
				warnings,
			);

			expect(merged.network?.mode).toBe(expectedMode);
			if (warned) expect(warnings.join("\n")).toContain(`loosen network.mode (${globalMode} -> ${projectMode})`);
			else expect(warnings).toEqual([]);
		}
	});

	test("project inspector cannot override global secret shapes", () => {
		const warnings: string[] = [];
		const merged = mergeProjectAdditive(
			{
				enabled: true,
				tools: {
					default: "allow",
					rules: {},
					inspector: {
						secrets: [{ name: "token", pattern: "tok_[a-z]+", action: "block" }],
					},
				},
			},
			{
				tools: {
					inspector: {
						secrets: [
							{ name: "token", pattern: "does-not-match", action: "redact" },
							{ name: "new-token", pattern: "new_[a-z]+", action: "redact" },
						],
					},
				},
			},
			warnings,
		);

		expect(merged.tools?.inspector?.secrets).toEqual([
			{ name: "token", pattern: "tok_[a-z]+", action: "block" },
			{ name: "new-token", pattern: "new_[a-z]+", action: "redact" },
		]);
		expect(warnings.join("\n")).toContain("override inspector secret shape \"token\"");
	});

	test("project inspector scanFields union with global coverage and warn on narrowing attempts", () => {
		const implicitWarnings: string[] = [];
		const implicitAll = mergeProjectAdditive(
			{
				enabled: true,
				tools: {
					default: "allow",
					rules: {},
					inspector: { secrets: [{ name: "token", pattern: "tok_[A-Za-z0-9]+", action: "block" }] },
				},
			},
			{ tools: { inspector: { scanFields: { agent_send: ["to"] } } } },
			implicitWarnings,
		);
		expect(implicitAll.tools?.inspector?.scanFields?.agent_send).toBe("*");
		expect(implicitWarnings.join("\n")).toContain("narrow inspector scanFields for \"agent_send\" away from all-fields");

		const wildcardWarnings: string[] = [];
		const wildcard = mergeProjectAdditive(
			{
				enabled: true,
				tools: { default: "allow", rules: {}, inspector: { scanFields: { "*": "*" } } },
			},
			{ tools: { inspector: { scanFields: { agent_send: ["to"] } } } },
			wildcardWarnings,
		);
		expect(wildcard.tools?.inspector?.scanFields?.["*"]).toBe("*");
		expect(wildcard.tools?.inspector?.scanFields?.agent_send).toBe("*");
		expect(wildcardWarnings.join("\n")).toContain("narrow inspector scanFields for \"agent_send\"");

		const addQueryWarnings: string[] = [];
		const addQuery = mergeProjectAdditive(
			{
				enabled: true,
				tools: { default: "allow", rules: {}, inspector: { scanFields: { agent_send: ["body", "to"] } } },
			},
			{ tools: { inspector: { scanFields: { agent_send: ["query"] } } } },
			addQueryWarnings,
		);
		expect(addQuery.tools?.inspector?.scanFields?.agent_send).toEqual(["body", "to", "query"]);
		expect(addQueryWarnings.join("\n")).toContain("drop inspector scanFields for \"agent_send\" (body, to)");

		const addToWarnings: string[] = [];
		const addTo = mergeProjectAdditive(
			{
				enabled: true,
				tools: { default: "allow", rules: {}, inspector: { scanFields: { agent_send: ["body"] } } },
			},
			{ tools: { inspector: { scanFields: { agent_send: ["to"] } } } },
			addToWarnings,
		);
		expect(addTo.tools?.inspector?.scanFields?.agent_send).toEqual(["body", "to"]);
		expect(addToWarnings.join("\n")).toContain("drop inspector scanFields for \"agent_send\" (body)");
	});

	test("bypass-tool defaults allow background and monitor only when integration is active", () => {
		const active: BypassToolIntegrationState = { backgroundTasksSandbox: "active", reason: "Linux bwrap integration ready" };
		const inactive: BypassToolIntegrationState = { backgroundTasksSandbox: "inactive", reason: "integration off" };
		const blocked: BypassToolIntegrationState = { backgroundTasksSandbox: "blocked", reason: "bwrap missing" };

		expect(applyBypassToolDefaults({ default: "allow", rules: {} }, active).rules).toMatchObject({
			background: "allow",
			monitor: "allow",
		});
		expect(applyBypassToolDefaults({ default: "allow", rules: {} }, inactive).rules).toMatchObject({
			background: "confirm",
			monitor: "confirm",
		});
		expect(applyBypassToolDefaults({ default: "allow", rules: {} }, blocked).rules).toMatchObject({
			background: "confirm",
			monitor: "confirm",
		});
		expect(applyBypassToolDefaults({ default: "block", rules: {} }, active).rules?.background).toBe("block");
		expect(applyBypassToolDefaults({ default: "allow", rules: { background: "block" } }, active).rules?.background).toBe("block");
	});

	test("background-tasks integration state requires platform readiness and loaded bridge handshake", () => {
		const baseConfig: SandboxConfig = { ...DEFAULT_CONFIG, enabled: true, network: { mode: "open" }, backgroundTasks: { sandboxIntegration: "auto" } };
		const loadedHandshake = { integrated: true, bridgeState: "loaded" };

		expect(decideBackgroundTasksIntegrationState({ config: baseConfig, platform: "linux", bwrapAvailable: true, backgroundTasksHandshake: loadedHandshake })).toMatchObject({
			backgroundTasksSandbox: "active",
		});
		expect(decideBackgroundTasksIntegrationState({ config: baseConfig, platform: "linux", bwrapAvailable: true })).toMatchObject({
			backgroundTasksSandbox: "inactive",
			reason: "background-tasks sandbox integration handshake missing",
		});
		expect(decideBackgroundTasksIntegrationState({ config: baseConfig, platform: "linux", bwrapAvailable: true, backgroundTasksHandshake: { integrated: false, reason: "absent" } })).toMatchObject({
			backgroundTasksSandbox: "inactive",
			reason: "background-tasks sandbox bridge absent",
		});
		expect(decideBackgroundTasksIntegrationState({ config: baseConfig, platform: "linux", bwrapAvailable: true, backgroundTasksHandshake: { integrated: false, reason: "broken" } })).toMatchObject({
			backgroundTasksSandbox: "inactive",
			reason: "background-tasks sandbox bridge broken",
		});
		expect(decideBackgroundTasksIntegrationState({ config: baseConfig, platform: "darwin", bwrapAvailable: false, backgroundTasksHandshake: loadedHandshake })).toMatchObject({
			backgroundTasksSandbox: "inactive",
		});
		expect(decideBackgroundTasksIntegrationState({ config: { ...baseConfig, backgroundTasks: { sandboxIntegration: "off" } }, platform: "linux", bwrapAvailable: true, backgroundTasksHandshake: loadedHandshake })).toMatchObject({
			backgroundTasksSandbox: "inactive",
			reason: "backgroundTasks.sandboxIntegration is off",
		});
		expect(decideBackgroundTasksIntegrationState({ config: baseConfig, platform: "linux", bwrapAvailable: false, backgroundTasksHandshake: loadedHandshake })).toMatchObject({
			backgroundTasksSandbox: "blocked",
		});
		expect(decideBackgroundTasksIntegrationState({ config: { ...baseConfig, network: { mode: "filter" } }, platform: "linux", bwrapAvailable: true, backgroundTasksHandshake: loadedHandshake })).toMatchObject({
			backgroundTasksSandbox: "blocked",
		});
		expect(decideBackgroundTasksIntegrationState({ config: baseConfig, parseErrors: ["project: invalid JSON"], backgroundTasksHandshake: loadedHandshake })).toMatchObject({
			backgroundTasksSandbox: "blocked",
			reason: "config parse error(s): project: invalid JSON",
		});
	});

	test("project config cannot lower bypass-tool fallback policy but can tighten it", () => {
		const loosenWarnings: string[] = [];
		const loosened = mergeProjectAdditive(
			{
				enabled: true,
				tools: { default: "allow", rules: { background: "confirm", monitor: "block" } },
			},
			{ tools: { rules: { background: "allow", monitor: "allow" } } },
			loosenWarnings,
		);

		expect(loosened.tools?.rules?.background).toBe("confirm");
		expect(loosened.tools?.rules?.monitor).toBe("block");
		expect(loosenWarnings.join("\n")).toContain("background");
		expect(loosenWarnings.join("\n")).toContain("monitor");

		const tightenWarnings: string[] = [];
		const tightened = mergeProjectAdditive(
			{
				enabled: true,
				tools: { default: "allow", rules: {} },
			},
			{ tools: { rules: { background: "block", monitor: "confirm" } } },
			tightenWarnings,
		);

		expect(tightened.tools?.rules?.background).toBe("block");
		expect(tightened.tools?.rules?.monitor).toBe("confirm");
		expect(tightenWarnings).toEqual([]);
	});

	test("confirm bypass-tool policy fails closed when no UI is available", () => {
		const inactive: BypassToolIntegrationState = { backgroundTasksSandbox: "inactive", reason: "integration off" };
		const background = decideToolPolicy("background", { default: "allow", rules: { background: "confirm" } }, false, inactive);
		const monitor = decideToolPolicy("monitor", { default: "allow", rules: { monitor: "confirm" } }, false, inactive);

		expect(background.action).toBe("block");
		expect(background.reason).toContain("requires confirmation");
		expect(monitor.action).toBe("block");
		expect(monitor.reason).toContain("requires confirmation");
	});

	test("loadConfig keeps raw bypass-tool config and applies state at decision time", async () => {
		const cwd = await makeTempDir();
		const loaded = loadConfig(cwd, { agentDir: join(cwd, "missing-agent-dir") });
		const active: BypassToolIntegrationState = { backgroundTasksSandbox: "active", reason: "Linux bwrap" };
		const inactive: BypassToolIntegrationState = { backgroundTasksSandbox: "inactive", reason: "unsupported platform" };

		expect(loaded.config.tools?.rules?.background).toBeUndefined();
		expect(applyBypassToolDefaults(loaded.config.tools, active).rules?.background).toBe("allow");
		expect(applyBypassToolDefaults(loaded.config.tools, inactive).rules?.background).toBe("confirm");
	});

	test("loadConfig preserves global bypass-tool rules while inactive state still floors allow to confirm", async () => {
		const cwd = await makeTempDir();
		const agentDir = await makeTempDir();
		await mkdir(join(agentDir, "extensions"), { recursive: true });
		await writeFile(join(agentDir, "extensions", "sandbox.json"), JSON.stringify({
			tools: { rules: { background: "allow", monitor: "block" } },
		}));

		const loaded = loadConfig(cwd, { agentDir });
		const inactive: BypassToolIntegrationState = { backgroundTasksSandbox: "inactive", reason: "integration off" };

		expect(loaded.config.tools?.rules?.background).toBe("allow");
		expect(loaded.config.tools?.rules?.monitor).toBe("block");
		expect(applyBypassToolDefaults(loaded.config.tools, inactive).rules?.background).toBe("confirm");
		expect(applyBypassToolDefaults(loaded.config.tools, inactive).rules?.monitor).toBe("block");
	});

	test("loadConfig blocks project attempts to lower bypass-tool fallback confirmation", async () => {
		const cwd = await makeTempDir();
		const agentDir = await makeTempDir();
		await mkdir(join(cwd, ".pi"), { recursive: true });
		await writeFile(join(cwd, ".pi", "sandbox.json"), JSON.stringify({
			tools: { rules: { background: "allow", monitor: "allow" } },
		}));

		const loaded = loadConfig(cwd, { agentDir });
		const inactive: BypassToolIntegrationState = { backgroundTasksSandbox: "inactive", reason: "integration off" };

		expect(loaded.config.tools?.rules?.background).toBeUndefined();
		expect(loaded.config.tools?.rules?.monitor).toBeUndefined();
		expect(applyBypassToolDefaults(loaded.config.tools, inactive).rules?.background).toBe("confirm");
		expect(applyBypassToolDefaults(loaded.config.tools, inactive).rules?.monitor).toBe("confirm");
		expect(loaded.additiveWarnings.join("\n")).toContain("background");
		expect(loaded.additiveWarnings.join("\n")).toContain("monitor");
	});

	test("loadConfig lets projects tighten bypass tools to confirm or block", async () => {
		const cwd = await makeTempDir();
		const agentDir = await makeTempDir();
		await mkdir(join(cwd, ".pi"), { recursive: true });
		await writeFile(join(cwd, ".pi", "sandbox.json"), JSON.stringify({
			tools: { rules: { background: "block", monitor: "confirm" } },
		}));

		const loaded = loadConfig(cwd, { agentDir });

		expect(loaded.config.tools?.rules?.background).toBe("block");
		expect(loaded.config.tools?.rules?.monitor).toBe("confirm");
	});

	test("loadConfig reads global and project paths and merges them additively", async () => {
		const cwd = await makeTempDir();
		const agentDir = await makeTempDir();
		await mkdir(join(agentDir, "extensions"), { recursive: true });
		await mkdir(join(cwd, ".pi"), { recursive: true });
		await writeFile(join(agentDir, "extensions", "sandbox.json"), JSON.stringify({
			enabled: true,
			filesystem: {
				denyRead: ["global-secret"],
				denyWrite: ["global-protected"],
				allowWrite: [".", "allowed"],
			},
			network: {
				mode: "open",
				allowedDomains: ["a.example", "b.example"],
				deniedDomains: ["bad.example"],
			},
			envScrub: { names: ["GLOBAL_SECRET"], patterns: ["GLOBAL_*"], keep: ["GLOBAL_KEEP"] },
		}));
		await writeFile(join(cwd, ".pi", "sandbox.json"), JSON.stringify({
			filesystem: {
				denyRead: ["project-secret"],
				denyWrite: ["project-protected"],
				allowWrite: ["allowed", "new-allow"],
			},
			network: {
				mode: "block",
				allowedDomains: ["a.example", "evil.example"],
				deniedDomains: ["worse.example"],
			},
			envScrub: { names: ["PROJECT_SECRET"], patterns: ["PROJECT_*"], keep: ["PROJECT_KEEP"] },
		}));

		const loaded = loadConfig(cwd, { agentDir });

		expect(loaded.parseErrors).toEqual([]);
		expect(loaded.config.filesystem?.denyRead).toEqual([...(DEFAULT_CONFIG.filesystem?.denyRead ?? []), "global-secret", "project-secret"]);
		expect(loaded.config.filesystem?.denyWrite).toEqual([...(DEFAULT_CONFIG.filesystem?.denyWrite ?? []), "global-protected", "project-protected"]);
		expect(loaded.config.filesystem?.allowWrite).toEqual(["allowed", "new-allow"]);
		expect(loaded.config.network?.mode).toBe("block");
		expect(loaded.config.network?.allowedDomains).toEqual(["a.example"]);
		expect(loaded.config.network?.deniedDomains).toEqual(["bad.example", "worse.example"]);
		expect(loaded.config.envScrub?.names).toEqual(["ANTHROPIC_AUTH_TOKEN", "GLOBAL_SECRET", "PROJECT_SECRET"]);
		expect(loaded.config.envScrub?.patterns).toEqual(["GLOBAL_*", "PROJECT_*"]);
		expect(loaded.config.envScrub?.keep).toEqual(["GLOBAL_KEEP", "PROJECT_KEEP"]);
	});

	test("scrubEnv scrubs names and patterns even when keep lists include them", () => {
		const defaultScrubbed = "ANTHROPIC_AUTH_TOKEN";
		const projectScrubbed = "PI_SANDBOX_TEST_MY_VAR";
		const keptNonScrubbed = "PI_SANDBOX_TEST_KEEP_SAFE";
		const previous = {
			defaultScrubbed: process.env[defaultScrubbed],
			projectScrubbed: process.env[projectScrubbed],
			keptNonScrubbed: process.env[keptNonScrubbed],
		};
		try {
			process.env[defaultScrubbed] = "remove-default";
			process.env[projectScrubbed] = "remove-project";
			process.env[keptNonScrubbed] = "keep-safe";

			const scrubbed = scrubEnv(
				{
					names: ["ANTHROPIC_AUTH_TOKEN", "PI_SANDBOX_TEST_MY_VAR"],
					keep: ["ANTHROPIC_AUTH_TOKEN", "PI_SANDBOX_TEST_MY_VAR", keptNonScrubbed],
				},
				[],
			);

			expect(scrubbed).toContain(defaultScrubbed);
			expect(scrubbed).toContain(projectScrubbed);
			expect(process.env[defaultScrubbed]).toBeUndefined();
			expect(process.env[projectScrubbed]).toBeUndefined();
			expect(process.env[keptNonScrubbed]).toBe("keep-safe");
		} finally {
			if (previous.defaultScrubbed === undefined) delete process.env[defaultScrubbed];
			else process.env[defaultScrubbed] = previous.defaultScrubbed;
			if (previous.projectScrubbed === undefined) delete process.env[projectScrubbed];
			else process.env[projectScrubbed] = previous.projectScrubbed;
			if (previous.keptNonScrubbed === undefined) delete process.env[keptNonScrubbed];
			else process.env[keptNonScrubbed] = previous.keptNonScrubbed;
		}
	});

	test("loadConfig unions global deny lists with defaults unless explicitly emptied (M1)", async () => {
		const cwd = await makeTempDir();
		const agentDir = await makeTempDir();
		await mkdir(join(agentDir, "extensions"), { recursive: true });
		await writeFile(join(agentDir, "extensions", "sandbox.json"), JSON.stringify({
			filesystem: {
				denyRead: ["~/.ssh", "global-secret"],
				denyWrite: ["global-protected"],
			},
		}));

		const loaded = loadConfig(cwd, { agentDir });

		expect(loaded.parseErrors).toEqual([]);
		expect(loaded.config.filesystem?.denyRead).toEqual([...(DEFAULT_CONFIG.filesystem?.denyRead ?? []), "global-secret"]);
		expect(loaded.config.filesystem?.denyWrite).toEqual([...(DEFAULT_CONFIG.filesystem?.denyWrite ?? []), "global-protected"]);

		await writeFile(join(agentDir, "extensions", "sandbox.json"), JSON.stringify({
			filesystem: { denyRead: [], denyWrite: [] },
		}));

		const emptied = loadConfig(cwd, { agentDir });

		expect(emptied.parseErrors).toEqual([]);
		expect(emptied.config.filesystem?.denyRead).toEqual([]);
		expect(emptied.config.filesystem?.denyWrite).toEqual([]);
	});

	test("loadConfig does not crash when the global config path is absent", async () => {
		const cwd = await makeTempDir();
		const loaded = loadConfig(cwd, { agentDir: join(cwd, "missing-agent-dir") });

		expect(loaded.config.enabled).toBe(true);
		expect(loaded.parseErrors).toEqual([]);
	});

	test("no config defaults to open networking and can initialize", async () => {
		const cwd = await makeTempDir();
		const loaded = loadConfig(cwd, { agentDir: join(cwd, "missing-agent-dir") });
		const validation = validateBwrapInit({ networkMode: loaded.config.network?.mode ?? "open", platform: "linux", bwrapAvailable: true });

		expect(loaded.parseErrors).toEqual([]);
		expect(loaded.failClosedReasons).toEqual([]);
		expect(loaded.config.network?.mode).toBe("open");
		expect(validation.ok).toBe(true);
	});

	test("validateConfig rejects unknown modes, invalid policies, non-string arrays, and invalid inspector regexes", () => {
		const errors = validateConfig({
			filesystem: { denyRead: ["ok", 42], denyWrite: "secret" },
			network: { mode: "bogus", allowedDomains: ["example.com", false] },
			tools: {
				default: "maybe",
				rules: { background: "bogus" },
				inspector: {
					secrets: [{ name: "broken", pattern: "[", action: "block" }],
					allowlist: { regexes: ["["] },
				},
			},
		});

		expect(errors.join("\n")).toContain("network.mode");
		expect(errors.join("\n")).toContain("tools.default");
		expect(errors.join("\n")).toContain("tools.rules.background");
		expect(errors.join("\n")).toContain("filesystem.denyRead[1]");
		expect(errors.join("\n")).toContain("filesystem.denyWrite");
		expect(errors.join("\n")).toContain("network.allowedDomains[1]");
		expect(errors.join("\n")).toContain("tools.inspector.secrets[0].pattern must compile");
		expect(errors.join("\n")).toContain("tools.inspector.allowlist.regexes[0] must compile");
	});

	test("validateConfig fails closed on unknown statically-checkable fields but allows dynamic tool maps (M2)", () => {
		const errors = validateConfig({
			enabeld: true,
			filesystem: { denyRead: [], denyRaed: [] },
			network: { mdoe: "block" },
			tools: {
				defualt: "allow",
				rules: { unknownToolName: "block" },
				inspector: {
					onNoMtach: "block",
					scanFields: { unknownToolName: ["body"] },
					secrets: [{ name: "token", pattern: "tok_[a-z]+", action: "block", maxLenght: 20 }],
					allowlist: { regexes: ["^example$"], regex: ["typo"] },
				},
			},
			envScrub: { names: [], patterms: [] },
			backgroundTasks: { sandboxIntegratoin: "auto" },
		});
		const joined = errors.join("\n");

		expect(joined).toContain("enabeld is not a recognized config field");
		expect(joined).toContain("filesystem.denyRaed is not a recognized config field");
		expect(joined).toContain("network.mdoe is not a recognized config field");
		expect(joined).toContain("tools.defualt is not a recognized config field");
		expect(joined).toContain("tools.inspector.onNoMtach is not a recognized config field");
		expect(joined).toContain("tools.inspector.secrets[0].maxLenght is not a recognized config field");
		expect(joined).toContain("tools.inspector.allowlist.regex is not a recognized config field");
		expect(joined).toContain("envScrub.patterms is not a recognized config field");
		expect(joined).toContain("backgroundTasks.sandboxIntegratoin is not a recognized config field");
		expect(joined).not.toContain("tools.rules.unknownToolName is not a recognized config field");
		expect(joined).not.toContain("tools.inspector.scanFields.unknownToolName is not a recognized config field");
	});

	test("loadConfig reports unknown-field parse errors with source and path (M2)", async () => {
		const cwd = await makeTempDir();
		const agentDir = await makeTempDir();
		await mkdir(join(agentDir, "extensions"), { recursive: true });
		await writeFile(join(agentDir, "extensions", "sandbox.json"), JSON.stringify({
			network: { mdoe: "block" },
		}));

		const loaded = loadConfig(cwd, { agentDir });

		expect(loaded.parseErrors.join("\n")).toContain("global (");
		expect(loaded.parseErrors.join("\n")).toContain("network.mdoe is not a recognized config field");
	});

	test("legacy ASRT fields remain warnings instead of unknown-field errors (M2)", async () => {
		const cwd = await makeTempDir();
		const agentDir = await makeTempDir();
		await mkdir(join(agentDir, "extensions"), { recursive: true });
		await writeFile(join(agentDir, "extensions", "sandbox.json"), JSON.stringify({
			ignoreViolations: { bash: ["legacy"] },
			enableWeakerNestedSandbox: true,
			httpProxyPort: 8080,
			socksProxyPort: 1080,
			filesystem: { allowGitConfig: true },
			network: { httpProxyPort: 8080, socksProxyPort: 1080 },
		}));

		const loaded = loadConfig(cwd, { agentDir });

		expect(loaded.parseErrors).toEqual([]);
		expect(loaded.legacyFieldWarnings.join("\n")).toContain("ignoreViolations");
		expect(loaded.legacyFieldWarnings.join("\n")).toContain("filesystem.allowGitConfig");
		expect(loaded.legacyFieldWarnings.join("\n")).toContain("network.httpProxyPort");
	});

	test("validateConfig rejects impossible or non-positive secret maxLength values (B1-3)", () => {
		const errors = validateConfig({
			tools: {
				inspector: {
					secrets: [
						{ name: "zero", pattern: "a", action: "block", maxLength: 0 },
						{ name: "fractional", pattern: "b", action: "block", maxLength: 1.5 },
						{ name: "too-long", pattern: "c", action: "block", maxLength: 10_001 },
						{ name: "at-cap", pattern: "d", action: "block", maxLength: 10_000 },
					],
				},
			},
		});

		expect(errors.join("\n")).toContain("tools.inspector.secrets[0].maxLength must be a positive integer");
		expect(errors.join("\n")).toContain("tools.inspector.secrets[1].maxLength must be a positive integer");
		expect(errors.join("\n")).toContain("tools.inspector.secrets[2].maxLength must be < 10000");
		expect(errors.join("\n")).toContain("tools.inspector.secrets[3].maxLength must be < 10000");
	});

	test("maxLength is required — config without it fails closed (redesign)", () => {
		// The windowed scan uses maxLength as the per-shape overlap so a full match
		// always fits within one window. Without it, the scanner cannot guarantee a
		// straddling match is fully captured, and a truncated redaction would leak.
		const errors = validateConfig({
			tools: {
				inspector: { secrets: [{ name: "s", pattern: "sk-[A-Za-z0-9]{20,128}", action: "redact" }] },
			},
		});
		expect(errors.join("\n")).toContain("maxLength is required");
	});

	test("maxLength accepts a bounded pattern with a valid declaration (redesign)", () => {
		const ok = validateConfig({
			tools: {
				inspector: { secrets: [{ name: "s", pattern: "sk-[A-Za-z0-9]{20,128}", action: "redact", maxLength: 131 }] },
			},
		});
		expect(ok).toEqual([]);
	});

	test("loadConfig fails closed when maxLength is missing (redesign)", async () => {
		const cwd = await makeTempDir();
		const agentDir = await makeTempDir();
		await mkdir(join(agentDir, "extensions"), { recursive: true });
		await writeFile(join(agentDir, "extensions", "sandbox.json"), JSON.stringify({
			tools: {
				inspector: {
					secrets: [{ name: "overlong", pattern: "sk-A{4097}", action: "block" }],
				},
			},
		}));
		const loaded = loadConfig(cwd, { agentDir });
		expect(loaded.parseErrors.length).toBeGreaterThan(0);
		expect(loaded.parseErrors.join("\n")).toContain("maxLength is required");
	});

	test("loadConfig accepts a pattern with maxLength declared (redesign)", async () => {
		const cwd = await makeTempDir();
		const agentDir = await makeTempDir();
		await mkdir(join(agentDir, "extensions"), { recursive: true });
		await writeFile(join(agentDir, "extensions", "sandbox.json"), JSON.stringify({
			tools: {
				inspector: {
					secrets: [{ name: "overlong", pattern: "sk-A{4097}", action: "block", maxLength: 4100 }],
				},
			},
		}));
		const loaded = loadConfig(cwd, { agentDir });
		expect(loaded.parseErrors).toEqual([]);
	});

	test("validateConfig rejects backreferences unconditionally (redesign)", () => {
		const errors = validateConfig({
			tools: {
				inspector: { secrets: [{ name: "repeated", pattern: "([A-Za-z0-9]{4096})\\1", action: "block", maxLength: 9000 }] },
			},
		});
		expect(errors.join("\n")).toContain("backreference");
	});

	test("backreference ban is NOT bypassed by skipRegexSafetyCheck (redesign)", () => {
		const errors = validateConfig({
			tools: {
				inspector: { secrets: [{ name: "repeat", pattern: "([A-Za-z0-9]{6000})\\1", action: "redact", maxLength: 6005, skipRegexSafetyCheck: true }] },
			},
		});
		expect(errors.join("\n")).toContain("backreference");
	});

	test("validateConfig rejects named backreferences \\k<name> (redesign)", () => {
		const errors = validateConfig({
			tools: {
				inspector: { secrets: [{ name: "named", pattern: "(?<half>[A-Za-z0-9]{6000})\\k<half>", action: "redact", maxLength: 9999 }] },
			},
		});
		expect(errors.join("\n")).toContain("backreference");
	});

	test("zero-width full match (lookahead) with a captured secret fails closed at runtime (redesign)", () => {
		const input: Record<string, unknown> = { body: "prefix sk-" + "A".repeat(40) + " suffix" };
		const verdict = inspectToolInput("agent_send", input, {
			secrets: [{ name: "lookahead", pattern: "(?=(sk-[A-Z]{40}))", action: "redact", secretGroup: 1, maxLength: 64 }],
			onNoMatch: "allow",
		});
		expect(verdict.action).toBe("block");
	});

	test("maxLength smaller than the pattern's minimum match length is rejected (redesign)", () => {
		// The 2x overlap guarantees a match of L <= maxLength is captured. But if the
		// operator under-declares maxLength (real min match > maxLength), the match
		// straddles multiple windows and no sentinel fires. The MINIMUM match length
		// is a sound, easily-computed property; reject when it exceeds maxLength.
		const errors = validateConfig({
			tools: {
				inspector: { secrets: [{ name: "underdeclared", pattern: "sk-A{298}", action: "redact", maxLength: 100 }] },
			},
		});
		expect(errors.join("\n")).toContain("smaller than the pattern's minimum match length");
	});

	test("non-zero-width lookahead prefix with secretGroup outside match[0] fails closed (redesign)", () => {
		// prefix(?=(sk-...)) has match[0] = "prefix", but the captured candidate
		// (sk-...) is OUTSIDE match[0]. Redacting only the prefix leaks the secret.
		const input: Record<string, unknown> = { body: "prefix" + "sk-" + "A".repeat(40) };
		const verdict = inspectToolInput("agent_send", input, {
			secrets: [{ name: "lookahead-prefix", pattern: "prefix(?=(sk-[A-Z]{40}))", action: "redact", secretGroup: 1, maxLength: 64 }],
			onNoMatch: "allow",
		});
		expect(verdict.action).toBe("block");
	});

	test("duplicate-text lookahead capture outside match[0] fails closed (redesign loop 5)", () => {
		// sk-[A-Z]{40}(?=(sk-[A-Z]{40})) — the lookahead captures a SECOND copy of
		// the secret. The old substring-inclusion check (fullMatch.includes(candidate))
		// passed because the captured text duplicates a prefix of match[0], leaking
		// the lookahead copy. The 'd' (indices) flag gives positional spans; block when
		// the capture span is outside match[0]'s span.
		const s = "sk-" + "A".repeat(40);
		const input: Record<string, unknown> = { body: s + s };
		const verdict = inspectToolInput("agent_send", input, {
			secrets: [{ name: "dup-lookahead", pattern: "sk-[A-Z]{40}(?=(sk-[A-Z]{40}))", action: "redact", secretGroup: 1, maxLength: 43 }],
			onNoMatch: "allow",
		});
		expect(verdict.action).toBe("block");
	});

	test("estimateRegexMinLength handles zero-width assertions and named groups (redesign loop 5)", () => {
		// \b is zero-width (0 chars), so \bsk-[A-Z]{40}\b has min length 43, not 45.
		// Named groups (?<name>...) skip the name. Lookahead (?=...) is zero-width.
		// These must not cause false-positive rejection when maxLength equals the
		// actual match length.
		const cases = [
			{ pattern: "\\bsk-[A-Z]{40}\\b", maxLength: 43 },
			{ pattern: "(?<token>sk-[A-Z]{40})", maxLength: 43 },
			{ pattern: "(?=sk-)[A-Za-z0-9-]{43}", maxLength: 43 },
		];
		for (const { pattern, maxLength } of cases) {
			const errors = validateConfig({ tools: { inspector: { secrets: [{ name: "s", pattern, action: "redact", maxLength }] } } });
			expect(errors.join("\n")).not.toContain("smaller than the pattern's minimum match length");
		}
	});

	test("variable-length match exceeding maxLength is rejected by max check (redesign loop 6)", () => {
		// {1,12000} has a small min (8) but a huge max (12007). The min check passes,
		// but a real match of 12007 chars can't fit in any 10K scan window — the regex
		// sees only a truncated prefix, no sentinel fires, and the secret leaks. The
		// max-length check rejects this.
		const errors = validateConfig({ tools: { inspector: { secrets: [{ name: "long", pattern: "BEGIN-[A-Z]{1,12000}-END", action: "redact", maxLength: 100 }] } } });
		expect(errors.join("\n")).toContain("smaller than the pattern's maximum match length");
	});

	test("unbounded quantifier (+, *, {n,}) is rejected by max check (redesign loop 6)", () => {
		for (const pattern of ["sk-[A-Z]+", "sk-[A-Z]*", "sk-[A-Z]{1,}"]) {
			const errors = validateConfig({ tools: { inspector: { secrets: [{ name: "s", pattern, action: "redact", maxLength: 128 }] } } });
			expect(errors.join("\n")).toContain("unbounded maximum match length");
		}
	});

	test("negative secretGroup is rejected (redesign loop 6)", () => {
		const errors = validateConfig({ tools: { inspector: { secrets: [{ name: "bad", pattern: "prefix(?=(sk-[A-Z]{40}))", action: "redact", secretGroup: -1, maxLength: 6 }] } } });
		expect(errors.join("\n")).toContain("secretGroup must be a non-negative integer");
	});

	test("backreference inside character class is not a false positive (redesign loop 6)", () => {
		// [\\1A-Z] — \\1 inside a char class is a literal, not a backref.
		const ok = validateConfig({ tools: { inspector: { secrets: [{ name: "ctrl", pattern: "[\\\\1A-Z]{4}", flags: "g", action: "redact", maxLength: 4 }] } } });
		expect(ok).toEqual([]);
	});

	test("property escape \\p{...} with bounded quantifier is accepted and oversized is rejected (redesign loop 7)", () => {
		// \p{L}{1,5} is bounded and valid.
		const ok = validateConfig({ tools: { inspector: { secrets: [{ name: "p", pattern: "\\p{L}{1,5}", flags: "gu", action: "redact", maxLength: 10 }] } } });
		expect(ok).toEqual([]);
		// \p{L}{1,12000} under gu has max 24000 (astral x2) > maxLength 100 → reject.
		const errors = validateConfig({ tools: { inspector: { secrets: [{ name: "u", pattern: "BEGIN-\\p{L}{1,12000}-END", flags: "gu", action: "redact", maxLength: 100 }] } } });
		expect(errors.join("\n")).toContain("smaller than the pattern's maximum match length");
	});

	test("astral-capable atom under u flag counts as 2 code units in max (redesign loop 7)", () => {
		// .{1,6000} under gu: max is 6000*2=12000 > maxLength 6010 → reject.
		const errors = validateConfig({ tools: { inspector: { secrets: [{ name: "dot", pattern: "BEGIN-.{1,6000}-END", flags: "gu", action: "redact", maxLength: 6010 }] } } });
		expect(errors.join("\n")).toContain("smaller than the pattern's maximum match length");
	});

	test("lookaround capture with secretGroup !== 0 is rejected (redesign loop 7)", () => {
		// (?=(...)) with secretGroup:1 — the capture lives inside a lookahead whose
		// match[0] is zero-width. The max check bounds match[0], not the capture, so a
		// capture longer than the scan window can fit while never matching any window.
		const errors = validateConfig({ tools: { inspector: { secrets: [{ name: "look", pattern: "(?=(BEGIN-[A-Z]{12000}-END))", flags: "gu", action: "redact", secretGroup: 1, maxLength: 1 }] } } });
		expect(errors.join("\n")).toContain("with a lookaround");
		// secretGroup: 0 with a lookaround is fine (match[0] is what's bounded).
		// [A-Z] is a positive ASCII-only class → 1 code unit/atom, so max = 40.
		const ok = validateConfig({ tools: { inspector: { secrets: [{ name: "look0", pattern: "(?=BEGIN-)[A-Z]{40}", flags: "gu", action: "redact", maxLength: 43 }] } } });
		expect(ok).toEqual([]);
	});

	test("omitted flags default to gu for max estimation (redesign loop 8)", () => {
		// .{6000} with omitted flags: runtime compiles as gu, so the validator must
		// also estimate under u — . is astral-capable (2 code units) → max 12000 > 6010.
		const errors = validateConfig({ tools: { inspector: { secrets: [{ name: "dot", pattern: "BEGIN-.{6000}-END", action: "redact", maxLength: 6010 }] } } });
		expect(errors.join("\n")).toContain("smaller than the pattern's maximum match length");
	});

	test("complement class escapes (\\S \\D \\W) count as astral-capable under u (redesign loop 8)", () => {
		// \S{6000} under gu: complement class matches astral → 2*6000 = 12000 > 6020.
		const errors = validateConfig({ tools: { inspector: { secrets: [{ name: "nonspace", pattern: "BEGIN-\\S{6000}-END", flags: "gu", action: "redact", maxLength: 6020 }] } } });
		expect(errors.join("\n")).toContain("smaller than the pattern's maximum match length");
	});

	test("containsLookaround does not false-positive on lookaround-like text in char class (redesign loop 8)", () => {
		// [(?=] — (?= is literal text inside a char class, not a lookaround.
		const ok = validateConfig({ tools: { inspector: { secrets: [{ name: "class-prefix", pattern: "[(?=](sk-[A-Z]{40})", action: "redact", secretGroup: 1, maxLength: 44 }] } } });
		expect(ok).toEqual([]);
	});

	test("astral literal quantifier is counted as 2 code units under default gu (redesign loop 9)", () => {
		// 😀{5000} is 5000 astral code points = 10000 code units. The estimator must
		// bind the quantifier to the whole surrogate pair (2 units), not the low
		// surrogate alone. Default flags → gu → astral accounting applies.
		const errors = validateConfig({ tools: { inspector: { secrets: [{ name: "astral-literal", pattern: "BEGIN-😀{5000}-END", action: "redact", maxLength: 5011 }] } } });
		expect(errors.join("\n")).toContain("smaller than the pattern's maximum match length");
	});

	test("v flag (unicode sets) is rejected (redesign loop 9)", () => {
		const errors = validateConfig({ tools: { inspector: { secrets: [{ name: "v-dot", pattern: "BEGIN-.{5}-END", flags: "gv", action: "redact", maxLength: 20 }] } } });
		expect(errors.join("\n")).toContain('must not include the unicodeSets "v" flag');
	});

	test("backref detector does not false-positive on escaped ] in char class (redesign loop 9)", () => {
		// [\]\1A-Z] — \] is an escaped ] (doesn't close the class), \1 is a literal
		// inside the class, not a backreference. Source escaping: \\ = one backslash.
		const ok = validateConfig({ tools: { inspector: { secrets: [{ name: "class", pattern: "[\\]\\1A-Z]{4}", flags: "g", action: "redact", maxLength: 4 }] } } });
		expect(ok).toEqual([]);
	});

	test("malformed braced quantifier is treated as literal, not a quantifier (redesign loop 10)", () => {
		// {,000...2} is NOT a valid quantifier (no leading n). Under non-u flags,
		// JS treats A{,000...2} as a 25-char literal. The estimator must NOT parse
		// it as max=2 — it must count the literal chars (25 > maxLength 2 → reject).
		const zeros = "0".repeat(20);
		const secret = `A{,${zeros}2}`; // 25 chars, literal under "g"
		const errors = validateConfig({ tools: { inspector: { secrets: [{ name: "lit", pattern: secret, flags: "g", action: "redact", maxLength: 2 }] } } });
		expect(errors.join("\n")).toContain("smaller than the pattern's maximum match length");
		// A valid quantifier {1,3} still works.
		const ok = validateConfig({ tools: { inspector: { secrets: [{ name: "q", pattern: "a{1,3}", action: "redact", maxLength: 3 }] } } });
		expect(ok).toEqual([]);
	});

	test("escaped astral Unicode literals with quantifiers are counted correctly (redesign loop 11)", () => {
		// \u{1F600}{5001} under gu: the \u{...} is one astral code point (2 units),
		// {5001} binds to the whole escape → max 10002 > 9000 → reject. Previously the
		// estimator treated \u as a 1-unit escape and {1F600} as literal text, so
		// {5001} bound to the wrong atom and the match leaked.
		const e1 = validateConfig({ tools: { inspector: { secrets: [{ name: "emoji", pattern: "\\u{1F600}{5001}", flags: "gu", action: "redact", maxLength: 9000 }] } } });
		expect(e1.join("\n")).toContain("smaller than the pattern's maximum match length");
		// \uD83D\uDE00{5001} — escaped surrogate pair, each \uHHHH is astral-capable under u.
		const e2 = validateConfig({ tools: { inspector: { secrets: [{ name: "sp", pattern: "\\uD83D\\uDE00{5001}", flags: "gu", action: "redact", maxLength: 9000 }] } } });
		expect(e2.join("\n")).toContain("smaller than the pattern's maximum match length");
		// A bounded \u{...} is accepted.
		const ok = validateConfig({ tools: { inspector: { secrets: [{ name: "ok", pattern: "\\u{1F600}{1,5}", flags: "gu", action: "redact", maxLength: 10 }] } } });
		expect(ok).toEqual([]);
	});

	test("estimateRegexMinLength preserves atom min for bounded quantifier (redesign loop 5)", () => {
		// (sk-AAAAAAAAAA){1,3} has a minimum match of 13 (one repetition of the 13-char
		// group), not 0 or 1. Under-declaring maxLength=5 must be rejected — otherwise the
		// 13-char match straddles windows and leaks. The old code set atomMin=1 for +
		// regardless of the atom's own length; the fix preserves the atom's own min.
		const errors = validateConfig({ tools: { inspector: { secrets: [{ name: "repeat", pattern: "(sk-AAAAAAAAAA){1,3}", action: "redact", maxLength: 5 }] } } });
		expect(errors.join("\n")).toContain("smaller than the pattern's minimum match length");
		// Correct maxLength (>= max 39) is accepted.
		const ok = validateConfig({ tools: { inspector: { secrets: [{ name: "repeat", pattern: "(sk-AAAAAAAAAA){1,3}", action: "redact", maxLength: 39 }] } } });
		expect(ok).toEqual([]);
	});

	test("validateConfig rejects unsafe nested-quantifier regexes and allows simple safe allowlist patterns", () => {
		const unsafe = validateConfig({
			tools: {
				inspector: {
					secrets: [{ name: "redos", pattern: "(a+)+", action: "redact" }],
					allowlist: { regexes: ["(a+)+"] },
				},
			},
		});
		expect(unsafe.join("\n")).toContain('tools.inspector.secrets[0].pattern is unsafe for shape "redos"');
		expect(unsafe.join("\n")).toContain("nested quantifier");
		expect(unsafe.join("\n")).toContain("tools.inspector.allowlist.regexes[0] is unsafe");

		const safe = validateConfig({
			tools: {
				inspector: {
					allowlist: { regexes: ["^[A-Za-z]+$"] },
					secrets: [{ name: "alpha", pattern: "^[A-Za-z]+$", action: "redact" }],
				},
			},
		});
		expect(safe.join("\n")).not.toContain("unsafe");
		expect(safe.join("\n")).not.toContain("must compile");
	});

	test("validateConfig rejects counted nested quantifiers and overlapping quantified alternation (M3)", () => {
		const unsafe = validateConfig({
			tools: {
				inspector: {
					secrets: [
						{ name: "counted-inner", pattern: "(a{1,2})+", action: "block" },
						{ name: "counted-outer", pattern: "(a+){1,3}", action: "block" },
						{ name: "overlap", pattern: "(a|aa)+", action: "block" },
					],
					allowlist: { regexes: ["(a|aa)+"] },
				},
			},
		});
		const joined = unsafe.join("\n");

		expect(joined).toContain('tools.inspector.secrets[0].pattern is unsafe for shape "counted-inner"');
		expect(joined).toContain('tools.inspector.secrets[1].pattern is unsafe for shape "counted-outer"');
		expect(joined).toContain('tools.inspector.secrets[2].pattern is unsafe for shape "overlap"');
		expect(joined).toContain("overlapping alternation");
		expect(joined).toContain("tools.inspector.allowlist.regexes[0] is unsafe");

		const safe = validateConfig({
			tools: {
				inspector: {
					secrets: [{ name: "assignment", pattern: "(key|token|secret)-[a-z]{1,64}", action: "block" }],
				},
			},
		});
		expect(safe.join("\n")).not.toContain("unsafe");
		expect(safe.join("\n")).not.toContain("must compile");
		expect(safe.join("\n")).not.toContain("unbounded");
	});

	test("skipRegexSafetyCheck bypasses the narrow regex heuristic for shapes and allowlists (M3)", () => {
		// skipRegexSafetyCheck bypasses the ReDoS heuristic (nested quantifiers,
		// overlapping alternation) but NOT the apparent-length check: an unbounded
		// pattern still leaks its tail across a window boundary regardless of ReDoS
		// risk. Use a bounded-but-ReDoS-unsafe pattern to isolate the bypass.
		const skipped = validateConfig({
			tools: {
				inspector: {
					secrets: [{ name: "accepted-risk", pattern: "(a|aa){1,5}", action: "block", maxLength: 10, skipRegexSafetyCheck: true }],
					allowlist: { regexes: ["(a+){1,5}"], skipRegexSafetyCheck: true },
				},
			},
		});
		expect(skipped).toEqual([]);

		const badSkipType = validateConfig({
			tools: {
				inspector: {
					secrets: [{ name: "bad", pattern: "a", action: "block", maxLength: 1, skipRegexSafetyCheck: "yes" }],
					allowlist: { regexes: ["a"], skipRegexSafetyCheck: "yes" },
				},
			},
		});
		expect(badSkipType.join("\n")).toContain("tools.inspector.secrets[0].skipRegexSafetyCheck must be a boolean");
		expect(badSkipType.join("\n")).toContain("tools.inspector.allowlist.skipRegexSafetyCheck must be a boolean");
	});

	test("invalid network mode, tool policy, and inspector regex load as fail-closed parse errors", async () => {
		const bogusModeCwd = await makeTempDir();
		const bogusToolCwd = await makeTempDir();
		const bogusRegexCwd = await makeTempDir();
		const bogusAllowlistCwd = await makeTempDir();
		const agentDir = await makeTempDir();
		await mkdir(join(bogusModeCwd, ".pi"), { recursive: true });
		await mkdir(join(bogusToolCwd, ".pi"), { recursive: true });
		await mkdir(join(bogusRegexCwd, ".pi"), { recursive: true });
		await mkdir(join(bogusAllowlistCwd, ".pi"), { recursive: true });
		await writeFile(join(bogusModeCwd, ".pi", "sandbox.json"), JSON.stringify({ network: { mode: "bogus" } }));
		await writeFile(join(bogusToolCwd, ".pi", "sandbox.json"), JSON.stringify({ tools: { rules: { background: "bogus" } } }));
		await writeFile(join(bogusRegexCwd, ".pi", "sandbox.json"), JSON.stringify({
			tools: { inspector: { secrets: [{ name: "broken", pattern: "[", action: "block" }] } },
		}));
		await writeFile(join(bogusAllowlistCwd, ".pi", "sandbox.json"), JSON.stringify({
			tools: { inspector: { allowlist: { regexes: ["["] } } },
		}));

		const bogusMode = loadConfig(bogusModeCwd, { agentDir });
		const bogusTool = loadConfig(bogusToolCwd, { agentDir });
		const bogusRegex = loadConfig(bogusRegexCwd, { agentDir });
		const bogusAllowlist = loadConfig(bogusAllowlistCwd, { agentDir });

		expect(bogusMode.parseErrors.join("\n")).toContain("network.mode");
		expect(bogusTool.parseErrors.join("\n")).toContain("tools.rules.background");
		expect(bogusRegex.parseErrors.join("\n")).toContain("tools.inspector.secrets[0].pattern must compile");
		expect(bogusAllowlist.parseErrors.join("\n")).toContain("tools.inspector.allowlist.regexes[0] must compile");
	});

	test("parse errors use restrictive fail-closed file and bypass-tool policy", async () => {
		const cwd = await makeTempDir();
		await mkdir(join(cwd, ".pi"), { recursive: true });
		await writeFile(join(cwd, ".pi", "sandbox.json"), "{ not valid json");
		await writeFile(join(cwd, "public.txt"), "public");

		const loaded = loadConfig(cwd, { agentDir: join(cwd, "missing-agent-dir") });
		const policy = createFailClosedPolicy(cwd);
		const readOps = makeReadOperations(cwd, policy);
		const background = decideToolPolicy("background", policy.toolRules, false);
		const monitor = decideToolPolicy("monitor", policy.toolRules, false);

		expect(loaded.parseErrors.join("\n")).toContain("project");
		await expect(readOps.readFile(join(cwd, "public.txt"))).rejects.toThrow(/denyRead/);
		expect(background.action).toBe("block");
		expect(monitor.action).toBe("block");
	});

	test("legacy ASRT-only fields produce warnings and are not effective config", async () => {
		const cwd = await makeTempDir();
		const agentDir = await makeTempDir();
		await mkdir(join(cwd, ".pi"), { recursive: true });
		await writeFile(join(cwd, ".pi", "sandbox.json"), JSON.stringify({
			ignoreViolations: { bash: ["legacy"] },
			enableWeakerNestedSandbox: true,
			httpProxyPort: 8080,
			socksProxyPort: 1080,
			filesystem: {
				allowGitConfig: true,
			},
			network: {
				mode: "open",
				httpProxyPort: 8080,
				socksProxyPort: 1080,
			},
		}));

		const loaded = loadConfig(cwd, { agentDir });
		const warnings = loaded.legacyFieldWarnings.join("\n");

		expect(warnings).toContain("ignoreViolations");
		expect(warnings).toContain("enableWeakerNestedSandbox");
		expect(warnings).toContain("allowGitConfig");
		expect(warnings).toContain("httpProxyPort");
		expect(warnings).toContain("socksProxyPort");
		expect((loaded.config as Record<string, unknown>).ignoreViolations).toBeUndefined();
		expect((loaded.config as Record<string, unknown>).enableWeakerNestedSandbox).toBeUndefined();
		expect((loaded.config.filesystem as Record<string, unknown>).allowGitConfig).toBeUndefined();
		expect((loaded.config.network as Record<string, unknown>).httpProxyPort).toBeUndefined();
		expect((loaded.config.network as Record<string, unknown>).socksProxyPort).toBeUndefined();
	});

	test("filter mode fails closed with an actionable backlog pointer", async () => {
		const cwd = await makeTempDir();
		const agentDir = await makeTempDir();
		await mkdir(join(cwd, ".pi"), { recursive: true });
		await writeFile(join(cwd, ".pi", "sandbox.json"), JSON.stringify({ network: { mode: "filter" } }));

		const loaded = loadConfig(cwd, { agentDir });
		const validation = validateBwrapInit({ networkMode: "filter", platform: "linux", bwrapAvailable: true });

		expect(loaded.failClosedReasons.join("\n")).toContain(FILTER_DEFERRED_BACKLOG_ITEM);
		expect(validation.ok).toBe(false);
		if (!validation.ok) {
			expect(validation.reason).toBe("filter-deferred");
			expect(validation.message).toContain(FILTER_DEFERRED_BACKLOG_ITEM);
		}
	});

	test("sandbox command reports mode, fail-closed reason, legacy fields, and bypass state", async () => {
		const notifications: string[] = [];
		const loaded: LoadedConfig = {
			config: {
				enabled: true,
				network: { mode: "filter", allowedDomains: ["example.com"], deniedDomains: [] },
				filesystem: { denyRead: ["~/.ssh"], allowWrite: ["."], denyWrite: [".env"] },
				tools: { default: "allow", rules: { agent_send: "confirm" } },
			},
			parseErrors: [],
			globWarnings: [],
			missingDenyWarnings: [],
			legacyFieldWarnings: ["project: ignoreViolations is ignored"],
			failClosedReasons: [`network.mode=filter deferred; see ${FILTER_DEFERRED_BACKLOG_ITEM}`],
			additiveWarnings: [],
		};
		const handler = createSandboxCommandHandler({
			getState: () => ({
				failClosed: true,
				sandboxEnabled: false,
				sandboxInitialized: false,
				disabledViaConfig: false,
				lastFailClosedReason: "network filter deferred",
			}),
			load: () => loaded,
		});

		await handler(null, { cwd: "/fixture", ui: { notify: (message) => notifications.push(message) } });

		const output = notifications.join("\n");
		expect(output).toContain("State: FAIL-CLOSED");
		expect(output).toContain("Fail-closed reason");
		expect(output).toContain("Mode: filter");
		expect(output).toContain("ignoreViolations");
		expect(output).toContain("Known bypass mitigation state");
		expect(output).toContain("Hardened by this plugin: LLM/tool bash, interactive user_bash, read, write, edit.");
		expect(output).toContain("RPC/API direct bash is not mediated by pi extensions in current pi core.");
		expect(output).toContain("Background tasks sandbox: blocked");
		expect(output).toContain("Bypass tools: background=confirm, monitor=confirm");
		expect(output).toContain("Pi extensions/packages");
		expect(output).toContain("background=confirm");
		expect(output).toContain("monitor=confirm");
		expect(output).toContain("agent_send");
		expect(output).toContain("web/search tools");
		expect(output).toContain("subagents");
		expect(output).toContain("provider requests");
		expect(output).toContain("open network mode leaves host networking intact");

		const degradeNotifications: string[] = [];
		const degradeLoaded: LoadedConfig = {
			...loaded,
			config: {
				...loaded.config,
				network: { mode: "open", allowedDomains: [], deniedDomains: [] },
			},
			failClosedReasons: [],
		};
		const degradeHandler = createSandboxCommandHandler({
			getState: () => ({
				failClosed: false,
				sandboxEnabled: false,
				sandboxInitialized: false,
				disabledViaConfig: false,
				osSandboxUnavailable: true,
				osSandboxUnavailablePlatform: "darwin",
			}),
			load: () => degradeLoaded,
		});

		await degradeHandler(null, { cwd: "/fixture", ui: { notify: (message) => degradeNotifications.push(message) } });

		const degradeOutput = degradeNotifications.join("\n");
		expect(degradeOutput).toContain("State: OS bash sandbox unavailable (macOS) — in-process file/tool policy active");
		expect(degradeOutput).toContain("Background tasks sandbox: inactive (unsupported platform: macOS)");
		expect(degradeOutput).toContain("Bypass tools: background=confirm, monitor=confirm");
		expect(degradeOutput).toContain("File-tool policy is in-process and remains active when mediated bash is fail-closed or the OS bash sandbox is unavailable.");

		const activeNotifications: string[] = [];
		const activeHandler = createSandboxCommandHandler({
			getState: () => ({
				failClosed: false,
				sandboxEnabled: true,
				sandboxInitialized: true,
				disabledViaConfig: false,
				backgroundTasksIntegration: { backgroundTasksSandbox: "active", reason: "Linux bwrap integration ready" },
			}),
			load: () => ({
				...loaded,
				config: { ...loaded.config, network: { mode: "open", allowedDomains: [], deniedDomains: [] }, tools: { default: "allow", rules: {} } },
				failClosedReasons: [],
			}),
		});

		await activeHandler(null, { cwd: "/fixture", ui: { notify: (message) => activeNotifications.push(message) } });
		const activeOutput = activeNotifications.join("\n");
		expect(activeOutput).toContain("Background tasks sandbox: active (Linux bwrap integration ready)");
		expect(activeOutput).toContain("Bypass tools: background=allow, monitor=allow");
	});
});

describe("tool input inspector", () => {
	test("block shapes scan past an allowlisted first match to a later secret", () => {
		const input: Record<string, unknown> = { body: "tok_example tok_R4nd0mSecret9999" };

		const verdict = inspectToolInput("agent_send", input, {
			secrets: [{ name: "token", pattern: "tok_[A-Za-z0-9]+", action: "block" }],
			allowlist: { stopwords: ["tok_example"] },
		});

		expect(verdict.action).toBe("block");
		expect(verdict.reason).toContain("secret shape \"token\" matched");
	});

	test("redact shapes scan all matches and redact each confirmed secret", () => {
		const input: Record<string, unknown> = {
			body: "tok_example tok_R4nd0mSecret9999 tok_AnotherSecret8888",
		};

		const verdict = inspectToolInput("agent_send", input, {
			secrets: [{ name: "token", pattern: "tok_[A-Za-z0-9]+", action: "redact" }],
			allowlist: { stopwords: ["tok_example"] },
		});

		expect(verdict.action).toBe("allow");
		expect(input.body).toBe("tok_example [REDACTED:token] [REDACTED:token]");
	});

	test("block pass scans original input before redact shapes mutate it (M4)", () => {
		const input: Record<string, unknown> = { body: "token=sk-secret-1234" };

		const verdict = inspectToolInput("agent_send", input, {
			secrets: [
				{ name: "redactor", pattern: "sk-secret-[0-9]+", action: "redact" },
				{ name: "blocker", pattern: "token=sk-secret-[0-9]+", action: "block" },
			],
		});

		expect(verdict.action).toBe("block");
		expect(verdict.reason).toContain('secret shape "blocker" matched');
		expect(input.body).toBe("token=sk-secret-1234");
	});

	test("redact-cap overflow fails closed instead of leaking tail secrets (B1-1)", () => {
		// A redact-action shape matching more than MAX_REDACTIONS_PER_SHAPE unique
		// ranges must block rather than silently allow tail matches through
		// unredacted. Previously the cap dropped tail ranges but still allowed —
		// a real secret after 10K decoys would egress unredacted. Now it fails closed.
		const input: Record<string, unknown> = {
			body: "a".repeat(100_000),
		};

		const verdict = inspectToolInput("agent_send", input, {
			secrets: [{ name: "any-a", pattern: "a", action: "redact" }],
		});

		expect(verdict.action).toBe("block");
		expect(verdict.reason).toContain("redaction cap exceeded");
		expect(verdict.reason).toContain("any-a");
	});

	test("entropy-gated low-entropy candidates still block when long enough", () => {
		const inspector = {
			secrets: [
				{
					name: "generic-assignment",
					pattern: "\\b(?:token|password)=([A-Za-z0-9-_.+@]+)",
					action: "block" as const,
					entropy: 3,
					keywords: ["token", "password"],
					secretGroup: 1,
				},
			],
		};

		const verdict = inspectToolInput("agent_send", { body: "token=aaaaaaaaaaaaaaaaaaaa" }, inspector);
		expect(verdict.action).toBe("block");
		expect(verdict.reason).toContain("secret shape \"generic-assignment\" matched");
	});

	test("short low-entropy generic candidates are skipped", () => {
		const inspector = {
			secrets: [
				{
					name: "generic-assignment",
					pattern: "\\b(?:token|password)=([A-Za-z0-9-_.+@]+)",
					action: "block" as const,
					entropy: 3,
					keywords: ["token", "password"],
					secretGroup: 1,
				},
			],
		};

		const verdict = inspectToolInput("agent_send", { body: "password=changeme" }, inspector);
		expect(verdict.action).toBe("allow");
	});

	test("provider-prefix shape with no entropy still blocks", () => {
		const inspector = {
			secrets: [
				{
					name: "generic-assignment",
					pattern: "\\b(?:token|password)=([A-Za-z0-9-_.+@]+)",
					action: "block" as const,
					entropy: 3,
					keywords: ["token", "password"],
					secretGroup: 1,
				},
				{
					name: "provider-anthropic",
					pattern: "sk-ant-[A-Za-z0-9_-]+",
					action: "block" as const,
				},
			],
		};

		const verdict = inspectToolInput("agent_send", { body: "sk-ant-aaaaaaaaaaaaaaaaaaaaaa" }, inspector);
		expect(verdict.action).toBe("block");
		expect(verdict.reason).toContain("secret shape \"provider-anthropic\" matched");
	});
});

describe("in-process file-tool policy", () => {
	function policyFor(cwd: string): SandboxPolicy {
		return {
			cwd,
			denyRead: ["secret-dir", "secret.txt"],
			denyWrite: ["protected", "protected.txt"],
			allowWrite: ["writable"],
			networkMode: "open",
		};
	}

	test("permissive policy allows file-tool operations for intentional sandbox disable", async () => {
		const cwd = await makeTempDir();
		const outside = await makeTempDir();
		await writeFile(join(cwd, "readable.txt"), "readable");
		const outsidePath = join(outside, "outside.txt");
		const policy = createPermissivePolicy(cwd);
		const readOps = makeReadOperations(cwd, policy);
		const writeOps = makeWriteOperations(cwd, policy);

		expect((await readOps.readFile(join(cwd, "readable.txt"))).toString()).toBe("readable");
		await writeOps.writeFile(outsidePath, "outside");
		expect(await readFile(outsidePath, "utf8")).toBe("outside");
	});

	test("enforceDenyRead blocks configured files and directories", async () => {
		const cwd = await makeTempDir();
		await mkdir(join(cwd, "secret-dir"));
		await writeFile(join(cwd, "secret-dir", "inside.txt"), "secret");
		await writeFile(join(cwd, "secret.txt"), "secret");
		const policy = policyFor(cwd);

		expect(() => enforceDenyRead(join(cwd, "secret-dir", "inside.txt"), cwd, policy)).toThrow(/denyRead/);
		expect(() => enforceDenyRead(join(cwd, "secret.txt"), cwd, policy)).toThrow(/denyRead/);
	});

	test("enforceWritePolicy applies denyWrite before allowWrite and confines writes to allowWrite", async () => {
		const cwd = await makeTempDir();
		await mkdir(join(cwd, "writable"));
		await mkdir(join(cwd, "protected"));
		await writeFile(join(cwd, "protected.txt"), "original");
		const policy = { ...policyFor(cwd), allowWrite: ["."] };

		expect(() => enforceWritePolicy(join(cwd, "protected", "new.txt"), cwd, policy)).toThrow(/denyWrite/);
		expect(() => enforceWritePolicy(join(cwd, "protected.txt"), cwd, policy)).toThrow(/denyWrite/);
		expect(() => enforceWritePolicy(join(cwd, "elsewhere.txt"), cwd, policyFor(cwd))).toThrow(/allowWrite/);
		expect(() => enforceWritePolicy(join(cwd, "writable", "ok.txt"), cwd, policyFor(cwd))).not.toThrow();
	});

	test("read operations enforce denyRead on both access and readFile", async () => {
		const cwd = await makeTempDir();
		await mkdir(join(cwd, "writable"));
		await writeFile(join(cwd, "writable", "allowed.txt"), "allowed");
		await writeFile(join(cwd, "secret.txt"), "secret");
		const ops = makeReadOperations(cwd, policyFor(cwd));

		await expect(ops.readFile(join(cwd, "secret.txt"))).rejects.toThrow(/denyRead/);
		await expect(ops.access(join(cwd, "secret.txt"))).rejects.toThrow(/denyRead/);
		expect((await ops.readFile(join(cwd, "writable", "allowed.txt"))).toString()).toBe("allowed");
	});

	test("write operations enforce allowWrite and denyWrite for files and mkdir", async () => {
		const cwd = await makeTempDir();
		await mkdir(join(cwd, "writable"));
		await mkdir(join(cwd, "protected"));
		const ops = makeWriteOperations(cwd, policyFor(cwd));

		await ops.writeFile(join(cwd, "writable", "ok.txt"), "ok");
		expect(await readFile(join(cwd, "writable", "ok.txt"), "utf8")).toBe("ok");
		await expect(ops.writeFile(join(cwd, "outside.txt"), "nope")).rejects.toThrow(/allowWrite/);
		await expect(ops.mkdir(join(cwd, "protected", "nested"))).rejects.toThrow(/denyWrite/);
	});

	test("write operations resolve nearest existing symlink parent before policy checks", async () => {
		const cwd = await makeTempDir();
		await mkdir(join(cwd, "denied-write"));
		await mkdir(join(cwd, "denied-read"));
		await symlink(join(cwd, "denied-write"), join(cwd, "write-link"));
		await symlink(join(cwd, "denied-read"), join(cwd, "read-link"));
		const ops = makeWriteOperations(cwd, {
			cwd,
			denyRead: ["denied-read"],
			denyWrite: ["denied-write"],
			allowWrite: ["."],
			networkMode: "open",
		});

		await expect(ops.writeFile(join(cwd, "write-link", "new.txt"), "nope")).rejects.toThrow(/denyWrite/);
		await expect(ops.writeFile(join(cwd, "read-link", "new.txt"), "nope")).rejects.toThrow(/denyRead/);
		await expect(ops.mkdir(join(cwd, "write-link", "nested"))).rejects.toThrow(/denyWrite/);
		await expect(ops.mkdir(join(cwd, "read-link", "nested"))).rejects.toThrow(/denyRead/);
	});

	test("glob deny catches a symlinked leaf via its lexical name (G1)", async () => {
		// A symlinked leaf (key.pem -> key) canonicalizes to `key`, so a `*.pem`
		// glob deny would miss it if matched only against the canonical target.
		// The matcher must test the lexical absolute path too.
		const cwd = await makeTempDir();
		await writeFile(join(cwd, "key"), "real-key-content");
		await symlink("key", join(cwd, "key.pem"));
		const policy = {
			cwd,
			denyRead: ["~/.ssh"],
			denyWrite: ["*.pem", "*.key"],
			allowWrite: ["."],
			networkMode: "open" as const,
		};
		// Writing the symlinked key.pem must block on *.pem via its lexical name.
		await expect(makeWriteOperations(cwd, policy).writeFile(join(cwd, "key.pem"), "x")).rejects.toThrow(/denyWrite.*\*\.pem/);
		// Reading must block on *.pem via lexical name.
		await expect(makeReadOperations(cwd, { ...policy, denyRead: ["*.pem"] }).readFile(join(cwd, "key.pem"))).rejects.toThrow(/denyRead.*\*\.pem/);
	});

	test("edit operations require both read and write permission", async () => {
		const cwd = await makeTempDir();
		await mkdir(join(cwd, "writable"));
		await mkdir(join(cwd, "secret-dir"));
		await writeFile(join(cwd, "writable", "doc.txt"), "before");
		await writeFile(join(cwd, "secret-dir", "doc.txt"), "secret");
		const ops = makeEditOperations(cwd, policyFor(cwd));

		expect((await ops.readFile(join(cwd, "writable", "doc.txt"))).toString()).toBe("before");
		await ops.writeFile(join(cwd, "writable", "doc.txt"), "after");
		expect(await readFile(join(cwd, "writable", "doc.txt"), "utf8")).toBe("after");
		await expect(ops.readFile(join(cwd, "secret-dir", "doc.txt"))).rejects.toThrow(/denyRead/);
		await expect(ops.access(join(cwd, "protected.txt"))).rejects.toThrow(/denyWrite/);
	});

	test("hardlink alias to a denied file bypasses in-process policy — guard at session_start (re-review loop 2)", async () => {
		// The in-process file tools use pathname/canonical-realpath checks, which
		// cannot distinguish a hardlink alias (same inode, different pathname). The
		// session_start hardlink guard (assertNoHardlinkedDeniedFiles) must fail
		// closed before installing the policy. This test documents that the guard
		// fires; without it, readFile(alias) would leak the denied file's contents
		// and writeFile(alias) would mutate it.
		const cwd = await makeTempDir();
		await writeFile(join(cwd, ".env"), "SECRET");
		await link(join(cwd, ".env"), join(cwd, "alias"));
		expect(() => assertNoHardlinkedDeniedFiles([".env"], [], cwd)).toThrow(/hard links/);
		expect(() => assertNoHardlinkedDeniedFiles([], [".env"], cwd)).toThrow(/hard links/);
	});
});

describe("buildBwrapArgs", () => {
	test("emits mounts in security-critical overlay order", async () => {
		const cwd = await makeTempDir();
		await mkdir(join(cwd, "writable"));
		await mkdir(join(cwd, "secret-dir"));
		await writeFile(join(cwd, "secret-file"), "secret");
		await mkdir(join(cwd, ".git"));
		await writeFile(join(cwd, ".git", "config"), "[core]\n");

		const args = buildBwrapArgs({
			cwd,
			configCwd: cwd,
			allowWrite: [".", "writable"],
			denyWrite: ["secret-file"],
			denyRead: ["secret-dir", ".git"],
			networkMode: "block",
			env: { PATH: "/usr/bin", OPENAI_API_KEY: "must-not-appear" },
		});

		expect(args[0]).toBe("--clearenv");
		expect(args).not.toContain("OPENAI_API_KEY");
		const root = expectSequence(args, ["--ro-bind", "/", "/"]);
		const dev = expectSequence(args, ["--dev", "/dev"]);
		const proc = expectSequence(args, ["--unshare-pid", "--proc", "/proc"]);
		const cwdBind = expectSequence(args, ["--bind", cwd, cwd]);
		const writableBind = expectSequence(args, ["--bind", join(cwd, "writable"), join(cwd, "writable")]);
		const denyWrite = expectSequence(args, ["--ro-bind", join(cwd, "secret-file"), join(cwd, "secret-file")]);
		const denyDir = expectSequence(args, ["--tmpfs", join(cwd, "secret-dir")]);
		const gitDir = expectSequence(args, ["--tmpfs", join(cwd, ".git")]);
		const network = expectSequence(args, ["--unshare-net"]);

		expect(root).toBeLessThan(dev);
		expect(dev).toBeLessThan(proc);
		expect(proc).toBeLessThan(cwdBind);
		expect(cwdBind).toBeLessThan(writableBind);
		for (const overlay of [denyWrite, denyDir, gitDir]) {
			expect(writableBind).toBeLessThan(overlay);
			expect(overlay).toBeLessThan(network);
		}
	});

	test("block mode masks host Unix-socket dirs to prevent IPC escape", async () => {
		const cwd = await makeTempDir();
		const tmp = realpathSync("/tmp");
		const args = buildBwrapArgs({
			cwd,
			configCwd: cwd,
			allowWrite: ["/tmp"],
			denyRead: [],
			denyWrite: [],
			networkMode: "block",
			env: { PATH: "/usr/bin" },
		});
		expect(args).toContain("--unshare-net");
		// Docker / D-Bus / ssh-agent / X11 socket dirs must be masked with tmpfs so
		// a blocked sandbox cannot reach host IPC services. /run is always masked;
		// /var/run is masked only when it is NOT a symlink to /run (systemd dedup).
		for (const dir of ["/run", tmp, "/tmp/.X11-unix"]) {
			expectSequence(args, ["--tmpfs", dir]);
		}
		expectSequence(args, ["--bind", tmp, tmp]);
		expectSequence(args, ["--tmpfs", tmp]);
		expect(sequenceIndex(args, ["--bind", tmp, tmp])).toBeLessThan(sequenceIndex(args, ["--tmpfs", tmp]));
		// /var/run and /run must not both be emitted when they resolve to the same
		// canonical path — bwrap cannot mount tmpfs on a symlink target and the
		// whole block-mode spawn would fail with exit 1.
		const tmpfsTargets = args.filter((_, i) => args[i - 1] === "--tmpfs");
		const canonical = (p: string) => {
			try { return realpathSync(p); } catch { return p; }
		};
		const distinct = new Set(tmpfsTargets.map(canonical));
		expect(distinct.has(canonical("/var/tmp"))).toBe(true);
		expect(tmpfsTargets.length).toBe(distinct.size);
	});

	test("block mode forces TMPDIR to the private /tmp tmpfs", async () => {
		const cwd = await makeTempDir();
		const openArgs = buildBwrapArgs({
			cwd,
			configCwd: cwd,
			allowWrite: [],
			denyRead: [],
			denyWrite: [],
			networkMode: "open",
			env: { PATH: "/usr/bin", TMPDIR: "/host/tmp" },
		});
		const blockArgs = buildBwrapArgs({
			cwd,
			configCwd: cwd,
			allowWrite: [],
			denyRead: [],
			denyWrite: [],
			networkMode: "block",
			env: { PATH: "/usr/bin", TMPDIR: "/host/tmp" },
		});

		expectSequence(openArgs, ["--setenv", "TMPDIR", "/host/tmp"]);
		expectSequence(blockArgs, ["--setenv", "TMPDIR", "/tmp"]);
		expect(blockArgs).not.toContain("/host/tmp");
	});

	integrationTest("block mode actually spawns bwrap without failing (regression: /var/run symlink)", async () => {
		// On systemd Linux /var/run -> /run. bwrap --tmpfs /var/run fails with
		// "Can't mount tmpfs on .../var/run" and the spawn exits 1. This test runs
		// the real bwrap binary so the arg-list-only check above can't mask a real
		// mount failure. Skipped when bwrap is unavailable.
		const bwrap = findExecutableOnPath("bwrap", process.env);
		const cwd = await makeRepoTempDir();
		const args = [
			...buildBwrapArgs({
				cwd,
				configCwd: cwd,
				allowWrite: [],
				denyRead: [],
				denyWrite: [],
				networkMode: "block",
				env: { PATH: "/usr/bin", HOME: "/tmp", TMPDIR: "/tmp" },
			}),
			"--",
			"bash",
			"-c",
			"echo BLOCK_MODE_OK",
		];
		const result = spawnSync(bwrap, args, { encoding: "utf8" });
		expect(result.status).toBe(0);
		expect(result.stdout.trim()).toBe("BLOCK_MODE_OK");
	});

	test("open mode does not add Unix-socket masks (host net intact)", async () => {
		const cwd = await makeTempDir();
		const args = buildBwrapArgs({
			cwd,
			configCwd: cwd,
			allowWrite: [],
			denyRead: [],
			denyWrite: [],
			networkMode: "open",
			env: { PATH: "/usr/bin" },
		});
		expect(args).not.toContain("--unshare-net");
		expect(args).not.toContain("/run");
	});

	test("adds bwrap die-with-parent so wrapper death kills the wrapped command", async () => {
		const cwd = await makeTempDir();
		const args = buildBwrapArgs({
			cwd,
			configCwd: cwd,
			allowWrite: [],
			denyRead: [],
			denyWrite: [],
			networkMode: "open",
			env: { PATH: "/usr/bin" },
		});

		expect(args).toContain("--die-with-parent");
		expect(sequenceIndex(args, ["--unshare-pid", "--proc", "/proc"])).toBeGreaterThanOrEqual(0);
	});

	test("nested deny overlays are emitted parent-first so child protections win", async () => {
		const cwd = await makeTempDir();
		await mkdir(join(cwd, "secret", "sub"), { recursive: true });

		const childFirst = buildBwrapArgs({
			cwd,
			configCwd: cwd,
			allowWrite: ["."],
			denyRead: ["secret/sub", "secret"],
			denyWrite: ["secret/sub"],
			networkMode: "open",
			env: { PATH: "/usr/bin" },
		});
		const parentFirst = buildBwrapArgs({
			cwd,
			configCwd: cwd,
			allowWrite: ["."],
			denyRead: ["secret", "secret/sub"],
			denyWrite: ["secret/sub"],
			networkMode: "open",
			env: { PATH: "/usr/bin" },
		});

		for (const args of [childFirst, parentFirst]) {
			const parentMask = expectSequence(args, ["--tmpfs", join(cwd, "secret")]);
			const childMask = expectSequence(args, ["--tmpfs", join(cwd, "secret", "sub")]);
			const childReadOnly = expectSequence(args, ["--remount-ro", join(cwd, "secret", "sub")]);
			expect(parentMask).toBeLessThan(childMask);
			expect(childMask).toBeLessThan(childReadOnly);
		}
	});

	test("skips non-existent deny paths without host stubs", async () => {
		const cwd = await makeTempDir();
		const missingRead = join(cwd, "missing-read");
		const missingWrite = join(cwd, "missing-write");

		const args = buildBwrapArgs({
			cwd,
			configCwd: cwd,
			allowWrite: [],
			denyRead: ["missing-read"],
			denyWrite: ["missing-write"],
			networkMode: "open",
			env: { PATH: "/usr/bin" },
		});

		expect(args).not.toContain(missingRead);
		expect(args).not.toContain(missingWrite);
		expect(sequenceIndex(args, ["--ro-bind", "/dev/null", missingRead])).toBe(-1);
		expect(sequenceIndex(args, ["--tmpfs", missingRead])).toBe(-1);
		expect(sequenceIndex(args, ["--ro-bind", missingWrite, missingWrite])).toBe(-1);
	});

	test("denied files use /dev/null overlays and denied directories use tmpfs overlays", async () => {
		const cwd = await makeTempDir();
		await mkdir(join(cwd, "secret-dir"));
		await writeFile(join(cwd, "secret-file"), "secret");

		const args = buildBwrapArgs({
			cwd,
			configCwd: cwd,
			allowWrite: ["."],
			denyWrite: [],
			denyRead: ["secret-dir", "secret-file"],
			networkMode: "open",
			env: { PATH: "/usr/bin" },
		});

		expectSequence(args, ["--tmpfs", join(cwd, "secret-dir")]);
		expectSequence(args, ["--ro-bind", "/dev/null", join(cwd, "secret-file")]);
	});

	test("denyRead plus denyWrite directories are masked read-only", async () => {
		const cwd = await makeTempDir();
		await mkdir(join(cwd, "secret"));

		const args = buildBwrapArgs({
			cwd,
			configCwd: cwd,
			allowWrite: ["."],
			denyWrite: ["secret"],
			denyRead: ["secret"],
			networkMode: "open",
			env: { PATH: "/usr/bin" },
		});

		const tmpfs = expectSequence(args, ["--tmpfs", join(cwd, "secret")]);
		const remount = expectSequence(args, ["--remount-ro", join(cwd, "secret")]);
		expect(tmpfs).toBeLessThan(remount);
	});

	test("open and block network modes map to the expected bwrap argv", async () => {
		const cwd = await makeTempDir();
		const openArgs = buildBwrapArgs({ cwd, configCwd: cwd, allowWrite: [], denyRead: [], denyWrite: [], networkMode: "open", env: { PATH: "/usr/bin" } });
		const blockArgs = buildBwrapArgs({ cwd, configCwd: cwd, allowWrite: [], denyRead: [], denyWrite: [], networkMode: "block", env: { PATH: "/usr/bin" } });

		expect(openArgs).not.toContain("--unshare-net");
		expect(blockArgs).toContain("--unshare-net");
	});

	test("filter mode fails closed instead of silently loosening to open", async () => {
		const cwd = await makeTempDir();
		expect(() => buildBwrapArgs({ cwd, configCwd: cwd, allowWrite: [], denyRead: [], denyWrite: [], networkMode: "filter", env: { PATH: "/usr/bin" } })).toThrow(/filter is deferred/);
	});

	test("relative config paths resolve against the session cwd", async () => {
		const cwd = await makeTempDir();
		await writeFile(join(cwd, "relative-secret"), "secret");
		const packageRelative = resolve("relative-secret");

		const args = buildBwrapArgs({
			cwd,
			configCwd: cwd,
			allowWrite: [],
			denyWrite: [],
			denyRead: ["relative-secret"],
			networkMode: "open",
			env: { PATH: "/usr/bin" },
		});

		expectSequence(args, ["--ro-bind", "/dev/null", join(cwd, "relative-secret")]);
		expect(args).not.toContain(packageRelative);
	});

	test("canonicalizes existing symlink paths before emitting mounts", async () => {
		const cwd = await makeTempDir();
		const outside = await makeTempDir();
		await mkdir(join(outside, "secret-dir"));
		await writeFile(join(outside, "secret-dir", "secret.txt"), "secret");
		await symlink(join(outside, "secret-dir"), join(cwd, "secret-link"));

		const args = buildBwrapArgs({
			cwd,
			configCwd: cwd,
			allowWrite: ["."],
			denyWrite: [],
			denyRead: ["secret-link"],
			networkMode: "open",
			env: { PATH: "/usr/bin" },
		});

		expectSequence(args, ["--tmpfs", join(outside, "secret-dir")]);
		expect(args).not.toContain(join(cwd, "secret-link"));
	});

	test("refuses to start when a denied regular file has a hardlink alias (re-review)", async () => {
		// bwrap path overlays protect a pathname, not the underlying inode. A
		// hardlink alias inside an allowWrite root reaches the same inode as a
		// denied file, bypassing both denyRead and denyWrite. Fail closed (throw)
		// rather than start a sandbox whose deny overlay can be sidestepped.
		const cwd = await makeTempDir();
		await writeFile(join(cwd, ".env"), "secret");
		await link(join(cwd, ".env"), join(cwd, "alias")); // hardlink: same inode, nlink=2

		expect(() =>
			buildBwrapArgs({
				cwd,
				configCwd: cwd,
				allowWrite: ["."],
				denyRead: [],
				denyWrite: [".env"],
				networkMode: "open",
				env: { PATH: "/usr/bin" },
			}),
		).toThrow(/hard links/);

		// denyRead variant: reading through the alias would leak the secret too.
		expect(() =>
			buildBwrapArgs({
				cwd,
				configCwd: cwd,
				allowWrite: ["."],
				denyRead: [".env"],
				denyWrite: [],
				networkMode: "open",
				env: { PATH: "/usr/bin" },
			}),
		).toThrow(/hard links/);

		// A non-hardlinked denied file starts normally.
		const cleanCwd = await makeTempDir();
		await writeFile(join(cleanCwd, ".env"), "secret");
		expect(() =>
			buildBwrapArgs({
				cwd: cleanCwd,
				configCwd: cleanCwd,
				allowWrite: ["."],
				denyRead: [],
				denyWrite: [".env"],
				networkMode: "open",
				env: { PATH: "/usr/bin" },
			}),
		).not.toThrow();
	});

	test("refuses to start when a file inside a denied DIRECTORY has a hardlink alias (re-review loop 2)", async () => {
		// A denied directory's tmpfs/ro-bind overlay protects the directory
		// pathname, but a hardlink alias to a file inside it (created before the
		// sandbox started) reaches the same inode outside the overlay. The guard
		// must walk denied directories recursively, not just check explicitly-denied
		// files.
		const cwd = await makeTempDir();
		await mkdir(join(cwd, "secret"));
		await writeFile(join(cwd, "secret", "file"), "TOPSECRET");
		await link(join(cwd, "secret", "file"), join(cwd, "alias")); // hardlink inside the denied dir

		// denyRead via directory: reading through the alias would leak.
		expect(() =>
			buildBwrapArgs({
				cwd,
				configCwd: cwd,
				allowWrite: ["."],
				denyRead: ["secret"],
				denyWrite: [],
				networkMode: "open",
				env: { PATH: "/usr/bin" },
			}),
		).toThrow(/hard links/);

		// denyWrite via directory: writing through the alias would mutate.
		expect(() =>
			buildBwrapArgs({
				cwd,
				configCwd: cwd,
				allowWrite: ["."],
				denyRead: [],
				denyWrite: ["secret"],
				networkMode: "open",
				env: { PATH: "/usr/bin" },
			}),
		).toThrow(/hard links/);

		// A denied directory with no hardlinks starts normally.
		const cleanCwd = await makeTempDir();
		await mkdir(join(cleanCwd, "secret"));
		await writeFile(join(cleanCwd, "secret", "file"), "secret");
		expect(() =>
			buildBwrapArgs({
				cwd: cleanCwd,
				configCwd: cleanCwd,
				allowWrite: ["."],
				denyRead: ["secret"],
				denyWrite: [],
				networkMode: "open",
				env: { PATH: "/usr/bin" },
			}),
		).not.toThrow();
	});

	test("walkForHardlinks does NOT follow symlinks (re-review loop 3)", async () => {
		// A denied directory containing a symlink to /usr (or a cycle) must NOT
		// cause unbounded traversal. lstatSync (not statSync) is used so symlinks
		// are skipped — a hardlink alias points to a real inode, not a symlink target.
		const cwd = await makeTempDir();
		await mkdir(join(cwd, ".env"));
		await symlink("/usr", join(cwd, ".env", "usr-link"));
		// Must not throw (no hardlink found) and must complete quickly (no /usr walk).
		expect(() =>
			buildBwrapArgs({
				cwd,
				configCwd: cwd,
				allowWrite: ["."],
				denyRead: [".env"],
				denyWrite: [],
				networkMode: "open",
				env: { PATH: "/usr/bin" },
			}),
		).not.toThrow();
	});

	test("walkForHardlinks fails closed on unreadable denied directory (re-review loop 3)", async () => {
		// An unreadable denied directory cannot be inspected for hardlink aliases,
		// so refuse to start rather than silently skip (which would leave a bypass
		// open for hardlink aliases to files inside it).
		const cwd = await makeTempDir();
		await mkdir(join(cwd, "secret"));
		await writeFile(join(cwd, "secret", "file"), "TOPSECRET");
		await link(join(cwd, "secret", "file"), join(cwd, "alias"));
		await chmod(join(cwd, "secret"), 0o000);
		try {
			expect(() =>
				buildBwrapArgs({
					cwd,
					configCwd: cwd,
					allowWrite: ["."],
					denyRead: ["secret"],
					denyWrite: [],
					networkMode: "open",
					env: { PATH: "/usr/bin" },
				}),
			).toThrow(/cannot inspect denied directory/);
		} finally {
			await chmod(join(cwd, "secret"), 0o755); // restore for cleanup
		}
	});

	test("glob-denied hardlinked files are caught by the guard (re-review loop 3)", async () => {
		// A glob deny entry like *.pem can't be canonicalized as a literal path, so
		// the guard must expand it by scanning the glob's parent dir for matches.
		// Without this, a hardlink alias to secret.pem bypasses the guard.
		const cwd = await makeTempDir();
		await writeFile(join(cwd, "secret.pem"), "SECRET");
		await link(join(cwd, "secret.pem"), join(cwd, "alias"));
		expect(() =>
			buildBwrapArgs({
				cwd,
				configCwd: cwd,
				allowWrite: ["."],
				denyRead: ["*.pem"],
				denyWrite: ["*.pem"],
				networkMode: "open",
				env: { PATH: "/usr/bin" },
			}),
		).toThrow(/hard links/);
		// A non-hardlinked *.pem file starts normally.
		const cleanCwd = await makeTempDir();
		await writeFile(join(cleanCwd, "clean.pem"), "secret");
		expect(() =>
			buildBwrapArgs({
				cwd: cleanCwd,
				configCwd: cleanCwd,
				allowWrite: ["."],
				denyRead: ["*.pem"],
				denyWrite: [],
				networkMode: "open",
				env: { PATH: "/usr/bin" },
			}),
		).not.toThrow();
	});

	test("glob deny with glob in parent path fails closed (re-review loop 4)", async () => {
		// A glob like `secrets-x/*.pem` has glob chars in a parent segment. The
		// guard cannot enumerate matches without a recursive glob walk; fail closed
		// rather than silently skip (which would leave a hardlink bypass open).
		const cwd = await makeTempDir();
		await mkdir(join(cwd, "secret"));
		await writeFile(join(cwd, "secret", "key.pem"), "SECRET");
		expect(() =>
			buildBwrapArgs({
				cwd,
				configCwd: cwd,
				allowWrite: ["."],
				denyRead: ["secret-*/  *.pem".replace(" ", "")],
				denyWrite: [],
				networkMode: "open",
				env: { PATH: "/usr/bin" },
			}),
		).toThrow(/glob characters in a parent directory path/);
	});
});

describe("bwrap integration", () => {
	integrationTest("allowWrite permits configured writable roots", async () => {
		const cwd = await makeTempDir();
		await mkdir(join(cwd, "writable"));

		const result = runSandboxed("echo ok > writable/out.txt", {
			cwd,
			allowWrite: ["writable"],
			denyRead: [],
			denyWrite: [],
			networkMode: "open",
		});

		expect(result.exitCode).toBe(0);
		expect(await readFile(join(cwd, "writable", "out.txt"), "utf8")).toBe("ok\n");
	});

	integrationTest("denyWrite prevents writes to protected existing files and directories", async () => {
		const cwd = await makeTempDir();
		await writeFile(join(cwd, "protected.txt"), "original\n");
		await mkdir(join(cwd, "protected-dir"));

		const fileResult = runSandboxed("echo changed > protected.txt", {
			cwd,
			allowWrite: ["."],
			denyRead: [],
			denyWrite: ["protected.txt"],
			networkMode: "open",
		});
		const dirResult = runSandboxed("touch protected-dir/new-file", {
			cwd,
			allowWrite: ["."],
			denyRead: [],
			denyWrite: ["protected-dir"],
			networkMode: "open",
		});

		expect(fileResult.exitCode).not.toBe(0);
		expect(dirResult.exitCode).not.toBe(0);
		expect(await readFile(join(cwd, "protected.txt"), "utf8")).toBe("original\n");
	});

	integrationTest("denyRead masks files and directories after cwd allow mounts while preserving host contents", async () => {
		const cwd = await makeTempDir();
		await mkdir(join(cwd, "secret-dir"));
		await writeFile(join(cwd, "secret-dir", "inside.txt"), "secret\n");
		await writeFile(join(cwd, "secret-file"), "secret\n");

		const result = runSandboxed("test ! -e secret-dir/inside.txt && test ! -s secret-file", {
			cwd,
			allowWrite: ["."],
			denyRead: ["secret-dir", "secret-file"],
			denyWrite: [],
			networkMode: "open",
		});

		expect(result.exitCode).toBe(0);
		expect(await readFile(join(cwd, "secret-dir", "inside.txt"), "utf8")).toBe("secret\n");
		expect(await readFile(join(cwd, "secret-file"), "utf8")).toBe("secret\n");
	});

	integrationTest("denyRead plus denyWrite directory mask is not writable", async () => {
		const cwd = await makeTempDir();
		await mkdir(join(cwd, "secret"));
		await writeFile(join(cwd, "secret", "inside.txt"), "secret\n");

		const result = runSandboxed("echo ok > secret/new.txt", {
			cwd,
			allowWrite: ["."],
			denyRead: ["secret"],
			denyWrite: ["secret"],
			networkMode: "open",
		});

		expect(result.exitCode).not.toBe(0);
		expect(await readFile(join(cwd, "secret", "inside.txt"), "utf8")).toBe("secret\n");
	});

	integrationTest("nested denyRead parent cannot hide child denyWrite protection", async () => {
		for (const denyRead of [["secret/sub", "secret"], ["secret", "secret/sub"]]) {
			const cwd = await makeTempDir();
			await mkdir(join(cwd, "secret", "sub"), { recursive: true });
			await writeFile(join(cwd, "secret", "sub", "inside.txt"), "secret\n");

			const result = runSandboxed("printf started && mkdir -p secret/sub && ! (echo ok > secret/sub/new.txt)", {
				cwd,
				allowWrite: ["."],
				denyRead,
				denyWrite: ["secret/sub"],
				networkMode: "open",
			});

			expect(text(result.stdout)).toContain("started");
			expect(result.exitCode).toBe(0);
			expect(await readFile(join(cwd, "secret", "sub", "inside.txt"), "utf8")).toBe("secret\n");
		}
	});

	integrationTest("existing .git directory is masked as a directory without ENOTDIR bricking", async () => {
		const cwd = await makeTempDir();
		await mkdir(join(cwd, ".git"));
		await writeFile(join(cwd, ".git", "config"), "[core]\n");

		const result = runSandboxed("test -d .git && test ! -e .git/config", {
			cwd,
			allowWrite: ["."],
			denyRead: [".git"],
			denyWrite: [],
			networkMode: "open",
		});

		expect(result.exitCode).toBe(0);
		expect(await readFile(join(cwd, ".git", "config"), "utf8")).toBe("[core]\n");
	});

	integrationTest("block mode cannot reach a localhost listener and open mode can", async () => {
		const cwd = await makeRepoTempDir();
		const server = Bun.listen({
			hostname: "127.0.0.1",
			port: 0,
			socket: {
				open(socket) {
					socket.write("ok");
					socket.end();
				},
				data() {
					// The test only needs the connection to open and receive the greeting.
				},
			},
		});
		try {
			const port = server.port;
			const command = `: < /dev/tcp/127.0.0.1/${port}`;
			const openResult = runSandboxed(command, { cwd, configCwd: cwd, allowWrite: [], denyRead: [], denyWrite: [], networkMode: "open" });
			const blockResult = runSandboxed(command, { cwd, configCwd: cwd, allowWrite: [], denyRead: [], denyWrite: [], networkMode: "block" });

			expect(openResult.exitCode).toBe(0);
			expect(blockResult.exitCode).not.toBe(0);
		} finally {
			server.stop(true);
		}
	});

	integrationTest("block mode cannot reach host Unix sockets under /tmp", async () => {
		const cwd = await makeRepoTempDir();
		const socketDir = await mkdtemp(join(tmpdir(), "ssh-pi-sandbox-test-"));
		tempDirs.push(socketDir);
		const socketPath = join(socketDir, `agent.${process.pid}`);
		const clientPath = join(cwd, "socket-client.mjs");
		await writeFile(clientPath, `
import { createConnection } from "node:net";
const socketPath = process.argv[2];
const socket = createConnection(socketPath);
const timeout = setTimeout(() => {
	console.error("timeout");
	socket.destroy();
	process.exit(3);
}, 1000);
socket.once("connect", () => {
	clearTimeout(timeout);
	socket.end();
	process.exit(0);
});
socket.once("error", (error) => {
	clearTimeout(timeout);
	console.error(error.code ?? error.message);
	process.exit(2);
});
`);

		const server = createServer((socket) => {
			socket.end("ok");
		});
		await new Promise<void>((resolveListen, rejectListen) => {
			server.once("error", rejectListen);
			server.listen(socketPath, () => {
				server.off("error", rejectListen);
				resolveListen();
			});
		});

		try {
			const command = `${shellQuote(process.execPath)} ${shellQuote(clientPath)} ${shellQuote(socketPath)}`;
			const openResult = runSandboxed(command, { cwd, configCwd: cwd, allowWrite: [], denyRead: [], denyWrite: [], networkMode: "open" });
			const blockResult = runSandboxed(command, { cwd, configCwd: cwd, allowWrite: [], denyRead: [], denyWrite: [], networkMode: "block" });

			expect(openResult.exitCode).toBe(0);
			expect(blockResult.exitCode).not.toBe(0);
			expect(text(blockResult.stderr)).toContain("ENOENT");
		} finally {
			await new Promise<void>((resolveClose) => server.close(() => resolveClose()));
		}
	});

	integrationTest("block mode forces TMPDIR to a writable private /tmp", async () => {
		const cwd = await makeRepoTempDir();
		const result = runSandboxed("test \"$TMPDIR\" = /tmp && dir=$(mktemp -d) && case \"$dir\" in /tmp/*) touch \"$dir/file\" ;; *) exit 9 ;; esac", {
			cwd,
			configCwd: cwd,
			allowWrite: [],
			denyRead: [],
			denyWrite: [],
			networkMode: "block",
		}, { ...process.env, TMPDIR: "/host/tmp" });

		expect(result.exitCode).toBe(0);
	});

	integrationTest("PID namespace and fresh /proc hide host process metadata", async () => {
		const cwd = await makeTempDir();
		const result = runSandboxed(`test ! -e /proc/${process.pid} && test -d /proc/1`, {
			cwd,
			allowWrite: [],
			denyRead: [],
			denyWrite: [],
			networkMode: "open",
		});

		expect(result.exitCode).toBe(0);
	});

	integrationTest("sandboxed bash env omits provider/auth secrets", async () => {
		const cwd = await makeTempDir();
		const env = {
			...process.env,
			OPENAI_API_KEY: "openai-secret",
			ANTHROPIC_API_KEY: "anthropic-secret",
			ANTHROPIC_AUTH_TOKEN: "anthropic-token",
			ZAI_API_KEY: "zai-secret",
		};

		const result = runSandboxed("env", {
			cwd,
			allowWrite: [],
			denyRead: [],
			denyWrite: [],
			networkMode: "open",
		}, env);
		const output = text(result.stdout);

		expect(result.exitCode).toBe(0);
		expect(output).toContain("PATH=");
		expect(output).not.toContain("OPENAI_API_KEY");
		expect(output).not.toContain("ANTHROPIC_API_KEY");
		expect(output).not.toContain("ANTHROPIC_AUTH_TOKEN");
		expect(output).not.toContain("ZAI_API_KEY");
		expect(output).not.toContain("openai-secret");
		expect(output).not.toContain("anthropic-secret");
		expect(output).not.toContain("zai-secret");
	});

	integrationTest("symlink to a denied path resolves to the masked canonical target", async () => {
		const cwd = await makeTempDir();
		const outside = await makeTempDir();
		await mkdir(join(outside, "secret-dir"));
		await writeFile(join(outside, "secret-dir", "secret.txt"), "secret");
		await symlink(join(outside, "secret-dir"), join(cwd, "secret-link"));

		const result = runSandboxed("test ! -e secret-link/secret.txt", {
			cwd,
			allowWrite: ["."],
			denyRead: [join(outside, "secret-dir")],
			denyWrite: [],
			networkMode: "open",
		});

		expect(result.exitCode).toBe(0);
		expect(await readFile(join(outside, "secret-dir", "secret.txt"), "utf8")).toBe("secret");
	});
});
