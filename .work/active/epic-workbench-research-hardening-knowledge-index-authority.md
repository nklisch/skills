---
id: epic-workbench-research-hardening-knowledge-index-authority
kind: feature
status: active
tags: [plugin, tooling]
parent: epic-workbench-research-hardening
blocked_by: []
related_to: [epic-ard-okf-representation-convergence]
research_refs: [.research/briefs/okf-format-assessment-against-ard-substrate.md, .research/attestations/okf-spec-v02.md]
mock_refs: []
created: 2026-07-28
updated: 2026-07-29
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

## Design decisions (core pinned 2026-07-29)

Scope amended after adversarial review: the discovery-only core is decided up
front — it is the cheapest rule set that prevents path placement from
manufacturing warrant. Only the relationship-edge semantics remain open.

Decided:

- **Validated-only indexing.** The builder's discovery domain is exactly the
  set of artifacts the research lint (and the work-ledger conventions) can
  classify: canonical attestations, briefs, work items, and durable docs.
  Nested or unvalidated Markdown is never indexed as evidence; whether it is
  indexed as an unclassified document or omitted is an implementation choice,
  documented either way. In a repository whose `.research/` is owned by a
  foreign profile (per the owner declaration), Workbench's lint cannot
  classify those artifacts, so none of them enter the evidence domain — the
  builder states this in its output rather than silently omitting the tree.
  Dereferencing the owning profile's own discovery (e.g. an ARD `index.md`
  fan-out) for navigation is the deferred projection seam, not this feature.
- **Entries carry identity and location, never warrant.** An entry declares
  its derived/discovery role and its owning authority (taken from the
  artifact's own frontmatter), plus a stable identity. The index never infers
  `kind: attestation`, bibliography membership, or any evidence-shaped
  classification from path placement. OKF v0.2's warrant-shaped fields —
  `verified`, derived trust tiers, `usage_count`, `status`, `stale_after`
  [okf-spec-v02]{2}{5}{6}{7} — are read from the artifact by the consumer and
  are never projected into the index as entry-level metadata.
- **Machine-readable derivedness.** The index output identifies itself and
  its entries as derived discovery metadata in the JSON contract, not in
  prose alone; consumers must dereference the indexed artifact before relying
  on its claims — an index summary is navigation, not evidence.
- **Deterministic rebuild.** Existing valid Workbench repositories rebuild
  deterministically; any migration of an existing index is explicit and
  tested.
- **Preserved defenses.** Separate citation authority, deterministic output,
  no relationships to the index itself, and rejection of dangling targets all
  stay.

Open (the only remaining question):

- **Relationship-edge semantics.** Source/target constraints and direction
  for `supports`, `contradicts`, `informs`, and `supersedes`; rejection of
  self-links and authority-reversing edges (a brief may not `supersede` the
  attestation it derives from); where path-fallback identity remains
  acceptable versus requiring an explicit stable id. Keep the rule set
  minimal — this is edge hygiene for a discovery projection, not a typed-edge
  ontology (that research program belongs on the related representation
  epic's side).

## Acceptance

- Nested or otherwise unvalidated Markdown cannot acquire `kind: attestation`
  or bibliography membership solely from its path.
- Index output identifies itself and its entries as derived discovery metadata
  in the machine-readable contract, not prose alone.
- Research identities and relationships survive ordinary file movement or fail
  with an actionable migration error rather than silently changing meaning.
- Invalid direction, self-links, duplicate resolution-critical frontmatter, and
  unvalidated supersession have regression coverage.
- A foreign-owned `.research/` tree (per the owner declaration) is reported as
  outside the builder's evidence domain, never silently omitted or indexed as
  evidence.
- Existing valid Workbench repositories rebuild deterministically, and any
  migration is explicit and tested.
