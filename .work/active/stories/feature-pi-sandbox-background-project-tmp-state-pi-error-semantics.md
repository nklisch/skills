---
id: feature-pi-sandbox-background-project-tmp-state-pi-error-semantics
kind: story
stage: review
tags: [bug, tests, plugin, background-tasks]
parent: feature-pi-sandbox-background-project-tmp-state
depends_on: [feature-pi-sandbox-background-project-tmp-state-policy-fingerprint]
release_binding: null
gate_origin: null
created: 2026-07-14
updated: 2026-07-15
---

# Preserve Pi-visible error semantics for sandbox refusals

## Review finding

Final adversarial review verified that sandbox refusal prevents command
execution, job creation, wakes, markers, and secret disclosure. However,
`background` and `monitor` return a normal result with an extra `isError:true`
property. Pi's custom-tool contract ignores that returned property and marks
normally resolved tool executions successful; only a throw or a `tool_result`
patch changes the finalized `toolResult.isError` flag.

The current integration tests call `definition.execute()` directly and assert
the ignored property, so they produce a false-positive runtime contract claim.

## Required fix

Preserve the structured refusal content/details while making Pi's finalized
result an actual error. A narrow `tool_result` middleware patch for
background/monitor results whose structured details say `sandbox:"blocked"` is
preferred over throwing if retaining `details.reason` matters. Do not mark
successful, degraded, or ordinary terminal results as errors.

Add a wrapper-level test that executes a real sandbox refusal, feeds the result
through the registered `tool_result` handler(s), and asserts the finalized
`isError:true` patch while retaining the existing no-side-effect assertions.

## Acceptance criteria

- [x] Final Pi-visible background/monitor sandbox refusals have `isError:true`.
- [x] Structured refusal content and `details.sandbox/reason` are preserved.
- [x] Successful/degraded tool results are not marked erroneous.
- [x] Runtime-level test fails without the middleware/throw behavior.
- [x] Existing no-job/no-wake/no-marker security assertions remain intact.
- [x] Both plugin suites and package metadata checks pass.

## Implementation notes

- Added supported `tool_result` middleware in
  `plugins/background-tasks/extensions/background-tasks.ts`. It patches
  `isError:true` only for `background`/`monitor` results carrying structured
  `details.sandbox:"blocked"`; content and reason details remain unchanged.
- Added focused middleware coverage proving active/degraded results and `jobs`
  results are not marked erroneous.
- Extended the cache-busted real-tool integration harness to emulate Pi's
  finalized tool-result middleware chain. Healthy jobs finalize successfully;
  config-drift, shutdown, and failed-replacement refusals finalize as errors
  while retaining the existing no-job/no-wake/no-marker assertions.

## Verification

- `bun test plugins/pi-sandbox/extensions` — 269 passed, 1 documented skip.
- `bun test plugins/background-tasks/extensions` — 82 passed.
- `npm run check:pi-packages` — 136 passed, 0 failed.
- `git diff --check` — passed.
