---
id: epic-workbench-research-hardening-knowledge-product-profile
kind: feature
status: blocked
tags: [plugin, skill]
parent: epic-workbench-research-hardening
blocked_by: []
related_to: [epic-ard-okf-representation-convergence]
research_refs: [.research/briefs/okf-format-assessment-against-ard-substrate.md]
mock_refs: []
created: 2026-07-28
updated: 2026-07-29
---
# Knowledge-product profile seam (deferred)

## Blocker

Blocked on the agentic-research ARD-on-OKF profile contract (stride 1 of
`epic-ard-okf-representation-convergence`, re-scoped for Workbench on
2026-07-29 and shipping as agentic-research v0.7.0), **including its OKF
v0.2-absorption decisions**. The seam's extension points — artifact-kind
inference, citation resolution, source location, validation, index projection —
must be designed against the settled profile's type vocabulary and index
fan-out discovery, not the pre-convergence four-tier shape. Clears when the
profile contract is published; the seam is then designed once, against it.

## Brief

(Scope amended 2026-07-29: split after adversarial review. The owner
declaration + stop rule is now the active
`epic-workbench-research-hardening-research-owner-guard`. What remains here is
the part that was premature: the extension-point registry, designed against a
substrate whose on-disk meaning the related representation epic is changing.)

Let Workbench actively participate in knowledge-product repositories — where
the durable knowledge substrate and its reader are themselves the product, as
in `SNC/games/library` — beyond merely stopping before foreign schemas. A
declared profile/adapter boundary should let a knowledge-product repository
own additional tiers, local or ingested sources, artifact kinds, temporal
behavior, validators, and a reader/export projection, while the lightweight
built-in profile stays simple.

## Design questions (open until unblocked)

- Which extension points the owning profile actually needs: artifact-kind
  inference, citation resolution, source location, validation, knowledge-index
  projection — confirmed against the settled agentic-research profile, not
  assumed now.
- How `research`, `research-handoff`, and `work` delegate to the owning
  profile deliberately, given the stop rule has already landed.
- How `build-substrate` / knowledge-product intent is represented without a
  contrived one-shot downstream code decision; sustained future readers and
  design-system formation are valid consumers.
- How reader rendering, access control, and deployment stay repository-owned
  while exposing a clean contract by which a reader can consume validated
  artifacts and provenance.

## Acceptance (draft — revisit at unblock)

- A representative fixture shaped like `SNC/games/library` can use Workbench as
  its work ledger without pluralizing/flattening the research tree, changing
  `[handle]{N}` semantics, rejecting local source locators, or classifying
  corpus manifests as briefs.
- Workbench-native research projects continue to use the current lightweight
  layout without installing agentic-research.
- `research_refs` and the knowledge index preserve the owning artifact's kind,
  authority, identity, and provenance.
- Documentation presents knowledge-as-product as a supported profile, not an
  accidental wildcard-indexing side effect.
