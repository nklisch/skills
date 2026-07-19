---
id: idea-bgtasks-sandbox-handshake-cross-pkg-test
kind: story
stage: done
tags: [security, sandbox, testing]
parent: null
depends_on: []
release_binding: null
gate_origin: null
created: 2026-07-01
updated: 2026-07-05
git_ref: 0db276b
---

# Cross-package handshake integration test for background-tasks sandbox integration

## Source

Surfaced in the final confirmation review of
`feature-background-tasks-sandbox-integration` (deep lane round 2). Filed as
substantive (non-blocking); the feature advanced to `done`.

## Problem

The versioned runtime capability handshake (`Symbol.for("@nklisch/pi-sandbox.background-tasks-integration")`)
is verified by two separate test suites that each exercise one side:

- `plugins/background-tasks/extensions/sandbox-bridge.test.ts` verifies
  background-tasks PUBLISHES the correct state to the global symbol.
- `plugins/pi-sandbox/extensions/sandbox.test.ts` verifies pi-sandbox's
  `decideBackgroundTasksIntegrationState` makes the right decision from an
  INJECTED handshake object.

No test imports BOTH packages' symbols and writes through `globalThis` to
verify the actual cross-package publish→read path end-to-end. The code is
correct by inspection, but a regression that breaks the shared-symbol contract
(e.g. one side changes the symbol description or the published shape) would not
be caught by the current split tests.

## Proposed direction

A small integration test that imports both
`BACKGROUND_TASKS_SANDBOX_INTEGRATION_SYMBOL` constants, drives
background-tasks' bridge probe to publish to `globalThis`, then calls pi-sandbox's
`decideBackgroundTasksIntegrationState` reading the same `globalThis` symbol —
asserting the end-to-end publish→read→decide path for the `loaded` / `absent` /
`broken` cases.

## Acceptance (when scoped)

- One test imports both packages' shared-symbol constants and asserts they
  are the same `Symbol.for` instance.
- Drives the real publish (background-tasks bridge probe) and the real read
  (pi-sandbox decision) and asserts the active/inactive verdict per case.

## Implementation

Landed in `0db276b` — `sandbox-handshake-integration.test.ts`.

## Review (fresh-context gpt-5.5, 2026-07-05)

- ✅ Symbol contract verified (`===` across both packages); would catch a
  `Symbol()` vs `Symbol.for()` regression.
- ✅ loaded/absent/broken cases all covered with assertions on the resulting
  `backgroundTasksSandbox` state.
- ⚠️ Uses `createSandboxBridge` with a fake `importFn` + imports pi-sandbox
  internals directly, so it does NOT catch a broken `@nklisch/pi-sandbox/sandbox-spawn`
  package export or default import resolution failure. It's a contract test,
  not a full package-boundary integration test. Low severity — the split tests
  already cover each side; this adds the cross-side contract. A separate
  package-boundary test is a follow-up.

Verdict: test sound for its stated purpose; scope clarified as contract-level
rather than full package-resolution.
