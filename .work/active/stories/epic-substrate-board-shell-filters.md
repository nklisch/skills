---
id: epic-substrate-board-shell-filters
kind: story
stage: implementing
tags: [tooling]
parent: epic-substrate-board-shell
depends_on: [epic-substrate-board-shell-data]
release_binding: null
gate_origin: null
created: 2026-05-31
updated: 2026-05-31
---

# Board shell filter-state store and controls

Implements Unit 4 of `epic-substrate-board-shell`.

## Scope

Implement the global filter model and controls that all three views consume
through `visibleItems()` / `matches(item)`.

## Work

- Add `assets/filters.js`.
- Implement search, tag, kind, parent, stage, release, and auto-hide controls.
- Values OR within scalar knobs and AND across knobs; selected tags use AND.
- Derive parent/release option sets from the loaded snapshot, including a
  stable null sentinel.
- Auto-hide defaults to true and hides only `tier: releases` and
  `tier: archive`.

## Acceptance Criteria

- [ ] `visibleItems()` changes consistently when any filter control changes.
- [ ] Auto-hide true hides only releases/archive tier items, not active
      `stage: done` items.
- [ ] Filter state persists across reload and view switches.
- [ ] Empty filter results render an explicit empty state.
