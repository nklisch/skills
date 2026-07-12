---
id: feature-agile-workflow-lifecycle-agency-question-advisory-policy
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

# Converge question policy + generalize advisory review + principles progressive disclosure

## Scope

Unit 4 of `feature-agile-workflow-lifecycle-agency`. Owns the policy layer.
Restate the design-family question policy in `principles` Part III as a
reversibility / user-facing-consequence rule; generalize advisory review in
Part IV from autopilot-only to risk-driven across direct and autopilot design
modes; bring `principles` under the 500-line budget via progressive disclosure
(detail to references, invariants stay in the SKILL); and replace the restated
"surface ambiguities → ask" prose across the four design-family skills with a
deference pointer to Part III.

This story implements the **Alignment and advisory contract** and the policy
side of the **Consolidation and line-budget contract** defined in the parent
feature body. Read that body before editing.

## Files (disjoint ownership)

- `plugins/agile-workflow/skills/principles/SKILL.md` (currently 678 lines —
  over budget; progressive disclosure brings it under)
- `plugins/agile-workflow/skills/principles/references/` (may add or extend a
  reference to hold the moved detail)
- `plugins/agile-workflow/skills/feature-design/SKILL.md` (currently 472)
- `plugins/agile-workflow/skills/epic-design/SKILL.md` (currently 476)
- `plugins/agile-workflow/skills/refactor-design/SKILL.md` (currently 384)
- `plugins/agile-workflow/skills/perf-design/SKILL.md` (currently 427)

No other story edits these files.

## Changes

### `principles/SKILL.md` — Part III (Caller Awareness)

- Restate the question policy in **reversibility / user-facing-consequence**
  terms: routine reversible decisions resolve with judgment and a logged
  rationale; structured questions are reserved for product direction, external
  contracts, and expensive irreversible choices.
- Keep the autopilot / non-autopilot disambiguation, the "what does NOT count
  as autopilot" list, the hard-halt list, and the worked-examples table.
- Keep `--only-questions` as the explicit interactive-only alignment mode and
  note it is unchanged.

### `principles/SKILL.md` — Part IV (Cross-Model Advisory Review)

- Generalize from autopilot-only framing to **risk-driven across both direct
  and autopilot design modes**. Small/low-risk work skips; small/medium with
  real uncertainty uses one focused pass; large/risky/architectural uses one
  focused pass when no prior alignment exists; deep/complex uses two different
  classes paired across the two phases when available.
- Preserve the two-phase order (advisory/completeness then adversarial), the
  different-model-class rule, the non-blocking design-time failure semantics,
  and the strict final-completion review path (must clear through a review path
  before reporting complete).
- **Progressive disclosure**: move the detailed per-scope default table and the
  two-phase loop mechanics (loop shapes for designs vs reviews, convergence
  caps, multi-class pairing detail) into `principles/references/` — either
  extend `references/models.md` (which already owns §5/§6 mechanics) or add a
  focused `references/advisory-review.md`. Keep in the SKILL only the
  load-bearing invariants: risk-driven, two-phase order, different-class rule,
  non-blocking failures, strict completion path. This is the surgery that brings
  `principles` under 500 lines.
- `references/models.md` remains the model-layer source of truth (host → peer
  pairing, model classes, peeragent flags).

### Design family — `feature-design`, `epic-design`, `refactor-design`, `perf-design`

- Replace the restated "surface ambiguities → ask via structured question tool"
  prose (Phase 4.5 in feature-design, Phase 4.7 in epic-design, the mirrored
  `--only-questions` workflow in refactor/perf-design) with a one-line
  deference pointer to `principles` Part III's reversibility-based policy.
- Keep each skill's `--only-questions` mode definition intact: interactive-only,
  refuses to run under autopilot, captures answers under `## Design decisions`,
  does NOT design or advance stage.
- Drop duplicated caller-awareness paragraphs (the per-skill re-assertions of
  the autopilot-vs-interactive rule) so each skill shrinks below its current
  size.

## Acceptance criteria

- [x] `principles` Part III frames question policy by reversibility /
  user-facing consequence; the autopilot disambiguation and hard-halt list
  remain; `--only-questions` is unchanged.
- [x] `principles` Part IV frames advisory review as risk-driven across direct
  and autopilot design modes; two-phase order, different-model-class rule,
  non-blocking failures, and strict completion path all preserved.
- [x] Per-scope defaults and two-phase loop mechanics live in a reference; the
  SKILL keeps only the load-bearing invariants.
- [x] Each design-family skill defers to Part III for question policy rather
  than restating it; `--only-questions` mode definition intact.
- [x] `principles/SKILL.md` ≤ 500 lines; each design-family SKILL ≤ 500 lines
  and reduced from current size.
- [x] Each touched reference ≤ 200 lines (≤ 100 gets a table of contents) per
  `repo-skill-style`.
- [x] SKILL.md frontmatter remains portable (`name`, `description` only).

(checkboxes ticked during the `review` pass — work was complete and validated
in the implementation stride; the boxes were left unticked by oversight.)

## Notes

- Parallel-safe with the other three skill-touching stories (disjoint file
  ownership).
- `review/SKILL.md` and `autopilot/SKILL.md` consume this advisory policy but
  are owned by `…-review-lane-rollup`; they implement against the contract in
  the parent feature body if this story has not landed yet.
