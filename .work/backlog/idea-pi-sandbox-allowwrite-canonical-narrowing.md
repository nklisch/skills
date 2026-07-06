---
id: idea-pi-sandbox-allowwrite-canonical-narrowing
kind: story
stage: done
tags: [security, sandbox]
parent: null
depends_on: []
release_binding: null
gate_origin: null
created: 2026-07-01
updated: 2026-07-05
git_ref: 3d98d2c
---

# `allowWrite` additive merge uses raw exact strings, not canonical containment

## Source

Surfaced in the round-2 fresh-context adversarial review of
`feature-sandbox-first-party-bwrap` (Phase 8 final peer review). Filed as a
substantive (non-blocking) finding; deferred from the fix pass.

## Problem

In `plugins/pi-sandbox/extensions/sandbox-config.ts` `mergeProjectAdditive`,
project `allowWrite` is intersected with the global set by RAW EXACT STRING
match. A project that wants to NARROW the default `allowWrite: [".", "/tmp"]`
to a stricter subpath such as `["plugins"]` silently gets `[]` — the stricter
config is rejected as a false positive. This is safer-than-intended (writes get
blocked everywhere) but it is a false-positive break for valid stricter
configs.

## Proposed direction

Compare by canonical containment, not exact string: a project `allowWrite`
entry is accepted if it is EQUAL TO or NESTED WITHIN any global `allowWrite`
entry (after `~` expansion + cwd-relative resolution + realpath
canonicalization). This lets a project narrow `["."]` to `["plugins"]` while
still forbidding widening (a project entry outside every global entry is
rejected+warned).

## Acceptance (when scoped)

- Project can narrow global `allowWrite:["."]` to `["plugins"]` (effective
  `["plugins"]`), with cwd-relative + canonical comparison.
- Project cannot widen beyond global (entry outside every global entry →
  rejected+warned).
- Existing exact-string intersection behavior is preserved for exact matches.
