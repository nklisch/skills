# Workflow Suite Guide

> ## ⚠ DEPRECATED — NO LONGER SUPPORTED
>
> The `workflow` plugin is **deprecated and no longer supported.** No new
> features or bug fixes will land here. This guide is kept for reference
> only.
>
> **New projects** should use [`agile-workflow`](agile-workflow-guide.md) —
> substrate-driven work tracking with late-binding releases, gates that
> produce items, and an autopilot queue runner. Pair it with
> [`ux-ui-design`](ux-ui-design-guide.md) for mockup-first UI alignment.
>
> **Existing `workflow` projects** can migrate by running
> `/agile-workflow:convert` — it detects the legacy `docs/designs/` +
> `docs/ROADMAP.md` + `docs/PROGRESS.md` layout and migrates phases into
> epics, designs into features, and completed designs into a retro-release.
> See the [migration matrix](../plugins/agile-workflow/docs/MIGRATION.md).

How to use the workflow skills together to build software projects.

## How to Use This Suite

The recommended workflow depends on your model access.

### With Opus 1M context (recommended)

Stay in a single Opus 1M session. Opus runs the planning skills directly — extend,
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

### Fully autonomous (autopilot)

If you want hands-off execution, run **autopilot** after ideate and roadmap are complete.
It reads the roadmap and loops through design → implement-orchestrator → test for each
phase autonomously — making all decisions itself using built-in decision frameworks.
Refactoring passes trigger every 2-4 phases, testing passes at major boundaries, and
documentation updates at the end.

Autopilot tracks progress in `docs/PROGRESS.md`. If a session runs out of context, start
a fresh `/autopilot` — it resumes from where it left off.

Use autopilot when you trust the roadmap and want to let Claude execute without
intervention. Use the manual workflow when you want to review designs and make
decisions at each step.

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

### Extending the Project

**extend** — Add capability to an existing project. The skill branches in Phase 3 based
on scope:

