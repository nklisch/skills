import { afterEach, describe, expect, test } from "bun:test";
import backgroundTasksExtension from "./background-tasks";

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
    exec: async (command: string): Promise<ExecResult> => {
      // Minimal real exec for the tests via the shell.
      const { execFileSync } = require("node:child_process") as typeof import("node:child_process");
      try {
        const out = execFileSync("/bin/sh", ["-c", command], { encoding: "utf8" });
        return { stdout: out, code: 0 };
      } catch (err) {
        const e = err as { stdout?: string; status?: number };
        return { stdout: e.stdout ?? "", code: e.status ?? 1 };
      }
    },
    on: (event: string, handler: () => Promise<void> | void) => {
      if (event === "session_shutdown") shutdownHandlers.push(handler);
    },
  };

  backgroundTasksExtension(pi);
  return { pi, tools, wakes, entries, shutdownHandlers };
}

async function waitFor<T>(fn: () => T | undefined, { timeoutMs = 8000, intervalMs = 25 } = {}): Promise<T> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const v = fn();
    if (v !== undefined && v !== null) return v;
    if (Date.now() > deadline) throw new Error(`waitFor timed out after ${timeoutMs}ms`);
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}

afterEach(() => {
  // give any stray timers/processes a tick to clear
});

describe("background tool", () => {
  test("starts a job, returns immediately with an id, and wakes on exit with code + tail", async () => {
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
    expect(wake.content).toContain("exit 0");
    expect(wake.content).toContain("hello-from-job");
    expect(wake.options?.deliverAs).toBe("followUp");
  });

  test("reports a non-zero exit as failed", async () => {
    const { tools, wakes } = makeFakePi();
    const bg = tools.get("background")!;

    await bg.execute("c1", { command: "sh -c 'echo oops >&2; exit 3'" }, undefined, undefined, makeContext());

    const wake = await waitFor(() => wakes[0]);
    expect(wake.content).toContain("exit 3");
    expect(wake.content).toContain("oops");
  });

  test("wake_on_pattern fires an early wake before exit", async () => {
    const { tools, wakes } = makeFakePi();
    const bg = tools.get("background")!;

    await bg.execute(
      "c1",
      { command: "sh -c 'echo starting; sleep 0.2; echo DONE'", wake_on_pattern: "DONE" },
      undefined,
      undefined,
      makeContext(),
    );

    // First wake should be the pattern match (before exit), second the exit.
    const first = await waitFor(() => wakes[0]);
    expect(first.content).toContain("pattern matched");
    expect(first.content).toContain("still running");

    const second = await waitFor(() => wakes[1]);
    expect(second.content).toContain("finished");
    expect(second.content).toContain("DONE");
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
});

describe("monitor tool", () => {
  test("wakes on satisfy_on stdout_matches", async () => {
    const { tools, wakes } = makeFakePi();
    const mon = tools.get("monitor")!;

    const res = (await mon.execute(
      "c1",
      { command: "echo status=READY", satisfy_on: "stdout_matches", pattern: "READY", interval_seconds: 0.05, timeout_seconds: 5 },
      undefined,
      undefined,
      makeContext(),
    )) as { details: { status: string; satisfyOn: string } };

    expect(res.details.status).toBe("running");
    const wake = await waitFor(() => wakes[0]);
    expect(wake.content).toContain("satisfied");
    expect(wake.content).toContain("stdout_matches");
    expect(wake.content).toContain("status=READY");
    expect(wake.options?.deliverAs).toBe("followUp");
  });

  test("times out when the condition never holds", async () => {
    const { tools, wakes } = makeFakePi();
    const mon = tools.get("monitor")!;

    await mon.execute(
      "c1",
      { command: "echo nope", satisfy_on: "stdout_matches", pattern: "NEVER", interval_seconds: 0.05, timeout_seconds: 1 },
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
});

describe("jobs tool", () => {
  test("lists jobs and cancels a running one without waking", async () => {
    const { tools, wakes } = makeFakePi();
    const bg = tools.get("background")!;
    const jobs = tools.get("jobs")!;

    const ctx = makeContext();
    const started = (await bg.execute("c1", { command: "sleep 30", label: "long-sleep" }, undefined, undefined, ctx)) as {
      details: { jobId: number };
    };
    const id = started.details.jobId;

    const listRes = (await jobs.execute("c2", { action: "list" }, undefined, undefined, ctx)) as {
      content: Array<{ text: string }>;
    };
    expect(listRes.content[0].text).toContain(`#${id}`);
    expect(listRes.content[0].text).toContain("long-sleep");
    expect(listRes.content[0].text).toContain("running");

    const cancelRes = (await jobs.execute("c3", { action: "cancel", jobId: id }, undefined, undefined, ctx)) as {
      content: Array<{ text: string }>;
    };
    expect(cancelRes.content[0].text).toContain("Cancelled");

    // Give the process a moment to die, then list again.
    await new Promise((r) => setTimeout(r, 100));
    const after = (await jobs.execute("c4", { action: "list" }, undefined, undefined, ctx)) as {
      content: Array<{ text: string }>;
    };
    expect(after.content[0].text).toContain("cancelled");
    // A cancelled job must not produce a completion wake.
    expect(wakes.length).toBe(0);
  });

  test("list on an empty registry says so", async () => {
    const { tools } = makeFakePi();
    const jobs = tools.get("jobs")!;
    const res = (await jobs.execute("c1", { action: "list" }, undefined, undefined, makeContext())) as {
      content: Array<{ text: string }>;
    };
    expect(res.content[0].text).toContain("No background jobs");
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
    expect(after.content[0].text).toContain("cancelled");
  });
});
