---
id: gate-tests-board-js-harness-dependency-table
kind: story
stage: done
tags: [testing]
parent: gate-tests-board-js-harness
depends_on: [gate-tests-board-js-harness-runner]
release_binding: 0.9.5
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

## Implementation notes

- Files changed:
  - `plugins/agile-workflow/work-view/crates/cli/src/board/assets/table.js`
  - `plugins/agile-workflow/work-view/crates/cli/tests/board-js/dependency-table.test.mjs`
- Tests added:
  - `dependency model reports cycles and missing dependency stubs`
  - `table comparators are deterministic, stage-aware, and tolerate missing updated`
- Discrepancies from design: none.
- Adjacent issues parked: none.

## Verification

- `node --test plugins/agile-workflow/work-view/crates/cli/tests/board-js/*.test.mjs`

## Review

- Verdict: Approve - story verified by implement; fast-lane advance.
- Notes: The dependency model and table comparator behavioral tests are present,
  the pure `sortedItems` helper export is minimal, and the board JS suite passes.
