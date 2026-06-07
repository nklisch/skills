---
id: gate-patterns-premerge-2026-06-04
kind: story
stage: done
tags: [patterns]
parent: null
depends_on: []
release_binding: null
gate_origin: patterns
created: 2026-06-04
updated: 2026-06-04
---

# Patterns extracted (pre-merge standalone pass)

## New patterns codified
- `hand-rolled-peekable-flag-parser` — dependency-free `parse_args` over a
  `peekable()` iterator with a `flags_done` terminator and a shared `next_value`
  peek-reject-on-leading-dash helper; returns an `Outcome` enum, never
  `process::exit`s. 3 occurrences across 2 crates (work-view main parser +
  work-view board parser + research-view parser — the bundle's research-view
  `args.rs` is the revealing 3rd instance crossing the crate boundary).

## Inconsistencies flagged
None. research-view conforms cleanly to every documented pattern it mirrors
(`substrate-borrowing-query`, `manual-error-display`, `subprocess-cli-harness`,
`cargo-manifest-fixture-root`, `substrate-test-fixture-builder`,
`test-item-builders`).

## Rejected candidates (2 instances = coincidence, not a pattern)
tier-dispatch byte-sort loader; `Match{Any,Equals,IsNull}` three-state filter
enum; `nullable_match` CLI→Match mapper; strict-`parse` + `lenient` two-constructor
pair; CLI exit-code pipeline `main`. Re-evaluate if a 3rd substrate binary lands.

## Pattern files written
- `.agents/skills/patterns/hand-rolled-peekable-flag-parser.md`
- `.agents/skills/patterns/SKILL.md` (index updated)
- `.agents/rules/patterns.md` (generated digest regenerated; src-sha256 recomputed)
