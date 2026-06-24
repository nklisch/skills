import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { truncate, assertSafeFetchUrl, fetchBounded, parseJsonBody, fetchOneJson, fetchOneArticle } from "./index";
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
  test("pretty-prints a 2xx JSON body (happy path: just the JSON)", () => {
    const out = parseJsonBody(jsonResult({
      status: 200,
      contentType: "application/json",
      body: '{"b":2,"a":1}',
    }));
    expect(out.ok).toBe(true);
    if (out.ok) {
      expect(out.text).toBe('{\n  "b": 2,\n  "a": 1\n}');
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
      expect(out.text).toContain('"error": "model not found"');
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
    if (out.ok) expect(out.text).toContain('"ok": true');
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
    // Build a JSON body whose pretty-printed form clearly exceeds 60_000 chars.
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
  test("returns pretty-printed JSON on a 2xx success", async () => {
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
        expect(out).toBe('{\n  "b": 2,\n  "a": 1\n}');
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
        expect(out).toContain('"error": "nope"');
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
        expect(out).toContain('"ok": true');
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
