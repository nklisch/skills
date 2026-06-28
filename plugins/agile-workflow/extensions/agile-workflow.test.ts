import { afterEach, describe, expect, test } from "bun:test";
import {
  chmodSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import agileWorkflowExtension from "./agile-workflow";

type ExecCall = {
  command: string;
  args: string[];
  options?: { signal?: AbortSignal; timeout?: number };
};

type RegisteredHandler = (args: string | undefined, ctx: TestContext) => Promise<string>;
type EventHandler = (event: unknown, ctx: TestContext) => unknown | Promise<unknown>;

type TestContext = {
  cwd?: string;
  signal?: AbortSignal;
  ui?: {
    notifications: Array<{ message: string; level?: string }>;
    statuses: Array<{ key: string; message: string }>;
    widgets: Array<{ key: string; lines: string[] }>;
    notify: (message: string, level?: "info" | "warning" | "error" | "success") => void;
    setStatus: (key: string, message: string) => void;
    setWidget: (key: string, lines: string[]) => void;
  };
};

const roots: string[] = [];

afterEach(() => {
  for (const root of roots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

function tempRoot(): string {
  const root = mkdtempSync(join(tmpdir(), "aw-extension-test-"));
  roots.push(root);
  return root;
}

function makeSubstrate(): { root: string; nested: string; workView: string } {
  const root = tempRoot();
  const workDir = join(root, ".work");
  const binDir = join(workDir, "bin");
  const nested = join(root, "one", "two");
  mkdirSync(binDir, { recursive: true });
  mkdirSync(nested, { recursive: true });
  writeFileSync(join(workDir, "CONVENTIONS.md"), "# Project Conventions\n", "utf8");
  const workView = join(binDir, "work-view");
  writeFileSync(workView, "#!/usr/bin/env sh\nexit 0\n", "utf8");
  chmodSync(workView, 0o755);
  return { root, nested, workView };
}

function makeUi(): NonNullable<TestContext["ui"]> {
  return {
    notifications: [],
    statuses: [],
    widgets: [],
    notify(message, level) {
      this.notifications.push({ message, level });
    },
    setStatus(key, message) {
      this.statuses.push({ key, message });
    },
    setWidget(key, lines) {
      this.widgets.push({ key, lines });
    },
  };
}

function makePi(options: {
  exec?: (command: string, args: string[], options?: ExecCall["options"]) => Promise<{
    stdout?: string;
    stderr?: string;
    code?: number | null;
    killed?: boolean;
  }>;
  sendUserMessage?: (content: string, options?: { deliverAs?: "followUp" | "steer" | "immediate" }) => void | Promise<void>;
} = {}) {
  const execCalls: ExecCall[] = [];
  const sentMessages: Array<{ content: string; options?: { deliverAs?: "followUp" | "steer" | "immediate" } }> = [];
  const eventHandlers: Record<string, EventHandler[]> = {};
  let handler: RegisteredHandler | null = null;
  const pi: {
    exec: (command: string, args: string[], execOptions?: ExecCall["options"]) => Promise<{
      stdout?: string;
      stderr?: string;
      code?: number | null;
      killed?: boolean;
    }>;
    sendUserMessage?: (content: string, options?: { deliverAs?: "followUp" | "steer" | "immediate" }) => void | Promise<void>;
    registerCommand: (name: string, commandOptions: { handler: RegisteredHandler }) => void;
    on: (event: string, eventHandler: EventHandler) => void;
  } = {
    exec: async (command: string, args: string[], execOptions?: ExecCall["options"]) => {
      execCalls.push({ command, args, options: execOptions });
      if (options.exec) {
        return options.exec(command, args, execOptions);
      }
      return { stdout: "story-a\n", code: 0 };
    },
    registerCommand: (name: string, commandOptions: { handler: RegisteredHandler }) => {
      expect(name).toBe("aw");
      handler = commandOptions.handler;
    },
    on: (event: string, eventHandler: EventHandler) => {
      (eventHandlers[event] ??= []).push(eventHandler);
    },
  };
  if ("sendUserMessage" in options) {
    if (options.sendUserMessage) {
      pi.sendUserMessage = options.sendUserMessage;
    }
  } else {
    pi.sendUserMessage = async (content, messageOptions) => {
      sentMessages.push({ content, options: messageOptions });
    };
  }
  agileWorkflowExtension(pi);
  if (!handler) {
    throw new Error("extension did not register /aw");
  }
  return {
    handler,
    execCalls,
    sentMessages,
    eventHandlers,
  };
}

async function fireEvent(
  handlers: Record<string, EventHandler[]>,
  eventName: string,
  event: unknown,
  ctx: TestContext,
): Promise<unknown> {
  let result: unknown;
  for (const eventHandler of handlers[eventName] ?? []) {
    const next = await eventHandler(event, ctx);
    if (next !== undefined) result = next;
  }
  return result;
}


describe("/aw command shell", () => {
  test("help does not require a substrate", async () => {
    const { handler, execCalls } = makePi();
    const result = await handler("help", { cwd: tempRoot() });
    expect(result).toContain("/aw status");
    expect(result).toContain("/aw autopilot [scope]");
    expect(execCalls).toHaveLength(0);
  });

  test("missing substrate and missing work-view return actionable warnings", async () => {
    const { handler } = makePi();
    const ui = makeUi();
    const noSubstrate = await handler("status", { cwd: tempRoot(), ui });
    expect(noSubstrate).toContain("No agile-workflow substrate found");
    expect(ui.notifications.at(-1)).toMatchObject({ level: "warning" });

    const root = tempRoot();
    mkdirSync(join(root, ".work"), { recursive: true });
    writeFileSync(join(root, ".work", "CONVENTIONS.md"), "# Project Conventions\n", "utf8");
    const missingTool = await handler("status", { cwd: root, ui });
    expect(missingTool).toContain("no .work/bin/work-view");
    expect(ui.notifications.at(-1)).toMatchObject({ level: "warning" });
  });

  test("walks upward from ctx.cwd and invokes work-view with an argument array", async () => {
    const substrate = makeSubstrate();
    const { handler, execCalls } = makePi({
      exec: async () => ({ stdout: "story-ready\n", code: 0 }),
    });
    const signal = new AbortController().signal;

    const result = await handler("ready", { cwd: substrate.nested, signal });

    expect(result).toBe("story-ready");
    expect(execCalls).toEqual([
      {
        command: substrate.workView,
        args: ["--ready"],
        options: { signal, timeout: 10_000 },
      },
    ]);
  });
});

describe("/aw queue commands", () => {
  test("status composes ready, review, and blocked calls and updates Pi UI", async () => {
    const substrate = makeSubstrate();
    const ui = makeUi();
    const { handler, execCalls } = makePi({
      exec: async (_command, args) => {
        const key = args.join(" ");
        if (key === "--ready") {
          return { stdout: "ID  KIND  STAGE  TAGS  PARENT\n--  ----  -----  ----  ------\nready-a story implementing [] -\nready-b story review [] -\n", code: 0 };
        }
        if (key === "--stage review") {
          return { stdout: "review-a\n", code: 0 };
        }
        if (key === "--blocked") {
          return { stdout: "", code: 0 };
        }
        throw new Error(`unexpected args ${key}`);
      },
    });

    const result = await handler("status", { cwd: substrate.root, ui });

    expect(execCalls.map((call) => call.args)).toEqual([
      ["--ready"],
      ["--stage", "review"],
      ["--blocked"],
    ]);
    expect(result).toContain("agile-workflow: 2 ready | 1 review | 0 blocked");
    expect(ui.statuses).toEqual([{ key: "agile-workflow", message: "2 ready | 1 review | 0 blocked" }]);
    expect(ui.widgets.at(-1)).toEqual({
      key: "agile-workflow",
      lines: ["agile-workflow", "2 ready | 1 review | 0 blocked", `root: ${substrate.root}`],
    });
  });

  test("id filters reject invalid ids before exec and pass valid ids as arguments", async () => {
    const substrate = makeSubstrate();
    const { handler, execCalls } = makePi();

    const invalid = await handler("parent ../../oops", { cwd: substrate.root });
    expect(invalid).toContain("Expected an item id for --parent");
    expect(execCalls).toHaveLength(0);

    await handler("blocking story-alpha", { cwd: substrate.root });
    expect(execCalls).toHaveLength(1);
    expect(execCalls[0].args).toEqual(["--blocking", "story-alpha"]);
  });

  test("large output is truncated with an explicit marker", async () => {
    const substrate = makeSubstrate();
    const { handler } = makePi({
      exec: async () => ({ stdout: "x".repeat(6_010), code: 0 }),
    });

    const result = await handler("ready", { cwd: substrate.root });

    expect(result.length).toBeLessThan(6_100);
    expect(result).toContain("[truncated 10 chars]");
  });
});

describe("Pi hook parity adapter", () => {
  test("injects shared .agents/rules content and prompt-gated principles", async () => {
    const substrate = makeSubstrate();
    mkdirSync(join(substrate.root, ".agents", "rules"), { recursive: true });
    writeFileSync(
      join(substrate.root, ".agents", "rules", "agile-workflow.md"),
      "## Test Rules\n- keep the shared rules source",
      "utf8",
    );
    const { eventHandlers } = makePi();

    const result = await fireEvent(
      eventHandlers,
      "before_agent_start",
      {
        prompt: "implement story-alpha",
        systemPrompt: "BASE",
        systemPromptOptions: { cwd: substrate.root },
      },
      { cwd: substrate.root },
    ) as {
      systemPrompt: string;
      message: { customType: string; content: string; display: boolean };
    };

    expect(result.systemPrompt.startsWith("BASE")).toBe(true);
    expect(result.systemPrompt).toContain("## Project Rules (.agents/rules/)");
    expect(result.systemPrompt).toContain("keep the shared rules source");
    expect(result.systemPrompt).not.toContain("## Agile Workflow Principles");
    expect(result.message.customType).toBe("agile-workflow-principles");
    expect(result.message.display).toBe(true);
    expect(result.message.content).toContain("## Agile Workflow Principles");
    expect(result.message.content).toContain("Code-design capsule");
  });

  test("treats bare high-intent workflow verbs as actionable", async () => {
    const substrate = makeSubstrate();
    const { eventHandlers } = makePi();

    const result = await fireEvent(
      eventHandlers,
      "before_agent_start",
      { prompt: "implement", systemPrompt: "BASE", systemPromptOptions: { cwd: substrate.root } },
      { cwd: substrate.root },
    ) as { message: { content: string } };

    expect(result.message.content).toContain("## Agile Workflow Principles");
    expect(result.message.content).toContain("Code-design capsule");
  });

  test("forces rules context every Pi turn while honoring CONVENTIONS opt-out", async () => {
    const substrate = makeSubstrate();
    mkdirSync(join(substrate.root, ".agents", "rules"), { recursive: true });
    writeFileSync(join(substrate.root, ".agents", "rules", "project.md"), "## Rules\n- loaded each turn", "utf8");
    const { eventHandlers } = makePi();

    const first = await fireEvent(
      eventHandlers,
      "before_agent_start",
      { prompt: "explain this repo", systemPrompt: "BASE", systemPromptOptions: { cwd: substrate.root } },
      { cwd: substrate.root },
    ) as { systemPrompt: string };
    const second = await fireEvent(
      eventHandlers,
      "before_agent_start",
      { prompt: "explain this repo", systemPrompt: "BASE", systemPromptOptions: { cwd: substrate.root } },
      { cwd: substrate.root },
    ) as { systemPrompt: string };

    expect(first.systemPrompt).toContain("loaded each turn");
    expect(second.systemPrompt).toContain("loaded each turn");

    writeFileSync(join(substrate.root, ".work", "CONVENTIONS.md"), "rules_context: off\n", "utf8");
    const disabled = await fireEvent(
      eventHandlers,
      "before_agent_start",
      { prompt: "explain this repo", systemPrompt: "BASE", systemPromptOptions: { cwd: substrate.root } },
      { cwd: substrate.root },
    );
    expect(disabled).toBeUndefined();
  });

  test("runs substrate maintenance after mutating tools", async () => {
    const substrate = makeSubstrate();
    const storyDir = join(substrate.root, ".work", "active", "stories");
    mkdirSync(storyDir, { recursive: true });
    const storyPath = join(storyDir, "story-alpha.md");
    writeFileSync(
      storyPath,
      [
        "---",
        "id: story-alpha",
        "stage: implementing",
        "tags: []",
        "parent: null",
        "depends_on: []",
        "release_binding: null",
        "gate_origin: null",
        "created: 2000-01-01",
        "updated: 2000-01-01",
        "---",
        "# Story Alpha",
      ].join("\n"),
      "utf8",
    );
    const { eventHandlers } = makePi();

    const result = await fireEvent(
      eventHandlers,
      "tool_result",
      {
        toolName: "edit",
        input: { path: storyPath },
        content: [{ type: "text", text: "edited" }],
      },
      { cwd: substrate.root },
    ) as { content: Array<{ type: string; text: string }> };

    const updatedStory = readFileSync(storyPath, "utf8");
    expect(updatedStory).toMatch(/updated: \d{4}-\d{2}-\d{2}/);
    expect(updatedStory).not.toContain("updated: 2000-01-01");
    expect(result.content.at(-1)?.text).toContain("Agile Workflow substrate validation found issues");
    expect(result.content.at(-1)?.text).toContain("missing required frontmatter fields: kind");
  });
});

describe("/aw workflow handoffs", () => {
  test("queues board, autopilot, and scope through Pi follow-up messages", async () => {
    const substrate = makeSubstrate();
    const { handler, sentMessages } = makePi();

    await handler("board", { cwd: substrate.root });
    await handler("autopilot", { cwd: substrate.root });
    await handler("autopilot feature-alpha", { cwd: substrate.root });
    await handler("scope capture this idea", { cwd: substrate.root });

    expect(sentMessages).toEqual([
      { content: "$agile-workflow:board", options: { deliverAs: "followUp" } },
      { content: "$agile-workflow:autopilot --all", options: { deliverAs: "followUp" } },
      { content: "$agile-workflow:autopilot feature-alpha", options: { deliverAs: "followUp" } },
      { content: "$agile-workflow:scope capture this idea", options: { deliverAs: "followUp" } },
    ]);
  });

  test("scope requires text and handoffs fall back when follow-ups are unavailable", async () => {
    const substrate = makeSubstrate();
    const ui = makeUi();
    const { handler, sentMessages } = makePi({ sendUserMessage: undefined });

    const missingScope = await handler("scope", { cwd: substrate.root, ui });
    expect(missingScope).toContain("Expected an idea or item id for /aw scope");

    const fallback = await handler("board", { cwd: substrate.root, ui });
    expect(fallback).toContain("Pi follow-up messages are unavailable");
    expect(fallback).toContain("$agile-workflow:board");
    expect(sentMessages).toHaveLength(0);
  });
});
