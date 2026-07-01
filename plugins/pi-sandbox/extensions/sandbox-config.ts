import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { decidePlatformState, type NetworkMode } from "./sandbox-bwrap";

// CONFIG_DIR_NAME is hardcoded because pi's TS loader can't resolve the
// package-barrel re-export (".d.ts" declares it but dist/index.js omits it)
// and subpath imports through the package name resolve against dist/index.js
// as a base path. Value is fixed in the package's piConfig.configDir.
const CONFIG_DIR_NAME = ".pi";

export const FILTER_DEFERRED_BACKLOG_ITEM = ".work/backlog/idea-pi-sandbox-filter-tcp-proxy.md";

export interface SandboxFilesystem {
	denyRead?: string[];
	denyWrite?: string[];
	allowWrite?: string[];
}

export interface SandboxNetwork {
	mode?: NetworkMode;
	allowedDomains?: string[];
	deniedDomains?: string[];
}

export type BackgroundTasksSandboxIntegration = "auto" | "off";

export interface BackgroundTasksSandboxConfig {
	/** "auto" routes background-tasks through bwrap when available; "off" is an operator opt-out. */
	sandboxIntegration?: BackgroundTasksSandboxIntegration;
}

/** Extension config for the first-party bwrap backend and in-process tool guards. */
export interface SandboxConfig {
	enabled?: boolean;
	filesystem?: SandboxFilesystem;
	network?: SandboxNetwork;
	tools?: ToolRules;
	envScrub?: EnvScrubConfig;
	backgroundTasks?: BackgroundTasksSandboxConfig;
}

/** Per-tool egress policy, applied via the `tool_call` event. */
export type ToolPolicy = "allow" | "block" | "confirm" | "auto";

/** Action the inspector takes when a secret shape matches. */
export type SecretAction = "block" | "redact";

export interface SecretShape {
	name: string;
	/** RegExp source string. Applied with the `flags` (default "gu"). Do NOT use inline `(?i)` — JS rejects it; set `flags: "giu"` instead. */
	pattern: string;
	action: SecretAction;
	/** Capture group index holding the candidate secret. Default 0 (whole match). */
	secretGroup?: number;
	/** Min Shannon entropy (bits/char) the captured group must exceed to count as a secret. */
	entropy?: number;
	/** Keyword pre-filter: if set, the rule only runs when at least one keyword is present (case-insensitive substring). Cheap false-positive gate. */
	keywords?: string[];
	/** RegExp flags. Default "gu". Use "giu" for case-insensitive matching. */
	flags?: string;
}

export interface SecretAllowlist {
	/** Candidate strings that are never secrets (placeholders, examples). Matched against the captured group. */
	stopwords?: string[];
	/** Regexes; if any matches the captured group, the candidate is ignored. */
	regexes?: string[];
}

export interface ToolInspector {
	/** Secret shapes to match against scanned fields. */
	secrets?: SecretShape[];
	/** What to do when no secret matches. Default: "allow". */
	onNoMatch?: "allow" | "block";
	/** Per-tool field allowlist to scan. "*" (default) = scan all string-valued fields. */
	scanFields?: Record<string, string[] | "*">;
	/** Global allowlist: candidates matching these are never secrets. */
	allowlist?: SecretAllowlist;
}

export interface ToolRules {
	/** Default policy for any tool not listed in `rules`. Default: "allow". */
	default?: ToolPolicy;
	/** Per-tool rules. Key = tool name (built-in or extension-registered). */
	rules?: Record<string, ToolPolicy>;
	/** Inspector config for `auto`-policy tools. */
	inspector?: ToolInspector;
}

export const SANDBOX_FAIL_CLOSED_MESSAGE = "Sandbox failed to initialize and is fail-closed. Fix the error above and /reload, or restart with --no-sandbox to bypass (not recommended).";
export const SANDBOX_UNINITIALIZED_MESSAGE = "Sandbox not yet initialized. If this persists, /reload or restart pi. Use --no-sandbox only if you intentionally want to bypass.";

export interface UserBashDecisionInput {
	noSandbox: boolean;
	disabledViaConfig: boolean;
	osSandboxUnavailable?: boolean;
	failClosed: boolean;
	sandboxEnabled: boolean;
	sandboxInitialized: boolean;
}

export type UserBashDecision =
	| { action: "bypass"; reason?: string }
	| { action: "block-failclosed"; reason: string }
	| { action: "block-uninitialized"; reason: string }
	| { action: "sandboxed" };

export interface BlockedUserBashEventResult {
	result: {
		output: string;
		exitCode: number;
		cancelled: false;
		truncated: false;
	};
}

/** Pure user_bash routing decision. Undefined/fall-through is allowed for intentional bypasses and OS-backend graceful degrade. */
export function decideUserBash(input: UserBashDecisionInput): UserBashDecision {
	if (input.noSandbox || input.disabledViaConfig) return { action: "bypass" };
	if (input.osSandboxUnavailable) {
		return {
			action: "bypass",
			reason: "OS bash sandbox backend unavailable; user_bash runs through pi's local shell backend while in-process file/tool policy remains active.",
		};
	}
	if (input.failClosed) return { action: "block-failclosed", reason: SANDBOX_FAIL_CLOSED_MESSAGE };
	if (!input.sandboxEnabled || !input.sandboxInitialized) return { action: "block-uninitialized", reason: SANDBOX_UNINITIALIZED_MESSAGE };
	return { action: "sandboxed" };
}

/** Pi's user_bash hook blocks by returning a full BashResult replacement. */
export function createUserBashBlockResult(message: string): BlockedUserBashEventResult {
	return {
		result: {
			output: `${message}\n`,
			exitCode: 1,
			cancelled: false,
			truncated: false,
		},
	};
}

export const SHELL_BYPASS_TOOLS = ["background", "monitor"] as const;
export const SHELL_BYPASS_DEFAULT_POLICY: ToolPolicy = "confirm";

export interface BypassToolIntegrationState {
	backgroundTasksSandbox: "active" | "inactive" | "blocked";
	reason?: string;
}

export const DEFAULT_BYPASS_TOOL_INTEGRATION_STATE: BypassToolIntegrationState = {
	backgroundTasksSandbox: "inactive",
	reason: "background-tasks sandbox integration has not been proven active",
};

/**
 * Same-process capability handshake published by background-tasks.
 *
 * Contract key: Symbol.for("@nklisch/pi-sandbox.background-tasks-integration").
 * Use Symbol.for (not Symbol()) so independently loaded extension modules share
 * one globalThis property key inside the same pi process.
 */
export const BACKGROUND_TASKS_SANDBOX_INTEGRATION_SYMBOL_DESCRIPTION = "@nklisch/pi-sandbox.background-tasks-integration";
export const BACKGROUND_TASKS_SANDBOX_INTEGRATION_SYMBOL = Symbol.for(BACKGROUND_TASKS_SANDBOX_INTEGRATION_SYMBOL_DESCRIPTION);

