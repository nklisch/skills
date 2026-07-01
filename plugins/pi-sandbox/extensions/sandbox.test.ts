import { afterEach, describe, expect, test } from "bun:test";
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import {
	buildBwrapArgs,
	buildMinimalEnv,
	shouldBypassSandbox,
	type BuildBwrapArgsOptions,
	validateBwrapInit,
} from "./sandbox-bwrap";
import {
	DEFAULT_CONFIG,
	FILTER_DEFERRED_BACKLOG_ITEM,
	applyBypassToolDefaults,
	createSandboxCommandHandler,
	decideToolPolicy,
	deepMerge,
	loadConfig,
	mergeProjectAdditive,
	scrubEnv,
	validateConfig,
	type LoadedConfig,
	type SandboxConfig,
} from "./sandbox-config";
import {
	createFailClosedPolicy,
	enforceDenyRead,
	enforceWritePolicy,
	makeEditOperations,
	makeReadOperations,
	makeWriteOperations,
	type SandboxPolicy,
} from "./sandbox-file-policy";

const tempDirs: string[] = [];
const bwrapPath = "/usr/bin/bwrap";
const isLinux = process.platform === "linux";
const hasBwrap = isLinux && Bun.spawnSync([bwrapPath, "--version"], { stdout: "pipe", stderr: "pipe" }).success;
const integrationTest = isLinux && hasBwrap ? test : test.skip;

async function makeTempDir(): Promise<string> {
	const dir = await mkdtemp(join(tmpdir(), "pi-sandbox-test-"));
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
		...buildBwrapArgs({ ...opts, env: minimalEnv }),
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
});

