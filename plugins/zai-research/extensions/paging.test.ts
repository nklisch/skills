import { describe, expect, test } from "bun:test";
import { applyWindow, cacheKey, PageCache, DEFAULT_WINDOW_LINES } from "./paging";
import type { CachedBlob } from "./paging";

// --- helpers ---------------------------------------------------------------

/** Build a fresh CachedBlob with a given text; fetchedAt = now by default. */
function blob(text: string, opts?: { fetchedAt?: number; total_lines?: number }): CachedBlob {
  return {
    text,
    total_lines: opts?.total_lines ?? 1,
    fetchedAt: opts?.fetchedAt ?? Date.now(),
  };
}

/** "a".repeat(n) repeated across the a–z cycle, so loss is detectable by value. */
function cycle(n: number): string {
  let s = "";
  for (let i = 0; i < n; i++) s += String.fromCharCode(97 + (i % 26));
  return s;
}

// --- applyWindow -----------------------------------------------------------

describe("applyWindow (basic windowing)", () => {
  test("1000-line blob with {line_count:200} returns lines 1–200, total=1000, no truncation", () => {
    const lines = Array.from({ length: 1000 }, (_, i) => `line ${i + 1}`);
    const text = lines.join("\n");
    const w = applyWindow(text, { line_count: 200 }, 60_000);
    expect(w.total_lines).toBe(1000);
    expect(w.returned).toEqual({ start: 1, end: 200 });
    expect(w.truncated_by_char_ceiling).toBe(false);
    expect(w.past_end).toBe(false);
    expect(w.text).toBe(lines.slice(0, 200).join("\n"));
  });

  test("default start_line = 1 when omitted", () => {
    const lines = ["a", "b", "c", "d"];
    const w = applyWindow(lines.join("\n"), { line_count: 2 }, 60_000);
    expect(w.returned).toEqual({ start: 1, end: 2 });
    expect(w.text).toBe("a\nb");
  });

  test("mid-document window returns the requested slice", () => {
    const lines = Array.from({ length: 10 }, (_, i) => `l${i + 1}`);
    const w = applyWindow(lines.join("\n"), { start_line: 4, line_count: 3 }, 60_000);
    expect(w.returned).toEqual({ start: 4, end: 6 });
    expect(w.text).toBe("l4\nl5\nl6");
    expect(w.total_lines).toBe(10);
  });

  test("line_count larger than remaining lines returns what is there (no padding)", () => {
    const lines = ["a", "b", "c"];
    const w = applyWindow(lines.join("\n"), { start_line: 2, line_count: 500 }, 60_000);
    expect(w.returned).toEqual({ start: 2, end: 3 });
    expect(w.text).toBe("b\nc");
    expect(w.truncated_by_char_ceiling).toBe(false);
  });
});

describe("applyWindow (char ceiling truncates at virtual-line boundaries)", () => {
  test("joined window over maxChars drops trailing virtual lines; end reflects the last kept line", () => {
    // 3 source lines, each 100 chars; maxChars=250. No virtual wrapping needed
    // (each line ≤ 250). Full join = 100+1+100+1+100 = 302 > 250 → drop line 3.
    const line = "x".repeat(100);
    const text = [line, line, line].join("\n");
    const w = applyWindow(text, { line_count: 3 }, 250);
    expect(w.total_lines).toBe(3);
    expect(w.truncated_by_char_ceiling).toBe(true);
    expect(w.returned).toEqual({ start: 1, end: 2 }); // only 2 lines fit (201 ≤ 250)
    expect(w.text).toBe([line, line].join("\n"));
    expect(w.text.length).toBe(201);
  });

  test("window that fits exactly under maxChars is not truncated", () => {
    const line = "x".repeat(100);
    const text = [line, line].join("\n"); // join = 201
    const w = applyWindow(text, { line_count: 2 }, 201);
    expect(w.truncated_by_char_ceiling).toBe(false);
    expect(w.returned).toEqual({ start: 1, end: 2 });
    expect(w.text).toBe(text);
  });

  test("char ceiling never cuts mid-line: a single virtual line always survives", () => {
    // maxChars=5; one source line of 6 chars wraps to ["abcde","f"] (2 virtual
    // lines). A 2-line window join = "abcde\nf" = 6 > 5 → drop "f", keep "abcde".
    const w = applyWindow("abcdef", { line_count: 2 }, 5);
    expect(w.total_lines).toBe(2);
    expect(w.truncated_by_char_ceiling).toBe(true);
    expect(w.returned).toEqual({ start: 1, end: 1 });
    expect(w.text).toBe("abcde");
  });
});

