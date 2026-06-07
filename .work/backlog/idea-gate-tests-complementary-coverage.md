---
id: idea-gate-tests-complementary-coverage
created: 2026-06-04
tags: [testing]
---

gate-tests (pre-merge, 2026-06-04) Low-priority complementary coverage — covered
elsewhere, file for parity:
- **`--research-origin null` (IsNull) has no integration test**, unlike its mirror
  `--gate null` (which has `is_null_matches_missing_and_explicit_null_gate`).
  Covered at the args-unit level (`research_origin_null_sets_is_null_match`); only
  the e2e IsNull-matches-missing-and-explicit-null assertion is missing. Mirror the
  `gate_origin` precedent test. (item: `epic-research-work-handoff-live-fields-cli`)
- **research-view per-dimension CLI filters** (`--status` / `--temporal-contract` /
  `--provenance` / `--corpus`) are not exercised through the real binary in
  `crates/cli/tests/integration.rs`; they ARE covered by core unit tests (17 filter
  tests) and the bash parity harness against the live `.research/`. One integration
  test (e.g. `--status settled --paths` selects the seed position) would close the
  binary's own arg→filter wiring gap. (item: `epic-agentic-research-research-view-cli`)
