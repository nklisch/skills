---
id: feature-agile-workflow-lifecycle-agency-review-weight-configuration
kind: story
stage: implementing
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

- [ ] Fresh bootstrap writes `review_weight: standard`.
- [ ] Sync preserves an existing review weight.
- [ ] Missing review weight remains valid and resolves to `standard`.
- [ ] No new interactive setup question is introduced.
- [ ] This repository declares `review_weight: standard`.
- [ ] Existing targeted convert/config tests pass, with focused coverage added only where the current test structure supports it.
