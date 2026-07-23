---
id: feature-rename-reference-index-to-bibliography-step-3
kind: story
stage: done
tags: [refactor]
parent: feature-rename-reference-index-to-bibliography
depends_on: [feature-rename-reference-index-to-bibliography-step-2]
release_binding: null
gate_origin: null
research_origin: okf-format-assessment-against-ard-substrate
created: 2026-07-20
updated: 2026-07-20
---

# Step 3: Update Rust research-view test fixtures + assertions

**Priority**: High
**Risk**: Low
**Source Lens**: code smell (test fixtures assert the old stem)

## Files
- `plugins/agentic-research/research-view/crates/core/src/index.rs` (L571, L590, L600, L604; comments L87, L574, L579, L588, L591)
- `plugins/agentic-research/research-view/crates/core/src/parse.rs` (L744, L812, L820-821; comments L286, L740)
- `plugins/agentic-research/research-view/crates/core/src/filter.rs` (L421, L429, L433, L453, L468, L488, L492)
- `plugins/agentic-research/research-view/crates/cli/src/render.rs` (L508, L510, L525, L527, L542, L544, L549, L551, L569, L571)
- `plugins/agentic-research/research-view/crates/core/src/model.rs` (L112 doc-comment)

## Current State

index.rs:604:
```rust
assert_eq!(a.identity, "INDEX", "identity falls back to the file stem");
```
Fixtures construct paths like `reference/my-corpus/INDEX.md` and pass identity `"INDEX"` to `make_reference_artifact`. filter.rs:421 / parse.rs:744,812 have `# corpus INDEX` comment-strings.

## Target State

index.rs:604:
```rust
assert_eq!(a.identity, "BIBLIOGRAPHY", "identity falls back to the file stem");
```
All fixture paths → `reference/<corpus>/BIBLIOGRAPHY.md`; all `make_reference_artifact("INDEX", ...)` → `make_reference_artifact("BIBLIOGRAPHY", ...)`; `# corpus INDEX` → `# corpus BIBLIOGRAPHY`.

## Implementation Notes

- **No production-code change required** — the loader derives the `ReferenceIndex` tier from the *directory* being under `reference/<corpus>/` (`collect_sorted_paths` → `collect_recursive_inner`), not the filename. `path.file_stem()` (parse.rs:157, parse.rs:301) yields `BIBLIOGRAPHY` automatically. **Verify this holds** by running the suite after the fixture rename — if any test fails, it means production code *does* match the literal (a finding to report, not a code change to make speculatively).
- Production comments that say "per-corpus INDEX bibliographies" (index.rs:87, parse.rs:286) update to "per-corpus BIBLIOGRAPHY" for clarity (comment-only).
- `model.rs:112` doc-comment "how many INDEX entries" → "how many BIBLIOGRAPHY entries" (comment-only).
- **Lint comments (Reading B prose purge)** — `lint-citations.py` uses `INDEX` as the bibliography shorthand in three comments: L55 "{N}<->INDEX correspondence … needs the deployment's INDEX structure", L281 "like the {N}<->INDEX check", L625 "the 7th INDEX check". These are prose (comments), part of the Step 1 term-of-art purge — rename to `bibliography`/`BIBLIOGRAPHY`: "{N}<->bibliography correspondence … needs the deployment's bibliography structure", "like the {N}<->bibliography check", "the 7th bibliography-correspondence check". No behavior change — the lint does not implement check 7 (it's deployment-mapped). Placed in Step 3 because this story already owns the `INDEX`→`BIBLIOGRAPHY` sweep across the Rust + lint surface.

## Acceptance Criteria
- [ ] `cargo test -p research-view-core` passes (or the workspace test command)
- [ ] `cargo test -p research-view-cli` passes
- [ ] `grep -rnE "\"INDEX\"|INDEX\.md" plugins/agentic-research/research-view/crates/` returns no hits outside intentional historical references
- [ ] `grep -rnE "INDEX" plugins/agentic-research/ard-core/kernel/lint-citations.py` returns no hits (comments purged per Reading B)
- [ ] **If any production code matched the literal `INDEX` (it should not, per scan), report it as a finding rather than silently changing behavior**

## Rollback
`git revert` (test-only changes).

## Implementation discovery

- **The load-bearing claim is verified:** all 165 Rust tests pass after renaming every fixture `INDEX.md` → `BIBLIOGRAPHY.md` and every identity `"INDEX"` → `"BIBLIOGRAPHY"`. The loader derives the `ReferenceIndex` tier from the *directory* (`reference/<corpus>/`), not the filename; `path.file_stem()` yields `BIBLIOGRAPHY` automatically. **No production code changed** — only test fixtures and comments. This confirms the refactor-design scan finding.
- `ReferenceIndex` enum (model.rs:25) and the `index` module/loader are code identifiers for the loader, not the bibliography object — correctly preserved (case-sensitive sed left `ReferenceIndex` and `index` untouched; only standalone `INDEX` replaced).
- `integration.rs` (a test file not in the original step-3 file list) also carried `INDEX` fixtures and was swept in the same pass — in scope, not a scope expansion.
- Lint comments (L55, L281, L625) purged per Reading B: `{N}<->INDEX` → `{N}<->bibliography`, "the 7th INDEX check" → "the 7th bibliography-correspondence check." Lint re-run is clean (2 resolved/non-broken, 0 broken, 0 thin — unchanged).
- **Out of scope (correctly untouched):** the OKF research brief (`.research/analysis/briefs/okf-format-assessment-against-ard-substrate.md` L144) references "the `{N}<->INDEX` correspondence check" by its old name. This is a historical research artifact with a `write-once-on-converge` temporal contract — research records stand as-is; the refactor updates the going-forward canonical term in SPEC/CATALOGS, not retroactively in research artifacts.
