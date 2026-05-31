---
id: epic-substrate-board-kanban
kind: feature
stage: drafting
tags: [tooling]
parent: epic-substrate-board
depends_on: [epic-substrate-board-shell]
release_binding: null
gate_origin: null
created: 2026-05-31
updated: 2026-05-31
---

# Kanban view — columns by stage

## Brief

Deliver the kanban view: the substrate laid out as columns by workflow stage
(drafting → implementing → review → done, plus whatever stages the feed
reports), with each item rendered as a shared item-card in its stage column.
This is the at-a-glance "where is everything" surface — the human equivalent of
scanning the whole board to decide what to steer.

It consumes the shell's item-card, the filtered item set, and the global filter
state, so the columns reflect whatever filter/auto-hide the human has set
(released/archived hidden by default). Column ordering follows the canonical
stage progression; per-column counts and empty-column handling are part of the
view. Because the board is **read-only this epic**, cards are not draggable
between columns — that (drag-to-restage as a write-back) is explicitly a future
epic, not this one.

This feature does NOT define the card, the filters, or the data feed — it
arranges the shell's cards into stage columns. It is independent of the
dependency and table views and can be built in parallel with them.

## Epic context
- Parent epic: `epic-substrate-board`
- Position in epic: one of three parallel views over the shared shell. Depends
  only on `epic-substrate-board-shell`.

## Foundation references
- `plugins/agile-workflow/work-view/crates/core/src/model.rs` — `Item.stage`
  (the column key) and the stage vocabulary.
- `plugins/agile-workflow/scripts/work-board.template.html` — the legacy static
  kanban this replaces, for reference on column layout (the interactive version
  supersedes it; do not extend the template).

## Mockups

Screens designed and direction selected (`/ux-ui-design:screens`, 2026-05-31).
Inherits the locked design system (`tokens.css` + `components.css` +
`motion.css`); links all three.

- **Navigator**: `.mockups/screens/epic-substrate-board-kanban/index.html`
- **Selected**: `option-hybrid.html` — **left rail + epic swimlanes**. A
  persistent left rail (search, kind/tag filters, epic focus-nav, auto-hide
  toggle) drives a swimlane grid (rows = parent epic, columns by stage, with
  per-epic progress bars). Clicking an epic in the rail focuses its lane.
- **Item-detail surface**: `item-detail.html` — **size-detected presentation**.
  One surface, three forms, auto-chosen by body length + viewport: short →
  slide-over (380), medium → wide drawer (560), long body or narrow viewport →
  modal (760, prose capped ~68ch). Resolves the "large markdown needs room"
  problem without a manual choice.
- Explorations (in folder / git history): `option-1` classic columns,
  `option-2` compact rows, `option-3` left rail, `option-4` epic swimlanes.

This screen establishes the **shared board frame** (app bar + view-switcher
tabs + theme-picker + filter bar), so several pieces here are really
`epic-substrate-board-shell`'s to own and the kanban view consumes:

- the **theme-picker** control (accent `[data-accent]` + Sys/Light/Dark
  `[data-theme]`) and its persistence (localStorage / board config);
- the global **filter-state store** + filter bar / auto-hide;
- the **item-detail `detect()`** logic that picks slide-over / wide-drawer /
  modal by size (the shell owns the shared item-detail surface).

feature-design on `board-shell` should pull these frame concerns up; this
feature's own scope is the kanban arrangement (swimlane grid + columns) on top.

## Design decisions (inherited from parent epic)
- **Read-only this epic** — no drag-to-restage; columns are a view, not an editor.
- **Vanilla HTML/CSS/JS, no build** — over the shell's card + filter state.

<!-- feature-design fills in: column source/ordering, count + empty-state
rendering, and how the view subscribes to the shell's filter-state store. -->
