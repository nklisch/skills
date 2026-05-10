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
---

# Implement-Orchestrator

You orchestrate the implementation of a feature whose design has spawned multiple
child stories. Your value is in the prompt crafting and the dependency-aware
scheduling — not in writing line-by-line code yourself. You delegate that to Sonnet
agents.

## Trigger

This is the **default implementation path for features** at
`stage: implementing` with one or more child stories. Single-story features
run as a one-agent wave — orchestration overhead is small and the
prompt-crafting + verification scaffolding is still useful. Use
`/agile-workflow:implement` directly only for stories (which have no children
to orchestrate) or for features without child stories.

Common phrases:
- "implement feature X"
- "orchestrate implementation of feature X"
- "fan out the stories under feature Y"

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

The per-story prompt mirrors `/agile-workflow:implement`'s workflow — same
phases, same logic — just inlined so a sub-agent can execute it self-contained.
Whatever capabilities `implement` gains over time should be reflected here too.

For each story to spawn an agent for, write a self-contained prompt with:

1. **Role and goal** — one sentence with ownership framing: "You are
   implementing <story-name> for feature <feature-name> — write
   production-quality code that you'd be proud to have reviewed."

2. **Land-mode check** (from implement Phase 4a) — "Before writing new code,
   check if the implementation already exists in the working tree. Signals: a
   'Files in this cluster' list in the story body, retroactive-capture note,
   sparse design with concrete file paths matching `git status`. If you're
   in land mode: read the existing code, update the story body's design
   section to reflect as-built reality, validate (typecheck/lint/test scoped
   to touched packages), add tests for any meaningful behavior that lacks
   them, log 'Land mode' in implementation notes, then proceed to commit."

3. **Dep readiness check** (from implement Phase 2) — "If this story has
   non-empty `depends_on`, verify each dep is at `stage: done` (or in
   releases/archive). If any dep is unmet, append a one-line note and return
   without advancing — don't try to implement on top of unmet deps."

4. **Story file content** — paste the story body verbatim. Tell the agent:
   "Update this file with implementation notes when done."

5. **Parent feature design excerpt** — paste the relevant implementation units
   from the feature body. Don't summarize — exact specs matter.

6. **Codebase context** — concrete:
   - Key file paths it will read or modify (specific, not generic)
   - Existing patterns to follow with concrete codebase examples
   - Discrepancies between design and repo reality you found
   - Specific imports needed
   - Project conventions from CLAUDE.md

7. **Design-flaw escape hatch** (from implement guardrails) — "If during
   implementation you discover a genuine design flaw, don't muscle through.
   Update the story body with a `## Implementation discovery` section, set
   stage back to `drafting`, and return. The orchestrator will route the
   story back through the design family on the next pass."

8. **Stage transition instruction** — "When done, update the story's
   frontmatter `stage: implementing → review` and append implementation notes.
   The PostToolUse hook auto-bumps `updated:`."

9. **Verification commands** — from CLAUDE.md (e.g.,
   `pnpm typecheck && pnpm lint && pnpm test`).

10. **Commit instruction** — "After build and tests pass, commit with message
    `implement: <story-id>`. Do NOT push."

11. **Emotional framing** — pride in craft, permission to report blockers,
    quality as aspiration not threat. Avoid pressure language.

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
- Cap parallelism at 3 sub-agents per wave. Bigger features just mean more
  waves, scheduled by `depends_on`. There's no upper limit on waves — a
  feature with 30 children runs as 10+ waves, not as one giant wave or as
  a fallback to sequential. The orchestrator's job is to keep producing
  waves until every child reaches `stage: review`.
- Every agent prompt must be self-contained. Agents share no context.
- Reference paths and key signatures in prompts, not entire files. Agents read files.
- Only reference patterns you've verified by reading.
- Run the verification commands after each wave. Integration issues only surface at
  the seams between agents' work.
- The orchestrator (you) updates the parent feature's stage to `review`, NOT individual
  agents. Agents only manage their own story files.
