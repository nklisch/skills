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

Screens designed and direction selected (`/ux-ui-design:screens`, 2026-05-31).
Inherits the locked design system + shared board frame established by
`epic-substrate-board-kanban`; links `tokens.css` + `components.css` +
`motion.css` and reuses the `.dep-node` component.

- **Navigator**: `.mockups/screens/epic-substrate-board-dependency/index.html`
- **Selected**: `option-4.html` — **graph canvas**. Node-and-edge graph with a
  hand-rolled layered layout (no D3 / no external layout lib — SVG paths +
  absolute-positioned nodes, ~70 lines), hover a node to trace its in/out edges
  and dim the rest. Edges colored by satisfied (`--status-ready`) vs unmet
  (`--status-blocked`, dashed).
- Explorations (in folder / git history): `option-1` traversable list/tree,
  `option-2` blocked-first/actionable, `option-3` topological layers.

## Design decisions (inherited from parent epic)
- **Vanilla HTML/CSS/JS, no build** — SATISFIED: the chosen graph canvas is
  hand-rolled SVG with no layout library, so it stays within the no-build rule.
- **Read-only this epic** — traverse and inspect edges; no editing dependencies.

## Resolved: rendering choice (2026-05-31)
The epic's open **list/tree vs graph-canvas** choice is resolved to
**graph-canvas** (user pick over the lean recommendation). Implications
feature-design must handle:
- **Scalability** is the main risk — a free node-edge graph gets tangled on a
  large substrate. Mitigations to design in: the layered layout (x by
  dependency depth) tames it; scope the graph to the active filter / a focused
  epic subgraph rather than the whole substrate at once; collapse done/terminal
  branches by default; consider a list/tree fallback (option-1) for very large
  or filtered-wide sets. The core `graph` module supplies adjacency + depth.
- Keep the hand-rolled SVG approach (no layout lib) per the no-build decision;
  if a layered layout proves insufficient, prefer a tiny hand-rolled force/Sugiyama
  pass over pulling in D3.

<!-- feature-design fills in: list/tree vs graph-canvas (per the open choice
above), traversal/interaction model, and blocked/ready visual treatment. -->