export type BackgroundTasksSandboxIntegrationHandshake =
	| { integrated: true; bridgeState: "loaded" }
	| { integrated: false; reason: "absent" | "broken"; bridgeState?: "absent" | "broken"; message?: string };

export function readBackgroundTasksIntegrationHandshake(): unknown {
	return (globalThis as typeof globalThis & Record<symbol, unknown>)[BACKGROUND_TASKS_SANDBOX_INTEGRATION_SYMBOL];
}

function decideBackgroundTasksHandshakeState(handshake: unknown): BypassToolIntegrationState {
	if (handshake && typeof handshake === "object") {
		const value = handshake as { integrated?: unknown; bridgeState?: unknown; reason?: unknown; message?: unknown };
		if (value.integrated === true && value.bridgeState === "loaded") {
			return { backgroundTasksSandbox: "active", reason: "Linux bwrap integration ready and background-tasks bridge handshake loaded" };
		}
		if (value.integrated === false && (value.reason === "absent" || value.reason === "broken")) {
			const message = typeof value.message === "string" && value.message.length > 0 ? `: ${value.message}` : "";
			return { backgroundTasksSandbox: "inactive", reason: `background-tasks sandbox bridge ${value.reason}${message}` };
		}
	}
	if (handshake === undefined) {
		return { backgroundTasksSandbox: "inactive", reason: "background-tasks sandbox integration handshake missing" };
	}
	return { backgroundTasksSandbox: "inactive", reason: "background-tasks sandbox integration handshake invalid" };
}

export interface BackgroundTasksIntegrationDecisionInput {
	config: SandboxConfig;
	parseErrors?: string[];
	failClosedReasons?: string[];
	platform?: NodeJS.Platform;
	bwrapAvailable?: boolean;
	env?: NodeJS.ProcessEnv;
	backgroundTasksHandshake?: unknown;
}

export function decideBackgroundTasksIntegrationState(input: BackgroundTasksIntegrationDecisionInput): BypassToolIntegrationState {
	const parseErrors = input.parseErrors ?? [];
	if (parseErrors.length > 0) {
		return { backgroundTasksSandbox: "blocked", reason: `config parse error(s): ${parseErrors.join("; ")}` };
	}
	if (input.config.enabled === false) {
		return { backgroundTasksSandbox: "inactive", reason: "sandbox disabled by config" };
	}
	const integration = input.config.backgroundTasks?.sandboxIntegration ?? "auto";
	if (integration === "off") {
		return { backgroundTasksSandbox: "inactive", reason: "backgroundTasks.sandboxIntegration is off" };
	}
	const failClosedReasons = input.failClosedReasons ?? [];
	if (failClosedReasons.length > 0) {
		return { backgroundTasksSandbox: "blocked", reason: failClosedReasons.join("; ") };
	}
	const networkMode = input.config.network?.mode ?? "open";
	const platformState = decidePlatformState({
		networkMode,
		platform: input.platform,
		bwrapAvailable: input.bwrapAvailable,
		env: input.env,
	});
	if (platformState.state === "ok") {
		return decideBackgroundTasksHandshakeState(input.backgroundTasksHandshake);
	}
	if (platformState.state === "degrade") {
		return { backgroundTasksSandbox: "inactive", reason: platformState.message };
	}
	return { backgroundTasksSandbox: "blocked", reason: platformState.message };
}

const TOOL_POLICY_RANK: Record<ToolPolicy, number> = { allow: 0, auto: 1, confirm: 2, block: 3 };

function stricterToolPolicy(a: ToolPolicy, b: ToolPolicy): ToolPolicy {
	return TOOL_POLICY_RANK[a] >= TOOL_POLICY_RANK[b] ? a : b;
}

/**
 * Add state-aware defaults for tools that can spawn shell commands outside the
 * built-in bash path. When background-tasks bwrap integration is provably
 * active, missing rules follow the normal tool default (usually `allow`). In
 * every inactive/blocked/uncertain state, background and monitor are floored at
 * `confirm` (or a stricter configured policy such as `block`). Project config
 * can only tighten these fallback rules via mergeProjectAdditive.
 */
export function applyBypassToolDefaults(
	tools: ToolRules | undefined,
	state: BypassToolIntegrationState = DEFAULT_BYPASS_TOOL_INTEGRATION_STATE,
): ToolRules {
	const defaultPolicy = tools?.default ?? "allow";
	const rules: Record<string, ToolPolicy> = { ...(tools?.rules ?? {}) };
	for (const toolName of SHELL_BYPASS_TOOLS) {
		const configuredPolicy = rules[toolName] ?? defaultPolicy;
		if (state.backgroundTasksSandbox === "active") {
			rules[toolName] = configuredPolicy;
		} else {
			rules[toolName] = stricterToolPolicy(configuredPolicy, SHELL_BYPASS_DEFAULT_POLICY);
		}
	}
	return { ...tools, default: defaultPolicy, rules };
}

export interface ToolPolicyDecision {
	action: "allow" | "block" | "confirm" | "auto";
	policy: ToolPolicy;
	reason?: string;
}

/** Pure tool-egress policy decision used by the runtime hook and tests. */
export function decideToolPolicy(
	name: string,
	tools: ToolRules | undefined,
	hasUI: boolean,
	state: BypassToolIntegrationState = DEFAULT_BYPASS_TOOL_INTEGRATION_STATE,
): ToolPolicyDecision {
	const effectiveTools = applyBypassToolDefaults(tools, state);
	const policy = effectiveTools.rules?.[name] ?? effectiveTools.default ?? "allow";
	if (policy === "allow") return { action: "allow", policy };
	if (policy === "block") {
		return {
			action: "block",
			policy,
			reason: `Blocked by sandbox tool policy: "${name}" is configured as block. This tool is not permitted under the current sandbox egress policy.`,
		};
	}
	if (policy === "confirm" && !hasUI) {
		return {
			action: "block",
			policy,
			reason: `Blocked by sandbox tool policy: "${name}" requires confirmation, but no dialog UI is available.`,
		};
	}
	return { action: policy, policy };
}

export interface InspectionVerdict {
	action: "allow" | "block";
	reason: string;
}

interface CompiledShape {
	name: string;
	re: RegExp;
	action: SecretAction;
	secretGroup: number;
	entropy: number | undefined;
	keywords: string[] | undefined;
}

interface CompiledAllowlist {
	stopwords: Set<string>;
	regexes: RegExp[];
}

/**
 * Shannon entropy in bits/char. Matches gitleaks' `shannonEntropy`.
 * High for random tokens (~4.5+), low for dictionary/placeholder strings (~2-3).
 */
function shannonEntropy(data: string): number {
	if (data.length === 0) return 0;
	const counts = new Map<string, number>();
	for (const ch of data) counts.set(ch, (counts.get(ch) ?? 0) + 1);
	const inv = 1 / data.length;
	let entropy = 0;
	for (const count of counts.values()) {
		const freq = count * inv;
		entropy -= freq * Math.log2(freq);
	}
	return entropy;
}

