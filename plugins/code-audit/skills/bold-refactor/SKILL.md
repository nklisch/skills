---
name: bold-refactor
description: >
  Finds bold architectural reconceptions and writes markdown refactor proposals, without creating
  agile-workflow epics or tracked work. Use only when the user explicitly asks for a bold refactor,
  architectural rethink, deep simplification, or "what single idea would make this code much
  simpler?" Applies conceptual lenses such as elimination, unification, inversion, algebraic design,
  declarative design, and domain crystallization, then writes bold-refactor-report.md with accepted
  proposals, risks, sequencing, and suggested implementation slices.
---

# Bold-Refactor

Look for the abstraction or reframe that would make a subsystem dramatically simpler. This is not a
cleanup pass. It is an architectural provocation pass that produces markdown proposals.

Do not auto-trigger this skill. Run it only when the user explicitly asks for bold refactoring or an
architectural rethink. It is intentionally aggressive.

## What This Is Not

- Cosmetic cleanup, naming, early returns, or helper extraction.
- File reorganization without a deeper simplification.
- Performance profiling.
- Implementation.
- Work-item creation. This standalone variant writes a report and optional proposal docs only.

## Beneath You: Generic Refactoring

Reject suggestions that amount to:
- Extracting a tiny helper used twice.
- Creating an interface with one implementation.
- Applying a pattern because the pattern exists.
- Adding speculative extensibility.
- Wrapping a third-party library only because it might be swapped someday.
- Reorganizing files without changing the system's mental model.

Every suggestion must pass this test: would it surprise a senior engineer, then convince them after
they read the evidence?

## Invocation

- `bold-refactor` or `bold-refactor --all` — sweep the whole codebase for high leverage areas.
- `bold-refactor <path>` — focus on a path or subsystem.
- `bold-refactor <natural language scope>` — interpret against the repo.
- `bold-refactor --output <path>` — write somewhere other than `bold-refactor-report.md`.

## Conceptual Lenses

Commit each proposal to one primary lens.

| Lens | Core question |
|---|---|
| Elimination | What if this code or concept disappeared? What actually breaks? |
| Unification | What different-looking things are secretly the same? |
| Inversion | What if control flowed the other way? |
| Algebraic | What types and compositions are hiding in imperative code? |
| Declarative | What rule language or data model is trying to emerge? |
| Domain crystallization | What domain concept is unnamed but everywhere? |

## Phase 1: Explore

If the user provided a target, focus there. Otherwise sweep for complexity-to-value hotspots.

Start with local probes:
- repo layout and entry points;
- large or deeply nested files;
- dependency edges and repeated concepts;
- modules with many related special cases;
- project docs and pattern docs that explain intentional design.

For broad scopes, spawn up to three read-only exploratory sub-agents in parallel:
1. Architecture map: module structure, data flow, dependency graph.
2. Complexity hotspots: size, nesting, repeated conditional logic, god objects.
3. Hidden assumptions: implicit conventions and coupling.

Read key files yourself before proposing anything.

## Phase 2: Provoke

Generate proposals until the lenses are exhausted or leverage disappears. One sharp proposal beats
five mediocre ones.

Each proposal includes:
- **Provocative name**: the insight, not a task title.
- **Primary lens**.
- **Thesis**: one sentence.
- **Evidence**: files/functions that reveal the shape.
- **Impact**: what code disappears, unifies, or gets simpler.
- **Cost and risk**: migration hazards and what could break.
- **Implementation slices**: an ordered sketch of small enough steps to try later.

Use a structured question tool when available to ask which proposals resonate, which to drop, and
what is missing.

## Phase 3: Discuss And Refine

For proposals the user engages with:
- Push for concrete reasons when an idea does not resonate.
- Narrow to the version that captures most of the value with the least change.
- Combine proposals only when they share the same core insight.
- Recommend "do nothing" when the code does not justify a bold change.

Checkpoint before writing the final report: confirm which proposals should be captured.

## Phase 4: Write The Report

Write `bold-refactor-report.md` unless the user supplied `--output`. Use this shape:

```markdown
# Bold Refactor Report

**Generated**: <ISO-date>
**Scope**: <whole repo | path | natural-language scope>

## Executive summary

<1-3 sentences on whether bold refactoring is warranted>

## Proposals

### <provocative name>

- **Lens**: <lens>
- **Thesis**: <one sentence>
- **Evidence**:
  - `<file:line>` - <what this shows>
- **Impact**: <what gets simpler or disappears>
- **Cost and risk**: <migration hazards>
- **Do-nothing case**: <when not to pursue this>

#### Suggested implementation slices

1. <slice>
2. <slice>
3. <slice>

#### Riskiest assumption

<the assumption to validate first>
```

If no proposal survives, write a short report saying the scan did not find a bold refactor worth
doing and why.

## Guardrails

- Commit each proposal to one lens.
- Reject trivial extraction and speculative abstraction.
- Respect documented project intent; do not frame deliberate patterns as problems unless the
  evidence shows the pattern is failing.
- Do not implement code.
- Do not write `.work/`, backlog, release, or tracking artifacts.
