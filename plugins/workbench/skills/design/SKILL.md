---
name: design
description: >
  Resolve consequential implementation choices for a Workbench outcome, or stress-test its
  design before costly implementation, authoring the design directly in its work item. Use only
  when .work/CONVENTIONS.md declares owner: workbench. Keep accepted context and the same outcome
  owner, revise only decisions affected by new evidence, and review proportionately. Use ideate
  when the desired outcome itself needs exploration; ordinary local choices stay inside delivery.
---

# Design

Supply focused design reasoning inside a continuous Workbench outcome. Use this
capability when discovery, alternatives, boundaries, or adjudication need more
attention than local implementation judgment. Size and a design heading do not
create a formal stage. A direct design request stops after the settled design
and any selected review. An end-to-end request continues into implementation
without renewed permission.

## Establish only missing context

For direct entry, confirm an upward-found `.work/CONVENTIONS.md` declares
`owner: workbench`. Otherwise handle the request without Workbench. Read project
instructions, conventions, relevant items, foundations, code, and tests. Use the
knowledge index when present and apply
[version guidance](../setup/references/version-compatibility.md) before mutation.

When `work` or `deliver` already supplied this context, carry it forward. Do not
repeat activation or settled questions. Reconcile changed repository facts and
unresolved assumptions. Fresh contexts load their own governing guidance.

Resolve authority and runner choices only if not already settled through
[autonomy](../work/references/autonomy.md) and
[execution posture](../work/references/execution-posture.md). Apply
[simplification](../work/references/simplification.md), current project calibration,
and [assurance machinery](../work/references/assurance-machinery.md).

Use [ideate](../ideate/SKILL.md) when the outcome or success shape needs exploration,
or early discovery could materially reshape a substantial initiative. Do not
restart ideation for a bounded technical choice within accepted work. Explicit
direct execution and established mechanical work bypass that preflight.

## Bound the decision

The user's intent, clarifications, exclusions, and accepted item define scope.
Foundations constrain that scope; they do not pull every adjacent aspiration into
it. Never invent requirements to justify a preferred architecture or extra rigor.
Use the project's actual audience, maturity, deployment, and risks as calibration.

For a clear direct request without an item, create the smallest useful feature or
story using [lifecycle](../work/references/lifecycle.md). Keep design in that item.
When dense contracts need more space, use an optional linked specification under
[design attachments](../work/references/design-attachments.md). Do not add hierarchy
or a separate document just to represent design activity.

Read [lenses](references/lenses.md), choose the relevant primary lens, and apply
only risk overlays that matter. State the lens when it helps interpretation.
Separate facts, requirements, assumptions, and decisions without requiring four
empty sections. Learn facts from the repository; ask the user about unsettled
product direction, external contracts, irreversible choices, and expensive
trade-offs. Use grounded research only when substantive external evidence matters.

## Resolve the consequential choices

Prefer the simplest maintainable approach, measured in durable concepts and
operating cost rather than diff size. Name alternatives only where choice matters.
Keep ordinary type, interface, and local implementation decisions proportionate.

For consequential assurance machinery, name the failure or invariant protected,
its authority, and why an existing or simpler mechanism is insufficient. Account
for synchronization, migration, false positives, blocked states, and recovery.
Preserve accepted guarantees while removing machinery that does not earn its cost.

Design verification alongside the change. Reuse existing tests, commands,
fixtures, and environments. Cheap contained evidence may be added directly;
a substantial new test framework, simulation, or benchmark platform requires
user discussion. Name credible recovery for consequential failure modes.

