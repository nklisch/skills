import { isAbsolute, resolve } from "node:path";
import {
	buildBwrapArgs,
	buildMinimalEnv,
	canonicalizeExistingPath,
	decidePlatformState,
	findExecutableOnPath,
	resolveTrustedBwrap,
	type NetworkMode,
} from "./sandbox-bwrap";
import { loadConfig, readSandboxSpawnSessionState, type SandboxSpawnSessionStateV1 } from "./sandbox-config";
import { scrubEnvironment, type EnvScrubConfig } from "./sandbox-env";
import type { BackgroundTasksSandboxIntegration } from "./sandbox-config";

/** Env-var names known to carry provider/runtime secrets. In degraded/unsandboxed
 * spawn modes these are stripped from the inherited env so a background or monitor
 * command running without bwrap confinement cannot exfiltrate provider credentials
 * via the child process environment. The healthy bwrap path uses buildMinimalEnv
 * instead and never inherits these. This list is a non-configurable floor;
 * envScrub can only add project/operator-specific names and patterns. */
export const PROVIDER_SECRET_ENV_NAMES = [
	"ANTHROPIC_OAUTH_TOKEN",
	"ANTHROPIC_API_KEY",
	"ANTHROPIC_AUTH_TOKEN",
	"ANT_LING_API_KEY",
	"OPENAI_API_KEY",
	"AZURE_OPENAI_API_KEY",
	"GEMINI_API_KEY",
	"GOOGLE_CLOUD_API_KEY",
	"GOOGLE_APPLICATION_CREDENTIALS",
	"AWS_ACCESS_KEY_ID",
	"AWS_SECRET_ACCESS_KEY",
	"AWS_SESSION_TOKEN",
	"AWS_SECURITY_TOKEN",
	"AWS_BEARER_TOKEN_BEDROCK",
	"AWS_CONTAINER_AUTHORIZATION_TOKEN",
	"AWS_CONTAINER_AUTHORIZATION_TOKEN_FILE",
	"AWS_CONTAINER_CREDENTIALS_FULL_URI",
	"AWS_CONTAINER_CREDENTIALS_RELATIVE_URI",
	"AWS_WEB_IDENTITY_TOKEN_FILE",
	"COPILOT_GITHUB_TOKEN",
	"GITHUB_TOKEN",
	"GH_TOKEN",
	"HF_TOKEN",
	"MISTRAL_API_KEY",
	"GROQ_API_KEY",
	"DEEPSEEK_API_KEY",
	"OPENROUTER_API_KEY",
	"TOGETHER_API_KEY",
	"FIREWORKS_API_KEY",
	"CEREBRAS_API_KEY",
	"NVIDIA_API_KEY",
	"XAI_API_KEY",
	"ZAI_API_KEY",
	"ZAI_CODING_CN_API_KEY",
	"AI_GATEWAY_API_KEY",
	"MINIMAX_API_KEY",
	"MINIMAX_CN_API_KEY",
	"MOONSHOT_API_KEY",
	"KIMI_API_KEY",
	"OPENCODE_API_KEY",
	"CLOUDFLARE_API_KEY",
	"XIAOMI_API_KEY",
	"XIAOMI_TOKEN_PLAN_CN_API_KEY",
	"XIAOMI_TOKEN_PLAN_AMS_API_KEY",
	"XIAOMI_TOKEN_PLAN_SGP_API_KEY",
];

function stripProviderSecrets(env: NodeJS.ProcessEnv, envScrub: EnvScrubConfig | undefined): NodeJS.ProcessEnv {
	return scrubEnvironment(env, envScrub, PROVIDER_SECRET_ENV_NAMES);
}

export type {
	BackgroundTasksSandboxConfig,
	BackgroundTasksSandboxIntegration,
	CredentialBoundaryCapability,
} from "./sandbox-config";
export {
	CREDENTIAL_BOUNDARY_CAPABILITY_SYMBOL,
	CREDENTIAL_BOUNDARY_CAPABILITY_SYMBOL_DESCRIPTION,
	isCredentialBoundaryActive,
	readCredentialBoundaryCapability,
} from "./sandbox-config";
export {
	buildBwrapArgs,
	buildMinimalEnv,
	bwrapIsAvailable,
	decidePlatformState,
	findExecutableOnPath,
	validateBwrapInit,
	type BuildBwrapArgsOptions,
	type NetworkMode,
} from "./sandbox-bwrap";

