---
id: gate-docs-changelog-0-9-5
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

# Add changelog entry for 0.9.5

## Drift category
changelog-gap

## Location
- Doc: `plugins/agile-workflow/CHANGELOG.md:3`

## Current doc text
Top entry is `## v0.9.0`.

## Reality
Release `0.9.5` has bound items but no `## v0.9.5` changelog entry.

## Required edit
Prepend a `## v0.9.5` entry summarizing three-channel distribution, the Pi
extension, board browsing/canvas changes, tests, fixes, and audit work.

## Implementation notes
- Files changed: `plugins/agile-workflow/CHANGELOG.md`
- Tests added: none; documentation-only change.
- Discrepancies from design: none.
- Adjacent issues parked: none.
