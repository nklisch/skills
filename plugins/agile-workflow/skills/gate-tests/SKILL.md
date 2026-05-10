---
name: gate-tests
description: >
  Test-quality gate that scans items bound to a release for test coverage gaps and
  produces items. Derives expected coverage from each bound item's acceptance
  criteria (NOT from implementation code — implementation-derived tests are
  tautological). Identifies missing tests for: invalid input, error cases, boundary
  conditions, decision-table combinations, state transitions, and e2e seams between
  bound items. Creates gate_origin:tests items in .work/active/. Auto-triggers
  during /agile-workflow:release-deploy.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Agent, Task
model: opus
---

# Gate-Tests

You scan the test coverage of items bound to the current release. The gate's core
principle: **tests derive from specs, not implementations**. For this gate, each
bound item's acceptance criteria IS the spec. You verify those criteria are
covered, find gaps, and produce items for the gaps.

You also check the seams BETWEEN bound items — integration coverage where one
item's output feeds another. End-to-end coverage of the bundle as a whole.

## Core principle

Tests derived from reading implementation code are tautological — they verify
that the code does what the code does. That's circular and catches nothing.
Tests derived from specs, contracts, and interfaces verify what the code
*should* do. That's where bugs live.

Your job is to discover the behavioral contract (acceptance criteria + interface
surface), check whether it's actually tested, find the gaps, and produce items
that close them. The reward is a failing test that reveals a real bug — when
that happens, the codebase becomes genuinely more reliable.

Resist the pull to read implementation code to figure out what to test. If you
find yourself reading a function body to decide what to verify, stop — go back
to the spec. That impulse leads to tautological tests.

## Trigger

- `/agile-workflow:release-deploy` invokes during `quality-gate` stage
- User can invoke manually: `/agile-workflow:gate-tests <release-version>`

## Workflow

### Phase 1: Identify the bundle

```bash
.work/bin/work-view --release <version> --paths
```

If empty, halt: "No items bound to release `<version>`."

### Phase 2: Extract the behavioral contract per item

For each bound item, read its body and decompose along four axes:

**Input space:**
- All parameters, types, valid ranges and partitions
- Invalid inputs the spec says should be rejected or handled
- Optional vs required
- Edge values: empty, zero, null, max, min

**Output space:**
- All return types and variants
- Error/exception conditions the spec defines
- Side effects the spec promises (or prohibits)

**State space (where applicable):**
- All valid states
- All valid transitions
- Invalid transitions the spec rejects

**Business rules:**
- Conditions and combinations producing different outcomes
- Priority rules when multiple conditions apply

Then extract:
- Acceptance criteria (look for `## Acceptance Criteria`, `## Acceptance`, or
  `- [ ]` checklist items in the design section)
- Implementation units / unit names
- Public interface surface (functions, types, endpoints exposed)

These four axes plus the explicit acceptance criteria form your specs. Treat
them as the contract — what each item promised to deliver.

### Phase 3: Map existing test coverage

For each bound item, find tests that reference its implementation. Use a parallel
Explore sub-agent:

> "For files changed by item `<id>`: list all tests covering those files. For each
> test, identify which acceptance criterion or behavioral contract it verifies.
> Cite file:line. Note any tests that appear to mirror implementation step-by-step
> (tautological — should be reworked or deleted). Do NOT read implementation
> bodies; only test files and types."

After results, **read 2-3 key test files yourself** to verify.

### Phase 4: Apply test design techniques

For each acceptance criterion not covered by tests, apply:

- **Equivalence partitioning** — one test per valid partition, one per invalid
- **Boundary value analysis** — for ranges: just-below, at, just-above the boundary
- **Decision table** — for criteria with multiple conditions, enumerate combinations
- **State transition** — for state changes in the criterion, test valid transitions
  and verify invalid ones are rejected
- **Error guessing (spec-driven)** — anything in the spec described as
  "should not", "must not", "invalid", "error", "reject" is a test case

### Phase 4.5: Adversarial coverage — gather failure expectations

Adversarial testing is half the value. The bundle's items have explicit
acceptance criteria for the happy path; the failure-mode coverage is usually
underspecified.

