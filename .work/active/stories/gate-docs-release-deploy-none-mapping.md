---
id: gate-docs-release-deploy-none-mapping
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

# Update release-deploy skill for none mapping

## Drift category
repo-skill-staleness

## Location
- Doc: `plugins/agile-workflow/skills/release-deploy/SKILL.md:38`
- Code: `.work/CONVENTIONS.md:3`

## Current doc text
If release mapping is `none`, halt because the project does not ship versioned
releases.

## Reality
This repo uses release mapping `none`; `release-deploy` still runs gates and
archives while publishing remains with `scripts/bump-version.sh`.

## Required edit
Update the skill contract so `none` means a gate/archive-only release flow with
no tag or branch shipping, and state that publishing/version bumping is
external.
