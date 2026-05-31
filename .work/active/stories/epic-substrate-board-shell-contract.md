---
id: epic-substrate-board-shell-contract
kind: story
stage: implementing
tags: [tooling]
parent: epic-substrate-board-shell
depends_on: [epic-substrate-board-shell-card, epic-substrate-board-shell-filters]
release_binding: null
gate_origin: null
created: 2026-05-31
updated: 2026-05-31
---

# Board shell view registry, detail surface, and downstream contract

Implements Unit 5 of `epic-substrate-board-shell`.

## Scope

Freeze the `BoardContext` / `BoardView` contract downstream view features will
consume, and wire the shared size-detected item-detail surface.

## Work

- Add `assets/views.js` with `registerView` and current-view mounting.
- Add `assets/detail.js` with `openDetail(id, ctx)`,
  `closeDetail()`, and `detectDetailPresentation(item, viewportWidth)`.
- Ship placeholder kanban, dependency, and table views that mount through the
  real view contract and consume `ctx.visibleItems()`.
- Source detail content from `ctx.getItemById(id)`, never DOM `data-*` copies.
- Preserve selected detail on refresh if the item still exists.

## Acceptance Criteria

- [ ] View-switcher changes the mounted view without full page navigation.
- [ ] All three placeholder views receive the same filtered item set.
- [ ] Detail opens from a card/id, renders frontmatter and full safe markdown,
      and chooses the expected presentation by body length and viewport.
- [ ] Theme and filters survive switching views and browser reload.
