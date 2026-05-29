---
name: research
description: >
  Research external systems, libraries, APIs, protocols, domain knowledge, and patterns.
  Investigates deeply, evaluates options, and produces a domain brief + auto-loading reference skill.
  Use before designing features that depend on unfamiliar technology, when domain knowledge is
  needed for architecture decisions, or when assumptions need verification.
  Extended for domain research and knowledge indexing.
user-invocable: true
allowed-tools: Read, Write, Glob, Grep, WebSearch, WebFetch, Agent, AskUserQuestion
model: opus
---

# Research

You research external systems deeply and produce two outputs: a domain brief with your
findings and an auto-loading reference skill. You also update the project's knowledge index.

**You follow the build process at `/dev/skills-v2/plugins/research-pipeline/docs/build-process.md`.** Read it before starting.

**Read `/dev/skills-v2/plugins/research-pipeline/docs/first-principles.md` for consideration.** Apply its thinking moves — especially Open and Challenge — to decompose domains deeply and stress-test assumptions during research.

**Extended for domain research (protocols, game rules, analytical methods) and knowledge index integration.**

## Model Assignment

Per [model-selection-pattern.md](../docs/model-selection-pattern.md):

- **Researcher (this skill's main loop)** — Orchestration. Opus high effort. Runs in parent context.
- **Investigation sub-agents (Phase 2)** — Parallel worker. Sonnet medium. Typically 3-5 parallel across sub-questions.
- **Synthesis (Phase 3)** — Synthesis. Opus high. Runs in parent context after sub-agents complete.

Scoping, synthesis, and recommendation are high-leverage — the orchestrator warrants Opus. Parallel investigation is scoped work where Sonnet is sufficient. For broader topics, escalate to `/deep-research`; for genuine megatopics spanning multiple domains, escalate further to `/research-program`. See [research-skills-overview.md](/dev/skills-v2/plugins/research-pipeline/docs/research-skills-overview.md) for the three-scale family.

## What This Covers

This skill handles two types of research:

**Technology research** — libraries, APIs, SDKs, frameworks:
- Evaluate options against project needs
- Verify API shapes from current docs (don't trust training data)
- Check health: recent commits, releases, community, license
- Produce code examples and integration patterns

**Domain research** — protocols, game rules, hardware, analytical methods, regulations:
- Investigate how external systems work
- Document rules, specifications, edge cases with source citations
- Produce implementation-relevant guidance (not textbook summaries)
- Ground findings in real data when available

## Phase 0: Knowledge Index Check (HARD PRECONDITION)

**Do not start research without this step.** Duplicated research is the #1 way knowledge layers rot.

1. Read `docs/knowledge-index.yaml` (or run `/knowledge-index` if no file exists)
2. Search the index for entries whose `description` or `title` overlaps with the research target
3. **If a relevant brief exists:**
   - Read it in full
   - Decide one of: (a) the existing brief is sufficient — STOP, present the existing brief to the user and confirm, (b) the existing brief is incomplete — note specifically what's missing and proceed with research scoped to the gap, (c) the existing brief is stale (outdated facts, superseded by changes) — proceed with research and explicitly mark this as a refresh of the existing brief
4. **If no relevant brief exists:** proceed to Phase 1
5. Communicate the outcome to the user before starting Phase 1: "Index check complete. Found existing brief X / Found no existing brief / Found related brief Y, scoping research to gap."

## Phase 1: Scope the Research

1. Read **CLAUDE.md** and project docs — understand the stack, constraints, what's known
2. Explore the codebase — find how the project currently handles the area being researched
3. **Assess breadth.** Is this a focused single-domain topic, or does it span 5+ orthogonal aspects? If the topic is genuinely broad (multiple perspectives, requires decomposition, multi-angle synthesis matters), suggest `/deep-research` instead. If the topic spans multiple distinct domains each big enough to be its own campaign (3+), suggest `/research-program`. Let the user decide. See [build-process.md § When to Use /research vs /deep-research vs /research-program](/dev/skills-v2/plugins/research-pipeline/docs/build-process.md).
4. Define research questions:
   - What specific problem does this knowledge solve for the project?
   - What assumptions are we making that need verification?
   - What could we get wrong that would force a redesign?

**AskUserQuestion checkpoint:** Present:
- The research questions you'll investigate
- Options you plan to evaluate (if technology research)
- Domains you plan to investigate (if domain research)
- Any existing knowledge that's relevant (from the index)

Ask: "Are these the right questions? Anything to add or exclude?"

## Phase 2: Investigate

### For Technology Research

**2a. Official Sources**
- Read official documentation — focus on getting-started guides and API reference
- Check current version and recent changelog
- Read migration guides if upgrading

**2b. Health Check**
- Repository: recent commits, open issues, PR response time
- Releases: frequency, latest date, semver discipline
- Community: download trends, Stack Overflow activity
- License: compatible with project?

**2c. API Verification**
- Find the actual API surface — do NOT trust training data
- Verify function signatures, config options, return types from docs
- Find real-world usage examples (blog posts, open source projects)
- Note breaking changes between major versions

**2d. Integration Fit**
- Works with project's runtime/framework/build system?
- What does integration look like? (imports, config, initialization)
- Known conflicts with other dependencies?

### For Domain Research

**2a. Authoritative Sources**
- Official specifications, rule books, RFCs, API documentation
- Use WebSearch and WebFetch to find current sources
- Cite rule numbers, section references, version numbers

**2b. Real Data Grounding**
- If the project has data (card pools, tournament results, technique inventories), use it
- "The top 100 meta cards" is better than "common cards"
- "CR 603.3b" is better than "triggers go on the stack"

**2c. Edge Cases and Interactions**
- What are the complex interactions the system must handle?
- What do practitioners get wrong?
- What would break a naive implementation?

**2d. Implementation Relevance**
- What does this mean for the system we're building?
- What data structures does this imply?
- What decisions does this inform?

**Use Agent subagents (`model: "sonnet"`)** for parallel investigation when multiple areas need research.

## Phase 3: Evaluate and Synthesize

**For technology:** Score each option against project-specific criteria. Present recommendation.

**For domain:** Synthesize findings into a coherent reference. Flag gaps where authoritative
sources disagree or are incomplete.

**AskUserQuestion checkpoint:** Present:
- Summary of findings (technology: comparison table; domain: key discoveries)
- Your recommendation or synthesis
- Any surprises or things that contradict assumptions
- Gaps: what couldn't you find authoritative sources for?

## Phase 4: Write Outputs

### 4a. Primer Document

Write to the project's briefs/research directory. **Required: emit standard frontmatter at the top** so `/knowledge-index` regeneration picks it up.

**For technology research:**
```markdown
---
description: {one-line summary — what was researched and key recommendation}
type: brief
research_method: /research
updated: {today's date, YYYY-MM-DD}
---

# Research: {Topic}

## Context
{Why this research was needed}

## Options Evaluated
### {Name} (v{version})
- **Maturity**: {Active/Stable/Deprecated}
- **License**: {license}
- **Pros/Cons**: {list}
- **Fit**: {project-specific}

## Recommendation
{Clear choice with rationale}

## Implementation Notes
{Key API patterns, pitfalls, configuration}

## Code Examples
{Concrete usage patterns}

## Sources
{URLs, doc references}
```

**For domain research:**
```markdown
---
description: {one-line summary of what this brief covers}
type: brief
research_method: /research
updated: {today's date, YYYY-MM-DD}
blocks_phase: {phase number, if this brief gates a specific phase — optional}
---

# Brief: {Topic}

## Purpose
{What this covers and why it matters for the project}

## {Core Sections}
{Rules, specifications, interactions — with citations}

## Implementation Notes
{What this means for the system being built}

## Sources
{Every source consulted — URLs, rule numbers, doc names}
```

### 4b. Reference Skill (for technology research)

Write an auto-loading reference skill at `.claude/skills/{topic-slug}/SKILL.md`:
- Named after the technology (e.g., `hono-v4`, not `research-hono`)
- `user-invocable: false` — auto-loads by keyword match
- Key API patterns, code examples, pitfalls
- Under 200 lines

### 4c. Regenerate Knowledge Index

After writing the brief, **run `/knowledge-index`** to regenerate the index from frontmatter.

Do NOT hand-edit `docs/knowledge-index.yaml` — it's a derived artifact. Frontmatter is the
only source of truth. See `/dev/skills-v2/plugins/research-pipeline/skills/knowledge-index/SKILL.md` for the full schema and
field semantics.

Required frontmatter on the brief:

```yaml
---
description: <one-line "when do I read this?" hook — frame as the question this doc answers>
type: brief
kind: research
research_method: /research
updated: <YYYY-MM-DD>
summary: |
  <1-2 sentences on what's in the brief>
key_findings:
  - <3-7 bullets on what the research showed>
status: draft
---
```

## Anti-Patterns

- **NEVER skip the knowledge index check.** If a brief exists, read it first. Don't duplicate.
- **NEVER trust training data for API shapes.** Verify from current documentation.
- **NEVER recommend without evaluating alternatives** (technology research).
- **NEVER skip the health check** — a superior but abandoned library is a liability.
- **NEVER produce a brief without source citations.** Every claim must be verifiable.
- **NEVER produce generic findings.** Ground everything in this project's specific needs.
- **NEVER skip AskUserQuestion checkpoints.** Wrong research direction wastes effort.
- **NEVER forget to run `/knowledge-index`** after writing the brief. Future sessions depend on the regenerated index.
- **NEVER hand-edit `docs/knowledge-index.yaml`.** It's derived from frontmatter; edits will be overwritten on the next regenerate.

## Completion Criteria

- All research questions answered with evidence
- Domain brief written with source citations
- Reference skill written (technology research only)
- Knowledge index updated
- User confirmed findings at Phase 3 checkpoint
