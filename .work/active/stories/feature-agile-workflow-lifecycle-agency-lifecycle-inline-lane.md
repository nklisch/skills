---
id: feature-agile-workflow-lifecycle-agency-lifecycle-inline-lane
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

# Lifecycle completion for the inline production lane (implement, fix, prose handoff)

## Scope

Unit 1 of `feature-agile-workflow-lifecycle-agency`. Owns the inline production
lane: make `implement` and `fix` continue through the review lane to `done` by
default (with an explicit `stop-at-review` override), demote the hard LoC /
file-count routing to non-binding hints, remove the routine model-tier question,
and consolidate restated test-integrity prose. Updates `prose-author`'s handoff
wording so prose's draft→write→revise rhythm still completes to `done`.

This story implements the inline side of the **Lifecycle completion contract**,
the **Inline-vs-delegated and worker-capability contract**, and the
**Consolidation and line-budget contract** defined in the parent feature body.
Read that body before editing.

## Files (disjoint ownership)

- `plugins/agile-workflow/skills/implement/SKILL.md` (currently 288 lines)
- `plugins/agile-workflow/skills/fix/SKILL.md` (currently 173 lines)
- `plugins/agile-workflow/skills/prose-author/SKILL.md` (handoff section only)

No other story edits these files.

## Changes

### `implement/SKILL.md`

- Replace the "Don't advance past `review`" guardrail and the Phase 9
  `implementing → review` advance with the **lifecycle completion contract**:
  after implementation verifies, invoke the review lane and advance per its
  verdict (`done` on approve, `implementing` on bounce). An explicit
  `stop-at-review` request preserves the old `implementing → review` stop.
- Demote the trigger's ≤50 LoC / ≤2 files criterion to a non-binding hint.
  Frame the inline-vs-delegated choice around cohesion, ownership, sequencing,
  and uncertainty. Keep prose's no-coordination inline qualification.
- Remove any routine model-tier question; worker capability is chosen from
  risk/scope unless the caller or project overrides it, and the choice is logged
  in implementation notes.
- Consolidate test-integrity prose to a one-line pointer plus the
  load-bearing one-liner; the full worker-facing text stays in the implementer
  posture reference and is unaffected.

### `fix/SKILL.md`

- Apply the same lifecycle completion contract: the story continues through
  review to `done` by default (honor bounce/blocker; honor `stop-at-review`).
- Reframe the >5-files / public-interface guard as a "this is a feature, not a
  fix" routing signal, not a review-stop.
- Same test-integrity consolidation as `implement`.

### `prose-author/SKILL.md`

- Update the Handoff so the inline `implement` path is described as continuing
  through revise/review to `done` by default. Prose's draft→write→revise rhythm
  is preserved; review remains a genuine revise/coherence pass, not a rubber
  stamp.

## Acceptance criteria

- [ ] Direct `/implement` reaches `done` (or returns a documented bounce/blocker)
  in one invocation unless `stop-at-review` is requested.
- [ ] Direct `/fix` reaches `done` (or returns a documented bounce/blocker) in
  one invocation unless `stop-at-review` is requested.
- [ ] No hard LoC/file-count routing remains as a gate in `implement` or `fix`;
  only non-binding hints.
- [ ] No routine model-tier question; capability choice is logged.
- [ ] `prose-author` handoff describes completion to `done` by default.
- [ ] `implement/SKILL.md` and `fix/SKILL.md` ≤ 500 lines; worker test-integrity
  prose preserved.
- [ ] SKILL.md frontmatter remains portable (`name`, `description` only) per
  `repo-skill-style`.

## Notes

- The review-side counterpart (lane selection + roll-up) is
  `feature-agile-workflow-lifecycle-agency-review-lane-rollup`. The two stories
  share the lifecycle contract but own disjoint files, so they run in parallel.
- The orchestrator-side counterpart is
  `feature-agile-workflow-lifecycle-agency-orchestrator-rewrite`.
- Do not implement changes here that belong to `principles` (advisory/question
  policy) — that is
  `feature-agile-workflow-lifecycle-agency-question-advisory-policy`.
