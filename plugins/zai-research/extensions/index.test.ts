import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { truncate, assertSafeFetchUrl, fetchBounded, parseJsonBody, fetchOneJson, fetchOneArticle, clampMaxChars } from "./index";
import { extractArticle, ARTICLE_FALLBACK_MARKER } from "./article";
import zaiResearchExtension from "./index";
import { looksLikePdfUrl } from "./pdf";

const FIXTURES_DIR = join(import.meta.dir, "test", "fixtures");

describe("truncate (keeps the HEAD)", () => {
  test("returns text unchanged when under the cap", () => {
    expect(truncate("short", 100)).toBe("short");
  });

  test("keeps the lead, not the tail, and marks the truncation", () => {
    const long = "HEAD-START " + "x".repeat(500) + " TAIL-END";
    const out = truncate(long, 200);
    expect(out).toContain("HEAD-START"); // lead kept
    expect(out).not.toContain("TAIL-END"); // tail dropped
    expect(out).toMatch(/truncated/);
  });

  test("never exceeds the cap (marker accounted for)", () => {
    const out = truncate("x".repeat(100_000), 1000);
    expect(out.length).toBeLessThanOrEqual(1000);
  });

  test("clamps the marker underflow case (tiny max)", () => {
    const out = truncate("abcdefghij", 5);
    // budget = max(0, 5 - marker.length) = 0; returns just the marker, <= max.
    expect(out.length).toBeLessThanOrEqual(5 + 200); // generous: marker text
    expect(out).toMatch(/truncated/);
  });
});

describe("assertSafeFetchUrl (SSRF guard)", () => {
  test("accepts http and https to public hosts", () => {
    expect(() => assertSafeFetchUrl("https://arxiv.org/pdf/1706.03762")).not.toThrow();
    expect(() => assertSafeFetchUrl("http://example.com/doc.pdf")).not.toThrow();
  });

  test.each([
    ["file:///etc/passwd", "non-http"],
    ["ftp://example.com/x", "non-http"],
  ] as const)("rejects non-http(s) schemes: %s", (url) => {
    expect(() => assertSafeFetchUrl(url)).toThrow(/scheme/);
  });

  test.each([
    ["http://localhost/admin.pdf", "localhost"],
    ["http://127.0.0.1/", "loopback v4"],
    ["http://169.254.169.254/latest/meta-data/", "link-local metadata"],
    ["http://10.0.0.1/", "private 10.x"],
    ["http://192.168.1.1/", "private 192.168"],
    ["http://172.16.0.1/", "private 172.16"],
    ["http://172.31.255.255/", "private 172.31"],
    ["http://[::1]/", "loopback v6"],
    ["http://[::ffff:127.0.0.1]/", "IPv4-mapped loopback"],
    ["http://[::ffff:169.254.169.254]/", "IPv4-mapped link-local"],
    ["http://[::ffff:10.0.0.1]/", "IPv4-mapped private 10.x"],
  ] as const)("rejects private/loopback/link-local hosts: %s (%s)", (url) => {
    expect(() => assertSafeFetchUrl(url)).toThrow();
  });

  test("rejects an invalid URL", () => {
    expect(() => assertSafeFetchUrl("not a url")).toThrow(/invalid URL/);
  });
});

// --- JSON/API mode -------------------------------------------------------

// Build a fetch result shape directly, for pure parseJsonBody tests.
function jsonResult(opts: {
  status?: number;
  contentType?: string;
  headers?: Record<string, string>;
  body: string | Uint8Array | ArrayBuffer;
}) {
  const { status = 200, contentType, headers = {}, body } = opts;
  const h = new Headers(headers);
  if (contentType) h.set("content-type", contentType);
  const buf = body instanceof ArrayBuffer ? body : typeof body === "string" ? new TextEncoder().encode(body) : body;
  return { status, headers: h, body: buf.buffer };
}

