# Design: Workflow Plugin Package

## Overview

Package the workflow skill suite as a Claude Code plugin with three additions: a new "feature" skill (lighter than ideate for scoping features within existing projects), a human-facing workflow guide, and the plugin manifest. Also distributed via skilltap for individual skill installation.

## Structural Decision: Plugin + Skilltap Coexistence

Plugins discover skills from `skills/` at the plugin root. Skilltap requires `.agents/skills/`. To support both:

- Workflow skills move to `skills/` (both plugin and skilltap discover them)
- Reference and principle skills stay in `.agents/skills/` (skilltap only)
- No symlinks needed — skilltap supports `skills/` directly

```
skills-repo/
├── .claude-plugin/
│   └── plugin.json                        # plugin manifest
├── skills/                                # plugin + skilltap discover these
│   ├── feature/SKILL.md                   # NEW
│   ├── design/SKILL.md
│   ├── implement/SKILL.md
│   ├── implement-orchestrator/SKILL.md
│   ├── refactor-design/SKILL.md
│   ├── extract-patterns/SKILL.md
│   ├── stylistic-refactor-creator/        # includes references/
│   ├── structural-refactor-creator/       # includes references/
│   ├── test-quality/SKILL.md
│   ├── e2e-test-design/SKILL.md
│   ├── release/SKILL.md
│   └── update-documentation/SKILL.md
├── .agents/skills/                        # skilltap discovers these too
│   ├── zod-v4/SKILL.md                    # reference skills
│   ├── hono-v4/SKILL.md
│   ├── design-principles/SKILL.md         # principle skills
│   └── ...
├── tap.json
├── docs/
│   └── workflow-guide.md                  # human-facing workflow docs
└── README.md                             # plugin landing page
```

## Implementation Units

### Unit 1: Feature Skill

**File**: `skills/feature/SKILL.md`

```yaml
---
name: feature
description: >
  Scope a new feature within an existing project. Explores the codebase, understands existing
  architecture and patterns, interviews the user about requirements and constraints, then
  produces a feature brief that design consumes. Use when adding a feature to an existing
  project — not for starting new projects (use ideate for that).
user-invocable: true
disable-model-invocation: true
allowed-tools: Read, Write, Glob, Grep, Agent, AskUserQuestion
model: opus
---
```

The feature skill fills the gap between ideate (project starter) and design (implementation planner). It produces the "what and why" that design turns into "how."

**Workflow structure** (target: ~100 lines):

```markdown
# Feature

You scope a new feature for an existing project. You explore the codebase, understand
what exists, then work with the user to define what the feature should do and produce
a brief that the **design** skill consumes.

## Phase 1: Understand the Project

Before scoping a feature, understand what already exists.

1. Read **CLAUDE.md**, **VISION.md**, **SPEC.md**, **ARCHITECTURE.md** — whatever
   foundation docs exist
2. Use the Explore agent (model: haiku) to map the codebase: directory structure,
   modules, entry points, key abstractions
3. Read the **patterns** skill if it exists — understand established conventions
4. Note the project's current state: what's built, what's not, what stage it's in

## Phase 2: Explore the Feature Idea

Freeform conversation. Understand what the user wants to add and why.

Explore through natural conversation:
- **What** — what does this feature do? What's the user-facing behavior?
- **Why** — what problem does it solve? What's the motivation?
- **Where** — where does it fit in the existing architecture? What does it touch?
- **Constraints** — performance requirements, compatibility, security considerations?
- **Dependencies** — does it depend on external APIs, libraries, or existing features?
- **Scope** — what's in, what's explicitly out?

Push for specificity. "It should handle errors well" becomes "invalid input returns
a 400 with a structured error body."

## Phase 3: Define and Confirm

**AskUserQuestion checkpoint:** Present a feature summary:
- Feature name
- One-paragraph description
- Scope: what's in / what's out
- Key requirements with acceptance criteria
- Technical constraints and dependencies
- Open questions for design to resolve

Iterate until the user approves.

## Phase 4: Write Feature Brief

Write the brief to a location based on project conventions (e.g., `docs/features/`,
`docs/`, or project root). Ask the user if unclear.

## Output

The feature brief is consumed by **design** to produce implementation units.

Structure:

\`\`\`markdown
# Feature: {Name}

## Summary
{One-paragraph description of what this feature does and why}

## Requirements
- {Concrete requirement with acceptance criteria}
- {Another requirement}

## Scope
**In scope:**
- {What this feature covers}

**Out of scope:**
- {What this feature explicitly does NOT cover}

## Technical Context
- **Existing code**: {relevant modules, interfaces, patterns this touches}
- **Dependencies**: {external APIs, libraries, or internal features required}
- **Constraints**: {performance, compatibility, security requirements}

## Open Questions
- {Unresolved questions for design to investigate and resolve}
\`\`\`

## Anti-Patterns

- NEVER produce implementation details — that's design's job
- NEVER start a new project — that's ideate's job. This skill assumes
  foundation docs and a codebase already exist.
- NEVER skip reading the existing codebase — the feature must fit what's there
- NEVER write vague requirements — every requirement needs acceptance criteria
- NEVER guess at technical constraints — ask the user
```

