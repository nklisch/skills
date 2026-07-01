/**
 * Sandbox Extension - OS-level sandboxing for bash + file tools
 *
 * Uses a first-party Linux bubblewrap backend to enforce filesystem and
 * network restrictions on bash commands at the OS level.
 *
 * Additionally registers hardened `read`/`write`/`edit` tools that enforce
 * the same denyRead/denyWrite/allowWrite policy at the tool-I/O layer. These
 * checks run IN-PROCESS and are independent of whether bwrap initialized —
 * so they hold even on sandbox-init failure (fail-closed: the bwrap layer
 * refuses to run, but file-tool policy is still enforced, not bypassed).
 *
 * Note: this extension overrides the built-in `bash`, `read`, `write`, and
 * `edit` tools. Other pi tools (subagent, agent_send, umans_web_search) are
 * not OS-sandboxed here. Known shell-bypass tools (background/monitor) are
 * mitigated by the in-process tool egress policy until first-party bwrap
 * integration lands.
 *
 * Config files (merged, project takes precedence but is ADDITIVE-ONLY):
 * - ~/.pi/agent/extensions/sandbox.json (global)
 * - <cwd>/.pi/sandbox.json (project-local; can only tighten, never weaken)
 */

import { spawn } from "node:child_process";
import { constants as fsConstants, existsSync, statSync } from "node:fs";
import { access as fsAccess, readFile as fsReadFile, writeFile as fsWriteFile, mkdir as fsMkdir } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import {
	buildBwrapArgs,
	buildMinimalEnv,
	canonicalizeExistingPath,
	normalizeConfiguredPath,
	shouldBypassSandbox,
	type NetworkMode,
	validateBwrapInit,
} from "./sandbox-bwrap";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import {
	type BashOperations,
	type EditOperations,
	type ReadOperations,
	createBashTool,
	createEditTool,
	createReadTool,
	createWriteTool,
	type WriteOperations,
	getAgentDir,
} from "@earendil-works/pi-coding-agent";
import {
	createSandboxCommandHandler,
	decideToolPolicy,
	loadConfig,
	type EnvScrubConfig,
	type SecretAction,
	type ToolInspector,
	type ToolRules,
} from "./sandbox-config";
import { Type } from "typebox";

const loadPiConfig = (cwd: string) => loadConfig(cwd, { agentDir: getAgentDir() });

/**
 * Network egress lever. Decouples the filesystem sandbox from the network
 * namespace so the read/write protections hold regardless of network posture.
 *
 * - `"filter"` (default): deferred in the first-party bwrap backend. The
 *   extension fails closed instead of silently treating it as `open`.
 * - `"open"`: no network namespace. bash gets the host's normal network
 *   (registry fetches, web fetches, anything) — but the filesystem denyRead/
 * denyWrite/allowWrite bind-mounts and the in-process read/write/edit guards
 *   STILL apply. Use when the allowlist is harming legitimate workflows
 *   (pub.dev, research source fetches) and the read-leak protections alone are
 *   the goal. The tool_call egress gate (umans_web_search/agent_send/...) is
 *   in-process and stays active in every mode.
 * - `"block"`: bwrap `--unshare-net` = fully air-gapped bash.
 *   Paranoia mode (e.g. handling raw untrusted content); nothing reaches the
 *   network, allowlist is ignored.
 *
 * The lever mirrors the tool-egress policy vocabulary (allow/auto/confirm/block):
 * a graduated, config-driven posture rather than a binary on/off.
 */

// ---------------------------------------------------------------------------
// Path expansion + matching helpers
// ---------------------------------------------------------------------------

/** Expand `~` to the home directory. */
function expandTilde(p: string): string {
	if (p === "~") return homedir();
	if (p.startsWith("~/")) return join(homedir(), p.slice(2));
	return p;
}

/**
 * Normalize a config path to an absolute path for comparison.
 * `~` is expanded; relative paths resolve against `cwd` (for read) —
 * matching the sandbox config contract of treating relative paths as cwd-relative.
 */
function normalizePathForCheck(rawPath: string, cwd: string): string {
	const normalized = normalizeConfiguredPath(rawPath, cwd);
	return canonicalizeExistingPath(normalized) ?? normalized;
}

