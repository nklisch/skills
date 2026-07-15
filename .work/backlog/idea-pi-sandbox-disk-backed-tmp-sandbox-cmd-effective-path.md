---
id: idea-pi-sandbox-disk-backed-tmp-sandbox-cmd-effective-path
kind: idea
stage: backlog
tags: [sandbox, observability]
parent: null
depends_on: []
release_binding: null
gate_origin: null
research_refs: []
research_origin: null
created: 2026-07-14
updated: 2026-07-14
---

# /sandbox command should report the effective project temp path + backend

## Source

Round-4 deep review (Phase 1 + Phase 2 both flagged). Important.

## Problem

The `/sandbox` diagnostic command (`sandbox-config.ts:2024-2033,2106`) prints a
freshly-loaded CONFIG `tmpBackend` ("Temp backend: session-disk
(global/operator-only)") but NOT the resolved/effective session state — the
actual canonical project temp dir path, the effective backend, or the backing
fs type. The old `getProjectTmpDirResolved` accessor (now removed) was never
wired to the command (R2-I6 noted this), so the redesign didn't regress
anything, but under an operator-asserted design the operator cannot inspect
the actual target the session is using.

## Fix direction

Thread the effective session state through `SandboxCommandState` and render in
`/sandbox`:
- Effective `tmpBackend` (resolved, not just configured)
- The resolved project temp dir path (from `getProjectTmpDir()`)
- Optionally the backing fs type (a read-only `statfsSync`, observability only
  — not a gate; see the tmpfs-startup-warning idea)

This materially strengthens an operator-asserted design: the operator can
verify the session is using the path they asserted. Test the command output.

## Notes

- `getProjectTmpDir()` / `getTmpBackend()` accessors already exist; the
  command just doesn't read them. After the B2 accessor-divergence fix (so the
  accessors are trustworthy), wiring them to the command is straightforward.
