---
id: idea-convert-managed-summary-scan-origin
kind: story
stage: backlog
tags: [docs, tooling]
parent: null
depends_on: []
release_binding: null
gate_origin: null
created: 2026-07-06
updated: 2026-07-07
---

# convert's managed AGENTS/frontmatter summaries omit scan_origin

## Source

Surfaced in the 2026-07-06 deep review of `feature-scan-aware-substrate`. Important
(not blocking).

## Problem

The canonical SPEC frontmatter table (`docs/SPEC.md`) correctly includes
`scan_origin` as a first-class linkage field, but the managed AGENTS.md section
examples/templates in `convert/SKILL.md` (the slim field list, ~line 486 and
~533) still list only the older field set. This means `convert --update` can
regenerate project instructions that do not mention `scan_origin` — a field
introduced as first-class by `feature-scan-aware-substrate`. A project running
convert after the scan-aware rollout would have drift between its managed
instructions and the actual substrate schema.

## Fix direction

Add `scan_origin` to the plugin-owned slim field list in `convert/SKILL.md`, or
add a clear conditional scan-aware extension parallel to the existing research
conditional (so convert emits scan_origin guidance when the field is relevant).

## Acceptance criteria

- [ ] `convert --update` regenerates managed AGENTS instructions that include
      `scan_origin` in the field set (or a conditional scan-aware extension)
- [ ] No drift between SPEC's frontmatter table and convert's managed summary
