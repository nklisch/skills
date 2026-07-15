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
import { createHash } from "node:crypto";
import { existsSync, lstatSync, mkdirSync, realpathSync } from "node:fs";
import { homedir } from "node:os";
import { isAbsolute, join } from "node:path";
import {
	assertNoHardlinkedDeniedFiles,
	buildBwrapArgs,
	buildMinimalEnv,
	canonicalizeExistingPath,
	decidePlatformState,
	discoverGitDirs,
	resolveTrustedBwrap,
	shouldBypassBashSandbox,
	shouldBypassSandbox,
	type NetworkMode,
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
	CREDENTIAL_BOUNDARY_CAPABILITY_SYMBOL,
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
	type CredentialBoundaryCapability,
	type BypassToolIntegrationState,
	type EnvScrubConfig,
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

/** Accessor for the pinned per-project disk-backed temp dir. Read by
 *  buildSandboxedSpawnArgs (via sandbox-spawn.ts) so the background/monitor
 *  path resolves the same project temp dir as the bash path. Returns null
 *  before session_start resolves or under tmpBackend!="session-disk"; the
 *  caller (buildSandboxedSpawnArgs) fails-closed when session-disk is active
 *  but this returns null.
 *
 *  B2 (round-4 review): this DERIVES from `activePolicy` (the single source
 *  of truth) rather than separate module-level state, so it can never diverge
 *  from the policy the bash path uses. Previously the module state and the
 *  policy had different lifecycles and diverged on early-return branches
 *  (e.g. --no-sandbox installed a permissive host-tmpfs policy but left the
 *  module tmpBackend="session-disk"), which made buildSandboxedSpawnArgs throw
 *  session-disk-requires-projectTmpDir and break background commands. */
export function getProjectTmpDir(): string | null {
	return activePolicy?.projectTmpDir ?? null;
}

/** Accessor for the resolved tmpBackend. Read by buildSandboxedSpawnArgs so the
 *  background/monitor path selects the same session-disk/host-tmpfs branch as
 *  the bash path. Derives from `activePolicy` (B2 — see getProjectTmpDir) so it
 *  cannot diverge from the installed policy. Defaults to "session-disk" before
 *  session_start, matching the config default and the fail-closed posture. */
export function getTmpBackend(): "session-disk" | "host-tmpfs" {
	return activePolicy?.tmpBackend ?? "session-disk";
}

/** The active sandbox policy (trusted init state set at session_start). Exposed so
 *  tests and diagnostics can verify the policy object itself carries the
 *  derived values — not just the module-level accessors (B1 regression: the
 *  policy was constructed before derivation, capturing null placeholders, while
 *  the accessors read the later-set module state, so an accessor-only test
 *  passed against the bug). Returns null before session_start or after
 *  session_shutdown. */
export function getSandboxPolicy(): SandboxPolicy | null {
	return activePolicy;
}

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
let envScrubConfig: EnvScrubConfig | null = null;
let pinnedBwrapPath: string | null = null;
let bwrapPinError: string | null = null;

/** Result of deriving the per-project disk temp dir at session_start. The dir
 *  is NOT runtime-validated for backing-store filesystem type — the operator
 *  asserts XDG_CACHE_HOME and verifies it is disk-backed with `findmnt` per
 *  the docs (see feature-pi-sandbox-disk-backed-tmp Strategic decisions:
 *  scope cut). Runtime fs-type detection was removed after three review rounds
 *  found every variant failed open; the host filesystem layout is the
 *  operator's outer-boundary responsibility per THREAT_MODEL "Two boundaries". */
type SessionInit =
	| { ok: true; projectTmpDir: string }
	| { ok: false; reason: string };

/** Derive the per-project disk-backed temp dir. Pure validation + mkdir — no
 *  fs-type probe, no write probe. The dir is keyed by a stable hash of the
 *  canonical (realpath) cwd so it is stable + shared across concurrent
 *  sessions in the same project. Canonicalizes the cache root AFTER creation
 *  (R2-I3) and the mask roots with the same helper buildBwrapArgs uses (R3-I1)
 *  so a symlinked /tmp is caught. Rejects a cache root nested under a
 *  block-mode mask path ONLY in block mode (R2-I2). No write probe (R3-B3):
 *  mkdirSync(recursive) already proves the dir exists and the parent is
 *  writable; a create-by-name probe in the shared sandbox-writable temp dir
 *  was a symlink-truncation escape vector and added zero safety. */
function deriveProjectTmpDir(cwd: string, netMode: NetworkMode): SessionInit {
	const cacheRootRaw = process.env.XDG_CACHE_HOME || join(homedir(), ".cache");
	// I4: reject a relative/empty XDG_CACHE_HOME (would produce a relative
	// TMPDIR diverging from the canonicalized bind source).
	if (!isAbsolute(cacheRootRaw)) {
		return { ok: false, reason: `Sandbox tmpBackend=session-disk requires an absolute XDG_CACHE_HOME (got ${JSON.stringify(process.env.XDG_CACHE_HOME)}). Set XDG_CACHE_HOME to an absolute disk-backed path or use tmpBackend:"host-tmpfs".` };
	}
	const cacheRoot = join(cacheRootRaw, "pi-sandbox", "tmp");
	try {
		mkdirSync(cacheRoot, { recursive: true });
		// Canonicalize the cache root AFTER creation (R2-I3: realpathSync on a
		// non-existent path fell back to the raw path and could miss a symlink
		// into a mask root).
		const realCacheRoot = realpathSync(cacheRoot);
		// I3 / R2-I2: reject a cache root nested under a block-mode mask path
		// (/tmp, /var/tmp, /run, /var/run) — but ONLY in block mode (R2-I2: the
		// masks only fire in block mode, so an open-mode cache root under
		// /var/tmp is valid and was wrongly rejected before). Canonicalize the
		// mask roots with the same helper buildBwrapArgs uses so a symlinked
		// /tmp is caught (R3-I1).
		if (netMode === "block") {
			const blockMaskRoots = ["/tmp", "/var/tmp", "/run", "/var/run"].map((p) => canonicalizeExistingPath(p) ?? p);
			const nestedUnderMask = blockMaskRoots.some((m) => realCacheRoot === m || realCacheRoot.startsWith(`${m}/`));
			if (nestedUnderMask) {
				return { ok: false, reason: `cache root ${cacheRoot} resolves under a block-mode tmpfs mask path (${realCacheRoot}); the project temp dir would be hidden by the mask. Set XDG_CACHE_HOME outside /tmp, /var/tmp, /run, or use tmpBackend:"host-tmpfs".` };
			}
		}
		// Per-project dir keyed by a stable hash of the canonical (realpath) cwd.
		// realpath resolves symlinks so two sessions whose cwd differs only by a
		// symlink bind to the same project dir. 16-char truncation: stable,
		// filesystem-safe, collision-resistant.
		const realCwd = realpathSync(cwd);
		const cwdKey = createHash("sha256").update(realCwd).digest("hex").slice(0, 16);
		const dir = join(realCacheRoot, cwdKey);
		// B1 (round-4 review): reject a pre-existing symlink at the predictable
		// cwd-hash path. mkdirSync(recursive) SUCCEEDS without throwing on a
		// pre-existing symlink-to-dir, and realpathSync would then follow it to an
		// arbitrary target — pinning that target as the writable projectTmpDir bind
		// (a writable-surface escape). The cwd-hash path is predictable and lives
		// under the shared, sandbox-writable cache root, so an agent (or a
		// cooperating session) can plant the symlink before derivation runs.
		// lstatSync does not follow symlinks, so a symlink (to a dir or otherwise)
		// is detected and rejected here, BEFORE mkdirSync legitimizes it.
		if (existsSync(dir)) {
			let st: { isSymbolicLink(): boolean; isDirectory(): boolean };
			try {
				st = lstatSync(dir);
			} catch {
				return { ok: false, reason: `project temp dir ${dir} exists but could not be lstat'd (permission denied or removed mid-derivation); refusing to use it. Remove it or use tmpBackend:"host-tmpfs".` };
			}
			if (st.isSymbolicLink()) {
				return { ok: false, reason: `project temp dir ${dir} is a symlink (target would escape the cache root and could widen the writable surface); refusing to follow it. Remove the symlink or use tmpBackend:"host-tmpfs".` };
			}
			if (!st.isDirectory()) {
				return { ok: false, reason: `project temp dir ${dir} exists but is not a directory; refusing to use it. Remove it or use tmpBackend:"host-tmpfs".` };
			}
		}
		mkdirSync(dir, { recursive: true });
		// Canonicalize the final dir too (R3-I1: derive the final path from
		// realCacheRoot, not the raw join, so a symlinked cache root is followed).
		const realDir = realpathSync(dir);
		// B1 (round-4 review): verify the final dir is the exact expected canonical
		// child of realCacheRoot. A symlink planted between the lstatSync check
		// above and here (or a cache root itself reached via a symlink chain whose
		// intermediate was swapped) must not escape. realDir must EXACTLY equal the
		// expected canonical child of realCacheRoot — any divergence means a
		// symlink or swap (to a sibling project dir under the same cache root, or
		// outside it). realCacheRoot is already canonicalized and cwdKey is a fixed
		// plain child name, so there is no legitimate case where realDir differs
		// from expectedDir. Reject on ANY inequality (round-5 review: the prior
		// `&& !startsWith(cacheRoot)` accepted an in-cache symlink swap to a sibling
		// project dir). This is the final-directory half of the mask-containment
		// check: also re-run the block-mode mask check against realDir so a symlink
		// into /tmp / /run is caught here too, not just at the cache root.
		const expectedDir = join(realCacheRoot, cwdKey);
		if (realDir !== expectedDir) {
			return { ok: false, reason: `project temp dir ${dir} resolves to ${realDir}, expected ${expectedDir}; the path diverged from the expected canonical child of the cache root (symlink or swap detected). Remove the entry or use tmpBackend:"host-tmpfs".` };
		}
		if (netMode === "block") {
			const blockMaskRoots = ["/tmp", "/var/tmp", "/run", "/var/run"].map((p) => canonicalizeExistingPath(p) ?? p);
			const finalUnderMask = blockMaskRoots.some((m) => realDir === m || realDir.startsWith(`${m}/`));
			if (finalUnderMask) {
				return { ok: false, reason: `project temp dir ${dir} resolves under a block-mode tmpfs mask path (${realDir}); the dir would be hidden by the mask. Set XDG_CACHE_HOME outside /tmp, /var/tmp, /run, or use tmpBackend:"host-tmpfs".` };
			}
		}
		return { ok: true, projectTmpDir: realDir };
	} catch (e) {
		return { ok: false, reason: `Sandbox failed to create the project temp dir: ${e instanceof Error ? e.message : String(e)}` };
	}
}

function formatTrustedBwrapFailure(resolution: { reason: string; rejectedPath?: string }): string {
	const rejected = resolution.rejectedPath ? ` Rejected path: ${resolution.rejectedPath}.` : "";
	return `Sandbox initialization failed: ${resolution.reason}.${rejected} Bash is fail-closed. File-tool/egress/inspector protections remain active. Fix bwrap or restart with --no-sandbox for a full extension bypass (bwrap + file-tool/egress/inspector gates).`;
}

/**
 * Publish the non-secret credential-boundary capability at every lifecycle
 * transition. A separate extension reads this global-registry key immediately
 * before loading credentials, so stale success state must never survive a
 * fail-closed, bypass, degrade, or shutdown transition.
 */
function credentialBoundaryFailClosedReason(lastFailClosedReason: string | null): string {
	// Diagnostics can include configured paths or other operator detail. The
	// cross-extension contract is intentionally less privileged: expose only a
	// stable state label, never copy the diagnostic into global capability state.
	const normalized = lastFailClosedReason?.toLowerCase() ?? "";
	if (normalized.includes("config parse error")) return "fail-closed: config parse error";
	// Branch diagnostics mention the bwrap backend, so recognize their specific
	// state before the generic bwrap-unavailable fallback.
	if (normalized.includes("hardlink")) return "fail-closed: denied-file hardlink";
	if (normalized.includes("network.mode=filter")) return "fail-closed: unsupported network filter mode";
	if (normalized.includes("bwrap")) return "fail-closed: bwrap unavailable";
	return "sandbox fail-closed";
}

function publishCredentialBoundaryCapability(state: {
	sandboxEnabled: boolean;
	sandboxInitialized: boolean;
	failClosed: boolean;
	disabledViaConfig: boolean;
	osSandboxUnavailable: boolean;
	noSandbox: boolean;
	lastFailClosedReason: string | null;
	sessionShutdown?: boolean;
}): void {
	const active =
		state.sandboxEnabled &&
		state.sandboxInitialized &&
		!state.failClosed &&
		!state.disabledViaConfig &&
		!state.osSandboxUnavailable &&
		!state.noSandbox;
	const reason = active
		? undefined
		: state.sessionShutdown
			? "session shutdown"
			: state.noSandbox
			? "sandbox disabled via --no-sandbox"
			: state.disabledViaConfig
				? "sandbox disabled via config"
				: state.failClosed
					? credentialBoundaryFailClosedReason(state.lastFailClosedReason)
					: state.osSandboxUnavailable
						? "OS bash sandbox unavailable (non-Linux degrade)"
						: "sandbox not initialized";
	const capability: CredentialBoundaryCapability = reason === undefined
		? { active, failClosed: state.failClosed }
		: { active, failClosed: state.failClosed, reason };
	(globalThis as typeof globalThis & Record<symbol, unknown>)[CREDENTIAL_BOUNDARY_CAPABILITY_SYMBOL] = capability;
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
			const minimalEnv = buildMinimalEnv(process.env, envScrubConfig ?? undefined);
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
					pinnedGitDirs: policy.pinnedGitDirs,
					networkMode: policy.networkMode,
					projectTmpDir: policy.projectTmpDir ?? undefined,
					tmpBackend: policy.tmpBackend,
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
		envScrubConfig = null;
		pinnedBwrapPath = null;
		bwrapPinError = null;
		backgroundTasksIntegrationDecisionBase = null;
		backgroundTasksIntegrationState = {
			backgroundTasksSandbox: "inactive",
			reason: "sandbox not initialized",
		};

		const noSandbox = pi.getFlag("no-sandbox") as boolean;
		const publishCapability = () => publishCredentialBoundaryCapability({
			sandboxEnabled,
			sandboxInitialized,
			failClosed,
			disabledViaConfig,
			osSandboxUnavailable,
			noSandbox,
			lastFailClosedReason,
		});
		// Clear any earlier session's success signal before initialization can take
		// a branch. Every later terminal branch publishes its specific state too.
		publishCapability();

		if (noSandbox) {
			sandboxEnabled = false;
			sandboxPolicy = createPermissivePolicy(ctx.cwd);
			activePolicy = sandboxPolicy;
			backgroundTasksIntegrationDecisionBase = null;
			backgroundTasksIntegrationState = {
				backgroundTasksSandbox: "inactive",
				reason: "sandbox disabled via --no-sandbox",
			};
			publishCapability();
			ctx.ui.notify("Sandbox disabled via --no-sandbox", "warning");
			ctx.ui.setStatus("sandbox", ctx.ui.theme.fg("warning", "🔒 Sandbox: disabled via --no-sandbox"));
			return;
		}

		const { config, parseErrors, globWarnings, missingDenyWarnings, legacyFieldWarnings, additiveWarnings, failClosedReasons } = loadPiConfig(ctx.cwd);
		envScrubConfig = config.envScrub ?? null;
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
			publishCapability();
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
			publishCapability();
			ctx.ui.notify("Sandbox disabled via config", "info");
			ctx.ui.setStatus("sandbox", ctx.ui.theme.fg("warning", "🔒 Sandbox: disabled via config"));
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
			publishCapability();
			ctx.ui.setStatus("sandbox", ctx.ui.theme.fg("error", "🔒 Sandbox: FAIL-CLOSED (hardlink alias)"));
			return;
		}
		// Discover git directories ONCE at session_start (trusted init state) for
		// submodules and linked worktrees whose `.git` gitfile points outside the
		// working tree. The result is pinned on the policy and passed to
		// buildBwrapArgs as pinnedGitDirs — it is NOT re-discovered per command,
		// because the `.git` gitfile lives in the writable working tree and a
		// per-command re-read would let an agent mutate it between commands to
		// widen the writable surface. The HEAD regular-file check rejects non-git
		// targets but cannot distinguish a legitimate linked worktree from an
		// arbitrary external Git directory. Global-only allowGitDirDiscovery is
		// disabled by default; operators opt in only for trusted submodule or linked
		// worktree workflows. denyWrite still takes precedence in enforceWritePolicy.
		// The in-process file tools allow writes to discovered paths via the
		// allowWrite augmentation below.
		const discoveredGitDirs = discoverGitDirs(config.filesystem?.allowWrite ?? [], ctx.cwd, {
			allowGitDirDiscovery: config.filesystem?.allowGitDirDiscovery ?? false,
		});
		// Resolve tmpBackend early (before platform/bwrap disposition) so the
		// host-tmpfs / session-disk branch is known. The accessors derive from
		// activePolicy (B2), so installing the provisional policy below makes
		// getTmpBackend() correct on every path, including early returns.
		const tmpBackend = config.filesystem?.tmpBackend ?? "session-disk";

		// Install a provisional configured file-tool policy BEFORE platform/bwrap
		// disposition (R3-B2 regression fix). This feature previously moved policy
		// construction after the platform checks (to derive projectTmpDir first),
		// which broke the non-Linux degrade path: it returned before any policy was
		// installed, so read/write/edit fell to createFailClosedPolicy() and blocked
		// all filesystem access instead of enforcing the configured in-process
		// policy. Pre-feature, the policy was constructed before the platform checks;
		// this restores that. The provisional policy carries projectTmpDir:null +
		// the resolved tmpBackend; it is replaced by the project-temp-pinned policy
		// only after successful session-disk derivation on the Linux-bwrap-healthy
		// path below. On every other path — degrade, fail-closed, disabled,
		// bwrap-missing — the provisional configured file policy stays in place,
		// exactly the pre-feature behavior (file tools hardened with the configured
		// policy; bash fail-closed separately).
		sandboxPolicy = {
			denyRead,
			denyWrite,
			allowWrite: [...(config.filesystem?.allowWrite ?? []), ...discoveredGitDirs],
			pinnedGitDirs: discoveredGitDirs,
			cwd: ctx.cwd,
			networkMode: netMode,
			toolRules: config.tools,
			projectTmpDir: null,
			tmpBackend,
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
				publishCapability();
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
			publishCapability();
			ctx.ui.setStatus("sandbox", ctx.ui.theme.fg("warning", platformState.status));
			return;
		}
		if (platformState.state === "fail-closed") {
			failClosed = true;
			lastFailClosedReason = platformState.message;
			backgroundTasksIntegrationDecisionBase = { config, failClosedReasons, env: process.env };
			backgroundTasksIntegrationState = refreshBackgroundTasksIntegrationState();
			ctx.ui.notify(platformState.message, "error");
			publishCapability();
			ctx.ui.setStatus("sandbox", ctx.ui.theme.fg("error", platformState.status));
			return;
		}

		sandboxEnabled = true;
		sandboxInitialized = true;
		failClosed = false;
		lastFailClosedReason = null;
		backgroundTasksIntegrationDecisionBase = { config, failClosedReasons, env: process.env };
		backgroundTasksIntegrationState = refreshBackgroundTasksIntegrationState();

		// Derive the per-project disk temp dir into a single SessionInit record,
		// then construct the final policy ONCE from that record (B1/R2-B2/R3-B2:
		// one source of truth, one construction site — no intervening await so the
		// module accessor and the policy object cannot diverge). Only the
		// Linux-bwrap-healthy path reaches here; earlier returns handled
		// degrade/fail-closed/disabled. The dir is NOT runtime-validated for
		// backing-store fs type — operator-asserted (see Strategic decisions:
		// scope cut). No fs-type probe, no write probe (R3-B3: mkdirSync already
		// proves usability; a create-by-name probe was a symlink-truncation escape).
		const init: SessionInit =
			tmpBackend === "session-disk"
				? deriveProjectTmpDir(ctx.cwd, netMode)
				: { ok: true as const, projectTmpDir: null };
		if (!init.ok) {
			failClosed = true;
			lastFailClosedReason = init.reason;
			backgroundTasksIntegrationState = refreshBackgroundTasksIntegrationState();
			ctx.ui.notify(lastFailClosedReason, "error");
			publishCapability();
			ctx.ui.setStatus("sandbox", ctx.ui.theme.fg("error", "🔒 Sandbox: FAIL-CLOSED (project temp dir)"));
			return;
		}
		// Replace the provisional policy with the final, project-temp-pinned
		// policy. The accessors (getProjectTmpDir/getTmpBackend) derive from
		// activePolicy, so assigning it here is the single source of truth for both
		// the bash path and the background/monitor path (B2: no separate module
		// state to diverge).
		sandboxPolicy = {
			denyRead,
			denyWrite,
			allowWrite: [...(config.filesystem?.allowWrite ?? []), ...discoveredGitDirs],
			pinnedGitDirs: discoveredGitDirs,
			cwd: ctx.cwd,
			networkMode: netMode,
			toolRules: config.tools,
			projectTmpDir: init.projectTmpDir,
			tmpBackend,
		};
		activePolicy = sandboxPolicy;
		publishCapability();

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
		// The project temp dir is per-project (cwd-keyed) and shared across concurrent
		// sessions in the same project, so it is NOT removed on shutdown — it persists
		// and stays warm across sessions (see feature-pi-sandbox-disk-backed-tmp).
		sandboxEnabled = false;
		sandboxInitialized = false;
		failClosed = false;
		disabledViaConfig = false;
		osSandboxUnavailable = false;
		osSandboxUnavailablePlatform = null;
		lastFailClosedReason = null;
		sandboxPolicy = null;
		activePolicy = null;
		envScrubConfig = null;
		pinnedBwrapPath = null;
		bwrapPinError = null;
		backgroundTasksIntegrationDecisionBase = null;
		backgroundTasksIntegrationState = {
			backgroundTasksSandbox: "inactive",
			reason: "session shutdown",
		};
		publishCredentialBoundaryCapability({
			sandboxEnabled,
			sandboxInitialized,
			failClosed,
			disabledViaConfig,
			osSandboxUnavailable,
			noSandbox: false,
			lastFailClosedReason,
			sessionShutdown: true,
		});
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

