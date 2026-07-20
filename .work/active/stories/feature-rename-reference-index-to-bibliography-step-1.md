---
id: feature-rename-reference-index-to-bibliography-step-1
kind: story
stage: done
tags: [refactor]
parent: feature-rename-reference-index-to-bibliography
depends_on: []
release_binding: null
gate_origin: null
research_origin: okf-format-assessment-against-ard-substrate
created: 2026-07-20
updated: 2026-07-20
---

# Step 1: Purge `INDEX`/`index` as the bibliography term-of-art across prose (rename the concept + the file reference)

**Priority**: High
**Risk**: Low
**Source Lens**: pattern drift (the canonical docs name a file whose name is changing) + naming inconsistency (the term-of-art collides with OKF's new `index.md` meaning)

## Files
- `plugins/agentic-research/ard-core/SPEC.md` (§4.1 L139 "a per-corpus INDEX", §10.2 L275 "per-corpus index", §10.4 L286 "indexes into a per-corpus bibliography" — already fine)
- `plugins/agentic-research/ard-core/CATALOGS.md` (L27 `GR.9` "a per-corpus INDEX", L96 "INDEX-layer expectation", L126 check-7 description uses `INDEX` six times)
- `plugins/agentic-research/ard-core/kernel/discipline.md` (L25 "a per-corpus INDEX")
- `plugins/agentic-research/ard-core/kernel/README.md` (L23 template-table "per-corpus `INDEX.md`", L47 "the 7th citation-chain check … `{N}`↔INDEX check depends on your INDEX structure")

## Current State

SPEC §10.2, L275:
```
- **Reference (source-direct)** — raw fetches, per-corpus index + acquisition recipe. No agent-authored analysis here.
```
CATALOGS L126 (the check-7 description): "a **seventh, corpus-INDEX correspondence check** … the `{N}` indexes in the source's per-corpus bibliography (INDEX) … check 7's `{N}`↔INDEX resolution depends on the deployment's INDEX structure."
And: SPEC §4.1 L139 / CATALOGS L27 `GR.9` / discipline.md L25 each say "a per-corpus INDEX or `{N}`-bibliography entry"; CATALOGS L96 "INDEX-layer expectation"; kernel/README.md L23 template-table lists `per-corpus INDEX.md`, L47 "the 7th check … `{N}`↔INDEX check depends on your INDEX structure."

## Target State

SPEC §10.2, L275:
```
- **Reference (source-direct)** — raw fetches, per-corpus BIBLIOGRAPHY + acquisition recipe. No agent-authored analysis here.
```
CATALOGS L126: "a **seventh, corpus-bibliography correspondence check** … the `{N}` indexes in the source's per-corpus bibliography (BIBLIOGRAPHY) … check 7's `{N}`↔bibliography resolution depends on the deployment's bibliography structure."
All "per-corpus INDEX" → "per-corpus bibliography" (or `BIBLIOGRAPHY` where it names the file); "INDEX-layer" → "bibliography-layer"; the template-table entry → `per-corpus BIBLIOGRAPHY.md`.

## Implementation Notes

- **Reading B (the design decision): purge `INDEX`/`index` as the term-of-art for the bibliography object across ALL prose + comments.** `index.md` is taking on a new meaning (OKF's directory listing) in both filenames and prose, so leaving `INDEX` as ARD's shorthand anywhere keeps the ambiguity alive after the file renames. The check's *number* (7) and *function* (piece-slug↔bibliography-entry correspondence) stay identical; only the shorthand modernizes from the filename-derived `INDEX` to `bibliography`.
- **Preserve the check's identity** — it's "the 7th citation-chain check," "the `{N}`-correspondence check." Renumbering or redefining it is out of scope.
- **Do NOT touch unrelated `index` words** that share spelling but mean something else:
  - "reachability-indexed" / "shape-indexed" / "graph index" / "reverse index" / "enumerated index" (SPEC L34, L59; CATALOGS L45, L78; theory positions) — these are the generic word meaning "an enumerated collection," not the bibliography object.
  - The Rust `index` module / `index.rs` (the substrate loader) and `ReferenceIndex` tier enum — code identifiers, out of scope here (Step 3 handles Rust).
- The `{N}` in `[handle]{N}` is unaffected — it indexes into bibliography *content* regardless of the file's name.

## Acceptance Criteria
- [ ] `grep -rniE "per-corpus INDEX|corpus INDEX|INDEX-layer|↔INDEX" plugins/agentic-research/ard-core/` returns no hits
- [ ] SPEC §10.2 reference-tier description names `BIBLIOGRAPHY.md`
- [ ] CATALOGS §3 check 7 retains its number + function; only the bibliography shorthand renames
- [ ] The unrelated `index` words (reachability-indexed, graph index, etc.) are untouched
- [ ] No behavior change — docs only

## Rollback
`git revert` (docs only).

## Implementation discovery

- **`catalogs.json` (kernel data file) was an unplanned but in-scope hit** — it mirrors the CATALOGS `GR.9` row's prose verbatim, including "a per-corpus INDEX." Updated to match the CATALOGS edit ("a per-corpus bibliography (BIBLIOGRAPHY.md)"). JSON re-validated. This is prose-in-data, part of Reading B's purge; not a scope expansion.
- **CATALOGS.md:92 "Commitable index-layer content" is the generic word** (file-tree manifest, symbol inventory = an enumerated collection), NOT the bibliography object. Correctly left untouched per the unrelated-word carve-out.
- All acceptance criteria verified: bibliography-term `INDEX` purged from `ard-core/` prose (only `templates/INDEX.md` remains, which is Step 2's file-rename scope); SPEC §10.2 names `BIBLIOGRAPHY.md`; CATALOGS §3 check 7 retains number + function; 8 unrelated `index` words (reachability-indexed, etc.) preserved; no behavior change.
