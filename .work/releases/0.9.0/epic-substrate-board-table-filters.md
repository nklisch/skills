---
id: epic-substrate-board-table-filters
kind: story
stage: done
tags: [tooling]
parent: epic-substrate-board-table
depends_on: [epic-substrate-board-table-sort]
release_binding: 0.9.0
gate_origin: null
created: 2026-05-31
updated: 2026-05-31
---

# Table column filters and responsive polish

Implements Unit 3 of `epic-substrate-board-table`.

## Scope

Layer table-local per-column filtering and responsive polish on top of the
registered sorted table.

## Work

- Add a filter row below the headers.
- Apply column filters locally after `ctx.visibleItems()` and before sorting.
- Keep filter state in module scope and never call `ctx.setFilter`.
- Add responsive CSS for sticky headers and narrow-width horizontal scrolling.
- Run static asset checks, `cargo test -p work-view-cli`, and release build.

## Acceptance Criteria

- [x] Per-column filters narrow only the table render.
- [x] Column filters do not mutate `ctx.getState().filters`.
- [x] The table remains readable at narrow and desktop widths.
- [x] Static checks, tests, and release build pass.

## Implementation Notes

- Added module-scoped table-local column filters applied after
  `ctx.visibleItems()` and before sorting.
- Filter inputs re-render the local table view without calling `ctx.setFilter`
  and restore focus/caret after each render.
- Added sticky header and minimum-width table CSS inside a horizontally
  scrollable wrapper.

## Review Notes

- Approved local review on 2026-05-31.
- Confirmed `/assets/table.js` keeps column filters in module scope, applies
  them after `ctx.visibleItems()`, does not call `ctx.setFilter`, and preserves
  focus/caret across filter re-renders.
- Confirmed table rows still open the shared detail panel via click and
  Enter/Space key handling after filter/sort composition.
- Added static asset coverage for `.table-wrap`, sticky table headers, and the
  `820px` minimum table width.
- Verification: `TMPDIR=/home/nathan/.cache/silas/tmp cargo test -p
  work-view-cli` and `TMPDIR=/home/nathan/.cache/silas/tmp cargo build
  --release -p work-view-cli` passed.
