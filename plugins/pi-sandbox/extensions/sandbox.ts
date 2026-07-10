/**
 * Sandbox Extension - OS-level sandboxing for mediated bash + file tools
 *
 * Uses a first-party Linux bubblewrap backend to enforce filesystem and
 * network restrictions on pi tool bash/user_bash commands at the OS level.
 * On non-Linux hosts, that OS backend gracefully degrades: bash/user_bash run
 * through pi's local shell backend while the in-process policy below stays on.
 *
 * Additionally registers hardened `read`/`write`/`edit` tools that enforce
 * the same denyRead/denyWrite/allowWrite policy at the tool-I/O layer. These
 * checks run IN-PROCESS and are independent of whether bwrap initialized —
 * so they hold even on sandbox-init failure (fail-closed: the bwrap layer
 * refuses to run, but file-tool policy is still enforced, not bypassed) and
 * on non-Linux graceful degrade (bash unsandboxed, file/tool policy active).
 *
 * Note: this extension overrides the tool-registry `bash`, `read`, `write`,
 * and `edit` tools. Current pi-core RPC/API `bash` calls `executeBash()`
 * directly instead of routing through this tool or the `user_bash` event, so
 * RPC/API bash is a documented residual bypass. Other pi tools (subagent,
 * provider/web-search tools) are not OS-sandboxed here. The background and
 * monitor tools get state-aware treatment: the egress policy relaxes only when
 * the Linux background-tasks bwrap integration is provably active, and stays
 * confirm/fail-closed otherwise.
 *
 * Config files (merged, project takes precedence but is ADDITIVE-ONLY):
 * - ~/.pi/agent/extensions/sandbox.json (global)
 * - <cwd>/.pi/sandbox.json (project-local; can only tighten, never weaken)
 */

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import {
	assertNoHardlinkedDeniedFiles,
	buildBwrapArgs,
	buildMinimalEnv,
	decidePlatformState,
	discoverGitDirs,
	resolveTrustedBwrap,
	shouldBypassBashSandbox,
	shouldBypassSandbox,
} from "./sandbox-bwrap";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import {
	type BashOperations,
	createBashTool,
	createEditTool,
	createReadTool,
	createWriteTool,
	getAgentDir,
} from "@earendil-works/pi-coding-agent";
import {
	SANDBOX_FAIL_CLOSED_MESSAGE,
	SANDBOX_UNINITIALIZED_MESSAGE,
	createSandboxCommandHandler,
	createUserBashBlockResult,
	decideBackgroundTasksIntegrationState,
	decideToolPolicy,
	decideUserBash,
	inspectToolInput,
	loadConfig,
	readBackgroundTasksIntegrationHandshake,
	type BackgroundTasksIntegrationDecisionInput,
	type BypassToolIntegrationState,
} from "./sandbox-config";
import {
	createFailClosedPolicy,
	createPermissivePolicy,
	makeEditOperations,
	makeReadOperations,
	makeWriteOperations,
	type SandboxPolicy,
} from "./sandbox-file-policy";
import { Type } from "typebox";

const loadPiConfig = (cwd: string) => loadConfig(cwd, { agentDir: getAgentDir() });

/**
 * Network egress lever. Decouples the filesystem sandbox from the network
 * namespace so the read/write protections hold regardless of network posture.
 *
 * - `"open"` (default): no network namespace. bash gets the host's normal
 *   network (registry fetches, web fetches, anything) — but the filesystem
 *   denyRead/denyWrite/allowWrite bind-mounts and the in-process read/write/edit
 *   guards STILL apply. Use when the allowlist is harming legitimate workflows
 *   (pub.dev, research source fetches) and the read-leak protections alone are
 *   the goal. The tool_call egress gate for provider/web-search and other
 *   in-process and stays active in every mode.
 * - `"block"`: bwrap `--unshare-net` = fully air-gapped bash.
 *   Paranoia mode (e.g. handling raw untrusted content); nothing reaches the
 *   network, allowlist is ignored.
 * - `"filter"`: deferred in the first-party bwrap backend. The extension fails
 *   closed instead of silently treating it as `open`.
 *
 * The lever mirrors the tool-egress policy vocabulary (allow/auto/confirm/block):
 * a graduated, config-driven posture rather than a binary on/off.
 */

