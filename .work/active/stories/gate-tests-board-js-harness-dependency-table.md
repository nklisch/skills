---
id: gate-tests-board-js-harness-dependency-table
kind: story
stage: implementing
tags: [testing]
parent: gate-tests-board-js-harness
depends_on: [gate-tests-board-js-harness-runner]
release_binding: null
gate_origin: tests
created: 2026-06-01
updated: 2026-06-01
---

# Add dependency and table board JS behavior tests

## Scope

Use the board JS harness to execute dependency graph and table sorting behavior
directly.

## Acceptance Criteria

- [ ] Dependency model tests cover cycle members, missing dependency stubs,
  filtered dependency stubs, and bounded execution on cyclic input.
- [ ] Table tests cover deterministic stable sorting, stage-order sorting,
  defined placement for empty `updated`, and no throw/NaN behavior for missing
  metadata.
- [ ] Any helper exports added for tests stay pure and preserve the existing
  board view module contract.

