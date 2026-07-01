import {
	buildBwrapArgs,
	buildMinimalEnv,
	decidePlatformState,
	type NetworkMode,
} from "./sandbox-bwrap";
import { loadConfig } from "./sandbox-config";
import type { BackgroundTasksSandboxIntegration } from "./sandbox-config";

export type { BackgroundTasksSandboxConfig, BackgroundTasksSandboxIntegration } from "./sandbox-config";
export {
	buildBwrapArgs,
	buildMinimalEnv,
	bwrapIsAvailable,
	decidePlatformState,
	validateBwrapInit,
	type BuildBwrapArgsOptions,
	type NetworkMode,
} from "./sandbox-bwrap";

export interface SandboxSpawnOptions {
	/** Raw shell command the caller will append after the returned `bash -c` argv prefix. */
	command: string;
	cwd: string;
	envAdd?: NodeJS.ProcessEnv;
	baseEnv?: NodeJS.ProcessEnv;
	agentDir?: string;
	platform?: NodeJS.Platform;
	bwrapAvailable?: boolean;
}

export type SandboxedSpawnArgsResult =
	| {
		state: "ok";
		integration: "active";
		executable: "bwrap";
		/** bwrap args ending in ["--", "bash", "-c"]. Callers append `command` as the final argv item. */
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
	const normalEnv: NodeJS.ProcessEnv = { ...(opts.baseEnv ?? process.env), ...(opts.envAdd ?? {}) };
	const loaded = loadConfig(opts.cwd, { agentDir: opts.agentDir });
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
			env,
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
			env,
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
		env: normalEnv,
		networkMode,
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
			env,
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

	const minimalEnv = buildMinimalEnv(normalEnv);
	try {
		const args = [
			...buildBwrapArgs({
				cwd: opts.cwd,
				denyRead: loaded.config.filesystem?.denyRead ?? [],
				denyWrite: loaded.config.filesystem?.denyWrite ?? [],
				allowWrite: loaded.config.filesystem?.allowWrite ?? [],
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
			executable: "bwrap",
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
