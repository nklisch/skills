---
id: backlog-grooming-skill
created: 2026-06-15
tags: [skill, plugin]
---

# Backlog grooming / hygiene capability — detect stale, superseded, duplicate, mergeable items

## The gap

Nothing in the suite addresses **backlog entropy**. Across all current skills:
`park` adds items, `scope` promotes them, design skills decompose active work, gates
operate on release-bound items — but **no skill audits `.work/backlog/` for hygiene**.
There is no detection of stale, superseded, duplicate, or mergeable items; no periodic
re-audit; no way to mark an item "duplicate of X" / "superseded by shift Y." Backlog
items carry `created` only (no `updated`), so even "parked long ago and never
revisited" isn't distinguishable from "parked recently."

The result: entropy accumulates silently until a human notices and runs an ad-hoc
sweep. The substrate's late-binding / minimal-prepopulation philosophy is right, but it
leaves grooming entirely to human initiative with zero tooling support.

## Why this surfaced

Consumer evidence (SNC platform): a backlog that grew to 189 items across several
landed paradigm shifts was found, on one-off audit, to be **~16% dead** — 18 items
already DONE (shipped, verified), 10 SUPERSEDED by later shifts, 3 DUPLICATE, plus
several clusters that should have been single epics. That audit required a bespoke
9-agent fan-out cross-referencing every item against current code. The cost of *not*
having continuous grooming is that the dead/duplicate/superseded fraction grows
unbounded and pollutes every "what's next?" question (and every priority signal — see
parking partner `priority-value-signal-for-items`).

## What a grooming capability would do

Per-backlog-item, against current code + recently-landed work, classify and route:

- **DONE** — already shipped/verified; the item is dead → propose archive.
- **SUPERSEDED** — a later shift made it obsolete or absorbed it → propose archive,
  fold any unique detail into the superseding item first.
- **DUPLICATE** — same intent as another item → propose merge (keep one, fold detail).
- **MERGEABLE / CLUSTER** — N items that are really one epic/feature → propose grouping.
- **STALE** — parked long ago, code has moved, intent unclear → flag for human revisit.
- **VALID** — survives; optionally enrich (e.g. with the priority signal).

**Findings route as proposals for human triage, never auto-prune.** The destructive
acts (archive/merge/delete) stay operator-confirmed — mirroring how `research-handoff`
and the gates produce items/findings rather than silently mutating state.

## Design constraints (load-bearing)

- **Must be optional / configurable.** A no-op when the project doesn't opt in;
  surfaces findings only when invoked or scheduled.
- **Follow this repo's conventions.** Two plausible homes, to weigh at design:
  - A **standalone skill** (`/agile-workflow:groom` or similar) — an agent sweep that
    reads `.work/backlog/`, cross-references code + recent items, emits a triage report
    and/or proposed transitions. User-invocable; schedulable as a recurring sweep.
  - A **scan-library / gate seam** — mirror the `gate-refactor` extension pattern
    (plugin ships the mechanism, deployment supplies detection heuristics as a
    `scan-*` library, findings route into the substrate). Fits if grooming wants to
    be deployment-tunable.
  - Likely the skill is the right primary; the scan-seam is the extensibility hook.
- **Respect the substrate's anti-fabrication discipline** where it cross-references
  code (no "this is superseded" claims without grounding) — kin to the research band's
  substrate-before-stance.

## Scope note

Parking partner of `priority-value-signal-for-items` (grooming surfaces dead items;
priority orders the survivors — together they answer "what's worth doing next" on a
clean backlog). Unscoped capture; route through the repo's normal design flow on
promotion.
