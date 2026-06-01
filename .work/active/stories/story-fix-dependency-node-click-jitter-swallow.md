---
id: story-fix-dependency-node-click-jitter-swallow
kind: story
stage: review
tags: [bug]
parent: null
depends_on: []
release_binding: null
gate_origin: null
created: 2026-06-01
updated: 2026-06-01
---

# Prevent small mouse movement from swallowing dependency node clicks

## Symptom
Real mouse clicks on dependency nodes can fail to open details even though clean synthetic clicks work. A small amount of pointer movement during the press can be interpreted as a node drag, and the drag suppressor then swallows the click event.

## Root cause
`installNodeDragging` begins dragging as soon as pointer movement crosses the four-pixel threshold. That is too sensitive for normal hand jitter during a click, especially now that node click opens details in both Inspect and Hand modes.

## Fix approach
Require a short press-and-hold before movement can become a node drag. Quick movement during a normal click will no longer set `suppressClick`, while intentional hold-drag still moves nodes and suppresses the trailing click.

## Regression test
`plugins/agile-workflow/work-view/crates/cli/tests/integration.rs` will assert that node dragging is gated by a hold timer before suppressing clicks, and toolbar text will describe hold-drag behavior.

## Implementation notes
Added a `NODE_DRAG_HOLD_MS` gate to dependency node dragging. Pointer movement only starts a node drag after the hold timer marks the drag ready, so quick mouse jitter during a click no longer sets `suppressClick` or swallows the item-open click. Intentional hold-drag still moves the node and suppresses the trailing click.

Updated Inspect and Hand tooltips to say "hold and drag" for node rearrangement.

Verification:
- Confirmed the new regression assertion failed before the fix.
- `cargo test dependency_canvas_nodes_can_be_dragged_ephemerally`
- `cargo test dependency_canvas_has_zoom_and_hand_pan_tools`
- `cargo test dependency_canvas_`
- `cargo test`
- `cargo build -p work-view-cli --release`
- Krometrail on `http://127.0.0.1:8181/`: with Hand active, clicking a node opened details; a quick pointer-move sequence no longer prevented the detail click.
