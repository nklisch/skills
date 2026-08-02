# Provocation Lenses

Use these lenses when the user asks for an architectural rethink, a bold
refactor, deep simplification, or "what single idea would make this code much
simpler?" They govern how to *find* a reconception — a different axis from the
delivery-shape lenses in `design`.

This reference is a cousin of the code-audit `bold-refactor` skill's lens
table. The table is shared; the framing is not. Edit each on its own terms
rather than syncing them mechanically.

## Discuss established systems before creating work

Provocation applied to an established system requires deliberate human
discussion before it becomes work, regardless of the repository's autonomy
posture. Do not autonomously scope a bold refactor of established
behavior-bearing code. Surface proposals, stress-test them together, and let
the human choose which — if any — become items.

The exception is **net-new simplification**: reshaping new, unshipped, or
not-yet-established code follows the normal autonomy rules and carries no
extra gate.

## Name behavior changes instead of ruling them out

A proposal may change observable behavior when the simplification warrants
it. Two rules apply:

1. Name every intended behavior delta during ideation, and carry each one
   into the design record so the human adjudicates with full knowledge.
2. Behavior change alone is never a reason to drop, dilute, or apologize for
   a proposal. The question is whether the simplification earns the delta.

This is the one sanctioned exception to `design`'s black-box rule that a
refactor preserves observable behavior. It applies only after the human has
accepted the named deltas.

## The lenses

The six lenses below are a **starting set**, not a closed list. Devise your
own when the code suggests it — a lens drawn from experience, including one
not listed here, is exactly as valid as these. What matters is the *spirit*
of provocation: dramatic simplification through reconception, not adherence
to the enumerated lenses.

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
mediocre ones. "Do nothing" is a legitimate conclusion when the code does not
justify a bold change.

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

## Challenge proposals with a skeptical reviewer

Before proposals reach the human, hand them to a fresh-context reviewer — a
sub-agent that shares none of the generation history — preferring a different
model class than the one that generated them. When only one model class is
available, assign a starkly skeptical persona instead.

The division of labor is deliberate: the generator reaches for the stars; the
reviewer is the critical engineer standing in the way of unnecessary rewrites.
The reviewer defaults to no, and the proposal carries the burden of proof. It
checks that each proposal is:

- **Real** — the cited evidence exists and actually supports the thesis; no
  imagined patterns.
- **Feasible** — the change could actually land, with what breaks and the
  hardest part named.
- **Net simplification** — it removes more complexity than it adds, rather
  than moving complexity around or hiding it behind new abstraction.

Verdicts are kill, narrow, or pass, each with reasons, and they travel with
the proposals into the human discussion — the human adjudicates with the
ambition and the critique both visible. A killed proposal may still be
advocated, but only with its verdict attached.

## Outcomes are substrate, not reports

Provocation inside workbench ends in the normal `ideate` handoffs the user
explicitly selects: an activated item (with behavior deltas in its body), a
parked idea, or commissioned research. Do not write a report artifact.

When the user instead wants a full report-driven sweep outside workbench
tracking and the code-audit `bold-refactor` skill is available, say so and
defer to it. That skill's standalone report is the right artifact for
non-substrate contexts.
