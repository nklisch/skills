---
id: story-zai-fetch-article-extraction
kind: story
stage: review
tags: [plugin, tooling, zai-research]
parent: feature-zai-fetch-content-improvements
depends_on: [story-zai-fetch-json-api-mode]
release_binding: null
gate_origin: null
created: 2026-06-23
updated: 2026-06-23
---

# Add article-only extraction mode to fetch_content

## Brief

Doc sites fetched through `webReader` often return markdown full of navigation,
sidebars, footers, and headers. Add an `extract: "article"` mode that strips
this boilerplate and returns the main page content, making doc reads concise.

## Acceptance criteria

- A new `extract` parameter accepts `"full"` (default, current behavior) and
  `"article"`.
- In `"article"` mode, the fetched HTML is cleaned to remove navigation,
  sidebars, footers, ads, and repeated chrome.
- The implementation either uses a lightweight existing library judged worth the
dependency or a clean heuristic with documented limitations.
- Falls back to full extraction if the cleaner cannot identify a main content
  area, with a note in the output.
- New unit tests cover a representative doc-page HTML fixture, a page with no
  identifiable article, and a PDF URL combined with `extract: article`.
- No regression in existing `fetch_content` behavior.

## Implementation notes

- Files changed:
  - `plugins/zai-research/extensions/index.ts` — added `fetchOneArticle` and `extract` parameter integration; reused refactored `fetchBounded`.
  - `plugins/zai-research/extensions/article.ts` — new article-extraction helper using `linkedom`, `@mozilla/readability`, and `turndown`.
  - `plugins/zai-research/extensions/index.test.ts` — added unit tests for article extraction and routing.
  - `plugins/zai-research/extensions/test/fixtures/noisy-docs.html` — realistic noisy docs fixture.
  - `plugins/zai-research/extensions/test/fixtures/no-article.html` — login page fixture with no article.
  - `plugins/zai-research/extensions/test/fixtures/false-positive.html` — fixture where a small `.content` block would falsely win without the character floor.
  - `plugins/zai-research/package.json` and `bun.lock` — added `@mozilla/readability`, `linkedom`, `turndown` dependencies.
- Tests added: `extractArticle` suite, `fetchOneArticle` suite, schema snapshot assertion.
- Discrepancies from design:
  - Tests do not assert on `<h1>` text because `@mozilla/readability` strips the headline from `.content`; the assertion checks for an `## Overview` heading and the canary phrase instead.
  - The malformed-HTML test relaxes the fallback-marker expectation because linkedom/readability can still produce useful output; we only assert no throw and non-empty output.
- Codex review follow-up:
  - Fallback full-page text originally used `document.body.textContent`, which
    could include `<script>`/`<style>` content. The fallback path now removes
    `script`, `style`, `noscript`, `iframe`, and `svg` before extracting text.
  - Added registered-tool routing coverage for `return_format: "json"` +
    `extract: "article"` conflict and PDF URL + `extract: "article"`
    precedence.
  - Fixed the shared mock-fetch helper so the fetch-path tests actually execute.
- Verification: `cd plugins/zai-research && bun test` → **71 pass / 0 fail**.
- Adjacent issues parked: none.
