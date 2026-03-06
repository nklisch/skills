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
| **research** | Research external libs, APIs, and patterns. Produces a research document + auto-invocation skill. |
| **extract-patterns** | Discover and document reusable code patterns from any codebase. |
| **refactor-plan** | Plan refactoring work with incremental, testable steps. |

### Dev Workflow Pipeline

These five skills form a complete design-to-code workflow. Use them in sequence:

```
design → implement → verify → fix → quality-gate
```

| Skill | Description |
|-------|-------------|
| **design** | Translate a vision into a detailed design document with typed implementation units. |
| **implement** | Write code from a design document, following established patterns. |
| **verify** | Verify implementation against design, producing a verification report with actionable gaps. |
| **fix** | Resolve gaps from a verification report with targeted, minimal changes. |
| **quality-gate** | Final 4-dimension quality assessment (tests, code quality, refactor, vision). |

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
