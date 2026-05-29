---
description: "Architecture for the scout skill — workflow phases, search vector generation, assessment format, landscape brief structure, integration with /ideate and /expand"
type: architecture
updated: 2026-04-14
---

# Architecture: Scout

*Last updated: 2026-04-14*

> How the skill is structured and integrated. For *what* and *why*, see [North Star](scout-north-star.md).

## System Overview

Scout is a standalone skill (`/scout`) that also gets auto-called during `/ideate` and optionally during `/expand`. It produces a landscape brief and research recommendations.

```
Callers                          Scout                           Output
┌──────────┐                ┌──────────────────┐           ┌──────────────────┐
│ /ideate  │──auto-calls──▶│                  │──writes──▶│ scout-           │
│  (between│  (always)      │  /scout          │           │ landscape.md     │
│  Ph1-Ph2)│                │                  │           │ (standalone doc)  │
├──────────┤                │  6 phases:       │           ├──────────────────┤
│ /expand  │──optionally──▶│  1. Load context  │──feeds──▶│ Research         │
│  (when   │   calls        │  2. Gen vectors   │           │ recommendations  │
│  scope   │                │  3. Discover      │           │ → north star     │
│  changes)│                │  4. Filter + rank │           │   research plan  │
├──────────┤                │  5. Assess top    │           │ → or direct to   │
│ user     │──directly────▶│  6. Write output  │           │   user           │
│ /scout   │                │                  │           └──────────────────┘
└──────────┘                └──────────────────┘
                                    │
                            Uses: WebSearch, WebFetch,
                            Agent subagents (parallel)
```

## Skill Workflow

### Phase 1: Load Context

Read whatever exists to understand what we're scouting for:

