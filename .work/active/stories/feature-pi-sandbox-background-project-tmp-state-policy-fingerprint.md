---
id: feature-pi-sandbox-background-project-tmp-state-policy-fingerprint
kind: story
stage: review
tags: [bug, security, tests, sandbox, background-tasks]
parent: feature-pi-sandbox-background-project-tmp-state
depends_on: [feature-pi-sandbox-background-project-tmp-state-real-tool-policy-parity]
release_binding: null
gate_origin: null
created: 2026-07-14
updated: 2026-07-14
---

# Pin effective spawn policy and validate lifecycle identity before runnable branches

## Review finding

The corrected feature transports the authoritative agent directory, but the
helper still reloads mutable global/project config on every background/monitor
call while mediated bash retains the effective policy pinned at
`session_start`. A sandboxed bash command can delete or change the writable
project `.pi/sandbox.json`; the helper then builds a weaker policy while the
live tool gate still reports the original integration active.

Adversarial review also found that snapshot project/readiness validation happens
after config-driven runnable escape branches. A wrong-project or inactive
snapshot can reach `integration-off`/`enabled:false` degraded execution before
`configCwd` is checked, and complete temp overrides can bypass inactive state.

## Required fix

Pin an immutable identity for the merged effective spawn policy at session
start. A deterministic fingerprint of the complete effective config projection
used by `buildSandboxedSpawnArgs` is acceptable: the helper may reload config
from the canonical roots, but it must compare the effective fingerprint before
*any* runnable/degraded return. Any post-start config addition, removal, or
change fails closed and asks for `/reload`; it must never silently weaken or
tighten one command independently of the live session.

Carry canonical project identity on inactive snapshots and validate lifecycle,
project cwd, agent dir, and policy identity before config-driven escape branches.
Complete temp/config test overrides are permitted only when no snapshot exists
and an explicit isolated config root is supplied; a live or inactive snapshot
cannot be bypassed.

Add a real composition regression that drives the sandbox `tool_call` gate and
registered background/monitor tools after project config mutation. Prove the
gate does not create an unsafe window and that no job, wake, marker, or secret
read occurs. Add wrong-cwd × integration-off/disabled and shutdown × explicit
override cases.

## Acceptance criteria

- [x] The ready snapshot pins a deterministic identity of every effective config
  field that can change background/monitor spawn behavior.
- [x] Helper config is compared to the pinned identity before any `ok` or
  degraded/unsandboxed result.
- [x] Removing or changing project/global config after session start fails
  closed until `/reload`.
- [x] Inactive and wrong-project snapshots cannot reach integration-off,
  enabled:false, or explicit-override runnable paths.
- [x] Snapshot-absent isolated tests retain explicit override support.
- [x] A real tool-call-gate + registered-tool regression proves policy mutation
  creates no job, wake, marker, or secret disclosure.
- [x] Existing ready/degraded/`--no-sandbox` behavior remains as documented when
  policy identity is unchanged.
- [x] Both plugin suites and package metadata checks pass.

## Implementation notes

- Replaced the narrow v1 transport with a frozen v2 snapshot. Ready state carries
  canonical project and agent roots plus only a SHA-256 policy identity; inactive
  state retains both canonical roots so shutdown and disabled sessions cannot be
  treated as snapshot-absent test contexts.
- `loadConfig` now fingerprints canonical JSON for the entire merged config and
  validated global/project source presence/content. Keys are recursively sorted,
  arrays retain order, and invalid/non-JSON values fail closed. Source presence
  makes an empty project-config deletion observable without publishing config
  contents or secrets.
- The helper establishes lifecycle/project identity before loading config,
  compares the reloaded identity before every runnable/degraded branch, and
  allows agent/temp overrides only for an absent snapshot with an explicit
  isolated config root and complete temp selection.
- Extended the real cache-busted sandbox plus registered background/monitor
  integration test to invoke the live `tool_call` gate, then mutate and remove
  writable project config. The gate remains live-policy-allowed while the helper
  refuses before job registration, wake, marker execution, or secret output.

## Verification

- `bun test plugins/pi-sandbox/extensions` — 267 passed, 1 documented host-/tmp
  Unix-socket skip.
- `bun test plugins/background-tasks/extensions` — 81 passed.
- `npm run check:pi-packages` — 123 passed, 0 failed.
- `git diff --check` — passed.
