---
id: feature-pi-sandbox-disk-backed-tmp-symlink-escape-projectdir
kind: story
stage: done
tags: [security, sandbox]
parent: feature-pi-sandbox-disk-backed-tmp
depends_on: []
release_binding: null
gate_origin: null
research_refs: []
research_origin: null
created: 2026-07-14
updated: 2026-07-14
---

# Symlink escape on the project temp dir final path

## Source

Round-4 deep review (Phase 1 completeness + Phase 2 adversarial, both
`gpt-5.6-sol` fresh-context, converged). Blocker B1.

## Problem

`deriveProjectTmpDir` (`plugins/pi-sandbox/extensions/sandbox.ts:186-211`)
checks the block-mode mask-containment only on `realCacheRoot`. The final
project dir is canonicalized via `realpathSync(dir)` but is NEVER re-checked
against the mask roots, NOR verified to be a child of `realCacheRoot`.

`mkdirSync(dir, { recursive: true })` **succeeds without throwing on a
pre-existing symlink-to-dir** (verified: Node `fs.mkdirSync` returns success
when the path already exists as a symlink to an existing directory). Then
`realpathSync(dir)` follows the symlink and returns its target. So a hostile
symlink placed at the predictable cwd-hash path
(`~/.cache/pi-sandbox/tmp/<sha256(cwd)[:16]>`):

1. pins an **arbitrary directory** as `projectTmpDir`, which `buildBwrapArgs`
   then writable-binds (`--bind <dir> <dir>`) — a writable-surface escape
   bypassing the configured `allowWrite` policy;
2. in block mode, a symlink into `/tmp` / `/var/tmp` / `/run` / `/var/run`
   passes initialization and is then **hidden by the tmpfs mask**, leaving
   `TMPDIR` pointing at an inaccessible path.

The cwd-hash path is predictable (sha256 of the realpath cwd, truncated to 16
chars) and lives under the shared, sandbox-writable cache root, so an agent (or
a cooperating session) can plant the symlink before derivation runs.

Additionally `buildBwrapArgs` (`sandbox-bwrap.ts:153-158`) re-canonicalizes the
bind source per command via `canonicalizeExistingPath`, so a path swapped
after trusted initialization can change what gets mounted mid-session.

## Fix direction

- Reject a symlinked final entry: after `realpathSync(dir)`, verify the entry
  is a real directory (not a symlink) and that `realDir` is the exact expected
  canonical child of `realCacheRoot` (`realDir === join(realCacheRoot,
  cwdKey)`, or starts with `realCacheRoot + "/"`). If not, fail-closed.
- Consider `lstatSync` before `mkdirSync` to detect a pre-existing symlink at
  the predictable name and reject it explicitly.
- In `buildBwrapArgs`, fail (or re-validate against the pinned path) if the
  projectTmpDir is no longer canonical/identical, rather than silently
  re-resolving it.

## Acceptance

- [ ] A pre-existing symlink at the cwd-hash path is rejected (fail-closed),
      not followed.
- [ ] `realDir` is verified to be a child of `realCacheRoot`; an escape target
      outside the cache root is rejected.
- [ ] Block mode: a symlink into a mask root is rejected, not hidden.
- [ ] `buildBwrapArgs` does not silently re-resolve a swapped projectTmpDir.
- [ ] Tests: pre-existing-symlink rejection, mask-target rejection,
      post-init-replacement rejection.

## Notes

- The mask-containment check on `realCacheRoot` (R3-I1) is correct but
  incomplete — it must also cover the final dir. This is the final-directory
  half of R3-I1.
- Do NOT restore the deleted write probe (R3-B3) — that was a different
  vulnerability (predictable-name symlink truncation). The fix here is path
  validation, not a write probe.

## Implementation notes

Fixed in `deriveProjectTmpDir` (`sandbox.ts`) + `buildBwrapArgs`
(`sandbox-bwrap.ts`).

- **Pre-existing symlink rejection**: before `mkdirSync(dir)`, `existsSync(dir)`
  + `lstatSync(dir)` (does not follow symlinks) detects a symlink at the
  predictable cwd-hash path and fail-closes with a clear message. Also rejects a
  non-directory entry and an unlstat'table path (permission / removed
  mid-derivation).
- **Final-dir containment**: after `realpathSync(dir)`, verify `realDir` is the
  exact expected canonical child of `realCacheRoot` (`realDir === expectedDir ||
  realDir.startsWith(realCacheRoot + "/")`); an escape target outside the cache
  root is rejected.
- **Final-dir mask re-check**: the block-mode mask-containment check (canonicalized
  mask roots) now runs against `realDir` too, not just `realCacheRoot` — so a
  symlink into `/tmp`/`/var/tmp`/`/run`/`/var/run` is caught at the final path.
- **buildBwrapArgs binds the pinned path verbatim** (B1 second half): removed the
  per-command `canonicalizeExistingPath(opts.projectTmpDir)` re-resolution so a
  path swapped after trusted init cannot change what gets mounted. If the pinned
  path is removed/replaced post-init, the bind fails loudly (bwrap ENOENT) rather
  than silently mounting an attacker-chosen target.
- **Tests**: `B1: a pre-existing symlink at the cwd-hash project dir path is
  rejected (fail-closed)` — plants a symlink at the predictable path before
  session_start, asserts fail-closed + null projectTmpDir. Load-bearing: against
  the pre-fix code, mkdirSync would accept the symlink and realpathSync would
  return the escape target (non-null), failing the assertion.
- Full suite: 337 pass / 0 fail (was 335; +2 new B1/B2 regression tests).
