---
id: feature-agile-workflow-lifecycle-agency-review-weight-configuration
kind: story
stage: done
tags: [skill, plugin]
parent: feature-agile-workflow-lifecycle-agency
depends_on:
  - feature-agile-workflow-lifecycle-agency-lifecycle-inline-lane
  - feature-agile-workflow-lifecycle-agency-orchestrator-rewrite
  - feature-agile-workflow-lifecycle-agency-review-lane-rollup
  - feature-agile-workflow-lifecycle-agency-question-advisory-policy
release_binding: null
gate_origin: null
created: 2026-07-12
updated: 2026-07-12
---

# Add project and autopilot review-weight configuration

## Scope

Complete the review-weight contract added to the parent feature by exposing a stable project convention and ensuring bootstrap/sync guidance knows the setting. The review and autopilot skills own selection and execution semantics; this story owns configuration discoverability and preservation.

## Files

- `plugins/agile-workflow/skills/convert/SKILL.md`
- `.work/CONVENTIONS.md` (dogfood the documented default)
- Targeted convert/config tests when an existing test surface covers generated conventions

Foundation docs are owned by the terminal foundation-doc story and must not be edited here.

## Required behavior

- Add `review_weight: standard` to newly generated project conventions without adding another bootstrap interview question.
- Document the allowed values `none | light | standard | thorough | maximum` concisely and point at the canonical principles/review policy rather than duplicating the matrix.
- Preserve a project's existing value during `convert --update`; never reset it to the default.
- Keep the selector optional for older projects: absent resolves to `standard`.
- Dogfood `review_weight: standard` in this repository's `.work/CONVENTIONS.md`.
- Keep the prose high-level. Do not add fixed reviewer-count recipes or model routing tables to `convert`.

## Acceptance criteria

- [x] Fresh bootstrap writes `review_weight: standard`.
- [x] Sync preserves an existing review weight.
- [x] Missing review weight remains valid and resolves to `standard`.
- [x] No new interactive setup question is introduced.
- [x] This repository declares `review_weight: standard`.
- [x] Existing targeted convert/config tests pass, with focused coverage added only where the current test structure supports it.

## Implementation notes

- Execution capability: inline/direct-read; the story had a bounded prose-and-structural-test surface and explicitly prohibited delegation.
- Review weight: `standard` (project default dogfooded by this change); stopped at `review` as explicitly requested.
- Files changed: `plugins/agile-workflow/skills/convert/SKILL.md`, `.work/CONVENTIONS.md`, `plugins/agile-workflow/scripts/tests/convert-review-weight.test.sh`, `plugins/agile-workflow/scripts/tests/convert-content-integrity.test.sh`, and this story.
- Configuration contract: bootstrap writes `review_weight: standard` without extending the six-question interview; the five allowed values are discoverable; absent settings resolve to `standard`; sync preserves existing values and does not backfill older projects. Convert points to the canonical principles/review policy instead of copying its review matrix or model recipes.
- Tests added: `convert-review-weight.test.sh` structurally covers bootstrap defaulting, allowed-value discoverability, no interview expansion, absent-value fallback, canonical-policy pointers, and sync preservation.
- Existing test repaired: widened the nearby-grounding window in `convert-content-integrity.test.sh` from 2 to 5 lines so the assertion recognizes the dependency story's compact adjacent grounding bullets without weakening to a bare path match.
- Verification: `convert-review-weight.test.sh` (9/9), `convert-install-routing.test.sh` (12/12), `convert-content-integrity.test.sh` (42/42), convert `quick_validate.py`, and `git diff --check` all passed.
- Discrepancies from design: none.
- Adjacent issues parked: none.

## Review

- Verdict: **Approve** — advanced `review → done`.
- Mode/depth/weight: substrate mode; effective `review_weight` `standard` (source:
  caller request). **Standard depth is appropriate** for this story's surface —
  it is config/prose plus structural tests with no runtime behavior change, no
  interface change, and no security/correctness surface; the policy layer it
  points at is owned by Unit 4 (already reviewed), not authored here. The
  reviewer is a same-harness fresh-context general-purpose sub-agent (parent
  twin) — labeled fresh-context same-harness, **not** cross-model.
- Bootstrap output verified: `convert/SKILL.md` Phase 5 (lines ~472-485)
  instructs the bootstrapper to write the `## Review weight` heading plus
  `review_weight: standard`, and the same Phase 5 block documents all five
  allowed values. The repo's own `.work/CONVENTIONS.md` dogfoods the exact
  same two-line shape the skill writes, so a fresh bootstrap lands on the
  dogfooded form.
