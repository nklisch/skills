---
id: story-fix-dependency-canvas-resize-edges
kind: story
stage: done
tags: [bug, tooling]
parent: null
depends_on: []
release_binding: 0.9.5
gate_origin: null
created: 2026-06-01
updated: 2026-06-01
---

# Fix dependency canvas edge drift on resize

## Symptom
The work-view dependency canvas edges do not stay attached to their nodes after the browser window is resized.

## Root cause
The canvas drew SVG paths from the graph layout's estimated node dimensions during initial render. Browser layout can change the actual node boxes and canvas dimensions after insertion and resize, but the SVG paths were never recomputed from the rendered DOM geometry.

## Fix approach
Measure rendered dependency node boxes in canvas coordinates, redraw SVG paths from those measured centers, and resync the edge layer after node or canvas resize events.

## Regression test
`plugins/agile-workflow/work-view/crates/cli/tests/integration.rs` will assert that the shipped dependency canvas edge layer uses measured node bounds and `ResizeObserver`-driven resync instead of one-shot estimated path coordinates.

## Implementation notes
- Changed `dependency.js` so dependency canvas SVG paths are created without stale one-shot coordinates, then redrawn from rendered `.dependency-graph-node` bounds in canvas coordinates.
- Added `ResizeObserver`-driven edge resync, requestAnimationFrame batching, and cleanup when the dependency view remounts.
- Added regression coverage in `integration.rs` for measured bounds, resize observation, and removal of the old `renderEdges(model, layout)` one-shot path draw.
- Verification passed with `cargo test` in `plugins/agile-workflow/work-view`.
- Rebuilt the release binary, restarted `../silas` on `http://127.0.0.1:8181/`, and verified with Krometrail screenshot `1780293701724.jpg`; screen-space edge mismatch stayed `0` before and after a forced canvas resize from `2059px` to `2299px`.

## Review

- Verdict: Approve - story verified by implement; fast-lane advance.
- Notes: The story includes regression coverage, green `cargo test` verification,
  rebuilt work-view binary evidence, and browser verification of edge resync
  before and after resize.
