---
id: story-pi-sandbox-git-credential-helper-scope-honesty
kind: story
stage: review
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

Review blocker B2. The default masks cover file-backed stores
(`~/.git-credentials`, `~/.config/git/credentials`, `.netrc`, `~/.config/gh`),
but they do not comprehensively block Git credential helpers, cache sockets, or
keyring/keychain retrieval. `HOME` is preserved, so sandboxed
`git credential fill` can invoke a configured helper and retrieve plaintext.

The first rework correctly narrowed required-boundary #3 to file-backed stores,
but introduced a core-workflow regression by adding `~/.gitconfig` and
`~/.config/git/config` to default `denyRead`. A denied regular file is replaced
with a read-only `/dev/null` bind in bwrap. Git sees a character device instead
of a regular config file and exits 128, so ordinary `git status` and
`git commit` fail whenever the user config exists.

## Fix

- Remove `~/.gitconfig` and `~/.config/git/config` from default `denyRead`.
- Keep required-boundary #3 classified as **MET (file-backed stores);
  helper/socket/keyring stores are operator-registered or out of scope for
  0.1.0**.
- Document the residual plainly: user Git config remains readable so ordinary
  Git works. An operator who wants to block `git credential fill` registers the
  helper's file or socket path as a literal global `denyRead` entry that exists
  at initialization, or accepts the residual. Glob entries are not enforced by
  bwrap and nonexistent paths are skipped.
- State explicitly that masking user Git config is not a safe mitigation and is
  not done by default.
- Preserve the documented all-or-nothing global deny-list merge behavior.

## Acceptance criteria

- [x] Default `denyRead` does not contain `~/.gitconfig` or
  `~/.config/git/config`.
- [x] A regression test prevents either Git config path from silently returning
  to the default deny list and explains the bwrap `/dev/null` / Git exit-128
  failure.
- [x] `THREAT_MODEL.md` required-boundary matrix #3 retains the honest
  file-backed-store status.
- [x] The protected-credentials table, canonical known-gaps list, and README
  non-goals describe helper/socket/keyring retrieval as a 0.1.0 residual.
- [x] The docs say helper file/socket registration must use a literal, existing
  path for bwrap enforcement and that masking user Git config is unsafe.
- [x] The all-or-nothing global `denyRead` merge documentation remains accurate.

## Implementation notes

- Files changed: `plugins/pi-sandbox/extensions/sandbox-config.ts`,
  `plugins/pi-sandbox/extensions/sandbox.test.ts`,
  `plugins/pi-sandbox/docs/THREAT_MODEL.md`, and
  `plugins/pi-sandbox/README.md`.
- Reverted both user Git config entries from `DEFAULT_CONFIG.filesystem.denyRead`
  so bwrap no longer replaces them with `/dev/null` and breaks ordinary Git.
- Expanded the existing default-deny regression test to assert both paths stay
  absent, with the Git exit-128 failure mode recorded in the test comment.
- Kept required-boundary #3 narrowed to file-backed stores and redocumented
  helper/socket/keyring retrieval as an explicit 0.1.0 residual. Operators must
  register literal, existing helper file/socket paths themselves or accept it.
- Removed every claim that defaults mask user Git config and kept the
  all-or-nothing deny-list merge contract unchanged.
- Verification: the focused `sandbox.test.ts` pass reports 157 pass and only the
  parked I5 PID-namespace test failure; the new Git-config default assertions
  pass. A bwrap-wrapped `git status --short --branch` built from
  `DEFAULT_CONFIG` exits 0 on this host where `~/.gitconfig` exists.
- Discrepancy from the first rework: its Git-config mitigation was unsound and
  has been reverted; the honest residual is the intended 0.1.0 posture.
- Adjacent issues parked: none.