export interface SandboxSpawnOptions {
	/** Raw shell command the caller will append after the returned `bash -c` argv prefix. */
	command: string;
	/** Per-call command working directory; used only for spawn cwd and bwrap --chdir. */
	cwd: string;
	/** Trusted session/project cwd for config loading and relative filesystem policy. Defaults to process.cwd(), never to cwd. */
	configCwd?: string;
	/** User-supplied child env additions. These may affect the wrapped command's PATH, never wrapper lookup. */
	envAdd?: NodeJS.ProcessEnv;
	/** Trusted base env for the wrapped command. bwrap lookup ignores PATH and uses sandbox.bwrapPath or the system allowlist. */
	baseEnv?: NodeJS.ProcessEnv;
	/**
	 * Session-pinned git directories (trusted init state) to bind writable, for
	 * submodules/linked worktrees whose git dir lives outside the working tree.
	 * MUST be computed once at session start and passed in — never discovered
	 * per spawn, because the `.git` gitfile is mutable and a per-spawn re-read
	 * would let an agent widen the writable surface between commands. When
	 * omitted, no git dirs are bound (the safe pre-feature default).
	 */
	pinnedGitDirs?: string[];
	/** Override the session-pinned project temp dir (for tests). A complete
	 *  explicit backend/path pair is authoritative and needs no global state. */
	projectTmpDir?: string | null;
	/** Override the tmpBackend (for tests). Production callers omit both temp
	 *  fields and read the current cross-loader session snapshot per call. */
	tmpBackend?: "session-disk" | "host-tmpfs";
	/** Isolated test/diagnostic config-root override. Live calls use the session snapshot and reject mismatches. */
	agentDir?: string;
	platform?: NodeJS.Platform;
	/** Test/diagnostic override for platform readiness; production callers should omit this. */
	bwrapAvailable?: boolean;
}

export type SandboxedSpawnArgsResult =
	| {
		state: "ok";
		integration: "active";
		executable: string;
		/** Absolute trusted bwrap path from sandbox.bwrapPath or the system allowlist; PATH is never consulted. */
		args: string[];
		cwd: string;
		/** Minimal allowlisted environment only. */
		env: NodeJS.ProcessEnv;
		message?: string;
	}
	| {
		state: "degraded";
		integration: "inactive";
		reason: "integration-off" | "sandbox-disabled" | "unsupported-platform";
		executable: null;
		args: [];
		cwd: string;
		/** Normal merged environment for current unsandboxed behavior. */
		env: NodeJS.ProcessEnv;
		message: string;
	}
	| {
		state: "fail-closed";
		integration: "blocked";
		reason: "config-parse-error" | "filter-deferred" | "bwrap-missing" | "bwrap-build-error" | "session-state-unavailable";
		executable: null;
		args: [];
		cwd: string;
		env: NodeJS.ProcessEnv;
		message: string;
		errors?: string[];
	};

type ResolvedSpawnTempState =
	| {
		ok: true;
		tmpBackend: "session-disk" | "host-tmpfs";
		projectTmpDir: string | null;
	}
	| { ok: false; reason: string };

type ResolvedSpawnSession =
	| { ok: true; agentDir: string; snapshot: SandboxSpawnSessionStateV1 | null }
	| { ok: false; reason: string };

function canonicalConfigCwd(cwd: string): string {
	const absolute = resolve(cwd);
	return canonicalizeExistingPath(absolute) ?? absolute;
}

function canonicalAgentDir(agentDir: string): string | null {
	if (!isAbsolute(agentDir)) return null;
	const absolute = resolve(agentDir);
	return canonicalizeExistingPath(absolute) ?? absolute;
}

/**
 * Select the config root from the live session contract before reading config.
 * Explicit agentDir is retained only as an isolated test/diagnostic override;
 * it must agree with any published live state and can never redirect a live
 * production call to a different policy root.
 */
function resolveSpawnSession(opts: SandboxSpawnOptions): ResolvedSpawnSession {
	const snapshot = readSandboxSpawnSessionState();
	if (snapshot.ok) {
		const requestedAgentDir = opts.agentDir === undefined ? undefined : canonicalAgentDir(opts.agentDir);
		if (opts.agentDir !== undefined && (requestedAgentDir === null || requestedAgentDir !== snapshot.value.agentDir)) {
			return { ok: false, reason: "sandbox spawn session state conflicts with requested agent dir" };
		}
		return { ok: true, agentDir: snapshot.value.agentDir, snapshot: snapshot.value };
	}
	// A malformed published state is never bypassed by test overrides. Only an
	// absent state permits an explicit isolated config-root override.
	if (snapshot.reason !== "session state is absent") {
		return { ok: false, reason: "sandbox spawn session state is unavailable" };
	}
	if (opts.agentDir === undefined) return { ok: false, reason: "sandbox spawn session state is unavailable" };
	const agentDir = canonicalAgentDir(opts.agentDir);
	if (agentDir === null) return { ok: false, reason: "sandbox spawn session state has an invalid agent dir override" };
	return { ok: true, agentDir, snapshot: null };
}

