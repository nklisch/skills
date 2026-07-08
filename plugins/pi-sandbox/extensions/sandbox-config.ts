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
	/** Maximum expected full regex match length (`match[0]`), in JS string code units. Default 4096; must fit within one 10K scan window. */
	maxLength?: number;
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
	const effective = flags ?? "gu";
	return effective.includes("g") ? effective : `${effective}g`;
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
 * Detect backreferences — numeric (\1) and named (\k<name>) — unconditionally,
 * independent of skipRegexSafetyCheck. A backreference's match length depends on
 * what the captured group matched, so apparent-length estimation is unsound: a
 * pattern like ([A-Za-z0-9]{4096})\1 appears to be 4097 but matches 8192,
 * evading the windowed scan. Respects escaping (\\1 is a literal, not a
 * backref) and character classes ([\1] is a literal, not a backref).
 */
function containsBackreference(pattern: string): boolean {
	for (let i = 0; i < pattern.length; i += 1) {
		const ch = pattern[i];
		if (ch !== "\\") continue;
		const next = pattern[i + 1];
		// Numeric backreference: \1 through \99 (but not \0, which is a null).
		if (next >= "1" && next <= "9") return true;
		// Named backreference: \k<name> or \k'name'.
		if (next === "k") {
			const after = pattern[i + 2];
			if (after === "<" || after === "'") return true;
		}
		// Skip the escaped char so \\1 (escaped backslash + 1) isn't a false positive.
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

	const overlap = Math.max(SCAN_WINDOW_OVERLAP_DEFAULT, shape.maxLength);
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

			// Runtime over-length fail-closed: if a match exceeds the shape's
			// maxLength, the windowed scan cannot guarantee the full secret was
			// captured (it may straddle a window boundary and leak its tail).
			// Config validation rejects unbounded patterns, but a bounded pattern
			// can still match longer than its declared maxLength if the estimation
			// was imprecise. Signal an over-length match via a sentinel range so
			// the caller blocks rather than emit a partial redaction.
			if (fullMatch.length > shape.maxLength) {
				ranges.push({ start: -1, end: -1 });
				return ranges;
			}

			const candidate = (shape.secretGroup < match.length ? match[shape.secretGroup] : match[0]) ?? match[0];
			if (!candidate) continue;

			// Zero-width full match (e.g. lookahead (?=(sk-...))): match[0].length === 0,
			// so the redact range {start, start} is zero-length and would be dropped —
			// leaking the captured secret. The scanner cannot redact a capture group
			// that isn't contained in match[0]. Fail closed rather than emit a no-op
			// redaction that leaves the secret in place.
			if (fullMatch.length === 0 && candidate.length > 0) {
				ranges.push({ start: -1, end: -1 });
				return ranges;
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
	if (value.secretGroup !== undefined && typeof value.secretGroup !== "number") errors.push(`${path}.secretGroup must be a number`);
	if (value.entropy !== undefined && typeof value.entropy !== "number") errors.push(`${path}.entropy must be a number`);
	validateOptionalStringArray(value.keywords, `${path}.keywords`, errors);
	if (value.flags !== undefined && typeof value.flags !== "string") errors.push(`${path}.flags must be a string`);
	if (typeof value.flags === "string" && value.flags.includes("y")) {
		errors.push(`${path}.flags must not include the sticky "y" flag: chunked scanning resets regex lastIndex to 0 per window, so a sticky regex only matches at position 0 of each window and misses secrets placed elsewhere. Use the default "gu" or "giu".`);
	}
	if (value.skipRegexSafetyCheck !== undefined && typeof value.skipRegexSafetyCheck !== "boolean") errors.push(`${path}.skipRegexSafetyCheck must be a boolean`);
	if (value.maxLength !== undefined) {
		if (!Number.isInteger(value.maxLength) || value.maxLength <= 0) {
			errors.push(`${path}.maxLength must be a positive integer`);
		} else if (value.maxLength >= MAX_SCAN_LENGTH) {
			errors.push(`${path}.maxLength must be < ${MAX_SCAN_LENGTH} (a full regex match must fit within one scan window with overlap to spare; maxLength === MAX_SCAN_LENGTH forces stride=1 byte-by-byte scanning)`);
		}
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
		if (containsBackreference(value.pattern)) {
			errors.push(`${path}.pattern contains a backreference for shape ${typeof value.name === "string" && value.name.length > 0 ? `"${value.name}"` : "(unnamed)"}: apparent-length estimation is unsound (the match length depends on the captured group, not the pattern). Express repetition with a bounded quantifier instead (${value.pattern})`);
		}
		// Apparent-length check: a pattern whose match length is not bounded above
		// (open-ended +, *, {n,}) cannot be guaranteed to fit within a scan window,
		// so an over-long match can straddle a window boundary and leak its tail.
		// This runs in both validateConfig (in-memory) and loadConfig (file-based,
		// via collectSecretShapeErrors) so the two paths stay consistent.
		const maxLength = typeof value.maxLength === "number" ? value.maxLength : SCAN_WINDOW_OVERLAP_DEFAULT;
		const apparentMax = estimateRegexApparentMaxLength(value.pattern, value.flags);
		const name = typeof value.name === "string" && value.name.length > 0 ? `"${value.name}"` : "(unnamed)";
		if (apparentMax === undefined) {
			errors.push(`${path}.pattern has an unbounded match length (open-ended quantifier +, *, or {n,}) for shape ${name}; bound it (e.g. {1,64}) so the full match fits within maxLength ${maxLength} and one scan window.`);
		} else if (apparentMax > maxLength) {
			errors.push(`${path}.pattern appears to match up to ${apparentMax} code units for shape ${name}, exceeding maxLength ${maxLength}; set maxLength >= ${apparentMax} (and < ${MAX_SCAN_LENGTH}) so the full regex match fits within one scan window, or tighten the pattern.`);
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

function estimateRegexApparentMaxLength(pattern: string, flags?: string): number | undefined {
	// Under the `u` (unicode) flag, `.` and character classes match code POINTS,
	// which for astral characters (e.g. emoji) are 2 JS string code units. The
	// scan window is measured in code units (text.slice), so an astral-capable atom
	// can consume 2 code units per match. Be conservative: count astral-capable
	// atoms as 2 under `u` so the apparent max reflects the worst-case code-unit
	// length and the window-fit check is sound.
	const unicode = flags?.includes("u") ?? true; // default flags are "gu"
	const atomUnit = (literal: boolean): number => (unicode && !literal ? 2 : 1);
	const parseSequence = (start: number, terminator?: string): { length: number | undefined; index: number } => {
		let total: number | undefined = 0;
		let branchMax: number | undefined = 0;
		let i = start;
		while (i < pattern.length) {
			const ch = pattern[i];
			if (terminator && ch === terminator) break;
			if (ch === "|") {
				if (total === undefined || branchMax === undefined) branchMax = undefined;
				else branchMax = Math.max(branchMax, total);
				total = 0;
				i += 1;
				continue;
			}
			const atom = parseAtom(i);
			const quantified = applyBoundedQuantifier(atom.length, atom.index);
			if (quantified === undefined) return { length: undefined, index: i };
			if (total === undefined || quantified.length === undefined) {
				total = undefined;
			} else {
				total += quantified.length;
			}
			i = quantified.index;
		}
		if (total === undefined || branchMax === undefined) return { length: undefined, index: i };
		return { length: Math.max(branchMax, total), index: i };
	};

	const parseAtom = (start: number): { length: number; index: number } => {
		const ch = pattern[start];
		if (ch === "\\") {
			const next = pattern[start + 1];
			// Under `u`, inverted/astral-capable escapes can match astral code points (2 units):
			// \D, \S, \W match anything NOT digit/word/space (including emoji); \p{...}/\P{...}
			// are property escapes. \d, \w, \s only match ASCII (1 unit). Literal escapes
			// like \n, \t, \u0041 are 1 unit.
			if (unicode && (next === "D" || next === "S" || next === "W" || next === "p" || next === "P")) {
				// \p{...} and \P{...} consume the braces — advance past them.
				const escapeEnd = (next === "p" || next === "P") ? Math.min(pattern.length, pattern.indexOf("}", start + 3) + 1) : start + 2;
				return { length: atomUnit(false), index: escapeEnd };
			}
			return { length: 1, index: Math.min(pattern.length, start + 2) };
		}
		if (ch === "[") {
			// Parse the char class to determine if it's ASCII-only. Under `u`, a char
		// class CAN match astral code points (e.g. [😀-􏿿] or [^a-z]), so conservatively
			// count as 2. But a simple ASCII-only class like [A-Za-z0-9] only matches
			// ASCII (1 unit) even under `u` — counting it as 2 would false-reject
			// valid bounded ASCII tokens. Detect ASCII-only classes and count as 1.
		let i = start + 1;
			let negated = false;
			if (pattern[i] === "^") { negated = true; i += 1; }
			let asciiOnly = !negated; // a negated class [^...] can match astral under `u`
			while (i < pattern.length) {
				const c = pattern[i];
				if (c === "\\") {
					const escaped = pattern[i + 1];
					// \D, \S, \W, \p, \P are astral-capable under `u` (inverted/property).
					if (unicode && (escaped === "D" || escaped === "S" || escaped === "W" || escaped === "p" || escaped === "P")) asciiOnly = false;
					i += 2;
					continue;
				}
				if (c === "]") {
					return { length: asciiOnly ? 1 : atomUnit(false), index: i + 1 };
				}
				// Non-ASCII literal char in the class → astral-capable.
				if (c.codePointAt(0)! > 127) asciiOnly = false;
				i += 1;
			}
			return { length: asciiOnly ? 1 : atomUnit(false), index: pattern.length };
		}
		if (ch === "(") {
			let innerStart = start + 1;
			if (pattern[innerStart] === "?") {
				const marker = pattern[innerStart + 1];
				innerStart += marker === "<" ? 3 : 2;
			}
			const inner = parseSequence(innerStart, ")");
			return { length: inner.length ?? 0, index: Math.min(pattern.length, inner.index + 1) };
		}
		if ("^$".includes(ch)) return { length: 0, index: start + 1 };
		if (ch === ".") return { length: atomUnit(false), index: start + 1 };
		return { length: 1, index: start + 1 }; // literal char: 1 code unit
	};

	const applyBoundedQuantifier = (atomLength: number, start: number): { length: number; index: number } | undefined => {
		const ch = pattern[start];
		// Open-ended quantifiers (+, *, {n,}) match an unbounded number of times.
		// Returning undefined propagates up as an unbounded apparent length, which
		// the config validator rejects: a secret shape whose match length is not
		// bounded above cannot be guaranteed to fit within a scan window, so an
		// over-long match can straddle a window boundary and leak its tail. The
		// operator MUST bound the quantifier (e.g. {20,128}) so the full match fits.
		if (ch === "?" || ch === "*" || ch === "+") return undefined;
		if (ch !== "{") return { length: atomLength, index: start };
		const end = pattern.indexOf("}", start + 1);
		if (end === -1) return { length: atomLength, index: start };
		const quantifier = pattern.slice(start + 1, end);
		const parts = quantifier.split(",");
		if (!parts.every((part) => part === "" || /^\d+$/.test(part))) return { length: atomLength, index: start };
		const upperRaw = parts.length === 1 ? parts[0] : parts[1];
		const fallbackRaw = parts[0];
		// {n,} (open upper bound) is unbounded — same as +/*.
		if (parts.length === 2 && upperRaw === "") return undefined;
		const multiplier = upperRaw ? Number(upperRaw) : fallbackRaw ? Number(fallbackRaw) : 1;
		return { length: atomLength * multiplier, index: end + 1 };
	};

	try {
		return parseSequence(0).length;
	} catch {
		return undefined;
	}
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
