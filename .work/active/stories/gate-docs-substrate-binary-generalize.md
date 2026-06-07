---
id: gate-docs-substrate-binary-generalize
kind: story
stage: drafting
tags: [documentation]
parent: null
depends_on: []
release_binding: null
gate_origin: docs
created: 2026-06-04
updated: 2026-06-04
---

# substrate-binary skill presents work-view as THE singular binary; research-view is now a 2nd instance

## Drift category
repo-skill-staleness (Medium)

## Location
- Doc: `.agents/skills/substrate-binary/SKILL.md` (frontmatter/title :1-13; description/triggers :3-11; Distribution + install :99-108)
- Code: `plugins/agentic-research/research-view/` (core+cli), `plugins/agentic-research/scripts/install-research-view.sh`, `scripts/bump-version.sh` (now projects the version stamp + bash literal for BOTH work-view and research-view)

## Current doc text
> The agile-workflow substrate binary supersedes `work-view.sh` … with **one Rust
> binary** … (Distribution framed entirely on work-view / `.work/bin/` / `convert`)

## Reality
research-view replicates the same pattern in a different plugin: Rust core+cli
crates, prebuilt-per-platform + pure-bash fallback, `uname -s`/`-m`→triple
selection, `--version` lockstep now projected by the generalized
`bump-version.sh`. The skill's description triggers (`work-view binary`,
`.work query core`) wouldn't auto-load for research-view work, and the
distribution section asserts work-view-specifics as if singular. (research-view
has NO board/axum surface, so the board/asset-embedding sections legitimately
stay work-view-only.)

## Required edit
Generalize the skill to "the substrate-binary pattern" with two named instances —
work-view over `.work/` (agile-workflow, CLI + board) and research-view over
`.research/` (agentic-research, CLI only). Reframe Distribution/install +
`bump-version.sh` lockstep as the shared pattern (install targets
`.work/bin/work-view` vs `.research/bin/research-view`). Add research-view triggers
to the description. Keep the board/asset-embedding sections marked work-view-only.
