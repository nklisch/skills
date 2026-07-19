# Embedded Simplification, Patterns, and Refactoring

Workbench embeds a lightweight maintenance pass while shaping substantial work
and harvests recurring patterns at stable, signal-rich completion boundaries.

## Sources of truth

Read when present:

- `docs/PRINCIPLES.md` — user-confirmed high-level engineering philosophy;
- `.agents/skills/patterns/SKILL.md` and its references — observed recurring
  implementation structures;
- project instructions and tool configuration — sharp rules and mechanically
  enforced conventions;
- the current work item — requested behavior and scope.

User-confirmed direction establishes principles; concrete recurrence establishes
patterns. When sources conflict, investigate whether code drifted, the pattern
became obsolete, or the standing principle needs a user decision.

## Design hygiene pass

For every substantial design, inspect the touched area before settling the
approach:

1. **Elimination first** — identify code, tests, checks, wrappers, options,
   compatibility paths, files, or concepts the change can remove, inline,
   consolidate, or make unnecessary.
2. **Pattern fit** — find the established structures that already solve nearby
   problems and decide whether the design should follow them.
3. **Boundary fit** — check the design against confirmed project principles and
   durable architectural contracts.
4. **Emerging recurrence** — notice a structure the change would introduce or
   repeat and whether a named pattern would help future work.
5. **Adjacent cleanup** — identify behavior-preserving cleanup that reduces the
   current implementation's complexity or integration risk.

Record `## Simplification and pattern fit` only when it carries a meaningful
decision.

Fold cleanup into the current delivery when it is behavior-preserving, cohesive
with the write area, proportionate to risk, and easier to verify together. Park
broader opportunities. Anything that changes observable behavior is normal
feature work, not a refactor, even if the motivation is architectural.

## Adaptive pattern harvesting

Run a focused harvest when concrete signals appear:

- a feature-sized delivery introduces or reveals repeated structure;
- the same meaningful shape appears for roughly the third time;
- a shared helper, fixture, composition root, module contract, state transition,
  or error-propagation approach becomes reusable;
- review finds repeated divergence from one established solution;
- a substantial autonomous scope or epic reaches a stable completion boundary;
- release preparation brings several related deliveries together.

Start with changed files at these boundaries and follow concrete candidates into
nearby consumers only as far as needed to establish recurrence and usefulness.

Calibrate breadth with `rigor`: `lean` records only an obvious high-value
pattern, `standard` checks touched code and nearby consumers, and `rigorous` may
broaden across relevant packages. Under `execution: parallel`, a read-only
pattern scanner can inspect an independent broad surface, but the host verifies
its evidence and owns catalog edits.

## What earns a pattern

A pattern should:

- recur in concrete code, with three genuine occurrences a strong signal;
- solve the same class of problem for the same underlying reason;
- help a future agent choose or implement correctly;
- have a stable enough shape to name;
- encode structural implementation knowledge beyond formatting, naming, tool
  rules, or broad architecture doctrine.

Catalog structures with demonstrated reuse and continuing value.

## Pattern catalog shape

`.agents/skills/patterns/SKILL.md` is a portable index. Each
`.agents/skills/patterns/<slug>.md` contains:

```markdown
# <Pattern name>

> <One-line description of the recurring structure.>

## Why it exists

<Project-specific problem and trade-off.>

## Evidence

- `path/file:line` — <role in the pattern>
- `path/other:line` — <role in the pattern>
- `path/third:line` — <role in the pattern>

## Shape

<Boundaries, data flow, ownership, or sequence that defines the pattern.>

## Use when

- <circumstance>

## Do not use when

- <exception or competing pattern>

## Meaningful drift

<How to recognize divergence worth investigating.>
```

Prefer file references and structural explanation over large copied snippets,
which stale quickly. Update an existing pattern when its current shape or
exceptions evolve, consolidating near-duplicates.

Pattern edits normally travel with the coherent delivery that revealed them.

## Finding disposition

- **Useful, cohesive, behavior-preserving now** — include in the current design
  or implementation and verify with it.
- **Useful but broader** — park with evidence and expected payoff.
- **Material current pattern drift** — fix within scope or create active work.
- **Behavior-changing improvement** — classify as normal feature/story work.
- **Aesthetic inconsistency or churn-only conformity** — discard.
- **Documented pattern no longer deserves authority** — update or retire the
  pattern based on current evidence rather than forcing code backward.

A user-requested full refactor or pattern scan applies these lenses to the named
natural-language scope and emits normal Workbench work.

## Autonomous work boundaries

During a long autonomous request, harvest after a coherent feature-sized
delivery, when repeated structure becomes visible, or before claiming the
requested aggregate scope is complete. This keeps maintenance aligned with
delivery boundaries.

A pattern inconsistency alone does not prevent completion. Only a
receiver-confirmed material risk to the requested outcome blocks; broader valid
maintenance is parked.
