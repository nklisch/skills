# Independent Review

This policy applies only while reviewing a concrete Workbench workflow: an
implementation-shaping design recorded for a Workbench outcome or completed
implementation inside a Workbench delivery boundary. It does not govern every
review, audit, planning discussion, explanation, or loose request made in a
Workbench-owned repository.

For an applicable workflow, resolve one effective `review_weight` from explicit
user instruction, `.work/CONVENTIONS.md`, then `standard`. The same weight
governs that outcome's design and implementation review so the repository has
one understandable delivery rigor control. Separately read
[simplification.md](simplification.md) and resolve the effective
`simplification_posture`; it controls simplification emphasis within each pass,
not the number of passes.

| Weight | Review policy |
|---|---|
| `none` | Self-review only. Independent review is skipped, but verification and acceptance evidence remain mandatory. |
| `light` | At most one focused fresh-context pass when consequence, uncertainty, breadth, or reversibility warrants it. Fix and verify without re-review. |
| `standard` | Default. Exactly one balanced fresh-context pass for each eligible design and completed integrated implementation boundary. Correct and verify findings without re-reviewing that target. |
| `thorough` | A multi-pass convergence cycle: at least two independent passes per eligible target, with correction and verification between passes, continuing until a pass finds no receiver-confirmed material issue. |
| `maximum` | The thorough multi-pass cycle with complementary and adversarial perspectives and cross-model coverage when available. |

## Pass budget and review targets

A pass is one independent fresh-context review of one stable target. A correction,
its affected verification, and the author's self-review are **not** another
independent pass.

`standard` has a fixed one-pass budget for every eligible target: one pass for
an implementation-shaping design before implementation, and one pass for the
completed integrated implementation of each feature or standalone story. Those
are separate targets and separate one-pass budgets. A nested story returns
verification evidence to its owning feature and does not gain a duplicate
independent implementation pass.

After a `standard` reviewer identifies an accepted finding, correct it, rerun
the affected verification, and self-review the result; then continue. Do not
send the corrected design or implementation back for a second independent
review. Only an explicit user direction that changes the weight, or `thorough`
or `maximum`, authorizes another pass over the same target.

`thorough` and `maximum` deliberately have multi-pass budgets. Run a confirmation
pass even when the first pass is clean; after any accepted finding, correct and
verify before the next pass. Continue their convergence cycle until its final
pass finds no receiver-confirmed material issue.

An explicit request for cross-model review selects reviewer diversity, not
automatically a heavier pass count. Under `standard`, broader lenses still fit
inside one pass. Only `thorough` and `maximum` repeat independent review.
When the effective weight requires independent review and no fresh-context path
is available, disclose the limitation and stop for the user's direction rather
than silently approving inline or claiming a lower weight.

Review a design after it is stable enough to constrain implementation and
before implementation becomes expensive to reverse. Review completed work at
the integrated contract boundary. Small reversible work does not need a
ceremonial design review merely because a design section exists.

When `work` routes a unit through formal design, complete the required design
review before implementation or delegation. Select reviewer capability and
reasoning level using [model-roles.md](model-roles.md). Prefer a fresh-context
reviewer from a different model family when available, but do not treat family
diversity as mandatory or as an extra pass beyond the effective
`review_weight`.

Read [foundation-truth.md](foundation-truth.md) when the design or implementation
may affect durable project truth. Treat foundation altitude as a qualification
criterion: proposed foundation prose must remain high-level repository or
sub-project truth, not work tracking, qualification mechanics, evidence history,
or item-specific implementation detail. The only exception is a
convention-authorized `docs/ROADMAP.md`, limited to concise ordering and
direction over linked backlog items as defined by the foundation-truth
reference; active-work tracking is always a failure.

## Keep review inside the authorized scope

A review may detect that the design or implementation missed, contradicted, or
unnecessarily exceeded an existing requirement. It must not create a new
requirement, enlarge the accepted outcome, or treat an adjacent improvement as
necessary for approval. The scope authority is:

1. the user's original intent, later clarifications, and explicit exclusions;
2. the accepted active-item outcome and design decisions inside that intent;
3. applicable foundation documents as current or explicitly intended project
   truth and constraints.

Foundation documents constrain and clarify the work; they do not make every
adjacent aspiration or possible improvement part of the current outcome. A
reviewer's preferred architecture, ideal feature set, generic best practice, or
personal quality bar is not scope authority. The simplification posture permits
cohesive restructuring inside the affected boundary but does not turn unrelated
cleanup into an acceptance condition.

Judge the work for the project's actual type, maturity, audience, deployment
context, and stated risks. Explicitly look for overbuilding: extra abstractions,
capabilities, compatibility layers, hardening, infrastructure, configurability,
or tests whose need is not established by the authorized outcome or repository
evidence. Do not demand enterprise, platform, or production machinery from a
prototype, internal tool, small utility, or other project whose rational scope
does not require it.

Every review prompt must state this boundary plainly. Give reviewers the raw
requirements, artifacts, diff, and verification evidence available at that
point, and tell them:

> Do not invent requirements or expand scope. Evaluate only against the user's
> original intent, accepted item and design, applicable foundation truth, and
> the rational expectations of this project type. Flag overbuilding as a
> defect. Treat worthwhile improvements outside that boundary as non-blocking
> follow-ups, not findings required for acceptance.

Also state the effective simplification posture and give the reviewer its
hygiene, balanced, or structural expectation from
[simplification.md](simplification.md). Do not lead reviewers with the suspected
answer. For design, ask about
requirements coverage, boundaries, alternatives, assumptions, failure modes,
verification feasibility, migration or rollback, unnecessary complexity,
accurate high-level foundation roll-forward, foundation-altitude violations,
and scope expansion. For implementation, ask about correctness, missing
required behavior, safety, integration risk, simplification at the effective
posture, foundation drift or delivery-detail leakage, overbuilding, and
relevant security, privacy, accessibility, performance, compatibility,
data-integrity, and operational concerns only where the authorized scope or
evidence makes them relevant. Every pass catches obvious algorithmic overwork
and plausible performance regressions in affected code; require deeper
performance investigation only when project constraints or evidence warrant it.

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
