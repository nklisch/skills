---
id: epic-substrate-board-shell-data
kind: story
stage: review
tags: [tooling]
parent: epic-substrate-board-shell
depends_on: [epic-substrate-board-shell-frame]
release_binding: null
gate_origin: null
created: 2026-05-31
updated: 2026-05-31
---

# Board shell snapshot store, refresh, and diagnostics

Implements Unit 2 of `epic-substrate-board-shell`.

## Scope

Add the in-browser board store that loads `GET /api/substrate`, owns refresh,
and surfaces diagnostics without giving individual views their own data model.

## Work

- Add `assets/state.js` and wire it from `assets/board.js`.
- Implement `getState`, `subscribe`, `refresh`, `setView`, `setTheme`,
  `setFilter`, `visibleItems`, `matches`, and `getItemById`.
- Fetch `/api/substrate` on initial load and manual refresh.
- Render loading, error, empty, and diagnostics states in the shell chrome.
- Persist only theme, current view, filters, and auto-hide to localStorage.

## Acceptance Criteria

- [x] Initial load fetches `/api/substrate` and renders project/version/count
      status.
- [x] Manual refresh refetches the feed without clearing filters/theme/view.
- [x] Parse errors, validation warnings, and duplicate ids surface visibly.
- [x] A failed feed request renders a non-crashing error state.

## Implementation notes

- Added `assets/state.js` with the public in-browser store contract:
  `getState`, `subscribe`, `refresh`, `setView`, `setTheme`, `setFilter`,
  `visibleItems`, `matches`, and `getItemById`.
- Wired `assets/board.js` to create the store, fetch `/api/substrate` on first
  load and manual refresh, synchronize theme/view/filter controls, and render
  loading, error, empty, status, and diagnostics states in the existing shell
  chrome.
- Persisted only view, theme, filters, and `autoHideReleased` under
  `localStorage`; the substrate snapshot remains in memory only.
- Added the `/assets/state.js` embedded route and integration assertions for
  the new JS asset and store bootstrap.
