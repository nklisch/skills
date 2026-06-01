---
id: gate-docs-agile-workflow-vision-current-state
kind: story
stage: implementing
tags: [documentation]
parent: null
depends_on: []
release_binding: 0.9.5
gate_origin: docs
created: 2026-06-01
updated: 2026-06-01
---

# Refresh agile-workflow VISION success state

## Drift category
foundation-doc-assertion

## Location
- Doc: `plugins/agile-workflow/docs/VISION.md:65`
- Code: `plugins/agile-workflow/skills/board/SKILL.md:1`

## Current doc text
The success section is titled "What success looks like for v0.1.0" and says
"25 skills".

## Reality
The plugin is at `0.9.5`, includes newer surfaces such as `board`, `bug-scan`,
and `perf-scout`, and has 28 `SKILL.md` files.

## Required edit
Replace the v0.1.0 success section with the current intended success/state of
agile-workflow, including the current skill surface.
