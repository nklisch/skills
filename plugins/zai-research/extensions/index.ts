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
import { extractArticle } from "./article.js";
import { applyWindow, PageCache, cacheKey } from "./paging.js";
import type { WindowSpec, WindowResult } from "./paging.js";

const MAX_RETURN_CHARS = 60_000; // cap text returned to the model per tool call
const MAX_FETCH_URLS = 20; // cap parallel fan-out in fetch_content
const MAX_PDF_BYTES = 25_000_000; // cap a single local PDF download (25 MB)
const MAX_JSON_BYTES = 5_000_000; // cap a single JSON/API direct fetch (5 MB)
const PDF_FETCH_TIMEOUT_MS = 30_000; // timeout for a local PDF / JSON download

// --- Windowing (single-URL text-mode path) --------------------------------
// Windowing is a NEW path layered on fetch_content's single-URL text modes
// (webReader HTML, article, PDF markdown). It does NOT replace MAX_RETURN_CHARS
// above, which still caps web_search, the zread tools, and fetch_content's
// batch/JSON paths. See `feature-zai-fetch-content-paging` for the design.
const DEFAULT_MAX_CHARS = 30_000; // total returned budget (text + footer) when max_chars is omitted
const MIN_MAX_CHARS = 1_000; // floor for the max_chars clamp
const MAX_MAX_CHARS = 120_000; // hard ceiling for the max_chars clamp
const RESERVED_OVERHEAD = 256; // footer + marker budget reserved inside max_chars (like truncate)

// UTF-8 BOM bytes (EF BB BF). Some APIs emit a leading BOM; strip it before
// JSON.parse, which otherwise fails with "Unexpected token \uFEFF".
const UTF8_BOM = [0xef, 0xbb, 0xbf] as const;

// Truncation marker for oversized JSON. Appended OUTSIDE the JSON structure so
// the result is honestly incomplete rather than invalid-JSON-disguised-as-valid
// — head-truncating JSON would silently break the structure for callers.
const JSON_TRUNCATION_MARKER =
  "\n\n…[truncated by zai-research: JSON output exceeded the return cap and is incomplete]";

/** Structured result of a bounded fetch: HTTP status, headers, and body. */
export type FetchBoundedResult = {
  status: number;
  headers: Headers;
  body: ArrayBuffer;
};

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
 * Clamp a caller-supplied `max_chars` to the windowing budget range.
 *
 * `max_chars` is the TOTAL returned budget (window text + footer + marker),
 * mirroring how {@link truncate} budgets its marker inside the cap. The windowing
 * path reserves {@link RESERVED_OVERHEAD} for the footer before slicing, so the
 * returned `text + footer ≤ max_chars`. Non-finite / non-number values fall back
 * to {@link DEFAULT_MAX_CHARS}; the value is then floored and clamped to
 * `[MIN_MAX_CHARS, MAX_MAX_CHARS]`.
 */
export function clampMaxChars(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return DEFAULT_MAX_CHARS;
  // `| 0` floors toward zero (truncate). The clamp range is well inside 32-bit,
  // so this is safe and matches the spec's `value | 0` formulation.
  return Math.min(Math.max(value | 0, MIN_MAX_CHARS), MAX_MAX_CHARS);
}

/**
 * Human-readable window footer appended to partial or explicit-window results.
 * Convenience only — the structured `details` (next_start_line, has_more, …) is
 * the source of truth an agent uses to advance, not this string.
 *
 * The `past_end` case gets a distinct message: the standard range footer would
 * read `lines N+1–N of N` (start > end), which is confusing. The agent-facing
 * signal is still `details.past_end === true`.
 */
