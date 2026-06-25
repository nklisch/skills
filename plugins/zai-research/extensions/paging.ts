/**
 * Line-based windowing + bounded LRU/TTL blob cache for fetch_content.
 *
 * Pure (no network, no hub). Directly unit-testable; Unit 2 wires it into the
 * fetch_content single-URL text path.
 *
 * Two concerns live here:
 *
 *   - {@link applyWindow}: slice a fetched blob into a window of virtual lines
 *     bounded by a per-call char budget. Source lines longer than the budget
 *     are HARD-WRAPPED into virtual sub-lines (≤ budget) BEFORE slicing, so
 *     line-based addressing reaches EVERY character — including PDFs, where
 *     each page's text is one giant line (`pdf.ts`). Without that virtual
 *     wrapping, the char-ceiling cut would skip the rest of an overlong line
 *     forever, silently losing content. `total_lines` counts virtual lines.
 *
 *   - {@link PageCache}: a small in-memory cache of fetched blobs, bounded by
 *     BOTH entry count and total UTF-8 bytes, with LRU eviction and a TTL. It
 *     is a transparent internal optimization: callers never name it. A blob
 *     that alone exceeds the byte budget is SERVED but NOT CACHED — the cache
 *     must never be over budget.
 *
 * Char budgets (`maxChars`) are UTF-16 code-unit counts (string `.length`),
 * matching `truncate()` / `MAX_RETURN_CHARS` elsewhere in the extension. Only
 * {@link PageCache} accounts in UTF-8 bytes, because its budget is memory, not
 * model context.
 */

/**
 * Default window size (virtual lines) when the caller omits `line_count`, or
 * supplies a value that fails validation (non-finite, ≤ 0, or fractional).
 * Large enough to cover a typical doc page in one call; small enough that the
 * rendered window stays well under the char budget for a normal line length.
 */
export const DEFAULT_WINDOW_LINES = 500;

export interface WindowSpec {
  /** 1-indexed start line. Defaults to 1. Values < 1 clamp to 1. */
  start_line?: number;
  /** Number of virtual lines to return. Defaults to {@link DEFAULT_WINDOW_LINES}. */
  line_count?: number;
}

export interface WindowResult {
  /** Windowed text: the requested virtual lines joined with "\n", ≤ the char budget. */
  text: string;
  /** Total virtual line count of the source (0 for empty content). */
  total_lines: number;
  /** 1-indexed inclusive range actually returned. Stable empty range when past_end. */
  returned: { start: number; end: number };
  /** True when the char budget forced trailing virtual lines to be dropped. */
  truncated_by_char_ceiling: boolean;
  /** True when the requested start lies beyond `total_lines` (or content is empty). */
  past_end: boolean;
}

/**
 * Split `text` into virtual lines, hard-wrapping any source line longer than
 * `cap` into consecutive sub-lines of at most `cap` chars (UTF-16 code units).
 *
 * Source lines are split on "\n" only; "\r" and other whitespace are preserved
 * in line content (no normalization) so the original bytes round-trip through
 * windowing. Wrapping at `cap` (not at a word boundary) is deliberate: it gives
 * a tight, predictable bound on virtual-line length and guarantees full
 * coverage, which matters more for the no-data-loss contract than pretty breaks.
 *
 * Not exported: callers use {@link applyWindow}, which handles the empty-content
 * short-circuit (this function returns `[""]` for `""`, not `[]`).
 */
function wrapAndSplit(text: string, cap: number): string[] {
  const out: string[] = [];
  for (const line of text.split("\n")) {
    if (line.length <= cap) {
      out.push(line);
    } else {
      for (let i = 0; i < line.length; i += cap) {
        out.push(line.slice(i, i + cap));
      }
    }
  }
  return out;
}

