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
 *   - jobs       : list / cancel / tail / status over the job registry.
 *
 * Wake-ups are delivered via pi.sendUserMessage({ deliverAs: "followUp" }),
 * which always triggers a new agent turn when the agent is idle. If
 * sendUserMessage is unavailable (older pi), completion is surfaced only
 * through ui.notify + footer status and the agent is not auto-woken.
 *
 * Parameter schemas are built as plain JSON-Schema objects (no typebox
 * import) so the file has zero @earendil-works/* dependencies — it stays
 * unit-testable with a fake pi under bare `bun test`, mirroring the
 * agile-workflow extension's loose-coupling house style. pi's provider layer
 * reads only `properties` and `required` from each schema.
 */

import { spawn, type ChildProcess } from "node:child_process";

const STATUS_KEY = "background-tasks";
const MAX_TAIL_CHARS = 6_000; // cap anything sent back to the model
const MAX_BUFFER_CHARS = 200_000; // rolling in-memory buffer per job
const DEFAULT_MONITOR_INTERVAL_S = 10;
const DEFAULT_MONITOR_TIMEOUT_S = 600;
const DEFAULT_TAIL_LINES = 40;

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
};

type ToolContext = {
  cwd?: string;
  signal?: AbortSignal;
  ui?: UiContext;
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
  on?: (
    event: string,
    handler: (event: unknown, ctx: ToolContext) => Promise<void> | void,
  ) => void;
};

// --- Job registry ---------------------------------------------------------

type JobKind = "background" | "monitor";
type JobStatus =
  | "running"
  | "completed"
  | "failed"
  | "cancelled"
  | "satisfied"
  | "timeout";

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
  timer?: ReturnType<typeof setInterval>;
};

// --- Helpers --------------------------------------------------------------

function truncate(text: string, max = MAX_TAIL_CHARS): string {
  if (text.length <= max) return text;
  const kept = max - 40;
  return `${text.slice(Math.max(0, text.length - kept))}\n…[truncated, showing last ${kept} chars of ${text.length}]`;
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
    job.status === "running"
      ? "●"
      : job.status === "completed" || job.status === "satisfied"
        ? "✓"
        : job.status === "failed" || job.status === "timeout"
          ? "✗"
          : "⊘";
  const exit = job.exitCode != null ? ` exit ${job.exitCode}` : "";
  return `#${job.id} ${mark} [${job.status}${exit}] ${job.kind} "${job.label}" (${fmtDuration(elapseMs(job))})`;
}

// --- Extension ------------------------------------------------------------

