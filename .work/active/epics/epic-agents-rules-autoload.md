---
id: epic-agents-rules-autoload
kind: epic
stage: drafting
tags: [tooling, skill]
parent: null
depends_on: []
release_binding: null
gate_origin: null
created: 2026-05-31
updated: 2026-05-31
---

# Cross-vendor `.agents/rules/` auto-load mechanism

## Brief

Today the agile-workflow plugin's dense agent rules live inside the managed
`<!-- agile-workflow:start -->` section of `AGENTS.md`, and reusable patterns
produced by `gate-patterns` live in `.agents/skills/patterns/` — meant to
"auto-load when implementing, designing, verifying, or reviewing." In practice
the patterns skill rarely loads, because skill auto-load is keyword/heuristic
and unreliable. The legacy Claude-only `.claude/rules/*.md` mechanism, by
contrast, reliably force-fed rules into every session — but it is Claude-only
and `convert` deprecates it.

This epic introduces a **generic `.agents/rules/` directory** that a plugin hook
force-loads into context on coding work, reliably, in **both Claude Code and
Codex**. It is the portable replacement for `.claude/rules/`. Producers
(`convert`, `gate-patterns`, or the user) drop `*.md` files into `.agents/rules/`;
the hook is content-agnostic and injects them. The dense behavioral rules move
**out of** the always-loaded `AGENTS.md` section (de-duplication) into
`.agents/rules/agile-workflow.md`, and `gate-patterns` writes a concise patterns
digest into `.agents/rules/patterns.md` while the detailed pattern bodies stay in
the `.agents/skills/patterns/` skill (the digest points there for detail).

The same effort hardens `convert`'s legacy cleanup so it can **never lose data**:
every legacy artifact must have a verified replacement at its canonical
destination before any destructive step.

## Strategic decisions

- **AGENTS.md extraction scope**: keep a *slim orientation block* in the managed
  AGENTS.md section (what the substrate is, `work-view` query patterns, the
  item-is-state / rolling-foundation rule, and a one-line pointer to
  `.agents/rules/`); move the *dense behavioral rules* (tag semantics, test
  integrity, advisory-review policy, refactor-conventions pointer) into a managed
  `.agents/rules/agile-workflow.md`. — Rationale: orientation must load
  unconditionally (AGENTS.md always loads; the hook is conditional on
  substrate-present + coding-prompt + Codex hook-trust), while dense situational
  rules are better injected just-in-time and not duplicated.