// ---------------------------------------------------------------------------
// Hardened file-tool operations (enforce denyRead/denyWrite/allowWrite in-process)
// ---------------------------------------------------------------------------

let activePolicy: SandboxPolicy | null = null;
let pinnedBwrapPath: string | null = null;
let bwrapPinError: string | null = null;

function formatTrustedBwrapFailure(resolution: { reason: string; rejectedPath?: string }): string {
	const rejected = resolution.rejectedPath ? ` Rejected path: ${resolution.rejectedPath}.` : "";
	return `Sandbox initialization failed: ${resolution.reason}.${rejected} Bash is fail-closed. File-tool/egress/inspector protections remain active. Fix bwrap or restart with --no-sandbox for a full extension bypass (bwrap + file-tool/egress/inspector gates).`;
}

// ---------------------------------------------------------------------------
// Sandboxed bash operations
// ---------------------------------------------------------------------------

function createSandboxedBashOps(): BashOperations {
	return {
		async exec(command, cwd, { onData, signal, timeout }) {
			if (!existsSync(cwd)) {
				throw new Error(`Working directory does not exist: ${cwd}`);
			}

			const policy = activePolicyFor(cwd);
			const minimalEnv = buildMinimalEnv(process.env);
			const bwrapExecutable = pinnedBwrapPath;
			if (!bwrapExecutable) {
				throw new Error(bwrapPinError ?? "Sandbox initialization failed: no pinned trusted bwrap path is available. Bash is fail-closed. File-tool policy still enforced.");
			}
			const bwrapArgs = [
				...buildBwrapArgs({
					cwd,
					configCwd: policy.cwd,
					denyRead: policy.denyRead,
					denyWrite: policy.denyWrite,
					allowWrite: policy.allowWrite,
					networkMode: policy.networkMode,
					env: minimalEnv,
				}),
				"--",
				"bash",
				"-c",
				command,
			];

			return new Promise((resolve, reject) => {
				const child = spawn(bwrapExecutable, bwrapArgs, {
					cwd,
					detached: true,
					stdio: ["ignore", "pipe", "pipe"],
					env: minimalEnv,
				});

				let timedOut = false;
				let timeoutHandle: NodeJS.Timeout | undefined;

				if (timeout !== undefined && timeout > 0) {
					timeoutHandle = setTimeout(() => {
						timedOut = true;
						if (child.pid) {
							try {
								process.kill(-child.pid, "SIGKILL");
							} catch {
								child.kill("SIGKILL");
							}
						}
					}, timeout * 1000);
				}

				child.stdout?.on("data", onData);
				child.stderr?.on("data", onData);

				child.on("error", (err) => {
					if (timeoutHandle) clearTimeout(timeoutHandle);
					reject(err);
				});

				const onAbort = () => {
					if (child.pid) {
						try {
							process.kill(-child.pid, "SIGKILL");
						} catch {
							child.kill("SIGKILL");
						}
					}
				};

				signal?.addEventListener("abort", onAbort, { once: true });

				child.on("close", (code) => {
					if (timeoutHandle) clearTimeout(timeoutHandle);
					signal?.removeEventListener("abort", onAbort);

					if (signal?.aborted) {
						reject(new Error("aborted"));
					} else if (timedOut) {
						reject(new Error(`timeout:${timeout}`));
					} else {
						resolve({ exitCode: code });
					}
				});
			});
		},
	};
}

// ---------------------------------------------------------------------------
// Extension entry
// ---------------------------------------------------------------------------