describe("parseJsonBody", () => {
  test("renders compact JSON for a 2xx body (happy path: just the JSON)", () => {
    const out = parseJsonBody(jsonResult({
      status: 200,
      contentType: "application/json",
      body: '{"b":2,"a":1}',
    }));
    expect(out.ok).toBe(true);
    if (out.ok) {
      expect(out.text).toBe('{"b":2,"a":1}');
    }
  });

  test("surfaces BOTH status and body when 4xx carries a JSON error body", () => {
    const out = parseJsonBody(jsonResult({
      status: 404,
      contentType: "application/json",
      body: '{"error":"model not found"}',
    }));
    expect(out.ok).toBe(true);
    if (out.ok) {
      expect(out.text).toContain("HTTP 404");
      expect(out.text).toContain('"error":"model not found"');
    }
  });

  test("a non-JSON (HTML) body returns a structured error mentioning Content-Type + status + snippet", () => {
    const out = parseJsonBody(jsonResult({
      status: 200,
      contentType: "text/html; charset=utf-8",
      body: "<html><body><h1>Not Found</h1></body></html>",
    }));
    expect(out.ok).toBe(false);
    if (!out.ok) {
      expect(out.error).toContain("HTTP 200");
      expect(out.error).toContain("text/html");
      expect(out.error).toMatch(/not valid JSON/);
      expect(out.error).toContain("<html>");
    }
  });

  test("an empty body returns a clear 'empty body' error (not a generic parse error)", () => {
    const out = parseJsonBody(jsonResult({
      status: 200,
      contentType: "application/json",
      body: "",
    }));
    expect(out.ok).toBe(false);
    if (!out.ok) {
      expect(out.error).toMatch(/empty body/i);
      expect(out.error).toContain("HTTP 200");
    }
  });

  test("a whitespace-only body is treated as empty", () => {
    const out = parseJsonBody(jsonResult({
      status: 204,
      contentType: "application/json",
      body: "   \n\t  ",
    }));
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.error).toMatch(/empty body/i);
  });

  test("strips a leading UTF-8 BOM before parsing", () => {
    const body = new Uint8Array([0xef, 0xbb, 0xbf, ...new TextEncoder().encode('{"ok":true}')]);
    const out = parseJsonBody(jsonResult({
      status: 200,
      contentType: "application/json",
      body,
    }));
    expect(out.ok).toBe(true);
    if (out.ok) expect(out.text).toContain('"ok":true');
  });

  test("omitted Content-Type on a parse failure is reported as (unknown)", () => {
    const out = parseJsonBody(jsonResult({
      status: 200,
      body: "not json at all",
    }));
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.error).toContain("Content-Type: (unknown)");
  });

  test("large JSON exceeding the return cap is truncated with an external marker (invalid JSON)", () => {
    // Build a JSON body whose compact form clearly exceeds 60_000 chars.
    const obj: Record<string, string> = {};
    for (let i = 0; i < 2000; i++) obj[`key_${i}`] = "x".repeat(60);
    const body = JSON.stringify(obj);
    expect(body.length).toBeGreaterThan(60_000); // sanity
    const out = parseJsonBody(jsonResult({
      status: 200,
      contentType: "application/json",
      body,
    }));
    expect(out.ok).toBe(true);
    if (out.ok) {
      expect(out.text.length).toBeLessThanOrEqual(60_000);
      // The marker is appended OUTSIDE the JSON and signals incompleteness.
      expect(out.text).toMatch(/truncated by zai-research.*incomplete/);
      // The truncated text is not valid JSON: the marker sits after a partial structure.
      expect(() => JSON.parse(out.text)).toThrow();
    }
  });
});

// Save/restore the real fetch so mocked fetches stay scoped to their test.
async function withMockedFetch(fn: typeof globalThis.fetch, fn2: () => Promise<void>): Promise<void> {
  const original = globalThis.fetch;
  globalThis.fetch = fn;
  try {
    await fn2();
  } finally {
    globalThis.fetch = original;
  }
}

describe("fetchBounded", () => {
  test("returns status + headers + body and does NOT throw on non-2xx", async () => {
    await withMockedFetch(
      (() =>
        Promise.resolve(
          new Response('{"err":true}', {
            status: 503,
            headers: { "content-type": "application/json" },
          }),
        )) as typeof globalThis.fetch,
      async () => {
        const result = await fetchBounded("https://example.com/x", 1_000_000);
        expect(result.status).toBe(503);
        expect(result.headers.get("content-type")).toBe("application/json");
        expect(new TextDecoder().decode(result.body)).toBe('{"err":true}');
      },
    );
  });

  test("stream-caps the body at maxBytes and rejects oversized responses", async () => {
    await withMockedFetch(
      (() => {
        // Lazy 1KB/chunk stream — fetchBounded must cancel once total > maxBytes.
        const stream = new ReadableStream<Uint8Array>({
          pull(controller) {
            controller.enqueue(new Uint8Array(1024).fill(0x61));
          },
        });
        return Promise.resolve(new Response(stream, { status: 200 }));
      }) as typeof globalThis.fetch,
      async () => {
        await expect(fetchBounded("https://example.com/big", 4000)).rejects.toThrow(
          /exceeds 4000 byte cap/,
        );
      },
    );
  });

  test("re-runs SSRF guard on every redirect Location", async () => {
    let fetchCount = 0;
    await withMockedFetch(
      ((input: string | URL | Request) => {
        fetchCount++;
        const url = typeof input === "string" ? input : (input as Request).url;
        if (url === "https://example.com/redirect-me") {
          return Promise.resolve(
            new Response("", {
              status: 302,
              headers: { location: "http://127.0.0.1/final" },
            }),
          );
        }
        return Promise.resolve(new Response('{"ok":true}', { status: 200 }));
      }) as typeof globalThis.fetch,
      async () => {
        await expect(fetchBounded("https://example.com/redirect-me", 1_000_000)).rejects.toThrow(
          /private|loopback|link-local/,
        );
        expect(fetchCount).toBe(1); // never followed the redirect to the private IP
      },
    );
  });

  test("follows safe redirects up to a limit", async () => {
    let fetchCount = 0;
    await withMockedFetch(
      ((input: string | URL | Request) => {
        fetchCount++;
        const url = typeof input === "string" ? input : (input as Request).url;
        if (url === "https://example.com/a") {
          return Promise.resolve(new Response("", { status: 302, headers: { location: "/b" } }));
        }
        if (url === "https://example.com/b") {
          return Promise.resolve(new Response("", { status: 302, headers: { location: "/c" } }));
        }
        return Promise.resolve(new Response('{"final":true}', { status: 200 }));
      }) as typeof globalThis.fetch,
      async () => {
        const result = await fetchBounded("https://example.com/a", 1_000_000);
        expect(result.status).toBe(200);
        expect(new TextDecoder().decode(result.body)).toBe('{"final":true}');
        expect(fetchCount).toBe(3);
      },
    );
  });
});

