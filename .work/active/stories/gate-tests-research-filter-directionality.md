---
id: gate-tests-research-filter-directionality
kind: story
stage: review
tags: [testing]
parent: null
depends_on: []
release_binding: null
gate_origin: tests
created: 2026-06-04
updated: 2026-07-07
---

# --research-origin / --research-refs not disambiguated end-to-end (shared fixture slug)

## Priority
Medium

## Spec reference
Item: `epic-research-work-handoff-live-fields-cli` + parent feature.
Acceptance: `--research-origin X` answers "what work is grounded in research X?"
and `--research-refs X` answers "what work tracks research X?" — directionally
distinct queries.

## Gap type
e2e-seam

## Details
The single golden fixture `story-research-1.md` sets `research_origin: ard-pos-x`
AND `research_refs: [ard-pos-x]` to the *same* slug. Both integration tests
(`research_origin_filter_selects_matching_item`,
`research_refs_filter_selects_matching_item`) query `ard-pos-x` and select the
same item, so both pass even if `args.rs` swapped the two flags' filter targets.
The directionality the contract rests on is unproven through the CLI (the core
layer disambiguates and args-unit tests prove the flag→field mapping in
isolation, but not the full flag→filter→item path with distinct slugs).

## Suggested test
Add a second fixture `story-research-2.md` with disjoint slugs
(`research_origin: ard-pos-y`, `research_refs: [ard-pos-z]`). Assert:
`--research-origin ard-pos-y --paths` selects it but `--research-refs ard-pos-y`
does NOT; `--research-refs ard-pos-z` selects it but `--research-origin ard-pos-z`
does NOT.

## Test location (suggested)
`plugins/agile-workflow/work-view/crates/cli/tests/integration.rs` + a new fixture
under `crates/cli/tests/fixtures/golden/.work/active/stories/`

## Implementation discovery
- Added a second fixture `story-research-2.md` with disjoint research slugs:
  `research_origin: ard-pos-y` and `research_refs: [ard-pos-z]`, matching the same
  frontmatter shape as `story-research-1.md`.
- Added end-to-end directionality coverage in `integration.rs` using `--paths` for
  both positive and opposite-direction negative assertions.
- Updated fixture-count assertions to account for the extra active item in the
  shared fixture set.

## Implementation notes
- Tests added: `research_origin_filter_is_directionally_distinct_from_refs`,
  `research_refs_filter_is_directionally_distinct_from_origin`.
- Verification run:
  - `cd plugins/agile-workflow/work-view && cargo test 2>&1 | tail -15`
  - `cd plugins/agile-workflow && bash scripts/tests/convert-content-integrity.test.sh 2>&1 | tail -5`

