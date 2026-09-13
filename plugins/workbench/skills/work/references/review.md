# Proportionate Review

## Contents

- Pass budget and review targets
- Keep review inside the authorized scope
- Return useful findings, not a form
- Keep review advisory

This policy applies as a formal review contract only while reviewing a
concrete Workbench workflow: an implementation-shaping design recorded for a
Workbench outcome or completed implementation inside a Workbench delivery
boundary. Every design and review in an adopted repository still applies the
current `## Overbuilding calibration`, including a loose request. Loose work
gets that proportionality lens without this policy's ledger, review-weight,
convergence, formal review packet, or closure mechanics.

Resolve `review_weight` from explicit user instruction, `.work/CONVENTIONS.md`,
then `standard`. It controls depth, not design-review eligibility or batch size.
Use [review-boundaries.md](review-boundaries.md) to align optional design review
once and choose implementation checkpoints. Apply [simplification.md](simplification.md)
for simplification emphasis, [execution-posture.md](execution-posture.md) for
runner choice, and [assurance-machinery.md](assurance-machinery.md) to every review.
Those choices do not independently change pass depth or convergence.

| Weight | Review policy |
|---|---|
| `none` | No distinct review pass. Ordinary implementation self-checking, verification, and acceptance evidence remain mandatory. |
| `light` | At most one focused pass when consequence, uncertainty, breadth, or reversibility warrants it. Fix and verify without re-review. |
| `standard` | Default. Exactly one balanced pass for each selected design target and completed integrated implementation target. Correct and verify findings without re-reviewing that target. |
| `thorough` | Multi-pass convergence: correct and verify between passes until no unresolved `blocking` finding remains. Material, minor, and nit findings may be parked, accepted, or rejected through ordinary outcome-owner adjudication. |
| `maximum` | Thorough convergence with complementary and adversarial lenses, using cross-model coverage when the execution posture permits and it is available, until no unresolved `material` or `blocking` finding remains. Minor and nit findings may remain. |

## Pass budget and review targets

A pass is deliberate review of a stable target, not an agent assignment or prose
quota. Inline review resets the lens without claiming fresh-context independence.
Under `adaptive`, weigh fresh perspective against handoff cost: familiar bounded
changes often fit inline, while hidden coupling, specialized risk, or author blind
spots may justify another context. Honor explicit `inline`, `orchestrated`,
independent, and cross-model requests.

Scale effort to consequence, uncertainty, breadth, and reversibility. Inspect the
whole accepted boundary, concentrating on credible failure paths. A small change
needs no broad audit, full form, or delegate; inline review needs no role narration
or self-addressed packet. Corrections, verification, changing implementer, and author
self-checks are **not** another pass or independent review. A distinct inspection
counts as review regardless of its assignment's name.

`standard` has a fixed one-pass budget per selected target. An optional design
review and an implementation review have separate budgets. An implementation
target may cover several features or deliveries. The shared pass satisfies their
review obligations without adding item-level passes. A nested story returns
verification evidence to its owning feature without a duplicate review.

After a `standard` reviewer identifies an accepted finding, correct it, rerun
the affected verification, and self-review the result; then continue. Do not
send the corrected design or implementation through a second distinct review
pass. Only `thorough`, `maximum`, or explicit user authorization for repeated
review permits another pass over the same target.

`thorough` and `maximum` deliberately repeat distinct passes. Correct and
verify accepted findings before the next pass. A `blocking` finding violates an
accepted requirement, correctness, contract, integrity, safety, or other
scope-grounded criterion; reviewer taste cannot make one blocking. A `material`
finding has a nontrivial product consequence but may be resolved by an explicit
outcome-owner decision to revise, reject, or park it. That disposition resolves
the candidate for both convergence levels. Minor and nit findings do not justify
another pass.

For larger or protocol-sensitive targets that merit repeated review, propose a
bounded plan alongside the lineup: for example, two review-and-correction rounds,
with a third only if consequential findings remain and correction is making useful
progress. This is a plan to align, not a universal extra-pass requirement. Explicit
user direction or user-confirmed convention prose can supply standing bounds;
otherwise do not invent a numeric cap. A bound does not add rounds to `standard`
unless the user also authorizes repeated review of that target.

Honor aligned bounds and stop early when the selected convergence condition is met.
Minor or cosmetic findings do not earn another round. At the limit, or when no
corrective progress remains possible, report unresolved findings for user disposition.
A pass limit bounds effort, not acceptance: do not close with unresolved required
corrections or failed verification. A decision to defer them leaves the affected
work open unless the user explicitly revises its accepted scope or requirements.

Cross-model review selects diversity, not extra passes. Under `standard`, broader
lenses fit inside one pass. An explicitly required unavailable reviewer needs user
disposition. Otherwise `adaptive` may use credible inline review when delegation
is unavailable; intentional `inline` is not a reviewer-availability failure.

When design review is selected for the run, review stable decisions before
expensive dependent implementation. A changed technical assumption focuses
scrutiny on the affected decision and its dependents, not unchanged work.
A genuinely new consequential decision may warrant a new target under the
aligned approach. An accepted correction is not a new target. Apply
[execution-posture.md](execution-posture.md), including model alignment for multiple
sub-agents. Family diversity may help but is not an extra pass.

