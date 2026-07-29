---
id: epic-workbench-research-hardening-research-owner-guard
kind: story
status: active
tags: [plugin, skill]
parent: epic-workbench-research-hardening
blocked_by: []
related_to: [epic-workbench-research-hardening-knowledge-product-profile]
research_refs: []
mock_refs: []
created: 2026-07-29
updated: 2026-07-29
---
# Declare research-substrate ownership; stop before rewriting foreign schemas

## Brief

Workbench currently ships its own canonical `attestations/ + briefs/` schema
while this repo also ships the full `agentic-research` plugin. Both claim
`.research/`, use incompatible citation-number semantics, and have no declared
owner or delegation rule. Workbench already says not to overwrite an existing
research substrate, but its authoring and validation paths still assume the
Workbench schema once research begins.

This story is the small, load-bearing half of the composition seam: an explicit
owner declaration and a stop rule. The larger extension-point seam that would
let Workbench actively support foreign profiles is
`epic-workbench-research-hardening-knowledge-product-profile`, blocked pending
the agentic-research profile decision.

## What lands

- `.research/CONVENTIONS.md` carries a one-line owner declaration:
  `owner: workbench` (Workbench-native), `owner: agentic-research` (a legacy,
  frozen ARD substrate — agentic-research is in maintenance), or absent
  (unknown).
- `research`, `setup`, and `work`'s research paths check the declaration once:
  - Workbench-native, or absent with an empty/new substrate: proceed as today.
  - Foreign (`agentic-research`) or unknown-but-nonempty: **stop** — surface
    the owning skill/validator if available, otherwise report the conflict and
    ask. Never silently initialize a second schema, flatten, pluralize, or
    rewrite the existing tree.
- `setup` inventories and reports a foreign research substrate separately from
  competing `.work` owners, and requires explicit user approval before any
  representation change.

## Acceptance

- A foreign or ambiguous `.research/` produces a clear stop with an actionable
  message; no file is created, moved, or rewritten.
- Workbench-native research projects are unaffected.
- The declaration and stop rule are prose plus one lookup — no profile
  registry, no routing table, no new skill surface.
