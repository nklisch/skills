---
id: epic-workbench-research-hardening-knowledge-product-profile
kind: feature
status: active
tags: [plugin, skill]
parent: epic-workbench-research-hardening
blocked_by: []
related_to: []
research_refs: [.research/briefs/okf-format-assessment-against-ard-substrate.md, .research/attestations/okf-spec-v02.md]
mock_refs: []
created: 2026-07-28
updated: 2026-08-22
---
# Knowledge-product profile — Workbench-native support for substrate-as-product repos

## Brief

(Re-scoped 2026-07-29. Originally blocked on the agentic-research ARD-on-OKF
profile contract; that convergence program was retired unshipped when
agentic-research entered maintenance. The seam is now Workbench-native.)

Let Workbench fully support repositories where the durable knowledge substrate
and its reader are themselves the product — as in `SNC/games/library` — rather
than merely stopping before foreign schemas (the owner guard covers that).
A knowledge-product repository may own additional artifact tiers, local or
ingested sources, extra artifact kinds, temporal behavior, validators, and a
reader/export projection, while the lightweight built-in profile stays simple
and the canonical citation contract holds (anchors live in attestations;
nothing derived carries citation meaning).

The library's recorded direction — emit OKF-conformant bundles for the reading
surface — becomes an **export mapping** from a Workbench substrate (a
projection, like `bibliography.yaml` or the knowledge index), not a substrate
convergence. OKF v0.2's keyed-footnote attribution [okf-spec-v02]{4} is an
emission-format concern handled by the exporter, not a change to Workbench's
`[handle]{N}` anchor semantics.

Legacy `agentic-research` substrates (frozen, in maintenance) are not extended
by this profile: they remain foreign-owned under the owner declaration — stop,
never rewrite.

## Dogfood evidence (2026-08-16 adoption, recorded 2026-08-22)

`SNC/games/library` adopted Workbench on branch `trial/workbench` (hard
conversion `f171b9b`, upstream-first plugin patch `c62f17c`, now cherry-picked
as `1dc3651`). What the live adoption validated and changed:

- **The collection root is the first validated extension point.** A curated
  source collection is product substrate, not evidence — acquisition
  manifests tracked, raw fetches gitignored and served behind the project's
  own access rules, attestations citing into the collection by handle. Landed
  in setup's canonical layout and conversion mapping (`§ Collection roots`).
- **Structural placement carries warrant** — the adoption's core principle:
  `corpora/` source-direct, `attestations/` agent warrant, `briefs/` synthesis;
  cross-band placement is a defect even when content is fine, because the
  reading surface renders provenance from the path. This formalizes the
  knowledge-product posture better than any extension-point inventory.
- **The empty-cutover conversion path is honest and works** — ARD tiers were
  empty, so nothing was remapped and nothing fabricated; the owner declaration
  keys adopted verbatim; validators and index green and idempotent.
- **A verified external consumer exists**: `games/wiki` renders `[handle]{N}`
  citations, source handles, and append-only INDEX numbering from the
  substrate. The library's PRINCIPLES now name these as earned compatibility
  obligations — future grammar changes treat the wiki as a consumer.
- **Settled by adoption**: INDEX (not BIBLIOGRAPHY) stays the corpus manifest
  name — the rename task's driver dissolved at conversion.
- **Still open from the dogfood**: wiki citation-hook bug halves (`{N}` anchor
  resolution in nested corpora partially fixed; project scoping and
  silent-literal remain), parent SNC submodule pointers, wiki dual-layout
  tolerance.

## Design questions

- Which extension points a knowledge-product profile actually needs:
  artifact-kind inference, citation resolution (against the canonical
  attested-detail anchors), source location (local and ingested sources, not
  only fetched URLs), validation, knowledge-index projection, and the OKF
  export mapping. (Dogfood 2026-08-16: the collection root answers the
  source-location and artifact-band questions for the corpus case; the wiki
  pipeline is a live consumer of the projection seam.)
- How `build-substrate` / knowledge-product intent is declared in
  `.research/CONVENTIONS.md` alongside the owner declaration — without a
  contrived one-shot downstream code decision; sustained future readers and
  design-system formation are valid consumers.
- How the profile composes with the owner guard: `owner: workbench` plus a
  declared knowledge-product profile extends; `owner: agentic-research`
  stops.
- How reader rendering, access control, and deployment stay repository-owned
  while exposing a clean contract by which a reader can consume validated
  artifacts and provenance.

## Acceptance

- A representative fixture shaped like `SNC/games/library` can use Workbench
  as its work ledger and research substrate without pluralizing/flattening
  the research tree, changing `[handle]{N}` semantics, rejecting local source
  locators, or classifying corpus manifests as briefs. (Validated for the
  corpus band by the 2026-08-16 adoption itself.)
- Workbench-native decision-support projects continue to use the current
  lightweight layout unchanged.
- `research_refs` and the knowledge index preserve the owning artifact's kind,
  authority, identity, and provenance.
- An OKF bundle export, where configured, is generated from validated
  artifacts and is never treated as an anchor of record.
- Documentation presents knowledge-as-product as a supported profile, not an
  accidental wildcard-indexing side effect.
