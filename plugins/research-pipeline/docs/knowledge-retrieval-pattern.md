# Knowledge Layer: Retrieval Pattern

> Cross-project pattern. How consumers find and read knowledge. See [knowledge-layer-overview.md](knowledge-layer-overview.md) for context.

---

## Purpose

Define how agents, pipelines, and apps discover and consume knowledge from the layer. Covers tiered retrieval, metadata-first filtering, the search ladder (v1 → v3), graph traversal, and which RAG paradigms are supported.

---

## Core Concept

**Progressive disclosure beats front-loading.** Don't dump the knowledge base into context. Serve it in tiers, filter by structured metadata, escalate only when needed.

```
Consumer query
       │
       ▼
L0: Already-loaded identity (always in context)
       │
       ▼
L1: Catalog (one-line per match)        ← metadata filter
       │
       ▼
L2: Full page content (on demand)       ← consumer picks one
       │
       ▼
L3: Deep search (when L1 isn't enough)  ← full-text or vector search
```

---

## Tiered Retrieval (L0 - L3)

Inspired by MemPalace's hierarchical memory. Each tier is a different load profile.

### L0: Identity (~50 tokens)

What the knowledge layer *is*. Always in context (system prompt or CLAUDE.md). No retrieval needed.

> "Project X has a knowledge layer with N briefs across modules A, B, C. Query via knowledge/search."

### L1: Catalog (~200-500 tokens per query)

One-line description per matching page. *What exists*, not what it says. Loaded on the first `knowledge/search` call. Metadata filtering happens here.

### L2: Page content (~500-5000 tokens each)

Full markdown body. Loaded on demand when the consumer picks a page from L1.

### L3: Deep search (variable)

Full-text or vector search across page bodies. Only when L1 descriptions don't surface the right page.

**Key principle:** tiers are a *retrieval strategy*, not document tags. The same page can surface at L1 (description matches), L2 (full content read), or L3 (body content matches deep search).

---

## Metadata-First Filtering

**Filter by structured metadata BEFORE any text/vector search.** MemPalace research: 34% accuracy boost over unfiltered semantic search. Free; non-optional.

```
Query: "What do we know about competitor pricing?"
       │
       ▼
Step 1: Metadata filter
       WHERE 'domain:competitive-intel' IN tags
         AND confidence != 'speculative'
       → Narrows from 200 pages to 8
       │
       ▼
Step 2: Text/keyword/vector search on the 8
       → Narrows to 3
       │
       ▼
Step 3: Return ranked results (descriptions only)
       → L1 catalog
       │
       ▼
Step 4: Consumer picks one → reads full body (L2)
```

Metadata filter goes first regardless of which version of the search ladder you're on.

---

## The Search Ladder (v1 → v3)

Designed so each upgrade is **additive**. Same retrieval API across all versions.

### v1: Metadata + Keyword

**How:** Metadata filter via WHERE/predicate + keyword search (substring, BM25, or DB-native full-text).

**Strengths:**
- Zero new infrastructure
- Metadata filter alone covers ~70% of queries
- Keyword handles exact terms (proper nouns, IDs, code snippets)
- Filesystem agent at small scale beats classic RAG (LlamaIndex 2026: 8.4 vs 6.4 correctness)

**Limits:**
- Vague/conceptual queries fail ("strategies that punish greedy clients")
- Keyword misses synonyms

**Good until:** ~500 well-tagged pages.

**Implementation:**
```python
def search(filters: dict, keyword: str | None) -> list[Page]:
    candidates = [p for p in pages if matches(p, filters)]
    if keyword:
        candidates = keyword_match(candidates, keyword)
    return rank(candidates)
```

### v2: + Vector Embeddings

**Trigger:** Vague queries fail. Or corpus >500 pages.

**How:**
1. Embed each page's description + body → vector
2. Store vectors alongside index (DB column or separate file)
3. Query: metadata filter → BM25 score → vector similarity → merge via Reciprocal Rank Fusion (RRF)

**RRF formula:**
```
RRF_score(doc) = Σ 1 / (k + rank_in_list_i)        where k=60
```

Merges BM25 and vector rankings without score normalization.

**Embedding options:**

| Option | Where | Notes |
|--------|-------|-------|
| sentence-transformers + numpy | Local (Python) | ~400MB model, no API |
| OpenAI / Voyage / Cohere | API | Pay per token |
| Vertex AI text-embedding-005 | GCP-native | If you're in the GCP stack |
| Ollama + nomic-embed | Local | Free, private, requires running ollama |
| pgvector / BQ VECTOR_SEARCH | DB-native | Same store, no separate index |

### v3: + Cross-Encoder Reranking

**Trigger:** Corpus >500 AND retrieval precision affects high-stakes decisions.

**How:** v2 → top 20 candidates → cross-encoder reranks → top 5.

**Why a cross-encoder:** Bi-encoders (v2 embeddings) compare query and doc independently. Cross-encoders score (query, doc) as a pair — much more accurate, too slow for full corpus, runs only on the funnel.

**Options:**
- `cross-encoder/ms-marco-MiniLM-L-6-v2` — local, sentence-transformers
- Cohere Rerank API — best-in-class, paid
- BGE-reranker — open source, competitive

### What Doesn't Change Across Versions

- The retrieval API (input/output shape)
- The metadata filter step (always first)
- The frontmatter schema
- The L0-L3 tier model

This is the **additive upgrade contract**. New search paths layer on; existing ones don't move.

---

## Graph Traversal Queries

