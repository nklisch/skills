---
id: epic-substrate-board-dependency
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

# Dependency view — chains, blockers, and what each item unblocks

## Brief

Deliver the dependency view: make the substrate's `depends_on` relationships
visible. For any item, show what it depends on (and whether those are satisfied),
whether it is currently blocked, and what it in turn unblocks — the structure the
terse CLI exposes via `--blocking` / `--blocked`, rendered for human cognition.
This is the "why can't this start yet" and "what frees up if I finish this"
surface.

The reused engine already computes this: `work_view_core::graph` provides the
dependency adjacency and the satisfied/blocked evaluation, and the host feed
carries `ready` / `blocked` / `unmet_deps` per item. This feature renders that —
consuming the shell's item-card, filtered set, and filter state — and lets the
human traverse the graph (follow an edge to the item on the other end).

There is one **open directional choice** for feature-design to settle, deliberately
left here because it is constrained by the epic's frontend decision: render the
dependencies as a **structured, traversable list/tree** (each item shows its
depends-on ↑ and unblocks ↓ edges, click to walk the chain) versus a **full
node-and-edge graph canvas** (auto-layout). The latter typically wants a graph
layout library, which is in tension with the **vanilla HTML/CSS/JS, no-build**
decision. Lean: start with the list/tree (hand-rolled DOM/SVG over the core's
adjacency, no heavy dependency), treat a graph canvas as a possible later
enhancement. This feature is independent of the kanban and table views.

## Epic context
- Parent epic: `epic-substrate-board`
- Position in epic: one of three parallel views over the shared shell. Depends
  only on `epic-substrate-board-shell`.

## Foundation references
- `plugins/agile-workflow/work-view/crates/core/src/graph.rs` — the dependency
  adjacency + blocked/satisfied evaluation this view visualizes.
- `plugins/agile-workflow/work-view/crates/core/src/model.rs` —
  `Item.depends_on`, plus the feed's derived `ready`/`blocked`/`unmet_deps`.
- `plugins/agile-workflow/docs/SPEC.md` — the `--blocking` / `--blocked` /
  `--ready` semantics this mirrors for humans (one substrate, two adapters).

## Mockups
<!-- Mockups pending — see parent epic's UI gate. The dependency view is a
"screens"-tier mock (and possibly a "flows" traversal) produced by the parent
epic's ux-ui pass against this feature id. The list/tree-vs-graph-canvas choice
above should be resolved in that mock pass. feature-design falls back to its own
mockup phase only if the parent pass has not run. -->
- Pending — `.mockups/screens/epic-substrate-board-dependency/` once the parent
  epic's ux-ui pass runs; inherits `.mockups/design-system/`.

## Design decisions (inherited from parent epic)
- **Vanilla HTML/CSS/JS, no build** — constrains the dependency-rendering choice
  (favors list/tree over a graph-layout library); resolve in feature-design/mocks.
- **Read-only this epic** — traverse and inspect edges; no editing dependencies.

<!-- feature-design fills in: list/tree vs graph-canvas (per the open choice
above), traversal/interaction model, and blocked/ready visual treatment. -->
