---
id: epic-substrate-board-shell
kind: feature
stage: drafting
tags: [tooling]
parent: epic-substrate-board
depends_on: [epic-substrate-board-host]
release_binding: null
gate_origin: null
created: 2026-05-31
updated: 2026-05-31
---

# Board shell — shared app frame, item-card, filters, and auto-hide

## Brief

Deliver the shared frontend foundation that all three views render into: the app
shell and the substrate-presentation layer the kanban, dependency, and table
views reuse. Without this, each view would re-invent how an item looks and how
the visible set is scoped — so it lands once, here, and the views consume it.

This feature owns: the app layout/chrome and a **view-switcher** (tabs between
kanban / dependency / table); the shared **item-card** component (frontmatter
chips — id, kind, stage, tags, parent, release binding — plus the dependency
signals from the feed); **card-body rendering** that renders an item's markdown
`body` (the core already exposes `Item.body` separately from frontmatter), not
just its metadata; the composable **global filter bar** with knobs for tag,
kind, parent, stage, and release that compose the way the CLI's flags do; and
**auto-hide of released/archived items** by default (driven by the feed's
`tier`/bucket, with a toggle to reveal them) so active work stays in focus. It
also defines the **client-side filter-state store** that the three views read,
so a filter set in the shell scopes every view consistently.

All of this is **vanilla HTML/CSS/JS with no build step** (see Design
decisions), consuming the JSON feed from `epic-substrate-board-host`. This
feature is the home of the ux-ui-design "components" tier (item-card, filter
controls, view-switcher) and the visual system the views inherit. It does NOT
implement the per-view layouts themselves — kanban columns, the dependency
graph/tree, and the sortable table are their own features; the shell gives them
the card, the filtered item set, and the frame to mount in.

## Epic context
- Parent epic: `epic-substrate-board`
- Position in epic: shared client foundation — the critical-path hinge between
  the host and the three views. Built once; kanban, dependency, and table all
  depend on it and run in parallel afterward.

## Foundation references
- `docs/ARCHITECTURE.md` — "The substrate-access model": the human surface
  optimizes for human cognition (the inverse of the CLI's terseness).
- `docs/VISION.md` — the dogfooding thesis: the board's first real dataset is the
  set of items describing its own construction.
- `plugins/agile-workflow/work-view/crates/core/src/model.rs` — `Item.body`
  (markdown after the frontmatter, for card-body rendering), `Tier` (auto-hide
  bucketing), and the frontmatter fields the card chips render.
- `plugins/agile-workflow/work-view/crates/core/src/filter.rs` — the CLI's
  composable `Filter`/`Match` model; the board's filter bar should mirror its
  knobs (tag/kind/parent/stage/release) so the two adapters feel like one tool.

## Mockups
<!-- Mockups pending — see parent epic's UI gate. The full ux-ui-design pass
(palette -> components -> motion -> screens -> flows) runs in a dedicated
session before this feature implements; this feature carries the "components"
tier (item-card, filter controls, view-switcher). feature-design should fall
back to its own mockup phase only if the parent pass has not run. -->
- Pending — `.mockups/design-system/` (palette, components, motion) inherited
  once the parent epic's ux-ui pass runs.

## Design decisions (inherited from parent epic)
- **Vanilla HTML/CSS/JS, no build** — hand-written assets, no framework/bundler.
- **Read-only this epic** — card and filters explore/scope only; no drag-to-
  restage or inline edit (that is a future epic).
- **UI gating** — this feature is gated on the full ux-ui-design pass
  (palette → components → motion → screens → flows) before implementation.

<!-- feature-design fills in: the filter-state store shape (the contract the
three views consume — pin this carefully, it is the hinge), the card component
API, the markdown renderer choice (vanilla, no build), and the view-switcher
mechanics. -->
