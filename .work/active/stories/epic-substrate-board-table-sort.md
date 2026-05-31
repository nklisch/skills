---
id: epic-substrate-board-table-sort
kind: story
stage: implementing
tags: [tooling]
parent: epic-substrate-board-table
depends_on: [epic-substrate-board-table-render]
release_binding: null
gate_origin: null
created: 2026-05-31
updated: 2026-05-31
---

# Table sort controls

Implements Unit 2 of `epic-substrate-board-table`.

## Scope

Add deterministic table sorting without introducing a table library or mutating
shell global filters.

## Work

- Implement stable comparators for text, status, dependency counts, date-like
  updated values, and stage order.
- Reuse `deriveFilterOptions(ctx.getState().snapshot).stages` for stage order.
- Add clickable header buttons with ascending/descending toggle and `aria-sort`.
- Keep sort state in module scope and re-apply it on shell remounts.

## Acceptance Criteria

- [ ] Header controls sort rows deterministically.
- [ ] Stage sorting follows the shell-derived stage vocabulary.
- [ ] Sort direction is visible and exposed through `aria-sort`.
- [ ] Sort state survives shell remounts during the current page session.
