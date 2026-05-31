---
id: gate-cruft-unused-report-param
kind: story
stage: drafting
tags: [cleanup]
parent: null
depends_on: []
release_binding: 0.8.6
gate_origin: cruft
created: 2026-05-31
updated: 2026-05-31
---

# Remove unused `_report` parameter on `collect_sorted_paths`

## Confidence
Medium

## Category
dead function (dead parameter)

## Location
`plugins/agile-workflow/work-view/crates/core/src/index.rs:230`

## Evidence
```rust
fn collect_sorted_paths(
    root: &Path,
    _report: &mut LoadReport,
) -> Result<Vec<(PathBuf, Tier)>, LoadError> {
    let work = root.join(".work");
    // ... body never reads or writes _report ...
```

## Removal
Underscore-prefixed to suppress the unused-variable lint (so neither rustc nor
clippy flags it — hence Medium, not tool-detected). The body only collects/sorts
paths and never touches `_report`. Remove the `_report: &mut LoadReport` parameter
and update the single caller at `index.rs:98` from
`collect_sorted_paths(root, &mut report)?` to `collect_sorted_paths(root)?`.
`report` is still used afterward by the caller, so no other change is needed.
Vestige of an earlier design where path collection emitted diagnostics.
