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
updated: 2026-06-24
---

# Absorb ARD into the agentic-research plugin — skills half (scaffold `ard-core/`, collapse vendoring)

## Brief

Execute the **skills-repo half** of the ARD absorption: stand up
`plugins/agentic-research/ard-core/` as the single source of truth for the
Agentic Research Discipline, collapse the byte-vendoring machinery (3 discipline
copies → 1; `ard-sync.py` + the dual-pin retired), and reframe the plugin's
identity to empirical-first.

This is the mirror of root's `epic-ard-absorption` (the root-half tracker:
submodule removal, monorepo ref sweep, the 5 root `.work/` ARD items). We run
the skills half **here** for the correct harness, plugins, and repo discipline.
The two halves coordinate by explicit link.

## Decision + warrant (settled)

- **Root decision note:** `2026-06-24-ard-absorption-decision` (in the SNC root
  repo's `.memory/sessions/`) — three-way deliberation (HITL + Claude + Codex)
  → **absorb**; external/cross-agent publication judged effectively dead, so the
  separate-repo / dual-pin / byte-vendor ceremony earns nothing.
- **Root-half tracker:** `epic-ard-absorption` in the SNC root `.work/active/epics/`.

The empirical *practice → observe → improve* loop was always ARD's engine; the
philosophical-theory port froze at v0.1 while the framework grew six versions on
empirical pressure. Absorbing collapses the distillation/warrant gap: one source
of truth, co-located with the practice that generates it, empirically warranted.

## Target shape (skills half)

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
**Reframed:** empirical-first identity — ARD = a periodically-distilled snapshot
of practice, theory opt-in. Plugin semver decouples cleanly (it already is; the
`adopts` pin just goes away).

## Settled kickoff sub-decisions (this half)

1. **Theory-position port → PORT ALL 10 NOW.** `ard-core/theory/` ships complete
   at scaffold; nothing theory-side depends on the archived `ard/` repo's
   history. (Rejected: lazy/on-touch port — chosen against because port-all
   makes `ard-core/` fully self-contained for a small one-time cost, and the
   operator preferred not to leave un-touched positions stranded in archived
   history.)
2. **Evidence ledger → SEED v0.7 GROUNDING + SCHEMA NOW.** Stand up the ledger
   format (recurrence · deployment · observed behavior · mitigation ·
   verification) and seed it with v0.7's grounding already captured in the
   session notes + COMMITMENTS: AQ.4 (abandonment lit), GR.9/metadata (DOI
   accuracy), cross-model (correlated errors), decision-relevance (VOI), PR.3
   (class-complete sweep). The primary warrant tier ships as a working artifact.

The two root-half sub-decisions (published `ard/` repo fate → archive-with-pointer;
post-absorption versioning → internal snapshot `v0.x` decoupled from plugin semver)
belong to the root epic.

## Seed: v0.7.0 ARD content

`ard-core` is seeded from ARD `main` at `b1dc0f3` (the v0.7.0 4-pass-consensus
state, merged to ARD `main` local fast-forward). The v0.7.0 revendor is
**subsumed** by this migration — no separate ARD tag/release, no separate
revendor pass. The content moves in as the `ard-core/` seed.

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

- The skills repo's `epic-agentic-research` (currently `review`) is the sibling
  context — the plugin this epic restructures. Coordinate against it; do not
  reopen its closed children.
- Root-half (`epic-ard-absorption`) and this half share the absorption; neither
  is "done" until both land + the final cross-model loop passes.

## Decomposition

Split by **migration stage**, not by file-layer — each feature is a coherent,
independently-mergeable step that keeps `main` green. The spine is a critical
path (scaffold → repoint → cleanup → ship); `evidence-ledger` branches off the
scaffold in parallel. Five features (the evidence-ledger split out of the
scaffold on the peer's sizing read — it is synthesis, not file moves).

A decomposition-time discovery widened the scaffold beyond the epic's stated
"target shape": `catalogs.json` is **generated** from `CATALOGS.md` (repo root)
by `gen-contract.py`, and plugin prose pervasively cites `ARD SPEC §N` — so a
true single-source `ard-core/` needs `CATALOGS.md` + `SPEC.md` + `gen-contract.py`,
not just `catalogs.{md,json}`. **Resolved (cross-model consensus): carry all
three** — `SPEC.md` resolves the `§` references post-submodule, the generator
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
- Peer caveat: it could not inspect the `b1dc0f3` ARD source tree (submodule absent
  in the skills checkout) — the scaffold feature's implementor reads it from the
  root repo's `ard/` submodule.

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
carries forward: no pass could inspect the `b1dc0f3` ARD source tree (submodule
absent in the skills checkout) — the scaffold implementor validates the file
inventory against the root repo's `ard/` submodule at implementation time.

## Revisit if

A real second adopter / non-Claude harness genuinely needs independent pinning →
**re-extract `ard-core/` to a standalone repo** (the structure keeps this
extract-on-demand, not a rebuild). This escape hatch is the reason "absorb" was
a safe call over the more conservative "keep-separate diet."

## Epic completion (2026-06-25)

**Skills-half COMPLETE.** All 5 features done; each ran the operator's
loop-to-consensus policy (design loop + implementation loop, cross-model Codex).

**Epic-level final cross-model loop** (Codex high-effort, session `…75fc2f389500`):
holistic whole-migration coherence review (discipline-travel end-to-end,
empirical-first coherence, SSOT integrity, cross-cutting consistency, bump-readiness).
**Verdict: no blockers — coherent and bump-ready.** The pass made 6 coherence fixes
(committed `…405604f`, lead-reviewed + gate-re-verified): theory/README states it's
not the primary warrant tier (empirical-first made explicit); dispatch.md +
acquisitions.md + research-handoff aligned on registration-persistence-is-a-deployment-choice
(resolving the pre-existing dispatch.md inconsistency); orchestrator "Claude agent
system" → "portable agent-skill system" (three-channel); ard-core README
diff-clean → extractable framing.

**Shipped:** `bump-version.sh agentic-research minor` → **v0.6.0** (0.5.0→0.6.0,
minor per operator: operator surface intact via the lint shim; the one
ard.json-reader-breaking change noted in VERSIONING.md). Rebased onto origin/main
(clean — remote had only unrelated zai-research work) and **pushed** (`67dc38e`).
Post-bump research-view binary CI refresh is the standing release-pipeline step
(pre-existing, not absorption-scoped).

**Hands off to the root-half** (`epic-ard-absorption` in the SNC monorepo):
remove the `ard/` submodule, sweep the monorepo `ard/` references, update the 5
root `.work/` ARD items, archive the published `ard/` repo with a pointer. The
`ard/` source tree stays available until the root-half runs (the skills-half read
its `b1dc0f3` seed from it).
