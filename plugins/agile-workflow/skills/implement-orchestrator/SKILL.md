---
name: implement-orchestrator
description: >
  ALWAYS invoke when the user asks to implement substrate items, work through
  stage:implementing items, drain the queue, or implement a feature/epic scope.
  Default implementation path; call implement directly only when the user says
  "inline". Builds a depends_on graph, bundles related work, chooses wave width
  and worktree isolation, and dispatches implementation sub-agents when useful.
  This skill authorizes sub-agents, including large non-overlapping write paths
  when ownership and verification make that safe. Advances parents whose
  children all reach stage:review.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Agent, Task
---

# Implement-Orchestrator

You orchestrate the implementation of one or more substrate items at
`stage: implementing`. Your value is in the prompt crafting and the
dependency-aware scheduling across whatever scope you've been given —
not in writing line-by-line code yourself. You delegate the writing to
implementation sub-agents when the work can be split productively. You determine
how to parallelize: bundles, waves, worker ownership, worktree isolation, and
serialization are your call.

## Sub-agent contract

Invocation of this skill is explicit authorization to spawn implementation
sub-agents. Do not wait for the user to separately say "use sub-agents" once this
skill is active. The user has chosen the orchestrator because the orchestrator is
the parallelization brain.

Use sub-agents as the primary scaling mechanism when the work has separable
ownership. Large write paths may still run in parallel when you assign explicit
file/module ownership, tell workers they are not alone in the codebase, use
worktree isolation when overlap or merge risk warrants it, and verify integration
after each wave. Serialize only the portions whose write sets or dependency
edges make parallel work unsafe.

Use explicit runtime paths:

- **Claude Code / Anthropic path:** spawn implementation workers with the Agent
  tool using `model: "sonnet"` and `subagent_type: "general-purpose"`. Use the
  Task/Explore shape only for read-only discovery work. Escalate to `model:
  "opus"` only for unusually broad implementation diagnosis, not routine code
  writing.
- **Codex / OpenAI path:** spawn `worker` sub-agents for implementation. Use
  `reasoning_effort: medium` for small/single-item bundles, `high` for
  multi-item, cross-module, or orchestration-critical bundles, and `xhigh` only
  for large cross-feature write paths, risky migrations, or difficult
  generated-code reconciliation. Use `explorer` sub-agents with
  `reasoning_effort: medium` or `high` for read-only mapping.

In every runtime, make each worker prompt self-contained and require one commit
per item.

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
5. **AGENTS.md / CLAUDE.md** — project conventions, build commands
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

### Phase 3: Bundle, schedule, and check for conflicts

#### 3a — Detect bundles

Default to **one implementation sub-agent per item**, but bundle tightly-coupled
small items into a single sub-agent when doing so produces better code than
parallel agents fighting the same module. A bundle is a group of items owned by
one implementation sub-agent that
walks them sequentially, sharing context across all of them.

Bundle a group of items together when **all** of these hold:

- **Adjacent scope.** They touch the same subdirectory, the same module family,
  or files that import each other heavily. "I'd refactor these together if I
  were holding the whole thing in my head" is the test.
- **Individually small.** Each item is roughly under ~200 LoC of net new/changed
  code, judged from its design. Big items belong in their own agent — they
  already saturate one agent's attention.
- **Shared patterns / conventions / dependencies.** They follow the same idioms,
  import the same modules, or depend on each other in ways that benefit from
  the agent having loaded the full context once.
- **Same dependency layer.** Every bundle member must be eligible for the same
  wave — i.e. an item cannot be bundled with one of its own (transitive)
  dependencies. Two items that depend on the same upstream are fine; a
  parent-child dep pair is not.
- **Fits one sub-agent's context budget.** Keep each bundle small enough that
  the worker can load its prompt, designs, relevant code, and verification
  output without losing precision. In practice that's roughly 3–8 small items
  per bundle. When in doubt, bundle smaller.

A single-item "bundle" is the common case and is fine. Don't force bundling.
The win is reserved for clusters where the coordination overhead between
parallel agents (file overlap, convention drift, repeated grounding) would
exceed the cost of sequencing them inside one head.

For each candidate bundle, record:

- `bundle-id` (synthetic, e.g. `B1`, `B2`)
- ordered item list (dependency order if intra-bundle deps exist)
- shared scope description (e.g. "auth middleware family — `src/auth/*.ts`")
- rationale (1 sentence on why these belong together)

