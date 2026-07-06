---
id: idea-pi-sandbox-degraded-spawn-env-leak
kind: story
stage: done
tags: [security, sandbox]
parent: null
depends_on: []
release_binding: null
gate_origin: null
created: 2026-07-05
updated: 2026-07-05
git_ref: 564e8a9
---

# Degraded background/monitor spawn returns full inherited env; `scrubEnv` mutates global process.env

## Source

Surfaced in the 2026-07-05 full security audit of `plugins/pi-sandbox/` (env/secret-surface
deep dive). Lower priority than the in-process file-policy gaps because the healthy
Linux+bwrap path correctly uses `buildMinimalEnv`; the leak is in the degrade/fail paths.

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
