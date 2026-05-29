# Knowledge Layer: Storage Pattern

> Cross-project pattern. How knowledge is laid out, schemed, related, and persisted. See [knowledge-layer-overview.md](knowledge-layer-overview.md) for context.

---

## Purpose

Define the shape of compiled knowledge: file structure, frontmatter schema, typed entities, tag taxonomy, typed cross-references, the knowledge graph, and storage backends. Storage decisions are sticky — get this right early.

---

## Core Concept

Compiled knowledge pages with **structured frontmatter**, organized for **filtering**, **graph traversal**, and **extractability**. Backend-agnostic via a contract.

```
Knowledge page
├── Frontmatter (YAML)
│   ├── Identity (slug, type, name)
│   ├── Filtering (namespaced tags, audience, confidence)
│   ├── Maintenance (source, production, updated, content_hash)
│   ├── Cross-references (typed `related[]`)
│   ├── Provenance (research_method)
│   └── Reserved fields (future-proofing)
└── Body (markdown)
    ├── Overview
    ├── Key Details
    └── (type-specific sections)
```

---

## Universal Frontmatter Schema

Every page has these fields. Each is filterable, indexable, lint-checkable.

| Group | Fields | Required |
|-------|--------|----------|
| **Identity** | `description`, `slug`, `module`, `content_type`, `name?` | description, slug, module, content_type |
| **Filtering** | `tags[]`, `audience[]`, `confidence` | tags (namespaced), confidence |
| **Maintenance** | `source`, `production`, `updated`, `content_hash` | All four |
| **Cross-references** | `related[]` (typed) | Optional but encouraged |
| **Provenance** | `research_method` | Optional but recommended |
| **Type-specific** | Driven by `content_type` | Per type |
| **Reserved** | See "Reserved Fields" | Optional |

`content_hash` is auto-computed by the sync pipeline. Everything else is authored.

### Provenance: `research_method`

Records *which tool produced this page*. Distinct from `production` (which captures *how content is generated and refreshed* — hand-written vs. template-generated vs. LLM-enriched). `research_method` captures origin authorship; `production` captures ongoing maintenance shape.

Closed vocabulary:

| Value | Meaning |
|-------|---------|
| `/brief` | Produced by the `/brief` skill |
| `/research` | Produced by the `/research` skill |
| `/deep-research` | Produced by `/deep-research` (chain-mode children also use this — chain linkage uses `related: extends`) |
| `/research-program` | Produced by `/research-program` (program-level docs and per-campaign outputs) |
| `hand-written` | Authored manually, no skill |
| `migrated` | Origin tool unknown — backfilled retroactively |

The four research skills stamp this field automatically on every output. `/doc-review` flags missing values on knowledge content_types and surfaces refresh candidates — pages produced by a lower-tier tool whose `updated` predates the most recent higher-tier run. Each tooling level-up makes older briefs implicitly deprecated; the field collapses that audit into a single query.

---

## Typed Entity Schemas (`content_type`-driven)

`content_type` declares additional type-specific frontmatter. The universal schema is the floor; types extend it.

Examples showing how different projects extend the universal schema:

| content_type | Adds |
|--------------|------|
| `brief` | (universal only) |
| `history` | `parent_slug`, `change_log[]` |
| `technique` | `inputs[]`, `outputs[]`, `assumptions[]` |
| `entity-profile` | `strategy`, `goal_state`, `recipe_lines[]`, dimensional profile |
| `recipe` | `components[]`, `total_cost`, `speed`, `pieces`, `risks[]` |
| `character` | `traits[]`, `role`, `profiles[]`, `dimensions{}` |

**Validation:** sync pipeline rejects pages declaring a `content_type` but missing required type-specific fields. Add new content types by extending the schema doc + a small validator.

**When to add a content_type:**
- A new entity has a fundamentally different shape (recipe vs component)
- Type-specific queries matter (filter all recipes by speed)
- Different validation rules apply

**When NOT to:**
- A new tag would suffice (a sub-category of an existing type)
- The fields would be optional/sparse (just add reserved fields to the universal schema)

---

## Tag Taxonomy: Namespaced

Freeform tags drift. **Every tag has a namespace.**

