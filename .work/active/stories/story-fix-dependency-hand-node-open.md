---
id: story-fix-dependency-hand-node-open
kind: story
stage: done
tags: [bug]
parent: null
depends_on: []
release_binding: null
gate_origin: null
created: 2026-06-01
updated: 2026-06-01
---

# Keep dependency node detail opening available in Hand mode

## Symptom
The dependency canvas detail view is hard to open after adding Inspect and Hand tools. Clicking a node only opens details when Inspect is active, so Hand mode makes node details feel broken.

## Root cause
The node click handlers in `dependency.js` check `activeGraphTool === "inspect"` before calling `ctx.openDetail(node.id)`. That makes the Hand tool affect node activation even though Hand should only control panning on empty canvas space.

## Fix approach
Make node clicks open item details regardless of the active graph tool. Existing drag suppression remains on the node wrapper, so click-hold-drag still moves nodes without opening details after a drag.

## Regression test
`plugins/agile-workflow/work-view/crates/cli/tests/integration.rs` will assert that node detail opening is not gated behind Inspect mode and that the Hand tool text makes node click behavior explicit.

## Implementation notes
Changed `plugins/agile-workflow/work-view/crates/cli/src/board/assets/dependency.js` so both regular dependency nodes and web-layout nodes call `ctx.openDetail(node.id)` on click regardless of the active graph tool. The existing drag suppressor still prevents a completed node drag from opening details.

Updated the Hand tooltip to make the behavior explicit: it pans empty canvas, while node clicks still open details and node drag still rearranges.

Verification:
- Confirmed the new regression assertion failed before the fix.
- `cargo test dependency_canvas_has_zoom_and_hand_pan_tools`
- `cargo test dependency_canvas_`
- `cargo test`
- `cargo build -p work-view-cli --release`
- Krometrail on `http://127.0.0.1:8181/`: selected Hand, clicked a dependency node, and the item detail modal opened.

## Review

- Verdict: Approve - story verified by implement; fast-lane advance.
- Notes: The story includes a before-fix failing regression assertion, targeted
  dependency canvas tests, full cargo verification, release build verification,
  and browser confirmation that Hand mode still opens node details.
