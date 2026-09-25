# Maintenance and Simplification

## Contents

- Cleanup work
- Pattern lifecycle
- Pattern shape

## Cleanup work

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

When the cleanup lands, apply the proactive pattern check in the
[pattern lifecycle](#pattern-lifecycle).

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

The canonical `.agents/skills/patterns/SKILL.md` indexes the repository's
catalog: focused pattern references and the `pathologies.md` reference, whose
entry shape and limits
[code craft](../../code-craft/SKILL.md#the-repository-catalog) defines. The index
may remain an empty setup stub; it links references without duplicating their
bodies.

During delivery, update or remove an existing entry the current outcome makes
false, but add nothing new. Report candidate evidence to the outcome owner
instead: completed item ids, real examples, recurrence, the emerging preferred
shape, and the expected reduction in ambiguity or coordination cost. In
multi-unit work, keep useful candidates in the active parent's
`## Maintenance evidence` section. Do not create an empty section.

At an integration checkpoint the outcome owner controls, the owner runs a
catalog pass when candidates meet the recurrence bar. Larger boundaries, such as
an integration review that covers an epic or several features, are typically
the most useful points, because recurrence shows across units there. The pass
needs no separate extraction outcome or approval:

- Add or update a pattern when its shape meets the recurrence bar in
  [pattern shape](#pattern-shape).
- Add or replace pathology examples, and add repository pathologies, under code
  craft's catalog rules.
- Update and consolidate existing entries before adding new ones, and remove
  entries the work made false.
- Discard candidates that are coincidence or lack value, and remove their
  temporary evidence with the completed owner.
- List what the pass added, changed, or removed in the completion reply so the
  user can revert any of it.

Candidates that do not yet meet the bar wait for a later checkpoint or are
discarded. An explicit user request to detect or extract patterns runs the same
pass as an ordinary feature. Only the outcome owner writes new entries; nested
stories and assigned units report candidates.

A refactor, rewrite, or simplification often creates the shape a pattern
records. When one lands, check proactively what it changed in the catalog, in
that outcome's catalog pass rather than leaving the lesson in the work item:

- If it unified near-copies or produced a better model for an existing pattern
  or pathology, update that entry or its model to copy. Updating an existing
  entry needs no recurrence count.
- If it established a new shape that three or more consumers now share, record
  it as a new pattern.
- A new shape with fewer consumers stays a candidate until it meets the bar.

At integration or planning, distinguish cleanup the same way:

- **Required cleanup:** finish cohesive behavior-preserving work needed to leave
  the accepted outcome correct and coherent. Name the accepted requirement or
  affected contract that makes it necessary. Mere recurrence is insufficient.
- **Optional cleanup or refactoring beyond the boundary:** recommend the benefit
  and offer a separate outcome or parking.
- **Coincidence or insufficient value:** discard it.

Evidence establishes usefulness, not authorization for other work. Create a
cleanup or refactoring feature only when the user selects it or the accepted
scope already includes it. Only required in-scope cleanup can be a completion
dependency, and the catalog pass never extends the checkpoint beyond its own
entries. An unanswered optional offer does not block delivery or closure.
Include it in the completion reply and preserve only user-selected durable
handoffs. No count or schedule creates a maintenance gate.

A selected maintenance feature belongs under the active epic only when that
epic owns its accepted outcome. Otherwise it is top-level. Never nest it under
another feature or attach a separately selected follow-up as a prerequisite
without an actual dependency. A confirmed pattern records the recurring problem,
preferred shape, repository benefit, real consumers or examples, and exceptions.
Generic stack advice, mechanical formatting, and architecture or principle truth
belong elsewhere.

## Pattern shape

The effective `evidence_depth` sets the reach of candidate evidence gathering:
`lean` records only an obvious, high-value candidate; `standard` checks touched
code and nearby consumers; `deep` may examine relevant packages.

Recurrence makes a candidate real. The bar is three genuine occurrences of the
same shape, solving the same class of problem for the same underlying reason.
One implementation is never a pattern.

Each `.agents/skills/patterns/<slug>.md` reference carries:

```markdown
# <Pattern name>

> <One-line description of the recurring structure.>

## Why it exists

<Project-specific problem and trade-off.>

## Evidence

- `path/file:line` — <role in the pattern>

## Shape

<Boundaries, data flow, ownership, or sequence that defines the pattern.>

## Use when

- <circumstance, and the exception or competing pattern that overrides it>

## Meaningful drift

<How to recognize divergence worth investigating.>
```

Prefer file references and structural explanations to large copied snippets,
which stale quickly. Update an existing pattern when its shape or exceptions
change, consolidating near-duplicates instead of accumulating them.
