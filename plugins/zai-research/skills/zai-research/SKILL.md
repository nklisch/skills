---
name: zai-research
description: >
  Z.ai-powered web research for Pi: web search, URL/PDF reading, and GitHub repo
  deep-read. Reaches for five agent tools — web_search (Z.ai web search, current
  info), fetch_content (Z.ai webReader for pages + local unpdf for PDFs),
  search_repo_docs / get_repo_structure / read_repo_file (Z.ai zread over a
  GitHub repo). Use whenever work needs current or version-sensitive information
  the agent's training data may not have, or when deep-reading a GitHub repo
  without cloning. The tools wrap Z.ai's web-search-prime, web-reader, and zread
  MCP servers via the bundled MCP SDK client; auth is the configured Z.ai (zai)
  provider key, so there is no separate setup for a user already on the zai
  provider.
---

# zai-research

Five agent tools that route research through Z.ai, so the agent reaches for
**current sources** instead of trusting possibly-stale training data.

- **`web_search`** — Z.ai web search (`web_search_prime`). Returns page titles,
  URLs, summaries. Use `recency` for time-bounded queries, `domain` to restrict
  to a site, `content_size: high` for deeper summaries.
- **`fetch_content`** — Z.ai `webReader` for web pages (markdown); **local
  provider-free `unpdf`** for PDFs (returned page-by-page as markdown). Accepts
  one URL or an array (`urls`, max 20).
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
2. **Read in depth** with `fetch_content` on the best result — or, for a GitHub
   repo, skip the clone and use the zread tools.
3. **Verify before asserting.** Model/API facts change; never state a version
   number, model name, config key, or signature from memory alone when you could
   have searched. If `web_search` and training disagree, trust the fresh result
   and cite it.

## Patterns

**Pick a library/SDK with current evidence:**
```
web_search: query="Hono vs Express 2026 benchmarks", content_size="high"
```

**Time-bounded "is X released yet":**
```
web_search: query="Z.ai GLM-5.2 release", recency="oneMonth"
```

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
- `fetch_content` PDFs are extracted **locally** (provider-free) — no Z.ai call
  is made for `.pdf` URLs. Everything else goes through Z.ai webReader. Local
  PDF fetches are SSRF-guarded (private/loopback/link-local hosts refused) and
  byte-capped; a URL that looks like a PDF but isn't falls back to webReader.
  One bad URL in a `urls` batch returns a per-URL error block — it does not sink
  the rest.
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
