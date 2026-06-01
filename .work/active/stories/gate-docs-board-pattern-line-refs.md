---
id: gate-docs-board-pattern-line-refs
kind: story
stage: done
tags: [documentation]
parent: null
depends_on: []
release_binding: 0.9.5
gate_origin: docs
created: 2026-06-01
updated: 2026-06-01
---

# Refresh board pattern line references

## Drift category
pattern-skill-staleness

## Location
- Doc: `.agents/skills/patterns/board-view-module-contract.md:71`
- Code: `plugins/agile-workflow/work-view/crates/cli/src/board/assets/dependency.js:1166`

## Current doc text
The pattern skill says `dependencyView` is at `dependency.js:416`; related
text-element references are also stale.

## Reality
The dependency canvas work moved `dependencyView` and several helper examples.

## Required edit
Refresh pattern skill file:line references against the current board assets; do
not add historical notes.

## Implementation notes
- Files changed: `.agents/skills/patterns/board-view-module-contract.md`, `.agents/skills/patterns/dom-text-element-builder.md`
- Tests added: none; pattern-doc reference refresh.
- Discrepancies from design: the new patterns gate also updated `.agents/skills/patterns/SKILL.md` and `.agents/rules/patterns.md`.
- Adjacent issues parked: none.
