---
id: gate-cruft-dead-board-view-scaffolding
kind: story
stage: done
tags: [cleanup]
parent: null
depends_on: []
release_binding: 0.9.0
gate_origin: cruft
created: 2026-05-31
updated: 2026-05-31
---

# Remove dead board-view scaffolding: placeholderView, registeredViews(), and .view-preview CSS

## Confidence
High (3 tool-/grep-verified findings, one surgical removal)

## Category
dead function / dead CSS

## Location
- `plugins/agile-workflow/work-view/crates/cli/src/board/assets/views.js:16-39` — `placeholderView`
- `plugins/agile-workflow/work-view/crates/cli/src/board/assets/views.js:62-64` — `registeredViews()` export
- `plugins/agile-workflow/work-view/crates/cli/src/board/assets/board.css:213,219` — `.view-preview`, `.view-preview h1`

## Evidence
```js
// views.js — placeholderView: zero call sites (grep across all *.js/*.html assets).
// The three live views register directly via registerView(kanbanView/dependencyView/tableView).
function placeholderView(id, label, body) { /* ... builds .view-preview panel ... */ }

// views.js — registeredViews: imports=0 uses=0. board.js imports only mountCurrentView;
// the valid-view set is hardcoded in state.js:10 (VIEWS = new Set(["kanban","dependency","table"])).
export function registeredViews() { return Array.from(registry.values()); }
```
```css
/* board.css — .view-preview referenced only by placeholderView (views.js:23). */
.view-preview { /* ... */ }
.view-preview h1 { /* ... */ }
```
This is the BoardView-contract stub from before the three real views were built
(last touched in dependency-model commit `586a040`), never removed. The live
views use the separate, shared `.view-digest` class — leave that intact.

## Removal
1. Delete `placeholderView` (views.js:16-39) — self-contained, nothing references it.
2. Delete the `registeredViews` export (views.js:62-64) — no consumer; the
   registry's only live use is `mountCurrentView`. (If a future tab-list-from-registry
   wiring is desired, that's net-new work, not a reason to keep dead code now.)
3. Remove `.view-preview` and `.view-preview h1` from board.css (contingent on #1).
   Keep `.view-digest` (board.css:208) — live.

Verify: `cargo build` + the board integration test (`integration.rs:631-641`
asserts the three real views register; never references the removed symbols).

## Not flagged (intentional)
- `work-board.sh` shim, self-heal/freshness fallbacks, bash-4 re-exec/version
  prelude — spec-called-for lifecycle behavior.
- `work-board.template.html` — a clean *deletion* in the bundle, no live refs.
- Clippy `collapsible_if` (server.rs:214) and `items_after_test_module`
  (server.rs:387) — cosmetic style lints, not AI-debris.

## Implementation notes (2026-05-31)
- Removed `placeholderView` and the dead `registeredViews()` export from `views.js`; kept `textElement` (still used by `mountCurrentView`).
- Removed `.view-preview`, `.view-preview h1`, AND `.card-stack` from `board.css`. `.card-stack` was also orphaned (placeholderView was its only consumer); the cruft scan had traced only `.view-preview`. Kept live `.view-digest`.
- Fixed a drifted assertion in `integration.rs` (`board_embedded_assets_return_expected_content_types` asserted `views.js` contains `ctx.visibleItems()`, a string that lived only inside the removed `placeholderView`). That contract is still covered for the live views (kanban asserts `ctx.visibleItems()` at integration.rs:647).
- Verified: `cargo test` green — cli 104 unit + 96 integration, core 59 lib + 31 integration + 4 doctests.
