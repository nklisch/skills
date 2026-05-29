---
description: "North star for the knowledge-edge creator — proactive gap discovery in knowledge bases using embeddings, clustering, and external taxonomy"
type: north-star
updated: 2026-04-14
---

# North Star: Knowledge-Edge Creator

*Last updated: 2026-04-14*

## Vision

A skill that analyzes a project's knowledge base to proactively discover what's missing. It uses two mechanisms — internal analysis (embeddings, clustering, graph topology) and external taxonomy (Wikipedia/Wikidata categories) — to find topics the knowledge base should cover but doesn't yet know it doesn't know. Gaps are materialized as stub pages, which serve as the canonical representation of research recommendations. The result: a self-expanding knowledge system where filling gaps leads to discovering new gaps at the new boundary.

## Problem

The knowledge layer patterns already detect *known* gaps — broken cross-references, orphaned pages, manually created stubs. But the most valuable gaps are the *unknown unknowns* — topics the knowledge base should cover but nobody has thought to flag.

Currently, research planning depends on human judgment: "what should we investigate next?" This works for small knowledge bases but doesn't scale. As knowledge grows, the boundary of what you know expands, and the surface area of what you *should* know but don't grows with it. Without a systematic way to discover these gaps, knowledge bases develop blind spots that compound over time.

The edge creator turns research planning from a human guessing game into a data-driven prioritization system.

## Principles

### 1. Stubs are the canonical gap
Every discovered gap becomes a stub page in the knowledge layer (`status: stub`). Research recommendations are a view of unfilled stubs — not a separate list. One source of truth. When research fills a stub, it gets promoted to `draft` then `published`. No dual maintenance.

### 2. Two mechanisms, one output
Internal analysis (what does the shape of our knowledge suggest is missing?) and external taxonomy (what does the structure of all knowledge say should be adjacent?) both produce gap candidates. They reinforce each other — a gap flagged by both mechanisms is higher priority than one flagged by either alone.

### 3. Ranked, not flat
Not all gaps are equal. Priority signals:
- **Connectivity** — how many existing briefs reference or imply this topic?
- **Centrality** — how close is this to the project's core domain model?
- **Frequency** — does this topic keep appearing in existing briefs without its own coverage?
- **External importance** — does the taxonomy treat this as a major topic in the domain?
- **Cluster distance** — how close is this to dense areas of existing knowledge?

### 4. Self-expanding flywheel
Gaps found → stubs created → research fills stubs → new briefs shift the boundary → new gaps discovered. The knowledge base grows systematically, not just when someone thinks to ask. Each cycle starts from a higher baseline.

### 5. Reuse existing infrastructure
Embeddings from the retrieval pattern's v2. Graph from typed cross-references. Lint schedule for periodic runs. The edge creator analyzes existing infrastructure rather than building parallel systems.

### 6. Portable across knowledge-bearing projects
The mechanism (embed, cluster, compare to taxonomy, find gaps) works for any project with a knowledge layer.

## Domain Model

### Gap
A topic the knowledge base should cover but doesn't. Discovered by internal analysis, external taxonomy, or both. Materialized as a stub page in the knowledge layer.

### Stub
A page in the knowledge layer with `status: stub`. The canonical representation of a gap. Contains metadata about why it's a gap: discovery source (internal/external/both), priority score, adjacent briefs, and the reasoning for why this topic matters.

### Internal Analysis
Embedding existing briefs, clustering them, and analyzing the topology for:
- Sparse areas between clusters (missing bridging knowledge)
- Dense clusters with thin subtopic coverage (depth gaps)
- Outlier briefs far from any cluster (orphaned knowledge or seeds of new clusters)
- Entities/concepts mentioned within briefs that lack their own coverage

### External Taxonomy
Structured knowledge sources used to determine what topics are adjacent to existing knowledge:
- Wikipedia category structure
- Wikidata entity relationships
- Domain-specific ontologies (where available)
The external taxonomy provides the "map of all knowledge" against which the knowledge base's coverage is measured.

### Priority Score
A composite ranking of a gap's importance, derived from multiple signals: connectivity, centrality to domain model, frequency of implicit reference, external importance in taxonomy, and cluster distance. Used to rank stubs for research planning.

### Edge Run
A single execution of the edge creator. Produces a set of new stubs and updates priority scores on existing stubs. Can be:
- **On-demand** — user calls `/knowledge-edge`
- **Periodic** — runs alongside lint/refresh on a schedule
- **Triggered** — called by `/ideate` to inform research planning

## Research Plan

Domains that need `/research` before `/architecture`.

- [ ] **Text embeddings + clustering for gap analysis** — How to embed document-level briefs, cluster them, and detect gaps in a 50-500 document knowledge base. What models, what clustering approaches, how to identify sparse areas and score adjacency. *(source: domain analysis)*
- [ ] **Wikipedia/Wikidata as external taxonomy** — How Wikipedia's category structure is organized, what APIs exist for traversal, how to map between our topics and Wikipedia's category graph. Also: Wikidata, DBpedia, and domain-specific ontologies as alternative/complementary sources. *(source: domain analysis)*
- [ ] **Knowledge graph completion techniques** — defer to implementation brief. Graph analysis techniques for detecting missing nodes/edges in typed knowledge graphs. *(source: domain analysis — lower priority, builds on existing infrastructure)*

## Related Documents

| Document | Purpose |
|----------|---------|
| [Knowledge Layer Overview](knowledge-layer-overview.md) | The pattern this builds on — storage, retrieval, generation |
| [Knowledge Generation Pattern](knowledge-generation-pattern.md) | Stubs, lint, refresh cycles — infrastructure the edge creator reuses |
| [Knowledge Storage Pattern](knowledge-storage-pattern.md) | Frontmatter schema, typed cross-references, knowledge graph |
| [First-Principles Primer](first-principles.md) | Thinking methodology |
| [Scout North Star](scout-north-star.md) | Sibling capability — scout looks outward, edge creator looks inward |
| Architecture (pending) | How the edge creator is structured |