export function windowFooter(w: WindowResult): string {
  if (w.past_end) {
    return `…[window: past end of content (line ${w.returned.start} requested; ${w.total_lines} total) · no more content]`;
  }
  const next = w.returned.end + 1;
  const charNote = w.truncated_by_char_ceiling ? " · char-ceiling truncated" : "";
  return `…[window: lines ${w.returned.start}–${w.returned.end} of ${w.total_lines}${charNote} · request line ${next} to continue]`;
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
  // IPv4-mapped IPv6 literal. URL.hostname normalizes dotted forms like
  // [::ffff:127.0.0.1] to hex groups ([::ffff:7f00:1]), so handle both.
  const mappedDotted = host.match(/:ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i);
  if (mappedDotted) {
    const [a, b] = mappedDotted[1].split(".").map((n) => Number(n));
    const isPrivate =
      a === 10 ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a === 127 ||
      (a === 169 && b === 254) ||
      a === 0;
    if (isPrivate) throw new Error(`refusing IPv4-mapped private/loopback IP: ${host}`);
  }
  const mappedHex = host.match(/:ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i);
  if (mappedHex) {
    const high = Number.parseInt(mappedHex[1], 16);
    const a = (high >> 8) & 0xff;
    const b = high & 0xff;
    const isPrivate =
      a === 10 ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a === 127 ||
      (a === 169 && b === 254) ||
      a === 0;
    if (isPrivate) throw new Error(`refusing IPv4-mapped private/loopback IP: ${host}`);
  }
  // IPv6 literal? block ::1, fc00::/7 (unique-local), fe80::/10 (link-local).
  if (host.includes(":")) {
    if (host === "::1" || host.startsWith("fc") || host.startsWith("fd") || host.startsWith("fe8") || host.startsWith("fe9") || host.startsWith("fea") || host.startsWith("feb")) {
      throw new Error(`refusing loopback/local IPv6: ${host}`);
    }
  }
}

/** Read a response body with a byte cap, preserving status + headers. */
async function readBodyCapped(resp: Response, maxBytes: number): Promise<FetchBoundedResult> {
  const reader = resp.body?.getReader();
  if (!reader) {
    // No streaming body — read it whole, capped.
    const buf = await resp.arrayBuffer();
    if (buf.byteLength > maxBytes) {
      throw new Error(`response exceeds ${maxBytes} byte cap`);
    }
    return { status: resp.status, headers: resp.headers, body: buf };
  }
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
  return { status: resp.status, headers: resp.headers, body: out.buffer };
}

const REDIRECT_STATUS_CODES = new Set([301, 302, 303, 307, 308]);
const MAX_REDIRECTS = 10;

/**
 * Fetch a URL with a byte cap + timeout. Streams and aborts if the body
 * exceeds `maxBytes` (so a huge response can't exhaust memory), follows
 * redirects manually while re-running the SSRF guard on every `Location`,
 * and returns the structured result. Does NOT throw on non-2xx — callers
 * decide how to handle the status (the JSON/API path needs to inspect
 * status, headers, and 4xx/5xx JSON error bodies).
 */
export async function fetchBounded(
  url: string,
  maxBytes: number,
  signal?: AbortSignal,
): Promise<FetchBoundedResult> {
  const timeout = AbortSignal.timeout(PDF_FETCH_TIMEOUT_MS);
  const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;
  let currentUrl = url;
  let redirects = 0;
  for (;;) {
    assertSafeFetchUrl(currentUrl);
    const resp = await fetch(currentUrl, { signal: combined, redirect: "manual" });
    if (!REDIRECT_STATUS_CODES.has(resp.status)) {
      return await readBodyCapped(resp, maxBytes);
    }
    if (redirects >= MAX_REDIRECTS) {
      throw new Error(`too many redirects`);
    }
    const location = resp.headers.get("location");
    if (!location) {
      throw new Error(`redirect without Location header`);
    }
    currentUrl = new URL(location, currentUrl).href;
    redirects++;
  }
}

/** Outcome of {@link parseJsonBody}: a successful compact JSON string, or a structured error. */
type ParseJsonOutcome = { ok: true; text: string } | { ok: false; error: string };

