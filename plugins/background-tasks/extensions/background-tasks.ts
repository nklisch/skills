/**
 * Background Tasks — a pi-native runtime extension that lets an agent run
 * long commands in the background and get woken when they finish, poll a
 * command until a condition is met, and manage the resulting job registry.
 *
 * Tools registered:
 *   - background : run a command detached; wake the agent on exit (and
 *                  optionally the first time output matches a pattern).
 *   - monitor    : poll a command on an interval until a predicate holds
 *                  (or a timeout fires); wake the agent with the result.
 *   - jobs       : list / cancel / tail / status / view over the registry.
 *
 * Wake-ups are delivered via pi.sendMessage with triggerTurn:true and
 * deliverAs:"steer" so the message injects as soon as possible — right after
 * the current tool-call batch, before the next LLM call — instead of deferring
 * to end-of-turn (which is what "followUp" does). When the agent is already
 * idle, triggerTurn starts an immediate fresh turn. The custom message is
 * extension-authored (not user-authored) and trusted: it carries only the
 * numeric job id and exit code / status word — never command output. Command
 * output stays in the registry and is read on demand via the jobs tool
 * (action=tail) or the focusable overlay panel (action=view). This keeps a
 * malicious command's stdout from being injected as user-authored content.
 *
 * If sendMessage is unavailable (older pi), completion is surfaced via
 * ui.notify + footer status and the agent is NOT auto-woken.
 *
 * Parameter schemas are plain JSON-Schema objects (no typebox import) so the
 * file has zero @earendil-works/* dependencies — it stays unit-testable with
 * a fake pi under bare `bun test` (mirrors the agile-workflow extension's
 * loose-coupling house style). pi's provider layer reads only `properties`
 * and `required` from each schema.
 *
 * Concurrency notes (post-review hardening):
 *   - background completion callbacks and monitor ticks mutate a shared jobs
 *     Map asynchronously (possibly after the turn that started them ended).
 *     Every terminal transition first re-checks job.status === "running" so a
 *     late callback cannot overwrite a cancellation or an earlier finalization.
 *   - monitor polls via recursive setTimeout scheduled AFTER each poll
 *     completes, with an in-flight guard, so polls never overlap regardless
 *     of how long pi.exec takes. interval_seconds is floored at MIN_INTERVAL.
 *   - cancel/shutdown send SIGKILL to the child's process group and wait for
 *     the group to disappear before recording `cancelled`; a job that won't
 *     die within the bounded reap window is reported as `kill_failed`, not
 *     silently marked cancelled.
 */

import { spawn, type ChildProcess } from "node:child_process";
import {
  createCachedSandboxResolver,
  clearSandboxIntegrationHandshake,
  publishBrokenSandboxIntegrationHandshake,
  publishSandboxIntegrationHandshake,
  type SandboxedSpawnArgsResult,
  type SandboxSpawnResolver,
} from "./sandbox-bridge";

// --- Keybinding matcher (sync, optional) ---------------------------------
//
// JobPanel input must respond to arrow keys and Esc. The robust way is pi-tui's
// keybinding manager (matches raw input against semantic actions like
// "up"/"escape", resolving ALL byte variants incl. application-cursor
// \u001bOA and user rebindings). The pi-tui module is resolvable synchronously
// inside the pi process; under bare `bun test` it isn't, so resolveKb() is
// guarded and JobPanel falls back to raw-byte matches when it returns null.
// NOTE: resolve once, at JobPanel construction (handleInput's contract is sync —
// `handleInput(data): void`, invoked fire-and-forget by the input loop — so an
// async dynamic import() cannot resolve in time for a keystroke).
let kbMatcher: { matches: (data: string, action: string) => boolean } | null | undefined;
function resolveKb(): { matches: (data: string, action: string) => boolean } | null {
  if (kbMatcher !== undefined) return kbMatcher;
  try {
    // createRequire keeps the file dependency-free at import time (no top-level
    // import of @earendil-works/pi-tui) while resolving it synchronously at the
    // JobPanel construction site inside the pi process.
    const { createRequire } = require("node:module") as typeof import("node:module");
    const req = createRequire(import.meta.url);
    const mod = req("@earendil-works/pi-tui") as {
      getKeybindings?: () => { matches: (data: string, action: string) => boolean };
    };
    kbMatcher = mod.getKeybindings?.() ?? null;
  } catch {
    kbMatcher = null;
  }
  return kbMatcher;
}
/** Raw-byte fallbacks for when pi-tui is unavailable (tests, non-TUI harness). */
const RAW = {
  up: (d: string) => d === "k" || d === "\u001b[A" || d === "\u001bOA",
  down: (d: string) => d === "j" || d === "\u001b[B" || d === "\u001bOB",
  left: (d: string) => d === "h" || d === "\u001b[D" || d === "\u001bOD",
  right: (d: string) => d === "l" || d === "\u001b[C" || d === "\u001bOC",
  confirm: (d: string) => d === "\r" || d === "\n",
  cancel: (d: string) => d === "\u001b" || d === "\u0003", // Esc, Ctrl+C
};

const STATUS_KEY = "background-tasks";
const WAKE_CUSTOM_TYPE = "background-tasks:wake";
const MAX_TAIL_CHARS = 6_000; // hard cap on anything sent back to the model
const MAX_BUFFER_CHARS = 200_000; // rolling in-memory buffer per job
const MAX_POLL_OUTPUT_CHARS = 2_000_000; // per-poll stdout+stderr cap; kills child to prevent OOM
const DEFAULT_MONITOR_INTERVAL_S = 10;
const DEFAULT_MONITOR_TIMEOUT_S = 600;
const MIN_MONITOR_INTERVAL_S = 1; // floor; sub-second polls flood commands
const MONITOR_POLL_FAIL_THRESHOLD = 3; // consecutive failed polls -> early diagnostic timeout
const DEFAULT_TAIL_LINES = 40;
const KILL_GRACE_MS = 2_000; // post-SIGKILL reap window before declaring kill_failed
const MAX_RETAINED_JOBS = 50; // prune oldest terminal jobs above this count
const PAGING_TAIL_LINES = 200; // lines of output shown per job in the view panel

// --- Session-start discoverability nudge --------------------------------
//
// A short, agent-facing explainer appended to the system prompt every turn so
// the agent reaches for background/monitor (and distinguishes them from
// subagent delegation) instead of reflexively blocking on `bash`.
// Header is also the idempotency sentinel.
const SYSTEM_PROMPT_EXPLAINER_HEADER = "## Long-Running & Concurrent Work";
const SYSTEM_PROMPT_EXPLAINER = `${SYSTEM_PROMPT_EXPLAINER_HEADER}

This harness wakes you asynchronously. When you launch work that runs detached, the point is to STOP BLOCKING on it: **either keep working on something else in parallel while it runs, or — if there's genuinely nothing else to do — end the turn** and the harness starts a new one for you when it finishes. Never sit blocked waiting for it.

### Do
- **\`background\`** — run a long shell command detached and keep working; you're woken on exit. Use for anything that may run more than a few seconds (test suites, builds, deploys, watch/serve, CI runs) AND for **launching multiple instances in parallel** (fan out N jobs, keep doing other work, harvest results via \`jobs\` as each finishes). The whole point: long-running async work you step away from while you produce in parallel.
- **\`monitor\`** — the SANCTIONED poller. Polls a command on an interval until a *condition* holds, then wakes you. Use it over \`background\` when you're waiting on a state, not a single exit: CI going green, PR reviewer status, a file/port/log line, an external async job flipping to done.
- After a wake, read output with \`jobs\` (action=tail) — it is never auto-delivered.

### Don't
- **Do NOT hand-roll sleep/poll loops** (\`sleep N\` in bash then \`jobs list\`, over and over). That re-implements the wake the harness already gives you AND blocks the turn you were trying to free up. After launching a background job: **keep working on something else, or end the turn** — you will be woken on exit. (Ending the turn is the *fallback* when there's nothing else to do, not the primary instruction.)
- **Do NOT use \`background\` for a single quick command** (a few seconds). That's what \`bash\` is for. \`background\` is for *long-running async* and *parallel fan-out*.
- **Do NOT sleep in \`bash\` to wait for a condition.** That's exactly what \`monitor\` is for, and it's non-blocking.

### Delegation vs. backgrounding (conditional — only if your harness has these)
- If you have a **cross-harness peer** tool, it may delegate a focused pass (implement/review/research) to a *different* model. It may run asynchronously; watch its job with \`monitor\` while you keep working.
- If you have an **internal sub-agent** tool, use THAT (not a cross-harness peer) for parallel work that stays inside this harness.
- Backgrounding a SHELL command (this plugin) is neither of those — it runs a process, not an agent. If you're unsure which exists in your harness, check before delegating.`;

// --- Tiny JSON-Schema builders (no external deps) -------------------------

