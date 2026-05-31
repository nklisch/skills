---
id: epic-substrate-board-shell-data
kind: story
stage: implementing
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

- [ ] Initial load fetches `/api/substrate` and renders project/version/count
      status.
- [ ] Manual refresh refetches the feed without clearing filters/theme/view.
- [ ] Parse errors, validation warnings, and duplicate ids surface visibly.
- [ ] A failed feed request renders a non-crashing error state.
