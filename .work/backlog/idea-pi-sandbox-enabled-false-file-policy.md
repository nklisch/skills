---
id: idea-pi-sandbox-enabled-false-file-policy
kind: story
stage: done
tags: [security, sandbox]
parent: null
depends_on: []
release_binding: null
gate_origin: null
created: 2026-07-01
updated: 2026-07-05
git_ref: 3d98d2c
---

# `enabled:false` leaves read/write/edit fail-closed

## Resolution

Already fixed in the current code. The `!config.enabled` branch in
`sandbox.ts` session_start (around line 478) installs `createPermissivePolicy`
before returning, so `activePolicy` is the permissive policy and the hardened
read/write/edit tools route to default unhardened operations — not fail-closed.
`failClosed` (real init failure) still installs `createFailClosedPolicy` and
keeps file tools hardened, as intended.

Verified 2026-07-05: `createPermissivePolicy` returns `allowWrite:["/"]` and
`toolRules.default:"allow"`, confirming the permissive path is active for
`enabled:false`.

## Original problem (historical)

In `plugins/pi-sandbox/extensions/sandbox.ts` session_start, the
`!config.enabled` branch set `disabledViaConfig = true` and returned BEFORE
installing any policy, so `activePolicyFor()` fell back to fail-closed and
blocked every file I/O when the operator intentionally disabled the sandbox.