Use the current context when continuity supplies enough reasoning and challenge.
Consider a dedicated designer for specialization, breadth, or fresh perspective
that outweighs the handoff cost. Honor explicit execution preferences. If
multiple sub-agents are useful, follow model alignment before dispatch.
A delegated designer uses [role handoffs](../work/references/role-handoffs.md).
Give it raw requirements, the owning item path, and an explicit item-scoped write
assignment rather than a proposed answer. Include any owned design attachments.
The designer authors the design in that item and revises it after adjudication.
Include useful facts, unresolved assumptions, meaningful alternatives, and the
justified approach in the design.
When handing off to another agent, return the item path, relevant attachment or
section references, and only brief supplementary details such as what changed or
which questions remain. Do not paste or retell the whole design in the handoff;
the receiving agent reads the recorded sources directly. Keep implementation-shaping
details in those sources, not only in the message. Return out-of-scope ideas
separately as non-blocking follow-ups, not item requirements.

## Update decisions in place

The work item is the contract between design, review, and implementation.
The designer records the chosen approach, rationale, and useful verification or
recovery details directly in the owning item. Inline design has the same writing
responsibility without a separate agent or a packet to itself. Add implementation
units only when decomposition helps execution. Paths and interfaces should reduce
ambiguity, not pre-write the code. Use
[writing style](../work/references/writing-style.md) for durable prose.

Distinguish unsettled choices from decisions ready for implementation in ordinary
item prose. Writing a design does not approve new requirements or settle human-owned
choices. The outcome owner adjudicates readiness from the item and repository evidence.
Do not leave implementation-shaping decisions only in chat or an agent's memory.

After adjudication, the designer applies accepted design corrections to the item
before dependent implementation. If that context is unavailable, assign a replacement
designer, which may be the current owner, to revise the same item. Do not reconstruct
an undocumented design in the implementer's briefing. Preserve useful partial design
and unresolved questions in the item before interruption or return.

During delivery, revise only the decision affected by new evidence and inspect its
dependents. Preserve unaffected scope, accepted decisions, and completed evidence.
A revised local assumption does not trigger a full design rewrite or reapproval.
A material boundary or guarantee change does require its appropriate authority
and reconsideration of the aligned review approach before expensive implementation.
An uncertain label cannot hide that consequence. Continue independent authorized work when possible.

Follow [foundation truth](../work/references/foundation-truth.md) when a decision
settles durable project truth. Reconcile affected root or scope-owned assertions
in place, including engineering shape where it changed. Foundations own durable
semantics and rationale, not work tracking or copied internal schema structure.
Use trees, tables, or existing source-controlled diagrams when clearer than prose.
Rebuild the knowledge index when required.

For a linked bootstrap provisional spec, follow
[provisional specs](../work/references/provisional-specs.md). Name its implementation
owner and cleanup condition. Ordinary design does not create new provisional specs.

## Review and continue

Self-check requirements, scope, assumptions, alternatives, unnecessary complexity,
verification, and recovery. A separate design review is optional. Apply
[review boundaries](../work/references/review-boundaries.md) to align no separate
pass, selected-decision review, or broader review once with the user for this run.
Reuse explicit direction or confirmed standing alignment without another question.

For selected targets, apply [review](../work/references/review.md) at the effective
weight before expensive dependent implementation. Related feature decisions can
share a design review. A changed decision gets focused scrutiny of its consequences,
not repeated review of unchanged decisions. Revisit the agreement only when material
new evidence warrants it. Corrections retain the existing pass policy.

An inline pass is a deliberate change of lens, not a claim of independence.
Delegate only when fresh context materially improves the review or an explicit
preference calls for it. Every reviewer receives the accepted boundary, relevant
project truth, calibration, and evidence under the review contract.

Check proposed foundation changes for current versus intended truth, ownership,
engineering coverage, and altitude. Reject duplicated code-owned structure and
work-item narration. Preserve user-owned roadmap content and the temporary nature
of any provisional specs. These checks belong to the affected target, not a
repository-wide documentation audit.

The outcome owner verifies and adjudicates findings. The designer records accepted
design corrections in the item. Explain rejected material proposals in chat, and
offer adjacent ideas separately. When a reason is a durable constraint, record
the constraint rather than the review history.

Report the approach, decisive trade-offs, verification plan, review limits, and
unresolved decisions in chat. For direct design, stop there. Within delivery,
continue from the revised decision without staging a workflow handoff.
