---
name: architecture
description: >
  Design the technical architecture from a north star and research briefs. Produces architecture.md
  (modules, data flow, conventions, dependencies). Only run AFTER /ideate (north star) and /research
  (domain briefs) are complete — architecture decisions should be grounded in research, not assumptions.
  Use when the north star and domain briefs exist and you're ready to design how the system is built.
user-invocable: true
allowed-tools: Read, Write, Glob, Grep, AskUserQuestion, WebSearch, WebFetch, Agent
model: opus
---

# Architecture

You design the **technical architecture** for a project. You read the north star (vision, principles,
domain model) and all domain briefs (research findings), then produce an architecture document that
defines how the system is built.

**You follow the build process at `${CLAUDE_PLUGIN_ROOT}/docs/build-process.md`.** Read it before starting.

**Read `${CLAUDE_PLUGIN_ROOT}/docs/first-principles.md` for consideration.** Apply its thinking moves — especially Challenge and Synthesize — to stress-test design decisions and build from verified foundations.

**Read `${CLAUDE_PLUGIN_ROOT}/docs/system-design.md` for design patterns.** 15 moves across 5 concerns (Structure, Interfaces, Data, Scale, Reliability). Emphasis for `/architecture`: Structure moves (Start Monolith, Invert at Real Boundaries, Minimize Irreversible Decisions) and Interface moves (Contracts Before Implementations, Match API to Consumer). These are the highest-leverage architectural decisions.

**If two architectures seem equally valid, load `${CLAUDE_PLUGIN_ROOT}/docs/oblique-strategies.md`.** Reframe moves (Flip the Goal, Borrow Eyes) break the tie by changing the evaluation perspective.

**Prerequisites:** The north star and relevant domain briefs MUST exist. If they don't, tell the
user to run `/ideate` and `/research` first. Architecture decisions made without domain research
are assumptions, and assumptions cause rewrites.

## Model Assignment

Per [model-selection-pattern.md](../docs/model-selection-pattern.md):

