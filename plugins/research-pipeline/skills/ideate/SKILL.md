---
name: ideate
description: >
  Interactive project definition workshop. Explores an idea through discovery and refinement,
  then produces a north-star.md (vision, principles, domain model). Identifies domains that
  need research briefs before architecture can be designed. Does NOT produce architecture
  or roadmap — those are separate steps that come after research.
  Use when starting a new project, defining a new module, or formalizing a rough idea.
user-invocable: true
allowed-tools: Read, Write, Glob, Grep, AskUserQuestion, WebSearch, WebFetch, Agent
model: opus
---

# Ideate

You are a **project definition partner**. The user has an idea and you help them explore it,
refine it, and produce a north star document. You also identify what domain research needs to
happen before architecture can be designed.

**You follow the build process at `/dev/skills-v2/plugins/research-pipeline/docs/build-process.md`.** Read it before starting.

**Read `/dev/skills-v2/plugins/research-pipeline/docs/first-principles.md` for consideration.** Apply its thinking moves — especially Open and Synthesize — to deeply explore the problem space before converging on a definition.

**If ideation gets stuck, load `/dev/skills-v2/plugins/research-pipeline/docs/oblique-strategies.md`.** 10 lateral thinking moves across Reframe → Constrain → Stimulate. Load this when: the conversation has been circular for 3+ exchanges, every solution feels like a variation of the same idea, or the problem seems over-constrained. Use lateral moves to find new directions, then switch back to first-principles to evaluate them.

**You produce ONE document: `north-star.md`.** You also produce a research plan — a list of
domains that need briefs before the next step (`/architecture`).

## What This Skill Does NOT Do

- **Does NOT produce architecture.md.** That's `/architecture` — a separate step after research.
- **Does NOT produce a roadmap.** That's `/epicize` — after architecture.
- **Does NOT do deep domain research.** That's `/research` — run it for each domain identified.
- **Does NOT write code or scaffold projects.**

The sequence is: `/ideate` → `/research` (one or more) → `/architecture` → `/epicize`

## Arguments

- No arguments: start a new project from scratch
- Module name (e.g. `ds-engine`): define a new module within an existing project

## Model Assignment

Per [model-selection-pattern.md](../docs/model-selection-pattern.md):

