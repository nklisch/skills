# Workflow Suite Guide

How to use the workflow skills together to build software projects.

## The Pipeline

These skills form a pipeline where each skill's output feeds the next.
**implement** is the universal consumer — all planning skills produce output it can execute.

### Starting a Project

**ideate** — Interactive workshop that produces foundation documents (VISION.md,
SPEC.md, ARCHITECTURE.md, and domain-specific docs). Run once at project start.

### Feature Development (iterative)

Each feature follows this loop:

1. **feature** — Scope the feature: explore the codebase, define requirements,
   produce a feature brief
2. **design** — Turn the feature brief into detailed implementation units with
   exact interfaces, types, and acceptance criteria
3. **implement-design** — Opus orchestrator spawns Sonnet agents to implement
   the design in parallel (use for 20+ files or independent subsystems)
   — OR **implement** — Single Sonnet agent implements the design directly
   (use for <20 files or tightly coupled units)

Repeat this loop 2-4 times per project phase. Each iteration builds on the last.

### Post-Implementation

After each development loop:

4. **refactor-plan** — Find duplication, missing abstractions, structural
   improvements. Produces a refactor plan that **implement** executes.
5. **extract-patterns** — Document reusable patterns for consistency across
   future work. Other skills read these patterns before acting.
6. **update-documentation** — Align all docs to the code changes just made.
   Runs inline (same context), not as a separate agent.

### Refactoring (after critical mass)

After 3-4 phases of accumulated code — not before:

7. **stylistic-refactor-creator** — Interview-based. Produces a project-specific
   **stylistic-refactor** skill that scans for coding style inconsistencies.
8. **structural-refactor-creator** — Interview-based. Produces a project-specific
   **structural-refactor** skill that scans for organizational issues.

Run the generated skills, then use **implement** to apply the high-value items.
Re-run periodically and at project end.

> **Timing matters.** Running the refactor creators too early produces noise.
> You need enough generated code for the skills to identify real patterns
> and real inconsistencies. Wait until 3-4 development phases are complete.

### Testing

- **test-quality** — Spec-driven gap analysis. Derives tests from behavioral
  contracts (specs, designs, interfaces), not from reading implementation code.
  Finds gaps, writes the tests itself.
- **e2e-test-design** — Interactive. Designs golden-path user journeys and
  adversarial/failure-mode tests. Produces a test design document that
  **implement** can execute.

### Release

- **release** — Drafts changelog entries from git history, confirms with user,
  runs the project's release mechanism.

## Selection Guide

### implement vs implement-design

| Criteria | implement | implement-design |
|----------|-----------|------------------|
| Design size | <20 files | 20+ files |
| Unit coupling | Tightly coupled | Independent subsystems |
| Model | Sonnet (single agent) | Opus orchestrator + Sonnet agents |
| Parallelism | Sequential | Parallel where possible |

### refactor-plan vs the creators

| Skill | Focus | When to run |
|-------|-------|-------------|
| refactor-plan | Code reuse, deduplication, missing abstractions | After each development loop |
| stylistic-refactor-creator | Coding style preferences | After 3-4 phases of code |
| structural-refactor-creator | File/folder organization | After 3-4 phases of code |

These three have distinct, non-overlapping scopes. They complement each other.

### test-quality vs e2e-test-design

| Skill | Approach | Writes tests? |
|-------|----------|---------------|
| test-quality | Spec-driven, finds gaps in unit/integration tests | Yes — writes them directly |
| e2e-test-design | Journey-driven, designs e2e test suites | No — produces a design for implement |

## Typical Project Lifecycle

```
ideate                          ← project start (once)
│
├─ feature → design → implement-design    ← phase 1 (repeat 2-4x)
├─ feature → design → implement-design    ← phase 2
├─ refactor-plan → implement              ← clean up
├─ extract-patterns                       ← capture conventions
│
├─ feature → design → implement-design    ← phase 3
├─ feature → design → implement-design    ← phase 4
├─ refactor-plan → implement
├─ extract-patterns
│
├─ stylistic-refactor-creator             ← first refactor pass
├─ structural-refactor-creator
├─ run generated skills → implement
│
├─ test-quality                           ← testing pass
├─ e2e-test-design → implement
│
├─ ... more phases ...
│
├─ run refactor skills again              ← periodic cleanup
├─ release                                ← ship it
```
