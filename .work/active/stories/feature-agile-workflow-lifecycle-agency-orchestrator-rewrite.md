---
id: feature-agile-workflow-lifecycle-agency-orchestrator-rewrite
kind: story
stage: done
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

- [x] No bundle examples, sizing recipes, fixed wave widths, or prescribed
  prompt templates remain in the file.
- [x] The load-bearing invariants above are all present and load-bearing
  (not buried only in a reference).
- [x] The orchestrator continues through the review lane by default;
  `stop-at-review` is honored.
- [x] Worker capability is chosen from risk/scope and logged; no routine
  model-tier question.
- [x] Worker self-containment preserved — worker prompts still carry the full
  boundary and test-integrity text, generated from the posture reference.
- [x] `implement-orchestrator/SKILL.md` ≤ 500 lines.
- [x] SKILL.md frontmatter remains portable (`name`, `description` only) per
  `repo-skill-style`.

## Notes

- Parallel-safe with the other three skill-touching stories (disjoint file
  ownership).
- Do not edit `review/SKILL.md` or `autopilot/SKILL.md` here — the review-side
  lane/roll-up work is `…-review-lane-rollup`.
- Do not edit `principles/SKILL.md` here — advisory/question policy is
  `…-question-advisory-policy`.

## Implementation notes

- Files changed:
  - `plugins/agile-workflow/skills/implement-orchestrator/SKILL.md`
  - `.work/active/stories/feature-agile-workflow-lifecycle-agency-orchestrator-rewrite.md`
- Dispatch rationale: implemented directly because this story grants exclusive
  ownership of one skill file and explicitly prohibits delegation.
- Replaced the recipe-driven orchestrator with outcome and invariant contracts
  for grounding/freshness, unified dependency scheduling, write ownership,
  worker-derived topology, per-wave integration verification, per-item commits,
  conservative parent roll-up, and proactive review completion.
- Replaced worker prompt templates with dynamic brief requirements sourced from
  the implementer posture while retaining ownership boundaries, dependency and
  land-mode checks, the design-flaw escape hatch, verification, per-item
  commits, complete test-integrity rules, and constructive emotional framing.
- Worker capability is now chosen from risk and scope unless overridden and is
  recorded without a routine tier question.
- Added the accepted review-weight handoff: caller/autopilot override, then
  project convention, then `standard`; the effective value is recorded and
  passed to review, while `none` still requires green implementation
  verification and skips independent review.
- Tests added: none; this story changes a portable skill contract rather than
  executable code.
- Validation:
  - Targeted contract assertions passed, including required invariants,
    forbidden legacy recipes/templates, portable frontmatter, and the 500-line
    ceiling (`291` lines).
  - Skill validator passed:
    `python3 /home/nathan/.codex/skills/.system/skill-creator/scripts/quick_validate.py plugins/agile-workflow/skills/implement-orchestrator`.
  - `git diff --check` passed for the skill file.
- Discrepancies from design: none; the accepted `review_weight` requirement was
  incorporated as a high-level review handoff without duplicating review policy.
- Adjacent issues parked: none.

## Review

- Verdict: **Approve** — advanced `review → done`.
- Mode/depth/weight: substrate mode; effective `review_weight` `standard`
  (source: caller request); standard depth (recipe removal is the headline
  change, but the orchestrator is load-bearing for the whole substrate, so the
  invariant set was traced in full). The reviewer is a same-harness
  fresh-context general-purpose sub-agent (parent twin) — labeled fresh-context
  same-harness, **not** cross-model.
- Recipe removal verified: no bundle examples, no sizing recipes, no fixed or
  default wave widths, and no prescribed worker prompt templates remain
  (`grep` for `items per bundle`, `LoC threshold`, `safe default`, `default
  wave`, `N per wave` returns nothing).
- Load-bearing invariants preserved and load-bearing (not buried only in a
  reference): grounding/freshness, unified `depends_on` scheduling with cycle
  validation and external-dep drop, write-set independence, per-wave
  integration verification, one commit per item, conservative parent roll-up
  (`implementing → review` only), and worker self-containment.
- Worker self-containment verified: worker briefs are crafted dynamically from
  `principles/references/subagents.md` and the brief carries ownership, dep
  readiness, land-mode, the design-flaw escape hatch, verification, one commit
  per item, full test-integrity text, endpoint boundaries, and emotional
  framing — without fixed wording.
- Lifecycle completion verified: Phase 7 continues through review by default,
  forwards the effective `review_weight`, honors `stop-at-review`, and reports
  bounce / blocker / design-flaw outcomes honestly; the `review → done`
  roll-up is correctly deferred to the review skill.
- Worker-capability contract verified: chosen from risk/scope, recorded in run
  notes, no routine tier question, no re-ask between waves; `peeragent` is
  excluded from routine implementation fan-out.
- Style: portable frontmatter; `implement-orchestrator/SKILL.md` is 291 lines
  (≤ 500); `quick_validate.py` passes.
- Notes: non-blocking — the Outcomes list names approved / stop-at-review /
  bounced / blocked but not the design-flaw return-to-`drafting` path; that
  case is still handled correctly in Workflow Phase 4 step 2 ("design flaw …
  durably recorded"), so this is a wording gap, not a missing behavior.
- Parent roll-up stops here (two non-terminal siblings remain).
