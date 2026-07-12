---
id: feature-agile-workflow-lifecycle-agency-orchestrator-rewrite
kind: story
stage: implementing
tags: [skill, plugin]
parent: feature-agile-workflow-lifecycle-agency
depends_on: []
release_binding: null
gate_origin: null
created: 2026-07-12
updated: 2026-07-12
---

# Rewrite implement-orchestrator around outcomes and invariants

## Scope

Unit 2 of `feature-agile-workflow-lifecycle-agency`. Sole owner of
`implement-orchestrator/SKILL.md`. Rewrite the skill so it states durable
outcomes and invariants and lets the agent derive execution topology
(bundles, waves, write-scope, worker capability) from dependency, ownership,
repository shape, and risk. Remove the pseudo-precise recipes, examples, and
prescribed prompts. Apply the lifecycle-completion and worker-capability
contracts.

This story implements the orchestrator side of the **Lifecycle completion
contract**, the **Inline-vs-delegated and worker-capability contract**, and the
**Consolidation and line-budget contract** defined in the parent feature body.
Read that body before editing.

## File (disjoint ownership)

- `plugins/agile-workflow/skills/implement-orchestrator/SKILL.md` (currently
  604 lines — over the 500-line budget; the rewrite brings it under)

No other story edits this file.

## Changes

Keep these load-bearing invariants (the value the orchestrator adds over inline
`implement`):

- Ground in every parent feature and item before dispatch.
- Dependency-graph-driven scheduling over the unified `depends_on` graph
  (cross-feature is fine); validate entries and cycles; drop cross-scope
  unmet deps with a logged note.
- Write-set independence governs parallelism; serialize or merge when write
  sets overlap; worktree isolation when overlap is unpredictable or write paths
  are large and disjoint.
- Verify after each wave; do not proceed on an unverified wave.
- One commit per item.
- Conservative parent roll-up (implementing → review): advance a parent feature
  only when all of its children are terminal-or-review.
- Worker self-containment: every worker prompt carries ownership, dep readiness,
  land-mode, design-flaw escape hatch, verification, one-commit-per-item,
  test-integrity, and emotional framing.

Remove (the brief explicitly targets these):

- Bundle sizing recipes and the multi-item-bundle-criteria numerical prose
  (LoC thresholds, items-per-bundle ranges, etc.).
- Fixed or default wave widths and any "safe default N per wave" prescription.
- The long single-item and multi-item worker **prompt templates**. Replace with
  a statement that the orchestrator crafts self-contained worker prompts from
  the implementer posture in `principles/references/subagents.md`, including
  the load-bearing elements above, **without prescribing fixed wording or
  fixed sizes**.
- The routine "settle implementation tier — ask once" question.

Apply the shared contracts:

- **Lifecycle completion**: after a wave advances items and parents to
  `review`, continue through the review lane for the scope (invoke review;
  honor bounce/blocker; honor explicit `stop-at-review`). The review → `done`
  roll-up itself is owned by the review story
  (`…-review-lane-rollup`); the orchestrator's output points at it.
- **Worker capability**: choose worker capability from risk/scope unless the
  caller (goal/args), a stable project convention, or an autopilot caller note
  overrides; state the choice in run notes; never re-ask per wave.

Keep the scope-argument surface and the Phase 1 / 1.5 grounding-and-sizing
discipline (read-first probe before any exploratory fan-out), restated in
invariant terms rather than numerical recipes.

## Acceptance criteria

- [ ] No bundle examples, sizing recipes, fixed wave widths, or prescribed
  prompt templates remain in the file.
- [ ] The load-bearing invariants above are all present and load-bearing
  (not buried only in a reference).
- [ ] The orchestrator continues through the review lane by default;
  `stop-at-review` is honored.
- [ ] Worker capability is chosen from risk/scope and logged; no routine
  model-tier question.
- [ ] Worker self-containment preserved — worker prompts still carry the full
  boundary and test-integrity text, generated from the posture reference.
- [ ] `implement-orchestrator/SKILL.md` ≤ 500 lines.
- [ ] SKILL.md frontmatter remains portable (`name`, `description` only) per
  `repo-skill-style`.

## Notes

- Parallel-safe with the other three skill-touching stories (disjoint file
  ownership).
- Do not edit `review/SKILL.md` or `autopilot/SKILL.md` here — the review-side
  lane/roll-up work is `…-review-lane-rollup`.
- Do not edit `principles/SKILL.md` here — advisory/question policy is
  `…-question-advisory-policy`.
