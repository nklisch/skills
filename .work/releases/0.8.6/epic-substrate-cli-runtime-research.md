---
id: epic-substrate-cli-runtime-research
kind: feature
stage: done
tags: [tooling]
parent: epic-substrate-cli
depends_on: []
release_binding: 0.8.6
gate_origin: null
created: 2026-05-30
updated: 2026-05-31
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

## Decision (2026-05-30)

**Rust** — confirmed by the user after research reversed the initial Bun lean.
Distribution is decisive: the plugin is a git tree, so binary size = repo size.
Rust musl binaries (~2–5 MB) are committable; Bun's (51–105 MB) are not, and
Bun's `--compile` asset embedding is "work in progress" while the runtime is
mid Zig→Rust rewrite.

- **Distribution**: commit prebuilt per-platform binaries (`linux-x64-musl`,
  `linux-arm64-musl`, `darwin-arm64`, `darwin-x64`); `convert` selects by
  `uname` and places one at `.work/bin/work-view`. Keep `work-view.sh` as the
  fallback for unsupported platforms.
- **Architecture**: one Rust core crate (parse + dependency graph + filter +
  next-actionable), two entry points — a CLI adapter and an `axum` board server
  embedding web assets via `rust-embed`. Cross-compile with `cargo-zigbuild`
  (Linux musl) + a macOS runner (darwin).
- **Core-reuse form**: a shared library crate both surfaces import (not
  subprocess).
- **Revisit trigger**: a Bun `--compile` release under ~10 MB with stable asset
  embedding.

Full analysis: `docs/research/substrate-binary-runtime.md`. Auto-loading
reference for the build features: `.agents/skills/substrate-binary/`.

Research spike complete — the deliverable (decision + research doc + reference
skill) is produced and user-approved. Advanced to `done`; unblocks
`epic-substrate-cli-query-core`.
