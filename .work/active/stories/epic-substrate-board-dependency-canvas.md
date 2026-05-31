---
id: epic-substrate-board-dependency-canvas
kind: story
stage: implementing
tags: [tooling]
parent: epic-substrate-board-dependency
depends_on: [epic-substrate-board-dependency-model]
release_binding: null
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

- [ ] The graph canvas renders nodes and edges from the D1 model.
- [ ] Edge visual status matches satisfied vs unmet dependency state.
- [ ] The implementation stays vanilla HTML/CSS/JS with no external graph
      library.
- [ ] Canvas layout does not replace shared detail/card behavior.
