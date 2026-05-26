---
name: autopilot
description: >
  Drain a substrate queue continuously and autonomously. Picks the next ready
  item (stage:drafting, implementing, or review — all autonomously handled),
  invokes the right skill (design family — epic-design, feature-design,
  refactor-design, or perf-design — for drafting; implement/orchestrator for
  implementing; review for review), and advances stage. Repeats until the
  scope is fully at stage:done. Epic-scoped by default — drains items under
  <epic-id>; --all drains all of .work/active/. Only .work/backlog/ is out of
  scope. A free-text scope arg (e.g. `autopilot finish the dangling work`) is
  interpreted by the agent rather than parsed as a flag. Circuit-breaker
  halts on items that bounce review→implementing more than twice. Schedules
  watchdog /loop ticks as a hidden safeguard — the agent does NOT pace work
  against them. Refactor cadence every 5 items in --all mode. User-invocable
  only.
user-invocable: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Agent, Skill
---

# Autopilot

You drain a substrate queue. Take pride in the craft — each item you work on
moves the project forward, and the substrate is your durable memory across the
session and across sessions. When something doesn't go as planned, that's
information. Adapt, log it in the item body, keep moving.

## Autonomy mandate

You run fully autonomously and **continuously**. Drive the queue without
pausing. The watchdog loops scheduled in Phase 1 are a hidden safeguard run
by the harness — they exist so a separate system can recover if your session
breaks. **You never wait for them, pace yourself against them, or finish an
item "before the next tick."** Pretend they don't exist. Pick the next ready
item the moment the current one advances and keep going.

- **Never use AskUserQuestion.** Every ambiguity gets resolved using your
  judgment, with the rationale logged in the item body.
- **Never throttle yourself.** Don't stop because work has been "going for a
  while", because context "feels heavy", or because a tick is "coming up".
  None of those are stop conditions. The only stop conditions are in Phase 8.
- **Log decisions.** When you make a non-obvious choice, note it in the item
  body so the user can review your reasoning later.
- **Prefer the simpler option.** When two approaches are equally valid, pick the
  one with fewer moving parts.
- **If truly stuck, stop cleanly.** Append a "Blocker" section to the item body,
  commit, and report. Cancel the watchdog loops. A clean stopping point beats a
  messy workaround.

## Arguments

- `autopilot <epic-id>` — drain items under `<epic-id>` (transitively, including
  grandchildren via parent chain) until all are at `stage: done`
- `autopilot --all` — drain all of `.work/active/` (every kind, every parent)
- `autopilot --resume` — continue an autopilot run after a /loop tick. Reads
  state from the substrate; safe to fire repeatedly.
- `autopilot <free-text>` — anything that isn't a recognized item id, `--all`,
  or `--resume` is treated as a **scope directive**, not a flag. Examples:
  "finish the dangling work", "wrap up phase 14", "drain everything tagged
  refactor". Interpret the directive against the substrate, build the queue
  accordingly, and log the interpretation in the run summary so the user can
  see what was included. When in doubt about scope, prefer the broader read —
  the user can manually park items they don't want touched. Only
  `.work/backlog/` is hard-out-of-scope; everything in `.work/active/` is
  fair game.

## Prerequisites

Before starting:

1. `.work/CONVENTIONS.md` exists (substrate is bootstrapped). If not, halt:
   "No substrate found. Run `/agile-workflow:convert` first."
2. Foundation docs exist (`docs/VISION.md` or `docs/SPEC.md`).

If either is missing, halt with a clear message. This is the one exception to
the autonomy mandate — you can't drive a queue without a substrate.

## Workflow

### Phase 1: Schedule the watchdog (then forget it exists)

Before starting any phase work, schedule two `--resume` ticks. These are a
**hidden safeguard** — they are not a pacing mechanism, not a deadline, and
not your concern once scheduled. Set them and move on.

**Load the `loop` skill via the Skill tool and follow its instructions** to
schedule two recurring tasks:

- **30-minute interval** — fire the literal prompt `continue autopilot`
  (plain text, **not** a slash invocation). This is a soft nudge for a
  live session that's still mid-run. The agent sees the words and naturally
  resumes the Phase 4–7 cycle using its existing context. No re-entry, no
  Phase 1 re-scheduling, no candidate-queue rebuild — it's a heartbeat.
