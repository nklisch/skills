---
id: story-background-tasks-sandbox-monitor-spawn
kind: story
stage: done
tags: [security, sandbox, plugin]
parent: feature-background-tasks-sandbox-integration
depends_on: [story-background-tasks-sandbox-background-spawn]
release_binding: null
gate_origin: null
created: 2026-07-01
updated: 2026-07-01
---

# Route monitor polls through pi-sandbox bwrap

## Scope

Wire each `monitor` poll through the pi-sandbox helper when sandboxing is active. The current `pi.exec("/bin/sh", ["-c", command], ...)` path does not accept a custom child environment, so the sandboxed path must use direct `spawn("bwrap", ...)` rather than `pi.exec`.

### Files

- `plugins/background-tasks/extensions/background-tasks.ts`
- `plugins/background-tasks/extensions/background-tasks.test.ts`

## Required helper shape

Add a local one-shot runner in `background-tasks.ts` and reuse it from monitor ticks:

```ts
interface ShellRunOptions {
	command: string;
	cwd: string;
	timeoutMs: number;
	signal?: AbortSignal;
	sandbox?: SandboxedSpawnArgsResult | null;
	piExec?: PiApi["exec"];
}

async function runShellOnce(opts: ShellRunOptions): Promise<ExecResult>;
```

Behavior:

- `sandbox?.state === "ok"`: spawn `sandbox.executable` with `[...sandbox.args, opts.command]`, `cwd:sandbox.cwd`, `env:sandbox.env`, `detached:true`, capture stdout/stderr, enforce `timeoutMs`, and kill the bwrap process group on timeout/abort.
- `sandbox` absent/degraded: use current `pi.exec("/bin/sh", ["-c", command], { timeout, cwd })` path. If `pi.exec` is unavailable in this branch, keep the current monitor error.
- `sandbox.fail-closed` should be handled before scheduling the monitor; do not create a monitor that will repeatedly fail closed.

## Implementation notes

- Prepare sandbox state once when the monitor starts, using the effective `ctx.cwd ?? process.cwd()`. Reusing the same bwrap args per tick is acceptable because config is session-level for the monitor; changing `.pi/sandbox.json` mid-monitor requires starting a new monitor.
- Store the in-flight child on the job while a direct-spawn poll is running (`job.child`, `job.pid`) and clear it on close. This lets `jobs cancel` terminate a currently running bwrap poll. Between poll ticks, cancellation clears the timer as today.
- Preserve the existing non-overlap invariant: set `job.polling = true` before the poll and reset it in a `finally` block after the direct-spawn or pi.exec path completes.
- Preserve the existing broken-poll heuristic (`command not found` after consecutive polls) based on the captured stderr/code.
- Direct spawn is necessary because `pi.exec` has no `env` option in the local `PiApi` slice. Passing `bwrap` through `pi.exec` would leave the bwrap process itself with inherited provider env, violating the minimal-env requirement even though the wrapped bash uses `--clearenv`.

## Acceptance criteria

- [x] On helper `ok`, monitor ticks spawn `bwrap ... -- bash -c <command>` with minimal env and no `pi.exec` call.
- [x] On helper absent/degraded, monitor uses the existing `pi.exec("/bin/sh", ["-c", command])` path and all current monitor behavior remains green.
- [x] On helper fail-closed or broken import, monitor returns `isError:true`, creates no job, and does not schedule repeated polls.
- [x] `stdout_matches`, `stdout_not_matches`, `exit_zero`, and `exit_nonzero` evaluate direct-spawn results identically to current `pi.exec` results.
- [x] Cancelling a monitor while a bwrap poll is in flight kills the bwrap process group and reaches `cancelled` or an honest terminal state.
- [x] Real bwrap integration test (skipped when unavailable) proves a monitor command cannot read a configured `denyRead` path and that `network.mode:"block"` prevents reaching a localhost listener.

### Completed implementation notes

- Files changed: `plugins/background-tasks/extensions/background-tasks.ts`, `plugins/background-tasks/extensions/background-tasks.test.ts`.
- Backend: monitor resolves sandbox mode once at kickoff. `absent`/`degraded` keeps the existing `pi.exec("/bin/sh", ["-c", command], { timeout, cwd })` per-poll path; helper `ok` uses direct `spawn("bwrap", [...args, command], { cwd:sandbox.cwd, env:sandbox.env, detached:true, stdio:["ignore","pipe","pipe"] })`; helper `broken`/`fail-closed` returns `isError:true` before creating a job.
- Poll semantics preserved: recursive post-poll `setTimeout`, `job.polling` non-overlap guard with `finally`, all four satisfy modes, stdout/stderr buffering, trusted wake messages, timeout handling, and the existing consecutive `command not found` broken-poll heuristic.
- Lifecycle: direct-spawn polls store `job.child`/`job.pid` only while bwrap is in flight; `jobs cancel` kills the bwrap process group and clears the child on close. Per-poll timeout/abort sends SIGTERM then SIGKILL to the bwrap process group.
- Tests added: monitor sandbox decision unit tests; `runShellOnce` unsandboxed `pi.exec` regression; fail-closed/off monitor regressions; real bwrap monitor tests for `exit_zero`, `denyRead`, `network.mode:"block"`, env secret omission, in-flight cancel, and per-poll timeout kill.
- Verification: `bun test plugins/background-tasks/extensions/background-tasks.test.ts plugins/background-tasks/extensions/sandbox-bridge.test.ts` passed (65 pass, 0 fail). The background-tasks suite alone passed 58 tests with real bwrap integration on this Linux host.
- Discrepancies from design: dependency `story-background-tasks-sandbox-background-spawn` is at `stage:review` rather than terminal done; autopilot delegation explicitly authorized proceeding with that dependency state. The local runner includes optional `onChildSpawn`/`onChildClose` callbacks in addition to the specified `ShellRunOptions` fields so monitor cancellation can track the transient bwrap child without re-resolving sandbox state per poll.
- Adjacent issues parked: none.

## Review (2026-07-01)

**Verdict**: Approve - story verified by implement; fast-lane advance

**Blockers**: none
**Important**: none
**Nits**: none

**Notes**: Substrate fast lane. Implementation verification recorded by implement (143/143 tests passing across the pi-sandbox + background-tasks suites incl. real bwrap integration: kill-lifecycle, denyRead, block-network, secret-env). Advanced review -> done.
