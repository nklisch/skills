# Model and Context Tendencies

Choose capability for the work at hand. Model names and rankings age quickly, so
this reference records durable tendencies, not a role-to-model table or an
availability allowlist. Explicit user choices and project restrictions override
every tendency here.
[Model alignment](execution-posture.md#align-models-before-multi-subagent-execution)
remains the authority for confirming an actual lineup. When model choice matters,
consult existing [repository model notes](model-notes.md), checking whether their
observations apply to the current task, model revision, effort, and harness.

## Contents

- Capability tendencies
- Explain implementation difficulty
- Economical implementation and selective follow-up
- Spend capability where it changes the outcome
- Known agent tendencies

## Capability tendencies

- Strong reasoning models earn their cost on ambiguous requirements,
  architecture, cross-cutting contracts, difficult diagnosis, integration, and
  adversarial review.
- Faster capable models fit bounded implementation with clear acceptance, a
  narrow write surface, and cheap verification, including explicit mechanical
  correction lists.
- Long-context models help when correctness depends on many documents or broad
  repository state. Extra context can bury the decisive constraint, so curate
  the brief rather than dumping in the repository.
- A fresh context can catch assumptions the implementing context has normalized.
  Independence matters more than reviewer count.
- Different model families have genuinely different error patterns, but
  cross-model coverage provides evidence diversity, not authority.

These describe useful assignments, not mandatory agent roles or permanent model
tiers. The same available model may cover initial implementation, difficult
corrections, design, and review. Do not assume cost, capability, or equivalent
thinking settings from a model's name. Use supported settings, confirmed user
preferences, and qualified evidence. Without a stronger or independent model,
use a credible same-model fresh context, narrower assignment, or inline pass
within the aligned fallbacks, disclosing what independence or coverage is absent.
An explicitly required unavailable role still needs user disposition under model
alignment; model scarcity never lowers acceptance requirements.

## Explain implementation difficulty

For designed units where difficulty affects implementation or follow-up, the
designer records a short assessment in the item. Describe the reasoning difficulty
in ordinary language (for example, low, moderate, or high), separately from the
consequence of failure. Name straightforward portions, remaining judgment or hidden
coupling, likely mistakes, and the follow-up most likely to help. No score, new
frontmatter, or required section is needed for an obvious local change.

A large mechanical edit can be straightforward but consequential; a small
multi-owner transition can require difficult reasoning. Assess the actual
contract rather than counting files, lines, or findings. The owner revises the
forecast when implementation, verification, or review reveals a different problem.
Difficulty advises assignments; it does not select review weight or authorize
spending or additional rounds.

Use [design attachments](design-attachments.md) when explicit interfaces, ownership,
state transitions, readiness, ordering, partial failure, recovery, and representative
sequences would reduce consequential guesswork. Detail the dangerous boundaries,
including what must remain unchanged after failure, not every function. Greater
detail cannot substitute for needed reasoning or create new requirements.

## Economical implementation and selective follow-up

Prefer a capable economical initial implementer for a settled contract when that
fits the available, aligned lineup. Keep small or mechanical corrections with it;
give accepted findings as a clear numbered list with evidence, required behavior,
and affected verification. Do not turn every item into a three-agent pipeline or
force a weaker model onto unresolved design work. A user's explicit first-implementer
choice wins over this default.

Recommend a stronger reasoning follow-up when diagnosis, missed invariants,
cross-cutting coupling, or weak decomposition makes another mechanical correction
list insufficient. Design may forecast that need before implementation. Conversely,
minor findings or a sound straightforward delivery do not earn a mandatory cleanup
stage. Repeated failures or unsupported verification claims warrant reassessing the
assignment and checking underlying evidence, not endlessly retrying the same brief.

A follow-up is implementation with an explicit owned write boundary. Give it license
to improve clarity and structure under the effective [simplification posture](simplification.md):
clearer ownership and names, simpler control flow, cohesive file splits or
consolidation, and removal of accidental complexity where the payoff is real. It
reads the recorded contract and inspects the underlying failure paths, not only
the numbered findings. Preserve accepted behavior, guarantees, and measured
performance; return unrelated opportunities separately.

Prefer planned cleanup before the selected implementation review so the reviewer
sees the actual result. After review, correction work may still include cohesive
cleanup; verify and self-check the changed boundary. Changing implementer or doing
cleanup does not itself consume a review pass, and a cleanup author's self-check
is not independent review. A deliberate distinct inspection does count as review,
whatever the assignment is called. Use [review.md](review.md) for extra-round
authority and limits rather than silently adding a pass after every correction.

The outcome owner checks meaningful returns and updates or prunes useful
[model notes](model-notes.md) at integration and completion. Local evidence can
change the proposed assignment, but does not override the user's aligned choices.

## Spend capability where it changes the outcome

For broad opportunity scanning, do not use a flagship model for a first, unverified
finding pass. Coverage, clear lane ownership, and evidence matter more than the
cost of generating a hypothesis. Reserve stronger reasoning for adjudicating a
bounded candidate set: lane disagreement, high-consequence findings, architectural
proposals, or weakly evidenced claims. If no economical scanner is available,
inspect inline, narrow the scan, or disclose the coverage limit rather than
promoting a flagship model just to preserve fan-out. This scanning guidance is not
a ban on strong design, difficult implementation, or consequential delivery review.

Reviewer effort follows the review problem, not the designer's setting. A
high-effort design does not automatically require a high-effort review.
Consequence changes verification and review coverage, not automatically thinking
level. Raise effort for unresolved reasoning, never to perform rigor.

## Known agent tendencies

Use briefs to counter these tendencies, not feed them. Agents tend to overproduce
process when given many named phases, overfit to the examples in style catalogs,
split work by checklist count rather than real independence, and report confidence
in place of verification. Check consequential claims under
[verification](verification.md); a more capable model is not an evidence guarantee.
