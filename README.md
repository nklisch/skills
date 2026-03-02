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

### Standalone Utilities

| Skill | Description |
|-------|-------------|
| **research** | Research external libs, APIs, and patterns. Produces RESEARCH.md + auto-invocation skill. |
| **extract-patterns** | Discover and document reusable code patterns from any codebase. |
| **refactor-plan** | Plan refactoring work with incremental, testable steps. |

### Dev Workflow Pipeline

These five skills form a complete design-to-code workflow. Use them in sequence:

```
design → implement → verify → fix → quality-gate
```

| Skill | Description |
|-------|-------------|
| **design** | Translate a vision into a detailed DESIGN.md with typed implementation units. |
| **implement** | Write code from a DESIGN.md, following established patterns. |
| **verify** | Verify implementation against design, producing VERIFICATION.md with actionable gaps. |
| **fix** | Resolve gaps from VERIFICATION.md with targeted, minimal changes. |
| **quality-gate** | Final 4-dimension quality assessment (tests, code quality, refactor, vision). |

## The Pipeline

The pipeline skills share a simple file convention:

- A **VISION.md** or **ROADMAP.md** describes what to build
- `design` reads the vision and writes **DESIGN.md**
- `implement` reads DESIGN.md and writes code
- `verify` reads DESIGN.md + code and writes **VERIFICATION.md**
- `fix` reads VERIFICATION.md and patches the code
- `quality-gate` reads VISION.md + code and writes **QUALITY_GATE.md**

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
