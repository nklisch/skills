# Knowledge Layer: Overview

> **Cross-project pattern for building a knowledge layer.** Storage-agnostic, language-agnostic, deployment-agnostic.

---

## What This Pattern Is

A **knowledge layer** is the structured meta-knowledge that sits between raw data and the systems (or agents) that consume it. It compiles knowledge once, maintains it over time, and serves it on demand.

Three concerns shape every knowledge layer. These are the three pattern docs:

| Concern | Pattern Doc | What it answers |
|---------|-------------|-----------------|
| **Storage** | [knowledge-storage-pattern.md](knowledge-storage-pattern.md) | How is knowledge laid out, schemed, related, persisted? |
| **Retrieval** | [knowledge-retrieval-pattern.md](knowledge-retrieval-pattern.md) | How do consumers find and read knowledge? |
| **Generation** | [knowledge-generation-pattern.md](knowledge-generation-pattern.md) | How does knowledge enter the system and stay current? |

Each pattern stands alone — adopt one without the others if your project already solves the others. Most projects build storage first, retrieval second, generation third. The pattern docs follow that natural build order.

---

## Foundational Concept: The LLM Wiki Pattern

Both reference implementations adopt **Karpathy's LLM Wiki pattern**: knowledge is **compiled once and maintained**, not re-derived per query.

```
Raw Sources                Compiled Knowledge              Consumers
┌──────────────┐  compile  ┌──────────────────┐  retrieve  ┌──────────────┐
│ External APIs│──────────▶│ Pages with       │◀───────────│ Agents       │
│ Live data    │──────────▶│ frontmatter +    │◀───────────│ Pipelines    │
│ Documents    │──────────▶│ typed cross-refs │◀───────────│ Apps         │
│ Pipelines    │──────────▶│                  │            └──────────────┘
└──────────────┘           └──────────────────┘
                                  │
                            maintained by:
                            • Pipeline refresh
                            • LLM enrichment
                            • Lint checks
```

**Why this beats classic RAG:** Classic RAG chunks raw documents and re-derives answers every query. The LLM Wiki pattern compiles knowledge at write-time. Same retrieval mechanics; higher-quality retrieval target.

**Three operations:**
1. **Ingest** — new data arrives → compile/update affected pages → cross-references updated
2. **Query** — consumer searches → filters → reads compiled pages
3. **Lint** — periodic health checks: staleness, contradictions, drift, broken refs

---

## Decision Tree: Adopting the Pattern

### Should you build a knowledge layer at all?

Yes, if **agents or pipelines need the same compiled knowledge across sessions**, and that knowledge:
- Is too costly to re-derive every session, OR
- Needs to be consistent across multiple agents/sessions, OR
- Has authoritative versions that should not drift, OR
- Has cross-references and structure that matters for queries

No, if knowledge is per-session ephemeral, or already lives well in code/docs.

### Which patterns to adopt first?

| Your situation | Start with |
|----------------|------------|
| Greenfield project, no knowledge yet | Storage → Retrieval → Generation, in order |
| Have docs but no consistent retrieval | Retrieval (over your existing docs as storage) |
| Have data pipelines but no consumer-friendly knowledge | Generation (compile data into knowledge) |
| Have all three but they're inconsistent | Read all three patterns, fix the weakest link |

### What scale are you at?

| Knowledge size | Storage choice | Retrieval choice |
|----------------|----------------|------------------|
| <50 pages | Filesystem + JSON | In-memory filter + substring |
| 50-500 pages | Filesystem or cloud bucket + lightweight index | Metadata filter + keyword search |
| 500-5000 pages | Cloud bucket + indexed DB (BQ, Postgres) | Metadata + full-text + (optional) vector |
| 5000+ pages | Indexed DB + embeddings | Full hybrid + reranking |

The pattern docs cover each tier with explicit triggers for when to graduate.

---

## Universal Design Principles

These hold across all three pattern areas. Treat them as the contract.

### 1. Compile knowledge, don't re-derive

Briefs/pages are the unit. Not chunks, not raw docs. The system invests at write-time so retrieval can be cheap and consistent.

### 2. Schema is the most important artifact

Frontmatter on every page. Typed entities. Namespaced tags. Typed cross-references. The schema is what turns "files in a folder" into a maintainable knowledge layer.

### 3. Metadata-first filtering

Filter by structured metadata before any text/vector search. ~34% accuracy boost (MemPalace research). Free; non-optional.

### 4. Progressive disclosure

Tiered retrieval (L0 identity → L1 catalog → L2 content → L3 deep search). Consumers load only what they need. Front-loading kills context.

### 5. Cross-references are typed

Not just links — links that say *how* two pages relate. This is the foundation of the knowledge graph; without typed cross-refs, no graph.

### 6. Knowledge graph as first-class

Even at small scale, treat the cross-reference graph as a first-class layer. The cost is one frontmatter field; the upside is multi-hop queries, impact analysis, gap detection.

### 7. Maintenance has two axes

`source` (where data comes from) and `production` (how content is produced) are orthogonal. Don't collapse them.

### 8. Reserved fields prevent migrations

Document fields the system doesn't use yet. Authors populate them now; tooling adopts them later. Avoids painful retrofits.

### 9. Lint actively, not passively

Stale, drifted, contradictory, broken-ref pages are the death of knowledge layers. Lint catches them on a schedule.

### 10. Backend portability via contract

The knowledge layer should work with multiple storage backends (filesystem, BQ, Postgres). A single contract (e.g., `KnowledgeEntry`) bridges them. Enables module extractability and cross-project sharing.

---

## Reference Implementations

| Scale | Backend | Example Use Case |
|-------|---------|-----------------|
| Small (tens to hundreds) | GCS (content) + BigQuery (index + edges) | MCP knowledge server — cloud-native, multi-user |
| Medium (hundreds to thousands) | Filesystem (markdown + JSON) + in-memory NetworkX | Local simulation engine — pipeline-generated entity pages |

The same pattern applies at different scales with different storage choices. Typed-relationships and namespaced-tags work at any scale; the search ladder formalizes how retrieval evolves as the corpus grows.

---

## How to Use the Pattern Docs

When adopting on a new project:

1. Read this overview
2. Read the three pattern docs (storage, retrieval, generation)
3. Skim both reference implementations to see how the patterns land in code
4. Write your own `knowledge-store.md` (or equivalent) — your project's instance of the pattern, with your storage/scale/language choices
5. Reference back to the pattern docs from your project's doc

The pattern docs are the abstract; your project's doc is the instance. Don't duplicate the pattern doc content — link to it.
