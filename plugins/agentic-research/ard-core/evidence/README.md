# `ard-core/evidence/` — the empirical failure ledger

This is the **primary warrant tier** for the Agentic Research Discipline. ARD's
disciplines are warranted by observed recurring failures and the mitigations that
address them. The theory positions in [`../theory/`](../theory/) provide
supplementary vocabulary, guardrails, and stress tests; the warrant lives here.

## Ledger entry shape

Each entry in [`ledger.md`](ledger.md) records one observed failure cluster and the
discipline it warrants, in five fields, **plus a required `grounding` line**. The
five fields describe the *failure cluster*; `grounding` is metadata-about-the-entry
— the warrant it rests on. When the warrant is external, it is cited as `[handle]{N}`
resolving against the bibliography/attestation tier; when the warrant is
**deployment-grounded** (an observed-in-practice failure with no external tradition,
e.g. `PR.3`), the line says so explicitly instead of carrying a citation. A
`grounding` line never cites an analytical artifact like `theory/COMMITMENTS.md`
(per the lens-not-substrate discipline) — COMMITMENTS is re-render provenance, not
warrant.

| Field | Meaning |
|---|---|
| **recurrence count** | how many distinct times the failure was observed (1 = forward-looking single-cluster; ≥2 = recurring) |
| **deployment** | where it was observed (the engagement / arc / system) |
| **observed behavior** | what actually went wrong, concretely — the failure as seen, not the abstraction |
| **mitigation** | the discipline / shape / fence introduced in response |
| **verification result** | how the mitigation was confirmed to address the failure (gate, re-engagement, peer pass) |
| **grounding** *(accompanying line)* | the warrant. External warrant → `[handle]{N}` citations resolving against the bibliography/attestation tier, with a confidence marker where the engagement was `search-summary` rather than source-direct. Deployment-grounded warrant (no external tradition) → say so explicitly, no citation. Not one of the five failure-fields; required nonetheless. |

## Authoring discipline

Entries honor the research-discipline (`../kernel/discipline.md`):

- **Source-bound.** External grounding cited via `[handle]{N}` against the
  bibliography/attestation tier; no recall-filled metadata (URL/DOI/date read off
  the source). Carry the engagement's substrate confidence honestly — a
  `search-summary` grounding (abstract / landing-page) is not presented as
  source-direct.
- **Observed, not asserted.** "observed behavior" is what happened in a real
  deployment — if a cluster is forward-looking (one occurrence, promoted on
  anticipated recurrence), mark it so explicitly rather than inflating the count.
- **Mitigation maps to a discipline.** Each entry names the SPEC/CATALOGS shape or
  fence it warrants, so the ledger and the framework stay mutually traceable.

## Status

The ledger includes the v0.7 grounding entries for AQ.4, GR.9/metadata,
cross-model verification, decision-relevance/VOI, and PR.3
class-complete-sweep.
