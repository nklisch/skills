---
id: epic-workbench-research-hardening-knowledge-index-authority
kind: feature
status: active
tags: [plugin, tooling]
parent: epic-workbench-research-hardening
blocked_by: []
related_to: [epic-ard-okf-representation-convergence]
research_refs: [.research/briefs/okf-format-assessment-against-ard-substrate.md]
mock_refs: []
created: 2026-07-28
updated: 2026-07-28
---
# Make the knowledge index enforceably discovery-only

## Brief

Harden `.knowledge/index.json` against accidental convergence with permissive
OKF-like semantics. Workbench prose says the index has no independent authority,
but the current builder recursively indexes every `.research/**/*.md`, infers
evidence-shaped kinds from path placement, falls back to path identity, and
accepts relationships based only on predicate spelling and target existence.
Meanwhile, research lint covers only direct children of the canonical
attestation and brief directories.

The goal is not to reject OKF or prevent future interoperability. It is to make
the index an explicitly derived projection over artifacts validated by their
own authority, rather than a second knowledge substrate in which directory
placement can manufacture warrant.

## Required design decisions

- Define how an indexed entry declares its derived/discovery role, owning
  authority, provenance class, and stable identity without duplicating source
  content.
- Align the builder's recursive discovery domain with the validators that are
  entitled to classify an artifact as an attestation, brief, project document,
  or work item.
- Define source/target constraints and direction for `supports`, `contradicts`,
  `informs`, and `supersedes`; reject self-supersession and authority-reversing
  edges rather than validating existence alone.
- Decide where path fallback identity remains acceptable and where an explicit
  stable id or handle is required.
- Require consumers to dereference the indexed artifact before relying on its
  claims; an index summary is navigation, not evidence.

## Acceptance

- Nested or otherwise unvalidated Markdown cannot acquire `kind: attestation`
  or bibliography membership solely from its path.
- Index output identifies itself and its entries as derived discovery metadata
  in the machine-readable contract, not prose alone.
- Research identities and relationships survive ordinary file movement or fail
  with an actionable migration error rather than silently changing meaning.
- Invalid direction, self-links, duplicate resolution-critical frontmatter, and
  unvalidated supersession have regression coverage.
- Existing valid Workbench repositories rebuild deterministically, and any
  migration is explicit and tested.
- The design preserves the useful defenses already present: separate citation
  authority, deterministic output, no relationships to the index itself, and
  rejection of dangling targets.