describe("applyWindow (virtual wrapping = no data loss)", () => {
  test("a single 100k-char source line with maxChars=30k yields ≥4 virtual lines and walks ALL 100k chars", () => {
    const chars = cycle(100_000);
    expect(chars.length).toBe(100_000);

    // First call establishes the virtual line count.
    const first = applyWindow(chars, { line_count: 1 }, 30_000);
    expect(first.total_lines).toBe(4); // ceil(100000/30000) = 4
    expect(first.past_end).toBe(false);

    // Walk one virtual line per window; concatenate window texts (no separator
    // — each window is a single virtual line of one source line) and compare.
    let rebuilt = "";
    let start = 1;
    while (true) {
      const w = applyWindow(chars, { start_line: start, line_count: 1 }, 30_000);
      if (w.past_end) break;
      expect(w.text.length).toBeLessThanOrEqual(30_000);
      rebuilt += w.text;
      start = w.returned.end + 1;
    }
    expect(rebuilt).toBe(chars); // exact reconstruction — nothing lost
  });

  test("virtual-wraps overlong source lines; total_lines counts virtual lines, not source lines", () => {
    const longLine = "y".repeat(25);
    const text = "short\n" + longLine; // 2 source lines, 2nd is overlong at cap=10
    const w = applyWindow(text, { line_count: 1 }, 10);
    // 2nd source line wraps to ceil(25/10)=3 virtual lines → 1 + 3 = 4 total.
    expect(w.total_lines).toBe(4);
    expect(w.returned).toEqual({ start: 1, end: 1 });
    expect(w.truncated_by_char_ceiling).toBe(false);
    expect(w.text).toBe("short");

    // Every virtual line ≤ cap (the wrapping invariant).
    for (let s = 1; s <= 4; s++) {
      const ww = applyWindow(text, { start_line: s, line_count: 1 }, 10);
      expect(ww.text.length).toBeLessThanOrEqual(10);
    }

    // The overlong line's chars are fully recovered by its 3 virtual sub-lines
    // (concatenated without a separator — they are ONE source line).
    const recovered =
      applyWindow(text, { start_line: 2, line_count: 1 }, 10).text +
      applyWindow(text, { start_line: 3, line_count: 1 }, 10).text +
      applyWindow(text, { start_line: 4, line_count: 1 }, 10).text;
    expect(recovered).toBe(longLine);
  });

  test("wrapping is by UTF-16 code-unit count (consistent with the rest of the extension)", () => {
    // maxChars=4 on a 9-char line → 3 virtual lines of 4,4,1.
    const w = applyWindow("abcdefghi", { line_count: 1 }, 4);
    expect(w.total_lines).toBe(3);
    expect(w.returned).toEqual({ start: 1, end: 1 });
    expect(w.text).toBe("abcd");
  });
});

