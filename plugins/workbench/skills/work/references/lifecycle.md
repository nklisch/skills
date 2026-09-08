# Work Lifecycle

## Contents

- Item tiers
- Relationships and readiness
- Item shape
- Backlog-to-active transition
- Completion sweep

## Item tiers

Use the smallest tier that matches the durable outcome. Optional depth prevents
wrapper items, while strict nesting keeps each tier meaningful:

- A **feature** is the default delivery unit. Use one for
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

An item with `blocked_by` uses `status: blocked`. Explain non-obvious ordering in
ordinary item prose when it helps a future agent, but do not require a dedicated
section or one explanation per edge. Remove a completed id when its dependency
clears. Return the item to `active` when the final edge clears and no external
blocker remains.

An external blocker uses an exact `## Blocker` section that names the condition
and how it clears. An item with that section also uses `status: blocked`.
`related_to` may be reciprocal because it does not control readiness.

## Item shape

The smallest active item uses:

```markdown
---
id: fix-empty-search
kind: story
status: active
created: 2026-09-05
updated: 2026-09-05
---
# Return no matches for an empty search

An empty query returns no matches instead of every record. Other search behavior
stays unchanged. Verify through the search API with empty and non-empty queries.
```

Identity, kind, status, and dates remain explicit. `tags`, `blocked_by`,
`related_to`, `research_refs`, and `mock_refs` are optional lists and default to
empty when omitted. `parent` is optional and defaults to no parent. Add these
fields when they carry information. Existing full-form items remain valid and
need no migration or cosmetic rewriting. Supplied values still follow the same
type, relationship, hierarchy, readiness, and reference rules.

The body holds outcome, scope, and acceptance evidence in whatever concise shape
fits. Add decisions, next actions, or blockers when needed for continuation.
Do not fill unused sections or duplicate acceptance prose in a separate design.
Optional detailed specifications follow [design attachments](design-attachments.md).
They live under `.work/attachments/<item-id>/` and form part of the owning item's
contract through ordinary Markdown links. They have no independent item status.

Ids are unique across all `.work/`. The first non-empty body line is a Markdown
title. Keep one coherent outcome in one item. Use tags such as `audit`, `security`,
`performance`, `pattern`, `refactor`, or `cleanup` for focused outcomes rather
than another item kind. A pattern-extraction or cleanup feature discovered at a
large-work maintenance boundary belongs under the active epic when that epic
owns the boundary; otherwise it is top-level. Never nest it under a feature.

## Backlog-to-active transition

When `.work/CONVENTIONS.md` declares `roadmap: true`, `docs/ROADMAP.md` is a
user-owned planning document that may inform context but does not control the
transition. Keep the roadmap unchanged when a backlog item becomes active
unless the user explicitly asks to update it. Determine item state, completion,
and next work from `.work/`, not from roadmap metadata or prose.

## Completion sweep

At entry or resume, inspect the selected boundary and its relationships for
interrupted work or stale completion claims. At exit, reconcile affected items.
Do not sweep unrelated active work as a delivery ceremony. Verify repository
evidence before closing; a stale label does not establish completion.

Features and standalone stories with review deferred to a shared checkpoint remain
active. Preserve pending scope, owner, and next checkpoint in existing item prose
under [review-boundaries.md](review-boundaries.md). Pending review alone does not
create a blocked status or dependency. Verified nested stories may close under an
open owning feature, which retains integrated acceptance.

Close atomically:

- `completed_items: summarize` replaces the active item with one compact
  `.work/completed/<id>.md` stub containing identity, completion date, and the
  delivered outcome;
- `completed_items: discard` removes the active item.

In both postures, always delete the completed item's entire
`.work/attachments/<item-id>/` directory. Do not archive attachments or retain them
with a completion stub. Reconcile needed durable truth and remaining references
before deletion under [design attachments](design-attachments.md). Keep attachments
while their item is active, including pending review. Rebuild an existing knowledge
index after deletion.

Before closure, remove the completed id from each active `blocked_by` and
`related_to` list. Do not close a parent while active children remain. Run the
Workbench validator
after structural ledger changes. Never leave completed items active. Follow the
effective [Git posture](git-posture.md). Ledger creation, state changes, review
metadata, and closure do not require standalone commits; let those edits travel
with the nearest meaningful code or integration boundary. Preserve safe history
when shared or overlapping work makes clean isolation impractical.