export default function (pi: ExtensionAPI) {
	pi.registerFlag("no-sandbox", {
		description: "Disable ALL pi-sandbox protections (OS-level bash sandboxing and in-process file/egress/inspector gates)",
		type: "boolean",
		default: false,
	});

	const localCwd = process.cwd();
	const localBash = createBashTool(localCwd);

	// Fail-closed state. When true, bash refuses to run and file tools
	// refuse any I/O that isn't trivially safe. Set when init fails or
	// config can't be parsed.
	let sandboxEnabled = false;
	let sandboxInitialized = false;
	let failClosed = false;
	let disabledViaConfig = false;
	let osSandboxUnavailable = false;
	let osSandboxUnavailablePlatform: string | null = null;
	let lastFailClosedReason: string | null = null;
	let sandboxPolicy: SandboxPolicy | null = null;
	let backgroundTasksIntegrationDecisionBase: Omit<BackgroundTasksIntegrationDecisionInput, "backgroundTasksHandshake"> | null = null;
	let backgroundTasksIntegrationState: BypassToolIntegrationState = {
		backgroundTasksSandbox: "inactive",
		reason: "sandbox not initialized",
	};

	function refreshBackgroundTasksIntegrationState(): BypassToolIntegrationState {
		if (!backgroundTasksIntegrationDecisionBase) return backgroundTasksIntegrationState;
		backgroundTasksIntegrationState = decideBackgroundTasksIntegrationState({
			...backgroundTasksIntegrationDecisionBase,
			backgroundTasksHandshake: readBackgroundTasksIntegrationHandshake(),
		});
		return backgroundTasksIntegrationState;
	}

	// --- bash tool: fail-closed when sandbox didn't init ---
	pi.registerTool({
		...localBash,
		label: "bash (sandboxed)",
		async execute(id, params, signal, onUpdate, _ctx) {
			// Intentional operator bypasses and OS-backend graceful degrade both run
			// bash through pi's local shell backend. Only the operator bypasses also
			// disable file/tool policy; OS degrade keeps those in-process gates active.
			// RPC/API bash is not routed here by pi core.
			if (shouldBypassBashSandbox(pi.getFlag("no-sandbox") as boolean, disabledViaConfig, osSandboxUnavailable)) {
				return localBash.execute(id, params, signal, onUpdate);
			}

			if (failClosed) {
				return {
					content: [
						{
							type: "text",
							text: SANDBOX_FAIL_CLOSED_MESSAGE,
						},
					],
					isError: true,
				};
			}

			if (!sandboxEnabled || !sandboxInitialized) {
				// Not yet initialized (e.g. before session_start resolves) —
				// fail closed rather than run unsandboxed.
				return {
					content: [
						{
							type: "text",
							text: SANDBOX_UNINITIALIZED_MESSAGE,
						},
					],
					isError: true,
				};
			}

			const sandboxedBash = createBashTool(localCwd, {
				operations: createSandboxedBashOps(),
			});
			return sandboxedBash.execute(id, params, signal, onUpdate);
		},
	});

	// --- read tool: enforce denyRead in-process ---
	const readSchema = Type.Object({
		path: Type.String({ description: "Path to the file to read (relative or absolute)" }),
		offset: Type.Optional(Type.Number({ description: "Line number to start reading from (1-indexed)" })),
		limit: Type.Optional(Type.Number({ description: "Maximum number of lines to read" })),
	});

	pi.registerTool({
		name: "read",
		label: "read (sandboxed)",
		description:
			"Read the contents of a file with sandbox access control. Paths matching denyRead (sensitive credential/config files) are blocked. Supports text files and images (jpg, png, gif, webp). For text files, output is truncated to 2000 lines or 50KB. Use offset/limit for large files.",
		parameters: readSchema,
		async execute(id, params, signal, onUpdate, ctx) {
			// Build the tool with policy-checked operations. Policy is set at
			// session_start; if absent, fail closed for reads of anything but cwd.
			const policy = activePolicyFor(ctx?.cwd ?? localCwd);
			const readTool = createReadTool(ctx?.cwd ?? localCwd, { operations: makeReadOperations(ctx?.cwd ?? localCwd, policy) });
			return readTool.execute(id, params, signal, onUpdate);
		},
	});

	// --- write tool: enforce denyWrite + allowWrite in-process ---
	const writeSchema = Type.Object({
		path: Type.String({ description: "Path to the file to write (relative or absolute)" }),
		content: Type.String({ description: "Content to write to the file" }),
	});

	pi.registerTool({
		name: "write",
		label: "write (sandboxed)",
		description:
			"Write content to a file with sandbox access control. Writes outside allowWrite paths, or matching denyWrite patterns, are blocked. Creates the file if it doesn't exist, overwrites if it does. Automatically creates parent directories.",
		parameters: writeSchema,
		async execute(id, params, signal, onUpdate, ctx) {
			const policy = activePolicyFor(ctx?.cwd ?? localCwd);
			const writeTool = createWriteTool(ctx?.cwd ?? localCwd, { operations: makeWriteOperations(ctx?.cwd ?? localCwd, policy) });
			return writeTool.execute(id, params, signal, onUpdate);
		},
	});

	// --- edit tool: enforce both read + write policy ---
	const replaceEditSchema = Type.Object(
		{
			oldText: Type.String({
				description:
					"Exact text for one targeted replacement. It must be unique in the original file and must not overlap with any other edits[].oldText in the same call.",
			}),
			newText: Type.String({ description: "Replacement text for this targeted edit." }),
		},
		{ additionalProperties: false },
	);

	const editSchema = Type.Object(
		{
			path: Type.String({ description: "Path to the file to edit (relative or absolute)" }),
			edits: Type.Array(replaceEditSchema, {
				description:
					"One or more targeted replacements. Each edit is matched against the original file, not incrementally. Do not include overlapping or nested edits. If two changes affect the same block or nearby lines, merge them into one edit instead.",
			}),
		},
		{ additionalProperties: false },
	);

	pi.registerTool({
		name: "edit",
		label: "edit (sandboxed)",
		description:
			"Edit a single file using exact text replacement with sandbox access control. Reads and writes must satisfy denyRead/denyWrite/allowWrite. Every edits[].oldText must match a unique, non-overlapping region of the original file.",
		parameters: editSchema,
		async execute(id, params, signal, onUpdate, ctx) {
			const policy = activePolicyFor(ctx?.cwd ?? localCwd);
			const editTool = createEditTool(ctx?.cwd ?? localCwd, { operations: makeEditOperations(ctx?.cwd ?? localCwd, policy) });
			return editTool.execute(id, params, signal, onUpdate);
		},
	});

	pi.on("user_bash", () => {
		const decision = decideUserBash({
			noSandbox: pi.getFlag("no-sandbox") as boolean,
			disabledViaConfig,
			osSandboxUnavailable,
			failClosed,
			sandboxEnabled,
			sandboxInitialized,
		});
		if (decision.action === "bypass") return;
		if (decision.action === "block-failclosed" || decision.action === "block-uninitialized") {
			return createUserBashBlockResult(decision.reason);
		}
		return { operations: createSandboxedBashOps() };
	});

	// --- tool_call egress gate: configurable policy for ANY tool ---
	// Fires for built-in AND extension-registered tools (CustomToolCallEvent).
	// Reads the active tool policy; allow = no-op (zero overhead on the common
	// path), block = return {block:true, reason}, confirm = human-approval gate
	// (degrades to block when no dialog-capable UI is available).
	pi.on("tool_call", async (event, ctx) => {
		if (shouldBypassSandbox(pi.getFlag("no-sandbox") as boolean, disabledViaConfig)) return;
		const policy = activePolicy ?? activePolicyFor((ctx as { cwd?: string }).cwd ?? localCwd);
		const rules = policy.toolRules;
		const name = event.toolName;
		const decision = decideToolPolicy(name, rules, Boolean(ctx.ui && ctx.hasUI), refreshBackgroundTasksIntegrationState());
		if (decision.action === "allow") return;
		if (decision.action === "block") {
			return { block: true, reason: decision.reason };
		}
		if (decision.action === "confirm") {
			if (!ctx.ui || !ctx.hasUI) {
				return { block: true, reason: decision.reason ?? `Blocked by sandbox tool policy: "${name}" requires confirmation, but no dialog UI is available.` };
			}
			const inputSummary = summarizeToolInput(name, event.input);
			const approved = await ctx.ui.confirm(
				"Sandbox: tool egress approval",
				`The tool "${name}" is about to run${inputSummary ? ":\n" + inputSummary : "."}\n\nAllow this call?`,
			);
			if (!approved) {
				return {
					block: true,
					reason: `Blocked by user: "${name}" was not approved at the sandbox egress gate.`,
				};
			}
			return; // approved -> allow
		}
		if (decision.action === "auto") {
			// Defer to the secret-shape inspector. Runs synchronously in-process:
			// the secret never enters a judgment context (no agent, no second
			// transcript). Returns allow / block / redact-and-allow.
			const verdict = inspectToolInput(name, event.input, rules?.inspector);
			if (verdict.action === "block") {
				return {
					block: true,
					reason: `Blocked by sandbox inspector: ${verdict.reason}`,
				};
			}
			// redact: mutate event.input in place (caller sees the redacted version)
			// then allow.
			return; // redacted or no-match-allow -> allow
		}
	});

	pi.on("session_start", async (_event, ctx) => {
		failClosed = false;
		disabledViaConfig = false;
		osSandboxUnavailable = false;
		osSandboxUnavailablePlatform = null;
		lastFailClosedReason = null;
		sandboxEnabled = false;
		sandboxInitialized = false;
		sandboxPolicy = null;
		activePolicy = null;
		pinnedBwrapPath = null;
		bwrapPinError = null;
		backgroundTasksIntegrationDecisionBase = null;
		backgroundTasksIntegrationState = {
			backgroundTasksSandbox: "inactive",
			reason: "sandbox not initialized",
		};

		const noSandbox = pi.getFlag("no-sandbox") as boolean;

		if (noSandbox) {
			sandboxEnabled = false;
			sandboxPolicy = createPermissivePolicy(ctx.cwd);
			activePolicy = sandboxPolicy;
			backgroundTasksIntegrationDecisionBase = null;
			backgroundTasksIntegrationState = {
				backgroundTasksSandbox: "inactive",
				reason: "sandbox disabled via --no-sandbox",
			};
			ctx.ui.notify("Sandbox disabled via --no-sandbox", "warning");
			return;
		}

		const { config, parseErrors, globWarnings, missingDenyWarnings, legacyFieldWarnings, additiveWarnings, failClosedReasons } = loadPiConfig(ctx.cwd);
		backgroundTasksIntegrationDecisionBase = { config, parseErrors, failClosedReasons, env: process.env };

		// Fail-closed on config parse/validation errors. Install the restrictive
		// in-process policy before returning so read/write/edit and tool_call do
		// not fall back to permissive startup behavior.
		if (parseErrors.length > 0) {
			failClosed = true;
			lastFailClosedReason = `config parse error(s): ${parseErrors.join("; ")}`;
			sandboxPolicy = createFailClosedPolicy(ctx.cwd);
			activePolicy = sandboxPolicy;
			backgroundTasksIntegrationState = refreshBackgroundTasksIntegrationState();
			const msg = `Sandbox config parse error(s):\n${parseErrors.join("\n")}\nBash + file tools are fail-closed until fixed.`;
			ctx.ui.notify(msg, "error");
			ctx.ui.setStatus("sandbox", ctx.ui.theme.fg("error", "🔒 Sandbox: FAIL-CLOSED (config parse error)"));
			return;
		}

		for (const w of legacyFieldWarnings) ctx.ui.notify(w, "warning");
		for (const w of globWarnings) ctx.ui.notify(w, "warning");
		for (const w of missingDenyWarnings) ctx.ui.notify(w, "warning");
		for (const w of additiveWarnings) ctx.ui.notify(w, "warning");

		if (!config.enabled) {
			sandboxEnabled = false;
			disabledViaConfig = true;
			sandboxPolicy = createPermissivePolicy(ctx.cwd);
			activePolicy = sandboxPolicy;
			backgroundTasksIntegrationState = refreshBackgroundTasksIntegrationState();
			ctx.ui.notify("Sandbox disabled via config", "info");
			return;
		}

		// session_start intentionally leaves process.env untouched. Degraded spawn
		// paths now perform per-child env scrubbing in sandbox-spawn.ts.
		const netMode = config.network?.mode ?? "open";

		// Always set the file-tool policy, even before bwrap init succeeds —
		// the read/write/edit tools use it in-process and hold independently.
		// Hardlink-alias guard: the in-process file tools (enforceDenyRead /
		// enforceWritePolicy) use pathname/canonical-realpath checks, which cannot
		// distinguish a hardlink alias from the denied file (same inode, different
		// pathname). Fail closed at policy installation if any denied file (explicit
		// or inside a denied directory) has nlink > 1 — the same guard buildBwrapArgs
		// runs for the bwrap path, so both surfaces stay consistent.
		const denyRead = config.filesystem?.denyRead ?? [];
		const denyWrite = config.filesystem?.denyWrite ?? [];
		try {
			assertNoHardlinkedDeniedFiles(denyRead, denyWrite, ctx.cwd);
		} catch (e) {
			failClosed = true;
			lastFailClosedReason = e instanceof Error ? e.message : String(e);
			sandboxPolicy = createFailClosedPolicy(ctx.cwd);
			activePolicy = sandboxPolicy;
			backgroundTasksIntegrationState = refreshBackgroundTasksIntegrationState();
			ctx.ui.notify(`Sandbox fail-closed: ${e instanceof Error ? e.message : e}`, "error");
			ctx.ui.setStatus("sandbox", ctx.ui.theme.fg("error", "🔒 Sandbox: FAIL-CLOSED (hardlink alias)"));
			return;
		}
		sandboxPolicy = {
			denyRead,
			denyWrite,
			// Augment allowWrite with auto-discovered git directories for submodules
			// and linked worktrees whose `.git` gitfile points outside the working
			// tree. discoverGitDirs validates the target (has HEAD) so a malicious
			// `.git` file cannot widen the surface; denyWrite still takes precedence
			// in enforceWritePolicy. Keeps the in-process file tools consistent with
			// the bwrap layer (which binds the same paths in buildBwrapArgs).
			allowWrite: [...(config.filesystem?.allowWrite ?? []), ...discoverGitDirs(config.filesystem?.allowWrite ?? [], ctx.cwd)],
			cwd: ctx.cwd,
			networkMode: netMode,
			toolRules: config.tools,
		};
		activePolicy = sandboxPolicy;

		if (process.platform === "linux") {
			const bwrapResolution = resolveTrustedBwrap({ bwrapPath: config.bwrapPath, env: process.env });
			if (!bwrapResolution.ok) {
				failClosed = true;
				bwrapPinError = formatTrustedBwrapFailure(bwrapResolution);
				lastFailClosedReason = bwrapPinError;
				backgroundTasksIntegrationDecisionBase = { config, failClosedReasons, env: process.env };
				backgroundTasksIntegrationState = refreshBackgroundTasksIntegrationState();
				ctx.ui.notify(bwrapPinError, "error");
				ctx.ui.setStatus("sandbox", ctx.ui.theme.fg("error", "🔒 Sandbox: FAIL-CLOSED (bwrap missing) — file tools still hardened"));
				return;
			}
			pinnedBwrapPath = bwrapResolution.path;
		}

		const platformState = decidePlatformState({ networkMode: netMode, env: process.env, bwrapPath: config.bwrapPath });
		backgroundTasksIntegrationDecisionBase = { config, failClosedReasons, env: process.env };
		backgroundTasksIntegrationState = refreshBackgroundTasksIntegrationState();
		if (platformState.state === "degrade") {
			osSandboxUnavailable = true;
			osSandboxUnavailablePlatform = platformState.platform;
			sandboxEnabled = false;
			sandboxInitialized = false;
			failClosed = false;
			lastFailClosedReason = null;
			backgroundTasksIntegrationDecisionBase = {
				config,
				failClosedReasons,
				env: process.env,
				platform: platformState.platform,
				bwrapAvailable: false,
			};
			backgroundTasksIntegrationState = refreshBackgroundTasksIntegrationState();
			ctx.ui.notify(platformState.message, "info");
			ctx.ui.setStatus("sandbox", ctx.ui.theme.fg("warning", platformState.status));
			return;
		}
		if (platformState.state === "fail-closed") {
			failClosed = true;
			lastFailClosedReason = platformState.message;
			backgroundTasksIntegrationDecisionBase = { config, failClosedReasons, env: process.env };
			backgroundTasksIntegrationState = refreshBackgroundTasksIntegrationState();
			ctx.ui.notify(platformState.message, "error");
			ctx.ui.setStatus("sandbox", ctx.ui.theme.fg("error", platformState.status));
			return;
		}

		sandboxEnabled = true;
		sandboxInitialized = true;
		failClosed = false;
		lastFailClosedReason = null;
		backgroundTasksIntegrationDecisionBase = { config, failClosedReasons, env: process.env };
		backgroundTasksIntegrationState = refreshBackgroundTasksIntegrationState();

		const networkCount = config.network?.allowedDomains?.length ?? 0;
		const writeCount = config.filesystem?.allowWrite?.length ?? 0;
		const netLabel =
			netMode === "open"
				? "net open"
				: netMode === "block"
					? `net block (0 domains)`
					: `net filter ${networkCount} domains`;
		ctx.ui.setStatus(
			"sandbox",
			ctx.ui.theme.fg("accent", `🔒 Sandbox: ${netLabel}, ${writeCount} write paths, file tools hardened`),
		);
		ctx.ui.notify(
			`Sandbox initialized (bash + read/write/edit hardened; network: ${netMode})`,
			"info",
		);
	});

	pi.on("session_shutdown", async () => {
		// First-party bwrap runs per command and leaves no shared runtime state to reset.
		sandboxEnabled = false;
		sandboxInitialized = false;
		failClosed = false;
		disabledViaConfig = false;
		osSandboxUnavailable = false;
		osSandboxUnavailablePlatform = null;
		lastFailClosedReason = null;
		sandboxPolicy = null;
		activePolicy = null;
		pinnedBwrapPath = null;
		bwrapPinError = null;
		backgroundTasksIntegrationDecisionBase = null;
		backgroundTasksIntegrationState = {
			backgroundTasksSandbox: "inactive",
			reason: "session shutdown",
		};
	});

	pi.registerCommand("sandbox", {
		description: "Show sandbox configuration",
		handler: createSandboxCommandHandler({
			load: loadPiConfig,
			getState: () => {
				const backgroundTasksIntegration = refreshBackgroundTasksIntegrationState();
				return {
					failClosed,
					sandboxEnabled,
					sandboxInitialized,
					disabledViaConfig,
					osSandboxUnavailable,
					osSandboxUnavailablePlatform,
					lastFailClosedReason,
					backgroundTasksIntegration,
				};
			},
		}),
	});
}

/**
 * Return the active file-tool policy. If the sandbox hasn't initialized yet
 * (e.g. a read is attempted before session_start completes), fall back to the
 * same restrictive fail-closed policy used for invalid config: block all reads,
 * writes, and tool egress until a real policy is installed.
 */
function activePolicyFor(cwd: string): SandboxPolicy {
	if (activePolicy) return activePolicy;
	return createFailClosedPolicy(cwd);
}

/**
 * Build a short, safe summary of a tool's input for the confirm dialog.
 * Never includes file contents — only paths/commands/identifiers, truncated.
 * Used only when policy is "confirm", so the user can see what they're approving.
 */
function summarizeToolInput(name: string, input: Record<string, unknown>): string {
	const parts: string[] = [];
	const push = (label: string, value: unknown): void => {
		if (typeof value === "string" && value) {
			parts.push(`${label}: ${value.slice(0, 200)}`);
		} else if (typeof value === "number") {
			parts.push(`${label}: ${value}`);
		}
	};
	// Common fields across tools. Path-like keys are safe to surface.
	for (const key of ["path", "command", "to", "query", "prompt", "description", "subagent_type", "model", "cwd"]) {
		push(key, input[key]);
	}
	return parts.join("\n");
}