type Schema = Record<string, unknown>;
const str = (description?: string): Schema => ({ type: "string", ...(description ? { description } : {}) });
const num = (description?: string): Schema => ({ type: "number", ...(description ? { description } : {}) });
const strEnum = (values: string[], description?: string): Schema => ({
  type: "string",
  enum: values,
  ...(description ? { description } : {}),
});
const strRecord = (description?: string): Schema => ({
  type: "object",
  additionalProperties: { type: "string" },
  ...(description ? { description } : {}),
});
const obj = (properties: Record<string, Schema>, required: string[] = []): Schema => ({
  type: "object",
  properties,
  required,
});

// --- Locally-typed pi api slice -------------------------------------------

type ExecResult = { stdout?: string; stderr?: string; code?: number | null; killed?: boolean };

type UiContext = {
  notify?: (message: string, level?: "info" | "warning" | "error" | "success") => void;
  setStatus?: (key: string, message: string | undefined) => void;
  custom?: (component: unknown, options?: { overlay?: boolean; overlayOptions?: unknown }) => unknown;
};

type Keybindings = unknown;

type ToolContext = {
  cwd?: string;
  signal?: AbortSignal;
  ui?: UiContext;
  mode?: "tui" | "rpc" | "json" | "print";
};

type ToolUpdate = {
  content?: Array<{ type: "text"; text: string }>;
  details?: Record<string, unknown>;
};

type ToolResult = {
  content: Array<{ type: "text"; text: string }>;
  details?: Record<string, unknown>;
  isError?: boolean;
};

type ToolExecute = (
  toolCallId: string,
  params: Record<string, unknown>,
  signal: AbortSignal | undefined,
  onUpdate: ((u: ToolUpdate) => void) | undefined,
  ctx: ToolContext,
) => Promise<ToolResult>;

type ToolDefinition = {
  name: string;
  label?: string;
  description: string;
  promptSnippet?: string;
  promptGuidelines?: string[];
  parameters: unknown;
  execute: ToolExecute;
};

type PiApi = {
  exec?: (
    command: string,
    args: string[],
    options?: { signal?: AbortSignal; timeout?: number; cwd?: string },
  ) => Promise<ExecResult>;
  sendMessage?: (
    message: {
      customType: string;
      content: string;
      display: boolean;
      details?: unknown;
    },
    options?: { triggerTurn?: boolean; deliverAs?: "steer" | "followUp" | "nextTurn" },
  ) => void | Promise<void>;
  appendEntry?: (customType: string, data?: unknown) => void;
  registerTool?: (def: ToolDefinition) => void;
  registerCommand?: (name: string, options: { description: string; handler: (args: string | undefined, ctx: ToolContext) => void }) => void;
  on?: (
    event: string,
    handler: (event: unknown, ctx: ToolContext) => Promise<void> | void,
  ) => void;
};

interface BackgroundTasksExtensionOptions {
  sandboxResolver?: () => Promise<SandboxSpawnResolver>;
}

// --- Job registry ---------------------------------------------------------

type JobKind = "background" | "monitor";
type JobStatus =
  | "running"
  | "cancelling" // SIGKILL sent; awaiting process-group disappearance
  | "completed"
  | "failed"
  | "cancelled"
  | "satisfied"
  | "timeout"
  | "kill_failed"; // SIGKILL did not reap the group within the grace window

type Job = {
  id: number;
  kind: JobKind;
  label: string;
  command: string;
  status: JobStatus;
  startedAt: number;
  endedAt?: number;
  exitCode?: number | null;
  buffer: string;
  // background
  child?: ChildProcess;
  pid?: number;
  wakeOnPattern?: RegExp;
  patternSource?: string;
  patternFired?: boolean;
  // monitor
  intervalSeconds?: number;
  timeoutSeconds?: number;
  deadline?: number;
  satisfyOn?: string;
  pattern?: string;
  polling?: boolean; // in-flight guard so monitor polls never overlap
  pollAbortController?: AbortController; // per-job cancellation for the current in-flight monitor poll
  pollFailures?: number; // consecutive polls with empty stdout or non-zero exit
  timer?: ReturnType<typeof setTimeout>;
};

// --- Helpers --------------------------------------------------------------

/** Hard cap: marker length is computed first so total never exceeds max. */
function truncate(text: string, max = MAX_TAIL_CHARS): string {
  if (text.length <= max) return text;
  const marker = `\n…[truncated, showing last ${max} of ${text.length} chars]`;
  const budget = max - marker.length;
  return `${text.slice(Math.max(0, text.length - budget))}${marker}`;
}

function tailLines(text: string, lines = DEFAULT_TAIL_LINES): string {
  const all = text.split("\n");
  if (all.length <= lines) return text;
  return `…[+${all.length - lines} earlier lines]\n${all.slice(-lines).join("\n")}`;
}

function slugify(command: string): string {
  const s = command.replace(/\s+/g, " ").trim().split(" ")[0] ?? "job";
  const base = s.replace(/[^a-zA-Z0-9._-]/g, "").slice(0, 24);
  return base || "job";
}

function appendBuffer(job: Job, chunk: string): void {
  job.buffer += chunk;
  if (job.buffer.length > MAX_BUFFER_CHARS) {
    job.buffer = job.buffer.slice(job.buffer.length - MAX_BUFFER_CHARS);
  }
}

/**
 * Bounded stdout/stderr accumulator for a single poll. Returns true once the
 * combined output exceeds MAX_POLL_OUTPUT_CHARS, so the caller can kill the
 * child and return a diagnostic instead of OOMing the Pi process. A noisy
 * monitor command (e.g. `yes X`) can emit hundreds of MB during a single
 * poll's timeout window; the per-job rolling buffer cap (appendBuffer) only
 * applies AFTER the poll finishes, so this per-poll cap is the OOM guard.
 */
function makeBoundedAccumulator(): { append: (chunk: string) => boolean; text: () => string } {
  let buf = "";
  let overflow = false;
  return {
    append(chunk: string) {
      if (overflow) return true;
      buf += chunk;
      if (buf.length > MAX_POLL_OUTPUT_CHARS) {
        overflow = true;
        buf = `${buf.slice(0, MAX_POLL_OUTPUT_CHARS)}\n[monitor poll output exceeded ${MAX_POLL_OUTPUT_CHARS} chars; child terminated to prevent OOM]`;
        return true;
      }
      return false;
    },
    text: () => buf,
  };
}

function elapseMs(job: Job): number {
  return (job.endedAt ?? Date.now()) - job.startedAt;
}

function fmtDuration(ms: number): string {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return `${m}m${s % 60}s`;
}

function formatJobLine(job: Job): string {
  const mark =
    job.status === "running" || job.status === "cancelling"
      ? "●"
      : job.status === "completed" || job.status === "satisfied"
        ? "✓"
        : job.status === "failed" || job.status === "timeout" || job.status === "kill_failed"
          ? "✗"
          : "⊘";
  const exit = job.exitCode != null ? ` exit ${job.exitCode}` : "";
  return `#${job.id} ${mark} [${job.status}${exit}] ${job.kind} "${job.label}" (${fmtDuration(elapseMs(job))})`;
}

type BackgroundSpawnDecision =
  | {
    mode: "sandboxed";
    executable: string;
    args: string[];
    cwd: string;
    env: NodeJS.ProcessEnv;
    message?: string;
  }
  | {
    mode: "unsandboxed";
    reason: "sandbox-absent" | "sandbox-degraded";
    cwd: string;
    env: NodeJS.ProcessEnv;
    message?: string;
  }
  | {
    mode: "fail-closed";
    reason: string;
    message: string;
  };

type MonitorPollDecision =
  | {
    mode: "sandboxed";
    sandbox: Extract<SandboxedSpawnArgsResult, { state: "ok" }>;
    cwd: string;
    message?: string;
  }
  | {
    mode: "unsandboxed";
    reason: "sandbox-absent" | "sandbox-degraded";
    cwd: string;
    /** Env for the unsandboxed /bin/sh -c poll. When degraded, this is the
     * provider-secret-stripped env from buildSandboxedSpawnArgs so monitor
     * commands cannot exfiltrate credentials even when not OS-sandboxed. */
    env?: NodeJS.ProcessEnv;
    message?: string;
  }
  | {
    mode: "fail-closed";
    reason: string;
    message: string;
  };

interface ShellRunOptions {
  command: string;
  cwd: string;
  timeoutMs: number;
  signal?: AbortSignal;
  sandbox?: SandboxedSpawnArgsResult | null;
  /** When set and sandbox is not ok, runShellOnce direct-spawns /bin/sh -c with
   * this env instead of pi.exec (which has no env option). Used to carry the
   * provider-secret-stripped env for degraded monitors. */
  degradedEnv?: NodeJS.ProcessEnv;
  piExec?: PiApi["exec"];
  onChildCreated?: (child: ChildProcess) => void;
  onChildSpawn?: (child: ChildProcess) => void;
  onChildClose?: () => void;
}

