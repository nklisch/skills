---
id: feature-agile-workflow-lifecycle-agency-question-advisory-policy
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

- [ ] `principles` Part III frames question policy by reversibility /
  user-facing consequence; the autopilot disambiguation and hard-halt list
  remain; `--only-questions` is unchanged.
- [ ] `principles` Part IV frames advisory review as risk-driven across direct
  and autopilot design modes; two-phase order, different-model-class rule,
  non-blocking failures, and strict completion path all preserved.
- [ ] Per-scope defaults and two-phase loop mechanics live in a reference; the
  SKILL keeps only the load-bearing invariants.
- [ ] Each design-family skill defers to Part III for question policy rather
  than restating it; `--only-questions` mode definition intact.
- [ ] `principles/SKILL.md` ≤ 500 lines; each design-family SKILL ≤ 500 lines
  and reduced from current size.
- [ ] Each touched reference ≤ 200 lines (≤ 100 gets a table of contents) per
  `repo-skill-style`.
- [ ] SKILL.md frontmatter remains portable (`name`, `description` only).

## Notes

- Parallel-safe with the other three skill-touching stories (disjoint file
  ownership).
- `review/SKILL.md` and `autopilot/SKILL.md` consume this advisory policy but
  are owned by `…-review-lane-rollup`; they implement against the contract in
  the parent feature body if this story has not landed yet.
- Worker-facing test-integrity and boundary prose in
  `principles/references/subagents.md` is **not** touched here — that file is
  the self-containment anchor for worker prompts and stays as-is.
