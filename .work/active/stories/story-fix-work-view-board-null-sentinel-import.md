---
id: story-fix-work-view-board-null-sentinel-import
kind: story
stage: done
tags: [bug, tooling]
parent: null
depends_on: []
release_binding: null
gate_origin: null
created: 2026-06-01
updated: 2026-06-01
---

# Fix work-view board module import failure

## Symptom

In `../silas`, running `work-view board` leaves the UI sitting on the spinner and nothing loads.

## Root cause

The board's module graph fails before bootstrap: `/assets/kanban.js` imports `NULL_SENTINEL` from `/assets/filters.js`, but `filters.js` does not export that name. Browser module loading aborts with a `SyntaxError`, so `board.js` never creates `window.boardContext`, never renders the filter UI, and never requests `/api/substrate`.

## Fix approach

Keep the null-stage display sentinel local to the Kanban view and import only the shared `deriveFilterOptions` helper from `filters.js`. Add a regression test that checks named imports across shipped board asset modules resolve to actual exports.

## Regression test

`plugins/agile-workflow/work-view/crates/cli/tests/integration.rs` adds `board_asset_named_imports_are_satisfied_by_shipped_modules`, which fails when a board ES module imports a name that the referenced local asset module does not export.

## Implementation notes

- Changed `plugins/agile-workflow/work-view/crates/cli/src/board/assets/kanban.js` to keep the null-stage sentinel local and import only `deriveFilterOptions` from `filters.js`.
- Added the board asset named-import regression guard in `plugins/agile-workflow/work-view/crates/cli/tests/integration.rs`.
- Rebuilt and refreshed the Linux x86_64 `work-view` prebuilt at `plugins/agile-workflow/work-view/dist/x86_64-unknown-linux-musl/work-view`.
- Refreshed this repo's `.work/bin/work-view` and copied the rebuilt binary into `../silas/.work/bin/work-view` for the reported local reproduction.
- Verified the browser boot path in `../silas`: `window.boardContext` exists, `/api/substrate` is fetched, loading is false, error is null, and the spinner is hidden.

## Review

- Verdict: Approve - story verified by implement; fast-lane advance.
- Notes: The story includes a named-import regression guard, rebuilt work-view
  binaries, and browser boot verification showing the board module graph loads.
