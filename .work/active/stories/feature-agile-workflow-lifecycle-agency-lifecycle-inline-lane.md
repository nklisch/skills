---
id: feature-agile-workflow-lifecycle-agency-lifecycle-inline-lane
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

- [x] Direct `/implement` reaches `done` (or returns a documented bounce/blocker)
  in one invocation unless `stop-at-review` is requested.
- [x] Direct `/fix` reaches `done` (or returns a documented bounce/blocker) in
  one invocation unless `stop-at-review` is requested.
- [x] No hard LoC/file-count routing remains as a gate in `implement` or `fix`;
  only non-binding hints.
- [x] No routine model-tier question; capability choice is logged.
- [x] Effective `review_weight` is resolved from caller, project, then the
  `standard` default; it is recorded and forwarded without duplicating the
  matrix. `none` still requires green verification and acceptance evidence.
- [x] `prose-author` handoff describes completion to `done` by default.
- [x] `implement/SKILL.md` and `fix/SKILL.md` ≤ 500 lines; worker test-integrity
  prose preserved.
- [x] SKILL.md frontmatter remains portable (`name`, `description` only) per
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

## Implementation notes

- Execution capability: inline current-agent edit; three cohesive skill surfaces
  with disjoint ownership and no implementation fan-out needed.
- Files changed: `implement/SKILL.md`, `fix/SKILL.md`, and the Handoff section of
  `prose-author/SKILL.md`.
- Lifecycle: direct implement and fix now commit `implementing → review`, then
  invoke the review lane in the same invocation unless `stop-at-review` applies;
  approve, bounce, and blocker outcomes are explicit.
- Review weight: each direct lane resolves caller override → project convention →
  `standard`, records the effective value/source, and forwards it. The skills
  defer the matrix to principles/review and preserve evidence requirements for
  `none`.
- Routing: LoC/file counts are hints rather than gates; cohesion, ownership,
  sequencing, and uncertainty choose inline versus delegated execution.
- Test integrity: duplicated policy was reduced to the project-rules/worker-posture
  pointer plus the load-bearing fix/park/never-game-tests invariant.
- Prose handoff: preserves write → genuine revise/coherence review → `done`, with
  the same override and evidence contract.
- Tests added: none; these are portable skill-contract changes.
- Verification:
  - `quick_validate.py` passed for all three touched skill directories.
  - Lifecycle contract assertions passed for default closure, stop override,
    review weight/default/`none`, prose evidence, stale guardrail removal, and
    the 500-line ceiling.
  - `git diff --check` passed for the owned files.
  - Line counts: implement 299, fix 191, prose-author 190.
- Discrepancies from design: none; incorporated the accepted `review_weight`
  requirement without defining its matrix locally.
- Adjacent issues parked: none.
- Review boundary: the caller explicitly required this story to advance only
  `implementing → review`; no review lane was run in this implementation stride.

## Review

- Verdict: **Approve** — advanced `review → done`.
- Mode/depth/weight: substrate mode; effective `review_weight` `standard`
  (source: caller request); standard depth for this production-lane change. The
  reviewer is a same-harness fresh-context general-purpose sub-agent (parent
  twin) — labeled fresh-context same-harness, **not** cross-model.
- Lifecycle contract verified: `implement` Phase 9 and `fix` Phase 7 invoke the
  review lane in the same invocation unless `stop-at-review` ("stop at review" /
  "leave at review" / "hand off for review") or a project convention sets the
  boundary; approve / bounce / blocker outcomes are each explicit; `review`
  remains a real state and is never silently self-approved.
- Routing contract verified: the ≤50 LoC / ≤2 files criterion is now a non-binding
  hint ("never a routing gate"); inline-vs-delegated is chosen from cohesion /
  ownership / sequencing / uncertainty; prose's no-coordination inline
  qualification is preserved; no routine model-tier question remains and the
  capability choice is logged in Phase 7.
- Review-weight handoff verified: caller override → project convention →
  `standard`, recorded and forwarded; `none` still requires green verification
  and acceptance evidence. The matrix is correctly deferred to
  `principles`/`review`.
- Prose handoff verified: write → genuine revise/coherence review → `done` by
  default, with the same override and evidence contract.
- Style: portable frontmatter (name + description only); line counts implement
  299 / fix 191 / prose-author 190 (all ≤ 500); `quick_validate.py` passes for
  all three.
- Notes: non-blocking — none. Parent roll-up stops here: the parent feature
  still has two non-terminal children
  (`…-review-weight-configuration`, `…-foundation-docs-and-validation`).
