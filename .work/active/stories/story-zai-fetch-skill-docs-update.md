---
id: story-zai-fetch-skill-docs-update
kind: story
stage: review
tags: [plugin, docs, zai-research]
parent: feature-zai-fetch-content-improvements
depends_on: [story-zai-fetch-json-api-mode, story-zai-fetch-article-extraction]
release_binding: null
gate_origin: null
created: 2026-06-23
updated: 2026-06-23
---

# Update zai-research SKILL.md for new fetch_content modes

## Brief

Update the portable `zai-research` skill documentation so agents and users know
when and how to use the new JSON/API and article extraction modes.

## Acceptance criteria

- The `fetch_content` tool description and `promptGuidelines` describe the new
  `return_format: json` / API mode and `extract: article` mode.
- A new “Patterns” example shows fetching a structured JSON API endpoint to
  confirm model IDs, config keys, or version lists.
- A new “Patterns” example shows using `extract: article` on a noisy docs site.
- Guardrails section notes any limitations (e.g. article extraction is heuristic).

## Implementation notes

- Files changed:
  - `plugins/zai-research/extensions/index.ts` — updated `fetch_content` description, prompt snippet, and prompt guidelines for JSON/API and article modes.
  - `plugins/zai-research/skills/zai-research/SKILL.md` — documented the new mode selection table entries, JSON/API and article extraction patterns, mode precedence, batch semantics, SSRF guards, JSON caps/truncation, and article fallback behavior.
- Tests added: none; documentation/tool-guidance-only change. Existing `fetch_content` schema/routing tests already cover the registered parameters.
- Discrepancies from design: none.
- Verification: `cd plugins/zai-research && bun test` → **71 pass / 0 fail**.
- Adjacent issues parked: none.