describe("extractArticle", () => {
  test("extracts the real article from a noisy docs fixture", async () => {
    const html = await readFile(join(FIXTURES_DIR, "noisy-docs.html"), "utf-8");
    const { markdown, fallback } = extractArticle(html, "https://example.com/docs/pipeline");
    expect(fallback).toBe(false);
    expect(markdown).toContain("ARTICLE CANARY PHRASE 777");
    expect(markdown).not.toContain("FOOTER_NOISE_MARK");
    expect(markdown).not.toContain("Try Acme Pro free!");
    expect(markdown).toContain("Overview");
  });

  test("falls back to full-page text when no article is identified", async () => {
    const html = await readFile(join(FIXTURES_DIR, "no-article.html"), "utf-8");
    const { markdown, fallback } = extractArticle(html);
    expect(fallback).toBe(true);
    expect(markdown.startsWith(ARTICLE_FALLBACK_MARKER)).toBe(true);
    expect(markdown).toContain("Sign in");
    expect(markdown).toContain("Forgot password?");
  });

  test("fallback plain text strips script and style content", () => {
    const html = `
      <html><body>
        <script>window.SECRET_NOISE = 1;</script>
        <style>.hidden { display: none; }</style>
        <p>REAL_BODY_CANARY</p>
      </body></html>
    `;
    const { markdown, fallback } = extractArticle(html);
    expect(fallback).toBe(true);
    expect(markdown).toContain("REAL_BODY_CANARY");
    expect(markdown).not.toContain("SECRET_NOISE");
    expect(markdown).not.toContain("display: none");
  });

  test("falls back when readability latches onto a small non-content block", async () => {
    const html = await readFile(join(FIXTURES_DIR, "false-positive.html"), "utf-8");
    const { markdown, fallback } = extractArticle(html);
    expect(fallback).toBe(true);
    expect(markdown).toContain("REAL_CONTENT_CANARY_999");
  });

  test("handles malformed HTML without throwing", () => {
    const { markdown } = extractArticle("<<<not html>>>");
    expect(markdown.length).toBeGreaterThan(0);
  });
});

describe("fetchOneArticle (article mode)", () => {
  test("returns extracted article markdown on success", async () => {
    const html = await readFile(join(FIXTURES_DIR, "noisy-docs.html"), "utf-8");
    await withMockedFetch(
      (() =>
        Promise.resolve(
          new Response(html, {
            status: 200,
            headers: { "content-type": "text/html; charset=utf-8" },
          }),
        )) as typeof globalThis.fetch,
      async () => {
        const out = await fetchOneArticle("https://example.com/docs/pipeline");
        expect(out).toContain("ARTICLE CANARY PHRASE 777");
        expect(out).not.toContain("FOOTER_NOISE_MARK");
        expect(out).not.toContain(ARTICLE_FALLBACK_MARKER);
      },
    );
  });

  test("returns an inline SSRF error without calling fetch", async () => {
    let calls = 0;
    await withMockedFetch(
      (() => {
        calls++;
        return Promise.resolve(new Response(""));
      }) as typeof globalThis.fetch,
      async () => {
        const out = await fetchOneArticle("http://127.0.0.1/page");
        expect(calls).toBe(0);
        expect(out).toMatch(/article fetch error/);
        expect(out).toMatch(/SSRF rejected/);
      },
    );
  });

  test("returns an inline error on HTTP error status", async () => {
    await withMockedFetch(
      (() =>
        Promise.resolve(
          new Response("<html>error</html>", { status: 502, headers: { "content-type": "text/html" } }),
        )) as typeof globalThis.fetch,
      async () => {
        const out = await fetchOneArticle("https://example.com/down");
        expect(out).toMatch(/article fetch error/);
        expect(out).toContain("HTTP 502");
      },
    );
  });
});

