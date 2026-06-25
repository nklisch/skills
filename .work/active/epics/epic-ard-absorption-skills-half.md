---
id: epic-ard-absorption-skills-half
kind: epic
stage: done
tags: [plugin]
parent: null
depends_on: []
release_binding: null
gate_origin: null
created: 2026-06-24
updated: 2026-06-25
---

# Absorb ARD into the agentic-research plugin (scaffold `ard-core/`, collapse vendoring)

## Brief

Stand up `plugins/agentic-research/ard-core/` as the single source of truth for
the Agentic Research Discipline (ARD), collapse the byte-vendoring machinery (3
discipline copies → 1; `ard-sync.py` + the version-pin retired), and reframe the
plugin's identity to empirical-first.

Previously the plugin **vendored** ARD from a separately-published upstream via a
version pin (`ard.json`) + byte copies + a sync script. This epic absorbs ARD into
the plugin: one internal, empirically-warranted source of truth in `ard-core/`,
with no external framework dependency.

## Decision + warrant (settled)

**Absorb.** External/cross-agent publication of ARD as a standalone framework was
judged effectively dead, so the separate-repo / version-pin / byte-vendor ceremony
earns nothing.

The empirical *practice → observe → improve* loop was always ARD's engine; the
philosophical-theory port froze at v0.1 while the framework grew six versions on
empirical pressure. Absorbing collapses the distillation/warrant gap: one source
of truth, co-located with the practice that generates it, empirically warranted.

## Target shape

`plugins/agentic-research/ard-core/` as the single source of truth:

- `ard-core/discipline.md` · `catalogs.{md,json}` · `lint-citations.py` ·
  `templates/` · `schema/` · `conformance/` — the plugin's skills/scripts
  reference these **directly** (no vendoring). The 3 discipline copies
  (kernel + plugin `skills/research-discipline/SKILL.md` + example) collapse to 1.
- `ard-core/evidence/` — the empirical failure ledger
  (recurrence · deployment · observed behavior · mitigation · verification),
  the **primary** warrant tier.
- `ard-core/theory/` — the 10 v0.1 positions.

**Dropped:** `ard-sync.py`, the dual-pin (`ard.json adopts`), the byte-vendor +
the verbatim meta-fence, the `not_yet_vendored`/`vendored_paths` map.
**Reframed:** empirical-first identity — ARD is the plugin's internal discipline,
evidence as the primary warrant, theory supplementary. Plugin semver is the only
version (the `adopts` pin goes away).

## Settled kickoff sub-decisions

1. **Theory-position port → PORT ALL 11 NOW.** `ard-core/theory/` ships complete
   at scaffold; nothing theory-side depends on the prior vendored source. (Rejected:
   lazy/on-touch port — chosen against because port-all makes `ard-core/` fully
   self-contained for a small one-time cost, with no un-touched positions left
   stranded.)
2. **Evidence ledger → SEED v0.7 GROUNDING + SCHEMA NOW.** Stand up the ledger
   format (recurrence · deployment · observed behavior · mitigation ·
   verification) and seed it with the v0.7 grounding already captured in the
   prior ARD trace: AQ.4 (abandonment lit), GR.9/metadata (DOI accuracy),
   cross-model (correlated errors), decision-relevance (VOI), PR.3
   (class-complete sweep). The primary warrant tier ships as a working artifact.

## Seed: v0.7.0 ARD content

`ard-core` is seeded from the ARD v0.7.0 content (the prior vendored upstream's
latest state). That content moves in as the `ard-core/` seed; there is no separate
ARD release or revendor pass — the absorption subsumes it.

## Phases

Decomposed 2026-06-24 — the realized child features and their dependency spine
are in `## Decomposition` below (the authoritative list; this section is no
longer a separate provisional sketch). Five features, not the original
four-phase sketch: the evidence-ledger seeding split out of the scaffold on the
peer's sizing read. Corrections folded from the provisional sketch: **11** theory
positions (not 10); the scaffold stands up the evidence tier **schema/directory
only** (the v0.7 seed is the separate `evidence-ledger` feature); `ard-core/`
also carries `SPEC.md` + `CATALOGS.md` + `gen-contract.py` (SSOT, peer-confirmed).

## Cross-model review policy (this epic)

