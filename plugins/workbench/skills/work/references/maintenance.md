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

The active parent keeps that evidence in a compact `## Maintenance evidence`
section until an explicit integration or planning boundary. No fixed count or
periodic schedule triggers extraction. Treat roughly three genuine occurrences
as a useful signal, not a quota. At the boundary, the `work` owner must dispose
of each candidate:

- enough evidence → create and complete an ordinary feature tagged `pattern`
  plus `refactor` or `cleanup` when applicable;
- potentially useful but immature → offer to `park` the evidence for a future
  boundary;
- aesthetic coincidence or insufficient value → remove the candidate.

A maintenance feature belongs under the active epic when that epic owns the
large boundary; otherwise it is top-level. Never nest it under another feature.
In collaborative mode, discuss a consequential maintenance outcome before
binding it. In adaptive or autonomous mode, the owner may create it when the
user-authorized multi-unit boundary and concrete recurrence establish the scope.
A smaller delivery never gains an extraction feature silently.

An explicit user request to detect or extract patterns creates the same ordinary
feature directly. That feature owns catalog additions and cohesive
behavior-preserving cleanup before integrated review. A confirmed pattern
records the recurring problem, preferred shape, repository benefit, real
consumers or examples, and exceptions. Generic stack advice, mechanical
formatting, and architecture or principle truth belong elsewhere.
