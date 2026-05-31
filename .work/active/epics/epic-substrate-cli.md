---
id: epic-substrate-cli
kind: epic
stage: drafting
tags: [tooling]
parent: null
depends_on: []
release_binding: null
gate_origin: null
created: 2026-05-30
updated: 2026-05-30
---

# Substrate CLI — compiled agent surface over `.work/`

## Brief

Replace the `work-view` bash script with a compiled binary that serves the
**agent-facing** surface over the `.work/` substrate, and build the shared
`.work/` query/domain core it stands on. The core — frontmatter parsing, the
item model, dependency-graph evaluation, and filtering — is the single source
of truth that the human web board (`epic-substrate-board`) later reuses; it
rides with the CLI because the CLI is its first and minimal consumer, not in a
standalone "core" epic.

The headline correctness fix lives here: `work-view --ready` is currently
hard-gated to `stage:implementing`, so a drafting feature whose dependencies are
all satisfied is invisible to it. This epic delivers a **stage-aware "next
actionable"** semantic — design-ready drafting items, implement-ready items, and
review-ready items all surface as workable, with the agent able to ask "what can
I pick up next, at any stage?" The CLI keeps agent ergonomics: terse, parseable,
scriptable output. Humans are not the audience — that is the board's job.

A real distribution problem is in scope and should be settled early: a bash
`work-view` is a portable file `convert` can `cp` into any target project's
`.work/bin/`. A compiled binary is not — it needs per-platform builds (Linux /
macOS / Windows, x64 / arm64) shipped through the Claude Code + Codex
marketplaces, or a build-on-install step, or a runtime. The runtime choice
(Rust vs Bun) is entangled with this and must be researched before building.

This epic does NOT cover the interactive human web board.

## Foundation references

- `docs/ARCHITECTURE.md` — "The substrate-access model" (agent CLI vs human
  board; one substrate, two adapters).
- `docs/VISION.md` — success criterion: the agent-facing tooling answers "what
  can I do next?" correctly at any stage.
- `plugins/agile-workflow/docs/SPEC.md` — current `work-view` flag set, exit
  codes, and `--ready` definition (the contract this epic revises).
- `plugins/agile-workflow/docs/ARCHITECTURE.md` — "Querying with work-view" and
  the `convert` install path that copies the script.

## Anticipated child features

Provisional — real decomposition happens at `epic-design` / `feature-design`:

- **Research: runtime + distribution** — Rust vs Bun, and how a compiled binary
  ships cross-platform through the marketplace and gets installed by `convert`.
  (Likely a `[research]` first child the rest depend on.)
- **`.work/` query core** — frontmatter/item model, dependency-graph evaluation,
  filter composition. The shared engine both surfaces read.
- **Stage-aware next-actionable** — the `--ready` fix generalized across
  drafting/implementing/review.
- **CLI adapter (work-view parity)** — every current flag and output mode,
  reimplemented on the core, with parseable/scriptable output preserved.
- **`convert` install path** — how the binary lands in a target `.work/bin/`
  (and any bash fallback).

## Foundation docs to roll forward

When this epic ships, these assertions become stale and must roll forward in the
same work (the `docs` gate enforces this at release):

- `plugins/agile-workflow/docs/VISION.md` — "a `work-view` **bash** script" →
  compiled binary.
- `plugins/agile-workflow/docs/SPEC.md` — `work-view` flag set, exit codes, and
  the revised `--ready` / next-actionable semantic.
- `plugins/agile-workflow/docs/ARCHITECTURE.md` + `ROADMAP.md` — work-view
  description and the `convert` copy/install step.
- `docs/ARCHITECTURE.md` (this repo) — the agent-surface half of the
  substrate-access model.

<!-- The design pass on each child feature will fill in real specifics. -->
