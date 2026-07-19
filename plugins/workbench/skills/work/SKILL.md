---
name: work
description: >
  Use for any substantive Workbench request: scope or clarify work, gather requirements, research an
  unknown, create and refine UI mockups, design, implement, review, scan, fix, continue active work,
  or autonomously finish a natural-language scope. Operates the lightweight .work/ ledger, selects
  activities and agent orchestration from project context and judgment, reconciles foundation truth,
  and archives or removes completed work immediately.
---

# Work

Carry the user's requested software work to an appropriate, verified outcome.
Treat their natural language as the control surface. Do not force them to name a
phase, skill, item kind, size, review level, or worker topology.

## Start with the requested boundary

Interpret how far the user asked you to go:

- “scope,” “clarify,” or “design” stops after the requested understanding or
  design is recorded;
- “implement,” “fix,” or “build” includes sufficient requirements and design,
  implementation, verification, and proportionate review;
- “scan” investigates the named concern and creates normal active or parked work
  for findings worth retaining;
- “finish,” “handle this end to end,” or an autonomous goal carries the named
  scope until complete or genuinely blocked;
- a narrow request must not silently become a queue-drain operation.

If no Workbench substrate exists, invoke `setup`. If `.work/CONVENTIONS.md`
names a different owner, halt: do not mix Workbench with another `.work/`
schema.

Read `.work/CONVENTIONS.md`, project instructions, relevant active items,
foundation documents—including project-owned `docs/PRINCIPLES.md` when
present—the project pattern catalog under `.agents/skills/patterns/`, and current
code before making structural decisions.
Resolve the six optional workflow preferences through
[references/preferences.md](references/preferences.md): explicit user direction
for this request, then project override, then Workbench default. Resolve each
independently and never persist a prompt override unless the user asks to change
the project convention. At both entry and exit, run the terminal-item sweep in
[references/lifecycle.md](references/lifecycle.md).

## Requirements are the center

Before confident design or implementation, establish the actual outcome,
audience, behavior, constraints, exclusions, and acceptance evidence. Read
[references/requirements.md](references/requirements.md).

Learn discoverable facts yourself. Inspect the repository and use current-source
lookup for unstable external facts before asking the user. Ask the user for
preferences, product direction, supported behavior, trade-offs, and other
choices only they can settle.

Use the host's structured question tool when it is available and helpful. If it
is unavailable, ask the same questions plainly in the conversation and **pause
for the answer**. Never treat the absence of a special question tool as
permission to guess or continue through a consequential ambiguity.

Record settled requirements, explicit exclusions, and unresolved agent
discretion in the item body. Put detailed evidence in `.research/` and
interactive walkthroughs in `.mockups/`, then connect them through the item's
`research_refs` and `mock_refs`. Do not manufacture a large template for simple
work.

## Select lenses by need

The workflow-preferences reference is always active. Load other references only
when the work earns them:

- reported defects, regressions, failing behavior, or explicit fixes →
  [debugging.md](references/debugging.md);
- unfamiliar, contested, or current external facts →
  [research.md](references/research.md);
- any non-trivial user interface or journey →
  [ui-ux.md](references/ui-ux.md);
- substantial design, implementation, explicit refactor/pattern scans, or a
  stable autonomous completion boundary →
  [maintenance.md](references/maintenance.md);
- multi-unit or delegated execution →
  [execution.md](references/execution.md) and
  [model-tendencies.md](references/model-tendencies.md);
- implementation completion or an explicit review request →
  [review.md](references/review.md);
- item creation, relationships, blocking, completion, or commits →
  [lifecycle.md](references/lifecycle.md).

Security, accessibility, performance, tests, documentation, compatibility,
data integrity, and operational readiness are lenses, not gates. Apply them when
the request, affected surface, or discovered risk warrants them. A scan is an
ordinary `kind: scan` work item if durable tracking helps; otherwise it can be a
bounded activity inside another item.

## Shape the item

Use one active item when the work has one coherent outcome. Create an epic only
when several independently meaningful outcomes need a durable parent. Create
separate feature or story items only when their independent status or dependency
matters across sessions. A story is a durable outcome, not a default agent unit. Temporary agent assignments belong under
`## Execution approach`, not automatically in `.work/active/`.

Use:

- `hard_dependencies` for prerequisites that truly prevent useful execution;
- `soft_dependencies` for helpful order, shared context, or coordination that
  does not make execution invalid;
- `parent` for outcome hierarchy, never scheduling;
- `status: blocked` only with a concrete `## Blocker` and the condition that
  would unblock it.

Keep the item body and artifact references current. Replace superseded decisions
rather than appending a chronicle. Preserve implementation discoveries that
change requirements, design, integration, or future handoff.

## Design and execute with judgment

Design only to the depth needed to make implementation safe and coherent. Name
boundaries, contracts, state changes, failure behavior, user-visible behavior,
and verification where they matter. Do not duplicate details that are obvious
from current code. For substantial work, run the embedded elimination,
pattern-fit, principle-fit, and adjacent-refactor pass from `maintenance.md`;
record it only when it changes the design.

For a bug fix, reproduce first, establish failing regression evidence when
practical, diagnose the root cause, apply the smallest coherent correction, and
prove the original failure now passes. Do not make speculative fixes when the
behavior cannot be reproduced; follow `debugging.md`.

For implementation, first decide whether continuity in the host context is more
valuable than delegation. When delegation helps, write a high-level execution
approach with coherent work units, outputs, ownership, hard and soft
relationships, integration points, and verification. Parallelize only where
independent progress is real. Use worktrees when isolation materially reduces
write collision or rollback risk—not merely because several units exist.

Loops are allowed wherever evidence calls for them: requirement clarification,
research, mock refinement, implementation correction, integration, or review.
No fixed number of passes substitutes for convergence on the requested outcome.

Inspect delegated results and actual diffs. The orchestrating agent owns
integration, acceptance, and final judgment; worker confidence is not evidence.

## Preserve standing truth

Before completing affected work, reconcile foundation documents. Every retained
assertion must describe current truth or clearly intended future truth.
Foundation documents contain vision, direction, architectural boundaries,
high-level design, and durable contracts—not code-level implementation details,
file inventories, local algorithms, or historical narration. Code is the source
of truth for implementation.

Update false or contradictory assertions in place. Omission is allowed: do not
expand foundation documents merely to mention everything implemented.

## Verify and close

Verify the behavior at the most stable useful interface. Run authoritative
project checks and inspect meaningful user journeys. Review depth follows
actual consequence and uncertainty; reviewer findings are proposals that the
receiver must verify and adjudicate.

When the requested outcome is complete:

1. reconcile affected foundation truth;
2. at a stable feature, autonomous-scope, or release boundary, perform the
   signal-driven pattern harvest from `maintenance.md` when the changed code
   provides a concrete recurrence signal;
3. record a concise outcome and useful review evidence;
4. atomically archive the item as a stub when `release_mode: summarized`, or
   remove it when `release_mode: none`;
5. sweep any other stale terminal items;
6. commit at a coherent delivery boundary if project policy permits agent
   commits—normally one feature-sized delivery, not one workflow event.

Do not leave `done` or `completed` items in `.work/active/`. Do not report
completion while required verification is failing or a consequential blocker is
unresolved.

## Output

Report only what helps the user steer or trust the result:

- the interpreted scope and any consequential assumptions;
- requirements or UI choices still awaiting them;
- work completed and meaningful design decisions;
- research confidence and sources when used;
- execution topology when delegation or worktrees mattered;
- verification and review result;
- active blockers or parked follow-ups;
- archive/removal and commit outcome.
