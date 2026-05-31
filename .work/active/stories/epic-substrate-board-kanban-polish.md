---
id: epic-substrate-board-kanban-polish
kind: story
stage: implementing
tags: [tooling]
parent: epic-substrate-board-kanban
depends_on: [epic-substrate-board-kanban-swimlanes]
release_binding: null
gate_origin: null
created: 2026-05-31
updated: 2026-05-31
---

# Kanban responsive polish and verification

Implements Unit 3 of `epic-substrate-board-kanban`.

## Scope

Make the kanban layout robust across desktop/mobile viewports and lock in
integration coverage for the shipped assets.

## Work

- Add CSS for stable kanban columns, lane sizing, horizontal scroll, mobile
  stacking, and compact empty states.
- Ensure dynamic counts/cards cannot shift the shell chrome.
- Extend integration/static checks for `/assets/kanban.js`.
- Run format, tests, and release build.

## Acceptance Criteria

- [ ] Kanban remains readable on narrow and desktop widths.
- [ ] Empty columns and lanes preserve stable dimensions.
- [ ] Static asset tests cover the kanban module and raw HTML sink guard.
- [ ] `cargo test -p work-view-cli` and release build pass.
