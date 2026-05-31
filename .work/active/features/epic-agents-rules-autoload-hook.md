---
id: epic-agents-rules-autoload-hook
kind: feature
stage: drafting
tags: [tooling]
parent: epic-agents-rules-autoload
depends_on: []
release_binding: null
gate_origin: null
created: 2026-05-31
updated: 2026-05-31
---

# Generic `.agents/rules/` hook loader

## Brief

Extend `plugins/agile-workflow/hooks/scripts/prompt-context.py` so that, on the
first coding-flavored prompt of each session-epoch, it injects the contents of
`.agents/rules/*.md` into agent context via `hookSpecificOutput.additionalContext`
— the portable, cross-vendor (Claude Code + Codex) replacement for the legacy
Claude-only `.claude/rules/` force-load. The hook is content-agnostic: it reads
whatever `*.md` files exist in `.agents/rules/` (sorted), concatenates under a
terse heading, and injects once per epoch, re-injecting after compaction (epoch
bump) exactly like the existing principles capsules.

This is the foundational feature — the producers (`patterns-digest`,
`convert-extract`) and `skill-grounding` build on the `.agents/rules/` convention
it establishes.

Does NOT cover: what gets written into `.agents/rules/` (that's the producer
features), nor the docs describing the contract (docs feature).

## Epic context
- Parent epic: `epic-agents-rules-autoload`
- Position in epic: foundation feature — the consumer/loader; all other features
  depend on the `.agents/rules/` convention defined here.

## Design constraints inherited from the epic (resolve in design pass)
- **Dedicated broad coding-prompt detector**, separate from the workflow-snapshot
  gate (`cheap_action_candidate`/`is_actionable`). Must catch prompts like "fix
  failing tests", "continue", "debug this build error", and file-specific edits
  that lack a workflow noun (Codex finding 3).
- **Per-epoch dedup with a content hash** so edits to `.agents/rules/` re-inject;
  reuse the existing epoch state file (`SessionStart` resets, `PostCompact` bumps).
- **Document the post-compaction contract**: rules re-inject on the next coding
  `UserPromptSubmit`, not on `PostCompact`/`SessionStart` themselves (finding 4).
- **CONVENTIONS.md flag** (e.g. `rules_context: on|off`, default on) + a byte cap
  (mirroring Codex `project_doc_max_bytes`) to bound injection size.
- Substrate-gated (no `.work/CONVENTIONS.md` → no-op) and portable env
  (`${PLUGIN_ROOT:-${CLAUDE_PLUGIN_ROOT}}`), like the existing hook.

## Foundation references
- `plugins/agile-workflow/docs/SPEC.md` — hook contracts (383-482)
- `plugins/agile-workflow/docs/ARCHITECTURE.md` — hook scripts (408-462)
- Parent epic body — verified Claude+Codex hook contract + trigger decision
