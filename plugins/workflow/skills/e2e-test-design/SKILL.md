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

You design a comprehensive end-to-end test suite by understanding how a project is actually used,
then producing two test sets: golden-path journeys and adversarial/failure scenarios.

## Workflow

Work through these phases in order. Do NOT skip AskUserQuestion checkpoints.

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

Design tests for realistic, successful user journeys. These assume correct input,
valid configuration, and a healthy environment.

**Principles:**
- Each test should represent a complete user journey, not an isolated unit
- Tests run against the real project (or a realistic test environment), not mocks
- Cover the critical paths a user would take on their first day using the project
- Include setup and teardown — tests should be self-contained and repeatable
- Assert on user-visible outcomes (output, files created, state changes), not internals

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

Design tests that verify the project handles bad situations gracefully.

**Principles:**
- Each test should verify that failure is *handled*, not just that it *occurs*
- Assert on error messages, exit codes, HTTP status codes, cleanup behavior
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

Incorporate feedback, then write the final test design document.

## Output

Write the test design document to the project. Look for existing test directories or docs
directories to place it. If unclear, ask the user.

**Document structure:**

```markdown
# E2E Test Suite Design

## Project Summary
{Project type, entry points, target users}

## Test Environment
{Framework, setup requirements, fixtures needed}

## Existing Coverage
{What's already tested, identified gaps}

---

## Golden-Path Tests

### Journey: {Name}
**Priority:** {high/medium/low}

#### Test: {test name}
- **Setup:** ...
- **Steps:** ...
- **Assertions:** ...
- **Teardown:** ...

---

## Adversarial / Failure-Mode Tests

### Category: {User Mistakes | Bad Environment | Boundary Conditions}

#### Test: {test name — what goes wrong}
- **Scenario:** ...
- **Action:** ...
- **Expected behavior:** ...
- **Verify no side effects:** ...

---

## Implementation Notes
{Testing framework specifics, shared fixtures, helper utilities needed}

## Priority Order
{Recommended implementation order — highest-value tests first}
```

## Anti-Patterns (CRITICAL)

- NEVER design tests without reading the codebase first
- NEVER skip asking the user about failure expectations — you cannot guess error handling philosophy
- NEVER write tests that depend on implementation internals — test user-visible behavior
- NEVER design tests that can't run independently — each test must be self-contained
- NEVER assume how errors should be handled — ask the user in Phase 5
- NEVER ignore existing test infrastructure — build on what's already there
