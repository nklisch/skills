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
 * Wake-ups are delivered via pi.sendUserMessage with a HARDCODED, trusted
 * message that contains only the numeric job id and exit code / status word
 * — never command output. Command output stays in the registry and is read
 * on demand via the jobs tool (action=tail) or the focusable overlay panel
 * (action=view). This keeps a malicious command's stdout from being injected
 * as user-authored content (it would otherwise arrive as a real user turn).
 *
 * If sendUserMessage is unavailable (older pi), completion is surfaced via
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
 *   - cancel/shutdown send SIGTERM to the child's process group, wait a grace
 *     period for exit, then SIGKILL the group if it survives, and record the
 *     outcome honestly. A job that won't die is reported, not silently
 *     marked cancelled.
 */

import { spawn, type ChildProcess } from "node:child_process";

const STATUS_KEY = "background-tasks";
const MAX_TAIL_CHARS = 6_000; // hard cap on anything sent back to the model
const MAX_BUFFER_CHARS = 200_000; // rolling in-memory buffer per job
const DEFAULT_MONITOR_INTERVAL_S = 10;
const DEFAULT_MONITOR_TIMEOUT_S = 600;
const MIN_MONITOR_INTERVAL_S = 1; // floor; sub-second polls flood commands
const DEFAULT_TAIL_LINES = 40;
const CANCEL_GRACE_MS = 4_000; // SIGTERM grace before SIGKILL
const KILL_GRACE_MS = 2_000; // post-SIGKILL reap window before declaring kill_failed
const MAX_RETAINED_JOBS = 50; // prune oldest terminal jobs above this count
const PAGING_TAIL_LINES = 200; // lines of output shown per job in the view panel

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
    options?: { signal?: AbortSignal; timeout?: number },
  ) => Promise<ExecResult>;
  sendUserMessage?: (
    content: string,
    options?: { deliverAs?: "followUp" | "steer" | "immediate" },
  ) => void | Promise<void>;
  appendEntry?: (customType: string, data?: unknown) => void;
  registerTool?: (def: ToolDefinition) => void;
  registerCommand?: (name: string, options: { description: string; handler: (args: string | undefined, ctx: ToolContext) => void }) => void;
  on?: (
    event: string,
    handler: (event: unknown, ctx: ToolContext) => Promise<void> | void,
  ) => void;
};

// --- Job registry ---------------------------------------------------------

type JobKind = "background" | "monitor";
type JobStatus =
  | "running"
  | "cancelling" // SIGTERM sent; awaiting exit or grace-expiry SIGKILL
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

// --- Extension ------------------------------------------------------------

