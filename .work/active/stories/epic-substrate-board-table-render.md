---
id: epic-substrate-board-table-render
kind: story
stage: implementing
tags: [tooling]
parent: epic-substrate-board-table
depends_on: []
release_binding: null
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

- [ ] Selecting the Table tab mounts the table module, not the placeholder.
- [ ] One row renders per `ctx.visibleItems()` item.
- [ ] The selected column set renders without raw HTML sinks.
- [ ] Row activation opens shared detail through `ctx.openDetail(id)`.
