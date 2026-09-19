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

Use [lifecycle](../work/references/lifecycle.md) when creating, splitting, relating,
or closing items.

## Pick up the outcome, not a new workflow

For direct entry, confirm Workbench ownership and read conventions, project
instructions, the item, relevant foundations, code, tests, and project patterns.
Use the knowledge index for discovery when present.
If the repository is not Workbench-owned, handle the request without this skill.

When the current owner already has this context, reuse it. Check only facts that
are missing or changed. Do not repeat activation, posture resolution, settled
questions, or readiness checks merely because `work` now uses delivery guidance.
A fresh deliverer loads its own governing guidance and reads the owning item,
its design, any linked [design attachments](../work/references/design-attachments.md),
and relevant parent or linked contracts. The work item is the
implementation contract, not the dispatch summary or another agent's memory.
If a consequential decision is missing or conflicts with the assignment, resolve
it in the item before dependent implementation. Continue independent ready work.

Require one active feature or story with a coherent scope and success shape.
For an unready, blocked, missing, or multi-unit target, use `work` to resolve the
actual gap. A local technical discovery does not make the whole item unready.

- **Direct delivery:** own the item, its shared pattern decisions, appropriate
  integrated review, reconciliation, and closure.
- **Assigned delivery:** `work` points to the recorded item contract and supplies
  the parent outcome, owned write surface, review checkpoint and owner, Git posture,
  and return evidence. The briefing supplements the item rather than replaces it.
  Keep features and standalone stories active when review belongs to a later shared
  checkpoint. Verified nested stories may close under their open owning feature.
  Do not write the shared pattern catalog or close the parent. Parentage alone
  does not imply assignment.

Use [autonomy](../work/references/autonomy.md),
[execution posture](../work/references/execution-posture.md),
[simplification](../work/references/simplification.md), and
[Git posture](../work/references/git-posture.md) as needed. Reuse effective choices
already resolved. Delivery stays in the current context under the inline-first
default; review placement follows execution posture. Explicit role preferences
still apply.

## Choose implementation and follow-up

Read this section only when assigning implementation or follow-up to another
context. For inline work with no reassignment, continue at **Implement and adjust**.

Prefer a capable economical initial implementer for a settled contract when that
fits the available, aligned lineup. Keep small or mechanical corrections with it;
give accepted findings as a clear numbered list with evidence, required behavior,
and affected verification. Do not turn every item into a three-agent pipeline or
force a weaker model onto unresolved design work. A user's explicit first-implementer
choice wins over this default. [Model tendencies](../work/references/model-tendencies.md)
informs capability fit, not the delivery procedure.

Recommend stronger reasoning when diagnosis, missed invariants, cross-cutting
coupling, or weak decomposition makes another mechanical correction list
insufficient. The [design assessment](../design/SKILL.md#assess-implementation-difficulty)
may forecast that need before implementation. Conversely, minor findings or a sound
straightforward delivery do not earn a mandatory cleanup stage. Repeated failures
or unsupported verification claims warrant reassessing the assignment and checking
underlying evidence, not endlessly retrying the same brief.

A follow-up is implementation with an explicit owned write boundary. Give it license
to improve clarity and structure under the effective
[simplification posture](../work/references/simplification.md): clearer ownership
and names, simpler control flow, cohesive file splits or consolidation, and removal
of accidental complexity where the payoff is real. It reads the recorded contract
and inspects underlying failure paths, not only numbered findings. Preserve accepted
behavior, guarantees, and measured performance; return unrelated opportunities
separately.

Prefer planned cleanup before the selected implementation review so the reviewer
sees the actual result. After review, corrections may still include cohesive
cleanup; verify and self-check the changed boundary. Follow
[review.md](../work/references/review.md#pass-budget-and-review-targets) for what
counts as a distinct pass, independence, and extra-round authority; a change of
implementer does not itself authorize re-review.

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
consequential implementation choices before they become costly to reverse.
Follow the run's aligned optional design-review approach under
[review boundaries](../work/references/review-boundaries.md). Revisit only affected
decisions when changed evidence warrants it. Keep independent authorized work moving.

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

Commit the candidate and identify its commit or base/head range for review under
[Git posture](../work/references/git-posture.md#stable-review-targets):

- **Feature or standalone story:** apply [review](../work/references/review.md)
  to the integrated code and affected foundations at the chosen checkpoint. Under
  a shared review, return verified work and pending review scope to `work` instead
  of adding a per-item pass. Keep the item active until shared acceptance.
- **Story nested under a feature:** verify and self-check the slice, then return
  evidence for the feature's integrated review, which may itself join a batch.
  Do not duplicate that pass.

Scale review effort and reporting to consequence and uncertainty. Use
[execution posture](../work/references/execution-posture.md) for placement;
a short review is not an exception to the default external implementation pass.
Verify and adjudicate findings; correct, rerun affected checks, and self-review
without adding passes beyond the review policy.

## Close and report

Before returning a delivery, update its item with the delivered result, actual
verification and the committed target, plus anything still pending and who owns
the next checkpoint. Include the item update in the delivery handoff commit so
integrated code carries more than a planning-only item.
Use concise existing prose, not a new status, receipt, or report. If the assigned
write surface excludes the item, return the exact update for the owner to apply
at integration rather than silently omitting it.

Apply the [completion sweep](../work/references/lifecycle.md#completion-sweep)
in this run. Assigned delivery closes only its eligible owned unit, not the wider
boundary. If shared review is pending, retain its owner and checkpoint in the item
and return the verified result for integration.

On a run that uses model assignments, the outcome owner prunes existing
[model notes](../work/references/model-notes.md); assigned deliverers return useful
observations instead. Skip this for ordinary inline work and never create notes
just to record completion.

Finish with the [handoff commit](../work/references/git-posture.md#commit-before-handing-back),
including final corrections and cleanup. Return delivered behavior, meaningful checks and review, interface assumptions,
foundation changes, pattern implications, limitations, and excluded findings.
Assigned delivery returns that evidence to `work`; direct delivery reports it in
chat with the closure disposition. Neither route creates a completion-report file.
