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

Each phase typically gets one design → implement-orchestrator cycle, though large
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

After ideate finishes, run **roadmap** to generate a phased breakdown of the
work into design-sized chunks. It reads the foundation docs, interviews about
build style preferences, and decomposes into phases with dependencies,
deliverables, and test checkpoints. The roadmap is what design reads to know
what to build each phase.

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
   Opus identifies which docs need updating based on its session context, then
   spawns Sonnet edit agents with precise instructions. Each agent validates
   against reality before editing.

### Refactoring (every 2-4 phases)

After 2-4 implementation phases (typically 3), run a refactoring pass:

6. **refactor-design** — Find duplication, missing abstractions, structural
   improvements. Produces a refactor plan.
7. **implement-orchestrator** or **implement** — Execute the refactor plan.
8. **extract-patterns** — Document reusable patterns for consistency across
   future work. Other skills read these patterns before acting.

> Don't refactor after every phase. Let code accumulate so refactor-design
> can identify real duplication and missing abstractions, not one-off patterns.

### Style & Structure Refactoring (once, after 3-5 phases)

After 3-5 phases of accumulated code, run the creators **once** to set up
project-specific refactoring skills:

9. **stylistic-refactor-creator** — Interview-based. Produces a project-specific
   **stylistic-refactor** skill that scans for coding style inconsistencies.
10. **structural-refactor-creator** — Interview-based. Produces a project-specific
    **structural-refactor** skill that scans for organizational issues.
11. Run the **generated skills** immediately after — they scan the codebase and
    produce refactoring plans.
12. Use **implement-orchestrator** or **implement** to apply the high-value items.

From then on, periodically re-run the **generated skills** (not the creators)
to find new inconsistencies as the codebase grows. Only re-run the creators
if you want to expand or update the style/structure rules themselves.

> **Timing matters.** The creators need significant accumulated code to
> interview effectively. Running them too early produces thin, obvious rules.
> Wait until the codebase has enough patterns to analyze meaningfully.

### Performance (as needed)

- **perf-design** — Profile performance bottlenecks and design optimized solutions.
  Follows a strict optimization hierarchy: algorithmic fixes, I/O reduction,
  language idioms, then parallelism. Produces implementation-unit plans with
  benchmark scaffolds for **implement** or **implement-orchestrator**.

### Evaluation & Security (as needed)

- **repo-eval** — Multi-dimensional codebase evaluation. Launches parallel
  explore agents to score architecture, code quality, testing, documentation,
  CI/CD, error handling, security, DX, and maintainability on a calibrated
  1–10 scale. Produces a scorecard with verified findings and prioritized
  recommendations. Use to audit a repo holistically or scope to a subtree
  or specific dimensions.
- **security-review** — Comprehensive security audit. Discovers the codebase
  stack, lets you choose which security domains to focus on (auth, injection,
  secrets, dependencies, API, infra, crypto, data protection, error handling),
  researches current best practices, then produces a scored markdown report
  with severity-classified findings. The report feeds into **design** for
  remediation planning.

### Cleanup (as needed)

- **cruft-cleaner** — Sweep for AI-accumulated cruft: dead code, stale
  comments, compatibility shims, defensive bloat, over-abstraction. Triages
  findings by confidence tier, then orchestrates parallel cleanup agents.
- **bold-refactor** — Find beautiful code abstractions and cross-cutting
  simplifications. Applies conceptual lenses (elimination, unification,
  inversion) to surface bold architectural ideas, then converges into an
  implement-ready design document.

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
| stylistic-refactor-creator | Coding style preferences | Once after 3-5 phases, then re-run generated skill |
| structural-refactor-creator | File/folder organization | Once after 3-5 phases, then re-run generated skill |

These three have distinct, non-overlapping scopes. They complement each other.

### test-quality vs e2e-test-design

| Skill | Approach | Writes tests? |
|-------|----------|---------------|
| test-quality | Spec-driven, finds gaps in unit/integration tests | Yes — writes them directly |
| e2e-test-design | Journey-driven, designs e2e test suites | No — produces a design for implement |

### Principles (auto-loading)

These skills are not invoked directly. They auto-load when relevant skills
(design, implement) are active, providing consistent architectural and
coding standards across the pipeline.

- **design-principles** — Architectural principles: Ports & Adapters, Single
  Source of Truth, Generated Contracts. Auto-loads during design, interface
  definition, and architectural decisions.
- **implementation-principles** — Code-level principles: Fail Fast, Single
  Source of Truth enforcement, guard clauses. Auto-loads during implement
  and any code-writing activity.

### Skill Authoring

These skills help you create and maintain agent skills — both for this suite
and for project-specific reference skills.

- **write-tool-skill** — Create distributable reference skills for the current
  project's tool, CLI, MCP server, or library. Researches the codebase (code
  is source of truth, not docs), proposes scope and structure, writes the skill
  files for others to install. Use when you want to teach other people's agents
  how to use your project.
- **skill-idea-refiner** — Refine a rough skill idea into a well-designed skill.
  Guides through ideation, scoping, naming, structure decisions, and progressive
  disclosure. Produces a design brief, then scaffolds the files.
- **skill-evaluator** — Evaluate existing skills against type-specific quality
  rubrics. Classifies the skill type, scores across dimensions, recommends
  improvements, and generates test scenarios.
- **tool-evaluator** — Self-evaluate agent tool usage in the current
  conversation. Analyzes confusion points, inefficiencies, and API surface
  friction. Produces a report with recommendations for tool authors.

**Typical usage**: research produces a quick internal reference skill for a
library your project depends on. write-tool-skill creates a distributable
skill that teaches others how to use your project's own tool/API/library.
Use skill-evaluator to audit any skill's quality.

## Typical Project Lifecycle

```
ideate → roadmap                             ← project start (once)
│
│  ┌── Opus 1M session ──────────────────┐
│  │                                     │
├──│─ design → implement-orchestrator     │  ← phase 1
├──│─ design → implement-orchestrator     │  ← phase 2
├──│─ design → implement-orchestrator     │  ← phase 3
│  │                                     │
├──│─ refactor-design → impl-orch         │  ← refactor pass (~every 3 phases)
├──│─ extract-patterns                    │  ← capture conventions
│  │                                     │
│  └─ ~600-800k tokens, start fresh ─────┘
│
│  ┌── new session ──────────────────────┐
│  │                                     │
├──│─ design → implement-orchestrator     │  ← phase 4
├──│─ design a,b → impl-orch             │  ← phase 5 (large, split)
├──│─ design → implement-orchestrator     │  ← phase 6
│  │                                     │
├──│─ refactor-design → impl-orch         │  ← refactor pass
├──│─ extract-patterns                    │
│  │                                     │
├──│─ stylistic-refactor-creator          │  ← style/structure pass (~phase 5)
├──│─ structural-refactor-creator         │
├──│─ run generated skills → impl-orch    │
│  │                                     │
│  └─────────────────────────────────────┘
│
├─ perf-design → implement                   ← performance pass (as needed)
├─ repo-eval                                 ← holistic codebase scoring
├─ security-review → design → implement      ← security audit (pre-release)
├─ cruft-cleaner                             ← cleanup pass (as needed)
├─ bold-refactor → implement                 ← architectural simplification
│
├─ test-quality                              ← testing pass
├─ e2e-test-design → implement
│
├─ run refactor skills again                 ← periodic cleanup
│
├─ feature → design → implement              ← quick extensions / one-offs
│
├─ release                                   ← ship it
```
