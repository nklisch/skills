---
id: story-zai-fetch-json-api-mode
kind: story
stage: implementing
tags: [plugin, tooling, zai-research]
parent: feature-zai-fetch-content-improvements
depends_on: []
release_binding: null
gate_origin: null
created: 2026-06-23
updated: 2026-06-23
---

# Add JSON/API fetch mode to fetch_content

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
