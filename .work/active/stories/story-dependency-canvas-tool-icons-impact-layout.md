---
id: story-dependency-canvas-tool-icons-impact-layout
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

# Clarify dependency canvas tools and add Impact layout

## Intent
The dependency canvas toolbar should make its interaction modes understandable at a glance, and the graph should provide a way to surface the items with the highest unlock impact.

## Scope
Replace the vague Select tool label with an Inspect tool that uses a cursor icon and explicitly opens item details. Add an icon-backed Hand tool for panning empty canvas space. Both tools keep node drag available through click-hold-drag. Add an Impact layout that groups dependency nodes by how many visible downstream items they unlock, sorted from highest impact to lowest.

## Regression test
`plugins/agile-workflow/work-view/crates/cli/tests/integration.rs` will assert that the dependency toolbar ships icon-backed Inspect/Pan tools, no longer exposes a generic Select label, and includes an Impact layout backed by transitive unlock counting.

## Implementation notes
The dependency canvas now uses icon-backed Inspect and Hand tools. Inspect opens item details on click, Hand pans empty canvas space, and both modes preserve click-hold-drag node movement for ephemeral graph rearrangement.

The layout selector now includes Impact, which computes each visible node's transitive downstream reach and groups nodes by unlock count from highest to lowest.

Verification:
- `cargo test dependency_canvas_`
- `cargo test`
- `cargo build -p work-view-cli --release`
- Krometrail browser check on `http://127.0.0.1:8181/`: toolbar showed Inspect/Hand with icons and no Select label; Impact layout showed unlock groups such as `Unlocks 9`, `Unlocks 8`, `Unlocks 7`, and `Unlocks 3`.
