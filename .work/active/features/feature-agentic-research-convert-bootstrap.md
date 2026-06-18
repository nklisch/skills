---
id: feature-agentic-research-convert-bootstrap
kind: feature
stage: drafting
tags: [skill, tooling]
parent: null
depends_on: []
release_binding: null
gate_origin: null
created: 2026-06-17
updated: 2026-06-18
---

# `agentic-research:convert` — discover + bootstrap an adopter's research into ARD parity

## Brief

A new `agentic-research:convert` (or `bootstrap`) skill that supplies the missing
**front half** of ARD adoption: locate pre-existing research in an adopter's repo,
scaffold the `.research/` substrate that receives it, and map the found material into
the tiers — then hand each mapped artifact to ARD v0.6.0's **rigor-uplift** recipe for
per-artifact citation/attestation parity, with `lint-citations.py` as the conformance
check.

Net flow: `convert` (locate + scaffold + map) → `rigor-uplift` per artifact (re-author
to ARD rigor) → lint (verify). ARD v0.6.0 supplies the middle step; this feature is the
missing front half. Modeled on **agile-workflow's `convert`** discipline (borrow the
approach, not the code).

## Strategic decisions
- **Parent**: top-level feature, `parent: null` — the named `epic-agentic-research`
  adoption epic is `done` (all 7 children complete, at `stage: review`, heading to
  release). This is post-epic follow-on work that builds on the now-complete plugin;
  scoping it under the closed epic would re-open and delay a shipping epic.
- **Dependency**: none. ARD v0.6.0 is already vendored in the plugin
  (`plugins/agentic-research/ard.json` → `adopts.version 0.6.0`, `release_tag v0.6.0`),
  landed on main via PR #20, so the rigor-uplift hand-off target exists. The discovery +
  bootstrap half was always independent of the version bump; with v0.6.0 vendored the
  per-artifact uplift hand-off is also unblocked. The whole feature can be designed and
  built now.

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
rigor) → lint (verify). ARD 0.6.0 supplies the middle step; this feature is the missing front half.

## Linkage & sequencing

- Lineage epic: `epic-agentic-research` (the ARD-as-plugin adoption — now `done`). This feature
  is post-epic follow-on, scoped top-level rather than re-opening it.
- The v0.6.0 sync that vendors the rigor-uplift recipe is already on main (the *adopts*-bump
  landed via PR #20; `epic-agentic-research-ard-sync` shipped the repeatable-sync tooling). With
  v0.6.0 vendored, the per-artifact uplift hand-off target exists — no remaining dependency.
- Reference model: `plugins/agile-workflow/skills/convert/SKILL.md` (discovery sweep →
  classify → content-integrity gate → route & import → reference-integrity → preserve-only).

## Open questions for design

(Feature-design-internal — resolve in the design pass, not at scope time.)

- One skill with bootstrap/sync auto-detect (the agile-workflow pattern), or split discovery
  from scaffold?
- How aggressive is auto-classification vs. operator-confirmed per-artifact tier assignment?
- Does the migrated-attestation `inferred-from-legacy` provenance value need an ARD
  catalogs/schema addition, or is it a plugin-local frontmatter convention?

## Verification notes (scope-time, against vendored ARD v0.6.0)

Checked the gap analysis's ARD references against the vendored kernel data
(`plugins/agentic-research/scripts/catalogs.json`, `templates/dispatch.md`). SPEC.md /
CATALOGS.md prose is **not** vendored (the foundation-docs thin/reference decision — only
the kernel data surface is in-repo), so the §-number cites trace to upstream ARD, but the
underlying concepts are corroborated by the vendored data:

- **`AQ.2 substrate-check` is real and matches the brief.** `catalogs.json` carries it with
  fence text *"on finding prior substrate, diff it against current sources; a stale diff fires
  a refresh re-engagement (SPEC.md §4.8)"* — confirming both the `SPEC §4.8` cite and the
  feature's claim that AQ.2 is scoped to staleness-diffing the adopter's *own prior ARD*
  substrate (not a foreign-research sweep).
- **`temporal_contract: supersedes-prior` is a real `registration_enums` value** ✓ — validates
  the rigor-uplift re-engagement mechanism the hand-off targets. `rigor-uplift` / `refresh`
  concepts appear in `catalogs.json` + `templates/dispatch.md`.
- **`inferred-from-legacy` does NOT exist in the vendored `provenance_values` enum.** The five
  legal values are `source-direct`, `agent-authored-from-raw`, `agent-synthesis`,
  `generated-listing`, `hybrid-curated`. So the third open question's proposed provenance flag
  is confirmed **net-new** — it requires either an upstream ARD catalogs/schema addition or a
  plugin-local frontmatter convention. The design pass decides which; the value is not legal today.
