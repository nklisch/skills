---
id: feature-rename-reference-index-to-bibliography
kind: feature
stage: drafting
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
