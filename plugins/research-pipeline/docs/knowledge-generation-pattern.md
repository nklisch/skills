# Knowledge Layer: Generation Pattern

> Cross-project pattern. How knowledge enters the system and stays current. See [knowledge-layer-overview.md](knowledge-layer-overview.md) for context.

---

## Purpose

Define how knowledge is produced, refreshed, validated, and retired. Covers maintenance modes, sync strategy, scheduled refresh, LLM enrichment, lint, and provenance.

---

## Core Concept

Knowledge is **compiled at write-time and maintained over time** (the LLM Wiki ingest/lint loop). Three operations:

```
1. INGEST      Source data → compile/update affected pages → cross-references updated
2. REFRESH     Periodic re-pull from declared sources → diff → update if changed
3. LINT        Periodic health checks: stale, drift, contradiction, broken refs
```

The system stays useful only if pages stay current. **Generation is a continuous concern, not a one-time author event.**

---

## Maintenance Modes — Two Axes

A common mistake: collapsing "where data comes from" and "how content is produced" into a single field. They're orthogonal.

### Source axis: where does data come from?

| Value | Meaning |
|-------|---------|
| `static` | Authored manually, updated when knowledge shifts |
| `dynamic` | Pulled live from external system on every read (handler function, no stored file) |
| `tool-maintained` | File in storage, periodically refreshed from declared sources |

### Production axis: how is content produced?

| Value | Meaning |
|-------|---------|
| `hand-written` | Human authored prose |
| `template-generated` | Pipeline fills a template from structured data |
| `template+llm-enriched` | Template fills bones, LLM writes narrative on top |

### They stack

| Source × Production | Example |
|---------------------|---------|
| `static` + `hand-written` | Founder-written philosophy doc |
| `tool-maintained` + `template+llm-enriched` | Auto-pulled competitor data + LLM synthesis |
| `tool-maintained` + `template-generated` | Auto-pulled metrics with no narrative |
| `dynamic` + `template-generated` | Live dashboard rendered to page on read |

### Why both axes

- **Refresh schedule** uses `source` (`tool-maintained` gets periodic refresh)
- **Quality review cadence** uses `production` (`llm-enriched` needs human review)
- **Trust calibration** uses both
- **Lint warnings** key off improbable combinations (e.g., `dynamic` + `hand-written`)

---

## Sync Strategy

Two-layer storage (content + index) requires a sync mechanism. The minimum:

```
Page written/updated in content layer
         │
         ▼
  Parse frontmatter → extract metadata
         │
         ▼
  Compute content_hash → detect change
         │
         ├─ Hash unchanged → skip (no index write)
         │
         └─ Hash changed →
              │
              ├─ Upsert page row in index
              ├─ Recompute related[] → upsert/delete edges
              └─ (Optional) push update to in-memory cache

Safety net: periodic full rebuild
  Scan all pages → rebuild index from scratch
  Catches drift; can run on a schedule or be invoked manually
```

**`content_hash`** is the optimization. Without it, every refresh re-writes every row.

**Periodic full rebuild** is the safety net. Without it, drift between content and index goes undetected.

---

## Scheduled Refresh

Tool-maintained pages need a recurring refresh job. The pattern:

```
Cron / Scheduler (daily or weekly)
       │
       ▼
Refresh job (same image as the serving process)
       │
       ├─ 1. Query index for all pages where source = 'tool-maintained'
       │
       ├─ 2. For each page with refresh_sources:
       │     ├─ Pull fresh data from each source (URLs, APIs)
       │     ├─ Compare against existing page (content_hash)
       │     ├─ If changed: rewrite page, append to history page, upsert index
       │     └─ If unchanged: update timestamp only
       │
       ├─ 3. Run lint
       │     └─ Write health report
       │
       └─ 4. Recompute confidence decay (for pages with confidence_decay set)
```

### Deployment Options