- **Architect (this skill's main loop)** — Orchestration. Opus high effort. Runs in parent context.

Architecture decisions cascade into every downstream phase — the orchestrator warrants Opus. This skill does not spawn sub-agents in v1; all reasoning happens in the parent context.

## What This Skill Produces

**One document: `architecture.md`** — how the system is built. Modules, data flow, conventions,
dependencies.

## What This Skill Does NOT Do

- **Does NOT define vision or principles.** That's the north star (`/ideate`).
- **Does NOT produce a roadmap.** That's `/epicize` — after architecture.
- **Does NOT do domain research.** That's `/research`. If you discover during architecture that
  a domain isn't well enough understood, STOP and tell the user to run `/research` first.

The sequence is: `/ideate` → `/research` → **`/architecture`** → `/epicize`

---

## Workflow

### Phase 1: Load Context

Read everything that exists:

1. **North star** (REQUIRED) — vision, principles, domain model
2. **Domain briefs** (REQUIRED if they exist) — research findings
3. **Existing code** (if any) — understand what's already built
4. **CLAUDE.md** — project conventions
5. **Build process** at `${CLAUDE_PLUGIN_ROOT}/docs/build-process.md` — methodology rules

**Check for research gaps.** As you read the north star and domain briefs, ask yourself:
- Are there domains mentioned in the north star that have no brief?
- Are there architectural decisions that depend on facts not yet researched?
- Are there external systems mentioned that we don't have API/protocol documentation for?

If gaps exist, **stop and flag them** before designing. Don't make architecture decisions
based on assumptions about unresearched domains.

**AskUserQuestion checkpoint (if gaps found):**
"Before I can design the architecture, these domains need research:
- {Domain} — {what we need to know and why it affects the design}
Run `/research` for these, then come back to `/architecture`."

### Phase 2: Architecture Exploration

Explore the design space with the user. This is a conversation, not a form.

**Discuss:**
- **System boundaries** — what's one service vs. many? What's a module vs. a separate project?
- **Module decomposition** — what are the major subsystems? What does each own?
- **Data flow** — how does data move through the system? What are the inputs and outputs?
- **External integrations** — how do we talk to each external system? (Should be informed by domain briefs.)
- **Storage strategy** — what lives where? Files, databases, caches, external services?
- **Conventions** — code organization, naming, API patterns, error handling
- **Technology choices** — language, framework, key libraries. Justify each with research.
- **What's deferred** — what are we explicitly NOT building yet, and why?

**Ground every decision in research.** Don't say "we'll use X" — say "we'll use X
because the domain brief confirmed it fits our constraints (see `relevant-brief.md`)."

**Challenge your own assumptions.** For every design decision, ask: "Do we know this is the right
approach, or are we assuming?" If assuming, flag it as a research need or an open question.

### Phase 3: Refinement

Converge on the architecture. Present it to the user.

**AskUserQuestion checkpoint:** Present the architecture summary:
- System overview (diagram)
- Module list with responsibilities
- Key data flows
- Technology choices with rationale
- What's deferred and why
- Open questions and assumptions flagged

Iterate until approved.

### Phase 4: Write Architecture

Write `architecture.md`. **Required: emit standard frontmatter at the top** so `/knowledge-index` regeneration picks it up reliably without falling back to inference. Structure:

```markdown
---
description: {one-line summary of the architecture — what the system is and how it's organized}
type: architecture
updated: {today's date, YYYY-MM-DD}
---

# Architecture: {Project Name}

*Last updated: {date}*

> How the system is built. For *what* and *why*, see [North Star](north-star.md).
> For *what's next*, see [Roadmap](roadmap.md).

## System Overview
{Diagram — ASCII art showing components and data flow}

## Module Map
{For each module: file/directory → responsibility → external dependency}

## Data Flow
{How data moves through the system. Diagrams encouraged.}

## External Integrations
{How we talk to each external system. Reference domain briefs for details.}

## Conventions
{Code organization, naming, API patterns, error handling, testing approach.}

## Dependencies
{Table: package/service → purpose → version/notes}

## What's Deferred
{Explicit "not now" decisions with rationale}

## Open Questions
{Architectural decisions still unresolved — each should be either a research need or a
decision to make during roadmapping}

## Related Documents
| Document | Purpose |
|----------|---------|
| [North Star](north-star.md) | Vision, principles, domain model |
| [Roadmap](roadmap.md) | Phased build plan (after this document) |

## Related Architecture Docs
| Document | Purpose |
|----------|---------|
| {other architecture-type docs discovered from knowledge index} |
```

**The Related Architecture Docs section** lists all other `type: architecture` entries from the
knowledge index (knowledge-store.md, tool-use-map.md, module north stars, etc.). This tells an
agent reading architecture.md that more architectural context is available.

**Check the knowledge index** (`docs/knowledge-index.yaml`) for entries with `type: architecture`.
If any exist besides this doc, list them. `/update-documentation` should maintain this section
as new architecture docs are added.

**Contains:** Modules, data flow, conventions, dependencies, what's deferred.
**Does NOT contain:** Vision/principles (north star), phase status (roadmap).

### Phase 5: Regenerate Knowledge Index

After writing the architecture doc, **run `/knowledge-index`** to regenerate the index from
frontmatter. Do NOT hand-edit `docs/knowledge-index.yaml` — it's a derived artifact. See
`${CLAUDE_PLUGIN_ROOT}/skills/knowledge-index/SKILL.md` for the full schema.

Required frontmatter on the architecture doc:

```yaml
---
description: <one-line "when do I read this?" hook>
type: architecture
kind: planning
updated: <YYYY-MM-DD>
summary: |
  <1-2 sentences on what's in the doc>
decisions:
  - <5-9 highest-leverage architectural commitments at index-readable depth>
---
```

### Phase 6: Run Doc Review

**Run `/doc-review` after writing the architecture doc.** Architecture is the first doc that
must be consistent with both the north star and domain briefs. Catch contradictions now —
before a roadmap is built on top of them.

### Phase 7: Summary + Next Steps

Present:
- The architecture document (written to disk)
- Doc review results (any issues found and fixed)
- Any open questions that need resolution before roadmapping
- Any new research needs discovered during architecture design

```
"Architecture written. Key decisions:
- {Decision 1} — {rationale, grounded in domain brief}
- {Decision 2} — {rationale}

Open questions for roadmapping:
- {Question 1}

Next step: Run /epicize to create the phased build plan."
```

If new research needs were discovered:
```
"During architecture, I identified research gaps:
- {Domain} — {what we need to know}
Run /research for these before /epicize, or flag them as open questions in the roadmap."
```

---

## Anti-Patterns

- **Don't design without reading briefs.** If domain briefs exist, read them ALL before
  making any design decisions. The whole point of research-before-architecture is to prevent
  assumptions.
- **Don't assume how external systems work.** If there's no brief for an API/protocol, don't
  guess the architecture — flag it as a research gap.
- **Don't include vision or principles.** That's the north star's job. Reference it, don't duplicate.
- **Don't include a roadmap.** That's the next step.
- **Don't rush to close open questions.** If something is genuinely unresolved, flag it honestly.
  It's better to have an open question than a wrong assumption baked into the architecture.
- **Don't design in isolation.** Every major decision should be discussed with the user before
  being committed to the document.
