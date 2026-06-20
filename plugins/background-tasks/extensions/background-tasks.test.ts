import { afterEach, describe, expect, test } from "bun:test";
import backgroundTasksExtension, { MAX_RETAINED_JOBS, clipToWidth, JobPanel } from "./background-tasks";

// A minimal Job-shaped stub for JobPanel tests (only the fields render reads).
type JobStub = {
  id: number;
  kind: "background" | "monitor";
  label: string;
  command: string;
  status: string;
  startedAt: number;
  endedAt?: number;
  exitCode?: number | null;
  buffer: string;
};

function makePanel(jobs: JobStub[]): { panel: InstanceType<typeof JobPanel>; lines: () => number } {
  let snapshot = [...jobs];
  // Pass a fresh closure so the panel sees live mutations.
  const getJobs = () => [...snapshot] as unknown as Parameters<typeof JobPanel>[0];
  // @ts-expect-error: JobPanel constructor is typed for the real Job; stubs are shape-compatible at runtime.
  const panel = new JobPanel(getJobs, { fg: (_n: string, t: string) => t }, () => {});
  return { panel, lines: () => snapshot.length };
}

type ExecResult = { stdout?: string; stderr?: string; code?: number | null; killed?: boolean };

type RegisteredTool = {
  name: string;
  parameters: unknown;
  execute: (
    toolCallId: string,
    params: Record<string, unknown>,
    signal: AbortSignal | undefined,
    onUpdate: ((u: unknown) => void) | undefined,
    ctx: TestContext,
  ) => Promise<unknown>;
};

type TestContext = {
  cwd?: string;
  ui?: {
    notifications: Array<{ message: string; level?: string }>;
    statuses: Array<{ key: string; message: string | undefined }>;
    notify: (message: string, level?: string) => void;
    setStatus: (key: string, message: string | undefined) => void;
  };
  mode?: "tui" | "rpc" | "json" | "print";
};

type Wake = { content: string; options?: { deliverAs?: string } };

function makeContext(): TestContext {
  const ctx: TestContext = {
    cwd: process.cwd(),
    ui: {
      notifications: [],
      statuses: [],
      notify: (message, level) => ctx.ui!.notifications.push({ message, level }),
      setStatus: (key, message) => ctx.ui!.statuses.push({ key, message }),
    },
  };
  return ctx;
}

function makeFakePi() {
  const tools = new Map<string, RegisteredTool>();
  const wakes: Wake[] = [];
  const entries: Array<{ type: string; data: unknown }> = [];
  const shutdownHandlers: Array<() => Promise<void> | void> = [];
  const handlers: Record<string, Array<(event: unknown) => unknown>> = {};

  const pi = {
    registerTool: (def: RegisteredTool) => {
      tools.set(def.name, def);
    },
    sendUserMessage: (content: string, options?: { deliverAs?: string }) => {
      wakes.push({ content, options });
    },
    appendEntry: (type: string, data: unknown) => {
      entries.push({ type, data });
    },
    exec: async (command: string, args: string[] = [], options?: { cwd?: string; timeout?: number; signal?: AbortSignal }): Promise<ExecResult> => {
      // Mirror the REAL pi.exec runtime: spawn(command, args, { shell: false }).
      // The previous fake ignored args and always ran `/bin/sh -c <command>`,
      // which masked the bug where the extension passed shell syntax as the
      // program name. Honoring command+args means a test only passes when the
      // extension routes through /bin/sh -c itself.
      const { execFileSync } = require("node:child_process") as typeof import("node:child_process");
      try {
        const out = execFileSync(command, args, { encoding: "utf8", cwd: options?.cwd, timeout: options?.timeout });
        return { stdout: out, code: 0 };
      } catch (err) {
        const e = err as { stdout?: string; status?: number };
        return { stdout: e.stdout ?? "", code: e.status ?? 1 };
      }
    },
    on: (event: string, handler: (event: unknown) => unknown) => {
      // Record all handlers so before_agent_start (not just session_shutdown)
      // can be driven in tests.
      (handlers[event] ??= []).push(handler);
      if (event === "session_shutdown") shutdownHandlers.push(handler as () => Promise<void> | void);
    },
  };

  backgroundTasksExtension(pi);
  return { pi, tools, wakes, entries, shutdownHandlers, handlers };
}

