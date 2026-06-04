---
id: gate-docs-pattern-skill-line-refs
kind: story
stage: implementing
tags: [documentation]
parent: null
depends_on: []
release_binding: null
gate_origin: docs
created: 2026-06-04
updated: 2026-06-04
---

# Pattern-skill file:line cites stale after work-view research-field additions

## Drift category
pattern-skill-staleness (High)

## Reality
The handoff-live-fields work added `research`/`research_refs` to work-view's
`Filter` struct and `research_refs`/`research_origin` to `Item`, plus new test
fns — shifting line numbers cited in three pattern skills. Verify each cite
against the current code before editing (line numbers drift further if the files
change again).

## Required edits (roll forward in place)
- `.agents/skills/patterns/substrate-borrowing-query.md:20` — `filter.rs:73` → **`filter.rs:77`** (`pub fn query`).
- `.agents/skills/patterns/substrate-test-fixture-builder.md:39` — `filter.rs:124` → **`filter.rs:136`** (`setup_substrate`).
- `.agents/skills/patterns/test-item-builders.md:32` — `filter.rs:143` → **`filter.rs:155`** (`full_item`).
- `.agents/skills/patterns/test-item-builders.md:60` — `model.rs:128` → **`model.rs:133`** (`make_item`).

The other cites in these skills (`actionable.rs:92`, `render.rs:149`,
`actionable.rs:108/149`) still resolve — leave them. The generated
`.agents/rules/patterns.md` digest has NO file:line refs, so it does not drift.

## Note
Confirm exact current line numbers with `grep -n` at implement time, since the
work-view files may shift again before this lands.