function withGlobalFlag(flags: string | undefined): string {
	const effective = flags ?? "gu";
	return effective.includes("g") ? effective : `${effective}g`;
}

function advanceStringIndex(text: string, index: number, unicode: boolean): number {
	if (!unicode || index + 1 >= text.length) return index + 1;
	const first = text.charCodeAt(index);
	if (first < 0xd800 || first > 0xdbff) return index + 1;
	const second = text.charCodeAt(index + 1);
	return second >= 0xdc00 && second <= 0xdfff ? index + 2 : index + 1;
}

/**
 * Inspect a tool's input against the configured secret shapes (gitleaks model).
 *
 * Pipeline per field: keyword pre-filter → regex (extracts a capture group) →
 * entropy check on the captured candidate → allowlist check. A candidate is
 * a secret only if it passes ALL of: keyword present (if configured), regex
 * matches, entropy ≥ threshold (if configured), not allowlisted.
 *
 * Synchronous, in-process: the secret is matched by regex/entropy only and
 * never enters a judgment context (no agent, no second transcript). On a
 * `redact` match, mutates `input[field]` in place to strip each confirmed
 * match, then allows. On a `block` match, returns block. On no match, returns
 * onNoMatch.
 *
 * Scans string-valued fields. By default scans ALL string fields ("*"), which
 * is paranoia-first; validated effective config may restrict per-tool fields,
 * but project merges cannot drop global/default scan coverage.
 */
export function inspectToolInput(
	toolName: string,
	input: Record<string, unknown>,
	inspector: ToolInspector | undefined,
): InspectionVerdict {
	if (!inspector || !inspector.secrets || inspector.secrets.length === 0) {
		return { action: "allow", reason: "no inspector configured" };
	}
	const onNoMatch = inspector.onNoMatch ?? "allow";

	const shapes: CompiledShape[] = inspector.secrets.map((s) => ({
		name: s.name,
		re: new RegExp(s.pattern, withGlobalFlag(s.flags)),
		action: s.action,
		secretGroup: s.secretGroup ?? 0,
		entropy: s.entropy,
		keywords: s.keywords,
	}));
	const allowlist: CompiledAllowlist = {
		stopwords: new Set((inspector.allowlist?.stopwords ?? []).map((w) => w.toLowerCase())),
		regexes: (inspector.allowlist?.regexes ?? []).map((r) => new RegExp(r, "iu")),
	};

	const scanFields = inspector.scanFields ?? {};
	const toolFields = scanFields[toolName];
	const scanAll =
		toolFields === "*" ||
		(toolFields === undefined && (scanFields["*"] === "*" || Object.keys(scanFields).length === 0));
	const fieldList = scanAll ? null : (toolFields ?? scanFields["*"] ?? null);

	const isAllowed = (candidate: string): boolean =>
		allowlist.stopwords.has(candidate.toLowerCase()) ||
		allowlist.regexes.some((r) => {
			r.lastIndex = 0;
			return r.test(candidate);
		});

	for (const [field, value] of Object.entries(input)) {
		if (fieldList && !fieldList.includes(field)) continue;
		let text: string | null = null;
		if (typeof value === "string") text = value;
		else if (value !== null && typeof value === "object") {
			try { text = JSON.stringify(value); } catch { text = null; }
		} else continue;
		if (text === null) continue;

		for (const shape of shapes) {
			if (shape.keywords && shape.keywords.length > 0) {
				const lower = text.toLowerCase();
				if (!shape.keywords.some((kw) => lower.includes(kw.toLowerCase()))) continue;
			}

			shape.re.lastIndex = 0;
			const redactRanges: Array<{ start: number; end: number }> = [];
			let match: RegExpExecArray | null;
			while ((match = shape.re.exec(text)) !== null) {
				const fullMatch = match[0] ?? "";
				const start = match.index;
				const end = start + fullMatch.length;
				if (fullMatch.length === 0) {
					shape.re.lastIndex = advanceStringIndex(text, shape.re.lastIndex, shape.re.unicode);
				}

				const candidate = (shape.secretGroup < match.length ? match[shape.secretGroup] : match[0]) ?? match[0];
				if (!candidate) continue;

				if (shape.entropy !== undefined) {
					const ent = shannonEntropy(candidate);
					if (ent < shape.entropy) continue;
				}

				if (isAllowed(candidate)) continue;

				if (shape.action === "block") {
					return {
						action: "block",
						reason: `secret shape "${shape.name}" matched in field "${field}" of tool "${toolName}"`,
					};
				}
				redactRanges.push({ start, end });
			}

			if (redactRanges.length > 0) {
				let redacted = text;
				for (let i = redactRanges.length - 1; i >= 0; i -= 1) {
					const range = redactRanges[i];
					if (!range) continue;
					redacted = `${redacted.slice(0, range.start)}[REDACTED:${shape.name}]${redacted.slice(range.end)}`;
				}
				if (typeof value === "string") {
					(input as Record<string, unknown>)[field] = redacted;
				} else {
					try { (input as Record<string, unknown>)[field] = JSON.parse(redacted); } catch { (input as Record<string, unknown>)[field] = redacted; }
				}
				text = redacted;
			}
		}
	}

	return {
		action: onNoMatch,
		reason: onNoMatch === "block" ? `no configured secret matched, but inspector onNoMatch=block` : "",
	};
}

export interface EnvScrubConfig {
	/** Exact env-var names to delete from process.env at session_start. */
	names?: string[];
	/** Glob patterns for env-var names to delete (e.g. "*_TOKEN", "ANTHROPIC_*"). Applied case-insensitively. */
	patterns?: string[];
	/** Names the provider/runtime prefers to keep when they are not scrub targets. Scrub names/patterns always win. */
	keep?: string[];
}

export const DEFAULT_CONFIG: SandboxConfig & { tools?: ToolRules; envScrub?: EnvScrubConfig; backgroundTasks?: BackgroundTasksSandboxConfig } = {
	enabled: true,
	backgroundTasks: {
		sandboxIntegration: "auto",
	},
	network: {
		mode: "open",
		allowedDomains: [
			"npmjs.org",
			"*.npmjs.org",
			"registry.npmjs.org",
			"registry.yarnpkg.com",
			"pypi.org",
			"*.pypi.org",
			"github.com",
			"*.github.com",
			"api.github.com",
			"raw.githubusercontent.com",
		],
		deniedDomains: [],
	},
	filesystem: {
		denyRead: ["~/.ssh", "~/.aws", "~/.gnupg"],
		allowWrite: [".", "/tmp"],
		denyWrite: [".env", ".env.*", "*.pem", "*.key"],
	},
	tools: {
		default: "allow",
		rules: {},
	},
	envScrub: {
		// Known orphan-secret env vars not read by pi's auth path. `ANTHROPIC_AUTH_TOKEN`
		// is a stale Claude Code leftover; pi reads ANTHROPIC_OAUTH_TOKEN/ANTHROPIC_API_KEY
		// for the anthropic provider, and auth.json (OAuth) for umans/openai-codex.
		names: ["ANTHROPIC_AUTH_TOKEN"],
	},
};

