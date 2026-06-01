import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const STATUS_KEY = "agile-workflow";

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

      return show(
        ctx,
        `Unknown /aw subcommand: ${command}\n\n${helpText()}`,
        "warning",
      );
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

function show(
  ctx: PiContext,
  message: string,
  level: "info" | "warning" | "error" | "success" = "info",
): string {
  ctx.ui?.notify?.(message, level);
  return message;
}

function helpText(): string {
  return [
    "agile-workflow commands:",
    "  /aw help              Show this help",
    "",
    "Queue commands land in the next extension story.",
  ].join("\n");
}
