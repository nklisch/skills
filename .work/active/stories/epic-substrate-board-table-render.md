---
id: epic-substrate-board-table-render
kind: story
stage: done
tags: [tooling]
parent: epic-substrate-board-table
depends_on: []
release_binding: 0.9.0
gate_origin: null
created: 2026-05-31
updated: 2026-05-31
---

# Table registered render

Implements Unit 1 of `epic-substrate-board-table`.

## Scope

Replace the table placeholder with a real registered table module and render the
selected dense column set over the shell's filtered item set.

## Work

- Add `assets/table.js`.
- Register the table view through `views.js` and remove only the table
  placeholder.
- Render columns: id, kind, stage, status, parent, depends_on, updated.
- Open shared detail through row click and keyboard activation.
- Embed `/assets/table.js` and add integration assertions for the asset and
  registration.

## Acceptance Criteria

- [x] Selecting the Table tab mounts the table module, not the placeholder.
- [x] One row renders per `ctx.visibleItems()` item.
- [x] The selected column set renders without raw HTML sinks.
- [x] Row activation opens shared detail through `ctx.openDetail(id)`.

## Implementation Notes

- Added `assets/table.js` with the selected dense column set and row rendering
  from `ctx.visibleItems()`.
- Replaced the table placeholder with explicit `tableView` registration in
  `views.js`.
- Rows are click and keyboard activatable and call shared `ctx.openDetail(id)`.
- Embedded `/assets/table.js` and extended static/raw HTML sink coverage.

## Review Notes

- Local review approved the table render. It uses DOM text APIs only, guards
  missing ids before opening detail, and leaves sort/filter behavior for the
  follow-up stories.
- Verification: `TMPDIR=/home/nathan/.cache/silas/tmp cargo test -p work-view-cli`.
