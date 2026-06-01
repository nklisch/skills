---
id: gate-tests-board-js-harness-runner
kind: story
stage: review
tags: [testing]
parent: gate-tests-board-js-harness
depends_on: []
release_binding: null
gate_origin: tests
created: 2026-06-01
updated: 2026-06-01
---

# Add board JS behavioral test runner

## Scope

Create the no-build Node test harness for shipped board asset modules and wire it
into the work-view CI job.

## Acceptance Criteria

- [ ] `plugins/agile-workflow/work-view/crates/cli/tests/board-js/harness.mjs`
  can load board asset ES modules by rewriting `/assets/*.js` imports into a
  temporary relative module graph.
- [ ] The harness installs a minimal DOM shim that supports event dispatch and
  the DOM operations used by existing board modules.
- [ ] A smoke test proves a loaded board module can run under Node.
- [ ] `.github/workflows/build-work-view.yml` runs
  `node --test plugins/agile-workflow/work-view/crates/cli/tests/board-js/*.test.mjs`.

## Implementation notes

- Files changed:
  - `plugins/agile-workflow/work-view/crates/cli/tests/board-js/harness.mjs`
  - `plugins/agile-workflow/work-view/crates/cli/tests/board-js/harness-smoke.test.mjs`
  - `.github/workflows/build-work-view.yml`
- Tests added:
  - `board asset modules load through the no-build harness`
- Discrepancies from design: none.
- Adjacent issues parked: none.

## Verification

- `node --test plugins/agile-workflow/work-view/crates/cli/tests/board-js/*.test.mjs`
