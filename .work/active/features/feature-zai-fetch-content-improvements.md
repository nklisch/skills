---
id: feature-zai-fetch-content-improvements
kind: feature
stage: review
tags: [plugin, tooling, zai-research]
parent: null
depends_on: []
release_binding: null
gate_origin: null
created: 2026-06-23
updated: 2026-06-23
---

# Improve fetch_content for structured APIs and noisy doc pages

## Brief

`fetch_content` in the `zai-research` extension currently sends every HTML URL
through Z.ai `webReader` and returns the full page markdown. Two recurring
frictions have surfaced:

1. **Structured API endpoints are better fetched directly.** For the Umans
   model-info API, a direct `curl` returned clean JSON while `fetch_content`
   returned a noisy rendered-docs dump. The tool should expose a first-class
   JSON/API mode that does a bounded direct HTTP fetch and returns parsed JSON,
   using the same SSRF and size guards already in place for PDF downloads.

2. **Documentation pages include too much boilerplate.** Doc sites often come
   back with navigation, sidebars, footers, and repeated headers. The tool should
   expose an `extract: "article"` mode that strips this boilerplate and returns
   the main content.

3. **Skill documentation needs to steer users.** The `zai-research` `SKILL.md`
   should explain when to use the new JSON/API mode and the article-extraction
   mode, and it should update the `fetch_content` tool description and prompt
   guidelines so agents self-route correctly.

This feature covers the `zai-research` extension (`plugins/zai-research/extensions/`),
its tests (`extensions/index.test.ts`, `pdf.test.ts`, and new tests for the new
modes), and the portable skill doc
(`plugins/zai-research/skills/zai-research/SKILL.md`).

## Scope notes

- `web_search` diagnostics are explicitly out of scope. The reported opaque
  failure for “omans” was a wrong search term, not a tool error.
- Migration/compatibility: the new options are additive; existing `fetch_content`
  calls keep the current behavior by default.
- This is a **minor** plugin version bump (new capability), not a patch.

## Design decisions

- **Structured API mode is a `return_format` value, not a new tool.** Reusing
  `return_format` keeps the existing `fetch_content` surface coherent: `json`
  means “fetch the URL directly and return parsed JSON,” while `markdown`/`text`
  continue to route through Z.ai `webReader`.
- **Article extraction is a separate `extract` parameter.** `extract: "article"`
  fetches **raw HTML directly** and strips navigation/sidebars/footers before
  converting to markdown. `return_format` is ignored in article mode because the
  article path produces its own markdown.
- **Mutually exclusive mode precedence.** Per URL, the tool resolves modes in
  this order: PDF URL (`looksLikePdfUrl`) → `return_format: "json"` →
  `extract: "article"` → webReader fallback. Combining `return_format: "json"`
  with `extract: "article"` is an error.
- **Use a real readability library for article extraction, not a regex
  heuristic.** A regex approach is fragile across doc-site templates. The
  chosen stack is `linkedom` (lightweight DOM), `@mozilla/readability` (battle-
  tested article extraction), and `turndown` (HTML→markdown). This adds three
  small pure-JS deps with no native code.
- **`fetchBounded` will return status + headers + body.** The JSON path needs to
  inspect `Content-Type`, surface 4xx/5xx JSON error bodies, and cap byte sizes
  independently of PDFs. Refactoring `fetchBounded` to return `{ status,
  headers, body }` serves both the PDF and JSON paths without duplicating fetch
  logic.
- **`prompt` remains a compatibility no-op.** The `prompt` parameter exists for
  drop-in compatibility with other tool schemas but is not sent upstream. The
  design does not turn it into a post-processing or extraction instruction.

## Architectural choice

Three plausible approaches were considered:

1. **New tools** (`fetch_json`, `fetch_article`). Clean separation, but it
   fragments the surface and forces callers to pick the right tool name rather
   than a parameter.
2. **Mode parameters on `fetch_content`** (`return_format: json`,
   `extract: article`). Keeps the tool surface small and matches caller intent
   naturally.
3. **Prompt-driven backend extraction.** Pass caller intent to the webReader as
   a prompt. Rejected because the parameter is explicitly documented as not sent
   to Z.ai and because a backend prompt offers no guarantee of structured JSON.

**Chosen: option 2.** Additive parameters on `fetch_content` give the cleanest UX
and the smallest schema change.

## Implementation units

### Unit 0: Refactor `fetchBounded` to expose status, headers, and body

**File**: `plugins/zai-research/extensions/index.ts`

Before adding JSON/API or article extraction, change `fetchBounded` to return a
structured result:

```typescript
type FetchResult = {
  status: number;
  headers: Headers;
  body: ArrayBuffer;
};
```

Rules:
- Still aborts if the response body exceeds `maxBytes`.
- Still uses `redirect: "follow"`.
- Does **not** throw on non-2xx; callers decide how to handle status codes.
- Update the existing PDF caller to check `resp.status` and throw the same
  `HTTP ${status}` message it throws today, preserving current PDF behavior.

This is prerequisite work for Unit 1 and Unit 2.

