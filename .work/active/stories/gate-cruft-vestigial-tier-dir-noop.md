---
id: gate-cruft-vestigial-tier-dir-noop
kind: story
stage: done
tags: [cleanup]
parent: null
depends_on: []
release_binding: 0.8.6
gate_origin: cruft
created: 2026-05-31
updated: 2026-05-31
---

# Delete vestigial `let _ = tier_dir;` no-op in test helper

## Confidence
Medium

## Category
dead code (no-op statement)

## Location
`plugins/agile-workflow/work-view/crates/cli/src/actionable.rs:107`

## Evidence
```rust
fn item_md(id: &str, tier_dir: &str, stage: &str, depends_on: &[&str]) -> (&'static str, String) {
    // caller provides tier_dir like "active/features", "archive", etc.
    let _ = tier_dir; // used in test calls below as the path prefix
    // ...
    let path = Box::leak(format!("{tier_dir}/{id}.md").into_boxed_str());  // line 124 — tier_dir IS used
```

## Removal
`tier_dir` is genuinely used at line 124 (`format!("{tier_dir}/{id}.md")`), so the
`let _ = tier_dir;` discard at line 107 is a dead no-op and its comment ("used in
test calls below") is self-contradictory — it suppresses nothing. Delete line 107
(and the now-orphaned comment on line 106). Test code only; no behavior change.
Leftover from a refactor where `tier_dir` was temporarily unused.

## Done (2026-05-31)
Deleted the `let _ = tier_dir;` no-op line in `actionable.rs::item_md`; kept the
explanatory comment (still accurate — `tier_dir` is used at the `format!` on the path).
clippy clean, all tests pass.
