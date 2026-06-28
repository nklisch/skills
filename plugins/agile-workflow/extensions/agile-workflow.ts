import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const STATUS_KEY = "agile-workflow";
const MAX_OUTPUT_CHARS = 6_000;
const ITEM_ID_RE = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/;
const HOOK_TIMEOUT_MS = 5_000;
const RULES_CONTEXT_HEADER = "## Project Rules (.agents/rules/)";
const PRINCIPLES_CONTEXT_HEADER = "## Agile Workflow Principles";
const MUTATING_TOOL_NAMES = new Set(["write", "edit", "apply_patch"]);

const PLUGIN_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const PROMPT_CONTEXT_SCRIPT = join(PLUGIN_ROOT, "hooks", "scripts", "prompt-context.py");
const SUBSTRATE_MAINTAINER_SCRIPT = join(PLUGIN_ROOT, "hooks", "scripts", "substrate-maintainer.py");

type PiApi = {
  exec: (
    command: string,
    args: string[],
    options?: { signal?: AbortSignal; timeout?: number },
  ) => Promise<{ stdout?: string; stderr?: string; code?: number | null; killed?: boolean }>;
  sendUserMessage?: (
    content: string,
    options?: { deliverAs?: "followUp" | "steer" | "immediate" },
  ) => void | Promise<void>;
  registerCommand: (
    name: string,
    options: { description: string; handler: (args: string | undefined, ctx: PiContext) => Promise<string> },
  ) => void;
  on?: (
    event: string,
    handler: (event: unknown, ctx: PiContext) => unknown | Promise<unknown>,
  ) => void;
};

type PiContext = {
  cwd?: string;
  signal?: AbortSignal;
  sessionManager?: {
    getSessionFile?: () => string | undefined;
  };
  ui?: {
    notify?: (message: string, level?: "info" | "warning" | "error" | "success") => void;
    setStatus?: (key: string, message: string) => void;
    setWidget?: (key: string, lines: string[]) => void;
  };
};

type BeforeAgentStartEvent = {
  prompt?: string;
  systemPrompt?: string;
  systemPromptOptions?: { cwd?: string };
};

type BeforeAgentStartResult = {
  systemPrompt?: string;
  message?: {
    customType: string;
    content: string;
    display: boolean;
  };
};

type SessionEvent = {
  reason?: string;
};

type ToolResultEvent = {
  toolName?: string;
  input?: unknown;
  content?: unknown;
};

type HookOutput = {
  hookSpecificOutput?: {
    additionalContext?: unknown;
  };
};

type Substrate = {
  root: string;
  workView: string;
};

function registerHookParity(pi: PiApi): void {
  // Claude Code and Codex run hooks/hooks.json directly. Pi has no package hook
  // manifest, so this adapter maps Pi-native events onto the SAME deterministic
  // Python hook scripts instead of reimplementing workflow rules in TypeScript.
  // That keeps .agents/rules loading, principles capsules, updated: bumps, and
  // cheap substrate validation behaviorally aligned across all three channels.
  pi.on?.("session_start", (event, ctx) => {
    runPromptContext(
      {
        hook_event_name: "SessionStart",
        source: sessionSource(event),
        cwd: ctx.cwd,
        session_id: sessionId(ctx),
      },
      ctx.cwd,
    );
  });

  pi.on?.("session_compact", (event, ctx) => {
    runPromptContext(
      {
        hook_event_name: "PostCompact",
        source: "compact",
        trigger: sessionSource(event),
        cwd: ctx.cwd,
        session_id: sessionId(ctx),
      },
      ctx.cwd,
    );
  });

  pi.on?.("before_agent_start", (rawEvent, ctx): BeforeAgentStartResult | undefined => {
    const event = (rawEvent ?? {}) as BeforeAgentStartEvent;
    const cwd = event.systemPromptOptions?.cwd ?? ctx.cwd ?? process.cwd();
    const session_id = sessionId(ctx);
    const base = event.systemPrompt ?? "";
    const result: BeforeAgentStartResult = {};

    if (!base.includes(RULES_CONTEXT_HEADER)) {
      const rules = runPromptContext(
        {
          hook_event_name: "PiBeforeAgentStart",
          source: "pi-before-agent-start",
          cwd,
          session_id,
          force_rules_context: true,
        },
        cwd,
      );
      if (rules) {
        result.systemPrompt = `${base}\n\n${rules}`;
      }
    }

    const effectivePrompt = result.systemPrompt ?? base;
    if (!effectivePrompt.includes(PRINCIPLES_CONTEXT_HEADER)) {
      const principles = runPromptContext(
        {
          hook_event_name: "UserPromptSubmit",
          source: "user",
          cwd,
          session_id,
          prompt: event.prompt ?? "",
        },
        cwd,
      );
      if (principles) {
        // Hook-specific context in Claude/Codex lands as an injected context
        // message, not as invisible permanent instructions. Use the same shape
        // in Pi so the model can actually see prompt-gated principles capsules
        // in the conversation stream while keeping the bulky rules block in the
        // rebuilt system prompt.
        result.message = {
          customType: "agile-workflow-principles",
          content: principles,
          display: true,
        };
      }
    }

    if (!result.systemPrompt && !result.message) return;
    return result;
  });

  pi.on?.("tool_result", (rawEvent, ctx) => {
    const event = (rawEvent ?? {}) as ToolResultEvent;
    const toolName = String(event.toolName ?? "").toLowerCase();
    if (!MUTATING_TOOL_NAMES.has(toolName)) return;

    const cwd = ctx.cwd ?? process.cwd();
    const context = runHookScript(
      SUBSTRATE_MAINTAINER_SCRIPT,
      {
        hook_event_name: "PostToolUse",
        source: "pi-tool-result",
        cwd,
        session_id: sessionId(ctx),
        tool_input: event.input ?? {},
      },
      cwd,
    );
    if (!context) return;
    return appendToolContext(event.content, context);
  });
}

