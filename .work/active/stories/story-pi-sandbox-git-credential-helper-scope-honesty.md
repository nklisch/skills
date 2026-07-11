---
id: story-pi-sandbox-git-credential-helper-scope-honesty
kind: story
stage: implementing
tags: [security, sandbox, plugin, documentation]
parent: feature-pi-sandbox-credential-isolation-boundary
depends_on: []
release_binding: null
gate_origin: null
research_refs: []
research_origin: null
created: 2026-07-11
updated: 2026-07-11
---

# Honest scope for git credential helpers/sockets/keyrings in the threat model

## Scope

Review blocker B2. The threat model marks required-boundary #3 (read masking
for credential-bearing paths) as "MET," but the default masks cover only
file-backed stores (`~/.git-credentials`, `~/.config/git/credentials`, `.netrc`,
`~/.config/gh`). They do NOT cover:
- `~/.gitconfig` / `~/.config/git/config` — which can declare a custom
  `credential.helper store --file=...`, a libsecret/Secret Service helper, Git
  Credential Manager, or a `credential-cache` socket.
- `~/.cache/git/credential/socket` (credential-cache daemon socket).
- Keyring/keychain state (libsecret, macOS Keychain, Windows Credential Manager).

`buildMinimalEnv` preserves `HOME` (`sandbox-bwrap.ts:141-146`), so a sandboxed
`git credential fill` can invoke an existing helper and retrieve plaintext
credentials without reading any denied file. The threat model over-claims "MET."

## Fix

Decide and document honestly. Two options (pick one; option A is the 0.1.0
recommendation):

**A. Reclassify #3 honestly (preferred for 0.1.0).** Mark required-boundary #3
as "MET for file-backed credential stores; helper/socket/keyring stores are
operator-registered or out of scope for 0.1.0." Add `~/.gitconfig` and
`~/.config/git/config` to the default `denyRead` (they're credential-adjacent
config that can declare helpers) and document the workflow impact (operators who
rely on a global gitconfig helper must add the specific helper socket/path
themselves). State that keyring-based helpers (libsecret, Keychain, GCM) are out
of scope for 0.1.0 — an operator using them must add their credential path to
global `denyRead` or accept the residual.

**B. Add full helper coverage.** Add `~/.gitconfig`, `~/.config/git/config`,
`~/.cache/git/credential/socket` to defaults; document that keyring helpers need
operator registration. More breaking-change risk (gitconfig reads are common).

Either way: the threat model must NOT mark #3 as unconditionally "MET" while
helpers/sockets/keyrings are reachable.

## Acceptance criteria

- [x] `THREAT_MODEL.md` required-boundary matrix #3 reflects the actual coverage
  (file-backed stores MET; helpers/sockets/keyrings operator-registered or
  out-of-scope) — not an unqualified "MET."
- [x] If option A: `~/.gitconfig` and `~/.config/git/config` added to default
  `denyRead`; workflow impact documented in README + threat model.
- [x] README "Security boundary / non-goals" names git credential helpers as a
  residual (helper/socket/keyring retrieval) for 0.1.0.
- [x] Release scope (0.1.0) "known gaps" list includes the helper/socket/keyring
  residual.

## Implementation notes

- Files changed: `plugins/pi-sandbox/extensions/sandbox-config.ts`, `plugins/pi-sandbox/docs/THREAT_MODEL.md`, `plugins/pi-sandbox/README.md`.
- Chose Option A: masked both user Git config paths by default and narrowed required-boundary #3 to file-backed stores, with helper/socket/keyring retrieval operator-registered or outside 0.1.0.
- Added the helper residual to the protected-credentials table, README non-goals, and the canonical 0.1.0 known-gaps list. The docs explicitly account for preserved `HOME` and `git credential fill`.
- Folded review I4 into the same configuration pass: documented the non-empty-union versus empty-clear behavior, the lack of selective global removal, and the complete default list. Because a non-empty global re-add would restore every default, retained entries must be re-added in each project's additive config after the global list is cleared.
- Verification: confirmed the documented list exactly matches `DEFAULT_CONFIG.filesystem.denyRead`; scoped extension tests pass.
- Discrepancies from design: none. The documentation calls out that the requested “clear globally and re-add” escape requires project-local re-addition; the current merge code cannot express selective removal in one global list.
- Adjacent issues parked: none.
