---
id: handoff-emission-must-cover-synthesis-corrections
created: 2026-06-15
tags: [research, documentation]
---

# Arrow-2 emission must enumerate ALL parent.md corrected positions, not just claims-delta rows

## The gap (mechanism side)

The `.research/` → `.work/` emission (Arrow 2: `docs/HANDOFF.md` + the
`research-handoff` skill) can emit an "apply the claims-delta back into the
originating artifacts" item that **under-scopes**: it covers the per-facet
`## Claims-delta` rows but misses synthesis-tier corrections that live in the
campaign `parent.md` as coded findings (C1, C2, …) and are NOT a row in any
`specialists/<facet>.md` claims-delta table.

When that apply item is the only thing responsible for landing corrections, the
synthesis-tier corrections never reach the artifacts they correct — the research
record is right, the downstream artifact stays wrong.

## Evidence (the reproduction)

Surfaced on the silas `parallel-commit-lane-rigor-uplift` campaign (consumer
project, PR nklisch/silas#30). The campaign `parent.md` C2 correctly diagnosed a
load-bearing order-key error in the target briefs (verified against code, exact
fix named); C7 flagged an over-strong latency claim. Neither reached the brief
bodies: the `apply-claims-delta` item scoped itself to the source-binding delta
and explicitly excluded the C-codes ("NOT in the source-binding delta — honoring
apply-only-source-bound-corrections"). No emitted item owned C2/C7. Two human
reviewers caught them post-hoc.

Not an orchestrator bug: the orchestrator produced a correct `.research/`
deliverable and both verification gates (which evaluate the synthesis, not
downstream reconciliation) rightly APPROVED. The hole is in the emission/apply
contract, which this plugin owns (HANDOFF:155-156 — "owned here … deliberately
not an ARD" concern).

## Proposed fix (mechanism)

1. **Emission enumerates the full corrected set.** When `research-handoff` emits
   an apply-style item from a campaign, the item's scope must enumerate ALL
   corrected positions in `parent.md` — both the per-facet claims-delta rows AND
   the synthesis-tier coded findings (the C-codes / "Corrected" prose bullets) —
   not just the claims-delta table. Where a campaign separates the two tiers, the
   emission must walk both.
2. **Acceptance requires a downstream-reconciliation cross-check.** The emitted
   apply item's acceptance criteria must require verifying that each enumerated
   corrected position is reflected in the artifact it corrects (a
   `parent.md` → target-artifact completeness pass), and that the review of that
   item performs the cross-check (the netcode pilot's apply review did this and
   did not leak; parallel-commit's did not and leaked).

Update surfaces: `docs/HANDOFF.md` (Arrow 2 emission contract) and the
`research-handoff` skill (the item template it writes).

## Upstream dependency (ARD obligation)

This mechanism satisfies an architecture-tier *obligation* that belongs in ARD,
not here: a correction is not discharged until it is reflected in the artifact it
corrects (a downstream-reconciliation obligation). **That ARD obligation has now
landed in ARD v0.6.0** — the `PR.3` non-propagated-correction shape (catalogs),
the SPEC §4.8 downstream-reconciliation obligation, and discipline §8
(corrections vs reversals). It was authored as the SNC-monorepo ARD work
`feature-ard-downstream-reconciliation-fence` (done) under the
`epic-ard-reengagement-correction-propagation` epic — the original
`ard-pr-locus-correction-reconciliation-fence` working title was promoted into
that feature. The dual-pin has moved with it: the agentic-research plugin now
pins `ard.json` adopts.version 0.6.0. This item's mechanism should cite the ARD
§4.8 obligation it implements.

This is the second observed instance of the propagation class in the rigor-uplift
loop — systemic, not a one-off.