export default function agileWorkflowExtension(pi: PiApi) {
  registerHookParity(pi);

  pi.registerCommand("aw", {
    description: "Inspect and navigate the agile-workflow .work substrate",
    handler: async (args, ctx) => {
      const input = (args ?? "").trim();
      const [command] = input.split(/\s+/, 1);
      const rest = command ? input.slice(command.length).trim() : "";

      if (!command || command === "help" || command === "-h" || command === "--help") {
        return show(ctx, helpText());
      }

      const substrate = findSubstrate(ctx.cwd);
      if (!substrate) {
        return show(
          ctx,
          "No agile-workflow substrate found. Run $agile-workflow:convert in this repo before using /aw.",
          "warning",
        );
      }

      if (!existsSync(substrate.workView)) {
        return show(
          ctx,
          "Found .work/ but no .work/bin/work-view. Run $agile-workflow:convert or reinstall the substrate tooling.",
          "warning",
        );
      }

      try {
        switch (command) {
          case "status":
            return show(ctx, await queueSnapshot(pi, ctx, substrate));
          case "ready":
            return show(ctx, await runWorkView(pi, ctx, substrate, ["--ready"]));
          case "blocked":
            return show(ctx, await runWorkView(pi, ctx, substrate, ["--blocked"]));
          case "review":
            return show(ctx, await runWorkView(pi, ctx, substrate, ["--stage", "review"]));
          case "parent":
            return show(ctx, await runIdFilter(pi, ctx, substrate, "--parent", rest));
          case "blocking":
            return show(ctx, await runIdFilter(pi, ctx, substrate, "--blocking", rest));
          case "board":
            return show(ctx, await queueSkillHandoff(pi, "$agile-workflow:board"));
          case "autopilot":
            return show(ctx, await queueSkillHandoff(pi, `$agile-workflow:autopilot ${rest || "--all"}`));
          case "scope":
            if (!rest) {
              return show(ctx, "Expected an idea or item id for /aw scope.\n\n" + helpText(), "warning");
            }
            return show(ctx, await queueSkillHandoff(pi, `$agile-workflow:scope ${rest}`));
          default:
            return show(
              ctx,
              `Unknown /aw subcommand: ${command}\n\n${helpText()}`,
              "warning",
            );
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return show(ctx, `agile-workflow command failed: ${message}`, "error");
      }
    },
  });
}

function sessionSource(event: unknown): string {
  const reason = (event as SessionEvent | undefined)?.reason;
  return typeof reason === "string" && reason ? reason : "startup";
}

function sessionId(ctx: PiContext): string {
  try {
    const file = ctx.sessionManager?.getSessionFile?.();
    if (file) return file;
  } catch {
    // Fail open: hook state dedup is a convenience, never a reason to break a turn.
  }
  return "pi-session";
}

function runPromptContext(payload: Record<string, unknown>, cwd?: string): string {
  return runHookScript(PROMPT_CONTEXT_SCRIPT, payload, cwd);
}

function runHookScript(script: string, payload: Record<string, unknown>, cwd?: string): string {
  if (!existsSync(script)) return "";

  try {
    const result = spawnSync("python3", [script], {
      cwd: cwd || process.cwd(),
      encoding: "utf8",
      env: {
        ...process.env,
        PYTHONDONTWRITEBYTECODE: "1",
        PLUGIN_ROOT,
        CLAUDE_PLUGIN_ROOT: process.env.CLAUDE_PLUGIN_ROOT || PLUGIN_ROOT,
      },
      input: JSON.stringify(payload),
      stdio: ["pipe", "pipe", "ignore"],
      timeout: HOOK_TIMEOUT_MS,
    });

    if (result.error || (typeof result.status === "number" && result.status !== 0)) {
      return "";
    }
    return parseHookContext(result.stdout || "");
  } catch {
    return "";
  }
}

function parseHookContext(stdout: string): string {
  const raw = stdout.trim();
  if (!raw) return "";
  const line = raw
    .split(/\r?\n/)
    .reverse()
    .find((candidate) => candidate.trim().startsWith("{"));
  if (!line) return "";

  try {
    const parsed = JSON.parse(line) as HookOutput;
    const context = parsed.hookSpecificOutput?.additionalContext;
    return typeof context === "string" ? context.trim() : "";
  } catch {
    return "";
  }
}

function appendToolContext(content: unknown, context: string): { content: Array<unknown> } {
  const note = { type: "text", text: `\n\n${context}` };
  if (Array.isArray(content)) {
    return { content: [...content, note] };
  }
  if (typeof content === "string" && content) {
    return { content: [{ type: "text", text: content }, note] };
  }
  if (content && typeof content === "object") {
    return { content: [content, note] };
  }
  return { content: [note] };
}

function findSubstrate(start?: string): Substrate | null {
  let current = resolve(start || process.cwd());

  while (true) {
    const conventions = join(current, ".work", "CONVENTIONS.md");
    if (existsSync(conventions)) {
      return {
        root: current,
        workView: join(current, ".work", "bin", "work-view"),
      };
    }

    const parent = dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

async function runWorkView(pi: PiApi, ctx: PiContext, substrate: Substrate, args: string[]): Promise<string> {
  const result = await pi.exec(substrate.workView, args, {
    signal: ctx.signal,
    timeout: 10_000,
  });

  if (result.killed) {
    throw new Error("work-view timed out");
  }

  if (result.code && result.code !== 0) {
    const stderr = (result.stderr || "").trim();
    throw new Error(stderr || `work-view exited with code ${result.code}`);
  }

  return (result.stdout || "").trim() || "(no matching items)";
}

async function runIdFilter(
  pi: PiApi,
  ctx: PiContext,
  substrate: Substrate,
  flag: "--parent" | "--blocking",
  id: string,
): Promise<string> {
  const trimmed = id.trim();
  if (!ITEM_ID_RE.test(trimmed)) {
    return `Expected an item id for ${flag}.\n\n${helpText()}`;
  }
  return runWorkView(pi, ctx, substrate, [flag, trimmed]);
}

async function queueSkillHandoff(pi: PiApi, invocation: string): Promise<string> {
  if (pi.sendUserMessage) {
    await pi.sendUserMessage(invocation, { deliverAs: "followUp" });
    return `Queued follow-up: ${invocation}`;
  }

  return `Pi follow-up messages are unavailable in this runtime. Run: ${invocation}`;
}

async function queueSnapshot(pi: PiApi, ctx: PiContext, substrate: Substrate): Promise<string> {
  const ready = await runWorkView(pi, ctx, substrate, ["--ready"]);
  const review = await runWorkView(pi, ctx, substrate, ["--stage", "review"]);
  const blocked = await runWorkView(pi, ctx, substrate, ["--blocked"]);
  const summary = `${countRows(ready)} ready | ${countRows(review)} review | ${countRows(blocked)} blocked`;

  ctx.ui?.setStatus?.(STATUS_KEY, summary);
  ctx.ui?.setWidget?.(STATUS_KEY, [
    "agile-workflow",
    summary,
    `root: ${substrate.root}`,
  ]);

  return [
    `agile-workflow: ${summary}`,
    formatSection("Ready", ready),
    formatSection("Review", review),
    formatSection("Blocked", blocked),
  ].join("\n\n");
}

function show(
  ctx: PiContext,
  message: string,
  level: "info" | "warning" | "error" | "success" = "info",
): string {
  const clipped = truncate(message);
  ctx.ui?.notify?.(clipped, level);
  return clipped;
}

function countRows(output: string): number {
  if (output === "(no matching items)") return 0;

  return output
    .trim()
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .filter((line) => !/^ID\s+KIND\s+STAGE\s+TAGS\s+PARENT/.test(line))
    .filter((line) => !/^-+\s+-+\s+-+\s+-+\s+-+$/.test(line.trim()))
    .length;
}

function formatSection(title: string, output: string): string {
  return `## ${title}\n${output}`;
}

function truncate(output: string): string {
  if (output.length <= MAX_OUTPUT_CHARS) return output;
  return `${output.slice(0, MAX_OUTPUT_CHARS)}\n\n[truncated ${output.length - MAX_OUTPUT_CHARS} chars]`;
}

function helpText(): string {
  return [
    "agile-workflow commands:",
    "  /aw help              Show this help",
    "  /aw status            Show ready/review/blocked queue snapshot",
    "  /aw ready             List ready active items",
    "  /aw blocked           List blocked active items",
    "  /aw review            List items at stage:review",
    "  /aw parent <id>       List direct children",
    "  /aw blocking <id>     List items waiting on an item",
    "  /aw board             Open the agile-workflow board via the shared skill",
    "  /aw autopilot [scope] Queue the shared autopilot skill (defaults to --all)",
    "  /aw scope <idea>      Queue the shared scope skill",
    "",
    "Long-running workflow actions are handed to shared agile-workflow skills.",
  ].join("\n");
}
