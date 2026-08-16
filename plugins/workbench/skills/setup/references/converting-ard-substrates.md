# Converting agentic-research (ARD) Substrates

The research-side mapping for bringing a legacy `agentic-research` substrate
into Workbench alignment. Read this completely before writing; the generic
rules in [migration-rules.md](migration-rules.md) still apply. The reference
execution of this mapping is the skills/ migration of 2026-07-27 (50
attestations restructured, 10 briefs converted, every citation remapped).

Conversion mixes mechanical steps with real editorial judgment. The mapping
below marks which is which. The mechanical steps (handle resolution,
citation rewrite, frontmatter restriction) are repeatable; the judgment
steps (deriving attested details, folding precis, disposing of campaign
artifacts) are evidentiary decisions a user reviews per artifact.

## Detection

A `.research/` substrate is ARD-owned when any of these hold:

- `.research/CONVENTIONS.md` declares `owner: agentic-research`;
- the four-tier layout exists: `reference/`, `attestation/`, `precis/`,
  `analysis/` under `.research/`;
- per-corpus `BIBLIOGRAPHY.md` files exist and `[handle]{N}` citations
  resolve against their entries.

The agentic-research plugin being installed is corroborating, not decisive.

`reference/` content must itself be classified before mapping. Curated corpus
manifests — per-corpus INDEX or BIBLIOGRAPHY files, READMEs, licensing notes,
fetch recipes — are a curated source collection, not evidence. When the
repository's product is the corpus, map the collection to a peer collection
root (canonical-layout.md § Collection roots) instead of forcing corpus
entries into attestations: an attestation is agent warrant over what an
engagement actually fetched, while a manifest describes an acquired source.
The citation lookup table still runs through the manifests during remap.

If a substrate carries both a root `references.md` and per-corpus
`BIBLIOGRAPHY.md` files that disagree about what an `{N}` target means (a
known ARD drift), **stop** and resolve the ambiguity with the user before
rewriting anything. The handle table below cannot be built on a contradiction.

## The semantic core

ARD bibliography entries and Workbench attestations describe the same
sources, so the anchor move is mechanical: from "entry N in a per-corpus
bibliography" to "the attestation of that entry's source." The two citation
types carry the granularity:

- `[handle]{source}` — bibliographic reference: the source record warrants the claim.
- `[handle]{N}` — detail reference: attested detail N warrants the claim.

Granularity honesty governs the remap: when no specific attested detail
supports the claim, downgrade to a bibliographic reference rather than
inventing detail-level support.

## Migration manifest

Record a typed manifest before writing anything, and keep it through
verification: for every source artifact — its path, its disposition
(retain / fold / remove / split), every old-to-new citation target, and a
confidence mark (mechanical / judgment). Ambiguous remaps (those marked
judgment) get a semantic review each, not a sample spot-check. The manifest
is the audit trail for a real-data migration.

## Tier mapping

| ARD source | Workbench destination | Nature |
|---|---|---|
| `attestation/<handle>.md` | `attestations/<handle>.md` — keep required frontmatter (`source_handle`, `fetched`, `source_title`, `source_url` when a real URL exists); extra ARD keys (`provenance`, `source_class`, and similar) may stay as optional extras; ensure a numbered `## Attested details` list derived from the attestation's key passages, preserving text and order | mechanical for the move and frontmatter; **judgment** for deriving attested details |
| `precis/<handle>.md` (single-source-faithful) | Fold into the attestation's summary after verification; remove the precis file | judgment |
| `precis/<handle>.md` (composed or multi-source) | Promote to a `briefs/<id>.md` — composed precis content is synthesis, not a source-faithful summary | judgment |
| `analysis/briefs/`, `analysis/positions/` | `briefs/<id>.md` — genuine synthesis becomes briefs under the discipline's brief-structure frontmatter contract | mechanical |
| `analysis/campaigns/**` | Sort per artifact: durable specialist syntheses, contradiction records, and verification checklists become linked `briefs/`; only process narration (dispatch records, decomposition-rationale, restated checklists) is removed. Ask the user for the disposition on large corpora | judgment |
| `reference/<corpus>/` (curated manifests — INDEX/README, licenses, fetch recipes) | Move the corpus directory to a peer collection root (repo-named, e.g. `corpora/`) as product substrate — see canonical-layout.md § Collection roots | mechanical for the move; root naming and manifest reconciliation are judgment |
| `reference/<corpus>/raw/`, gitignored raw fetches | Move with their corpus manifest to the collection root — raws are repository material, not research artifacts, and conversion never deletes them | mechanical |
| `reference/<corpus>/BIBLIOGRAPHY.md`, root `references.md` | Retain until the citation remap completes — the lookup table — then remove; when the bibliography doubles as the corpus manifest it stays at the collection root with only its lookup role ending | mechanical |
| Corpus-level metadata (licenses, themes, source grouping) | Stays in the corpus manifests at the collection root (or a note in `.research/CONVENTIONS.md` when no collection root exists); do not drop silently | mechanical |

## Anchor remap procedure

1. **Build the handle table.** For every corpus `BIBLIOGRAPHY.md` (and the
   root `references.md` if present): entry number → handle, plus the
   `**Pieces:**` list when present. If the two disagree about an entry,
   stop — see Detection.
2. **Split multi-piece sources.** For compound handles `<entry>-<piece>`,
   create one attestation per piece (`<piece-handle>.md`). Set `source_url`
   only when the piece has a genuine URL; otherwise omit it and record the
   piece locator and its access surface in the attestation (the discipline's
   no-public-reference rule). There is no compound citation syntax in
   Workbench; a piece attestation is an ordinary source.
3. **Rewrite every citation.** Resolve each `[handle]{N}` through the table:
   rewrite as `[handle]{source}` (bibliographic) or as `[handle]{M}` pointing
   at a specific attested detail that supports the claim. Never leave a
   citation that resolves only under the old semantics.
4. **Disposition ledger.** Every retained source citation must map to one or
   more warranted destination anchors; folded and removed artifacts are
   accounted for in the manifest. Citation counts may legitimately *grow*
   during conversion — the reference execution added detail-level anchors
   where the record supported them (358 source citations → 387 converted
   anchors). Count equality is not the check; complete, accounted resolution is.

## Verification

- `lint-research.py` passes with zero errors; every citation — detail and
  bibliographic — resolves.
- Every attestation carries required frontmatter and a numbered
  `## Attested details` list; every brief lists its cited handles in
  `source_handles`.
- `bibliography.yaml` and `.knowledge/index.json` build; the index `--check`
  passes.
- Every judgment-marked remap in the manifest gets a semantic review against
  its original bibliography entry — text on both sides should warrant the
  same claim. Mechanical-marked remaps need only resolve.
- Inbound references to moved `reference/` paths — gitignore patterns, render
  and build pipelines, scripts — resolve against the collection root.
- The manifest is complete: no source citation is unaccounted for.

## Safety posture

Dry-run inventory and mapping report first; the user approves the tier
dispositions (precis promotion vs fold, campaign artifact sorting, raw
material, corpus metadata, collection-root naming) before any write. Hard
cutover in one commit, Git-reversible, one repository at a time. Nothing in
this mapping runs autonomously across repositories. Raw fetches are only ever
moved with their manifests, never deleted.
