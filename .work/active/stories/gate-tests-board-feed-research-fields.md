---
id: gate-tests-board-feed-research-fields
kind: story
stage: done
tags: [testing]
parent: null
depends_on: []
release_binding: null
gate_origin: tests
created: 2026-06-04
updated: 2026-06-04
---

# Board feed JSON test does not assert research_origin/research_refs serialize

## Priority
High

## Spec reference
Item: `epic-research-work-handoff-live-fields-cli` (Unit 5)
Acceptance criterion: "Board feed JSON includes both fields; no-build board module
tests still pass" — the unit explicitly directs extending the DTO assertion.

## Gap type
e2e-seam / missing valid-partition

## Details
`crates/cli/src/board/feed.rs` adds `research_origin`/`research_refs` to `FeedItem`
and clones them through `feed_item()`, but the DTO-shape assertion
`board_substrate_feed_returns_json_shape_without_private_fields`
(integration.rs:~1214) was NOT extended to assert the two new fields are present.
Nothing fails if `feed_item()` silently dropped one of them. The fixture `feat-b`
sets neither field, so a meaningful test needs an item that carries them
(`story-research-1` does).

## Suggested test
In `board_substrate_feed_returns_json_shape_without_private_fields`, locate
`story-research-1` in the feed `items` array and assert
`item["research_origin"] == "ard-pos-x"` and `item["research_refs"] == ["ard-pos-x"]`
(or add both keys to the presence-key loop for an item that sets them).

## Test location (suggested)
`plugins/agile-workflow/work-view/crates/cli/tests/integration.rs` (~L1214)

## Implementation notes
Extended `board_substrate_feed_returns_json_shape_without_private_fields` to locate
`story-research-1` in the feed and assert `research_origin == "ard-pos-x"` and
`research_refs == ["ard-pos-x"]` serialize. Test passes — confirms the linkage fields
reach the board feed end-to-end (a `feed_item()` dropping one would now fail).