/**
 * Window a fetched blob by virtual-line position within a per-call char budget.
 *
 * Algorithm:
 *   1. Virtual-wrap source lines into sub-lines ≤ `maxChars` (no data loss).
 *   2. Validate `spec` (defaults + invalid-`line_count` fallback to default).
 *   3. `past_end` is checked against the REQUESTED start, BEFORE lower-clamping,
 *      so an explicit start beyond the end is reported rather than silently
 *      clamped to the last line. Empty content is `past_end` for any window.
 *   4. Lower-clamp `start` to 1; upper bound is already guaranteed by step 3.
 *   5. Slice `[start-1, start-1+count)` virtual lines and join with "\n".
 *   6. If the joined text exceeds `maxChars`, drop trailing virtual lines until
 *      it fits. Virtual wrapping guarantees every virtual line ≤ `maxChars`,
 *      so this always terminates with at least one line kept — no mid-line cut.
 *
 * @param text     Fetched source content. `""` is a valid (empty) input.
 * @param spec     Window request. `start_line` defaults to 1; `line_count` to
 *   {@link DEFAULT_WINDOW_LINES}. Non-finite / ≤0 / fractional `line_count`
 *   falls back to the default.
 * @param maxChars  Per-call char budget (UTF-16 code units). Floored to a
 *   positive integer defensively; callers pass an integer budget.
 */
export function applyWindow(
  text: string,
  spec: WindowSpec,
  maxChars: number,
): WindowResult {
  // Floor the char budget to a positive integer. A fractional budget would
  // otherwise cause fractional slice indices; a non-positive one would make the
  // wrap loop run forever. Callers (Unit 2) pass an integer budget, so this is
  // a defensive floor.
  const cap = Math.max(1, Math.floor(maxChars));

  // 1. Virtual-wrap. Empty content → 0 lines (the `=== ""` guard is essential:
  //    `"".split("\n")` yields `[""]`, i.e. one empty line, not zero).
  const virtualLines = text === "" ? [] : wrapAndSplit(text, cap);
  const total_lines = virtualLines.length;

  // 2. Validate spec.
  const requestedStart =
    spec.start_line !== undefined && Number.isFinite(spec.start_line)
      ? spec.start_line
      : 1;
  const count =
    spec.line_count !== undefined &&
    Number.isFinite(spec.line_count) &&
    spec.line_count > 0 &&
    Number.isInteger(spec.line_count)
      ? spec.line_count
      : DEFAULT_WINDOW_LINES;

  // 3. past_end — checked against the requested start, before clamping. The
  //    stable empty range is keyed off `total_lines`, not the requested start,
  //    so it is identical for any past-end request on the same content.
  if (total_lines === 0 || requestedStart > total_lines) {
    return {
      text: "",
      total_lines,
      returned: { start: total_lines + 1, end: total_lines },
      truncated_by_char_ceiling: false,
      past_end: true,
    };
  }

  // 4. Lower-clamp start (start_line < 1 → 1); floor fractional starts.
  //    Upper bound already guaranteed by the past_end check.
  const start = Math.max(1, Math.floor(requestedStart));
  const startIndex = start - 1;

  // 5. Slice the window and join virtual lines with "\n".
  const windowLines = virtualLines.slice(startIndex, startIndex + count);
  let windowText = windowLines.join("\n");
  let end = start + windowLines.length - 1;
  let truncated_by_char_ceiling = false;

  // 6. Char ceiling: drop trailing virtual lines until the join fits. Each
  //    virtual line is ≤ cap (wrapping invariant), so the loop always leaves
  //    at least one line — no mid-line character cut is ever needed.
  if (windowText.length > cap) {
    let kept = windowLines.length;
    let len = windowText.length;
    while (kept > 1 && len > cap) {
      // Remove the last kept line plus its preceding "\n" separator.
      len -= windowLines[kept - 1].length + 1;
      kept--;
    }
    windowText = windowLines.slice(0, kept).join("\n");
    end = start + kept - 1;
    truncated_by_char_ceiling = true;
  }

  return {
    text: windowText,
    total_lines,
    returned: { start, end },
    truncated_by_char_ceiling,
    past_end: false,
  };
}

export interface CachedBlob {
  /** Full fetched source text (the windowing input). */
  text: string;
  /** Virtual line count of `text` (computed by the caller at fetch time). */
  total_lines: number;
  /** Epoch ms when the blob was fetched; drives TTL expiry. */
  fetchedAt: number;
}

// Cache defaults. Local (not exported): callers use `new PageCache()` and rely
// on these; tests pass explicit opts to exercise eviction behavior. Matches the
// `pdf.ts` pattern of keeping tuning constants local.
const DEFAULT_CACHE_ENTRIES = 8;
const DEFAULT_CACHE_BYTES = 16 * 1024 * 1024; // 16 MB, UTF-8 bytes
const DEFAULT_CACHE_TTL_MS = 600_000; // 10 minutes

