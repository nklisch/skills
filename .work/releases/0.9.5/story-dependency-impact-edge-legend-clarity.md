---
id: story-dependency-impact-edge-legend-clarity
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

# Clarify dependency impact counts and edge colors

## Intent
The dependency graph should explain that Impact counts downstream unlocked items, not upstream requirements, and the edge colors should be readable without prior knowledge.

## Scope
Rename Impact group labels to explicitly say downstream items. Add a compact edge legend that maps green solid edges to satisfied dependency links and red dashed edges to unmet/blocking dependency links.

## Regression test
`plugins/agile-workflow/work-view/crates/cli/tests/integration.rs` will assert the downstream Impact labels and the edge legend semantics are shipped in the dependency board assets.

## Implementation notes
Impact group labels now say `Unblocks N Downstream Item(s)` so the count reads as downstream dependents unlocked by an item, not upstream requirements on that item.

The dependency toolbar now includes a compact edge legend:
- green solid line: satisfied dependency
- red dashed line: unmet dependency

Verification:
- `cargo test dependency_canvas_explains_impact_and_edge_color_semantics`
- `cargo test dependency_canvas_`
- `cargo test`
- `cargo build -p work-view-cli --release`
- Krometrail on `http://127.0.0.1:8181/`: Impact labels rendered as `Unblocks 9 Downstream Items`, `Unblocks 8 Downstream Items`, etc.; the toolbar legend rendered `Satisfied dependency` and `Unmet dependency`.

## Review

- Verdict: Approve - story verified by implement; fast-lane advance.
- Notes: The story includes targeted regression coverage, full cargo
  verification, release build verification, and browser evidence for downstream
  impact labels plus edge legend semantics.
