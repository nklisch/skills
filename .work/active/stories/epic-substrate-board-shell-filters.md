---
id: epic-substrate-board-shell-filters
kind: story
stage: review
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

- [x] `visibleItems()` changes consistently when any filter control changes.
- [x] Auto-hide true hides only releases/archive tier items, not active
      `stage: done` items.
- [x] Filter state persists across reload and view switches.
- [x] Empty filter results render an explicit empty state.

## Implementation notes

- Added `assets/filters.js` as the owner of default filter state, persistence
  normalization, null-sentinel handling, derived option sets, matching
  semantics, and global filter control rendering.
- Refactored `assets/state.js` so `visibleItems()` / `matches(item)` delegate
  through the shared `matchesFilters(item, filters)` contract instead of
  keeping a second evaluator in the store.
- Refactored `assets/board.js` and `index.html` so the filter UI is rendered by
  `renderFilterBar(root, ctx)`, covering search, kind, stage, parent, release,
  tag, and auto-hide controls.
- Added `/assets/filters.js` to the embedded route table and integration
  assertions, including a static guard that auto-hide keys off `tier:
  releases/archive` and not `is_terminal`.
- Verification passed: `cargo fmt -p work-view-cli`,
  `TMPDIR=/home/nathan/.cache/silas/tmp cargo test -p work-view-cli`, and
  `TMPDIR=/home/nathan/.cache/silas/tmp cargo build --release -p
  work-view-cli`.
