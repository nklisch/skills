---
id: story-dependency-canvas-layout-buttons
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

# Add dependency canvas layout buttons

## Intent
The dependency view should be canvas-first and expose multiple graph organizations as buttons instead of falling back to the dense layered list.

## Scope
Remove the list/canvas mode toggle, keep the dependency canvas as the only dependency view, and add layout buttons for different relationship organizations over the same graph edges.

## Regression test
`plugins/agile-workflow/work-view/crates/cli/tests/integration.rs` will assert that dependency.js ships canvas-only layout buttons, includes multiple layout strategies, and no longer exposes `Show canvas` / `Show list` fallback behavior.

## Implementation notes
- Changed `dependency.js` to remove the list/canvas fallback and always render the dependency canvas.
- Added layout buttons for `Flow`, `Stage`, and `Kind`; each layout reorganizes the same graph nodes and keeps the dependency SVG lines.
- Added canvas column labels so each organization is readable inside the graph area.
- Updated `board.css` for layout button grouping and compact canvas column labels.
- Added regression coverage in `integration.rs` for canvas-only behavior, layout buttons, and the three relationship organizations.
- Verification passed with `cargo test` in `plugins/agile-workflow/work-view`.
- Rebuilt the release binary, restarted `../silas` on `http://127.0.0.1:8181/`, and verified with Krometrail screenshot `1780294486650.jpg`; Flow, Stage, and Kind all rendered labels, `Show canvas` / `Show list` were absent, and edge mismatch stayed at `0`.

## Review

- Verdict: Approve - story verified by implement; fast-lane advance.
- Notes: The story includes regression coverage, green `cargo test` verification,
  rebuilt work-view binary evidence, and browser verification for the canvas-only
  layout controls.