describe("fetch_content routing (registered tool)", () => {
  function makePi() {
    const tools: Array<{ name: string; parameters: unknown }> = [];
    const api = {
      registerTool: (def: { name: string; parameters: unknown }) => tools.push(def),
      on: () => {},
    };
    zaiResearchExtension(api as unknown as Parameters<typeof zaiResearchExtension>[0]);
    return { fetch_content: tools.find((t) => t.name === "fetch_content")! };
  }

  test("schema includes json return_format and extract params", () => {
    const { fetch_content } = makePi();
    const params = fetch_content.parameters as {
      properties: Record<string, { enum?: string[]; description?: string }>;
    };
    expect(params.properties.return_format.enum).toContain("json");
    expect(params.properties.extract.enum).toContain("article");
  });

  test("registered fetch_content rejects return_format json + extract article as an error", async () => {
    const { fetch_content } = makePi();
    const result = await fetch_content.execute(
      "id",
      { url: "https://example.com/docs", return_format: "json", extract: "article" },
      undefined,
      undefined,
      {},
    );
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toMatch(/mutually exclusive/);
  });

  test("registered fetch_content ignores extract article for PDF URLs (PDF path wins)", async () => {
    const { fetch_content } = makePi();
    await withMockedFetch(
      (() => Promise.resolve(new Response("", { status: 404 }))) as typeof globalThis.fetch,
      async () => {
        const result = await fetch_content.execute(
          "id",
          { url: "https://example.com/doc.pdf", extract: "article" },
          undefined,
          undefined,
          {},
        );
        // The PDF/local path wins and falls back to webReader; article mode is
        // not invoked even though extract:"article" was requested.
        expect(result.content[0].text).not.toMatch(/article fetch error/);
        expect(result.content[0].text).toMatch(/local=HTTP 404/);
      },
    );
  });
});

describe("fetchOneJson (JSON/API mode)", () => {
  test("returns compact JSON on a 2xx success", async () => {
    await withMockedFetch(
      (() =>
        Promise.resolve(
          new Response('{"b":2,"a":1}', {
            status: 200,
            headers: { "content-type": "application/json" },
          }),
        )) as typeof globalThis.fetch,
      async () => {
        const out = await fetchOneJson("https://example.com/api");
        expect(out).toBe('{"b":2,"a":1}');
      },
    );
  });

  test("surfaces BOTH status and body on a 4xx JSON error response", async () => {
    await withMockedFetch(
      (() =>
        Promise.resolve(
          new Response('{"error":"nope"}', {
            status: 404,
            headers: { "content-type": "application/json" },
          }),
        )) as typeof globalThis.fetch,
      async () => {
        const out = await fetchOneJson("https://example.com/missing");
        expect(out).toContain("HTTP 404");
        expect(out).toContain('"error":"nope"');
      },
    );
  });

  test("returns a structured error mentioning Content-Type for a non-JSON (HTML) response", async () => {
    await withMockedFetch(
      (() =>
        Promise.resolve(
          new Response("<html>nope</html>", {
            status: 200,
            headers: { "content-type": "text/html" },
          }),
        )) as typeof globalThis.fetch,
      async () => {
        const out = await fetchOneJson("https://example.com/html");
        expect(out).toMatch(/JSON fetch error/);
        expect(out).toContain("text/html");
      },
    );
  });

  test("returns a clear 'empty body' error for an empty response", async () => {
    await withMockedFetch(
      (() =>
        Promise.resolve(
          new Response("", { status: 200, headers: { "content-type": "application/json" } }),
        )) as typeof globalThis.fetch,
      async () => {
        const out = await fetchOneJson("https://example.com/empty");
        expect(out).toMatch(/JSON fetch error/);
        expect(out).toMatch(/empty body/i);
      },
    );
  });

  test("strips a leading UTF-8 BOM", async () => {
    const bodyBytes = new Uint8Array([0xef, 0xbb, 0xbf, ...new TextEncoder().encode('{"ok":true}')]);
    await withMockedFetch(
      (() =>
        Promise.resolve(
          new Response(bodyBytes, {
            status: 200,
            headers: { "content-type": "application/json" },
          }),
        )) as typeof globalThis.fetch,
      async () => {
        const out = await fetchOneJson("https://example.com/bom");
        expect(out).toContain('"ok":true');
      },
    );
  });

  test("rejects SSRF targets (loopback) without calling fetch", async () => {
    let calls = 0;
    await withMockedFetch(
      (() => {
        calls++;
        return Promise.resolve(new Response(""));
      }) as typeof globalThis.fetch,
      async () => {
        const out = await fetchOneJson("http://127.0.0.1/admin");
        expect(calls).toBe(0);
        expect(out).toMatch(/JSON fetch error/);
        expect(out).toMatch(/SSRF rejected/);
      },
    );
  });

  test("enforces the JSON byte cap and surfaces the overflow as an inline error", async () => {
    await withMockedFetch(
      (() => {
        // Lazy 1MB/chunk stream — exceeds MAX_JSON_BYTES (5 MB) after ~6 pulls,
        // then fetchBounded cancels the reader.
        const stream = new ReadableStream<Uint8Array>({
          pull(controller) {
            controller.enqueue(new Uint8Array(1024 * 1024).fill(0x61));
          },
        });
        return Promise.resolve(
          new Response(stream, { status: 200, headers: { "content-type": "application/json" } }),
        );
      }) as typeof globalThis.fetch,
      async () => {
        const out = await fetchOneJson("https://example.com/huge");
        expect(out).toMatch(/JSON fetch error/);
        expect(out).toMatch(/exceeds.*byte cap/);
      },
    );
  });
});

