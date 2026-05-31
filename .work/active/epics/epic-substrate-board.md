---
id: epic-substrate-board
kind: epic
stage: drafting
tags: [tooling]
parent: null
depends_on: [epic-substrate-cli]
release_binding: null
gate_origin: null
created: 2026-05-30
updated: 2026-05-30
---

# Substrate Board — interactive human surface over `.work/`

## Brief

Supersede the static-HTML `work-board` (a bash script that emits a one-shot page)
with an **interactive** web board served by the same compiled binary from
`epic-substrate-cli`, reusing its `.work/` query core. This is the human-facing
surface: where the agent CLI optimizes for parseable terseness, the board
optimizes for human cognition — seeing the whole substrate at a glance and
steering by it.

Scope is the rich exploration surface the current board lacks: an interactive
**kanban** by stage, a **dependency view** that makes `depends_on` chains and
blockers visible, a **table view** with sortable/filterable columns, **better
rendering of item card bodies** (the markdown body, not just frontmatter),
automatic **hiding of released/archived items** so active work stays in focus,
and **filter knobs** (by tag, kind, parent, stage, release) that compose the way
the CLI's flags do. It reads the same substrate the CLI reads — one source of
truth, two adapters.

This epic depends on `epic-substrate-cli` because the shared query core and the
binary host are delivered there. It does NOT cover the agent CLI or the core
itself.

## Foundation references

- `docs/ARCHITECTURE.md` — "The substrate-access model" (the human-surface half).
- `docs/VISION.md` — the dogfooding thesis: the board's first real dataset is the
  set of items describing its own construction.
- `plugins/agile-workflow/docs/ARCHITECTURE.md` — current board behavior and the
  `work-board` script + template it replaces.

## Anticipated child features

Provisional — real decomposition happens at `epic-design` / `feature-design`:

- **Web host off the binary** — serve the interactive board from the compiled
  binary, reading the shared `.work/` core.
- **Kanban view** — columns by stage, items as cards.
- **Dependency view** — visualize `depends_on` chains, blockers, and what each
  item unblocks.
- **Table view** — sortable, filterable columns over the item set.
- **Card-body rendering** — render the markdown item body, not just frontmatter.
- **Filters + auto-hide** — composable tag/kind/parent/stage/release knobs;
  released/archived hidden by default.

## Foundation docs to roll forward

When this epic ships:

- `plugins/agile-workflow/docs/ARCHITECTURE.md` — replace the static `work-board`
  description with the interactive board served by the binary.
- `docs/ARCHITECTURE.md` (this repo) — the human-surface half of the
  substrate-access model (no longer "static HTML").
- The `agile-workflow:board` skill — update to launch/point at the interactive
  board rather than generating a one-shot page.

<!-- The design pass on each child feature will fill in real specifics. -->
