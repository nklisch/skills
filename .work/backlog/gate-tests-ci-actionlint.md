---
id: gate-tests-ci-actionlint
kind: story
tags: [testing, tooling]
gate_origin: tests
created: 2026-05-31
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
