---
id: epic-research-work-handoff-live-fields
kind: feature
stage: implementing
tags: [tooling, docs]
parent: epic-research-work-handoff-live
depends_on: [epic-agentic-research-substrate-tier]
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
- Carries the epic's cross-epic dependency
  `depends_on: [epic-agentic-research-substrate-tier]` on purpose: `work-view`
  readiness is **non-transitive** (it evaluates only an item's own `depends_on`,
  not its parent epic's — see `crates/cli/src/actionable.rs` +
  `crates/core/src/graph.rs:deps_satisfied`). Materializing the epic-level gate
  onto this entry feature lets the other two children inherit it transitively
  through their `depends_on` on this feature. Do not remove this edge as
  "redundant" — it is the mechanism that enforces the ordering. The dependency
  targets `substrate-tier` (the landed `.research/` tier + done
  `research-orchestrator`), **not** the whole `epic-agentic-research` epic, so the
  handoff is not coupled to the orthogonal `research-view` follow-on.
  substrate-tier is done → this gate is satisfied.

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

## Architectural choice
**Faithful mirror of the `gate_origin` vertical slice**, with one deliberate
asymmetry for the list field. Both fields are added the way `gate_origin` already
threads through the stack, so the change is mechanical and pattern-consistent:

- **`research_origin: Option<String>`** — single scalar, an exact `gate_origin`
  twin: `normalize_optional` on parse, a `Match` filter field, a `--research-origin`
  flag via `nullable_match` (so `--research-origin null` → `IsNull`).
- **`research_refs: Vec<String>`** — a list (HANDOFF frames it as "handles or
  analysis slugs", plural). Stored like `tags`/`depends_on` (`#[serde(default)]`
  Vec + `normalize_vec`); **queried by single-slug membership** like the existing
  `blocking` reverse-dep filter (`--research-refs <slug>` → items whose
  `research_refs` contains `<slug>`). This answers "what work tracks research X?".

Both fields are **optional** — missing → `None`/`[]`, with **no** addition to
`index.rs`'s required-field validation (which warns only on `kind`/`stage`;
`gate_origin` et al. are explicitly exempt there). Inert when unset, exactly like
`gate_origin` on user-scoped items.

Rejected alternatives: (a) `research_refs` as repeatable AND-semantics like
`--tag` — over-built for the "tracks research X" query and asymmetric with the
single-slug `--research-origin`; single-slug membership mirrors `--blocking`,
the established reverse-membership precedent. (b) a single combined field — loses
the directional distinction (coordination vs grounding) the whole contract rests on.

## Implementation Units

### Unit 1: core model — the two `Item` fields
**File**: `crates/core/src/model.rs` · **Story**: `…-fields-core`
```rust
pub struct Item {
    // … after gate_origin:
    /// Research artifact(s) this work item tracks/consumes (Arrow 1, coordination).
    pub research_refs: Vec<String>,
    /// Research artifact that spawned this work item (Arrow 2, grounding).
    pub research_origin: Option<String>,
}
```
- Update the struct doc comment (the "normalized optional scalar" list gains
  `research_origin`; the "always a `Vec<String>`" list gains `research_refs`).
- **Update every in-memory `Item { … }` literal** or it won't compile:
  `model.rs` `make_item` (~L128), `actionable.rs` `make_item_direct` (~L149),
  `render.rs` test fixture (~L166). Add `research_refs: vec![]` /
  `research_origin: None`.
**Acceptance**: crate compiles; `Item` carries both fields; defaults are `[]`/`None`.

### Unit 2: parse — frontmatter → fields
**File**: `crates/core/src/parse.rs` · **Story**: `…-fields-core`
```rust
struct RawFrontmatter {
    // …
    #[serde(default)] research_refs: Vec<String>,
    #[serde(default)] research_origin: Option<String>,
}
// in parse_item():
research_refs: normalize_vec(raw.research_refs),
research_origin: normalize_optional(raw.research_origin),
```
**Acceptance**: flow + block YAML lists parse for `research_refs`; literal
`"null"`/`""`/missing `research_origin` → `None`; missing `research_refs` → `[]`.

### Unit 3: filter — query the fields
**File**: `crates/core/src/filter.rs` · **Story**: `…-fields-core`
```rust
pub struct Filter {
    // …
    /// Filter on `item.research_origin` (mirror of `gate`).
    pub research: Match,
    /// Membership: select items whose `research_refs` contains this id (mirror of `blocking`).
    pub research_refs: Option<String>,
}
// in item_matches():
if !f.research.matches_opt(&item.research_origin) { return false; }
if let Some(ref_id) = &f.research_refs {
    if !item.research_refs.iter().any(|r| r == ref_id) { return false; }
}
```
- Extend the `filter.rs` `full_item` test helper (and the `graph.rs`/`index.rs`/
  `actionable.rs` frontmatter-string fixtures) to emit the two new lines so
  fixtures stay representative (optional for parse, but keeps them faithful).
