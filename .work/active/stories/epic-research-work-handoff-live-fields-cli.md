---
id: epic-research-work-handoff-live-fields-cli
kind: story
stage: done
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
- [x] `--research-origin <s>` / `--research-origin null` / `--research-refs <s>` map to the right `Filter` fields; missing values → `UsageError`
- [x] HELP lists both flags; `args.rs` unit tests mirror the `--gate` / `--blocking` tests
- [x] An integration-test fixture item carrying the fields is selected by `--research-origin` / `--research-refs --paths`
- [x] Board feed JSON includes both fields; no-build board module tests still pass; `cargo test` green across both crates

## Implementation discovery

No design flaws encountered. Implemented exactly as specified.

### Files changed

- `crates/cli/src/args.rs` — added `--research-origin` (via `nullable_match`, mirrors `--gate`) and `--research-refs` (→ `Some(v)`, mirrors `--blocking`) match arms; updated HELP const with two lines under the filters block; updated `parse_args` doc-comment contract list; added 5 unit tests.
- `crates/cli/src/board/feed.rs` — added `research_origin: Option<String>` and `research_refs: Vec<String>` to `FeedItem` struct (right after `gate_origin`) and cloned them through in `feed_item()`.
- `crates/cli/tests/fixtures/golden/.work/active/stories/story-research-1.md` — new fixture item carrying `research_origin: ard-pos-x` and `research_refs: [ard-pos-x]` for integration-test coverage.
- `crates/cli/tests/integration.rs` — added 2 integration tests (`research_origin_filter_selects_matching_item`, `research_refs_filter_selects_matching_item`); updated 4 existing tests whose hardcoded counts were stale due to the new fixture item (count_implementing, ready_returns, ready_stage_implementing, ready_and_blocked_counts).

### Test counts
- Total: 323 tests (109 cli unit + 109 cli integration + 70 core unit + 31 core integration + 4 doctests) — all pass.
- New tests: 5 unit (args.rs) + 2 integration = 7 new tests.

### filters.js optional chip
Skipped — the existing filters.js chip set (kinds, stages, parents, tags, epics) is a multi-value set-filter pattern; `research_origin` is a scalar string like `gate_origin`, which currently has no chip. Adding a chip would require non-trivial JS changes (new filter key, UI chip, serialize/normalize logic). Skipped per the OPTIONAL caveat in the spec.
