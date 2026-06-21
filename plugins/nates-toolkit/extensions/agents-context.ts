/**
 * agents-context — inject <cwd>/.agents/AGENTS.md as a project context file.
 *
 * pi natively loads AGENTS.md / CLAUDE.md from only three places: the global
 * dir (~/.pi/agent/), every ancestor of cwd walking up, and cwd itself. It does
 * NOT look under <cwd>/.agents/AGENTS.md — which is exactly where projects that
 * keep their agent assets in a .agents/ tree (e.g. a .agents/skills/ layout)
 * tend to park project instructions. This extension closes that gap.
 *
 * On every before_agent_start it reads <cwd>/.agents/AGENTS.md and appends its
 * contents to the system prompt as a <project_instructions path="..."> block —
 * the same per-file format pi uses for native context files (system-prompt.js)
 * — so the model treats it identically to the root AGENTS.md. The block lands
 * just after the native <project_context> envelope rather than inside it (the
 * prompt is already built by the time before_agent_start fires), which is the
 * same append-after-build approach background-tasks uses for its explainer.
 *
 * Re-injecting every turn is deliberate, not wasteful: pi rebuilds the system
 * prompt from the base each turn, so a one-shot session_start message would be
 * summarized away on the first compaction and never come back. Returning the
 * block every turn is compaction-immune — the same reason pi re-applies native
 * context files each turn. An mtime-keyed cache keeps the steady-state cost to a
 * single stat() per turn.
 *
 * Missing / unreadable / non-regular / empty file = silent no-op. Edits to the
 * file are picked up live.
 *
 * House style (nates-toolkit / background-tasks): a locally-typed PiApi slice
 * with optional methods and zero @earendil-works/* dependencies, so the file
 * stays unit-testable with a fake pi under bare `bun test`.
 */

import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/** Project-relative path this extension injects (relative to the session cwd). */
export const RELATIVE_PATH = ".agents/AGENTS.md";
/** The exact opening tag emitted — also the idempotency sentinel. */
export const OPEN_TAG = `<project_instructions path="${RELATIVE_PATH}">`;

type SystemPromptOptions = { cwd?: string };
type BeforeAgentStartEvent = {
  systemPrompt?: string;
  systemPromptOptions?: SystemPromptOptions;
};
type PiApi = {
  on?: (
    event: "before_agent_start",
    handler: (
      event: BeforeAgentStartEvent,
    ) => { systemPrompt: string } | undefined | void,
  ) => void;
};

type Cached = { absPath: string; mtimeMs: number; content: string };
let cache: Cached | null = null;

/**
 * Read <cwd>/.agents/AGENTS.md. Returns the trimmed contents, or null when the
 * file is missing, unreadable, not a regular file, or empty. An mtime check
 * skips the disk read when the file is unchanged since the last turn — so a
 * live edit is picked up but a steady-state turn costs only a stat(). Never
 * throws: a missing or unreadable file is a silent no-op, never a turn-breaking
 * error.
 */
function readAgentsContext(cwd: string): string | null {
  const absPath = join(cwd, RELATIVE_PATH);
  try {
    const st = statSync(absPath);
    if (!st.isFile()) return null;
    if (cache && cache.absPath === absPath && cache.mtimeMs === st.mtimeMs) {
      return cache.content || null;
    }
    const content = readFileSync(absPath, "utf8").trim();
    cache = { absPath, mtimeMs: st.mtimeMs, content };
    return content || null;
  } catch {
    return null; // ENOENT, EACCES, etc. — silent no-op.
  }
}

export default function agentsContextExtension(pi: PiApi): void {
  pi.on?.("before_agent_start", (event) => {
    const content = readAgentsContext(
      event?.systemPromptOptions?.cwd ?? process.cwd(),
    );
    if (!content) return;
    const base = event?.systemPrompt ?? "";
    // Idempotency / double-registration guard. The prompt is rebuilt from base
    // every turn, so under normal single registration `base` never contains our
    // prior append — this only fires if a duplicate handler chains ahead of us.
    // The sentinel is the exact opening tag we emit, so it can't false-positive
    // on native context files (those carry different paths).
    if (base.includes(OPEN_TAG)) return;
    return { systemPrompt: `${base}\n\n${OPEN_TAG}\n${content}\n</project_instructions>` };
  });
}
