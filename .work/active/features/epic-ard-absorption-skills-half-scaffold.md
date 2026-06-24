---
id: epic-ard-absorption-skills-half-scaffold
kind: feature
stage: drafting
tags: [plugin]
parent: epic-ard-absorption-skills-half
depends_on: []
release_binding: null
gate_origin: null
created: 2026-06-24
updated: 2026-06-24
---

# Scaffold `ard-core/` — seed the single source of truth from v0.7.0

## Brief

Create `plugins/agentic-research/ard-core/` and seed it with the v0.7.0 ARD
content as the plugin's internal, single-source-of-truth discipline. This is the
foundation feature — F2 (vendoring collapse) and F3 (sync-drop + reframe) both
build on the `ard-core/` layout this lands.

At the end of this feature, `ard-core/` exists and is self-contained, but the
plugin's skills/scripts/docs **still point at the old vendored paths** — nothing
references `ard-core/` yet (that repointing is F2). The old `scripts/`-vendored
copies still exist (removed in F2). Conformance must stay green throughout (see
below).

## What lands in `ard-core/`

Seeded from ARD `main` at `b1dc0f3` (the v0.7.0 4-pass-consensus state). The
v0.7.0 revendor is **subsumed** — no separate ARD release.

- `ard-core/discipline.md` — from `ard/kernel/discipline.md` (kernel canonical).
- `ard-core/catalogs.json` — the generated machine surface (from `ard/kernel/catalogs.json`).
- `ard-core/lint-citations.py` — from `ard/kernel/lint-citations.py`.
- `ard-core/templates/` — `attestation.md`, `precis.md`, `INDEX.md`, `dispatch.md`.
- `ard-core/schema/attestation.schema.json`.
- `ard-core/conformance/` — `run.py`, `expected.json`, fixtures (`attestation/`, `analysis/`, `briefs/`).
- `ard-core/theory/` — **all 11 positions** ported from `ard/.research/positions/`
  (settled: port-all-now, not lazy), plus the theory infrastructure
  (`COMMITMENTS.md`, `references.md`, `README.md` from `ard/.research/`).
- `ard-core/evidence/` — the directory + ledger **schema/README** only. The
  v0.7-grounding **seed entries are NOT in this feature** — they are real
  synthesis (porting AQ.4, GR.9/metadata, cross-model, decision-relevance, PR.3
  from session notes + COMMITMENTS into a structured ledger), split into the
  sibling `epic-ard-absorption-skills-half-evidence-ledger` (peer-confirmed
  sizing). This feature lands the empty-but-shaped tier; the sibling fills it.

## Scope discovery — the canonical-vs-derived chain (beyond the epic's stated shape)

The epic's "target shape" listed `catalogs.{md,json}` but the real dependency
chain is larger. Verified during decomposition:

- **`scripts/catalogs.json` is GENERATED** from `CATALOGS.md` by
  `ard/tools/gen-contract.py` (its `_comment` says so). `CATALOGS.md` lives at
  the **`ard/` repo root**, not in `kernel/`. For `ard-core/` to be a true SSOT
  that can regenerate (not carry a frozen blob), it needs `CATALOGS.md` +
  `gen-contract.py`.
- **Plugin prose pervasively cross-references `ARD SPEC §N`** (README, ADOPTION,
  templates, schema, conformance README, orchestrator references). Those `§`
  pointers resolve via the submodule today; once it's gone they **dangle**
  unless `ard-core/` carries `SPEC.md`.
- `ard/tools/meta-fences.py` is the verbatim meta-fence (`ARD-Version:` stamping)
  — **dropped** in F3, not ported.

**Resolved (cross-model consensus, pass 2): `ard-core/` carries `CATALOGS.md` +
`SPEC.md` + `gen-contract.py`.** Rationale: `SPEC.md` resolves the pervasive
`ARD SPEC §N` prose references after submodule removal; `CATALOGS.md` + the
generator keep `catalogs.json` a *generated* contract (Single Source of Truth /
Generated Contracts principles) rather than a frozen vendored blob under a new
name. **Rejected:** keeping `catalogs.json` as a frozen blob — it only works if
you ALSO rewrite every `ARD SPEC §N` reference away from section citations, which
is more churn and worse provenance (the peer's words, and correct). The design
pass sizes the port (these are ~3 files + the generator) and confirms
`gen-contract.py`'s `ROOT`-relative paths resolve under `ard-core/`.

## Conformance-green invariant (peer-confirmed: F1 keeps conformance green by itself)

`conformance/run.py` uses `HERE`-relative paths — it defaults to the adjacent
`../lint-citations.py` (run.py:54) and `./expected.json`. **Decision (peer-aligned):
COPY, don't move.** This feature copies the kernel surface into `ard-core/` so
both the old `scripts/conformance/` *and* the new `ard-core/conformance/` pass
independently — `main` is never broken. F2 deletes the old `scripts/` copies once
every consumer is repointed. Acceptance for this feature includes:
**`ard-core/conformance/run.py` runs green against `ard-core/lint-citations.py`**
(the copied tree is self-contained) AND the existing `scripts/conformance/` still
passes (baseline is 56/56 per the peer's run — confirm the count at design; the
conformance README says 57, the peer's live run reported 56 — reconcile).

## Epic context

- Parent epic: `epic-ard-absorption-skills-half`
- Position in epic: **foundation feature** — F2 and F3 both depend on this layout.

## Foundation references

- Root decision note `2026-06-24-ard-absorption-decision` (warrant).
- `plugins/agentic-research/ard.json` — the current dual-pin/vendor map being retired.
- ARD `b1dc0f3` content under the `ard/` submodule (the seed source).

## Evidence-ledger split (resolved)

The evidence-ledger SEEDING is split into the sibling feature
`epic-ard-absorption-skills-half-evidence-ledger` (depends on this scaffold) per
the peer's sizing read — it is synthesis with schema/entry-quality/validation
implications, not file moves. This feature lands only the directory + ledger
schema/README shape.
