---
slug: rust-binary-distribution-viable
status: settled
authored: 2026-06-03
provenance: agent-synthesis
temporal_contract: extend-on-source-rev
---

# Rust prebuilt binaries are a viable distribution choice for research-view

## What this position is about

`research-view` will ship as a prebuilt Rust binary committed to the git tree (the
`substrate-binary` pattern), so binary size *is* repo size. This position asks whether
that remains viable, grounded in the repo's existing precedent and Rust's documented
size behaviour — rather than recalling an estimate.

## The precedent already in this repo

`work-view` — a real substrate query binary of comparable scope — already ships four
cross-compiled targets, each well under 1 MB and all committed to git: from 636,880
bytes (`aarch64-apple-darwin`) to 760,656 bytes (`x86_64-unknown-linux-musl`),
~2.65 MiB for all four combined [work-view-dist]{1}. A single-purpose, read-only query
CLI in Rust therefore lands in the low-MB range *in practice* — at or below the
~2–5 MB-per-target figure the `substrate-binary` decision assumed.

## Why the size stays small — and the headroom if needed

Rust's release profile is tunable for size without leaving the stable toolchain: the
`opt-level` `"z"` value means "optimize for binary size" [cargo-profiles]{3}, and
`strip` "direct[s] rustc to strip either symbols or debuginfo from a binary"
[cargo-profiles]{3} — symbol information that "is not needed to properly execute the
binary" [min-sized-rust]{2}. If a future tool ever pressed the per-plugin budget,
aggressive (nightly) techniques reach tens of KB — a stripped binary "reduced to 51KB"
with `build-std`, or "8KB" with careful `libstd` usage [min-sized-rust]{2} — but
work-view's ~700 KB shows the standard release + strip path is already small enough
that those extremes are unnecessary.

## Disconfirming analysis

The aggressive figures in [min-sized-rust]{2} are **not** a like-for-like comparison:
they require nightly `build-std` / `no_main` and measure a minimal program, not a full
CLI. The honest reference point for research-view is work-view's ~700 KB
[work-view-dist]{1}, not 8 KB. This position rests on the *work-view precedent*, with
the Rust-tunability sources as supporting mechanism only.

## Contradictions

None found among the three sources: the official `opt-level`/`strip` mechanics
[cargo-profiles]{3} are consistent with both the minimization catalogue
[min-sized-rust]{2} and the observed work-view sizes [work-view-dist]{1}.

## Revisit if

`research-view` is actually built and its stripped per-target size measured — then
extend this position with research-view's own numbers in place of the work-view
analogue (hence `temporal_contract: extend-on-source-rev`).

## Sources

1. work-view committed dist binaries (this repo) — `[work-view-dist]`
2. min-sized-rust — `[min-sized-rust]`
3. The Cargo Book, Profiles — `[cargo-profiles]`
