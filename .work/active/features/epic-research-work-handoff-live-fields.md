---
id: epic-research-work-handoff-live-fields
kind: feature
stage: drafting
tags: [tooling, docs]
parent: epic-research-work-handoff-live
depends_on: [epic-agentic-research]
release_binding: null
gate_origin: null
created: 2026-06-04
updated: 2026-06-04
---

# Linkage fields in the `.work/` schema + `work-view` (`research_refs:` / `research_origin:`)

## Brief
Make the two HANDOFF.md linkage fields first-class optional `.work/` state. Add
`research_refs:` (the research artifact(s) a work item tracks/consumes — Arrow 1
coordination) and `research_origin:` (the research artifact that spawned a work
item — Arrow 2 grounding) to the agile-workflow `.work/` item shape, mirroring
the existing `gate_origin:` convention end-to-end: parse, store, filter, render,
and board, plus `--research-origin` / `--research-refs` query flags on
`work-view` (the `--gate` analog). This is the **schema foundation** of the epic
— both other features populate fields this feature defines and query them via
the flags this feature ships.

Per the locked design decision (see parent epic), **this feature owns the
linkage query.** A schema field with no filter flag is dead weight; `gate_origin`
shipped together with `--gate`. So fields + flags land as one complete,
queryable vertical slice in a single agile-workflow version bump — "what work is
grounded in research X?" is just `--research-origin X`, and "what work tracks
research X?" is `--research-refs X` (membership against the list field). No
cross-tier traversal: `work-view` only ever filters `.work/` items by their own
linkage fields; it never reaches into `.research/`.

This feature also performs the **foundation roll-forward** the parent epic
deferred from scope time — documenting the two fields in `.work/CONVENTIONS.md`,
the agile-workflow SPEC frontmatter contract, and the `AGENTS.md` substrate
section — because the fields now exist (presence-based docs).

Does NOT cover: the Arrow 2 emission gate or the Arrow 1 commissioning
convention (separate child features that depend on this one). Does NOT touch the
`agentic-research` plugin or any `.research/`-artifact-side fields (those are
agentic-research-owned).

## Epic context
- Parent epic: `epic-research-work-handoff-live`
- Position in epic: **foundation feature** — the schema + query both other child
  features depend on (`emission-gate` writes `research_origin:`; `coordination`
  relies on `research_refs:` and the linkage flags). Owned entirely by
  agile-workflow → one agile-workflow version bump.
- Carries the epic's cross-epic dependency `depends_on: [epic-agentic-research]`
  on purpose: `work-view` readiness is **non-transitive** (it evaluates only an
  item's own `depends_on`, not its parent epic's — see
  `crates/cli/src/actionable.rs` + `crates/core/src/graph.rs:deps_satisfied`).
  Materializing the epic-level gate onto this entry feature keeps the whole epic
  `--blocked` until the prior ARD-adoption epic lands; the other two children
  inherit the gate transitively through their `depends_on` on this feature. Do
  not remove this edge as "redundant" — it is the mechanism that enforces the
  ordering.

## Foundation references
- `plugins/agentic-research/docs/HANDOFF.md` — "The linkage contract (proposed)"
  table: `research_refs:` (coordination) + `research_origin:` (grounding),
  mirroring `gate_origin:`. This feature makes that proposed contract real.
- `plugins/agile-workflow/docs/SPEC.md` — the frontmatter contract: the
  frontmatter block (~L47), the field-semantics table (~L53-64, where
  `gate_origin` is documented), the `work-view` flag table (~L354, `--gate`),
  and the TS envelope type (~L444, `gate_origin: string | null`). All gain the
  two new fields/flags.
- `AGENTS.md` — Agile-Workflow Substrate section (the `kind, stage, tags,
  parent, depends_on, release_binding` field list, ~L96) + `.work/CONVENTIONS.md`.
- `plugins/agile-workflow/work-view/` — the `gate_origin` vertical slice to
  mirror: `core/src/model.rs`, `core/src/parse.rs`, `core/src/filter.rs`,
  `core/src/index.rs`, `core/src/graph.rs`, `cli/src/args.rs`,
  `cli/src/render.rs`, `cli/src/board/feed.rs` + `board/assets/filters.js`, and
  the integration tests in both crates.

<!-- The design pass on this feature (/agile-workflow:feature-design) will fill
in interfaces, signatures, field cardinality, and the test approach. Note for
that pass: research_refs is plural per HANDOFF ("handles or analysis slugs") so
it is likely a list/sequence — unlike gate_origin's single Option<String> — which
changes parse (YAML sequence vs scalar), filter (membership vs equality), and the
flag's match semantics. Do not blind-copy the gate_origin shape. -->
