# Work Lifecycle

## Item tiers

Use the smallest tier that matches the durable outcome. Optional depth prevents
wrapper items, while strict nesting keeps each tier meaningful:

- A **feature** is the default delivery and integrated review unit. Use one for
  a coherent capability, behavior change, or maintenance outcome. It may be
  top-level or belong to an epic.
- An **epic** is a top-level outcome that needs at least two independently
  meaningful feature outcomes. The features must be nameable, but they need not
  all become active files before they need separate status or relationships.
- A **story** is a narrow independently verifiable slice. It may be top-level or
  belong to a feature, and it cannot have children.

Nested items follow `epic → feature → story` without skipping or reversing a
tier. Do not create an epic for importance, uncertainty, or size alone. Do not
create hierarchy for temporary agent tasks. Keep those tasks in the item's
execution approach.

Every active item must communicate three things, using headings that fit the
work:

1. the outcome that becomes true;
2. the included boundary and meaningful exclusions;
3. the observable evidence that permits closure.

## Relationships and readiness

- `parent` expresses outcome hierarchy, not scheduling.
- `blocked_by` means another active item should finish first. Use it for a hard
  prerequisite or when serial work materially reduces rework, ambiguity, or
  integration risk.
- `related_to` communicates useful context without controlling readiness.
- Parentage, shared files, and a preferred working order do not create a
  `blocked_by` edge by themselves. Leave independent items edge-free so agents
  can run them in parallel.

Every `blocked_by` edge needs one reason in an exact `## Sequencing` section:

```markdown
## Sequencing

- `feature-contract`: Its settled contract prevents avoidable rework here.
```

The section contains exactly one non-empty entry for each edge and no stale
entries. An item with `blocked_by` uses `status: blocked`. Remove a completed id
and its sequencing entry together. Return the item to `active` when the final
edge clears and no external blocker remains.

An external blocker uses an exact `## Blocker` section that names the condition
and how it clears. An item with that section also uses `status: blocked`.
`related_to` may be reciprocal because it does not control readiness.

## Item shape

Active items use:

```yaml
---
id: <stable-kebab-id>
kind: epic|feature|story
status: active|blocked
tags: []
parent: null
blocked_by: []
related_to: []
research_refs: []
mock_refs: []
created: YYYY-MM-DD
updated: YYYY-MM-DD
---
```

Ids are unique across all `.work/`. The first non-empty body line is a Markdown
title, immediately followed by the canonical line:

> Workbench version mismatch: stop and offer setup upgrade.

Keep one coherent outcome in one item. Use tags such as `audit`, `security`,
`performance`, `pattern`, `refactor`, or `cleanup` for focused outcomes rather
than another item kind. A pattern-extraction or cleanup feature discovered at a
large-work maintenance boundary belongs under the active epic when that epic
owns the boundary; otherwise it is top-level. Never nest it under a feature.

## Completion sweep

At entry and exit, inspect `.work/active/` for stale completion claims or
interrupted work. Verify actual repository evidence before closing. Never infer
completion from a stale label.

Close atomically:

- `completed_items: summarize` replaces the active item with one compact
  `.work/completed/<id>.md` stub containing identity, completion date, delivered
  outcome, and the canonical version guard line;
- `completed_items: discard` removes the active item.

Before closure, remove the completed id from each active `blocked_by` and
`related_to` list. Remove its matching `## Sequencing` entry in the same edit.
Do not close a parent while active children remain. Run the Workbench validator
after structural ledger changes. Never leave completed items active. Commit at
coherent delivery boundaries when repository policy permits. Item edits do not
require their own commits.
