import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, relative, isAbsolute } from "node:path";
import { canonicalizeExistingPath, decidePlatformState, normalizeConfiguredPath, type NetworkMode } from "./sandbox-bwrap";

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
	/** Absolute path to a trusted bwrap binary. When set, this overrides the default /usr/bin/bwrap, /bin/bwrap allowlist. */
	bwrapPath?: string;
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
	/** Maximum expected full regex match length (`match[0]`), in JS string code units. REQUIRED.
	 * Sets the per-shape scan-window overlap (2 × maxLength) so a full match always
	 * fits within one window regardless of position. Must be < 10000. */
	maxLength: number;
	/** Advanced escape hatch: skip the narrow ReDoS heuristic for this shape. Runtime scan-window caps still apply. */
	skipRegexSafetyCheck?: boolean;
}

export interface SecretAllowlist {
	/** Candidate strings that are never secrets (placeholders, examples). Matched against the captured group. */
	stopwords?: string[];
	/** Regexes; if any matches the captured group, the candidate is ignored. */
	regexes?: string[];
	/** Advanced escape hatch: skip the narrow ReDoS heuristic for allowlist regexes. Runtime scan-window caps still apply. */
	skipRegexSafetyCheck?: boolean;
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

export const SANDBOX_FAIL_CLOSED_MESSAGE = "Sandbox failed to initialize and is fail-closed. Fix the error above and /reload, or restart with --no-sandbox for a full extension bypass (bwrap + in-process file/egress/inspector gates).";
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

/**
 * Same-process credential-boundary capability published by pi-sandbox.
 *
 * This contract intentionally carries only non-secret state labels. Consumers
 * must re-read it immediately before loading file-backed credentials rather
 * than caching the value across a session reload.
 */
export const CREDENTIAL_BOUNDARY_CAPABILITY_SYMBOL_DESCRIPTION = "@nklisch/pi-sandbox.credential-boundary-capability";
export const CREDENTIAL_BOUNDARY_CAPABILITY_SYMBOL = Symbol.for(CREDENTIAL_BOUNDARY_CAPABILITY_SYMBOL_DESCRIPTION);

/** Non-secret health signal for extensions that require the inner credential-isolation boundary. */
export interface CredentialBoundaryCapability {
	/** True only while the Linux credential-isolation boundary is provably active. */
	active: boolean;
	/** True when sandbox initialization failed and mediated bash is blocked. */
	failClosed: boolean;
	/** State label only; never a credential path or secret. */
	reason?: string;
}

/** Read the current capability value. Consumers must treat unknown values as inactive. */
export function readCredentialBoundaryCapability(): unknown {
	return (globalThis as typeof globalThis & Record<symbol, unknown>)[CREDENTIAL_BOUNDARY_CAPABILITY_SYMBOL];
}

/** Returns true only for a capability payload that explicitly proves the boundary is active. */
export function isCredentialBoundaryActive(handshake: unknown): boolean {
	if (!handshake || typeof handshake !== "object") return false;
	return (handshake as { active?: unknown }).active === true;
}

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
		bwrapPath: input.config.bwrapPath,
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

const MAX_SCAN_LENGTH = 10_000;
// Scan long fields in overlapping bounded windows: the window cap preserves the
// regex ReDoS guard, while per-shape overlap catches secrets split across a
// window boundary. The default covers realistic long secret shapes the inspector
// supports — API keys (<100), JWTs (hundreds), and PEM private-key blocks (~2K).
// Operators can raise a shape's overlap with SecretShape.maxLength when a full
// regex match (`match[0]`) can legitimately exceed this default.
const SCAN_WINDOW_OVERLAP_DEFAULT = 4096;
// Redaction itself must also be bounded: a pathological project-supplied
// one-character redact rule should not expand a large field into megabytes of
// replacement markers. Scanning still walks every window; this cap only limits
// how many redact mutations are applied for one shape in one field.
const MAX_REDACTIONS_PER_SHAPE = MAX_SCAN_LENGTH;

interface RedactRange {
	start: number;
	end: number;
}

interface CompiledShape {
	name: string;
	re: RegExp;
	action: SecretAction;
	secretGroup: number;
	entropy: number | undefined;
	keywords: string[] | undefined;
	maxLength: number;
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
	// Always include 'g' (global, for exec loop) and 'd' (indices, for capture-group
	// span checks in the capture-outside-match sentinel). The operator's 'u'/'i'
	// flags are preserved; 'g' is added if missing.
	const effective = flags ?? "gu";
	const withG = effective.includes("g") ? effective : `${effective}g`;
	return withG.includes("d") ? withG : `${withG}d`;
}

/**
 * Narrow, heuristic ReDoS risk check for regular expressions configured in the
 * inspector and allowlist. This is not a sound regex analyzer: the runtime
 * per-window scan cap is the primary backstop, and `skipRegexSafetyCheck` lets
 * advanced operators accept the residual risk for a specific config entry.
 */
function isSafeRegex(pattern: string): { safe: boolean; reason?: string } {
	for (const group of quantifiedGroups(pattern)) {
		if (containsQuantifier(group.inner)) {
			return { safe: false, reason: "nested quantifier in quantified group (ReDoS risk)" };
		}
		if (hasOverlappingAlternation(group.inner)) {
			return { safe: false, reason: "overlapping alternation in quantified group (ReDoS risk)" };
		}
	}
	// Backreferences are checked unconditionally in validateSecretShape (see
	// containsBackreference), NOT here, because skipRegexSafetyCheck must NOT
	// bypass the backreference ban: a backreference defeats apparent-length
	// estimation (a security property, not a ReDoS heuristic) and can leak a
	// secret across a window boundary regardless of ReDoS risk.
	return { safe: true };
}

/**
 * Compute the MINIMUM possible match length (in code units) for a regex pattern.
 * This is a SOUND lower bound: the actual match is always >= this length. Unlike
 * the maximum (which required the fragile estimator we removed), the minimum is
 * trivially computable: each quantifier contributes its lower bound (n for {n,m},
 * 1 for +, 0 for * and ?, 1 for a literal/charclass/.). Used to reject operators
 * who under-declare maxLength (real min > maxLength means the match straddles
 * windows and no sentinel fires).
 *
 * Zero-width assertions (\b, \B, ^, $, lookahead (?=, lookbehind (?<=) consume
 * 0 chars. Named-group syntax (?<name>...) and non-capturing (?:...) are parsed
 * past the name marker. Lazy quantifiers (? after a quantifier, e.g. {1,5}?) are
 * consumed. Property escapes \p{...} consume through the closing brace.
 */

/**
 * If pattern[i] is a high surrogate (0xD800-0xDBFF) followed by a low surrogate
 * (0xDC00-0xDFFF), return { len: 2, next: i+2 } — the pair is one Unicode code
 * point whose JS string length is 2. Used by both estimators so a quantifier
 * after an astral literal (e.g. 😀{5000}) binds to the whole code point, not
 * just the low surrogate. Only meaningful under the 'u' flag (without it, JS
 * treats surrogates as separate code units), but harmless to call always.
 */
function astralLiteralLen(pattern: string, i: number): { len: number; next: number } | undefined {
	const code = pattern.charCodeAt(i);
	if (code >= 0xD800 && code <= 0xDBFF) {
		const next = pattern.charCodeAt(i + 1);
		if (next >= 0xDC00 && next <= 0xDFFF) return { len: 2, next: i + 2 };
	}
	return undefined;
}

/**
 * Strictly parse a braced quantifier body at pattern[braceOpen+1 .. close].
 * ECMAScript grammar: {n}, {n,}, {n,m} where n,m are decimal integers (\d+).
 * Returns { lower, upper, next } where upper is Infinity for {n,}.
 * Returns undefined when the body is NOT a valid quantifier — in that case JS
 * (non-u mode) treats the {...} text as a LITERAL, so the caller must NOT
 * consume it as a quantifier (it contributes its literal char count instead).
 * This closes a leak where {,002} was mis-parsed as max=2 but is a 25-char
 * literal under non-u flags.
 */

/**
 * Parse an escape atom starting at pattern[i] === "\\". Returns the atom's min
 * and max code-unit length and the index past the escape, so the caller can
 * apply a following quantifier to the WHOLE escape (not a hex digit inside it).
 * Handles: \b/\B (0-width), \p{...}/\P{...} (property escape, astral-capable
 * under u), \u{HEX...} (code point escape — 2 units if >0xFFFF under u),
 * \uHHHH (4-hex — 2 if surrogate pair under u), \xHH (2-hex — 1 unit),
 * \D/\S/\W (complement, astral-capable under u), and default (1 unit).
 * `atomUpperBound` is 2 under u, 1 otherwise (for astral-capable atoms).
 */
function parseEscapeAtom(pattern: string, i: number, unicode: boolean, atomUpperBound: number): { min: number; max: number; next: number } {
	const esc = pattern[i + 1];
	// Zero-width assertions: \b, \B consume 0 chars.
	if (esc === "b" || esc === "B") return { min: 0, max: 0, next: Math.min(pattern.length, i + 2) };
	// Control escape \cX (X must be A-Za-z): matches the control char (1 code unit).
	// Consume \c + the letter so a following quantifier binds to the whole escape.
	if (esc === "c" && /[A-Za-z]/.test(pattern[i + 2])) return { min: 1, max: 1, next: i + 3 };
	// Malformed \c (no following letter) under non-u: JS treats it as matching the
	// literal 2-char string "\c" (backslash + c). Under u it's a syntax error.
	// Count as 2 code units so the estimator doesn't underestimate.
	if (!unicode && esc === "c") return { min: 2, max: 2, next: i + 2 };
	// Property escapes \p{...} / \P{...}: ONLY valid under the 'u' flag AND with a
	// closing brace. Without 'u', \p is a legacy identity escape (1 char), and
	// the {...} is a literal/quantifier — fall through to default so the { isn't
	// swallowed. Without a closing brace, also fall through (invalid property escape).
	if (unicode && (esc === "p" || esc === "P")) {
		const braceEnd = pattern.indexOf("}", i + 3);
		if (braceEnd !== -1) return { min: 1, max: atomUpperBound, next: braceEnd + 1 };
	}
	// Code point escape \u{HEX...} (only valid under u): consume through }.
	// Conservatively count as astral-capable (2) — the hex value could be >0xFFFF.
	if (unicode && esc === "u" && pattern[i + 2] === "{") {
		const braceEnd = pattern.indexOf("}", i + 3);
		return { min: 1, max: atomUpperBound, next: (braceEnd === -1 ? pattern.length : braceEnd + 1) };
	}
	// \uHHHH (4 hex digits): ONLY valid when all 4 chars after \u are hex.
	// Otherwise (e.g. \u0{5000} under non-u) \u is a legacy identity escape and
	// the following chars are literals/quantifiers — fall through to default.
	// Under u, a high-surrogate value (0xD800-0xDBFF) must pair with a following
	// low-surrogate \uHHHH to form ONE astral code point (2 units). Consume both.
	// A lone high surrogate under u is a syntax error → conservative (Infinity).
	if (esc === "u" && /^[0-9a-fA-F]{4}/.test(pattern.slice(i + 2, i + 6))) {
		const hex = parseInt(pattern.slice(i + 2, i + 6), 16);
		const isHighSurrogate = hex >= 0xD800 && hex <= 0xDBFF;
		if (unicode && isHighSurrogate) {
			// Peek for a following low-surrogate \uHHHH (0xDC00-0xDFFF).
			if (pattern[i + 6] === "\\" && pattern[i + 7] === "u" && /^[0-9a-fA-F]{4}/.test(pattern.slice(i + 8, i + 12))) {
				const lowHex = parseInt(pattern.slice(i + 8, i + 12), 16);
				if (lowHex >= 0xDC00 && lowHex <= 0xDFFF) {
					return { min: 1, max: atomUpperBound, next: i + 12 }; // pair = 2 units
				}
			}
			return { min: 1, max: atomUpperBound, next: i + 6 }; // lone high surrogate — conservative 2
		}
		return { min: 1, max: 1, next: i + 6 }; // BMP value (incl. lone low surrogate)
	}
	// \xHH (2 hex digits): ONLY valid when both chars after \x are hex.
	if (esc === "x" && /^[0-9a-fA-F]{2}/.test(pattern.slice(i + 2, i + 4))) {
		return { min: 1, max: 1, next: i + 4 };
	}
	// Complement class escapes \D/\S/\W: astral-capable under u.
	if (unicode && (esc === "D" || esc === "S" || esc === "W")) {
		return { min: 1, max: atomUpperBound, next: Math.min(pattern.length, i + 2) };
	}
	// Legacy octal escapes (non-u only): \0, \1-\7, \1-\77, \1-\377.
	// Under u these are syntax errors (caught by RegExp compilation).
	// A real backreference (\N where group N exists) is already rejected by
	// containsBackreference before the estimator runs, so any \N reaching here is
	// an octal escape. Consume the full octal sequence so trailing digits aren't
	// mis-parsed as separate literals/quantifiers.
	// ECMAScript width rules: leading 0-3 may consume up to 3 octal digits (max \377);
	// leading 4-7 consumes at most 2 digits (max \77, since \400+ overflows a byte
	// and JS splits \40 + "0").
	if (!unicode && esc >= "0" && esc <= "7") {
		let maxDigits = (esc <= "3") ? 3 : 2;
		let next = i + 2;
		while (next < pattern.length && next < i + 1 + maxDigits && pattern[next] >= "0" && pattern[next] <= "7") next += 1;
		return { min: 1, max: 1, next };
	}
	// Default escape (\d, \w, \n, \p-without-u, \u-without-4-hex, etc.): 1 code unit.
	return { min: 1, max: 1, next: Math.min(pattern.length, i + 2) };
}
function parseBracedQuantifier(pattern: string, braceOpen: number): { lower: number; upper: number; next: number } | undefined {
	const end = pattern.indexOf("}", braceOpen + 1);
	if (end === -1) return undefined; // no closing brace → literal {
	const body = pattern.slice(braceOpen + 1, end);
	// Valid forms: \d+ | \d+, | \d+,\d+  (NOT {,m} — needs a leading n)
	const match = /^(\d+)(,(\d*)?)?$/.exec(body);
	if (!match) return undefined;
	const lower = parseInt(match[1], 10);
	let upper: number;
	if (match[2] === undefined) upper = lower; // {n}
	else if (match[3] === "") upper = Infinity; // {n,}
	else upper = parseInt(match[3], 10); // {n,m}
	return { lower, upper, next: end + 1 };
}
function estimateRegexMinLength(pattern: string, flags?: string): number | undefined {
	const unicode = flags !== undefined && flags.includes("u");
	const atomUpperBound = unicode ? 2 : 1;
	const parse = (start: number, terminator?: string): { length: number; index: number } | undefined => {
		let total = 0;
		let branchMin = Infinity;
		let hasBranch = false;
		let i = start;
		while (i < pattern.length) {
			const ch = pattern[i];
			if (terminator && ch === terminator) break;
			if (ch === "|") {
				branchMin = Math.min(branchMin, total);
				total = 0;
				hasBranch = true;
				i += 1;
				continue;
			}
			// Parse an atom.
			let atomMin = 1;
			let next = i + 1;
			// Astral literal (surrogate pair): one code point, min length 1, but the
			// quantifier must bind to the whole pair — advance next past both surrogates.
			const astral = astralLiteralLen(pattern, i);
			if (astral) { atomMin = 1; next = astral.next; }
			if (ch === "\\") {
				const esc = parseEscapeAtom(pattern, i, unicode, atomUpperBound);
				atomMin = esc.min; next = esc.next;
			}
			else if (ch === "[") {
				let j = i + 1;
				while (j < pattern.length && pattern[j] !== "]") { if (pattern[j] === "\\") j += 2; else j += 1; }
				atomMin = 1; next = j + 1;
			} else if (ch === "(") {
				let innerStart = i + 1;
				if (pattern[innerStart] === "?") {
					const marker = pattern[innerStart + 1];
					if (marker === ":" || marker === "=" || marker === "!") {
						// Non-capturing (?:...) or lookahead (?=...) / (?!...)
						innerStart += 2;
					} else if (marker === "<") {
						const afterLt = pattern[innerStart + 2];
						if (afterLt === "=" || afterLt === "!") {
							// Lookbehind (?<=...) / (?<!...)
							innerStart += 3;
						} else {
							// Named capture (?<name>...): skip past the name to find '>'
							const nameEnd = pattern.indexOf(">", innerStart + 2);
							innerStart = (nameEnd === -1 ? pattern.length : nameEnd + 1);
						}
					}
				}
				const inner = parse(innerStart, ")");
				if (inner === undefined) return undefined;
				// Lookahead/lookbehind are zero-width: their match length doesn't add to
				// the outer match. Heuristic: if the group started with ?= or ?!, it's
				// zero-width. (Lookbehind ?<= / ?<! are also zero-width.)
				const isLookaround = pattern[i + 1] === "?" && (pattern[i + 2] === "=" || pattern[i + 2] === "!" || (pattern[i + 2] === "<" && (pattern[i + 3] === "=" || pattern[i + 3] === "!")));
				atomMin = isLookaround ? 0 : inner.length;
				next = Math.min(pattern.length, inner.index + 1);
			} else if ("^$".includes(ch)) { atomMin = 0; next = i + 1; }
			// Quantifier
			const q = pattern[next];
			if (q === "*" || q === "?") { atomMin = 0; next += 1; }
			else if (q === "+") { /* min is one repetition of the atom — atomMin stays as-is (the atom's own min) */ next += 1; }
			else if (q === "{") {
				const parsed = parseBracedQuantifier(pattern, next);
				if (parsed !== undefined) {
					atomMin *= parsed.lower;
				next = parsed.next;
				}
				// else: invalid quantifier body → literal { (don't consume)
			}
			// Lazy quantifier suffix (?) — consume it, doesn't change the min.
			if (pattern[next] === "?") next += 1;
			total += atomMin;
			i = next;
		}
		return { length: hasBranch ? Math.min(branchMin, total) : total, index: i };
	};
	try { return parse(0)?.length; } catch { return undefined; }
}

/**
 * Compute the MAXIMUM possible match length (in code units) for a regex pattern,
 * or Infinity if unbounded. This is a CONSERVATIVE upper bound: it may overestimate
 * (e.g. counts \b as 0, astral-capable atoms as 1 since we only need a sound
 * upper bound for the window-fit check), but never underestimate. Used to reject
 * patterns whose maximum match exceeds maxLength (the match can straddle scan
 * windows and leak its tail). Infinity = unbounded (open-ended quantifier) → reject.
 *
 * This is deliberately conservative and simple: unlike the old fragile estimator
 * (which tried to be precise about astral code units and was a persistent source
 * of blockers), this only needs to be SOUND (never underestimate) and COMPLETE
 * (reject everything that could exceed maxLength). Overestimation is safe here
 * — it false-rejects configs the operator can tighten, rather than leaking.
 */
function estimateRegexMaxLength(pattern: string, flags?: string): number {
	// Under the 'u' (unicode) flag, astral-capable atoms (. and any character
	// class / property escape) can match one Unicode code point whose JS string
	// length is 2. Count them conservatively as 2 so the upper bound never
	// underestimates. (Literal astral code points in the pattern are 2 units
	// under 'u' too, but those are already consumed as multi-char atoms by the
	// loop since they're >1 char wide in the pattern string — the risk is the
	// single-char atoms like '.' and classes.)
	const unicode = flags !== undefined && flags.includes("u");
	const atomUpperBound = unicode ? 2 : 1;
	const parse = (start: number, terminator?: string): { length: number; index: number } => {
		let total = 0;
		let branchMax = 0;
		let hasBranch = false;
		let i = start;
		while (i < pattern.length) {
			const ch = pattern[i];
			if (terminator && ch === terminator) break;
			if (ch === "|") { branchMax = Math.max(branchMax, total); total = 0; hasBranch = true; i += 1; continue; }
			let atomMax = 1;
			let next = i + 1;
			// Astral literal (surrogate pair): 2 code units, quantifier binds to whole pair.
			const astral = astralLiteralLen(pattern, i);
			if (astral) { atomMax = 2; next = astral.next; }
			// Under the 'u' flag, astral-capable atoms can match 2 code units. Literals
			// and non-astral escapes are 1. Astral literals in the pattern (>0xFFFF)
			// are surrogate pairs (2 chars) consumed as two 1-unit atoms — conservative.
			if (ch === "\\") {
				const esc = parseEscapeAtom(pattern, i, unicode, atomUpperBound);
				atomMax = esc.max; next = esc.next;
			}
			else if (ch === "[") {
				let j = i + 1;
				let astralCapable = false;
				if (pattern[j] === "^") { astralCapable = true; j += 1; } // negated class matches astral
				while (j < pattern.length && pattern[j] !== "]") {
					if (pattern[j] === "\\") {
						const esc = pattern[j + 1];
						if (esc === "p" || esc === "P" || esc === "D" || esc === "S" || esc === "W" || esc === "u" || esc === "x") {
							// \p{...}, \P{...}, complement classes, \uHHHH, \xHH can reach astral (\u with high value)
							astralCapable = true;
						}
						j += 2;
					} else if (pattern.charCodeAt(j) > 0x7F) {
						astralCapable = true; // non-ASCII literal
						j += 1;
					} else { j += 1; }
				}
				atomMax = (unicode && astralCapable) ? atomUpperBound : 1;
				next = j + 1;
			} else if (ch === ".") { atomMax = atomUpperBound; next = i + 1; }
			else if (ch === "(") {
				let innerStart = i + 1;
				if (pattern[innerStart] === "?") {
					const marker = pattern[innerStart + 1];
					if (marker === ":" || marker === "=" || marker === "!") innerStart += 2;
					else if (marker === "<") {
						const afterLt = pattern[innerStart + 2];
						if (afterLt === "=" || afterLt === "!") innerStart += 3;
						else { const nameEnd = pattern.indexOf(">", innerStart + 2); innerStart = (nameEnd === -1 ? pattern.length : nameEnd + 1); }
					}
				}
				const inner = parse(innerStart, ")");
				const isLookaround = pattern[i + 1] === "?" && (pattern[i + 2] === "=" || pattern[i + 2] === "!" || (pattern[i + 2] === "<" && (pattern[i + 3] === "=" || pattern[i + 3] === "!")));
				atomMax = isLookaround ? 0 : inner.length;
				next = Math.min(pattern.length, inner.index + 1);
			} else if ("^$".includes(ch)) { atomMax = 0; next = i + 1; }
			// Quantifier
			const q = pattern[next];
			if (q === "*" || q === "+") return { length: Infinity, index: i }; // unbounded
			if (q === "?") { next += 1; } // 0 or 1 — keep atomMax
			else if (q === "{") {
				const parsed = parseBracedQuantifier(pattern, next);
				if (parsed === undefined) {
					// invalid quantifier body → literal {; don't consume. The literal
					// chars will be counted on subsequent iterations (each 1 unit).
				} else if (parsed.upper === Infinity) {
					return { length: Infinity, index: i }; // {n,} unbounded
				} else {
					atomMax *= parsed.upper;
					next = parsed.next;
				}
			}
			if (pattern[next] === "?") next += 1; // lazy suffix
			if (!Number.isFinite(atomMax)) return { length: Infinity, index: i };
			total += atomMax;
			i = next;
		}
		return { length: hasBranch ? Math.max(branchMax, total) : total, index: i };
	};
	try {
		const result = parse(0);
		return Number.isFinite(result.length) ? result.length : Infinity;
	} catch {
		return Infinity; // parse error → conservative reject
	}
}

/**
 * Detect lookaround groups ((?=) (?!) (?<=) (?<!)) — used to reject
 * secretGroup !== 0 configs whose selected capture lives inside a lookaround.
 * A lookaround's match[0] is zero-width, so the capture can exceed the scan
 * window while the max-length check (which bounds match[0]) passes.
 */
function containsLookaround(pattern: string): boolean {
	let inClass = false;
	for (let i = 0; i < pattern.length; i += 1) {
		const ch = pattern[i];
		if (inClass) {
			if (ch === "\\") { i += 1; continue; }
			if (ch === "]") inClass = false;
			continue;
		}
		if (ch === "[") { inClass = true; continue; }
		if (ch === "\\") { i += 1; continue; } // skip escape
		if (ch !== "(") continue;
		if (pattern[i + 1] === "?" && (pattern[i + 2] === "=" || pattern[i + 2] === "!")) return true;
		if (pattern[i + 1] === "?" && pattern[i + 2] === "<" && (pattern[i + 3] === "=" || pattern[i + 3] === "!")) return true;
	}
	return false;
}

/**
 * Detect context-sensitive zero-width assertions: ^, $, \b, \B. These depend
 * on input boundaries (or word boundaries), not window boundaries — so in
 * chunked scanning they match at window starts/ends even when the input
 * doesn't start/end there, causing false positives. The `m` (multiline) flag
 * makes ^/$ match at line breaks, but windowing still splits lines, so the
 * same problem applies. Reject these in chunked shapes for v0.1.0.
 */
function containsContextSensitiveAssertion(pattern: string): boolean {
	let inClass = false;
	for (let i = 0; i < pattern.length; i += 1) {
		const ch = pattern[i];
		if (inClass) {
			if (ch === "\\") { i += 1; continue; }
			if (ch === "]") inClass = false;
			continue;
		}
		if (ch === "[") { inClass = true; continue; }
		if (ch === "\\") {
			const next = pattern[i + 1];
			if (next === "b" || next === "B") return true;
			i += 1; continue;
		}
		if (ch === "^" || ch === "$") return true;
	}
	return false;
}

/**
 * Detect backreferences — numeric (\1) and named (\k<name>) — unconditionally,
 * independent of skipRegexSafetyCheck. A backreference's match length depends on
 * what the captured group matched, so apparent-length estimation is unsound: a
 * pattern like ([A-Za-z0-9]{4096})\1 appears to be 4097 but matches 8192,
 * evading the windowed scan. Respects escaping (\\1 is a literal, not a
 * backref) and character classes ([\1] is a literal, not a backref).
 */
/**
 * Count capturing groups AND extract named-group names. A '(' that is part of
 * a non-capturing/lookaround group (?: / (?= / (?! / (?<= / (?<! is NOT a capture.
 * (?<name>...) is a capture AND records the name. Escapes and char classes are
 * respected. Used to distinguish a real backreference (\N where group N exists,
 * or \k<name> where name exists) from a legacy octal/identity escape — the
 * latter is NOT a backreference and is safe for length estimation.
 */
/**
 * Normalize a regex identifier (named-group name or named-backref name) by
 * resolving \uHHHH and \u{...} escapes to their literal chars. JS normalizes
 * these in identifiers, so (?<\u0061>...) and (?<a>...) are the same group.
 * Without normalization, \k<a> wouldn't match a group named \u0061.
 */
function normalizeRegexName(raw: string): string {
	let result = "";
	let i = 0;
	while (i < raw.length) {
		if (raw[i] === "\\" && raw[i + 1] === "u") {
			if (raw[i + 2] === "{") {
				const end = raw.indexOf("}", i + 3);
				if (end !== -1) {
					const cp = parseInt(raw.slice(i + 3, end), 16);
					if (Number.isFinite(cp)) result += String.fromCodePoint(cp);
					i = end + 1; continue;
				}
			} else if (/^[0-9a-fA-F]{4}/.test(raw.slice(i + 2, i + 6))) {
				const cp = parseInt(raw.slice(i + 2, i + 6), 16);
				result += String.fromCharCode(cp);
				i += 6; continue;
			}
		}
		result += raw[i];
		i += 1;
	}
	return result;
}
function analyzeGroups(pattern: string): { count: number; names: Set<string> } {
	let count = 0;
	const names = new Set<string>();
	let inClass = false;
	for (let i = 0; i < pattern.length; i += 1) {
		const ch = pattern[i];
		if (inClass) {
			if (ch === "\\") { i += 1; continue; }
			if (ch === "]") inClass = false;
			continue;
		}
		if (ch === "\\") { i += 1; continue; }
		if (ch === "[") { inClass = true; continue; }
		if (ch !== "(") continue;
		if (pattern[i + 1] === "?") {
			const marker = pattern[i + 2];
			if (marker === ":" || marker === "=" || marker === "!") continue; // (?: (?= (?!
			if (marker === "<") {
				const afterLt = pattern[i + 3];
				if (afterLt === "=" || afterLt === "!") continue; // (?<= (?<!
				// (?<name>...) is a capturing group — count it and record the name.
				const nameEnd = pattern.indexOf(">", i + 3);
				if (nameEnd !== -1) names.add(normalizeRegexName(pattern.slice(i + 3, nameEnd)));
			}
		}
		count += 1;
	}
	return { count, names };
}

function containsBackreference(pattern: string): boolean {
	const { count: groupCount, names: namedGroups } = analyzeGroups(pattern);
	let inClass = false;
	for (let i = 0; i < pattern.length; i += 1) {
		const ch = pattern[i];
		if (inClass) {
			// Inside a char class, skip escapes (so \] doesn't close the class) and
			// never treat \1 as a backref (it's a literal in a class).
			if (ch === "\\") { i += 1; continue; }
			if (ch === "]") inClass = false;
			continue;
		}
		if (ch === "[") { inClass = true; continue; }
		if (ch !== "\\") continue;
		const next = pattern[i + 1];
		if (next === "\\") { i += 1; continue; } // escaped backslash
		if (next >= "1" && next <= "9") {
			// \N is a backreference ONLY if group N exists; otherwise it's a legacy
			// octal escape (\1 = \x01) which has a fixed length and is safe.
			// Parse the full decimal number (\10, \99, etc.).
			let numStr = next;
			let j = i + 2;
			while (j < pattern.length && pattern[j] >= "0" && pattern[j] <= "9") { numStr += pattern[j]; j += 1; }
			const num = parseInt(numStr, 10);
			if (num >= 1 && num <= groupCount) return true; // real backreference
			i = j - 1; // skip the digits (octal escape)
			continue;
		}
		if (next === "k") {
			const after = pattern[i + 2];
			if (after === "<" || after === "'") {
				// \k<name> is a named backreference ONLY if a named group with that name
				// exists. Under non-u, \k<foo> without a matching group is an identity
				// escape (matches 'k<foo>'); under u it's a syntax error (caught at compile).
				const close = after === "<" ? ">" : "'";
				const nameEnd = pattern.indexOf(close, i + 3);
				if (nameEnd !== -1) {
					const name = normalizeRegexName(pattern.slice(i + 3, nameEnd));
					if (namedGroups.has(name)) return true; // real named backref
					i = nameEnd; // skip the whole \k<name> (identity escape under non-u)
					continue;
				}
			}
		}
		i += 1;
	}
	return false;
}

function quantifiedGroups(pattern: string): Array<{ inner: string; quantifier: string }> {
	const groups: Array<{ inner: string; quantifier: string }> = [];
	for (let i = 0; i < pattern.length; i += 1) {
		if (pattern[i] !== "(" || isEscaped(pattern, i) || isInsideCharacterClass(pattern, i)) continue;
		const end = findGroupEnd(pattern, i);
		if (end === -1) continue;
		const quantifier = readGroupQuantifier(pattern, end + 1);
		if (quantifier) {
			groups.push({ inner: pattern.slice(i + 1, end).replace(/^\?(?::|[=!]|<[=!])/, ""), quantifier });
		}
		// Do NOT skip past the group (i = end): a quantified group nested inside an
		// unquantified wrapper (e.g. ^((a|aa)+)$) must still be inspected. Continue
		// scanning from i+1 so inner groups are found. (Skipping to `end` was the
		// M3 wrapper-bypass bug — it hid unsafe inner quantified groups.)
	}
	return groups;
}

function findGroupEnd(pattern: string, start: number): number {
	let depth = 0;
	let inClass = false;
	for (let i = start; i < pattern.length; i += 1) {
		const ch = pattern[i];
		if (isEscaped(pattern, i)) continue;
		if (ch === "[" && !inClass) {
			inClass = true;
			continue;
		}
		if (ch === "]" && inClass) {
			inClass = false;
			continue;
		}
		if (inClass) continue;
		if (ch === "(") depth += 1;
		else if (ch === ")") {
			depth -= 1;
			if (depth === 0) return i;
		}
	}
	return -1;
}

function readGroupQuantifier(pattern: string, index: number): string | null {
	const ch = pattern[index];
	if (ch === "+" || ch === "*" || ch === "?") return ch;
	if (ch !== "{") return null;
	const end = pattern.indexOf("}", index + 1);
	if (end === -1) return null;
	const body = pattern.slice(index + 1, end);
	return /^\d+(?:,\d*)?$/.test(body) ? pattern.slice(index, end + 1) : null;
}

function containsQuantifier(pattern: string): boolean {
	for (let i = 0; i < pattern.length; i += 1) {
		if (isEscaped(pattern, i) || isInsideCharacterClass(pattern, i)) continue;
		const ch = pattern[i];
		if (ch === "+" || ch === "*" || ch === "?") return true;
		if (ch === "{" && readGroupQuantifier(pattern, i)) return true;
	}
	return false;
}

function hasOverlappingAlternation(pattern: string): boolean {
	const branches = splitTopLevelAlternation(pattern).map(literalPrefixForOverlap).filter((branch) => branch.length > 0);
	for (let i = 0; i < branches.length; i += 1) {
		for (let j = 0; j < branches.length; j += 1) {
			if (i !== j && branches[j].startsWith(branches[i])) return true;
		}
	}
	return false;
}

function splitTopLevelAlternation(pattern: string): string[] {
	const branches: string[] = [];
	let start = 0;
	let depth = 0;
	let inClass = false;
	for (let i = 0; i < pattern.length; i += 1) {
		const ch = pattern[i];
		if (isEscaped(pattern, i)) continue;
		if (ch === "[" && !inClass) {
			inClass = true;
			continue;
		}
		if (ch === "]" && inClass) {
			inClass = false;
			continue;
		}
		if (inClass) continue;
		if (ch === "(") depth += 1;
		else if (ch === ")") depth = Math.max(0, depth - 1);
		else if (ch === "|" && depth === 0) {
			branches.push(pattern.slice(start, i));
			start = i + 1;
		}
	}
	branches.push(pattern.slice(start));
	return branches;
}

function literalPrefixForOverlap(pattern: string): string {
	let prefix = "";
	for (let i = 0; i < pattern.length; i += 1) {
		const ch = pattern[i];
		if (ch === "\\" && i + 1 < pattern.length) {
			prefix += pattern[i + 1];
			i += 1;
			continue;
		}
		if ("^$.*+?{}[]()|".includes(ch)) break;
		prefix += ch;
	}
	return prefix;
}

function isEscaped(pattern: string, index: number): boolean {
	let slashCount = 0;
	for (let i = index - 1; i >= 0 && pattern[i] === "\\"; i -= 1) slashCount += 1;
	return slashCount % 2 === 1;
}

function isInsideCharacterClass(pattern: string, index: number): boolean {
	let inClass = false;
	for (let i = 0; i < index; i += 1) {
		if (isEscaped(pattern, i)) continue;
		if (pattern[i] === "[" && !inClass) inClass = true;
		else if (pattern[i] === "]" && inClass) inClass = false;
	}
	return inClass;
}

function advanceStringIndex(text: string, index: number, unicode: boolean): number {
	if (!unicode || index + 1 >= text.length) return index + 1;
	const first = text.charCodeAt(index);
	if (first < 0xd800 || first > 0xdbff) return index + 1;
	const second = text.charCodeAt(index + 1);
	return second >= 0xdc00 && second <= 0xdfff ? index + 2 : index + 1;
}

function normalizeRedactRanges(ranges: RedactRange[]): RedactRange[] {
	const sorted = ranges
		.filter((range) => range.end > range.start)
		.sort((a, b) => a.start - b.start || a.end - b.end);
	const normalized: RedactRange[] = [];
	for (const range of sorted) {
		const previous = normalized.at(-1);
		if (previous && range.start < previous.end) {
			previous.end = Math.max(previous.end, range.end);
			continue;
		}
		normalized.push({ start: range.start, end: range.end });
	}
	return normalized;
}

function applyRedactRanges(text: string, ranges: RedactRange[], replacement: string): string {
	let redacted = "";
	let cursor = 0;
	for (const range of ranges) {
		redacted += `${text.slice(cursor, range.start)}${replacement}`;
		cursor = range.end;
	}
	return `${redacted}${text.slice(cursor)}`;
}

function scanSecretShape(text: string, shape: CompiledShape, isAllowed: (candidate: string) => boolean, stopAfterFirst = false): RedactRange[] {
	const ranges: RedactRange[] = [];
	// Keyword pre-filter gates the whole field, not per window: an attacker can
	// pad between a keyword and the secret to push them into separate windows,
	// defeating a per-window gate (keyword in window N, secret beyond the
	// overlap in window N+1 -> secret's window has no keyword -> shape skipped).
	if (shape.keywords && shape.keywords.length > 0) {
		const lower = text.toLowerCase();
		if (!shape.keywords.some((kw) => lower.includes(kw.toLowerCase()))) return ranges;
	}

	// Overlap = 2 * maxLength guarantees that any match of length L ≤ maxLength
	// that straddles a window edge is fully visible in the NEXT window: window N+1
	// starts at windowEnd - 2*maxLength, and matchStart = matchEnd - L ≥
	// (windowEnd - 2*maxLength) - maxLength = windowEnd - 3*maxLength... no.
	// Simpler: matchEnd < windowEnd (it's in this window). matchStart = matchEnd - L
	// ≥ matchEnd - maxLength. Window N+1 starts at windowEnd - 2*maxLength. For
	// N+1 to see matchStart: windowEnd - 2*maxLength ≤ matchEnd - maxLength →
	// matchEnd ≥ windowEnd - maxLength. A match ending before windowEnd - maxLength
	// is fully in window N (safe). A match ending in [windowEnd - maxLength,
	// windowEnd) might be truncated in N, but window N+1 (start = windowEnd -
	// 2*maxLength ≤ matchEnd - maxLength ≤ matchStart) fully contains it.
	const overlap = 2 * shape.maxLength;
	const stride = Math.max(1, MAX_SCAN_LENGTH - overlap);
	for (let offset = 0; offset < text.length; offset += stride) {
		const window = text.slice(offset, offset + MAX_SCAN_LENGTH);

		shape.re.lastIndex = 0;
		let match: RegExpExecArray | null;
		while ((match = shape.re.exec(window)) !== null) {
			const fullMatch = match[0] ?? "";
			const start = offset + match.index;
			const end = start + fullMatch.length;
			if (fullMatch.length === 0) {
				shape.re.lastIndex = advanceStringIndex(window, shape.re.lastIndex, shape.re.unicode);
			}

			// Runtime over-length fail-closed: if a FULL match (one the regex fully
			// saw within this window) exceeds maxLength, the secret is too long for
			// the declared bound — block. A match that straddles a window edge is
			// NOT detected here (the regex sees only a prefix, which is shorter than
			// maxLength), but the NEXT window's overlap starts `stride` later and will
			// fully contain the match (since overlap=maxLength ≥ real length), so the
			// sentinel fires there if L > maxLength, or the full match is redacted
			// there if L ≤ maxLength. The union-redaction pass dedupes overlapping
			// ranges across windows, so a prefix redacted in window N and a full
			// redaction in window N+1 merge into one covered range. NO straddle-skip
			// is needed: redacting in every window and unioning is correct.
			if (fullMatch.length > shape.maxLength) {
				ranges.push({ start: -1, end: -1 });
				return ranges;
			}

			// When secretGroup !== 0, the selected capture must exist and participate.
			// If it's undefined (alternation branch didn't capture), skip this match —
			// do NOT fall back to match[0], which would false-positive on the whole match.
			let candidate: string;
			if (shape.secretGroup !== 0) {
				const captured = shape.secretGroup < match.length ? match[shape.secretGroup] : undefined;
				if (captured === undefined || captured === null) continue; // group didn't participate
				candidate = captured;
			} else {
				candidate = match[0] ?? "";
			}
			if (!candidate) continue;

			// Capture-outside-match sentinel: for secretGroup !== 0, the captured
			// candidate must be INSIDE match[0]'s span. If it's outside (e.g. a
			// lookahead capture), redacting match[0] leaks the captured secret. Use
			// the 'd' (indices) flag for positional span checking — substring
			// inclusion (fullMatch.includes(candidate)) is bypassable when the
			// captured text duplicates a substring of match[0].
			if (shape.secretGroup !== 0 && candidate.length > 0) {
				const indices = match.indices;
				if (indices && shape.secretGroup < indices.length) {
					const captureSpan = indices[shape.secretGroup];
					const matchSpan = indices[0];
					if (captureSpan && matchSpan) {
						// The capture must be fully within [matchStart, matchEnd).
						if (captureSpan[0] < matchSpan[0] || captureSpan[1] > matchSpan[1]) {
							ranges.push({ start: -1, end: -1 });
							return ranges;
						}
					}
				} else {
					// No indices available — can't prove the capture is inside match[0].
					// Fail closed.
					ranges.push({ start: -1, end: -1 });
					return ranges;
				}
			}

			if (shape.entropy !== undefined) {
				const ent = shannonEntropy(candidate);
				const MIN_SECRET_LENGTH = 20;
				if (ent < shape.entropy && candidate.length < MIN_SECRET_LENGTH) continue;
				// else: low-entropy but long enough to be suspicious — still a candidate, so continue processing
			}

			if (isAllowed(candidate)) continue;

			ranges.push({ start, end });
			if (stopAfterFirst) return ranges;
		}

		if (offset + MAX_SCAN_LENGTH >= text.length) break;
	}
	return ranges;
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
 * Scans string-valued fields in bounded overlapping windows rather than
 * truncating long values, so a secret anywhere in a large field is still
 * inspected while each regex invocation remains capped. By default scans ALL
 * string fields ("*"), which is paranoia-first; validated effective config may
 * restrict per-tool fields, but project merges cannot drop global/default scan
 * coverage.
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
		maxLength: s.maxLength ?? SCAN_WINDOW_OVERLAP_DEFAULT,
	}));
	const allowlist: CompiledAllowlist = {
		stopwords: new Set((inspector.allowlist?.stopwords ?? []).map((w) => w.toLowerCase())),
		regexes: (inspector.allowlist?.regexes ?? []).map((r) => new RegExp(r, "iu")),
	};

	const scanFields = inspector.scanFields ?? {};
	const toolFields = scanFields[toolName];
	// "*":"*" means scan ALL string fields. This is all-field coverage that
	// applies EVEN WHEN a tool has an explicit field list — the explicit list
	// ADDS fields to scan (it does not narrow away the global all-fields rule).
	// Only an explicit non-"*" array narrows coverage to the listed fields.
	const globalAllFields = scanFields["*"] === "*";
	const scanAll =
		globalAllFields ||
		toolFields === "*" ||
		(toolFields === undefined && Object.keys(scanFields).length === 0);
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

		const originalText = text;
		for (const shape of shapes) {
			if (shape.action !== "block") continue;
			const blockRanges = scanSecretShape(originalText, shape, isAllowed, true);
			// Over-length sentinel: a match exceeded maxLength, so the windowed scan
			// cannot guarantee full capture. Block rather than risk a tail leak.
			if (blockRanges.some((r) => r.start === -1)) {
				return {
					action: "block",
					reason: `secret shape "${shape.name}" matched longer than maxLength ${shape.maxLength} in field "${field}" of tool "${toolName}"; failing closed because the windowed scan cannot guarantee the full secret was captured`,
				};
			}
			if (blockRanges.length > 0) {
				return {
					action: "block",
					reason: `secret shape "${shape.name}" matched in field "${field}" of tool "${toolName}"`,
				};
			}
		}

		// Collect redact ranges for ALL redact shapes against the ORIGINAL text
		// before mutating. Applying shapes sequentially to already-mutated text
		// lets a shorter shape destroy the evidence a longer shape needs: e.g.
		// `sk-[A-Za-z0-9]{20}` redacts the first 20 chars of a 40-char token, then
		// `sk-[A-Za-z0-9]{40}` no longer matches and the 20-char tail egresses.
		// Union all ranges across shapes, then apply once.
		interface ShapeRedaction { shape: CompiledShape; ranges: RedactRange[]; }
		const shapeRedactions: ShapeRedaction[] = [];
		let totalRanges = 0;
		for (const shape of shapes) {
			if (shape.action !== "redact") continue;
			const redactRanges = scanSecretShape(originalText, shape, isAllowed);
			if (redactRanges.some((r) => r.start === -1)) {
				return {
					action: "block",
					reason: `secret shape "${shape.name}" matched longer than maxLength ${shape.maxLength} in field "${field}" of tool "${toolName}"; failing closed because the windowed scan cannot guarantee the full secret was captured`,
				};
			}
			const normalizedRedactRanges = normalizeRedactRanges(redactRanges);
			if (normalizedRedactRanges.length > MAX_REDACTIONS_PER_SHAPE) {
				// The redaction cap is a DoS guard on redaction work, not a security
				// boundary. If a field has more unique secret-shaped matches than we
				// can safely redact, refuse the call rather than allow tail secrets
				// to egress unredacted. The operator should refine the shape or
				// allowlist the false positives.
				return {
					action: "block",
					reason: `secret shape "${shape.name}" matched more than ${MAX_REDACTIONS_PER_SHAPE} times in field "${field}" of tool "${toolName}"; redaction cap exceeded, failing closed to prevent tail-secret leakage`,
				};
			}
			if (normalizedRedactRanges.length > 0) {
				shapeRedactions.push({ shape, ranges: normalizedRedactRanges });
				totalRanges += normalizedRedactRanges.length;
			}
		}

		if (shapeRedactions.length > 0) {
			// Merge all ranges across shapes into one sorted list, then apply in a
			// single pass. When ranges from different shapes overlap, the
			// earliest-scanned shape's replacement wins (its range sorts first by
			// start, then by insertion order). This preserves the per-shape
			// replacement label while guaranteeing no secret tail survives.
			interface MergedRange { start: number; end: number; label: string; }
			const merged: MergedRange[] = [];
			for (const { shape, ranges } of shapeRedactions) {
				for (const r of ranges) merged.push({ start: r.start, end: r.end, label: `[REDACTED:${shape.name}]` });
			}
			merged.sort((a, b) => a.start - b.start);
			// Drop ranges fully covered by an earlier range (earlier start wins).
			const deduped: MergedRange[] = [];
			for (const r of merged) {
				const last = deduped[deduped.length - 1];
				if (last && r.end <= last.end) continue; // fully covered
				deduped.push(r);
			}
			let redacted = "";
			let cursor = 0;
			for (const r of deduped) {
				redacted += `${originalText.slice(cursor, r.start)}${r.label}`;
				cursor = Math.max(cursor, r.end);
			}
			redacted += originalText.slice(cursor);
			if (typeof value === "string") {
				(input as Record<string, unknown>)[field] = redacted;
			} else {
				try { (input as Record<string, unknown>)[field] = JSON.parse(redacted); } catch { (input as Record<string, unknown>)[field] = redacted; }
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
		denyRead: [
			"~/.ssh",
			"~/.aws",
			"~/.gnupg",
			"~/.pi/agent/auth.json",
			"~/.pi/agent/sessions",
			"~/.config/gh",
			"~/.git-credentials",
			"~/.netrc",
			"~/.npmrc",
			"~/.docker/config.json",
		],
		allowWrite: [".", "/tmp"],
		denyWrite: [".env"],
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
	missingDenyWarnings: string[];
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

	rejectUnknownKeys(config, "", new Set(["enabled", "bwrapPath", "filesystem", "network", "tools", "envScrub", "backgroundTasks", "ignoreViolations", "enableWeakerNestedSandbox", "httpProxyPort", "socksProxyPort"]), errors);

	if (config.enabled !== undefined && typeof config.enabled !== "boolean") {
		errors.push("enabled must be a boolean");
	}

	if (config.bwrapPath !== undefined && typeof config.bwrapPath !== "string") {
		errors.push("bwrapPath must be a string");
	}

	if (config.filesystem !== undefined) {
		if (!isRecord(config.filesystem)) {
			errors.push("filesystem must be an object");
		} else {
			rejectUnknownKeys(config.filesystem, "filesystem", new Set(["denyRead", "denyWrite", "allowWrite", "allowGitConfig"]), errors);
			validateOptionalStringArray(config.filesystem.denyRead, "filesystem.denyRead", errors);
			validateOptionalStringArray(config.filesystem.denyWrite, "filesystem.denyWrite", errors);
			validateOptionalStringArray(config.filesystem.allowWrite, "filesystem.allowWrite", errors);
		}
	}

	if (config.network !== undefined) {
		if (!isRecord(config.network)) {
			errors.push("network must be an object");
		} else {
			rejectUnknownKeys(config.network, "network", new Set(["mode", "allowedDomains", "deniedDomains", "httpProxyPort", "socksProxyPort"]), errors);
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
			rejectUnknownKeys(config.tools, "tools", new Set(["default", "rules", "inspector"]), errors);
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
		} else {
			rejectUnknownKeys(config.backgroundTasks, "backgroundTasks", new Set(["sandboxIntegration"]), errors);
			if (config.backgroundTasks.sandboxIntegration !== undefined) {
				const integration = config.backgroundTasks.sandboxIntegration;
				if (typeof integration !== "string" || !BACKGROUND_TASKS_SANDBOX_INTEGRATIONS.has(integration)) {
					errors.push('backgroundTasks.sandboxIntegration must be one of "auto" or "off"');
				}
			}
		}
	}

	if (config.envScrub !== undefined) {
		if (!isRecord(config.envScrub)) {
			errors.push("envScrub must be an object");
		} else {
			rejectUnknownKeys(config.envScrub, "envScrub", new Set(["names", "patterns", "keep"]), errors);
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
	const additiveWarnings: string[] = [];
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
	const mergedGlobal = mergeGlobalConfig(DEFAULT_CONFIG, globalConfig);
	const merged = mergeProjectAdditive(mergedGlobal, projectConfig, additiveWarnings, cwd);

	// Detect glob-shaped filesystem policy entries. The bwrap layer cannot mount
	// globs (it needs literal paths), so they provide NO protection to sandboxed
	// bash. The in-process read/write/edit tools DO enforce globs, so they still
	// protect file-tool I/O — but operators relying on them for bash protection
	// are silently exposed. Warn for both denyRead and denyWrite globs.
	const globWarnings: string[] = [];
	if (process.platform === "linux") {
		const denyReadGlobs = (merged.filesystem?.denyRead ?? []).filter(isGlobPattern);
		const denyWriteGlobs = (merged.filesystem?.denyWrite ?? []).filter(isGlobPattern);
		if (denyReadGlobs.length > 0) {
			globWarnings.push(
				`Glob denyRead patterns are enforced by the in-process read tool but NOT by sandboxed bash (bwrap cannot mount globs): ${denyReadGlobs.join(", ")}. Replace with literal dirs/files if bash must be blocked from these paths.`,
			);
		}
		if (denyWriteGlobs.length > 0) {
			globWarnings.push(
				`Glob denyWrite patterns are enforced by the in-process write/edit tools but NOT by sandboxed bash (bwrap cannot mount globs): ${denyWriteGlobs.join(", ")}. Replace with literal dirs/files if bash must be blocked from writing these paths.`,
			);
		}
		const allowWriteGlobs = (merged.filesystem?.allowWrite ?? []).filter(isGlobPattern);
		if (allowWriteGlobs.length > 0) {
			globWarnings.push(
				`Glob allowWrite patterns are enforced by the in-process write/edit tools but NOT by sandboxed bash (bwrap cannot mount globs): ${allowWriteGlobs.join(", ")}. Replace with literal dirs/files if bash must be able to write these paths.`,
			);
		}
	}

	// Warn on non-existent deny entries: bwrap silently skips paths that don't
	// exist (it cannot mount an overlay on a missing path), so a denyWrite:[".env"]
	// provides NO protection if .env doesn't yet exist — sandboxed bash can create
	// it. The in-process file tools still enforce the deny for read/write/edit, but
	// bash is exposed. Surface this so operators know bash protection is absent.
	const missingDenyWarnings: string[] = [];
	if (process.platform === "linux") {
		const denyEntries = [...(merged.filesystem?.denyRead ?? []), ...(merged.filesystem?.denyWrite ?? [])];
		for (const entry of denyEntries) {
			if (isGlobPattern(entry)) continue; // globs warned above
			const normalized = normalizeConfiguredPath(entry, cwd);
			if (!existsSync(normalized)) {
				missingDenyWarnings.push(
					`Deny entry "${entry}" does not exist on disk; bwrap cannot mask it, so sandboxed bash is NOT blocked from creating/reading it. The in-process read/write/edit tools still enforce it. Create the path or remove the entry if bash protection is not needed.`,
				);
			}
		}
	}

	const failClosedReasons: string[] = [];
	if (merged.enabled !== false && (merged.network?.mode ?? "open") === "filter") {
		failClosedReasons.push(
			`network.mode=filter is deferred for the first-party bwrap backend; bash fails closed instead of treating filtered egress as open. Use network.mode=open or network.mode=block, or implement ${FILTER_DEFERRED_BACKLOG_ITEM}.`,
		);
	}

	return { config: merged, parseErrors, globWarnings, missingDenyWarnings, legacyFieldWarnings, failClosedReasons, additiveWarnings };
}

function mergeGlobalConfig(base: SandboxConfig, global: Partial<SandboxConfig>): SandboxConfig {
	const result = deepMerge(base, global);
	const globalFilesystem = global.filesystem;
	if (globalFilesystem && Object.hasOwn(globalFilesystem, "denyRead")) {
		result.filesystem = {
			...result.filesystem,
			denyRead: mergeGlobalDenyList(base.filesystem?.denyRead ?? [], globalFilesystem.denyRead ?? []),
		};
	}
	if (globalFilesystem && Object.hasOwn(globalFilesystem, "denyWrite")) {
		result.filesystem = {
			...result.filesystem,
			denyWrite: mergeGlobalDenyList(base.filesystem?.denyWrite ?? [], globalFilesystem.denyWrite ?? []),
		};
	}
	return result;
}

function mergeGlobalDenyList(defaults: string[], configured: string[]): string[] {
	if (configured.length === 0) return [];
	return [...new Set([...defaults, ...configured])];
}

export function deepMerge(base: SandboxConfig, overrides: Partial<SandboxConfig>): SandboxConfig {
	const result: SandboxConfig = { ...base };

	if (overrides.enabled !== undefined) result.enabled = overrides.enabled;
	if (overrides.bwrapPath !== undefined) result.bwrapPath = overrides.bwrapPath;
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
export function mergeProjectAdditive(global: SandboxConfig, project: Partial<SandboxConfig>, warnings: string[] = [], cwd: string = process.cwd()): SandboxConfig {
	if (!project || Object.keys(project).length === 0) return global;

	const result: SandboxConfig = deepMerge(global, {});
	const warns: string[] = [];

	// Project may NOT disable the sandbox.
	if (project.enabled === false && global.enabled !== false) {
		warns.push(`project tried to disable sandbox; ignored (additive-only policy).`);
	}

	// bwrapPath is a global/operator-only trust decision: it selects the binary
	// that runs bash OUTSIDE the sandbox (it is the wrapper that creates the
	// sandbox). Project-local config is untrusted (a malicious checkout) and must
	// not be able to pin a hostile bwrap — that would be a sandbox escape that
	// contradicts the additive-only contract. Reject project-local bwrapPath;
	// operators who need a custom bwrap set it in global config. This also closes
	// the mid-session TOCTOU: a project writing .pi/sandbox.json with a hostile
	// bwrapPath after session_start cannot change the spawn path.
	if (project.bwrapPath !== undefined) {
		warns.push(`project tried to set bwrapPath; ignored (global/operator-only trust decision — bwrapPath selects the sandbox binary and cannot be set from untrusted project config).`);
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

	// allowWrite: project can only NARROW (tighten) the global writable set.
	// A project entry is accepted if it is EQUAL TO or NESTED WITHIN any global
	// allowWrite entry (canonical containment, not raw exact-string match). An
	// entry that widens beyond global (outside every global entry) is rejected +
	// warned. This lets a project narrow `["."]` to `["plugins"]` instead of
	// silently getting `[]`.
	if (project.filesystem?.allowWrite) {
		const globalAllow = result.filesystem?.allowWrite ?? [];
		const globalCanonical = globalAllow.map((p) => canonicalizeAllowWriteEntry(p, cwd)).filter(Boolean) as string[];
		const accepted: string[] = [];
		const rejected: string[] = [];
		for (const p of project.filesystem.allowWrite) {
			const canonical = canonicalizeAllowWriteEntry(p, cwd);
			if (!canonical) {
				rejected.push(p);
				continue;
			}
			if (globalCanonical.some((g) => canonical === g || isNestedUnder(canonical, g))) {
				accepted.push(p);
			} else {
				rejected.push(p);
			}
		}
		for (const p of rejected) {
			warns.push(`project allowWrite "${p}" is outside the global writable set; ignored (additive-only).`);
		}
		result.filesystem = { ...result.filesystem, allowWrite: accepted };
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
						warns.push(`project tried to narrow inspector scanFields for "${tool}" away from all-fields ("*"); ignored (additive-only).`);
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
	const { config, parseErrors, globWarnings, missingDenyWarnings, legacyFieldWarnings, failClosedReasons, additiveWarnings } = loaded;
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
	// The global capability is authoritative: session state must not be
	// reconstructed here, because a consumer can observe a transition between
	// command invocations.
	const credentialBoundaryCapabilityLine = formatCredentialBoundaryCapability(readCredentialBoundaryCapability());
	const legacy = legacyFieldWarnings.length > 0 ? legacyFieldWarnings : ["(none)"];
	const warnings = [...globWarnings, ...missingDenyWarnings, ...additiveWarnings];

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
		"Unsupported legacy config fields:",
		...legacy.map((warning) => `  ${warning}`),
		"",
		"Known bypass mitigation state:",
		"  Hardened by this plugin: LLM/tool bash, interactive user_bash, read, write, edit.",
		"  File-tool policy is in-process and remains active when mediated bash is fail-closed or the OS bash sandbox is unavailable.",
		"  RPC/API direct bash is not mediated by pi extensions in current pi core.",
		`  Background tasks sandbox: ${backgroundTasksLine}`,
		`  Credential boundary capability: ${credentialBoundaryCapabilityLine}`,
		`  Bypass tools: ${bypassToolPolicy}`,
		backgroundTasksIntegration.backgroundTasksSandbox === "active"
			? "  Not OS-sandboxed here: Pi extensions/packages, RPC/API direct bash, web/search tools, subagents, and provider requests."
			: "  Not OS-sandboxed here: Pi extensions/packages, RPC/API direct bash, background, monitor, web/search tools, subagents, and provider requests.",
		"  open network mode leaves host networking intact for sandboxed bash.",
		"",
		"Tool egress policy:",
		`  default: ${effectiveToolRules.default ?? "allow"}`,
		`  rules: ${Object.entries(effectiveToolRules.rules ?? {}).map(([k, v]) => `${k}=${v}`).join(", ") || "(none)"}`,
		...(warnings.length > 0 ? ["", "Warnings:", ...warnings.map((warning) => `  ${warning}`)] : []),
	].join("\n");
}

/** Canonicalize an allowWrite entry for containment comparison. Returns the
 * realpath if the path exists, else the normalized absolute path. */
function canonicalizeAllowWriteEntry(rawPath: string, cwd: string): string | null {
	const normalized = normalizeConfiguredPath(rawPath, cwd);
	return canonicalizeExistingPath(normalized) ?? normalized;
}

/** True if `path` is strictly nested under `ancestor` (not equal, not a sibling). */
function isNestedUnder(path: string, ancestor: string): boolean {
	if (path === ancestor) return false;
	const rel = relative(ancestor, path);
	return rel !== "" && !rel.startsWith("..") && !isAbsolute(rel);
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

function formatCredentialBoundaryCapability(handshake: unknown): string {
	if (!handshake || typeof handshake !== "object") return "unpublished or invalid";
	const capability = handshake as Partial<CredentialBoundaryCapability>;
	if (typeof capability.active !== "boolean" || typeof capability.failClosed !== "boolean") return "unpublished or invalid";
	const reason = typeof capability.reason === "string" && capability.reason.length > 0 ? ` (${capability.reason})` : "";
	return `active=${capability.active}, failClosed=${capability.failClosed}${reason}`;
}

function rejectUnknownKeys(value: Record<string, unknown>, path: string, knownKeys: Set<string>, errors: string[]): void {
	for (const key of Object.keys(value)) {
		if (!knownKeys.has(key)) {
			const fieldPath = path ? `${path}.${key}` : key;
			errors.push(`${fieldPath} is not a recognized config field`);
		}
	}
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
	rejectUnknownKeys(value, "tools.inspector", new Set(["secrets", "onNoMatch", "scanFields", "allowlist"]), errors);
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
			rejectUnknownKeys(value.allowlist, "tools.inspector.allowlist", new Set(["stopwords", "regexes", "skipRegexSafetyCheck"]), errors);
			validateOptionalStringArray(value.allowlist.stopwords, "tools.inspector.allowlist.stopwords", errors);
			if (value.allowlist.skipRegexSafetyCheck !== undefined && typeof value.allowlist.skipRegexSafetyCheck !== "boolean") {
				errors.push("tools.inspector.allowlist.skipRegexSafetyCheck must be a boolean");
			}
			validateOptionalStringArray(value.allowlist.regexes, "tools.inspector.allowlist.regexes", errors);
			if (Array.isArray(value.allowlist.regexes)) {
				value.allowlist.regexes.forEach((regex, index) => {
					if (typeof regex !== "string") return;
					try {
						new RegExp(regex, "iu");
					} catch (e) {
						errors.push(`tools.inspector.allowlist.regexes[${index}] must compile as a JavaScript RegExp${e instanceof Error ? ` (${e.message})` : ""}`);
						return;
					}
					if (value.allowlist.skipRegexSafetyCheck !== true) {
						const safety = isSafeRegex(regex);
						if (!safety.safe) {
							errors.push(`tools.inspector.allowlist.regexes[${index}] is unsafe: ${safety.reason} (${regex})`);
						}
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
	rejectUnknownKeys(value, path, new Set(["name", "pattern", "action", "secretGroup", "entropy", "keywords", "flags", "maxLength", "skipRegexSafetyCheck"]), errors);
	if (typeof value.name !== "string" || value.name.length === 0) errors.push(`${path}.name must be a non-empty string`);
	if (typeof value.pattern !== "string" || value.pattern.length === 0) errors.push(`${path}.pattern must be a non-empty string`);
	if (typeof value.action !== "string" || !SECRET_ACTIONS.has(value.action)) {
		errors.push(`${path}.action must be one of "block" or "redact"`);
	}
	if (value.secretGroup !== undefined) {
		if (typeof value.secretGroup !== "number" || !Number.isInteger(value.secretGroup) || value.secretGroup < 0) {
			errors.push(`${path}.secretGroup must be a non-negative integer`);
		}
	}
	if (value.entropy !== undefined && typeof value.entropy !== "number") errors.push(`${path}.entropy must be a number`);
	validateOptionalStringArray(value.keywords, `${path}.keywords`, errors);
	if (value.flags !== undefined && typeof value.flags !== "string") errors.push(`${path}.flags must be a string`);
	if (typeof value.flags === "string" && value.flags.includes("y")) {
		errors.push(`${path}.flags must not include the sticky "y" flag: chunked scanning resets regex lastIndex to 0 per window, so a sticky regex only matches at position 0 of each window and misses secrets placed elsewhere. Use the default "gu" or "giu".`);
	}
	if (typeof value.flags === "string" && value.flags.includes("v")) {
		errors.push(`${path}.flags must not include the unicodeSets "v" flag: the "v" flag enables Unicode sets (\q{...}, string properties like \p{RGI_Emoji}) that can match multi-code-point strings of unbounded length, which the length estimator cannot soundly bound. Use the default "gu" or "giu" instead.`);
	}
	if (value.skipRegexSafetyCheck !== undefined && typeof value.skipRegexSafetyCheck !== "boolean") errors.push(`${path}.skipRegexSafetyCheck must be a boolean`);
	// maxLength is REQUIRED: the windowed scan uses it as the per-shape overlap so a
	// full match always fits within one window regardless of position. Without it,
	// the scanner cannot guarantee a straddling match is fully captured, and a
	// truncated redaction would leak the secret's tail. The operator declares a
	// value they can reason about ("my tokens are 128 chars"); runtime enforcement
	// is empirical (a match ending near a window edge is suspect and blocked),
	// so no static length estimation is needed — the operator's declaration IS
	// the contract.
	if (value.maxLength === undefined) {
		errors.push(`${path}.maxLength is required: it sets the per-shape scan-window overlap so a full match always fits within one window. Declare the maximum expected full-match length in JS string code units (must be < ${MAX_SCAN_LENGTH}).`);
	} else if (!Number.isInteger(value.maxLength) || value.maxLength <= 0) {
		errors.push(`${path}.maxLength must be a positive integer`);
	} else if (value.maxLength >= MAX_SCAN_LENGTH) {
		errors.push(`${path}.maxLength must be < ${MAX_SCAN_LENGTH} (a full regex match must fit within one scan window with overlap to spare; maxLength === MAX_SCAN_LENGTH forces stride=1 byte-by-byte scanning)`);
	}
	if (typeof value.pattern === "string" && value.pattern.length > 0 && (value.flags === undefined || typeof value.flags === "string")) {
		try {
			new RegExp(value.pattern, withGlobalFlag(value.flags));
		} catch (e) {
			errors.push(`${path}.pattern must compile as a JavaScript RegExp${e instanceof Error ? ` (${e.message})` : ""}`);
			return;
		}
		if (value.skipRegexSafetyCheck !== true) {
			const safety = isSafeRegex(value.pattern);
			if (!safety.safe) {
				errors.push(`${path}.pattern is unsafe for shape ${typeof value.name === "string" && value.name.length > 0 ? `"${value.name}"` : "(unnamed)"}: ${safety.reason} (${value.pattern})`);
			}
		}
		// Backreference ban is UNCONDITIONAL (not bypassed by skipRegexSafetyCheck):
		// a backreference defeats apparent-length estimation regardless of ReDoS
		// risk, and can leak a secret across a window boundary.
		// Backreference ban is UNCONDITIONAL (not bypassed by skipRegexSafetyCheck):
		// a backreference's match length is unpredictable at config time, so an
		// over-long match could straddle a window boundary and leak. Banning them
		// outright is simpler and sounder than trying to estimate their length.
		if (containsBackreference(value.pattern)) {
			errors.push(`${path}.pattern contains a backreference for shape ${typeof value.name === "string" && value.name.length > 0 ? `"${value.name}"` : "(unnamed)"}: backreference match length is unpredictable and can leak a secret across a window boundary. Express repetition with a bounded quantifier instead (${value.pattern})`);
		}
		// Minimum-length check: the 2x overlap guarantees that a match of length
		// L <= maxLength is fully captured in some window. But if the operator
		// UNDER-declares maxLength (real min match > maxLength), the match straddles
		// multiple windows and no sentinel fires (the regex sees only a truncated
		// prefix in each). The MINIMUM match length is a sound, easily-computed
		// property (unlike the maximum, which required the fragile estimator we
		// removed): each quantifier contributes its lower bound. Reject when the
		// pattern's minimum match length exceeds maxLength — the operator's
		// declaration is provably too small.
		if (typeof value.maxLength === "number") {
			const minLength = estimateRegexMinLength(value.pattern, withGlobalFlag(value.flags));
			if (minLength !== undefined && minLength > value.maxLength) {
				errors.push(`${path}.maxLength ${value.maxLength} is smaller than the pattern's minimum match length ${minLength} for shape ${typeof value.name === "string" && value.name.length > 0 ? `"${value.name}"` : "(unnamed)"}: a real match will exceed maxLength and straddle scan windows, leaking its tail. Set maxLength >= ${minLength} (and < ${MAX_SCAN_LENGTH}).`);
			}
			// Maximum-length check: a pattern whose MAXIMUM match exceeds maxLength can
			// produce a match that straddles scan windows (the regex sees only a
			// truncated prefix in each window, so neither the over-length sentinel nor
			// a full redaction fires — the secret leaks). The maximum is conservative
			// (Infinity for unbounded quantifiers like +/*/{n,}; sum for bounded). Reject
			// when the maximum exceeds maxLength. This is the counterpart to the min
			// check: min catches under-declaration, max catches over-window variable-length.
			// Use withGlobalFlag so omitted flags default to "gu" (matching the runtime
			// regex compilation at scan time). This matters for astral accounting:\t		// estimateRegexMaxLength counts astral-capable atoms as 2 code units under
			// the 'u' flag, and the runtime always uses 'u' (via withGlobalFlag default).
			const maxLength = estimateRegexMaxLength(value.pattern, withGlobalFlag(value.flags));
			if (maxLength === Infinity) {
				errors.push(`${path}.pattern has an unbounded maximum match length (open-ended quantifier +, *, or {n,}) for shape ${typeof value.name === "string" && value.name.length > 0 ? `"${value.name}"` : "(unnamed)"}: a match can exceed any scan window and leak its tail. Bound the quantifier (e.g. {1,128}) so the full match fits within maxLength ${value.maxLength}.`);
			} else if (maxLength > value.maxLength) {
				errors.push(`${path}.maxLength ${value.maxLength} is smaller than the pattern's maximum match length ${maxLength} for shape ${typeof value.name === "string" && value.name.length > 0 ? `"${value.name}"` : "(unnamed)"}: a real match can exceed maxLength and straddle scan windows, leaking its tail. Set maxLength >= ${maxLength} (and < ${MAX_SCAN_LENGTH}), or tighten the pattern.`);
			}
			// Lookaround capture check: if secretGroup !== 0 and the pattern contains a
			// lookaround, the selected capture can live inside the lookaround where
			// match[0] is zero-width. The max-length check above bounds match[0], NOT
			// the capture, so a capture longer than the scan window can fit in the
			// (zero-width) match while never matching any window → the runtime 'd'-flag
			// sentinel never fires and the secret leaks. Reject conservatively.
			// Lookaround ban (v0.1.0): reject ALL lookaround groups ((?=) (?!) (?<=) (?<!))
			// in secret shapes, not just secretGroup !== 0. A lookaround's assertion
			// context can exceed the scan window even when match[0] is short — e.g.
			// SECRET(?=A{12000}) has match[0]=6 but needs 12006 chars of context, so
			// no 10K window satisfies the assertion and the regex never matches,
			// leaking SECRET. The max estimator bounds match[0], not assertion context.
			if (containsLookaround(value.pattern)) {
				errors.push(`${path}.pattern contains a lookaround for shape ${typeof value.name === "string" && value.name.length > 0 ? `"${value.name}"` : "(unnamed)"}: a lookaround's assertion context can exceed the scan window even when match[0] is short, so the regex never matches any window and the secret leaks. Remove the lookaround for v0.1.0.`);
			}
			// Context-sensitive assertions (^, $, \b, \B) depend on input boundaries, not
			// window boundaries — in chunked scanning they match at window starts/ends
			// even when the input doesn't start/end there, causing false positives.
			if (containsContextSensitiveAssertion(value.pattern)) {
				errors.push(`${path}.pattern contains a context-sensitive assertion (^, $, \\b, or \\B) for shape ${typeof value.name === "string" && value.name.length > 0 ? `"${value.name}"` : "(unnamed)"}: these match at input boundaries, but chunked scanning splits the input into windows where window starts/ends aren't input starts/ends, causing false-positive matches. Remove the assertion for v0.1.0.`);
			}
		}
	}
}

function effectiveBaseScanFieldsForTool(inspector: ToolInspector, tool: string): string[] | "*" | undefined {
	// "*":"*" is all-field coverage that applies to every tool, even ones with
	// an explicit field list. An explicit per-tool list adds fields; it does not
	// narrow away the global all-fields rule.
	if (inspector.scanFields?.["*"] === "*") return "*";
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
		warnings.push(`${source}: ignoreViolations is not a recognized field and is ignored by the first-party sandbox.`);
	}
	if (Object.hasOwn(value, "enableWeakerNestedSandbox")) {
		warnings.push(`${source}: enableWeakerNestedSandbox is not a recognized field and is ignored by the first-party sandbox.`);
	}
	if (Object.hasOwn(value, "httpProxyPort")) {
		warnings.push(`${source}: httpProxyPort is not a recognized field; network.mode=filter is deferred (${FILTER_DEFERRED_BACKLOG_ITEM}), so proxy-port knobs are ignored.`);
	}
	if (Object.hasOwn(value, "socksProxyPort")) {
		warnings.push(`${source}: socksProxyPort is not a recognized field; network.mode=filter is deferred (${FILTER_DEFERRED_BACKLOG_ITEM}), so proxy-port knobs are ignored.`);
	}
	if (isRecord(value.filesystem) && Object.hasOwn(value.filesystem, "allowGitConfig")) {
		warnings.push(`${source}: filesystem.allowGitConfig has no first-party equivalent in this release and is ignored; .git remains governed by denyRead/denyWrite/allowWrite.`);
	}
	if (isRecord(value.network) && Object.hasOwn(value.network, "httpProxyPort")) {
		warnings.push(`${source}: network.httpProxyPort is not a recognized field; network.mode=filter is deferred (${FILTER_DEFERRED_BACKLOG_ITEM}), so proxy-port knobs are ignored.`);
	}
	if (isRecord(value.network) && Object.hasOwn(value.network, "socksProxyPort")) {
		warnings.push(`${source}: network.socksProxyPort is not a recognized field; network.mode=filter is deferred (${FILTER_DEFERRED_BACKLOG_ITEM}), so proxy-port knobs are ignored.`);
	}
	return warnings;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