/**
 * Parse a {@link FetchBoundedResult} for the JSON/API mode. Pure and isolated
 * so it is directly unit-testable.
 *
 * - Strips a leading UTF-8 BOM before decoding/parsing.
 * - Returns a clear "empty body" error for empty / whitespace-only bodies
 *   (avoids a generic parse error on a 204 or genuinely empty response).
 * - Attempts `JSON.parse` regardless of HTTP status, so 4xx/5xx JSON error
 *   bodies (e.g. `{"error":"model not found"}`) surface.
 * - On parse failure, returns a structured error carrying the HTTP status,
 *   the Content-Type header (if any), and a short body snippet.
 * - On parse success for a non-2xx status, prepends a `> HTTP <status>` line
 *   so an API error body shows BOTH status and body — otherwise a 4xx JSON
 *   body would be indistinguishable from a 2xx success body.
 * - Emits compact JSON by default. Agents can parse compact JSON just as well
 *   as pretty JSON, and whitespace is token overhead. If the result exceeds
 *   {@link MAX_RETURN_CHARS}, head-truncates and appends
 *   {@link JSON_TRUNCATION_MARKER} OUTSIDE the JSON.
 */
export function parseJsonBody(result: FetchBoundedResult): ParseJsonOutcome {
  const { status, headers, body } = result;
  const bytes = new Uint8Array(body);
  const start =
    bytes.length >= 3 && bytes[0] === UTF8_BOM[0] && bytes[1] === UTF8_BOM[1] && bytes[2] === UTF8_BOM[2]
      ? 3
      : 0;
  const text = new TextDecoder("utf-8").decode(start === 0 ? bytes : bytes.subarray(start));

  if (text.trim().length === 0) {
    return { ok: false, error: `empty body (HTTP ${status})` };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    const ct = headers.get("content-type");
    const ctLabel = ct ? `Content-Type: ${ct}` : "Content-Type: (unknown)";
    const snippet = text.slice(0, 200).replace(/\s+/g, " ").trim();
    return {
      ok: false,
      error: `HTTP ${status}: response is not valid JSON (${ctLabel}). Body snippet: ${snippet}`,
    };
  }

  let jsonText = JSON.stringify(parsed);
  // Non-2xx with a parseable JSON body: surface status + Content-Type so an
  // API error is not mistaken for a success. The prefix is OUTSIDE the JSON.
  if (status < 200 || status >= 300) {
    const ct = headers.get("content-type");
    const ctLabel = ct ? ` (${ct})` : "";
    jsonText = `> HTTP ${status}${ctLabel}\n${jsonText}`;
  }
  if (jsonText.length <= MAX_RETURN_CHARS) {
    return { ok: true, text: jsonText };
  }
  const budget = Math.max(0, MAX_RETURN_CHARS - JSON_TRUNCATION_MARKER.length);
  return { ok: true, text: `${jsonText.slice(0, budget)}${JSON_TRUNCATION_MARKER}` };
}

/**
 * Core article fetch returning `{ text, ok }` so the windowing cache can skip
 * errors — a cached error string would poison subsequent windows for the TTL,
 * and a concurrent last-write-wins could cache failure over success. The public
 * {@link fetchOneArticle} wrapper preserves the string-only return shape that
 * existing callers and tests depend on.
 *
 * Reuses {@link MAX_PDF_BYTES} for the HTML cap in v1 (25 MB is generous for
 * doc pages; a dedicated HTML cap can be split out later if needed). Non-2xx
 * responses short-circuit to an inline error — error pages are usually HTML
 * templates with no real article, and feeding them to Readability would
 * produce misleading "extraction succeeded" output.
 */