export interface LoadedConfig {
	config: SandboxConfig;
	parseErrors: string[];
	globWarnings: string[];
	legacyFieldWarnings: string[];
	failClosedReasons: string[];
	additiveWarnings: string[];
}

const NETWORK_MODES = new Set(["open", "block", "filter"]);
const BACKGROUND_TASKS_SANDBOX_INTEGRATIONS = new Set(["auto", "off"]);
const TOOL_POLICIES = new Set(["allow", "auto", "confirm", "block"]);
const SECRET_ACTIONS = new Set(["block", "redact"]);
const INSPECTOR_NO_MATCH_ACTIONS = new Set(["allow", "block"]);

/** Validate untrusted sandbox JSON before it reaches merge/init logic. */
export function validateConfig(config: unknown): string[] {
	const errors: string[] = [];
	if (!isRecord(config)) return ["config must be a JSON object"];

	if (config.enabled !== undefined && typeof config.enabled !== "boolean") {
		errors.push("enabled must be a boolean");
	}

	if (config.filesystem !== undefined) {
		if (!isRecord(config.filesystem)) {
			errors.push("filesystem must be an object");
		} else {
			validateOptionalStringArray(config.filesystem.denyRead, "filesystem.denyRead", errors);
			validateOptionalStringArray(config.filesystem.denyWrite, "filesystem.denyWrite", errors);
			validateOptionalStringArray(config.filesystem.allowWrite, "filesystem.allowWrite", errors);
		}
	}

	if (config.network !== undefined) {
		if (!isRecord(config.network)) {
			errors.push("network must be an object");
		} else {
			if (config.network.mode !== undefined && (typeof config.network.mode !== "string" || !NETWORK_MODES.has(config.network.mode))) {
				errors.push('network.mode must be one of "open", "block", or "filter"');
			}
			validateOptionalStringArray(config.network.allowedDomains, "network.allowedDomains", errors);
			validateOptionalStringArray(config.network.deniedDomains, "network.deniedDomains", errors);
		}
	}

	if (config.tools !== undefined) {
		if (!isRecord(config.tools)) {
			errors.push("tools must be an object");
		} else {
			validateOptionalToolPolicy(config.tools.default, "tools.default", errors);
			if (config.tools.rules !== undefined) {
				if (!isRecord(config.tools.rules)) {
					errors.push("tools.rules must be an object");
				} else {
					for (const [name, value] of Object.entries(config.tools.rules)) {
						validateOptionalToolPolicy(value, `tools.rules.${name}`, errors);
					}
				}
			}
			validateInspector(config.tools.inspector, errors);
		}
	}

	if (config.backgroundTasks !== undefined) {
		if (!isRecord(config.backgroundTasks)) {
			errors.push("backgroundTasks must be an object");
		} else if (config.backgroundTasks.sandboxIntegration !== undefined) {
			const integration = config.backgroundTasks.sandboxIntegration;
			if (typeof integration !== "string" || !BACKGROUND_TASKS_SANDBOX_INTEGRATIONS.has(integration)) {
				errors.push('backgroundTasks.sandboxIntegration must be one of "auto" or "off"');
			}
		}
	}

	if (config.envScrub !== undefined) {
		if (!isRecord(config.envScrub)) {
			errors.push("envScrub must be an object");
		} else {
			validateOptionalStringArray(config.envScrub.names, "envScrub.names", errors);
			validateOptionalStringArray(config.envScrub.patterns, "envScrub.patterns", errors);
			validateOptionalStringArray(config.envScrub.keep, "envScrub.keep", errors);
		}
	}

	return errors;
}

interface LoadConfigOptions {
	agentDir?: string;
}

function defaultAgentDir(): string {
	return join(homedir(), ".pi", "agent");
}

export function loadConfig(cwd: string, opts: LoadConfigOptions = {}): LoadedConfig {
	const projectConfigPath = join(cwd, CONFIG_DIR_NAME, "sandbox.json");
	const globalConfigPath = join(opts.agentDir ?? defaultAgentDir(), "extensions", "sandbox.json");

	const parseErrors: string[] = [];
	const legacyFieldWarnings: string[] = [];
	let globalConfig: Partial<SandboxConfig> = {};
	let projectConfig: Partial<SandboxConfig> = {};

	if (existsSync(globalConfigPath)) {
		try {
			const parsed = JSON.parse(readFileSync(globalConfigPath, "utf-8"));
			const validationErrors = validateConfig(parsed);
			if (validationErrors.length > 0) {
				parseErrors.push(...validationErrors.map((error) => `global (${globalConfigPath}): ${error}`));
			} else {
				globalConfig = parsed;
				legacyFieldWarnings.push(...collectLegacyFieldWarnings("global", globalConfig));
			}
		} catch (e) {
			// Fail-closed: record the error. We refuse to run with an unparseable
			// global config rather than silently dropping denyRead entries.
			parseErrors.push(`global (${globalConfigPath}): ${e instanceof Error ? e.message : e}`);
		}
	}

	if (existsSync(projectConfigPath)) {
		try {
			const parsed = JSON.parse(readFileSync(projectConfigPath, "utf-8"));
			const validationErrors = validateConfig(parsed);
			if (validationErrors.length > 0) {
				parseErrors.push(...validationErrors.map((error) => `project (${projectConfigPath}): ${error}`));
			} else {
				projectConfig = parsed;
				legacyFieldWarnings.push(...collectLegacyFieldWarnings("project", projectConfig));
			}
		} catch (e) {
			parseErrors.push(`project (${projectConfigPath}): ${e instanceof Error ? e.message : e}`);
		}
	}

	// Merge defaults <- global <- project, but make project ADDITIVE-ONLY:
	// it may tighten (more denyRead, fewer allowedDomains, narrower allowWrite)
	// but never weaken global policy. Weakening attempts are ignored + warned.
	const mergedGlobal = deepMerge(deepMerge(DEFAULT_CONFIG, globalConfig), {});
	const additiveWarnings: string[] = [];
	const merged = mergeProjectAdditive(mergedGlobal, projectConfig, additiveWarnings);

	// Detect inert glob patterns in denyWrite (Linux can't enforce them).
	const globWarnings: string[] = [];
	if (process.platform === "linux") {
		const denyWrite = merged.filesystem?.denyWrite ?? [];
		const globs = denyWrite.filter(isGlobPattern);
		if (globs.length > 0) {
			globWarnings.push(
				`Linux cannot enforce glob denyWrite patterns: ${globs.join(", ")}. Replace with literal dirs/files.`,
			);
		}
	}

	const failClosedReasons: string[] = [];
	if (merged.enabled !== false && (merged.network?.mode ?? "open") === "filter") {
		failClosedReasons.push(
			`network.mode=filter is deferred for the first-party bwrap backend; bash fails closed instead of treating filtered egress as open. Use network.mode=open or network.mode=block, or implement ${FILTER_DEFERRED_BACKLOG_ITEM}.`,
		);
	}

	return { config: merged, parseErrors, globWarnings, legacyFieldWarnings, failClosedReasons, additiveWarnings };
}

