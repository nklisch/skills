---
id: gate-docs-agile-workflow-spec-version-example
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

# Refresh agile-workflow SPEC manifest example

## Drift category
foundation-doc-assertion

## Location
- Doc: `plugins/agile-workflow/docs/SPEC.md:14`
- Code: `plugins/agile-workflow/.claude-plugin/plugin.json:4`

## Current doc text
The manifest example says `"version": "0.1.0"`.

## Reality
Claude, Codex, Pi package metadata, and the `work-view` source stamp now report
`0.9.5`.

## Required edit
Roll the manifest example forward to the current manifest shape/version or use
a clearly active placeholder instead of a stale concrete version.

## Implementation notes
- Files changed: `plugins/agile-workflow/docs/SPEC.md`
- Tests added: none; documentation-only change.
- Discrepancies from design: none.
- Adjacent issues parked: none.
