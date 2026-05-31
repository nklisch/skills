---
id: epic-substrate-cli-query-core
kind: feature
stage: drafting
tags: [tooling]
parent: epic-substrate-cli
depends_on: [epic-substrate-cli-runtime-research]
release_binding: null
gate_origin: null
created: 2026-05-30
updated: 2026-05-30
---

# Shared `.work/` query core

## Brief

The single engine both substrate surfaces read. Implements, in the runtime
chosen by the research feature: parsing `.work/` item files (YAML frontmatter +
markdown body) into an item model; building the dependency graph from
`depends_on` / `parent`; and composable filtering by stage, tag, kind, parent,
release, and gate. This is the Single-Source-of-Truth layer — the CLI adapter
and (later) the `epic-substrate-board` web view are both adapters over it
(Ports & Adapters).

Does NOT include the CLI flag surface or output formatting (that's
`epic-substrate-cli-adapter`), nor the stage-aware "next actionable" semantic
(that's `epic-substrate-cli-next-actionable`). It exposes the query/graph
primitives those build on. The core-reuse form (linked library vs subprocess)
decided by the research feature shapes this feature's public API.

## Epic context
- Parent epic: `epic-substrate-cli`
- Position in epic: the shared engine — `adapter` and `next-actionable` depend
  on it; `epic-substrate-board` later reuses it.

## Foundation references
- `docs/ARCHITECTURE.md` — substrate-access model; one substrate, two adapters.
- `plugins/agile-workflow/docs/SPEC.md` — the item frontmatter contract
  (`id, kind, stage, tags, parent, depends_on, release_binding, gate_origin`)
  and the existing `work-view` filter semantics this core must preserve.