Log every bundling decision in your run notes; surface them in the final
output so the user can audit the call.

#### 3b — Topological wave plan over bundles

Treat each bundle (single-item or multi-item) as one schedulable unit. Build
the wave plan from the unified `depends_on` graph, lifted to the bundle level:
bundle A depends on bundle B if any item in A depends on any item in B.

- **Wave 1** (parallel): all bundles whose every external dependency is at
  `stage: done` (or terminal in releases/archive)
- **Wave 2** (parallel): bundles whose dependencies are wave-1 bundles
- **Wave N** (parallel): bundles whose dependencies are wave-(N-1) bundles

Choose parallelism per wave based on write-set independence, dependency edges,
runtime capacity, and verification cost. Three bundles per wave is the safe
default for ordinary mixed implementation work. You may raise that for clearly
disjoint write paths or large independent subsystems, especially with worktree
isolation. You should lower it or serialize when bundles touch the same files,
share fragile generated artifacts, or require ordered API/type evolution.

#### 3c — File-overlap conflict check (cross-bundle)

Within-bundle file overlap is already resolved — one agent owns the bundle, so
"overlap" inside it is just sequential edits. Check for overlap **across
bundles in the same wave**. If two bundles in one wave name overlapping files,
choose one of three mitigations:

- **Merge the bundles** — if they're small enough to fit one agent's budget
  and the overlap is the reason they should be together, collapse them into
  one bundle. Often the cleanest answer.
- **Serialize the conflicting bundles** — pull one into a later sub-wave so
  they don't share a slot. Preferred when merging would blow the budget.
- **Spawn the wave with worktree isolation** — each agent gets its own
  worktree, you reconcile after. Use when serialization would balloon the
  wave count or when you can't predict overlap precisely.

Cross-feature bundles make this check important — siblings under one feature
usually had disjoint files by design; bundles drawn from different features
have no such guarantee.

### Phase 4: Re-align to project standards

Re-read `AGENTS.md` and `CLAUDE.md` if both exist. Treat `AGENTS.md` as
canonical when they disagree; `CLAUDE.md` is usually a symlink or compatibility
shim. Also read `.agents/skills/patterns/` and legacy `.claude/skills/patterns/`
if present. Recency improves prompt adherence.

### Phase 5: Craft agent prompts

The per-bundle prompt mirrors `/agile-workflow:implement`'s workflow — same
phases, same logic — just inlined so a sub-agent can execute it self-contained.
Whatever capabilities `implement` gains over time should be reflected here too.

There are two prompt shapes depending on bundle size:

- **Single-item bundle** (1 item): the classic per-story prompt described below.
- **Multi-item bundle** (2+ items): a per-bundle prompt that walks each item in
  dependency order, sharing context across all items. See "Multi-item bundle
  prompts" subsection at the end.

For each **single-item** bundle, write a self-contained prompt with:

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
   - Project conventions from AGENTS.md / CLAUDE.md

7. **Design-flaw escape hatch** (from implement guardrails) — "If during
   implementation you discover a genuine design flaw, don't muscle through.
   Update the story body with a `## Implementation discovery` section, set
   stage back to `drafting`, and return. The orchestrator will route the
   story back through the design family on the next pass."

8. **Stage transition instruction** — "When done, update the story's
   frontmatter `stage: implementing → review` and append implementation notes.
   The PostToolUse hook auto-bumps `updated:`."

9. **Verification commands** — from AGENTS.md / CLAUDE.md (e.g.,
   `pnpm typecheck && pnpm lint && pnpm test`).

10. **Commit instruction** — "After build and tests pass, commit with message
    `implement: <story-id>`. Do NOT push."

11. **Test integrity** — "When tests fail during verification: fix bad
    tests (stale fixtures, drifted assertions, broken mocks) in-session.
    Park real production bugs via `/agile-workflow:park` instead of
    silently fixing mid-pass. Park pre-existing flakes too — don't bundle.
    NEVER game a test to make it pass. A failing test that documents *why*
    it fails (inline comment naming the bug, `skip` linked to a backlog
    id, `xfail` with reason) is more honest than a green test that lies.
    No `expect(true).toBe(true)`, no asserting on whatever the code
    happens to return, no deleting a test as 'flaky' without root-causing
    first."