For multi-hop questions, the [knowledge graph](knowledge-storage-pattern.md#knowledge-graph-first-class) is the right tool — not search.

| Query | Mechanism |
|-------|-----------|
| "All pages about pricing" | **Search** — tag filter |
| "Pages related to X within 2 hops" | **Graph** — recursive traversal |
| "If we mark X stale, what becomes stale?" | **Graph** — reverse traversal |
| "Which pages are knowledge hubs?" | **Graph** — in-degree query |
| "Find missing pages referenced but not existing" | **Graph** — `to_slug` not in pages |

Search returns single-hop relationships (pages include their `related[]`). Multi-hop and graph algorithms are exposed as a separate tool/endpoint (`knowledge/graph` or equivalent).

---

## Retrieval API Surface

Two consumer-facing tools cover most needs.

### `knowledge/search`

**Input:** All filter fields optional. No filters = return full L1 catalog.
```json
{
  "module": "...",
  "content_type": "...",
  "tags": [...],
  "audience": "...",
  "confidence": "...",
  "updated_after": "...",
  "keyword": "...",
  "semantic_query": "...",
  "include_related": true,
  "limit": 10
}
```

**Output:** Metadata + descriptions only. Consumer reads full content via a separate page-fetch endpoint (e.g., `knowledge/{slug}`).

### `knowledge/graph`

**Input:**
```json
{
  "from": "<slug>",
  "direction": "outgoing | incoming | both",
  "hops": 1-3,
  "relationship_filter": [...]
}
```

**Output:** Subgraph of nodes + edges within N hops, plus metadata for each node.

---

## Retrieval Paradigm Support

How the pattern maps to the major RAG paradigms.

### In v1 by default

- **Hybrid RAG** — the search ladder *is* hybrid RAG (metadata + keyword now; +vector +rerank as you climb)
- **Agentic RAG** — L1→L2→L3 progressive disclosure is iterative retrieval; agent decides depth
- **Compiled retrieval (LLM Wiki)** — pages are compiled knowledge, not chunked raw docs. Strictly higher quality than classic RAG with same retrieval mechanics.

### Coming with the graph

- **Graph RAG** (Microsoft pattern) — multi-hop traversal during retrieval. Edges + traversal exposed via `knowledge/graph`.

### Natural extensions (design hooks ready)

- **Corrective RAG (CRAG) / Self-RAG** — agent reflects on retrieval quality, re-retrieves. Tool returns confidence; agent loops. No new infrastructure.
- **Query expansion** — rewrite one query into N, search each, merge via RRF. Layers on top.
- **Temporal retrieval** — "what was true on date X" — leverages reserved `valid_from`/`valid_until` fields. Just a filter.
- **Federated retrieval** — query across projects via shared contract. Reserved `origin_project` field is the hook.
- **Active/push retrieval** — assistant-initiated ("you mentioned X, here's what we know"). Trigger layer above search.
- **NL → structured query** — text2SQL/text2filter for the index. Small agent that turns natural language into a structured search call.
- **Semantic caching** — cache (query → results) for semantically similar queries. Latency + cost win.

### Considered and explicitly skipped

- **HyDE (Hypothetical Document Embeddings)** — generate a hypothetical answer, embed it, retrieve against it. Works for classic RAG; *conflicts with LLM Wiki spirit* because it re-derives instead of retrieving compiled knowledge.
- **Pure vector search (no metadata)** — 34% accuracy worse than metadata-first. The baseline we beat.
- **Chunking source docs** — incompatible with compiled-knowledge philosophy. Pages are the unit.

---

## Anti-Patterns

- **Returning full content from search.** Search returns descriptions; consumer reads full content explicitly. Otherwise progressive disclosure is gone.
- **Skipping the metadata filter.** 34% accuracy on the table.
- **Front-loading the entire knowledge base.** Context rot kills you past ~100K tokens.
- **One search backend forever.** Design the additive upgrade path from v1.
- **Mixing search and graph.** Search returns ranked candidates; graph traverses relationships. Different tools.
- **Vector-only retrieval at small scale.** Filesystem agent at <500 pages beats RAG (LlamaIndex 2026).
- **Cross-encoder on every query.** Funnel: metadata → BM25+vector → cross-encoder on top 20 only.

---

## Implementation Sketch (v1, language-agnostic)

```
search(filters, keyword=None) -> list[result]:
    candidates = pages
    for field, value in filters.items():
        candidates = [p for p in candidates if p.matches(field, value)]
    if keyword:
        candidates = [p for p in candidates if matches_keyword(p, keyword)]
    return [page_to_result(p) for p in rank(candidates, by="updated_at")][:limit]

graph(from_slug, direction, hops, relationship_filter=None) -> Subgraph:
    edges = traverse(from_slug, direction, hops)
    if relationship_filter:
        edges = [e for e in edges if e.relationship in relationship_filter]
    nodes = {e.from_slug for e in edges} | {e.to_slug for e in edges}
    return Subgraph(nodes=hydrate(nodes), edges=edges)
```

---

## Scaling Reference

| Scale | Typical Backend | Search Ladder Stage |
|-------|-----------------|---------------------|
| **Small** (<100 pages) | In-memory index (Python/TS), JSON file on disk | v1 — metadata + keyword |
| **Medium** (100-500 pages) | Database with full-text search (e.g., BigQuery SEARCH(), Postgres tsvector) | v1 — metadata + keyword |
| **Large** (500-5000 pages) | DB-native vector search (e.g., pgvector, BQ VECTOR_SEARCH) + BM25, merged via RRF | v2 — + vector embeddings |
| **Very large** (5000+ pages, high-stakes) | v2 stack + cross-encoder reranker on top-N candidates | v3 — + cross-encoder reranking |
