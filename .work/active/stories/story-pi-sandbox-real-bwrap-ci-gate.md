---
id: story-pi-sandbox-real-bwrap-ci-gate
kind: story
stage: review
tags: [security, sandbox, testing]
parent: null
depends_on: []
release_binding: null
gate_origin: null
created: 2026-07-06
updated: 2026-07-07
---

# Release CI must fail if real-bwrap tests skip (M8)

## Source

Surfaced in the 2026-07-06 v0.1.0 readiness adversarial review
(background-tasks/tests deep-dive). CONFIRMED medium test-quality gap.

## Problem

Real-bwrap tests exist (`sandbox.test.ts:1611`, `background-tasks.test.ts:609`,
`sandbox-spawn.test.ts:398`) and are correctly conditional:
`hasBwrap ? test : test.skip`. But this means CI/release validation running on
a host without bwrap silently skips the actual sandbox-execution tests, leaving
only argv/pure-unit assertions. A mount-order or real-bwrap regression like the
`/var/run` issue (R1) can ship again because the real-bwrap test that would
catch it never ran.

The R1 regression specifically shipped because the original test only checked
the arg list, not a real bwrap run. The real-bwrap test was added later — but
it's skippable, so the next regression has the same escape hatch.

## Fix direction

Add a release CI job/container with bwrap installed that **fails if any
real-bwrap test is skipped**. Keep local skips (developers without bwrap
shouldn't be blocked), but require real-bwrap execution for release readiness.

Two parts:
1. A CI matrix entry on Linux with bwrap installed (the runtime dep).
2. A test harness or CI step that detects skipped bwrap tests and fails the
   release build (e.g. parse the test output for `skip` count > 0 in the
   bwrap-tagged tests, or assert in a guard test that `hasBwrap` is true).

## Design ambiguity (surface for orchestrator)

- **(a) CI-only gate** — a release CI job that fails on skip. No local impact.
- **(b) Build-time guard test** — a test that asserts bwrap is available and
  fails (not skips) when it's missing, gated behind a `RELEASE=1` env var.
  Forces developers to install bwrap for release builds.

(a) is less intrusive; (b) catches the case where someone runs release tests
without bwrap.

## Acceptance (when scoped)

- [ ] Release CI runs on Linux with bwrap installed
- [ ] A skipped real-bwrap test fails the release CI job
- [ ] Local dev without bwrap still passes (skips allowed)

## Hardened design (post adversarial design review, 2026-07-07)

**Decision: (a) CI-only gate, env-guarded (not output parsing).**

Refinements from the design review:
- **Use an env guard, not skip-output parsing** (which is brittle — bun output
  format changes, skip count includes unrelated skips). Add a
  `PI_SANDBOX_REQUIRE_BWRAP=1` env var that the test helpers check: when set,
  real-bwrap tests FAIL (not skip) if bwrap is absent. When unset (local dev),
  they skip as today.
- **Convert all real-bwrap test sites to honor the env**: `sandbox.test.ts:1611`,
  `background-tasks.test.ts:609`, `sandbox-spawn.test.ts:398`. Also convert any
  real-bwrap test that early-`return`s on absent bwrap (doesn't show as skipped)
  into a guarded failure/skip consistently.
- **CI workflow**: add a dedicated job (or extend an existing extension workflow —
  NOT `build-work-view.yml`, which is agile-workflow-specific) that runs on
  `ubuntu-latest` with `bubblewrap` installed and `PI_SANDBOX_REQUIRE_BWRAP=1` set.
  Run on PRs touching pi-sandbox/background-tasks + on release.
- **bwrap in CI**: `apt-get install bubblewrap` works on `ubuntu-latest` VMs
  (user namespaces available); container jobs may restrict it — use a VM runner,
  not a container, and verify bwrap actually executes (not just installs).
- **Release-only vs PR**: run on PRs touching the sandbox surface (catches
  regressions early) — the env guard makes local dev unaffected.

**Stance check**: CI-only; no operator config. Honors "no-op unless opted in" —
the gate only runs in CI with the env var set.

## Implementation notes

- Added shared helper `plugins/pi-sandbox/extensions/sandbox-bwrap-test.ts` to
  centralize bwrap test gating.
- Added focused helper verification test
  `plugins/pi-sandbox/extensions/sandbox-bwrap-test.test.ts` that forces
guard mode with `hasBwrap: false` and verifies the missing-bwrap path throws.
- Updated all three real-bwrap integration test sites to use `makeBwrapIntegrationTest`:
  - `plugins/pi-sandbox/extensions/sandbox.test.ts`
  - `plugins/pi-sandbox/extensions/sandbox-spawn.test.ts`
  - `plugins/background-tasks/extensions/background-tasks.test.ts`
- Added CI workflow
  `.github/workflows/sandbox-bwrap-gate.yml` on `ubuntu-latest` with
  `apt-get install -y bubblewrap`, `bwrap --version`, then
  `cd plugins/pi-sandbox && bun test` and
  `cd plugins/background-tasks && bun test` under
  `PI_SANDBOX_REQUIRE_BWRAP=1`.
- Added `PI_SANDBOX_REQUIRE_BWRAP=1` fail-fast behavior in CI while preserving
  local skip behavior when the env is unset.

### Verification

```bash
cd plugins/pi-sandbox && bun test 2>&1 | tail -4
# CI-unset baseline

PI_SANDBOX_REQUIRE_BWRAP=1 bun test 2>&1 | tail -4
# require flag forces full bwrap run checks

bun test plugins/pi-sandbox/extensions/sandbox-bwrap-test.test.ts
# forced-mode assertion covers "set to require + missing bwrap -> failure" path
```