Per operator: **loop-to-consensus everywhere.** Every feature design AND every
implementation runs the **iterative `peer-review` loop** (`peeragent ... --resume`,
typically 3–5 passes) until the peer returns only nits / no blockers — not a
single advisory pass. A **final cross-model consensus loop** runs on the whole
migrated structure + reframed docs. The decomposition itself was first reviewed
with one advisory pass, then brought to consensus with the loop to match this
policy. Opus peer calls can take 10–30 min/pass; that is expected, not a hang
(Codex passes are faster). Apply accepted findings as follow-up commits between
passes.

**Per-feature done-gate (operator-settled): consensus = done.** A feature whose
implementation reaches cross-model consensus (no blockers) advances straight to
`stage: done` — its consensus loop IS the passed review, so a separate `review`
hold adds nothing and would deadlock the dependency chain (`--ready` requires all
`depends_on` at `done`). The **final cross-model loop** (the epic's task 3) is a
separate *whole-epic* review over the migrated structure + reframed docs; if it
finds issues it files new items (the normal gate pattern), it does not hold every
feature at `review`. Matches how the sibling `epic-agentic-research` features
terminated at `done`.

## Coordination

- The `epic-agentic-research` epic is the sibling context — the same plugin this
  epic restructures. Coordinate against it; do not reopen its closed children.

## Decomposition

Split by **migration stage**, not by file-layer — each feature is a coherent,
independently-mergeable step that keeps `main` green. The spine is a critical
path (scaffold → repoint → cleanup → ship); `evidence-ledger` branches off the
scaffold in parallel. Five features (the evidence-ledger split out of the
scaffold on the peer's sizing read — it is synthesis, not file moves).

A decomposition-time discovery widened the scaffold beyond the epic's stated
"target shape": `catalogs.json` is **generated** from `CATALOGS.md` by
`gen-contract.py`, and plugin prose pervasively cites `ARD SPEC §N` — so a
true single-source `ard-core/` needs `CATALOGS.md` + `SPEC.md` + `gen-contract.py`,
not just `catalogs.{md,json}`. **Resolved (cross-model consensus): carry all
three** — `SPEC.md` resolves the `§` references once the external source is gone, the generator
keeps `catalogs.json` a generated contract rather than a frozen blob. The cheaper
frozen-blob option was rejected (it requires rewriting every `§` reference —
more churn, worse provenance).

### Child features

- `epic-ard-absorption-skills-half-scaffold` — create `ard-core/`, copy the
  v0.7.0 kernel surface in (conformance stays green by copy-not-move), port all
  11 theory positions, stand up the empty evidence tier + schema — depends on: `[]`
- `epic-ard-absorption-skills-half-evidence-ledger` — seed `ard-core/evidence/`
  with the v0.7 grounding as structured ledger entries (the primary warrant
  tier; real synthesis) — depends on: `[scaffold]`
- `epic-ard-absorption-skills-half-collapse-vendoring` — repoint every plugin
  consumer (skills, `refresh-scan.py` import, conformance, templates) at
  `ard-core/`; collapse the 3 discipline copies to 1 + update the orchestrator's
  inline contract; keep a `scripts/lint-citations.py` compat shim; remove the
  duplicate vendored copies — depends on: `[scaffold]`
- `epic-ard-absorption-skills-half-drop-sync-reframe` — delete `ard-sync.py` +
  test, strip the `ard.json` dual-pin, drop the meta-fence, reframe README +
  docs + channel manifests + marketplace to empirical-first (name rejected path +
  escape hatch inline) — depends on: `[collapse-vendoring, evidence-ledger]`
  (the docs name `evidence/` the primary warrant tier, so the seed must exist
  first — peer pass-2 blocker)
- `epic-ard-absorption-skills-half-conformance-bump` — conformance against the
  absorbed layout + channel-metadata sanity + public-path smoke checks (compat
  shim, `refresh-scan.py`) + version bump (minor, contingent on the compat shim)
  — depends on: `[collapse-vendoring, drop-sync-reframe]`

### Decomposition risks

- **Discipline-copy collapse is the subtlest seam.** `research-discipline/SKILL.md`
  is a skill, not a plain kernel file — making it a pointer to `ard-core/discipline.md`
  *requires* updating the orchestrator's inline-into-dispatch contract, or the
  ARD SPEC §5 "discipline must travel" invariant breaks silently. Owned by
  collapse-vendoring with an explicit acceptance check.
- **Public script path.** `scripts/lint-citations.py` is a documented operator
  command; deleting it is a public behavior change forcing a major bump. Mitigated
  by a compat shim (collapse-vendoring) — the whole minor-vs-major calculus hinges
  on it. If the operator prefers a clean break, F4 goes major.
- **Conformance-green windows.** copy-not-move in the scaffold is the mitigation;
  the baseline count needs reconciling (README says 57, peer's live run reported
  56/56 with 26 baseline — confirm the true count at scaffold design and assert
  it; do not pre-bake a number in conformance-bump).
- **Empty-warrant-tier ship (resolved, peer pass-2 blocker).** The docs reframe
  names `ard-core/evidence/` the primary warrant tier — pointing them at an empty
  tier would ship incoherent. Fixed by gating `drop-sync-reframe` on
  `evidence-ledger` (transitively gates the terminal ship path).
- **SSOT scope (resolved).** carrying `SPEC.md` + `CATALOGS.md` + `gen-contract.py`
  into `ard-core/` expands the scaffold but is the right call (cross-model
  consensus). The cheaper frozen-blob alternative was rejected — it needs every
  `§` reference rewritten (more churn, worse provenance).

## Other agent review

A cross-model advisory pass (Codex, high effort, job `20260624T224850Z-f0d501af`)
reviewed the decomposition. Accepted and folded in:
- **Serialize F3 after F2** (shared `ard.json`/README churn) — adopted (edge already set).
- **Split evidence-ledger seeding** out of the scaffold — adopted (new 5th feature).
- **Discipline collapse must update the orchestrator inline contract** + add a
  stale-wording acceptance check — folded into collapse-vendoring.
- **`refresh-scan.py:71` imports the lint by path** — added as a collapse-vendoring consumer.
- **Keep a `scripts/lint-citations.py` compat shim** (public operator command) —
  folded into collapse-vendoring; sets the F4 bump to minor.
- **`templates/acquisitions.md` is not a kernel template (orchestrator SKILL.md:279)**
  — explicit EXCLUDE-from-removal in collapse-vendoring.
- **Channel manifests + `marketplace.json` still say "Adopts ARD v0.6.0" (4 files)**
  — added to the drop-sync-reframe doc-reframe surface.
- Peer's live conformance baseline: **56/56** (reconcile vs the README's 57 at scaffold design).
- Peer caveat: it could not inspect the ARD v0.7.0 source tree directly — the
  scaffold feature's implementor reads it from the prior vendored upstream content.

**Pass 2 (consensus check, same Codex session, job `20260624T225926Z-fba967bc`).**
Reviewed the reconciled 5-feature decomposition. One blocker + SSOT-fork resolution
+ 3 nits, all folded in:
- **BLOCKER — empty-warrant-tier ship:** `conformance-bump` didn't transitively
  depend on `evidence-ledger`, so the docs could name the evidence tier "primary
  warrant" while it shipped empty → added `evidence-ledger` to
  `drop-sync-reframe`'s `depends_on`.
- **SSOT fork resolved → carry `SPEC.md` + `CATALOGS.md` + `gen-contract.py`**
  (cross-model agreement; frozen-blob alternative rejected).
- Nits: don't pre-bake the conformance count in `conformance-bump` (assert the
  reconciled true count); cleaned the stale epic phase prose ("10 positions",
  "schema + v0.7 seed") that contradicted the child features; added public-path
  smoke checks (compat shim, `refresh-scan.py`) to `conformance-bump`.

