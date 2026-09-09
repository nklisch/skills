# Work Lifecycle

## Contents

- Item tiers
- Decompose as work develops
- Relationships and readiness
- Item shape
- Backlog-to-active transition
- Completion sweep

## Item tiers

Use the smallest tier that matches the durable outcome. Features and small
stories may stand alone; epics always decompose into features:

- A **feature** is the default delivery unit. Use one for
  a coherent capability, behavior change, or maintenance outcome. It may be
  top-level or belong to an epic.
- An **epic** is a top-level outcome that needs at least two independently
  meaningful feature outcomes and always decomposes into feature items. It holds
  the shared outcome, feature links, cross-feature decisions, and integrated
  acceptance—not the detailed execution or activity record. Create the owning
  feature before its design or implementation proceeds. Every active epic has
  feature children; do not leave an epic as an undecomposed execution file.
- A **story** is a narrow independently verifiable slice. It may stand alone for
  a small bug or small item. A slice of a larger feature belongs to that feature
  through `parent`. Stories cannot have children.

Nested items follow `epic → feature → story` without skipping or reversing a
tier. Do not create an epic for importance, uncertainty, or size alone. Do not
create hierarchy for temporary agent tasks. Keep those tasks in the item's
execution approach.

Every active item must communicate three things, using headings that fit the
work:

1. the outcome that becomes true;
2. the included boundary and meaningful exclusions;
3. the observable evidence that permits closure.

## Decompose as work develops

Features and stories are the detailed work records. Split a large feature into
stories when distinct slices, remaining work, or follow-ups need their own status,
acceptance evidence, or continuation context. Do not keep extending one feature
file into a task ledger. A small coherent feature needs no stories.

Create or revise children whenever the need becomes clear: during design,
implementation, after a review wave, or on resume. Decomposition is not confined
to initial planning and does not restart settled work. Move each slice's scope,
design decisions, acceptance, and next actions into its owning child; leave only
shared contracts, child links, and integrated acceptance in the parent. Attachments
hold dense specifications, not a substitute task ledger.

Accepted in-scope review follow-ups belong to the affected feature, with stories
when separate tracking helps. Keep required corrections under an open feature
until verified and integrated; creating stories does not discharge review or
acceptance. For already closed work, create a new feature or standalone story
rather than referencing a deleted parent. Out-of-scope findings still need a
selected handoff. Do not create an item per warning or temporary agent task.

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
empty when omitted. `parent` is optional and defaults to no parent. Add optional fields when they carry information; full-form records
remain valid when their hierarchy conforms. Supplied values still follow the same
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
`related_to` list. Close the final feature children and their accepted epic in
the same sweep;
retain any still-needed integration work in an owning feature until then. Do not
close a parent while unfinished children remain. Run the
Workbench validator
after structural ledger changes. Never leave completed items active. Follow the
effective [Git posture](git-posture.md). Ledger creation, state changes, review
metadata, and closure do not require standalone commits; let those edits travel
with the nearest meaningful code or integration boundary. Preserve safe history
when shared or overlapping work makes clean isolation impractical.
