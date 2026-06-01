---
id: gate-docs-spec-kanban-column-model
kind: story
stage: implementing
tags: [documentation]
parent: null
depends_on: []
release_binding: 0.9.0
gate_origin: docs
created: 2026-05-31
updated: 2026-05-31
---

# SPEC.md "Stage → column mapping" describes a fixed 5-column collapse the board no longer implements

## Drift category
foundation-doc-assertion

## Location
- Doc: `plugins/agile-workflow/docs/SPEC.md:391-399`
- Code: `plugins/agile-workflow/work-view/crates/cli/src/board/assets/kanban.js:43-53,82-106,144-180,196-230`,
  `plugins/agile-workflow/work-view/crates/cli/src/board/assets/filters.js:4,162-164`

## Current doc text
> ### Stage → column mapping
> ```
> Backlog       — items in .work/backlog/
> Drafting      — stage: drafting (also: stage: planned for releases)
> In Progress   — stage: implementing
> Review        — stage: review (also: stage: quality-gate for releases)
> Done          — stage: done | released, items in .work/archive/, items in .work/releases/
> ```

## Reality
The kanban board does NOT collapse or rename stages. Columns are the **raw stage
values** — preferred order `drafting, implementing, review, done, released`
(`PREFERRED_STAGES` in `filters.js:4`) plus any additional distinct stage values
found in items (e.g. `planned`, `quality-gate`), each rendered as its own column
headed by the stage string (`kanban.js:90`), with a trailing null-stage column.
There is no "Backlog" column (backlog is a *kind* filter — `PREFERRED_KINDS`
includes `"backlog"`), no "In Progress" rename, and `planned`/`quality-gate`/
`released` are NOT folded into Drafting/Review/Done. The board is also organized
as **swimlanes grouped by parent** (`laneIdForItem`: parent id, else owning epic
id, else `(no parent)`), with the per-stage columns rendered inside each lane —
the SPEC presents a single flat 5-column board.

## Required edit
Replace the "Stage → column mapping" section to describe the actual model: the
kanban view groups items into swimlanes by parent (parent id, owning epic id, or
`(no parent)`), and within each lane renders one column per distinct stage value
in preferred order `drafting → implementing → review → done → released`,
appending any other stages found (e.g. `planned`, `quality-gate`) and a trailing
null-stage column. State that stages are shown verbatim (not collapsed or
renamed) and that backlog is surfaced via the kind filter, not a dedicated
column. Rolling-foundation: replace in place, no "previously" prose.