export function deepMerge(base: SandboxConfig, overrides: Partial<SandboxConfig>): SandboxConfig {
	const result: SandboxConfig = { ...base };

	if (overrides.enabled !== undefined) result.enabled = overrides.enabled;
	if (overrides.network) {
		const baseMode = base.network?.mode ?? "open";
		const overrideMode = overrides.network.mode;
		// deepMerge is base<-global: override wins. (Project additive narrowing
		// is enforced separately in mergeProjectAdditive.)
		result.network = {
			...base.network,
			mode: overrideMode ?? baseMode,
			allowedDomains: overrides.network.allowedDomains ?? base.network?.allowedDomains,
			deniedDomains: overrides.network.deniedDomains ?? base.network?.deniedDomains,
		};
	}
	if (overrides.filesystem) {
		result.filesystem = {
			...base.filesystem,
			denyRead: overrides.filesystem.denyRead ?? base.filesystem?.denyRead,
			allowWrite: overrides.filesystem.allowWrite ?? base.filesystem?.allowWrite,
			denyWrite: overrides.filesystem.denyWrite ?? base.filesystem?.denyWrite,
		};
	}
	if (overrides.tools) {
		const baseTools = base.tools ?? { default: "allow" as ToolPolicy, rules: {} };
		result.tools = {
			default: overrides.tools.default ?? baseTools.default,
			rules: { ...baseTools.rules, ...overrides.tools.rules },
			// Carry the inspector through the global merge. The additive-only
			// project merge (mergeProjectAdditive) is where tightening is enforced;
			// here we just don't lose it.
			inspector: overrides.tools.inspector ?? baseTools.inspector,
		};
	}
	if (overrides.backgroundTasks) {
		result.backgroundTasks = {
			...base.backgroundTasks,
			sandboxIntegration: overrides.backgroundTasks.sandboxIntegration ?? base.backgroundTasks?.sandboxIntegration,
		};
	}

	const extOverrides = overrides as { envScrub?: EnvScrubConfig };
	const extResult = result as { envScrub?: EnvScrubConfig };
	if (extOverrides.envScrub) {
		// Merge: union names + patterns; retain keep entries as operator metadata.
		// Runtime scrubbing is fail-safe: an exact name or pattern match always
		// wins over keep, so keep cannot preserve a configured scrub target.
		const baseScrub = (base as { envScrub?: EnvScrubConfig }).envScrub;
		extResult.envScrub = {
			names: [...new Set([...(baseScrub?.names ?? []), ...(extOverrides.envScrub.names ?? [])])],
			patterns: [...new Set([...(baseScrub?.patterns ?? []), ...(extOverrides.envScrub.patterns ?? [])])],
			keep: [...new Set([...(baseScrub?.keep ?? []), ...(extOverrides.envScrub.keep ?? [])])],
		};
	}

	return result;
}

/**
 * Merge project config as additive-only restrictions on top of global.
 * Project may ADD denyRead/denyWrite/deniedDomains entries and REMOVE
 * allowedDomains/allowWrite entries (tightening), but may not REMOVE
 * deny entries or ADD allow entries (weakening). Weakening attempts are
 * dropped and warned via console.error.
 */
