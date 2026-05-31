---
id: epic-substrate-board-kanban-stage-grid
kind: story
stage: review
tags: [tooling]
parent: epic-substrate-board-kanban
depends_on: []
release_binding: null
gate_origin: null
created: 2026-05-31
updated: 2026-05-31
---

# Kanban registered view and stage grid

Implements Unit 1 of `epic-substrate-board-kanban`.

## Scope

Replace the shell's kanban placeholder with a real registered `BoardView` module
that groups `ctx.visibleItems()` into workflow-stage columns.

## Work

- Add `assets/kanban.js`.
- Register the kanban view through `views.js`.
- Derive stage ordering from `deriveFilterOptions(ctx.getState().snapshot)` so
  unknown feed stages stay visible and ordering matches the shell.
- Render stage columns, per-column counts, cards via `ctx.renderCard`, and
  compact empty-column states.
- Embed `/assets/kanban.js` and add integration assertions for the asset and
  registration.

## Acceptance Criteria

- [x] Selecting the Kanban tab mounts the kanban module, not the placeholder.
- [x] Items render in columns keyed by `stage` from the filtered item set.
- [x] Stage ordering matches `deriveFilterOptions(snapshot).stages` and unknown
      stages do not disappear.
- [x] Cards open shared detail through `ctx.openDetail(id)`.

## Implementation Notes

- Added `assets/kanban.js` as a real `kanbanView` exported into the existing
  registry instead of using a side-effect registration cycle.
- Embedded `/assets/kanban.js` in the Rust board asset router.
- Added focused integration/static assertions for the kanban asset and raw HTML
  sink guard.
