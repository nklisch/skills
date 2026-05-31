---
id: epic-substrate-board-dependency-model
kind: story
stage: implementing
tags: [tooling]
parent: epic-substrate-board-dependency
depends_on: []
release_binding: null
gate_origin: null
created: 2026-05-31
updated: 2026-05-31
---

# Dependency graph model and layered-list view

Implements Unit 1 of `epic-substrate-board-dependency`.

## Scope

Replace the dependency placeholder with a real module and prove the graph model
against the shell contract before adding SVG canvas risk.

## Work

- Add `assets/dependency.js`.
- Register the dependency view through `views.js` and remove only the
  dependency placeholder.
- Build graph helpers from `ctx.visibleItems()`: nodes, visible edges, external
  dependency stubs, cycle guards, and longest-path layers.
- Render a layered list fallback from the same model.
- Open shared detail through `ctx.openDetail(id)`.
- Embed `/assets/dependency.js` and add integration assertions for the asset and
  registration.

## Acceptance Criteria

- [ ] Selecting the Dependency tab mounts the dependency module, not the
      placeholder.
- [ ] Visible `depends_on` relationships are represented in a layered list.
- [ ] Missing or filtered-out dependencies are shown without crashing render.
- [ ] Cycles cannot hang the board and are surfaced with a compact warning.
- [ ] Node activation opens shared detail through `ctx.openDetail(id)`.
