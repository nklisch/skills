---
id: epic-substrate-board-dependency-canvas
kind: story
stage: done
tags: [tooling]
parent: epic-substrate-board-dependency
depends_on: [epic-substrate-board-dependency-model]
release_binding: 0.9.0
gate_origin: null
created: 2026-05-31
updated: 2026-05-31
---

# Dependency SVG canvas

Implements Unit 2 of `epic-substrate-board-dependency`.

## Scope

Render the dependency model as the selected graph-canvas view using hand-rolled
SVG and positioned DOM nodes.

## Work

- Use the D1 graph model without adding new dependency logic.
- Compute node coordinates from layer and lane positions.
- Render SVG edge paths beneath positioned nodes.
- Style satisfied edges with ready status color and unmet edges as blocked,
  dashed paths from `item.unmet_deps`.
- Add CSS for the graph surface, node sizing, edge layering, and scroll bounds.

## Acceptance Criteria

- [x] The graph canvas renders nodes and edges from the D1 model.
- [x] Edge visual status matches satisfied vs unmet dependency state.
- [x] The implementation stays vanilla HTML/CSS/JS with no external graph
      library.
- [x] Canvas layout does not replace shared detail/card behavior.

## Implementation Notes

- Added a hand-rolled SVG edge layer and absolute-positioned node canvas over
  the existing D1 graph model.
- Edge paths are styled as ready/met or blocked/unmet based on the model's
  `edge.unmet` flag derived from `item.unmet_deps`.
- Nodes reuse the D1 `renderNode` path, so shared `ctx.openDetail(id)` behavior
  remains unchanged.

## Review Notes

- Local review approved the canvas diff. The layout code consumes the existing
  D1 model and keeps rendering concerns isolated from graph construction.
- Verification: `TMPDIR=/home/nathan/.cache/silas/tmp cargo test -p work-view-cli`.
