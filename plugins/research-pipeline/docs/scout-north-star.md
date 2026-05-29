---
description: "North star for the scout skill — breadth-first prior art discovery that maps the landscape of adjacent work and feeds research planning"
type: north-star
updated: 2026-04-14
---

# North Star: Scout

*Last updated: 2026-04-14*

## Vision

A skill for breadth-first prior art discovery that maps the landscape of adjacent work — projects, approaches, patterns, and lessons — so that ideation is informed by what exists, research is directed at the right domains, and architecture decisions benefit from others' experience.

## Problem

The build process has no systematic way to ask "what else exists in this space?" `/ideate` defines the project. `/research` goes deep on specific domains. But neither scans broadly for prior art — adjacent projects, alternative approaches, patterns that worked or failed, lessons from others who solved similar problems.

Without this scan, projects are defined in a vacuum. Research planning is based on what the user and agent think to investigate, not on awareness of the full landscape. Architecture decisions miss patterns that others discovered. The result: reinvented wheels, missed opportunities, and research plans with blind spots.

## Principles

### 1. Breadth before depth
Scout's job is to map the landscape, not to deeply understand any one thing. Surface many relevant finds rather than exhaustively analyzing a few. Depth is `/research`'s job.

### 2. Actionable output
Every finding should answer: what did they build, what approach did they take, what can we learn? Findings that don't inform our decisions are noise. The landscape brief is a reference document, not a link dump.

### 3. Clean handoff to research
Scout's landscape directly feeds `/research` planning. Research recommendations merge into the north star's research plan. The output should make it obvious what domains are worth investigating deeply.

### 4. Multiple source types
GitHub repos, blog posts, HN discussions, papers, existing knowledge bases. Different sources reveal different things — repos show implementation choices, blogs show lessons learned, papers show formal approaches. No single source type is sufficient.

### 5. User-guided and inferred
Adjacency comes from both user-provided search directions and scout's own inference from the north star or project context. Neither alone is sufficient. User direction prevents missed angles; inference prevents narrow search.

### 6. Evaluate, don't just list
Top finds get mini-assessments: tech stack, project health, what worked, what failed, relevance to our project. A raw list of links is not a landscape.

### 7. Always run during ideation
`/ideate` should always call `/scout`. Knowing what exists before defining a project is never wasted effort. Even finding nothing is valuable — it confirms uncharted territory.

## Domain Model

### Search Vector
A specific direction to search in, derived from the north star, project context, or user input. Examples: "game simulation engines," "IoT sensor projects," "MCP server implementations." Scout generates multiple vectors to ensure breadth.

### Finding
A single piece of prior art discovered during scouting. Could be a GitHub repo, blog post, paper, HN discussion, or entry in a knowledge base. Each finding has a source type, a relevance assessment, and a brief description.

### Assessment
A deeper evaluation of a top finding's relevance and quality. Includes: what they built, tech stack, project health (active/abandoned), what worked, what failed, and relevance to our project. Only the most relevant findings get full assessments.

### Landscape
The synthesized output document (`scout-landscape.md`). All findings organized by approach or theme, with full assessments for top finds and brief mentions for the rest. A standalone reference document indexed in the knowledge index.

### Research Recommendation
A specific domain identified from the landscape that warrants a `/research` deep dive, with rationale. Research recommendations merge into the north star's research plan when scout is called from `/ideate`. When called standalone, they're presented to the user directly.

## Research Plan

No formal `/research` needed before building. The domains scout touches (search, evaluation, adjacency) are well-understood enough to design from. The real complexity is in the skill's prompt design — how it generates search vectors, filters for relevance, and structures output.

## Related Documents

| Document | Purpose |
|----------|---------|
| [First-Principles Primer](first-principles.md) | Thinking methodology scout should apply during discovery |
| [Build Process](build-process.md) | The pipeline scout integrates into |
| [First-Principles North Star](first-principles-north-star.md) | Sibling project in the thinking layer |
| Architecture (pending) | How scout is structured and integrated |
