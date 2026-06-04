---
id: epic-agentic-research-research-view-core
kind: story
stage: review
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

## Implementation notes

### Files created
- `plugins/agentic-research/research-view/Cargo.toml` — workspace manifest (`resolver = "2"`, `members = ["crates/core"]`, release profile block verbatim from work-view)
- `plugins/agentic-research/research-view/crates/core/Cargo.toml` — package `research-view-core`, edition 2021, same dep versions as work-view-core
- `plugins/agentic-research/research-view/crates/core/src/lib.rs` — crate-level doc, `pub mod` declarations
- `plugins/agentic-research/research-view/crates/core/src/model.rs` — `ResearchTier` (7 variants), `Artifact` struct (all domain fields `Option<String>`)
- `plugins/agentic-research/research-view/crates/core/src/parse.rs` — `parse_artifact`, `split_frontmatter` (verbatim logic from work-view), `normalize_optional`, all-optional `RawFrontmatter`
- `plugins/agentic-research/research-view/crates/core/src/index.rs` — `Substrate`, `LoadReport`, `find_substrate_root`, per-tier collection (flat + recursive), raw/ skip, skip-filenames guard
- `plugins/agentic-research/research-view/crates/core/src/filter.rs` — `Match`, `Filter`, `Substrate::query<'a>` (borrowing, load-order preserving)
- `plugins/agentic-research/research-view/crates/core/src/error.rs` — `ParseError`, `LoadError::Io`, hand-written `Display` (no thiserror)

### Design discrepancies
None. All spec requirements implemented as described.

One minor deviation from the spec: `parse_artifact` receives `corpus: Option<String>` (precomputed by the loader from the directory name) rather than re-deriving it from the path — this is cleaner and keeps parse.rs path-agnostic. The loader derives corpus at collection time in `collect_reference_corpora`, which is where the path information lives.

The `split_frontmatter` `if-let` chain was rewritten as `strip_prefix('\n').or_else(|| strip_prefix("\r\n"))?` to clear a clippy `question_mark` lint (the same lint exists in work-view but was not fixed there).

### Tests added: 55 total
- `parse` module: 18 tests (attestation/precis/position/brief frontmatter; identity fallback chain — handle/slug/stem; normalization — null YAML/literal "null"/empty/""/whitespace; raw_text=full/body excludes FM; corpus propagation; error cases)
- `index` module: 16 tests (find_substrate_root walks up / returns None; empty load; tier derivation for all 7 tiers; corpus derivation; byte-sorted load order; non-fatal skip of malformed file; raw/ excluded; README/CONVENTIONS/references.md not indexed; rel_path relative)
- `filter` module: 17 tests (each filter dimension; IsNull on handle/status/corpus; AND composition; load-order preserved; tier filter)
- doc-tests: 4 (lib.rs entry-point examples compile; filter doc-test compiles)

### Verification
- `cargo test`: 51 unit + 4 doc-tests = 55 total — all green
- `cargo build`: clean (dev profile)
- `cargo clippy`: 0 warnings after fixing the `question_mark` lint