export default function backgroundTasksExtension(pi: PiApi): void {
  const jobs = new Map<number, Job>();
  let nextId = 1;

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

  function updateStatus(ui?: UiContext): void {
    if (!ui?.setStatus) return;
    const running = Array.from(jobs.values()).filter((j) => j.status === "running");
    if (running.length === 0) {
      ui.setStatus(STATUS_KEY, undefined);
      return;
    }
    const labels = running.map((j) => `#${j.id} ${j.label}`).slice(0, 3).join(", ");
    const more = running.length > 3 ? ` +${running.length - 3}` : "";
    ui.setStatus(STATUS_KEY, `⏳ ${running.length} job${running.length === 1 ? "" : "s"}: ${labels}${more}`);
  }

  function wake(message: string): void {
    if (pi.sendUserMessage) {
      void pi.sendUserMessage(message, { deliverAs: "followUp" });
    } else {
      // Older pi without sendUserMessage: surface but cannot auto-trigger a turn.
      console.error(`[background-tasks] wake (no sendUserMessage): ${message.split("\n")[0]}`);
    }
  }

  function finalize(job: Job): void {
    job.endedAt = Date.now();
    snapshot();
  }

  function cancelJob(job: Job): void {
    if (job.timer) {
      clearInterval(job.timer);
      job.timer = undefined;
    }
    if (job.child && job.pid) {
      try {
        // Kill the whole process group (detached spawn puts the child in its own group).
        process.kill(-job.pid, "SIGTERM");
      } catch {
        try {
          job.child.kill("SIGTERM");
        } catch {
          /* already dead */
        }
      }
    }
    job.status = "cancelled";
    job.endedAt = Date.now();
    snapshot();
  }

  // --- background tool ----------------------------------------------------

  const backgroundExecute: ToolExecute = async (_id, params, _signal, _onUpdate, ctx) => {
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
        wake(
          `[background job "${label}" #${job.id} pattern matched /${wakePatternRaw}/ — still running]\n\nUse the jobs tool to follow it.`,
        );
      }
    };
    child.stdout?.on("data", handleChunk);
    child.stderr?.on("data", handleChunk);

    child.on("exit", (code, signal) => {
      if (job.status === "cancelled") return; // cancellation already handled
      job.exitCode = code;
      const ok = code === 0;
      job.status = ok ? "completed" : "failed";
      finalize(job);
      const reason = signal ? `signal ${signal}` : `exit ${code ?? "?"}`;
      wake(
        `[background job "${label}" #${job.id} finished] ${reason}\n\n--- combined stdout/stderr (tail) ---\n${truncate(tailLines(job.buffer))}`,
      );
    });
    child.on("error", (err) => {
      if (job.status === "cancelled") return;
      job.status = "failed";
      finalize(job);
      wake(`[background job "${label}" #${job.id} failed to spawn] ${err.message}`);
    });

    jobs.set(job.id, job);
    snapshot();
    updateStatus(ctx.ui);

    const patternNote = wakeOnPattern
      ? `, or earlier the first time output matches /${wakePatternRaw}/`
      : "";
    return {
      content: [
        {
          type: "text",
          text: `Started background job #${job.id} "${label}". I'll be woken with the result when it exits${patternNote}. Use the jobs tool to list, tail, or cancel it.`,
        },
      ],
      details: { jobId: job.id, status: "running", pid: job.pid },
    };
  };

  // --- monitor tool -------------------------------------------------------

  const monitorExecute: ToolExecute = async (_id, params, _signal, _onUpdate, ctx) => {
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
    const intervalSeconds = Number(params.interval_seconds ?? DEFAULT_MONITOR_INTERVAL_S) || DEFAULT_MONITOR_INTERVAL_S;
    const timeoutSeconds = Number(params.timeout_seconds ?? DEFAULT_MONITOR_TIMEOUT_S) || DEFAULT_MONITOR_TIMEOUT_S;
    const satisfyOn = String(params.satisfy_on ?? "exit_zero");
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
    updateStatus(ctx.ui);

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

    const tick = async (): Promise<void> => {
      if (job.status !== "running") return;
      let result: ExecResult;
      try {
        result = await pi.exec!(command, [], { timeout: Math.max(5, intervalSeconds) * 1000 });
      } catch (err) {
        result = { stderr: (err as Error).message, code: null };
      }
      if (job.status !== "running") return; // cancelled mid-flight
      const out = `${result.stdout ?? ""}${result.stderr ?? ""}`;
      appendBuffer(job, out);
      if (evaluate(result.stdout ?? "", result.code)) {
        clearInterval(job.timer);
        job.timer = undefined;
        job.exitCode = result.code ?? undefined;
        job.status = "satisfied";
        finalize(job);
        wake(
          `[monitor "${label}" #${job.id} satisfied (${satisfyOn})]\nexit ${result.code ?? "?"}\n\n--- last poll output (tail) ---\n${truncate(tailLines(job.buffer))}`,
        );
        return;
      }
      if (Date.now() >= (job.deadline ?? 0)) {
        clearInterval(job.timer);
        job.timer = undefined;
        job.exitCode = result.code ?? undefined;
        job.status = "timeout";
        finalize(job);
        wake(
          `[monitor "${label}" #${job.id} timed out after ${timeoutSeconds}s without satisfying ${satisfyOn}]\n\n--- last poll output (tail) ---\n${truncate(tailLines(job.buffer))}`,
        );
      }
    };

    // First tick immediately so short conditions resolve fast, then on interval.
    void tick();
    job.timer = setInterval(() => void tick(), intervalSeconds * 1000);

    return {
      content: [
        {
          type: "text",
          text: `Started monitor #${job.id} "${label}" — polling every ${intervalSeconds}s (timeout ${timeoutSeconds}s) until ${satisfyOn}${patternRaw ? ` matching /${patternRaw}/` : ""}. I'll be woken with the result when it's satisfied or times out.`,
        },
      ],
      details: { jobId: job.id, status: "running", satisfyOn, intervalSeconds, timeoutSeconds },
    };
  };

  // --- jobs tool ----------------------------------------------------------

  const jobsExecute: ToolExecute = async (_id, params, _signal, _onUpdate, ctx) => {
    const action = String(params.action ?? "list");
    const list = Array.from(jobs.values()).sort((a, b) => a.id - b.id);

    if (action === "list") {
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
      const was = job.status;
      cancelJob(job);
      updateStatus(ctx.ui);
      return {
        content: [{ type: "text", text: `Cancelled #${job.id} "${job.label}" (was ${was}).` }],
        details: { jobId: job.id, status: "cancelled" },
      };
    }

    return { content: [{ type: "text", text: `Unknown action "${action}". Use list, status, tail, or cancel.` }], isError: true };
  };

  // --- register -----------------------------------------------------------

  pi.registerTool?.({
    name: "background",
    label: "Background",
    description:
      "Run a long-running shell command in the background and return immediately with a job id. The agent is automatically woken (new turn) with the exit code and an output tail when the command exits; if wake_on_pattern is set, it also wakes the first time output matches that regexp. Use this instead of the bash tool for anything long-running (test suites, builds, deploys, CI runs) so the turn doesn't block.",
    promptSnippet: "Run a long command in the background; get woken on completion",
    promptGuidelines: [
      "Use background for any command that may take more than a few seconds (test suites, builds, deploys, watch/serve, CI) instead of the bash tool, which blocks the turn.",
      "Prefer the monitor tool over background when you need to wait for a CONDITION (e.g. CI going green, a file appearing, a log line) rather than a single command's exit.",
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
      "Poll a shell command on an interval until a condition is satisfied (or a timeout fires), then wake the agent with the result. satisfy_on picks the condition: exit_zero, exit_nonzero, stdout_matches (pattern), or stdout_not_matches (pattern). Use this to wait on a state rather than a single run — e.g. watch CI until green (gh run list + stdout_matches on success), wait for a file/port, or wait for a log line. Returns immediately with a monitor id; the agent is woken on satisfy or timeout.",
    promptSnippet: "Poll a command until a condition holds (CI green, file appears, log line)",
    promptGuidelines: [
      "Use monitor (not background) when you are waiting for a STATE/condition to become true by re-checking a command, not for a single long command's exit.",
      "Set a sensible timeout_seconds so a never-satisfied condition wakes you with a timeout rather than polling forever.",
    ],
    parameters: obj({
      command: str("Shell command polled on each tick under /bin/sh."),
      satisfy_on: strEnum(["exit_zero", "exit_nonzero", "stdout_matches", "stdout_not_matches"], "Condition that satisfies the monitor. stdout_matches/stdout_not_matches require pattern."),
      pattern: str("Regexp used by stdout_matches / stdout_not_matches."),
      interval_seconds: num(`Poll interval in seconds. Default ${DEFAULT_MONITOR_INTERVAL_S}.`),
      timeout_seconds: num(`Give up after this many seconds. Default ${DEFAULT_MONITOR_TIMEOUT_S}.`),
      label: str("Short human label. Defaults to a slug of the command."),
    }, ["command", "satisfy_on"]),
    execute: monitorExecute,
  });

  pi.registerTool?.({
    name: "jobs",
    label: "Jobs",
    description:
      "Manage the background-task / monitor registry. action=list shows every job with status, kind, label, and runtime; status/tail/cancel operate on one jobId. Use this to check on background or monitor jobs, read their recent output, or cancel one.",
    promptSnippet: "List, tail, status, or cancel background jobs and monitors",
    promptGuidelines: [
      "Use jobs with action=list to check on background/monitor jobs before assuming completion, and action=cancel to stop a job you no longer need (a cancelled job does not wake you).",
    ],
    parameters: obj({
      action: strEnum(["list", "status", "tail", "cancel"], "What to do."),
      jobId: num("Required for status, tail, and cancel."),
      lines: num("Number of trailing lines for tail. Default 40."),
    }, ["action"]),
    execute: jobsExecute,
  });

  // Clean up every spawned child / timer on shutdown so we never leak processes.
  pi.on?.("session_shutdown", async () => {
    for (const job of jobs.values()) {
      if (job.status === "running") cancelJob(job);
    }
  });
}
