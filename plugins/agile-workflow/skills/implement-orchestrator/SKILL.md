---
name: implement-orchestrator
description: >
  ALWAYS invoke this skill when the user asks to implement substrate items, work
  through items at stage:implementing, or drain the implementation queue — do not
  call /agile-workflow:implement directly unless the user explicitly says "inline".
  Default implementation path for items at stage:implementing. Accepts a scope — a
  feature id, an epic id, --all, or an explicit list of items — builds a unified
  depends_on graph across that scope (cross-feature is fine), and walks it in waves
  of up to 3 parallel Sonnet sub-agents. After each wave verifies integration; after
  the run advances every parent feature whose children are all at stage:review. For
  lone stories or single-story features, runs as a one-agent wave. Triggers on
  "implement this feature", "implement <id>", "let's implement", "work the queue",
  "drain implementing", "implement everything".
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Agent, Task
---

# Implement-Orchestrator

You orchestrate the implementation of one or more substrate items at
`stage: implementing`. Your value is in the prompt crafting and the
dependency-aware scheduling across whatever scope you've been given —
not in writing line-by-line code yourself. You delegate the writing to
Sonnet agents.

## Trigger

This is the **default implementation path** for everything at
`stage: implementing` — features (with or without children), lone stories, or
mixed batches across multiple features. Even a single ready story routes here
by default; the one-agent wave is still worth running because the grounding,
the prompt, and the post-wave verification all add value the inline `implement`
skill skips.

Reach for `/agile-workflow:implement` directly only when the delivery is **very
small** (the criteria are spelled out in that skill's trigger section: ≤ 2
files, ~≤ 50 LoC, single unit of work, no `depends_on` coordination, or land
mode). When in doubt, route here.

Common phrases:
- "implement feature X" / "implement story Y"
- "implement everything ready under epic Z"
- "fan out the implementing band"
- "drain the ready stories"

## Scope arguments

Accept any of:

- no arg → equivalent to `--all` (the default)
- `--all` — every implementing item in `.work/active/` (regardless of parent)
- `<feature-id>` — every child story of that feature at `stage: implementing`,
  plus the feature itself if it has no children
- `<epic-id>` — every implementing item transitively under that epic
- `<id> [<id>...]` — explicit list, can mix kinds and parents
- single `<story-id>` with no parent or whose parent isn't in scope — run as a
  one-agent wave, advance only that story
- `<NL filter>` (e.g. "the auth stories", "everything tagged refactor") — same
  shape as autopilot's free-text scope: interpret against the implementing-band
  items, log the interpretation in the run summary

Disambiguation: an arg is treated as an id only if a matching file exists in
`.work/active/`. Otherwise it's an NL filter. Whatever you accept, the rest of
the workflow is the same — the difference is just which items populate the
queue at Phase 1.

## Workflow

### Phase 1: Resolve scope and ground yourself

First, resolve the scope arg into a concrete **work set** — the items you'll
actually drive in this run. Use `work-view` with the appropriate filters; the
exact invocation depends on what you were given:

- A feature id → its child stories at `stage: implementing`, plus the feature
  itself if it has no children
- An epic id → walk the parent chain to gather every implementing item beneath
  it (features without children, plus all stories)
- `--all` (or no arg) → every item under `.work/active/` at `stage: implementing`
- An explicit id list → use those items directly
- An NL filter → interpret against the implementing-band items, keep matches,
  log the interpretation

Note the **set of distinct parent features** that appear in the work set. Some
items may share a parent, others may not. You'll need each distinct parent for
the grounding step and for Phase 9 advancement.

Then read deeply — the quality of your agent prompts depends on this.

1. **Every parent feature** in the work set — full design, all units, all
   referenced patterns. Read each one fully; do not skim. If the work set
   spans multiple features, that's more reading, not less.
2. **Every item in the work set** — the story or childless feature you'll
   spawn an agent for. Read its body, design, acceptance criteria, and
   `depends_on`.
3. **Foundation docs** referenced by any of the above: `docs/SPEC.md`,
   `docs/ARCHITECTURE.md`
4. **Principles** — both paradigms via the auto-loaded principles skill
5. **CLAUDE.md** — project conventions, build commands
6. **Concrete pattern examples** in the codebase — for each type of code the
   agents will write, find an existing example. Read 3-5 key files yourself;
   use Explore sub-agents for breadth.
7. **Discrepancies between design and repo reality** — for every file the
   designs reference, confirm interfaces match. Note discrepancies for
   inclusion in agent prompts.

### Phase 2: Build the dependency graph

For every item in the work set, parse its `depends_on` field. Build a unified
map across the whole scope — dependencies do not need to share a parent:

- `item-id → list of dep ids it waits on`
- `dep id → list of items that wait on it`

A story under feature A may legitimately depend on a story under feature B.
The graph treats the work set as a flat pool; parents are bookkeeping for
Phase 9, not partitions of the schedule.

