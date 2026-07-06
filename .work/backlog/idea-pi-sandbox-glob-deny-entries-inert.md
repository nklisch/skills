---
id: idea-pi-sandbox-glob-deny-entries-inert
kind: story
stage: done
tags: [security, sandbox]
parent: null
depends_on: []
release_binding: null
gate_origin: null
created: 2026-07-05
updated: 2026-07-05
git_ref: 25c2b48
---

# Glob-shaped `denyRead`/`denyWrite` entries are silently inert in the in-process file-tool policy

## Source

Surfaced in the 2026-07-05 full security audit of `plugins/pi-sandbox/`. Repro-confirmed
directly against the in-process policy module. The glob entries in the live global config
(`~/.pi/agent/extensions/sandbox.json`) were copied through from gitleaks defaults and do
not guard live secrets on this host, so this is a **correctness bug** (config says "deny",
sandbox silently doesn't) rather than an active secret-exposure incident here. It would
become a live exposure on any host that genuinely relies on glob deny entries.

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