// Reused encoder for UTF-8 byte accounting. Construction is cheap; reusing
// avoids per-call allocation (mirrors the shared Turndown instance in article.ts).
const encoder = new TextEncoder();

/**
 * Bounded LRU + TTL cache of fetched blobs. Bounds are enforced on BOTH entry
 * count and total UTF-8 bytes; eviction is least-recently-used.
 *
 * Semantics worth getting right:
 *   - **Byte accounting is UTF-8** (via `TextEncoder`), not `.length` chars — a
 *     multi-byte payload is accounted by its real memory cost.
 *   - **Re-insert on get** marks an entry most-recently-used (Map insertion
 *     order is the LRU order; the first key is always the LRU candidate).
 *   - **TTL is lazy**: `set` never filters by age; `get` deletes an expired
 *     entry and returns `undefined` (a miss).
 *   - **Oversize blobs are refused**: a blob whose text alone exceeds
 *     `maxBytes` is never stored (the cache must never be over budget). The
 *     caller still serves it for the current call.
 */
export class PageCache {
  private readonly maxEntries: number;
  private readonly maxBytes: number;
  private readonly ttlMs: number;
  private readonly map = new Map<string, CachedBlob>();
  private bytes = 0;

  constructor(opts?: { maxEntries?: number; maxBytes?: number; ttlMs?: number }) {
    this.maxEntries = opts?.maxEntries ?? DEFAULT_CACHE_ENTRIES;
    this.maxBytes = opts?.maxBytes ?? DEFAULT_CACHE_BYTES;
    this.ttlMs = opts?.ttlMs ?? DEFAULT_CACHE_TTL_MS;
  }

  /** Number of entries currently cached. */
  get size(): number {
    return this.map.size;
  }

  /** UTF-8 byte length of a blob's text payload (the dominant memory cost). */
  private blobBytes(blob: CachedBlob): number {
    return encoder.encode(blob.text).byteLength;
  }

  get(key: string): CachedBlob | undefined {
    const blob = this.map.get(key);
    if (blob === undefined) return undefined;

    // TTL: lazy-delete on get. An expired blob is a miss and is removed.
    if (Date.now() - blob.fetchedAt > this.ttlMs) {
      this.map.delete(key);
      this.bytes -= this.blobBytes(blob);
      return undefined;
    }

    // Re-insert to mark most-recently-used. Same blob, so byte accounting is
    // unchanged — only insertion order moves.
    this.map.delete(key);
    this.map.set(key, blob);
    return blob;
  }

  set(key: string, blob: CachedBlob): void {
    const size = this.blobBytes(blob);

    // Refuse oversize blobs outright: never let the cache exceed the byte
    // budget. The caller still serves the blob for the current call.
    if (size > this.maxBytes) return;

    // If updating an existing key, release the old blob's bytes first and let
    // the new blob take the MRU position (re-set = most recent).
    const existing = this.map.get(key);
    if (existing !== undefined) {
      this.map.delete(key);
      this.bytes -= this.blobBytes(existing);
    }

    this.map.set(key, blob);
    this.bytes += size;

    // Evict oldest (LRU) until under BOTH the entry-count and byte budgets.
    while (this.map.size > this.maxEntries || this.bytes > this.maxBytes) {
      const oldest = this.map.keys().next().value as string | undefined;
      if (oldest === undefined) break; // safety: map unexpectedly empty
      const evicted = this.map.get(oldest)!;
      this.map.delete(oldest);
      this.bytes -= this.blobBytes(evicted);
    }
  }
}

/**
 * Deterministic cache key for a fetch. Normalizes omitted `return_format` to
 * `"markdown"` and omitted `extract` to `"full"` BEFORE keying, so an
 * omitted-default call and an explicit-default call share one cache entry.
 *
 * `JSON.stringify({ url, return_format, extract })` is collision-free for this
 * shape (the keys are fixed and URL content can't break out of the JSON string
 * quoting). Same URL with a different effective mode (e.g. markdown vs
 * article) yields a different key, so the two routes never share a blob.
 */
export function cacheKey(
  url: string,
  mode: { return_format?: string; extract?: string },
): string {
  const return_format = mode.return_format ?? "markdown";
  const extract = mode.extract ?? "full";
  return JSON.stringify({ url, return_format, extract });
}
