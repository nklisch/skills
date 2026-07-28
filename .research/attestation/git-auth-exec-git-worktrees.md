---
source_handle: git-auth-exec-git-worktrees
fetched: 2026-07-10
source_url: https://github.com/git/git/blob/v2.51.0/Documentation/git-worktree.adoc
provenance: source-direct
substrate_confidence: source-direct
---

## Summary

Git 2.51.0's worktree documentation explains that linked worktrees share repository state, including the repository configuration by default and most refs, while maintaining selected per-worktree files such as `HEAD` and the index. Optional worktree-specific configuration is additive: `config.worktree` is read after common `.git/config`. A linked worktree is therefore not an independent trust boundary from its common Git directory.

## Key passages

1. A linked worktree shares everything with the current repository except per-worktree files such as `HEAD` and `index`.
   - *Source anchor: `COMMANDS`, `add`, lines 66–71.*
2. Most refs under `refs/` are shared across worktrees, while pseudo-refs such as `HEAD` are generally per-worktree.
   - *Source anchor: `REFS`, lines 287–303.*
3. By default, the repository `config` file is shared across all worktrees.
   - *Source anchor: `CONFIGURATION FILE`, lines 316–321.*
4. With `extensions.worktreeConfig`, worktree-specific settings live in `config.worktree`; Git reads `.git/worktrees/<id>/config.worktree` after `.git/config`.
   - *Source anchor: `CONFIGURATION FILE`, lines 323–339; configuration note, lines 400–403.*

## Structural metadata

- **Project:** Git
- **Document:** git-worktree(1)
- **Version anchor:** tag `v2.51.0`
- **Source class:** upstream reference documentation
