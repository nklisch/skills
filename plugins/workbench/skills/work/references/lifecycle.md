# Work Item Lifecycle

## Active item

```yaml
---
id: <kebab-case-id>
kind: epic|feature|story|scan
status: active|blocked
tags: []
parent: null
hard_dependencies: []
soft_dependencies: []
research_refs: []
mock_refs: []
release: null
created: YYYY-MM-DD
updated: YYYY-MM-DD
---

# Title

## Intent

<desired outcome and why it matters>
```

A `story` is the smallest durable outcome or concern worth tracking; it does not
map automatically to an agent, size, review lane, or commit. Add body sections
only when they carry useful state. Detailed research lives in
`.research/`; interactive UI walkthroughs live in `.mockups/`; the optional refs
arrays connect them to work. `status: blocked` requires a concrete `## Blocker`
and the condition that would unblock it. There is no `done` status: completion
is a filesystem transition.

## Backlog item

```yaml
---
id: <kebab-case-id>
created: YYYY-MM-DD
updated: YYYY-MM-DD
tags: []
---

<context worth preserving for later>
```

## Archive stub

Used only with `release_mode: summarized`:

```yaml
---
id: <id>
kind: <kind>
tags: []
parent: null
release: null
completed: YYYY-MM-DD
---

# Title

<one or two sentences describing the delivered outcome>
```

The stub is a release input, not a compressed design document. Foundation docs
and code retain standing technical truth.

## Terminal-item sweep

Run at the beginning and end of substantive Workbench operations:

1. inspect active files for invalid terminal labels, completion notes, or work
   whose code and verification show it has already landed;
2. never trust a stale `done` label by itself—verify repository state and
   acceptance evidence;
3. if complete, reconcile foundation docs and atomically archive or remove;
4. if incomplete, normalize to `active` or `blocked` and record the next useful
   action;
5. include swept items in the current coherent delivery commit when related;
   otherwise leave changes for the next authorized checkpoint rather than
   manufacturing one commit per sweep.

## Commit posture

Follow the effective `commits` preference when project policy permits agent
commits:

- `delivery`: one coherent feature-sized outcome, including code, tests, item
  completion, and affected foundation updates;
- `checkpoint`: retain meaningful design, implementation, and integration
  boundaries;
- `granular`: favor independently reviewable or reversible units.

A separate recovery commit remains valid when work is interrupted or risky.
Do not automatically commit parking, scoping, body-section edits, review notes,
status changes, or each child item merely because the substrate changed. Never rewrite shared history merely to make
the commit graph aesthetically perfect.