**Pass 3 (sign-off, job `20260624T230653Z-96b65f40`): "No blockers — consensus."**
The decomposition loop is closed. One residual wording nit (two stale `57`-count
mentions in `conformance-bump`) fixed after sign-off. The standing peer caveat
carries forward: no pass could inspect the ARD v0.7.0 source tree directly — the
scaffold implementor validates the file inventory against the prior vendored
upstream content at implementation time.

## Epic completion (2026-06-25)

**COMPLETE.** All 5 features done; each ran the loop-to-consensus review policy
(design loop + implementation loop, cross-model Codex).

**Epic-level final cross-model loop** (Codex high-effort): holistic whole-migration
coherence review (discipline-travel end-to-end, empirical-first coherence, SSOT
integrity, cross-cutting consistency, bump-readiness). **Verdict: no blockers —
coherent and bump-ready.** The pass made 6 coherence fixes (lead-reviewed +
gate-re-verified): theory/README states it's not the primary warrant tier
(empirical-first made explicit); dispatch.md + acquisitions.md + research-handoff
aligned on registration-persistence-is-a-deployment-choice; orchestrator wording
generalized to a portable agent-skill system (three-channel).

**Shipped:** `bump-version.sh agentic-research minor` → **v0.6.0** (operator surface
intact via the lint shim). Conformance 57/57, gen-check in sync, all gates green.