/** Resolve trusted temp state without retaining module-local lifecycle references. */
function resolveSpawnTempState(opts: SandboxSpawnOptions, configCwd: string, snapshot: SandboxSpawnSessionStateV1 | null): ResolvedSpawnTempState {
	// Complete explicit test/diagnostic overrides are authoritative and permit
	// isolated builder tests before a live session exists.
	if (opts.tmpBackend === "host-tmpfs") {
		return { ok: true, tmpBackend: "host-tmpfs", projectTmpDir: null };
	}
	if (opts.tmpBackend === "session-disk" && typeof opts.projectTmpDir === "string" && isAbsolute(opts.projectTmpDir)) {
		return { ok: true, tmpBackend: "session-disk", projectTmpDir: opts.projectTmpDir };
	}

	if (snapshot === null || snapshot.state !== "ready") {
		return { ok: false, reason: "sandbox spawn session state is unavailable" };
	}
	if (snapshot.configCwd !== canonicalConfigCwd(configCwd)) {
		return { ok: false, reason: "sandbox spawn session state belongs to a different project" };
	}

	const tmpBackend = opts.tmpBackend ?? snapshot.tmpBackend;
	const projectTmpDir = opts.projectTmpDir === undefined ? snapshot.projectTmpDir : opts.projectTmpDir;
	if (tmpBackend === "session-disk" && typeof projectTmpDir === "string" && isAbsolute(projectTmpDir)) {
		return { ok: true, tmpBackend, projectTmpDir };
	}
	if (tmpBackend === "host-tmpfs" && projectTmpDir === null) {
		return { ok: true, tmpBackend, projectTmpDir };
	}
	return { ok: false, reason: "sandbox spawn session state conflicts with requested temp configuration" };
}

/**
 * Build the pi-sandbox-owned spawn contract for background/monitor commands.
 *
 * The helper is pure with respect to process execution: it may read sandbox
 * config, inspect platform/bwrap availability, and construct argv/env, but it
 * never spawns. In the ok state, `args` intentionally stops at `bash -c`; the
 * caller appends `opts.command` as the final argv element at spawn time so the
 * command is not embedded into the reusable prefix.
 */
