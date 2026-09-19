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

Backlog items may own linked attachments under the same
`.work/attachments/<item-id>/` layout. Preserve the id and attachment directory
on activation, updating owner backlinks from backlog to active. Attachment
presence does not establish design readiness. See
[design attachments](design-attachments.md) for ownership and deletion rules.

When `.work/CONVENTIONS.md` declares `roadmap: true`, `docs/ROADMAP.md` is a
user-owned planning document that may inform context but does not control the
transition. Keep the roadmap unchanged when a backlog item becomes active
unless the user explicitly asks to update it. Determine item state, completion,
and next work from `.work/`, not from roadmap metadata or prose.

## Completion sweep

### Reconcile current state

`.work/` is the agents' working ledger. At entry/resume, integration checkpoints,
and before reporting completion, reconcile the selected boundary and its links.
Resolve clearly stale records encountered along the way rather than avoiding
work that predates this session. This is not a repository-wide audit or authority
to implement unrelated unfinished work.

Use code, checks, Git history, and item evidence to close accepted outcomes,
remove cleared blockers, merge duplicates while retaining unique requirements,
and trim superseded records after carrying forward useful context. Routine
hygiene needs no separate approval, including under collaborative posture.
Record a brief disposition and evidence before removing an item; report meaningful
cleanup in chat. Merged or superseded does not mean delivered.

Age or old authorship establishes neither abandonment nor live ownership.
Investigate rather than skip. Narrow unfinished items to their actual remaining
scope and next action or blocker. Do not erase unmet requirements, reprioritize,
or cancel still-wanted work as hygiene; ask about unresolved consequential
choices and coordinate around another agent's live assignment.

### Close eligible items now

Once acceptance is satisfied, close in the same run, not at a later release or
one final campaign step:

1. Confirm applicable verification, review, corrections, and reconciliation.
   Features and standalone stories awaiting shared review retain its owner and
   checkpoint under [review boundaries](review-boundaries.md); pending review
   alone is not a blocked status. Verified nested stories may close while their
   feature owns integrated acceptance. Never close a parent with unfinished
   children; close accepted parents with their final children.
2. Apply the [Git preservation floor](git-posture.md#preserve-items-before-trimming)
   before completion or destructive trimming.
3. Reconcile needed durable truth and search the remaining ledger, including
   backlog prose, for retiring ids and item/attachment paths. Remove cleared
   dependency and relationship edges; replace obsolete owner claims and links
   with the surviving owner, durable truth, or useful Git pointer. Preserve
   still-needed requirements. Report user-owned roadmap links needing a decision
   rather than changing the roadmap without permission.
4. Apply `completed_items`: `summarize` replaces the item with a compact
   `.work/completed/<id>.md` stub containing identity, completion date, and outcome;
   `discard` removes it. Under both, delete its entire `.work/attachments/<id>/`
   directory—never archive it with the stub. Unfinished items keep their attachments.
5. Refresh an existing knowledge index and run the
   [project-aware validator](validation.md) after structural changes.