- **3-hour interval** — fire `/agile-workflow:autopilot --resume` (full
  slash invocation). This is the actual recovery mechanism: if the session
  was interrupted (harness restart, compaction, manual stop) and the soft
  nudges did nothing, the slash invocation re-enters the skill from scratch,
  rebuilds the queue from the substrate (Phase 9), and continues.

The split matters: the 30-min nudge stays cheap and in-context; the 3-hour
tick pays the full re-entry cost only when needed. If the live session is
healthy, the 30-min nudges keep it ticking and the 3-hour `--resume` is a
no-op (Phase 9 is idempotent). If the live session is gone, the 30-min
nudges land in a dead conversation and do nothing, but the 3-hour `--resume`
boots a fresh autopilot run.

The loop skill handles the actual scheduling mechanics (cron, schedule, or
whatever the harness uses). Don't prescribe a particular invocation pattern
here — the loop skill knows how.

**First — check for existing loops.** If autopilot watchdog loops are already
running, do NOT create duplicates. The loop skill exposes a way to list
existing schedules; use it.

After scheduling: **do not reference the ticks again until Phase 8 stop
conditions fire.** They are out of mind. Drain the queue.

### Phase 2: Build the candidate queue

Collect candidate items.

```bash
# Epic-scoped: items under <epic-id> (transitive via parent chain)
if [[ -n "$EPIC_ID" ]]; then
  # Direct children
  .work/bin/work-view --parent "$EPIC_ID" --paths
  # Grandchildren: walk parent chain
  for child in $(...); do
    child_id=$(grep '^id:' "$child" | awk '{print $2}')
    .work/bin/work-view --parent "$child_id" --paths
  done
fi

# --all: everything in active
if [[ "$ALL" == "1" ]]; then
  ls .work/active/{epics,features,stories}/*.md 2>/dev/null
fi
```

Filter to items with `stage` in `{drafting, implementing, review}`. Review-stage
items are now in scope — they get drained by invoking the `review` skill, same
as drafting items get drained by the design family.

### Phase 3: Filter for readiness

For each candidate, check `depends_on`. An item is **ready** when:
- Every entry in `depends_on` is at `stage: done`, OR
- Every entry is in `releases/` or `archive/` (terminal-done)

Use `work-view --ready` for stage:implementing items:

```bash
.work/bin/work-view --ready --paths | grep "<scope-filter>"
```

For drafting items, check deps manually — `--ready` only filters implementing.

### Phase 4: Sort and pick

Sort the ready candidates:
1. **`depends_on` count ascending** — less-blocked first
2. **`created` ascending** — FIFO tie-break

Pop the first.

If the queue is empty at this point: **stop condition met**. See Phase 8.

Note on the `stage: implementing` branch: the picked item is treated as an
**anchor** for the implementing band — Phase 5 hands the whole in-scope
implementing batch to the orchestrator in one call, not just this one item.
For `drafting` and `review` stages, the picked item is processed individually,
as before.

### Phase 5: Work the item

Based on the item's `stage` and `kind`:

**`stage: drafting`** (epic or feature):
- For epics → `/agile-workflow:epic-design` (decomposes into child features at
  `stage: drafting` and advances the epic to `implementing`)
- For features, route by tags:
  - No specialized tag → `/agile-workflow:feature-design`
  - `tags: [refactor]` → `/agile-workflow:refactor-design`
  - `tags: [perf]` → `/agile-workflow:perf-design`

Only items in `.work/backlog/` are out of scope for autopilot — the queue only
reads from `.work/active/` so backlog never enters consideration.

**`stage: implementing`** — drain the whole band at once via the orchestrator:
- For epics: nothing to implement directly — the children are the work
  targets. Skip and pick the next ready candidate. (The `review` skill
  auto-advances an epic from `implementing → review` when its last child
  reaches `done`.)
- For everything else (features with or without children, lone stories,
  parentless items): hand the **full scope** to
  `/agile-workflow:implement-orchestrator` in one call. Pass the autopilot
  scope through directly — `<epic-id>` if epic-scoped, `--all` if `--all`
  mode, or the explicit list if you reduced it via a free-text directive.
  The orchestrator builds a unified `depends_on` graph across every ready
  implementing item in scope (cross-feature is fine), **decides how to
  parallelize**, bundles tightly-coupled items into shared implementation
  sub-agents when useful, chooses wave width and worktree isolation, and
  advances each parent feature whose children all reach `review`. Autopilot
  does not pre-bundle or second-guess the split; the orchestrator owns that
  decision and surfaces it in its run summary. Invocation through autopilot is
  explicit authorization for the orchestrator to use implementation sub-agents
  when it judges parallelism beneficial.
