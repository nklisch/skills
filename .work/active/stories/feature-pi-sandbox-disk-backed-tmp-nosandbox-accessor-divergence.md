---
id: feature-pi-sandbox-disk-backed-tmp-nosandbox-accessor-divergence
kind: story
stage: implementing
tags: [bug, sandbox]
parent: feature-pi-sandbox-disk-backed-tmp
depends_on: []
release_binding: null
gate_origin: null
research_refs: []
research_origin: null
created: 2026-07-14
updated: 2026-07-14
---

# Module accessor diverges from activePolicy on the --no-sandbox path

## Source

Round-4 deep review (Phase 2 adversarial, `gpt-5.6-sol` fresh-context).
Blocker B2.

## Problem

The redesign's stated goal was to kill the dual-source-of-truth divergence
between module-level accessor state (`getProjectTmpDir()` / `getTmpBackend()`)
and the `activePolicy` object. It succeeded on the healthy Linux path (B1
fix: derivation → single `SessionInit` record → one policy construction, no
intervening `await). But it left the divergence alive on the `--no-sandbox`
early-return path.

`session_start` resets `tmpBackend = "session-disk"` at the top (line 616,
before any branch). The `--no-sandbox` branch (line 627-640) installs a
permissive policy via `createPermissivePolicy(ctx.cwd)` — which sets
`tmpBackend: "host-tmpfs"` — and returns WITHOUT updating the module-level
`tmpBackend`. So after a `--no-sandbox` session_start:

- `getSandboxPolicy().tmpBackend` === `"host-tmpfs"` (from the permissive policy)
- `getTmpBackend()` === `"session-disk"` (stale module state)

`buildSandboxedSpawnArgs` (`sandbox-spawn.ts:323-324`) reads the module
accessors (not the policy) when the caller omits overrides. On a healthy Linux
host with `--no-sandbox`, it reaches `buildBwrapArgs` with `tmpBackend:
"session-disk"` and no `projectTmpDir` → `buildBwrapArgs` throws
`session-disk requires projectTmpDir` → the background/monitor command
**fails to start** (bwrap-build-error / fail-closed).

This changes the documented `--no-sandbox` residual from "background may still
run sandboxed" to "background fails to start" — a regression in the bypass
behavior.

The same divergence class exists on every early-return branch that doesn't
re-derive: `--no-sandbox`, disabled-via-config, parse-error, hardlink-fail,
bwrap-missing, degrade, fail-closed. The `--no-sandbox` path is the one with
the observable user-facing break (background commands fail).

## Fix direction

- The accessors must reflect the active session state. Either:
  - (a) derive the accessors from `activePolicy` (read through
    `getSandboxPolicy()` rather than separate module state), so they can't
    diverge by construction; or
  - (b) update `tmpBackend` (and `projectTmpDir`) on EVERY branch that
    installs a policy, matching the policy's values — including the
    `--no-sandbox` and disabled branches.
- Prefer (a) if feasible without a large refactor: a single source of truth
  (the policy) is the structural fix the redesign was aiming for.
- Separately, `--no-sandbox` does not propagate to the background-tasks bridge
  today (a pre-existing documented residual in THREAT_MODEL). The accessor
  divergence makes that residual worse. Wiring `--no-sandbox` to the bridge
  is out of scope for this story (it's a separate known gap) but the accessor
  fix must not depend on it.

## Acceptance

- [ ] After a `--no-sandbox` session_start, `getTmpBackend()` agrees with
      `getSandboxPolicy().tmpBackend` (both `host-tmpfs`).
- [ ] After a `--no-sandbox` session_start, a background/monitor command does
      NOT throw `session-disk requires projectTmpDir` — it resolves via the
      accessors to the host-tmpfs branch (or the bridge degrades cleanly).
- [ ] Every early-return branch leaves the accessors consistent with the
      installed policy.
- [ ] Test: real `session_start` with `noSandbox: true` → accessor/policy
      agreement + a background-spawn resolution that does not throw.

## Notes

- This is the same bug class as B1/R2-B2 (accessor vs policy divergence),
  surviving on a path the redesign didn't re-check. The structural fix
  (single source of truth) is the right shape; per-branch state updates are
  the minimal fix.
