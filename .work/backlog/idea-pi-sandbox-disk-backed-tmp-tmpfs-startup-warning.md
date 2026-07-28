---
id: idea-pi-sandbox-disk-backed-tmp-tmpfs-startup-warning
kind: idea
stage: backlog
tags: [sandbox]
parent: null
depends_on: []
release_binding: null
gate_origin: null
research_refs: []
research_origin: null
created: 2026-07-14
updated: 2026-07-14
---

# Non-authoritative tmpfs startup warning (middle ground on the scope cut)

## Source

Round-4 deep review (Phase 2 adversarial). Important.

## Problem

The scope cut dropped runtime fs-type detection entirely (correctly — as an
authorization GATE it kept failing open). But the result is total silence: if
the operator misconfigures `~/.cache` onto tmpfs, the feature silently defeats
itself and the RAM-pressure OOMs it exists to prevent return with NO signal.

The reviewer's concern: for a feature whose whole operational mission is
preventing RAM-pressure OOMs, "documented residual" may be too weak — silent
defeat is the exact status quo the feature was built to fix.

## Fix direction (middle ground)

A NON-authoritative, one-time startup WARNING (not a gate) preserves the
operator-assertion principle while not being totally silent:

- For POSITIVELY RECOGNIZED tmpfs/ramfs backing of the cache root: emit a
  one-time `ctx.ui.notify` warning ("cache root appears to be on tmpfs; temp
  will use RAM — verify with findmnt"). This is an observation, not a
  fail-close.
- For unknown / probe-failure / unrecognized types: make NO claim and do NOT
  block (this is the hole that killed the gate-based approach — do not repeat
  it).
- Same-device-as-`/tmp` could also warn ("verify backing store") without
  claiming tmpfs.

This is observability, not authorization. It does not fail open because it
never claims a path is disk-backed; it only warns on positive tmpfs
recognition. The operator can still assert/override.

## Notes

- The current static guard test (`sandbox.test.ts:85-105`) forbids
  `statfsSync` / the tmpfs magic `0x01021994` entirely. If this is adopted,
  the guard must be relaxed to permit a warning-only `statfsSync` read (not a
  gate) while still forbidding the gate/`assertNotRamBacked` shape.
- This is optional / deferrable. The scope cut as-is is defensible (the
  residual affects availability, not credential isolation). This idea exists
  to record the middle ground the reviewer flagged.