async function fetchOneArticleResult(
  url: string,
  signal?: AbortSignal,
): Promise<{ text: string; ok: boolean }> {
  try {
    assertSafeFetchUrl(url);
  } catch (err) {
    return { text: `[article fetch error for ${url}: SSRF rejected: ${(err as Error).message}]`, ok: false };
  }
  let result: FetchBoundedResult;
  try {
    result = await fetchBounded(url, MAX_PDF_BYTES, signal);
  } catch (err) {
    return { text: `[article fetch error for ${url}: ${(err as Error).message}]`, ok: false };
  }
  if (result.status < 200 || result.status >= 300) {
    return { text: `[article fetch error for ${url}: HTTP ${result.status}]`, ok: false };
  }
  const html = new TextDecoder("utf-8").decode(new Uint8Array(result.body));
  // extractArticle already prefixes the fallback marker when distillation
  // fails, so we pass `markdown` straight through without re-marking. A
  // fallback is still a SUCCESSFUL fetch (real, if lower-quality, content),
  // so it is cached like any other result.
  const { markdown } = extractArticle(html, url);
  return { text: markdown, ok: true };
}

/**
 * Fetch one URL in article-extraction mode: bounded raw-HTML fetch → UTF-8
 * decode → {@link extractArticle}. SSRF rejection, byte-cap overflow, and HTTP
 * errors are returned as inline `[article fetch error ...]` strings so a batch
 * with one bad URL doesn't sink the rest (per-URL isolation, matching
 * {@link fetchOneJson} and the existing PDF/HTML error wrapping). Thin wrapper
 * over {@link fetchOneArticleResult}; see that for the full contract.
 */
export async function fetchOneArticle(url: string, signal?: AbortSignal): Promise<string> {
  return (await fetchOneArticleResult(url, signal)).text;
}

/**
 * Core JSON/API fetch returning `{ text, ok }` so the windowing cache can skip
 * errors (a cached parse failure would be served to later windows for the TTL).
 * The public {@link fetchOneJson} wrapper preserves the string-only return shape
 * that existing callers and tests depend on.
 */
async function fetchOneJsonResult(
  url: string,
  signal?: AbortSignal,
): Promise<{ text: string; ok: boolean }> {
  try {
    assertSafeFetchUrl(url);
  } catch (err) {
    return { text: `[JSON fetch error for ${url}: SSRF rejected: ${(err as Error).message}]`, ok: false };
  }
  let result: FetchBoundedResult;
  try {
    result = await fetchBounded(url, MAX_JSON_BYTES, signal);
  } catch (err) {
    return { text: `[JSON fetch error for ${url}: ${(err as Error).message}]`, ok: false };
  }
  const outcome = parseJsonBody(result);
  return outcome.ok ? { text: outcome.text, ok: true } : { text: `[JSON fetch error for ${url}: ${outcome.error}]`, ok: false };
}

/**
 * Fetch one URL in JSON/API mode. SSRF rejection, byte-cap overflow, and parse
 * failures are returned as inline `[JSON fetch error ...]` strings so a batch
 * with one bad URL doesn't sink the rest (per-URL isolation, matching the
 * existing PDF/HTML error wrapping in fetch_content). Thin wrapper over
 * {@link fetchOneJsonResult}; see that for the full contract.
 */
