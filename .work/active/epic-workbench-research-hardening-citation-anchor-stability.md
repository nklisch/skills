---
id: epic-workbench-research-hardening-citation-anchor-stability
kind: story
status: active
tags: [plugin, skill, tooling]
parent: epic-workbench-research-hardening
blocked_by: []
related_to: [epic-ard-okf-representation-convergence]
research_refs: []
mock_refs: []
created: 2026-07-28
updated: 2026-07-28
---
# Make attested-detail citation anchors stable

## Brief

Define and enforce the lifecycle of `N` in Workbench's `[handle]{N}` citations.
Workbench currently interprets `N` as a numbered detail under an attestation's
`## Attested details`, but only checks that numbers are unique and that a cited
number exists. It does not govern allocation, ordering, renumbering, reuse, or
retirement. An edit can therefore leave lint green while silently redirecting a
citation to a different source detail.

This contract is distinct from legacy ARD, where `N` identified an append-only
per-corpus bibliography entry. Workbench may retain detail-level anchors, but
the same wire syntax must never hide resolver ambiguity or unstable identity.

## Required design decisions

- Choose between stable append-only positive detail numbers and durable
  non-positional detail identifiers; optimize for human-readable Markdown and
  safe citation maintenance rather than list aesthetics.
- Define what happens when an attested detail is corrected, retired, split, or
  merged, including whether retired anchors remain as tombstones.
- Define how a research profile declares its `[handle]{N}` resolver so
  Workbench-detail and bibliography-entry semantics cannot be confused.
- Determine which invariants static lint can enforce and which require
  migration or diff-aware validation to prevent semantic retargeting.

## Acceptance

- Reordering or inserting details cannot silently change what an existing
  citation denotes.
- An anchor is never renumbered or reused for a different detail after it has
  been cited.
- Corrections preserve the cited proposition's identity or require affected
  citations to be reviewed and updated explicitly.
- Splits, merges, deletions, and resolver changes have documented, test-covered
  behavior with no green-but-retargeted citation path.
- Existing Workbench research receives a deterministic validation or migration
  path if the selected contract requires metadata not currently present.
- The discipline, conventions, linter tests, and profile seam describe the same
  citation-anchor semantics without importing broader orchestration ceremony.
