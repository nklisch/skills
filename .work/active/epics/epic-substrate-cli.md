---
id: epic-substrate-cli
kind: epic
stage: implementing
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

## Design decisions
- **Runtime, distribution, bash-fallback, and core-reuse form** — deferred to
  `epic-substrate-cli-runtime-research`. These are interdependent and gated on
  the runtime choice (Rust vs Bun), which the user delegated. Recorded lean:
  prefer whatever eases building the web board off the same engine (likely Bun);
  Rust's difficulty is not a barrier since the agent writes the code.
- **UI gating** — N/A for this epic; the agent CLI has no `ux-ui-design` surface,
  so no mocks and no full-ux-ui-pass gate. That gate lives on the sibling
  `epic-substrate-board`.

## Decomposition

Split by capability over the agent CLI: a research spike settles the runtime and
distribution story everything else is gated on; a shared `.work/` query core is
the single engine (Ports & Adapters — the board reuses it later); the headline
stage-aware `--ready` fix and the standard work-view flag surface build on the
core in parallel; and an install-path feature ships the compiled binary through
`convert`.

### Child features

- `epic-substrate-cli-runtime-research` — choose runtime (Rust vs Bun) + the
  cross-platform distribution & `convert`-install strategy, bash-fallback
  decision, and core-reuse form — depends on: `[]`
- `epic-substrate-cli-query-core` — shared `.work/` query/domain core
  (frontmatter/item model, dependency-graph eval, composable filters) — depends
  on: `[epic-substrate-cli-runtime-research]`
- `epic-substrate-cli-adapter` — agent-facing CLI surface: work-view flag +
  output-mode parity over the core — depends on:
  `[epic-substrate-cli-query-core]`
- `epic-substrate-cli-next-actionable` — stage-aware "next actionable" (the
  `--ready` fix across drafting/implementing/review) — depends on:
  `[epic-substrate-cli-query-core]`
- `epic-substrate-cli-install-path` — ship + `convert`-install the compiled
  binary into a target `.work/bin/` (+ any bash fallback) — depends on:
  `[epic-substrate-cli-adapter, epic-substrate-cli-next-actionable]`

### Decomposition risks

- **Runtime-research is the critical-path root** — every feature is gated on it;
  a poor runtime/distribution choice cascades. Mitigated by making it an explicit
  research spike (`/agile-workflow:research`) before any building.
- **Shared CLI entrypoint** — `adapter` and `next-actionable` both run after the
  core in parallel but both touch the CLI entrypoint/arg-parser. feature-design
  should give `adapter` ownership of the arg-parsing scaffold and have
  `next-actionable` plug its `--ready`/`--blocked` flags into it; otherwise
  implement-orchestrator sequences the two.

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
