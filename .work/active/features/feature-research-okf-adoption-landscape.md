---
id: feature-research-okf-adoption-landscape
kind: feature
stage: drafting
tags: [research]
parent: epic-ard-okf-representation-convergence
depends_on: []
release_binding: null
gate_origin: null
research_origin: null
research_refs: []
research_dials:
  scope_authority: in-engagement-judgment
  verification_rigor: floor
  intent: survey-landscape
  output_kind: landscape-brief
created: 2026-07-20
updated: 2026-07-21
---

# Survey the OKF adoption landscape (who's using it, what's moved since announcement)

## Brief

The architectural discussion (`epic-ard-okf-representation-convergence`) needs
an informative grounding: who has actually adopted OKF since Google announced
it June 12, 2026, and what movement/critical-response has occurred in the ~5
weeks since. This is a landscape-survey engagement, not a decision-forcing one —
its output informs the Q1/Q2 architectural discussion by establishing what the
real adoption shape looks like, what OKF is being used for in practice, and
where the critical discourse lands.

## Decision relevance (yield hypothesis)

What downstream decision changes if this finds X? — **calibrates the
architectural discussion's risk and timing**, not decides the architecture
itself:

- If OKF has meaningful adoption among projects shaped like `agentic-research`
  (knowledge substrates, research tools, agent-knowledge bases), that's
  evidence the format has legs and converging toward it is lower-risk (the
  representation won't be orphaned). Affects Q1's risk calculus.
- If adoption is thin / confined to Google-ecosystem demo bundles, that's
  evidence OKF is unproven and a full-convergence bet is premature; a
  boundary-layer (emit-only) posture hedges. Affects Q1's risk calculus.
- If adopters report the *same gap* ARD is experiencing (no reading surface,
  hand-rolling progressive disclosure), that validates the "ARD is already
  reinventing OKF" observation and strengthens the convergence case. Affects Q1.
- If critical discourse identifies representation problems OKF doesn't solve
  (e.g., the "problems it deliberately doesn't solve" framing visible in
  initial search), that's constraints to weigh against full convergence.

The finding does not decide the architecture — the architectural discussion does
that. This engagement informs it with grounded evidence rather than recall.

## Seed sources (fetchable; web-search-identified, to be attested)

Initial web search surfaced candidate sources to fetch + attest (not exhaustive;
the engagement discovers more via acquisition):

- Google Cloud announcement (June 12): `cloud.google.com/blog/products/data-analytics/how-the-open-knowledge-format-can-improve-data-sharing`
- The OKF repo + spec (already attested as `okf-spec` in the open-knowledge-format corpus)
- Named adopters to investigate:
  - Moselwal Handbook (Moselwal Digitalagentur — "already adopted it")
  - Mattrx (SaaS, claimed hallucination-rate improvement)
  - OriginTrail DKG (`dkg okf import` integration)
  - `saschb2b/okf-bundles` (third-party bundle repo)
  - ap7i Claude Code plugin for OKF
- Critical analysis to investigate:
  - totto.org "problems it deliberately doesn't solve"
  - SearchScore "why we're not rushing"
  - opentechhub "comes with strings"

## Out of scope

The architectural decision (Q1 substrate-is-OKF vs boundary-layer; Q2 fixed vs
flexible shape) is NOT this engagement's output. This engagement produces a
landscape-brief (who adopted, what for, what critical response); the
architectural discussion consumes it alongside the attested OKF spec and the
internal artifacts. Do not let the survey drift into recommendations —
`output_kind: landscape-brief`, not `adoption-recommendations`.

<!-- research-orchestrator reads the research_dials above at kickoff (survey-
landscape / landscape-brief / floor). Being informative (not decision-forcing),
floor rigor is appropriate — the hard floor (lint + spot-check) fires; the
selectable gates (adversarial-read, evaluate) are not warranted for a landscape
survey. On completion the item closes per CONVENTIONS.md research_completion:
close-to-done. -->
