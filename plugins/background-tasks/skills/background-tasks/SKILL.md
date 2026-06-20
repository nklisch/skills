---
name: background-tasks
description: >
  Run long commands in the background and get woken when they finish, poll a command until a
  condition holds, and manage the resulting job registry. Reaches for three agent tools —
  background (run detached, wake on exit or first pattern match), monitor (poll until exit_zero /
  exit_nonzero / stdout_matches / stdout_not_matches, or timeout), and jobs (list, tail, status,
  cancel). Use whenever work involves a long-running command (test suite, build, deploy, CI run,
  watch/serve) or waiting on a state (CI going green, a file or port appearing, a log line) where
  blocking the turn would waste it. The tools are pi-runtime-only: this skill is the portable
  description of when and how to use them; they register via the pi extension and degrade to
  informational in harnesses that lack it.
---

# Background Tasks

Three agent tools for long-running and state-waiting work, so the agent's turn
is never blocked on a slow command and never busy-loops waiting for a condition.

- **`background`** — run a shell command detached, get woken with the exit code
  and an output tail when it exits. Optionally wake early the first time output
  matches a regexp (`wake_on_pattern`); the job keeps running and still wakes on
  exit.
- **`monitor`** — poll a shell command on an interval until a condition is
  satisfied, then wake with the result. `satisfy_on` selects the condition:
  `exit_zero`, `exit_nonzero`, `stdout_matches` (needs `pattern`), or
  `stdout_not_matches` (needs `pattern`). Times out after `timeout_seconds`.
- **`jobs`** — `list`, `tail`, `status`, or `cancel` over the registry.

## When to use which

| Situation | Tool |
|---|---|
| A single long command whose exit matters (tests, build, deploy, `npm run`, a migration) | `background` |
| Waiting for a **state** by re-checking (CI green, file/port/log line, a queue draining) | `monitor` |
| Check on, read output of, or stop an existing background job or monitor | `jobs` |
| A short command (under a few seconds) | the ordinary `bash` tool — don't background it |

The signal: if blocking the turn on a command would waste the turn, use
`background`. If the agent would otherwise sleep-and-recheck in a loop, use
`monitor` instead — it does the polling off-turn and wakes the agent exactly
once, with the result.

## How the wake-up works

Both `background` and `monitor` return immediately with a job id; the turn can
end. When the job finishes (`background`) or the condition is met/times out
(`monitor`), the agent is woken in a new turn carrying the exit code and an
output tail. Cancellation (`jobs action=cancel`) stops a job **without** waking
— a cancelled job produces no completion message.

Output sent back to the agent is tail-truncated to keep context bounded; a
rolling in-memory buffer per job prevents unbounded memory growth on very long
runs. Use `jobs action=tail` to read more of a job's buffered output.

## Patterns

**Run the test suite without blocking the turn:**
```
background: command="bun test", label="unit-tests"
```

**Watch CI on the current branch until it goes green (or red), polling every 30s:**
```
monitor: command="gh run list --branch $(git branch --show-current) -L 1 --json status,conclusion",
         satisfy_on="stdout_matches", pattern='"conclusion":"(success|failure)"',
         interval_seconds=30, timeout_seconds=1800, label="ci"
```
The conclusion regex matches either terminal state, so the agent is woken as
soon as CI finishes regardless of pass/fail — then it reads the actual
conclusion from the returned output.

**Wake early the moment a build emits a known marker, but still get the final exit:**
```
background: command="./slow-build.sh", wake_on_pattern="BUILD SUCCESSFUL", label="build"
```

**Wait for a file to appear (e.g. a generated artifact), then proceed:**
```
monitor: command="test -f dist/bundle.js && echo READY", satisfy_on="stdout_matches",
         pattern="READY", interval_seconds=5, timeout_seconds=120, label="artifact"
```

## Guardrails

- Set a `timeout_seconds` on every `monitor` so a condition that never holds
  wakes the agent with a timeout instead of polling indefinitely.
- Prefer `monitor` over `background` for any "wait until X" goal — `background`
  waits on one command's exit, not on a re-checked condition.
- Don't background trivially short commands; the ordinary `bash` tool is
  cheaper and returns inline.
- The ordinary `bash` tool is unchanged; these tools are an additional surface
  for the long-running and state-waiting cases specifically.

## Runtime availability

These tools are registered by the `background-tasks` pi extension and are
callable only inside the pi runtime. In a harness without the extension, this
skill is informational: the agent knows the *pattern* (background a long
command, poll for a condition) but must fall back to the ordinary shell tool and
manage waiting itself. This is intentional harness-specific surface — the
portable knowledge is the when/why above; the executable ergonomics live in the
extension.
