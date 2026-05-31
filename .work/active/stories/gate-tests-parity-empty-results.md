---
id: gate-tests-parity-empty-results
kind: story
stage: drafting
tags: [testing]
parent: null
depends_on: []
release_binding: 0.8.6
gate_origin: tests
created: 2026-05-31
updated: 2026-05-31
---

# Bash-parity tests for empty `--parent` / `--blocking` results

## Priority
Low (complementary — deferred to backlog, not release-blocking)

## Spec reference
Item: `epic-substrate-cli-query-core` (Unit 3) / `epic-substrate-cli-adapter` (Unit 2).
Acceptance: "`dependents_of` / `children_of` match work-view's `--blocking` /
`--parent`."

## Why
`--blocking feat-a` and `--parent epic-alpha` each have a bash-parity test, so the
criterion is substantially met. Minor gap: no bash-parity test for `--parent <id>`
where the id has no children (empty), nor `--blocking <id>` where nothing depends on
it — the empty-result partition at the parity level. Low because empty-result
rendering is independently covered (`table_empty_result_prints_nothing`,
`count_mode_zero_for_no_match`).

```rust
// crates/cli/tests/integration.rs
#[test]
fn parity_parent_with_no_children_empty_matches_bash() {
    // --parent story-alpha-1 (a leaf): binary and bash both emit empty + exit 0
}
```
