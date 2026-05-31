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
<!-- Mockups pending — see parent epic's UI gate. The kanban screen is a
"screens"-tier mock produced by the parent epic's ux-ui pass (against this
feature id). feature-design falls back to its own mockup phase only if that pass
has not run. -->
- Pending — `.mockups/screens/epic-substrate-board-kanban/` once the parent
  epic's ux-ui pass runs; inherits `.mockups/design-system/` tokens + components.

## Design decisions (inherited from parent epic)
- **Read-only this epic** — no drag-to-restage; columns are a view, not an editor.
- **Vanilla HTML/CSS/JS, no build** — over the shell's card + filter state.

<!-- feature-design fills in: column source/ordering, count + empty-state
rendering, and how the view subscribes to the shell's filter-state store. -->