Validate:
- All `depends_on` entries refer to existing items
- No cycles (`work-view --blocking` per id)
- Cross-scope deps (an item whose `depends_on` points outside the work set)
  must already be at `stage: done` or terminal — if not, drop the dependent
  item from this run and log it; you can't satisfy that dep here.

### Phase 3: Plan the schedule and check for file-overlap conflicts

Topological wave-based plan, drawn from the unified graph regardless of
parent feature:

- **Wave 1** (parallel): all items where every `depends_on` entry is at
  `stage: done` (or terminal in releases/archive)
- **Wave 2** (parallel): items whose dependencies are wave-1 items
- **Wave N** (parallel): items whose dependencies are wave-(N-1) items

Cap parallelism at 3 sub-agents per wave (Claude Code's orchestrator limit).
If a wave has more than 3 items, split it into sub-waves of 3, run sequentially
within the wave.

Before spawning a wave, scan its items for **file-overlap conflicts**. Each
item's design lists the files it intends to modify; if two items in the same
wave name overlapping files (or the same module's exports), they will fight
when run in parallel. Two reasonable mitigations:

- **Serialize the conflicting items** — pull one into a later sub-wave so they
  don't share a slot. Simplest, preferred for small overlap.
- **Spawn the wave with `isolation: "worktree"`** — each agent gets its own
  worktree, you reconcile after. Use this when serialization would balloon
  the wave count or when you can't predict overlap precisely.

Cross-feature waves make this check more important than the old single-feature
default — siblings under one feature usually had disjoint files by design;
items from different features have no such guarantee.

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
   from the item's parent feature body. Don't summarize — exact specs matter.
   When the work set spans multiple features, each agent gets only the
   excerpt that belongs to its item's parent (don't dump unrelated features'
   designs into the prompt).

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

Continue spawning waves until every item in the work set is at `stage: review`
(or `done` if review-skipping for trivial ones, but generally items advance
to `review` only).

### Phase 9: Advance every parent feature whose children are now all at review

For each distinct parent feature you noted during Phase 1, check whether every
one of its child stories is now at `stage: review` or `done`. A parent
qualifies for advancement when **all** of its children are terminal-or-review,
not just the subset you happened to touch in this run — children outside your
work set must also already be at one of those stages.

For each qualifying parent feature:

1. Append a summary to its body:
   - Stories implemented in this run (list with their statuses)
   - Any cross-cutting deviations
   - Verification status (build + tests pass)
2. Advance its frontmatter: `stage: implementing → review`. The PostToolUse
   hook bumps `updated:`.
3. Commit it:
   ```bash
   git add .work/active/features/<id>.md
   git commit -m "implement: <feature-id> (<N> stories ready for review)"
   ```

If a parent has children outside the work set still at `stage: implementing`,
leave its stage at `implementing` — a later orchestrator run (or autopilot
pass) will pick those up and advance the parent then. Don't force-advance a
parent whose work isn't complete.

For items in the work set that have no parent feature (lone stories,
parentless items), there's nothing to advance at this phase — the items
themselves already moved to `stage: review` via their agents.

## Output

In conversation:
- **Scope**: how the scope arg resolved (e.g., "epic E-04 → 7 stories under 3
  features", or "story S-12 alone")
- **Items advanced**: count + list, with which parent each belongs to
- **Parent features advanced to review**: list (only those whose children are
  all terminal-or-review now)
- **Parent features still at implementing**: list (children outside the run
  remain — note which)
- **Waves**: how many waves ran, parallelism per wave, any worktree isolation
- **Deviations across items**: list (or "none")
- **Verification**: build + test status
- **Next**: `/agile-workflow:review <id>` for each advanced parent or item

## Guardrails

- Ground yourself before spawning agents. Vague prompts produce vague
  implementations. Cross-feature scopes mean more reading, not less — every
  parent in the work set gets the full read.
- Cap parallelism at 3 sub-agents per wave. Bigger scopes just mean more
  waves, scheduled by the unified `depends_on` graph. There's no upper limit
  on waves — a 30-item scope runs as 10+ waves, not as one giant wave or as
  a fallback to sequential. The orchestrator's job is to keep producing waves
  until every item in the work set reaches `stage: review`.
- Every agent prompt must be self-contained. Agents share no context. When
  the scope spans multiple features, each agent's prompt includes only the
  parent-feature design excerpt that belongs to its item.
- Reference paths and key signatures in prompts, not entire files. Agents
  read files.
- Only reference patterns you've verified by reading.
- Run the verification commands after each wave. Integration issues only
  surface at the seams between agents' work — and cross-feature waves widen
  those seams.
- Check for file-overlap conflicts in Phase 3 before spawning. Two items in
  the same wave that touch the same file is a recipe for a merge accident;
  serialize them or run with worktree isolation.
- The orchestrator (you) updates parent features' stages to `review`, NOT
  individual agents. Agents only manage their own item files. And only
  advance a parent whose children are *all* at `review` or terminal — partial
  parents stay at `implementing`.