/** True if `target` is equal to or nested under `dir`. Handles dir/file equality. */
function isWithinOrEqual(target: string, dir: string): boolean {
	if (target === dir) return true;
	const rel = relative(dir, target);
	return rel !== "" && !rel.startsWith("..") && !isAbsolute(rel);
}

/** True if `target` matches any entry in a deny list (exact or prefix). */
function matchesDenyList(target: string, denyList: string[], cwd: string): { denied: boolean; matched?: string } {
	for (const pattern of denyList) {
		const normalized = normalizePathForCheck(pattern, cwd);
		if (isWithinOrEqual(target, normalized)) {
			return { denied: true, matched: pattern };
		}
	}
	return { denied: false };
}

/** True if `target` is within any allowWrite entry. */
function isWithinAllowWrite(target: string, allowList: string[], cwd: string): boolean {
	for (const pattern of allowList) {
		const normalized = normalizePathForCheck(pattern, cwd);
		if (isWithinOrEqual(target, normalized)) return true;
	}
	return false;
}

// ---------------------------------------------------------------------------
// Hardened file-tool operations (enforce denyRead/denyWrite/allowWrite in-process)
// ---------------------------------------------------------------------------

/** Shared policy state — set at session_start, read by the tool operations. */
interface SandboxPolicy {
	denyRead: string[];
	denyWrite: string[];
	allowWrite: string[];
	cwd: string;
	networkMode: NetworkMode;
	toolRules?: ToolRules;
}

let activePolicy: SandboxPolicy | null = null;

function makeReadOperations(cwd: string, policy: SandboxPolicy): ReadOperations {
	return {
		async access(absolutePath: string) {
			enforceDenyRead(absolutePath, cwd, policy);
			await fsAccess(absolutePath, fsConstants.R_OK);
		},
		async readFile(absolutePath: string) {
			// Re-check at read time in case the access check was bypassed upstream.
			enforceDenyRead(absolutePath, cwd, policy);
			return fsReadFile(absolutePath);
		},
	};
}

function makeWriteOperations(cwd: string, policy: SandboxPolicy): WriteOperations {
	return {
		async writeFile(absolutePath: string, _content: string) {
			enforceWritePolicy(absolutePath, cwd, policy);
			await fsWriteFile(absolutePath, _content, "utf-8");
		},
		async mkdir(dir: string) {
			// mkdir is called for the parent dir of the target. The target itself
			// was already checked by writeFile, but we also block mkdir into a
			// denied path (e.g. creating ~/.ssh/ when ~/.ssh is denyWrited).
			enforceWritePolicy(dir, cwd, policy);
			await fsMkdir(dir, { recursive: true });
		},
	};
}

function makeEditOperations(cwd: string, policy: SandboxPolicy): EditOperations {
	return {
		async readFile(absolutePath: string) {
			// edit reads the file before writing — both must be allowed.
			enforceDenyRead(absolutePath, cwd, policy);
			enforceWritePolicy(absolutePath, cwd, policy);
			return fsReadFile(absolutePath);
		},
		async writeFile(absolutePath: string, content: string) {
			enforceWritePolicy(absolutePath, cwd, policy);
			await fsWriteFile(absolutePath, content, "utf-8");
		},
		async access(absolutePath: string) {
			enforceDenyRead(absolutePath, cwd, policy);
			enforceWritePolicy(absolutePath, cwd, policy);
			await fsAccess(absolutePath, fsConstants.R_OK | fsConstants.W_OK);
		},
	};
}

function enforceDenyRead(absolutePath: string, cwd: string, policy: SandboxPolicy): void {
	const target = canonicalizeExistingPath(absolutePath) ?? absolutePath;
	const { denied, matched } = matchesDenyList(target, policy.denyRead, cwd);
	if (denied) {
		throw new Error(
			`Access denied (sandbox denyRead): "${absolutePath}" matches "${matched}". The sandbox blocks reads of configured sensitive paths.`,
		);
	}
}

