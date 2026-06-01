---
id: story-dependency-canvas-ephemeral-dragging
kind: story
stage: review
tags: [tooling]
parent: null
depends_on: []
release_binding: null
gate_origin: null
created: 2026-06-01
updated: 2026-06-01
---

# Add ephemeral dragging to dependency canvas nodes

## Intent
Dependency canvas nodes should be repositionable for the current browser render without writing layout state back to the substrate or local storage.

## Scope
Add pointer dragging to canvas graph nodes, suppress accidental detail-open clicks after a drag, keep the canvas large enough for moved nodes, and redraw dependency edges as nodes move.

## Regression test
`plugins/agile-workflow/work-view/crates/cli/tests/integration.rs` will assert that the shipped dependency canvas installs pointer drag handling, updates node `left/top`, suppresses click-through after a drag, and resyncs edge geometry while dragging.

## Implementation notes
- Changed `dependency.js` to install pointer dragging on each canvas node, update inline `left/top` for the current render, suppress the post-drag click that would otherwise open detail, expand the canvas when a node moves beyond the current bounds, and call `syncEdgeGeometry` while dragging.
- Changed `board.css` to add touch-action, grab/grabbing cursor, and z-index affordances for draggable dependency nodes.
- Added regression coverage in `integration.rs` for pointer handlers, click suppression, edge resync during drag, and drag affordance CSS.
- Verification passed with `cargo test` in `plugins/agile-workflow/work-view`.
- Rebuilt the release binary, restarted `../silas` on `http://127.0.0.1:8181/`, and verified with Krometrail screenshot `1780294019257.jpg`; a node moved `140px` by `70px` and edge mismatch stayed `0`.
