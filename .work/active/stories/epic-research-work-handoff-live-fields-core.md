---
id: epic-research-work-handoff-live-fields-core
kind: story
stage: implementing
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
- [ ] `Item` carries both fields; defaults `[]` / `None`; crate compiles (all `Item { }` literals updated)
- [ ] `research_refs` parses flow + block YAML lists; `research_origin` null/empty/missing → `None`; missing `research_refs` → `[]`
- [ ] `Filter.research` (Equals/IsNull) filters by origin; `Filter.research_refs = Some(x)` selects items whose refs contain `x`; both AND-compose with existing filters
- [ ] New unit tests mirror `filter_gate_equals` + `filter_blocking_reverse_dep`; `cargo test -p work-view-core` green
