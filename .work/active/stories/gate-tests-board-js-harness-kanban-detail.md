---
id: gate-tests-board-js-harness-kanban-detail
kind: story
stage: implementing
tags: [testing]
parent: gate-tests-board-js-harness
depends_on: [gate-tests-board-js-harness-runner]
release_binding: null
gate_origin: tests
created: 2026-06-01
updated: 2026-06-01
---

# Add kanban and detail board JS behavior tests

## Scope

Use the board JS harness to test kanban lane behavior, detail presentation
boundaries, and selected item refresh survival.

## Acceptance Criteria

- [ ] Kanban tests cover parent, epic, and no-parent lane grouping plus per-lane
  progress counts.
- [ ] Mounted lane focus does not call `ctx.setFilter` or mutate global filters.
- [ ] Detail tests cover modal/narrow/wide presentation boundaries.
- [ ] Store refresh tests prove selected id survives only when the refreshed
  snapshot still contains the item.