// --- Windowing wiring (Unit 2 of feature-zai-fetch-content-paging) ---------
//
// The windowing path is exercised through the registered fetch_content tool.
// webReader mode goes through the MCP hub, which these tests do NOT inject, so
// the testable seam is article mode (raw HTML via globalThis.fetch →
// fetchBounded) and PDF mode (local fetch → pdfBufferToMarkdown). JSON mode is
// covered for the IGNORE path (it never windows).

describe("clampMaxChars", () => {
  test("defaults to 30000 for undefined / null / non-numbers", () => {
    expect(clampMaxChars(undefined)).toBe(30_000);
    expect(clampMaxChars(null)).toBe(30_000);
    expect(clampMaxChars("5000")).toBe(30_000);
    expect(clampMaxChars(NaN)).toBe(30_000);
    expect(clampMaxChars(Infinity)).toBe(30_000);
  });
  test("clamps below 1000 up to 1000", () => {
    expect(clampMaxChars(50)).toBe(1_000);
    expect(clampMaxChars(0)).toBe(1_000);
    expect(clampMaxChars(-5)).toBe(1_000);
    expect(clampMaxChars(999)).toBe(1_000);
  });
  test("clamps above 120000 down to 120000", () => {
    expect(clampMaxChars(999_999)).toBe(120_000);
    expect(clampMaxChars(1_000_000)).toBe(120_000);
    // >2^31: `| 0` would wrap negative and clamp to the floor (1000); Math.trunc
    // preserves the value so it clamps to the ceiling (120000).
    expect(clampMaxChars(3_000_000_000)).toBe(120_000);
    expect(clampMaxChars(Number.MAX_SAFE_INTEGER)).toBe(120_000);
  });
  test("passes through in-range values, floored toward zero", () => {
    expect(clampMaxChars(5_000)).toBe(5_000);
    expect(clampMaxChars(30_000)).toBe(30_000);
    expect(clampMaxChars(120_000)).toBe(120_000);
    expect(clampMaxChars(5_000.9)).toBe(5_000);
  });
});

// Build an HTML page whose extracted article is the given paragraphs (one per
// line), large enough to clear the MIN_ARTICLE_CHARS floor so extractArticle
// doesn't fall back. Turndown renders <p> as paragraphs separated by blank
// lines, so each paragraph becomes its own markdown line group.
function articleHtml(paragraphs: string[]): string {
  const body = paragraphs.map((p) => `      <p>${p}</p>`).join("\n");
  return `<!doctype html>
<html><head><title>Doc</title></head>
<body>
    <nav><a href="/">Home</a> | <a href="/blog">Blog</a></nav>
    <main>
      <h1>Article Title</h1>
${body}
    </main>
    <footer>FOOTER_NOISE_MARK do not want this</footer>
</body></html>`;
}

// A registered-tool pi that captures fetch_content with a typed execute. Each
// call builds a fresh extension → fresh closure-scoped pageCache, so cases never
// share cache state. (The session_shutdown reset path is exercised separately.)
function makeWindowingPi() {
  const tools: Array<{
    name: string;
    parameters: unknown;
    execute: (
      id: string,
      params: Record<string, unknown>,
      signal: AbortSignal | undefined,
      onUpdate: unknown,
      ctx: unknown,
    ) => Promise<{
      content: Array<{ type: "text"; text: string }>;
      details?: Record<string, unknown>;
      isError?: boolean;
    }>;
  }> = [];
  const api = {
    registerTool: (def: (typeof tools)[number]) => {
      tools.push(def);
    },
    on: () => {},
  };
  zaiResearchExtension(api as unknown as Parameters<typeof zaiResearchExtension>[0]);
  return { fetch_content: tools.find((t) => t.name === "fetch_content")! };
}

