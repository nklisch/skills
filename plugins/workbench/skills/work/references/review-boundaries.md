# Review Boundaries and Timing

Implementation units and review targets need not match. Small deliveries keep
implementation focused. A shared review can reuse context and expose interactions
that isolated feature reviews miss. Choose boundaries for useful scrutiny and
throughput, not from a fixed feature count or assumptions about every model.

This guidance applies to concrete Workbench outcomes under [review.md](review.md).
Review weight controls depth and repetition, not batch size or whether design
gets a separate review. Execution posture controls who reviews.

## Align design review for the run

A separate design review is optional. Align the approach with the user once for
the current run: no separate pass, focused review of selected decisions, or a
broader design review. Recommend an approach from consequence, uncertainty,
reversibility, and the value of independent challenge.

An explicit request or user-confirmed standing convention can supply alignment.
Reuse it rather than asking again for each feature or skill transition. If the
approach is unsettled, propose it with the run's other meaningful choices and
obtain agreement before treating it as settled. Choosing no separate pass does
not remove ordinary design reasoning, self-checking, or requirement alignment.

A selected design review may cover related decisions across several features.
Place it before dependent implementation becomes expensive to reverse. Do not
hold independent implementation for decisions it does not depend on. Revisit
only the affected approach when a materially changed assumption or consequence
undermines the agreement. Explain the new evidence and align that change, not
the entire run again. Risk warrants a recommendation, not a silently imposed
review gate. Never infer design review merely from a design heading or a high
implementation review weight.

Apply the effective review weight to selected design targets. If the user asks
for a distinct review while the effective weight is `none`, resolve that conflict
in the same alignment instead of promising a pass that will be skipped.

## Choose implementation review checkpoints adaptively

Start with explicit run direction, then any repository preference in conventions
prose. Otherwise choose adaptive boundaries. A target may be one feature, one
standalone story, or a coherent batch spanning several features or deliveries.
The outcome owner names the included items and integrated behavior. A batch does
not change their requirements, hierarchy, or implementation ownership.

Prefer shared reviews when context reuse and integration visibility outweigh
delayed feedback. Split or review earlier when hidden coupling, high consequence,
growing uncertainty, or reviewer context limits would make a larger pass weaker.
Do not wait for an entire epic merely because it exists. Do not accumulate
unrelated work just to maximize batch size. Small implementation steps and larger
review-and-fix passes can coexist.

Explain the chosen checkpoint briefly in the run's approach. Adapt routine batch
membership and timing as evidence changes, within the user's direction. Ask only
when the change alters an explicit agreement or another consequential commitment.
Different explicit review weights or reviewer requirements must remain satisfied:
group compatible targets or keep their reviews separate rather than averaging
away a requirement.

Verify and self-check each delivery promptly. At a checkpoint, integrate the
included work and establish a stable commit range or bounded diff. Review its
accepted requirements, interactions, and affected foundations together. A shared
pass satisfies the included items' review obligation without duplicate per-item
passes. Already-reviewed work supplies context, not another review target. Review
only substantive new integration behavior not covered by earlier passes.

Adjudicate findings across the batch, make cohesive corrections, and rerun the
affected unit and integration checks. Ordinary correction self-checking is not a
new pass. At `standard`, do not send each corrected feature through review again.
Heavier weights retain their convergence rules at the chosen target.

## Preserve ownership and closure

When review is deferred to a shared checkpoint, keep features and standalone
stories active until their applicable review, corrections, verification, and
reconciliation are satisfied. The integration owner closes them then. A nested
story may close after slice verification under the existing delivery contract.
Its owning feature stays open for integrated acceptance, including review.

Keep pending review scope, its owner, and next checkpoint in existing active-item
prose when needed for continuation. An existing owner can hold shared detail,
with a short pointer in participating items. Without a shared owning item, keep
enough context in those items and let `work` own integration. No new batch object,
status, receipt, or coordination feature is needed just to remember a review.
Pending review alone is not a `blocked_by` dependency or an external blocker.

On interruption, preserve the stable target or current diff, verified work,
remaining findings, and next action in the affected items. On resume, compare
that evidence with Git before continuing. Shrink or split a batch when one unit
stalls so ready work need not wait for unrelated work. Never mark a feature done
while its required review remains deferred. With `none`, or a `light` decision
that no pass is warranted, there is no distinct review obligation to defer.

Projects may record a concise preference in `.work/CONVENTIONS.md`, for example:
“Prefer coherent cross-feature implementation reviews, verify each delivery
promptly, and align optional design review once per run.” A project may instead
prefer per-feature reviews or name situations that merit earlier checkpoints.
Keep this ordinary convention prose, not new frontmatter fields or numeric quotas.
