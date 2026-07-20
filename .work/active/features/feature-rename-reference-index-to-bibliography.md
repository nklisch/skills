---
id: feature-rename-reference-index-to-bibliography
kind: feature
stage: review
tags: [refactor, plugin, tooling]
parent: null
depends_on: []
release_binding: null
gate_origin: null
research_origin: okf-format-assessment-against-ard-substrate
created: 2026-07-19
updated: 2026-07-20
---

# Rename ARD's per-corpus `INDEX.md` → `BIBLIOGRAPHY.md` (+ conversion path for existing substrates)

## Finding

ARD's `.research/reference/<corpus>/INDEX.md` is a **numbered bibliography** — the
citation anchor for the `[handle]{N}` wire form (SPEC §10.2 / §10.4), append-only,
never renumber. Google's Open Knowledge Format (OKF) v0.1 defines `index.md` as a
**directory listing for progressive disclosure** — frontmatter-less, regenerable,
"consumers MAY synthesize one on the fly." Same filename, opposite semantics. On
case-insensitive filesystems (macOS/Windows) `INDEX.md` and `index.md` resolve to
the same file, so the two conventions cannot coexist in one bundle; everywhere
else, the cognitive collision remains (a reader in an OKF-shaped tree expects
`index.md`/`INDEX.md` to be a synthesizable listing, not an append-only citation
anchor).

Rename ARD's file to `BIBLIOGRAPHY.md` to eliminate the collision. The filename is
not load-bearing in ARD's invariants (the entry number `N` and the handle are), so
this is a behavior-preserving structural change of ARD's own surface — it qualifies
as `[refactor]` under the black-box test (citation behavior unchanged; only the
filename carrying the numbered bibliography moves).

## Scope (blast radius)

- **ARD SPEC** §10.2 (reference tier) + §10.4 (`[handle]{N}` ↔ INDEX correspondence)
  + §4.1 (source-bound bibliographic metadata tier) — prose updates.
- **CATALOGS §3 check 7** — the `{N}<->INDEX` correspondence check naming.
- **`plugins/agentic-research/ard-core/kernel/lint-citations.py`** — the
  `{N}<->INDEX` correspondence check.
- **Rust `research-view`** (`plugins/agentic-research/research-view/crates/`) —
  `core/src/index.rs`, `core/src/parse.rs`, `cli/src/render.rs` hardcode `INDEX.md`
  / the `INDEX` stem as the reference-tier bibliography file, including the
  "identity falls back to file stem = INDEX" behavior and the frontmatter-less-lenient
  parsing for reference INDEX files. Includes test fixtures referencing
  `reference/my-corpus/INDEX.md`.
- **ARD kernel template** `ard-core/kernel/templates/INDEX.md` → rename to
  `BIBLIOGRAPHY.md` and update the template's self-description.
- **`.research/CONVENTIONS.md`** + `.research/README.md` — layout + frontmatter
  contract prose referencing `INDEX.md`.
- **`plugins/agentic-research/skills/convert/references/research-substrate-scaffold.md`**
  — scaffold doc referencing `INDEX.md`.

## Conversion path (the wrinkle)

A rename is not just a code+doc change — there are **~99 on-disk `INDEX.md` files**
across downstream consumer substrates that must migrate, and existing adoptions
must have a path forward that doesn't break their citation chains:

