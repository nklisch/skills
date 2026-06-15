---
id: priority-value-signal-for-items
created: 2026-06-15
tags: [plugin, tooling]
---

# Optional priority / value signal for items + work-view ordering

## The gap

The substrate has **no first-class importance signal**. The canonical item
frontmatter (`docs/SPEC.md`) carries `id, kind, stage, tags, parent, depends_on,
release_binding, gate_origin, created, updated` (+ research/scan linkage) — nothing
for priority, value, severity, or effort. Consequently:

- `work-view` can filter (`--stage/--tag/--kind/--parent/--ready/--blocked`) but
  cannot **rank**. There is no `--sort` and no priority/value flag.
- Autopilot drains candidates by `depends_on` count then `created` FIFO
  (`docs/ARCHITECTURE.md`) — i.e. "fewest blockers, then oldest." That is a
  *readiness* order, not a *value* order. The most valuable ready item and the
  least valuable ready item are indistinguishable to the queue.
- A large backlog therefore has no queryable answer to "what's worth doing next."
  Deployments work around this in prose (e.g. a hand-maintained P1/P2/P3 roadmap in
  a session note) that drifts the moment work lands and isn't machine-readable.

## Why this surfaced

Consumer evidence (SNC platform): a ~159-item backlog accreted across several
paradigm shifts. Picking what to drain required a one-off multi-agent audit because
the substrate itself encodes no priority. The roadmap that came out of it had to live
as prose and was already stale one session later. The missing piece is a durable,
queryable importance signal the queue and humans can both read.

## Design constraints (load-bearing)

- **Must be optional / configurable.** Projects that don't want ranking must be
  unaffected — absent field behaves exactly as today (readiness + FIFO). This mirrors
  how `gate_origin` / `research_origin` / `scan_origin` are inert when absent.
- **Must not silently drop.** The current strict-frontmatter handling drops unknown
  keys on item edits, so a naive "just write `priority:`" would be eaten. Whatever the
  mechanism, it has to be a *recognized* field (or recognized tag namespace) the
  substrate-maintainer preserves.
- **Follow this repo's conventions.** Schema change lands in `docs/SPEC.md` + the
  substrate-maintainer; query change lands in the `work-view` Rust crate
  (`work-view/crates/cli`); both documented in `CONVENTIONS.md` extension surface.

## Candidate shapes (to weigh at design, not pre-decided)

1. **Recognized tag namespace** — reserve `p1|p2|p3` (or `value:*` / `effort:*`) the
   way `[scan]` is reserved. Queryable today via `--tag`; cheap; no schema change.
   Tradeoff: filter not sort; grows the tag vocabulary; ordinal only.
2. **Optional frontmatter field** — e.g. `priority: 1|2|3` or a `value`/`effort` pair,
   inert when absent, preserved by the maintainer, with a `work-view --sort priority`
   (and a tie-break order: priority → depends_on → created). Proper ranked ordering;
   autopilot can consume it. Heavier (schema + Rust + docs).
3. **Both** — tag for human-facing quick triage, field for queue ordering — only if a
   single mechanism proves insufficient.

Decision should be grounded in **how priority is consumed**: autopilot ordering vs.
human picking vs. release scoping — that determines whether filtering suffices or true
sorting is required.

## Scope note

Optional/configurable is the hard requirement (parking partner of
`backlog-grooming-skill`). Route through `epic-design` or `feature-design` per the
repo's normal flow once promoted; this is the unscoped capture.
