---
id: idea-pi-sandbox-disk-backed-tmp-safe-writability-check
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

# mkdirSync does not prove writability — add a safe check

## Source

Round-4 deep review (Phase 1 + Phase 2 both flagged). Important.

## Problem

The R3-B3 fix deleted the write probe (correctly — it was a predictable-name
symlink-truncation escape). But `mkdirSync(dir, { recursive: true })` only
proves the parent chain is writable; it **succeeds on a pre-existing
non-writable directory**. So a persisted `chmod`, stale permissions, ACLs, or
a read-only mount lets initialization report success while every `mktemp`
inside the sandbox fails.

The redesign threw away the legitimate "is this dir actually writable" check
along with the unsafe probe.

## Fix direction

Add a SAFE writability check: a cryptographically random name with
`openSync(path, O_CREAT | O_EXCL | O_NOFOLLOW)` (mode 0600), close + unlink in
`finally` with distinct create/remove diagnostics. `O_NOFOLLOW` blocks the
symlink-truncation vector that made the old probe unsafe; `O_EXCL` + random
name blocks prediction. An atomic `mkdtemp` probe is another option.

The static guard test (`sandbox.test.ts:85-105`) currently forbids ALL
`writeFileSync`/`unlinkSync`/`openSync` in `sandbox.ts` — it should be scoped
to `deriveProjectTmpDir` and forbid only unsafe (predictable-name,
non-`O_NOFOLLOW`) probes, not a safe randomized one. Update the guard when
adding the safe check.

## Acceptance

- [ ] A pre-existing unwritable project dir fails-closed at session_start, not
      at first `mktemp` inside the sandbox.
- [ ] The writability check uses a random name + `O_CREAT|O_EXCL|O_NOFOLLOW`
      (or `mkdtemp`), not a predictable name.
- [ ] The static guard test permits the safe check and still forbids unsafe
      probes.