- **Small addition** (one-off feature, doesn't change architecture) → produces a feature
  brief at `docs/features/{slug}.md` that **design** consumes.
- **Major expansion** (new subsystem, architectural shift, new domain area) → updates
  foundation docs and roadmap so the next design phase builds on solid ground.

You don't pick the path upfront — `extend` asks you which fits after exploring the idea
with you. (This skill replaces the previous `feature` + `expand` pair.)

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

### Refactor Conventions (once, after 3-5 phases)

After 3-5 phases of accumulated code, run the creator **once** to set up a
project-specific refactoring skill that captures both style and structure preferences:

9. **refactor-conventions-creator** — Interview-based. Explores the repo, researches
   stack-specific best practices, interviews you about both stylistic preferences
   (early returns, error handling, paradigm) and structural preferences (file size,
   folder layout, module boundaries, co-location), then generates a project-specific
   **refactor-conventions** skill with `references/style/` and `references/structure/`
   subdirectories.
10. Run the **generated skill** immediately after — it scans the codebase and produces
    a prioritized refactoring plan with separate Style Refactors and Structure Refactors
    sections.
11. Use **implement-orchestrator** or **implement** to apply the high-value items.

From then on, periodically re-run the **generated skill** (not the creator) to find new
inconsistencies as the codebase grows. Only re-run the creator if you want to expand or
update the rules themselves. (This skill replaces the previous separate
`stylistic-refactor-creator` and `structural-refactor-creator` skills.)

> **Timing matters.** The creator needs significant accumulated code to interview
> effectively. Running it too early produces thin, obvious rules. Wait until the
> codebase has enough patterns to analyze meaningfully.

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

### Fixing Bugs

- **fix** — Diagnose and repair a specific reported bug. Reproduces the issue,
  bisects to the root cause, writes a failing test that captures the bug,
  applies the minimal fix, then confirms. Use when something is verifiably
  broken — not for unverified hunches, refactoring, or feature additions.

### Code Review

- **review** — Peer review a specific code change. Accepts flexible targets:
  branch diff (default vs main), specific commit, commit range, working tree,
  unpushed commits (`@{u}..HEAD`), or PR by number (via `gh`). Produces a
  prioritized review with Blocker / Important / Nit findings. Different from
  `/repo-eval` and `/security-review` which audit the full repository.

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

### Manual workflow vs autopilot

| Criteria | Manual | Autopilot |
|----------|--------|-----------|
| User involvement | Review designs, approve refactors, make judgment calls | Fully autonomous — no questions asked |
| When to use | Want control over each phase | Trust the roadmap, want hands-off execution |
| Resumability | Session context carries state | PROGRESS.md tracks state across sessions |
| Refactoring | You decide when | Every 2-4 phases (judgment-driven) |
| Testing passes | You decide when | At major boundaries and end of roadmap |
| Prerequisites | Foundation docs + roadmap | Foundation docs + roadmap |

### refactor-design vs refactor-conventions-creator vs bold-refactor

| Skill | Focus | When to run |
|-------|-------|-------------|
| refactor-design | Code smells, dedup, missing abstractions, dead weight | Every 2-4 phases (typically 3) |
| refactor-conventions-creator | Both stylistic and structural conventions | Once after 3-5 phases, then re-run the generated skill |
| bold-refactor | Conceptual reconceptions — what single elegant idea would make half this code unnecessary | Occasionally, when something feels architecturally off |

These four (with bold-refactor) have distinct, non-overlapping scopes. `refactor-design`
finds incremental improvements; `refactor-conventions-creator` codifies team preferences;
`bold-refactor` questions the underlying design.

### test-quality vs e2e-test-design

| Skill | Approach | Writes tests? |
|-------|----------|---------------|
| test-quality | Spec-driven, finds gaps in unit/integration tests | Yes — writes them directly |
| e2e-test-design | Journey-driven, designs e2e test suites | No — produces a design for implement |

### Principles (auto-loading)

This skill is not invoked directly. It auto-loads when relevant skills
(design, implement, refactor-design, etc.) are active, providing consistent
architectural and coding standards across the pipeline.

- **principles** — Ports & Adapters, Single Source of Truth, Generated Contracts,
  and Fail Fast. Each principle has per-phase subsections covering both design-time
  application (the architectural decision) and implementation-time enforcement
  (the code-level discipline). Auto-loads when either /design or /implement is
  active. (This skill replaces the previous separate `design-principles` and
  `implementation-principles` skills.)

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
├─ autopilot                                 ← autonomous: runs everything below
│                                              until roadmap is complete
│  ── OR ── manual workflow: ───────────────
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
├──│─ refactor-conventions-creator        │  ← conventions pass (~phase 5)
├──│─ run generated skill → impl-orch     │
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
├─ run refactor-conventions skill again      ← periodic cleanup
│
├─ extend → design → implement               ← quick extensions / one-offs
├─ fix                                        ← bugs surfaced along the way
├─ review                                     ← peer-review changes before shipping
│
├─ release                                   ← ship it
```

## Canonical `docs/` Structure

The workflow skills converge on this layout in any project that uses them. Each
doc-producing skill writes to its canonical path by default — you don't need to
configure anything.

```
docs/
├── VISION.md, SPEC.md, ARCHITECTURE.md, ROADMAP.md   ← foundation docs (from ideate, roadmap, extend)
├── PROGRESS.md                                         ← autopilot state (from autopilot)
├── designs/                                            ← active design docs
│   ├── {name}.md                                       ← from /design
│   ├── refactor-{name}.md                              ← from /refactor-design
│   ├── perf-{name}.md                                  ← from /perf-design
│   ├── bold-{name}.md                                  ← from /bold-refactor
│   ├── e2e-{name}.md                                   ← from /e2e-test-design
│   └── completed/                                      ← /implement moves designs here after success
└── features/                                           ← briefs from /extend (small mode)
```

Skills will only deviate from these defaults if your project clearly has a different
convention already in place. `/update-documentation` includes a Phase 6 audit that detects
misplaced files and offers to `git mv` them into the canonical layout.
