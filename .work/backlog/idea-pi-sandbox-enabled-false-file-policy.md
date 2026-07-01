---
id: idea-pi-sandbox-enabled-false-file-policy
kind: story
stage: backlog
tags: [security, sandbox]
parent: null
depends_on: []
release_binding: null
gate_origin: null
created: 2026-07-01
---

# `enabled:false` leaves read/write/edit fail-closed

## Source

Surfaced in the round-2 fresh-context adversarial review of
`feature-sandbox-first-party-bwrap` (Phase 8 final peer review). Filed as a
substantive (non-blocking) finding; deferred from the fix pass because it is a
functional break, not a security hole.

## Problem

In `plugins/pi-sandbox/extensions/sandbox.ts` session_start, the
`!config.enabled` branch sets `disabledViaConfig = true` and returns BEFORE
installing any policy. Bash correctly routes to the unsandboxed local
implementation (the enabled-gap-fix). But the hardened `read`/`write`/`edit`
tools call `activePolicyFor()`, which (after the B2 fix) falls back to the
restrictive fail-closed policy — so every file I/O is blocked when the operator
intentionally disabled the sandbox via config.

If `enabled:false` is meant as an operator disable of the whole sandbox, file
tools should route to the normal unsandboxed operations, not fail-closed.

## Proposed direction

When `disabledViaConfig` is true (config `enabled:false`), either:
- install a permissive "no-op" policy for file tools (route to default
  read/write/edit operations), or
- have the hardened read/write/edit tools detect `disabledViaConfig` and route
  to the built-in unhardened operations, mirroring the bash `enabled:false`
  path.

`--no-sandbox` may or may not be symmetric — confirm intended semantics.
`failClosed` (real init failure) must keep file tools hardened/fail-closed.

## Acceptance (when scoped)

- With `enabled:false`, read/write/edit run unsandboxed (not fail-closed).
- With `failClosed:true` (init error), read/write/edit stay fail-closed.
- `--no-sandbox` behavior is consistent and documented.
