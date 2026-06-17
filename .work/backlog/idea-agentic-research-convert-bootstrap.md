---
id: idea-agentic-research-convert-bootstrap
created: 2026-06-17
tags: [skill, tooling]
---

# `agentic-research:convert` — discover + bootstrap an adopter's research into ARD parity

## The gap

ARD v0.6.0's **rigor-uplift** re-engagement recipe (SPEC §4.8 — `temporal_contract:
supersedes-prior` + an existing `intent` + the `refresh` change-mode; the LENS-not-substrate
treatment of the prior artifact in §4.6) is **input-positioned**: it re-authors an artifact
that is *already in hand and already located inside a `.research/` substrate*. It does not
locate foreign research, and it does not stand up the substrate that receives it.

The plugin has no front-half capability for this:
- All three skills (`research-orchestrator`, `research-handoff`, `research-discipline`) assume
  `.research/` already exists. None scaffolds `CONVENTIONS.md`, the path map, or INDEX files.
- `ADOPTION.md` tells an adopter how to vendor the kernel and consume ARD; it assumes the
  substrate is already set up by hand.
- `AQ.2 substrate-check` (CATALOGS §1) is the closest framework hook — *"on finding prior
  substrate, diff it against current sources"* — but it is scoped to staleness-diffing the
  adopter's **own prior ARD substrate** for a refresh. It does not sweep a repo for non-ARD
  research, and it assumes what it finds is already in `.research/` shape.

So an adopter with pre-existing research but no `.research/` substrate (scattered docs, a wiki,
a differently-shaped folder) has no supported path: rigor-uplift makes the *per-artifact* uplift
legal, but nothing discovers the artifacts or builds the substrate to hold them. This gap is
**ARD-version-independent** — even with v0.6.0 fully vendored it remains net-new plugin work.

## Proposed shape

A new `agentic-research:convert` (or `bootstrap`) skill that runs *before* rigor-uplift, modeled
on **agile-workflow's `convert`** discipline (borrow the approach, not the code):

1. **Discovery-driven sweep** — enumerate actual repo state, classify what's found
   (ARD-shaped / legacy-research / unsure), rather than probing hardcoded paths. Heuristics:
   citation-like patterns, source/bibliography lists, hypothesis & summary docs, research dirs.
2. **Bootstrap-or-sync auto-detect** — absent `.research/` → scaffold (`CONVENTIONS.md`, path
   map, per-corpus INDEX); present → sync/validate.
3. **Map legacy material into the tiers** — sources → `reference/`; research notes →
   `attestation/` (flagged `inferred-from-legacy` provenance); summaries → `precis/`;
   surveys/positions → `analysis/`.
4. **Content-integrity gate before any destructive op** — block-level preservation manifest so
   nothing is dropped on import; preserve-only default.
5. **Reference-integrity on move** — rewrite inbound refs or leave redirect shims.
6. **Report** — emit a migration report; hand each mapped artifact to **rigor-uplift** for
   per-artifact citation/attestation parity, with `lint-citations.py` as the conformance check.

Net effect: `convert` (locate + scaffold + map) → `rigor-uplift` per artifact (re-author to ARD
rigor) → lint (verify). ARD 0.6.0 supplies the middle step; this item is the missing front half.

## Linkage & sequencing

- Parent epic: `epic-agentic-research`.
- **Depends on the v0.6.0 sync** for the rigor-uplift hand-off target: `epic-agentic-research-ard-sync`
  is the repeatable-sync tooling, but the *adopts-bump to v0.6.0* (which vendors the rigor-uplift
  recipe) is its own pending PR — see root AGENTS.md §Work band and `.research/CONVENTIONS.md`
  §Dual-pin. The **discovery + bootstrap half is independent of that** and could land first; only
  the per-artifact uplift hand-off needs v0.6.0 vendored.
- Reference model: `plugins/agile-workflow/skills/convert/SKILL.md` (discovery sweep →
  classify → content-integrity gate → route & import → reference-integrity → preserve-only).

## Open questions for scoping

- One skill with bootstrap/sync auto-detect (the agile-workflow pattern), or split discovery
  from scaffold?
- How aggressive is auto-classification vs. operator-confirmed per-artifact tier assignment?
- Does the migrated-attestation `inferred-from-legacy` provenance value need an ARD
  catalogs/schema addition, or is it a plugin-local frontmatter convention?
