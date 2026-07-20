---
id: feature-rename-reference-index-to-bibliography-step-4
kind: story
stage: done
tags: [refactor]
parent: feature-rename-reference-index-to-bibliography
depends_on: [feature-rename-reference-index-to-bibliography-step-1, feature-rename-reference-index-to-bibliography-step-2, feature-rename-reference-index-to-bibliography-step-3]
release_binding: null
gate_origin: null
research_origin: okf-format-assessment-against-ard-substrate
created: 2026-07-20
updated: 2026-07-20
---

# Step 4: Migration script + apply across sibling substrates (the atomic step)

**Priority**: High
**Risk**: Medium — touches ~99 on-disk files across 5 sibling repos; irreversible once committed per repo
**Source Lens**: refactor convention (the conversion-path requirement)

## Files
- NEW `plugins/agentic-research/scripts/migrate-index-to-bibliography.sh` (or `.py`)
- In-repo: `.research/reference/rust-binary-size/INDEX.md` → `BIBLIOGRAPHY.md`, `.research/reference/open-knowledge-format/INDEX.md` → `BIBLIOGRAPHY.md`

## Current State

~99 `INDEX.md` files on disk:
```
SNC/        ~70  (.research/reference/*/INDEX.md)
silas/      ~25
starmods/   ~3
skills/     1   (.research/reference/rust-binary-size/INDEX.md)  [+ open-knowledge-format/INDEX.md from the research engagement]
skills-lint-ua-fix/  1
```

## Target State

Each renamed to `BIBLIOGRAPHY.md`; file contents unchanged (entry numbers `N` + handles preserved — only the filename moves).

## Implementation Notes

- Script finds `reference/<corpus>/INDEX.md` under a given `.research/` root and renames each to `BIBLIOGRAPHY.md`. **Dry-run mode default** (prints what it would do); `--apply` to execute.
- The citation chain is structurally unaffected: `[handle]{N}` indexes into bibliography *content*, not the filename. Verify post-migration by running `lint-citations.py` against a sample brief in each repo.
- **Per-repo execution is operator-confirmed** — the script is built here, but running it against each sibling repo is a separate commit in that repo (ARD's compatibility posture: real-data migrations are planned by the agent, approved and executed by the user). For THIS repo (`skills/`), rename the two `INDEX.md` files as part of this story's commit.
- Sibling repos (`SNC`, `silas`, `starmods`, `skills-lint-ua-fix`) are migrated by running the script there in separate per-repo commits — **out of scope for this feature's implementation pass**, but the script makes them one-command follow-ups.

## Acceptance Criteria
- [ ] `scripts/migrate-index-to-bibliography.sh --dry-run` lists the expected renames
- [ ] `scripts/migrate-index-to-bibliography.sh --apply` renames `skills/` INDEX.md files; `git status` shows the rename
- [ ] `lint-citations.py` still passes against `.research/analysis/briefs/*.md` (citation chain intact)
- [ ] `research-view` still loads the substrate (the tier is directory-derived, so it finds `BIBLIOGRAPHY.md`)

## Rollback
`git mv BIBLIOGRAPHY.md INDEX.md` per file (the script is reversible until citations depend on the new name, which they do not).

## Implementation discovery

- Migration script `plugins/agentic-research/scripts/migrate-index-to-bibliography.sh` written: dry-run default, `--apply` to execute. Finds `reference/<corpus>/INDEX.md` (mindepth/maxdepth 2 under `reference/`) and renames to `BIBLIOGRAPHY.md`.
- Applied in-repo: 2 files renamed (`rust-binary-size/`, `open-knowledge-format/`). `git status` shows the renames.
- **All ACs verified:**
  - dry-run lists the 2 expected renames
  - `--apply` renamed both; `git status` shows the change
  - `lint-citations.py` still passes (2 resolved/non-broken, 0 broken — citation chain intact; `[handle]{N}` indexes into bibliography content, not the filename)
  - `research-view --tier reference` loads the substrate and finds both `BIBLIOGRAPHY` artifacts (identity falls back to file stem `BIBLIOGRAPHY.md` → `BIBLIOGRAPHY`) — confirms the loader is filename-agnostic on real on-disk files, not just in tests
- **Sibling repos (`SNC` ~70, `silas` ~25, `starmods` ~3, `skills-lint-ua-fix` 1) are out of scope** for this feature's implementation pass, per the design decision. The script makes each a one-command per-repo migration: `cd <repo> && <path>/migrate-index-to-bibliography.sh --root .research --apply`, then commit per repo. Operator-confirmed per ARD's real-data-migration posture.