- Absence fallback verified: Phase 5 states the setting is optional and that
  review/autopilot resolve absence to `standard`; Phase S1 repeats the same
  semantics ("absence is also valid and resolves to `standard`, so sync
  neither inserts the default into older projects nor asks a migration
  question"). Resolution target agrees with `review/SKILL.md` precedence
  step 4 and `principles/SKILL.md` Part IV.
- Sync preservation verified: Phase S4's preserve list adds `review_weight` to
  the "NEVER touched in sync mode" block — "is never added, reset, or
  rewritten by sync; preserve an existing value byte-for-byte" — and Phase
  S1's audit note tells sync to leave any existing value unchanged. The
  boundary-value validation is correctly delegated to `review` at consumption
  time (matching `review/SKILL.md` line 56-57: "reject unknown values at the
  boundary"), so `convert`/sync carry no duplicate validator.
- No added interview question verified: Phase 3 still lists exactly six
  questions in order (Release mapping, Tag taxonomy, Slug conventions, Stage
  overrides, Gate config, Terminal-tier retention), and an explicit note
  above Phase 4 states review weight is "deliberately not another interview
  question." The structural test asserts both ("Six questions, in order" +
  "not another interview question").
- Canonical-policy consistency verified: the allowed-value string
  `none | light | standard | thorough | maximum` and the `standard` default
  in Phase 5 match `principles/SKILL.md` Part IV and `review/SKILL.md`
  lines 56-65 byte-for-byte. Phase 5 points at `principles/SKILL.md` Part IV
  and `review/SKILL.md` for level semantics and selection policy and tells
  bootstrappers not to duplicate the review matrix or model guidance — no
  recipes are introduced into `convert`.
- Focused test changes verified: the new `convert-review-weight.test.sh`
  (9/9) is structural and contract-scoped — it asserts the eight
  configuration invariants (six-question interview, no new question, default
  write, five-value discoverability, absence fallback, canonical pointer,
  sync-accepts-absence, sync-preserves-existing, sync-never-resets) by
  extracting named Phase blocks from `convert/SKILL.md` and grepping for the
  load-bearing prose, not by byte-matching.
- Test repair verified as legitimate, not gaming: the `GROUND_WINDOW` 2 → 5
  widening in `convert-content-integrity.test.sh` repairs a regression
  introduced by Unit 2's `implement-orchestrator` rewrite (the path
  `.agents/rules/*.md` sits at line 69 and the `force-loaded` descriptor at
  line 74 — distance 5). Confirmed by checking out the pre-widening test
  against the current branch: only `implement-orchestrator grounds
  .agents/rules as force-loaded agent rules` fails (1/42), and the failure
  is a real grounding presence the original window could no longer reach. The
  widened window preserves the dual-condition assertion (path AND
  `force-loaded` within ±5 lines), so it does **not** weaken to a bare path
  match — this is exactly the "fix bad tests in-session" sanctioned by the
  test-integrity rule.
- Scope verified: only the five declared files are touched (convert/SKILL.md,
  this story, the two test files, and `.work/CONVENTIONS.md`). Foundation
  docs (VISION/SPEC/ARCHITECTURE) are correctly untouched — Unit 6 owns the
  doc roll-forward.
- Validation verified independently: `convert-review-weight` (9/9),
  `convert-content-integrity` (42/42), `convert-install-routing` (12/12),
  `agent-metadata` (9/9), `bump-version` (77/77), `channel-parity` (26/26),
  `pi-package-metadata` (123/123) all green; `quick_validate.py` reports
  `Skill is valid!` for `convert`; `git diff --check` clean.
- Notes (non-blocking): (1) the implementation note abbreviates the
  validator path as `convert quick_validate.py`; the real path is
  `/home/nathan/.codex/skills/.system/skill-creator/scripts/quick_validate.py`
  (verified to exist and pass) — cosmetic shorthand, not a fabrication. (2)
  The dogfood landed as a clean three-line block under `## Review weight` in
  `.work/CONVENTIONS.md`, matching the bootstrap template exactly.
- Parent roll-up stops here per caller instruction ("do not advance the
  parent feature"); independently, one non-terminal sibling remains
  (`foundation-docs-and-validation` at `stage: implementing`), so the parent
  feature is not roll-up-eligible yet regardless. Four of five siblings are
  now `done` (`lifecycle-inline-lane`, `orchestrator-rewrite`,
  `review-lane-rollup`, `question-advisory-policy`, plus this story).
