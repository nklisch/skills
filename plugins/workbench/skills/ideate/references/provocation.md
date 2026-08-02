# Provocation Lenses

Use these lenses when the user asks for an architectural rethink, a bold
refactor, deep simplification, or "what single idea would make this code much
simpler?" They govern how to *find* the idea — a different axis from the
delivery-shape lenses in design. This reference adapts the code-audit
`bold-refactor` skill's lens table to ideation; the framing differs by design,
so edit each cousin on its own terms rather than syncing them mechanically.

## The human-approval gate

Provocation applied to an **existing, established system** always goes through
deliberate human discussion and approval before becoming work. Never
autonomously scope a bold refactor of behavior-bearing existing code, whatever
the current autonomy posture: surface proposals, stress-test them together,
and let the user choose which — if any — become items.

Exception: **net-new simplification** — reshaping new, unshipped, or
not-yet-established code — carries no such gate and follows the normal
autonomy rules.

## Behavior change is allowed, never hidden

A provocation proposal may change observable behavior where the simplification
or unification warrants it. Two rules follow:

1. Name every intended behavior delta explicitly during ideation and carry it
   into the design record, so the human adjudicates with full knowledge.
2. Behavior change alone is never grounds to drop, dilute, or apologize for a
   proposal. The question is whether the simplification earns the delta.

This is the one sanctioned exception to design's black-box rule that a
refactor preserves observable behavior — and only after the human has
accepted the named deltas.

## The lenses

Commit each proposal to one primary lens.

| Lens | Core question |
|---|---|
| Elimination | What if this code or concept disappeared? What actually breaks? |
| Unification | What different-looking things are secretly the same? |
| Inversion | What if control flowed the other way? |
| Algebraic | What types and compositions are hiding in imperative code? |
| Declarative | What rule language or data model is trying to emerge? |
| Domain crystallization | What domain concept is unnamed but everywhere? |

## The quality bar

Every proposal must pass this test: would it surprise a senior engineer, then
convince them after they read the evidence? One sharp proposal beats five
mediocre ones, and "do nothing" is a legitimate conclusion when the code does
not justify a bold change.

Reject suggestions that amount to:

- extracting a tiny helper used twice;
- an interface with one implementation;
- a pattern applied because the pattern exists;
- speculative extensibility;
- wrapping a third-party library only because it might be swapped someday;
- reorganizing files without changing the system's mental model.

Respect documented project intent: do not frame a deliberate pattern as a
problem unless the evidence shows the pattern is failing.

## Shaping a proposal

For each proposal that survives, capture:

- **Provocative name** — the insight, not a task title.
- **Primary lens** and one-sentence **thesis**.
- **Evidence** — the files and shapes that reveal it.
- **Impact** — what disappears, unifies, or gets simpler.
- **Behavior deltas** — every intended observable change, named.
- **Cost and risk** — migration hazards and what could break.
- **Riskiest assumption** — what to validate first.

## Outcomes are substrate, not reports

Provocation inside workbench ends in the normal ideate handoffs the user
explicitly selects: an activated item (with behavior deltas in its body), a
parked idea, or commissioned research. Do not write a report artifact.

When the user instead wants a full report-driven sweep outside workbench
tracking and the code-audit `bold-refactor` skill is available, say so and
defer to it — that skill's standalone report is the right artifact for
non-substrate contexts.
