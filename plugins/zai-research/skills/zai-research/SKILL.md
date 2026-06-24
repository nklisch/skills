---
name: zai-research
description: >
  Z.ai-powered web research for Pi: web search, URL/PDF/JSON/API reading, and
  GitHub repo deep-read. Reaches for five agent tools — web_search (Z.ai web
  search), fetch_content (webReader pages, local PDF extraction, direct JSON/API
  fetches, and article extraction for noisy docs), search_repo_docs /
  get_repo_structure / read_repo_file (Z.ai zread over GitHub). Use whenever
  work needs current or version-sensitive information, structured API metadata,
  or deep-reading a GitHub repo without cloning. Auth comes from the configured
  Z.ai (zai) provider key.
---

# zai-research

Five agent tools that route research through Z.ai, so the agent reaches for
**current sources** instead of trusting possibly-stale training data.

- **`web_search`** — Z.ai web search (`web_search_prime`). Returns page titles,
  URLs, summaries. Use `recency` for time-bounded queries, `domain` to restrict
  to a site, `content_size: high` for deeper summaries.
- **`fetch_content`** — URL reader with four modes:
  - Web pages default to Z.ai `webReader` markdown.
  - PDFs are extracted locally with provider-free `unpdf`, page-by-page.
  - REST/JSON API endpoints use `return_format: "json"` for direct bounded
    HTTP fetch + parsed JSON.
  - Noisy docs pages use `extract: "article"` for local readability extraction
    before markdown conversion.
  Accepts one URL or an array (`urls`, max 20).
- **`search_repo_docs`** — Z.ai zread `search_doc`. Searches a GitHub repo's
  docs, issues, and commits.
- **`get_repo_structure`** — Z.ai zread `get_repo_structure`. Lists a repo's
  directory tree.
- **`read_repo_file`** — Z.ai zread `read_file`. Reads a specific file from a
  repo — **no clone needed**.

## When to use which

| Situation | Tool |
|---|---|
| Current info, version-sensitive API/SDK/model behavior, "what's the latest on X" | `web_search` |
| Read a page, doc, or PDF in full (found via search or given by the user) | `fetch_content` |
| Confirm model IDs, version lists, config keys, or other structured API metadata | `fetch_content` with `return_format: "json"` |
| Strip nav/sidebar/footer noise from a docs page | `fetch_content` with `extract: "article"` |
| Understand what a GitHub repo does, its recent changes, known issues | `search_repo_docs` |
| Map a repo's layout before reading files | `get_repo_structure` |
| Read a specific file's source from a repo without cloning | `read_repo_file` |

The guiding rule: **reach for `web_search` before trusting training data on
anything that moves** (models, SDKs, APIs, library versions, recent events), and
chain `search_repo_docs → get_repo_structure → read_repo_file` to deep-read a
repo. Cite the URL/repo in your answer.

## The Z.ai-first research flow

1. **Search first** for current/version-sensitive topics. Prefer `web_search`
   with a tight query (Z.ai recommends ≤70 chars). Add `recency` for news/release
   timing, `domain` for an authoritative source.
2. **Read in depth** with `fetch_content` on the best result — or choose a
   precise mode:
   - `return_format: "json"` for structured API endpoints.
   - `extract: "article"` for noisy docs pages.
   - default markdown/text for normal pages.
   For a GitHub repo, skip the clone and use the zread tools.
3. **Verify before asserting.** Model/API facts change; never state a version
   number, model name, config key, or signature from memory alone when you could
   have searched or fetched the current source. If `web_search` and training
   disagree, trust the fresh result and cite it.

## Patterns

**Pick a library/SDK with current evidence:**
```
web_search: query="Hono vs Express 2026 benchmarks", content_size="high"
```

**Time-bounded "is X released yet":**
```
web_search: query="Z.ai GLM-5.2 release", recency="oneMonth"
```

**Fetch structured API metadata directly:**
```
fetch_content: url="https://api.example.com/model-info", return_format="json"
```
Use this for model IDs, version lists, config schemas, feature flags, and other
API data where a rendered docs page would be noisy or indirect.

**Strip boilerplate from a docs page:**
```
fetch_content: url="https://docs.example.com/models", extract="article"
```
Use this when the default page read returns navigation, sidebars, footers, or
repeated chrome around the actual article.

**Deep-read a GitHub repo without cloning:**
```
search_repo_docs:   repo="modelcontextprotocol/typescript-sdk", query="StreamableHTTPClientTransport requestInit headers"
get_repo_structure: repo="modelcontextprotocol/typescript-sdk"
read_repo_file:     repo="modelcontextprotocol/typescript-sdk", path="src/client/streamableHttp.ts"
```

**Read a doc the user linked (HTML or PDF):**
```
fetch_content: url="https://example.com/guide"        # webReader → markdown
fetch_content: url="https://arxiv.org/pdf/1706.03762" # local unpdf → markdown
```

## Guardrails

- `domain` accepts one whitelist domain (e.g. `docs.z.ai`, `github.com`). Use it
  to keep results authoritative.
- `content_size: high` costs more (longer summaries); use `medium` (default)
  for most queries.
- `fetch_content` mode precedence is: PDF URL → `return_format: "json"` →
  `extract: "article"` → default webReader. PDF URL routing wins over JSON or
  article options.
- `return_format: "json"` and `extract: "article"` are mutually exclusive.
  JSON mode is for structured endpoints; article mode is for HTML docs pages.
- `urls` batch mode applies the same options to every URL. Keep JSON batches
  homogeneous; one bad URL returns a per-URL error block and does not sink the
  rest.
- Direct local fetches (PDF, JSON, article mode) are SSRF-guarded: non-http(s),
  localhost, private/loopback/link-local IPv4 and IPv6, IPv4-mapped IPv6, and
  redirects to blocked hosts are refused. DNS rebinding is still a documented
  limitation of local-dev URL fetching.
- JSON mode uses a 5 MB response cap and returns a clear truncation marker if
  the pretty-printed JSON exceeds the tool return cap. A truncated JSON response
  is explicitly marked incomplete.
- Article extraction uses a readability library plus markdown conversion. If it
  cannot identify a viable article, it returns full-page text with a fallback
  marker rather than silently discarding content.
- For a GitHub repo, prefer the zread tools over `fetch_content`-ing raw GitHub
  URLs — zread returns structured docs/issues/code, not scraped HTML.

## Setup & runtime

- **Auth:** the extension resolves your Z.ai API key from the configured `zai`
  provider (`ctx.modelRegistry`), sent as `Authorization: Bearer <key>`. If you
  are already on the `zai` provider (e.g. `glm-5.2`), there is **no extra
  setup**. The key is resolved by looking up a few known `zai` model ids
  (`glm-5.2`/`glm-4.6`/`glm-4.5`); if your provider uses a different id and the
  key isn't found, the tools return a clear error pointing at the `zai`
  provider configuration. A stale/expired key triggers one automatic re-auth.
- **These tools are pi-runtime-only.** They register via the `zai-research` pi
  extension. In a harness without it, this skill is informational: the agent
  knows the *research pattern* (search → read → verify) but has no Z.ai channel.
- **Replaces** the prior `pi-web-access` web-search/fetch surface. Capabilities
  not covered here (code search, YouTube, video, GitHub clone, multi-source
  curation) were intentionally dropped — they depended on non-Z.ai providers
  (Exa/Gemini/git) and don't belong in a Z.ai plugin. Code search in particular
  is a candidate for a separate self-built indexer.