export default function backgroundTasksExtension(pi: PiApi): void {
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
   * Wake the agent with a TRUSTED, hardcoded message. Only the numeric job id
   * and an exit/status word are interpolated — never command output, which is
   * attacker-controlled. The agent reads the actual output on demand via the
   * jobs tool (tail/view). Returns void; the wake is best-effort.
   */
  function wake(message: string): void {
    if (shuttingDown) return; // don't trigger turns during/after shutdown
    const tail = message.split("\n")[0];
    try {
      if (pi.sendUserMessage) {
        // Best-effort: catch BOTH a rejected promise and a synchronous throw
        // from sendUserMessage (older runtimes may throw instead of rejecting).
        void Promise.resolve(pi.sendUserMessage(message, { deliverAs: "followUp" })).catch((err) => {
          console.error(`[background-tasks] wake failed: ${(err as Error).message}`);
        });
      } else if (lastUi?.notify) {
        lastUi.notify(tail, "info");
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
   * Stop a running job: SIGTERM its process group, wait for exit within a grace
   * window, then SIGKILL the group if it survived, waiting up to a second short
   * window for reaping. Records the HONEST outcome — cancelled (clean exit on
   * SIGTERM or reaped after SIGKILL) or kill_failed (still alive after SIGKILL).
   * Routes every terminal transition through finalize() so pruning/visuals fire.
   * Idempotent for an already-terminal job. Resolves once terminal.
   */
  async function cancelJob(job: Job): Promise<void> {
    if (job.status !== "running" && job.status !== "cancelling") return;
    if (job.timer) {
      clearTimeout(job.timer);
      job.timer = undefined;
    }
    if (!job.child || !job.pid) {
      // monitor (no child process) — terminal immediately.
      job.status = "cancelled";
      finalize(job);
      return;
    }
    job.status = "cancelling";
    const pid = job.pid;
    const child = job.child;
    const tryKill = (sig: NodeJS.Signals): boolean => {
      try {
        process.kill(-pid, sig); // negative pid = the whole process group
        return true;
      } catch {
        try {
          child.kill(sig);
          return true;
        } catch {
          return false; // already dead
        }
      }
    };
    const waitForExit = (ms: number): Promise<boolean> =>
      new Promise((resolve) => {
        const deadline = Date.now() + ms;
        const tick = () => {
          if (job.status !== "cancelling") return resolve(true); // exit handler reaped it
          if (Date.now() >= deadline) return resolve(false);
          // NOTE: do NOT unref this timer. Once the child exits it becomes the
          // only ref'd handle; an unref'd poll would let the loop drain and the
          // next tick would never fire, hanging the await indefinitely.
          setTimeout(tick, 50);
        };
        tick();
      });

    tryKill("SIGTERM");
    if (await waitForExit(CANCEL_GRACE_MS)) {
      if (job.status === "cancelling") {
        job.status = "cancelled";
        finalize(job);
      }
      return;
    }
    if (job.status !== "cancelling") return; // reaped mid-window
    // Still alive after SIGTERM grace — escalate to SIGKILL and wait for reaping.
    const killed = tryKill("SIGKILL");
    if (!killed) {
      // Group was already gone (race with exit). Treat as cancelled.
      job.status = "cancelled";
      finalize(job);
      return;
    }
    if (await waitForExit(KILL_GRACE_MS)) {
      if (job.status === "cancelling") {
        job.status = "cancelled";
        finalize(job);
      }
      return;
    }
    // SIGKILL did not reap the group within the window — record honestly.
    if (job.status === "cancelling") {
      job.status = "kill_failed";
      finalize(job);
    }
  }

  // --- background tool ----------------------------------------------------

  const backgroundExecute: ToolExecute = async (_id, params, _signal, _onUpdate, ctx) => {
    lastUi = ctx.ui;
    const command = String(params.command ?? "").trim();
    if (!command) {
      return { content: [{ type: "text", text: "command is required." }], isError: true };
    }
    const cwd = params.cwd ? String(params.cwd) : ctx.cwd ?? process.cwd();
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

    const child = spawn(command, {
      shell: "/bin/sh",
      cwd,
      env: { ...process.env, ...envAdd },
      detached: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
    job.child = child;
    job.pid = child.pid;

    const handleChunk = (data: Buffer | string): void => {
      const text = typeof data === "string" ? data : data.toString("utf8");
      appendBuffer(job, text);
      if (wakeOnPattern && !job.patternFired && wakeOnPattern.test(text)) {
        job.patternFired = true;
        // Trusted wake: no command output, just id + the matched fact.
        wake(
          `[background job #${job.id} "${label}" matched its wake_on_pattern — still running]. Read output with the jobs tool (action=tail, jobId=${job.id}).`,
        );
      }
    };
    child.stdout?.on("data", handleChunk);
    child.stderr?.on("data", handleChunk);

    child.on("exit", (code, signal) => {
      if (job.status === "cancelled" || job.status === "kill_failed") return; // cancellation owns terminal state
      if (job.status === "cancelling") {
        // Reaped during cancellation (SIGTERM or SIGKILL worked) — mark cancelled.
        job.status = "cancelled";
        job.exitCode = code ?? null;
        finalize(job);
        return;
      }
      if (job.status !== "running") return; // already finalized (double-fire guard)
      job.exitCode = code;
      const ok = code === 0;
      job.status = ok ? "completed" : "failed";
      const reason = signal ? `signal ${signal}` : `exit ${code ?? "?"}`;
      notify(ok ? "success" : "error", `background job #${job.id} "${label}" finished: ${reason}`);
      // Trusted wake: only id, label, and the status word. NO command output.
      wake(
        `[background job #${job.id} "${label}" finished: ${reason}]. Read its output with the jobs tool (action=tail, jobId=${job.id}).`,
      );
      finalize(job);
    });
    child.on("error", (err) => {
      if (job.status !== "running" && job.status !== "cancelling") return;
      job.status = "failed";
      notify("error", `background job #${job.id} "${label}" failed to spawn: ${err.message}`);
      wake(
        `[background job #${job.id} "${label}" failed to spawn: ${err.message}]. No command output was produced.`,
      );
      finalize(job);
    });

    jobs.set(job.id, job);
    snapshot();
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
      details: { jobId: job.id, status: "running", pid: job.pid },
    };
  };

  // --- monitor tool -------------------------------------------------------

  const monitorExecute: ToolExecute = async (_id, params, _signal, _onUpdate, ctx) => {
    lastUi = ctx.ui;
    const command = String(params.command ?? "").trim();
    if (!command) {
      return { content: [{ type: "text", text: "command is required." }], isError: true };
    }
    if (!pi.exec) {
      return {
        content: [{ type: "text", text: "monitor needs pi.exec, which is unavailable in this runtime." }],
        isError: true,
      };
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
      let result: ExecResult;
      try {
        result = await pi.exec!(command, [], { timeout: Math.max(5, intervalSeconds) * 1000 });
      } catch (err) {
        result = { stderr: (err as Error).message, code: null };
      }
      job.polling = false;
      if (job.status !== "running") return; // cancelled/timed out mid-poll

      const out = `${result.stdout ?? ""}${result.stderr ?? ""}`;
      appendBuffer(job, out);

      if (evaluate(result.stdout ?? "", result.code)) {
        job.exitCode = result.code ?? undefined;
        job.status = "satisfied";
        notify("success", `monitor #${job.id} "${label}" satisfied (${satisfyOn})`);
        // Trusted wake: no command output.
        wake(
          `[monitor #${job.id} "${label}" satisfied: ${satisfyOn}, exit ${result.code ?? "?"}]. Read the result with the jobs tool (action=tail, jobId=${job.id}).`,
        );
        finalize(job);
        return;
      }
      if (Date.now() >= (job.deadline ?? 0)) {
        job.exitCode = result.code ?? undefined;
        job.status = "timeout";
        notify("warning", `monitor #${job.id} "${label}" timed out after ${timeoutSeconds}s`);
        wake(
          `[monitor #${job.id} "${label}" timed out after ${timeoutSeconds}s without satisfying ${satisfyOn}]. Read the last poll with the jobs tool (action=tail, jobId=${job.id}).`,
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
      details: { jobId: job.id, status: "running", satisfyOn, intervalSeconds, timeoutSeconds },
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
    ui.custom(
      (tui: unknown, theme: ThemeLike, keybindings: Keybindings, done: () => void) =>
        new JobPanel(() => Array.from(jobs.values()).sort((a, b) => a.id - b.id), theme, done),
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
      "Use background for any command that may take more than a few seconds (test suites, builds, deploys, watch/serve, CI) instead of the bash tool, which blocks the turn.",
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
      "Use monitor (not background) when you are waiting for a STATE/condition to become true by re-checking a command, not for a single long command's exit.",
      "Set a sensible timeout_seconds so a never-satisfied condition wakes you with a timeout rather than polling forever.",
    ],
    parameters: obj({
      command: str("Shell command polled on each tick under /bin/sh."),
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

  // Clean up every spawned child / timer on shutdown so we never leak processes.
  // Await cancellations so SIGTERM/SIGKILL escalation actually completes before
  // the process tears down (a fire-and-forget timer could be killed mid-escalate).
  pi.on?.("session_shutdown", async () => {
    shuttingDown = true;
    await Promise.all(
      Array.from(jobs.values())
        .filter((j) => j.status === "running" || j.status === "cancelling")
        .map((j) => cancelJob(j)),
    );
  });
}

export { MAX_RETAINED_JOBS, clipToWidth, JobPanel };

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
  private selected = 0;
  private paging: { jobId: number } | null = null;
  private getJobs: () => Job[];

  constructor(getJobs: () => Job[], theme: ThemeLike, onClose: () => void) {
    this.getJobs = getJobs;
    this.theme = theme;
    this.onClose = onClose;
  }

  private fg(name: string, text: string): string {
    return this.theme.fg ? this.theme.fg(name, text) : text;
  }

  handleInput(data: string): void {
    const jobs = this.getJobs();
    // Clamp selection up-front in case the list shrank since the last render.
    this.selected = jobs.length === 0 ? 0 : Math.min(this.selected, jobs.length - 1);
    if (this.paging) {
      // In paging mode: any of q/Esc/enter returns to the list.
      if (data === "\u001b" || data === "q" || data === "\r" || data === "\n") this.paging = null;
      return;
    }
    if (jobs.length === 0) {
      if (data === "q" || data === "\u001b") this.onClose();
      return;
    }
    if (data === "\u001b" || data === "q") {
      this.onClose();
    } else if (data === "j" || data === "\u001b[B") {
      this.selected = Math.min(jobs.length - 1, this.selected + 1);
    } else if (data === "k" || data === "\u001b[A") {
      this.selected = Math.max(0, this.selected - 1);
    } else if (data === "\r" || data === "\n" || data === "l" || data === "\u001b[C") {
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
    const header = this.fg("accent", ` Background jobs (${jobs.length}) `) + this.fg("dim", "  — j/k move · enter page output · q/Esc close");
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
    lines.push(clipToWidth(this.fg("dim", " q/Esc/enter — back to list"), w));
    return lines;
  }
}
