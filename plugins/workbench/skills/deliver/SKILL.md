---
name: deliver
description: >
  Implement, verify, review, reconcile, and close one named implementation-ready Workbench feature
  or story. Use only when .work/CONVENTIONS.md declares owner: workbench and one accepted item has
  settled requirements and design readiness. Supports direct single-item delivery and units assigned
  by work; route unscoped, ambiguous, multi-unit, or design-shaping requests through work or design.
---

# Deliver

Carry one implementation-ready Workbench feature or story through its appropriate
finish line. `deliver` is the bounded implementation skill. `work` remains the
outcome owner for scoping, requirements, design routing, multi-unit orchestration,
wider integration, and parent closure.

Unless an instruction names a repository path or artifact, communicate in the
current conversation. Do not create report files or durable no-op records.

## Confirm activation and mode

Confirm that an upward-found `.work/CONVENTIONS.md` declares `owner: workbench`.
If it does not, ignore this skill and handle the request without Workbench. Read
conventions and apply
[setup's version check](../setup/references/version-compatibility.md) before any
mutation.

Require one named active feature or story. Resolve one mode:

- **Direct:** the user invokes `deliver` for this single item. `deliver` owns the
  item outcome, shared pattern decisions, integrated review when applicable,
  reconciliation, and closure.
- **Orchestrated:** `work` assigns the item inside a wider boundary and supplies
  the parent outcome, owned write surface, integration contract, effective Git
  posture, and return evidence. `deliver` never writes the shared pattern
  catalog or closes the parent boundary.

Do not infer orchestrated mode from parentage alone. A feature inside an epic may
still be delivered directly. Orchestrated mode requires an explicit assignment
from `work`.

## Check readiness

Read the item, `.work/CONVENTIONS.md`, its current `## Overbuilding
calibration`, project instructions, repository-wide and applicable scope-owned
principles, relevant foundations, accepted design, affected code and tests,
`.knowledge/index.json` when present, and relevant references from the canonical
`.agents/skills/patterns/SKILL.md` index.

Return control to `work` when the target is missing, blocked, unscoped, spans
several independently meaningful units, or lacks a coherent success shape.
Return to `design` when implementation still needs consequential discovery,
alternatives, boundary definition, or adjudication. Do not guess missing product direction,
external contracts, irreversible choices, or behavior changes hidden inside a
purported refactor.

Resolve effective autonomy, simplification, and
[execution posture](../work/references/execution-posture.md) from the request
and conventions. Under `inline`, the main agent performs this entire
delivery workflow without spawning role agents. Under `adaptive` or
`orchestrated`, a deliverer may be a dedicated implementation agent when the
handoff is worthwhile or preferred.
Resolve the effective [Git posture](../work/references/git-posture.md) from
explicit user direction, project conventions, then `adaptive`.
Read the applicable references under `../work/references/`, especially
`simplification.md`, `maintenance.md`, and `verification.md`.
Use conventions and principles as implementation and review lenses within the
accepted outcome; they do not authorize new requirements or adjacent work.

## Implement the item

Work only inside the accepted outcome and assigned surface. Apply the current
project calibration as a proportionality lens; it does not add requirements.
When implementation is delegated, use the shared context from
[role-handoffs.md](../work/references/role-handoffs.md) and give the implementer
an exact owned write surface, integration contract, checks, and return evidence.
Follow confirmed coding and structural guidance from its owning authority:

- formatter and linter configuration owns mechanical rules;
- `AGENTS.md` owns concise agent operating rules;
- foundations own architecture and engineering principles;
- `.agents/skills/patterns/` owns detailed recurring implementation shapes.

Apply the effective simplification posture. Eliminate unnecessary machinery
before adding abstractions. Preserve observable behavior, guarantees, safety,
compatibility obligations, and measured performance constraints unless the user
explicitly authorizes a change. Do not turn pattern drift into conformity churn.
Do not invent durable correctness, accounting, verification, state, or
determinism machinery that the accepted design reasoning did not justify. If
implementation reveals a consequential need for it, return to design instead
of quietly growing the system; keep small, obvious local checks inline.

Pause and return to the outcome owner when implementation exposes a missing
requirement, consequential design choice, material scope expansion, or
production, real-data, irreversible, or external action. Report useful adjacent
findings for parking instead of absorbing them.

## Verify and reconcile

Run authoritative project checks and the smallest credible evidence at stable
interfaces or meaningful user journeys. Inspect the final item diff for
correctness, accidental behavior change, unnecessary complexity, plausible
performance regression, and scope expansion.

Apply the lifecycle in [maintenance.md](../work/references/maintenance.md):

- repair an existing pattern when this outcome makes it stale and the item owns
  that catalog surface;
- ordinary delivery never promotes a new pattern ad hoc;
- orchestrated delivery returns candidate evidence for the active parent's
  `## Maintenance evidence` section and never writes the shared catalog;
- a direct ordinary item reports a candidate for explicit parking or a future
  large-work boundary;
- only an accepted feature explicitly scoped to pattern detection or extraction
  may add new pattern references and any cohesive behavior-preserving cleanup.

Read [foundation-truth.md](../work/references/foundation-truth.md). Reconcile
foundation assertions directly affected by this completed item, apply its
altitude test so delivery and qualification details remain in the work record
or owning executable surfaces, and rebuild the knowledge index when indexed
documentation changes.

When the item links or owns a provisional `docs/spec/` artifact, read
[provisional-specs.md](../work/references/provisional-specs.md) and reconcile it
before establishing the review target. Delete it when the described contract
or interface is delivered and code owns the structure. If only part of its
scope was delivered, narrow or split it so the surviving file describes only
unresolved intended work and still names its owner and cleanup condition. Do
not close an item while it leaves a stale provisional spec or duplicate
structural authority.

Establish a stable review target after this pre-review verification and
reconciliation. Normally use a coherent commit or commit range; use a clearly
bounded working-tree diff when committing would interfere with concurrent work
or contradict project policy. Review corrections may remain separate while
review is active when that makes their delta useful to inspect.

## Review at the correct boundary

Determine the item's role:

- **Feature or standalone story:** this item is an integrated review boundary.
  Apply [review.md](../work/references/review.md) at the effective weight after
  code, owned stale-pattern repairs or extraction changes, and affected
  foundations are coherent.
- **Story nested under a feature:** this item is an implementation slice. Run
  self-review and behavioral verification, then return evidence to the feature
  owner. Do not run a duplicate review pass that belongs at the feature's
  integrated boundary.

Adjudicate findings rather than accepting them blindly. Every formal distinct
review must include the exact canonical boundary instruction from
[role-handoffs.md](../work/references/role-handoffs.md), as required by
`review.md`. `work` does not repeat completed feature or standalone-story
review; it reviews only substantive wider integration behavior not covered at
those item boundaries.

## Close and return

Close the completed item immediately according to `completed_items` and
[lifecycle.md](../work/references/lifecycle.md). A nested story may close after
its slice is verified; its parent feature remains open for integration and
review. Never close a parent or wider boundary from `deliver`.

After a feature or standalone story passes its required review, close it and
run final verification. Shape the resulting history according to the effective
Git posture. Feature-level consolidation is preferred only under `feature`—or
when `adaptive` resolves that way—and only when the history is exclusively
owned and rewriting it is simple and safe. Checkpoint and preserve postures keep
meaningful commits; batch posture leaves wider consolidation to `work`. Nested
stories follow the owning feature's posture. Squashing is never an acceptance
criterion, and shared, published, or concurrently owned history must not be
rewritten merely to achieve an ideal shape.

In orchestrated mode, return concise integration evidence to `work`: delivered
behavior, files changed, checks and review performed, interface assumptions,
foundation changes, pattern implications, blockers, and intentionally excluded
findings. In direct mode, reply with the same evidence and the closure
disposition.
