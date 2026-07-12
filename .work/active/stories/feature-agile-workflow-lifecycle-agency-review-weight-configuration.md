---
id: feature-agile-workflow-lifecycle-agency-review-weight-configuration
kind: story
stage: review
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
