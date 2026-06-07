---
source_handle: cargo-profiles
fetched: 2026-06-03
source_url: https://doc.rust-lang.org/cargo/reference/profiles.html
provenance: source-direct
source_class: standard
---

# The Cargo Book — Profiles

## Summary

Official documentation of Cargo profile settings governing optimization and binary
output, including the size-relevant, stable-toolchain knobs: `opt-level`, `strip`,
`lto`, `codegen-units`, and `panic`.

## Key passages

> "The `strip` option controls the `-C strip` flag, which directs rustc to strip either symbols or debuginfo from a binary." — `strip`

> `opt-level` `"s"`: "optimize for binary size"; `"z"`: "optimize for binary size, but also turn off loop vectorization." — `opt-level`

> "The `lto` setting controls `rustc`'s `-C lto` ... options ... LTO can produce better optimized code, using whole-program analysis, at the cost of longer linking time." — `lto`

## Structural metadata

`doc.rust-lang.org/cargo/reference/profiles.html`. These are stable-toolchain profile
settings (unlike `build-std`, which is nightly).
