---
id: gate-tests-ready-drafting-binary
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

# Prove the headline `--ready` fix at the binary level (drafting + satisfied deps)

## Priority
High

## Spec reference
Item: `epic-substrate-cli-next-actionable` (and parent `epic-substrate-cli`, whose
reason-for-being is this fix).
Acceptance criterion: "A drafting active item with all deps terminal → in
`--ready`." (next-actionable Unit 1). Epic Brief: "a drafting feature whose
dependencies are all satisfied is invisible to it ... design-ready ... all surface
as workable." Plus the composition guarantee "`--ready --stage drafting` =
design-ready only."

## Gap type
Missing test for valid partition / e2e-seam — the central positive case is proven
only in-memory (`actionable.rs::ready_includes_drafting_with_satisfied_deps`), never
through the compiled binary (`CARGO_BIN_EXE_work-view`). The CLI golden fixture has
exactly one drafting item (`feat-b`) whose single dep (`feat-a`) is `implementing`
(non-terminal), so the only integration test touching design-ready
(`ready_stage_drafting_returns_only_drafting_ready_items`) asserts an **empty**
result — it proves the *blocked* path, not the *fixed* path. Folds in the gate's
Finding 8 (the `--ready --stage drafting` positive partition), which the same
fixture change unblocks.

## Suggested test
```rust
// crates/cli/tests/integration.rs
// Fixture: add a `done` dep so a drafting item has all deps terminal, e.g.
//   active/features/feat-design-ready.md  (stage: drafting, depends_on: [feat-done-dep])
//   active/features/feat-done-dep.md      (stage: done)
#[test]
fn ready_surfaces_drafting_item_with_satisfied_deps() {
    let (stdout, _, code) = run(&["--ready", "--paths"]);
    assert_eq!(code, 0);
    assert!(stdout.contains("feat-design-ready"),
        "a drafting item with satisfied deps MUST surface in --ready (headline fix)");
}

#[test]
fn ready_stage_drafting_returns_design_ready_items() {
    // --ready --stage drafting --paths contains the design-ready item;
    // implementing/review-ready items are filtered out by --stage drafting.
}
```

## Test location (suggested)
`plugins/agile-workflow/work-view/crates/cli/tests/integration.rs` (+ a `done` dep
fixture under `crates/cli/tests/fixtures/golden/.work/active/`).
