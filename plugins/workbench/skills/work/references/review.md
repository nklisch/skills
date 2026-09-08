# Proportionate Review

## Contents

- Pass budget and review targets
- Keep review inside the authorized scope
- Return useful findings, not a form

This policy applies as a formal review contract only while reviewing a
concrete Workbench workflow: an implementation-shaping design recorded for a
Workbench outcome or completed implementation inside a Workbench delivery
boundary. Every design and review in an adopted repository still applies the
current `## Overbuilding calibration`, including a loose request. Loose work
gets that proportionality lens without this policy's ledger, review-weight,
convergence, formal review packet, or closure mechanics.

For an applicable workflow, resolve the effective `review_weight` from explicit
user instruction, `.work/CONVENTIONS.md`, then `standard`. It controls the depth
of selected design and implementation reviews, not whether design review is
selected or how many deliveries a target covers.
Apply [review-boundaries.md](review-boundaries.md) to align optional design review
once per run and choose adaptive implementation checkpoints across one or several
features or deliveries. Separately read
[simplification.md](simplification.md) and resolve the effective
`simplification_posture`; it controls simplification emphasis within each pass,
not the number of passes. Resolve the effective execution posture from explicit
user direction, the optional project convention, then `adaptive`; it controls
who performs each pass, not the selected rigor or convergence condition.
Read [assurance-machinery.md](assurance-machinery.md) and apply it in every
design and implementation review.

| Weight | Review policy |
|---|---|
| `none` | No distinct review pass. Ordinary implementation self-checking, verification, and acceptance evidence remain mandatory. |
| `light` | At most one focused pass when consequence, uncertainty, breadth, or reversibility warrants it. Fix and verify without re-review. |
| `standard` | Default. Exactly one balanced pass for each selected design target and completed integrated implementation target. Correct and verify findings without re-reviewing that target. |
| `thorough` | Multi-pass convergence: correct and verify between passes until no unresolved `blocking` finding remains. Material, minor, and nit findings may be parked, accepted, or rejected through ordinary outcome-owner adjudication. |
| `maximum` | Thorough convergence with complementary and adversarial lenses, using cross-model coverage when the execution posture permits and it is available, until no unresolved `material` or `blocking` finding remains. Minor and nit findings may remain. |

## Pass budget and review targets

A pass is one deliberate review of one stable target, not an agent assignment
or a required amount of prose. In the current context, reset the lens and inspect
the target again without claiming fresh-context independence. Under `adaptive`,
weigh what a fresh reviewer would add against context transfer and coordination.
A familiar, bounded change often needs only a focused inline pass. Hidden coupling,
specialized risk, or author blind spots may justify another context. Honor explicit
`inline`, `orchestrated`, independent, and cross-model requests.

Scale effort within the selected weight to consequence, uncertainty, breadth,
and reversibility. Inspect the whole accepted boundary, but spend detail on its
credible failure paths. A small change does not need a broad audit, a full review
form, or a delegate to qualify as reviewed. Do not narrate a role transition or
write a packet to yourself when reviewing inline. Report useful findings, evidence,
and material limits. A correction, its affected verification, and ordinary author
self-checking are **not** another pass.

`standard` has a fixed one-pass budget per selected target. An optional design
review and an implementation review have separate budgets. An implementation
target may cover several features or deliveries. The shared pass satisfies their
review obligations without adding item-level passes. A nested story returns
verification evidence to its owning feature without a duplicate review.

After a `standard` reviewer identifies an accepted finding, correct it, rerun
the affected verification, and self-review the result; then continue. Do not
send the corrected design or implementation through a second distinct review
pass. Only an explicit user direction that changes the weight, or `thorough`
or `maximum`, authorizes another pass over the same target.

`thorough` and `maximum` deliberately repeat distinct passes. Correct and
verify accepted findings before the next pass. A `blocking` finding violates an
accepted requirement, correctness, contract, integrity, safety, or other
scope-grounded criterion; reviewer taste cannot make one blocking. A `material`
finding has a nontrivial product consequence but may be resolved by an explicit
outcome-owner decision to revise, reject, or park it. That disposition resolves
the candidate for both convergence levels. Minor and nit findings do not justify
another pass.

Convergence has no Workbench-enforced numeric cap. A project may state a review
count preference in its conventions, and an explicit user instruction may
bound, extend, or stop a review. Honor that direction; if it ends a review before
its selected convergence condition, report the remaining findings and obtain a
clear disposition rather than silently closing over them. Stop and ask the user
for direction when no corrective progress remains possible.

