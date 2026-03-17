# nklisch/skills

A collection of reusable agent skills for software development workflows, installable via [skilltap](https://github.com/nklisch/skilltap).

## Install

```bash
# Add this tap
skilltap tap add nklisch https://github.com/nklisch/skills

# Install individual skills
skilltap install research
skilltap install design
skilltap install implement
skilltap install verify
skilltap install fix
```

## Skills

### Dev Workflow Pipeline

These skills form a complete design-to-code workflow. Use them in sequence:

```
design → implement → verify → fix → quality-gate
```

| Skill | Description |
|-------|-------------|
| **design** | Translate a vision into a detailed design document with typed implementation units. |
| **implement** | Write code from a design document, following established patterns. |
| **implement-design** | Orchestrate implementation by spawning Sonnet task agents. Opus reads the design, splits work, crafts focused prompts, and delegates. |
| **verify** | Verify implementation against design, producing a verification report with actionable gaps. |
| **fix** | Resolve gaps from a verification report with targeted, minimal changes. |
| **quality-gate** | Final 4-dimension quality assessment (tests, code quality, refactor, vision). |

### Standalone Utilities

| Skill | Description |
|-------|-------------|
| **research** | Research external libs, APIs, and patterns. Produces a research document + auto-invocation skill. |
| **extract-patterns** | Discover and document reusable code patterns from any codebase. |
| **refactor-plan** | Plan refactoring work with incremental, testable steps. |
| **test-quality** | Improve test quality by deriving tests from specs, designs, and contracts — not from existing code. |
| **e2e-test-design** | Design comprehensive e2e test suites with golden-path user journeys and adversarial failure-mode tests. Interactive. |
| **clean-memory** | Audit, validate, and interactively refine MEMORY.md. Removes contradicted and redundant entries. |
| **update-documentation** | Align all documentation layers to code after implementing a feature. |
| **release** | Prepare and publish a release. Drafts changelog entries from recent commits. |
| **design-pages** | Design GitHub Pages for a project. Explores the codebase, then pitches layout, content, and visual identity. |
| **write-tool-skill** | Write agent skills for external tools, CLIs, MCP servers, and libraries. Interactive workflow. |

### Principles (auto-load)

These skills auto-load during relevant workflows to enforce architectural and code-level standards.

| Skill | Description |
|-------|-------------|
| **design-principles** | Architectural principles (Ports & Adapters, Single Source of Truth, Generated Contracts). |
| **implementation-principles** | Code-level principles (Fail Fast, Single Source of Truth, Ports & Adapters enforcement). |

### Library & Tool References (auto-load)

Reference skills that auto-load when their library is detected in your project.

| Skill | Description |
|-------|-------------|
| **bun** | Bun runtime reference — Bun.$, Bun.file, bun:test, shell commands, file I/O, monorepo config. |
| **zod-v4** | Zod v4 validation library — schemas, safeParse, transforms. |
| **biome-v2** | Biome v2 linter/formatter — config, linting rules, formatting. |
| **drizzle-v0** | Drizzle ORM v0.45+ PostgreSQL — schema definitions, queries, migrations. |
| **hono-v4** | Hono v4 web framework — routes, middleware, SSE, validation. |
| **tanstack-query-v5** | TanStack Query v5 (React Query) — useQuery, useMutation, caching. |
| **tanstack-router-v1** | TanStack Router v1 — file-based routing, loaders, search params. |
| **tanstack-table-v8** | TanStack Table v8 — sorting, filtering, pagination, columns. |
| **zustand-v5** | Zustand v5 state management — stores, selectors, persist, middleware. |
| **citty** | citty CLI framework (UnJS) — defineCommand, subcommands, argument definitions. |
| **clack-prompts** | @clack/prompts terminal UI — interactive CLI prompts, spinners, selects, confirms. |
| **smol-toml** | smol-toml TOML parser/serializer — parse, stringify, config files. |
| **claude-cli-sdk** | @nklisch/claude-cli-sdk — spawns Claude CLI as a subprocess using Pro/Max billing. |
| **schemars** | schemars 1.x Rust JSON Schema generation — JsonSchema derive, json_schema! macro, SchemaSettings. |

## The Pipeline

The pipeline skills share a simple document convention:

- A **vision or roadmap document** describes what to build
- `design` reads the vision and writes a **design document**
- `implement` reads the design document and writes code
- `verify` reads the design document + code and writes a **verification report**
- `fix` reads the verification report and patches the code
- `quality-gate` reads the vision + code and writes a **quality gate report**

All skills accept template variables. The key variables are:

| Variable | Used by | Description |
|----------|---------|-------------|
| `{{target}}` | all | Name/description of what you're building |
| `{{design_path}}` | design, implement, verify, fix | Path to DESIGN.md (default: `DESIGN.md`) |
| `{{verification_path}}` | verify, fix | Path to VERIFICATION.md (default: `VERIFICATION.md`) |
| `{{topic}}` | research | The technology/library to research |
| `{{guidelines}}` | research | Project-specific guidelines for the research |

## Build & Test Commands

The pipeline skills are build-tool agnostic. They run your project's build and test commands — set these in your project's CLAUDE.md so the agents know what to use.

## Requirements

- Claude Code with [Task tool](https://docs.anthropic.com/en/docs/claude-code) support (for sub-agent spawning)
- Git repository