describe("applyWindow (empty + past-end semantics)", () => {
  test("empty content → total_lines=0, default window past_end=true, stable empty returned", () => {
    const w = applyWindow("", {}, 60_000);
    expect(w.total_lines).toBe(0);
    expect(w.past_end).toBe(true);
    expect(w.text).toBe("");
    expect(w.returned).toEqual({ start: 1, end: 0 }); // {total+1, total}
    expect(w.truncated_by_char_ceiling).toBe(false);
  });

  test("empty content with an explicit window is still past_end with the stable range", () => {
    const w = applyWindow("", { start_line: 5, line_count: 100 }, 60_000);
    expect(w.past_end).toBe(true);
    expect(w.text).toBe("");
    // Stable range is keyed off total_lines, NOT the requested start.
    expect(w.returned).toEqual({ start: 1, end: 0 });
  });

  test("empty content with start_line<1 is still past_end (empty is past_end for any window)", () => {
    const w = applyWindow("", { start_line: -5 }, 60_000);
    expect(w.past_end).toBe(true);
    expect(w.returned).toEqual({ start: 1, end: 0 });
  });

  test("start_line past end → past_end=true, stable empty returned (not silently clamped)", () => {
    const w = applyWindow("a\nb\nc", { start_line: 10 }, 60_000);
    expect(w.total_lines).toBe(3);
    expect(w.past_end).toBe(true);
    expect(w.text).toBe("");
    expect(w.returned).toEqual({ start: 4, end: 3 }); // {total+1, total}
    expect(w.truncated_by_char_ceiling).toBe(false);
  });

  test("start_line exactly at total+1 is past_end (off-by-one boundary)", () => {
    const w = applyWindow("a\nb\nc", { start_line: 4 }, 60_000); // total=3
    expect(w.past_end).toBe(true);
    expect(w.returned).toEqual({ start: 4, end: 3 });
  });

  test("start_line at exactly total returns the last line (not past_end)", () => {
    const w = applyWindow("a\nb\nc", { start_line: 3 }, 60_000); // total=3
    expect(w.past_end).toBe(false);
    expect(w.returned).toEqual({ start: 3, end: 3 });
    expect(w.text).toBe("c");
  });
});

describe("applyWindow (spec validation)", () => {
  test("start_line < 1 clamps to 1", () => {
    const w = applyWindow("a\nb\nc", { start_line: -5, line_count: 2 }, 60_000);
    expect(w.past_end).toBe(false);
    expect(w.returned).toEqual({ start: 1, end: 2 });
    expect(w.text).toBe("a\nb");
  });

  test("start_line = 0 clamps to 1", () => {
    const w = applyWindow("a\nb\nc", { start_line: 0 }, 60_000);
    expect(w.returned).toEqual({ start: 1, end: 3 });
    expect(w.text).toBe("a\nb\nc");
  });

  test("omitted line_count defaults to DEFAULT_WINDOW_LINES (500)", () => {
    expect(DEFAULT_WINDOW_LINES).toBe(500);
    const lines = Array.from({ length: 600 }, (_, i) => `l${i}`);
    const w = applyWindow(lines.join("\n"), {}, 60_000);
    expect(w.returned).toEqual({ start: 1, end: 500 });
    expect(w.text).toBe(lines.slice(0, 500).join("\n"));
  });

  test.each([
    [0],
    [-5],
    [NaN],
    [Infinity],
    [-Infinity],
    [1.5],
    [2.5],
  ] as const)("invalid line_count (%p) falls back to default 500", (line_count) => {
    // Note: beyond 2^53 every representable float is integral, so there is no
    // "large fractional" case to test — fractional fallback is covered by 1.5/2.5.
    const lines = Array.from({ length: 600 }, (_, i) => `l${i}`);
    const w = applyWindow(lines.join("\n"), { line_count }, 60_000);
    expect(w.returned.end).toBe(500);
    expect(w.text).toBe(lines.slice(0, 500).join("\n"));
  });

  test("non-finite start_line defaults to 1", () => {
    const w = applyWindow("a\nb\nc", { start_line: NaN, line_count: 2 }, 60_000);
    expect(w.returned).toEqual({ start: 1, end: 2 });
    expect(w.text).toBe("a\nb");
  });

  test("huge line_count returns everything from start without error", () => {
    const w = applyWindow("a\nb\nc", { line_count: 1e9 }, 60_000);
    expect(w.returned).toEqual({ start: 1, end: 3 });
    expect(w.text).toBe("a\nb\nc");
  });
});

// --- cacheKey --------------------------------------------------------------

