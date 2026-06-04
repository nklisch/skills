---
slug: semver-pre-1.0-stability
provenance: agent-synthesis
authored: 2026-06-04
temporal_contract: write-once-on-converge
---

# SemVer 2.0.0 — stability in the 0.y.z initial-development phase

**Seed:** Under SemVer 2.0.0, what stability is guaranteed during the pre-1.0 (`0.y.z`) phase?

The Semantic Versioning 2.0.0 specification makes **no stability promise** during the
major-version-zero phase: it designates `0.y.z` as "for initial development," states that
"Anything MAY change at any time," and that "The public API SHOULD NOT be considered
stable" [semver-spec]{4}. The stability commitment begins at the next milestone — the spec
defines `1.0.0` as the release that "defines the public API," after which increment rules
depend on how that public API changes [semver-spec]{4}.

Read together, the two clauses mark a boundary: before `1.0.0` the version carries no
backward-compatibility guarantee under the spec, and a consumer pinning a `0.y.z` release
takes on whatever change the next release brings; at `1.0.0` the public API becomes the
contract that governs subsequent increments [semver-spec]{4}.

## Disconfirming analysis

Searched the attested source for any carve-out that would grant stability *within* `0.y.z`
(e.g. a guarantee attached to MINOR or PATCH bumps before 1.0). The spec states the opposite
directly — "Anything MAY change at any time" — so no in-source disconfirming evidence was
found. Limitation: this is a single-source engagement at floor rigor; the finding rests on
the canonical specification text alone and was not cross-checked against secondary
interpretations.

## Revisit if

- A later SemVer revision changes the `0.y.z` language (this brief pins SemVer 2.0.0).