export async function fetchOneJson(url: string, signal?: AbortSignal): Promise<string> {
  return (await fetchOneJsonResult(url, signal)).text;
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
  // Windowing cache: closure-scoped (like hub/currentRegistry), NOT module scope,
  // so each extension instance — and therefore each test's fresh `makePi()` — gets
  // an isolated cache that never leaks across cases. Reset on session_shutdown
  // alongside hub. The cache is a transparent internal optimization; callers
  // never name it (see feature-zai-fetch-content-paging design decisions).
  let pageCache = new PageCache();

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
    const result = await fetchBounded(url, MAX_PDF_BYTES, signal);
    // fetchBounded no longer throws on non-2xx; preserve today's PDF behavior
    // by checking status here and throwing the identical `HTTP <status>` message.
    if (result.status < 200 || result.status >= 300) {
      throw new Error(`HTTP ${result.status}`);
    }
    const out = await pdfBufferToMarkdown(new Uint8Array(result.body), { source: url });
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
    const wantJson = params.return_format === "json";
    const wantArticle = params.extract === "article";
    // json + article is a config error: json fetches the URL and returns
    // parsed JSON; article fetches raw HTML and returns extracted markdown.
    // They consume the same precedence slot and can't both win — fail fast
    // with a clear message instead of silently picking one.
    if (wantJson && wantArticle) {
      return {
        content: [
          {
            type: "text",
            text: 'return_format: "json" and extract: "article" are mutually exclusive. Use return_format: "json" for REST/JSON API endpoints, or extract: "article" to strip boilerplate from an HTML doc page.',
          },
        ],
        isError: true,
      };
    }
    // webReader format is used by the PDF-fallback webReader call and the
    // HTML/webReader path. JSON mode ignores it (it returns parsed JSON).
    const returnFormat = params.return_format === "text" ? "text" : "markdown";

    // Per-URL fetch returning { text, ok }. The existing fetchOne collapsed
    // backend errors into ordinary strings (`[webReader error…]`, `[article
    // fetch error…]`, `[fetch failed…]`); surfacing `ok` lets the windowing path
    // cache ONLY successful fetches — a cached error would poison subsequent
    // windows for the TTL. On `!ok` the windowing path returns the inline-error
    // text WITHOUT caching, preserving today's per-URL error isolation. The
    // batch path consumes `.text`, which is byte-identical to today's fetchOne
    // return, so batch behavior is unchanged.
    const fetchOneForWindow = async (url: string): Promise<{ text: string; ok: boolean }> => {
      // PDF → local provider-free extraction (with SSRF + size guards); on
      // local failure (e.g. a .pdf URL that is actually HTML), fall through to
      // webReader so a false-positive heuristic doesn't strand the URL.
      // PDF precedence wins over return_format: "json" — today's URL-type
      // routing is preserved.
      if (looksLikePdfUrl(url)) {
        try {
          return { text: await fetchOnePdf(url, signal), ok: true };
        } catch (err) {
          // Local extraction failed — try webReader as a fallback.
          try {
            const args2: Record<string, unknown> = { url, return_format: returnFormat, retain_images: false, with_links_summary: false, with_images_summary: false };
            const res2 = await getHub(ctx).call("web-reader", "webReader", args2, signal);
            // The fallback produced content: cacheable only when webReader itself
            // did not error. The prefixed note preserves today's text shape.
            return { text: `[local PDF extraction failed (${(err as Error).message}); webReader fallback]:\n${res2.text}`, ok: !res2.isError };
          } catch (err2) {
            return { text: `[fetch failed for ${url}: local=${(err as Error).message}; webReader=${(err2 as Error).message}]`, ok: false };
          }
        }
      }
      // JSON/API direct fetch (with SSRF + 5 MB size guards). Takes precedence
      // over the HTML/webReader path so a JSON request returns parsed JSON,
      // not a rendered-docs dump. Per-URL isolated errors so a batch with one
      // bad URL doesn't sink the rest.
      if (wantJson) {
        return await fetchOneJsonResult(url, signal);
      }
      // Article extraction (raw HTML fetch + readability + turndown). Strips
      // nav/sidebars/footers from noisy doc pages. Per-URL isolated errors.
      // Ignored for PDFs (handled above) and JSON mode (handled above +
      // rejected up front as mutually exclusive).
      if (wantArticle) {
        return await fetchOneArticleResult(url, signal);
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
        return res.isError ? { text: `[webReader error for ${url}:\n${res.text}]`, ok: false } : { text: res.text, ok: true };
      } catch (err) {
        return { text: `[webReader failed for ${url}: ${(err as Error).message}]`, ok: false };
      }
    };

    // Windowable follows the EFFECTIVE route, not the raw wantJson flag. PDF
    // URL precedence wins over return_format:"json" in fetchOneForWindow (a
    // PDF+json call returns PDF markdown), so a PDF URL with json IS windowable.
    // Excluded: only the effective JSON direct-fetch path (single-URL,
    // non-PDF, wantJson) and multi-URL batches (handled below).
    const windowable = urls.length === 1 && !(wantJson && !looksLikePdfUrl(urls[0]));

    if (windowable) {
      const maxChars = clampMaxChars(params.max_chars);
      const contentBudget = maxChars - RESERVED_OVERHEAD;
      // Narrow the untyped params.window once, so spec construction and the
      // explicit-window check both read from a typed shape (params is
      // Record<string, unknown>; nested access would otherwise be on unknown).
      const windowParam = params.window as { start_line?: number; line_count?: number } | undefined;
      const spec: WindowSpec = {
        start_line: windowParam?.start_line,
        line_count: windowParam?.line_count,
      };
      const explicitWindow = windowParam != null;
      const key = cacheKey(urls[0], {
        return_format: typeof params.return_format === "string" ? params.return_format : undefined,
        extract: typeof params.extract === "string" ? params.extract : undefined,
      });

      let cacheHit = true;
      let blob = pageCache.get(key);
      if (!blob) {
        cacheHit = false;
        const r = await fetchOneForWindow(urls[0]);
        if (!r.ok) {
          // Failed fetch: return the inline-error text WITHOUT caching, so a
          // later same-URL call re-fetches rather than serving a cached error.
          // `truncate` mirrors today's single-URL error path (a no-op for the
          // short error strings, but kept for byte-for-byte fidelity).
          return {
            content: [{ type: "text", text: truncate(r.text) || "(no content)" }],
            details: { urls, windowed: false, window_ignored_reason: "fetch_error", cache_hit: false },
          };
        }
        // total_lines is informational metadata; applyWindow recomputes the
        // VIRTUAL line count (after wrapping overlong lines) from `text`, so
        // this raw split count is not used for windowing — stored cheaply to
        // satisfy the CachedBlob shape.
        blob = {
          text: r.text,
          total_lines: r.text === "" ? 0 : r.text.split("\n").length,
          fetchedAt: Date.now(),
        };
        // PageCache refuses oversize blobs (never leaves the cache over budget);
        // the blob is still served for THIS call via `w` below.
        pageCache.set(key, blob);
      }

      const w = applyWindow(blob.text, spec, contentBudget);
      // Exact backward-compat for implicit fitting calls: when the caller
      // supplied NO window AND the whole content fits in one window, return the
      // text EXACTLY as today — no footer, no window metadata in the text.
      // (Today's single-URL sub-cap path returns truncate(body), a no-op under
      // the cap; this preserves it byte-for-byte.)
      const fitsWhole =
        !w.past_end &&
        w.returned.start === 1 &&
        w.returned.end === w.total_lines &&
        !w.truncated_by_char_ceiling;
      const showFooter = explicitWindow || !fitsWhole;
      const footer = showFooter ? windowFooter(w) : "";
      const text = w.past_end ? footer : footer ? `${w.text}\n\n${footer}` : w.text;
      return {
        content: [{ type: "text", text }],
        details: {
          urls,
          windowed: true,
          total_lines: w.total_lines,
          returned: w.returned,
          next_start_line: w.returned.end + 1,
          has_more: w.returned.end < w.total_lines,
          past_end: w.past_end,
          truncated_by_char_ceiling: w.truncated_by_char_ceiling,
          cache_hit: cacheHit,
          requested: spec,
          max_chars: maxChars,
        },
      };
    }

    // Batch (urls.length > 1) or effective-JSON single-URL: windowing does NOT
    // apply. Slicing compacted JSON mid-structure yields broken fragments, and
    // a multi-URL batch is a joined doc — both keep today's head-truncate at
    // MAX_RETURN_CHARS. window + max_chars are ignored; details reports why.
    try {
      const results = await Promise.all(urls.map(async (u) => (await fetchOneForWindow(u)).text));
      const body =
        urls.length === 1
          ? results[0]
          : results
              .map((text, i) => `## ${urls[i]}\n\n${text}`)
              .join("\n\n---\n\n");
      return {
        content: [{ type: "text", text: truncate(body) || "(no content)" }],
        details: {
          urls,
          server: "web-reader",
          pdfUsed: urls.some(looksLikePdfUrl),
          jsonMode: wantJson,
          articleMode: wantArticle,
          windowed: false,
          window_ignored_reason: urls.length > 1 ? "batch" : "json",
        },
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
      "Fetch and extract readable content from one or more URLs. Defaults to Z.ai webReader markdown for web pages; PDFs are extracted locally; JSON/API endpoints can be fetched directly with return_format:'json'; noisy docs pages can use extract:'article'. Long single-URL text content (markdown/text/article/PDF) is windowed: the first call returns the first ~500 lines plus a footer with the next start line; pass window:{start_line} to continue from a cached blob. JSON and multi-URL batches are not windowed.",
    promptSnippet: "Fetch/extract URL content (web pages, PDFs, JSON APIs, article mode)",
    promptGuidelines: [
      "Use fetch_content to read a page in full after web_search, or to ingest a doc/PDF/API URL the user provided.",
      "Long single-URL text content (markdown/text/article/PDF) is windowed, not head-truncated. The first call returns the first ~500 lines plus a footer like '…[window: lines 1–500 of 1340 · request line 501 to continue]'; pass window:{start_line: 501} to continue. The fetched blob is cached, so advancing does not re-fetch. Read details.next_start_line (the structured source of truth) rather than parsing the footer.",
      "max_chars (default 30000, clamped to [1000, 120000]) is the total per-call budget for text + footer. Raise it only when a window is being cut mid-thought and the larger budget is justified; if a window still exceeds it, trailing lines are dropped (details.truncated_by_char_ceiling) and you continue with window:{start_line}.",
      "Use return_format:'json' for REST/JSON API endpoints such as model lists, version metadata, or config schemas — it bypasses webReader and returns parsed JSON.",
      "Use extract:'article' when a docs page returns too much navigation, sidebar, or footer noise; do not combine it with return_format:'json'.",
      "PDFs (by .pdf URL) are extracted locally — no provider needed. PDF URL routing wins over json/article options.",
      "Pass urls (an array) to fetch several at once; mode options apply to the whole batch, so keep JSON batches homogeneous. Batches and return_format:'json' direct fetches are not windowed — they keep the head-truncate behavior.",
    ],
    parameters: obj({
      url: str("A single URL to fetch."),
      urls: { type: "array", items: { type: "string" }, description: "Multiple URLs to fetch in parallel (max 20)." },
      return_format: strEnum(
        ["markdown", "text", "json"],
        "Output format. markdown/text route through Z.ai webReader; json fetches the URL directly and returns parsed JSON (use for REST/JSON API endpoints). PDFs always return markdown regardless of this setting.",
      ),
      prompt: str("Optional note framing what you want from the content (accepted for drop-in compatibility; not sent to Z.ai)."),
      extract: strEnum(
        ["full", "article"],
        'For HTML pages, "full" (default) returns the whole webReader output; "article" fetches raw HTML directly, strips nav/sidebars/footers via readability, and returns markdown. Ignored for PDF URLs and for return_format: "json".',
      ),
      window: obj({
        start_line: num("1-indexed line to start the window at (default 1). Pass next_start_line from a prior call's details to continue. The fetched blob is cached, so advancing does not re-fetch."),
        line_count: num("Number of lines to return in this window (default 500)."),
      }, []),
      max_chars: num("Total char budget for the returned text + footer (default 30000, clamped to [1000, 120000]). If a window exceeds it, trailing lines are dropped at a line boundary (details.truncated_by_char_ceiling) and you continue with window:{start_line}."),
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
    // Drop the windowing cache too — a new session must not serve stale blobs
    // from the previous one. Reassign (PageCache has no clear()) so any
    // in-flight reference style stays valid while the closure starts fresh.
    pageCache = new PageCache();
  });
}
