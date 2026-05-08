# nklisch/skills

A software development workflow suite for Claude Code — from ideation through implementation, refactoring, testing, and release.

Available as a **Claude Code plugin** and via **[skilltap](https://github.com/nklisch/skilltap)**.

## Install

### As a Plugin (Claude Code)

```bash
# Step 1: Add the marketplace
/plugin marketplace add nklisch/skills

# Step 2: Install plugins
/plugin install workflow@nklisch-skills
/plugin install skill-authoring@nklisch-skills
```

Two plugins available:
- **workflow** — 24 skills for the full development pipeline (design, implement, refactor, fix, review, test, ship)
- **skill-authoring** — 3 skills for creating, evaluating, and refining agent skills

### Via Skilltap

```bash
# Add this tap
skilltap tap add nklisch https://github.com/nklisch/skills

# Install individual skills
skilltap install design
skilltap install implement
skilltap install research
```

## Workflow Skills

These skills form an iterative pipeline. See [docs/workflow-guide.md](docs/workflow-guide.md) for the full usage guide.

### Pipeline

```
ideate → roadmap                    ← project start
    ↓
autopilot                           ← autonomous end-to-end execution
    ── OR ── manual workflow:
    ↓
design → implement/implement-orchestrator ← core phases (from roadmap)
    ↓
refactor-design → implement → extract-patterns  ← every 2-4 phases
    ↓
bold-refactor / perf-design → implement         ← targeted improvements
    ↓
extend                              ← scope additions (small or large)
    ↓
refactor-conventions-creator        ← once after 3-5 phases
    ↓
security-review → design → implement           ← security audit pass
    ↓
fix                                 ← bugs found along the way
    ↓
review                              ← peer-review changes before shipping
    ↓
release                              ← ship it
```

| Skill | What it does |
|-------|-------------|
| **ideate** | Interactive project definition workshop. Produces foundation docs (VISION.md, SPEC.md, ARCHITECTURE.md). Includes anti-vision, competitive landscape, and maximalist-vs-minimalist contrast to attack the idea. Run once at project start. |
| **roadmap** | Generate an agent-optimized project roadmap from foundation docs. Decomposes into phases with dependencies and test checkpoints. |
| **autopilot** | Autonomously execute an entire roadmap end-to-end. Loops design → implement-orchestrator → test per phase with refactoring passes. Tracks progress for cross-session resume. |
| **extend** | Add capability to an existing project. Branches on scope: small additions produce a feature brief; major expansions update foundation docs and roadmap. |
| **design** | Produce detailed implementation units with exact interfaces, types, and acceptance criteria. Considers 2-3 architectural options, designs the trickiest unit first, includes a pre-mortem. |
| **implement** | Write code from a design or plan. Single Sonnet agent. Best for <20 files. Moves the design doc to `docs/designs/completed/` after success. |
| **implement-orchestrator** | Opus orchestrator that spawns Sonnet agents. For 20+ files or independent subsystems. Moves the design doc to `docs/designs/completed/` after success. |
| **research** | Investigate libraries, APIs, and SDKs. Produces a research doc and an auto-loading reference skill. |
| **refactor-design** | Find duplication, missing abstractions, code smells, and dead weight. Produces a refactor plan that implement executes. |
| **bold-refactor** | Find beautiful code abstractions and cross-cutting simplifications using conceptual lenses (elimination, unification, inversion, etc.). Produces an implement-ready design. |
| **extract-patterns** | Document reusable code patterns for consistency across future work. |
| **refactor-conventions-creator** | Interview-based. Generates a project-specific refactor-conventions skill that scans for both stylistic and structural issues. |
| **perf-design** | Profile performance bottlenecks and design optimized solutions. Follows a strict optimization hierarchy. |
| **security-review** | Comprehensive security audit. Discovers stack, user selects focus domains, produces scored report with severity-classified findings. |
| **cruft-cleaner** | Sweep for AI-accumulated cruft (dead code, stale comments, defensive bloat). Triages by confidence, parallel cleanup. |
| **test-quality** | Spec-driven test gap analysis. Derives tests from contracts, not code. Reworks tautological tests (rewrites or deletes). Writes new tests. |
| **e2e-test-design** | Design golden-path and adversarial e2e test suites. Output uses the implementation-units format so /implement can execute it directly. |
| **fix** | Diagnose and repair a specific bug. Reproduces, bisects, writes a failing test, applies the minimal fix, confirms. |
| **review** | Review a code change — branch diff, commit, range, working tree, unpushed commits, or PR. Produces Blocker / Important / Nit findings. |
| **repo-eval** | Multi-dimensional codebase evaluation. Launches parallel explore agents, cross-checks claims, produces a calibrated 1-10 scorecard with prioritized recommendations. |
| **tool-evaluator** | Self-evaluate agent tool usage in the current conversation. Produces a report with recommendations for tool authors. |
| **update-documentation** | Align all docs to code after changes. Includes a doc-organization audit that moves misplaced files into the canonical `docs/` structure. |
| **release** | Draft changelog, confirm with user, run the project's release mechanism. |

### Skill Authoring

| Skill | What it does |
|-------|-------------|
| **write-tool-skill** | Create distributable reference skills for your project's tool, CLI, MCP server, or library — for others to install. |
| **skill-idea-refiner** | Refine a rough skill idea into a well-designed skill. Guides through ideation, scoping, and scaffolding. |
| **skill-evaluator** | Evaluate skills against type-specific quality rubrics. Produces scored reports with improvements. |
| **tool-evaluator** | Self-evaluate agent tool usage in the current conversation. Produces a report with recommendations for tool authors. |

### Principles (auto-load)

| Skill | What it enforces |
|-------|-----------------|
| **principles** | Ports & Adapters, Single Source of Truth, Generated Contracts, Fail Fast — with per-phase guidance for design time and implementation time. Auto-loads when either /design or /implement is active. |

## Library & Tool References

Reference skills that auto-load when their library is detected. Installed individually via skilltap.

| Skill | Library |
|-------|---------|
| **bun** | Bun runtime — Bun.$, Bun.file, bun:test |
| **zod-v4** | Zod v4 — schemas, safeParse, transforms |
| **biome-v2** | Biome v2 — linter/formatter config |
| **drizzle-v0** | Drizzle ORM v0.45+ PostgreSQL |
| **hono-v4** | Hono v4 — routes, middleware, SSE |
| **tanstack-query-v5** | TanStack Query v5 (React Query) |
| **tanstack-router-v1** | TanStack Router v1 — file-based routing |
| **tanstack-table-v8** | TanStack Table v8 — headless tables |
| **zustand-v5** | Zustand v5 — state management |
| **citty** | citty CLI framework (UnJS) |
| **clack-prompts** | @clack/prompts — terminal UI |
| **smol-toml** | smol-toml — TOML parser/serializer |
| **claude-cli-sdk** | @nklisch/claude-cli-sdk |
| **schemars** | schemars 1.x — Rust JSON Schema generation |

## Other Skills

| Skill | What it does |
|-------|-------------|
| **design-pages** | Design GitHub Pages for a project |
| **clean-memory** | Audit and refine MEMORY.md |

## Canonical `docs/` Structure (in projects using these skills)

The workflow skills converge on a shared `docs/` layout in any project that uses them. Each
doc-producing skill writes to its canonical path by default; you don't need to configure anything.

```
docs/
├── VISION.md, SPEC.md, ARCHITECTURE.md, ROADMAP.md, etc.   ← foundation docs (from ideate, roadmap, extend)
├── PROGRESS.md                                              ← autopilot state
├── designs/                                                 ← active design docs
│   ├── {name}.md                                            ← from /design
│   ├── refactor-{name}.md                                   ← from /refactor-design
│   ├── perf-{name}.md                                       ← from /perf-design
│   ├── bold-{name}.md                                       ← from /bold-refactor
│   ├── e2e-{name}.md                                        ← from /e2e-test-design
│   └── completed/                                           ← moved here by /implement after success
└── features/                                                ← briefs from /extend (small mode)
```

`/update-documentation` includes a Phase 6 audit that detects misplaced docs and offers to
`git mv` them into the canonical layout. Skills will only deviate from these defaults if your
project clearly has a different convention already in place.

## Repo Structure (this repo)

```
plugins/workflow/skills/   # Workflow plugin skills (plugin + skilltap)
plugins/skill-authoring/skills/   # Skill-authoring plugin skills
.agents/skills/            # Reference, principle, and utility skills (skilltap)
.claude-plugin/            # Claude Code plugin manifest
docs/                      # Workflow guide and design docs
tap.json                   # Skilltap registry
```

## Requirements

- Claude Code with Task/Agent tool support
- Git repository
