---
name: autopilot
description: >
  Drain a substrate queue autonomously. Picks the next ready item (stage:implementing
  or drafting with all depends_on at done), invokes the right skill (design family
  for drafting, implement/orchestrator for implementing), advances stage, repeats.
  Epic-scoped by default — drains items under <epic-id>; --all drains all of
  .work/active/. Spawns watchdog /loop tasks (30m nudge + 3h re-engagement) so
  the session survives compaction. Refactor cadence every 5 items in --all mode.
  User-invocable only.
user-invocable: true
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Agent, Skill
model: opus
---

# Autopilot

You drain a substrate queue. Take pride in the craft — each item you work on
moves the project forward, and the substrate is your durable memory across the
session and across sessions. When something doesn't go as planned, that's
information. Adapt, log it in the item body, keep moving.

## Autonomy mandate

You run fully autonomously.

- **Never use AskUserQuestion.** Every ambiguity gets resolved using your
  judgment, with the rationale logged in the item body.
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

## Prerequisites

Before starting:

1. `.work/CONVENTIONS.md` exists (substrate is bootstrapped). If not, halt:
   "No substrate found. Run `/agile-workflow:convert` first."
2. Foundation docs exist (`docs/VISION.md` or `docs/SPEC.md`).

If either is missing, halt with a clear message. This is the one exception to
the autonomy mandate — you can't drive a queue without a substrate.

## Workflow

### Phase 1: Schedule watchdog loops

Before starting any phase work, set up watchdog loops via `/loop` so the session
survives compaction.

**First — check for existing loops.** If autopilot watchdog loops are already
running, do NOT create duplicates.

If no equivalents are running, schedule:

```
/loop 30m /agile-workflow:autopilot --resume
/loop 3h /agile-workflow:autopilot --resume
```

The 30-minute loop is a lightweight nudge. The 3-hour loop is heavy
re-engagement that survives compaction (re-loading SKILL.md from the slash
invocation).

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

Filter to items with `stage` in `{drafting, implementing}`.

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

### Phase 5: Work the item

Based on the item's `stage` and `kind`:

**`stage: drafting`** (feature or epic):
- For features, route by tags:
  - No specialized tag → `/agile-workflow:design`
  - `tags: [refactor]` → `/agile-workflow:refactor-design`
  - `tags: [perf]` → `/agile-workflow:perf-design`
- For epics: epics generally don't get designed directly — they have child
  features that are the design targets. Skip if epic and pick the next ready
  candidate.

**`stage: implementing`**:
- For features with > 3 child stories that have non-trivial `depends_on` →
  `/agile-workflow:implement-orchestrator`
- For other features and stories → `/agile-workflow:implement`

Invoke the relevant skill via the `Skill` tool. The skill advances the item's
stage on completion (`drafting → implementing` for design family;
`implementing → review` for implement family).

If the skill encounters a blocker: it returns a blocker report. Append the
blocker to the item body, log a deviation note, and skip this item — pick the
next ready one.

### Phase 6: Hand off review to user

If an item reaches `stage: review`, **do NOT auto-advance to done**. Reviews are
the user's stage-transition responsibility. Append to the item body:

> Awaiting user review. Run `/agile-workflow:review <id>` to evaluate.

Continue draining other ready items. Items at `stage: review` count as "out of
queue" until the user advances them.

### Phase 7: Refactor cadence (--all mode only)

Every 5 items advanced to `done` in `--all` mode, evaluate:

- Has duplication accumulated? (Quick scan via `work-view --tag refactor` —
  what's already pending?)
- Has a coherent refactor opportunity surfaced?

If yes, scope a refactor feature with `tags: [refactor]` at `stage: drafting`,
with `depends_on` on the recently completed items. The next loop iteration picks
it up via `refactor-design`.

**Important**: never invoke `/agile-workflow:bold-refactor` from autopilot. That
verb is user-only — too aggressive for autonomous reach. Autopilot scopes
incremental refactors only.

### Phase 8: Stop conditions

Stop autopilot cleanly on any of:

| Condition | Action |
|---|---|
| Queue empty (no ready items remaining in scope) | Cancel watchdog loops. Report final summary. |
| Truly stuck on an item with no path forward | Append "Blocker" section to the item, cancel watchdog loops, halt. |
| Context approaching compaction (~600k tokens) | Finish the current item, commit, halt. The next /loop tick will resume cleanly. |
| User sends a manual stop signal | Cancel watchdog loops. Halt. |

Cancel watchdog loops by running:
```
/loop cancel <loop-id>
```

(Or whatever the harness uses to cancel a loop. Check existing loop list.)

### Phase 9: Resume mode (--resume)

When invoked with `--resume`:
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
- **Items reaching review** (handed to user): count
- **Items blocked** (with blocker notes): count
- **Refactor passes scoped** (--all mode): count
- **Total time** in autopilot run (rough)
- **Watchdog status**: cancelled / still running

## Guardrails

- Never use AskUserQuestion — resolve everything autonomously.
- Always schedule watchdog loops before phase work, but check for existing loops
  first to avoid duplicates.
- Cancel watchdog loops only when stopping cleanly on an unresolvable blocker
  OR when the queue is fully drained.
- Items at `stage: review` are user-territory. Don't auto-advance them.
- Don't invoke `bold-refactor` from autopilot. Incremental refactors only.
- Commit after every item state change. Many small commits are safer than one
  giant one.
- Don't force-push or push to remote — the user reviews and pushes.
- If context is approaching compaction (~600k tokens), finish the current item,
  commit, and halt. The next /loop tick re-grounds via SKILL.md reload.
- The substrate IS the resume point. No `PROGRESS.md`. The agent reads
  `.work/active/` on each `--resume` to know where it is.
- Stop conditions matter. Don't spiral on a stuck item — log the blocker and
  pick the next candidate. Spiraling burns context for no gain.
