---
id: story-fix-codex-postcompact-hook-output
kind: story
stage: review
tags: [bug, plugin]
parent: null
depends_on: []
release_binding: null
gate_origin: null
created: 2026-05-31
updated: 2026-05-31
---

# Fix Codex PostCompact hook output

## Symptom

Codex reports after compaction:

`PostCompact hook (failed): error: hook returned invalid PostCompact hook JSON output`

## Root cause

`plugins/agile-workflow/hooks/scripts/prompt-context.py` emits
`hookSpecificOutput.additionalContext` for `PostCompact`. Claude accepts that
shape, but Codex 0.135.0 validates `PostCompact` output against a schema that
only allows common fields such as `continue`, `stopReason`, `suppressOutput`,
and `systemMessage`. The syntactically valid JSON is therefore rejected by
Codex as invalid hook output.

## Fix approach

Detect the Codex hook environment via Codex's `PLUGIN_ROOT`/`PLUGIN_DATA`
variables. For Codex `PostCompact`, continue bumping the hook epoch and running
the fail-open self-heal path, but suppress the unsupported context JSON output.
Codex can still reload rules through the existing `SessionStart` `source:
compact` path and the prompt fallback.

## Regression test

`plugins/agile-workflow/hooks/scripts/test_prompt_context.py` adds a Codex
`PostCompact` regression that asserts stdout is empty, the epoch advances, and
the rules seen-slot is not consumed. It also covers Codex `SessionStart` with
`source: compact` to ensure rules can still be injected through a Codex-valid
event.

## Implementation notes

- Changed `plugins/agile-workflow/hooks/scripts/prompt-context.py` so Codex
  `PostCompact` exits successfully without emitting unsupported
  `hookSpecificOutput` JSON.
- Kept Claude/default `PostCompact` context output unchanged.
- Added Codex-specific regression coverage in
  `plugins/agile-workflow/hooks/scripts/test_prompt_context.py`.
- Updated `plugins/agile-workflow/docs/SPEC.md`,
  `plugins/agile-workflow/docs/ARCHITECTURE.md`, and
  `docs/agile-workflow-guide.md` to document the Codex `PostCompact` output
  limitation and the `SessionStart source: compact` fallback path.
- Verified with `python3 -m unittest
  plugins/agile-workflow/hooks/scripts/test_prompt_context.py -v`,
  `python3 -m py_compile plugins/agile-workflow/hooks/scripts/prompt-context.py
  plugins/agile-workflow/hooks/scripts/test_prompt_context.py`, direct Codex
  `PostCompact` and `SessionStart source: compact` reproductions, and
  `git diff --check`.
