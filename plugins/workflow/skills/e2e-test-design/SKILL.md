---
name: e2e-test-design
description: >
  Design a comprehensive end-to-end test suite for a project. Explores the codebase, understands
  user-facing behavior from docs and code, then designs two test sets: golden-path user journey
  tests and adversarial/failure-mode tests. Interactive — asks the user about expected failure
  behavior before finalizing. Use when starting e2e testing, expanding test coverage, or designing
  integration tests for a project.
user-invocable: true
allowed-tools: Read, Write, Glob, Grep, Bash, AskUserQuestion, Agent
---

# E2E Test Design

You design end-to-end tests that prove the product actually works — not in isolation, not
with mocks, but as a real user would experience it. These tests are the last line of defense
before users hit bugs, and every well-designed test is a bug that never ships.

Take the time to make these tests good. A thorough e2e suite designed from real user
journeys catches the integration bugs that unit tests miss entirely. When a test you
design later catches a real failure, that's the payoff of careful work here.

## Workflow

Work through these phases in order. The AskUserQuestion checkpoints are essential — the
user knows failure modes and usage patterns that aren't in the code.

### Phase 1: Understand the codebase

Map the project before designing anything.

1. **Explore project structure** — use Glob/Grep to find:
   - Entry points (main files, CLI commands, API routes, exported modules)
   - Configuration files (package.json, Cargo.toml, pyproject.toml, etc.)
   - Existing test files and test infrastructure (test runners, fixtures, helpers, mocks)
   - Build/run scripts and CI configuration
2. **Read key source files** — understand the core logic, public API surface, and data flow
3. **Identify the project type** — CLI tool, web app, library, API server, monorepo, etc.
4. **Catalog existing tests** — what's already covered? What testing framework is used?
   Note gaps: untested entry points, missing integration tests, no failure-case coverage
5. **Use the patterns skill** if it exists — read test patterns so your designed tests fit
   the project's existing test infrastructure and fixture conventions

Summarize findings for the user: project type, entry points, existing test coverage, testing framework.

### Phase 2: Understand intended usage

Figure out how users are *supposed* to interact with the project.

1. **Read documentation** — README, docs/, guides, API docs, man pages, --help output
2. **Read examples** — example directories, code samples in docs, demo scripts
3. **Trace user journeys from code** — follow the code path from entry point to output
   for the most common operations
4. **Identify user-facing contracts** — what does the project promise? CLI exit codes,
   API response shapes, error messages, file outputs, side effects

Ask the user to confirm and expand:

**AskUserQuestion checkpoint:**
- "Here are the primary user journeys I identified: [list]. Are these correct? What am I missing?"
- "Who are the target users? (developers, end users, other services)"
- "Are there any undocumented workflows or edge cases I should know about?"

### Phase 3: Re-align to Project Standards
Re-read **CLAUDE.md** (project root and `.claude/` if both exist) and all files in **`.claude/rules/`** (if the directory exists). Even if you read these earlier, re-read them now — recency improves adherence. Confirm your approach aligns with project conventions before proceeding.

### Phase 4: Design golden-path tests

Design tests for realistic, successful user journeys. These prove the product delivers
on its promises — real operations, real data flow, real outcomes.

**Principles:**
- Each test should represent a complete user journey, not an isolated unit — users don't interact with functions, they complete workflows
- Tests run against the real project (or a realistic test environment), not mocks — mocked tests prove the mock works, not the product
- Cover the critical paths a user would take on their first day using the project
- Include setup and teardown — tests should be self-contained and repeatable
- Assert on user-visible outcomes (output, files created, state changes), not internals — if the user can't see it, it's not an e2e concern

**Structure each test as:**
```
Test: {descriptive name reflecting user intent}
Journey: {step-by-step what the user does}
Setup: {preconditions, fixtures, environment}
Assertions: {what to verify — outputs, side effects, state}
Teardown: {cleanup}
```

**Categories to cover:**
- **First-use / happy path** — install, configure, run the most basic operation
- **Core workflows** — the 3-5 things users do most often
- **Configuration variations** — different valid configs, flags, options
- **Data variations** — different valid inputs (small, large, edge-of-valid)
- **Multi-step workflows** — sequences of operations that build on each other

### Phase 5: Gather failure expectations

Before designing adversarial tests, understand how the project *should* handle problems.

**AskUserQuestion checkpoint — ask ALL of these:**

1. "When a user provides invalid input, what should happen? (error message format, exit code, HTTP status, etc.)"
2. "When required configuration is missing or malformed, what's the expected behavior?"
3. "When external dependencies are unavailable (network, database, filesystem), how should the project respond?"
4. "Are there any known failure modes or common user mistakes you want to make sure are handled well?"
5. "What's the project's philosophy on failure — fail fast with clear errors, graceful degradation, retry logic, or something else?"
6. "Are there any operations that should be idempotent or safe to retry?"

Record the user's answers — these become the assertion targets for adversarial tests.

### Phase 6: Design adversarial / failure-mode tests

