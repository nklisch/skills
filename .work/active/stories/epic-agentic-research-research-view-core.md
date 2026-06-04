---
id: epic-agentic-research-research-view-core
kind: story
stage: implementing
tags: [tooling]
parent: epic-agentic-research-research-view
depends_on: []
release_binding: null
gate_origin: null
created: 2026-06-04
updated: 2026-06-04
---

# research-view-core — the `.research/` query core

## Scope
The `research-view-core` crate at
`plugins/agentic-research/research-view/crates/core/` — the net-new query model
over the `.research/` substrate. Mirrors work-view's *machinery* (frontmatter
split, byte-sorted load, the `substrate-borrowing-query` filter shape,
`manual-error-display`) but NOT its `Item`/stage/graph semantics: research
artifacts have no `id` and no stage, and frontmatter is heterogeneous across
tiers.

Implements Unit 1 of the feature design — see
`.work/active/features/epic-agentic-research-research-view.md` for the full
`Artifact` / `ResearchTier` shape and parse/index/filter notes.

## Files
- `crates/core/src/{lib,model,parse,index,filter,error}.rs`
- `crates/core/Cargo.toml`, workspace `Cargo.toml`

## Acceptance criteria
- [ ] Parses each tier's real seed artifact in `.research/` (attestation, position,
  brief) into an `Artifact` with correct `tier` + normalized fields; `id` NOT required.
- [ ] `identity` = `source_handle` for attestations, `slug` for positions/briefs,
  file stem as fallback; never empty.
- [ ] Filters (tier, source_handle, status, temporal_contract, provenance, corpus)
  compose with AND and return borrowed `Vec<&Artifact>` in byte-sorted load order
  (the `substrate-borrowing-query` pattern).
- [ ] Malformed/half-authored frontmatter is skipped non-fatally (collected, not a panic).
- [ ] Absence of `.research/CONVENTIONS.md` is a typed "no substrate" condition; the
  core never `process::exit`s (`manual-error-display`).
- [ ] Unit tests via `substrate-test-fixture-builder` + `cargo-manifest-fixture-root`.

## Notes
- Reuse work-view's `split_frontmatter` approach and `Match::{Any,Equals,IsNull}`
  normalization, adapted to the all-optional research frontmatter.
- Do NOT parse `related:` typed edges — flat filters only for v1 (parked follow-on).