**Acceptance**: `research: Equals/IsNull` filters by origin; `research_refs:
Some(x)` selects items whose refs contain `x`; both AND-compose with existing filters.

### Unit 4: CLI flags + HELP
**File**: `crates/cli/src/args.rs` · **Story**: `…-fields-cli`
```rust
"--research-origin" => { let v = next_value("--research-origin", &mut iter)?; opts.filter.research = nullable_match(v); }
"--research-refs"   => { let v = next_value("--research-refs",   &mut iter)?; opts.filter.research_refs = Some(v); }
```
- Add two HELP lines under the filters block:
  `--research-origin <s>  Items with research_origin: <s>` and
  `--research-refs <s>    Items whose research_refs contains <s>`.
**Acceptance**: flags map to the right `Filter` fields; `--research-origin null`
→ `IsNull`; missing values → `UsageError` (via `next_value`).

### Unit 5: board feed DTO (+ optional filter chip)
**File**: `crates/cli/src/board/feed.rs` (+ `board/assets/filters.js`) · **Story**: `…-fields-cli`
- Add `research_refs: Vec<String>` and `research_origin: Option<String>` to the
  board JSON DTO (~L47) and clone them through (~L110), mirroring `gate_origin`.
- Optional parity: surface `research_origin` alongside `item?.gate_origin` in
  `filters.js` (~L93) if a chip is wanted; not required for this feature.
**Acceptance**: board JSON includes both fields; existing no-build board module
tests still pass (extend the DTO assertion if one exists).

### Unit 6: docs roll-forward (presence-based)
**Files**: `plugins/agile-workflow/docs/SPEC.md`, `.work/CONVENTIONS.md`,
`AGENTS.md`, `plugins/agile-workflow/docs/ARCHITECTURE.md` · **Story**: `…-fields-docs`
- **SPEC.md**: frontmatter block (~L47) gains `research_refs: [...]  # optional`
  and `research_origin: <slug>|null  # optional`; field-semantics table (~L64)
  gains both rows; the flag table (~L354) gains `--research-origin` /
  `--research-refs`; the TS envelope (~L444) gains `research_origin: string |
  null;` and `research_refs: string[];`.
- **AGENTS.md**: the substrate field list (~L96) appends `research_refs,
  research_origin`.
- **CONVENTIONS.md** + **ARCHITECTURE.md**: note the two optional linkage fields
  (mirroring `gate_origin`), pointing at `agentic-research`'s HANDOFF.md for the
  cross-tier contract.
**Acceptance**: docs describe the two fields as optional, mirroring `gate_origin`;
the SPEC frontmatter/flag/envelope all list them; no liveness overclaim about the
arrows (those land in the gate/coordination features).

## Implementation Order
1. `…-fields-core` (Units 1-3) — model, parse, filter. No within-feature deps.
2. `…-fields-cli` (Units 4-5) — flags + board. Depends on core (needs `Filter` +
   `Item` fields).
3. `…-fields-docs` (Unit 6) — roll-forward. Depends on core + cli (documents the
   realized field + flag surface).

## Testing
- **core** (`model.rs`/`parse.rs`/`filter.rs` unit tests): parse flow+block list
  for `research_refs`; `research_origin` null/empty/missing → `None`; missing
  `research_refs` → `[]`; `Filter.research` Equals/IsNull; `research_refs`
  membership; AND-composition with `stage`/`kind`. Mirror the existing
  `filter_gate_equals` / `filter_blocking_reverse_dep` tests.
- **cli** (`args.rs` unit + `tests/integration.rs`): `--research-origin <s>` /
  `--research-origin null` / `--research-refs <s>`; missing-value `UsageError`;
  an integration fixture item carrying the fields, asserting `--paths` selects it.
- **board**: extend the no-build board module test if it asserts the feed DTO shape.
- **docs**: mechanical — SPEC frontmatter/table/flag/envelope list both fields;
  AGENTS field list updated; all cross-links resolve.

## Risks
- **Struct-field addition is a compile-wide change.** Every `Item { … }` literal
  must add both fields (enumerated in Unit 1). Caught immediately by the compiler;
  listed so implementation doesn't miss the test fixtures.
- **List-field parse correctness.** `research_refs` as a YAML sequence is handled
  by `normalize_vec` exactly like `tags`/`depends_on`; the risk is only if a
  fixture emits it as a scalar. Mitigation: fixtures emit flow-style `[]`.
- **Over-documenting not-yet-live arrows.** Unit 6 documents the *fields* only;
  it must not claim the emission gate / commissioning arrows are live (those are
  the sibling features). Mitigation: docs describe field shape + the `gate_origin`
  mirror, and point at HANDOFF.md for the contract.

<!-- research_refs cardinality (list) + its single-slug membership filter are a
deliberate, precedent-grounded call (tags/depends_on storage + blocking filter),
not a gate_origin clone — see Architectural choice. -->
