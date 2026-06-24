---
id: story-zai-fetch-json-api-mode
kind: story
stage: done
tags: [plugin, tooling, zai-research]
parent: feature-zai-fetch-content-improvements
depends_on: []
release_binding: null
gate_origin: null
created: 2026-06-23
updated: 2026-06-23
---

# Add JSON/API fetch mode to fetch_content

## Implementation notes

Implemented Unit 1 (`return_format: "json"`) plus the prerequisite Unit 0
`fetchBounded` refactor.

### Files changed

- `plugins/zai-research/extensions/index.ts`
  - Refactored `fetchBounded` to module scope; it now returns
    `{ status, headers, body }` instead of `ArrayBuffer`, still
    stream-caps at `maxBytes`, follows redirects manually while re-running the
    SSRF guard on every `Location`, and no longer throws on non-2xx (callers
    decide).
  - `fetchOnePdf` now reads `result.status` and throws the same
    `HTTP ${status}` message it threw today, so PDF behavior is byte-for-byte
    identical (covered by the existing `pdf.test.ts`).
  - Added `MAX_JSON_BYTES = 5_000_000`, a `UTF8_BOM` byte constant, and a
    `JSON_TRUNCATION_MARKER` string.
  - Added two exported, unit-testable helpers at module scope:
    `parseJsonBody({status, headers, body})` (pure) and
    `fetchOneJson(url, signal?)`.
  - `fetch_content` now routes `return_format: "json"` through `fetchOneJson`
    after the PDF check (PDF precedence unchanged) and before the webReader
    fallback. Added `jsonMode` to the per-call `details`.
  - Schema: `return_format` enum is now `["markdown", "text", "json"]` with a
    description noting `json` does a direct fetch + parsed JSON.
- `plugins/zai-research/extensions/index.test.ts`
  - Added 17 tests across three new suites:
    `parseJsonBody` (8), `fetchBounded` (2), `fetchOneJson` (7). Covers:
    2xx compact JSON, 4xx-with-JSON surfacing both status and body, non-JSON
    (HTML) structured error mentioning Content-Type, empty body, whitespace
    body, BOM stripping, omitted Content-Type, large-JSON external-marker
    truncation (and that the truncated text is no longer valid JSON),
    `fetchBounded` not throwing on non-2xx, `fetchBounded` byte-cap stream
    enforcement, `fetchOneJson` 2xx / 4xx / non-JSON / empty / BOM / SSRF
    (no fetch call) / byte-cap inline-error.

### Behavior decisions (recorded)

- **Non-2xx with parseable JSON gets a `> HTTP <status> (Content-Type)`
  prefix line OUTSIDE the JSON.** The story's acceptance criterion says a 4xx
  JSON body must surface *both* status and body; without the prefix, a 4xx
  body would be indistinguishable from a 2xx body. The 2xx happy path stays
  compact (just the JSON, without whitespace formatting).
- **Truncation marker is appended outside the JSON**, per the design —
  head-truncating JSON would silently produce invalid-JSON-disguised-as-valid.
  The test asserts the truncated text no longer round-trips through
  `JSON.parse`.
- **SSRF rejection and byte-cap overflow are returned as inline
  `[JSON fetch error ...]` strings** rather than thrown, so a batch with one
  bad URL does not sink the rest (matches the existing PDF/HTML per-URL
  error wrapping).
- **Byte-cap mechanism** is unit-tested directly on `fetchBounded` (small
  cap, fast) and end-to-end on `fetchOneJson` against the real
  `MAX_JSON_BYTES` via a lazy 1MB/chunk `ReadableStream` (~6MB peak before
  cancel).

### Discrepancies vs. design

- None for the JSON path.
- The Unit 1 design step 3 ("If Content-Type plainly says `text/html`, return
  an error early") was *not* implemented as an early return. The task
  instructions supersede: "Try `JSON.parse` regardless of HTTP status" and on
  parse failure return a structured error mentioning Content-Type. The HTML
  case is handled naturally — HTML fails to parse, and the error message
  surfaces the `text/html` Content-Type + a body snippet. Functionally
  equivalent for callers and simpler/less branchy than an early return.

### Parked issues

- None. Article extraction (Unit 2) and the SKILL.md / tool-description update
  (Unit 3) are deliberately out of scope for this story and remain
  `story-zai-fetch-article-extraction` / `story-zai-fetch-skill-docs-update`.

### Codex review follow-up

A Codex review found two SSRF gaps in the widened local-fetch surface:

- `fetchBounded` followed redirects after checking only the initial URL.
  Fixed by switching to manual redirect handling with a 10-hop limit and
  re-running `assertSafeFetchUrl` on every redirect `Location`.
- IPv4-mapped IPv6 literals such as `[::ffff:127.0.0.1]` normalized to hex
  form and bypassed the private-IP checks. Fixed with dotted + hex
  IPv4-mapped IPv6 detection and tests.

The same review pass also exposed that the mock-fetch helper in
`index.test.ts` returned a function instead of executing it, so several fetch
unit tests were not actually running their assertions. The helper now executes
its callback and the tests exercise the real paths.

### Verification

`bun test` in `plugins/zai-research/` → **71 pass / 0 fail**.
Existing PDF and MCP suites remain green.

```bash
cd plugins/zai-research && bun test
# 71 pass, 0 fail, 144 expect() calls
```

### Follow-up risks

- The `assertSafeFetchUrl` SSRF guard still does not cover DNS-rebinding (a
  public hostname resolving to a private IP); this is a pre-existing, documented
  limitation for the local-fetch surface and is unchanged by this story. The
  JSON mode widens the surface from PDFs to any URL, so the same caveat now
  applies to JSON fetches too — worth noting in the Unit 3 SKILL.md update.

## Brief

Extend `fetch_content` so callers can request a raw JSON/API fetch instead of
Z.ai `webReader` markdown extraction. When the new mode is active, the extension
performs a direct HTTP GET with the existing byte cap and SSRF guards, parses
the response as JSON, and returns it. This is the clean path for structured
endpoints such as the Umans model-info API.

## Acceptance criteria

- A new `fetch_content` parameter selects JSON/API mode (e.g. `return_format: "json"`
  and/or `extract: "api"`). The exact parameter name is part of design.
- Direct fetch reuses `assertSafeFetchUrl` and `fetchBounded` (or a close
  relative) so byte caps and SSRF protection stay consistent with PDF fetching.
- Non-JSON responses (HTML error pages, text, binary) are handled gracefully,
  with a clear error message.
- New unit tests cover success, non-JSON fallback, SSRF rejection, and byte-cap
  enforcement.
- The `fetch_content` extension-level tests remain green.

## Review (2026-06-24)

**Verdict**: Approve

**Blockers**: none
**Important**: none
**Nits**: none

**Notes**: Fast-lane story review. Implementation notes record green verification (`cd plugins/zai-research && bun test` → 71 pass / 0 fail). Codex implementation review findings were fixed in `53d343e` before approval.

