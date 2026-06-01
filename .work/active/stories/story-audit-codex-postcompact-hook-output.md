---
id: story-audit-codex-postcompact-hook-output
kind: story
stage: done
tags: [bug, tooling]
parent: null
depends_on: []
release_binding: null
gate_origin: null
created: 2026-05-31
updated: 2026-06-01
---

# Audit Codex PostCompact hook output contract

## Brief

Investigate the Codex PostCompact hook failure where the hook returned invalid
PostCompact hook JSON output. The repository already contains archived
`story-fix-codex-postcompact-hook-output`; this story should confirm the fix is
still represented in the hook contract, tests, and docs, and close any remaining
gap if the archived fix is incomplete or has drifted.

## Scope record

- Promoted from backlog during batch scope for found hook work.
- Size: small audit story; implement directly by checking the existing fix,
  running the relevant regression tests, and making only necessary drift fixes.
- Dependencies: none.

## Implementation notes

- Files changed: none; the archived fix remains current.
- Tests added: none.
- Discrepancies from design: none.
- Adjacent issues parked: none.

## Audit result

- Confirmed archived `story-fix-codex-postcompact-hook-output` already fixed
  the reported Codex `PostCompact` invalid JSON output by suppressing
  unsupported context output in Codex hook environments.
- Confirmed `prompt-context.py` still returns before `output_context` for Codex
  `PostCompact` while retaining the `SessionStart source: compact` fallback.

## Verification

- `python3 -m unittest test_prompt_context.RulesLoaderTest.test_main_codex_postcompact_suppresses_unsupported_context_output test_prompt_context.RulesLoaderTest.test_main_codex_sessionstart_compact_emits_rules -v`

## Review

- Verdict: Approve - story verified by implement; fast-lane advance.
- Notes: The audit confirmed the archived Codex PostCompact fix remains current
  and the Codex-specific regression tests pass.
