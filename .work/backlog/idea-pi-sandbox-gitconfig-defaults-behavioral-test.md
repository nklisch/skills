---
id: idea-pi-sandbox-gitconfig-defaults-behavioral-test
created: 2026-07-11
updated: 2026-07-11
tags: [security, sandbox, testing]
---

# Add a behavioral test for the gitconfig-not-in-defaults regression

## Capture

Fresh-context re-review pass 2 (Important finding). The B2 regression
(gitconfig in default `denyRead` broke `git status` via `/dev/null` overlay →
exit 128) was fixed by reverting the defaults. But the behavioral regression
test added (`sandbox.test.ts:3168` "git status works inside a normal repo")
passes `denyRead: []`, so it would NOT catch the regression if gitconfig were
re-added to defaults. Only a static list assertion (~line 770) currently guards
the fix — it asserts the two paths are absent from the default list, which
catches the list-level regression but not the behavioral one (a future change
could add a different git-breaking path to defaults and the static assertion
wouldn't catch it).

## Fix

Add an integration test that runs `git status` inside a bwrap sandbox using
`DEFAULT_CONFIG.filesystem.denyRead` (NOT `denyRead: []`) against a temp repo
with a real user gitconfig present, asserting exit 0. This is the test that
would have caught B2 originally.

The test needs a temp HOME with a `~/.gitconfig` so the default denyRead
entries (which include `~/.gitconfig`... wait, no — the whole point is they do
NOT include gitconfig after the revert) interact correctly. Actually the test
should: create a temp repo, set HOME to a temp dir with a `.gitconfig`, run
`git status` under DEFAULT_CONFIG's denyRead, assert exit 0. If someone
re-adds gitconfig to defaults, the `/dev/null` overlay makes git exit 128 and
the test fails.

Note: the existing integration test infrastructure (`runSandboxed`,
`integrationTest`) already supports this — it just needs to use
`DEFAULT_CONFIG.filesystem.denyRead` instead of `denyRead: []`.
