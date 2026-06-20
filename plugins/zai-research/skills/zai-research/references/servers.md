# Z.ai MCP Servers — reference

> Concrete detail for the three Z.ai MCP servers wrapped by the `zai-research`
> extension: their remote endpoints, the exact MCP tool each exposes, and the
> verified input schemas (captured via `listTools` against the live endpoints).
> The pi tools in the parent skill map onto these. Schemas are current as of
> writing; re-probe with `listTools` if a server adds fields.

All three are remote MCP servers over the **Streamable HTTP** transport. Auth is
`Authorization: Bearer <zai-api-key>` on every request (the extension resolves
the key from pi's configured `zai` provider).

## Endpoints

| Server | URL |
|---|---|
| web-search-prime | `https://api.z.ai/api/mcp/web_search_prime/mcp` |
| web-reader | `https://api.z.ai/api/mcp/web_reader/mcp` |
| zread | `https://api.z.ai/api/mcp/zread/mcp` |

## web-search-prime → `web_search_prime`

Web search returning page titles, URLs, summaries, site names, icons.

| Field | Type | Notes |
|---|---|---|
| `search_query` | string (**required**) | Keep ≤70 chars (Z.ai recommendation). |
| `search_domain_filter` | string | Whitelist one domain, e.g. `docs.z.ai`. |
| `search_recency_filter` | string | `oneDay` \| `oneWeek` \| `oneMonth` \| `oneYear` \| `noLimit` (default). |
| `content_size` | string | `medium` (~400–600 words, default) \| `high` (~2500 words, higher cost). |
| `location` | string | `cn` (Chinese region) \| `us` (non-Chinese, default). |

Pi tool: **`web_search`** — maps `query`→`search_query`, `recency`→`search_recency_filter`,
`domain`→`search_domain_filter`.

## web-reader → `webReader`

Fetch a URL and convert it to model-friendly input (markdown by default).

| Field | Type | Notes |
|---|---|---|
| `url` | string (**required**) | The page to fetch. |
| `timeout` | int (seconds) | Default 20. |
| `no_cache` | bool | Disable cache (default false). |
| `return_format` | string | `markdown` (default) \| `text`. |
| `retain_images` | bool | Keep images (default true). |
| `no_gfm` | bool | Disable GitHub-Flavored Markdown (default false). |
| `keep_img_data_url` | bool | Keep image data URLs (default false). |
| `with_images_summary` | bool | Include an images summary (default false). |
| `with_links_summary` | bool | Include a links summary (default false). |

Pi tool: **`fetch_content`** (HTML path) — sets `retain_images:false`,
`with_links_summary:false`, `with_images_summary:false` by default to keep the
result lean; `return_format` is forwarded.

## zread → `search_doc` / `get_repo_structure` / `read_file`

Read GitHub repos without cloning: docs/issues/commits, structure, file source.

### `search_doc`

| Field | Type | Notes |
|---|---|---|
| `repo_name` | string (**required**) | `owner/repo`, e.g. `vitejs/vite`. |
| `query` | string (**required**) | Keywords or a natural question about the repo. |
| `language` | string | `zh` \| `en`. |

Pi tool: **`search_repo_docs`** — maps `repo`→`repo_name`, forwards `query`/`language`.

### `get_repo_structure`

| Field | Type | Notes |
|---|---|---|
| `repo_name` | string (**required**) | `owner/repo`. |
| `dir_path` | string | Directory to inspect (default root `/`). |

Pi tool: **`get_repo_structure`** — maps `repo`→`repo_name`, `path`→`dir_path`.

### `read_file`

| Field | Type | Notes |
|---|---|---|
| `repo_name` | string (**required**) | `owner/repo`. |
| `file_path` | string (**required**) | Relative path, e.g. `src/index.ts`. |

Pi tool: **`read_repo_file`** — maps `repo`→`repo_name`, `path`→`file_path`.

## Local PDF extraction (not an MCP server)

`fetch_content` detects `.pdf` URLs and extracts them **locally** via `unpdf`
(a `pdfjs-dist` wrapper) — no Z.ai call, no provider. Returns markdown with
`<!-- Page N -->` markers, capped at 50 pages (configurable in the extension).
This is the one provider-free capability folded in from the prior
`pi-web-access` so PDF handling isn't lost.
