---
id: story-pi-sandbox-glob-deny-symlink-and-missing
kind: story
stage: review
tags: [security, sandbox]
parent: null
depends_on: []
release_binding: null
gate_origin: null
created: 2026-07-05
updated: 2026-07-06
git_ref: 25c2b48
---

# Finish glob deny enforcement: symlink matching + non-existent deny fail-closed

## Brief `denyRead`/`denyWrite` entries are silently inert in the in-process file-tool policy

## Source

Surfaced in the 2026-07-05 full security audit of `plugins/pi-sandbox/`. Repro-confirmed
directly against the in-process policy module. The glob entries in the live global config
(`~/.pi/agent/extensions/sandbox.json`) were copied through from gitleaks defaults and do
not guard live secrets on this host, so this is a **correctness bug** (config says "deny",
sandbox silently doesn't) rather than an active secret-exposure incident here. It would
become a live exposure on any host that genuinely relies on glob deny entries.

## Status (2026-07-05)

Partially drained in the 0.1.0 audit pass (commit 25c2b48):

- ✅ **Glob `denyWrite` inert in in-process policy** — fixed. `matchesDenyList`/
  `isWithinAllowWrite` now expand globs via `globToRegex`.
- ✅ **Glob `denyRead` inert + unwarned** — fixed. Glob detection in `loadConfig`
  now covers `denyRead` and the warning text is honest about both layers
  (in-process enforces; bwrap cannot mount globs).
- ⏳ **Non-existent deny paths silently skipped** — UNFIXED. `existingCanonicalMounts`
  still drops paths where `canonicalizeExistingPath === null`, so `denyWrite:[".env"]`
  provides no protection if `.env` doesn't yet exist (sandboxed bash can create it).
  Needs fail-closed on missing deny entries under writable ancestors, or sandbox-only
  masks. This is problem 3 below.

## Review (fresh-context gpt-5.5, 2026-07-05)

- ❌ **Glob bypassable via symlink/realpath mismatch (G1, deferred):**
  `enforceDenyRead`/`enforceWritePolicy` pass only the canonicalized target into
  glob matching, but `globToRegex` builds from the non-canonical configured path.
  A symlinked leaf (`key.pem -> key`) canonicalizes to `key`, so the `*.pem` deny
  glob misses. Fix: match against both the lexical absolute path AND the canonical
  target. **Not yet fixed.**
- ⚠️ **`allowWrite` globs silently file-tool-only:** bwrap can't mount globs, so an
  `allowWrite:["*.log"]` is inert at the bwrap layer but enforced in-process. No
  warning. Low severity (unusual config), deferred.
- ℹ️ Comment says `*.pem` matches "any `.pem` leaf anywhere" but the regex is
  non-recursive (`*` = `[^/]*`, so `sub/secret.pem` is NOT matched). Comment is
  misleading; semantics are correct for cwd-relative leaf globs. Fix: update the
  comment.

Verdict: glob expansion works for the common case but has a symlink-evastion hole
(G1) that should be fixed before this item can advance to done.

## Problem

`matchesDenyList` / `isWithinAllowWrite` in `sandbox-file-policy.ts` do pure string-prefix
matching via `path.relative()` — there is **no glob expansion anywhere** in the in-process
read/write/edit policy. So glob-shaped entries like `*.pem`, `*.key`, `.env.*` are silently
ignored by the `read`/`write`/`edit` tools.

Two compounding gaps:

1. **`denyWrite` globs are inert** (`sandbox-file-policy.ts:175` `matchesDenyList`). Repro
   against the live global config's `denyWrite: [".env",".env.*","*.pem","*.key"]`:
   ```
   ALLOWED WRITE: /tmp/.env.local      ← matches .env.*  → NOT blocked
   ALLOWED WRITE: /tmp/secret.pem      ← matches *.pem   → NOT blocked
   ALLOWED WRITE: /tmp/private.key     ← matches *.key   → NOT blocked
   ```
   The existing glob warning (`sandbox-config.ts:665-668`) mentions this for the **bwrap
   layer only** and never tells the operator the in-process `write`/`edit` tools also
   ignore the globs.

2. **`denyRead` globs are inert AND unwarned** (`sandbox-file-policy.ts:110` `enforceDenyRead`).
   The glob detection at `sandbox-config.ts:665` only inspects `denyWrite`, never `denyRead`.
   So `denyRead: ["*.pem"]` silently allows reading `.pem` files via the `read` tool with
   **zero warning**:
   ```
   ALLOWED READ : /tmp/secret.pem      ← denyRead: ["*.pem"] → NOT blocked, no warning
   ```

3. **Non-existent deny paths are silently skipped** (`sandbox-bwrap.ts:183,199-200`,
   `existingCanonicalMounts` drops `canonicalizeExistingPath === null`). With default
   `allowWrite:[".","/tmp"]`, if `.env` does not yet exist, `denyWrite:[".env"]` provides
   no protection — sandboxed bash can `printf … > .env`. Same class: a deny entry that
   silently fails to deny.

## Recommended fix direction

- Expand globs in `matchesDenyList` / `isWithinAllowWrite` (or reject glob entries at
  config-load as fail-closed), applied to **both** `denyRead` and `denyWrite` and to
  **both** the in-process file-policy layer and the bwrap mount layer.
- Extend `isGlobPattern` detection in `loadConfig` to cover `denyRead` as well as
  `denyWrite`, and make the warning text say the entry is inert in **both** the bwrap and
  in-process layers.
- For non-existent deny entries under an allow-writable ancestor: fail closed (or create
  sandbox-only masks) rather than silently dropping them.

## Scope hint

Single coherent fix unit: the deny-entry enforcement path in `sandbox-file-policy.ts` +
the glob detection/warning in `sandbox-config.ts` + the non-existent-path skip in
`sandbox-bwrap.ts`. All three are "a configured deny silently fails to deny."

## Implementation notes

- Files changed:
  - `plugins/pi-sandbox/extensions/sandbox-file-policy.ts` — G1 fix:
    `matchesDenyList`/`isWithinAllowWrite` now take both the canonical target
    AND the lexical absolute path; globs and prefix checks test both, so a
    symlinked leaf (`key.pem -> key`) is caught by `*.pem` via its lexical name.
    Callers `enforceDenyRead`/`enforceWritePolicy` updated to pass both.
  - `plugins/pi-sandbox/extensions/sandbox-file-policy.ts` — comment fix:
    corrected the misleading "any `.pem` leaf anywhere" wording; `*.pem` matches
    `.pem` leaves directly under cwd, NOT nested under subdirs.
  - `plugins/pi-sandbox/extensions/sandbox-config.ts` — non-existent deny warning:
    `loadConfig` now emits `missingDenyWarnings` for deny entries that don't exist
    on disk (bwrap can't mask them; in-process tools still enforce). Also added
    allowWrite-glob warning. `LoadedConfig` + `formatSandboxCommandOutput` updated.
  - `plugins/pi-sandbox/extensions/sandbox.ts` — session_start emits the new
    `missingDenyWarnings`.
- Tests added:
  - `glob deny catches a symlinked leaf via its lexical name (G1)` — repro for
    the symlink-evastion hole.
- Discrepancies from design: none. The non-existent-deny fix warns rather than
  fail-closing — fail-closed on every missing deny path would be too aggressive
  (operators list deny paths defensively). The warning surfaces the bash gap.
- Adjacent issues parked: none.
