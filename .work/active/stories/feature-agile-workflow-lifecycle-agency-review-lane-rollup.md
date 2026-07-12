---
id: feature-agile-workflow-lifecycle-agency-review-lane-rollup
kind: story
stage: review
tags: [skill, plugin]
parent: feature-agile-workflow-lifecycle-agency
depends_on: []
release_binding: null
gate_origin: null
created: 2026-07-12
updated: 2026-07-12
---

# Risk-based review lane selection + parent roll-up + autopilot review routing

## Scope

Unit 3 of `feature-agile-workflow-lifecycle-agency`. Owns the review lane:
generalize lane selection from item-kind-only to risk + evidence (kind as a
starting heuristic), preserve fresh-context deep review, and add conservative
parent roll-up from the review lane so completed children advance eligible
parents without requiring autopilot. Align `autopilot`'s review routing and
worker-tier prose with the new defaults.

This story implements the review-side of the **Review lane selection contract**,
the **Lifecycle completion contract**, and the **Inline-vs-delegated and
worker-capability contract** defined in the parent feature body. Read that body
before editing.

## Files (disjoint ownership)

- `plugins/agile-workflow/skills/review/SKILL.md` (currently 267 lines)
- `plugins/agile-workflow/skills/autopilot/SKILL.md` (currently 330 lines)

No other story edits these files. (`implement-orchestrator/SKILL.md` references
the roll-up but is owned by `…-orchestrator-rewrite`.)

## Changes

### `review/SKILL.md`

- Generalize the lane-selection rule from kind-only to risk + evidence, with
  kind as a starting heuristic. Stories still fast-advance on recorded green
  verification unless risk raises; features/epics still get the deep lane;
  out-of-band targets stay standard.
- Name the risk signals that escalate a story past the fast lane: a caller
  interface change, a security or correctness surface, cross-cutting scope, a
  foundation-doc claim touched by the change, or an explicit `--deep`. Keep the
  fast lane's "skip the lens walk on green verification" behavior for genuinely
  low-risk stories.
- Preserve the fresh-context deep lane unchanged in kind: different-class peer
  when reachable, else the strongest same-harness fresh-context sub-agent
  prompted as a reviewer. Never review a deep target inline in the host's own
  context; when selected depth requires fresh context and none is available,
  record the limitation and block rather than self-approve.
- Add **conservative parent roll-up from the review lane**: after advancing a
  child to `done`, check each ancestor — if all of an ancestor's children are
  terminal, move an implementing ancestor to `review`, run that ancestor's own
  selected review lane, and advance it to `done` only on approval. Commit each
  transition and stop at the first ancestor with a non-terminal child, bounce,
  or blocker. Child completion never substitutes for parent review.
- Consume effective `review_weight` on the five-level
  `none | light | standard | thorough | maximum` scale, defaulting to
  `standard`. Map weight + risk + evidence + kind-as-heuristic to high-level
  reviewer breadth/pass depth without prescribing rigid topology.
- Keep all existing guardrails (mode resolution before mutation, no padding with
  nits, foundation-doc drift is a blocker, no advance past review unless verdict
  is approve/approve-with-comments).

### `autopilot/SKILL.md`

- Confirm review routing is autonomous (it already invokes `review <id>` which
  self-selects its lane) and align the routing prose with the new default:
  production skills now continue through review to `done` themselves, so
  autopilot rebuilds the queue and sees `done` items faster; autopilot does not
  need to treat `review` as a mandatory user handoff.
- Remove the routine "settle the implementation tier — ask once" question from
  Phase 1. Apply the worker-capability contract: choose the tier from risk/scope
  unless the goal/args, a project convention, or a caller note overrides; state
  the choice in the run summary; pass it down in the Phase 4 caller note so the
  orchestrator does not re-ask.
- Keep the final completion review loop (Phase 8) and the caller note. Update
  the caller note's review/tier framing to match the generalized advisory policy
  (risk-driven across modes — see the `principles` story) and the
  worker-capability contract.
- Accept explicit `--review-weight <level>` or a natural-language equivalent;
  otherwise resolve `.work/CONVENTIONS.md`, then `standard`. Log the effective
  value/source and pass it to production/review skills and final completion
  review.

## Acceptance criteria

- [x] Lane selection accounts for risk/evidence, not kind alone; the risk
  signals that escalate a story past fast are named.
- [x] Fresh-context deep review is preserved (different-class peer when
  reachable; never inline for deep targets).
- [x] Review rolls completed children up through eligible parent stages without
  requiring autopilot; every implementing parent first moves to `review`, runs
  its own selected lane, and reaches `done` only on approval. Roll-up stops at
  the first non-terminal child, bounce, or blocker.
- [x] Autopilot treats `review` as autonomous (no mandatory user handoff) and
  rebuilds the queue to see `done` items.
- [x] No routine model-tier question in autopilot; capability choice is logged
  in the run summary and passed in the caller note.
- [x] Effective `review_weight` is resolved, validated, logged, and passed by
  autopilot; review applies all five levels with `standard` as the default.
- [x] `review/SKILL.md` and `autopilot/SKILL.md` ≤ 500 lines.
- [x] SKILL.md frontmatter remains portable (`name`, `description` only) per
  `repo-skill-style`.

## Notes

- Parallel-safe with the other three skill-touching stories (disjoint file
  ownership).
- The advisory-review *policy* generalization (risk-driven across modes) lives
  in `principles/SKILL.md`, owned by `…-question-advisory-policy`. This story
  consumes that policy in `review` and `autopilot`; if the policy text is not
  yet landed, implement against the contract in the parent feature body and let
  the `principles` story land the canonical wording.

## Implementation notes

- Files changed:
  - `plugins/agile-workflow/skills/review/SKILL.md`
  - `plugins/agile-workflow/skills/autopilot/SKILL.md`
  - `.work/active/stories/feature-agile-workflow-lifecycle-agency-review-lane-rollup.md`
- Tests added: none (skill-contract prose change).
- Validation:
  - both owned skills pass the portable skill quick validator
  - targeted contract assertions cover the weight scale/default/precedence,
    named risk signals, fresh-context rule, conservative parent review, explicit
    autopilot selector/pass-through, queue rebuild, and removed tier question
  - both files pass `git diff --check`, portable-frontmatter checks, and the
    ≤500-line budget (`review`: 353 lines; `autopilot`: 353 lines at validation)
- Discrepancies from design: tightened the contradictory deep-lane fallback to
  block when required fresh context is unavailable; corrected roll-up so child
  completion can only move an implementing parent to `review`, never directly
  to `done`.
- Follow-up for owning config/docs stories: document and generate the optional
  `.work/CONVENTIONS.md` `review_weight` value with the five allowed levels and
  `standard` default; roll VISION/SPEC/ARCHITECTURE and the deep-review reference
  forward so they do not retain old fixed-depth or inline-fallback wording.
- Adjacent issues parked: none.
