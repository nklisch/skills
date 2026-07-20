---
id: feature-rename-reference-index-to-bibliography-step-1
kind: story
stage: implementing
tags: [refactor]
parent: feature-rename-reference-index-to-bibliography
depends_on: []
release_binding: null
gate_origin: null
research_origin: okf-format-assessment-against-ard-substrate
created: 2026-07-20
updated: 2026-07-20
---

# Step 1: Update ARD SPEC + CATALOGS prose (rename the concept)

**Priority**: High
**Risk**: Low
**Source Lens**: pattern drift (the canonical docs name a file whose name is changing)

## Files
- `plugins/agentic-research/ard-core/SPEC.md` (§4.1 L139, §10.2 L275)
- `plugins/agentic-research/ard-core/CATALOGS.md` (L27 `GR.9`)
- `plugins/agentic-research/ard-core/kernel/discipline.md` (L25)
- `plugins/agentic-research/ard-core/kernel/README.md` (L23)

## Current State

SPEC §10.2, L275:
```
- **Reference (source-direct)** — raw fetches, per-corpus index + acquisition recipe. No agent-authored analysis here.
```
SPEC §4.1 L139, CATALOGS L27 (`GR.9`), discipline.md L25 each say "a per-corpus INDEX or `{N}`-bibliography entry"; kernel/README.md L23 lists `per-corpus INDEX.md` in the templates table.

## Target State

SPEC §10.2, L275:
```
- **Reference (source-direct)** — raw fetches, per-corpus BIBLIOGRAPHY + acquisition recipe. No agent-authored analysis here.
```
And the parallel prose updates in §4.1, CATALOGS `GR.9`, discipline.md, kernel/README.md — each "per-corpus INDEX" → "per-corpus BIBLIOGRAPHY", and the template-table entry → `per-corpus BIBLIOGRAPHY.md`.

## Implementation Notes

- Prose-only. The *concept* (numbered bibliography, the `{N}` citation anchor, append-only) is unchanged — only the filename referring to it.
- Keep the `INDEX`↔`{N}` correspondence *check* name (CATALOGS §3 check 7) as-is in this step; Step 2 renames the check's implementation reference. The check is a CATALOGS concept, not a filename.
- `git grep -rniE "per-corpus INDEX|corpus INDEX" plugins/agentic-research/ard-core/` to find every hit.

## Acceptance Criteria
- [ ] `grep -rniE "per-corpus INDEX|corpus INDEX" plugins/agentic-research/ard-core/` returns no hits (all → BIBLIOGRAPHY)
- [ ] SPEC §10.2 reference-tier description names `BIBLIOGRAPHY.md`
- [ ] No behavior change — docs only

## Rollback
`git revert` (docs only).
