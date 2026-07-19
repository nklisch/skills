---
id: idea-pi-sandbox-pid-namespace-test-root-cause
created: 2026-07-11
updated: 2026-07-11
tags: [security, sandbox, testing]
---

# Root-cause the PID-namespace test failure (predicate is invalid, not seccomp)

## Capture

Review finding I5. The feature's implementation summary records "228 pass, 0
fail," but a fresh run produces 227 pass / 1 fail. The failing test
(`sandbox.test.ts:3062-3072`) asserts the host PID is absent inside the new
namespace via `test ! -e /proc/${process.pid}`. This fails when an unrelated
sandbox process happens to receive the same numeric PID (PID 2 in this
container). That is NOT the documented seccomp `--proc` failure (srt Issue #214)
— bwrap started fine; the predicate is invalid. PID numbers can legitimately
collide across namespaces.

## Fix

Root-cause and fix the test predicate:
- The correct assertion is that `/proc/1` is the sandbox's init process (e.g.
  the bwrap-launched bash), not that the host PID is absent (PIDs are
  per-namespace and can collide numerically).
- OR mark the test `skip` with a root-caused comment if the assertion can't be
  made reliable.

Do NOT leave a test that fails intermittently on a numeric collision and call
it an "environment-specific artifact." A test that fails in some environments
and not others, without a root cause, is a lie.

Note: the worker subagents that implemented S1/S2 reported this failure; the
orchestrator environment did not reproduce it (different PID assignment). The
honest record is that the test predicate is environment-fragile and must be
fixed or skipped with rationale.