function failClosedDecision(reason: string, message: string): BackgroundSpawnDecision {
  return { mode: "fail-closed", reason, message };
}

function decideFromSandboxResult(command: string, result: SandboxedSpawnArgsResult): BackgroundSpawnDecision {
  switch (result.state) {
    case "ok":
      return {
        mode: "sandboxed",
        executable: result.executable,
        args: [...result.args, command],
        cwd: result.cwd,
        env: result.env,
        message: result.message,
      };
    case "degraded":
      return {
        mode: "unsandboxed",
        reason: "sandbox-degraded",
        cwd: result.cwd,
        env: result.env,
        message: result.message,
      };
    case "fail-closed":
      return failClosedDecision(result.reason, result.message);
  }
}

function decideBackgroundSpawn(input: {
  command: string;
  /** Per-call command cwd; may be caller-controlled and only affects where the command runs. */
  cwd: string;
  /** Trusted session/project cwd for sandbox config and relative filesystem policy. */
  configCwd?: string;
  envAdd?: NodeJS.ProcessEnv;
  sandbox: SandboxSpawnResolver;
}): BackgroundSpawnDecision {
  switch (input.sandbox.state) {
    case "absent":
      return {
        mode: "unsandboxed",
        reason: "sandbox-absent",
        cwd: input.cwd,
        env: { ...process.env, ...(input.envAdd ?? {}) },
      };
    case "broken":
      return failClosedDecision("sandbox-helper-broken", input.sandbox.message);
    case "loaded":
      return decideFromSandboxResult(
        input.command,
        input.sandbox.buildSandboxedSpawnArgs({
          command: input.command,
          cwd: input.cwd,
          configCwd: input.configCwd ?? process.cwd(),
          envAdd: input.envAdd,
        }),
      );
  }
}

function decideMonitorPoll(input: {
  command: string;
  /** Per-call command cwd; may be caller-controlled and only affects where the command runs. */
  cwd: string;
  /** Trusted session/project cwd for sandbox config and relative filesystem policy. */
  configCwd?: string;
  sandbox: SandboxSpawnResolver;
}): MonitorPollDecision {
  switch (input.sandbox.state) {
    case "absent":
      return { mode: "unsandboxed", reason: "sandbox-absent", cwd: input.cwd };
    case "broken":
      return { mode: "fail-closed", reason: "sandbox-helper-broken", message: input.sandbox.message };
    case "loaded": {
      const result = input.sandbox.buildSandboxedSpawnArgs({ command: input.command, cwd: input.cwd, configCwd: input.configCwd ?? process.cwd() });
      switch (result.state) {
        case "ok":
          return { mode: "sandboxed", sandbox: result, cwd: result.cwd, message: result.message };
        case "degraded":
          return { mode: "unsandboxed", reason: "sandbox-degraded", cwd: result.cwd, env: result.env, message: result.message };
        case "fail-closed":
          return { mode: "fail-closed", reason: result.reason, message: result.message };
      }
    }
  }
}

function isNoSuchProcess(err: unknown): boolean {
  return (err as { code?: unknown })?.code === "ESRCH";
}

function signalProcessGroup(pgid: number | undefined, child: ChildProcess, signal: NodeJS.Signals): "sent" | "gone" | "failed" {
  if (pgid) {
    try {
      process.kill(-pgid, signal);
      return "sent";
    } catch (err) {
      if (isNoSuchProcess(err)) return "gone";
    }
  }
  try {
    child.kill(signal);
    return "sent";
  } catch (err) {
    return isNoSuchProcess(err) ? "gone" : "failed";
  }
}

function processGroupExists(pgid: number | undefined): boolean {
  if (!pgid) return false;
  try {
    process.kill(-pgid, 0);
    return true;
  } catch (err) {
    return !isNoSuchProcess(err);
  }
}

function killChildProcessGroup(child: ChildProcess, signal: NodeJS.Signals): boolean {
  return signalProcessGroup(child.pid, child, signal) !== "failed";
}

async function runShellOnce(opts: ShellRunOptions): Promise<ExecResult> {
  if (opts.sandbox?.state !== "ok") {
    // When a degraded env is provided (pi-sandbox stripped provider secrets),
    // direct-spawn /bin/sh -c with it instead of pi.exec, which has no env
    // option and would inherit the full process.env.
    if (opts.degradedEnv) {
      return new Promise((resolve) => {
        const stdoutAcc = makeBoundedAccumulator();
        const stderrAcc = makeBoundedAccumulator();
        let outputOverflow = false;
        let settled = false;
        let timedOut = false;
        let abortListener: (() => void) | undefined;
        const child = spawn("/bin/sh", ["-c", opts.command], {
          cwd: opts.cwd,
          env: opts.degradedEnv,
          detached: true,
          stdio: ["ignore", "pipe", "pipe"],
        });

        // child.pid is available immediately after spawn() returns on the
        // successful path. Track it synchronously so jobs(action=cancel) can
        // target an in-flight degraded monitor poll before it closes.
        opts.onChildCreated?.(child);

        const timeoutTimer = setTimeout(() => {
          timedOut = true;
          killChildProcessGroup(child, "SIGKILL");
        }, opts.timeoutMs);

        const cleanup = () => {
          clearTimeout(timeoutTimer);
          if (abortListener) opts.signal?.removeEventListener("abort", abortListener);
          opts.onChildClose?.();
        };

        const finish = (result: ExecResult) => {
          if (settled) return;
          settled = true;
          cleanup();
          resolve(result);
        };

        abortListener = () => {
          timedOut = true;
          killChildProcessGroup(child, "SIGKILL");
        };
        opts.signal?.addEventListener("abort", abortListener, { once: true });
        if (opts.signal?.aborted) abortListener();

        child.stdout?.on("data", (data: Buffer | string) => {
          if (stdoutAcc.append(typeof data === "string" ? data : data.toString("utf8"))) {
            outputOverflow = true;
            killChildProcessGroup(child, "SIGKILL");
          }
        });
        child.stderr?.on("data", (data: Buffer | string) => {
          if (stderrAcc.append(typeof data === "string" ? data : data.toString("utf8"))) {
            outputOverflow = true;
            killChildProcessGroup(child, "SIGKILL");
          }
        });
        child.once("spawn", () => opts.onChildSpawn?.(child));
        child.once("error", (err) => {
          finish({ stdout: stdoutAcc.text(), stderr: `${stderrAcc.text()}${err.message}`, code: null });
        });
        child.once("close", (code, signal) => {
          const timeoutNote = timedOut ? `monitor poll exceeded ${opts.timeoutMs}ms and was terminated${signal ? ` by ${signal}` : ""}\n` : "";
          const overflowNote = outputOverflow ? `[output exceeded ${MAX_POLL_OUTPUT_CHARS} chars; child terminated to prevent OOM]\n` : "";
          finish({ stdout: stdoutAcc.text(), stderr: `${stderrAcc.text()}${overflowNote}${timeoutNote}`, code, killed: timedOut || outputOverflow });
        });
      });
    }
    // Sandbox-absent path with pi.exec: pi.core's exec buffers output internally
    // with no cap before resolving, so a noisy command (yes X) could OOM the Pi
    // process before this post-hoc cap applies. This is a known v0.1.0 residual
    // (the 5b pi.exec path); the direct-spawn path (sandboxed/degraded) uses
    // makeBoundedAccumulator for streaming cap. Routing sandbox-absent through
    // direct-spawn too would break test infrastructure that mocks pi.exec.
    if (!opts.piExec) throw new Error("monitor needs pi.exec, which is unavailable in this runtime.");
    const result = await opts.piExec("/bin/sh", ["-c", opts.command], { timeout: opts.timeoutMs, cwd: opts.cwd, signal: opts.signal });
    const cap = MAX_POLL_OUTPUT_CHARS;
    let overflowed = false;
    let stdout = result.stdout ?? "";
    let stderr = result.stderr ?? "";
    if (stdout.length > cap) { stdout = `${stdout.slice(0, cap)}\n[monitor poll output exceeded ${cap} chars; truncated to prevent OOM]`; overflowed = true; }
    if (stderr.length > cap) { stderr = `${stderr.slice(0, cap)}\n[monitor poll output exceeded ${cap} chars; truncated to prevent OOM]`; overflowed = true; }
    return { ...result, stdout, stderr, killed: result.killed || overflowed };
  }

  return new Promise((resolve) => {
    const stdoutAcc = makeBoundedAccumulator();
    const stderrAcc = makeBoundedAccumulator();
    let outputOverflow = false;
    let settled = false;
    let timedOut = false;
    let abortListener: (() => void) | undefined;
    const child = spawn(opts.sandbox.executable, [...opts.sandbox.args, opts.command], {
      cwd: opts.sandbox.cwd,
      env: opts.sandbox.env,
      detached: true,
      stdio: ["ignore", "pipe", "pipe"],
    });

    const timeoutTimer = setTimeout(() => {
      timedOut = true;
      killChildProcessGroup(child, "SIGKILL");
    }, opts.timeoutMs);

    const cleanup = () => {
      clearTimeout(timeoutTimer);
      if (abortListener) opts.signal?.removeEventListener("abort", abortListener);
      opts.onChildClose?.();
    };

    const finish = (result: ExecResult) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(result);
    };

    abortListener = () => {
      timedOut = true;
      killChildProcessGroup(child, "SIGKILL");
    };
    opts.signal?.addEventListener("abort", abortListener, { once: true });
    if (opts.signal?.aborted) abortListener();

    child.stdout?.on("data", (data: Buffer | string) => {
      if (stdoutAcc.append(typeof data === "string" ? data : data.toString("utf8"))) {
        outputOverflow = true;
        killChildProcessGroup(child, "SIGKILL");
      }
    });
    child.stderr?.on("data", (data: Buffer | string) => {
      if (stderrAcc.append(typeof data === "string" ? data : data.toString("utf8"))) {
        outputOverflow = true;
        killChildProcessGroup(child, "SIGKILL");
      }
    });
    child.once("spawn", () => opts.onChildSpawn?.(child));
    child.once("error", (err) => {
      finish({ stdout: stdoutAcc.text(), stderr: `${stderrAcc.text()}${err.message}`, code: null });
    });
    child.once("close", (code, signal) => {
      const timeoutNote = timedOut ? `monitor poll exceeded ${opts.timeoutMs}ms and was terminated${signal ? ` by ${signal}` : ""}\n` : "";
      const overflowNote = outputOverflow ? `[output exceeded ${MAX_POLL_OUTPUT_CHARS} chars; child terminated to prevent OOM]\n` : "";
      finish({ stdout: stdoutAcc.text(), stderr: `${stderrAcc.text()}${overflowNote}${timeoutNote}`, code, killed: timedOut || outputOverflow });
    });
  });
}

