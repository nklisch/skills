---
id: epic-substrate-board-kanban-swimlanes
kind: story
stage: done
tags: [tooling]
parent: epic-substrate-board-kanban
depends_on: [epic-substrate-board-kanban-stage-grid]
release_binding: 0.9.0
gate_origin: null
created: 2026-05-31
updated: 2026-05-31
---

# Kanban epic swimlanes and focus strip

Implements Unit 2 of `epic-substrate-board-kanban`.

## Scope

Layer the selected hybrid design onto the kanban stage grid: parent/epic
swimlanes with a view-local focus strip.

## Work

- Group filtered items into lane ids by parent/epic relationship with `(no
  parent)` as the stable null lane.
- Render lane headers and progress summaries.
- Add a kanban-local lane focus strip that narrows rendered lanes without
  mutating shell filters.
- Keep lane focus in module scope and re-apply it on each mount, because the
  shell remounts the current view when snapshot or filter state changes.
- Preserve keyboard access for lane focus buttons and cards.

## Acceptance Criteria

- [x] Visible items are grouped into parent/epic swimlanes.
- [x] Each lane shows total/done progress derived from the filtered set.
- [x] Lane focus changes only the kanban render and does not alter
      `ctx.getState().filters`.
- [x] Clearing lane focus restores all lanes.
- [x] Lane focus survives shell remounts caused by filter/snapshot changes
      during the current page session.

## Implementation Notes

- Added parent/epic lane grouping helpers and lane progress summaries to
  `assets/kanban.js`.
- Added a native-button lane focus strip with module-scoped `focusedLane`, so
  focus is re-applied when the shell remounts the view.
- Focus changes re-render the local kanban view only and do not call
  `ctx.setFilter`.

## Review Notes

- Local review approved after a focus-preservation fix: lane chip activation
  now restores focus to the active chip after the local kanban re-render.
- Verification: `TMPDIR=/home/nathan/.cache/silas/tmp cargo test -p work-view-cli`.
- Opus review is deferred to the kanban feature checkpoint because two scoped
  Opus peeragent calls stalled without output in this workspace.