**Implementation Notes**:
- ~100 lines, well within workflow skill limits
- Interactive with one AskUserQuestion checkpoint (Phase 3)
- Output format is deliberately simpler than design's output — it's a "what" doc, not a "how" doc
- design already knows how to find and read docs from `docs/` — the feature brief lands there

**Acceptance Criteria**:
- [ ] Skill under 120 lines
- [ ] Produces output that design can consume without modification
- [ ] Does NOT overlap with ideate (no foundation docs, no project definition)
- [ ] Explores existing codebase before interviewing user
- [ ] Has anti-patterns section

---

### Unit 2: Workflow Guide

**File**: `docs/workflow-guide.md`

```markdown
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
3. **implement-orchestrator** — Opus orchestrator spawns Sonnet agents to implement
   the design in parallel (use for 20+ files or independent subsystems)
   — OR **implement** — Single Sonnet agent implements the design directly
   (use for <20 files or tightly coupled units)

Repeat this loop 2-4 times per project phase. Each iteration builds on the last.

### Post-Implementation

After each development loop:

4. **refactor-design** — Find duplication, missing abstractions, structural
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

### implement vs implement-orchestrator

| Criteria | implement | implement-orchestrator |
|----------|-----------|------------------|
| Design size | <20 files | 20+ files |
| Unit coupling | Tightly coupled | Independent subsystems |
| Model | Sonnet (single agent) | Opus orchestrator + Sonnet agents |
| Parallelism | Sequential | Parallel where possible |

### refactor-design vs the creators

| Skill | Focus | When to run |
|-------|-------|-------------|
| refactor-design | Code reuse, deduplication, missing abstractions | After each development loop |
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
├─ feature → design → implement-orchestrator    ← phase 1 (repeat 2-4x)
├─ feature → design → implement-orchestrator    ← phase 2
├─ refactor-design → implement              ← clean up
├─ extract-patterns                       ← capture conventions
│
├─ feature → design → implement-orchestrator    ← phase 3
├─ feature → design → implement-orchestrator    ← phase 4
├─ refactor-design → implement
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
```

**Implementation Notes**:
- Human-facing, not agent-facing — no frontmatter, no instructions for agents
- The lifecycle diagram is the key artifact — shows the real iterative workflow
- Selection guide uses tables for quick reference
- Timing advice for refactor creators is called out explicitly (the user flagged this as important)

**Acceptance Criteria**:
- [ ] Covers all workflow skills in the suite
- [ ] Includes selection guides for implement vs implement-orchestrator, refactor-design vs creators, test-quality vs e2e-test-design
- [ ] Includes the iterative lifecycle diagram
- [ ] Notes timing for refactor creators (after 3-4 phases)
- [ ] Human-readable, no agent instructions

---

### Unit 3: Plugin Manifest

**File**: `.claude-plugin/plugin.json`

```json
{
  "name": "workflow",
  "description": "Software development workflow skills — design features, implement from plans, refactor codebases, extract patterns, design tests, and ship releases.",
  "version": "1.0.0",
  "author": {
    "name": "nklisch"
  },
  "repository": "https://github.com/nklisch/skills",
  "license": "MIT"
}
```

**Implementation Notes**:
- Plugin name `workflow` keeps it short — skills are namespaced as `workflow:design`, `workflow:implement`, etc.
- Version 1.0.0 since the suite is stable after the improvements
- Only `plugin.json` goes inside `.claude-plugin/` — all other content at plugin root

**Acceptance Criteria**:
- [ ] Valid JSON
- [ ] Name is concise and descriptive
- [ ] `.claude-plugin/` directory contains only `plugin.json`

---

### Unit 4: Move Workflow Skills to `skills/`

Move these skill directories from `.agents/skills/` to `skills/`:

