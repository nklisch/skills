import {
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readlinkSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const STATUS_KEY = "agile-workflow";
const MAX_OUTPUT_CHARS = 6_000;
const ITEM_ID_RE = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/;
const BUNDLED_AGENT_FILES = ["designer.md", "implementor.md", "reviewer.md", "scanner.md"] as const;
const MANAGED_MARKER_SUFFIX = ".agile-workflow-managed";

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
  syncBundledPiAgents();

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

type AgentSyncResult = {
  installed: string[];
  updated: string[];
  skipped: string[];
  errors: Array<{ file: string; message: string }>;
};

export function syncBundledPiAgents(options: {
  sourceDir?: string;
  targetDir?: string;
} = {}): AgentSyncResult {
  const sourceDir = options.sourceDir ?? bundledPiAgentDir();
  const targetDir = options.targetDir ?? globalPiAgentDir();
  const result: AgentSyncResult = {
    installed: [],
    updated: [],
    skipped: [],
    errors: [],
  };

  try {
    mkdirSync(targetDir, { recursive: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      installed: [],
      updated: [],
      skipped: [...BUNDLED_AGENT_FILES],
      errors: BUNDLED_AGENT_FILES.map((file) => ({ file, message })),
    };
  }

  for (const file of BUNDLED_AGENT_FILES) {
    const source = resolve(sourceDir, file);
    const target = join(targetDir, file);
    const marker = `${target}${MANAGED_MARKER_SUFFIX}`;

    try {
      const sourceStat = statOrNull(source);
      if (!sourceStat?.isFile()) {
        result.errors.push({ file, message: `missing bundled agent: ${source}` });
        continue;
      }

      const targetStat = lstatOrNull(target);
      if (!targetStat) {
        installManagedAgent(source, target, marker);
        result.installed.push(file);
        continue;
      }

      if (targetStat.isSymbolicLink()) {
        const linkTarget = readlinkSync(target);
        const resolvedTarget = resolve(dirname(target), linkTarget);
        if (resolvedTarget === source) {
          result.skipped.push(file);
          continue;
        }

        rmSync(target);
        installManagedAgent(source, target, marker);
        result.updated.push(file);
        continue;
      }

      if (existsSync(marker)) {
        installManagedCopy(source, target, marker);
        result.updated.push(file);
        continue;
      }

      result.skipped.push(file);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      result.errors.push({ file, message });
    }
  }

  return result;
}

function lstatOrNull(path: string): ReturnType<typeof lstatSync> | null {
  try {
    return lstatSync(path);
  } catch {
    return null;
  }
}

function statOrNull(path: string): ReturnType<typeof statSync> | null {
  try {
    return statSync(path);
  } catch {
    return null;
  }
}

function installManagedAgent(source: string, target: string, marker: string): void {
  try {
    symlinkSync(source, target);
    rmSync(marker, { force: true });
  } catch {
    installManagedCopy(source, target, marker);
  }
}

function installManagedCopy(source: string, target: string, marker: string): void {
  copyFileSync(source, target);
  writeFileSync(marker, `${source}\n`, "utf8");
}

function bundledPiAgentDir(): string {
  return resolve(dirname(fileURLToPath(import.meta.url)), "..", "agents", "pi");
}

function globalPiAgentDir(): string {
  return join(resolve(process.env.PI_CODING_AGENT_DIR ?? join(homedir(), ".pi", "agent")), "agents");
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