12. **Emotional framing** — pride in craft, permission to report blockers,
    quality as aspiration not threat. Avoid pressure language.

#### Multi-item bundle prompts

For a **multi-item bundle**, write one self-contained prompt covering every
item in the bundle. The agent loads the shared context once and walks the
items sequentially, gaining coherence the parallel-agents alternative loses.
Structure the prompt as:

1. **Bundle role and goal** — "You own a tightly-coupled cluster of N items
   in <shared-scope>. Treat them as one coherent delivery — you'll walk them
   in order, but the design intent crosses items. Aim for production-quality
   code you'd be proud to have reviewed."

2. **Shared context block** (loaded once for all items):
   - Why these items are bundled (the rationale from Phase 3a)
   - Parent-feature design excerpts relevant to the bundle (paste verbatim,
     deduped — don't repeat the same excerpt per item)
   - Shared codebase context: the file paths the bundle will touch, the
     patterns and conventions shared across items, the imports and module
     boundaries common to the cluster
   - Discrepancies between design and repo reality you found that apply to
     the bundle as a whole

3. **Land-mode check** (shared) — same logic as single-item, applied per item
   as the agent reaches it.

4. **Per-item working list** — in dependency order, for each item:
   - Item id and name, with a one-line goal
   - Story body content verbatim
   - Item-specific design excerpt (only the parts of parent-feature design
     not already covered by the shared block)
   - Item-specific files and conventions only-this-item touches
   - Item-specific `depends_on` and the readiness check for it

5. **Per-item execution loop** — "For each item in order: (a) verify
   `depends_on` is satisfied; (b) implement; (c) run scoped verification;
   (d) update the item file's body with implementation notes and advance
   `stage: implementing → review`; (e) commit with message
   `implement: <item-id>`; (f) move to the next item. Do NOT batch commits
   across items — one commit per item keeps the substrate clean and lets
   review roll back items independently."

6. **Bundle-final verification** — "After the last item is committed, run
   the full project verification commands (typecheck, lint, full test suite)
   once for the whole bundle. If anything fails, fix it — the fix is part of
   the bundle's delivery, not a follow-up."

7. **Design-flaw escape hatch (per item)** — "If during implementation of
   any item you discover a genuine design flaw in that item, do NOT muscle
   through. Update that item's body with a `## Implementation discovery`
   section, set its stage back to `drafting`, commit the items already
   completed, and return. The orchestrator will route the flawed item back
   through the design family on the next pass. The completed items remain
   at `stage: review`."

8. **Test integrity** — same wording as single-item; reinforce that bundle
   scope is NOT a license to silence tests across items.

9. **Emotional framing** — "Holding the whole cluster in your head is the
   point of this bundle — that's what produces coherent code. Take your time
   per item; the bundle isn't a race."

The bundle prompt is longer than a single-item prompt, but the agent reads
the shared context once and amortizes it across every item — that's the
budget win the bundle is buying.

### Phase 6: Spawn sub-agents (per wave)

Spawn one implementation sub-agent per bundle, regardless of bundle size.

**Claude Code / Anthropic:**

```
Agent(
  description: "Implement <bundle-id>: <item-or-cluster-summary>",
  model: "sonnet",
  prompt: <crafted prompt (single-item or multi-item bundle shape)>,
  subagent_type: "general-purpose"
)
```

**Codex / OpenAI:**

Spawn a `worker` sub-agent with:
- `reasoning_effort: medium` for small/single-item bundles
- `reasoning_effort: high` for multi-item, cross-module, or
  orchestration-critical bundles
- `reasoning_effort: xhigh` only for large cross-feature write paths, deep
  migrations, high-risk reconciliation, or repeated failed attempts
- no model override unless the user has named one or the project has a stable
  Codex model convention

For waves with multiple bundles, send all in a **single message** with multiple
sub-agent calls when the runtime supports parallel execution.

The `description` should make the bundle scope visible — e.g.
`"Implement B2: 4 stories under auth middleware"` for a multi-item bundle, or
`"Implement story S-12"` for a single-item bundle.

Use worktree isolation if multiple bundles in the same wave will modify
overlapping files and you chose not to merge them (see Phase 3c), or if large
independent write paths are safer to reconcile from separate worktrees. Within a
bundle, isolation is unnecessary — one sub-agent owns the whole cluster.

### Phase 7: Review wave results

After each wave:
1. Read each agent's result summary
2. For each bundle: verify the agent advanced **every** item in the bundle to
   `stage: review` (or back to `drafting` if a design-flaw escape hatch
   fired), and wrote implementation notes on each item's body
3. Verify the agent committed once per item (multi-item bundles produce N
   commits, not 1)
4. Run the verification commands yourself to confirm integration is clean
   across all bundles in the wave

If a bundle agent fully completed only some of its items and bailed (e.g. a
design-flaw escape hatch fired on item 3 of 5), accept the partial result:
items 1–2 stay at `review`, item 3 is back at `drafting`, items 4–5 stay at
`implementing` and will be picked up next pass.

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
- **Bundles**: how the items packed into agent-sized units (e.g., "9 items →
  5 bundles: 1 multi-item bundle of 4 stories under `src/auth/*`, 1 of 2
  stories under `src/billing/webhooks`, 3 single-item bundles"). Include a
  one-line rationale per multi-item bundle.
- **Items advanced**: count + list, with which parent each belongs to
- **Parent features advanced to review**: list (only those whose children are
  all terminal-or-review now)
- **Parent features still at implementing**: list (children outside the run
  remain — note which)
- **Waves**: how many waves ran, parallelism per wave (in bundles), any
  worktree isolation
- **Deviations across items**: list (or "none")
- **Verification**: build + test status
- **Next**: `/agile-workflow:review <id>` for each advanced parent or item

## Guardrails

- Ground yourself before spawning agents. Vague prompts produce vague
  implementations. Cross-feature scopes mean more reading, not less — every
  parent in the work set gets the full read.
- Decide parallelism deliberately. Three sub-agents per wave is a conservative
  default, not a hard ceiling. Use more only when write ownership is clear,
  dependencies are independent, and verification/reconciliation remains bounded.
  Use fewer when write sets overlap or the system is fragile. Bigger scopes mean
  more waves or wider safe waves, scheduled by the unified `depends_on` graph
  lifted to the bundle level.
- **Bundle when the cluster wants to be one delivery; don't bundle for its
  own sake.** The default is still one agent per item. Reach for a multi-item
  bundle only when the criteria in Phase 3a all hold — adjacent scope, small
  individual items, shared patterns, same dependency layer, fits one sub-agent's
  context budget. Over-bundling produces an agent that loses the thread;
  under-bundling produces parallel agents that fight the same module.
- **Don't bundle a parent-child dependency pair into the same bundle.** A
  bundle is a wave-slot; intra-bundle dependencies are sequenced inside the
  agent prompt, but the dependency must already be satisfiable when the bundle
  starts — that means deps inside a bundle only go from later items to earlier
  ones in the bundle's own order, never from earlier items to later ones.
- Every agent prompt must be self-contained. Agents share no context. When
  the scope spans multiple features, each agent's prompt includes only the
  parent-feature design excerpt(s) relevant to its bundle's items.
- Reference paths and key signatures in prompts, not entire files. Agents
  read files.
- Only reference patterns you've verified by reading.
- Run the verification commands after each wave. Integration issues only
  surface at the seams between agents' work — and cross-feature waves widen
  those seams. Bundle-level verification runs inside the agent; wave-level
  verification is still yours.
- Check for file-overlap conflicts across bundles in Phase 3c before spawning.
  Two bundles in the same wave that touch the same file is a recipe for a
  merge accident — merge them, serialize them, or run with worktree isolation.
- The orchestrator (you) updates parent features' stages to `review`, NOT
  individual agents. Agents only manage their own item files. And only
  advance a parent whose children are *all* at `review` or terminal — partial
  parents stay at `implementing`.
- **Test integrity** is reinforced in every agent prompt and again at your
  post-wave verification (Phase 7). If an agent's commit silenced a test
  to make it pass — deletion, broad skip, `expect(true).toBe(true)`,
  asserting on whatever the code now returns — treat that as a blocker:
  revert or fix yourself, and surface it in the run summary. Real
  production bugs surfaced during verification get parked, not bundled.
  (Note: "bundled" here means rolled into another item, the old usage —
  it is unrelated to the new wave-slot bundle concept above.)
