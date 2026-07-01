---
id: story-pi-sandbox-drop-asrt-dep
kind: story
stage: implementing
tags: [security, sandbox]
parent: feature-sandbox-first-party-bwrap
depends_on: [story-pi-sandbox-buildbwrapargs]
release_binding: null
gate_origin: null
created: 2026-07-01
---

# Remove ASRT dep + `initialize`/`reset` lifecycle

## Scope

Delete the three ASRT integration points: the `import { SandboxManager, ... } from "@anthropic-ai/sandbox-runtime"` (line 29), `SandboxManager.initialize(initParams)` (line 957), and `SandboxManager.reset()` (line 991). The `filter`-mode proxy lifecycle moves to the TCP-loopback story. Fail-closed posture stays: bwrap binary missing or `spawn` throws → bash returns error, not silent unsandboxed fallback. Depends on `story-pi-sandbox-buildbwrapargs` (replacement must exist before removal).

## Unit

**Files**: `plugins/pi-sandbox/extensions/sandbox.ts` (remove import + init + reset); `plugins/pi-sandbox/package.json` (drop `@anthropic-ai/sandbox-runtime` from deps).

## Acceptance Criteria

- [ ] `grep -r sandbox-runtime plugins/pi-sandbox/` → zero hits.
- [ ] `package.json` has no `@anthropic-ai/sandbox-runtime` dependency.
- [ ] `bun build --target=bun` bundles with zero errors, no missing-import warnings.
- [ ] Fail-closed still holds on bwrap-missing / spawn-throw.
