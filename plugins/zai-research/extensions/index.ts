/**
 * zai-research — a pi extension that wraps Z.ai's three remote MCP servers and
 * re-exposes them as pi tools, plus provider-free local PDF extraction:
 *
 *   - web_search       → MCP `web_search_prime` (web search: titles, URLs, summaries)
 *   - fetch_content    → MCP `webReader` for HTML; local `unpdf` for PDFs
 *   - search_repo_docs → MCP zread `search_doc` (GitHub repo docs/issues/commits)
 *   - get_repo_structure → MCP zread `get_repo_structure`
 *   - read_repo_file   → MCP zread `read_file`
 *
 * Why an extension and not native MCP: pi intentionally has no built-in MCP
 * support, so the servers are wrapped via the official @modelcontextprotocol/sdk
 * client (bundled as a package dependency). Auth is the Z.ai API key resolved
 * from pi's configured `zai` provider (ctx.modelRegistry), sent as a Bearer
 * header — zero extra config for a user already on the zai provider.
 *
 * The tool ctx is a locally-typed slice (mirrors the agile-workflow /
 * background-tasks house style) so the file stays loosely coupled to pi types.
 */

import { createMcpHub, type McpHub } from "./mcp.js";
import { pdfBufferToMarkdown, looksLikePdfUrl } from "./pdf.js";

const MAX_RETURN_CHARS = 60_000; // cap text returned to the model per tool call
const MAX_FETCH_URLS = 20; // cap parallel fan-out in fetch_content
const MAX_PDF_BYTES = 25_000_000; // cap a single local PDF download (25 MB)
const PDF_FETCH_TIMEOUT_MS = 30_000; // timeout for a local PDF download

// --- Tiny JSON-Schema builders (no external deps) ------------------------

type Schema = Record<string, unknown>;
const str = (description?: string): Schema => ({ type: "string", ...(description ? { description } : {}) });
const num = (description?: string): Schema => ({ type: "number", ...(description ? { description } : {}) });
const bool = (description?: string): Schema => ({ type: "boolean", ...(description ? { description } : {}) });
const strEnum = (values: string[], description?: string): Schema => ({
  type: "string",
  enum: values,
  ...(description ? { description } : {}),
});
const obj = (properties: Record<string, Schema>, required: string[] = []): Schema => ({
  type: "object",
  properties,
  required,
});

// --- Locally-typed pi api slice -------------------------------------------

type ModelLike = unknown;
type AuthResult = { ok?: boolean; apiKey?: string; headers?: Record<string, string> };

type ModelRegistryLike = {
  find?: (provider: string, id: string) => ModelLike | undefined;
  getApiKeyAndHeaders?: (model: ModelLike) => Promise<AuthResult>;
};

type ToolContext = {
  cwd?: string;
  signal?: AbortSignal;
  modelRegistry?: ModelRegistryLike;
};

type ToolResult = {
  content: Array<{ type: "text"; text: string }>;
  details?: Record<string, unknown>;
  isError?: boolean;
};

type ToolExecute = (
  toolCallId: string,
  params: Record<string, unknown>,
  signal: AbortSignal | undefined,
  onUpdate: ((u: unknown) => void) | undefined,
  ctx: ToolContext,
) => Promise<ToolResult>;

type ToolDefinition = {
  name: string;
  label?: string;
  description: string;
  promptSnippet?: string;
  promptGuidelines?: string[];
  parameters: unknown;
  execute: ToolExecute;
};

type PiApi = {
  registerTool?: (def: ToolDefinition) => void;
  on?: (event: string, handler: (event: unknown, ctx: ToolContext) => Promise<void> | void) => void;
};

// --- Helpers --------------------------------------------------------------

export function truncate(text: string, max = MAX_RETURN_CHARS): string {
  if (text.length <= max) return text;
  // Keep the HEAD (lead), which is the high-value part for articles/docs/PDFs,
  // rather than the tail (footers/nav). Clamp for the marker-length-underflow case.
  const marker = `\n\n…[truncated by zai-research: showing first ${max} of ${text.length} chars]`;
  const budget = Math.max(0, max - marker.length);
  return `${text.slice(0, budget)}${marker}`;
}