function waitForChildSpawn(child: ChildProcess): Promise<void> {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      child.off("spawn", onSpawn);
      child.off("error", onError);
    };
    const onSpawn = () => {
      cleanup();
      resolve();
    };
    const onError = (err: Error) => {
      cleanup();
      reject(err);
    };
    child.once("spawn", onSpawn);
    child.once("error", onError);
  });
}

// --- Extension ------------------------------------------------------------

export default function backgroundTasksExtension(pi: PiApi, options: BackgroundTasksExtensionOptions = {}): void {
  const resolveSandboxSpawnRaw = createCachedSandboxResolver(options.sandboxResolver);
  const resolveSandboxSpawn = async (): Promise<SandboxSpawnResolver> => {
    try {
      const resolved = await resolveSandboxSpawnRaw();
      publishSandboxIntegrationHandshake(resolved);
      return resolved;
    } catch (err) {
      publishBrokenSandboxIntegrationHandshake(err instanceof Error ? err.message : String(err));
      throw err;
    }
  };
  const jobs = new Map<number, Job>();
  let nextId = 1;
  let shuttingDown = false;

  function snapshot(): void {
    pi.appendEntry?.("background-tasks", {
      jobs: Array.from(jobs.values()).map((j) => ({
        id: j.id,
        kind: j.kind,
        label: j.label,
        command: j.command,
        status: j.status,
      })),
    });
  }

  /** Prune oldest terminal jobs so memory stays bounded across a long session. */
  function pruneTerminal(): void {
    const terminal = Array.from(jobs.values())
      .filter((j) => j.status !== "running" && j.status !== "cancelling")
      .sort((a, b) => (a.endedAt ?? 0) - (b.endedAt ?? 0));
    const excess = terminal.length - MAX_RETAINED_JOBS;
    for (let i = 0; i < excess; i++) jobs.delete(terminal[i].id);
  }

  function updateStatus(ui?: UiContext): void {
    if (!ui?.setStatus) return;
    const active = Array.from(jobs.values()).filter((j) => j.status === "running" || j.status === "cancelling");
    if (active.length === 0) {
      ui.setStatus(STATUS_KEY, undefined);
      return;
    }
    const labels = active.map((j) => `#${j.id} ${j.label}`).slice(0, 3).join(", ");
    const more = active.length > 3 ? ` +${active.length - 3}` : "";
    ui.setStatus(STATUS_KEY, `⏳ ${active.length} job${active.length === 1 ? "" : "s"}: ${labels}${more}`);
  }

  /** The last ctx.ui seen by any tool call — used to refresh visuals from async callbacks. */
  let lastUi: UiContext | undefined;

  function refreshVisuals(): void {
    updateStatus(lastUi);
  }

  /**
   * Wake the agent with a TRUSTED, hardcoded custom message. Only the numeric
   * job id and an exit/status word are interpolated — never command output,
   * which is attacker-controlled. The agent reads the actual output on demand
   * via the jobs tool (tail/view). Returns void; the wake is best-effort.
   */
  function wake(message: string, details: Record<string, unknown> = {}): void {
    if (shuttingDown) return; // don't trigger turns during/after shutdown
    const tail = message.split("\n")[0];
    const wakeDetails = { source: "background-tasks", trusted: true, ...details };
    try {
      if (pi.sendMessage) {
        // Best-effort: catch BOTH a rejected promise and a synchronous throw
        // from sendMessage (older runtimes may throw instead of rejecting).
        // deliverAs:"steer" injects the custom wake as soon as the current
        // tool-call batch finishes (before the next LLM call) rather than
        // waiting for the agent to wind down the whole turn ("followUp"). When
        // idle, triggerTurn starts a fresh turn immediately.
        void Promise.resolve(
          pi.sendMessage(
            {
              customType: WAKE_CUSTOM_TYPE,
              content: message,
              display: true,
              details: wakeDetails,
            },
            { triggerTurn: true, deliverAs: "steer" },
          ),
        ).catch((err) => {
          console.error(`[background-tasks] wake failed: ${(err as Error).message}`);
        });
      } else if (lastUi?.notify) {
        lastUi.notify(`${tail} (auto-wake unavailable: pi.sendMessage missing)`, "info");
      } else {
        console.error(`[background-tasks] wake (no channel): ${tail}`);
      }
    } catch (err) {
      console.error(`[background-tasks] wake threw: ${(err as Error).message}`);
    }
  }

  function notify(level: "info" | "success" | "warning" | "error", message: string): void {
    lastUi?.notify?.(message, level);
  }

  function finalize(job: Job): void {
    job.endedAt = Date.now();
    snapshot();
    pruneTerminal();
    refreshVisuals();
  }

  /**
   * Stop a running job by killing the whole process group with SIGKILL and
   * waiting until the group is actually gone. Cancellation is an operator kill
   * request, not a graceful shutdown request: giving an adversarial shell a
   * SIGTERM grace can let `trap TERM; sleep ...; echo marker` run after the
   * wrapper exits. Terminal state is recorded only after the process group is
   * gone or after a bounded SIGKILL reap window reports kill_failed.
   */
  async function cancelJob(job: Job): Promise<void> {
    if (job.status !== "running" && job.status !== "cancelling") return;
    if (job.timer) {
      clearTimeout(job.timer);
      job.timer = undefined;
    }
    const pollAbortController = job.pollAbortController;
    pollAbortController?.abort();
    if (!job.child || !job.pid) {
      // Between monitor polls (or the pi.exec residual path with no child handle)
      // there is no process group for this extension to reap. Record the user's
      // cancellation immediately; any in-flight pi.exec observes the abort signal
      // only if the host runtime supports it.
      job.status = "cancelled";
      finalize(job);
      return;
    }
    job.status = "cancelling";
    const pid = job.pid;
    const child = job.child;
    const waitForGroupExit = (ms: number): Promise<boolean> =>
      new Promise((resolve) => {
        const deadline = Date.now() + ms;
        const tick = () => {
          if (!processGroupExists(pid)) return resolve(true);
          if (Date.now() >= deadline) return resolve(false);
          // NOTE: do NOT unref this timer. Once the child exits it becomes the
          // only ref'd handle; an unref'd poll would let the loop drain and the
          // next tick would never fire, hanging the await indefinitely.
          setTimeout(tick, 50);
        };
        tick();
      });

    const killed = signalProcessGroup(pid, child, "SIGKILL");
    if (killed === "failed") {
      job.status = "kill_failed";
      finalize(job);
      return;
    }
    if (killed === "gone" || await waitForGroupExit(KILL_GRACE_MS)) {
      job.status = "cancelled";
      finalize(job);
      return;
    }
    job.status = "kill_failed";
    finalize(job);
  }

  // --- background tool ----------------------------------------------------

  const backgroundExecute: ToolExecute = async (_id, params, _signal, _onUpdate, ctx) => {
    lastUi = ctx.ui;
    const command = String(params.command ?? "").trim();
    if (!command) {
      return { content: [{ type: "text", text: "command is required." }], isError: true };
    }
    const sessionCwd = ctx.cwd ?? process.cwd();
    const cwd = params.cwd ? String(params.cwd) : sessionCwd;
    const label = params.label ? String(params.label) : slugify(command);
    const wakePatternRaw = params.wake_on_pattern ? String(params.wake_on_pattern) : undefined;
    const envAdd = (params.env ?? {}) as Record<string, string>;

    let wakeOnPattern: RegExp | undefined;
    if (wakePatternRaw) {
      try {
        wakeOnPattern = new RegExp(wakePatternRaw);
      } catch (err) {
        return {
          content: [{ type: "text", text: `Invalid wake_on_pattern regexp: ${(err as Error).message}` }],
          isError: true,
        };
      }
    }

    const sandbox = await resolveSandboxSpawn();
    const spawnDecision = decideBackgroundSpawn({ command, cwd, configCwd: sessionCwd, envAdd, sandbox });
    if (spawnDecision.mode === "fail-closed") {
      return {
        content: [{ type: "text", text: `Sandbox refused to start background command: ${spawnDecision.message}` }],
        details: { sandbox: "blocked", reason: spawnDecision.reason },
        isError: true,
      };
    }
    if (spawnDecision.mode === "unsandboxed" && spawnDecision.reason === "sandbox-degraded" && spawnDecision.message) {
      console.error(`[background-tasks] sandbox degraded for background command: ${spawnDecision.message}`);
    }

    const job: Job = {
      id: nextId++,
      kind: "background",
      label,
      command,
      status: "running",
      startedAt: Date.now(),
      buffer: "",
      wakeOnPattern,
      patternSource: wakePatternRaw,
    };

    const attachJobLifecycle = (): void => {
      const handleChunk = (data: Buffer | string): void => {
        const text = typeof data === "string" ? data : data.toString("utf8");
        appendBuffer(job, text);
        // Test against the ACCUMULATED buffer, not the per-chunk text: a pattern
        // match can straddle two chunks (stdout/stderr is delivered in arbitrary
        // read-sized pieces, not aligned to lines or pattern boundaries), and
        // testing only `text` would miss any match split across a chunk seam.
        //
        // Residuals (acceptable for 0.1.0, documented honestly):
        //  - The buffer is a bounded rolling window (MAX_BUFFER_CHARS). Only the
        //    retained window is searchable, so a match whose first half has
        //    already been aged out by >MAX_BUFFER_CHARS of later output will be
        //    missed. This also affects `^` anchors (the buffer's start is the
        //    window start, not the stream start). Use literal markers, not
        //    broad span regexps, for wake triggers on high-volume commands.
        //  - stdout and stderr are merged into one buffer, so a synthetic match
        //    can span the two streams.
        //  - Multibyte UTF-8 split across raw chunks is not reassembled here; a
        //    pattern containing a split code point can be missed.
        //  - The caller-supplied regexp runs over up to MAX_BUFFER_CHARS per chunk.
        //    A catastrophic-backtracking pattern can block the event loop more
        //    than it would against a single small chunk; prefer anchored literals.
        if (wakeOnPattern && !job.patternFired && wakeOnPattern.test(job.buffer)) {
          job.patternFired = true;
          wake(
            `[background job #${job.id} matched its wake_on_pattern — still running]. Read output with the jobs tool (action=tail, jobId=${job.id}).`,
          );
        }
      };
      child.stdout?.on("data", handleChunk);
      child.stderr?.on("data", handleChunk);
      child.on("exit", (code, signal) => {
        if (job.status === "cancelled" || job.status === "kill_failed") return;
        if (job.status === "cancelling") { job.exitCode = code ?? null; return; }
        if (job.status !== "running") return;
        job.exitCode = code;
        const ok = code === 0;
        job.status = ok ? "completed" : "failed";
        const reason = signal ? `signal ${signal}` : `exit ${code ?? "?"}`;
        notify(ok ? "success" : "error", `background job #${job.id} "${label}" finished: ${reason}`);
        wake(`[background job #${job.id} finished: ${reason}]. Read its output with the jobs tool (action=tail, jobId=${job.id}).`);
        finalize(job);
      });
      child.on("error", (err) => {
        if (job.status !== "running" && job.status !== "cancelling") return;
        job.status = "failed";
        // Only wake/notify if the job was registered (spawn succeeded enough to
        // enter the registry). Pre-registration spawn errors (waitForChildSpawn
        // rejected) are handled by the catch block, not here — waking for an
        // unregistered job would surprise the caller who got an error result.
        if (!jobs.has(job.id)) { finalize(job); return; }
        notify("error", `background job #${job.id} "${label}" failed to spawn: ${err.message}`);
        wake(`[background job #${job.id} failed to spawn: ${err.message}]. No command output was produced.`);
        finalize(job);
      });
    };

    let child: ChildProcess;
    try {
      if (spawnDecision.mode === "sandboxed") {
        child = spawn(spawnDecision.executable, spawnDecision.args, {
          cwd: spawnDecision.cwd,
          env: spawnDecision.env,
          detached: true,
          stdio: ["ignore", "pipe", "pipe"],
        });
        // Attach lifecycle listeners BEFORE awaiting spawn confirmation. A fast-
        // exiting child (e.g. `true`) can emit exit before waitForChildSpawn
        // resolves; attaching early ensures the job finalizes. The job is NOT
        // registered in the jobs map yet — if spawn errors, the 'error' listener
        // finalizes an unregistered job (harmless), and no phantom job remains.
        job.child = child;
        job.pid = child.pid;
        attachJobLifecycle();
        await waitForChildSpawn(child);
      } else {
        child = spawn(command, {
          shell: "/bin/sh",
          cwd: spawnDecision.cwd,
          env: spawnDecision.env,
          detached: true,
          stdio: ["ignore", "pipe", "pipe"],
        });
      }
    } catch (err) {
      return {
        content: [{ type: "text", text: `Sandbox failed to start background command: ${(err as Error).message}` }],
        details: { sandbox: "blocked", reason: "sandbox-spawn-error" },
        isError: true,
      };
    }
    // Register the job now (sandboxed path waited for spawn confirmation above;
    // unsandboxed path spawns synchronously). Listeners were attached before the
    // await in the sandboxed path, or just below for the unsandboxed path.
    job.child = child;
    job.pid = child.pid;
    if (!jobs.has(job.id)) {
      jobs.set(job.id, job);
      snapshot();
      // Unsandboxed path attaches listeners here; sandboxed already did above.
      if (spawnDecision.mode !== "sandboxed") attachJobLifecycle();
    }
    refreshVisuals();

    const patternNote = wakeOnPattern
      ? `, or earlier the first time output matches /${wakePatternRaw}/`
      : "";
    return {
      content: [
        {
          type: "text",
          text: `Started background job #${job.id} "${label}". I'll be woken with the result when it exits${patternNote}; read the output with the jobs tool. Use jobs (action=cancel, jobId=${job.id}) to stop it.`,
        },
      ],
      details: {
        jobId: job.id,
        status: "running",
        pid: job.pid,
        sandbox: spawnDecision.mode === "sandboxed" ? "active" : spawnDecision.reason === "sandbox-degraded" ? "degraded" : "absent",
      },
    };
  };

  // --- monitor tool -------------------------------------------------------

  const monitorExecute: ToolExecute = async (_id, params, _signal, _onUpdate, ctx) => {
    lastUi = ctx.ui;
    const command = String(params.command ?? "").trim();
    if (!command) {
      return { content: [{ type: "text", text: "command is required." }], isError: true };
    }
    const label = params.label ? String(params.label) : slugify(command);
    const rawInterval = Number(params.interval_seconds ?? DEFAULT_MONITOR_INTERVAL_S);
    const intervalSeconds = Number.isFinite(rawInterval) && rawInterval >= MIN_MONITOR_INTERVAL_S
      ? rawInterval
      : DEFAULT_MONITOR_INTERVAL_S;
    const rawTimeout = Number(params.timeout_seconds ?? DEFAULT_MONITOR_TIMEOUT_S);
    const timeoutSeconds = Number.isFinite(rawTimeout) && rawTimeout > 0 ? rawTimeout : DEFAULT_MONITOR_TIMEOUT_S;
    // satisfy_on is schema-required; no defensive default (L2 fix).
    const satisfyOn = String(params.satisfy_on);
    const patternRaw = params.pattern ? String(params.pattern) : undefined;

    if ((satisfyOn === "stdout_matches" || satisfyOn === "stdout_not_matches") && !patternRaw) {
      return {
        content: [{ type: "text", text: `satisfy_on=${satisfyOn} requires a pattern.` }],
        isError: true,
      };
    }
    let pattern: RegExp | undefined;
    if (patternRaw) {
      try {
        pattern = new RegExp(patternRaw);
      } catch (err) {
        return {
          content: [{ type: "text", text: `Invalid pattern regexp: ${(err as Error).message}` }],
          isError: true,
        };
      }
    }

    const sessionCwd = ctx.cwd ?? process.cwd();
    const cwd = params.cwd ? String(params.cwd) : sessionCwd;
    const sandbox = await resolveSandboxSpawn();
    const pollDecision = decideMonitorPoll({ command, cwd, configCwd: sessionCwd, sandbox });
    if (pollDecision.mode === "fail-closed") {
      return {
        content: [{ type: "text", text: `Sandbox refused to start monitor command: ${pollDecision.message}` }],
        details: { sandbox: "blocked", reason: pollDecision.reason },
        isError: true,
      };
    }
    if (pollDecision.mode === "unsandboxed" && !pi.exec) {
      return {
        content: [{ type: "text", text: "monitor needs pi.exec, which is unavailable in this runtime." }],
        isError: true,
      };
    }
    if (pollDecision.mode === "unsandboxed" && pollDecision.reason === "sandbox-degraded" && pollDecision.message) {
      console.error(`[background-tasks] sandbox degraded for monitor command: ${pollDecision.message}`);
    }

    const job: Job = {
      id: nextId++,
      kind: "monitor",
      label,
      command,
      status: "running",
      startedAt: Date.now(),
      buffer: "",
      intervalSeconds,
      timeoutSeconds,
      deadline: Date.now() + timeoutSeconds * 1000,
      satisfyOn,
      pattern: patternRaw,
    };
    jobs.set(job.id, job);
    snapshot();
    refreshVisuals();

    const evaluate = (out: string, code: number | null | undefined): boolean => {
      switch (satisfyOn) {
        case "exit_zero":
          return code === 0;
        case "exit_nonzero":
          return code !== 0 && code != null;
        case "stdout_matches":
          return pattern ? pattern.test(out) : false;
        case "stdout_not_matches":
          return pattern ? !pattern.test(out) : false;
        default:
          return false;
      }
    };

    // Recursive setTimeout AFTER each poll completes, plus an in-flight guard,
    // so polls can never overlap regardless of how long pi.exec takes.
    const tick = async (): Promise<void> => {
      if (job.status !== "running" || job.polling) return;
      job.polling = true;
      const pollAbortController = new AbortController();
      job.pollAbortController = pollAbortController;
      let result: ExecResult;
      try {
        // Unsandboxed/degraded monitors preserve the existing pi.exec route
        // through /bin/sh -c. Sandboxed monitors cannot use pi.exec because the
        // local PiApi slice has no env option; they direct-spawn bwrap with the
        // pi-sandbox-owned minimal env and argv prefix prepared once at monitor
        // start. Cancellation uses a per-job AbortController rather than the
        // monitor tool call's signal so jobs(action=cancel) owns the lifecycle.
        result = await runShellOnce({
          command,
          cwd: pollDecision.cwd,
          timeoutMs: Math.max(5, intervalSeconds) * 1000,
          signal: pollAbortController.signal,
          sandbox: pollDecision.mode === "sandboxed" ? pollDecision.sandbox : null,
          degradedEnv: pollDecision.mode === "unsandboxed" ? pollDecision.env : undefined,
          piExec: pi.exec,
          onChildCreated: (child) => {
            job.child = child;
            job.pid = child.pid;
          },
          onChildSpawn: (child) => {
            job.child = child;
            job.pid = child.pid;
          },
          onChildClose: () => {
            job.child = undefined;
            job.pid = undefined;
            // Cancellation verifies process-group death before recording terminal state.
          },
        });
      } catch (err) {
        result = { stderr: (err as Error).message, code: null };
      } finally {
        if (job.pollAbortController === pollAbortController) job.pollAbortController = undefined;
        job.polling = false;
      }
      if (job.status !== "running") return; // cancelled/timed out mid-poll

      const out = `${result.stdout ?? ""}${result.stderr ?? ""}`;
      appendBuffer(job, out);

      // Poll-failure visibility: catch a STRUCTURALLY-BROKEN poll — one whose
      // command can never succeed — and bail early with a diagnostic instead of
      // running it silently to the full deadline. The discriminator is narrow
      // on purpose: a `command not found` / `not found` error in stderr means
      // /bin/sh couldn't run the command at all (typo'd binary, missing tool,
      // or a bogus command inside a pipeline — note a pipeline still exits 0
      // via its last stage, so code alone is NOT a reliable signal). Legit
      // pending polls (test -f, nc -z, curl -fsS, grep -q) fail with a non-zero
      // exit and EMPTY or non-"not found" stderr until the condition holds, so
      // they must NOT be classified as broken — they're the tool's core use
      // case (local-pr-reviewer finding on PR #24: a broader `code !== 0 ||
      // empty stdout` heuristic false-aborted exactly these). After
      // MONITOR_POLL_FAIL_THRESHOLD consecutive "not found" polls, abort with
      // a diagnostic. A poll without that error resets the counter.
      const notFound = /(?:command not found|not found|No such file or directory)/i.test(result.stderr ?? "");
      job.pollFailures = notFound ? (job.pollFailures ?? 0) + 1 : 0;
      if ((job.pollFailures ?? 0) >= MONITOR_POLL_FAIL_THRESHOLD) {
        job.exitCode = result.code ?? undefined;
        job.status = "timeout";
        const hint = `every poll failed to run its command (command not found in stderr). The poll command likely references a missing/typo'd binary or tool`;
        notify("error", `monitor #${job.id} "${label}" aborting: ${hint}. Check the poll command.`);
        wake(
          `[monitor #${job.id} aborted after ${job.pollFailures} consecutive broken polls: ${hint}. Read the last poll with the jobs tool (action=tail, jobId=${job.id}) and fix the command.`,
        );
        finalize(job);
        return;
      }

      if (evaluate(result.stdout ?? "", result.code)) {
        job.exitCode = result.code ?? undefined;
        job.status = "satisfied";
        notify("success", `monitor #${job.id} "${label}" satisfied (${satisfyOn})`);
        // Trusted wake: only id and status/exit. NO command output, label, or
        // satisfy_on (all caller/output-controlled; injected via steer).
        wake(
          `[monitor #${job.id} satisfied: exit ${result.code ?? "?"}]. Read the result with the jobs tool (action=tail, jobId=${job.id}).`,
        );
        finalize(job);
        return;
      }
      if (Date.now() >= (job.deadline ?? 0)) {
        job.exitCode = result.code ?? undefined;
        job.status = "timeout";
        notify("warning", `monitor #${job.id} "${label}" timed out after ${timeoutSeconds}s`);
        wake(
          `[monitor #${job.id} timed out without satisfying its condition]. Read the last poll with the jobs tool (action=tail, jobId=${job.id}).`,
        );
        finalize(job);
        return;
      }
      // Schedule the NEXT poll only after this one finished -> no overlap.
      job.timer = setTimeout(() => void tick(), intervalSeconds * 1000);
    };

    // First tick immediately so short conditions resolve fast.
    void tick();

    return {
      content: [
        {
          type: "text",
          text: `Started monitor #${job.id} "${label}" — polling every ${intervalSeconds}s (timeout ${timeoutSeconds}s) until ${satisfyOn}${patternRaw ? ` matching /${patternRaw}/` : ""}. I'll be woken when it's satisfied or times out; read the result with the jobs tool. Cancel with jobs (action=cancel, jobId=${job.id}).`,
        },
      ],
      details: {
        jobId: job.id,
        status: "running",
        satisfyOn,
        intervalSeconds,
        timeoutSeconds,
        sandbox: pollDecision.mode === "sandboxed" ? "active" : pollDecision.reason === "sandbox-degraded" ? "degraded" : "absent",
      },
    };
  };

  // --- jobs tool ----------------------------------------------------------

  const jobsExecute: ToolExecute = async (_id, params, _signal, _onUpdate, ctx) => {
    lastUi = ctx.ui;
    // action is schema-required; no defensive default (L2 fix).
    const action = String(params.action);

    if (action === "list") {
      const list = Array.from(jobs.values()).sort((a, b) => a.id - b.id);
      if (list.length === 0) {
        return { content: [{ type: "text", text: "No background jobs or monitors registered." }] };
      }
      return {
        content: [{ type: "text", text: list.map(formatJobLine).join("\n") }],
        details: { count: list.length },
      };
    }

    const jobId = Number(params.jobId);
    const job = Number.isFinite(jobId) ? jobs.get(jobId) : undefined;

    if (action === "status") {
      if (!job) return { content: [{ type: "text", text: `No job #${jobId}.` }], isError: true };
      return {
        content: [
          {
            type: "text",
            text: `${formatJobLine(job)}\ncommand: ${job.command}\nstarted: ${new Date(job.startedAt).toISOString()}`,
          },
        ],
      };
    }

    if (action === "tail") {
      if (!job) return { content: [{ type: "text", text: `No job #${jobId}.` }], isError: true };
      const lines = Number(params.lines ?? DEFAULT_TAIL_LINES) || DEFAULT_TAIL_LINES;
      return { content: [{ type: "text", text: truncate(tailLines(job.buffer, lines)) }] };
    }

    if (action === "cancel") {
      if (!job) return { content: [{ type: "text", text: `No job #${jobId}.` }], isError: true };
      if (job.status !== "running" && job.status !== "cancelling") {
        return {
          content: [{ type: "text", text: `Job #${job.id} is already ${job.status} (only running jobs can be cancelled).` }],
        };
      }
      const was = job.status;
      await cancelJob(job);
      // Re-read into a wide-typed local: cancelJob mutated job.status across
      // the await, but TS narrowed it above and won't model the mutation.
      const status: JobStatus = job.status;
      const outcome =
        status === "kill_failed"
          ? `could not be killed within ${KILL_GRACE_MS / 1000}s of SIGKILL (reported as kill_failed — it may still be running as an orphan)`
          : `cancelled (was ${was})`;
      return {
        content: [{ type: "text", text: `Job #${job.id} "${job.label}" ${outcome}.` }],
        details: { jobId: job.id, status },
      };
    }

    if (action === "view") {
      // Open the focusable overlay panel (interactive). Requires real TUI mode.
      // In rpc/json/print modes ctx.ui.custom may exist but no-op, so gating on
      // its presence would falsely report "Opened".
      if (ctx.mode !== "tui" || !ctx.ui?.custom) {
        return {
          content: [{ type: "text", text: "Interactive view is only available in TUI mode. Use action=list and action=tail instead." }],
          isError: true,
        };
      }
      openJobPanel(ctx.ui);
      return { content: [{ type: "text", text: "Opened the background jobs panel. Use arrows/j-k to move, enter to page a job's output, q or Esc to close." }] };
    }

    return { content: [{ type: "text", text: `Unknown action "${action}". Use list, status, tail, cancel, or view.` }], isError: true };
  };

  // --- Focusable overlay panel (jobs view) --------------------------------

  function openJobPanel(ui: NonNullable<ToolContext["ui"]>): void {
    if (!ui.custom) return;
    // The component is built fresh on each open (overlays dispose on close).
    // pi ALWAYS passes the live KeybindingsManager as the factory's 3rd arg
    // (interactive-mode.js: `factory(this.ui, theme, this.keybindings, close)`),
    // so thread it straight into JobPanel rather than re-deriving the same
    // object via a fragile createRequire("@earendil-works/pi-tui") of an
    // undeclared dependency (opus review W1). Tests construct JobPanel
    // without a factory, so the param is optional there and resolveKb()
    // remains as a test-only fallback.
    ui.custom(
      (tui: unknown, theme: ThemeLike, keybindings: Keybindings, done: () => void) =>
        new JobPanel(
          () => Array.from(jobs.values()).sort((a, b) => a.id - b.id),
          theme,
          done,
          keybindings,
        ),
      { overlay: true, overlayOptions: { width: "70%", maxHeight: "80%", anchor: "center" } },
    );
  }

  // --- register -----------------------------------------------------------

  pi.registerTool?.({
    name: "background",
    label: "Background",
    description:
      "Run a long-running shell command in the background and return immediately with a job id. The agent is automatically woken (new turn) when the command exits; if wake_on_pattern is set, it also wakes the first time output matches that regexp. The wake carries only the job id and exit code — never command output, which the agent reads on demand with the jobs tool. Use this instead of the bash tool for anything long-running (test suites, builds, deploys, CI runs) so the turn doesn't block.",
    promptSnippet: "Run a long command in the background; get woken on completion",
    promptGuidelines: [
      "Use background for any command that may take more than a few seconds (test suites, builds, deploys, watch/serve, CI) instead of the bash tool, which blocks the turn. Also use it to launch multiple instances in parallel (fan out N jobs, harvest results with the jobs tool).",
      "After launching a background job, do NOT block waiting for it — either keep working on something else in parallel, or end the turn if there's nothing else to do. Never sleep or poll for it (no `sleep N` then `jobs list` loops): you are woken automatically on exit, and re-implementing the wake blocks the turn you were freeing up.",
      "Prefer the monitor tool over background when you need to wait for a CONDITION (e.g. CI going green, a file appearing, a log line) rather than a single command's exit.",
      "Command output is never auto-delivered: after a wake, read it with the jobs tool (action=tail) rather than expecting it in the wake message.",
    ],
    parameters: obj({
      command: str("Shell command to run in the background under /bin/sh."),
      cwd: str("Working directory. Defaults to the current project."),
      env: strRecord("Extra environment variables, merged over the inherited environment."),
      wake_on_pattern: str("Regexp. If set, wake early (before exit) the first time any stdout/stderr line matches it; the job keeps running and you'll still be woken on exit."),
      label: str("Short human label for the job. Defaults to a slug of the command."),
    }, ["command"]),
    execute: backgroundExecute,
  });

  pi.registerTool?.({
    name: "monitor",
    label: "Monitor",
    description:
      "Poll a shell command on an interval until a condition is satisfied (or a timeout fires), then wake the agent. satisfy_on picks the condition: exit_zero, exit_nonzero, stdout_matches (pattern), or stdout_not_matches (pattern). Use this to wait on a state rather than a single run — e.g. watch CI until green (gh run list + stdout_matches on success), wait for a file/port, or wait for a log line. Returns immediately with a monitor id; the agent is woken on satisfy or timeout. Polls never overlap and the interval is floored at 1s.",
    promptSnippet: "Poll a command until a condition holds (CI green, file appears, log line)",
    promptGuidelines: [
      "Use monitor (not background, and NEVER a hand-rolled `sleep N` + check loop) when you are waiting for a STATE/condition to become true by re-checking a command. Monitor is the sanctioned, non-blocking poller.",
      "After launching a monitor, do NOT block waiting for it — keep working on something else, or end the turn. You are woken on satisfy or timeout; never sleep or poll for it.",
      "Set a sensible timeout_seconds so a never-satisfied condition wakes you with a timeout rather than polling forever.",
    ],
    parameters: obj({
      command: str("Shell command polled on each tick under /bin/sh."),
      cwd: str("Working directory. Defaults to the current project."),
      satisfy_on: strEnum(["exit_zero", "exit_nonzero", "stdout_matches", "stdout_not_matches"], "Condition that satisfies the monitor. stdout_matches/stdout_not_matches require pattern."),
      pattern: str("Regexp used by stdout_matches / stdout_not_matches."),
      interval_seconds: num(`Poll interval in seconds (floored at ${MIN_MONITOR_INTERVAL_S}). Default ${DEFAULT_MONITOR_INTERVAL_S}.`),
      timeout_seconds: num(`Give up after this many seconds. Default ${DEFAULT_MONITOR_TIMEOUT_S}.`),
      label: str("Short human label. Defaults to a slug of the command."),
    }, ["command", "satisfy_on"]),
    execute: monitorExecute,
  });

  pi.registerTool?.({
    name: "jobs",
    label: "Jobs",
    description:
      "Manage the background-task / monitor registry. action=list shows every job with status, kind, label, and runtime; status/tail/cancel/view operate on one jobId (view opens a focusable, keyboard-navigable panel — arrows/j-k to move, enter to page a job's output, q/Esc to close). Use this to check on jobs, read their output, cancel one, or open the jobs panel.",
    promptSnippet: "List, tail, status, cancel, or view background jobs and monitors",
    promptGuidelines: [
      "Use jobs with action=list to check on background/monitor jobs before assuming completion, and action=cancel to stop a job you no longer need (a cancelled job does not wake you).",
      "Use action=tail (or action=view) to read a job's output — it is never delivered automatically in the wake message.",
    ],
    parameters: obj({
      action: strEnum(["list", "status", "tail", "cancel", "view"], "What to do. view opens the interactive panel."),
      jobId: num("Required for status, tail, and cancel."),
      lines: num("Number of trailing lines for tail. Default 40."),
    }, ["action"]),
    execute: jobsExecute,
  });

  // Convenience command mirroring the view action.
  pi.registerCommand?.("jobs", {
    description: "Open the background-jobs panel (focusable overlay; TUI mode only)",
    handler: (_args, ctx) => {
      lastUi = ctx.ui;
      if (ctx.mode === "tui" && ctx.ui?.custom) openJobPanel(ctx.ui);
      else ctx.ui?.notify?.("Interactive panel is TUI-only; use the jobs tool instead.", "warning");
    },
  });

  pi.on?.("session_start", async () => {
    try {
      await resolveSandboxSpawn();
    } catch (err) {
      console.error(`[background-tasks] sandbox bridge probe failed: ${(err as Error).message}`);
    }
  });

  // --- Session-start system-prompt nudge ---------------------------------
  //
  // Append the explainer every turn. Why every turn rather than a one-shot
  // `session_start` user message: the session rebuilds the system prompt from
  // the base each turn, so a one-shot message would be summarized away on the
  // first compaction and never return. Re-appending per turn is compaction-
  // immune, and the token cost is comparable to the per-turn promptGuidelines
  // already attached to each tool definition.
  //
  // The runner wholesale-replaces the prompt with whatever we return and threads
  // `currentSystemPrompt` through chained handlers, so we MUST preserve
  // event.systemPrompt (append to it) — returning only our block would wipe
  // the entire prompt. `event.systemPrompt` starts from the base prompt every
  // turn, so this never sees our own prior append under normal single
  // registration; the header check is a cheap double-registration guard.
  pi.on?.("before_agent_start", (event) => {
    const base = event.systemPrompt ?? "";
    if (base.includes(SYSTEM_PROMPT_EXPLAINER_HEADER)) return;
    return { systemPrompt: `${base}\n\n${SYSTEM_PROMPT_EXPLAINER}` };
  });

  // Clean up every spawned child / timer on shutdown so we never leak processes.
  // Await cancellations so process-group SIGKILL and bounded reaping complete before
  // the process tears down (a fire-and-forget timer could be killed mid-reap).
  // Also clear the sandbox integration handshake: the symbol is cross-session
  // (Symbol.for), so a stale `integrated: true` from this session would otherwise
  // survive into the next session and leave background/monitor enabled until the
  // bridge republishes — a window where the next session trusts stale state.
  pi.on?.("session_shutdown", async () => {
    shuttingDown = true;
    await Promise.all(
      Array.from(jobs.values())
        .filter((j) => j.status === "running" || j.status === "cancelling")
        .map((j) => cancelJob(j)),
    );
    clearSandboxIntegrationHandshake();
  });
}