- **Patterns ↔ rules relationship**: `gate-patterns` writes a concise
  `.agents/rules/patterns.md` digest (slug + one-liner + "load the `patterns`
  skill / read `.agents/skills/patterns/<slug>.md` for full detail"); the
  detailed pattern bodies stay in `.agents/skills/patterns/`. The hook is generic
  — it injects whatever `*.md` files exist in `.agents/rules/`. — Rationale:
  keeps the patterns skill so existing consumers (`gate-cruft`, `gate-docs`,
  `refactor-design`, `implement-orchestrator`) are unchanged; satisfies both
  "generic `.agents/rules` the hook leverages" and "load patterns skill for
  detail"; digest + detail are generated in one `gate-patterns` pass so they
  cannot drift.
- **Graceful degradation**: AGENTS.md retains the orientation + pointer so that
  even when the hook does not fire (no substrate, untrusted hook in Codex,
  non-coding session) agents still know where rules live.
- **Foundation-doc roll-forward is deferred** to the docs child feature and lands
  *with* the implementation, not at scope time — the mechanism does not exist
  yet, and rolling-foundation requires docs to describe the present.

## Proposed decomposition (input to epic-design)

1. `feature-agents-rules-hook-loader` — `[tooling]` — generic `.agents/rules/`
   hook loader. Foundational; others depend on it.
2. `feature-gate-patterns-rules-digest` — `[skill]` — `gate-patterns` writes
   `.agents/rules/patterns.md` digest; repoint its "rules folder directive".
   depends_on: hook-loader.
3. `feature-convert-agents-rules-extraction` — `[skill]` — `convert` extracts
   dense AGENTS.md rules into managed `.agents/rules/agile-workflow.md`; slims the
   AGENTS.md section; updates Phase 6 template + routing + sync. depends_on:
   hook-loader.
4. `feature-convert-cleanup-data-safety` — `[skill]` — content-integrity gate so
   legacy cleanup never loses data (6 findings below). depends_on:
   convert-agents-rules-extraction (the "new pattern" replacement destinations
   include `.agents/rules/`).
5. `feature-rules-foundation-docs-sync` — `[docs]` — SPEC.md, ARCHITECTURE.md,
   MIGRATION.md, README.md, agile-workflow-guide.md, convert
   `legacy-overlap-migration.md`. depends_on: features 1-4.

## Convert legacy-cleanup data-safety findings (audit, 2026-05-31)

Root cause: `convert` trusts *delegation to owning skills* + *reference-integrity
(pointer rewriting)*, but never **verifies content reached its canonical
replacement** before a destructive step (`git rm` / shim / symlink-replace).
Fix theme for feature 4: add a **content-integrity gate** distinct from
reference-integrity — confirm the replacement exists and holds the content (both
halves for split-destination files) before any destructive action.

1. **No content-migration verification before destroying `patterns.md`**
   (Phase 7 ~473-501; Sync S3 ~834-839). DATA-LOSS.
2. **`patterns.md` is a split-destination file** (structural → `.agents/skills/patterns/`,
   prose → AGENTS) with no defined split algorithm and no guard that BOTH halves
   were preserved. DATA-LOSS.
3. **Reference-integrity rewrites pointers only, not content** (Phase 1.8 ~215-222) —
   a pointer can be repointed while the content is never migrated. PARTIAL-LOSS.
4. **`drift_user`/ambiguous** has no atomic confirm→import→verify→shim sequence;
   can strand or drop content (Phase S1 ~755-763, S3 ~834-844). FRAGILE.
5. **`cleanup_scope: generated-only`** can shim `patterns.md` when it matches an
   old template, with no content check — needs a `patterns.md` carve-out
   (Phase 7 ~486-489). DATA-LOSS.
6. **Bespoke-skill convergence** folds patterns "per gate-patterns Phase 1" with
   no verification the import succeeded before removing the source (Phase 8.6
   ~612-638). DATA-LOSS.

## Doc-ripple map (input to feature 5)

- `docs/agile-workflow-guide.md` — layout (74-76); hook behavior (515-540, 770-771).
- `plugins/agile-workflow/docs/SPEC.md` — rules migration (147-169); hook
  contracts (383-482).
- `plugins/agile-workflow/docs/ARCHITECTURE.md` — AGENTS section (157-170); hook
  scripts (408-462); patterns location (529-531).
- `plugins/agile-workflow/docs/MIGRATION.md` — legacy rules migration (331-360).
- `README.md` — canonical layout (200-216).
- `plugins/agile-workflow/skills/convert/references/legacy-overlap-migration.md` —
  DIY→canonical mapping (40-54); patterns.md split note (49-54).
- Consumers (`gate-cruft`, `gate-docs`, `refactor-design`, `implement-orchestrator`)
  read `.agents/skills/patterns/` and need NO change — the skill stays.
- The hook system is ALREADY documented (SPEC 383-482, ARCHITECTURE 408-462); the
  new `.agents/rules/` injection contract must be added there.

## Verified hook contract (Claude Code + Codex, 2026-05-31)

Both ecosystems share the contract the existing hook already uses:
- Events: `SessionStart`, `UserPromptSubmit`, `PostToolUse`, `PostCompact`, etc.
- `hooks.json`: `{hooks:{<Event>:[{matcher,hooks:[{type:"command",command}]}]}}`.
- Output: JSON `hookSpecificOutput.additionalContext` (string) injected as context;
  plain stdout also accepted.
- Env: Codex exports `PLUGIN_ROOT`/`PLUGIN_DATA` AND `CLAUDE_PLUGIN_ROOT`/`CLAUDE_PLUGIN_DATA`;
  existing `${PLUGIN_ROOT:-${CLAUDE_PLUGIN_ROOT}}` is already portable.

Codex caveats: `additionalContext` renders as a *visible* developer message
(openai/codex#16933); no built-in per-session dedup yet (#21675) → the script
must self-dedup (it already does, via the epoch state file); `PreToolUse` does
NOT support `additionalContext` (#19385); plugin hooks require one-time user
trust on install.

The existing `hooks/scripts/prompt-context.py` already fires on
`UserPromptSubmit` with per-session, per-epoch dedup (`SessionStart` resets,
`PostCompact` bumps the epoch), prompt-gating, and substrate-gating — the rules
loader extends this machinery (the `code_design`/`advisory_review` capsule
triggers are a good "coding prompt" proxy).

## Trigger decision (locked earlier with user)

Inject the `.agents/rules/` digest on the **first coding-flavored prompt per
session-epoch** (not every turn, not unconditionally at SessionStart), deduped
per epoch and re-injected after compaction. Style it like the legacy rules,
concise, with a pointer to load the patterns skill for detail.

## Next

`/agile-workflow:epic-design` decomposes this into the child features above with
finalized `depends_on` chains, then `feature-design` per feature.
