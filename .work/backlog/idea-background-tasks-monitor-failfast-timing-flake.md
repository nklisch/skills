---
id: idea-background-tasks-monitor-failfast-timing-flake
kind: story
stage: backlog
tags: [testing, flaky, plugin]
parent: null
depends_on: []
release_binding: null
gate_origin: null
created: 2026-07-02
---

# Flaky monitor fail-fast timing tests under combined-suite load

## Source

Surfaced while verifying the root-dependency CI fix for the
pi-sandbox/background-tasks PR. Pre-existing on `origin/main` and on
commit `81817c6` (before the dep change) — not introduced by the sandbox PR.

## Problem

Two `plugins/background-tasks/extensions/background-tasks.test.ts` tests fail
DETERMINISTICALLY when the full background-tasks file runs together, but PASS
in isolation:

- `monitor tool > NOT a broken poll: a legit pending check (test -f / nc / grep)
  failing with non-zero + empty stderr is NOT aborted`
- `monitor tool > fail-fast counter resets on a transient broken poll (only
  CONSISTENT not-found is diagnostic)`

Both are timing-sensitive: they assert a 3s timeout fired AND that the poll
count exceeded a threshold (`expect(calls).toBeGreaterThan(3)`). Under
combined-suite load — the `9190ms` cancel-lifecycle test and several
multi-second monitor integration tests run earlier in the same file — the
machine is loaded enough that the poll loop doesn't reach the threshold within
the timeout window, so the assertion fails. In isolation (single test, or
single file with `--test-name-pattern`) they pass.

This is a real test-debt issue (timing-coupled assertions, not a product bug):
the tests assert on wall-clock poll counts that vary with machine load.

## Proposed direction

Decouple the assertions from wall-clock timing. Options:
- Replace `expect(calls).toBeGreaterThan(3)` with a lower bound that's robust
  to load (e.g. `toBeGreaterThan(1)`), or assert on the *outcome* (timeout
  fired, not aborted early) without asserting a specific poll count.
- Use fake timers / inject a clock for the fail-fast counter logic so the test
  is deterministic and not wall-clock-bound.
- Isolate the timing tests from the heavy bwrap-integration tests in the same
  file (test ordering / file split) so they don't compete for wall-clock.

Pick the cleanest that keeps the test meaningful (it must still prove a legit
pending check is NOT misclassified as a broken poll, and that the fail-fast
counter resets on a transient broken poll).

## Acceptance (when scoped)

- Both tests pass reliably when the full background-tasks file runs together
  (run the file 3× in succession, 0 failures).
- The tests still assert the meaningful behavior (legit-pending not aborted;
  fail-fast counter resets on transient break).
- No `expect(true)` / no removing the assertion to make it pass.

## Out of scope

- The cancel-lifecycle test (`9190ms`) itself is correct and must stay; it's
  just a heavy neighbor that loads the machine. Don't weaken it.

## Update 2026-07-02 — RETRACTED: this was a regression, not a pre-existing flake

This backlog item's premise is **incorrect**. The two monitor tests pass on
`origin/main` and failed only on the pi-sandbox PR head — they were a real
regression introduced by the `runShellOnce` refactor, not a pre-existing
load-sensitive flake. Root cause: `makeFakePi` did not stub the sandbox
resolver, so on a host with `@nklisch/pi-sandbox` + bwrap installed, monitor
polls routed through the real bwrap backend instead of the injected fake
`pi.exec`, breaking test isolation. Fixed in commit (this PR) by defaulting
the test sandbox resolver to `{state:"absent"}`. **Do not action this item as
written** — the tests are green again. Filing a corrected note only; this
item can be closed/archived as invalid.