async function waitFor<T>(
  fn: () => T | undefined | Promise<T | undefined>,
  { timeoutMs = 8000, intervalMs = 25 } = {},
): Promise<T> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const v = await fn();
    if (v !== undefined && v !== null) return v;
    if (Date.now() > deadline) throw new Error(`waitFor timed out after ${timeoutMs}ms`);
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}

// Read the job registry's terminal status for a given id via the jobs tool.
async function jobStatus(tools: Map<string, RegisteredTool>, ctx: TestContext, id: number): Promise<string> {
  const res = (await tools.get("jobs")!.execute("c", { action: "status", jobId: id }, undefined, undefined, ctx)) as {
    content: Array<{ text: string }>;
  };
  const m = res.content[0].text.match(/\[([a-z_]+)\b/);
  return m ? m[1] : "";
}

afterEach(async () => {
  // Give any stray timers/processes a brief tick to clear between tests.
  await new Promise((r) => setTimeout(r, 30));
});

describe("background tool", () => {
  test("starts a job, returns immediately with an id, and wakes on exit with a trusted (output-free) message", async () => {
    const { tools, wakes } = makeFakePi();
    const bg = tools.get("background")!;

    const res = (await bg.execute("c1", { command: "echo hello-from-job" }, undefined, undefined, makeContext())) as {
      content: Array<{ text: string }>;
      details: { jobId: number; status: string };
    };

    expect(res.details.status).toBe("running");
    expect(typeof res.details.jobId).toBe("number");
    expect(res.content[0].text).toContain("Started background job");

    const wake = await waitFor(() => wakes[0]);
    expect(wake.content).toContain("finished");
    expect(wake.options?.deliverAs).toBe("followUp");
    // H1: the command's own output must NOT appear in the wake message.
    expect(wake.content).not.toContain("hello-from-job");
    // H1: the wake must point the agent at the jobs tool to read output.
    expect(wake.content).toContain("jobs tool");
  });

  test("reports a non-zero exit as failed and still keeps output out of the wake", async () => {
    const { tools, wakes } = makeFakePi();
    const bg = tools.get("background")!;

    await bg.execute("c1", { command: "sh -c 'echo oops >&2; exit 3'" }, undefined, undefined, makeContext());

    const wake = await waitFor(() => wakes[0]);
    expect(wake.content).toContain("exit 3");
    expect(wake.content).not.toContain("oops"); // H1: stderr stays out of the wake
  });

  test("wake_on_pattern fires an early, output-free wake before exit", async () => {
    const { tools, wakes } = makeFakePi();
    const bg = tools.get("background")!;

    await bg.execute(
      "c1",
      { command: "sh -c 'echo starting; sleep 0.2; echo DONE_SECRET'", wake_on_pattern: "DONE" },
      undefined,
      undefined,
      makeContext(),
    );

    const first = await waitFor(() => wakes[0]);
    expect(first.content).toContain("matched its wake_on_pattern");
    expect(first.content).toContain("still running");
    expect(first.content).not.toContain("DONE_SECRET"); // H1: matched output not in wake

    const second = await waitFor(() => wakes[1]);
    expect(second.content).toContain("finished");
  });

  test("rejects an invalid wake_on_pattern regexp", async () => {
    const { tools, wakes } = makeFakePi();
    const bg = tools.get("background")!;

    const res = (await bg.execute("c1", { command: "echo x", wake_on_pattern: "(" }, undefined, undefined, makeContext())) as {
      isError?: boolean;
      content: Array<{ text: string }>;
    };
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain("Invalid wake_on_pattern");
    expect(wakes.length).toBe(0);
  });

  test("notify fires on terminal state (M3/L1 fallback wiring)", async () => {
    const { tools } = makeFakePi();
    const bg = tools.get("background")!;
    const ctx = makeContext();
    await bg.execute("c1", { command: "echo done" }, undefined, undefined, ctx);
    const n = await waitFor(() => ctx.ui!.notifications.find((x) => x.message.includes("finished")));
    expect(n).toBeTruthy();
    expect(n!.level).toBe("success");
  });
});

describe("monitor tool", () => {
  test("wakes on satisfy_on stdout_matches and keeps output out of the wake", async () => {
    const { tools, wakes } = makeFakePi();
    const mon = tools.get("monitor")!;

    const res = (await mon.execute(
      "c1",
      { command: "echo status=READY", satisfy_on: "stdout_matches", pattern: "READY", interval_seconds: 1, timeout_seconds: 5 },
      undefined,
      undefined,
      makeContext(),
    )) as { details: { status: string; satisfyOn: string } };

    expect(res.details.status).toBe("running");
    const wake = await waitFor(() => wakes[0]);
    expect(wake.content).toContain("satisfied");
    expect(wake.content).toContain("stdout_matches");
    expect(wake.content).not.toContain("status=READY"); // H1: poll output not in wake
    expect(wake.options?.deliverAs).toBe("followUp");
  });

  test("REGRESSION: stdout_matches against shell-only syntax (echo X; echo Y) — requires the /bin/sh -c route", async () => {
    // A bare binary literally named `echo first; echo SECOND_TOKEN` does not
    // exist, so without shell routing spawn() ENOENTs, stdout stays empty, and
    // the monitor times out. This was the live-session #8 failure: pi.exec uses
    // shell:false but the extension passed shell syntax as the program name.
    const { tools, wakes } = makeFakePi();
    const mon = tools.get("monitor")!;
    await mon.execute(
      "c1",
      { command: "echo first; echo SECOND_TOKEN", satisfy_on: "stdout_matches", pattern: "SECOND_TOKEN", interval_seconds: 1, timeout_seconds: 4 },
      undefined,
      undefined,
      makeContext(),
    );
    const wake = await waitFor(() => wakes[0], { timeoutMs: 8000 });
    expect(wake.content).toContain("satisfied");
  });

  test("REGRESSION: compound `test -f <file>` satisfies stdout_matches — monitor sees the real filesystem via shell", async () => {
    // The live-session #2 symptom was diagnosed as FS isolation; the real cause
    // was the same missing shell route — `test -f X && ...` ENOENTs as a program
    // name. Create a file via the host shell, then confirm a monitor polling a
    // compound shell predicate sees it.
    const tmp = `/tmp/peer-monitor-reg-${process.pid}-${Date.now()}`;
    const { execSync } = require("node:child_process") as typeof import("node:child_process");
    execSync(`touch ${tmp}`);
    try {
      const { tools, wakes } = makeFakePi();
      const mon = tools.get("monitor")!;
      await mon.execute(
        "c1",
        { command: `test -f ${tmp} && echo present`, satisfy_on: "stdout_matches", pattern: "present", interval_seconds: 1, timeout_seconds: 4 },
        undefined,
        undefined,
        makeContext(),
      );
      const wake = await waitFor(() => wakes[0], { timeoutMs: 8000 });
      expect(wake.content).toContain("satisfied");
    } finally {
      require("node:fs").unlinkSync(tmp);
    }
  });

  test("times out when the condition never holds", async () => {
    const { tools, wakes } = makeFakePi();
    const mon = tools.get("monitor")!;

    await mon.execute(
      "c1",
      { command: "echo nope", satisfy_on: "stdout_matches", pattern: "NEVER", interval_seconds: 1, timeout_seconds: 2 },
      undefined,
      undefined,
      makeContext(),
    );

    const wake = await waitFor(() => wakes[0], { timeoutMs: 6000 });
    expect(wake.content).toContain("timed out");
  });

  test("requires pattern when satisfy_on needs it", async () => {
    const { tools, wakes } = makeFakePi();
    const mon = tools.get("monitor")!;

    const res = (await mon.execute(
      "c1",
      { command: "echo x", satisfy_on: "stdout_matches", interval_seconds: 0.05, timeout_seconds: 1 },
      undefined,
      undefined,
      makeContext(),
    )) as { isError?: boolean; content: Array<{ text: string }> };
    expect(res.isError).toBe(true);
    expect(wakes.length).toBe(0);
  });

  test("floors a sub-second interval to the default (no command flooding)", async () => {
    const { tools } = makeFakePi();
    const mon = tools.get("monitor")!;
    const res = (await mon.execute(
      "c1",
      { command: "echo x", satisfy_on: "exit_zero", interval_seconds: 0.001, timeout_seconds: 1 },
      undefined,
      undefined,
      makeContext(),
    )) as { details: { intervalSeconds: number } };
    expect(res.details.intervalSeconds).toBeGreaterThanOrEqual(1);
  });
});

describe("jobs tool", () => {
  test("cancels a running job and reports it as cancelled (polled, not fixed sleep)", async () => {
    const { tools, wakes } = makeFakePi();
    const bg = tools.get("background")!;
    const jobs = tools.get("jobs")!;
    const ctx = makeContext();
    const started = (await bg.execute("c1", { command: "sleep 30", label: "long-sleep" }, undefined, undefined, ctx)) as {
      details: { jobId: number };
    };
    const id = started.details.jobId;

    const cancelRes = (await jobs.execute("c3", { action: "cancel", jobId: id }, undefined, undefined, ctx)) as {
      content: Array<{ text: string }>;
      details: { status: string };
    };
    // A plain `sleep 30` always reaps on SIGTERM, so the honest outcome is
    // exactly "cancelled" — assert it specifically (round-3 catch: accepting
    // kill_failed here would let a broken waitForExit pass this test).
    expect(cancelRes.details.status).toBe("cancelled");
    expect(cancelRes.content[0].text).toContain("long-sleep");

    // CodeRabbit: poll for the cancelled status rather than assuming a fixed delay.
    const status = await waitFor(() =>
      jobStatus(tools, ctx, id).then((st) => (st === "cancelled" ? st : undefined)),
    );
    expect(status).toBe("cancelled");
    // A cancelled job must not produce a completion wake.
    expect(wakes.length).toBe(0);
  });

  test("refuses to cancel an already-terminal job (CodeRabbit guard)", async () => {
    const { tools } = makeFakePi();
    const bg = tools.get("background")!;
    const jobs = tools.get("jobs")!;
    const ctx = makeContext();
    const started = (await bg.execute("c1", { command: "echo done" }, undefined, undefined, ctx)) as {
      details: { jobId: number };
    };
    await waitFor(() => jobStatus(tools, ctx, started.details.jobId).then((s) => (s === "completed" ? s : undefined)));

    const res = (await jobs.execute("c2", { action: "cancel", jobId: started.details.jobId }, undefined, undefined, ctx)) as {
      content: Array<{ text: string }>;
      isError?: boolean;
    };
    expect(res.isError).not.toBe(true); // not an error, an informational refusal
    expect(res.content[0].text).toContain("already completed");
  });

  test("list on an empty registry says so", async () => {
    const { tools } = makeFakePi();
    const jobs = tools.get("jobs")!;
    const res = (await jobs.execute("c1", { action: "list" }, undefined, undefined, makeContext())) as {
      content: Array<{ text: string }>;
    };
    expect(res.content[0].text).toContain("No background jobs");
  });

  test("view refuses outside TUI mode (no false 'Opened')", async () => {
    const { tools } = makeFakePi();
    const jobs = tools.get("jobs")!;
    // Non-tui mode (rpc/json/print): ctx.ui.custom may exist but no-op, so the
    // gate must be ctx.mode === "tui", not just custom presence.
    const rpcCtx: TestContext = { ...makeContext(), mode: "rpc" };
    const rpcRes = (await jobs.execute("c1", { action: "view" }, undefined, undefined, rpcCtx)) as {
      isError?: boolean;
      content: Array<{ text: string }>;
    };
    expect(rpcRes.isError).toBe(true);
    expect(rpcRes.content[0].text).toContain("TUI");
    // And a plain ctx with no mode also refuses.
    const noModeRes = (await jobs.execute("c2", { action: "view" }, undefined, undefined, makeContext())) as {
      isError?: boolean;
    };
    expect(noModeRes.isError).toBe(true);
  });
});

describe("lifecycle", () => {
  test("session_shutdown cancels running jobs", async () => {
    const { tools, shutdownHandlers } = makeFakePi();
    const bg = tools.get("background")!;
    const jobs = tools.get("jobs")!;
    const ctx = makeContext();
    const started = (await bg.execute("c1", { command: "sleep 30" }, undefined, undefined, ctx)) as {
      details: { jobId: number };
    };

    for (const h of shutdownHandlers) await h();

    const after = (await jobs.execute("c2", { action: "status", jobId: started.details.jobId }, undefined, undefined, ctx)) as {
      content: Array<{ text: string }>;
    };
    // shuttingDown suppresses wakes; status must be in the cancelled family
    // (cancelling immediately, cancelled/kill_failed once SIGKILL resolves).
    const st = after.content[0].text.match(/\[[a-z_]+/)?.[0] ?? "";
    expect(["[cancelling", "[cancelled", "[kill_failed"]).toContain(st);
  });
});

describe("session-start system-prompt nudge (before_agent_start)", () => {
  const BASE = "You are pi. Follow AGENTS.md.";

  async function runNudge(base: string): Promise<string> {
    const { handlers } = makeFakePi();
    const hs = handlers["before_agent_start"];
    if (!hs || hs.length === 0) throw new Error("no before_agent_start handler registered");
    const out = await hs[0]({ type: "before_agent_start", systemPrompt: base });
    return (out as { systemPrompt?: string })?.systemPrompt ?? base;
  }

  test("appends the explainer to the base prompt (does NOT wipe it)", async () => {
    // Returning { systemPrompt } wholesale-replaces; the handler MUST preserve
    // event.systemPrompt. Losing the base prompt would brick the session.
    const result = await runNudge(BASE);
    expect(result.startsWith(BASE)).toBe(true);
    expect(result).toContain("Long-Running & Concurrent Work");
    // The corrected contract: after launching, keep working in parallel OR end the
    // turn — NOT "end the turn" as the primary instruction.
    expect(result).toContain("keep working on something else");
    expect(result).toContain("Do NOT hand-roll sleep/poll loops");
    expect(result.length).toBeGreaterThan(BASE.length);
  });

  test("is idempotent: a prompt already containing the nudge is returned unchanged", async () => {
    // Guards against double-application (e.g. chained handlers re-adding).
    const already = `${BASE}\n\n## Long-Running & Concurrent Work\n\nold copy`;
    const result = await runNudge(already);
    expect(result).toBe(already);
  });

  test("is idempotent across chaining: feeding the handler's own output back in does not duplicate the nudge", async () => {
    // The pi runner threads currentSystemPrompt through chained before_agent_start
    // handlers. If two extensions (or a double-registration) both append, the
    // second must see the first's header and bail. Simulate that chain here.
    const { handlers } = makeFakePi();
    const hs = handlers["before_agent_start"];
    expect(hs?.length).toBe(1);
    const first = (await hs![0]({ type: "before_agent_start", systemPrompt: BASE })) as { systemPrompt?: string };
    expect(first?.systemPrompt).toContain("Long-Running & Concurrent Work");
    // Feed first's output back as the next handler's input — header present -> no-op.
    const second = (await hs![0]({ type: "before_agent_start", systemPrompt: first!.systemPrompt! })) as
      | { systemPrompt?: string }
      | undefined;
    expect(second?.systemPrompt).toBeUndefined();
    // And the prompt was not duplicated.
    const nudgeCount = (first!.systemPrompt!.match(/Long-Running & Concurrent Work/g) ?? []).length;
    expect(nudgeCount).toBe(1);
  });
});

describe("memory & truncation", () => {
  test("truncate is a hard cap (marker accounted for)", async () => {
    const { tools } = makeFakePi();
    const bg = tools.get("background")!;
    // Produce 50k of output, then read it back via tail and confirm it's bounded.
    await bg.execute("c1", { command: "yes LINE | head -5000" }, undefined, undefined, makeContext());
    const jobs = tools.get("jobs")!;
    await waitFor(async () => {
      const s = await jobStatus(tools, makeContext(), 1);
      return s === "completed" ? s : undefined;
    });
    const res = (await jobs.execute("c2", { action: "tail", jobId: 1, lines: 100000 }, undefined, undefined, makeContext())) as {
      content: Array<{ text: string }>;
    };
    expect(res.content[0].text.length).toBeLessThanOrEqual(6000);
  });

  test("terminal jobs are pruned beyond the retention cap (oldest removed)", async () => {
    // EXCEED the cap (>50), then assert the oldest terminal jobs were pruned
    // and the registry no longer holds them — a test that created only <=50
    // would pass even with pruning disabled (round-2 review catch).
    const { tools } = makeFakePi();
    const bg = tools.get("background")!;
    const created: number[] = [];
    for (let i = 0; i < MAX_RETAINED_JOBS + 10; i++) {
      const r = (await bg.execute(`c${i}`, { command: `echo job${i}`, label: `j${i}` }, undefined, undefined, makeContext())) as {
        details: { jobId: number };
      };
      created.push(r.details.jobId);
    }
    // Wait for all to finish.
    await new Promise((r) => setTimeout(r, 400));
    const jobs = tools.get("jobs")!;
    const list = (await jobs.execute("c", { action: "list" }, undefined, undefined, makeContext())) as {
      content: Array<{ text: string }>;
    };
    const surviving = list.content[0].text.split("\n").filter((l) => l.startsWith("#"));
    expect(surviving.length).toBeLessThanOrEqual(MAX_RETAINED_JOBS);
    // Oldest jobs (lowest ids, earliest endedAt) should have been pruned.
    const survivingIds = surviving.map((l) => Number(l.match(/^#(\d+)/)?.[1] ?? 0));
    expect(survivingIds.length).toBeLessThan(created.length);
    expect(Math.min(...survivingIds)).toBeGreaterThan(created[0]);
  });
});

describe("clipToWidth (ANSI-aware line clip)", () => {
  test("width <= 0 yields empty", () => {
    expect(clipToWidth("hello", 0)).toBe("");
    expect(clipToWidth("hello", -3)).toBe("");
  });
  test("plain text clips to the visible width", () => {
    expect(clipToWidth("hello world", 5)).toBe("hello");
    expect(clipToWidth("abc", 10)).toBe("abc");
  });
  test("ANSI escapes do not count toward width and pass through", () => {
    // \x1b[31m (red) + 3 visible chars + \x1b[39m (default). Width 3 -> all visible kept.
    const s = "\x1b[31mabc\x1b[39m";
    expect(clipToWidth(s, 3).replace(/\x1b\[[0-9;]*m/g, "")).toBe("abc");
    // Width 1 -> only one visible char, escapes preserved.
    const clipped = clipToWidth("\x1b[31mabc\x1b[39m", 1);
    expect(clipped.replace(/\x1b\[[0-9;]*m/g, "")).toBe("a");
  });
  test("a clip landing mid-escape strips the dangling sequence", () => {
    // Visible 'ab' then a partial escape start; result must not contain a bare \x1b[.
    const s = "ab\x1b[3";
    const out = clipToWidth(s, 5);
    expect(out).not.toMatch(/\x1b\[[0-9;]*$/);
  });
  test("no line exceeds the requested width (fuzz)", () => {
    const samples = ["plain", "\x1b[31mred\x1b[39mtext", "x".repeat(200), "\x1b[1m\x1b[31mmulti\x1b[39m\x1b[22m"];
    for (const s of samples) {
      for (const w of [1, 3, 10, 50]) {
        const visible = clipToWidth(s, w).replace(/\x1b\[[0-9;]*m/g, "");
        expect([...visible].length).toBeLessThanOrEqual(w);
      }
    }
  });
});

describe("JobPanel (overlay component)", () => {
  function job(i: number, label = `j${i}`, buffer = ""): JobStub {
    return { id: i, kind: "background", label, command: `echo ${i}`, status: "completed", startedAt: Date.now() - 1000, endedAt: Date.now(), exitCode: 0, buffer };
  }

  test("render lists every job and never exceeds width per line", () => {
    const { panel } = makePanel([job(1, "alpha"), job(2, "beta-with-a-long-label")]);
    const w = 60; // wide enough that ids + short labels survive clipping
    const lines = (panel as unknown as { render: (w: number) => string[] }).render(w);
    // Each job appears by its id marker (#1 / #2), which is never clipped away
    // before the label at realistic widths.
    expect(lines.some((l) => l.includes("#1"))).toBe(true);
    expect(lines.some((l) => l.includes("#2"))).toBe(true);
    for (const line of lines) {
      // strip any styling then check visible width — the hard guarantee.
      const visible = line.replace(/\x1b\[[0-9;]*m/g, "");
      expect([...visible].length).toBeLessThanOrEqual(w);
    }
  });

  test("j/k moves selection, enter pages output, q closes", () => {
    const closed: boolean[] = [];
    const snapshot = [job(1, "a", "OUT1"), job(2, "b", "OUT2")];
    const panel = new JobPanel(
      (() => [...snapshot]) as unknown as () => Parameters<typeof JobPanel>[0][],
      { fg: (_n: string, t: string) => t },
      () => closed.push(true),
    ) as unknown as { handleInput: (d: string) => void; render: (w: number) => string[]; selected: number };
    // j moves down to #2
    panel.handleInput("j");
    expect(panel.selected).toBe(1);
    // enter pages job #2's output
    panel.handleInput("\r");
    const lines = panel.render(40);
    expect(lines.some((l) => l.includes("OUT2"))).toBe(true);
    // back to list, then k moves up
    panel.handleInput("q"); // exits paging
    panel.handleInput("k");
    expect(panel.selected).toBe(0);
    // q on the list closes the panel
    panel.handleInput("q");
    expect(closed).toContain(true);
  });

  test("selection clamps when the job list shrinks", () => {
    let snapshot = [job(1, "a"), job(2, "b"), job(3, "c")];
    const panel = new JobPanel(
      (() => [...snapshot]) as unknown as () => Parameters<typeof JobPanel>[0][],
      { fg: (_n: string, t: string) => t },
      () => {},
    ) as unknown as { handleInput: (d: string) => void; render: (w: number) => string[]; selected: number };
    // move to the last item, then shrink the list to 1 entry.
    panel.handleInput("j");
    panel.handleInput("j");
    expect(panel.selected).toBe(2);
    snapshot = [job(1, "a")];
    // a render clamps selection back into range (no crash, marker present).
    panel.render(40);
    expect(panel.selected).toBeLessThanOrEqual(0);
  });
});
