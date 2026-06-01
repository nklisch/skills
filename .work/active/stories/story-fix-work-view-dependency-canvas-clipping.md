---
id: story-fix-work-view-dependency-canvas-clipping
kind: story
stage: done
tags: [bug, tooling]
parent: null
depends_on: []
release_binding: null
gate_origin: null
created: 2026-06-01
updated: 2026-06-01
---

# Fix dependency canvas clipping in work-view board

## Symptom
The work-view dependency canvas at `http://127.0.0.1:8181/` for `../silas` has missing content when toggled from list mode to canvas mode; right-side graph nodes are visually cut off instead of being reachable inside the canvas area.

## Root cause
The dependency board view and canvas viewport CSS did not allow the grid item to shrink inside the board shell. The wide graph's min-content width forced the page/panel wider than the viewport, so overflow escaped the intended `.dependency-canvas-viewport` scroll container. Large `../silas` dependency nodes also exceeded the canvas layout's fixed `NODE_HEIGHT` assumption, so later nodes in the same layer could overlap or hide under taller cards.

## Fix approach
Constrain the dependency view grid item and canvas viewport with `min-width: 0` and cap the viewport at `max-width: 100%`, preserving internal `overflow: auto` scrolling for wide graphs. Estimate per-node height from wrapped ids and dependency labels, carry the height through canvas layout and edge routing, and set each graph wrapper's `min-height` from the computed layout height.

## Regression test
`plugins/agile-workflow/work-view/crates/cli/tests/integration.rs` asserts that the shipped board CSS includes the shrink/scroll containment contract for `.dependency-view` and `.dependency-canvas-viewport`, and that the dependency canvas layout uses variable node heights instead of fixed row slots.

## Implementation notes
- Changed `board.css` and `components.css` to keep the dependency canvas inside its scroll viewport and wrap long node/edge text.
- Changed `dependency.js` to estimate node heights, route edges from actual node centers, and reserve variable vertical space per layer.
- Added regression coverage in `integration.rs` for viewport containment and variable-height canvas layout.
- Rebuilt `work-view`, restarted `../silas` on `http://127.0.0.1:8181/`, and verified with Krometrail screenshot `1780292598484.jpg`; DOM layout metrics reported `overlapCount: 0`.
- Full verification passed with `cargo test` in `plugins/agile-workflow/work-view`.

## Review

- Verdict: Approve - story verified by implement; fast-lane advance.
- Notes: The story includes regression coverage for scroll containment and
  variable-height canvas layout, full cargo verification, rebuilt work-view
  evidence, and browser layout metrics with no node overlap.
