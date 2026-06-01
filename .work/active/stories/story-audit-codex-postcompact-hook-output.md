---
id: story-audit-codex-postcompact-hook-output
kind: story
stage: implementing
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
