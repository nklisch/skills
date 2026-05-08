---
name: extend
description: >
  Add capability to an existing project — handles both small one-off features and major
  scope expansions. Reads foundation docs, explores the codebase, then branches: small
  additions produce a feature brief that design consumes; large expansions update
  foundation docs and roadmap before designing. Use when adding anything to an existing
  project with foundation docs and a codebase. For starting from scratch, use /ideate.
user-invocable: true
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Agent, AskUserQuestion, WebSearch
model: opus
---

# Extend

You add capability to an existing project — anything from a small one-off feature to a
major new subsystem. You understand what exists first, explore the idea with the user,
then branch: small additions produce a brief that **design** consumes; large expansions
update the project's foundation documents so the next design phase builds on solid ground.

This is NOT for starting from scratch (use **ideate** for that).

## Phase 1: Understand the Project

Before discussing what to add, understand what already exists.

1. Read all foundation docs: **VISION.md**, **SPEC.md**, **ARCHITECTURE.md**, roadmap,
   and any domain-specific docs (UX.md, CONTRACT.md, etc.)
2. Use the Explore agent (model: **sonnet** minimum, **opus** for large or complex codebases)
   to map the current codebase: directory structure, modules, key abstractions, what's built
3. Use the **patterns** skill if it exists — understand established conventions
4. Read **CLAUDE.md** — project guidelines and conventions
5. Note what roadmap phases have been completed, what's in progress, what's planned

Summarize your understanding briefly: "Here's where the project stands — [summary]. What are you looking to add?"

## Phase 2: Explore the Idea

Freeform conversation. No structured questions yet — understand what the user wants and why.

Explore through natural conversation:
- **What** — what does this add? What's the user-facing behavior or new capability?
- **Why** — what problem does it solve? What's the motivation?
- **Where** — where does it fit in the existing architecture? What does it touch?
- **Scale** — is this a focused addition or a significant new direction?
- **Dependencies** — external APIs, libraries, or internal features required?
- **Constraints** — performance, compatibility, security considerations?

Push for specificity. "Handle errors well" becomes "invalid input returns a 400 with a structured error body."

When you can articulate the idea clearly, summarize it and ask: "Did I get this right? What's missing?"

## Phase 3: Scope Branching

Once the idea is clear, determine the right path.

**AskUserQuestion checkpoint:**

Present a one-paragraph description of what the user wants to add and ask:

> "Is this a small, focused addition to the existing codebase (doesn't change the architecture or foundation docs), or a larger expansion that adds a new subsystem, capability, or direction?"

- **Small addition** — a new endpoint, a new command, a new component, a bug fix with scope, a one-off feature. Doesn't require updating VISION, SPEC, or ARCHITECTURE. Continue to **Phase 4a**.
- **Major expansion** — a new subsystem, significant new capability, architectural shift, new domain area, new audience. Foundation docs need updating before design. Continue to **Phase 4b**.

If unclear, lean toward **4a** — it's easier to upgrade a brief to foundation-doc work than to reverse.

---

## Phase 4a: Feature Brief Path (small additions)

### 4a.1: Define and Confirm

Sharpen the scope:
- **What's in** — concrete requirements with acceptance criteria
- **What's out** — explicit exclusions to prevent scope creep
- **Technical context** — existing modules, patterns, and interfaces this touches
- **Open questions** — unresolved questions for design to investigate

**AskUserQuestion checkpoint:** Present a feature summary. Iterate until approved.

### 4a.2: Write Feature Brief

Write the brief to a location based on project conventions (e.g., `docs/features/`, `docs/`, or project root). Ask the user if unclear.

```markdown
# Feature: {Name}

## Summary
{One-paragraph description of what this feature does and why}

## Requirements
- {Concrete requirement with acceptance criteria}

## Scope
**In scope:**
- {What this feature covers}

**Out of scope:**
- {What this explicitly does NOT cover}

## Technical Context
- **Existing code**: {relevant modules, interfaces, patterns this touches}
- **Dependencies**: {external APIs, libraries, or internal features required}
- **Constraints**: {performance, compatibility, security requirements}

## Open Questions
- {Unresolved questions for design to investigate and resolve}
```

The feature brief is consumed by **design** to produce implementation units.

---

## Phase 4b: Expansion Path (major expansions)

### 4b.1: Assess Impact

Before updating docs, map how the expansion affects what exists.

1. **Architecture impact** — does the current architecture support this, or does it need to evolve? New layers, boundaries, integration points?
2. **Spec impact** — new technical constraints, interfaces, non-functional requirements?
3. **Vision impact** — does the project's purpose or audience change, or just capabilities?
4. **Roadmap impact** — how many phases does this add? Where does it fit?

Run **research** first if the expansion uses unfamiliar technology.

**AskUserQuestion checkpoint:** Present the impact assessment — which docs need updating and how, proposed new roadmap phases, trade-offs the user needs to decide. Iterate until approved.

### 4b.2: Update Foundation Docs

Update each affected document. For each one:

1. **Read the current version** in full
2. **Edit surgically** — extend sections, add new ones, update scope descriptions. Do NOT rewrite content that hasn't changed.
3. **Maintain consistency** — match the existing document's style, structure, and level of detail

What to update per doc type:
- **VISION.md** — extend scope, add new capabilities, update success criteria if changed
- **SPEC.md** — add new technical constraints, interfaces, non-functional requirements
- **ARCHITECTURE.md** — add new components, update data flow, document new boundaries
- **Roadmap** — add new phases with descriptions, reorder if needed
- **Domain-specific docs** — update or create as needed

After updating, present each changed document to the user for review.

### 4b.3: Confirm and Commit

**AskUserQuestion checkpoint:** Present a summary:
- Documents updated (list with one-line description of what changed)
- New roadmap phases added
- Next step: "Run design on phase N to start implementing the expansion"

Commit the updated foundation docs.

---

## Anti-Patterns

- NEVER produce implementation details — that's design's job
- NEVER start a project from scratch — that's ideate's job. This skill assumes foundation docs and a codebase already exist.
- NEVER skip reading the existing codebase — any addition must fit what's built
- NEVER write vague requirements — every requirement needs acceptance criteria
- NEVER rewrite foundation docs from scratch — extend them. The project's history and decisions matter.
- NEVER add vague roadmap entries — each phase needs enough detail for design to work from
