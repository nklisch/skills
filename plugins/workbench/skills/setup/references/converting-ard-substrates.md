# Converting agentic-research (ARD) Substrates

The research-side mapping for bringing a legacy `agentic-research` substrate
into Workbench alignment. Read this completely before writing; the generic
rules in [migration-rules.md](migration-rules.md) still apply. The reference
execution of this mapping is the skills/ migration of 2026-07-27 (50
attestations restructured, 10 briefs converted, every citation remapped).

## Detection

A `.research/` substrate is ARD-owned when any of these hold:

- `.research/CONVENTIONS.md` declares `owner: agentic-research`;
- the four-tier layout exists: `reference/`, `attestation/`, `precis/`,
  `analysis/` under `.research/`;
- per-corpus `BIBLIOGRAPHY.md` files exist and `[handle]{N}` citations
  resolve against their entries.

The agentic-research plugin being installed is corroborating, not decisive.

## The semantic core

ARD bibliography entries and Workbench attestations describe the same
sources. Conversion is therefore a **lookup, not a rewrite of meaning**: the
anchor moves from "entry N in a per-corpus bibliography" to "the attestation
of that entry's source," and the two citation types carry the granularity:

- `[handle]` — bibliographic reference: the source record warrants the claim.
- `[handle]{N}` — detail reference: attested detail N warrants the claim.

Granularity honesty governs the remap: when no specific attested detail
supports the claim, downgrade to a bibliographic reference rather than
inventing detail-level support.

## Tier mapping

| ARD source | Workbench destination |
|---|---|
| `attestation/<handle>.md` | `attestations/<handle>.md` — keep required frontmatter (`source_handle`, `fetched`, `source_title`, `source_url` when available); extra ARD keys (`provenance`, `source_class`, and similar) may stay as optional extras; ensure a numbered `## Attested details` list derived from the attestation's key passages, preserving text and order |
| `precis/<handle>.md` | Fold into the attestation's summary; remove the precis file. If the precis carries content the attestation lacks, merge it first |
| `analysis/briefs/`, `analysis/positions/` | `briefs/<id>.md` — genuine synthesis becomes briefs under the discipline's brief-structure frontmatter contract |
| `analysis/campaigns/**` | Engagement plumbing with no Workbench home: fold durable synthesis into the parent brief; remove process narration (Git history retains it). Ask the user for the disposition on large corpora |
| `reference/<corpus>/BIBLIOGRAPHY.md` | Retain until the citation remap completes — it is the lookup table — then remove |
| `reference/<corpus>/raw/` | Raw local copies are repository material, not research artifacts; move outside `.research/` or remove per user decision |
| Root `references.md` (legacy duality) | Same as `BIBLIOGRAPHY.md`: lookup table, then remove |

## Anchor remap procedure

1. **Build the handle table.** For every corpus `BIBLIOGRAPHY.md`: entry
   number → handle, plus the `**Pieces:**` list when present.
2. **Split multi-piece sources.** For compound handles `<entry>-<piece>`,
   create one attestation per piece (`<piece-handle>.md`, `source_url` = the
   piece locator) carrying that piece's content. There is no compound
   citation syntax in Workbench; a piece attestation is an ordinary source.
3. **Rewrite every citation.** Resolve each `[handle]{N}` through the table:
   rewrite as `[handle]` (bibliographic) or as `[handle]{M}` pointing at a
   specific attested detail that supports the claim. Never leave a citation
   that resolves only under the old semantics.
4. **Count check.** The number of citations before equals the number after;
   every rewritten citation resolves against its attestation.

## Verification

- `lint-research.py` passes with zero errors; every citation resolves.
- Every attestation carries required frontmatter and a numbered
  `## Attested details` list; every brief lists its cited handles in
  `source_handles`.
- `bibliography.yaml` and `.knowledge/index.json` build; the index `--check`
  passes.
- Spot-check a sample of remapped citations against their original
  bibliography entries — text on both sides should warrant the same claim.

## Safety posture

Dry-run inventory and mapping report first; the user approves the tier
dispositions (precis folds, campaign removals, raw material) before any
write. Hard cutover in one commit, Git-reversible, one repository at a time.
Nothing in this mapping runs autonomously across repositories.
