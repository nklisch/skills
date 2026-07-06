---
id: story-pi-sandbox-bwrap-path-injection
kind: story
stage: implementing
tags: [security, sandbox]
parent: null
depends_on: []
release_binding: null
gate_origin: null
created: 2026-07-06
updated: 2026-07-06
---

# bwrap resolved from untrusted process.env.PATH (blocker B2)

## Source

Surfaced in the 2026-07-06 v0.1.0 readiness adversarial review (bwrap/bash
deep-dive, fresh-context gpt-5.5). CONFIRMED blocker.

## Problem

`createSandboxedBashOps()` resolves `bwrap` at execution time via
`findExecutableOnPath("bwrap", process.env)` (`sandbox.ts:115`,
`sandbox-bwrap.ts:250-258`). The resolver accepts the first PATH entry with an
executable `bwrap`, with no ownership/writability/allowlist check. If pi is
launched with a hostile PATH (or a user-writable dir is prepended to PATH), a
fake `bwrap` receives the full intended argv and runs `bash -c` **unsandboxed**.

The same applies to the background-tasks spawn path: `buildSandboxedSpawnArgs`
documents that wrapper resolution uses `trustedEnv` (opts.baseEnv ?? process.env),
but `process.env` itself is not trusted — a hostile PATH is the attack vector.

## Fix direction

Resolve and pin `bwrap` once at `session_start` from a trusted source, not at
every command. Options (orchestrator picks, surface the tradeoff):

- **(a) Allowlist** — only accept `/usr/bin/bwrap` or `/bin/bwrap` (the standard
  system paths). Reject anything else with a fail-closed error. Simplest,
  strongest, but breaks dev/custom bwrap installs.
- **(b) Ownership check** — accept any bwrap but verify the resolved path is
  root-owned and not in a user-writable directory. More permissive, but the
  ownership check itself is non-trivial cross-platform.
- **(c) Configurable pin** — add a `bwrapPath` config field defaulting to
  `/usr/bin/bwrap`; operators who need a custom path set it explicitly. Most
  flexible, but relies on operator not misconfiguring.

The pin must happen at `session_start` (once) and the resolved path stored;
the spawn paths read the pinned path, not re-resolve. The same pinned path
flows to `buildSandboxedSpawnArgs`.

## Acceptance criteria

- [ ] bwrap is resolved once at session_start, not per-command
- [ ] A hostile PATH (user-writable dir with a fake bwrap) is rejected
- [ ] The standard system bwrap (`/usr/bin/bwrap`) is accepted without config
- [ ] Fail-closed error message names the rejected path and the reason
- [ ] Both the bash tool path AND the background-tasks spawn path use the pinned bwrap
