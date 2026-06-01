---
id: story-dependency-web-layout-compact-nodes
kind: story
stage: done
tags: [tooling]
parent: null
depends_on: []
release_binding: null
gate_origin: null
created: 2026-06-01
updated: 2026-06-01
---

# Add compact Web layout nodes for dependency canvas

## Intent
The dependency canvas should have a more traditional spider-web graph organization that uses compact graph nodes instead of the rectangular dependency cards used by Flow, Stage, and Kind.

## Scope
Add a `Web` layout button, compute deterministic radial node positions from the dependency graph, render Web-only compact nodes without embedded edge lists, and keep dragging plus measured SVG edge sync working.

## Design input
Claude was asked for a design-only pass. The adopted direction is a Web-only compact node component, center-anchored SVG edges, and a deterministic radial layout over the existing dependency model.

## Regression test
`plugins/agile-workflow/work-view/crates/cli/tests/integration.rs` will assert that dependency.js ships a Web layout button, Web layout algorithm, Web node renderer, center-anchored Web edge path, and Web-specific compact node CSS.

## Implementation notes
Added a `Web` dependency layout button that uses deterministic radial rings over the existing dependency depth model. The Web layout renders compact pill nodes through a separate renderer instead of reusing the rectangular dependency cards, and its SVG edges anchor center-to-center so the graph reads more like a traditional relationship web.

The existing Flow, Stage, and Kind layouts keep the full card renderer. Ephemeral dragging and ResizeObserver-driven edge resync continue to operate through the shared measured-node path.

Verification:
- `cargo test dependency_canvas_`
- `cargo test`
- `cargo build -p work-view-cli --release`
- Krometrail on `http://127.0.0.1:8181/`: Web button active, 73 `.dep-node--web` nodes, 0 embedded card edge lists inside Web nodes, 29 dependency edges with 0px max endpoint mismatch. Screenshot: `/home/nathan/.krometrail/browser/recordings/1970-01-01_00-00-00_127-0-0-1-8181/screenshots/1780295236662.jpg`.

## Review

- Verdict: Approve - story verified by implement; fast-lane advance.
- Notes: The story includes dependency canvas regression coverage, full cargo
  verification, release build verification, and browser evidence for compact Web
  nodes and center-anchored edge sync.
