---
id: gate-cruft-dead-loaderror-from-impl
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

# Remove dead `From<io::Error> for LoadError` conversion impl

## Confidence
Medium

## Category
compatibility shim (unused convenience impl)

## Location
`plugins/agile-workflow/work-view/crates/core/src/error.rs:63`

## Evidence
```rust
impl From<std::io::Error> for LoadError {
    fn from(e: std::io::Error) -> Self {
        LoadError::Io(e)
    }
}
```

## Removal
A `From<io::Error>` impl is only meaningful for `?`-operator auto-conversion. No
code path uses it: the sole `LoadError` construction site (`index.rs:242`) uses the
explicit `.map_err(LoadError::Io)`, and `collect_md_recursive` returns
`std::io::Result` (bare `?` internally, never converting to `LoadError`). Removing
the impl block (lines 63-67) has no ripple — `LoadError::Io(e)` is still constructed
explicitly and matched in `main.rs:80`. Public impl on a public type (hence Medium,
not High), but `work-view-core` is plugin-internal (not a published crate), so
removing the unused impl is safe — keep the removal clean per the no-compat-shim
convention.
