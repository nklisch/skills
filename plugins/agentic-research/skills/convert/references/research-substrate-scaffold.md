# `.research/` substrate scaffold — bootstrap + sync

What `convert` writes when bootstrapping a fresh `.research/`, and what it validates when one
already exists. Bootstrap is **additive** (write what's missing); sync is **validate + report
drift** (never overwrite authored substrate). Preserve-only is the default in both modes.

## Contents

- [Top-level layout](#top-level-layout)
- [CONVENTIONS.md section skeleton](#conventionsmd-section-skeleton)
- [Per-corpus BIBLIOGRAPHY shape](#per-corpus-bibliography-shape)
- [Bootstrap mode (no `.research/`)](#bootstrap-mode-no-research)
- [Sync mode (`.research/` exists)](#sync-mode-research-exists)

## Top-level layout

```
.research/
├── CONVENTIONS.md          # the working contract (sections below)
├── README.md               # human orientation + gitignored-raws fetch recipe
├── references.md           # append-only bibliography ([handle]{N} resolves here)
├── reference/              # source-direct: raw fetches (gitignored) + per-corpus BIBLIOGRAPHY.md
│   └── <corpus>/BIBLIOGRAPHY.md
├── attestation/            # flat per-source-handle attestation files (<handle>.md)
├── precis/                 # source-coherent unit aggregations authored from raw
├── analysis/               # cross-source analytical work
│   ├── briefs/             # standalone single-pass briefs
│   ├── campaigns/          # multi-specialist / program bundles
│   ├── positions/          # settled positions
│   └── hypothesis/         # working hypotheses + ledgers
└── .import-holding/        # NON-authoritative quarantine for convert imports (see mapping ref)
```

The `.import-holding/` tier is convert-specific and **outside the authoritative-tier contract** —
it holds pre-uplift legacy syntheses and is excluded from the authoritative lint surface. Bootstrap
creates it only when an import run needs it.

## CONVENTIONS.md section skeleton

Bootstrap writes a `CONVENTIONS.md` carrying these sections (mirror the canonical shape; an
adopter edits the prose to their corpus):

- **Layout** — the tier map above, with one-line per-tier purpose.
- **Frontmatter contracts** — the required fields per artifact kind. **`provenance:` is required**
  on attestation / precis / position artifacts, with a value from the `provenance_values` enum
  (`source-direct`, `agent-authored-from-raw`, `agent-synthesis`, `generated-listing`,
  `hybrid-curated`). (This is the contract convert must NOT violate on import — see the mapping
  reference's holding-area rule.)
- **Citation rule** — `[handle]{N}` resolves by number against `references.md`; chain is brief
  claim → attestation → fetched source (lint enforces it).
- **Typed cross-references** *(optional)* — `related:` `to:` typed edges between artifacts.
- **Lifecycle** — `status` + `temporal_contract`, corrections-vs-reversals; **no draft→review→done
  stages** (research artifacts are not work items).
- **Authoring & enforcement** — `lint-citations.py` as the citation-chain gate; the discipline
  bundle.
- **Invariants** — the non-erodable anti-fabrication floor + the one-way `.research/`→`.work/`
  direction.

## Per-corpus BIBLIOGRAPHY shape

Each `reference/<corpus>/BIBLIOGRAPHY.md` carries a header + one row per piece (handle, title/source,
fetched date, `Themes:` line for the tag vocabulary). On first ingest into a corpus, bootstrap
scaffolds the BIBLIOGRAPHY header; subsequent imports append rows.

## Bootstrap mode (no `.research/`)

Triggered when `.research/` is absent. Writes the layout above + a `CONVENTIONS.md` from the
skeleton + a `README.md` (orientation + the gitignored-raws fetch recipe) + an empty
`references.md`. Tier dirs are created on demand (an empty tier needs no `.gitkeep` unless the
adopter tracks empty dirs). **Additive only** — bootstrap never runs when `.research/` already
exists (that routes to sync).

## Sync mode (`.research/` exists)

Triggered when `.research/` is present. Convert **validates + reports**, never overwrites authored
substrate:

- **Validate** — the top-level tier dirs exist; `CONVENTIONS.md` carries the required section
  skeleton; per-corpus `BIBLIOGRAPHY.md` rows correspond to `reference/<corpus>/` contents; the citation
  surface passes `lint-citations.py` (delegated, not re-implemented).
- **Refresh vs user-owned** — convert MAY *add* a missing tier dir or a missing scaffold file. It
  MAY NOT rewrite authored substrate (attestations, precis, analysis, or CONVENTIONS prose the
  adopter edited). A CONVENTIONS section that drifted from the canonical skeleton is **reported as
  drift for operator action**, never silently rewritten.
- **Legacy discovery still runs** — a repo can have a `.research/` *and* un-imported foreign
  research elsewhere. Sync validates the existing substrate AND offers the discovery sweep over the
  rest of the repo (operator-confirmed). The two are independent passes.
- **Clean no-op** — when the substrate is conformant and no foreign research is found, sync reports
  "in sync, nothing to import" and writes nothing. Re-running convert on a healthy repo is a no-op
  (idempotent).
