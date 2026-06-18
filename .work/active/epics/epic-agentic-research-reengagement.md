---
id: epic-agentic-research-reengagement
kind: epic
stage: review
tags: [skill, tooling]
parent: null
depends_on: []
release_binding: null
gate_origin: null
created: 2026-06-18
updated: 2026-06-18
---

# Re-engaging research artifacts — legacy import + ARD-native refresh on a shared primitive

## Brief

Re-engagement — re-authoring a research artifact that already exists, over revised
substrate — is **two distinct lineages** that share one orchestration primitive but
differ in input precondition and trigger:

1. **Legacy import (adoption-triggered).** The prior artifact was authored *outside* ARD:
   no citations, no attestations, `inferred-from-legacy` provenance. Re-authoring must
   *establish* a citation chain that never existed. Front-half: a discovery sweep that
   locates foreign research and scaffolds the `.research/` substrate to hold it (the
   `convert`/`bootstrap` capability).
2. **ARD-native refresh/enrichment (drift-triggered).** The prior artifact *was* authored
   under ARD — it already has a clean citation chain and attestations — but its substrate
   has gone stale, or new acquisitions should be folded in. Re-authoring *extends and
   revalidates* an existing chain. Front-half triggers already exist in the plugin: the
   acquisition offgas (`templates/acquisitions.md`, the `Completes:` join "acquired source
   → exactly these held claims to re-engage"), the `enriching` proactive lookout, and the
   `AQ.2 substrate-check` staleness-diff fence.

Both lineages converge on the **same net-new orchestration primitive**: an
orchestrator entry that accepts a *prior artifact* as input, registers the `refresh`
change-mode + `supersedes-prior` temporal_contract, treats the prior artifact as a
**LENS, not substrate** (ARD SPEC §4.6 — the anti-fabrication guard against laundering
the old artifact's claims into the new one), and re-authors over current sources. That
primitive is the lynchpin; the two front-halves are siblings on top of it.

## Why this is an epic, not a feature

The convert/bootstrap idea (the legacy front-half) was scoped first as a standalone
feature. Grounding revealed it is **not** the root: it hands each imported artifact to a
rigor-uplift pass, and that re-authoring doorway does not exist in the plugin yet. The
*vocabulary and discipline* for refresh shipped with the v0.4.0 → ARD v0.6.0 sync
(`research-discipline/SKILL.md:99` defines Refresh; `templates/dispatch.md` +
`catalogs.json` carry `supersedes-prior` / `re-engage-on-trigger`), but the
**orchestration walk** for it did not — the `research-orchestrator` is written for *fresh*
engagements (zero references to a prior artifact / lens / re-author / uplift). So the
doorway is shared net-new work, and convert is one consumer of it, not its owner. Naming
the ARD-native refresh lineage (continuous source drift + the existing acquisition
machinery) makes the second consumer explicit and confirms the shared-primitive shape.

## Decomposition (realized at scope; epic-design validates and refines)

Three children. The refresh-entry primitive is the dependency root; both front-halves
build on it.

- `feature-agentic-research-refresh-entry` `[skill]` — **the lynchpin.** Add the
  prior-artifact-as-LENS re-authoring entry to `research-orchestrator`: accept a prior
  artifact as input, register `refresh` + `supersedes-prior`, apply LENS-not-substrate
  (SPEC §4.6), re-author over current sources. The anti-fabrication care lives here —
  getting §4.6 right is the whole point. — depends_on: `[]`
- `feature-agentic-research-convert-bootstrap` `[skill, tooling]` — **legacy front-half**
  (re-parented from top-level). Discovery sweep → bootstrap-or-sync auto-detect → scaffold
  `.research/` → operator-confirmed tier mapping → content-integrity gate → migration
  report → hand each `inferred-from-legacy` artifact to the refresh-entry. Modeled on
  agile-workflow's `convert`. — depends_on: `[feature-agentic-research-refresh-entry]`
- `feature-agentic-research-native-refresh` `[skill]` — **ARD-native front-half.** Wire the
  existing acquisition/staleness machinery (the `Completes:` join, the `enriching` lookout,
  `AQ.2 substrate-check`) to drive the refresh-entry: when acquisitions land or substrate
  goes stale, re-engage the held claims they complete. — depends_on:
  `[feature-agentic-research-refresh-entry]`

## Decomposition risks

- **refresh-entry is the lynchpin and the anti-fabrication surface.** LENS-not-substrate
  (SPEC §4.6) is the guard that keeps a refresh from citing the old artifact as if it were
  a source. Both front-halves inherit this; an error there propagates to both lineages.
  Design it first, with adversarial care.
- **Legacy vs native diverge at the citation precondition.** Legacy artifacts have *no*
  chain to extend (establish-from-scratch); native artifacts have a clean chain to
  *revalidate/extend*. The shared primitive must handle both input states — confirm the
  entry's contract covers "no prior chain" and "existing chain" without special-casing
  that splits the primitive.
- **Native-refresh reuses existing seams, doesn't rebuild them.** The acquisition offgas,
  `Completes:` join, `enriching` lookout, and `AQ.2` staleness-diff already exist
  (`templates/acquisitions.md`, `catalogs.json`). native-refresh *wires* them to the
  refresh-entry; it must not re-implement the triggers.

## Grounding notes (scope-time, verified against the plugin)

- **Refresh vocabulary + discipline ARE vendored** (v0.4.0 → ARD v0.6.0): `research-discipline/SKILL.md:99`
  ("Refresh — re-authors the whole artifact in place over revised substrate; position-agnostic");
  `templates/dispatch.md:12` (`supersedes-prior`, `re-engage-on-trigger`); `catalogs.json` carries the
  registration enums.
- **The orchestration walk is NOT wired**: `research-orchestrator/SKILL.md` has zero references to a
  prior artifact / lens / re-author / uplift — it discovers topology from a *seed* (fresh engagement).
- **The ARD-native triggers already exist**: `templates/acquisitions.md` defines the offgas, the
  `Completes:` flow-back join, and the `enriching`/`blocking` urgency split; `catalogs.json`
  decision_points include `substrate-check` (the AQ.2 staleness-diff) and `reconcile`. Acquisitions
  already promote into the `research-acquisition-queue` `.work/` backlog item, operator-confirmed.
- **`inferred-from-legacy` is plugin-local, not an ARD provenance value** (settled on the convert
  feature): ARD's `provenance_values` describe authoring-relationship-at-substrate-entry; pre-adoption
  history is below ARD's line. `lint-citations.py` presence-checks but does not enum-gate provenance,
  so the marker passes without an ARD change.

## Foundation impact

No foundation-doc roll-forward at scope time. This is plugin-internal capability work
(orchestrator skill + two front-half skills) inside the existing `agentic-research`
plugin and `.research/` tier — no new architectural boundary at the repo's `docs/` level.
The plugin's own `docs/` (ADOPTION.md, ARCHITECTURE.md, HANDOFF.md) may gain a
re-engagement note during implementation, owned by the relevant child feature.

## Epic-design note (2026-06-18)

Decomposition pre-existed — the three child features were created during the scope pass
with operator-confirmed shape (the 3-child fork: lynchpin + two front-halves), full briefs,
and declared `depends_on` chains. Epic-design **validated** rather than re-derived:

- All 3 children parent correctly to this epic; no capability gap relative to the brief
  (lynchpin `refresh-entry` + legacy `convert-bootstrap` + ARD-native `native-refresh`
  covers the full re-engagement surface).
- Dependency graph verified acyclic (`work-view --blocking`): `refresh-entry` is the root
  (`depends_on []`); both front-halves depend on it. Critical path is intentional — the
  shared primitive must land before either consumer, which is the point of the shape.
- 3 children (within the 2-6 range); no `[refactor]`/`[perf]` tags to propagate; no UI
  surface (all skill/orchestration work), so no mockup tier applies.

Advanced `drafting → implementing`. Children are at `stage: drafting`, ready for the
feature-design family — `refresh-entry` first (the lynchpin and anti-fabrication surface).

## Children complete (2026-06-18)

All 3 child features are `done`. Each was designed, implemented, and cross-model reviewed
(GPT-5.5 via peeragent / a local fresh-context sub-agent for the lynchpin):

- **`refresh-entry`** (the lynchpin) — the prior-artifact-as-LENS re-authoring mode on
  `research-orchestrator`. Two review passes caught the lint-is-not-a-backstop gap + the
  known-lens update rule; both fixed.
- **`convert-bootstrap`** — the legacy front-half (`agentic-research:convert` skill). Design
  peer-review reshaped the material-routing model (raw-vs-synthesis split, holding-area, retained
  lens); implementation review caught a validator nit.
- **`native-refresh`** — the ARD-native front-half (`scripts/refresh-scan.py`, a lint-shaped
  detector). Design peer-review (4 blockers) reshaped it onto the one machine-resolvable join
  (`source_handle`); implementation review (3 blockers) caught a `fetched`-parse bug, a
  bibliographic-source misclassification, and a not-actually-offline test (false-green only the
  reviewer's no-DNS env surfaced).

The shared `refresh-entry` doorway + the two front-halves give the full re-engagement surface:
legacy import (authored outside ARD) and ARD-native refresh/enrichment (drift + acquisition drain),
both re-authoring through one anti-fabrication-fenced primitive. Advanced `implementing → review`;
ready for `/agile-workflow:release-deploy` or epic review.