export function mergeProjectAdditive(global: SandboxConfig, project: Partial<SandboxConfig>, warnings: string[] = []): SandboxConfig {
	if (!project || Object.keys(project).length === 0) return global;

	const result: SandboxConfig = deepMerge(global, {});
	const warns: string[] = [];

	// Project may NOT disable the sandbox.
	if (project.enabled === false && global.enabled !== false) {
		warns.push(`project tried to disable sandbox; ignored (additive-only policy).`);
	}

	// denyRead: project can only ADD entries (union).
	if (project.filesystem?.denyRead) {
		const existing = new Set(result.filesystem?.denyRead ?? []);
		const merged = [...(result.filesystem?.denyRead ?? [])];
		for (const p of project.filesystem.denyRead) {
			if (!existing.has(p)) merged.push(p);
		}
		result.filesystem = { ...result.filesystem, denyRead: merged };
	}

	// denyWrite: project can only ADD entries (union).
	if (project.filesystem?.denyWrite) {
		const existing = new Set(result.filesystem?.denyWrite ?? []);
		const merged = [...(result.filesystem?.denyWrite ?? [])];
		for (const p of project.filesystem.denyWrite) {
			if (!existing.has(p)) merged.push(p);
		}
		result.filesystem = { ...result.filesystem, denyWrite: merged };
	}

	// allowWrite: project can only REMOVE entries (intersect with global).
	if (project.filesystem?.allowWrite) {
		const globalAllow = new Set(result.filesystem?.allowWrite ?? []);
		result.filesystem = {
			...result.filesystem,
			allowWrite: project.filesystem.allowWrite.filter((p) => globalAllow.has(p)),
		};
	}

	// network.mode: project can only RAISE the first-release strictness rank
	// (open < block < filter). `filter` is currently fail-closed, so it is
	// stricter than runnable air-gapped `block`; a project cannot downgrade a
	// global fail-closed filter posture to block.
	if (project.network?.mode) {
		const modeRank: Record<NetworkMode, number> = { open: 0, block: 1, filter: 2 };
		const current = result.network?.mode ?? "open";
		const requested = project.network.mode;
		if (modeRank[requested] > modeRank[current]) {
			result.network = { ...result.network, mode: requested };
		} else if (modeRank[requested] < modeRank[current]) {
			warns.push(`project tried to loosen network.mode (${current} -> ${requested}); ignored (additive-only).`);
		}
	}

	// deniedDomains: project can only ADD (union).
	if (project.network?.deniedDomains) {
		const existing = new Set(result.network?.deniedDomains ?? []);
		const merged = [...(result.network?.deniedDomains ?? [])];
		for (const p of project.network.deniedDomains) {
			if (!existing.has(p)) merged.push(p);
		}
		result.network = { ...result.network, deniedDomains: merged };
	}

	// allowedDomains: project can only REMOVE (intersect with global).
	if (project.network?.allowedDomains) {
		const globalAllow = new Set(result.network?.allowedDomains ?? []);
		result.network = {
			...result.network,
			allowedDomains: project.network.allowedDomains.filter((p) => globalAllow.has(p)),
		};
	}

	// backgroundTasks.sandboxIntegration: project-local config may only tighten.
	// Rank is off < auto: disabling integration loosens the background/monitor
	// sandbox boundary, so a project cannot turn a global/default auto posture off.
	if (project.backgroundTasks?.sandboxIntegration) {
		const integrationRank: Record<BackgroundTasksSandboxIntegration, number> = { off: 0, auto: 1 };
		const current = result.backgroundTasks?.sandboxIntegration ?? "auto";
		const requested = project.backgroundTasks.sandboxIntegration;
		if (integrationRank[requested] > integrationRank[current]) {
			result.backgroundTasks = { ...result.backgroundTasks, sandboxIntegration: requested };
		} else if (integrationRank[requested] < integrationRank[current]) {
			warns.push(`project tried to loosen backgroundTasks.sandboxIntegration (${current} -> ${requested}); ignored (additive-only).`);
		}
	}

	// envScrub: project can only ADD exact names/patterns (scrub more).
	// Keep entries are retained only for non-scrubbed names; exact names and
	// patterns always win at runtime so a project cannot preserve a scrub target.
	if (project.envScrub) {
		const baseScrub = result.envScrub;
		result.envScrub = {
			names: [...new Set([...(baseScrub?.names ?? []), ...(project.envScrub.names ?? [])])],
			patterns: [...new Set([...(baseScrub?.patterns ?? []), ...(project.envScrub.patterns ?? [])])],
			keep: [...new Set([...(baseScrub?.keep ?? []), ...(project.envScrub.keep ?? [])])],
		};
		for (const keepName of project.envScrub.keep ?? []) {
			if (envNameMatchesScrubConfig(keepName, result.envScrub)) {
				warns.push(`project envScrub.keep "${keepName}" matches a scrub name/pattern; scrub wins over keep.`);
			}
		}
	}

	// tools: project can only TIGHTEN. Additive by policy rank:
	// allow < auto < confirm < block. Project may raise a tool's policy,
	// never lower it. It may also narrow the default (e.g. global
	// default=allow -> project default=block), but not widen a tightened
	// default back. A project cannot set default=allow if the global
	// default is auto/confirm/block.
	if (project.tools) {
		const rank = TOOL_POLICY_RANK;
		const baseTools = result.tools ?? { default: "allow" as ToolPolicy, rules: {} };
		const baseRules = baseTools.rules ?? {};
		const mergedRules: Record<string, ToolPolicy> = { ...baseRules };
		for (const [name, policy] of Object.entries(project.tools.rules ?? {})) {
			const current = mergedRules[name] ?? baseTools.default ?? "allow";
			const bypassFloor = (SHELL_BYPASS_TOOLS as readonly string[]).includes(name) ? SHELL_BYPASS_DEFAULT_POLICY : undefined;
			const effectiveCurrent = bypassFloor ? stricterToolPolicy(current, bypassFloor) : current;
			if (rank[policy] > rank[effectiveCurrent]) {
				mergedRules[name] = policy;
			} else if (rank[policy] === rank[effectiveCurrent] && rank[policy] > rank[current]) {
				mergedRules[name] = policy;
			} else if (rank[policy] < rank[effectiveCurrent]) {
				// project trying to lower a globally-set or fail-closed default policy -> ignore + warn
				warns.push(`project tried to loosen tool policy for "${name}" (${effectiveCurrent} -> ${policy}); ignored (additive-only).`);
			}
		}
		const projDefault = project.tools.default;
		let finalDefault = baseTools.default ?? "allow";
		if (projDefault && rank[projDefault] > rank[finalDefault]) {
			finalDefault = projDefault;
		} else if (projDefault && rank[projDefault] < rank[finalDefault]) {
			warns.push(`project tried to loosen tool default (${finalDefault} -> ${projDefault}); ignored (additive-only).`);
		}
		// inspector: project can ADD new secret shapes and tighten onNoMatch
		// (allow -> block), never remove/override global shapes or loosen
		// onNoMatch. scanFields are additive-only coverage: a project may add
		// fields to scan, but can never remove fields requested by global/default
		// policy. Effective per-tool scanFields are the union of global/default
		// and project fields; "*" remains "*".
		let mergedInspector = baseTools.inspector;
		if (project.tools.inspector) {
			const baseInsp = baseTools.inspector ?? {};
			const projInsp = project.tools.inspector;
			const mergedSecrets: SecretShape[] = [...(baseInsp.secrets ?? [])];
			const baseSecretNames = new Set(mergedSecrets.map((s) => s.name));
			for (const s of projInsp.secrets ?? []) {
				if (baseSecretNames.has(s.name)) {
					warns.push(`project tried to override inspector secret shape "${s.name}"; ignored (additive-only).`);
					continue;
				}
				baseSecretNames.add(s.name);
				mergedSecrets.push(s);
			}
			// onNoMatch: tighten only (allow -> block)
			const baseOnNoMatch = baseInsp.onNoMatch ?? "allow";
			let finalOnNoMatch = baseOnNoMatch;
			if (projInsp.onNoMatch === "block" && baseOnNoMatch !== "block") finalOnNoMatch = "block";
			else if (projInsp.onNoMatch === "allow" && baseOnNoMatch === "block") {
				warns.push(`project tried to loosen inspector onNoMatch (block -> allow); ignored (additive-only).`);
			}
			// scanFields: project additions are a union with explicit global
			// field lists. Any global/default all-field coverage remains "*".
			// Critically, a missing global scanFields entry with existing global
			// secrets is an implicit scan-all runtime default, not a gap a project
			// can narrow to a smaller field list.
			const mergedScan: Record<string, string[] | "*"> = { ...(baseInsp.scanFields ?? {}) };
			for (const [tool, fields] of Object.entries(projInsp.scanFields ?? {})) {
				if (Array.isArray(fields) && fields.length === 0) {
					warns.push(`project tried to empty inspector scanFields for "${tool}"; ignored (additive-only).`);
					continue;
				}

				const baseFields = effectiveBaseScanFieldsForTool(baseInsp, tool);
				if (baseFields === undefined) {
					mergedScan[tool] = fields;
				} else if (baseFields === "*" || fields === "*") {
					if (baseFields === "*" && fields !== "*") {
						warns.push(`project tried to narrow inspector scanFields for "${tool}" from "*"; ignored (additive-only).`);
					}
					mergedScan[tool] = "*";
				} else {
					const missingBaseFields = baseFields.filter((field) => !fields.includes(field));
					if (missingBaseFields.length > 0) {
						warns.push(`project tried to drop inspector scanFields for "${tool}" (${missingBaseFields.join(", ")}); using union (additive-only).`);
					}
					mergedScan[tool] = [...baseFields, ...fields.filter((field) => !baseFields.includes(field))];
				}
			}
			if (projInsp.allowlist) {
				warns.push(`project tried to add inspector allowlist entries; ignored (additive-only).`);
			}
			mergedInspector = {
				...baseInsp,
				secrets: mergedSecrets,
				onNoMatch: finalOnNoMatch,
				scanFields: Object.keys(mergedScan).length > 0 ? mergedScan : undefined,
			};
		}
		result.tools = { default: finalDefault, rules: mergedRules, ...(mergedInspector ? { inspector: mergedInspector } : {}) };
	}

	for (const w of warns) {
		warnings.push(w);
		console.error(`[sandbox] ${w}`);
	}
	return result;
}

