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
