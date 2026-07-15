---
id: feature-pi-sandbox-background-project-tmp-state
kind: feature
stage: drafting
tags: [bug, sandbox, background-tasks, plugin]
parent: null
depends_on: [feature-pi-sandbox-disk-backed-tmp]
release_binding: null
gate_origin: null
created: 2026-07-14
updated: 2026-07-14
---

# Keep background-task sandbox spawn state coherent with the live pi-sandbox session

## Brief

The live v0.1.0 review-fix session could run ordinary sandboxed `bash`, but both
`background` invocations failed before spawning with:

> Sandbox refused to start background command: Sandbox tmpBackend=session-disk requires projectTmpDir (the pinned per-project disk temp dir). The session_start hook must derive and thread it through; never silently fall back to host /tmp.

This occurred from the repository root after the disk-backed temp work had
landed and prevented detached test runs. The failure is real and correctly
fail-closed, but it exposes incoherent lifecycle state: the mediated bash path
has a healthy session-pinned project temp directory while the independently
resolved `@nklisch/pi-sandbox/sandbox-spawn` helper observes the default
`session-disk` backend with no corresponding `projectTmpDir`.

The likely seam spans `plugins/pi-sandbox/extensions/sandbox.ts`,
`sandbox-spawn.ts`, and background-tasks' cached bridge/import lifecycle. The
feature must establish one coherent initialized spawn contract across direct
extension loading, package-subpath loading, session replacement, and `/reload`.
It must preserve fail-closed behavior before initialization or after shutdown;
it must not derive trusted session state per command or silently fall back to
host `/tmp`.

## Scope notes

- Medium feature rather than a single story: the fix changes a cross-package,
  cross-entry lifecycle contract and deserves a design pass plus integration
  coverage.
- No foundation-doc roll-forward: this repairs the existing documented
  background/monitor sandbox integration rather than adding a new capability.
- Dependency on `feature-pi-sandbox-disk-backed-tmp` records the session-pinned
  state contract this work must preserve; that dependency is already done.
- Direct-read scoping found the key risk: `sandbox-spawn.ts` imports mutable
  module state from `sandbox.ts`, while background-tasks resolves and caches the
  package subpath independently. Design must verify module-identity/version-skew
  behavior rather than assuming both entry paths share one module instance.
