---
id: story-fix-dependency-node-click-jitter-swallow
kind: story
stage: done
tags: [bug]
parent: null
depends_on: []
release_binding: 0.9.5
gate_origin: null
created: 2026-06-01
updated: 2026-06-01
---

# Prevent small mouse movement from swallowing dependency node clicks

## Symptom
Real mouse clicks on dependency nodes can fail to open details even though clean synthetic clicks work. A small amount of pointer movement during the press can be interpreted as a node drag, and the drag suppressor then swallows the click event.

## Root cause
`installNodeDragging` was still calling `setPointerCapture` immediately on pointerdown. Krometrail showed real clicks around the user marker landing on `#view-root`, not the node button, which means pointer capture could retarget or swallow the click before the node detail handler saw it. The earlier movement threshold was also too sensitive for normal hand jitter.

## Fix approach
Require a short press-and-hold before movement can become a node drag, and defer `setPointerCapture` until a drag has actually started. Quick movement during a normal click will no longer capture or suppress the click, while intentional hold-drag still captures the pointer, moves nodes, and suppresses the trailing click.

## Regression test
`plugins/agile-workflow/work-view/crates/cli/tests/integration.rs` will assert that node dragging is gated by a hold timer before suppressing clicks, and toolbar text will describe hold-drag behavior.

## Implementation notes
Added a `NODE_DRAG_HOLD_MS` gate to dependency node dragging. Pointer movement only starts a node drag after the hold timer marks the drag ready, and `setPointerCapture` now happens only at that drag-start point. Quick mouse jitter during a click no longer captures or swallows the item-open click. Intentional hold-drag still moves the node and suppresses the trailing click.

Updated Inspect and Hand tooltips to say "hold and drag" for node rearrangement.

Verification:
- Confirmed the new regression assertion failed before the fix.
- `cargo test dependency_canvas_nodes_can_be_dragged_ephemerally`
- `cargo test dependency_canvas_has_zoom_and_hand_pan_tools`
- `cargo test dependency_canvas_`
- `cargo test`
- `cargo build -p work-view-cli --release`
- Krometrail on `http://127.0.0.1:8181/`: with Hand active, clicking a node opened details; a quick pointer-move sequence no longer prevented the detail click.
- Krometrail marker inspection around the user's mark showed repeated real click events landing on `#view-root`, confirming pointer capture/retargeting was the live failure mode.
- Krometrail after the deferred-capture fix: quick pointer movement before click opened the item detail modal, and no new page errors were recorded.

## Review

- Verdict: Approve - story verified by implement; fast-lane advance.
- Notes: The story includes a before-fix failing regression assertion, targeted
  dependency canvas tests, full cargo verification, release build verification,
  and browser evidence for the real click-jitter failure mode and fix.
