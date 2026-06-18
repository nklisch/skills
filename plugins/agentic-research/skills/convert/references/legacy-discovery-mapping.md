# Legacy discovery, classification, and mapping

How `convert` finds foreign research, classifies it, routes it by kind, and hands claim-bearing
syntheses to `refresh-entry` for rigor-uplift. Preserve-only is the default; every classification
and tier decision is **operator-confirmed** (propose-not-prune).

## Contents

- [Discovery sweep](#discovery-sweep)
- [Classification (operator-confirmed)](#classification-operator-confirmed)
- [Routing: material splits by kind](#routing-material-splits-by-kind)
- [The import marker + holding area](#the-import-marker--holding-area)
- [Content-integrity gate](#content-integrity-gate)
- [Reference-integrity on move](#reference-integrity-on-move)
- [Hand-off to refresh-entry](#hand-off-to-refresh-entry)

## Discovery sweep

Enumerate the actual repo state and **propose** research candidates — do not probe a hardcoded
path list. Heuristics (each *proposes*, none auto-includes):

- **Citation-like patterns** — `[handle]{N}`, footnote markers, `[1]`/`(Author, Year)` inline cites.
- **Source / bibliography lists** — `references.md`, `bibliography`, `sources`, `works-cited` files.
- **Hypothesis & summary docs** — files reading as research synthesis (claims + support), surveys,
  position write-ups, literature notes.
- **Research-shaped dirs** — `research/`, `notes/`, `lit/`, `sources/`, a wiki tree, a
  differently-shaped `.research`-like folder.

## Classification (operator-confirmed)

For each candidate the sweep surfaces, classify in one batched operator pass:

- **research / not-research** — pulling an ordinary doc into the durable `.research/` tier is as
  costly as a tier misclassification, so the operator confirms the research call per candidate.
  Nothing is swept in silently.
- **kind** (for research candidates) — *raw source* vs *claim-bearing synthesis* (drives routing
  below). When ambiguous, ask; default to the safer treatment (treat as a source to place, not a
  synthesis to uplift, unless it clearly carries claims needing re-grounding).

## Routing: material splits by kind

The split is **load-bearing** — the two kinds take different paths:

| Kind | Destination | Handed to refresh-entry? |
|---|---|---|
| **raw source / bibliography record** | `reference/<corpus>/` as-is (raw + INDEX row) | **No** — it is substrate, not a lens |
| **claim-bearing legacy synthesis** (note / summary / survey / position) | `.research/.import-holding/<slug>.md` (flagged) | **Yes** — it is the analytical-tier lens refresh-entry re-authors |

Why the split: `refresh-entry` treats the prior artifact as an **analytical-tier LENS** (a position,
synthesis, campaign parent) and re-authors it over current sources. A raw source or a bibliography
entry is **not** a claim-bearing synthesis — it is the *substrate a synthesis cites*, never itself a
lens. Handing a raw source to refresh-entry is a category error. Raw sources are placed directly in
`reference/`; only syntheses round-trip through uplift.

## The import marker + holding area

A claim-bearing synthesis does **not** land in `attestation/` / `precis/` / `analysis/` on import.
Doing so would write substrate that violates `.research/CONVENTIONS.md` (which **requires** a valid
`provenance:` enum value on those tiers) and trips `lint-citations.py` (`missing-provenance`).

Instead convert imports it to a **non-authoritative holding area**:

- Path: `.research/.import-holding/<slug>.md` (outside the authoritative-tier lint surface).
- Frontmatter: `import_origin: inferred-from-legacy` + the operator's confirmed
  `intended_output_kind` (what it should *become*: a `precis`, a `positions/` position, an
  `analysis/briefs/` brief). **No** authoritative-tier frontmatter (no `provenance:`, no `[handle]{N}`
  chain — it has none yet).

`import_origin:` is a plugin-local migration marker, **not** an ARD `provenance_values` member
(ARD is agnostic about pre-adoption history). It lives only here, never on a finished tier artifact.

The holding artifact is **retained** (not deleted): `refresh-entry` produces the uplifted tier
artifact with a `supersedes` pointer back to this holding artifact, keeping it as the historical
lens. Convert never promises to delete it.

## Content-integrity gate

Before any destructive op (move / delete / overwrite of a legacy file), build a **block-level
preservation manifest** (borrowed from the agile-workflow convert discipline):

1. **Block boundaries** — frontmatter is one block; each heading section runs to the next same-or-
   higher heading; fenced code / tables / lists are atomic (never split). No-heading files group by
   blank-line paragraphs.
2. **Terminal state per block** — `landed_existing` (already at destination), `landed_this_run`
   (written this run), `preserved_in_place` (kept in source — pins the source), or `ambiguous`
   (blocks the op until resolved).
3. **Content-equality verification** — a destination must hash-match the normalized source block
   (trim trailing whitespace, collapse blank runs); a marker/heading alone never proves the body
   landed.
4. **Destructive-op precondition** — a source-eliminating op (move / delete / shim) runs ONLY when
   every block is `landed_*`. Any `preserved_in_place` or `ambiguous` block keeps the source file in
   place. A manifest with any unaccounted block runs no destructive op (reported as
   preserved-pending-review).

## Reference-integrity on move

Before any `git mv` / delete, grep the repo for inbound references to the moved path (especially
other `.research/` artifacts and `docs/`); rewrite them to the new path or leave a redirect shim.
Never strand a live pointer. Every move names an exact path (no broad globs).

## Hand-off to refresh-entry

For each holding-area synthesis, call the `research-orchestrator` **refresh branch** with:

```yaml
prior_artifact_path: .research/.import-holding/<slug>.md
input_state: legacy                 # convert ALWAYS passes legacy — it only imports foreign research
intended_output_kind: <precis | position | synthesis-brief | ...>   # the operator's confirmed target tier
```

`refresh-entry` re-authors the synthesis over current sources into a CONVENTIONS-valid
authoritative-tier artifact (with a real `provenance:`), `supersedes`-pointing the retained holding
artifact. `lint-citations.py` is the conformance check on the **uplifted output** (the holding
artifact itself is never lint-checked as authoritative substrate). Raw sources are never handed off
— they are already placed in `reference/`.
