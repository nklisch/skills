---
id: epic-substrate-board-table-filters
kind: story
stage: implementing
tags: [tooling]
parent: epic-substrate-board-table
depends_on: [epic-substrate-board-table-sort]
release_binding: null
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

- [ ] Per-column filters narrow only the table render.
- [ ] Column filters do not mutate `ctx.getState().filters`.
- [ ] The table remains readable at narrow and desktop widths.
- [ ] Static checks, tests, and release build pass.
