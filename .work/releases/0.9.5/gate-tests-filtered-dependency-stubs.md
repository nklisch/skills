---
id: gate-tests-filtered-dependency-stubs
kind: story
stage: done
tags: [testing]
parent: null
depends_on: []
release_binding: 0.9.5
gate_origin: tests
created: 2026-06-01
updated: 2026-06-01
---

# Cover filtered dependency stubs in board JS tests

## Priority
Medium

## Spec reference
Item: `gate-tests-board-js-harness-dependency-table`
Acceptance criterion: dependency model tests cover cycle members, missing
dependency stubs, filtered dependency stubs, and bounded execution on cyclic
input.

## Gap type
missing test for valid partition

## Suggested test
Add a dependency model test where an item depends on an existing-but-filtered
item represented through `unmet_deps`; assert the model creates an
external/filtered stub edge instead of throwing or omitting the relationship.

## Test location
`plugins/agile-workflow/work-view/crates/cli/tests/board-js/dependency-table.test.mjs`

## Implementation notes
- Files changed: `plugins/agile-workflow/work-view/crates/cli/tests/board-js/dependency-table.test.mjs`
- Tests added: filtered dependency represented as unmet external stub.
- Discrepancies from design: none.
- Adjacent issues parked: none.
