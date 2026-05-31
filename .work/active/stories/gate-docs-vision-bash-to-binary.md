---
id: gate-docs-vision-bash-to-binary
kind: story
stage: implementing
tags: [documentation]
parent: null
depends_on: []
release_binding: 0.8.6
gate_origin: docs
created: 2026-05-31
updated: 2026-05-31
---

# VISION.md still calls work-view a "bash script"

## Drift category
foundation-doc-assertion

## Location
- Doc: `plugins/agile-workflow/docs/VISION.md:71` (and the tooling-portable bullet at `:57`)
- Code: `plugins/agile-workflow/work-view/crates/cli/src/main.rs`, `plugins/agile-workflow/scripts/install-work-view.sh`, core at `crates/core/src/lib.rs`

## Current doc text
> - A `work-view` bash script for fast queries by stage, tag, kind, parent, release binding, and dependency state

(line 57)
> - Tooling-portable substrate (git, plain markdown, a small bash script — no MCP, no auth, no daemon)

## Reality
`work-view` is now a compiled Rust binary (`work-view-core` lib crate + `work-view`
CLI) installed by `install-work-view.sh`, with a pure-bash `work-view.sh` retained
only as a platform / empty-dist fallback. It is no longer "a bash script."

## Required edit
Line 71: replace "a `work-view` bash script" with "a compiled `work-view` CLI (with a
pure-bash fallback)" for the same queries. Line 57: change "a small bash script" to "a
small compiled binary with a bash fallback" (the "git, plain markdown, no
MCP/auth/daemon" portability claim stays true). Rolling-foundation: replace in place,
no "previously" prose.
