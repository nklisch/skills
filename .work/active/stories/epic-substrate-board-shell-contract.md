---
id: epic-substrate-board-shell-contract
kind: story
stage: done
tags: [tooling]
parent: epic-substrate-board-shell
depends_on: [epic-substrate-board-shell-card, epic-substrate-board-shell-filters]
release_binding: 0.9.0
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

- [x] View-switcher changes the mounted view without full page navigation.
- [x] All three placeholder views receive the same filtered item set.
- [x] Detail opens from a card/id, renders frontmatter and full safe markdown,
      and chooses the expected presentation by body length and viewport.
- [x] Theme and filters survive switching views and browser reload.

## Implementation notes

- Added `assets/views.js` with the downstream `registerView(view)` and
  `mountCurrentView(root, ctx)` contract plus placeholder kanban, dependency,
  and table views that all consume `ctx.visibleItems()` and `ctx.renderCard()`.
- Added `assets/detail.js` with `openDetail(id, ctx)`, `closeDetail(ctx)`,
  `syncDetail(ctx)`, and `detectDetailPresentation(item, viewportWidth)`.
  Detail opens by id through `ctx.getItemById(id)`, renders frontmatter and
  full safe markdown, closes on Escape or close button, and uses modal/narrow
  drawer/wide drawer sizing by viewport and body length.
- Extended the store with `selectedItemId` mutation through `setSelectedItem()`;
  refresh keeps the selected id only when the item still exists in the new
  snapshot.
- Rewired `board.js` to publish a `BoardContext` containing store methods,
  `renderCard`, `openDetail`, and `closeDetail`, then mount the current view
  through the registry.
- Added embedded routes and integration/static checks for `/assets/detail.js`
  and `/assets/views.js`, and expanded the raw HTML injection guard to cover
  the new renderer assets.
- Verification passed: `cargo fmt -p work-view-cli`,
  `TMPDIR=/home/nathan/.cache/silas/tmp cargo test -p work-view-cli`, and
  `TMPDIR=/home/nathan/.cache/silas/tmp cargo build --release -p
  work-view-cli`.

## Review

Approved on 2026-05-31 after host review and a three-pass Opus peer-review
loop.

- Host verification passed: `TMPDIR=/home/nathan/.cache/silas/tmp cargo test
  -p work-view-cli` and `TMPDIR=/home/nathan/.cache/silas/tmp cargo build
  --release -p work-view-cli`; release binary size after the functional fixes
  was 659552 bytes.
- Accepted Opus findings that matched local judgment: modal/drawer focus
  management, background inert/ARIA handling, focus restore, Tab trapping,
  direct `openDetail` rendering, and a mount guard so `selectedItemId` changes
  do not rebuild the whole view.
- Accepted the follow-up documentation nit by adding a code comment explaining
  why selected detail does not key the view remount cache.
- Rejected narrowing `BoardContext` for this story because the parent feature's
  public contract intentionally exposes refresh/view/theme/filter mutators to
  shell consumers.
