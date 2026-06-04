---
id: idea-gate-cruft-clippy-needless-borrow
created: 2026-06-04
tags: [cleanup]
---

gate-cruft (pre-merge, 2026-06-04) Low: one clippy `needless_borrows_for_generic_args`
on a test line — `index.rs:549` in research-view-core passes `&attestation_fm("good-src")`
to `fs::write` where the owned value suffices. Drop the leading `&`. Test-only,
single character, no behavior change. (The only other Low finding — `collect_recursive`
as a single-use existence-guard wrapper around `collect_recursive_inner` — was verified
INTENTIONAL: it mirrors `collect_flat`'s guard-then-walk signature and stops being
single-use the moment a second recursive tier is added; not filed.) The cruft scan
otherwise found the ~25-file bundle clean — zero tool-detected dead code, no stale
shims, no gamed tests.
