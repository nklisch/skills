---
id: epic-workbench-research-hardening-citation-anchor-stability
kind: feature
status: active
tags: [plugin, skill, tooling]
parent: epic-workbench-research-hardening
blocked_by: []
related_to: []
research_refs: [.research/attestations/okf-spec-v02.md]
mock_refs: []
created: 2026-07-28
updated: 2026-07-29
---
# Make attested-detail citation anchors stable

## Brief

Define and enforce the lifecycle of `N` in Workbench's `[handle]{N}` citations.
Workbench currently interprets `N` as a numbered detail under an attestation's
`## Attested details`, but only checks that numbers are unique and that a cited
number exists. It does not govern allocation, ordering, renumbering, reuse, or
retirement. An edit can therefore leave lint green while silently redirecting a
citation to a different source detail.

This contract is distinct from legacy ARD, where `N` identifies an append-only
per-corpus bibliography entry. Both plugins share the `[handle]{N}` wire
syntax with different resolver semantics; the resolver declaration below keeps
that fork explicit rather than hidden.

## Design decisions (pre-decided 2026-07-29)

Scope amended after adversarial review: the anchor contract is decided up
front because it is the cheapest rule set that makes silent retargeting
impossible. The originally open choice between stable numbers and durable
non-positional identifiers is settled for numbers — human-readable Markdown
and lint simplicity win. A concrete implementation failure is the only thing
that re-opens the choice; if one surfaces, stop and re-scope rather than
growing the contract.

- **Append-only, never renumber, never reuse.** Once a detail has been cited,
  its number never moves and is never reassigned to a different detail. New
  details take the next unused number; insertion order in the file is
  irrelevant to meaning.
- **Considered alternative: OKF v0.2's keyed footnotes.** OKF v0.2 attributes
  claims through footnotes keyed to stable `sources[].id` labels, explicitly
  rejecting positional anchors because reorder silently misattributes
  [okf-spec-v02]{4}. Workbench keeps positional numbers made stable by this
  contract: under append-only + never-renumber the number *is* a stable key
  and order carries no meaning, so the reorder failure mode OKF names does not
  apply. Numbers win on human-readable Markdown and on the existing
  `[handle]{N}` corpus; the fork between the two plugins' anchor models is
  declared, not hidden.
- **Correction preserves identity.** Correcting a cited detail keeps its
  number and reconciles the correction into the attestation; per the
  change-integrity guard, the correction also reaches every downstream claim
  that cited it. A correction that changes what the detail *asserts* (not
  merely its wording) is a retirement plus a new detail, not an edit.
- **Retirement leaves a tombstone.** A retired detail keeps its number with a
  tombstone marker (choose the marker during implementation) so existing
  citations resolve to "deliberately withdrawn," never to a different detail.
- **Splits and merges append.** A split tombstones the original (naming its
  successors) and appends new numbers; a merge appends the merged detail and
  tombstones the originals. No renumbering cascade, ever.
- **One resolver declaration, not a registry.** The research-substrate owner
  declaration (see the owner-guard story) names the `[handle]{N}` resolver in
  one line — Workbench attested-detail semantics — so the same wire syntax is
  never read with ARD bibliography-entry semantics by mistake.
- **Static lint enforces what it can.** Uniqueness, existence, renumbering
  across a diff, reuse, and unmarked retirement are lintable. Semantic
  retargeting that keeps a plausible detail is not statically detectable; the
  guard there is the authoring rule plus diff review, stated honestly as such.
  (Upstream signal: main v0.4.7 slimmed the research lint — `source_url`
  checks became judgment rules — so this contract should prefer the few
  mechanical checks that prove retargeting over broad format policing.)

## Canonical vs convention-flexible (decided 2026-07-29)

Context: `agentic-research` is moving to maintenance; Workbench's
attested-detail model is the single live citation semantics going forward.
ARD's bibliography-entry model is legacy/foreign — handled by the owner
declaration on existing ARD substrates, never adopted as a Workbench
convention.

Canonical invariants (every Workbench research substrate, not overridable):

- **Wire form** `[handle]{N}` in briefs; the handle is the attestation slug
  (filename stem).
- **Anchors live only inside attestations** (`## Attested details`). Nothing
  else is an anchor of record — not `bibliography.yaml`, not the knowledge
  index, not any authored bibliography. Citation meaning never lives in
  derived data.
- **The anchor lifecycle contract** below (append-only, never renumber,
  never reuse, tombstones, splits/merges append).
- **Attest-before-cite**: a detail is attested before it is cited (the
  grounding floor, unchanged).
- **Resolver declaration**: `.research/CONVENTIONS.md` names the
  `[handle]{N}` resolver in one line, so the shared wire syntax never hides
  which semantics a project uses.

Convention-flexible (per project, declared in `.research/CONVENTIONS.md`):

- **Anchor addressing**: positional numbers (default) or stable keyed labels
  for projects that reorganize heavily. Lint enforces whichever scheme is
  declared.
- **Bibliography form**: none, generated (default — `bibliography.yaml`
  stays a disposable projection, never hand-edited), or a curated authored
  reading bibliography. All three are legal *because none is the anchor of
  record*; an authored bibliography is a reading aid and must not define
  citation meaning.
- **Tombstone marker syntax** and any additional generated projections
  (per-directory `index.md` for a reading surface, and similar).

Explicitly not flexible:

- Moving anchors out of attestations.
- An authored bibliography as citation authority (the ARD model — legacy
  substrates only, via the owner declaration).
- Model memory as a bibliographic source (grounding floor).

## Acceptance

- Reordering or inserting details cannot silently change what an existing
  citation denotes.
- An anchor is never renumbered or reused for a different detail after it has
  been cited.
- Corrections preserve the cited proposition's identity or retire-and-append;
  affected citations are reconciled per the change-integrity guard.
- Splits, merges, deletions, and the resolver declaration have documented,
  test-covered behavior with no green-but-retargeted citation path.
- The research skill's `.research/CONVENTIONS.md` init template carries the
  resolver declaration and the declared bibliography form; lint reads the
  declaration and enforces the declared anchor scheme.
- Lint resolves citations only against attestations; no bibliography —
  generated or authored — is ever consulted for citation meaning.
- Existing Workbench research receives a deterministic validation or migration
  path if lint adoption surfaces currently ambiguous anchors.
- The discipline, conventions, linter tests, and owner declaration describe
  the same citation-anchor semantics without importing broader orchestration
  ceremony.