export interface SandboxCommandState {
	failClosed: boolean;
	sandboxEnabled: boolean;
	sandboxInitialized: boolean;
	disabledViaConfig: boolean;
	osSandboxUnavailable?: boolean;
	osSandboxUnavailablePlatform?: string | null;
	lastFailClosedReason?: string | null;
	backgroundTasksIntegration?: BypassToolIntegrationState;
}

export interface SandboxCommandContext {
	cwd: string;
	ui: { notify(message: string, level?: string): void };
}

export function createSandboxCommandHandler(opts: {
	getState: () => SandboxCommandState;
	load?: (cwd: string) => LoadedConfig;
}) {
	return async (_args: unknown, ctx: SandboxCommandContext): Promise<void> => {
		const loaded = opts.load?.(ctx.cwd) ?? loadConfig(ctx.cwd);
		ctx.ui.notify(formatSandboxCommandOutput(loaded, opts.getState()), "info");
	};
}

export function formatSandboxCommandOutput(loaded: LoadedConfig, state: SandboxCommandState): string {
	const { config, parseErrors, globWarnings, legacyFieldWarnings, failClosedReasons, additiveWarnings } = loaded;
	const computedFailClosed = state.failClosed || parseErrors.length > 0 || failClosedReasons.length > 0;
	const failReasons = [
		...(state.lastFailClosedReason ? [state.lastFailClosedReason] : []),
		...parseErrors.map((e) => `config parse error: ${e}`),
		...failClosedReasons,
	];
	const stateLabel = computedFailClosed
		? "FAIL-CLOSED"
		: state.disabledViaConfig
			? "disabled via config"
			: state.osSandboxUnavailable
				? `OS bash sandbox unavailable (${formatPlatformName(state.osSandboxUnavailablePlatform)}) — in-process file/tool policy active`
				: state.sandboxEnabled && state.sandboxInitialized
					? "enabled"
					: "disabled/not initialized";
	const mode = config.network?.mode ?? "open";
	const backgroundTasksIntegration: BypassToolIntegrationState = computedFailClosed
		? { backgroundTasksSandbox: "blocked", reason: failReasons.length > 0 ? failReasons.join("; ") : "sandbox fail-closed" }
		: state.backgroundTasksIntegration ?? (
			state.disabledViaConfig
				? { backgroundTasksSandbox: "inactive", reason: "sandbox disabled by config" }
				: state.osSandboxUnavailable
					? { backgroundTasksSandbox: "inactive", reason: `unsupported platform: ${formatPlatformName(state.osSandboxUnavailablePlatform)}` }
					: decideBackgroundTasksIntegrationState({
						config,
						parseErrors,
						failClosedReasons,
					})
		);
	const effectiveToolRules = applyBypassToolDefaults(config.tools, backgroundTasksIntegration);
	const bypassToolPolicy = SHELL_BYPASS_TOOLS.map((name) => `${name}=${effectiveToolRules.rules?.[name] ?? effectiveToolRules.default ?? "allow"}`).join(", ");
	const backgroundTasksLine = formatBackgroundTasksIntegration(backgroundTasksIntegration);
	const legacy = legacyFieldWarnings.length > 0 ? legacyFieldWarnings : ["(none)"];
	const warnings = [...globWarnings, ...additiveWarnings];

	return [
		"Sandbox Configuration:",
		`  State: ${stateLabel}`,
		`  Fail-closed reason: ${failReasons.length > 0 ? failReasons.join("; ") : "(none)"}`,
		"",
		"Network:",
		`  Mode: ${mode}`,
		`  Allowed: ${config.network?.allowedDomains?.join(", ") || "(none)"}`,
		`  Denied: ${config.network?.deniedDomains?.join(", ") || "(none)"}`,
		"",
		"Filesystem:",
		`  Deny Read: ${config.filesystem?.denyRead?.join(", ") || "(none)"}`,
		`  Allow Write: ${config.filesystem?.allowWrite?.join(", ") || "(none)"}`,
		`  Deny Write: ${config.filesystem?.denyWrite?.join(", ") || "(none)"}`,
		"",
		"Unsupported legacy ASRT fields:",
		...legacy.map((warning) => `  ${warning}`),
		"",
		"Known bypass mitigation state:",
		"  Hardened by this plugin: LLM/tool bash, interactive user_bash, read, write, edit.",
		"  File-tool policy is in-process and remains active when mediated bash is fail-closed or the OS bash sandbox is unavailable.",
		"  RPC/API direct bash is not mediated by pi extensions in current pi core.",
		`  Background tasks sandbox: ${backgroundTasksLine}`,
		`  Bypass tools: ${bypassToolPolicy}`,
		backgroundTasksIntegration.backgroundTasksSandbox === "active"
			? "  Not OS-sandboxed here: Pi extensions/packages, RPC/API direct bash, agent_send, web/search tools, subagents, and provider requests."
			: "  Not OS-sandboxed here: Pi extensions/packages, RPC/API direct bash, background, monitor, agent_send, web/search tools, subagents, and provider requests.",
		"  open network mode leaves host networking intact for sandboxed bash.",
		"",
		"Tool egress policy:",
		`  default: ${effectiveToolRules.default ?? "allow"}`,
		`  rules: ${Object.entries(effectiveToolRules.rules ?? {}).map(([k, v]) => `${k}=${v}`).join(", ") || "(none)"}`,
		...(warnings.length > 0 ? ["", "Warnings:", ...warnings.map((warning) => `  ${warning}`)] : []),
	].join("\n");
}

/** The first-party bwrap backend does not support glob denyWrite matching. Detect glob patterns so we can warn. */
function isGlobPattern(p: string): boolean {
	return /[*?]/.test(p);
}

function formatPlatformName(platform: string | null | undefined): string {
	if (!platform) return "unknown platform";
	if (platform === "darwin") return "macOS";
	if (platform === "win32") return "Windows";
	return platform;
}

function formatBackgroundTasksIntegration(state: BypassToolIntegrationState): string {
	const suffix = state.reason ? ` (${state.reason})` : "";
	if (state.backgroundTasksSandbox === "active") return `active${suffix}`;
	if (state.backgroundTasksSandbox === "blocked") return `blocked${suffix}`;
	return `inactive${suffix}`;
}

function validateOptionalStringArray(value: unknown, path: string, errors: string[]): void {
	if (value === undefined) return;
	if (!Array.isArray(value)) {
		errors.push(`${path} must be an array of strings`);
		return;
	}
	value.forEach((entry, index) => {
		if (typeof entry !== "string") errors.push(`${path}[${index}] must be a string`);
	});
}

function validateOptionalToolPolicy(value: unknown, path: string, errors: string[]): void {
	if (value === undefined) return;
	if (typeof value !== "string" || !TOOL_POLICIES.has(value)) {
		errors.push(`${path} must be one of "allow", "auto", "confirm", or "block"`);
	}
}

