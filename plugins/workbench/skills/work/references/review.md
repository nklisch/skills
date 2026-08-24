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
| `thorough` | Multi-pass convergence: correct and verify between passes until no unresolved `blocking` finding remains. Material, minor, and nit findings may be parked, accepted, or rejected through ordinary outcome-owner adjudication. |
| `maximum` | Thorough convergence with complementary, adversarial, and cross-model coverage when available, until no unresolved `material` or `blocking` finding remains. Minor and nit findings may remain. |

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

`thorough` and `maximum` deliberately repeat independent passes. Correct and
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
or item-specific implementation detail. A convention-authorized
`docs/ROADMAP.md` is a user-owned, free-form planning document rather than a
restricted foundation template. Its metadata and discourse are not review
failures; verify instead that `.work/`, not roadmap prose, remains the
operational source of truth and that the roadmap was not changed incidentally.

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

## Require a useful review packet

Every independent reviewer returns a concise packet for the outcome owner to
verify and adjudicate, not a bare verdict:

- **Scope and evidence** — the authorized outcome, surfaces examined, and
  material coverage limits.
- **Findings** — each candidate's status (`confirmed`, `hypothesis`, or
  `non-issue`), evidence, impact, confidence, and smallest justified
  disposition.
- **Materiality** — decide whether a candidate is `blocking` (a confirmed
  violation of an accepted requirement, correctness, contract, integrity,
  safety, or another scope-grounded criterion that prevents closure), `material`
  (a nontrivial product consequence requiring an explicit outcome
  owner decision), `minor` (real but low-payoff and non-blocking), or `nit`
  (taste or polish without a meaningful product consequence). Do not use
  project-priority labels such as P1 or P2 unless the project defines their
  meaning; recommend fix-before-close, revise, park, or reject instead. An
  outcome owner's explicit disposition resolves the candidate for convergence;
  it does not rewrite the reviewer’s materiality judgment.
- **Constraint calibration** — when a candidate concerns a limit, refusal,
  recovery rule, or resource policy, name the failure it prevents, the
  product's domain and intended use, the user cost of the constraint, and
  whether a hard stop earns that cost or a credible degraded path or explicit
  choice is better. A justified hard stop remains valid; do not substitute
  permissiveness for a real safety or integrity requirement.
- **Recommendation** — accept, reject, revise, or park each material candidate;
  the outcome owner makes the final decision against product goals and evidence.

A clean review says so with its coverage limits. Do not turn speculative leads
or reviewer taste into acceptance blockers.

Every review prompt also states the effective simplification posture and gives
the reviewer its hygiene, balanced, or structural expectation from
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
