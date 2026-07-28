---
id: epic-workbench-research-hardening-knowledge-product-profile
kind: feature
status: active
tags: [plugin, skill]
parent: epic-workbench-research-hardening
blocked_by: []
related_to: [epic-ard-okf-representation-convergence]
research_refs: [.research/briefs/okf-format-assessment-against-ard-substrate.md]
mock_refs: []
created: 2026-07-28
updated: 2026-07-28
---
# Add an explicit research-owner and knowledge-product profile seam

## Brief

Let Workbench participate safely in both common project shapes:

1. research is evidence that informs code or another delivered outcome; and
2. the durable knowledge substrate and its reader are themselves the product,
   as in `SNC/games/library`.

Workbench currently ships its own canonical `attestations/ + briefs/` schema
while main also ships the full `agentic-research` plugin. Both claim
`.research/`, use incompatible citation-number semantics, and have no declared
owner or delegation rule. Workbench says not to overwrite an existing research
substrate, but its authoring and validation paths still assume the Workbench
schema once research begins.

Define a profile/adapter boundary so the lightweight built-in profile remains
simple while a knowledge-product repository can own additional tiers, local or
ingested sources, artifact kinds, temporal behavior, validators, and a
reader/export projection without being flattened or misclassified.

## Required design decisions

- Add an explicit `.research/CONVENTIONS.md` owner/profile declaration and
  define behavior for Workbench-native, agentic-research-owned, and unknown
  existing substrates.
- Make `work`, `research`, `research-handoff`, and `setup` stop, delegate, or use
  the owning profile deliberately; never silently initialize a second schema.
- Define extension points for artifact-kind inference, citation resolution,
  source location, validation, and knowledge-index projection.
- Represent `build-substrate` or `knowledge-product` intent without requiring a
  contrived one-shot downstream code decision; sustained future readers and
  design-system formation are valid consumers.
- Keep reader rendering, access control, and deployment repository-owned while
  exposing a clean contract by which a reader can consume validated artifacts
  and provenance.

## Acceptance

- A representative fixture shaped like `SNC/games/library` can use Workbench as
  its work ledger without pluralizing/flattening the research tree, changing
  `[handle]{N}` semantics, rejecting local source locators, or classifying
  corpus manifests as briefs.
- Workbench-native research projects continue to use the current lightweight
  layout without installing agentic-research.
- An agentic-research-owned substrate routes to its owning skill and validators
  when available; absence or ambiguity produces a clear stop rather than
  mutation.
- `research_refs` and the knowledge index preserve the owning artifact's kind,
  authority, identity, and provenance.
- Setup inventories and reports foreign research substrates separately from
  competing `.work` owners and requires explicit migration approval before any
  representation change.
- Documentation presents knowledge-as-product as a supported profile, not an
  accidental wildcard-indexing side effect.
