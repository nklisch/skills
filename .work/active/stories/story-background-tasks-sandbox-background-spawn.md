---
id: story-background-tasks-sandbox-background-spawn
kind: story
stage: done
tags: [security, sandbox, plugin]
parent: feature-background-tasks-sandbox-integration
depends_on: [story-background-tasks-sandbox-import-config]
release_binding: null
gate_origin: null
created: 2026-07-01
updated: 2026-07-01
---

# Route background jobs through pi-sandbox bwrap

## Scope

Wire the `background` tool's long-running spawn site through `buildSandboxedSpawnArgs` while preserving the existing job registry, trusted wake messages, cancellation, timeout/shutdown cleanup, and current no-sandbox degrade behavior.

### Files

- `plugins/background-tasks/extensions/background-tasks.ts`
- `plugins/background-tasks/extensions/background-tasks.test.ts`
- `plugins/pi-sandbox/extensions/sandbox.test.ts` only if a lower-level helper integration test is more stable there.

## Required behavior

Current spawn site:

```ts
spawn(command, {
  shell: "/bin/sh",
  cwd,
  env: { ...process.env, ...envAdd },
  detached: true,
  stdio: ["ignore", "pipe", "pipe"],
});
```

New sandboxed branch:

```ts
const sandbox = await prepareSandboxedSpawn({ command, cwd, envAdd });
if (sandbox.state === "ok") {
  const child = spawn(sandbox.executable, [...sandbox.args, command], {
    cwd: sandbox.cwd,
    env: sandbox.env,
    detached: true,
    stdio: ["ignore", "pipe", "pipe"],
  });
  await waitForChildSpawn(child);
  // register job as today
}
```

Fallback branches:

- resolver `absent` OR helper `degraded` -> current unsandboxed `spawn(command, { shell:"/bin/sh", env:{...process.env,...envAdd}, ... })`.
- resolver `broken` OR helper `fail-closed` -> return `isError:true`; do not create a job and do not spawn the command.
- `spawn("bwrap", ...)` synchronous/early `error` before `spawn` event -> return `isError:true`; do not fall back to `/bin/sh`.

## Implementation notes

- Files changed:
  - `plugins/background-tasks/extensions/background-tasks.ts`
  - `plugins/background-tasks/extensions/background-tasks.test.ts`
- Spawn-decision branches:
  - resolver `absent` -> current unsandboxed `/bin/sh` spawn with `{ ...process.env, ...envAdd }`.
  - helper `degraded` -> current unsandboxed `/bin/sh` spawn using the helper-returned normal env; logs the non-sensitive degrade reason.
  - helper `ok` -> `spawn("bwrap", [...args, command], { cwd, env: helperMinimalEnv, detached:true, stdio:["ignore","pipe","pipe"] })` with no process env merge.
  - resolver `broken`, helper `fail-closed`, or early `bwrap` spawn error -> `isError:true`, no job registration, no unsandboxed fallback.
- Lifecycle preservation: the existing job object, `job.child`, `job.pid`, stdout/stderr buffering, wake-on-pattern, `exit`/`error` handlers, cancellation, shutdown cleanup, pruning, and trusted output-free wakes remain downstream of the single spawn decision. The tracked pid is still the actual detached child pid; in sandboxed mode that pid is the `bwrap` pid.
- Tests added:
  - Pure unit coverage for absent, ok, degraded, broken, and fail-closed spawn decisions.
  - Tool-level fail-closed regression for helper refusal and early `bwrap` spawn error (no marker file, no job).
  - Real bwrap integration coverage for denyRead masking, secret env filtering, block-mode localhost network isolation, and cancellation/kill lifecycle.
- Kill-lifecycle proof: on this Linux box with bwrap 0.11.0, the integration test starts a sandboxed command that ignores `SIGTERM`, sleeps, and would write `bg-kill-marker-*` if orphaned. `jobs(action=cancel)` drives the existing negative-pgid kill path, escalates as needed, reports `cancelled`, emits no completion wake, and the marker remains absent after the post-kill wait. This proves `process.kill(-child.pid, ...)` against the bwrap process group terminates the wrapped command rather than orphaning it.
- Discrepancies from design: none.
- Adjacent issues parked: none.

## Acceptance criteria

- [x] On Linux with helper `ok`, the background tool spawns `bwrap` with `[..., "--", "bash", "-c", command]` and minimal env.
- [x] With helper absent/degraded, behavior matches today's `/bin/sh` spawn and env merge.
- [x] With helper fail-closed or broken import, the tool returns `isError:true`, creates no job, and does not run the command unsandboxed.
- [x] Existing wake-on-pattern, output buffering, terminal wake, pruning, and shutdown tests remain green.
- [x] Real bwrap integration test (skipped when `bwrap` is unavailable) proves a sandboxed background command cannot read a configured `denyRead` path.
- [x] Real bwrap integration test (skipped when `bwrap` is unavailable) proves cancelling a sandboxed `sleep` job terminates the wrapped command and reports `cancelled` rather than leaving an orphan.

## Review (2026-07-01)

**Verdict**: Approve - story verified by implement; fast-lane advance

**Blockers**: none
**Important**: none
**Nits**: none

**Notes**: Substrate fast lane. Implementation verification recorded by implement (143/143 tests passing across the pi-sandbox + background-tasks suites incl. real bwrap integration: kill-lifecycle, denyRead, block-network, secret-env). Advanced review -> done.