function enforceWritePolicy(absolutePath: string, cwd: string, policy: SandboxPolicy): void {
	const target = canonicalizeExistingPath(absolutePath) ?? absolutePath;
	// denyWrite takes precedence.
	const { denied, matched } = matchesDenyList(target, policy.denyWrite, cwd);
	if (denied) {
		throw new Error(
			`Access denied (sandbox denyWrite): "${absolutePath}" matches "${matched}". The sandbox blocks writes to configured protected paths.`,
		);
	}
	// Then allowWrite: the target must be within an allowWrite path.
	if (!isWithinAllowWrite(target, policy.allowWrite, cwd)) {
		throw new Error(
			`Access denied (sandbox allowWrite): "${absolutePath}" is outside the writable allowlist. Writes are confined to allowWrite paths.`,
		);
	}
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
			const bwrapArgs = [
				...buildBwrapArgs({
					cwd,
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
				const child = spawn("bwrap", bwrapArgs, {
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
		description: "Disable OS-level sandboxing for bash commands",
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
	let lastFailClosedReason: string | null = null;
	let sandboxPolicy: SandboxPolicy | null = null;

	// --- bash tool: fail-closed when sandbox didn't init ---
	pi.registerTool({
		...localBash,
		label: "bash (sandboxed)",
		async execute(id, params, signal, onUpdate, _ctx) {
			// If explicitly disabled via --no-sandbox or config, run unsandboxed.
			// This is the ONLY path to unsandboxed bash, and it's operator-chosen.
			if (shouldBypassSandbox(pi.getFlag("no-sandbox") as boolean, disabledViaConfig)) {
				return localBash.execute(id, params, signal, onUpdate);
			}

			if (failClosed) {
				return {
					content: [
						{
							type: "text",
							text: "Sandbox failed to initialize and is fail-closed. Fix the error above and /reload, or restart with --no-sandbox to bypass (not recommended).",
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
							text: "Sandbox not yet initialized. If this persists, /reload or restart pi. Use --no-sandbox only if you intentionally want to bypass.",
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
		if (!sandboxEnabled || !sandboxInitialized || failClosed) return;
		return { operations: createSandboxedBashOps() };
	});

	// --- tool_call egress gate: configurable policy for ANY tool ---
	// Fires for built-in AND extension-registered tools (CustomToolCallEvent).
	// Reads the active tool policy; allow = no-op (zero overhead on the common
	// path), block = return {block:true, reason}, confirm = human-approval gate
	// (degrades to block when no dialog-capable UI is available).
	pi.on("tool_call", async (event, ctx) => {
		if (!activePolicy) return; // sandbox not enabled/initialized yet -> no in-process tool policy to apply
		const rules = activePolicy.toolRules;
		const name = event.toolName;
		const decision = decideToolPolicy(name, rules, Boolean(ctx.ui && ctx.hasUI));
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
		lastFailClosedReason = null;
		sandboxEnabled = false;
		sandboxInitialized = false;

		const noSandbox = pi.getFlag("no-sandbox") as boolean;

		if (noSandbox) {
			sandboxEnabled = false;
			ctx.ui.notify("Sandbox disabled via --no-sandbox", "warning");
			return;
		}

		const { config, parseErrors, globWarnings, legacyFieldWarnings, additiveWarnings } = loadPiConfig(ctx.cwd);

		// Fail-closed on config parse errors.
		if (parseErrors.length > 0) {
			failClosed = true;
			lastFailClosedReason = `config parse error(s): ${parseErrors.join("; ")}`;
			const msg = `Sandbox config parse error(s):\n${parseErrors.join("\n")}\nBash + file tools are fail-closed until fixed.`;
			ctx.ui.notify(msg, "error");
			ctx.ui.setStatus("sandbox", ctx.ui.theme.fg("error", "🔒 Sandbox: FAIL-CLOSED (config parse error)"));
			return;
		}

		for (const w of legacyFieldWarnings) ctx.ui.notify(w, "warning");
		for (const w of globWarnings) ctx.ui.notify(w, "warning");
		for (const w of additiveWarnings) ctx.ui.notify(w, "warning");

		if (!config.enabled) {
			sandboxEnabled = false;
			disabledViaConfig = true;
			ctx.ui.notify("Sandbox disabled via config", "info");
			return;
		}

		// Scrub orphaned secret env vars from process.env BEFORE any bash/subprocess
		// can spawn. pi's provider env-key allowlist (the vars pi actually reads
		// for auth) is passed as `keep` so active auth paths are never broken.
		const piEnvKeyKeep = [
			"ANTHROPIC_OAUTH_TOKEN", "ANTHROPIC_API_KEY", "OPENAI_API_KEY", "AZURE_OPENAI_API_KEY",
			"GEMINI_API_KEY", "GOOGLE_CLOUD_API_KEY", "GOOGLE_APPLICATION_CREDENTIALS",
			"AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_PROFILE", "AWS_BEARER_TOKEN_BEDROCK",
			"COPILOT_GITHUB_TOKEN", "HF_TOKEN", "MISTRAL_API_KEY", "GROQ_API_KEY", "DEEPSEEK_API_KEY",
			"OPENROUTER_API_KEY", "TOGETHER_API_KEY", "FIREWORKS_API_KEY", "CEREBRAS_API_KEY",
			"NVIDIA_API_KEY", "XAI_API_KEY", "ZAI_API_KEY", "AI_GATEWAY_API_KEY",
		];
		const scrubbed = scrubEnv(config.envScrub, piEnvKeyKeep);
		if (scrubbed.length > 0) {
			ctx.ui.notify(`Scrubbed ${scrubbed.length} secret env var(s) from process: ${scrubbed.join(", ")}`, "info");
		}

		const netMode = config.network?.mode ?? "filter";

		// Always set the file-tool policy, even before bwrap init succeeds —
		// the read/write/edit tools use it in-process and hold independently.
		sandboxPolicy = {
			denyRead: config.filesystem?.denyRead ?? [],
			denyWrite: config.filesystem?.denyWrite ?? [],
			allowWrite: config.filesystem?.allowWrite ?? [],
			cwd: ctx.cwd,
			networkMode: netMode,
			toolRules: config.tools,
		};
		activePolicy = sandboxPolicy;

		const initValidation = validateBwrapInit({ networkMode: netMode, env: process.env });
		if (!initValidation.ok) {
			failClosed = true;
			lastFailClosedReason = initValidation.message;
			ctx.ui.notify(initValidation.message, "error");
			ctx.ui.setStatus("sandbox", ctx.ui.theme.fg("error", initValidation.status));
			return;
		}

		sandboxEnabled = true;
		sandboxInitialized = true;
		failClosed = false;
		lastFailClosedReason = null;

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
		lastFailClosedReason = null;
		sandboxPolicy = null;
		activePolicy = null;
	});

	pi.registerCommand("sandbox", {
		description: "Show sandbox configuration",
		handler: createSandboxCommandHandler({
			load: loadPiConfig,
			getState: () => ({
				failClosed,
				sandboxEnabled,
				sandboxInitialized,
				disabledViaConfig,
				lastFailClosedReason,
			}),
		}),
	});
}

/**
 * Return the active file-tool policy. If the sandbox hasn't initialized yet
 * (e.g. a read is attempted before session_start completes), fall back to a
 * restrictive default: deny reads of nothing, allow writes only to cwd+tmp.
 * This keeps the tool usable during startup without opening a hole.
 */
function activePolicyFor(cwd: string): SandboxPolicy {
	if (activePolicy) return activePolicy;
	return {
		denyRead: [],
		denyWrite: [".env", ".env.*", "*.pem", "*.key", "~/.ssh", "~/.aws", "~/.gnupg"],
		allowWrite: [".", "/tmp"],
		cwd,
		networkMode: "block",
	};
}

/**
 * Scrub secret-bearing env vars from process.env at session_start, so child
 * bash/subprocesses can't `echo $TOKEN` into the transcript. The scrub runs in
 * the pi process itself — it does NOT touch other processes (e.g. a separate
 * Claude Code session). pi reads auth from auth.json (OAuth) or a specific
 * provider env-key allowlist (ANTHROPIC_API_KEY, OPENAI_API_KEY, ...); any
 * other secret-shaped env var (the orphaned ANTHROPIC_AUTH_TOKEN, project
 * *_TOKEN vars, etc.) is not used by pi and is safe to strip here.
 */
function scrubEnv(config: EnvScrubConfig | undefined, keep: string[]): string[] {
	if (!config || (!config.names?.length && !config.patterns?.length)) return [];
	const keepSet = new Set(keep);
	const compiledPatterns = (config.patterns ?? []).map((p) => {
		// Convert glob (* and ?) to regex. Case-insensitive.
		const re = p.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".");
		return new RegExp(`^${re}$`, "i");
	});
	const scrubbed: string[] = [];
	for (const name of Object.keys(process.env)) {
		if (keepSet.has(name)) continue;
		const hitByName = config.names?.includes(name);
		const hitByPattern = compiledPatterns.some((re) => re.test(name));
		if (hitByName || hitByPattern) {
			delete process.env[name];
			scrubbed.push(name);
		}
	}
	return scrubbed;
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

/**
 * Result of inspecting a tool's input for secret shapes.
 * - allow: no secret matched, and onNoMatch=allow (or a redaction was applied)
 * - block: a secret matched with action=block, or no match with onNoMatch=block
 */
interface InspectionVerdict {
	action: "allow" | "block";
	reason: string;
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
 * Inspect a tool's input against the configured secret shapes (gitleaks model).
 *
 * Pipeline per field: keyword pre-filter → regex (extracts a capture group) →
 * entropy check on the captured candidate → allowlist check. A candidate is
 * a secret only if it passes ALL of: keyword present (if configured), regex
 * matches, entropy ≥ threshold (if configured), not allowlisted.
 *
 * Synchronous, in-process: the secret is matched by regex/entropy only and
 * never enters a judgment context (no agent, no second transcript). On a
 * `redact` match, mutates `input[field]` in place to strip the matched bytes,
 * then allows. On a `block` match, returns block. On no match, returns onNoMatch.
 *
 * Scans string-valued fields. By default scans ALL string fields ("*"), which
 * is paranoia-first; config can narrow per-tool via inspector.scanFields.
 */
function inspectToolInput(
	toolName: string,
	input: Record<string, unknown>,
	inspector: ToolInspector | undefined,
): InspectionVerdict {
	if (!inspector || !inspector.secrets || inspector.secrets.length === 0) {
		return { action: "allow", reason: "no inspector configured" };
	}
	const onNoMatch = inspector.onNoMatch ?? "allow";

	// Compile shapes once.
	const shapes: CompiledShape[] = inspector.secrets.map((s) => ({
		name: s.name,
		re: new RegExp(s.pattern, s.flags ?? "gu"),
		action: s.action,
		secretGroup: s.secretGroup ?? 0,
		entropy: s.entropy,
		keywords: s.keywords,
	}));
	// Compile allowlist.
	const allowlist: CompiledAllowlist = {
		stopwords: new Set((inspector.allowlist?.stopwords ?? []).map((w) => w.toLowerCase())),
		regexes: (inspector.allowlist?.regexes ?? []).map((r) => new RegExp(r, "iu")),
	};

	// Determine which fields to scan.
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
		// Stringify the value: strings as-is, objects/arrays via JSON, numbers skipped.
		let text: string | null = null;
		if (typeof value === "string") text = value;
		else if (value !== null && typeof value === "object") {
			try { text = JSON.stringify(value); } catch { text = null; }
		} else continue;
		if (text === null) continue;

		for (const shape of shapes) {
			// Keyword pre-filter: skip the rule if no keyword is present.
			if (shape.keywords && shape.keywords.length > 0) {
				const lower = text.toLowerCase();
				if (!shape.keywords.some((kw) => lower.includes(kw.toLowerCase()))) continue;
			}

			shape.re.lastIndex = 0;
			const match = shape.re.exec(text);
			if (!match) continue;

			// Extract the candidate from the configured capture group.
			const candidate = (shape.secretGroup < match.length ? match[shape.secretGroup] : match[0]) ?? match[0];
			if (!candidate) continue;

			// Entropy gate: candidate must exceed the threshold (when set).
			if (shape.entropy !== undefined) {
				const ent = shannonEntropy(candidate);
				if (ent < shape.entropy) continue; // looks random enough? no -> skip
			}

			// Allowlist: known placeholders/examples are not secrets.
			if (isAllowed(candidate)) continue;

			// Confirmed secret.
			if (shape.action === "block") {
				return {
					action: "block",
					reason: `secret shape "${shape.name}" matched in field "${field}" of tool "${toolName}"`,
				};
			}
			// redact: strip the matched substring in place, then continue scanning
			// other shapes (a field may carry more than one secret).
			shape.re.lastIndex = 0;
			const redacted = text.replace(shape.re, `[REDACTED:${shape.name}]`);
			if (typeof value === "string") {
				(input as Record<string, unknown>)[field] = redacted;
			} else {
				try { (input as Record<string, unknown>)[field] = JSON.parse(redacted); } catch { (input as Record<string, unknown>)[field] = redacted; }
			}
			text = redacted; // continue scanning the redacted text for further shapes
		}
	}

	return {
		action: onNoMatch,
		reason: onNoMatch === "block" ? `no configured secret matched, but inspector onNoMatch=block` : "",
	};
}
