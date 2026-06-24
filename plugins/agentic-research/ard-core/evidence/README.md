# `ard-core/evidence/` — the empirical failure ledger

This is the **primary warrant tier** for the Agentic Research Discipline as
absorbed into the `agentic-research` plugin. Under the empirical-first model, ARD's
disciplines are justified by *observed recurring failures and the mitigations that
fixed them* — not by theory-as-genesis. The theory positions in
[`../theory/`](../theory/) are opt-in archaeology (vocabulary, guardrails,
stress-testing); the warrant lives here.

## Why this tier is primary

ARD's real engine was always the empirical *practice → observe → improve* loop.
The philosophical-theory port froze at v0.1 while the framework grew six versions
on empirical pressure. Co-locating the ledger with the practice that generates it
closes the distillation/warrant gap the separate-framework model manufactured.

## Ledger entry shape

Each entry in [`ledger.md`](ledger.md) records one observed failure cluster and the
discipline it warrants, in five fields:

| Field | Meaning |
|---|---|
| **recurrence count** | how many distinct times the failure was observed (1 = forward-looking single-cluster; ≥2 = recurring) |
| **deployment** | where it was observed (the engagement / arc / system) |
| **observed behavior** | what actually went wrong, concretely — the failure as seen, not the abstraction |
| **mitigation** | the discipline / shape / fence introduced in response |
| **verification result** | how the mitigation was confirmed to address the failure (gate, re-engagement, peer pass) |

## Authoring discipline

Entries honor the research-discipline (`../kernel/discipline.md`):

- **Source-bound.** External grounding cited via `[handle]{N}` against the
  attestation tier; no recall-filled metadata (URL/DOI/date read off the source).
- **Observed, not asserted.** "observed behavior" is what happened in a real
  deployment — if a cluster is forward-looking (one occurrence, promoted on
  anticipated recurrence), mark it so explicitly rather than inflating the count.
- **Mitigation maps to a discipline.** Each entry names the SPEC/CATALOGS shape or
  fence it warrants, so the ledger and the framework stay mutually traceable.

## Status

Schema/shape landed by the scaffold feature. The v0.7 grounding entries (AQ.4,
GR.9/metadata, cross-model verification, decision-relevance/VOI, PR.3
class-complete-sweep) are seeded by the sibling `evidence-ledger` feature.