/**
 * Reject URLs that would let local PDF fetching hit internal/private hosts
 * (SSRF guard). Blocks non-http(s) schemes, IP literals in private/loopback/
 * link-local ranges, and the localhost/metadata hostnames. Does NOT cover
 * DNS-rebinding (a public hostname resolving to a private IP); that is a
 * documented limitation acceptable for a local-dev tool.
 */
export function assertSafeFetchUrl(rawUrl: string): void {
  let u: URL;
  try {
    u = new URL(rawUrl);
  } catch {
    throw new Error(`invalid URL: ${rawUrl}`);
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") {
    throw new Error(`refusing non-http(s) scheme: ${u.protocol}`);
  }
  const host = u.hostname.toLowerCase().replace(/^\[|\]$/g, ""); // strip IPv6 brackets
  if (host === "localhost" || host.endsWith(".localhost")) {
    throw new Error(`refusing localhost host`);
  }
  // IPv4 literal?
  const v4 = host.match(/^(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (v4) {
    const [a, b] = v4[1].split(".").map((n) => Number(n));
    const isPrivate =
      a === 10 ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a === 127 ||
      (a === 169 && b === 254) ||
      (a === 0);
    if (isPrivate) throw new Error(`refusing private/loopback/link-local IP: ${host}`);
  }
  // IPv6 literal? block ::1, fc00::/7 (unique-local), fe80::/10 (link-local).
  if (host.includes(":")) {
    if (host === "::1" || host.startsWith("fc") || host.startsWith("fd") || host.startsWith("fe8") || host.startsWith("fe9") || host.startsWith("fea") || host.startsWith("feb")) {
      throw new Error(`refusing loopback/local IPv6: ${host}`);
    }
  }
}

/** Fetch a URL with a byte cap + timeout, aborting if the body exceeds maxBytes. */
async function fetchBounded(url: string, maxBytes: number, signal?: AbortSignal): Promise<ArrayBuffer> {
  const timeout = AbortSignal.timeout(PDF_FETCH_TIMEOUT_MS);
  const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;
  const resp = await fetch(url, { signal: combined, redirect: "follow" });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  // Stream and cap, so a huge response can't exhaust memory.
  const reader = resp.body?.getReader();
  if (!reader) return resp.arrayBuffer();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel().catch(() => {});
      throw new Error(`response exceeds ${maxBytes} byte cap`);
    }
    chunks.push(value);
  }
  const out = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) {
    out.set(c, off);
    off += c.byteLength;
  }
  return out.buffer;
}

/** Resolve the Z.ai API key from the configured zai provider. */
async function resolveZaiKey(registry?: ModelRegistryLike): Promise<string | null> {
  if (!registry?.find || !registry.getApiKeyAndHeaders) return null;
  // Try the current flagship first, then fall back to a recent id.
  for (const id of ["glm-5.2", "glm-4.6", "glm-4.5"]) {
    const model = registry.find("zai", id);
    if (!model) continue;
    try {
      const auth = await registry.getApiKeyAndHeaders(model);
      if (auth?.ok && auth.apiKey) return auth.apiKey;
    } catch {
      // try next candidate
    }
  }
  return null;
}

// --- Extension ------------------------------------------------------------

