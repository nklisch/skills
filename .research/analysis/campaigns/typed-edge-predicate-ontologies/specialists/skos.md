---
provenance: agent-synthesis
authored: 2026-06-04
---

# SKOS Facet Brief — ARD `related` Predicate Grounding

## What SKOS is

SKOS (Simple Knowledge Organization System) is a W3C Recommendation defining a common RDF/OWL data model for knowledge organization systems — thesauri, taxonomies, classification schemes, and subject heading lists. Its design goal is to represent the *informal* relational structure of existing KOS artifacts on the Web without requiring transformation into a full formal-logic ontology [skos-reference]{9}. SKOS operates as an OWL Full vocabulary, making its properties usable directly in RDF graphs alongside standard OWL constructs [skos-reference]{9}.

The SKOS vocabulary is organized around three structural clusters: (1) Concepts and Concept Schemes, (2) Lexical Labels, and (3) Semantic Relations. The Semantic Relations cluster (§8) is the most directly relevant to ARD's predicate vocabulary, because it is where `skos:related` — the associative semantic-relation primitive — is formally specified [skos-reference]{9}.

## What `skos:related` contributes

### Associative relation

`skos:related` asserts an associative link between two SKOS concepts — that "two concepts are inherently 'related', but that one is not in any way more general than the other" [skos-reference]{9}. It is a sub-property of `skos:semanticRelation`, whose domain and range are both `skos:Concept` (S19–S21) [skos-reference]{9}. The associative character means `skos:related` explicitly excludes hierarchical (broader/narrower) semantics: it is formally declared disjoint with `skos:broaderTransitive` (S27) [skos-reference]{9}. A concept pair therefore cannot simultaneously bear both an associative and a transitive-hierarchical link in valid SKOS data.

### Symmetry

`skos:related` is declared an instance of `owl:SymmetricProperty` (S23): if `<A> skos:related <B>`, the triple `<B> skos:related <A>` is entailed [skos-reference]{9}. This is not just a convention — it is a formal OWL entailment rule baked into the vocabulary definition. No direction is privileged; the relation is inherently bidirectional.

### Non-transitivity

`skos:related` is explicitly *not* transitive [skos-reference]{9}: `<A> skos:related <B>` and `<B> skos:related <C>` do not entail `<A> skos:related <C>`. Each associative link is a point-to-point assertion; no implied chains are created. This prevents associative closure from silently inflating the graph.

### Cross-scheme extension: `skos:relatedMatch`

SKOS also defines `skos:relatedMatch` (§10) as a sub-property of both `skos:mappingRelation` and `skos:related`, inheriting the symmetric property (S44) [skos-reference]{9}. It carries the same associative, symmetric, non-transitive semantics as `skos:related` but scoped by convention to links crossing concept-scheme boundaries [skos-reference]{9}. This establishes a consistent semantic lineage: intra-scheme associative links and cross-scheme associative mapping links share the same foundational property.

## Mapping to ARD's `related` predicate

ARD's `related` predicate is described as the generic associative, symmetric link and ARD's only symmetric predicate. The mapping to `skos:related` is direct and tight on all three load-bearing dimensions:

| Dimension | `skos:related` | ARD `related` |
|---|---|---|
| Semantic character | Associative (inherently related, neither more general) | Generic associative link |
| Symmetry | Formal OWL symmetric property (S23) [skos-reference]{9} | Only symmetric predicate in ARD |
| Transitivity | Non-transitive (explicit in §8.6.4) [skos-reference]{9} | Point-to-point; no implied closure |
| Hierarchical exclusion | Disjoint with `skos:broaderTransitive` (S27) [skos-reference]{9} | Distinct from directed/hierarchical predicates |

SKOS provides the formal ontological pedigree for this predicate shape. ARD can ground the design rationale for `related`'s symmetry and non-transitivity directly in the SKOS Recommendation rather than asserting them as ad hoc choices.

## Disconfirming analysis

**Could `skos:related` be asymmetric in practice?** The symmetry is a formal OWL entailment (S23), not merely a guideline. Any SKOS-conformant reasoner will derive the inverse triple automatically. There is no mechanism in SKOS to assert a one-directional `skos:related` link without the entailed converse — the symmetry is non-negotiable within the model [skos-reference]{9}. This is not disconfirmed.

**Does SKOS over-specify compared to ARD needs?** SKOS's integrity condition (S27 — disjointness with `skos:broaderTransitive`) applies within a formal SKOS reasoning context. ARD operates at the substrate/file level, not as a live OWL reasoner. ARD's `related` predicate inherits the *conceptual* constraint (associative, not hierarchical) but does not need to enforce it via OWL reasoning. This is a scope difference, not a contradiction — SKOS provides the semantic grounding, ARD enforces the distinction through predicate naming and schema conventions rather than OWL inference.

**Is `skos:related` the right ancestor rather than a more expressive property?** OWL itself offers `owl:topObjectProperty` and various symmetric-property patterns, and other ontologies (ISO 25964, MADS/RDF) define associative relations too. SKOS is the most widely cited standard for thesaurus-style KOS associative relations on the Web, and its `skos:related` is specifically designed to be a *lightweight* associative primitive — which matches ARD's generic non-hierarchical link intention. No stronger disconfirmation found.

## Revisit if

- ARD introduces a *directed* associative predicate that is not symmetric — `skos:related` would then cover only the symmetric case, and a separate grounding (e.g., from MADS/RDF or a custom extension) would be needed for asymmetric association.
- ARD adopts full OWL reasoning on its `.research/` graph — at that point the formal disjointness constraint (S27) becomes actively enforceable and should be explicitly adopted or consciously waived.
- `skos:relatedMatch` becomes relevant if ARD's `related` is ever scoped to cross-campaign or cross-scheme links (paralleling SKOS's intra- vs. cross-scheme distinction).
- The W3C publishes a successor to SKOS that revises the symmetry or associative-relation definitions — current recommendation (SKOS Reference) has been stable since 2009.
