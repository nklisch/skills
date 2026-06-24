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

---

## Design

### Source of truth for the entries — `ard-core/theory/COMMITMENTS.md:31`

The v0.7 grounding is already authored, source-bound, in the ported
`ard-core/theory/COMMITMENTS.md` (the "v0.7.0 additions" paragraph), with every
external citation as a `[handle]{N}` resolving against
`ard-core/theory/references.md` (handles `{41}`–`{52}`). **This feature does NOT
re-research** — it *re-renders* that already-grounded prose into the five-field
ledger shape. This is the right relationship: the COMMITMENTS trace is the
defensibility archaeology; the evidence ledger is the operative primary-warrant
view. No new citations are invented; entries reuse the existing handles.

### The 5 entries (one per v0.7 cluster)

Each maps a SPEC/CATALOGS shape to its observed warrant. Per the ledger schema
(`ard-core/evidence/README.md`): recurrence · deployment · observed behavior ·
mitigation · verification result · grounding.

1. **`AQ.4` — inadequate-attempt blocking** — grounding `{47}`(li-good-abandonment),
   `{48}`(browne-stopping-rules). Observed: transport-level block (session-gated
   403 / anti-bot / JS-render) mistaken for content-absence → premature "blocked".
   Mitigation: acquisition-mode-exhaustion fence (SPEC §4.1) — escalate
   best-tool→browser-class→authenticated→operator before declaring blocking.
2. **`GR.9` — metadata recall-sourcing** — grounding `{45}`(chelli: DOI ~16–20%
   accurate), `{46}`(walters), `{1}{2}`(W3C PROV). Observed: bibliography
   URL/DOI/date recall-filled rather than read off source. **Mark forward-looking**
   (recurrence = 1 cluster; the peer caught the over-promotion in v0.7 review).
   Mitigation: metadata-tier source-bound discipline (SPEC §4.1/§4.2).
3. **model-diversity verification property** — grounding `{41}`(kim: correlated
   even across providers), `{42}`(zheng: self-preference), `{43}`(bommasani:
   monoculture), `{44}`(huang: can't self-correct). Observed: correlated-verifier
   blind spots. Mitigation: model-diversity as a SPEC §7 property — a **partial**
   fence (reduces, never eliminates — record the honesty caveat).
4. **`decision_relevance` / VOI gate** — grounding `{49}`(howard VOI),
   `{51}`(raiffa-schlaifer EVSI), `{50}`(stigler), `{52}`(wald). Observed:
   research depth uncalibrated to decision impact. Mitigation: `decision_relevance`
   registration field + kickoff gate (SPEC §9) — "what decision changes if this
   finds X?".
5. **`PR.3` — class-complete sweep** — grounding: the originating deployment's
   reconciliation-completeness evidence (NOT an external tradition — record as
   deployment-grounded). Observed: a subset-flagged class whose unflagged siblings
   persist = non-propagation at the class level. Mitigation: class-complete sweep
   fence (SPEC §4.8).

### Substrate-confidence honesty (carry from COMMITMENTS)

COMMITMENTS records the v0.7 entries' substrate confidence as **search-summary**
(bibliographic existence verified; findings engaged via abstract/landing-page, not
full source-direct reads). The ledger entries must carry this honestly — do NOT
present search-summary grounding as source-direct (that would itself be the `GR.9`
failure entry #2 fences). Note it per-entry or as a ledger-header caveat.

## Implementation
Single authoring stride into `ard-core/evidence/ledger.md` (replacing the
template placeholder with the 5 entries). **No child stories** — one cohesive
no-code authoring act. *(This is prose-shaped work — it authors a ledger, no code
surface — but it lives in a `[plugin]` feature for tracking; implement inline.)*

## Testing
- 5 entries present, each with all 6 fields populated.
- Every `[handle]{N}` in the entries resolves in `ard-core/theory/references.md`
  (no invented handles). Spot-check `{41},{45},{47},{49}` resolve.
- `GR.9` entry marked forward-looking; model-diversity marked partial fence; v0.7
  substrate-confidence (search-summary) recorded — the three honesty caveats present.
- No recall-filled metadata (the discipline the ledger itself warrants).

## Risks
- **Re-research temptation.** The entries must re-render COMMITMENTS, not
  re-derive grounding — inventing a citation or upgrading search-summary to
  source-direct would breach the very disciplines being ledgered. Mitigated by the
  "reuse existing handles only" rule + the handle-resolution test.
- **Schema drift vs scaffold.** If the scaffold's `evidence/README.md` schema and
  these entries disagree on field names, the tier is incoherent. Mitigated by
  authoring strictly to the landed README schema.
