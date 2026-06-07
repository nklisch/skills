---
id: epic-agentic-research-substrate-tier-seed
kind: story
stage: done
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

## Implementation notes
- **Subject** (chosen via a repo scan): "Rust prebuilt binaries are a viable
  distribution choice for research-view" — a real, quantitative claim that feeds the
  `research-view` feature.
- **Sources (3, real)**: `work-view-dist` (local precedent — the four committed
  work-view binaries, byte sizes measured in place), `min-sized-rust` and
  `cargo-profiles` (both fetched live via WebFetch; verbatim quotes with anchors).
- **Files created**: `.research/reference/rust-binary-size/INDEX.md`;
  `.research/attestation/{work-view-dist,min-sized-rust,cargo-profiles}.md`;
  `.research/analysis/positions/rust-binary-distribution-viable.md`; +3 numbered
  entries in `.research/references.md`.
- **Verification**: `lint-citations.py .research/analysis/positions/ --exit-code-on
  high` (URL-check ON) → exit 0; 10 citations resolved, 0 broken, 0 thin. One
  `version-number` warn on `~2.65 MiB` — cited inline with `[work-view-dist]{1}`,
  human-spot-checked. Every handle → real attestation with matching `source_handle`;
  local `source_path` exists.
- **Honesty**: the position rests on the verifiable local precedent
  (`[work-view-dist]{1}`); the aggressive KB figures from `min-sized-rust` are
  explicitly disconfirmed as not like-for-like. `temporal_contract:
  extend-on-source-rev` — revisit with research-view's own measured size once built.
- **Discrepancies from design**: none. **Adjacent issues parked**: none.

## Review (approve · adversarial)
Verdict: Approve — an independent fresh-context adversarial reader re-derived every
claim rather than trusting the attestations: re-measured the four binaries (exact
byte match, all committed), re-fetched both web sources (quotes verbatim, anchors
correct), found no overclaiming (the disconfirming analysis honestly demotes the
non-comparable KB figures), and ran the lint (exit 0 / 0 broken / 0 thin). Nits
(non-actioned): the informational `version-number` warn on `~2.65 MiB`; min-sized-rust
quote #1 stitches two adjacent verbatim clauses — reviewer judged acceptable.
Advanced review → done.
