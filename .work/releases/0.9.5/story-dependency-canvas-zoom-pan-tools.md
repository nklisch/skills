---
id: story-dependency-canvas-zoom-pan-tools
kind: story
stage: done
tags: [tooling]
parent: null
depends_on: []
release_binding: 0.9.5
gate_origin: null
created: 2026-06-01
updated: 2026-06-01
---

# Add zoom and hand pan tools to dependency canvas

## Intent
The dependency graph should be easier to inspect when it is larger than the viewport. Users need direct zoom controls and a hand tool that pans the graph surface without accidentally moving nodes.

## Scope
Add dependency canvas interaction controls for Select and Hand modes, zoom in/out/reset controls, mouse-wheel zoom, a scaled canvas surface that keeps scrollbars aligned with zoom, and pointer panning for Hand mode. The graph should start zoomed out and the canvas should fill the available board viewport instead of leaving dead space. Node dragging remains session-only and should stay accurate at non-100% zoom, including when Hand mode is active.

## Regression test
`plugins/agile-workflow/work-view/crates/cli/tests/integration.rs` will assert that the shipped dependency assets include graph interaction controls, zoom state, a scaled canvas surface, viewport panning, and zoom-aware node dragging.

## Implementation notes
Added Select and Hand tool controls to the dependency graph toolbar, plus zoom out/reset/in controls. The graph now starts at 75% zoom, supports mouse-wheel zoom centered on the cursor, and keeps the scaled canvas surface dimensions aligned with the scroll container.

Hand mode pans only when the gesture starts on empty graph space. Starting a drag on a node still moves the node, including while Hand is active, and node movement is corrected for the active zoom factor.

The dependency view now uses a grid layout that gives the graph viewport the remaining board height instead of a fixed/clamped box, so the canvas fills the visible panel. Edges continue to sync from measured node bounds after resize, zoom, and drag.

Verification:
- `cargo test dependency_canvas_`
- `cargo test`
- `cargo build -p work-view-cli --release`
- Krometrail on `http://127.0.0.1:8181/`: Web layout starts at 75%, wheel zoom changes it to 100%, 25 visible dependency edges report 0px max endpoint mismatch after zoom, and the graph viewport measured 1031px tall with only the expected 16px panel padding below it. Screenshot: `/home/nathan/.krometrail/browser/recordings/1970-01-01_00-00-00_127-0-0-1-8181/screenshots/1780296298725.jpg`.

## Review

- Verdict: Approve - story verified by implement; fast-lane advance.
- Notes: The story includes targeted dependency canvas tests, full cargo
  verification, release build verification, and browser evidence for zoom, pan,
  viewport sizing, and edge geometry.
