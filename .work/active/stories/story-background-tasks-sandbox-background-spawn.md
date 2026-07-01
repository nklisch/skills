---
id: story-background-tasks-sandbox-background-spawn
kind: story
stage: implementing
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

- Add `waitForChildSpawn(child): Promise<void>` that resolves on the child `spawn` event and rejects on an early `error`. This lets the tool call return an immediate error for bwrap spawn failures instead of claiming the job started.
- Keep `detached:true`. The child pid is the `bwrap` pid; existing `process.kill(-pid, sig)` targets the bwrap process group. Bubblewrap propagates termination to the wrapped process namespace, and the negative-pid kill covers bwrap plus its child process group.
- Store `job.pid = child.pid` after successful spawn exactly as today.
- Include non-sensitive details such as `details.sandbox = "active" | "degraded" | "absent"` if useful, but never include command output in wakes.
- Do not send env overrides directly in the sandboxed branch; use only the helper-returned minimal env.

## Acceptance criteria

- [ ] On Linux with helper `ok`, the background tool spawns `bwrap` with `[..., "--", "bash", "-c", command]` and minimal env.
- [ ] With helper absent/degraded, behavior matches today's `/bin/sh` spawn and env merge.
- [ ] With helper fail-closed or broken import, the tool returns `isError:true`, creates no job, and does not run the command unsandboxed.
- [ ] Existing wake-on-pattern, output buffering, terminal wake, pruning, and shutdown tests remain green.
- [ ] Real bwrap integration test (skipped when `bwrap` is unavailable) proves a sandboxed background command cannot read a configured `denyRead` path.
- [ ] Real bwrap integration test (skipped when `bwrap` is unavailable) proves cancelling a sandboxed `sleep` job terminates the wrapped command and reports `cancelled` rather than leaving an orphan.
