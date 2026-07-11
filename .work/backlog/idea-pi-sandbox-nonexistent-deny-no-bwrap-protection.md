---
id: idea-pi-sandbox-nonexistent-deny-no-bwrap-protection
created: 2026-07-11
updated: 2026-07-11
tags: [security, sandbox]
---

# Nonexistent deny entries get no bwrap protection

## Capture

Adversarial release-gate review (lane 1). With the default `denyWrite: [".env"]`, if `.env` is
absent when argv is built, no deny overlay is emitted (bwrap can't mount on a missing path).
Sandboxed bash can then create and populate `.env` in the writable project root. Same for a
missing `denyRead` path.

Reviewer-verified reproducible: bwrap argv with absent `.env` had no overlay; sandboxed bash
successfully created the host file.

This IS already surfaced as a `missingDenyWarnings` in config load (sandbox-config.ts:1633) —
so operators are warned. But it remains an OS-boundary policy gap: the in-process `write`/`edit`
tools DO enforce denyWrite on `.env` even when absent (pathname check), but sandboxed bash does
not.

## Fix (post-0.1.0)

Options: pre-create deny stubs (risky — the B2 regression showed /dev/null overlays break
tools), or use bwrap `--tmpfs` on the deny path's parent only when the path is expected (complex),
or accept and document that bash protection for not-yet-existing deny paths is absent (the
in-process tools still enforce). The current warning + in-process enforcement is the 0.1.0
posture; this item tracks a stronger fix.
