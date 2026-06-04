---
id: epic-research-work-handoff-live-fields-cli
kind: story
stage: implementing
tags: [tooling]
parent: epic-research-work-handoff-live-fields
depends_on: [epic-research-work-handoff-live-fields-core]
release_binding: null
gate_origin: null
research_refs: []
research_origin: null
created: 2026-06-04
updated: 2026-06-04
---

# CLI + board: `--research-origin` / `--research-refs` flags + feed DTO

## Scope
Units 4-5 of the parent feature — the work-view **cli** crate. Surface the core
fields through the CLI flags and the board feed. Depends on `…-fields-core` (needs
the `Filter` and `Item` fields).

## Units
- **Unit 4 — args** (`crates/cli/src/args.rs`): add `--research-origin` (→
  `filter.research` via `nullable_match`, so `null` → `IsNull`) and
  `--research-refs` (→ `filter.research_refs = Some(v)`, mirror of `--blocking`);
  add two HELP lines under the filters block; update the `parse_args` contract doc.
- **Unit 5 — board feed** (`crates/cli/src/board/feed.rs`): add `research_refs:
  Vec<String>` + `research_origin: Option<String>` to the JSON DTO (~L47) and
  clone them through (~L110), mirroring `gate_origin`. Optional parity:
  `research_origin` chip in `board/assets/filters.js` (~L93) — not required.

## Acceptance criteria
- [ ] `--research-origin <s>` / `--research-origin null` / `--research-refs <s>` map to the right `Filter` fields; missing values → `UsageError`
- [ ] HELP lists both flags; `args.rs` unit tests mirror the `--gate` / `--blocking` tests
- [ ] An integration-test fixture item carrying the fields is selected by `--research-origin` / `--research-refs --paths`
- [ ] Board feed JSON includes both fields; no-build board module tests still pass; `cargo test` green across both crates