### Unit 1: JSON/API direct-fetch mode

**Files**:
- `plugins/zai-research/extensions/index.ts`
- `plugins/zai-research/extensions/index.test.ts`

When `params.return_format === "json"`:

1. Validate the URL with `assertSafeFetchUrl`.
2. Fetch with the refactored `fetchBounded` using a new `MAX_JSON_BYTES` cap
   (suggest **5 MB**). JSON parsing and rendering a 25 MB PDF-sized blob is
   wasteful and an OOM risk under batch fetches.
3. Inspect `Content-Type`. If it plainly says `text/html`, return an error early
   so callers don’t see a parse-failure dump. If it is `application/json` (or
   missing/ambiguous), attempt parse.
4. **Attempt JSON parse even on 4xx/5xx.** API error responses often carry JSON
   bodies (e.g. `{ error: "model not found" }`). Surface `{ status, body }` when
   parse succeeds on an error status.
5. Strip a leading UTF-8 BOM before parsing.
6. Detect empty body and return a clear "empty body" error instead of a generic
   parse error.
7. Render parsed JSON compactly by default. Agents can parse compact JSON and
   whitespace is token overhead. If the output exceeds `MAX_RETURN_CHARS`,
   truncate **safely**: emit a truncation marker **outside** any JSON structure
   and state clearly that the result is incomplete JSON. Head-truncation with
   an inline marker would produce invalid JSON.

Tool schema changes:

```typescript
return_format: strEnum(
  ["markdown", "text", "json"],
  "Output format. markdown/text route through Z.ai webReader; json fetches the URL directly and returns parsed JSON."
)
```

Mode parameter precedence: PDF URL check runs before `return_format: json`.
If a caller asks for `return_format: json` on a `.pdf` URL, the PDF path wins;
this matches today’s URL-type routing.

**Story**: `story-zai-fetch-json-api-mode`

**Acceptance criteria**:
- [ ] `return_format: "json"` on a JSON endpoint returns compact parsed JSON.
- [ ] A 4xx/5xx response with a JSON body surfaces both status and body.
- [ ] A non-JSON (e.g. HTML) response returns a structured error mentioning Content-Type.
- [ ] Empty body / 204 returns a clear "empty body" error, not a generic parse error.
- [ ] A leading UTF-8 BOM is stripped before parsing.
- [ ] SSRF rejection and JSON byte-cap are enforced.
- [ ] Large JSON that exceeds `MAX_RETURN_CHARS` is truncated with a clear
      "incomplete JSON" marker outside the structure.
- [ ] Mixed `urls` batch: a non-JSON member produces a per-URL error block,
      not a sunk batch.

### Unit 2: Article-only extraction

**Files**:
- `plugins/zai-research/extensions/article.ts` (new helper)
- `plugins/zai-research/extensions/index.ts`
- `plugins/zai-research/extensions/index.test.ts`
- `plugins/zai-research/extensions/test/fixtures/` (real saved HTML fixtures)

When `params.extract === "article"`:

1. Validate the URL with `assertSafeFetchUrl`.
2. Fetch raw HTML directly with the refactored `fetchBounded`, using a cap
   appropriate for HTML pages (reuse `MAX_PDF_BYTES` or a dedicated HTML cap —
   decision at implementation time; 25 MB is acceptable for HTML in v1).
3. Decode the response as UTF-8 and hand it to the article helper.
4. Use `linkedom` to construct a minimal DOM, `@mozilla/readability` to extract
   the article content as cleaned HTML, and `turndown` to convert that HTML to
   markdown.
5. If readability cannot find a viable article, fall back to full-page content
   with a leading fallback note.
6. If the extracted text is below a concrete character floor (e.g. < 400
   chars), treat it as a failed extraction and fall back with a note.

Tool schema changes:

```typescript
extract: strEnum(
  ["full", "article"],
  "For HTML pages, full returns the whole webReader output; article fetches raw HTML, extracts the main article, and returns markdown. Ignored for PDF and JSON modes."
)
```

Mode parameter precedence: PDF URL check runs first, then `return_format: json`,
then `extract: article`. Combining `return_format: json` with `extract: article`
is an explicit error.

**Story**: `story-zai-fetch-article-extraction`

**Acceptance criteria**:
- [ ] A noisy Docusaurus/Mintlify/MDN fixture returns only the main article
      content when `extract: "article"`.
- [ ] A fixture with no identifiable article falls back to full text with a
      fallback marker.
- [ ] A false-positive fixture (selector matches non-content) does not silently
      discard real content when the character floor triggers fallback.
- [ ] `extract: "article"` combined with a PDF URL is ignored (PDF extraction
      proceeds normally).
- [ ] `return_format: "json"` + `extract: "article"` returns a clear error.
- [ ] Existing `fetch_content` behavior is unchanged when `extract` is omitted.

### Unit 3: Tool metadata and skill documentation

**Files**:
- `plugins/zai-research/extensions/index.ts` (description + prompt guidelines)
- `plugins/zai-research/skills/zai-research/SKILL.md`