| Backend | Trigger | Execution |
|---------|---------|-----------|
| Local tool | cron / systemd timer / launchd | Local script |
| Cloud server | Cloud Scheduler / EventBridge / cron | Containerized job (Cloud Run Job, Lambda, ECS task) |
| Always-on server | In-process scheduler | Background job thread |

The serving process and the refresh job should typically be **separated** — refresh is bursty and shouldn't affect query latency.

---

## LLM Enrichment Pipeline

For pages marked `production: llm-enriched` (or `template+llm-enriched`), the refresh cycle includes an LLM synthesis step.

```
Pipeline-generated baseline (template fills from data)
       │
       ▼
LLM enrichment pass (only on changed pages)
       │
       ├─ Read: raw data + existing page + related pages (via graph)
       │
       ├─ Synthesize: narrative beyond raw numbers
       │   "Acme's pricing shift is consistent with the broader market
       │    move toward consumption-based models."
       │
       └─ Cross-reference: does this change suggest new related[] edges?
       │
       ▼
Result: pipeline-generated baseline + LLM narrative on top
```

**Critical: LLM enrichment is ADDITIVE.** If the LLM step fails, the pipeline-generated page is still valid. Never let LLM be the sole producer of structured content.

### The Schema Document Is Load-Bearing Here

The schema doc (frontmatter spec, content_type definitions, body section conventions) is what makes LLM enrichment disciplined. The LLM reads the schema, knows what each content_type page should contain, and produces consistent output.

> "The schema document is the most important artifact. It turns a generic LLM into a disciplined knowledge worker." — Karpathy LLM Wiki

---

## Provenance Tracking

Reserved field pattern: `sources: [{url, accessed_at, excerpt}]`. Per-fact citation supports:

- **Audit:** "Why do we believe X?" → cite the source
- **Decay:** Source returns 404 → confidence drops, page flagged for refresh
- **Trust calibration:** Pages with thin sources → lower default confidence

**Authoring discipline:** populate `sources` from day one even if tooling doesn't enforce it. The cost of retrofitting provenance to existing pages is high; the cost of populating it during authoring is low.

### Origin Tool: `research_method`

