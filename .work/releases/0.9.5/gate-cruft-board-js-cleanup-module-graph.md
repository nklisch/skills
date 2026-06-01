---
id: gate-cruft-board-js-cleanup-module-graph
kind: story
stage: done
tags: [cleanup]
parent: null
depends_on: []
release_binding: 0.9.5
gate_origin: cruft
created: 2026-06-01
updated: 2026-06-01
---

# Remove unused board JS harness cleanup helper

## Confidence
High

## Category
dead function

## Location
`plugins/agile-workflow/work-view/crates/cli/tests/board-js/harness.mjs:384`

## Evidence
`cleanupModuleGraph` is only found at its own definition; all imports from
`./harness.mjs` omit it. The `rm` import exists only for this unused helper.

## Removal
Remove `cleanupModuleGraph()` and drop `rm` from the `node:fs/promises` import,
unless the tests are changed to call it explicitly.

## Implementation notes
- Files changed: `plugins/agile-workflow/work-view/crates/cli/tests/board-js/harness.mjs`
- Tests added: none; existing board JS harness tests cover module loading after removal.
- Discrepancies from design: none.
- Adjacent issues parked: none.
