---
id: gate-tests-tmpdir-root-isolation
kind: story
stage: implementing
tags: [testing]
parent: null
depends_on: []
release_binding: 0.9.0
gate_origin: tests
created: 2026-05-31
updated: 2026-05-31
---

# Harden find_root_returns_none_when_absent to be invariant to $TMPDIR placement (test-integrity)

## Priority
Low (test-integrity)

## Spec reference
Item: `epic-substrate-board-host-feed` (shared `find_substrate_root` used by the
bundle's server/feed)
Acceptance criterion: feed/server correctness relies on `find_substrate_root`
returning None when no `.work/` ancestor exists.

## Gap type
test-integrity (environment coupling)

## Detail
`core/src/index.rs` `find_root_returns_none_when_absent` creates a `TempDir` and
asserts no substrate root is found. When `$TMPDIR` resolves *inside* a substrate
tree (e.g. a repo-local `.tmp` dir), the tempdir has the repo's own `.work/` as
an ancestor, so `find_substrate_root` correctly walks up and finds it — and the
test FAILS. The suite's green/red therefore depends on where `$TMPDIR` points.
Not a product bug (`find_substrate_root` is correct) but the test should isolate
itself so it can't be perturbed by `$TMPDIR`.

## Suggested test
Harden the existing test: create the tempdir under an explicitly substrate-free
root (canonicalize and assert no `.work/` ancestor), or constrain the walk
ceiling, so the assertion is invariant to `$TMPDIR`.

## Test location (suggested)
`plugins/agile-workflow/work-view/crates/core/src/index.rs` (existing test)
