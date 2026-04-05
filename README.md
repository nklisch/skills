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
- **workflow** — 21 skills for the full development pipeline
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
design → implement/implement-orchestrator ← core phases (from roadmap)
    ↓
refactor-design → implement → extract-patterns  ← every 2-4 phases
    ↓
bold-refactor / perf-design → implement         ← targeted improvements
    ↓
expand                              ← major scope changes (updates foundation docs)
    ↓
stylistic/structural-refactor-creator         ← every 3-5 phases
    ↓
security-review → design → implement           ← security audit pass
    ↓
feature → design → implement        ← quick one-offs near the end
    ↓
release                              ← ship it
```

| Skill | What it does |
|-------|-------------|
| **ideate** | Interactive project definition workshop. Produces foundation docs (VISION.md, SPEC.md, ARCHITECTURE.md). Run once at project start. |
| **roadmap** | Generate an agent-optimized project roadmap from foundation docs. Decomposes into phases with dependencies and test checkpoints. |
| **expand** | Expand project scope — new subsystem, major capability, architectural shift. Updates foundation docs and roadmap. |
| **feature** | Scope a quick extension or one-off outside the core roadmap. Produces a feature brief that design consumes. |
| **design** | Produce detailed implementation units with exact interfaces, types, and acceptance criteria. |
| **implement** | Write code from a design or plan. Single Sonnet agent. Best for <20 files. |
| **implement-orchestrator** | Opus orchestrator that spawns Sonnet agents. For 20+ files or independent subsystems. |
| **research** | Investigate libraries, APIs, and SDKs. Produces a research doc and an auto-loading reference skill. |
| **refactor-design** | Find duplication and missing abstractions. Produces a refactor plan that implement executes. |
| **bold-refactor** | Find beautiful code abstractions and cross-cutting simplifications using conceptual lenses. Produces an implement-ready design. |
| **extract-patterns** | Document reusable code patterns for consistency across future work. |
| **stylistic-refactor-creator** | Interview-based. Generates a project-specific stylistic-refactor skill. |
| **structural-refactor-creator** | Interview-based. Generates a project-specific structural-refactor skill. |
| **perf-design** | Profile performance bottlenecks and design optimized solutions. Follows a strict optimization hierarchy. |
| **security-review** | Comprehensive security audit. Discovers stack, user selects focus domains, produces scored report with severity-classified findings. |
| **cruft-cleaner** | Sweep for AI-accumulated cruft (dead code, stale comments, defensive bloat). Triages by confidence, parallel cleanup. |
| **test-quality** | Spec-driven test gap analysis. Derives tests from contracts, not code. Writes the tests. |
| **e2e-test-design** | Design golden-path and adversarial e2e test suites. Interactive. |
| **update-documentation** | Align all docs to code after changes. |
| **release** | Draft changelog, confirm with user, run the project's release mechanism. |

### Skill Authoring

| Skill | What it does |
|-------|-------------|
| **write-tool-skill** | Create distributable reference skills for your project's tool, CLI, MCP server, or library — for others to install. |
| **skill-idea-refiner** | Refine a rough skill idea into a well-designed skill. Guides through ideation, scoping, and scaffolding. |
| **skill-evaluator** | Evaluate skills against type-specific quality rubrics. Produces scored reports with improvements. |
| **tool-evaluator** | Self-evaluate agent tool usage in the current conversation. Produces a report with recommendations for tool authors. |

### Principles (auto-load)

Auto-load during design and implementation to enforce standards.

| Skill | What it enforces |
|-------|-----------------|
| **design-principles** | Ports & Adapters, Single Source of Truth, Generated Contracts |
| **implementation-principles** | Fail Fast, guard clauses, data-driven extensibility, boundary enforcement |

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

## Repo Structure

```
skills/                    # Workflow plugin skills (plugin + skilltap)
.agents/skills/            # Reference, principle, and utility skills (skilltap)
.claude-plugin/            # Claude Code plugin manifest
docs/                      # Workflow guide and design docs
tap.json                   # Skilltap registry
```

## Requirements

- Claude Code with Task/Agent tool support
- Git repository