An explicit request for cross-model review selects reviewer diversity, not
automatically a heavier pass count. Under `standard`, broader lenses still fit
inside one pass. Only `thorough` and `maximum` repeat review. When the user
explicitly requests an external, independent, or cross-model reviewer and none
is available, disclose the limitation and ask how to proceed. Otherwise
`adaptive` may use a credible inline pass when delegation is unavailable, and
`inline` is never treated as a reviewer-availability failure.

When design review is selected for the run, review stable decisions before
expensive dependent implementation. A changed technical assumption focuses
scrutiny on the affected decision and its dependents, not unchanged work.
A genuinely new consequential decision may warrant a new target under the
aligned approach. An accepted correction is not a new target. Apply
[execution-posture.md](execution-posture.md), including model alignment for multiple
sub-agents. Family diversity may help but is not an extra pass.

For affected durable truth, apply [foundation-truth.md](foundation-truth.md):
check ownership, current versus intended behavior, engineering coverage, and
foundation altitude. Reject work tracking and duplicated code-owned structure.
Preserve the user-owned roadmap rather than grading its format. Read any linked
[design attachments](design-attachments.md) as part of the item's design contract.
Reviewers return proposals without editing that contract. The outcome owner
adjudicates findings, and the designer records accepted design corrections before
dependent implementation. Implementation review checks attachment cleanup at closure,
including when a completion summary will remain. When a provisional
spec is involved, apply [provisional-specs.md](provisional-specs.md) to its
ownership, temporary status, remaining scope, and cleanup.

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

A review communicates what was checked, actionable findings with evidence, and
material coverage limits. A short paragraph can be complete. A delegated reviewer
returns enough context for the owner to verify the claims; an inline reviewer
reports the useful result without manufacturing a handoff packet. A clean review
says so briefly with any material limits, not a bare unsupported verdict.

For each consequential finding, explain the observed or hypothesized failure,
its product impact, evidence and uncertainty, and the smallest justified action.
Use explicit labels when they help adjudication or convergence:

- **blocking:** a confirmed violation of an accepted requirement, correctness,
  contract, integrity, safety, or another scope-grounded criterion preventing closure;
- **material:** a nontrivial product consequence requiring owner disposition;
- **minor:** real but low-payoff and non-blocking;
- **nit:** taste or polish without meaningful product consequence.

Do not invent project-priority labels. Recommend revise, fix-before-close, park,
or reject; the owner verifies and decides. Disposition resolves the candidate for
convergence without rewriting the reviewer's materiality judgment. Keep hypotheses
and uncertainty clear; neither speculation nor taste creates a blocker.

For a limit, refusal, recovery rule, or resource policy, explain the failure it
prevents and the cost to actual users. Weigh a hard stop against a credible degraded
path or explicit choice. Preserve justified safety and integrity protections.
Do not expand ordinary findings into constraint analysis when no constraint is at issue.

A delegated prompt states the effective [simplification](simplification.md)
expectation and does not lead with a suspected answer. Focus design review on
requirements, choices, assumptions, verification, recovery, and unnecessary
complexity. Focus implementation review on correctness, required behavior,
integration, simplification, and affected foundation truth. Apply security,
privacy, accessibility, compatibility, data, and operational lenses only where
scope or evidence warrants them. Check obvious algorithmic overwork and plausible
performance regressions without inventing a profiling exercise.

At `standard` weight and above, when the item is refactor/cleanup work or the
change makes decomposition decisions, also apply
[structure.md](structure.md): have the reviewer follow its calibration
protocol and diagnostic questions so structural findings are judged against
the codebase's own conventions and language idioms, and dispose of them by
its payoff rule — potentially material inside the boundary when the change
falls short of the effective simplification posture, parked outside it, never
taste.

Treat findings as proposals. Reproduce or verify each substantive claim, accept
changes that improve the work inside its authorized boundary, and explain
rejected material findings in the current conversation. A proposal that depends
on an invented requirement or broader outcome is rejected as an acceptance
finding; when useful, park it as a non-blocking follow-up instead of expanding
the current work. When a rejection reflects a durable constraint, fold that
constraint into the design's chosen approach or risks; keep no separate record
of the adjudication. Review never substitutes for behavioral verification, and
a reviewer saying “looks good” is not evidence.