describe("cacheKey (default normalization + mode distinction)", () => {
  test("omitted return_format/extract normalize to the same key as explicit defaults", () => {
    const omitted = cacheKey("https://example.com/x", {});
    const explicit = cacheKey("https://example.com/x", {
      return_format: "markdown",
      extract: "full",
    });
    expect(omitted).toBe(explicit);
  });

  test("partial defaults: omitted extract → 'full', omitted return_format → 'markdown'", () => {
    expect(cacheKey("https://example.com/x", { return_format: "markdown" })).toBe(
      cacheKey("https://example.com/x", {}),
    );
    expect(cacheKey("https://example.com/x", { extract: "full" })).toBe(
      cacheKey("https://example.com/x", {}),
    );
  });

  test("markdown vs article of the same URL produce different keys", () => {
    const markdown = cacheKey("https://example.com/x", { return_format: "markdown" });
    const article = cacheKey("https://example.com/x", { extract: "article" });
    expect(markdown).not.toBe(article);
  });

  test("json mode is distinct from markdown", () => {
    expect(cacheKey("https://example.com/x", { return_format: "json" })).not.toBe(
      cacheKey("https://example.com/x", {}),
    );
  });

  test("different URLs produce different keys", () => {
    expect(cacheKey("https://a.com", {})).not.toBe(cacheKey("https://b.com", {}));
  });

  test("key is deterministic JSON (stable property order)", () => {
    expect(cacheKey("https://example.com/x", {})).toBe(
      JSON.stringify({
        url: "https://example.com/x",
        return_format: "markdown",
        extract: "full",
      }),
    );
  });
});

// --- PageCache -------------------------------------------------------------

describe("PageCache (LRU entry eviction)", () => {
  test("evicts the least-recently-used entry on entry-count overflow", () => {
    const cache = new PageCache({ maxEntries: 2, maxBytes: 1_000_000, ttlMs: 600_000 });
    cache.set("a", blob("aa"));
    cache.set("b", blob("bb"));
    expect(cache.size).toBe(2);

    // Touch "a" → it becomes MRU, so "b" is now the LRU candidate.
    expect(cache.get("a")).toBeDefined();

    cache.set("c", blob("cc")); // exceeds maxEntries=2 → evict LRU "b"
    expect(cache.size).toBe(2);
    expect(cache.get("a")).toBeDefined();
    expect(cache.get("b")).toBeUndefined();
    expect(cache.get("c")).toBeDefined();
  });

  test("re-insert on get promotes recency (get is not eviction-neutral)", () => {
    const cache = new PageCache({ maxEntries: 2, maxBytes: 1_000_000, ttlMs: 600_000 });
    cache.set("a", blob("aa"));
    cache.set("b", blob("bb"));
    const got = cache.get("a"); // promote a
    expect(got).toBeDefined();
    expect(cache.size).toBe(2); // get does not change size
    cache.set("c", blob("cc")); // evict LRU = b (a was promoted)
    expect(cache.get("a")).toBeDefined();
    expect(cache.get("b")).toBeUndefined();
  });

  test("set on an existing key updates it and moves it to MRU", () => {
    const cache = new PageCache({ maxEntries: 2, maxBytes: 1_000_000, ttlMs: 600_000 });
    cache.set("a", blob("aa"));
    cache.set("b", blob("bb"));
    cache.set("a", blob("AAA")); // re-set a → MRU, old bytes released
    expect(cache.get("a")?.text).toBe("AAA");
    cache.set("c", blob("cc")); // evict LRU = b
    expect(cache.get("a")?.text).toBe("AAA");
    expect(cache.get("b")).toBeUndefined();
    expect(cache.get("c")).toBeDefined();
  });
});

describe("PageCache (byte-budget eviction)", () => {
  test("evicts LRU on total-bytes overflow (byte budget, not entry count, drives eviction)", () => {
    const cache = new PageCache({ maxEntries: 100, maxBytes: 10, ttlMs: 600_000 });
    cache.set("a", blob("aaaa")); // 4 bytes
    cache.set("b", blob("bbbb")); // 4 bytes; total 8 ≤ 10
    expect(cache.size).toBe(2);
    cache.set("c", blob("cc")); // 2 bytes; 8 + 2 = 10 ≤ 10 → no eviction
    expect(cache.size).toBe(3);
    cache.set("d", blob("dd")); // 2 bytes; 10 + 2 = 12 > 10 → evict LRU "a"
    expect(cache.size).toBe(3);
    expect(cache.get("a")).toBeUndefined();
    expect(cache.get("b")).toBeDefined();
    expect(cache.get("c")).toBeDefined();
    expect(cache.get("d")).toBeDefined();
  });

  test("byte accounting is UTF-8, not .length chars (multi-byte payloads cost more)", () => {
    // "é" is 2 UTF-8 bytes but 1 UTF-16 code unit. With maxBytes=4:
    //   - "aaaa" (4 bytes) fits.
    //   - "éééé" (8 bytes) alone exceeds 4 → refused (see oversize suite).
    // Here we verify a 2-byte-char blob counts as 2 bytes/char for eviction.
    const cache = new PageCache({ maxEntries: 100, maxBytes: 6, ttlMs: 600_000 });
    cache.set("a", blob("ééé")); // 6 bytes (3 × 2-byte chars) → total 6 ≤ 6
    expect(cache.size).toBe(1);
    cache.set("b", blob("é")); // 2 bytes; 6 + 2 = 8 > 6 → evict "a"
    expect(cache.size).toBe(1);
    expect(cache.get("a")).toBeUndefined();
    expect(cache.get("b")).toBeDefined();
  });
});

