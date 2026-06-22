import { afterEach, describe, expect, test } from "bun:test";
import {
  chmodSync,
  existsSync,
  lstatSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readlinkSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import agileWorkflowExtension, { syncBundledPiAgents } from "./agile-workflow";

type ExecCall = {
  command: string;
  args: string[];
  options?: { signal?: AbortSignal; timeout?: number };
};

type RegisteredHandler = (args: string | undefined, ctx: TestContext) => Promise<string>;

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
  const previousAgentDir = process.env.PI_CODING_AGENT_DIR;
  process.env.PI_CODING_AGENT_DIR = tempRoot();
  try {
    agileWorkflowExtension(pi);
  } finally {
    if (previousAgentDir === undefined) {
      delete process.env.PI_CODING_AGENT_DIR;
    } else {
      process.env.PI_CODING_AGENT_DIR = previousAgentDir;
    }
  }
  if (!handler) {
    throw new Error("extension did not register /aw");
  }
  return {
    handler,
    execCalls,
    sentMessages,
  };
}

function makeAgentSource(): string {
  const source = tempRoot();
  for (const name of ["designer.md", "implementor.md", "reviewer.md", "scanner.md"]) {
    writeFileSync(join(source, name), `---\ndescription: ${name}\n---\n${name}\n`, "utf8");
  }
  return source;
}

describe("bundled Pi agent sync", () => {
  test("installs bundled agents into the global Pi agents directory", () => {
    const source = makeAgentSource();
    const target = tempRoot();

    const result = syncBundledPiAgents({ sourceDir: source, targetDir: target });

    expect(result.errors).toHaveLength(0);
    expect(result.installed).toEqual(["designer.md", "implementor.md", "reviewer.md", "scanner.md"]);
    for (const name of result.installed) {
      const installed = join(target, name);
      expect(existsSync(installed)).toBe(true);
      expect(lstatSync(installed).isSymbolicLink()).toBe(true);
      expect(readlinkSync(installed)).toBe(join(source, name));
    }
  });

  test("treats a second activation as a no-op when links already point at bundled agents", () => {
    const source = makeAgentSource();
    const target = tempRoot();

    syncBundledPiAgents({ sourceDir: source, targetDir: target });
    const result = syncBundledPiAgents({ sourceDir: source, targetDir: target });

    expect(result.installed).toHaveLength(0);
    expect(result.updated).toHaveLength(0);
    expect(result.skipped).toEqual(["designer.md", "implementor.md", "reviewer.md", "scanner.md"]);
    expect(result.errors).toHaveLength(0);
  });

  test("refreshes existing symlinks but leaves ordinary user files alone", () => {
    const source = makeAgentSource();
    const target = tempRoot();
    const oldSource = tempRoot();
    writeFileSync(join(oldSource, "designer.md"), "old designer\n", "utf8");
    symlinkSync(join(oldSource, "designer.md"), join(target, "designer.md"));
    writeFileSync(join(target, "implementor.md"), "custom implementor\n", "utf8");

    const result = syncBundledPiAgents({ sourceDir: source, targetDir: target });

    expect(result.updated).toContain("designer.md");
    expect(result.skipped).toContain("implementor.md");
    expect(readlinkSync(join(target, "designer.md"))).toBe(join(source, "designer.md"));
    expect(readFileSync(join(target, "implementor.md"), "utf8")).toBe("custom implementor\n");
  });

  test("refreshes broken symlinks left by moved installs", () => {
    const source = makeAgentSource();
    const target = tempRoot();
    symlinkSync(join(target, "missing-reviewer.md"), join(target, "reviewer.md"));

    const result = syncBundledPiAgents({ sourceDir: source, targetDir: target });

    expect(result.updated).toContain("reviewer.md");
    expect(readlinkSync(join(target, "reviewer.md"))).toBe(join(source, "reviewer.md"));
  });

  test("updates managed copy fallbacks on later activation", () => {
    const source = makeAgentSource();
    const target = tempRoot();
    writeFileSync(join(target, "reviewer.md"), "old managed reviewer\n", "utf8");
    writeFileSync(join(target, "reviewer.md.agile-workflow-managed"), join(source, "reviewer.md"), "utf8");

    const result = syncBundledPiAgents({ sourceDir: source, targetDir: target });

    expect(result.updated).toContain("reviewer.md");
    expect(readFileSync(join(target, "reviewer.md"), "utf8")).toContain("reviewer.md");
  });
});

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