### Namespace pattern: `<namespace>:<value>`

| Namespace | Examples |
|-----------|----------|
| `domain:` | `domain:competitive-intel`, `domain:product` |
| `topic:` | `topic:pricing`, `topic:roadmap` |
| `entity:` | `entity:acme-corp`, `entity:widget-co` |
| `category:` | `category:data-pipeline`, `category:batch-job` |
| `type:` | `type:batch`, `type:streaming` |
| `risk:` | `risk:timeout`, `risk:data-loss` |

### Rules

1. **Authoritative registry.** The list of valid namespaces lives in the project's knowledge-store doc. Adding a namespace is an architectural decision.
2. **Don't tag what's a field.** `content_type`, `audience`, `confidence`, etc. are first-class fields — not tags.
3. **Lint enforces.** Untagged-namespace tags or unknown namespaces are warnings.

### Why namespaces

- Faceted filtering (`tags ∋ domain:* AND tags ∋ topic:*`)
- Prevents tag explosion (`competitor` and `competitors` and `competitor-info` collapse to `domain:competitive-intel`)
- Enables tag taxonomy validation in lint

---

## Typed Cross-References

Cross-references are **typed** — links that declare *how* two pages relate. This is the foundation of the knowledge graph.

```yaml
related:
  - slug: acme-corp-history
    relationship: history-of
  - slug: market-overview
    relationship: contextualizes
```

### Relationship Vocabulary

Each project defines its own closed vocabulary. Common relationships:

| Relationship | Meaning |
|--------------|---------|
| `uses` / `used-by` | A depends on B's content |
| `history-of` | A is a change log of B |
| `variant-of` | A is a variation of B |
| `enables` | A makes B possible |
| `competes-with` | A and B address the same need differently |
| `contextualizes` | A provides context for B |
| `applied-to` | A is a method, B is where it's applied |
| `supersedes` | A replaces B |

### Authoring Rules

- **Outgoing only.** A declares its outgoing relationships. Inverses (`used-by`) are computed.
- **Frontmatter, not body.** Body prose describes; frontmatter declares.
- **Closed vocabulary.** Lint warns on unknown relationships. Add new ones via schema doc, not ad hoc.

---

## Knowledge Graph: First-Class

Cross-references in `related[]` form a typed directed graph. **Treat it as first-class from v1.** The cost is one frontmatter field; the upside is multi-hop queries, impact analysis, gap detection.

### Why First-Class

Tags answer "all pages about X" (filter). The graph answers:

- **Multi-hop:** "What depends on this page, 2 hops out?"
- **Reverse traversal:** "If we update X, who needs to be notified?"
- **Impact analysis:** "What becomes stale if we mark Y as outdated?"
- **Discovery:** "Which pages are knowledge hubs (high in-degree)?"
- **Gap detection:** "Which `related[]` references point to non-existent pages?"

### Implementation Options (graduate as you scale)

| Stage | Backend | Library / Mechanism | Scale |
|-------|---------|---------------------|-------|
| **v1: minimal** | Derived in-memory from frontmatter on startup | NetworkX (Python) or graphology (TS) | <5K nodes, <20K edges |
| **v2: indexed** | Edges table in your relational/columnar DB | Postgres / BigQuery + recursive CTE | <50K nodes, <500K edges |
| **v3: native graph** | Embedded graph DB | Kuzu (SQLite-for-graphs) | <5M nodes |
| **v4: graph server** | Full graph DB | Neo4j, Memgraph | Whatever |

The frontmatter format is stable across all stages — only the query layer changes.

### Scale Examples

- **Local project (<1K pages):** v1 in-memory NetworkX, rebuilt from markdown frontmatter on startup. No infra needed.
- **Cloud-native server (1K–50K pages):** v2 relational edges table + recursive CTE. Optional graphology cache for sub-ms traversal. Server stays stateless.

Same conceptual graph, different backends.

---

## Storage Backend Options

