---
id: epic-substrate-board-kanban
kind: feature
stage: done
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
- `plugins/agile-workflow/work-view/crates/cli/src/board/assets/` — the current
  embedded board asset location. The host stub is intentionally minimal; use the
  selected mockups below and git history for any old static-board layout
  reference.

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
- **Flow**: `.mockups/flows/board-views/` — hub-and-spoke; this view is the
  flow's entry page (`01-kanban.html`).
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

## Feature Design

The kanban view replaces the shell's `kanban` placeholder with a registered
`BoardView` module that lays the current `ctx.visibleItems()` set into
workflow-stage columns. It does not own filters, cards, markdown, selected item
state, or detail; those stay in the shell. The view is read-only and uses card
activation through `ctx.renderCard(item, { context: ctx })`.

### View Contract

- New asset: `plugins/agile-workflow/work-view/crates/cli/src/board/assets/kanban.js`
- Registration: `views.js` imports the exported `kanbanView` object and calls
  `registerView(kanbanView)`, keeping `registerView(view)` as the extension
  point without adding a side-effect registration cycle.
- Mount input: `ctx.visibleItems()` is the only item source. The shell remounts
  the view when snapshot/view/filter state changes.
- Detail input: cards open via `ctx.openDetail(id)` through the shared card
  context.

### Layout Decisions

- Stage order reuses the shell's `deriveFilterOptions(snapshot).stages` so
  kanban columns stay in lockstep with the global stage vocabulary and any
  feed-reported extra stages.
- Items with missing/empty stage render in a stable `(none)` column at the end.
- Rows are parent/epic swimlanes:
  - A top-level epic's own id labels its lane.
  - A feature/story with `parent` uses that parent id as the lane.
  - Missing parent uses `(no parent)`.
- Each lane displays a compact progress summary: done count / total visible
  items in the lane. Progress is purely visual and derived from the filtered set.
- A kanban-local focus strip lists lane ids and lets the user narrow the rendered
  lanes to one lane without mutating shell filters. This is module-scoped
  view-local state so it can be re-applied when the shell remounts the view
  after filter/snapshot changes; cross-session persistence is not required in
  this epic.

### Acceptance Detail

- Empty visible set remains the shell's explicit empty state.
- Empty columns inside a non-empty lane show a compact "empty" affordance so the
  grid does not collapse.
- Keyboard users can tab through focus-strip buttons and cards; detail focus is
  handled by the shell.
- The view never uses drag/drop or writes back to `.work/`.

## Implementation Units

### Unit 1: Stage grouping and registered kanban module

Story: `epic-substrate-board-kanban-stage-grid`

- Add `kanban.js`, register it in `views.js`, and expose pure helpers for
  stage grouping while deriving order from `deriveFilterOptions(snapshot)`.
- Render canonical stage columns with per-column counts and empty-column states.
- Add integration assertions that `/assets/kanban.js` is embedded and the view
  registry imports/registers it.

### Unit 2: Epic swimlanes and focus strip

Story: `epic-substrate-board-kanban-swimlanes`

- Group the filtered set by parent/epic lane.
- Render lane headers, lane progress summaries, and a view-local focus strip.
- Ensure focusing one lane scopes only the kanban render, not shell filters.

### Unit 3: Responsive kanban polish and tests

Story: `epic-substrate-board-kanban-polish`

- Add stable CSS for horizontal column scrolling, lane minimum widths, compact
  empty states, and mobile stacking.
- Extend static asset tests for no raw HTML sinks and no remote assets.
- Verify `cargo test -p work-view-cli` and release build size.

## Story Dependencies

1. `epic-substrate-board-kanban-stage-grid`
2. `epic-substrate-board-kanban-swimlanes`
3. `epic-substrate-board-kanban-polish`

## Implementation Summary

- Delivered `/assets/kanban.js` as the real kanban view, replacing the shell
  placeholder while leaving dependency/table placeholders intact.
- Implemented stage columns, parent/epic swimlanes, lane focus with focus
  restoration, lane progress, stable empty states, and responsive/mobile CSS.
- Static checks cover the embedded kanban asset, kanban CSS primitives, no
  remote CSS, and raw HTML sink guards.
- Verification: `TMPDIR=/home/nathan/.cache/silas/tmp cargo test -p work-view-cli`;
  `TMPDIR=/home/nathan/.cache/silas/tmp cargo build --release -p work-view-cli`;
  release binary `670864` bytes.
- Opus contributed to the view design checkpoint. Later scoped Opus peeragent
  calls for this kanban review stalled without output, so review completion used
  local review and the passing verification above.
