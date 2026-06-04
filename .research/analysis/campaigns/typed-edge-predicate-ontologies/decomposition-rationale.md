---
provenance: agent-synthesis
authored: 2026-06-04
---

# Decomposition rationale (PR.2 fence)

≥3 candidate decompositions of the seed, the comparative assessment, the chosen sample, a
self-flag, and a bracket-framing line.

## Candidates

1. **By source-ontology** — CiTO · IBIS/Toulmin · SKOS. One facet per named ancestor tradition.
2. **By predicate-function** — citation predicates (cites/citesAsEvidence/extends/refutes/…) ·
   argumentation predicates (grounds/supports/objects-to) · associative predicates (related/contrasts).
3. **By ARD-predicate-cluster** — group the twelve `typed_edge_predicates` and trace each
   group's lineage outward.

## Comparative assessment

- **(1) by source-ontology** maps directly onto the seed ("which ontologies ground the vocab"),
  and each facet is a distinct, well-documented standard with its own primary literature — clean
  source-acquisition boundaries, minimal cross-facet overlap.
- **(2) by predicate-function** cuts across the ontologies (CiTO supplies both citation *and*
  some argumentation predicates), so facets would share sources — muddier acquisition.
- **(3) by ARD-cluster** centers ARD's own grouping rather than the external traditions the seed
  asks about; it would re-derive ARD instead of grounding it externally.

## Chosen

**Candidate (1), by source-ontology.** Cleanest acquisition boundaries; directly answers the seed.

## self-flag

Framing the predicates as *inherited from three ontologies* foregrounds lineage and may
under-explore the two predicates ARD marks **substrate-native** (`implements`, `contrasts`) —
which by definition have "no clean ontology ancestor." The cross-synthesis must address them
explicitly rather than letting the by-ontology lens drop them.

## Bracket framing

The by-ontology decomposition may foreclose the question of *why ARD needed substrate-native
predicates at all* — i.e. where the established ontologies fall short for an agent-research
substrate. Hold that as an open thread for the parent synthesis.