| Skill | Source | Destination |
|-------|--------|-------------|
| design | `.agents/skills/design/` | `skills/design/` |
| implement | `.agents/skills/implement/` | `skills/implement/` |
| implement-orchestrator | `.agents/skills/implement-orchestrator/` | `skills/implement-orchestrator/` |
| refactor-design | `.agents/skills/refactor-design/` | `skills/refactor-design/` |
| extract-patterns | `.agents/skills/extract-patterns/` | `skills/extract-patterns/` |
| stylistic-refactor-creator | `.agents/skills/stylistic-refactor-creator/` | `skills/stylistic-refactor-creator/` |
| structural-refactor-creator | `.agents/skills/structural-refactor-creator/` | `skills/structural-refactor-creator/` |
| test-quality | `.agents/skills/test-quality/` | `skills/test-quality/` |
| e2e-test-design | `.agents/skills/e2e-test-design/` | `skills/e2e-test-design/` |
| release | `.agents/skills/release/` | `skills/release/` |
| update-documentation | `.agents/skills/update-documentation/` | `skills/update-documentation/` |

**Implementation Notes**:
- `git mv` preserves history
- No symlinks needed — skilltap discovers skills from `skills/` directly
- Reference skills (zod-v4, hono-v4, etc.) and principle skills (design-principles, implementation-principles) stay in `.agents/skills/` — they're not part of the workflow plugin

**Acceptance Criteria**:
- [ ] All workflow skills exist in `skills/`
- [ ] Symlinks resolve correctly (`ls -la .agents/skills/<name>` shows target)
- [ ] Reference/principle skills unchanged in `.agents/skills/`
- [ ] Git history preserved for moved files

---

### Unit 5: Update tap.json

**File**: `tap.json`

Add the feature skill entry:

```json
{
  "name": "feature",
  "description": "Scope a new feature within an existing project. Explores the codebase, interviews the user about requirements, and produces a feature brief that design consumes.",
  "repo": "nklisch/skills",
  "tags": ["feature", "scoping", "requirements", "interactive", "workflow", "pipeline"]
}
```

**Acceptance Criteria**:
- [ ] Feature skill added to tap.json
- [ ] Valid JSON after edit
- [ ] Description matches the skill's frontmatter description

---

### Unit 6: Update CLAUDE.md

**File**: `.claude/CLAUDE.md`

Update the instruction about skill locations to reflect the dual structure:

Current:
```
- All skills MUST be placed in `.agents/skills/<skill-name>/`, not at the repo root. Skilltap resolves skills from `.agents/skills/` and will fail to find skills placed elsewhere.
```

New:
```
- Workflow skills live in `skills/<skill-name>/` (for the Claude Code plugin and skilltap).
- Reference and principle skills live in `.agents/skills/<skill-name>/`.
- Skilltap resolves from both `skills/` and `.agents/skills/`.
```

**Acceptance Criteria**:
- [ ] CLAUDE.md reflects the dual directory structure
- [ ] Clear which skills go where

---

## Implementation Order

1. **Unit 3** — Create plugin manifest (no dependencies)
2. **Unit 4** — Move workflow skills to `skills/` (no dependencies, but do before Unit 1)
3. **Unit 1** — Create feature skill in `skills/feature/` (depends on Unit 4 for directory structure)
4. **Unit 5** — Update tap.json (depends on Unit 1)
5. **Unit 6** — Update CLAUDE.md (depends on Unit 4)
6. **Unit 2** — Write workflow guide (depends on Unit 1 for feature skill content)

Units 3 and 4 can run in parallel.
Units 5 and 6 can run in parallel after their dependencies.

## Verification Checklist

```bash
# Plugin structure
test -f .claude-plugin/plugin.json && echo "PASS: manifest exists"
python3 -c "import json; json.load(open('.claude-plugin/plugin.json'))" && echo "PASS: valid manifest JSON"

# Skills in plugin directory
ls skills/design/SKILL.md skills/implement/SKILL.md skills/feature/SKILL.md && echo "PASS: workflow skills in skills/"

# Reference skills unchanged
test -f .agents/skills/zod-v4/SKILL.md && echo "PASS: reference skills intact"

# tap.json valid
python3 -c "import json; d=json.load(open('tap.json')); assert any(s['name']=='feature' for s in d['skills'])" && echo "PASS: feature in tap.json"

# Feature skill exists and is reasonable size
wc -l skills/feature/SKILL.md | awk '{if ($1 <= 120) print "PASS: feature skill under 120 lines"; else print "FAIL: too long"}'
```

- [ ] Plugin manifest valid at `.claude-plugin/plugin.json`
- [ ] All 12 workflow skills in `skills/` directory
- [ ] Reference/principle skills unchanged in `.agents/skills/`
- [ ] Feature skill produces output design can consume
- [ ] Workflow guide covers all skills with selection guides
- [ ] tap.json includes feature skill
- [ ] CLAUDE.md updated for dual directory structure
- [ ] Git history preserved for moved files
