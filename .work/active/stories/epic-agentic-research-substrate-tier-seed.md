---
id: epic-agentic-research-substrate-tier-seed
kind: story
stage: implementing
tags: [docs]
parent: epic-agentic-research-substrate-tier
depends_on: [epic-agentic-research-substrate-tier-definition, epic-agentic-research-substrate-tier-lint]
release_binding: null
gate_origin: null
created: 2026-06-03
updated: 2026-06-03
---

# Seed example (dogfood)

## Scope
Story 3 of `epic-agentic-research-substrate-tier`. Authors ONE real, lint-passing
worked example in the repo-root `.research/`, grounding a real claim about this
adoption. This is the dogfood that proves the tier works end to end. Depends on the
structure + templates (S1) and the lint (S2).

## Implements
A real, source-grounded example (NOT a toy fixture):
- ≥1 `.research/reference/<corpus>/INDEX.md` (numbered, append-only).
- ≥1 `.research/attestation/<handle>.md` from a real fetched source — `## Summary`,
  `## Key passages` with verbatim `>` quotes + source-internal anchors, `## Structural
  metadata`. (Not thin.)
- ≥1 `.research/analysis/positions/<slug>.md` citing `[handle]{N}`, with
  `provenance: agent-synthesis` + a `temporal_contract`.
- Matching `.research/references.md` entries (numbered).
Suggested subject: a real claim from this adoption — e.g. the Claude Code
directory-source marketplace model, or ARD's operational/research substrate cleavage.

## Acceptance criteria
- [ ] Every `[handle]{N}` in the position resolves to a real attestation with a
  matching `source_handle` and a reachable `source_url`.
- [ ] `lint-citations.py .research/analysis/positions/ --exit-code-on high` exits 0.
- [ ] NO fabrication: every attributed claim traces to a `>` quote/anchor in its
  attestation. A failing lint is a real defect — fix the work, never game the check.
