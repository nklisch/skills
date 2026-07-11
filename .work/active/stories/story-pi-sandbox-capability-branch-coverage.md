---
id: story-pi-sandbox-capability-branch-coverage
kind: story
stage: review
tags: [security, sandbox, testing]
parent: feature-pi-sandbox-credential-isolation-boundary
depends_on: []
release_binding: null
gate_origin: null
research_refs: []
research_origin: null
created: 2026-07-11
updated: 2026-07-11
---

# Capability lifecycle tests: cover the 3 missing publication branches

## Scope

The capability handshake publisher (`publishCredentialBoundaryCapability` in
`sandbox.ts`) fires at 10 state transitions in `session_start` + `session_shutdown`.
The integration tests (`credential-boundary-capability-integration.test.ts`)
cover 7: success, shutdown, --no-sandbox, disabled-config, non-Linux degrade,
invalid-config (parse error), bwrap-path failure. Three failure branches are
untested:

1. **Hardlink-alias fail-closed** (`sandbox.ts:586-596`): a denied file with
   `nlink > 1` triggers `assertNoHardlinkedDeniedFiles` → fail-closed. The
   capability should publish `{active:false, failClosed:true, reason:"fail-closed: denied-file hardlink"}`.
2. **`network.mode=filter` fail-closed** (`sandbox.ts:660-668`): global config
   with `network.mode=filter` triggers the deferred-filter fail-closed. The
   capability should publish `{active:false, failClosed:true, reason:"fail-closed: unsupported network filter mode"}`.
3. **Stale-success clearing**: the initial `publishCapability()` call (before any
   branch) must clear a pre-existing `active:true` from the symbol. If a prior
   session published `active:true` and a new session fails early, the symbol must
   NOT retain the stale `active:true`.

These are the paths most likely to regress stale-state clearing or reason
mapping. Branch-complete coverage is what proves every state publishes correctly.

## Unit

`plugins/pi-sandbox/extensions/credential-boundary-capability-integration.test.ts` —
add 3 test cases using the existing `registerSandbox` helper:

1. **Hardlink fail-closed**: create a temp cwd, write a file, hardlink it
   (`fs.link`), add the original path to `denyRead` via a global config
   (`<agentDir>/extensions/sandbox.json` with `filesystem.denyRead` pointing at
   the file), start the sandbox, assert the capability is
   `{active:false, failClosed:true, reason:"fail-closed: denied-file hardlink"}`.
   (The hardlink gives it `nlink > 1`, triggering `assertNoHardlinkedDeniedFiles`.)
2. **Filter fail-closed**: write a global config with `network.mode:"filter"`,
   start the sandbox, assert the capability is
   `{active:false, failClosed:true, reason:"fail-closed: unsupported network filter mode"}`.
3. **Stale-success clearing**: pre-publish `{active:true, failClosed:false}` to
   the symbol, then start a sandbox that fails early (e.g. invalid config as
   already tested, or --no-sandbox), assert the symbol was OVERWRITTEN with the
   failing state (not left at the stale `active:true`).

Use the existing `registerSandbox(cwd, agentDir, noSandbox)` helper and
`clearCapability()` / `makeTempDir()` helpers.

## Acceptance criteria

- [x] A test covers the hardlink-alias fail-closed branch and asserts the correct
  capability payload.
- [x] A test covers the `network.mode=filter` fail-closed branch.
- [x] A test covers stale-success clearing (pre-published `active:true` is
  overwritten by a failing state).
- [x] All existing tests stay green; the 3 new tests pass.

## Implementation notes

- Added lifecycle integration coverage for denied-file hardlinks, deferred
  `network.mode=filter`, and overwriting a pre-published active capability on
  parse failure. The global-config fixture pins `/bin/true` as an executable
  trusted wrapper so these tests reach their intended branches independently
  of the host's system bwrap installation.
- The new assertions exposed a reason-classification ordering defect:
  hardlink and filter diagnostics also mention bwrap. Specific labels now take
  precedence over the generic bwrap-unavailable fallback.
- Verified with `bun test plugins/pi-sandbox/extensions/credential-boundary-capability-integration.test.ts` (11 pass, 0 fail).
