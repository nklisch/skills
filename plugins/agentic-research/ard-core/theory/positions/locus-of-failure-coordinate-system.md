---
slug: locus-of-failure-coordinate-system
status: settled
authored: 2026-06-03
provenance: agent-synthesis
temporal_contract: write-once-on-converge
---

# ARD's failure shapes are coordinated by locus of failure, de-anchored from the PIES taxonomy

> Ported research position behind ARD v0.1 — the reasoning trace for a framework commitment; see [../../SPEC.md §2](../../SPEC.md#2-the-failures-ard-addresses) and [../../CATALOGS.md §1](../../CATALOGS.md). The external source it rests on is listed under [§Sources](#sources); the reasoning stands on its own here.

## What this position is about

ARD names its failure shapes in a coordinate system — `GR.1a`, `CX.1`, `PR.2`, and so on. This position records *why that coordinate system is ARD's own, organized by locus of failure*, and why it is **de-anchored** from the external taxonomy ARD's shapes were once numbered within.

## The prior position, and why it did not hold

ARD's shapes were originally numbered inside the **PIES taxonomy** [zhan-pies-ping]{40} — `SE.*` (Summarization-Explicit), `SI.*` (Summarization-Implicit), and an ARD-coined `OP.*` ("Outside-PIES") catch-all for shapes orthogonal to PIES's Explicit/Implicit × Planning/Summarization grid. That borrowing bought literature-legibility at a cost that only surfaced later: the source paper **renamed and reorganized its taxonomy between arXiv versions** — v1 (30 Jan 2026, "PIES") to v2 (23 May 2026, "PING": Propagation · Intent · Noise-induced · Grounding), the v2 cut being *by locus of failure* rather than by the grid [zhan-pies-ping]{40}. An external rename had moved ARD's coordinate ground out from under it. The prior position was to **pin to v1** and note the rename; that holds only for a framework whose coordinate stability is worth more than its coordinate fit — which a pre-adoption v0.1 baseline is not.

## The decision

Coin ARD's own coordinate system, organized by **locus of failure** — *where in the research trajectory the failure lives*. Seven loci, each a locus-encoding two-letter prefix + ordinal, umbrella/sub-shape structure preserved (`GR.1` umbrella; `GR.1a`/`GR.1b` sub-shapes):

| Prefix | Locus | What it is |
|---|---|---|
| `AQ` | Acquisition | what enters the corpus |
| `GR` | Grounding | fidelity to a fetched source |
| `CX` | Context-use | weighting across the retrieved set |
| `CO` | Composition | the cross-source synthesis act |
| `FR` | Framing | the agent's own epistemic posture |
| `PR` | Propagation | multi-step error inheritance across the trajectory |
| `WM` | Warrant/meta | failures of the framework's own warrant |

Retire `SE.*` / `SI.*` / `OP.*` and the "Outside-PIES" catch-all. The published spec ([SPEC §2](../../SPEC.md#2-the-failures-ard-addresses), [CATALOGS §1](../../CATALOGS.md)) presents the loci **clean-room** — on their own terms, with no reference to PIES/PING; the relationship to that external taxonomy is recorded **here in the defensibility trace**, one hop from the spec, for readers who want the archaeology.

## Why locus-of-failure (over the alternatives)

- **Fit.** Every shape places cleanly into a locus, where the PIES borrowing left the majority in an undifferentiated "Outside-PIES" region carrying a literal *doesn't-fit* label. The loci are derived from where the failure lives, so placement is principled rather than residual.
- **Derived, not borrowed.** Each locus comes from ARD's own reproductions and maps onto ARD's verb-set / decision-graph (acquire → ground → use-context → compose), plus two cross-cutting trajectory concerns (framing, propagation) and a reflexive tier (warrant/meta). The codes self-describe their locus — the one genuine virtue of the PIES borrowing, kept.
- **Version-immune.** No external paper can rename ARD's coordinates again — the exact failure this episode exposed. A coordinate system an adopter relies on must not be hostage to a third party's revision.
- **Convergent, not rogue.** PING *independently* adopted a locus-of-failure cut [zhan-pies-ping]{40}. Two frameworks reaching the same organizing principle from different starting points is evidence the cut carves a real joint — and the crosswalk makes the correspondence legible (`GR`↔Grounding, `CX`↔Noise-induced, `PR`↔Propagation). PING's **Intent** axis (agent↔user-intent compliance) has no ARD correspondent; that is a deliberate scoping, parked as an extension candidate, not an oversight.

## What the trace preserves (the crosswalk, relocated here)

The de-anchoring is not a severing of the intellectual debt. ARD engaged the PIES/PING study as external evidence (production hallucination rates across deep-research agents) and once numbered its shapes within PIES's grid; this position records that relationship — the de-anchoring trigger (the v1→v2 rename) and the convergence (PING's independent locus-of-failure cut) — so the reversal stays auditable. The correspondence, for a reader who knows the taxonomy:

| ARD locus | PIES cell (v1) | PING category (v2) |
|---|---|---|
| `GR` Grounding | Explicit Summarization (Misattribution + Fabrication) | Grounding |
| `CX` Context-use | Implicit Summarization / Noise Domination | Noise-induced |
| `PR` Propagation | — | Propagation |
| `AQ` Acquisition · `CO` Composition · `FR` Framing · `WM` Warrant/meta | — | — |

ARD's Grounding family carries PIES's Explicit-Summarization region; `CX`↔PING Noise-induced and `PR`↔PING Propagation are the other overlaps; `AQ` / `CO` / `FR` (and the unpopulated `WM`) extend beyond both. PING's **Intent** axis (agent↔user-intent compliance) has no ARD correspondent. Keeping this correspondence **in the trace rather than the published spec** is the deliberate clean-room choice: the spec stands on ARD's own terms; the archaeology lives here. A future successor taxonomy updates this table; it does not reopen the coordinate system.

## Sources

- **PIES / PING** — Zhan et al., "Why Your Deep Research Agent Fails? On Hallucination Evaluation in Full Research Trajectory" (arXiv:2601.22984), v1 (30 Jan 2026) and v2 (23 May 2026). `[zhan-pies-ping]{40}` in [../references.md](../references.md). The v1→v2 rename + locus-of-failure reorganization is the external fact this position turns on; the convergence argument rests on v2's independent adoption of the same cut.
