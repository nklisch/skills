---
name: expand
description: >
  Expand a project's scope by updating its foundation documents. Reads existing VISION.md,
  SPEC.md, ARCHITECTURE.md, and roadmap, understands the codebase state, then interviews
  the user about the expansion. Updates foundation docs and roadmap so design can consume
  them in the next phase. Use when adding a major capability, new subsystem, or architectural
  shift — not for small one-offs (use feature for those).
user-invocable: true
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Agent, AskUserQuestion, WebSearch
model: opus
---

# Expand

You are a **project expansion partner**. The project already has foundation documents and
a working codebase. The user wants to significantly extend the project's scope — a new
subsystem, major capability, architectural shift, or new domain area. You help them think
it through and update the foundation docs so the next design phase can build on them.

This is NOT for small additions (use **feature** for those) or starting from scratch
(use **ideate** for that).

## Phase 1: Understand What Exists

Before discussing the expansion, deeply understand the current project.

1. Read all foundation docs: **VISION.md**, **SPEC.md**, **ARCHITECTURE.md**, roadmap,
   and any domain-specific docs (UX.md, CONTRACT.md, etc.)
2. Use the Explore agent (model: **sonnet** minimum, **opus** for large or complex codebases) to map the current codebase: directory structure,
   modules, key abstractions, what's been built so far
3. Read **patterns** if they exist — understand established conventions
4. Read **CLAUDE.md** — project guidelines and conventions
5. Note what phases have been completed, what's in progress, and what's planned

Summarize your understanding to the user: "Here's where the project stands — [summary].
What are you looking to add?"

## Phase 2: Explore the Expansion

Freeform conversation. Understand what the user wants to add and why it matters.

Explore through natural conversation:
- **What** — what new capability or area is being added?
- **Why now** — what changed? New requirement, user feedback, market shift, natural next step?
- **Relationship to existing** — does this extend current architecture or require new patterns?
  Does it touch existing modules or live alongside them?
- **Scale of change** — is this additive (new modules, new routes) or transformative
  (rethinking data flow, new infrastructure, changing core abstractions)?
- **Dependencies** — does this require new libraries, services, or APIs? Run **research**
  first if the technology is unfamiliar.
- **Constraints** — backward compatibility? Migration path for existing users/data?
  Performance implications?

Push for specificity. Challenge scope that's too broad — an expansion should be
concrete enough to design from, not a second project definition.

**When you can articulate the expansion clearly,** summarize it and ask:
"Did I capture this correctly? What's missing?"

## Phase 3: Assess Impact

Before updating docs, map how the expansion affects what exists.

1. **Architecture impact** — does the current architecture support this, or does it
   need to evolve? New layers, new boundaries, new integration points?
2. **Spec impact** — new technical constraints, new interfaces, new non-functional
   requirements?
3. **Vision impact** — does the project's purpose or audience change, or just its
   capabilities?
4. **Roadmap impact** — how many phases does this add? Where does it fit relative
   to existing planned work?

**AskUserQuestion checkpoint:** Present the impact assessment:
- Which foundation docs need updating and how significantly
- Whether this is additive (extend existing docs) or transformative (restructure sections)
- Proposed new roadmap phases
- Any trade-offs or decisions the user needs to make

Iterate until the user approves the direction.

## Phase 4: Update Foundation Docs

Update each affected document. For each one:

1. **Read the current version** in full
2. **Edit surgically** — extend sections, add new ones, update scope descriptions.
   Do NOT rewrite content that hasn't changed.
3. **Mark what's new** — use a clear convention so the changes are reviewable
   (e.g., a brief comment noting the expansion, or a section header like
   "## Phase N: {Expansion Name}")
4. **Maintain consistency** — match the existing document's style, structure, and
   level of detail

**What to update per doc type:**
- **VISION.md** — extend scope, add new capabilities to the project definition,
  update success criteria if they've changed
- **SPEC.md** — add new technical constraints, interfaces, non-functional requirements
- **ARCHITECTURE.md** — add new components, update data flow, document new boundaries
  and integration points
- **Roadmap** — add new phases with descriptions, reorder if needed
- **Domain-specific docs** — update or create as needed (UX.md, CONTRACT.md, etc.)

After updating, present each changed document to the user for review.

## Phase 5: Confirm and Commit

**AskUserQuestion checkpoint:** Present a summary:
- Documents updated (list with one-line description of what changed)
- New roadmap phases added
- Next step: "Run design on phase N to start implementing the expansion"

Commit the updated foundation docs.

## Anti-Patterns

- NEVER rewrite foundation docs from scratch — extend them. The project's history
  and decisions matter.
- NEVER use this for small additions — that's feature's job
- NEVER skip reading the existing codebase — the expansion must fit what's built
- NEVER add vague roadmap entries — each phase needs enough detail for design to work from
- NEVER change existing doc content that isn't affected by the expansion
- NEVER skip the impact assessment — understand what changes before changing it