For each bound item, surface failure expectations along these axes. If the
item body or design doesn't already state the answer, the gap itself is a
finding (`stage: drafting`, `tags: [testing]`):

1. **Invalid input** — when a user/caller passes invalid data, what should
   happen? (Reject? Fall back? Log and continue?)
2. **Missing config** — when required configuration is absent, what's the
   expected behavior?
3. **Unavailable dependency** — when a downstream dep (DB, external API,
   queue) is unreachable, what's the expected behavior? (Retry? Fail fast?
   Degraded mode?)
4. **Boundary values** — at the limits of input ranges, what's the contract?
5. **Concurrent / race conditions** — for items with shared state, what's the
   contract under concurrency?
6. **Interrupted operations** — if a multi-step operation is interrupted,
   what's the expected end state?

For each adversarial scenario where the spec is silent, produce a finding
either: (a) a `[testing]` story to write the test once the spec is settled,
or (b) a `[documentation]` story to extend the foundation doc / item brief
with the missing assertion target.

### Phase 5: Map e2e seams

For items that depend on each other (`depends_on` chains), check whether the
seam between them is tested:
- Does an integration or e2e test exercise the path from item A's output through
  item B's input?
- Are real conditions used (real DB instance, real HTTP, real filesystem in temp)
  rather than mocks of mocks?

For features with multiple child stories, check that the parent feature's overall
acceptance criteria are e2e-covered, not just per-story unit-covered.

### Phase 6: Classify gaps

| Priority | Definition |
|---|---|
| **Critical** | Acceptance criterion with no test |
| **High** | Boundary or error case from spec, no test |
| **Medium** | Valid partition or rule combination, no test |
| **Low** | Complementary coverage that would add confidence |

Also flag tautological tests found during Phase 3 — they need to be reworked or
deleted.

### Phase 7: Convert gaps to items

For each gap (above low priority for the active tier; low goes to backlog):

```yaml
---
id: gate-tests-<short-slug>
kind: story
stage: implementing       # critical/high
                          # OR drafting for medium
tags: [testing]
parent: null
depends_on: []
release_binding: <version>
gate_origin: tests
created: YYYY-MM-DD
updated: YYYY-MM-DD
---

# <one-line description: spec condition not covered>

## Priority
Critical | High | Medium | Low

## Spec reference
Item: `<bound-item-id>`
Acceptance criterion: <quote the criterion>

## Gap type
<missing test for valid partition / boundary / error case / etc.>

## Suggested test
\`\`\`<lang>
// Sketch of the test — name, scenario, assertion target.
// Implementation produces the actual test.
\`\`\`

## Test location (suggested)
`<test-file-path>` (following project conventions)
```

Tautological tests get items too:

```yaml
# id: gate-tests-rework-<original-test-slug>
# kind: story
# tags: [testing, refactor]
# Body describes which test is tautological and what spec behavior it should be
# rewritten to verify (or marked for deletion).
```

### Phase 8: Idempotency

Skip findings that already have gate-tests items for this release.

### Phase 9: Commit

```bash
git add .work/active/stories/ .work/backlog/
git commit -m "gate-tests: <N> coverage gaps for <version>"
```

## Output

In conversation:
- **Bundle**: `<version>` — `<N>` items audited
- **Coverage gaps**: count by priority
- **Tautological tests flagged**: count
- **Items created**: count, with new ids
- **Already-tracked**: count of duplicates skipped

## Guardrails

- Derive tests from specs (item acceptance criteria), NOT from implementation
  code. If you read an implementation body to figure out what to test, you're
  generating tautological coverage.
- Test the public interface, not internal implementation. Tests reaching into
  privates break on refactoring without catching regressions.
- Cite spec references in every finding. A finding without a spec reference is
  testing an assumption, not a contract.
- Prioritize invalid input, error cases, boundary conditions — that's where bugs
  hide and specs are most often undertested.
- Audit only the bundle's items, not the whole repo. Repo-wide test quality is
  out of scope for the gate.
- A failing test that exposes a real spec violation is the most valuable output.
  Don't sand it down — surface it as a Critical finding so the implementation
  gets fixed before shipping.
