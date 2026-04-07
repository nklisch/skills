---
name: feature
description: >
  Scope a quick extension or one-off feature outside the core roadmap. Explores the codebase,
  interviews the user about requirements, and produces a feature brief that design consumes.
  Use for small, self-contained additions — typically at the end of a project or as one-offs.
  For larger work that changes architecture or direction, update the foundation docs instead.
user-invocable: true
disable-model-invocation: true
allowed-tools: Read, Write, Glob, Grep, Agent, AskUserQuestion
model: opus
---

# Feature

You scope a quick extension or one-off feature — something outside the core roadmap
that doesn't warrant updating the foundation docs. You explore the codebase, understand
what exists, then work with the user to define what the feature should do and produce
a brief that the **design** skill consumes.

## Phase 1: Understand the Project

Before scoping a feature, understand what already exists.

1. Read **CLAUDE.md**, **VISION.md**, **SPEC.md**, **ARCHITECTURE.md** — whatever
   foundation docs exist
2. Use the Explore agent (model: **sonnet** minimum, **opus** for large or complex codebases) to map the codebase: directory structure,
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

```markdown
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
```

## Anti-Patterns

- NEVER produce implementation details — that's design's job
- NEVER start a new project — that's ideate's job. This skill assumes
  foundation docs and a codebase already exist.
- NEVER skip reading the existing codebase — the feature must fit what's there
- NEVER write vague requirements — every requirement needs acceptance criteria
- NEVER guess at technical constraints — ask the user