Update the registered tool description and `promptGuidelines` to tell agents:
- Use `return_format: "json"` for REST/JSON API endpoints.
- Use `extract: "article"` when a docs page returns too much navigation noise.
- Mention that `return_format: json` and `extract: article` are mutually
  exclusive, and that JSON mode expects a homogeneous batch of JSON endpoints.

Update `SKILL.md`:
- Add a “Fetch a structured API endpoint” pattern.
- Add a “Strip boilerplate from a docs page” pattern.
- Update guardrails to note the new mode precedence, the JSON cap/truncation
  behavior, and the article-extraction fallback.

**Story**: `story-zai-fetch-skill-docs-update`

**Acceptance criteria**:
- [ ] Tool description and guidelines mention JSON and article modes.
- [ ] `SKILL.md` examples show the new modes.
- [ ] Schema snapshot assertion confirms `return_format` enum includes `json`
      and a new `extract` param exists.
- [ ] The skill remains under 500 lines; deep catalogs are split into
      references if needed.

## Implementation order

1. `story-zai-fetch-json-api-mode` — refactor `fetchBounded`, add the JSON direct-fetch
   path, and tests. (`story-zai-fetch-article-extraction` cannot start until this
   lands because it depends on the refactored fetch result.)
2. `story-zai-fetch-article-extraction` — article helper, real fixtures, integration, tests.
3. `story-zai-fetch-skill-docs-update` — updates tool metadata and `SKILL.md` after
   the code changes are landed.

Update the story `depends_on` so that `story-zai-fetch-article-extraction`
depends on `story-zai-fetch-json-api-mode` (for the `fetchBounded` refactor).

## Testing

### New unit tests in `extensions/index.test.ts`

JSON mode:
- success with local inline JSON fixture
- 4xx/5xx with JSON body surfaces status + body
- non-JSON response returns structured Content-Type error
- empty body → clear error
- leading UTF-8 BOM stripped
- SSRF rejection
- JSON byte-cap enforcement
- large JSON truncation marker shape
- `return_format: json` + `extract: article` → explicit error
- mixed `urls` batch: per-URL isolation for non-JSON member

Article mode:
- real noisy docs fixture → clean article
- no-main-content fixture → fallback marker
- false-positive selector → fallback preserved content
- PDF URL + `extract: article` → unchanged PDF path
- schema snapshot assertion for tool registration

### Regression

- Run `bun test` in `plugins/zai-research/` and expect all tests green.
- Verify `plugins/zai-research/extensions/pdf.test.ts` still passes after the
  `fetchBounded` refactor.
- Run `./scripts/bump-version.sh zai-research minor` after the implementation is
  committed and clean, since this is a new capability.

## Risks

1. **Article extraction still misses unusual doc templates.** Mitigation:
   real-site fixtures, fallback to full content, and the character floor make
   failures visible rather than silent.
2. **JSON direct-fetch widens the local-fetch attack surface from PDFs to any
   URL.** Mitigation: the same `assertSafeFetchUrl` SSRF guard applies; the
   pre-existing redirect-to-private-host limitation is documented and unchanged.
3. **`fetchBounded` refactor could regress PDF behavior.** Mitigation: the PDF
   caller checks status and throws identically; `pdf.test.ts` covers the path.
4. **New dependencies (`linkedom`, `@mozilla/readability`, `turndown`) could
   complicate bundling or platform support.** Mitigation: all three are pure JS;
   `bun install` and the existing test suite will catch compatibility issues.
5. **New parameters could confuse callers if names are ambiguous.** Mitigation:
   clear descriptions, updated SKILL.md examples, and an explicit error on
   incompatible combinations.

## Cross-model review

A GLM-5.2 reviewer provided the following high-value catches that are now
folded into the design above:

- The original article-extraction design contradicted itself (raw HTML vs
  post-processing webReader output); resolved to raw HTML extraction.
- JSON mode should not reuse the 25 MB PDF cap; introduced a separate 5 MB JSON
  cap.
- Head-truncating JSON produces invalid JSON; switched to safe truncation with
  an external marker.
- `fetchBounded` must expose status/headers so JSON mode can surface 4xx/5xx JSON
  error bodies and report Content-Type on parse failures.
- Mode precedence and mutual-exclusion rules were undefined; added an explicit
  precedence table.
- Regex/article heuristic was judged too fragile; replaced with the
  `linkedom` + `@mozilla/readability` + `turndown` stack and real-site fixtures.
- Test plan needed edge cases (BOM, empty body, 4xx-with-body, large JSON
  truncation, false-positive extraction); added them.
- Version bump should be **minor**; recorded.

## Children complete (2026-06-24)

All child stories are now done and ready for feature review:

- `story-zai-fetch-json-api-mode` — done; JSON/API direct-fetch mode, `fetchBounded` refactor, SSRF hardening, and tests.
- `story-zai-fetch-article-extraction` — done; readability-based article mode, fixtures, routing tests, and fallback cleanup.
- `story-zai-fetch-skill-docs-update` — done; tool guidance and `SKILL.md` updated for JSON/API and article modes.

Verification: `cd plugins/zai-research && bun test` → 71 pass / 0 fail.