describe("extension init validation", () => {
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
		expect(merged.filesystem?.allowWrite).toEqual(["allowed"]);
		expect(merged.network?.mode).toBe("filter");
		expect(merged.network?.allowedDomains).toEqual(["a.example"]);
		expect(merged.network?.deniedDomains).toEqual(["bad.example", "worse.example"]);
		expect(merged.tools?.default).toBe("confirm");
		expect(merged.tools?.rules).toEqual({ bash: "block", read: "block" });
		expect(warnings.join("\n")).toContain("disable sandbox");
		expect(warnings.join("\n")).toContain("loosen network.mode");
		expect(warnings.join("\n")).toContain("loosen tool policy");
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

		const subsetWarnings: string[] = [];
		const subset = mergeProjectAdditive(
			{
				enabled: true,
				tools: { default: "allow", rules: {}, inspector: { scanFields: { agent_send: ["body", "to"] } } },
			},
			{ tools: { inspector: { scanFields: { agent_send: ["to"] } } } },
			subsetWarnings,
		);
		expect(subset.tools?.inspector?.scanFields?.agent_send).toEqual(["body", "to"]);
		expect(subsetWarnings.join("\n")).toContain("drop inspector scanFields for \"agent_send\" (body)");

		const addWarnings: string[] = [];
		const added = mergeProjectAdditive(
			{
				enabled: true,
				tools: { default: "allow", rules: {}, inspector: { scanFields: { agent_send: ["body"] } } },
			},
			{ tools: { inspector: { scanFields: { agent_send: ["body", "query"] } } } },
			addWarnings,
		);
		expect(added.tools?.inspector?.scanFields?.agent_send).toEqual(["body", "query"]);
		expect(addWarnings).toEqual([]);
	});

	test("bypass-tool defaults require confirmation for background and monitor", () => {
		const rules = applyBypassToolDefaults({ default: "allow", rules: {} });

		expect(rules.rules?.background).toBe("confirm");
		expect(rules.rules?.monitor).toBe("confirm");
	});

	test("project config cannot lower global bypass-tool policy but can tighten it", () => {
		const loosenWarnings: string[] = [];
		const loosened = mergeProjectAdditive(
			{
				enabled: true,
				tools: applyBypassToolDefaults({ default: "allow", rules: { background: "confirm", monitor: "block" } }),
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
				tools: applyBypassToolDefaults({ default: "allow", rules: { background: "confirm", monitor: "confirm" } }),
			},
			{ tools: { rules: { background: "block" } } },
			tightenWarnings,
		);

		expect(tightened.tools?.rules?.background).toBe("block");
		expect(tightened.tools?.rules?.monitor).toBe("confirm");
		expect(tightenWarnings).toEqual([]);
	});

	test("confirm bypass-tool policy fails closed when no UI is available", () => {
		const background = decideToolPolicy("background", { default: "allow", rules: { background: "confirm" } }, false);
		const monitor = decideToolPolicy("monitor", { default: "allow", rules: { monitor: "confirm" } }, false);

		expect(background.action).toBe("block");
		expect(background.reason).toContain("requires confirmation");
		expect(monitor.action).toBe("block");
		expect(monitor.reason).toContain("requires confirmation");
	});

	test("loadConfig applies bypass-tool defaults to the effective tool policy", async () => {
		const cwd = await makeTempDir();
		const loaded = loadConfig(cwd, { agentDir: join(cwd, "missing-agent-dir") });

		expect(loaded.config.tools?.rules?.background).toBe("confirm");
		expect(loaded.config.tools?.rules?.monitor).toBe("confirm");
	});

	test("loadConfig preserves an intentional global bypass-tool opt-out", async () => {
		const cwd = await makeTempDir();
		const agentDir = await makeTempDir();
		await mkdir(join(agentDir, "extensions"), { recursive: true });
		await writeFile(join(agentDir, "extensions", "sandbox.json"), JSON.stringify({
			tools: { rules: { background: "allow", monitor: "block" } },
		}));

		const loaded = loadConfig(cwd, { agentDir });

		expect(loaded.config.tools?.rules?.background).toBe("allow");
		expect(loaded.config.tools?.rules?.monitor).toBe("block");
	});

	test("loadConfig blocks project attempts to lower default bypass-tool confirmation", async () => {
		const cwd = await makeTempDir();
		const agentDir = await makeTempDir();
		await mkdir(join(cwd, ".pi"), { recursive: true });
		await writeFile(join(cwd, ".pi", "sandbox.json"), JSON.stringify({
			tools: { rules: { background: "allow", monitor: "allow" } },
		}));

		const loaded = loadConfig(cwd, { agentDir });

		expect(loaded.config.tools?.rules?.background).toBe("confirm");
		expect(loaded.config.tools?.rules?.monitor).toBe("confirm");
		expect(loaded.additiveWarnings.join("\n")).toContain("background");
		expect(loaded.additiveWarnings.join("\n")).toContain("monitor");
	});

	test("loadConfig lets projects tighten bypass tools to block", async () => {
		const cwd = await makeTempDir();
		const agentDir = await makeTempDir();
		await mkdir(join(cwd, ".pi"), { recursive: true });
		await writeFile(join(cwd, ".pi", "sandbox.json"), JSON.stringify({
			tools: { rules: { background: "block" } },
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
		expect(loaded.config.filesystem?.denyRead).toEqual(["global-secret", "project-secret"]);
		expect(loaded.config.filesystem?.denyWrite).toEqual(["global-protected", "project-protected"]);
		expect(loaded.config.filesystem?.allowWrite).toEqual(["allowed"]);
		expect(loaded.config.network?.mode).toBe("block");
		expect(loaded.config.network?.allowedDomains).toEqual(["a.example"]);
		expect(loaded.config.network?.deniedDomains).toEqual(["bad.example", "worse.example"]);
		expect(loaded.config.envScrub?.names).toEqual(["ANTHROPIC_AUTH_TOKEN", "GLOBAL_SECRET", "PROJECT_SECRET"]);
		expect(loaded.config.envScrub?.patterns).toEqual(["GLOBAL_*", "PROJECT_*"]);
		expect(loaded.config.envScrub?.keep).toEqual(["GLOBAL_KEEP", "PROJECT_KEEP"]);
	});

	test("scrubEnv honors config keep entries even when a pattern matches", () => {
		const scrubbedName = "PI_SANDBOX_TEST_REMOVE_TOKEN";
		const keptByConfig = "PI_SANDBOX_TEST_KEEP_TOKEN";
		const keptByProvider = "PI_SANDBOX_TEST_PROVIDER_TOKEN";
		const previous = {
			scrubbed: process.env[scrubbedName],
			configKept: process.env[keptByConfig],
			providerKept: process.env[keptByProvider],
		};
		try {
			process.env[scrubbedName] = "remove-me";
			process.env[keptByConfig] = "keep-me";
			process.env[keptByProvider] = "provider-keep-me";

			const scrubbed = scrubEnv({ patterns: ["PI_SANDBOX_TEST_*_TOKEN"], keep: [keptByConfig] }, [keptByProvider]);

			expect(scrubbed).toEqual([scrubbedName]);
			expect(process.env[scrubbedName]).toBeUndefined();
			expect(process.env[keptByConfig]).toBe("keep-me");
			expect(process.env[keptByProvider]).toBe("provider-keep-me");
		} finally {
			if (previous.scrubbed === undefined) delete process.env[scrubbedName];
			else process.env[scrubbedName] = previous.scrubbed;
			if (previous.configKept === undefined) delete process.env[keptByConfig];
			else process.env[keptByConfig] = previous.configKept;
			if (previous.providerKept === undefined) delete process.env[keptByProvider];
			else process.env[keptByProvider] = previous.providerKept;
		}
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
				inspector: { secrets: [{ name: "broken", pattern: "[", action: "block" }] },
			},
		});

		expect(errors.join("\n")).toContain("network.mode");
		expect(errors.join("\n")).toContain("tools.default");
		expect(errors.join("\n")).toContain("tools.rules.background");
		expect(errors.join("\n")).toContain("filesystem.denyRead[1]");
		expect(errors.join("\n")).toContain("filesystem.denyWrite");
		expect(errors.join("\n")).toContain("network.allowedDomains[1]");
		expect(errors.join("\n")).toContain("tools.inspector.secrets[0].pattern must compile");
	});

	test("invalid network mode, tool policy, and inspector regex load as fail-closed parse errors", async () => {
		const bogusModeCwd = await makeTempDir();
		const bogusToolCwd = await makeTempDir();
		const bogusRegexCwd = await makeTempDir();
		const agentDir = await makeTempDir();
		await mkdir(join(bogusModeCwd, ".pi"), { recursive: true });
		await mkdir(join(bogusToolCwd, ".pi"), { recursive: true });
		await mkdir(join(bogusRegexCwd, ".pi"), { recursive: true });
		await writeFile(join(bogusModeCwd, ".pi", "sandbox.json"), JSON.stringify({ network: { mode: "bogus" } }));
		await writeFile(join(bogusToolCwd, ".pi", "sandbox.json"), JSON.stringify({ tools: { rules: { background: "bogus" } } }));
		await writeFile(join(bogusRegexCwd, ".pi", "sandbox.json"), JSON.stringify({
			tools: { inspector: { secrets: [{ name: "broken", pattern: "[", action: "block" }] } },
		}));

		const bogusMode = loadConfig(bogusModeCwd, { agentDir });
		const bogusTool = loadConfig(bogusToolCwd, { agentDir });
		const bogusRegex = loadConfig(bogusRegexCwd, { agentDir });

		expect(bogusMode.parseErrors.join("\n")).toContain("network.mode");
		expect(bogusTool.parseErrors.join("\n")).toContain("tools.rules.background");
		expect(bogusRegex.parseErrors.join("\n")).toContain("tools.inspector.secrets[0].pattern must compile");
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
		expect(output).toContain("Bypass tools: background=confirm, monitor=confirm");
		expect(output).toContain("Pi extensions/packages");
		expect(output).toContain("background=confirm");
		expect(output).toContain("monitor=confirm");
		expect(output).toContain("agent_send");
		expect(output).toContain("web/search tools");
		expect(output).toContain("subagents");
		expect(output).toContain("provider requests");
		expect(output).toContain("open network mode leaves host networking intact");
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

	test("nested deny overlays are emitted parent-first so child protections win", async () => {
		const cwd = await makeTempDir();
		await mkdir(join(cwd, "secret", "sub"), { recursive: true });

		const childFirst = buildBwrapArgs({
			cwd,
			allowWrite: ["."],
			denyRead: ["secret/sub", "secret"],
			denyWrite: ["secret/sub"],
			networkMode: "open",
			env: { PATH: "/usr/bin" },
		});
		const parentFirst = buildBwrapArgs({
			cwd,
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
		const openArgs = buildBwrapArgs({ cwd, allowWrite: [], denyRead: [], denyWrite: [], networkMode: "open", env: { PATH: "/usr/bin" } });
		const blockArgs = buildBwrapArgs({ cwd, allowWrite: [], denyRead: [], denyWrite: [], networkMode: "block", env: { PATH: "/usr/bin" } });

		expect(openArgs).not.toContain("--unshare-net");
		expect(blockArgs).toContain("--unshare-net");
	});

	test("filter mode fails closed instead of silently loosening to open", async () => {
		const cwd = await makeTempDir();
		expect(() => buildBwrapArgs({ cwd, allowWrite: [], denyRead: [], denyWrite: [], networkMode: "filter", env: { PATH: "/usr/bin" } })).toThrow(/filter is deferred/);
	});

	test("relative config paths resolve against the session cwd", async () => {
		const cwd = await makeTempDir();
		await writeFile(join(cwd, "relative-secret"), "secret");
		const packageRelative = resolve("relative-secret");

		const args = buildBwrapArgs({
			cwd,
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
			allowWrite: ["."],
			denyWrite: [],
			denyRead: ["secret-link"],
			networkMode: "open",
			env: { PATH: "/usr/bin" },
		});

		expectSequence(args, ["--tmpfs", join(outside, "secret-dir")]);
		expect(args).not.toContain(join(cwd, "secret-link"));
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
		const cwd = await makeTempDir();
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
			const openResult = runSandboxed(command, { cwd, allowWrite: [], denyRead: [], denyWrite: [], networkMode: "open" });
			const blockResult = runSandboxed(command, { cwd, allowWrite: [], denyRead: [], denyWrite: [], networkMode: "block" });

			expect(openResult.exitCode).toBe(0);
			expect(blockResult.exitCode).not.toBe(0);
		} finally {
			server.stop(true);
		}
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
