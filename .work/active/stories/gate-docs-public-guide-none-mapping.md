---
id: gate-docs-public-guide-none-mapping
kind: story
stage: review
tags: [documentation]
parent: null
depends_on: []
release_binding: 0.9.5
gate_origin: docs
created: 2026-06-01
updated: 2026-06-01
---

# Document none release mapping in public guide

## Drift category
foundation-doc-assertion

## Location
- Doc: `docs/agile-workflow-guide.md:413`
- Code: `.work/CONVENTIONS.md:3`

## Current doc text
Release shipping maps to `tag-based`, `branch-held`, or `release-branch`.

## Reality
The SPEC allows `none`, and this repo's active release uses `none` with
publishing delegated to `scripts/bump-version.sh`.

## Required edit
Add `none` as a supported mapping and describe it as gate/archive-only with no
tag or branch shipping.

## Implementation notes
- Files changed: `docs/agile-workflow-guide.md`
- Tests added: none; documentation-only change.
- Discrepancies from design: none.
- Adjacent issues parked: none.