- Worker-facing test-integrity and boundary prose in
  `principles/references/subagents.md` is **not** touched here — that file is
  the self-containment anchor for worker prompts and stays as-is.

## Implementation notes

- Files changed: `principles/SKILL.md`; `principles/references/{advisory-review,code-design,models}.md`; `feature-design/SKILL.md`; `epic-design/SKILL.md`; `refactor-design/SKILL.md`; `perf-design/SKILL.md`; this story.
- Policy: normal questions now follow reversibility and material consequence; advisory review is risk-driven across direct and autopilot modes; `review_weight` is canonical at `none | light | standard | thorough | maximum` with `standard` default and agency-preserving topology selection.
- Progressive disclosure: moved code-design examples/checklists and advisory scope/loop mechanics to references while retaining code-design, question, independent-review, two-phase, failure, and completion invariants in auto-loaded prose.
- Model reference: added recommendation-level GPT-5.6 Luna/Terra/Sol and Claude Fable guidance while preserving model-lineage labeling and fresh-context fallbacks.
- Validation: all five touched skills passed `quick_validate.py`; owned SKILL files are 420/433/425/383/426 lines; touched references are 69/107/170 lines with a contents table where required; policy/deference probes and `git diff --check` passed.
- Tests added: none (prose contract change; targeted skill and structural validation used).
- Discrepancies from design: none.
- Follow-up: review/autopilot consumption plus configuration-schema and foundation-doc documentation for `review_weight` remain with their owning concurrent/follow-up stories.
- Adjacent issues parked: none.

## Review

- Verdict: **Approve** — advanced `review → done`.
- Mode/depth/weight: substrate mode; effective `review_weight` `standard`
  (source: caller request); **depth escalated to deep-equivalent fresh-context
  scrutiny** because this story owns the policy layer (Parts III and IV of
  `principles`) — the highest policy-risk surface in the batch alongside story
  3. The progressive-disclosure surgery was diffed old-vs-new to confirm
  nothing load-bearing moved out of the auto-loaded SKILL body. The reviewer is
  a same-harness fresh-context general-purpose sub-agent (parent twin) —
  labeled fresh-context same-harness, **not** cross-model.
- Part III verified: question policy is now framed by reversibility /
  user-facing consequence; the autopilot-vs-interactive disambiguation, the
  "what does NOT count as autopilot" list, the hard-halt list, and the worked
  examples are all preserved; `--only-questions` is unchanged and remains
  interactive-only with refusal under autopilot.
- Part IV verified: advisory review is risk-driven across **both** direct and
  autopilot design modes (the core generalization); the load-bearing
  invariants — different-class labeling, fresh-context semantics, two-phase
  order, non-blocking design-time failures, and the strict completion path —
  are all present in the SKILL body. The `none` exception to the strict
  completion path (documented verification + acceptance evidence satisfies the
  path without independent review) is consistent with the parent feature's
  review-weight contract and with `review`, `autopilot`, `implement`, `fix`,
  and `implement-orchestrator`.
- Progressive disclosure verified: the per-scope defaults table, two-phase
  loop mechanics, and recording format moved to `advisory-review.md` (69
  lines); the code-design mechanics/checklists/examples moved to
  `code-design.md` (107 lines, with ToC); the SKILL keeps one-paragraph
  capsules plus the load-bearing invariant lists. `principles/SKILL.md` is 420
  lines (was 678). `references/models.md` keeps the model-layer source of
  truth (170 lines, with ToC). `subagents.md` (the worker self-containment
  anchor) is correctly untouched.
- Design-family deference verified: `feature-design` Phase 4.5, `epic-design`
  Phase 4.7, and the `--only-questions` blocks of `refactor-design` and
  `perf-design` each point at Part III (and Part IV where topology is in
  scope) instead of restating it; each `--only-questions` definition remains
  interactive-only, no-advance, captures under `## Design decisions`.
- Model guidance verified against the parent design bullet added in
  `905e6d4`: Luna = implementation workhorse, Sol = preferred design/review/
  complex-code + low-thinking bridge above Luna, Terra = situational middle
  pick, Fable = high-cost design/orchestration/review specialist (not a
  default implementer). Role, effort, bridge, and cost are all present in
  `references/models.md`. Model-lineage labeling (Luna/Terra/Sol/Codex share
  OpenAI lineage → not cross-model) is preserved.
- Cross-file consistency: review-weight scale, `none` evidence requirement,
  two-phase order, and different-class labeling all agree with `review`,
  `autopilot`, `implement`, `fix`, and `implement-orchestrator`.
- Validation verified independently: `quick_validate.py` passes for all five
  touched skills; line budgets hold (420/433/425/383/426 + 69/107/170);
  `channel-parity` (26), `agent-metadata` (9), `bump-version` (77), and
  `pi-package-metadata` (123) all green; portable frontmatter confirmed.
- Notes (non-blocking): (1) acceptance checkboxes were left `[ ]` by the
  implementer despite complete, validated work — ticked during this review;
  (2) the "Changes" section does not list the Luna/Terra/Sol/Fable
  model-guidance refresh carried in `905e6d4`, though the implementation
  notes do record it and `references/models.md` carries it correctly.
- Parent roll-up stops here (two non-terminal siblings remain).
