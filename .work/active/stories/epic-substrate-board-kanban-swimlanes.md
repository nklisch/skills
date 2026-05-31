---
id: epic-substrate-board-kanban-swimlanes
kind: story
stage: implementing
tags: [tooling]
parent: epic-substrate-board-kanban
depends_on: [epic-substrate-board-kanban-stage-grid]
release_binding: null
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

- [ ] Visible items are grouped into parent/epic swimlanes.
- [ ] Each lane shows total/done progress derived from the filtered set.
- [ ] Lane focus changes only the kanban render and does not alter
      `ctx.getState().filters`.
- [ ] Clearing lane focus restores all lanes.
- [ ] Lane focus survives shell remounts caused by filter/snapshot changes
      during the current page session.
