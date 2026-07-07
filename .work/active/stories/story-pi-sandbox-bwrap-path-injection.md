---
id: story-pi-sandbox-bwrap-path-injection
kind: story
stage: done
tags: [security, sandbox]
parent: null
depends_on: []
release_binding: null
gate_origin: null
created: 2026-07-06
updated: 2026-07-07
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

## Review (2026-07-06)

**Verdict**: Request changes — BLOCKER (bounced to implementing)

**Mode/Depth**: substrate / deep (two-phase: advisory → adversarial), fresh-context
`openai-codex/gpt-5.5` each phase.

**Blockers** (two, coupled — filed as `story-pi-sandbox-bwrap-path-project-trust`):
- B2-1: `mergeProjectAdditive` (`sandbox-config.ts:847`) lets project-local
  `.pi/sandbox.json` set `bwrapPath` to any absolute executable. A malicious
  checkout with `{"bwrapPath":"/tmp/evil-bwrap"}` + a planted executable runs
  the attacker's binary as the "bwrap" wrapper → sandbox escape. This directly
  contradicts the README additive-only contract (line 72) and defeats the B2
  PATH-allowlist fix. Verified by orchestrator against `loadConfig`
  (`sandbox-config.ts:714` reads `<cwd>/.pi/sandbox.json`).
- B2-2: `buildSandboxedSpawnArgs` re-loads project config and re-resolves per
  spawn (implementer's option (i)). A project can start benign, then write a
  hostile `bwrapPath` mid-session → next `background`/`monitor` spawns the
  hostile wrapper. Literal miss on acceptance criterion 5 ("both paths use the
  pinned bwrap"). Compounds B2-1 into a mid-session exploitable escape.

**Important** (filed): B2-3 README drift (bwrap no longer "on PATH"; additive-only
  claim contradicted) → `story-pi-sandbox-readme-bwrappath-drift`. Depends on
  the B2-1 trust decision.

**Refuted** (Phase 1 concerns that didn't hold): `validateBwrapInit` legacy
  `bwrapAvailable:true` branch is not a production bypass; non-Linux bash
  correctly degrades; stale `pinnedBwrapPath` across session start is reset.

**Notes**: the PATH-allowlist + `resolveTrustedBwrap` core is sound and the
hostile-PATH escape is genuinely closed (verified by `bwrap-pin.test.ts`). The
blocker was the trust scope of `bwrapPath` itself: it must not be settable from
untrusted project config. Fix direction in `story-pi-sandbox-bwrap-path-project-trust` (Decision A: global-only vs
allowed-with-ownership; recommend global-only). This story is bounced rather
than advanced because the blocker is in-scope to the B2 fix's trust model,
not a separate concern.

## Re-review (2026-07-06)

**Verdict**: Approve → done.

The blocker (B2-1/B2-2) is resolved by `story-pi-sandbox-bwrap-path-project-trust`
(decision (a) global-only): `mergeProjectAdditive` now rejects project-local
`bwrapPath` with an additive-only warning, closing both the direct project-config
escape (B2-1) and the mid-session TOCTOU (B2-2 — project config can no longer set
`bwrapPath` at all, so writing `.pi/sandbox.json` mid-session cannot change the
spawn path; the spawn re-resolution's option-(i) purity is preserved without
needing the handshake thread). The stale test fixture asserting project-local
`bwrapPath` was accepted is rewritten to assert rejection. README reconciled
(`story-pi-sandbox-readme-bwrappath-drift`). Verification: 124 + 71 green.
