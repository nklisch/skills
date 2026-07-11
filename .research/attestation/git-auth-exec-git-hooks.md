---
source_handle: git-auth-exec-git-hooks
fetched: 2026-07-10
source_url: https://github.com/git/git/blob/v2.51.0/Documentation/githooks.adoc
provenance: source-direct
substrate_confidence: source-direct
---

## Summary

Git 2.51.0's hook documentation describes hooks as executable programs under `$GIT_DIR/hooks` unless `core.hooksPath` redirects lookup. Git changes to the worktree root or Git directory before invoking a hook and exports repository environment variables. It identifies hooks triggered by checkout, clone, worktree creation, commit, merge, and push. This makes a Git invocation an executable-code boundary whenever its effective hook directory contains an enabled hook.

## Key passages

1. Hooks are programs that Git executes at named points; files without the executable bit are ignored.
   - *Source anchor: `DESCRIPTION`, opening paragraphs.*
2. The default hook directory is `$GIT_DIR/hooks`, but `core.hooksPath` can change it.
   - *Source anchor: `DESCRIPTION`, lines 20–22 in the tagged source.*
3. Before invoking a hook, Git changes directory to the worktree root for a non-bare repository or `$GIT_DIR` for a bare repository; receive-side push hooks run in `$GIT_DIR`.
   - *Source anchor: `DESCRIPTION`, lines 24–28.*
4. Git exports variables including `GIT_DIR` and `GIT_WORK_TREE` to hooks and advises clearing repository-local environment variables before operating on another repository or worktree.
   - *Source anchor: `DESCRIPTION`, lines 30–39.*
5. `post-checkout` runs after `git checkout`/`git switch`, after `git clone` unless `--no-checkout` is used, and after `git worktree add` unless `--no-checkout` is used.
   - *Source anchor: `post-checkout`, lines 199–218.*
6. `pre-push` is called by `git push`; its nonzero exit aborts the push.
   - *Source anchor: `pre-push`, lines 235–262.*

## Structural metadata

- **Project:** Git
- **Document:** githooks(5)
- **Version anchor:** tag `v2.51.0`
- **Source class:** upstream reference documentation
