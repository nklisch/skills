---
id: gate-patterns-0.9.0
kind: story
stage: done
tags: [patterns]
parent: null
depends_on: []
release_binding: 0.9.0
gate_origin: patterns
created: 2026-05-31
updated: 2026-05-31
---

# Patterns extracted for 0.9.0

## New patterns codified
- `board-view-module-contract` — board views are `{ id, label, mount(root, ctx) }`,
  self-registered via `registerView`, read only from `ctx`, commit with one
  `root.replaceChildren(...)` (3 views + registrar).
- `dom-text-element-builder` — each dependency-free board ES module declares a
  local `textElement(tag, className, text)` (createElement → optional className →
  textContent → return); never `innerHTML`, never a shared import (8 occurrences).
- `fail-open-subprocess-probe` — always-on hook subprocesses run with `timeout=`,
  `stderr=DEVNULL`, `check=False`, guarded by `except (OSError, TimeoutExpired)`
  / `contextlib.suppress`, returning a neutral empty/None (3 fns).
- `manual-error-display` — `work-view` errors are plain `enum`/`struct FooError`
  with hand-written `impl Display` (no `thiserror`/derive); core never
  `process::exit`s, the CLI adapter maps exit codes (5 occurrences).

## Inconsistencies flagged
None. No bundle code contradicts the 5 existing patterns. The board integration
tests extend the documented `subprocess-cli-harness` to a network boundary (one
shared harness, many tests) — consistent with, not divergent from, that pattern.

## Pattern files written
- `.agents/skills/patterns/board-view-module-contract.md`
- `.agents/skills/patterns/dom-text-element-builder.md`
- `.agents/skills/patterns/fail-open-subprocess-probe.md`
- `.agents/skills/patterns/manual-error-display.md`
- `.agents/skills/patterns/SKILL.md` (regenerated index — now 9 patterns)
- `.agents/rules/patterns.md` (generated hook-loaded digest — first emission in
  this repo, exercising the new patterns-digest capability shipping in 0.9.0)

## Note
The 5 pre-existing pattern bodies carry drifted example `file:line` refs (board
work shifted positions); those are tracked separately as
`gate-docs-pattern-line-refs` (gate-docs), not re-fixed here.
