---
name: implement-orchestrator
description: >
  Implement a feature with multiple child stories by walking the depends_on graph
  and spawning Sonnet sub-agents. Reads the parent feature's design (in its body),
  reads each child story file, plans a parallel-vs-sequential schedule based on
  depends_on, spawns one Sonnet agent per ready story (parallel where independent),
  waits, advances stages, repeats until all stories at done. For features with > 3
  child stories. For single-stride sequential implementation, use /agile-workflow:implement.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Agent, Task
model: opus
---

# Implement-Orchestrator

You orchestrate the implementation of a feature whose design has spawned multiple
child stories. Your value is in the prompt crafting and the dependency-aware
scheduling — not in writing line-by-line code yourself. You delegate that to Sonnet
agents.

## Trigger

The agent picks this skill when:
- A feature is at `stage: implementing` AND has more than 3 child stories AND those
  stories have a non-trivial `depends_on` graph (otherwise sequential `implement`
  is fine)

Common phrases:
- "orchestrate implementation of feature X"
- "fan out the stories under feature Y"
- "drive the parallel implementation"

## Workflow

### Phase 1: Ground yourself

Read deeply — the quality of your agent prompts depends on this.

1. **The parent feature** at `.work/active/features/<id>.md` — full design, all units,
   all referenced patterns
2. **Each child story**: every file matching `parent: <feature-id>` in
   `.work/active/stories/`. Use `work-view`:

   ```bash
   .work/bin/work-view --kind story --parent <feature-id>
   ```

3. **Foundation docs** referenced: `docs/SPEC.md`, `docs/ARCHITECTURE.md`
4. **Principles** — both paradigms via the auto-loaded principles skill
5. **CLAUDE.md** — project conventions, build commands
6. **Concrete pattern examples** in the codebase — for each type of code the agents
   will write, find an existing example. Read 3-5 key files yourself; use Explore
   sub-agents for breadth.
7. **Discrepancies between design and repo reality** — for every file the design
   references, confirm interfaces match. Note discrepancies for inclusion in agent
   prompts.

### Phase 2: Build the dependency graph

For each child story, parse its `depends_on` field. Build a map:
- `story-id → list of dep ids it waits on`
- `dep id → list of stories that wait on it`

Validate:
- All `depends_on` entries refer to existing items
- No cycles (`work-view --blocking` per id)

### Phase 3: Plan the schedule

Topological wave-based plan:

- **Wave 1** (parallel): all stories where every `depends_on` entry is at `stage:done`
  (or terminal in releases/archive)
- **Wave 2** (parallel): stories whose dependencies are wave-1 stories
- **Wave N** (parallel): stories whose dependencies are wave-(N-1) stories

Cap parallelism at 3 sub-agents per wave (Claude Code's orchestrator limit). If a
wave has more than 3 stories, split it into sub-waves of 3, run sequentially within
the wave.

### Phase 4: Re-align to project standards

Re-read `CLAUDE.md` (project root and `.claude/` if both exist) and `.claude/rules/`.
Recency improves prompt adherence.

### Phase 5: Craft agent prompts

For each story to spawn an agent for, write a self-contained prompt with:

1. **Role and goal** — one sentence stating what the agent is implementing. Frame it
   with ownership and craft: "You are implementing <story-name> for feature
   <feature-name> — write production-quality code that you'd be proud to have
   reviewed."

2. **Story file content** — paste the story's body verbatim. Include the design,
   acceptance criteria, and any notes. Tell the agent: "Update this file with
   implementation notes when done."

3. **Parent feature design excerpt** — paste the relevant implementation units from
   the feature body. Don't summarize — exact specifications matter.

4. **Codebase context** — concrete:
   - Key file paths it will read or modify (specific, not generic)
   - Existing patterns to follow with concrete codebase examples
   - Discrepancies between design and repo reality you found
   - Specific imports needed
   - Project conventions from CLAUDE.md

5. **Stage transition instruction** — "When done, update the story's frontmatter
   `stage: implementing → review` and append implementation notes to the body. The
   PostToolUse hook will auto-bump `updated:`."

6. **Verification commands** — what to run when done (from CLAUDE.md, e.g.,
   `pnpm typecheck && pnpm lint && pnpm test`)

7. **Commit instruction** — "After all code compiles and tests pass, commit with
   message `implement: <story-id>`. Do NOT push."

8. **Emotional framing** — pride in craft, permission to report blockers, quality
   as aspiration not threat. Avoid pressure language ("you MUST", "CRITICAL").

### Phase 6: Spawn agents (per wave)

Use the **Agent tool** with `model: "sonnet"` and `subagent_type: "general-purpose"`.

For waves with multiple agents, send all in a **single message** with multiple
Agent tool calls (parallel execution).

```
Agent(
  description: "Implement story <id>",
  model: "sonnet",
  prompt: <crafted prompt>,
  subagent_type: "general-purpose"
)
```

Use `isolation: "worktree"` if multiple agents in the same wave will modify
overlapping files. Otherwise skip — the substrate's items are independent.

### Phase 7: Review wave results

After each wave:
1. Read each agent's result summary
2. Verify the agent advanced its story's stage to `review` and wrote implementation
   notes
3. Verify the agent committed
4. Run the verification commands yourself to confirm integration is clean

If an agent reported a blocker or left gaps:
- Small fix → make it yourself directly
- Larger issue → spawn a focused follow-up agent with a targeted prompt

Don't proceed to the next wave if the previous wave's results aren't verified.

### Phase 8: Iterate waves until done

Continue spawning waves until all child stories are at `stage: review` (or `done`
if review-skipping for trivial ones, but generally stories advance to `review` only).

### Phase 9: Update the parent feature

Once all child stories are at `stage: review`:
1. Append a summary to the parent feature's body:
   - All stories implemented (list with their statuses)
   - Any cross-cutting deviations
   - Verification status (build + tests pass)
2. Advance parent feature's frontmatter: `stage: implementing → review`. PostToolUse
   hook bumps `updated:`.
3. Commit:
   ```bash
   git add .work/active/features/<id>.md
   git commit -m "implement: <feature-id> (<N> stories ready for review)"
   ```

## Output

In conversation:
- **Orchestrated**: `<feature-id>` advanced to `stage: review`
- **Stories implemented**: count + list
- **Waves**: how many waves ran, parallelism per wave
- **Deviations across stories**: list (or "none")
- **Verification**: build + test status
- **Next**: `/agile-workflow:review <feature-id>` (or per-story review)

## Guardrails

- Ground yourself before spawning agents. Vague prompts produce vague implementations.
- Cap parallelism at 3 sub-agents per wave. More than that, split into sub-waves.
- Cap at 3 sub-agents per wave. More than that, split into sub-waves of 3 run
  sequentially within the wave.
- If a feature has > 20 child stories or > 2000 lines of new code estimated, halt
  and tell the user: "This feature is too large for orchestration. Split the
  design first via /agile-workflow:design or refactor it into multiple smaller
  features." Don't try to orchestrate beyond 3 effective parallel agents — the
  design itself is the wrong shape if it needs more.
- Every agent prompt must be self-contained. Agents share no context.
- Reference paths and key signatures in prompts, not entire files. Agents read files.
- Only reference patterns you've verified by reading.
- Run the verification commands after each wave. Integration issues only surface at
  the seams between agents' work.
- The orchestrator (you) updates the parent feature's stage to `review`, NOT individual
  agents. Agents only manage their own story files.
