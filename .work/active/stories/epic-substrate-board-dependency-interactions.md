---
id: epic-substrate-board-dependency-interactions
kind: story
stage: implementing
tags: [tooling]
parent: epic-substrate-board-dependency
depends_on: [epic-substrate-board-dependency-canvas]
release_binding: null
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

- [ ] Hovering or focusing a node highlights its dependency chain and dims
      unrelated nodes.
- [ ] Local graph state survives shell remounts during the current page session.
- [ ] Large or narrow renders remain usable through the layered-list fallback.
- [ ] No interaction mutates global filters or writes to `.work/`.