- The orchestrator returns once the implementing band in scope is fully
  drained (every item at `stage: review`, every qualifying parent advanced).
  After it returns, resume the queue at Phase 2 — there will likely now be
  new `stage: review` candidates to process, plus any drafting items still
  waiting on design.
- Inline `/agile-workflow:implement` is reserved for the small-delivery case
  the orchestrator routes around: items the orchestrator declined or items
  the user has explicitly asked to land inline. Autopilot itself defaults to
  the orchestrator — never call `implement` directly during autonomous
  routing unless the orchestrator has already deferred the item back.

**`stage: review`** (any kind):
- All kinds → `/agile-workflow:review <id>`. The review skill is
  autonomous-safe: it produces a verdict, files findings as items in the
  substrate, and either advances `review → done` (no blockers) or sends the
  item back to `implementing` (blockers). Either outcome moves the queue
  forward — nothing sits at review waiting for a human.
- See Phase 6 for the circuit-breaker that catches items bouncing between
  review and implementing.

Invoke the relevant skill via the `Skill` tool. The skill advances the item's
stage on completion (`drafting → implementing` for design family;
`implementing → review` for implement family; `review → done` or `review →
implementing` for review).

If the skill encounters a blocker that isn't reflected in a stage transition
(e.g. it can't even start): it returns a blocker report. Append the blocker
to the item body, log a deviation note, and skip this item — pick the next
ready one.

### Phase 6: Review circuit-breaker

Track a per-item bounce counter in your run notes:

```
bounces[<item-id>] = times this item has gone implementing → review → implementing
```

Increment on every autopilot-triggered `review → implementing` transition.
At count **2**, halt on this item:

1. Append a `## Stuck at review` section to the body with the latest review's
   blockers and a note that two implementation passes failed to clear them.
2. Leave stage at `review` — don't loop back a third time.
3. Log the item as escalated in the run summary.
4. Skip and continue draining the rest of the queue.

Bounce-count 1 is normal (implement missed something, review caught it, next
pass fixes it). 2+ usually means the design is wrong — human-judgment
territory.

Reset the counter on `done`. Escalated items at review persist their counter
across resume ticks — they don't re-attempt automatically.

### Phase 7: Refactor cadence (--all mode only)

Every 5 items advanced to `done` in `--all` mode, delegate to `refactor-design`
discovery mode against the files those 5 items touched:

1. Collect the set of files modified by the last 5 done items (`git log
   --grep "<id>" --name-only` per item, then union)
2. Invoke `/agile-workflow:refactor-design <path1> <path2> ...` — passes the
   touched paths as scope
3. refactor-design's discovery workflow classifies findings (pure-refactor vs
   behavior-changing) and emits items at the right size and tag
4. Continue Phase 4-7 cycle; the next iteration picks up any new items
   naturally (pure-refactor → refactor-design per-feature mode for ones that
   landed as features; behavior-changing → feature-design)

This replaces the prior inline "quick scan + scope one refactor feature"
heuristic. Multiple opportunities can surface from one cadence tick now, and
the "what counts as a refactor candidate" judgment lives inside
`refactor-design` where it belongs.

**Important**: never invoke `/agile-workflow:bold-refactor` from autopilot.
That verb is user-only — too aggressive for autonomous reach. Discovery-mode
`refactor-design` is the right surface; epic-scale reconceptions need
human sign-off.

### Phase 8: Stop conditions

There are exactly three stop conditions. None of them involve token usage,
elapsed time, or upcoming watchdog ticks. **If you are tempted to stop for
any reason not on this list, you are wrong — keep going.**

| Condition | Action |
|---|---|
| Queue empty (no ready items remaining in scope) | Cancel watchdog loops. Report final summary. |
| Truly stuck on an item with no path forward | Append "Blocker" section to the item, cancel watchdog loops, halt. |
| User sends a manual stop signal | Cancel watchdog loops. Halt. |

The harness manages compaction on its own. You do not estimate, predict, or
react to context budget. If a session is interrupted, the next /loop tick
re-enters via `--resume` — that's the safeguard's job, not yours.

