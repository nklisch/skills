import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const STATUS_KEY = "agile-workflow";
const MAX_OUTPUT_CHARS = 6_000;
const ITEM_ID_RE = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/;

type PiApi = {
  exec: (
    command: string,
    args: string[],
    options?: { signal?: AbortSignal; timeout?: number },
  ) => Promise<{ stdout?: string; stderr?: string; code?: number | null; killed?: boolean }>;
  registerCommand: (
    name: string,
    options: { description: string; handler: (args: string | undefined, ctx: PiContext) => Promise<string> },
  ) => void;
};

type PiContext = {
  cwd?: string;
  signal?: AbortSignal;
  ui?: {
    notify?: (message: string, level?: "info" | "warning" | "error" | "success") => void;
    setStatus?: (key: string, message: string) => void;
    setWidget?: (key: string, lines: string[]) => void;
  };
};

type Substrate = {
  root: string;
  workView: string;
};

export default function agileWorkflowExtension(pi: PiApi) {
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
  const lines = output.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length <= 2 || output === "(no matching items)") return 0;
  return lines.slice(2).length;
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
    "",
    "Workflow shortcuts land in the next extension story.",
  ].join("\n");
}