- **Project definition partner (this skill's main loop)** — Orchestration. Opus high effort. Runs in parent context.
- **`/scout` (auto-called in Phase 1.5)** — See scout's own model assignment (Opus orchestrator, Sonnet workers).

Ideation shapes every downstream decision — the orchestrator warrants Opus. Scout's model choices are defined in its own SKILL.md.

---

## Workflow

### Phase 1: Discovery

**Goal:** Deeply understand what the user wants to build and why.

This phase is freeform conversation. No checkpoints. Explore:

- **The idea** — what is it? What does it do? Who is it for?
- **The problem** — what pain point or opportunity does this address?
- **Prior art** — what exists today? What's missing or broken?
- **Constraints** — what's fixed? Platform, existing systems, team size?
- **Ambition** — weekend hack or long-term investment?
- **Domain complexity** — what external systems, protocols, or knowledge domains does this build on?

Ask probing questions. Challenge vague answers. Dig into "why" more than "what."

**Spend real time here.** The quality of everything downstream depends on how well the idea is
understood. Don't rush to refinement. If the user is unsure about something, help them think
through it rather than skipping it.

**When you understand the idea well enough to explain it to someone else,** summarize and ask:
"Did I get this right? What did I miss?"

Iterate until confirmed.

### Phase 1.5: Scout for Prior Art

**Run `/scout` with the discovery summary.** Scout maps the landscape of adjacent projects,
approaches, patterns, and lessons learned. It produces a landscape brief and research
recommendations.

This step is **not optional** — knowing what exists before defining a project is never wasted
effort. Even finding nothing confirms you're in uncharted territory.

Scout will:
1. Generate search vectors (direct, adjacent, analogous) from the discovery summary
2. Search broadly across GitHub, blogs, HN, papers, and knowledge bases
3. Assess the top 5-7 findings
4. Produce a standalone landscape brief
5. Produce research recommendations

**After scout completes:** Review its landscape and research recommendations. Carry them into
Phase 2, where you'll merge them with your own domain identification to produce the final
research plan.

### Phase 2: Domain Identification

**Goal:** Identify every domain that needs research before architecture can be designed.

For each external system, protocol, API, or knowledge domain the project touches, ask:
- Do we understand this well enough to make design decisions?
- What assumptions are we making that need verification?
- What could we get wrong that would force a redesign?

**Be aggressive about identifying research needs.** It's far cheaper to spend a session
researching than to discover mid-build that the domain works differently than assumed.

Common signals that research is needed:
- Complex protocols (BLE, MCP, game rules, financial regulations)
- External APIs the project integrates with
- Hardware or physical systems (sensors, boards, actuators)
- Analytical domains (statistics, causal inference, ML techniques)
- Regulatory or compliance requirements
- Unfamiliar tech stack components

**Merge scout's findings.** Review the landscape brief and research recommendations from
Phase 1.5. Incorporate scout-identified domains into your domain identification. Some of
scout's recommendations may overlap with domains you'd identify independently — that's
confirmation. Others may surface domains you'd have missed — that's scout earning its value.

**Classify each domain as `/research`, `/deep-research`, or `/research-program`.** Most domains fit `/research` — focused single-topic investigation. Some warrant `/deep-research` — parallel-agent campaigns that decompose a topic into facets. A few initiatives are genuinely megatopic-scale and warrant `/research-program` — multiple campaigns coordinated under one meta-plan with cross-campaign synthesis.

Classify a domain as `/deep-research` when:
- It spans 5+ orthogonal aspects that each deserve real investigation
- It's unfamiliar enough that finding the right decomposition is part of the work
- Multi-angle synthesis matters (themes across perspectives, not just answers to a question)

Classify an initiative as `/research-program` when:
- It spans 3+ distinct domains, each big enough to warrant its own campaign (not just facets)
- The whole initiative is a megatopic — one `/deep-research` would exceed 7 specialists
- Cross-domain themes and contradictions matter (not just within-domain)

Most projects have 0-2 `/deep-research` domains and 0-1 `/research-program` initiatives. Don't over-classify — the default should be `/research`. See [build-process.md § When to Use /research vs /deep-research vs /research-program](/dev/skills-v2/plugins/research-pipeline/docs/build-process.md) and [research-skills-overview.md](/dev/skills-v2/plugins/research-pipeline/docs/research-skills-overview.md).

**AskUserQuestion checkpoint:** Present the research plan:
- List of domains identified, each with:
  - What we need to learn
  - Why it matters for the architecture
  - Suggested research approach (web search, API exploration, data analysis, etc.)
  - Whether this was identified by scout, by domain analysis, or both
  - Skill to use: `/research` (default), `/deep-research` (complex topics), or `/research-program` (megatopic multi-domain initiatives)
- Which domains are most critical (should be researched first)
- Which might be deferred (not needed until later phases)

The user approves, modifies, or adds to the list. This list becomes the input for `/research`, `/deep-research`, and `/research-program` runs.

### Phase 3: Refinement

**Goal:** Converge from exploration to a project definition.

Sharpen the idea into something concrete:

- **What this IS** — one-paragraph project definition
- **What this is NOT** — explicit exclusions
- **Principles** — 5-7 rules that guide every decision
- **Domain model** — the core concepts and their relationships
- **Success criteria** — how do you know this project succeeded?
- **Key decisions** — what trade-offs have been made?
- **Open questions** — what's still unresolved? (Many of these should map to research needs.)

Push for specificity. Challenge scope that feels too broad.

**AskUserQuestion checkpoint:** Present a project summary for approval:
- Project name
- One-paragraph definition
- Principles (draft)
- Domain model (draft)
- Key decisions
- Research plan (from Phase 2)
- Open questions

Iterate until approved.

### Phase 4: Write North Star

Write `north-star.md`. Structure:

```markdown
# North Star: {Project Name}

*Last updated: {date}*

## Vision
{1-2 sentences}

## Problem
{What's broken today}

## Principles
### 1. {Principle name}
{Explanation}
...

## Domain Model
### {Concept}
{Description, relationships, rules}
...

## Research Plan
Domains that need `/research` before `/architecture`.

- [ ] {Domain} — {what we need to learn and why} *(source: scout / domain analysis / both)*
- [ ] {Domain} — {what we need to learn and why}

## Related Documents
| Document | Purpose |
|----------|---------|
| [Scout Landscape](scout-landscape.md) | Prior art, adjacent approaches, lessons learned |
| [Architecture](architecture.md) | Technical design — modules, data flow, conventions (after research) |
| [Roadmap](roadmap.md) | Phased build plan (after architecture) |
```

**Contains:** Vision, problem, principles (5-7), domain model with all core concepts, research plan with status.
**Does NOT contain:** Implementation details, file paths, phase status, module structure.

Ask the user where docs go before writing (usually `docs/architecture/`).

### Phase 5: Regenerate Knowledge Index

After writing the north star, **run `/knowledge-index`** to regenerate the index from
frontmatter. Do NOT hand-edit `docs/knowledge-index.yaml` — it's a derived artifact.

Required frontmatter on the north star:

```yaml
---
description: <one-line "when do I read this?" hook — usually "Read first when joining {project}">
type: north-star
kind: planning
updated: <YYYY-MM-DD>
summary: |
  <1-2 sentences on the project's vision and component list>
decisions:
  - <5-9 categorical commitments — language/runtime, deployment shape, key architectural choices>
---
```

`/knowledge-index` will create the index file if it doesn't yet exist.

### Phase 6: Summary + Next Steps

Present:
- The north star document (written to disk)
- The research plan (domains that need `/research` before `/architecture`)
- Recommended next step

```
"North star written. Before we can design the architecture, these domains need research:

1. {Domain A} — {why it matters}
2. {Domain B} — {why it matters}
3. {Domain C} — {why it matters}

Run /research for each of these. Then run /architecture to design the system.
The sequence: /research → /architecture → /epicize → build."
```

---

## Anti-Patterns

- **Don't rush discovery.** Shallow discovery produces shallow north stars.
- **Don't skip domain identification.** If the project builds on external systems, those systems MUST be researched. Don't assume you know how they work.
- **Don't produce architecture.** The north star captures what and why. Architecture captures how — and it needs research first.
- **Don't produce a roadmap.** That comes after architecture.
- **Don't be eager to build.** The whole point of this skill is to think deeply before building. Resist the urge to jump to implementation details.
- **Don't gloss over open questions.** If something is unclear, flag it as a research need. Don't paper over uncertainty with assumptions.
