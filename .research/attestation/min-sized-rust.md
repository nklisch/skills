---
source_handle: min-sized-rust
fetched: 2026-06-03
source_url: https://github.com/johnthagen/min-sized-rust
provenance: source-direct
source_class: repo-readme
substrate_confidence: source-direct
---

# min-sized-rust (README)

## Summary

A community reference cataloguing techniques to minimize Rust binary size (strip,
`opt-level = "z"`, LTO, panic strategies, `build-std`, `no_main`). It provides a few
absolute size figures for aggressively minimized macOS binaries; it does not isolate
per-technique deltas or state a baseline release size.

## Key passages

> "Cargo defaults its optimization level to `3` for release builds, which optimizes the binary for **speed**. To instruct Cargo to optimize for minimal binary **size**, use the `z` optimization level" — §"Optimize For Size"

> "By default on Linux and macOS, symbol information is included in the compiled `.elf` file. This information is not needed to properly execute the binary." — §"`strip` Symbols from Binary"

> "On macOS, the final stripped binary size is reduced to 51KB." — §"Optimize `libstd` with `build-std`"

> "On macOS, the final stripped binary is reduced to 8KB." — §"Remove `core::fmt` with `#![no_main]` and Careful Usage of `libstd`"

## Structural metadata

README of `github.com/johnthagen/min-sized-rust`. The absolute figures (51KB / 30KB /
8KB) are for nightly `build-std` / `no_main` minimal programs, not full CLIs — not a
like-for-like comparison to a real query tool.