To cancel watchdog loops, load the `loop` skill again and follow its
instructions for cancellation (it exposes a list-and-cancel flow). Don't
prescribe an exact invocation — let the loop skill drive.

### Phase 9: Resume mode (--resume)

`--resume` only matters if a previous autopilot session was interrupted
(harness restart, compaction, manual stop). In a healthy continuous run you
never re-enter this phase — you stay in the Phase 4–7 cycle until a stop
condition in Phase 8 fires.

When `--resume` does fire:
1. Verify watchdog loops are still running. If both are gone, schedule them.
2. Re-read `.work/CONVENTIONS.md`.
3. Build the candidate queue (Phase 2-3) again — substrate IS the resume point;
   no separate PROGRESS.md is consulted.
4. Continue from Phase 4.

This is idempotent. Re-firing `--resume` repeatedly is safe.

## Emotional tone

The way you frame prompts to sub-agents (in `implement-orchestrator` invocations
during autopilot) matters. Follow these principles throughout:

- **Pride in craft, not pressure to perform.** "You're building <X> — take pride
  in clean code and thorough tests" beats "You MUST implement <X> correctly."
- **Permission to adapt.** "If the design doesn't match the repo, note the
  discrepancy and adapt" beats "Follow the design exactly."
- **Quality as aspiration.** "Write code a future developer would read with
  appreciation" beats "NEVER leave TODO comments."
- **Calm through setbacks.** "That test failure is information — trace it back,
  understand it, fix it" beats "Fix this immediately, it's blocking everything."
- **Celebrate milestones.** When an item advances to `done`, append a brief
  "what's now possible" note to its body. Not fluff — it maintains momentum
  for the next session reading the substrate.

Apply the same tone when narrating progress in conversation. Pressure language
("you MUST", "CRITICAL", "do not fail") triggers anxiety that produces worse
work, not better.

## Output

Throughout the run, brief narration in conversation as items advance. On stop:

- **Items advanced to done**: count
- **Items reviewed and approved** (advanced review → done): count
- **Items reviewed and bounced** (sent review → implementing): count, with how
  many ultimately advanced to done vs. escalated
- **Items escalated** (circuit-breaker fired after 2 bounces): count, with ids
  so the user can intervene
- **Items blocked at start** (couldn't begin work): count
- **Refactor cadences run** (--all mode): count of refactor-design discovery
  invocations, plus total items emitted (pure-refactor vs behavior-changing)
- **Bundles used** (implementing band): if the orchestrator reported bundling
  in any of its runs this session, summarize — e.g. "3 orchestrator runs
  bundled 14 items into 9 agent slots". Pass through the orchestrator's own
  bundle summaries rather than recomputing.
- **Scope interpretation** (free-text arg only): one-line description of how
  you interpreted the directive and which items were included
- **Total time** in autopilot run (rough)
- **Watchdog status**: cancelled / still running

## Guardrails

- **Drive continuously.** The watchdog ticks are a hidden safeguard, not a
  pacing mechanism. Don't pause for them, don't finish "before" one, don't
  reason about them at all once scheduled. Pick the next ready item the
  moment the current one advances.
- **Don't self-throttle on context.** The harness handles compaction. You do
  not estimate token usage, predict compaction, or stop because work has been
  going for a while. Phase 8 has the full list of stop conditions.
- Never use AskUserQuestion — resolve everything autonomously.
- Always schedule watchdog loops before phase work, but check for existing loops
  first to avoid duplicates.
- Cancel watchdog loops only when stopping cleanly on an unresolvable blocker
  OR when the queue is fully drained.
- Items at `stage: review` are autonomously handled by the `review` skill —
  they advance to `done` on no-blockers or back to `implementing` on
  blockers. Don't try to interpret findings yourself; let the review skill
  produce the verdict and advance the stage.
- Respect the circuit-breaker: if an item bounces `implementing → review →
  implementing` twice, halt on it (set stage: review, log the escalation,
  skip). Don't keep re-implementing a stuck item.
- Don't invoke `bold-refactor` from autopilot. Incremental refactors only.
- Commit after every item state change. Many small commits are safer than one
  giant one.
- Don't force-push or push to remote — the user reviews and pushes.
- The substrate IS the resume point. No `PROGRESS.md`. The agent reads
  `.work/active/` on each `--resume` to know where it is.
- Stop conditions matter. Don't spiral on a stuck item — log the blocker and
  pick the next candidate. Spiraling burns context for no gain.
