---
id: feature-pi-sandbox-background-project-tmp-state-pi-error-semantics
kind: story
stage: implementing
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

- [ ] Final Pi-visible background/monitor sandbox refusals have `isError:true`.
- [ ] Structured refusal content and `details.sandbox/reason` are preserved.
- [ ] Successful/degraded tool results are not marked erroneous.
- [ ] Runtime-level test fails without the middleware/throw behavior.
- [ ] Existing no-job/no-wake/no-marker security assertions remain intact.
- [ ] Both plugin suites and package metadata checks pass.
