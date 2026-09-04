# Maintenance and Simplification

Use this reference both for cleanup embedded in delivery and for standalone
cleanup, simplification, refactor, or technical-debt outcomes. Read
[simplification.md](simplification.md) first and apply the effective posture.

For embedded maintenance, include only cohesive behavior-preserving cleanup
inside the affected delivery boundary. Its breadth follows the effective
simplification posture; park unrelated opportunities.

For standalone maintenance, create an ordinary feature or story with a bounded
surface, reason the current structure is costly or unsafe, invariants to
preserve, observable completion evidence, and rollback or migration concerns
where relevant. Tag it `cleanup` or `refactor`; use an epic only when several
independently verifiable subsystems need durable coordination. Separate or
explicitly gather requirements for intended behavior changes rather than
hiding them inside a purportedly behavior-preserving refactor. Preserve measured
performance constraints and avoid obvious plausible regressions in affected
code; do not manufacture low-level optimization work without evidence.

Then:

1. Eliminate obsolete concepts, code, configuration, and compatibility before
   adding new machinery.
2. Follow demonstrated repository patterns where they remain sound.
3. Improve boundaries when the current change exposes a real responsibility or
   contract problem.
4. Include cohesive behavior-preserving cleanup that makes the delivery safer
   or simpler.
5. Park valuable broader findings instead of expanding the current scope.

## Pattern lifecycle

The canonical `.agents/skills/patterns/SKILL.md` may remain an empty setup stub.
Its focused references own confirmed pattern details; the index links them
without duplicating their rule bodies.

Update or remove an existing pattern when the current outcome makes it false.
Ordinary delivery does not promote a new pattern. It reports candidate evidence
to the owning large `work` boundary: completed item ids, real consumers or
examples, recurrence, the emerging preferred shape, and the expected reduction
in ambiguity or coordination cost.

When candidates exist, keep only useful continuation context in the active
parent's `## Maintenance evidence` section. Do not create an empty section.
At integration or planning, distinguish these cases:

- **Required cleanup:** finish cohesive behavior-preserving work needed to leave
  the accepted outcome correct and coherent. Name the accepted requirement or
  affected contract that makes it necessary. Mere recurrence is insufficient.
- **Optional learning or extraction:** recommend the benefit and offer a separate
  outcome or parking, whether the evidence is mature or tentative.
- **Coincidence or insufficient value:** discard the candidate.

Evidence establishes usefulness, not authorization. A multi-unit request,
autonomous posture, or repeated pattern does not authorize catalog expansion.
Create an extraction feature only when the user selects it or the accepted
scope already includes it. Only required in-scope cleanup or explicitly
included extraction can be a completion dependency. Do not turn useful learning
into a surprise condition for finishing the original request.

An unanswered optional offer does not block delivery or closure. Include it in
the completion reply and preserve only user-selected durable handoffs. Remove
its temporary evidence with the completed owner under the normal lifecycle.
No count, schedule, or evidence-disposition ceremony creates a maintenance gate.

A selected maintenance feature belongs under the active epic only when that
epic owns its accepted outcome. Otherwise it is top-level. Never nest it under
another feature or attach a separately selected follow-up as a prerequisite
without an actual dependency.

An explicit user request to detect or extract patterns creates the same ordinary
feature directly. That feature owns catalog additions and cohesive
behavior-preserving cleanup before integrated review. A confirmed pattern
records the recurring problem, preferred shape, repository benefit, real
consumers or examples, and exceptions. Generic stack advice, mechanical
formatting, and architecture or principle truth belong elsewhere.
