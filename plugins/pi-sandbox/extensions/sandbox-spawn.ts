import {
	buildBwrapArgs,
	buildMinimalEnv,
	decidePlatformState,
	discoverGitDirs,
	findExecutableOnPath,
	resolveTrustedBwrap,
	type NetworkMode,
} from "./sandbox-bwrap";
import { loadConfig, type EnvScrubConfig } from "./sandbox-config";
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

function compileEnvScrubPatterns(patterns: string[] | undefined): RegExp[] {
	return (patterns ?? []).map((pattern) => {
		const regexSource = pattern
			.replace(/[.+^${}()|[\]\\]/g, "\\$&")
			.replace(/\*/g, ".*")
			.replace(/\?/g, ".");
		return new RegExp(`^${regexSource}$`, "i");
	});
}

function stripProviderSecrets(env: NodeJS.ProcessEnv, envScrub: EnvScrubConfig | undefined): NodeJS.ProcessEnv {
	const scrubNames = new Set<string>(PROVIDER_SECRET_ENV_NAMES);
	for (const name of envScrub?.names ?? []) scrubNames.add(name);
	const patterns = compileEnvScrubPatterns(envScrub?.patterns);
	const stripped = { ...env };
	for (const name of Object.keys(stripped)) {
		if (scrubNames.has(name) || patterns.some((pattern) => pattern.test(name))) {
			delete stripped[name];
		}
	}
	return stripped;
}

export type { BackgroundTasksSandboxConfig, BackgroundTasksSandboxIntegration } from "./sandbox-config";
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
		reason: "config-parse-error" | "filter-deferred" | "bwrap-missing" | "bwrap-build-error";
		executable: null;
		args: [];
		cwd: string;
		env: NodeJS.ProcessEnv;
		message: string;
		errors?: string[];
	};

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
	const loaded = loadConfig(configCwd, { agentDir: opts.agentDir });
	const env = normalEnv;

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
	const minimalEnv = buildMinimalEnv(normalEnv);
	// Discover git dirs once for this spawn (background/monitor commands are
	// short-lived, so this is init-time for the command, not per-command within
	// a long session). Pinned into buildBwrapArgs rather than re-discovered.
	const pinnedGitDirs = discoverGitDirs(loaded.config.filesystem?.allowWrite ?? [], configCwd);
	try {
		const args = [
			...buildBwrapArgs({
				cwd: opts.cwd,
				configCwd,
				denyRead: loaded.config.filesystem?.denyRead ?? [],
				denyWrite: loaded.config.filesystem?.denyWrite ?? [],
				allowWrite: loaded.config.filesystem?.allowWrite ?? [],
				pinnedGitDirs,
				networkMode,
				env: minimalEnv,
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
			env: minimalEnv,
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