describe("fetch_content windowing schema", () => {
  test("parameters include window (start_line, line_count) and max_chars", () => {
    const { fetch_content } = makeWindowingPi();
    const params = fetch_content.parameters as {
      properties: Record<string, Record<string, unknown>>;
    };
    expect(params.properties.window).toBeDefined();
    expect((params.properties.window as { type: string }).type).toBe("object");
    const windowProps = (params.properties.window as { properties: Record<string, unknown> }).properties;
    expect(windowProps.start_line).toBeDefined();
    expect(windowProps.line_count).toBeDefined();
    expect((params.properties.max_chars as { type: string }).type).toBe("number");
  });

  // A full structural snapshot of the documented parameter surface. The presence
  // test above checks the windowing additions; this one pins the WHOLE shape
  // (every param key, the routing enums, the window sub-schema, and the
  // required arrays) so the SKILL.md docs and the registered schema cannot
  // silently drift apart. Adding or removing a param is an intentional schema
  // change — update this snapshot and the docs together.
  test("schema snapshot: full fetch_content parameter surface (regression guard for the docs)", () => {
    const { fetch_content } = makeWindowingPi();
    const params = fetch_content.parameters as {
      properties: Record<string, {
        type?: string;
        enum?: string[];
        properties?: Record<string, { type?: string }>;
        required?: string[];
      }>;
      required?: string[];
    };
    // Top-level property set — the documented parameter surface.
    expect(Object.keys(params.properties).sort()).toEqual(
      ["extract", "max_chars", "prompt", "return_format", "url", "urls", "window"],
    );
    // No param is hard-required at the schema level (url/urls are validated at runtime).
    expect(params.required ?? []).toEqual([]);
    // Routing enums pin the documented options.
    expect(params.properties.return_format?.enum).toEqual(["markdown", "text", "json"]);
    expect(params.properties.extract?.enum).toEqual(["full", "article"]);
    // window sub-schema: an object with start_line + line_count, nothing required.
    const window = params.properties.window;
    expect(window?.type).toBe("object");
    expect(Object.keys(window?.properties ?? {}).sort()).toEqual(["line_count", "start_line"]);
    expect(window?.properties?.start_line?.type).toBe("number");
    expect(window?.properties?.line_count?.type).toBe("number");
    expect(window?.required ?? []).toEqual([]);
    // max_chars is the per-call char budget (a number).
    expect(params.properties.max_chars?.type).toBe("number");
  });
});

