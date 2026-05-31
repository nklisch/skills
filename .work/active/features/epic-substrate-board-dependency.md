---
id: epic-substrate-board-dependency
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
- **Flow**: `.mockups/flows/board-views/` — hub-and-spoke; this view is
  `02-dependency.html`.
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
  large substrate. Mitigations to design in: the layered layout (x by computed
  dependency depth) tames it; scope the graph to the active filter / a focused
  epic subgraph rather than the whole substrate at once; collapse done/terminal
  branches by default; consider a list/tree fallback (option-1) for very large
  or filtered-wide sets. The feed supplies adjacency fields; this view computes
  layer depth client-side.
- Keep the hand-rolled SVG approach (no layout lib) per the no-build decision;
  if a layered layout proves insufficient, prefer a tiny hand-rolled force/Sugiyama
  pass over pulling in D3.

## Feature Design

The dependency view replaces the shell's `dependency` placeholder with a
registered `BoardView` module that derives a graph model from
`ctx.visibleItems()`. The model uses each item's `depends_on`, `dependents`,
`unmet_deps`, `ready`, `blocked`, and `is_terminal` fields already present in
the host feed. The view owns client-side layering because the feed does not
ship a precomputed graph depth.

### View Contract

- New asset: `plugins/agile-workflow/work-view/crates/cli/src/board/assets/dependency.js`
- Registration: import the module from `views.js` and replace the dependency
  placeholder with the real view registration.
- Mount input: `ctx.visibleItems()` for the currently filtered graph;
  `ctx.getState().snapshot` only for resolving labels/metadata when needed.
- Detail input: node/card activation calls `ctx.openDetail(id)`; the view never
  implements a separate detail renderer.

### Graph Model

- Build `nodesById` from the visible set.
- Build visible edges from each visible item's `depends_on`, keeping references
  to missing dependencies as compact external-node affordances rather than
  failing the render.
- Compute dependency depth with a guarded longest-path pass over visible
  dependency edges. Cycles should not crash the board; mark cycle participants
  in a fallback layer with a compact warning label.
- Preserve a layered-list rendering from the same model. It is both the first
  implementation stride and the fallback for very large or narrow renders.

### SVG Canvas

- Render absolute-positioned nodes over an SVG edge layer using the computed
  layer and lane positions.
- Use ready/satisfied edges in the ready status color and unmet edges as dashed
  blocked edges. `item.unmet_deps` is the source of truth for unmet dependency
  styling.
- Keep layout math isolated from DOM construction so rendering can be reviewed
  independently from graph correctness.

### Interactions and Scale

- Hover/focus a node to highlight inbound and outbound edges and dim unrelated
  nodes.
- Keep focused-node, render-mode, and collapsed-terminal state in module scope
  so it can be re-applied after shell remounts.
- Collapse done/terminal branches by default when the visible graph is large,
  with a local toggle to expand them. This state does not mutate global filters.
- If the filtered visible set crosses the graph threshold, show the layered-list
  fallback first and let the user opt into the canvas.

## Implementation Units

### Unit 1: Graph model, registration, and layered-list fallback

Story: `epic-substrate-board-dependency-model`

- Add `dependency.js`, register it in `views.js`, and remove only the
  dependency placeholder.
- Implement pure graph-model helpers for nodes, edges, external dependency
  stubs, cycle guards, and longest-path layers.
- Render a layered list using shared cards or compact node buttons, with
  activation through `ctx.openDetail(id)`.
- Add integration assertions that `/assets/dependency.js` is embedded and the
  dependency placeholder is no longer registered.

### Unit 2: SVG graph canvas

Story: `epic-substrate-board-dependency-canvas`

- Render the D1 model as a hand-rolled SVG edge layer plus positioned nodes.
- Color/dash edges by satisfied vs unmet dependency status.
- Add layout CSS and static checks without introducing remote assets or a build
  step.

### Unit 3: Traversal interactions and scalability fallback

Story: `epic-substrate-board-dependency-interactions`

- Add hover/focus tracing for inbound/outbound edges.
- Add module-scoped focused/collapsed state and re-apply it on mount.
- Add large-set and narrow-viewport fallback behavior to the layered list.
- Run `cargo test -p work-view-cli` and the release build.

## Story Dependencies

1. `epic-substrate-board-dependency-model`
2. `epic-substrate-board-dependency-canvas`
3. `epic-substrate-board-dependency-interactions`

## Implementation Summary

- Delivered `/assets/dependency.js` as the real dependency view, replacing the
  shell placeholder while leaving the table placeholder intact.
- Implemented visible dependency graph modeling, external dependency stubs,
  cycle-safe layering, a layered-list fallback, hand-rolled SVG canvas edges,
  edge status styling, node tracing, large/narrow fallback, and local terminal
  collapse.
- The view remains read-only and uses shared `ctx.openDetail(id)` for item
  inspection.
- Static checks cover the embedded dependency asset and raw HTML sink guard.
- Verification: `TMPDIR=/home/nathan/.cache/silas/tmp cargo test -p work-view-cli`;
  `TMPDIR=/home/nathan/.cache/silas/tmp cargo build --release -p work-view-cli`;
  release binary `687008` bytes.
