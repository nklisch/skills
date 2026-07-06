---
id: story-pi-sandbox-readme-bwrappath-drift
kind: story
stage: drafting
tags: [docs, sandbox, prose]
parent: null
depends_on: []
release_binding: null
gate_origin: null
created: 2026-07-06
updated: 2026-07-06
---

# README drifted: bwrap no longer "on PATH"; bwrapPath additive-only claim (B2-3)

## Source

Surfaced in the 2026-07-06 v0.1.0 readiness deep review (advisory + adversarial
phases). Important (rolling-foundation violation) for v0.1.0. The README
asserts behavior the implementation no longer matches.

## Problem

Two drift points in `plugins/pi-sandbox/README.md`:

1. **Line 7** — still describes bwrap resolution as "available on PATH." After
   the B2 fix, bwrap is resolved from a trusted allowlist (`/usr/bin/bwrap`,
   `/bin/bwrap`) or an explicit `sandbox.bwrapPath` config override; PATH is
   never consulted. The README's "available on PATH" is now wrong.

2. **Line 72** — states "Project-local config is additive-only. It may
   tighten policy, but it cannot loosen a global/default posture... it cannot
   disable the sandbox, expand writable paths, or lower a blocked tool to
   allowed." But `mergeProjectAdditive` (`sandbox-config.ts:847`) lets
   project-local config set `bwrapPath` — the field selecting the binary that
   runs bash unsandboxed. This is the widest possible loosening and directly
   contradicts the documented contract. (The fix for the underlying trust
   hole is `story-pi-sandbox-bwrap-path-project-trust`; this story is the
   doc-side reconciliation once that decision is made.)

## Fix direction (prose — routes through prose-author)

This is a `[prose]`-adjacent doc-sync item but tagged `[docs]` per project
convention. Update README to match whichever `bwrapPath` trust model is
decided in `story-pi-sandbox-bwrap-path-project-trust`:

- If Decision A=(a) global-only: document that `bwrapPath` is a global/operator
  setting, project-local attempts are rejected with a warning, and the
  allowlist is `/usr/bin/bwrap`, `/bin/bwrap`.
- If Decision A=(b) project-allowed-with-ownership: document the ownership
  constraint and the tightened allowlist.

Either way, remove "available on PATH" and make the bwrap resolution model
accurate. Depends on `story-pi-sandbox-bwrap-path-project-trust` resolving
first (the doc must reflect the chosen trust model).

## Acceptance criteria

- [ ] README bwrap-resolution description matches implementation (allowlist +
      configured override, not PATH)
- [ ] README additive-only contract section is accurate w.r.t. `bwrapPath`
- [ ] No other README assertions contradicted by the B1/B2/B3 fixes