export function buildSandboxedSpawnArgs(opts: SandboxSpawnOptions): SandboxedSpawnArgsResult {
	const trustedEnv: NodeJS.ProcessEnv = opts.baseEnv ?? process.env;
	const normalEnv: NodeJS.ProcessEnv = { ...trustedEnv, ...(opts.envAdd ?? {}) };
	const configCwd = opts.configCwd ?? process.cwd();
	const session = resolveSpawnSession(opts);
	const env = normalEnv;
	if (!session.ok) {
		return {
			state: "fail-closed",
			integration: "blocked",
			reason: "session-state-unavailable",
			executable: null,
			args: [],
			cwd: opts.cwd,
			env,
			message: `Sandbox refused to prepare background command: ${session.reason}. Start or reload the sandbox session before retrying.`,
			errors: [session.reason],
		};
	}
	const loaded = loadConfig(configCwd, { agentDir: session.agentDir });

	if (loaded.parseErrors.length > 0) {
		return {
			state: "fail-closed",
			integration: "blocked",
			reason: "config-parse-error",
			executable: null,
			args: [],
			cwd: opts.cwd,
			env,
			message: `Sandbox config parse error(s): ${loaded.parseErrors.join("; ")}`,
			errors: loaded.parseErrors,
		};
	}

	const integration: BackgroundTasksSandboxIntegration = loaded.config.backgroundTasks?.sandboxIntegration ?? "auto";
	if (integration === "off") {
		return {
			state: "degraded",
			integration: "inactive",
			reason: "integration-off",
			executable: null,
			args: [],
			cwd: opts.cwd,
			env: stripProviderSecrets(env, loaded.config.envScrub),
			message: "Background-tasks sandbox integration is off by sandbox config; running unsandboxed by explicit operator opt-out.",
		};
	}

	if (loaded.config.enabled === false) {
		return {
			state: "degraded",
			integration: "inactive",
			reason: "sandbox-disabled",
			executable: null,
			args: [],
			cwd: opts.cwd,
			env: stripProviderSecrets(env, loaded.config.envScrub),
			message: "Sandbox is disabled by config; running background-tasks command unsandboxed.",
		};
	}

	if (loaded.failClosedReasons.length > 0) {
		return {
			state: "fail-closed",
			integration: "blocked",
			reason: "filter-deferred",
			executable: null,
			args: [],
			cwd: opts.cwd,
			env,
			message: loaded.failClosedReasons.join("; "),
			errors: loaded.failClosedReasons,
		};
	}

	const networkMode: NetworkMode = loaded.config.network?.mode ?? "open";
	const platformState = decidePlatformState({
		platform: opts.platform,
		env: trustedEnv,
		networkMode,
		bwrapPath: loaded.config.bwrapPath,
		bwrapAvailable: opts.bwrapAvailable,
	});

	if (platformState.state === "degrade") {
		return {
			state: "degraded",
			integration: "inactive",
			reason: "unsupported-platform",
			executable: null,
			args: [],
			cwd: opts.cwd,
			env: stripProviderSecrets(env, loaded.config.envScrub),
			message: platformState.message,
		};
	}

	if (platformState.state === "fail-closed") {
		return {
			state: "fail-closed",
			integration: "blocked",
			reason: platformState.reason,
			executable: null,
			args: [],
			cwd: opts.cwd,
			env,
			message: platformState.message,
			errors: [platformState.message],
		};
	}

	const bwrapResolution = opts.bwrapAvailable === false
		? { ok: false as const, reason: "trusted bwrap is not available from the configured path or system allowlist", rejectedPath: undefined }
		: resolveTrustedBwrap({ bwrapPath: loaded.config.bwrapPath, env: trustedEnv });
	if (!bwrapResolution.ok) {
		const rejected = bwrapResolution.rejectedPath ? ` Rejected path: ${bwrapResolution.rejectedPath}.` : "";
		const message = `Sandbox initialization failed: ${bwrapResolution.reason}.${rejected} Bash is fail-closed. File-tool/egress/inspector protections remain active. Fix bwrap or restart with --no-sandbox for a full extension bypass (bwrap + file-tool/egress/inspector gates).`;
		return {
			state: "fail-closed",
			integration: "blocked",
			reason: "bwrap-missing",
			executable: null,
			args: [],
			cwd: opts.cwd,
			env,
			message,
			errors: [message],
		};
	}

	const bwrapExecutable = bwrapResolution.path;
	const tempState = resolveSpawnTempState(opts, configCwd, session.snapshot);
	if (!tempState.ok) {
		return {
			state: "fail-closed",
			integration: "blocked",
			reason: "session-state-unavailable",
			executable: null,
			args: [],
			cwd: opts.cwd,
			env,
			message: `Sandbox refused to prepare background command: ${tempState.reason}. Start or reload the sandbox session before retrying.`,
			errors: [tempState.reason],
		};
	}
	const minimalEnv = buildMinimalEnv(normalEnv, loaded.config.envScrub);
	// The minimal-env allowlist (PATH/HOME/TERM/LANG/TMPDIR/LC_*) drops every
	// inherited var, which is correct for scrubbing provider secrets from the
	// host environment. But it also drops the caller's explicit envAdd — the
	// per-call additions the tool schema promises are "merged over the inherited
	// environment." Re-apply envAdd after the allowlist so caller-supplied vars
	// survive, then scrub the result so a secret placed in envAdd is still
	// stripped (envAdd is caller input, not inherently trusted for secrets).
	const okEnv = scrubEnvironment({ ...minimalEnv, ...(opts.envAdd ?? {}) }, loaded.config.envScrub, PROVIDER_SECRET_ENV_NAMES);
	try {
		const args = [
			...buildBwrapArgs({
				cwd: opts.cwd,
				configCwd,
				denyRead: loaded.config.filesystem?.denyRead ?? [],
				denyWrite: loaded.config.filesystem?.denyWrite ?? [],
				allowWrite: loaded.config.filesystem?.allowWrite ?? [],
				// Git-dir discovery is NOT done per-spawn. The `.git` gitfile lives in
				// the writable working tree, so a per-spawn discoverGitDirs would let
			// an agent mutate it between commands to widen the writable surface
				// (pointing it at another host repo's git dir, which passes the HEAD
				// check). Git-dir bind-mounting for submodules is a session-start
				// concern handled by the bash path's pinned policy; background/monitor
				// commands that need git operations in a submodule should run via the
				// sandboxed bash tool, which has the session-pinned git dirs. A caller
				// with trusted pinned git dirs may pass them via opts.pinnedGitDirs.
				pinnedGitDirs: opts.pinnedGitDirs,
				networkMode,
				// The builder reads a fresh immutable session snapshot above. Do not
				// cache the snapshot with the bridge's cached builder function: reload
				// and session replacement must take effect on the next invocation.
				projectTmpDir: tempState.projectTmpDir ?? undefined,
				tmpBackend: tempState.tmpBackend,
				env: okEnv,
			}),
			"--",
			"bash",
			"-c",
		];
		return {
			state: "ok",
			integration: "active",
			executable: bwrapExecutable,
			args,
			cwd: opts.cwd,
			env: okEnv,
		};
	} catch (e) {
		const message = e instanceof Error ? e.message : String(e);
		return {
			state: "fail-closed",
			integration: "blocked",
			reason: "bwrap-build-error",
			executable: null,
			args: [],
			cwd: opts.cwd,
			env,
			message,
			errors: [message],
		};
	}
}
