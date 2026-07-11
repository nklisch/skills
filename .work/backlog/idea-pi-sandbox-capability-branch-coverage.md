---
id: idea-pi-sandbox-capability-branch-coverage
created: 2026-07-11
updated: 2026-07-11
tags: [security, sandbox, testing]
---

# Capability lifecycle tests miss 3 publication branches

## Capture

Review finding I3. The 8 capability integration tests cover success, shutdown,
--no-sandbox, disabled-config, non-Linux degrade, invalid-config, bwrap-path
failure, and /sandbox rendering — but NOT:
- the hardlink-alias fail-closed branch (`sandbox.ts:586-596`),
- the `network.mode=filter` fail-closed branch (`sandbox.ts:660-668`),
- the stale-success clearing transition (pre-existing `active:true` → initial
  "not initialized" publish before any branch runs).

All current branches publish correctly (verified by tracing), but
branch-complete coverage is what prevents future regression — these are the paths
most likely to regress stale-success clearing or reason mapping.

## Fix

Add 3 test cases to
`credential-boundary-capability-integration.test.ts`:
- hardlink-alias fail-closed (create a denied file with nlink>1, assert
  `{active:false, failClosed:true, reason:"fail-closed: denied-file hardlink"}`),
- filter-mode fail-closed (global config `network.mode=filter`, assert
  `{active:false, failClosed:true, reason:"fail-closed: unsupported network filter mode"}`),
- stale-success clearing (publish `active:true` to the symbol, start a session
  that fails early, assert the symbol is cleared to the failing state — not left
  at the stale `active:true`).
