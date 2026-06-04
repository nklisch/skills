---
id: epic-research-work-handoff-live-fields-core
kind: story
stage: review
tags: [tooling]
parent: epic-research-work-handoff-live-fields
depends_on: []
release_binding: null
gate_origin: null
research_refs: []
research_origin: null
created: 2026-06-04
updated: 2026-06-04
---

# Core: `research_refs` / `research_origin` in model, parse, filter

## Scope
Units 1-3 of the parent feature — the work-view **core** crate. Add the two
linkage fields to `Item`, parse them from frontmatter, and make them queryable in
`Filter`. Mirrors the `gate_origin` (scalar) and `tags`/`depends_on` + `blocking`
(list) precedents exactly.

## Units
- **Unit 1 — model** (`crates/core/src/model.rs`): add `research_refs: Vec<String>`
  and `research_origin: Option<String>` to `Item`; update the struct doc comment;
  update every in-memory `Item { … }` literal (`model.rs` `make_item`,
  `actionable.rs` `make_item_direct`, `render.rs` fixture) with `vec![]` / `None`.
- **Unit 2 — parse** (`crates/core/src/parse.rs`): add the two `#[serde(default)]`
  fields to `RawFrontmatter`; in `parse_item`, `research_refs:
  normalize_vec(raw.research_refs)` and `research_origin:
  normalize_optional(raw.research_origin)`.
- **Unit 3 — filter** (`crates/core/src/filter.rs`): add `research: Match` and
  `research_refs: Option<String>` to `Filter`; in `item_matches`,
  `f.research.matches_opt(&item.research_origin)` and single-slug membership over
  `item.research_refs`. Extend the `full_item` test helper to emit both fields.

Both fields are **optional** — do NOT add them to `index.rs` required-field
validation (it warns only on `kind`/`stage`).

## Acceptance criteria
- [x] `Item` carries both fields; defaults `[]` / `None`; crate compiles (all `Item { }` literals updated)
- [x] `research_refs` parses flow + block YAML lists; `research_origin` null/empty/missing → `None`; missing `research_refs` → `[]`
- [x] `Filter.research` (Equals/IsNull) filters by origin; `Filter.research_refs = Some(x)` selects items whose refs contain `x`; both AND-compose with existing filters
- [x] New unit tests mirror `filter_gate_equals` + `filter_blocking_reverse_dep`; `cargo test -p work-view-core` green

## Implementation notes

### Files changed
- `crates/core/src/model.rs` — added `research_refs: Vec<String>` and `research_origin: Option<String>` to `Item`; updated struct doc comment to include both fields alongside existing `gate_origin`/`depends_on` mentions; updated `make_item` test fixture.
- `crates/core/src/parse.rs` — added two `#[serde(default)]` fields to `RawFrontmatter`; wired `normalize_vec`/`normalize_optional` in `parse_item`; extended `full_item_parses_correctly` and `missing_optional_fields_are_none` to assert new fields; added 8 new tests covering flow array, block array, missing-yields-empty, null/empty/missing-normalizes-to-None, and value-preserved for both fields.
- `crates/core/src/filter.rs` — added `research: Match` and `research_refs: Option<String>` to `Filter`; added filter logic in `item_matches`; added 4 new tests: `filter_research_equals`, `filter_research_is_null`, `filter_research_refs_membership`.
- `crates/cli/src/actionable.rs` — updated `make_item_direct` literal with `research_refs: vec![]`, `research_origin: None`.
- `crates/cli/src/render.rs` — updated test fixture `Item { }` literal with `research_refs: vec![]`, `research_origin: None`.

### Verification
`cargo build --workspace` and `cargo test --workspace` both pass clean.
Test counts: 104 CLI unit + 107 CLI integration + 70 core unit + 31 core integration + 4 doc-tests = 316 total, 0 failures.

### Notable
- The committed `.work/bin/work-view` binary is NOT rebuilt by this story (crate-level change only) — that is a separate distribution/release concern, out of scope here.
- No deviations from the design spec. All fields follow the `gate_origin`/`blocking` precedent exactly.