Separate from per-fact `sources` — captures *which tool produced the page*. Stamped at generation time by `/brief`, `/research`, `/deep-research`, and `/research-program`. See [knowledge-storage-pattern.md → Provenance: research_method](knowledge-storage-pattern.md#provenance-research_method) for the value vocabulary.

**Why generation pipelines stamp this:** every level-up of the research toolchain implicitly deprecates pages produced by earlier tools. Stamping at generation costs nothing; retrofitting is a hand-grep across the corpus. `/doc-review` reads the field and surfaces refresh candidates — pages whose origin tool is below the corpus's highest tier and whose `updated` predates the most recent higher-tier run.

---

## Lint: Active Health Checks

**Lint actively, not passively.** Pages without lint go stale, contradict each other, and accumulate broken cross-references invisibly.

Standard check set (extend per project):

| Check | Detects | Severity |
|-------|---------|----------|
| **Stale** | `updated` > threshold (e.g., 90 days) | Warning |
| **Confidence decay** | `confidence: established` but old | Info |
| **Data drift** | Tool-maintained page claims don't match current source data | Error |
| **Contradictions** | Two pages disagree on a measurable fact | Error |
| **Index drift** | Content-layer files not in index (or vice versa) | Error |
| **Broken refresh sources** | `refresh_sources` URL returns 404 | Warning |
| **Broken cross-references** | `related[]` slug doesn't resolve | Error |
| **Tag taxonomy violations** | Tag without namespace; unknown namespace | Warning |
| **Unknown relationship** | `related[].relationship` not in vocabulary | Warning |
| **Improbable maintenance combo** | e.g., `dynamic` + `hand-written` | Warning |
| **Orphaned pages** | Not referenced anywhere | Info |

### Output

Markdown health report with categorized findings. Either:
- Saved to a known location (e.g., `system/lint-report.md`)
- Posted to a notification channel
- Surfaced via a `knowledge/lint` query tool

### Cadence

Run lint as part of the scheduled refresh cycle (after refreshing all tool-maintained pages). Catches drift introduced by the refresh itself.

---

## Knowledge Lifecycle

Pages aren't permanent. Model the lifecycle explicitly.

### Status field (reserved)

| Status | Meaning |
|--------|---------|
| `stub` | We know we should have a page on this topic, but don't yet. Authoring TODO. |
| `draft` | Page exists but not ready for production retrieval |
| `published` | Page is live and discoverable |

`stub` pages enable **knowledge gap detection** — the system knows what it doesn't know. Useful for prioritizing authoring.

### Supersession (reserved)

`supersedes: <slug>` declares a new page replaces an old one. The old page stays (history) but is excluded from default search. Traversing supersession chains gives belief evolution over time.

### Confidence Decay (reserved)

`confidence_decay: weekly | monthly | stable`. The lint pipeline auto-lowers confidence if the page hasn't been refreshed within its decay window. Surfaces "we used to be sure but it's been a while."

### Forgetting

Old, unreferenced, low-confidence pages can be archived. The pattern:
- Lint flags candidates
- Human reviews and confirms
- Page moves to an `archive/` prefix; index row marked `status: archived`
- Search excludes by default but can include via opt-in filter

---

## Anti-Patterns

- **Single maintenance-mode field.** Two axes (source × production), not one.
- **No content_hash.** Every refresh re-writes everything.
- **No periodic full rebuild.** Drift accumulates invisibly.
- **LLM as sole producer.** Always have a deterministic baseline (template) below the LLM layer.
- **No lint.** Stale, broken, contradictory pages accumulate. The knowledge layer rots.
- **Lint without action.** A report no one reads is no report. Make findings actionable, surface them, fix them.
- **No history pages for tool-maintained content.** Change history is high-value knowledge. Keep it.
- **Refresh in the serving process.** Bursty work; affects latency. Run separately.
- **Over-indexing on staleness.** Some knowledge is genuinely `stable` (a definition, an axiom). Don't auto-flag those.

---

## Implementation Sketch (language-agnostic)

```
def sync_page(page_path):
    page = parse_frontmatter_and_body(page_path)
    new_hash = compute_hash(page.content)
    existing = index.get(page.slug)
    if existing and existing.content_hash == new_hash:
        return  # no change
    index.upsert(page)
    edges.replace(page.slug, page.related)
    cache.invalidate(page.slug)  # if cache exists

def refresh_tool_maintained(page):
    fresh_data = pull(page.refresh_sources)
    if not data_changed(page, fresh_data):
        page.updated = now()
        return
    if page.production == 'template+llm-enriched':
        page.body = template.fill(fresh_data) + llm.enrich(template_output, related_pages(page))
    elif page.production == 'template-generated':
        page.body = template.fill(fresh_data)
    history(page).append_change(diff(page, fresh_data))
    write(page)
    sync_page(page.path)

def lint():
    for page in all_pages():
        check_stale(page)
        check_confidence_decay(page)
        check_data_drift(page)
        check_broken_cross_refs(page)
        check_tag_taxonomy(page)
        check_relationship_vocabulary(page)
        check_maintenance_combo(page)
    report(findings)
```

---

## Reference Implementations by Scale

| Scale | Typical setup | Generation choice |
|-------|---------------|-------------------|
| **Cloud-native project** (deployed service, multiple data sources) | Cloud Scheduler + containerized job (Cloud Run Job, Lambda, ECS task) | Scheduled refresh via cloud job; dedicated brief/refresh tooling; full lint suite; LLM enrichment via tool-maintained briefs |
| **Local simulation engine** (single-user, external data sources) | Local cron / launchd / systemd timer | Pipeline-generated from external data sources (APIs, scraped datasets); LLM enrichment for entity pages; local cron for refresh |
