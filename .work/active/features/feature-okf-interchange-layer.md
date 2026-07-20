---
id: feature-okf-interchange-layer
kind: feature
stage: drafting
tags: [plugin, tooling]
parent: null
depends_on: []
release_binding: null
gate_origin: null
research_origin: okf-format-assessment-against-ard-substrate
created: 2026-07-19
updated: 2026-07-20
---

# OKF interchange layer — emit/consume OKF bundles at an ARD `.research/` boundary

## Finding

The OKF↔ARD assessment concluded with an **interop** recommendation (Track B of
the brief's Findings): emit/consume OKF as an interchange format at a boundary,
leaving ARD's internal substrate representation unchanged. This captures OKF's
genuine value — a specified, vendor-neutral interchange representation with
progressive-disclosure affordances (`index.md` directory listings) and a
bundle-as-distribution-unit model — without sacrificing ARD's anti-fabrication
spine, which OKF does not carry (no attestation tier, no `[handle]{N}` wire form,
no source-bound citation, no tier directionality, no provenance/temporal
contracts).

This is a net-new capability, not a refactor — it adds a boundary layer rather
than preserving an existing surface.

## Scope

A boundary layer in the `agentic-research` plugin surface with two directions:

### Export (ARD → OKF) — lower risk

Export an ARD `.research/` corpus (or the reference tier) to an OKF-conformant
bundle. This direction is **lossy by design**: drop the attestation chain, emit
concepts with `type`/`resource`/`title`/`description`/`tags`/`timestamp`
frontmatter, and synthesize a progressive-disclosure `index.md` (directory
listing) per OKF §6. ARD's numbered bibliography becomes... what? An OKF
`index.md` is a synthesizable directory listing, not a numbered citation anchor —
the export must decide whether to emit the bibliography as a non-standard
concept document or drop it (OKF has no numbered-bibliography concept). This is
a design decision for the feature.

### Import (OKF → ARD) — higher risk, recall-sourcing hazard

Import an OKF bundle into ARD's attestation tier by minting handles +
attestations for each OKF concept's `resource` / `# Citations` URLs. **This
direction has real recall-sourcing risk**: an OKF `# Citations` entry is a bare
URL with no assertion it was fetched — importing it as an attestation would
launder an unfetched URL into apparent source-attestation (the `GR.1` / `GR.9`
failure — the exact defect ARD exists to fence). Import therefore requires
**operator-confirmed fetch + attestation per source**, not a mechanical ingest.
The import path is closer to a guided acquisition workflow than a bulk converter.

## Design questions for the feature

- Does export target the whole `.research/` tree, one corpus, or the reference
  tier only? (OKF bundles are self-contained distribution units; ARD's tiers are
  directional — exporting the analysis tier without the attestations it rests on
  would produce an OKF bundle whose claims have no visible grounding.)
- Is the import direction even in v1, or is export-first the right scope? (Export
  is the low-risk, high-value direction; import carries the anti-fabrication
  hazard and may warrant deferral.)
- Where does the layer live — a new `agentic-research` skill, an extension to
  `research-view`, or a standalone converter? The `convert` skill is the
  precedent for substrate-shape conversions.

## Research grounding

**Source**: `.research/analysis/briefs/okf-format-assessment-against-ard-substrate.md` (slug: `okf-format-assessment-against-ard-substrate`)

The OKF↔ARD assessment engagement concluded with an **interop** recommendation
(Track B of the brief's Findings): emit/consume OKF at a boundary, ARD internals
unchanged. The brief's disconfirming analysis confirmed OKF carries no
anti-fabrication machinery ARD could adopt (no attestation tier, no
`[handle]{N}`, no source-bound citation, no provenance fields, no tier
directionality), which is why adopt was rejected and interop chosen — and why
the import direction specifically requires operator-confirmed fetch per source.
