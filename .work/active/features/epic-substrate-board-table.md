---
id: epic-substrate-board-table
kind: feature
stage: done
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
item and columns for the mock-approved fields: id, kind, stage, status, parent,
dependency state, and updated date. This is the "show me everything in one
sortable list" surface — the view that trades the kanban's spatial layout for
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

Screens designed and direction selected (`/ux-ui-design:screens`, 2026-05-31).
Inherits the locked design system + shared board frame; reuses the `.table`
component and links `tokens.css` + `components.css` + `motion.css`.

- **Navigator**: `.mockups/screens/epic-substrate-board-table/index.html`
- **Selected**: `option-1.html` — **flat sortable grid**. One row per item over
  all active work; click any header to sort (asc/desc), a per-column filter row
  under the headers (layered on the shell's global filter bar), sticky header;
  click a row → the size-detected item-detail surface. Columns: id · kind ·
  stage · status · parent · depends_on · updated (mirrors the CLI's tabular
  output for parity).
- **Flow**: `.mockups/flows/board-views/` — hub-and-spoke; this view is
  `03-table.html`.
- Explorations (in folder / git history): `option-2` grouped-by-epic
  (collapsible groups + progress), `option-3` master-detail two-pane,
  `option-4` spreadsheet-dense / terminal.

## Design decisions (inherited from parent epic)
- **Vanilla HTML/CSS/JS, no build** — hand-rolled sort/filter, no table library
  unless feature-design justifies one against the no-build constraint.
- **Read-only this epic** — sort/filter/inspect; no inline cell editing.

## Feature Design

The table view replaces the shell's `table` placeholder with a registered
`BoardView` module. It renders a dense grid over `ctx.visibleItems()`, then
applies table-local sorting and column filters in module scope. Rows open the
shared size-detected detail surface; the table does not build a bespoke row
expander.

### View Contract

- New asset: `plugins/agile-workflow/work-view/crates/cli/src/board/assets/table.js`
- Registration: import the module from `views.js` and replace the table
  placeholder with the real view registration.
- Item source: `ctx.visibleItems()` after shell/global filters.
- Detail input: row activation calls `ctx.openDetail(id)`.
- Local state: sort and column-filter state live in module scope and are
  re-applied on each mount because the shell remounts views after
  snapshot/filter changes.

### Columns

The selected column set mirrors the useful CLI table fields:

- `id` — item id, text comparator, default ascending tie-breaker.
- `kind` — item kind.
- `stage` — stage label; sort order comes from
  `deriveFilterOptions(ctx.getState().snapshot).stages`.
- `status` — ready / blocked / terminal, derived from feed booleans.
- `parent` — parent id or `—`.
- `depends_on` — unmet count / total dependency count.
- `updated` — ISO date string, sorted as date when parseable.

### Sort and Filters

- Default sort: blocked/ready status first, then stage order, then updated
  descending, then id.
- Header buttons toggle ascending/descending for one active sort column.
- Per-column text filters render in a filter row below headers and apply after
  global filters. They never call `ctx.setFilter`.
- Filtering and sorting are stable and deterministic so row order does not
  flicker across remounts.

### Accessibility and Layout

- Header buttons expose `aria-sort` and visible sort direction affordances.
- Rows are keyboard activatable and open shared detail with Enter/Space.
- The table uses a sticky header and horizontal scroll on narrow widths rather
  than shrinking text until it overlaps.

## Implementation Units

### Unit 1: Registered table render

Story: `epic-substrate-board-table-render`

- Add `table.js`, register it in `views.js`, and remove only the table
  placeholder.
- Render the selected column set from `ctx.visibleItems()`.
- Add row click/keyboard activation through `ctx.openDetail(id)`.
- Embed `/assets/table.js` and add integration assertions for the asset and
  registration.

### Unit 2: Sort model and header controls

Story: `epic-substrate-board-table-sort`

- Implement stable comparators for the selected columns.
- Reuse `deriveFilterOptions(snapshot).stages` for stage sorting.
- Add header controls with `aria-sort`, toggle direction, and module-scoped sort
  state re-applied on mount.

### Unit 3: Per-column filters, responsive polish, and verification

Story: `epic-substrate-board-table-filters`

- Add the filter row with table-local text filters applied after global filters.
- Keep filter state in module scope and avoid `ctx.setFilter`.
- Add responsive table CSS and static checks.
- Run `cargo test -p work-view-cli` and the release build.

## Story Dependencies

1. `epic-substrate-board-table-render`
2. `epic-substrate-board-table-sort`
3. `epic-substrate-board-table-filters`

## Implementation Summary

- Delivered the registered `/assets/table.js` view and wired it through the
  shared view registry.
- Rendered dense rows over `ctx.visibleItems()` with id, kind, stage, status,
  parent, dependency count, and updated columns.
- Added click and Enter/Space activation through the shared detail panel.
- Added stable table-local sorting with header buttons, `aria-sort`, focus
  restoration, and stage ordering derived from the shared filter options.
- Added table-local per-column filters that compose after global filters and do
  not mutate shell/global filter state.
- Added responsive table CSS with horizontal scrolling, sticky headers, and
  static embedded-asset coverage for the table layout primitives.
- Verification: `TMPDIR=/home/nathan/.cache/silas/tmp cargo test -p
  work-view-cli` and `TMPDIR=/home/nathan/.cache/silas/tmp cargo build
  --release -p work-view-cli` passed.
