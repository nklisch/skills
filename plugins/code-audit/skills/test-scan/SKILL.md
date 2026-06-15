---
name: test-scan
description: >
  Standalone test-quality and coverage-gap scan that writes a markdown report only. Use when the user
  asks to audit tests, find missing test coverage, review test quality, identify weak assertions,
  stale fixtures, over-mocking, flaky tests, or derive test gaps from specs/contracts without
  adopting agile-workflow. Maps behavioral contracts, existing tests, gaps, and recommended test
  additions into test-scan-report.md.
---

# Test-Scan

Run a standalone test-quality audit and write a markdown report. This skill never writes `.work/`
items, backlog files, release gates, or commits.

## Core Principle

Tests derive from specs and contracts, not implementations. Use acceptance criteria, docs, public
types, signatures, route/API contracts, CLI help, and stated behavior as the source of expected
behavior. If no expected-behavior source exists, report a spec gap rather than inventing a test that
asserts whatever the implementation currently does.

## Invocation

- `test-scan` — scan the whole repo.
- `test-scan <path>` — scope to a directory or file set.
- `test-scan --output <path>` — write somewhere other than `test-scan-report.md`.

## Phase 1: Discover Test Surface

Detect:
- test framework and test commands;
- test file layout;
- public behavior surface: exported APIs, routes, CLIs, components, workers;
- specs/contracts/docs that define expected behavior;
- existing fixtures, mocks, harnesses, and e2e setup.

## Phase 2: Map Existing Tests

Use search and targeted reads to count and classify tests:
- unit, integration, e2e, property/fuzz, snapshot, smoke;
- meaningful assertions vs tautological assertions;
- real dependencies vs mocks;
- edge cases and error paths;
- flaky/timing/order dependence signals.

Read representative test files. Do not judge only from filenames.

## Phase 3: Derive Gaps

For each behavioral surface in scope, derive expected coverage from:
1. acceptance criteria or specs;
2. public contracts, docs, signatures, schemas;
3. observable behavior only when the repo clearly treats it as a contract.

Apply test-design techniques:
- equivalence partitioning;
- boundary value analysis;
- decision tables;
- state transition coverage;
- error and unavailable-dependency cases;
- integration/e2e seams.

## Priority Rubric

| Priority | Meaning |
|---|---|
| Critical | Required behavior or public contract has no meaningful test |
| High | Boundary, error, dependency-failure, or security-relevant path lacks coverage |
| Medium | Valid partition, rule combination, or integration seam lacks coverage |
| Low | Complementary coverage, test ergonomics, fixture cleanup, or clarity improvement |

Flag bad tests separately: weak assertions, implementation mirroring, over-mocking, stale fixtures,
snapshot misuse, timing flakes, order dependence, and tests that pass without exercising behavior.

## Phase 4: Write The Report

Write `test-scan-report.md` unless the user supplied `--output`, using
[references/report-template.md](references/report-template.md). Include:
- test surface profile;
- test counts by layer;
- verified strengths;
- coverage gaps by priority;
- bad-test findings;
- recommended additions and reworks;
- spec gaps.

## Guardrails

- Do not write tests during this scan.
- Do not treat implementation behavior as the spec unless the project clearly does.
- Do not delete or modify tests.
- Do not write `.work/`, backlog, release, or tracking artifacts.
