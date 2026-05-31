---
id: epic-substrate-cli-next-actionable
kind: feature
stage: drafting
tags: [tooling]
parent: epic-substrate-cli
depends_on: [epic-substrate-cli-query-core]
release_binding: null
gate_origin: null
created: 2026-05-30
updated: 2026-05-30
---

# Stage-aware "next actionable" (the `--ready` fix)

## Brief

The headline correctness fix. Today `work-view --ready` is hard-gated to
`stage:implementing` with deps satisfied, so a drafting feature whose
dependencies are all done is invisible — agents repeatedly hit "nothing ready"
when there is in fact design-ready work. This feature delivers a **stage-aware
"next actionable"** computation on the query core's dependency graph: an item is
actionable when its `depends_on` are all terminal AND its stage admits the next
move — design-ready (`drafting` with deps satisfied), implement-ready
(`implementing` with deps satisfied), and review-ready (`review`). It surfaces
through `--ready` (and `--blocked`), wired into the adapter's CLI scaffold, and
should let an agent ask "what can I pick up next, at any stage?".

Does NOT re-implement the core graph (it consumes it) or the standard flag
surface (that's the adapter). Defines what "actionable" means per stage and
exposes it.

## Epic context
- Parent epic: `epic-substrate-cli`
- Position in epic: depends on the core's dependency-graph eval; parallel with
  `adapter` but shares the CLI entrypoint — feature-design should have it plug
  `--ready`/`--blocked` into the adapter's arg-parsing scaffold (see the epic's
  decomposition risks).

## Foundation references
- `docs/VISION.md` — success criterion: the agent tooling answers "what can I do
  next?" correctly at any stage, not just one.
- `plugins/agile-workflow/docs/SPEC.md` — current `--ready` / `--blocked`
  definition and the stage flow per kind (the contract this revises).