describe("fetch_content windowing (article mode)", () => {
  test("no window + content fits budget → exact text, no footer (byte-for-byte today)", async () => {
    const html = articleHtml([
      "ARTICLE CANARY PHRASE 777 — the lead paragraph of a small doc.",
      "Second paragraph with enough body to clear the article floor.",
      "Third paragraph closes out a short, fitting document.",
    ]);
    const expected = extractArticle(html, "https://example.com/docs/fit").markdown;
    await withMockedFetch(
      (() => Promise.resolve(new Response(html, { status: 200, headers: { "content-type": "text/html; charset=utf-8" } }))) as typeof globalThis.fetch,
      async () => {
        const { fetch_content } = makeWindowingPi();
        const result = await fetch_content.execute("id", { url: "https://example.com/docs/fit", extract: "article" }, undefined, undefined, {});
        expect(result.details?.windowed).toBe(true);
        expect(result.details?.cache_hit).toBe(false);
        expect(result.details?.has_more).toBe(false);
        expect(result.content[0].text).toBe(expected); // byte-for-byte today
        expect(result.content[0].text).not.toMatch(/…\[window:/);
      },
    );
  });

  test("no window + >500 lines but under char budget → whole doc, no footer (char budget binds, not line count)", async () => {
    // >500 short paragraphs totaling well under the 30k char budget: for an
    // implicit call the CHAR BUDGET must bind, not the 500-line default —
    // otherwise this doc would be windowed to 500 lines + footer despite fitting.
    const paragraphs = Array.from({ length: 600 }, (_, i) => `Paragraph ${i + 1}.`);
    const html = articleHtml(paragraphs);
    const expected = extractArticle(html, "https://example.com/docs/many-short").markdown;
    // Guard: this test only proves the regression if the doc really is >500 lines.
    expect(expected.split("\n").length).toBeGreaterThan(500);
    await withMockedFetch(
      (() => Promise.resolve(new Response(html, { status: 200, headers: { "content-type": "text/html; charset=utf-8" } }))) as typeof globalThis.fetch,
      async () => {
        const { fetch_content } = makeWindowingPi();
        const result = await fetch_content.execute("id", { url: "https://example.com/docs/many-short", extract: "article" }, undefined, undefined, {});
        expect(result.details?.windowed).toBe(true);
        expect(result.details?.has_more).toBe(false);
        expect(result.content[0].text).toBe(expected); // whole doc, byte-for-byte
        expect(result.content[0].text).not.toMatch(/…\[window:/); // no footer
      },
    );
  });

  test("content over budget + no window → first window + footer; next_start_line + has_more set", async () => {
    // Each paragraph ~60 chars; 1000 paragraphs → ~60k markdown, well over the
    // 30k default budget. The article floor is cleared by total length.
    const paragraphs = Array.from({ length: 1000 }, (_, i) => `Paragraph number ${i + 1} with padding text to grow the body.`);
    const html = articleHtml(paragraphs);
    await withMockedFetch(
      (() => Promise.resolve(new Response(html, { status: 200, headers: { "content-type": "text/html; charset=utf-8" } }))) as typeof globalThis.fetch,
      async () => {
        const { fetch_content } = makeWindowingPi();
        const result = await fetch_content.execute("id", { url: "https://example.com/docs/long", extract: "article" }, undefined, undefined, {});
        const details = result.details!;
        expect(details.windowed).toBe(true);
        expect(details.has_more).toBe(true);
        expect(typeof details.next_start_line).toBe("number");
        expect(details.next_start_line as number).toBeGreaterThan(1);
        expect(result.content[0].text).toMatch(/…\[window: lines /);
        expect(result.content[0].text).toMatch(/to continue\]/);
      },
    );
  });

  test("second windowed call on the same URL is a cache hit (no globalThis.fetch)", async () => {
    const html = articleHtml([
      "ARTICLE CANARY PHRASE 777 — the lead paragraph of a small doc.",
      "Second paragraph with enough body to clear the article floor.",
      "Third paragraph closes out a short, fitting document.",
    ]);
    let fetchCalls = 0;
    const mock = (() => {
      fetchCalls++;
      return Promise.resolve(new Response(html, { status: 200, headers: { "content-type": "text/html; charset=utf-8" } }));
    }) as typeof globalThis.fetch;
    await withMockedFetch(mock, async () => {
      const { fetch_content } = makeWindowingPi();
      // First call: no window → cache miss → fetches.
      const first = await fetch_content.execute("id", { url: "https://example.com/docs/cached", extract: "article" }, undefined, undefined, {});
      expect(first.details?.cache_hit).toBe(false);
      expect(fetchCalls).toBe(1);
      // Second call: explicit window on the same URL/mode → cache hit → no fetch.
      const second = await fetch_content.execute("id", { url: "https://example.com/docs/cached", extract: "article", window: { start_line: 2 } }, undefined, undefined, {});
      expect(fetchCalls).toBe(1); // unchanged — served from cache
      expect(second.details?.cache_hit).toBe(true);
      expect(second.details?.windowed).toBe(true);
    });
  });

  test("a failed fetch is not cached: a later same-URL call re-fetches", async () => {
    let fetchCalls = 0;
    const mock = (() => {
      fetchCalls++;
      return Promise.resolve(new Response("<html>error</html>", { status: 502, headers: { "content-type": "text/html" } }));
    }) as typeof globalThis.fetch;
    await withMockedFetch(mock, async () => {
      const { fetch_content } = makeWindowingPi();
      const first = await fetch_content.execute("id", { url: "https://example.com/docs/down", extract: "article" }, undefined, undefined, {});
      expect(fetchCalls).toBe(1);
      expect(first.details?.windowed).toBe(false);
      expect(first.details?.window_ignored_reason).toBe("fetch_error");
      expect(first.details?.cache_hit).toBe(false);
      expect(first.content[0].text).toMatch(/article fetch error/);
      expect(first.content[0].text).toContain("HTTP 502");
      // Not cached → the second call must fetch again.
      const second = await fetch_content.execute("id", { url: "https://example.com/docs/down", extract: "article" }, undefined, undefined, {});
      expect(fetchCalls).toBe(2);
      expect(second.details?.cache_hit).toBe(false);
      expect(second.content[0].text).toMatch(/article fetch error/);
    });
  });

  test("max_chars clamps and the returned text + footer stays within the budget", async () => {
    const paragraphs = Array.from({ length: 1000 }, (_, i) => `Paragraph number ${i + 1} with padding text to grow the body.`);
    const html = articleHtml(paragraphs);
    await withMockedFetch(
      (() => Promise.resolve(new Response(html, { status: 200, headers: { "content-type": "text/html; charset=utf-8" } }))) as typeof globalThis.fetch,
      async () => {
        const { fetch_content } = makeWindowingPi();
        const result = await fetch_content.execute("id", { url: "https://example.com/docs/budget", extract: "article", max_chars: 5_000 }, undefined, undefined, {});
        const details = result.details!;
        expect(details.max_chars).toBe(5_000);
        expect(details.truncated_by_char_ceiling).toBe(true);
        expect(details.has_more).toBe(true);
        // text + footer ≤ max_chars (the total budget, footer reserved inside it).
        expect(result.content[0].text.length).toBeLessThanOrEqual(5_000);
      },
    );
  });

  test("max_chars out-of-range values are clamped in details.max_chars", async () => {
    const html = articleHtml(["Small article that fits any budget."]);
    const mock = (() => Promise.resolve(new Response(html, { status: 200, headers: { "content-type": "text/html; charset=utf-8" } }))) as typeof globalThis.fetch;
    await withMockedFetch(mock, async () => {
      const { fetch_content } = makeWindowingPi();
      const tooSmall = await fetch_content.execute("id", { url: "https://example.com/docs/a", extract: "article", max_chars: 50 }, undefined, undefined, {});
      expect(tooSmall.details?.max_chars).toBe(1_000);
      const tooBig = await fetch_content.execute("id", { url: "https://example.com/docs/b", extract: "article", max_chars: 999_999 }, undefined, undefined, {});
      expect(tooBig.details?.max_chars).toBe(120_000);
      const omitted = await fetch_content.execute("id", { url: "https://example.com/docs/c", extract: "article" }, undefined, undefined, {});
      expect(omitted.details?.max_chars).toBe(30_000);
    });
  });

  test("window past the end → footer-only past_end result", async () => {
    const html = articleHtml(["A small article with only a few lines of content."]);
    await withMockedFetch(
      (() => Promise.resolve(new Response(html, { status: 200, headers: { "content-type": "text/html; charset=utf-8" } }))) as typeof globalThis.fetch,
      async () => {
        const { fetch_content } = makeWindowingPi();
        const result = await fetch_content.execute("id", { url: "https://example.com/docs/short", extract: "article", window: { start_line: 999_999 } }, undefined, undefined, {});
        const details = result.details!;
        expect(details.windowed).toBe(true);
        expect(details.past_end).toBe(true);
        expect(details.has_more).toBe(false);
        expect(result.content[0].text).toMatch(/past end of content/);
      },
    );
  });
});

describe("fetch_content windowing (PDF + json routing)", () => {
  test("PDF URL with return_format:json is windowable (PDF precedence wins)", async () => {
    // sample.pdf lives at the plugin-root fixtures dir (extensions/test/fixtures
    // holds the HTML fixtures); mirror pdf.test.ts's path resolution.
    const pdfBytes = await readFile(join(import.meta.dir, "..", "test", "fixtures", "sample.pdf"));
    await withMockedFetch(
      (() => Promise.resolve(new Response(pdfBytes, { status: 200, headers: { "content-type": "application/pdf" } }))) as typeof globalThis.fetch,
      async () => {
        const { fetch_content } = makeWindowingPi();
        const result = await fetch_content.execute("id", { url: "https://example.com/doc.pdf", return_format: "json" }, undefined, undefined, {});
        // PDF precedence wins: windowed PDF markdown, NOT a JSON direct fetch.
        expect(result.details?.windowed).toBe(true);
        expect(result.details?.cache_hit).toBe(false);
        expect(result.content[0].text).toContain("Page one zai-research fixture");
        expect(result.content[0].text).not.toMatch(/JSON fetch error/);
      },
    );
  });
});

describe("fetch_content windowing (JSON + batch ignore window)", () => {
  test("single-URL JSON ignores window; windowed=false + window_ignored_reason='json'", async () => {
    await withMockedFetch(
      (() => Promise.resolve(new Response('{"b":2,"a":1}', { status: 200, headers: { "content-type": "application/json" } }))) as typeof globalThis.fetch,
      async () => {
        const { fetch_content } = makeWindowingPi();
        const result = await fetch_content.execute("id", { url: "https://example.com/api.json", return_format: "json", window: { start_line: 5 }, max_chars: 5_000 }, undefined, undefined, {});
        expect(result.details?.windowed).toBe(false);
        expect(result.details?.window_ignored_reason).toBe("json");
        expect(result.content[0].text).toContain('"b":2,"a":1');
      },
    );
  });

  test("multi-URL batch ignores window; windowed=false + window_ignored_reason='batch'", async () => {
    await withMockedFetch(
      (() => Promise.resolve(new Response('{"ok":true}', { status: 200, headers: { "content-type": "application/json" } }))) as typeof globalThis.fetch,
      async () => {
        const { fetch_content } = makeWindowingPi();
        const result = await fetch_content.execute("id", { urls: ["https://example.com/a.json", "https://example.com/b.json"], return_format: "json", window: { start_line: 5 } }, undefined, undefined, {});
        expect(result.details?.windowed).toBe(false);
        expect(result.details?.window_ignored_reason).toBe("batch");
        // Both URLs surface in the joined batch body.
        expect(result.content[0].text).toContain("## https://example.com/a.json");
        expect(result.content[0].text).toContain("## https://example.com/b.json");
      },
    );
  });
});
