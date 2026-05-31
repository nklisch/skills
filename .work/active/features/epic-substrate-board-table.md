---
id: epic-substrate-board-table
kind: feature
stage: drafting
tags: [tooling]
parent: epic-substrate-board
depends_on: [epic-substrate-board-shell]
release_binding: null
gate_origin: null
created: 2026-05-31
updated: 2026-05-31
---

# Table view — sortable, filterable columns

## Brief

Deliver the table view: the substrate as a dense, scannable grid with one row per
item and columns for the item's fields (id, kind, stage, tags, parent, release
binding, created/updated, dependency status). This is the "show me everything in
one sortable list" surface — the view that trades the kanban's spatial layout for
information density and ordering control.

Columns are **sortable** (click a header to sort; ascending/descending), and the
view supports **per-column filtering** layered on top of the shell's global
filter state — the global filter bar scopes which items are in play, and the
table adds column-level sort/filter on that scoped set. It consumes the shell's
filtered item set and filter-state store; the item-card is less central here
(rows are compact), though a row can expand to the shared card / markdown body
for detail.

This feature does NOT own the global filters or the data feed — it adds
sort/per-column-filter affordances over the shared set. It is independent of the
kanban and dependency views and can be built in parallel with them.

## Epic context
- Parent epic: `epic-substrate-board`
- Position in epic: one of three parallel views over the shared shell. Depends
  only on `epic-substrate-board-shell`.

## Foundation references
- `plugins/agile-workflow/work-view/crates/core/src/model.rs` — the `Item` fields
  that become columns.
- `plugins/agile-workflow/work-view/crates/cli/src/render.rs` — the CLI's tabular
  output, for column-set parity between the two adapters where it makes sense.
- `plugins/agile-workflow/work-view/crates/core/src/filter.rs` — the global
  filter model the table's per-column filtering composes with.

## Mockups
<!-- Mockups pending — see parent epic's UI gate. The table view is a
"screens"-tier mock produced by the parent epic's ux-ui pass against this feature
id. feature-design falls back to its own mockup phase only if that pass has not
run. -->
- Pending — `.mockups/screens/epic-substrate-board-table/` once the parent epic's
  ux-ui pass runs; inherits `.mockups/design-system/`.

## Design decisions (inherited from parent epic)
- **Vanilla HTML/CSS/JS, no build** — hand-rolled sort/filter, no table library
  unless feature-design justifies one against the no-build constraint.
- **Read-only this epic** — sort/filter/inspect; no inline cell editing.

<!-- feature-design fills in: column set + default sort, per-column filter
mechanics, row-expand-to-card behavior, and sort interaction with the global
filter state. -->
