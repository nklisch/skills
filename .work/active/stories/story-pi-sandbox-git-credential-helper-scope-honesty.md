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

- [ ] `THREAT_MODEL.md` required-boundary matrix #3 reflects the actual coverage
  (file-backed stores MET; helpers/sockets/keyrings operator-registered or
  out-of-scope) — not an unqualified "MET."
- [ ] If option A: `~/.gitconfig` and `~/.config/git/config` added to default
  `denyRead`; workflow impact documented in README + threat model.
- [ ] README "Security boundary / non-goals" names git credential helpers as a
  residual (helper/socket/keyring retrieval) for 0.1.0.
- [ ] Release scope (0.1.0) "known gaps" list includes the helper/socket/keyring
  residual.
