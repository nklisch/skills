---
id: story-pi-sandbox-gitconfig-defaults-behavioral-test
kind: story
stage: implementing
tags: [security, sandbox, testing]
parent: feature-pi-sandbox-credential-isolation-boundary
depends_on: []
release_binding: null
gate_origin: null
research_refs: []
research_origin: null
created: 2026-07-11
updated: 2026-07-11
---

# Add a behavioral test for the gitconfig-not-in-defaults regression

## Scope

The B2 review regression (adding `~/.gitconfig` to default `denyRead` broke
`git status` via the `/dev/null` overlay → exit 128) was fixed by reverting the
defaults. But the existing "git status works inside a normal repo" test
(`sandbox.test.ts:3168`) passes `denyRead: []`, so it would NOT catch the
regression if gitconfig were re-added to defaults. Only a static list assertion
guards the fix — it catches the list-level revert but not a behavioral regression.

This is the test that would have caught B2 originally.

## Unit

`plugins/pi-sandbox/extensions/sandbox.test.ts` — add an integration test that:
1. Creates a temp repo with a `.git` dir (so `git status` works).
2. Sets `HOME` to a temp dir containing a real `.gitconfig` (so the default
   `denyRead` entries that reference home paths interact with a real file).
3. Runs `git status --porcelain` inside a bwrap sandbox using
   `DEFAULT_CONFIG.filesystem.denyRead` (NOT `denyRead: []`).
4. Asserts exit 0.

If `~/.gitconfig` is ever re-added to defaults, the `/dev/null` overlay makes
git exit 128 and the test fails. Use the existing `runSandboxed` helper and
`integrationTest` wrapper. Pass `denyRead: DEFAULT_CONFIG.filesystem.denyRead`
(or import and spread the defaults).

Note: the test must override `HOME` to a temp dir with a `.gitconfig` so the
default denyRead entries (which use `~/` paths) resolve against the temp HOME.
Set env `HOME` in the `runSandboxed` env param.

## Acceptance criteria

- [ ] An integration test runs `git status` under `DEFAULT_CONFIG.filesystem.denyRead`
  with a real `.gitconfig` in HOME, asserting exit 0.
- [ ] The test would fail if `~/.gitconfig` were re-added to default `denyRead`
  (the `/dev/null` overlay breaks git config reads).
- [ ] The test uses `integrationTest` (skips gracefully when bwrap is unavailable).
- [ ] Existing tests stay green.
