---
slug: verification-as-catalog
status: settled
authored: 2026-05-30
provenance: agent-synthesis
temporal_contract: write-once-on-converge
---

# Verification is a catalog; the rigor tiers are profiles over it; scale is a separate control

> Ported research position behind ARD v0.1 — the reasoning trace for a framework commitment; see [../../SPEC.md](../../SPEC.md).

## Position

ARD's verification machinery is **three distinct controls, not one.** Collapsing them into a single rigor setting — one "how thorough?" dial — conflates choices that vary independently and produces configurations that *look* contradictory but are not; separating them dissolves the confusion.

1. **The verification gates are a catalog** (subset-select). `lint` + `spot-check` sit in the **hard floor** — they always fire (the anti-fabrication core). `adversarial-read` + `evaluate` are the genuinely **selectable rigor options**, activated per engagement.
2. **The rigor tiers (`verification_rigor`) are activation-profiles over that catalog** — named subsets of the selectable gates (e.g. a `standard` profile = lint + adversarial-read + spot-check; a `full` profile adds `evaluate`), convenient starting points rather than the sole means of setting rigor. Activating a single gate independently of any profile label ("go custom") is first-class — exactly what the control-space model's asymmetric rigor-adaptivity (escalate scrutiny upward freely; never prune below the floor) licenses.
3. **Scale / fan-out is a separate, scope-class control** — how *wide* the harvest is (how many specialists), not how *hard* the output is verified. It lives next to `decompose` and revisits post-campaign by signal-locality. It is not a rigor setting; the two get conflated only when one label (like "medium") is overloaded to mean both "modest fan-out" and "mid-tier verification."

## Why it matters

When rigor and scale are folded into one dial, a coherent engagement can read as a contradiction at kickoff — e.g. *"this is a small, two-specialist campaign, but I want the full verification catalog including the isolated evaluator."* That reads as a tension only if small scale is assumed to imply light verification. Decomposed into the three controls above, there is none: **scale = modest** (two specialists) and **rigor = `full`** (the whole catalog — the cross-specialist join is what makes the evaluator reachable — escalated upward) are simply two independent settings. The lesson generalizes — any single-dial presentation of verification should be unfolded into gate-catalog + profile + scale, because those are the axes that actually move independently.

## Applicability coupling (the one non-orthogonality)

The `evaluate` gate is activatable only when a cross-synthesis artifact exists — it runs in isolated context *on* that artifact. So scale ↔ rigor are independent **given a multi-path (cross-specialist synthesis) shape**, not fully orthogonal in the degenerate single-agent case. This is itself an instance of shape-relative floor membership (see [reachability-indexed-floor-membership.md](reachability-indexed-floor-membership.md)): the evaluator is out of a single-agent shape's floor because that shape has no synthesis for it to fence.

## Status / scope

This is an **operationalization-tier** finding, not a change to the underlying control-space model: the model already supports verification-as-catalog (it lists adversarial-read jobs + lint categories as controls); the gap is in any *single-dial presentation* of the machinery. The corrective is to surface the three controls (gate-catalog, rigor profiles, scale) distinctly rather than fold them into one rigor enum.

## Revisit if

- A deployment operationalizes verification-as-catalog into its rules + dispatch surface — at that point this position is consumed; mark settled or supersede.
- A verification gate emerges that fits neither the hard-floor nor the selectable-rigor cut — re-examine the catalog membership.

## Revisions

- **2026-06-02** — term-consistency correction: the registration field `calibration_intensity` was renamed `verification_rigor`, and its value enum recut from `single-pass`/`light`/`medium`/`full-stack` to `floor`/`standard`/`full` (named subsets over the gate-catalog). The worked example was reframed off the retired `medium`/`full-stack` labels onto the scale-vs-rigor conflation it actually illustrates — the position's thesis (verification is three distinct controls, not one dial) is unchanged.
