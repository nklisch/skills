---
id: epic-substrate-cli-runtime-research
kind: feature
stage: drafting
tags: [tooling]
parent: epic-substrate-cli
depends_on: []
release_binding: null
gate_origin: null
created: 2026-05-30
updated: 2026-05-30
---

# Runtime & distribution research for the substrate binary

## Brief

Settle the foundational choices the rest of the epic is gated on. Decide the
binary's language/runtime — **Rust vs Bun** — and the cross-platform
distribution + install story: how a compiled binary ships through the Claude
Code and OpenAI Codex marketplaces, and how `convert` installs it into a target
project's `.work/bin/` (today `convert` just `cp`s a portable bash script; a
compiled binary needs per-platform builds, a build-on-install step, or a bundled
runtime). Also decide whether `work-view.sh` is fully retired or kept as a bash
fallback, and the **core-reuse form** the board epic will consume (a linked
library/module vs subprocessing the CLI).

Recorded lean (user): prefer whatever makes building the web board
(`epic-substrate-board`) off the same engine cheapest — likely Bun, which
serves an interactive web UI trivially and compiles to a single binary via
`bun build --compile`; Rust gives a smaller dependency-free static binary but a
heavier web story. Rust's difficulty is not a barrier (the agent writes it).

Run this via `/agile-workflow:research`. Output: a research doc + a decision
recorded back here. Does NOT write production code — it produces the decision the
core/adapter/install features build on.

## Epic context
- Parent epic: `epic-substrate-cli`
- Position in epic: foundation — every other feature depends on this decision.

## Foundation references
- `docs/ARCHITECTURE.md` — the two-surface substrate-access model (the chosen
  engine must serve both the agent CLI and, later, the human web board).
- `docs/SPEC.md` — distribution constraints (marketplace channels, dual
  manifests) the binary must ship within.
- `plugins/agile-workflow/docs/ARCHITECTURE.md` — current `convert` install path
  that copies `work-view.sh`.
