---
id: gate-tests-ci-actionlint
kind: story
stage: done
tags: [testing, tooling]
parent: null
depends_on: []
release_binding: 0.8.6
gate_origin: tests
created: 2026-05-31
updated: 2026-05-31
---

# Add `actionlint` guard for build-work-view.yml CI logic

## Priority
Low (complementary — deferred to backlog, not release-blocking)

## Spec reference
Item: `epic-substrate-cli-install-path` (Unit 3). Acceptance: "Workflow builds all
four targets (lint-valid YAML; toolchains pinned)." / "PR runs do not commit binaries;
only the manual refresh job does." / "Size guard fails the job if a binary balloons."

## Why
A real GitHub-Actions logic bug shipped through review here — the
`commit_binaries == 'true'` boolean-coercion blocker (would have *never* run the
refresh job) was caught by peer review, not by a test. That class of bug is exactly
what an `actionlint` step catches on every push. The size guard
(`SIZE_BUDGET_BYTES=8388608`) and the `if: ... && inputs.commit_binaries` gate are
load-bearing and currently unguarded against regression. CI behavior is genuinely hard
to unit-test, so the honest output is: add an `actionlint` step (meta-CI or
pre-commit), or document that workflow logic is review-gated only.

## Scoped into 0.8.6 (2026-05-31)
Promoted from backlog at user request ("scope those needing scoping") and bound to
0.8.6.

## Design decision (cross-model consult, Codex via peeragent, 2026-05-31)
Recommendation **(a)**: add actionlint. Documenting "review-gated only" preserves the
exact failure mode that already shipped. Lowest-friction useful shape is a DEDICATED
workflow-lint CI so any workflow edit gets checked (not only build-work-view.yml):
- New file `.github/workflows/lint-github-actions.yml`.
- Triggers: `pull_request` + `push` with `paths: [".github/workflows/**"]`, plus
  `workflow_dispatch`.
- Job: Ubuntu, checkout, `rhysd/actionlint@v1`.
- Catches expression/type mistakes like comparing a boolean `workflow_dispatch` input
  to the string `'true'` (the bug that shipped).
Local verification limited to YAML validity (actionlint not installed locally; the
action runs in CI).