Apply [foundation-truth.md](foundation-truth.md) to affected truth: ownership,
current versus intended behavior, engineering coverage, and altitude. Reject work
tracking and duplicated code structure; preserve user-owned roadmap format. Read
linked [design attachments](design-attachments.md) as part of the contract.
Reviewers propose; the owner adjudicates; designers record accepted corrections
before dependent implementation. Check unconditional attachment cleanup at closure
and [provisional-specs.md](provisional-specs.md) when a provisional spec is involved.

## Keep review inside the authorized scope

Use conventions, project calibration, and root and scope-owned principles as
lenses within the authorized outcome. Read them when missing or changed in context;
pass them explicitly to a fresh reviewer. They do not authorize scope growth.

A review may detect that the design or implementation missed, contradicted, or
unnecessarily exceeded an existing requirement. It must not create a new
requirement, enlarge the accepted outcome, or treat an adjacent improvement as
necessary for approval. The scope authority is:

1. the user's original intent, later clarifications, and explicit exclusions;
2. the accepted active-item outcome and design decisions inside that intent;
3. applicable foundation documents as current or explicitly intended project
   truth and constraints.

Foundations constrain the outcome; adjacent aspirations and reviewer preferences
are not acceptance requirements. Judge against the project's actual audience,
maturity, deployment, and risks. Flag abstractions, compatibility layers, hardening,
configuration, and tests that lack an earned need. Simplification may restructure
the affected boundary, not absorb unrelated cleanup.

Apply [assurance-machinery.md](assurance-machinery.md) to formal protections and
state machinery. Prefer simpler credible mechanisms while preserving guarantees
whose product risk earns their cost.

Every delegated formal review uses the canonical boundary instruction from
[role-handoffs.md](role-handoffs.md). Supply raw requirements, relevant conventions,
principles, artifacts, diff, and available verification evidence. Pass calibration
explicitly. Inline review applies the same boundary without copying a prompt or
reloading unchanged guidance.

## Return useful findings, not a form

Communicate what was checked, actionable findings with evidence, and material
coverage limits. A short paragraph can be complete. A delegated return must let
the owner verify the claims; inline review needs no handoff packet. A clean
review says so with any material limits, not a bare unsupported verdict.

For each consequential finding, explain the observed or hypothesized failure,
its product impact, evidence and uncertainty, and the smallest justified action.
When it helps adjudication or convergence, label a consequential candidate on
two axes. Its evidence status is `confirmed` if the reviewer reproduced or
verified it, `hypothesis` if it is plausible but unverified, or `non-issue` if
inspection cleared it. A hypothesis may be raised but never blocks on its own.
Its materiality is:

- **blocking:** a confirmed violation of an accepted requirement, correctness,
  contract, integrity, safety, or another scope-grounded criterion preventing closure;
- **material:** a nontrivial product consequence requiring owner disposition;
- **minor:** real but low-payoff and non-blocking;
- **nit:** taste or polish without meaningful product consequence.

Use project-priority labels only when the project defines them. Recommend revise,
fix-before-close, park, or reject; the owner verifies and decides. Disposition
resolves a candidate without changing its materiality. Taste never creates a blocker.

For a limit, refusal, recovery rule, or resource policy, explain the failure it
prevents and the cost to actual users. Weigh a hard stop against a credible degraded
path or explicit choice. Preserve justified safety and integrity protections.
Do not expand ordinary findings into constraint analysis when no constraint is at issue.

A delegated prompt states the effective [simplification](simplification.md)
expectation and does not lead with a suspected answer. Set reviewer effort from
the review problem, not the designer's setting, following
[model tendencies](model-tendencies.md). For design targets, read and apply
[design-review.md](design-review.md): prioritize the right problem, best-fit
solution, consequential omissions, and repository reuse; correctness is a necessary
baseline, not the main purpose. Focus implementation review on correctness, required behavior,
integration, simplification, and affected foundation truth. Apply security,
privacy, accessibility, compatibility, data, and operational lenses only where
scope or evidence warrants them. Check obvious algorithmic overwork and plausible
performance regressions without inventing a profiling exercise.

At `standard` and above, refactor/cleanup or decomposition decisions also use
[structure.md](structure.md)'s calibration and diagnostic questions. Judge against
repository conventions and language idioms, not taste: a missed simplification
may be material inside the boundary; unrelated improvements stay non-blocking.

## Keep review advisory

Treat findings as proposals. The outcome owner adjudicates them against product
goals and evidence; reviewer confidence, detail, or preferred architecture does
not grant scope authority. Reproduce or verify each substantive claim. Accept
changes that improve the work inside its authorized boundary, explain rejected
material findings in the current conversation, and accept real defects even
when they contradict the accepted design.

Reject invented requirements, speculative hardening, unnecessary abstraction,
and scope growth as acceptance findings; park useful adjacent ideas separately.
Fold durable constraints into the design rather than keeping an adjudication log.
Do not add passes merely to reach agreement. Review never substitutes for behavioral
verification, and a reviewer saying “looks good” is not evidence.