describe("PageCache (oversize refusal)", () => {
  test("a blob whose text alone exceeds maxBytes is refused (not cached)", () => {
    const cache = new PageCache({ maxBytes: 10, maxEntries: 100, ttlMs: 600_000 });
    const big = blob("x".repeat(100)); // 100 bytes > 10
    cache.set("k", big);
    expect(cache.size).toBe(0);
    expect(cache.get("k")).toBeUndefined();
  });

  test("refusal does not evict existing entries (cache left untouched)", () => {
    const cache = new PageCache({ maxBytes: 10, maxEntries: 100, ttlMs: 600_000 });
    cache.set("keep", blob("aaaa")); // 4 bytes
    cache.set("oversize", blob("y".repeat(100))); // refused
    expect(cache.size).toBe(1);
    expect(cache.get("keep")).toBeDefined();
    expect(cache.get("oversize")).toBeUndefined();
  });

  test("after a refusal, a normal-size blob still caches fine", () => {
    const cache = new PageCache({ maxBytes: 10, maxEntries: 100, ttlMs: 600_000 });
    cache.set("k", blob("x".repeat(100))); // refused
    expect(cache.size).toBe(0);
    cache.set("k2", blob("hi")); // 2 bytes, fine
    expect(cache.size).toBe(1);
    expect(cache.get("k2")?.text).toBe("hi");
  });

  test("a blob exactly at maxBytes is accepted (refusal is strict-greater)", () => {
    const cache = new PageCache({ maxBytes: 4, maxEntries: 100, ttlMs: 600_000 });
    cache.set("k", blob("aaaa")); // 4 bytes === maxBytes → accepted
    expect(cache.size).toBe(1);
    expect(cache.get("k")).toBeDefined();
  });
});

describe("PageCache (TTL)", () => {
  test("an expired blob is a miss and is lazily deleted on get", () => {
    const cache = new PageCache({ maxEntries: 10, maxBytes: 1_000_000, ttlMs: 1000 });
    // fetched 5s ago — well past the 1s TTL. set does NOT check TTL (lazy on get).
    cache.set("k", blob("v", { fetchedAt: Date.now() - 5000 }));
    expect(cache.size).toBe(1);
    expect(cache.get("k")).toBeUndefined(); // expired → miss + delete
    expect(cache.size).toBe(0);
  });

  test("a fresh blob is served and promoted", () => {
    const cache = new PageCache({ maxEntries: 10, maxBytes: 1_000_000, ttlMs: 600_000 });
    cache.set("k", blob("v"));
    expect(cache.get("k")?.text).toBe("v");
    expect(cache.size).toBe(1);
  });

  test("a missing key returns undefined without side effects", () => {
    const cache = new PageCache();
    expect(cache.get("nope")).toBeUndefined();
    expect(cache.size).toBe(0);
  });
});

describe("PageCache (defaults)", () => {
  test("default maxEntries = 8 evicts the 9th", () => {
    const cache = new PageCache(); // defaults
    for (let i = 0; i < 9; i++) cache.set(`k${i}`, blob(`v${i}`));
    expect(cache.size).toBe(8);
    expect(cache.get("k0")).toBeUndefined(); // oldest evicted
    expect(cache.get("k8")).toBeDefined(); // newest kept
  });
});
