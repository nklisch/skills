---
id: story-pi-sandbox-degraded-spawn-scrubenv-redesign
kind: story
stage: implementing
tags: [security, sandbox]
parent: null
depends_on: []
release_binding: null
gate_origin: null
created: 2026-07-05
updated: 2026-07-06
git_ref: 564e8a9
---

# Degraded spawn env: per-child scrubEnv + config-extensible strip + test coverage spawn returns full inherited env; `scrubEnv` mutates global process.env

## Source

Surfaced in the 2026-07-05 full security audit of `plugins/pi-sandbox/` (env/secret-surface
deep dive). Lower priority than the in-process file-policy gaps because the healthy
Linux+bwrap path correctly uses `buildMinimalEnv`; the leak is in the degrade/fail paths.

## Status (2026-07-05)

Partially drained in the 0.1.0 audit pass (commit 564e8a9):

- ✅ **Degraded background/monitor returns full inherited env** — fixed.
  `buildSandboxedSpawnArgs` now strips known provider secret env vars in all
  three degrade paths (integration-off, sandbox-disabled, unsupported-platform).
  The healthy bwrap path was already safe via `buildMinimalEnv`.
- ⏳ **`scrubEnv` mutates global `process.env`** — UNFIXED. `scrubEnv` still does
  `delete process.env[name]` process-wide at `session_start`, and broad glob
  patterns (e.g. `ANTHROPIC_*`) can match live auth vars and break env-backed
  provider auth. Needs redesign to per-child env construction only, or
  warn/fail-closed when a scrub pattern matches a known provider key. This is
  problem 2 below.

## Review (fresh-context gpt-5.5, 2026-07-05)

- ❌ **Degraded monitor ignored sanitized env (R2, fixed in `5d2aa1a`):**
  `decideMonitorPoll` discarded `result.env`, so degraded monitors ran via
  `pi.exec` (no env option) and inherited full `process.env`. The background
  tool was fixed; monitor was not. **Fixed:** carry sanitized env through
  `MonitorPollDecision` and direct-spawn `/bin/sh -c` with it from
  `runShellOnce` when `degradedEnv` is set.
- ⚠️ **`stripProviderSecrets` is hardcoded, not config-extensible (G2, deferred):**
  Only the static built-in list is stripped; `envScrub.names`/`patterns` are
  ignored in degraded spawn. Custom provider keys or `*_TOKEN` vars still leak.
  Fix: reuse loaded `envScrub` config in the strip. **Not yet fixed.**
- ⚠️ **Test covers only 1 of 3 degrade paths (G3, deferred):** the new test only
  exercises `unsupported-platform`; doesn't cover `integration-off` or
  `sandbox-disabled`. **Not yet fixed.**

Verdict: background fixed; monitor regression fixed; strip-list extensibility and
test coverage are deferred follow-ups.

## Problem

Two related env-surface findings:

1. **Degraded background/monitor modes return full inherited env** (Medium).
   `sandbox-spawn.ts:83-89,106-128,154-163,195-217` — when integration is off, sandbox
   disabled, or platform unsupported, `buildSandboxedSpawnArgs` returns
   `normalEnv = { ...process.env, ...envAdd }`. Background-tasks then runs unsandboxed with
   the full inherited env. Any `OPENAI_API_KEY` / `ZAI_API_KEY` still present in
   `process.env` leaks to those child shells in degraded mode. (The healthy bwrap path is
   fine — `buildMinimalEnv` allowlists only `PATH`/`HOME`/`TERM`/`LANG`/`TMPDIR`/`LC_*`.)

2. **`scrubEnv` mutates global `process.env` and can break env-backed provider auth**
   (Medium). `sandbox.ts:487-498` + `sandbox-config.ts:1171-1195` — `scrubEnv` does
   `delete process.env[name]` process-wide at `session_start`. Glob patterns are anchored
   case-insensitively: `ANTHROPIC_*` matches both `ANTHROPIC_AUTH_TOKEN` (orphan, intended
   scrub) and `ANTHROPIC_OAUTH_TOKEN` / `ANTHROPIC_API_KEY` (live auth). Pi core reads
   env-backed provider keys at request time, so a too-broad pattern breaks auth. Exact
   scrub names/patterns win over the `piEnvKeyKeep` keep list. This host uses `auth.json`
   (not env-backed auth) so it is unaffected, but the default `envScrub.names` only scrubs
   `ANTHROPIC_AUTH_TOKEN` and leaves all real provider keys in `process.env` — readable
   by any in-process code or unsandboxed spawn.

## Recommended fix direction

- In degraded/unsandboxed modes, return a safe minimal env by default (or at minimum strip
  known provider secret env names); require an explicit operator opt-in for full-env
  inheritance.
- Do not mutate global `process.env` for sandboxing — prefer per-child env construction
  only. If process-wide scrub remains, warn/fail-closed when a scrub pattern matches a
  known provider env var unless the operator explicitly opts into breaking env-backed
  provider auth.

## Scope hint

Distinct from the file-policy items — this is the env-construction surface in
`sandbox-spawn.ts` and the env-scrub surface in `sandbox.ts`/`sandbox-config.ts`. Pairs
with the documented RPC/API direct-bash bypass (a known non-goal in current pi core) as
the two "env leaks via non-bwrap spawn paths" gaps.