Design tests that verify the project fails gracefully under real pressure. These are
often the most valuable tests in the suite — the happy path usually works, but failure
handling is where bugs hide.

**Principles:**
- Each test should verify that failure is *handled well*, not just that it *occurs* — the difference between a good product and a fragile one
- Assert on error messages, exit codes, HTTP status codes, cleanup behavior — users judge a product by how it fails, not just how it succeeds
- Tests should verify the project does NOT leave corrupted state after failures
- Cover both user mistakes and environmental problems

**Categories to cover:**

**User mistakes:**
- Invalid input (wrong types, out-of-range values, malformed data)
- Missing required arguments or configuration
- Wrong order of operations
- Permission issues (read-only dirs, missing write access)
- Conflicting options or flags

**Bad environment:**
- Missing dependencies or tools
- Network failures (timeouts, DNS failures, connection refused)
- Disk full / read-only filesystem
- Missing or corrupted config files
- Concurrent access / race conditions (if applicable)

**Boundary conditions:**
- Empty input (empty files, empty strings, no arguments)
- Extremely large input
- Special characters in paths, names, or values
- Interrupted operations (SIGINT, SIGTERM mid-operation)

**Structure each test as:**
```
Test: {descriptive name — what goes wrong}
Scenario: {what bad situation is set up}
Action: {what the user does}
Expected: {how the project should respond — from Phase 5 answers}
Verify: {no corrupted state, proper cleanup, clear error message}
```

### Phase 7: Review and finalize

Present the complete test suite design to the user.

**AskUserQuestion checkpoint:**
- Present a summary: X golden-path tests covering Y journeys, Z adversarial tests covering W failure categories
- "Are there any journeys or failure cases missing?"
- "Should any tests be higher or lower priority?"
- "What test environment constraints should I know about? (CI limitations, available services, etc.)"

Incorporate feedback, then write the final test design document. The goal is a test suite
you'd be proud to hand to a new team member and say "run these — if they pass, the product works."

**After producing the design, hand off to `/implement` (small suite) or `/implement-orchestrator`
(large suite, or when test infrastructure and test cases are clearly independent work). The design
document uses the same implementation-units format that both skills consume.**

## Output

Write the test design document to **`docs/designs/e2e-{descriptive-name}.md`** by default. The `e2e-` prefix distinguishes it from other designs in the same folder. Create `docs/designs/` if it doesn't exist. Only deviate if the project clearly has a different convention.

The output uses the **standard implementation-units format** so `/implement` and
`/implement-orchestrator` can execute it directly.

```markdown
# Design: E2E Test Suite for {Project}

## Overview
{What this suite covers, what it doesn't, which framework it uses}

## Implementation Units

### Unit 1: Test Infrastructure
**File**: `tests/e2e/setup.{ext}`

\`\`\`{lang}
// fixtures, helpers, mock services, seed data, test server setup
// concrete interface — not pseudocode
\`\`\`

**Implementation Notes**:
- {What real services this connects to vs what's mocked}
- {Test data seeding approach}

**Acceptance Criteria**:
- [ ] Test infrastructure starts cleanly and tears down without side effects

---

### Unit 2: {Golden-Path Journey Name}
**File**: `tests/e2e/{journey-slug}.test.{ext}`

\`\`\`{lang}
// describe/it blocks, setup/teardown calls, assertion targets named explicitly
// test skeleton the implementer fills in
\`\`\`

**Implementation Notes**:
- {Steps in order — what the user does}
- {What this test asserts — user-visible outcomes, not internals}
- {Teardown requirements}

**Acceptance Criteria**:
- [ ] Test exercises the full journey end-to-end against real infrastructure
- [ ] All assertions verify user-visible outcomes

---

{Repeat for each golden-path journey}

---

### Unit N: {Adversarial Category Name}
**File**: `tests/e2e/{category-slug}-failures.test.{ext}`

\`\`\`{lang}
// adversarial test skeletons
\`\`\`

**Implementation Notes**:
- {Failure scenario being induced}
- {Expected behavior from Phase 5 answers}
- {How to verify no corrupted state remains}

**Acceptance Criteria**:
- [ ] Test verifies the project fails gracefully (error message, exit code, HTTP status)
- [ ] Test confirms no corrupted state after failure

---

## Implementation Order
1. Unit 1 (test infrastructure) — everything else depends on it
2. Golden-path tests (build on infrastructure)
3. Adversarial tests (leverage infrastructure built by golden-path tests)

## Verification Checklist
{Commands to run the full suite}
```

## Guardrails

- Read the codebase before designing tests — tests designed in a vacuum end up testing imagined behavior, not real behavior
- Ask the user about failure expectations — error handling philosophy varies by project and guessing it wrong produces useless tests
- Test user-visible behavior, not implementation internals — internal-dependent tests break on every refactor without catching real bugs
- Make each test self-contained and independently runnable — coupled tests create cascading failures that obscure the real problem
- Ask the user how errors should be handled (Phase 5) rather than assuming — their answer becomes your assertion targets
- Build on existing test infrastructure — reusing helpers, fixtures, and patterns produces a cohesive test suite