export default function zaiResearchExtension(pi: PiApi): void {
  let hub: McpHub | null = null;
  // Mutable: refreshed on every tool call so a registry/key change mid-session
  // is picked up (don't pin the first call's context forever).
  let currentRegistry: ModelRegistryLike | undefined;

  function getHub(ctx: ToolContext): McpHub {
    currentRegistry = ctx.modelRegistry ?? currentRegistry;
    if (!hub) {
      hub = createMcpHub({ resolveKey: () => resolveZaiKey(currentRegistry) });
    }
    return hub;
  }

  // --- web_search ---------------------------------------------------------

  const webSearchExecute: ToolExecute = async (_id, params, signal, _onUpdate, ctx) => {
    const query = String(params.query ?? "").trim();
    if (!query) {
      return { content: [{ type: "text", text: "query is required." }], isError: true };
    }
    const args: Record<string, unknown> = {
      search_query: query.slice(0, 2000),
      content_size: params.content_size === "high" ? "high" : "medium",
      location: params.location ? String(params.location) : "us",
    };
    if (params.recency) args.search_recency_filter = String(params.recency);
    if (params.domain) args.search_domain_filter = String(params.domain);

    try {
      const res = await getHub(ctx).call("web-search-prime", "web_search_prime", args, signal);
      if (res.isError) {
        return { content: [{ type: "text", text: `Z.ai web_search_prime error:\n${truncate(res.text)}` }], isError: true };
      }
      return {
        content: [{ type: "text", text: truncate(res.text) || "(no results)" }],
        details: { query, server: "web-search-prime", tool: "web_search_prime" },
      };
    } catch (err) {
      return { content: [{ type: "text", text: `web_search failed: ${(err as Error).message}` }], isError: true };
    }
  };

  // --- fetch_content ------------------------------------------------------

  async function fetchOnePdf(url: string, signal?: AbortSignal): Promise<string> {
    assertSafeFetchUrl(url);
    const buf = await fetchBounded(url, MAX_PDF_BYTES, signal);
    const out = await pdfBufferToMarkdown(new Uint8Array(buf), { source: url });
    return out.markdown;
  }

  const fetchContentExecute: ToolExecute = async (_id, params, signal, _onUpdate, ctx) => {
    const rawUrls = params.urls ?? (params.url ? [params.url] : []);
    const urls = (Array.isArray(rawUrls) ? rawUrls : [rawUrls]).map((u) => String(u)).filter(Boolean);
    if (urls.length === 0) {
      return { content: [{ type: "text", text: "url or urls is required." }], isError: true };
    }
    if (urls.length > MAX_FETCH_URLS) {
      return {
        content: [{ type: "text", text: `Too many URLs (max ${MAX_FETCH_URLS}); got ${urls.length}.` }],
        isError: true,
      };
    }
    const returnFormat = params.return_format === "text" ? "text" : "markdown";

    const fetchOne = async (url: string): Promise<string> => {
      // PDF → local provider-free extraction (with SSRF + size guards); on
      // local failure (e.g. a .pdf URL that is actually HTML), fall through to
      // webReader so a false-positive heuristic doesn't strand the URL.
      if (looksLikePdfUrl(url)) {
        try {
          return await fetchOnePdf(url, signal);
        } catch (err) {
          // Local extraction failed — try webReader as a fallback.
          try {
            const args2: Record<string, unknown> = { url, return_format: returnFormat, retain_images: false, with_links_summary: false, with_images_summary: false };
            const res2 = await getHub(ctx).call("web-reader", "webReader", args2, signal);
            return `[local PDF extraction failed (${(err as Error).message}); webReader fallback]:\n${res2.isError ? res2.text : res2.text}`;
          } catch (err2) {
            return `[fetch failed for ${url}: local=${(err as Error).message}; webReader=${(err2 as Error).message}]`;
          }
        }
      }
      // HTML via webReader — isolated per URL so one failure doesn't sink the batch.
      try {
        const args: Record<string, unknown> = {
          url,
          return_format: returnFormat,
          retain_images: false,
          with_links_summary: false,
          with_images_summary: false,
        };
        const res = await getHub(ctx).call("web-reader", "webReader", args, signal);
        return res.isError ? `[webReader error for ${url}:\n${res.text}]` : res.text;
      } catch (err) {
        return `[webReader failed for ${url}: ${(err as Error).message}]`;
      }
    };

    try {
      const results = await Promise.all(urls.map((u) => fetchOne(u)));
      const body =
        urls.length === 1
          ? results[0]
          : results
              .map((text, i) => `## ${urls[i]}\n\n${text}`)
              .join("\n\n---\n\n");
      return {
        content: [{ type: "text", text: truncate(body) || "(no content)" }],
        details: { urls, server: "web-reader", pdfUsed: urls.some(looksLikePdfUrl) },
      };
    } catch (err) {
      return { content: [{ type: "text", text: `fetch_content failed: ${(err as Error).message}` }], isError: true };
    }
  };

  // --- zread tools --------------------------------------------------------

  const searchRepoDocsExecute: ToolExecute = async (_id, params, signal, _onUpdate, ctx) => {
    const repo = String(params.repo ?? "").trim();
    const query = String(params.query ?? "").trim();
    if (!repo || !query) {
      return { content: [{ type: "text", text: "repo (owner/repo) and query are required." }], isError: true };
    }
    const args: Record<string, unknown> = { repo_name: repo, query };
    if (params.language === "zh" || params.language === "en") args.language = params.language;
    try {
      const res = await getHub(ctx).call("zread", "search_doc", args, signal);
      if (res.isError) {
        return { content: [{ type: "text", text: `Z.ai search_doc error:\n${truncate(res.text)}` }], isError: true };
      }
      return {
        content: [{ type: "text", text: truncate(res.text) || "(no results)" }],
        details: { repo, query, server: "zread", tool: "search_doc" },
      };
    } catch (err) {
      return { content: [{ type: "text", text: `search_repo_docs failed: ${(err as Error).message}` }], isError: true };
    }
  };

  const getRepoStructureExecute: ToolExecute = async (_id, params, signal, _onUpdate, ctx) => {
    const repo = String(params.repo ?? "").trim();
    if (!repo) {
      return { content: [{ type: "text", text: "repo (owner/repo) is required." }], isError: true };
    }
    const args: Record<string, unknown> = { repo_name: repo };
    if (params.path) args.dir_path = String(params.path);
    try {
      const res = await getHub(ctx).call("zread", "get_repo_structure", args, signal);
      if (res.isError) {
        return { content: [{ type: "text", text: `Z.ai get_repo_structure error:\n${truncate(res.text)}` }], isError: true };
      }
      return {
        content: [{ type: "text", text: truncate(res.text) || "(no structure returned)" }],
        details: { repo, server: "zread", tool: "get_repo_structure" },
      };
    } catch (err) {
      return { content: [{ type: "text", text: `get_repo_structure failed: ${(err as Error).message}` }], isError: true };
    }
  };

  const readRepoFileExecute: ToolExecute = async (_id, params, signal, _onUpdate, ctx) => {
    const repo = String(params.repo ?? "").trim();
    const path = String(params.path ?? "").trim();
    if (!repo || !path) {
      return { content: [{ type: "text", text: "repo (owner/repo) and path are required." }], isError: true };
    }
    const args: Record<string, unknown> = { repo_name: repo, file_path: path };
    try {
      const res = await getHub(ctx).call("zread", "read_file", args, signal);
      if (res.isError) {
        return { content: [{ type: "text", text: `Z.ai read_file error:\n${truncate(res.text)}` }], isError: true };
      }
      return {
        content: [{ type: "text", text: truncate(res.text) || "(empty file)" }],
        details: { repo, path, server: "zread", tool: "read_file" },
      };
    } catch (err) {
      return { content: [{ type: "text", text: `read_repo_file failed: ${(err as Error).message}` }], isError: true };
    }
  };

  // --- register -----------------------------------------------------------

  pi.registerTool?.({
    name: "web_search",
    label: "Web Search",
    description:
      "Search the web via Z.ai. Returns page titles, URLs, and summaries. Prefer this for current information, library/SDK choices, API usage, version-specific behavior, and anything where the agent's training data may be stale. Pass recency for time-bounded queries and domain to restrict to a site.",
    promptSnippet: "Search the web via Z.ai (current info, library/API/SDK questions)",
    promptGuidelines: [
      "Use web_search for anything current or version-sensitive before relying on training data — model/SDK/API names and behaviors move fast.",
      "Use domain to restrict to an authoritative site (e.g. domain='docs.z.ai') and recency (oneDay|oneWeek|oneMonth|oneYear) for time-bounded queries.",
      "After searching, use fetch_content to read a result page in full, or the zread tools (search_repo_docs/get_repo_structure/read_repo_file) to deep-read a GitHub repo.",
    ],
    parameters: obj({
      query: str("What to search for. Keep it specific; Z.ai recommends ≤70 characters."),
      recency: strEnum(["oneDay", "oneWeek", "oneMonth", "oneYear", "noLimit"], "Time range filter. Omit for no limit."),
      domain: str("Restrict results to a whitelist domain, e.g. 'docs.z.ai' or 'github.com'."),
      content_size: strEnum(["medium", "high"], "Summary detail. medium (~400-600 words, default); high (~2500 words, more comprehensive, higher cost)."),
      location: strEnum(["us", "cn"], "Region guess. us = non-Chinese region (default); cn = Chinese region."),
    }, ["query"]),
    execute: webSearchExecute,
  });

  pi.registerTool?.({
    name: "fetch_content",
    label: "Fetch Content",
    description:
      "Fetch and extract readable content from one or more URLs via Z.ai's webReader (returns markdown by default). PDFs are extracted locally (provider-free, via unpdf) and returned as markdown page-by-page. Use to read a web page, doc, or PDF the agent found or was given — for full text beyond a search snippet.",
    promptSnippet: "Fetch/extract URL content (web pages + PDFs) via Z.ai webReader + local unpdf",
    promptGuidelines: [
      "Use fetch_content to read a page in full after web_search, or to ingest a doc/PDF URL the user provided.",
      "PDFs (by .pdf URL) are extracted locally — no provider needed. Everything else goes through Z.ai webReader.",
      "Pass urls (an array) to fetch several at once; results are concatenated per URL.",
    ],
    parameters: obj({
      url: str("A single URL to fetch."),
      urls: { type: "array", items: { type: "string" }, description: "Multiple URLs to fetch in parallel (max 20)." },
      return_format: strEnum(["markdown", "text"], "Output format for webReader (markdown default). PDFs always return markdown."),
      prompt: str("Optional note framing what you want from the content (accepted for drop-in compatibility; not sent to Z.ai)."),
    }, []),
    execute: fetchContentExecute,
  });

  pi.registerTool?.({
    name: "search_repo_docs",
    label: "Search Repo Docs",
    description:
      "Search a GitHub repository's documentation, issues, and commits via Z.ai zread — quickly understand what a repo does, recent news, open issues, and contributors. Use for 'what does library X do / how do I Y in repo Z / is there a known issue about W' before reading code. Pass repo as owner/repo.",
    promptSnippet: "Search a GitHub repo's docs/issues/commits via Z.ai zread",
    promptGuidelines: [
      "Use search_repo_docs first when investigating a specific GitHub repo (capabilities, recent changes, known issues), then get_repo_structure / read_repo_file to drill into code.",
      "Pass repo as owner/repo (e.g. 'vitejs/vite'). Set language 'zh' or 'en' to match the docs you want.",
    ],
    parameters: obj({
      repo: str("GitHub repository as owner/repo, e.g. 'vitejs/vite'."),
      query: str("Search keywords or question about the repository."),
      language: strEnum(["zh", "en"], "Doc language preference."),
    }, ["repo", "query"]),
    execute: searchRepoDocsExecute,
  });

  pi.registerTool?.({
    name: "get_repo_structure",
    label: "Repo Structure",
    description:
      "Get the directory structure and file list of a GitHub repository via Z.ai zread. Use to understand a repo's module layout before reading specific files. Pass path to inspect a subdirectory.",
    promptSnippet: "List a GitHub repo's directory structure via Z.ai zread",
    promptGuidelines: ["Use get_repo_structure to map a repo's layout, then read_repo_file for the files that matter."],
    parameters: obj({
      repo: str("GitHub repository as owner/repo."),
      path: str("Directory to inspect (default: root '/')."),
    }, ["repo"]),
    execute: getRepoStructureExecute,
  });

  pi.registerTool?.({
    name: "read_repo_file",
    label: "Read Repo File",
    description:
      "Read the full code content of a specific file in a GitHub repository via Z.ai zread — no clone needed. Use to deeply analyze implementation details of a file the structure/search pointed at.",
    promptSnippet: "Read a file from a GitHub repo via Z.ai zread (no clone)",
    promptGuidelines: [
      "Use read_repo_file to pull a specific file's source from a GitHub repo without cloning — pair with get_repo_structure to find the right path.",
    ],
    parameters: obj({
      repo: str("GitHub repository as owner/repo."),
      path: str("Relative path to the file, e.g. 'src/index.ts'."),
    }, ["repo", "path"]),
    execute: readRepoFileExecute,
  });

  // Clean up MCP clients on shutdown so no transport lingers.
  pi.on?.("session_shutdown", async () => {
    if (hub) {
      await hub.close();
      hub = null;
    }
  });
}
