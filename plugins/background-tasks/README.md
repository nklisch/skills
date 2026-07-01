# Background Tasks

Pi-native tools for long-running shell commands and state polling. The package registers:

- `background` — run a shell command detached and wake the agent when it exits, optionally waking early on a regexp match.
- `monitor` — poll a shell command until `exit_zero`, `exit_nonzero`, `stdout_matches`, or `stdout_not_matches` is satisfied, or until timeout.
- `jobs` — list, tail, status, cancel, or view the job registry.

Wake messages are extension-authored and contain only job ids/status. Command output is never auto-injected; read it intentionally with `jobs action=tail` or `jobs action=view`.

## Install

```bash
pi install /home/agent/projects/skills/plugins/background-tasks
```

The package is Pi-only. It has no Claude Code or Codex runtime surface because the detached job registry and wake channel are Pi extension behavior.

## Sandbox integration

`@nklisch/pi-background-tasks` has an optional peer dependency on `@nklisch/pi-sandbox`. When both packages are installed, background-tasks asks pi-sandbox for a spawn contract before running `background` or `monitor` commands.

Configuration lives in the pi-sandbox config file, not in a separate background-tasks file:

```json
{
  "backgroundTasks": {
    "sandboxIntegration": "auto"
  }
}
```

`"auto"` is the default. On Linux, when pi-sandbox is enabled, config is valid, `bwrap` is available, and `network.mode` is `"open"` or `"block"`, `background` and `monitor` commands run through pi-sandbox's real bwrap backend with the same filesystem policy and minimal environment used for mediated `bash`.

Set `"sandboxIntegration":"off"` only as an explicit operator bypass. In that mode, background/monitor use their normal unsandboxed spawn path. Project-local pi-sandbox config cannot loosen a global/default `"auto"` setting to `"off"` because pi-sandbox config merging is additive-only.

## Fail-closed and degrade behavior

| State | background/monitor behavior | pi-sandbox tool-egress default |
|---|---|---|
| Linux + pi-sandbox installed/enabled + `sandboxIntegration:"auto"` + `bwrap` available + valid `open`/`block` network config | Real bwrap sandboxing | `allow` |
| pi-sandbox package absent | Normal unsandboxed behavior | no pi-sandbox policy exists |
| `sandboxIntegration:"off"` | Normal unsandboxed behavior by explicit operator opt-out | `confirm` (blocks without UI) unless tightened to `block` |
| non-Linux host | Graceful unsandboxed degrade | `confirm` (blocks without UI) unless tightened |
| invalid config, missing `bwrap`, `network.mode:"filter"`, or helper import broken | Fail closed; the tool call returns an error and does not run unsandboxed | `confirm` or stricter fail-closed block |

Real sandboxing is Linux-only in this release. macOS and Windows can still use background-tasks, but shell commands are not OS-confined there; rely on pi-sandbox's `confirm`/fail-closed tool policy if you need to prevent accidental background/monitor bypasses.

Check `/sandbox` in a Pi session to see the effective state:

```text
Background tasks sandbox: active (Linux bwrap integration ready)
Bypass tools: background=allow, monitor=allow
```

If that line says `inactive` or `blocked`, the commands are not being sandboxed and pi-sandbox keeps the bypass policy at `confirm`/fail-closed by default.

The older substrate backlog item `.work/backlog/idea-background-tasks-sandbox-integration.md` is implemented by this integration; it remains only as historical context until the release process archives or collapses it.

## Usage patterns

```text
background: command="bun test", label="unit-tests"
monitor: command="test -f dist/bundle.js && echo READY", satisfy_on="stdout_matches", pattern="READY", interval_seconds=5, timeout_seconds=120
jobs: action="tail", jobId=1
```

Use `background` for a long command whose exit matters. Use `monitor` when waiting for a condition by re-checking state. Do not hand-roll `sleep` loops; launch the job/monitor, keep working, and read output after the wake.
