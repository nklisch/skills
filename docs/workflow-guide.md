# Workflow Suite Guide

How to use the workflow skills together to build software projects.

## How to Use This Suite

The recommended workflow depends on your model access.

### With Opus 1M context (recommended)

Stay in a single Opus 1M session. Opus runs the planning skills directly — feature,
design, refactor-design, extract-patterns — building up rich context over time. When
it's time to write code, **implement-orchestrator** orchestrates by spawning Sonnet agents
while Opus retains the full picture.

A session stays productive through roughly 600-800k tokens. When context gets heavy,
start a fresh session; the design docs and pattern files carry the knowledge forward.

Each phase typically gets one feature → design → implement-orchestrator cycle, though large
phases may be split into multiple designs (a, b, sometimes c) within the same session.

### Without Opus 1M

Run each skill in a fresh Sonnet session. Use **implement** (single Sonnet agent)
instead of implement-orchestrator. Each skill invocation starts clean — the design documents
and plan artifacts carry the context between sessions.

## The Pipeline

These skills form a pipeline where each skill's output feeds the next.
**implement** is the universal consumer — all planning skills produce output it can execute.

### Starting a Project

**ideate** — Interactive workshop that produces foundation documents (VISION.md,
SPEC.md, ARCHITECTURE.md, and domain-specific docs). Run once at project start.

### Expanding Scope

**expand** — When the project needs a major new capability, subsystem, or
architectural shift. Reads existing foundation docs and codebase, interviews
about the expansion, then updates the foundation docs and roadmap. The next
design phase picks up where expand left off.

Use expand when the change is big enough to affect the vision, spec, or
architecture. If it's small and self-contained, use feature instead.

### Core Development (per phase)

Each phase is driven by the project's foundation docs (VISION.md, SPEC.md,
ARCHITECTURE.md, roadmap). Design reads these directly — no intermediate step.
Large phases may be split into multiple designs (a, b, sometimes c).

1. **research** (if needed) — Investigate unfamiliar libraries or APIs before
   designing. Produces a research doc and an auto-loading reference skill.
2. **design** — Read the roadmap/vision, produce detailed implementation units
   with exact interfaces, types, and acceptance criteria
3. **implement-orchestrator** (Opus 1M) — Opus orchestrator spawns Sonnet agents to
   implement the design
   — OR **implement** (Sonnet) — Single agent implements the design directly

### Quick Extensions

**feature** — For small, self-contained additions outside the core roadmap.
Typically used at the end of a project or as one-offs. Produces a lightweight
feature brief that design consumes.

### After Each Phase

5. **update-documentation** — Align all docs to the code changes just made.
   Runs inline (same context), not as a separate agent.

### Refactoring (every 2-4 phases)

After 2-4 implementation phases (typically 3), run a refactoring pass:

6. **refactor-design** — Find duplication, missing abstractions, structural
   improvements. Produces a refactor plan.
7. **implement-orchestrator** or **implement** — Execute the refactor plan.
8. **extract-patterns** — Document reusable patterns for consistency across
   future work. Other skills read these patterns before acting.

> Don't refactor after every phase. Let code accumulate so refactor-design
> can identify real duplication and missing abstractions, not one-off patterns.

### Style & Structure Refactoring (every 3-5 phases)

After more significant accumulation (3-5 phases):

9. **stylistic-refactor-creator** — Interview-based. Produces a project-specific
   **stylistic-refactor** skill that scans for coding style inconsistencies.
10. **structural-refactor-creator** — Interview-based. Produces a project-specific
    **structural-refactor** skill that scans for organizational issues.

Run the generated skills, then use **implement-orchestrator** or **implement** to apply
the high-value items. Re-run periodically and at project end.

> **Timing matters.** The creators need even more code than refactor-design to be
> effective. Running them too early produces noise — wait until the codebase has
> enough patterns and structure to analyze meaningfully.

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

### implement vs implement-orchestrator

| Criteria | implement | implement-orchestrator |
|----------|-----------|------------------|
| Model access | Sonnet (no Opus 1M) | Opus 1M |
| How it works | Single Sonnet agent, fresh context | Opus orchestrator spawns Sonnet agents |
| Best for | Any size design, sequential | Large designs, parallelizable work |
| Context | Reads the design doc cold | Opus already has deep project context |

**If you have Opus 1M**: Use implement-orchestrator. Opus has been running feature, design,
refactor-design in the same session — it already understands the codebase deeply and
crafts precise prompts for the Sonnet agents it spawns.

**If you don't**: Use implement in a fresh Sonnet session. The design document carries
all the context the agent needs.

### refactor-design vs the creators

| Skill | Focus | When to run |
|-------|-------|-------------|
| refactor-design | Code reuse, deduplication, missing abstractions | Every 2-4 phases (typically 3) |
| stylistic-refactor-creator | Coding style preferences | Every 3-5 phases |
| structural-refactor-creator | File/folder organization | Every 3-5 phases |

These three have distinct, non-overlapping scopes. They complement each other.

### test-quality vs e2e-test-design

| Skill | Approach | Writes tests? |
|-------|----------|---------------|
| test-quality | Spec-driven, finds gaps in unit/integration tests | Yes — writes them directly |
| e2e-test-design | Journey-driven, designs e2e test suites | No — produces a design for implement |

## Typical Project Lifecycle

```
ideate                                       ← project start (once)
│
│  ┌── Opus 1M session ──────────────────┐
│  │                                     │
├──│─ design → implement-orchestrator            │  ← phase 1
├──│─ design → implement-orchestrator            │  ← phase 2
├──│─ design → implement-orchestrator            │  ← phase 3
│  │                                     │
├──│─ refactor-design → implement-orchestrator    │  ← refactor pass (~every 3 phases)
├──│─ extract-patterns                    │  ← capture conventions
│  │                                     │
│  └─ ~600-800k tokens, start fresh ─────┘
│
│  ┌── new session ──────────────────────┐
│  │                                     │
├──│─ design → implement-orchestrator            │  ← phase 4
├──│─ design a,b → implement-orchestrator       │  ← phase 5 (large, split)
├──│─ design → implement-orchestrator            │  ← phase 6
│  │                                     │
├──│─ refactor-design → implement-orchestrator    │  ← refactor pass
├──│─ extract-patterns                    │
│  │                                     │
├──│─ stylistic-refactor-creator          │  ← style/structure pass (~phase 5)
├──│─ structural-refactor-creator         │
├──│─ run generated skills → impl-design  │
│  │                                     │
│  └─────────────────────────────────────┘
│
├─ test-quality                              ← testing pass
├─ e2e-test-design → implement
│
├─ run refactor skills again                 ← periodic cleanup
│
├─ feature → design → implement             ← quick extensions / one-offs
│
├─ release                                   ← ship it
```
