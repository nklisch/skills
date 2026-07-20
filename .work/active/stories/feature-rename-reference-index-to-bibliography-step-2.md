---
id: feature-rename-reference-index-to-bibliography-step-2
kind: story
stage: implementing
tags: [refactor]
parent: feature-rename-reference-index-to-bibliography
depends_on: [feature-rename-reference-index-to-bibliography-step-1]
release_binding: null
gate_origin: null
research_origin: okf-format-assessment-against-ard-substrate
created: 2026-07-20
updated: 2026-07-20
---

# Step 2: Rename the kernel template file

**Priority**: High
**Risk**: Low
**Source Lens**: pattern drift (template ships the old filename)

## Files
- `plugins/agentic-research/ard-core/kernel/templates/INDEX.md` → rename to `BIBLIOGRAPHY.md`
- `plugins/agentic-research/skills/convert/references/research-substrate-scaffold.md`
- `plugins/agentic-research/skills/convert/SKILL.md` (L7)
- `plugins/agentic-research/docs/ADOPTION.md` (L24)

## Current State

```
plugins/agentic-research/ard-core/kernel/templates/INDEX.md:
# Per-corpus INDEX — template
A numbered bibliography of one corpus (ARD SPEC §10.2, reference tier). Lives at
`.research/reference/<corpus>/INDEX.md`.
```
`research-substrate-scaffold.md` (L22-23 tree diagram, L59-61 "Per-corpus INDEX shape" heading + body, L79) reference `INDEX.md`; `convert/SKILL.md` L7 and `ADOPTION.md` L24 say "per-corpus INDEX".

## Target State

```
plugins/agentic-research/ard-core/kernel/templates/BIBLIOGRAPHY.md:
# Per-corpus BIBLIOGRAPHY — template
A numbered bibliography of one corpus (ARD SPEC §10.2, reference tier). Lives at
`.research/reference/<corpus>/BIBLIOGRAPHY.md`.
```
And the parallel updates in `research-substrate-scaffold.md` (tree diagram + "Per-corpus INDEX shape" heading → "Per-corpus BIBLIOGRAPHY shape"), `convert/SKILL.md`, `ADOPTION.md`.

## Implementation Notes

- `git mv` the template file so history follows.
- Update the template's self-description header + the `Lives at` path line.
- The scaffold doc's "Per-corpus INDEX shape" anchor + heading renames — update the anchor target too if any internal link points to it.

## Acceptance Criteria
- [ ] Template file is `templates/BIBLIOGRAPHY.md`
- [ ] `grep -rniE "INDEX\.md" plugins/agentic-research/skills/convert/ plugins/agentic-research/docs/` returns no hits
- [ ] No behavior change — templates/docs only

## Rollback
`git mv` back + `git revert` the doc edits.