1. **North star** (if it exists) — extract key concepts, technologies, problem statement
2. **Skill arguments** — user-provided topic or search directions
3. **Knowledge index** — check for existing landscape docs (don't duplicate work)
4. **CLAUDE.md / project docs** — understand the project's domain and stack

**When called from `/ideate`:** Receives the discovery summary (idea description, problem, constraints) since the north star isn't written yet.

**When called standalone:** Requires either a north star path or a topic argument.

### Phase 2: Generate Search Vectors

Generate 8-12 search vectors across three types:

**Direct vectors** — straight from the project description:
- Key technologies mentioned ("MCP servers," "BLE protocol")
- The core problem being solved ("game simulation engine," "data platform")
- Named systems or tools the project builds on

**Adjacent vectors** — neighboring fields or approaches:
- Related problem domains (card game engine → board game AI, tabletop simulators)
- Alternative technical approaches (REST API → GraphQL, gRPC alternatives)
- Upstream/downstream systems (data pipeline → orchestration tools, monitoring approaches)

**Analogous vectors** — same problem in different domains:
- The abstract problem applied elsewhere (recommendation system → how does Spotify discover music? how does Amazon suggest products?)
- Structural analogues (knowledge graph → how do taxonomies work in biology? how does Wikipedia structure relationships?)

**Adjacent and analogous vectors are where scout earns its value.** Direct vectors find what the user would have found anyway. Adjacent and analogous vectors surface unexpected connections and approaches.

**AskUserQuestion checkpoint:** Present the vectors organized by type. Ask:
- "Are these the right directions? Any areas I should add or skip?"
- "Any specific projects or approaches you already know about that I should include?"

### Phase 3: Discover

Execute broad search across multiple source types. Use **Agent subagents for parallel search** — fan out across vectors, then reconverge.

**Source types and what each reveals:**

| Source | What it reveals | How to search |
|--------|----------------|---------------|
| **GitHub repos** | Implementation choices, tech stacks, code quality, project health | WebSearch "site:github.com {vector}", then WebFetch for README/about |
| **Blog posts / articles** | Lessons learned, architectural decisions, post-mortems | WebSearch "{vector} tutorial/guide/lessons/architecture" |
| **Hacker News** | Community opinion, critiques, alternative approaches, hidden gems in comments | WebSearch "site:news.ycombinator.com {vector}" |
| **Academic papers** | Formal approaches, theoretical foundations, benchmarks | WebSearch "{vector} paper/research/arxiv" |
| **Existing knowledge bases** | Structured domain knowledge, taxonomies | WebSearch "{vector} wiki/documentation/reference" |

**Discovery guidelines:**
- Cast a wide net — it's easier to filter later than to re-search
- Follow leads — if a finding mentions another project or approach, follow it
- Note source type for each finding — different types serve different purposes in the landscape
- Don't go deep yet — save depth for the assessment phase

### Phase 4: Filter and Rank

From all findings, determine relevance and select top finds for assessment.

**Relevance criteria:**
- Does this relate to the problem we're solving?
- Does this use an approach we might learn from (even if the domain differs)?
- Is this active/maintained (for repos)?
- Does this reveal a pattern, lesson, or trade-off we should know about?

**Select top 5-7 findings** for full assessment. These should be the most relevant, highest-signal finds — not necessarily the most popular.

**Brief-mention the rest** — anything relevant enough to note but not worth a full assessment. One sentence each: what it is and why it's here.

### Phase 5: Assess Top Finds

For each top finding, produce a structured assessment:

```markdown
### [Project/Article Name](url)
**What they built:** One-sentence description
**Approach:** Key technical/architectural choices
**Stack:** Languages, frameworks, key libraries (for repos)
**Health:** Active/maintained/abandoned + evidence (for repos)
**Lessons:** What worked well, what they struggled with, notable decisions
**Relevance:** Specific takeaways for our project — what can we adopt, avoid, or investigate
```

For non-repo findings (blog posts, papers, discussions), adapt the format:
- Skip health/stack fields
- Focus on the insight or lesson
- Note the credibility of the source

**AskUserQuestion checkpoint:** Present the landscape summary:
- Top finds with assessments
- Brief mentions grouped by theme
- Initial research recommendations
- Any surprising findings or gaps

Ask: "Does this landscape look right? Any finds I should dig deeper on? Any directions I missed?"

### Phase 6: Write Output

**6a. Landscape Brief**

Write to the project's docs directory as a standalone document.

```markdown
---
description: "Scout landscape for {project} — prior art, adjacent approaches, lessons learned"
type: landscape
updated: {date}
---

# Scout Landscape: {Project Name}

*Scouted: {date}*

## Context
{What we were looking for and why. Reference to north star or idea description.}

## Search Vectors
**Direct:** {list}
**Adjacent:** {list}
**Analogous:** {list}

## Landscape

### {Theme/Approach A}
{Brief description of this approach category}

#### [Top Find Name](url) — assessed
{Full assessment from Phase 5}

#### [Other Find](url)
{One-sentence mention}

### {Theme/Approach B}
...

## Research Recommendations

Domains identified for `/research`, informed by this landscape:

- **{Domain}** — {what to investigate and why, grounded in specific findings}
- **{Domain}** — {what to investigate and why}

## Gaps

{What scout looked for but didn't find. Absence of prior art is signal too — 
it means either uncharted territory or a search gap worth revisiting.}

## Sources
{All URLs consulted during scouting}
```

**6b. Research Recommendations Handoff**

- **When called from `/ideate`:** Research recommendations merge into the north star's Research Plan section. Scout presents them to `/ideate` which incorporates them during Phase 2 (Domain Identification).
- **When called from `/expand`:** Research recommendations are presented to the user with context about how they relate to the scope expansion.
- **When called standalone:** Research recommendations are presented directly to the user.

**6c. Update Knowledge Index**

```yaml
  - path: <path to landscape brief>
    title: "Scout Landscape: {Project Name}"
    type: landscape
    description: <one-line summary>
    updated: <today's date>
```

## Integration with Consumer Skills

### /ideate Integration

`/ideate` auto-calls `/scout` between Phase 1 (Discovery) and Phase 2 (Domain Identification):

```
/ideate workflow:
  Phase 1: Discovery (understand the idea)
       ↓
  /scout runs (receives idea description from Phase 1)
       ↓
  Phase 2: Domain Identification (merges scout's recommendations
           with its own domain analysis)
       ↓
  Phase 3: Refinement (landscape informs principles and domain model)
       ↓
  Phase 4: Write North Star (research plan includes scout's recommendations)
```

Changes to `/ideate` SKILL.md:
- Add a step between Phase 1 and Phase 2: "Run `/scout` with the discovery summary. Scout will produce a landscape brief and research recommendations."
- Phase 2 opens with: "Review scout's landscape and research recommendations. Merge with your own domain identification."
- The north star's Research Plan section includes scout-identified domains.

### /expand Integration

`/expand` optionally triggers `/scout` when scope changes might benefit from landscape awareness:

- When adding a new subsystem that touches unfamiliar domains
- When the expansion introduces new technology or integration points
- The trigger should be suggested by `/expand`, not automatic — scope expansions vary in how much they change the landscape

Changes to `/expand` SKILL.md:
- After scoping the expansion, suggest: "This expansion touches {new domains}. Consider running `/scout` to check for prior art in these areas before proceeding."

### Standalone Usage

```
/scout                          → prompts for topic/context
/scout "knowledge graph tools"  → uses argument as starting point
/scout --north-star docs/north-star.md → reads existing north star
```

## Conventions

### Tone
The landscape brief should be practical and opinionated. "This project is relevant because..." not "This project exists." Assessments should state what we can learn, not just describe.

### Naming
- Landscape briefs: `scout-landscape-{project}.md` or `scout-landscape.md` if there's only one
- Placed in the project's docs directory alongside other briefs

### Frontmatter
```yaml
description: "Scout landscape for {project} — prior art, adjacent approaches, lessons learned"
type: landscape
updated: {date}
```

## Dependencies

| Dependency | Purpose | Notes |
|------------|---------|-------|
| WebSearch | Broad discovery across source types | Already available |
| WebFetch | Deeper inspection of promising finds | Already available |
| Agent subagents | Parallel search across vectors | Already available |
| `/ideate` SKILL.md | Integration point — auto-call scout | One-time edit |
| `/expand` SKILL.md | Integration point — optional scout trigger | One-time edit |
| Knowledge index | Landscape brief indexing | Existing infrastructure |

No external dependencies. No code. No runtime requirements beyond the tools already available to skills.

## What's Deferred

- **Knowledge domain grouping for source selection.** When the search space becomes vast, sources should be grouped into selectable knowledge domains. Not needed for v1.
- **Formal adjacency algorithms.** v1 uses agent judgment + user direction for adjacency. Shared adjacency infrastructure with knowledge-edge creator is a future concern.
- **Re-scouting triggers.** Detecting when a landscape is stale and should be refreshed. For now, user judgment.
- **Automated health monitoring.** Checking if scouted repos have changed status since last scout. Future capability.

## Open Questions

- **Optimal vector count.** 8-12 is the current target. May need tuning after real-world usage — some projects need more breadth, some less.
- **Landscape staleness.** How long is a landscape brief useful? Probably project-dependent. No automated expiration for v1.

## Related Documents

| Document | Purpose |
|----------|---------|
| [North Star](scout-north-star.md) | Vision, principles, domain model |
| [Build Process](build-process.md) | The pipeline scout integrates into |
| [First-Principles Primer](first-principles.md) | Thinking methodology scout should apply |
