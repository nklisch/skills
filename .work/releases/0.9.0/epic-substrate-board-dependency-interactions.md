---
id: epic-substrate-board-dependency-interactions
kind: story
stage: done
tags: [tooling]
parent: epic-substrate-board-dependency
depends_on: [epic-substrate-board-dependency-canvas]
release_binding: 0.9.0
gate_origin: null
created: 2026-05-31
updated: 2026-05-31
---

# Dependency traversal interactions and fallback

Implements Unit 3 of `epic-substrate-board-dependency`.

## Scope

Make the graph explorable without overbuilding edit behavior, and keep large
filtered sets usable.

## Work

- Add hover/focus tracing for inbound and outbound edges.
- Keep focused-node and collapsed-terminal state in module scope and re-apply
  it on shell remounts.
- Collapse done/terminal branches by default for large visible graphs, with a
  local expand toggle.
- Fall back to the layered-list render for very large or narrow graph surfaces.
- Run static asset checks, `cargo test -p work-view-cli`, and release build.

## Acceptance Criteria

- [x] Hovering or focusing a node highlights its dependency chain and dims
      unrelated nodes.
- [x] Local graph state survives shell remounts during the current page session.
- [x] Large or narrow renders remain usable through the layered-list fallback.
- [x] No interaction mutates global filters or writes to `.work/`.

## Implementation Notes

- Added hover/focus tracing that marks connected nodes/edges and dims unrelated
  graph elements.
- Kept focused-node, canvas/list mode, and terminal-collapse state in module
  scope so state is re-applied after shell remounts.
- Added large-graph and narrow-viewport fallback to the D1 layered list, plus a
  local terminal-branch toggle for large graphs.

## Review Notes

- Local review approved after fixing the canvas/list toggle to use explicit
  render-mode state and broadening terminal collapse to include `done` and
  `released` stages when `is_terminal` is absent.
- Verification: `TMPDIR=/home/nathan/.cache/silas/tmp cargo test -p work-view-cli`;
  `TMPDIR=/home/nathan/.cache/silas/tmp cargo build --release -p work-view-cli`;
  release binary `687008` bytes.