export { MAX_RETAINED_JOBS, clipToWidth, JobPanel, decideBackgroundSpawn, decideMonitorPoll, runShellOnce };
export type { BackgroundTasksExtensionOptions, BackgroundSpawnDecision, MonitorPollDecision, SandboxSpawnResolver };

// --- Theme shim (avoids importing the real Theme type) -------------------

type ThemeLike = {
  fg?: (name: string, text: string) => string;
  bold?: (text: string) => string;
};

/**
 * Clip a string to a visible column width, ignoring ANSI escapes. The TUI
 * appends a full SGR reset per rendered line, so any trailing style is safe.
 * Used by JobPanel.render() to guarantee no line exceeds `width`.
 *
 * Note: width is counted in UTF-16 code units, not display columns; a wide
 * CJK/emoji glyph may overrun by one column. Acceptable for status marks and
 * typical labels — documented here rather than pulling in East-Asian-Width.
 */
function clipToWidth(text: string, width: number): string {
  if (width <= 0) return "";
  let visible = 0;
  let out = "";
  let i = 0;
  while (i < text.length) {
    const rest = text.slice(i);
    const m = rest.match(/^\x1b\[[0-9;]*m/);
    if (m) {
      out += m[0];
      i += m[0].length;
      continue;
    }
    if (visible >= width) break;
    out += text[i];
    visible++;
    i++;
  }
  // Strip a dangling incomplete escape (e.g. clip landed mid-sequence).
  return out.replace(/\x1b\[[0-9;]*$/, "");
}

// --- Focusable overlay panel component -----------------------------------

/**
 * A keyboard-navigable job board: one line per job with status mark / kind /
 * label / runtime; enter pages the selected job's buffered output; q/Esc
 * closes. Implements the pi-tui Component interface (render/handleInput) by
 * duck-typing; the real @earendil-works/pi-tui Component type is not imported
 * to keep the file dependency-free.
 */
class JobPanel {
  private theme: ThemeLike;
  private onClose: () => void;
  private kb: { matches: (data: string, action: string) => boolean } | null;
  private selected = 0;
  private paging: { jobId: number } | null = null;
  private getJobs: () => Job[];

  constructor(
    getJobs: () => Job[],
    theme: ThemeLike,
    onClose: () => void,
    // pi hands the live KeybindingsManager to the ui.custom factory (3rd arg)
    // and we thread it through openJobPanel. Optional so tests can construct
    // JobPanel directly without a factory (opus review W1: prefer this over a
    // createRequire lookup of an undeclared dependency).
    keybindings?: { matches: (data: string, action: string) => boolean },
  ) {
    this.getJobs = getJobs;
    this.theme = theme;
    this.onClose = onClose;
    this.kb = keybindings ?? resolveKb();
  }

  private fg(name: string, text: string): string {
    return this.theme.fg ? this.theme.fg(name, text) : text;
  }

  /** Match input against a pi-tui action, falling back to raw bytes. */
  private is(data: string, action: "up" | "down" | "left" | "right" | "confirm" | "cancel"): boolean {
    const actionId =
      action === "left" || action === "right"
        ? `tui.editor.cursor${action[0].toUpperCase()}${action.slice(1)}`
        : `tui.select.${action}`;
    if (this.kb?.matches(data, actionId)) return true;
    return RAW[action](data);
  }

  handleInput(data: string): void {
    const jobs = this.getJobs();
    // Clamp selection up-front in case the list shrank since the last render.
    this.selected = jobs.length === 0 ? 0 : Math.min(this.selected, jobs.length - 1);
    if (this.paging) {
      // In paging mode: left/Esc/enter/"q"/back-to-list all return to the list.
      if (this.is(data, "cancel") || this.is(data, "confirm") || this.is(data, "left") || data === "q") this.paging = null;
      return;
    }
    if (jobs.length === 0) {
      if (this.is(data, "cancel") || data === "q") this.onClose();
      return;
    }
    if (this.is(data, "cancel") || data === "q") {
      this.onClose();
    } else if (this.is(data, "down")) {
      this.selected = Math.min(jobs.length - 1, this.selected + 1);
    } else if (this.is(data, "up")) {
      this.selected = Math.max(0, this.selected - 1);
    } else if (this.is(data, "confirm") || this.is(data, "right")) {
      const job = jobs[this.selected];
      if (job) this.paging = { jobId: job.id };
    }
  }

  render(width: number): string[] {
    if (this.paging) return this.renderPaging(width);
    const jobs = this.getJobs();
    const lines: string[] = [];
    const w = Math.max(1, width);
    // Clamp selection if the list shrank (jobs pruned/added between renders).
    const sel = jobs.length === 0 ? 0 : Math.min(this.selected, jobs.length - 1);
    this.selected = sel;
    const rule = "─".repeat(w);
    lines.push(clipToWidth(this.fg("borderMuted", rule), w));
    const header = this.fg("accent", ` Background jobs (${jobs.length}) `) + this.fg("dim", "  — ↑/↓ move · enter page output · q/Esc close");
    lines.push(clipToWidth(header, w));
    lines.push(clipToWidth(this.fg("borderMuted", rule), w));
    if (jobs.length === 0) {
      lines.push("");
      lines.push(clipToWidth(this.fg("dim", "  No background jobs or monitors."), w));
    }
    jobs.forEach((job, i) => {
      const marker = i === sel ? this.fg("accent", "▸ ") : "  ";
      lines.push(clipToWidth(`${marker}${formatJobLine(job)}`, w));
    });
    lines.push("");
    lines.push(clipToWidth(this.fg("borderMuted", rule), w));
    return lines;
  }

  private renderPaging(width: number): string[] {
    const job = this.paging ? this.getJobs().find((j) => j.id === this.paging!.jobId) : undefined;
    const lines: string[] = [];
    const w = Math.max(1, width);
    const rule = "─".repeat(w);
    lines.push(clipToWidth(this.fg("borderMuted", rule), w));
    if (!job) {
      lines.push(clipToWidth(this.fg("warning", "  Job no longer in the registry."), w));
    } else {
      lines.push(clipToWidth(this.fg("accent", ` Job #${job.id} "${job.label}" — output `), w));
      lines.push(clipToWidth(this.fg("dim", ` ${formatJobLine(job)}`), w));
      lines.push(clipToWidth(this.fg("borderMuted", rule), w));
      // Bound the paged output to a sane number of lines (the buffer is already
      // size-capped; tailLines never gets a 0 argument which would return it all).
      const body = tailLines(job.buffer, PAGING_TAIL_LINES) || "(no output captured)";
      for (const ln of body.split("\n")) lines.push(clipToWidth(ln, w));
    }
    lines.push(clipToWidth(this.fg("borderMuted", rule), w));
    lines.push(clipToWidth(this.fg("dim", " ←/q/Esc/enter — back to list"), w));
    return lines;
  }
}
