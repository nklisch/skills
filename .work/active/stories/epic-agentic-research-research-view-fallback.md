---
id: epic-agentic-research-research-view-fallback
kind: story
stage: implementing
tags: [tooling]
parent: epic-agentic-research-research-view
depends_on: [epic-agentic-research-research-view-cli]
release_binding: null
gate_origin: null
created: 2026-06-04
updated: 2026-06-04
---

# research-view.sh — bash fallback

## Scope
`plugins/agentic-research/scripts/research-view.sh` — a zero-dependency bash
fallback mirroring the `research-view` binary's read-only query surface over
`.research/`, for platforms without a prebuilt binary and as the installer's
fallback path. Mirrors `plugins/agile-workflow/scripts/work-view.sh`. Implements
Unit 3 of the feature design.

Depends on the CLI story so it mirrors the finalized contract (and so the
parity-diff test has a binary to diff against).

## Acceptance criteria
- [ ] Same filters / output modes / exit codes as the binary across the covered
  surface (no board, no write paths).
- [ ] Carries a `RESEARCH_VIEW_VERSION="x.y.z"` literal in the
  bump-version-projectable form (anchored line `^RESEARCH_VIEW_VERSION="..."`);
  `research-view.sh --version` byte-matches `research-view --version`.
- [ ] Parity-diff test vs the binary via the `subprocess-cli-harness` graceful
  parity-skip: hard-fail on a path/behaviour regression, skip only when a tool is
  absent.