function validateInspector(value: unknown, errors: string[]): void {
	if (value === undefined) return;
	if (!isRecord(value)) {
		errors.push("tools.inspector must be an object");
		return;
	}
	if (value.onNoMatch !== undefined && (typeof value.onNoMatch !== "string" || !INSPECTOR_NO_MATCH_ACTIONS.has(value.onNoMatch))) {
		errors.push('tools.inspector.onNoMatch must be one of "allow" or "block"');
	}
	if (value.secrets !== undefined) {
		if (!Array.isArray(value.secrets)) {
			errors.push("tools.inspector.secrets must be an array");
		} else {
			value.secrets.forEach((secret, index) => validateSecretShape(secret, `tools.inspector.secrets[${index}]`, errors));
		}
	}
	if (value.scanFields !== undefined) {
		if (!isRecord(value.scanFields)) {
			errors.push("tools.inspector.scanFields must be an object");
		} else {
			for (const [tool, fields] of Object.entries(value.scanFields)) {
				if (fields === "*") continue;
				validateOptionalStringArray(fields, `tools.inspector.scanFields.${tool}`, errors);
			}
		}
	}
	if (value.allowlist !== undefined) {
		if (!isRecord(value.allowlist)) {
			errors.push("tools.inspector.allowlist must be an object");
		} else {
			validateOptionalStringArray(value.allowlist.stopwords, "tools.inspector.allowlist.stopwords", errors);
			validateOptionalStringArray(value.allowlist.regexes, "tools.inspector.allowlist.regexes", errors);
			if (Array.isArray(value.allowlist.regexes)) {
				value.allowlist.regexes.forEach((regex, index) => {
					if (typeof regex !== "string") return;
					try {
						new RegExp(regex, "iu");
					} catch (e) {
						errors.push(`tools.inspector.allowlist.regexes[${index}] must compile as a JavaScript RegExp${e instanceof Error ? ` (${e.message})` : ""}`);
					}
				});
			}
		}
	}
}

function validateSecretShape(value: unknown, path: string, errors: string[]): void {
	if (!isRecord(value)) {
		errors.push(`${path} must be an object`);
		return;
	}
	if (typeof value.name !== "string" || value.name.length === 0) errors.push(`${path}.name must be a non-empty string`);
	if (typeof value.pattern !== "string" || value.pattern.length === 0) errors.push(`${path}.pattern must be a non-empty string`);
	if (typeof value.action !== "string" || !SECRET_ACTIONS.has(value.action)) {
		errors.push(`${path}.action must be one of "block" or "redact"`);
	}
	if (value.secretGroup !== undefined && typeof value.secretGroup !== "number") errors.push(`${path}.secretGroup must be a number`);
	if (value.entropy !== undefined && typeof value.entropy !== "number") errors.push(`${path}.entropy must be a number`);
	validateOptionalStringArray(value.keywords, `${path}.keywords`, errors);
	if (value.flags !== undefined && typeof value.flags !== "string") errors.push(`${path}.flags must be a string`);
	if (typeof value.pattern === "string" && value.pattern.length > 0 && (value.flags === undefined || typeof value.flags === "string")) {
		try {
			new RegExp(value.pattern, withGlobalFlag(value.flags));
		} catch (e) {
			errors.push(`${path}.pattern must compile as a JavaScript RegExp${e instanceof Error ? ` (${e.message})` : ""}`);
		}
	}
}

function effectiveBaseScanFieldsForTool(inspector: ToolInspector, tool: string): string[] | "*" | undefined {
	const explicit = inspector.scanFields?.[tool] ?? inspector.scanFields?.["*"];
	if (explicit !== undefined) return explicit;
	return (inspector.secrets?.length ?? 0) > 0 ? "*" : undefined;
}

function compileEnvScrubPatterns(patterns: string[] | undefined): RegExp[] {
	return (patterns ?? []).map((p) => {
		const re = p.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".");
		return new RegExp(`^${re}$`, "i");
	});
}

function envNameMatchesScrubConfig(name: string, config: EnvScrubConfig | undefined, compiledPatterns = compileEnvScrubPatterns(config?.patterns)): boolean {
	return Boolean(config?.names?.includes(name) || compiledPatterns.some((re) => re.test(name)));
}

/**
 * Scrub secret-bearing env vars from process.env at session_start.
 * Exact scrub names and scrub patterns always win over provider/config keep;
 * keep entries only preserve variables that do not match a scrub rule.
 */
export function scrubEnv(config: EnvScrubConfig | undefined, keep: string[]): string[] {
	if (!config || (!config.names?.length && !config.patterns?.length)) return [];
	const keepSet = new Set([...keep, ...(config.keep ?? [])]);
	const compiledPatterns = compileEnvScrubPatterns(config.patterns);
	const scrubbed: string[] = [];
	for (const name of Object.keys(process.env)) {
		if (envNameMatchesScrubConfig(name, config, compiledPatterns)) {
			delete process.env[name];
			scrubbed.push(name);
			continue;
		}
		if (keepSet.has(name)) continue;
	}
	return scrubbed;
}

function collectLegacyFieldWarnings(source: "global" | "project", value: unknown): string[] {
	if (!isRecord(value)) return [];
	const warnings: string[] = [];
	if (Object.hasOwn(value, "ignoreViolations")) {
		warnings.push(`${source}: ignoreViolations is an ASRT-only internal bypass list and is ignored by the first-party sandbox.`);
	}
	if (Object.hasOwn(value, "enableWeakerNestedSandbox")) {
		warnings.push(`${source}: enableWeakerNestedSandbox is an ASRT-only internal knob and is ignored by the first-party sandbox.`);
	}
	if (Object.hasOwn(value, "httpProxyPort")) {
		warnings.push(`${source}: httpProxyPort belongs to ASRT filter proxy support; network.mode=filter is deferred (${FILTER_DEFERRED_BACKLOG_ITEM}), so the knob is ignored.`);
	}
	if (Object.hasOwn(value, "socksProxyPort")) {
		warnings.push(`${source}: socksProxyPort belongs to ASRT filter proxy support; network.mode=filter is deferred (${FILTER_DEFERRED_BACKLOG_ITEM}), so the knob is ignored.`);
	}
	if (isRecord(value.filesystem) && Object.hasOwn(value.filesystem, "allowGitConfig")) {
		warnings.push(`${source}: filesystem.allowGitConfig has no first-party equivalent in this release and is ignored; .git remains governed by denyRead/denyWrite/allowWrite.`);
	}
	if (isRecord(value.network) && Object.hasOwn(value.network, "httpProxyPort")) {
		warnings.push(`${source}: network.httpProxyPort belongs to ASRT filter proxy support; network.mode=filter is deferred (${FILTER_DEFERRED_BACKLOG_ITEM}), so the knob is ignored.`);
	}
	if (isRecord(value.network) && Object.hasOwn(value.network, "socksProxyPort")) {
		warnings.push(`${source}: network.socksProxyPort belongs to ASRT filter proxy support; network.mode=filter is deferred (${FILTER_DEFERRED_BACKLOG_ITEM}), so the knob is ignored.`);
	}
	return warnings;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
