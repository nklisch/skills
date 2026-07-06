---
id: story-pi-sandbox-bwrap-path-injection
kind: story
stage: review
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

- [x] bwrap is resolved once at session_start, not per-command
- [x] A hostile PATH (user-writable dir with a fake bwrap) is rejected
- [x] The standard system bwrap (`/usr/bin/bwrap`) is accepted without config
- [x] Fail-closed error message names the rejected path and the reason
- [x] Both the bash tool path AND the background-tasks spawn path use the pinned bwrap

## Implementation notes

- Land-mode check: working tree was clean for this story at start (no `git status --short` entries); recent history was `c537cfa scope: file v0.1.0 readiness review findings + session note`, `fffa6e2 review: advance feature-pi-sandbox-inspector-hardening to done`, `065d52f review: fast-lane advance 3 inspector stories to done`, `6744e8e implement: story-pi-sandbox-inspector-bare-token-docs`, `0b14e80 implement: story-pi-sandbox-inspector-redos-guard`. No partial bwrap-path fix was present.
- Files changed: `plugins/pi-sandbox/extensions/sandbox-bwrap.ts`, `plugins/pi-sandbox/extensions/sandbox-config.ts`, `plugins/pi-sandbox/extensions/sandbox.ts`, `plugins/pi-sandbox/extensions/sandbox-spawn.ts`, `plugins/pi-sandbox/extensions/sandbox-spawn.test.ts`, `plugins/pi-sandbox/extensions/bwrap-pin.test.ts`.
- Spawn-path approach: chose option (i). `buildSandboxedSpawnArgs()` remains pure and calls `resolveTrustedBwrap()` per spawn, but that resolver is PATH-independent and only uses `sandbox.bwrapPath` or the absolute allowlist (`/usr/bin/bwrap`, `/bin/bwrap`). This avoids adding global-symbol/session coupling to background-tasks while closing the hostile-PATH escape; the bash tool path pins once at `session_start` and commands read only the pinned path.
- Acceptance coverage:
  - Bash path: `session_start` resolves trusted bwrap, stores `pinnedBwrapPath`, fails closed with a named reason/rejected path on failure, resets on shutdown, and `createSandboxedBashOps()` no longer calls `findExecutableOnPath()`.
  - Background-tasks path: `buildSandboxedSpawnArgs()` uses `resolveTrustedBwrap()` and never resolves bwrap from `baseEnv.PATH` or `envAdd.PATH`; failure messages reference the trusted allowlist/configured path and include rejected paths when available.
  - Config: added `sandbox.bwrapPath?: string`, shape validation, global merge, and project-local merge so operators can pin custom trusted binaries per project.
  - Hostile PATH: new tests create an executable fake `bwrap` in a temp PATH directory and assert the trusted resolver never selects it.
- Tests added: `plugins/pi-sandbox/extensions/bwrap-pin.test.ts` covers allowlist acceptance, hostile PATH rejection, configured non-executable rejection with named path, configured executable override, config validation, and project-local `bwrapPath` merge.
- Verification:
  - `cd plugins/pi-sandbox && bun test 2>&1 | tail -8` → 108 pass, 0 fail.
  - `cd plugins/background-tasks && bun test 2>&1 | tail -5` → 71 pass, 0 fail.
- Discrepancies from design: the background-tasks spawn path does not consume the session-pinned module variable; it deliberately re-runs the pure PATH-independent resolver per spawn to avoid brittle cross-package session state.
- Adjacent issues parked: none.
