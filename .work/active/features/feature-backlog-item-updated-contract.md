---
id: feature-backlog-item-updated-contract
kind: feature
stage: drafting
tags: [plugin, tooling]
parent: null
depends_on: []
release_binding: null
gate_origin: null
research_origin: priority-and-grooming-shapes-for-agentic-substrates
created: 2026-06-15
updated: 2026-06-15
---

# Make `updated` (last-touched) a first-class part of the backlog item contract

## Brief

A backlog grooming/hygiene capability (sibling feature `feature-backlog-grooming-skill`) needs a
**last-touched signal** to distinguish "parked long ago and untouched" from "parked recently" —
age-based staleness detection is impossible on a creation date alone. This feature establishes
that the signal is a reliable, documented part of the backlog item contract.

## What grounding revealed (read before designing)

The naive framing — "add an `updated` field" — is wrong; the mechanism mostly already exists, and
the design must start from that:

- The canonical **active item** frontmatter already requires `updated: YYYY-MM-DD`, auto-bumped by
  the PostToolUse hook on every edit (SPEC §frontmatter).
- The PostToolUse hook's activation already covers **backlog** paths — it auto-bumps `updated:` on
  modified `.work/backlog/` files too (SPEC §hook activation/effect).
- BUT the documented **backlog item shape** is leaner — `id, created, tags` only — and does **not**
  declare `updated:`. So: a freshly-parked, never-edited item has no `updated` at all; and the
  schema *contract* a grooming consumer would rely on does not promise the field.

So the actual gap is **contract clarity + query surface**, not net-new plumbing. The design pass
should establish, at minimum:

1. Whether `updated` becomes a declared (optional, defaulting to `created` when absent) field in
   the documented backlog item shape — so a grooming consumer can rely on a last-touched value for
   every backlog item, edited or not.
2. That `work-view` can surface backlog item age / staleness (a `--stale` / age projection, or at
   least exposing `updated` in backlog queries) so grooming has a query path rather than re-parsing
   frontmatter.
3. Confirm the hook actually populates `updated` on backlog items in practice and that the
   leaner backlog shape and the hook behavior are reconciled (today they disagree: shape omits it,
   hook writes it).

## Design constraints (load-bearing)

- **Optional / inert when absent.** A deployment not running grooming must be unaffected; `updated`
  absent behaves as today (treat as `created`).
- **Follow repo conventions.** Schema/contract change → SPEC + the substrate-maintainer; query
  change → the `work-view` Rust crate; both documented in CONVENTIONS extension surface.

## Why this is the precondition, not the work itself

Grooming's staleness face is the consumer; this feature is the contract it stands on. Sequenced
ahead of `feature-backlog-grooming-skill` via that feature's `depends_on`.

## Research grounding

**Source**: `.research/analysis/positions/priority-and-grooming-shapes-for-agentic-substrates.md`
(slug: `priority-and-grooming-shapes-for-agentic-substrates`), Position 2.

The position names a last-touched signal as grooming's hard precondition: "age-based staleness
detection is impossible if items carry only a creation date." Landscape detail (mechanizable
staleness signals; the canonical stale-bot's age/last-update lifecycle) is in the synthesis brief
`workflow-priority-grooming-for-agentic-substrates-landscape` and the
`backlog-grooming-discipline-landscape` facet brief.
