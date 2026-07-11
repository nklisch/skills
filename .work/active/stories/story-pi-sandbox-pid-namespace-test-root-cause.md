---
id: story-pi-sandbox-pid-namespace-test-root-cause
kind: story
stage: implementing
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

# Root-cause the PID-namespace test: fix the predicate, don't mask the flake

## Scope

The integration test "PID namespace and fresh /proc hide host process metadata"
(`sandbox.test.ts:3067`) asserts `test ! -e /proc/${process.pid}` — that the
HOST pid is absent inside the new namespace. This is wrong: PIDs are
per-namespace, and the host PID number can legitimately be reused inside the
sandbox namespace (PID 2 in this container). The test fails intermittently in
worker subagent contexts (227/1) and was misattributed to the documented
seccomp `--proc` limitation (srt Issue #214). bwrap started fine; the predicate
is invalid.

This undermines trust in the suite — a test that fails with a wrong root-cause
attribution is a lie. For a 0.1.0 security boundary the suite must reproduce
green everywhere or honestly skip with a real reason.

## Unit

`plugins/pi-sandbox/extensions/sandbox.test.ts` — fix the test at ~line 3067.

The correct assertion: the namespace is fresh, proven by `/proc/1` being the
sandbox's init process (NOT the host init). Options (pick the soundest):
- Assert `/proc/1/comm` is `bash` (or the launched process name), proving PID 1
  inside the namespace is the sandbox child, not the host init. Combined with
  `test -d /proc/1` (already present) this proves a fresh PID namespace.
- OR assert `/proc/1` exists AND the host's actual init is NOT at `/proc/1`
  (e.g. check that `/proc/1/cmdline` is not the host's systemd/init).

Do NOT keep `test ! -e /proc/${process.pid}` — it's the invalid predicate.

## Acceptance criteria

- [ ] The test no longer asserts `test ! -e /proc/${process.pid}`.
- [ ] The replacement predicate proves the PID namespace is fresh (PID 1 is the
  sandbox child) in a way that does not depend on host PID numbers.
- [ ] The test passes in the orchestrator environment AND (as far as you can
  verify) does not carry a numeric-PID-collision assumption.
- [ ] If a reliable predicate can't be constructed, `skip` the test with a
  root-caused comment explaining why — do NOT leave a flaky test.
