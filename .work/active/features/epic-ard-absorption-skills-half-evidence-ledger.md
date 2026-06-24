---
id: epic-ard-absorption-skills-half-evidence-ledger
kind: feature
stage: drafting
tags: [plugin]
parent: epic-ard-absorption-skills-half
depends_on: [epic-ard-absorption-skills-half-scaffold]
release_binding: null
gate_origin: null
created: 2026-06-24
updated: 2026-06-24
---

# Seed `ard-core/evidence/` — the empirical failure ledger (primary warrant tier)

## Brief

Fill `ard-core/evidence/` (the directory + schema landed by the scaffold feature)
with the v0.7 grounding as structured ledger entries. This is the new **primary**
warrant tier under the empirical-first reframe — it is real synthesis, not file
moves, which is why it is its own feature (peer-confirmed split from the scaffold).

## Why a separate feature

The peer review flagged that seeding the evidence ledger has "schema, entry
quality, and validation implications" distinct from the mechanical scaffold/move
work. Each entry is a synthesis: it pulls an observed failure cluster from the
v0.7 session notes + `ard/.research/COMMITMENTS.md` and renders it in the ledger's
shape (recurrence count · deployment · observed behavior · mitigation ·
verification result). Entry quality is the warrant — these justify the
disciplines empirically, replacing theory-as-genesis.

## Ledger entries to author (v0.7 grounding)

From the v0.7.0 implementation session note + COMMITMENTS:

- **AQ.4 — inadequate-attempt blocking** — abandonment lit (Li/Huffman/Tokuda
  2009, Browne 2007 stopping rules), Microsoft transient-fault (403 lumped with
  permanent), soft-404, scraping escalation ladder. Observed: transport-block
  mistaken for content-unavailability.
- **GR.9 / metadata recall-sourcing** — DOI accuracy (Chelli 2024: DOIs 16–20%
  accurate on real papers; Walters & Wilder 2023; Linardon 2025; CiteAudit 2026;
  W3C PROV). Observed: bibliography URL/DOI/date recall-filled rather than
  read off source. (Forward-looking — recurrence is one cluster; note that.)
- **Cross-model verification** — correlated-error lit (Kim et al. 2025 ICML;
  Zheng 2023 self-enhancement; Bommasani 2022 monoculture; Huang 2024 can't
  self-correct). Observed: correlated-verifier blind spots; model-diversity as
  partial mitigation.
- **decision_relevance / VOI** — Howard 1966 (VOI), Raiffa & Schlaifer (EVSI),
  Stigler 1961, Wald 1947 (stopping), Sims 2003 (rational inattention). Observed:
  research depth uncalibrated to decision impact.
- **PR.3 — class-complete sweep** (brief) — a class-shaped correction must sweep
  every same-class instance, not just the flagged ones.

## Schema (from the scaffold feature)

recurrence count · deployment · observed behavior · mitigation · verification
result. The design pass confirms the exact field set against what the scaffold
landed and against the empirical-first reframe's intent (the docs reframe in F3
points at this tier as primary warrant — keep the shape coherent with that).

## Epic context

- Parent epic: `epic-ard-absorption-skills-half`
- Position in epic: depends on the scaffold (which lands the empty tier + schema);
  parallel to collapse-vendoring (different files — no edge between them).

## Foundation references

- Root v0.7.0 session note `2026-06-24-ard-v0.7.0-implementation` (the grounding source).
- `ard/.research/COMMITMENTS.md`, `ard/.research/references.md` (defensibility trace).
- The scaffold feature's `ard-core/evidence/` schema.

## Verification

Each v0.7 cluster has a ledger entry in the agreed shape, grounded in the cited
sources (honor the research-discipline: source-bound, no recall-filled metadata).
The reframed docs (F3) can point at a populated, coherent primary-warrant tier.
