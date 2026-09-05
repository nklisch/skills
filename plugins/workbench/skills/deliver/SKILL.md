---
name: deliver
description: >
  Implement, verify, review, reconcile, and close one ready Workbench feature or story. Use when
  .work/CONVENTIONS.md declares owner: workbench and the item has settled requirements. Supports
  direct delivery and units owned by work, usually in the existing context. Resolve bounded
  technical discoveries without restarting; use work or design for consequential missing scope
  or implementation shape.
---

# Deliver

Finish one ready feature or story. This is the implementation capability inside
[work](../work/SKILL.md)'s continuous flow, and a direct entry point for a named
ready item. It does not add a plan, handoff, worker, or maintenance phase.

## Pick up the outcome, not a new workflow

For direct entry, confirm Workbench ownership and read conventions, project
instructions, the item, relevant foundations, code, tests, and project patterns.
Use the knowledge index for discovery when present. Apply
[version guidance](../setup/references/version-compatibility.md) before mutation.
If the repository is not Workbench-owned, handle the request without this skill.

When the current owner already has this context, reuse it. Check only facts that
are missing or changed. Do not repeat activation, posture resolution, settled
questions, or readiness checks merely because `work` now uses delivery guidance.
A fresh deliverer loads its own governing guidance.

Require one active feature or story with a coherent scope and success shape.
For an unready, blocked, missing, or multi-unit target, use `work` to resolve the
actual gap. A local technical discovery does not make the whole item unready.

- **Direct delivery:** own the item, its shared pattern decisions, appropriate
  integrated review, reconciliation, and closure.
- **Assigned delivery:** `work` supplies the parent outcome, owned write surface,
  integration contract, Git posture, and return evidence. Do not write the shared
  pattern catalog or close the parent. Parentage alone does not imply assignment.

Use [autonomy](../work/references/autonomy.md),
[execution posture](../work/references/execution-posture.md),
[simplification](../work/references/simplification.md), and
[Git posture](../work/references/git-posture.md) as needed. Reuse effective choices
already resolved. Under adaptive execution, compare another context's expected
value with the handoff cost. Quick coherent implementation often benefits more
from continuity. Explicit role preferences still apply.

## Implement and adjust

Work inside the accepted outcome and owned surface. Apply project calibration,
principles, and confirmed patterns without turning them into new requirements.
Mechanical rules belong in tool configuration, operating rules in `AGENTS.md`,
engineering truth in foundations, and recurring shapes in the pattern catalog.

Preserve behavior, guarantees, safety, compatibility obligations, and measured
performance constraints unless a change is authorized. Simplify cohesively rather
than creating conformity churn. Follow the accepted design's assurance choices;
small obvious checks stay local, while consequential new machinery must earn its
cost under [assurance machinery](../work/references/assurance-machinery.md).

When evidence changes the approach, use `work`'s decision distinction: resolve
local details, amend affected technical assumptions and dependent checks, or ask
about missing requirements and authority. Use [design](../design/SKILL.md) for
consequential implementation choices before they become costly to reverse. Review
the affected decision at the configured weight, not every unchanged part of the
plan. Keep independent authorized implementation moving.

If delegation earns its cost, use
[role handoffs](../work/references/role-handoffs.md) with an exact write surface,
checks, integration contract, and return evidence. Follow model alignment for
multiple sub-agents. Do not delegate merely because implementation is a named role.

## Verify, reconcile, and review

Use [verification](../work/references/verification.md): run authoritative project
checks, prove meaningful behavior at stable interfaces, and inspect the final diff
for accidental behavior changes, scope expansion, unnecessary complexity, and
plausible performance regressions. Unresolved required verification prevents closure.

Reconcile directly affected assertions using
[foundation truth](../work/references/foundation-truth.md). Update the knowledge
index when required. For an existing linked provisional spec, use
[provisional specs](../work/references/provisional-specs.md): delete delivered
scope or narrow it to unresolved work before review. Do not leave duplicate
structural authority.

Use [maintenance](../work/references/maintenance.md) only when cleanup or pattern
implications arise. Repair stale patterns on an owned catalog surface. Only an
accepted extraction outcome adds new patterns; optional proposals never block
this item's closure.

Establish a coherent commit range or bounded working-tree diff for review:

- **Feature or standalone story:** apply [review](../work/references/review.md)
  to the integrated code and affected foundations.
- **Story nested under a feature:** verify and self-check the slice, then return
  evidence for the feature's integrated review. Do not duplicate that pass.

Scale review effort and reporting to consequence and uncertainty. A focused
inline pass can satisfy the configured review without claiming independence.
Fresh context is useful when it adds credible challenge, not merely formality.
Verify and adjudicate findings; correct, rerun affected checks, and self-review
without adding passes beyond the review policy.

## Close and report

Close the completed item under [lifecycle](../work/references/lifecycle.md),
reconcile relationships, and validate the resulting ledger. Never close the wider
boundary from an assigned delivery. Follow the effective Git posture without
rewriting shared history or treating squashing as acceptance.

Return delivered behavior, meaningful checks and review, interface assumptions,
foundation changes, pattern implications, limitations, and excluded findings.
Assigned delivery returns that evidence to `work`; direct delivery reports it in
chat with the closure disposition. Neither route creates a completion-report file.
