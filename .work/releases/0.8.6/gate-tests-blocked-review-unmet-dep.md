---
id: gate-tests-blocked-review-unmet-dep
kind: story
stage: done
tags: [testing]
parent: null
depends_on: []
release_binding: 0.8.6
gate_origin: tests
created: 2026-05-31
updated: 2026-05-31
---

# Test `--blocked` includes a review item with an unmet dep

## Priority
Medium

## Spec reference
Item: `epic-substrate-cli-next-actionable` (Unit 1).
Acceptance criterion: "A review active item ... with an unmet dep → in `--blocked`,
not `--ready`." Design decision: "`deps_satisfied` uniform across all three stages,
incl. `review`. A review item whose dependency regressed or is unknown should report
blocked."

## Gap type
Missing test for valid partition — decision-table cell stage==review ∧ ¬deps_satisfied
→ `--blocked`. `actionable.rs` has `ready_excludes_review_with_unmet_dep` (the
`--ready` exclusion half) but **no test asserts a review item with an unmet dep is
*included* in `--blocked`**. All four `blocked_*` unit tests use `implementing` or
terminal items; the `review` (and `drafting`) rows for `--blocked` are untested. The
conservative "review item whose dep regressed reports blocked" invariant is
unverified.

## Suggested test
```rust
// crates/cli/src/actionable.rs tests
#[test]
fn blocked_includes_review_with_unmet_dep() {
    let (path_unmet, c1) = item_md("unmet-dep", "active/features", "implementing", &[]);
    let (path_a, c2) = item_md("a", "active/features", "review", &["unmet-dep"]);
    let (_t, sub) = setup_substrate(&[(path_unmet, &c1), (path_a, &c2)]);
    assert!(run(&sub, DependencyView::Blocked).contains(&"a".to_string()));
}
```

## Test location (suggested)
`plugins/agile-workflow/work-view/crates/cli/src/actionable.rs`
