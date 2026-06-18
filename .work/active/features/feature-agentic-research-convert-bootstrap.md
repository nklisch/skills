---
id: feature-agentic-research-convert-bootstrap
kind: feature
stage: drafting
tags: [skill, tooling]
parent: epic-agentic-research-reengagement
depends_on: [feature-agentic-research-refresh-entry]
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
- **Parent**: `epic-agentic-research-reengagement` (re-parented during the design pass). This
  is the **legacy front-half** of the re-engagement epic — it locates research authored
  *outside* ARD and scaffolds the substrate to hold it. It was first scoped top-level, but
  grounding revealed its rigor-uplift hand-off depends on a re-authoring doorway that does not
  exist in the plugin yet; that doorway (`feature-agentic-research-refresh-entry`) is shared
  with the ARD-native refresh lineage, so convert is one consumer of a shared primitive, not a
  standalone feature. (It is **not** a child of the now-done `epic-agentic-research` adoption
  epic — that epic shipped; this is new post-adoption capability.)
- **Dependency**: `depends_on: [feature-agentic-research-refresh-entry]` — convert scaffolds +
  maps + flags `inferred-from-legacy` artifacts, then hands each to the refresh-entry for
  per-artifact rigor-uplift. The discovery + scaffold + map work is independent and can be
  designed in parallel, but the end-to-end hand-off needs the doorway. ARD v0.6.0 is already
  vendored (`plugins/agentic-research/ard.json` → `adopts.version 0.6.0`, landed via PR #20),
  so the refresh *vocabulary + discipline* exist; what the refresh-entry adds is the
  orchestration *walk* for them.
- **`inferred-from-legacy` is a plugin-local import marker, NOT an ARD provenance value**
  (resolves the third open design question). ARD's `provenance_values` enum describes the
  *authoring relationship to sources* at substrate-entry time (`source-direct`,
  `agent-authored-from-raw`, `agent-synthesis`, `generated-listing`, `hybrid-curated`).
  Pre-adoption provenance — *where faulty research came from before convert ran* — is
  migration metadata, below ARD's line: ARD's discipline begins at the substrate boundary
  and is agnostic about an artifact's pre-adoption history. The marker is also **transient
  by design**: the moment `convert` hands an artifact to rigor-uplift, the artifact is
  re-authored and earns a real `provenance_values` member, dissolving the import marker. So
  it never becomes a durable taxonomy member and does not belong in the canonical catalog.
  Consequence: **no ARD bump, no re-vendor, no dual-pin move** — the marker is `convert`-skill
  frontmatter. Lint-compatible as-is: `lint-citations.py` presence-checks `provenance` but
  does **not** enum-gate its value (it only special-cases the literal `source-direct`), so a
  plugin-local value passes. Open *nicety* for design: overload the `provenance:` field vs. a
  separate `import_origin:`-style key — a field-choice detail, not a framework change.

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
6. **Report** — emit a migration report; hand each mapped `inferred-from-legacy` artifact to
   the **refresh-entry** (`feature-agentic-research-refresh-entry`) for per-artifact
   citation/attestation parity, with `lint-citations.py` as the conformance check.

Net effect: `convert` (locate + scaffold + map) → refresh-entry per artifact (re-author to ARD
rigor) → lint (verify). The refresh *vocabulary + discipline* are vendored (ARD v0.6.0); the
refresh-entry sibling supplies the orchestration walk; this feature is the legacy front half.

## Design decisions

- **One skill, bootstrap/sync auto-detect** (mirrors agile-workflow `convert`). Plain
  `convert` inspects repo state and auto-routes: no `.research/` → bootstrap (scaffold
  CONVENTIONS + path map + per-corpus INDEX); present → sync/validate. Single entry, internally
  phased. Chosen over split discover+scaffold for fewer surfaces and fidelity to the named
  reference model.
- **Operator-confirmed tier mapping, preserve-only default.** Heuristics *propose* a
  per-artifact tier mapping; the operator confirms/edits in one batched question before any
  write. Content-integrity gate (block-level preservation manifest) before any destructive op;
  reference-integrity on move. Chosen over auto-classify-high-confidence because the `.research/`
  substrate is durable and misclassification there is costly — the safe posture matches
  agile-workflow convert.

## Linkage & sequencing

- Parent epic: `epic-agentic-research-reengagement`. This feature is the **legacy front-half**;
  it depends on the shared `feature-agentic-research-refresh-entry` doorway and is a sibling of
  `feature-agentic-research-native-refresh` (the ARD-native front-half).
- Not under the now-done `epic-agentic-research` adoption epic — that epic shipped; this is new
  post-adoption capability. ARD v0.6.0 is vendored (PR #20), so the refresh vocabulary/discipline
  exist; the refresh-entry sibling adds the orchestration walk convert hands off to.
- Reference model: `plugins/agile-workflow/skills/convert/SKILL.md` (discovery sweep →
  classify → content-integrity gate → route & import → reference-integrity → preserve-only).

## Open questions for design

(The two original open questions are now resolved — see §Design decisions. The former third
question, whether `inferred-from-legacy` needs an ARD catalogs/schema addition, is also resolved:
it's a plugin-local import marker, not an ARD value — see §Strategic decisions. The only residual
is the field-choice nicety: overload `provenance:` vs. a separate `import_origin:`-style key.)

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
  `generated-listing`, `hybrid-curated` — all describing authoring relationship at substrate
  entry. The proposed marker is **net-new**, and the call is **settled as plugin-local** (see
  §Strategic decisions): ARD is agnostic about pre-adoption provenance, the marker is transient
  (rigor-uplift overwrites it with a real value), and `lint-citations.py` presence-checks but
  does not enum-gate `provenance` (only the literal `source-direct` is special-cased, lint
  lines 348/427), so a plugin-local value passes without an ARD change.