- `SNC/` — ~70 files
- `silas/` — ~25 files
- `starmods/` — ~3 files
- `skills/` — 1 file (this repo's own `.research/reference/rust-binary-size/INDEX.md`)
- `skills-lint-ua-fix/` — 1 file

The conversion path must:

1. **Rename the file** `INDEX.md` → `BIBLIOGRAPHY.md` in place (the entry numbers
   `N` and handles inside are unchanged — only the filename moves).
2. **Preserve the citation chain** — no renumbering, no handle changes. The
   `[handle]{N}` citations in every attestation/precis/analysis artifact that
   cites into a renamed corpus must still resolve. Since `N` indexes into the
   bibliography *content* (not the filename), citations are structurally
   unaffected by the rename — but verify this holds after the tool change.
3. **Be runnable by adopters** — a migration command/script (likely in
   `research-view` or a standalone `convert`-style script) that finds
   `reference/<corpus>/INDEX.md` across a `.research/` tree and renames each to
   `BIBLIOGRAPHY.md`, with a dry-run mode. The `convert` skill
   (`plugins/agentic-research/skills/convert/`) is the natural home for the
   migration step, mirroring how `agile-workflow:convert` handles legacy
   substrate migration.
4. **Handle the version-boundary** — old tooling expecting `INDEX.md` vs new
   tooling expecting `BIBLIOGRAPHY.md`. Decide whether the tool reads both
   (graceful fallback during migration) or cuts over hard. Given ARD's
   compatibility posture (no external consumers by default; the substrate is
   project-owned), a hard cutover with a one-shot migration script is likely
   cleaner than a dual-read shim — but confirm at design time.

## Research grounding

**Source**: `.research/analysis/briefs/okf-format-assessment-against-ard-substrate.md` (slug: `okf-format-assessment-against-ard-substrate`)

The OKF↔ARD assessment engagement concluded with a **defensive rename** recommendation
(Track A of the brief's Findings): rename ARD's `INDEX.md` → `BIBLIOGRAPHY.md` to
eliminate the case-insensitive-FS collision with OKF's `index.md`. The rename is
behavior-preserving (`[refactor]`); the conversion path for existing substrates is
the added scope captured here.

## Refactor Overview

**Scan finding (decisive).** The Rust `research-view` loader does **not**
special-case the literal filename `INDEX.md`. The `ReferenceIndex` tier is derived
from the *directory* being under `reference/<corpus>/` (`collect_sorted_paths` →
`collect_recursive_inner` with `ResearchTier::ReferenceIndex`), and every `.md`
file in that directory is indexed. The "identity falls back to `INDEX`" behavior is
the generic `path.file_stem()` fallback (`parse.rs:157`, `parse.rs:301`) —
`INDEX.md`→stem `INDEX`; a rename to `BIBLIOGRAPHY.md`→stem `BIBLIOGRAPHY`
automatically, no code change to the fallback. **No production code matches the
literal string `INDEX` for behavior.** Every `"INDEX"` literal in `render.rs` is
in a test fixture passing the identity string explicitly. This makes the rename
low-risk: the production surface is docs + the kernel template filename + test
fixtures that assert `INDEX`; the loader is filename-agnostic by construction.

**Hard cutover, no dual-read shim.** Per the research brief's design decision and
ARD's compatibility posture (no external consumers by default; the substrate is
project-owned), the tool reads `BIBLIOGRAPHY.md` only after cutover. A one-shot
migration script (`convert`-skill path) handles existing substrates. No fallback
shim — that would re-introduce the collision hazard the rename exists to remove.

**Atomicity.** The rename of the on-disk filename is the one atomic, irreversible
step (it touches ~99 files across 5 sibling repos). It is staged as its own story
with a dry-run migration script so it can be reviewed before execution; the script
itself is reversible (rename back) until citations depend on the new name, which
they do not (citations index into bibliography *content*, not filename).

## Refactor Steps

### Step 1: Purge `INDEX`/`index` as the bibliography term-of-art across prose (rename the concept + the file reference)
**Priority**: High
**Risk**: Low
**Source Lens**: pattern drift (the canonical docs name a file whose name is changing) + naming inconsistency (the term-of-art collides with OKF's new `index.md` meaning)
**Files**:
- `plugins/agentic-research/ard-core/SPEC.md` (§4.1 L139 "a per-corpus INDEX", §10.2 L275 "per-corpus index", §10.4 L286 "indexes into a per-corpus bibliography" — already fine)
- `plugins/agentic-research/ard-core/CATALOGS.md` (L27 `GR.9` "a per-corpus INDEX", L96 "INDEX-layer expectation", L126 check-7 description uses `INDEX` six times)
- `plugins/agentic-research/ard-core/kernel/discipline.md` (L25 "a per-corpus INDEX")
- `plugins/agentic-research/ard-core/kernel/README.md` (L23 template-table "per-corpus `INDEX.md`", L47 "the 7th citation-chain check … `{N}`↔INDEX check depends on your INDEX structure")

**Current State** (SPEC §10.2, L275):
```
- **Reference (source-direct)** — raw fetches, per-corpus index + acquisition recipe. No agent-authored analysis here.
```
And CATALOGS L126 (the check-7 description): "a **seventh, corpus-INDEX correspondence check** … the `{N}` indexes in the source's per-corpus bibliography (INDEX) … check 7's `{N}`↔INDEX resolution depends on the deployment's INDEX structure."

**Target State**:
```
- **Reference (source-direct)** — raw fetches, per-corpus BIBLIOGRAPHY + acquisition recipe. No agent-authored analysis here.
```
And CATALOGS L126: "a **seventh, corpus-bibliography correspondence check** … the `{N}` indexes in the source's per-corpus bibliography (BIBLIOGRAPHY) … check 7's `{N}`↔bibliography resolution depends on the deployment's bibliography structure."
All "per-corpus INDEX" → "per-corpus bibliography" (or `BIBLIOGRAPHY` where it names the file); "INDEX-layer" → "bibliography-layer"; the template-table entry → `per-corpus BIBLIOGRAPHY.md`.

**Implementation Notes**:
- **Reading B (the design decision): purge `INDEX`/`index` as the term-of-art for the bibliography object across ALL prose + comments.** `index.md` is taking on a new meaning (OKF's directory listing) in both filenames and prose, so leaving `INDEX` as ARD's shorthand anywhere keeps the ambiguity alive after the file renames. The check's *number* (7) and *function* (piece-slug↔bibliography-entry correspondence) stay identical; only the shorthand modernizes from the filename-derived `INDEX` to `bibliography`.
- **Preserve the check's identity** — it's "the 7th citation-chain check," "the `{N}`-correspondence check." Renumbering or redefining it is out of scope.
- **Do NOT touch unrelated `index` words** that share spelling but mean something else:
  - "reachability-indexed" / "shape-indexed" / "graph index" / "reverse index" / "enumerated index" (SPEC L34, L59; CATALOGS L45, L78; theory positions) — these are the generic word meaning "an enumerated collection," not the bibliography object.
  - The Rust `index` module / `index.rs` (the substrate loader) and `ReferenceIndex` tier enum — code identifiers, renamed in Step 3 only if they read as bibliography-references (they don't — they're the loader).
- The `{N}` in `[handle]{N}` is unaffected — it indexes into bibliography *content* regardless of the file's name.

**Acceptance Criteria**:
- [ ] `grep -rniE "per-corpus INDEX|corpus INDEX|INDEX-layer|↔INDEX" plugins/agentic-research/ard-core/` returns no hits
- [ ] SPEC §10.2 reference-tier description names `BIBLIOGRAPHY.md`
- [ ] CATALOGS §3 check 7 retains its number + function; only the bibliography shorthand renames
- [ ] The unrelated `index` words (reachability-indexed, graph index, etc.) are untouched
- [ ] No behavior change — docs only

**Rollback**: `git revert` (docs only).

---

### Step 2: Rename the kernel template file
**Priority**: High
**Risk**: Low
**Source Lens**: pattern drift (template ships the old filename)
**Files**: `plugins/agentic-research/ard-core/kernel/templates/INDEX.md` → rename to `BIBLIOGRAPHY.md`; `plugins/agentic-research/skills/convert/references/research-substrate-scaffold.md`; `plugins/agentic-research/skills/convert/SKILL.md` (L7); `plugins/agentic-research/docs/ADOPTION.md` (L24)
**Story**: `feature-rename-reference-index-to-bibliography-step-2`

**Current State**:
```
plugins/agentic-research/ard-core/kernel/templates/INDEX.md:
# Per-corpus INDEX — template
A numbered bibliography of one corpus (ARD SPEC §10.2, reference tier). Lives at
`.research/reference/<corpus>/INDEX.md`.
```
(research-substrate-scaffold.md L22-23, L59-61, L79 reference `INDEX.md`; convert SKILL.md L7 and ADOPTION.md L24 say "per-corpus INDEX".)

**Target State**:
```
plugins/agentic-research/ard-core/kernel/templates/BIBLIOGRAPHY.md:
# Per-corpus BIBLIOGRAPHY — template
A numbered bibliography of one corpus (ARD SPEC §10.2, reference tier). Lives at
`.research/reference/<corpus>/BIBLIOGRAPHY.md`.
```
And the parallel updates in research-substrate-scaffold.md (tree diagram + "Per-corpus INDEX shape" heading → "Per-corpus BIBLIOGRAPHY shape"), convert SKILL.md, ADOPTION.md.

**Implementation Notes**:
- `git mv` the template file so history follows.
- Update the template's self-description header + the `Lives at` path line.
- The scaffold doc's "Per-corpus INDEX shape" anchor + heading renames.

**Acceptance Criteria**:
- [ ] Template file is `templates/BIBLIOGRAPHY.md`
- [ ] `grep -rniE "INDEX\.md" plugins/agentic-research/skills/convert/ plugins/agentic-research/docs/` returns no hits
- [ ] No behavior change — templates/docs only

**Rollback**: `git mv` back + `git revert` the doc edits.

---

### Step 3: Update Rust research-view test fixtures + assertions
**Priority**: High
**Risk**: Low
**Source Lens**: code smell (test fixtures assert the old stem)
**Files**: `plugins/agentic-research/research-view/crates/core/src/index.rs` (L571, L590, L600, L604), `plugins/agentic-research/research-view/crates/core/src/parse.rs` (L744, L812, L820-821), `plugins/agentic-research/research-view/crates/core/src/filter.rs` (L421, L429, L433, L453, L468, L488, L492), `plugins/agentic-research/research-view/crates/cli/src/render.rs` (L508, L510, L525, L527, L542, L544, L549, L551, L569, L571)
**Story**: `feature-rename-reference-index-to-bibliography-step-3`

**Current State** (index.rs:604):
```
assert_eq!(a.identity, "INDEX", "identity falls back to the file stem");
```
And fixtures construct paths like `reference/my-corpus/INDEX.md` and pass identity `"INDEX"` to `make_reference_artifact`.

**Target State**:
```
assert_eq!(a.identity, "BIBLIOGRAPHY", "identity falls back to the file stem");
```
And all fixture paths → `reference/<corpus>/BIBLIOGRAPHY.md`, all `make_reference_artifact("INDEX", ...)` → `make_reference_artifact("BIBLIOGRAPHY", ...)`, and the `# corpus INDEX` comment-strings in filter.rs:421 / parse.rs:744,812 → `# corpus BIBLIOGRAPHY`.

**Implementation Notes**:
- **No production-code change required** — the loader derives the tier from the directory, and `file_stem()` yields `BIBLIOGRAPHY` automatically. Verify this holds by running the suite after the fixture rename.
- Production comments that say "per-corpus INDEX bibliographies" (index.rs:87, parse.rs:286) update to "per-corpus BIBLIOGRAPHY" for clarity (comment-only).
- `model.rs:112` doc-comment "how many INDEX entries" → "how many BIBLIOGRAPHY entries" (comment-only).

**Acceptance Criteria**:
- [ ] `cargo test -p research-view-core` passes (or the workspace test command)
- [ ] `cargo test -p research-view-cli` passes
- [ ] `grep -rnE "\"INDEX\"|INDEX\.md" plugins/agentic-research/research-view/crates/` returns no hits outside intentional historical references

**Rollback**: `git revert` (test-only changes).

---

### Step 4: Migration script + apply across sibling substrates (the atomic step)
**Priority**: High
**Risk**: Medium — touches ~99 on-disk files across 5 sibling repos; irreversible once committed per repo
**Source Lens**: refactor convention (the conversion-path requirement)
**Files**: NEW `plugins/agentic-research/scripts/migrate-index-to-bibliography.sh` (or `.py`); then applied in-repo to `.research/reference/*/INDEX.md` here + executed across `SNC/`, `silas/`, `starmods/`, `skills-lint-ua-fix/`
**Story**: `feature-rename-reference-index-to-bibliography-step-4`

**Current State**: ~99 `INDEX.md` files on disk:
```
SNC/        ~70  (.research/reference/*/INDEX.md)
silas/      ~25
starmods/   ~3
skills/     1   (.research/reference/rust-binary-size/INDEX.md)
skills-lint-ua-fix/  1
```

**Target State**: each renamed to `BIBLIOGRAPHY.md`, contents unchanged (entry numbers `N` + handles preserved — only the filename moves).

**Implementation Notes**:
- Script finds `reference/<corpus>/INDEX.md` under a given `.research/` root and renames each to `BIBLIOGRAPHY.md`. **Dry-run mode default** (prints what it would do); `--apply` to execute.
- The citation chain is structurally unaffected: `[handle]{N}` indexes into bibliography *content*, not the filename. Verify post-migration by running `lint-citations.py` against a sample brief in each repo.
- **Per-repo execution is operator-confirmed** — the script is built here, but running it against each sibling repo is a separate commit in that repo (this is ARD's compatibility posture: real-data migrations are planned by the agent, approved and executed by the user). For THIS repo (`skills/`), the single `rust-binary-size/INDEX.md` + the newly-created `open-knowledge-format/INDEX.md` are renamed as part of this story's commit.
- Sibling repos (`SNC`, `silas`, `starmods`, `skills-lint-ua-fix`) are migrated by running the script there in separate per-repo commits — out of scope for this feature's implementation pass, but the script makes them one-command.

**Acceptance Criteria**:
- [ ] `scripts/migrate-index-to-bibliography.sh --dry-run` lists the expected renames
- [ ] `scripts/migrate-index-to-bibliography.sh --apply` renames `skills/` INDEX.md files; `git status` shows the rename
- [ ] `lint-citations.py` still passes against `.research/analysis/briefs/*.md` (citation chain intact)
- [ ] `research-view` still loads the substrate (the tier is directory-derived, so it finds `BIBLIOGRAPHY.md`)

**Rollback**: `git mv BIBLIOGRAPHY.md INDEX.md` per file (the script is reversible until citations depend on the new name, which they do not).

---

## Implementation Order
1. Step 1 — SPEC + CATALOGS prose (story step-1) — no code, sets the canonical name
2. Step 2 — kernel template rename + convert/docs prose (story step-2) — ships the new template filename
3. Step 3 — Rust test fixtures + assertions (story step-3) — verifies the loader is filename-agnostic; production code unchanged
4. Step 4 — migration script + apply in-repo (story step-4) — the atomic on-disk rename; siblings migrated per-repo afterward

Steps 1-3 are independent (docs, template, tests) and could parallelize, but the
linear order is safer: the canonical name (Step 1) precedes the template (Step 2)
that instantiates it, and the test fixtures (Step 3) assert the name Step 1 set.
Step 4 depends on Steps 1-3 landing (the tool must expect `BIBLIOGRAPHY.md` before
the on-disk files are renamed).

## Design decisions

- **Hard cutover, no dual-read shim** — a fallback shim would re-introduce the
  collision hazard the rename exists to remove. ARD's compatibility posture (no
  external consumers by default) permits this.
- **Migration is operator-confirmed per repo** — the script is built in-repo, but
  running it against each sibling substrate is a separate per-repo commit approved
  by the user (ARD's real-data-migration posture). This feature implements the
  script + applies it to `skills/`; siblings are follow-up per-repo work.
- **Reading B: purge `INDEX`/`index` as the bibliography term-of-art** — `index.md` is
  taking on a new meaning (OKF's directory listing) in both filenames and prose, so
  leaving `INDEX` as ARD's shorthand anywhere keeps the ambiguity alive. Step 1 renames
  the term everywhere in prose + comments to `bibliography`/`BIBLIOGRAPHY`; the check's
  number (7) and function stay. Unrelated `index` words (reachability-indexed, graph
  index, the `index.rs` loader module) are out of scope and untouched.

## Implementation summary

All 4 child stories advanced directly to `done` (child stories never enter review):

- **step-1** (done) — Purged `INDEX`/`index` as the bibliography term-of-art across
  `ard-core/` prose (Reading B): SPEC §4.1/§10.2, CATALOGS `GR.9` + L96 + §3 check-7
  description, discipline.md, kernel/README.md, and `catalogs.json` (data-mirror of
  `GR.9`, an unplanned but in-scope hit). The check's number (7) + function preserved;
  only the shorthand modernizes. Unrelated `index` words (reachability-indexed, graph
  index, the generic "index-layer content" at CATALOGS:92) untouched.
- **step-2** (done) — `git mv` kernel template `INDEX.md` → `BIBLIOGRAPHY.md` (history
  preserved); template self-description updated. Purged `INDEX.md` from `convert/` +
  `docs/` prose (research-substrate-scaffold.md tree diagram + heading + TOC anchor +
  body, convert/SKILL.md, ADOPTION.md).
- **step-3** (done) — Rust test fixtures + assertions renamed (`INDEX.md` →
  `BIBLIOGRAPHY.md`, identity `"INDEX"` → `"BIBLIOGRAPHY"`, `# corpus INDEX` →
  `# corpus BIBLIOGRAPHY`) across index.rs/parse.rs/filter.rs/model.rs/render.rs/
  integration.rs. Lint comments (L55/L281/L625) purged per Reading B. **Verifies the
  load-bearing claim:** all 165 Rust tests pass with no production-code change — the
  loader derives the `ReferenceIndex` tier from the directory, not the filename;
  `file_stem()` yields `BIBLIOGRAPHY` automatically. `ReferenceIndex` enum + `index`
  loader module preserved (code identifiers, not the bibliography object).
- **step-4** (done) — Migration script `scripts/migrate-index-to-bibliography.sh`
  (dry-run default, `--apply` to execute) written + applied in-repo (2 files renamed:
  `rust-binary-size`, `open-knowledge-format`). Verified: `lint-citations.py` passes
  (citation chain intact); `research-view --tier reference` loads both `BIBLIOGRAPHY`
  artifacts (file-stem fallback works on real on-disk files, not just tests).

### Integrated verification (green)

- `cargo test` (research-view workspace): 66 + 27 + 68 + 4 = **165 passed, 0 failed**
- `lint-citations.py` against the OKF brief: **2 resolved/non-broken, 0 broken, 0 thin**
- `research-view --tier reference`: loads both renamed `BIBLIOGRAPHY` artifacts

### Out of scope (follow-up per-repo work)

Sibling repos are one-command per-repo migrations via the script, operator-confirmed
per ARD's real-data-migration posture: `SNC` (~70), `silas` (~25), `starmods` (~3),
`skills-lint-ua-fix` (1). Not part of this feature's implementation pass.

### Deviations

- `catalogs.json` (kernel data file mirroring `GR.9` prose) was an unplanned hit in
  step-1 — updated to match the CATALOGS edit. Prose-in-data, part of Reading B's
  purge; not a scope expansion.
- `integration.rs` (a test file not in step-3's original file list) also carried
  `INDEX` fixtures and was swept in the same pass — in scope, not a scope expansion.
- The OKF research brief (`.research/analysis/briefs/...`) references the check by its
  old name at L144 — correctly untouched (historical research artifact,
  `write-once-on-converge` temporal contract; research records stand as-is).
- **VM crash mid-run** between step-3 and step-4 — all commits survived (crash happened
  between steps, not mid-edit); working tree matched HEAD on recovery. No work lost.