| Backend | Best for | Trade-offs |
|---------|----------|------------|
| **Filesystem** | Local tools, single-user, small scale (<500 pages) | No persistence sync; no concurrent writes; rebuild on every restart |
| **Object storage (S3, GCS)** | Cloud servers, multi-instance, content versioning | Need a separate index for query; eventual consistency |
| **Relational DB (Postgres, SQLite)** | Mid-scale, full SQL queries, transactions | Frontmatter parsing happens in app; full-text via DB-specific extensions |
| **Columnar DB (BigQuery, Snowflake)** | Cloud-native, large scale, full-text + vector + analytics | Higher latency, eventual consistency, cost per scan |
| **Vector DB (Chroma, Pinecone, pgvector)** | Vector-first retrieval | Add-on to a primary store, not a primary store itself |

**Common pattern: two-layer storage.**
- **Content layer** (filesystem or object storage) — source of truth for page content
- **Index layer** (DB) — derived, for fast queries

The content layer is human-readable, versioned, can be edited directly. The index is rebuildable from the content layer at any time.

---

## Backend Portability: The Contract

A single contract (e.g., `KnowledgeEntry` interface) bridges multiple backends. Same shape regardless of where storage actually lives.

```typescript
interface KnowledgeEntry {
  slug: string;
  module: string;
  content_type: string;
  description: string;
  tags: string[];
  audience?: string[];
  confidence?: string;
  source?: string;
  production?: string;
  updated_at: string;
  related?: { slug: string; relationship: string }[];
  storage: { type: string; path: string };
  metadata?: Record<string, unknown>;
}
```

### What This Enables

- **Module extractability.** A module bundled standalone can ship with its own knowledge using the same contract — backend swaps from server DB to in-memory.
- **Cross-project federation.** Project A reads project B's knowledge if both speak the same contract.
- **Backend graduation.** Filesystem → Postgres → BQ without changing module code.

---

## Reserved Fields (Future Extensions)

Document fields the system doesn't use yet. Authors populate them now; tooling adopts them later. Avoids migrations.

| Field | Future capability |
|-------|-------------------|
| `sources: [{url, accessed_at, excerpt}]` | Per-fact provenance citation |
| `valid_from`, `valid_until` | Temporal validity ("what was true on date X") |
| `supersedes: <slug>` | Supersession chains |
| `confidence_decay: weekly\|monthly\|stable` | Auto-decay confidence over time |
| `access: [internal\|partners\|public]` | Audience access control |
| `status: stub\|draft\|published` | Knowledge gap detection |
| `attachments: [{path, type, description}]` | Multi-modal content |
| `used_by_tasks: [...]` | Usage telemetry, surface most-used pages |
| `origin_project: <project>` | Cross-project federation marker |

**The discipline:** these are documented in the schema doc as reserved. Authoring tooling accepts them. Linting doesn't enforce them. As features ship, fields get promoted to "active."

---

## Extractability Rules

If a knowledge layer might serve modules that ship independently:

1. **Modules declare knowledge, they don't query it.** Search/graph are server-level.
2. **No cross-module references by raw ID.** Cross-references are by `related[]` (resolves cross-module if both exist) and tags.
3. **Backend is an optimization, not a requirement.** Degrade gracefully (DB → in-memory).
4. **Content lives with the module.** Index lives at the platform level.
5. **Same contract across all deployments.** Backend swaps; shape doesn't.

---

## Anti-Patterns

- **Freeform tags.** Drift. Use namespaces.
- **Untyped cross-references.** Just links don't enable graph queries. Type them.
- **Skipping the graph until later.** "Later" means a frontmatter migration. Reserve `related[]` from v1.
- **Conflating source and production.** Different concerns; keep them separate.
- **Schema in code, not in docs.** The schema doc is the most important artifact. Code references the doc, not the other way around.
- **No content_hash.** Sync pipelines re-write everything every time. Wasteful.
- **Per-page custom schemas.** Use `content_type` to declare type-specific extensions. Avoid one-off field bags.
- **Storing raw documents instead of compiled pages.** That's classic RAG, not LLM Wiki. Compile.

---

## Reference Configurations by Scale

| Scale | Storage choice |
|-------|----------------|
| **Cloud-native server** (1K–50K pages) | Object storage (GCS/S3) + columnar DB (BigQuery/Snowflake) with edges table + recursive CTE |
| **Local tool** (<1K pages) | Filesystem + JSON index + in-memory graph (NetworkX/graphology) |
