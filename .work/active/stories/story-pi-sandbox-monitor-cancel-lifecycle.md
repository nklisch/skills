---
id: story-pi-sandbox-monitor-cancel-lifecycle
kind: story
stage: drafting
tags: [security, sandbox, plugin]
parent: null
depends_on: []
release_binding: null
gate_origin: null
created: 2026-07-06
updated: 2026-07-07
---

# Monitor cancellation reports `cancelled` while the poll process keeps running (H1)

## Source

Surfaced in the 2026-07-06 v0.1.0 readiness adversarial review
(background-tasks deep-dive, fresh-context gpt-5.5). CONFIRMED high.

## Problem

In degraded monitor mode, `runShellOnce` direct-spawns `/bin/sh -c` with
`detached: true`, but calls `opts.onChildSpawn?.(child)` inside the `close`
handler (`background-tasks.ts:529`) rather than on the `spawn` event. So
`job.child`/`job.pid` are unset during the poll. `cancelJob` sees no child
(`background-tasks.ts:740`) and finalizes as `cancelled` without killing the
running shell. A cancelled monitor's process outlives the session.

The sandboxed monitor path correctly fires `onChildSpawn` on `spawn`
(`background-tasks.ts:548`); only the degraded direct-spawn path is broken.

## Fix direction

Track the child synchronously after `spawn()` in every `runShellOnce` branch
(not just the sandboxed one). Call `opts.onChildSpawn` on the `spawn` event and
`opts.onChildClose` on close. Give each monitor poll a per-job abort controller
that `cancelJob` triggers. Do not finalize a polling monitor as `cancelled`
until the in-flight poll is killed or a bounded `kill_failed` state is recorded.

## Acceptance (when scoped)

- [ ] Cancelled degraded monitor kills the running `/bin/sh` poll process
- [ ] `job.child`/`job.pid` are set during the poll, not after close
- [ ] A cancel-during-poll race does not leave an orphaned process

## Hardened design (post adversarial design review, 2026-07-07)

**Decision: (5a) scope to degraded direct-spawn path only; (5b) parked as a known residual.**

Refinements from the design review:
- **Track child synchronously after `spawn()` returns** (not on the `spawn`
  event). `child.pid` is available immediately after `spawn()` returns for the
  successful path. Set `job.child`/`job.pid` right after constructing the child,
  not inside the `close` handler.
- **Move `onChildSpawn` to the `spawn` event** (it currently fires in `close`).
  `onChildClose` stays on `close`.
- **Per-job AbortController** for the in-flight poll, NOT the tool-call `_signal`
  (which is the monitor tool call's signal). `cancelJob` triggers the per-job
  abort; the existing timeout/abort handling stays separate (avoid double-kill
  / kill-after-close).
- **cancelJob distinguishes "between polls" from "in-flight poll":**
  - No child AND no in-flight poll → finalize `cancelled` (between polls, correct).
  - In-flight poll with untracked child → kill the tracked child, wait for close,
    THEN finalize. Don't finalize immediately.
- **Bounded `kill_failed` state**: if the kill fails (zombie, EPERM), don't hang.
  After a bounded grace window (reuse existing timeout semantics), record
  `kill_failed` and finalize — never hang on a cancel.
- **Direct-spawn error path**: clear timeout, remove abort listener, call
  `onChildClose` (don't leak handlers).
- **Sandboxed monitor path** (line 548, already correct): no change needed.
- **5b parked**: the `pi.exec` absent-path (no pi-sandbox installed) has no
  `ChildProcess` to track and isn't cancellable mid-poll. Add a README known-
  residual note: "monitors without pi-sandbox installed use `pi.exec` and aren't
  cancellable mid-poll; install pi-sandbox for cancellable monitors."

**Stance check**: the buggy direct-spawn path only fires when `degradedEnv` is set,
which only happens via pi-sandbox's strip-env. Sandbox off → `pi.exec` path
(unchanged, the 5b residual). So this is no-op-by-default; it only activates when
pi-sandbox is opted in.
