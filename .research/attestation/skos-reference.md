---
source_handle: skos-reference
fetched: 2026-06-04
source_url: https://www.w3.org/TR/skos-reference/
provenance: source-direct
---

## Summary

The W3C SKOS Reference (SKOS = Simple Knowledge Organization System) defines a common RDF/OWL data model for representing knowledge organization systems (KOS) — thesauri, taxonomies, classification schemes, and subject heading lists — in a machine-readable form suitable for publication and linking on the Web. The specification is organized around three major concept clusters: SKOS Concepts and Concept Schemes, Lexical Labels, and Semantic Relations. The Semantic Relations section (§8) is where `skos:related` is formally defined as the associative semantic-relation primitive between concepts within a concept scheme. A separate Mapping Relations section (§10) extends this with `skos:relatedMatch` for cross-scheme associative alignment. The key architectural choice is that SKOS deliberately avoids the full expressivity of OWL formal logic; it models the *informal* structure of existing KOS artifacts while remaining compatible with OWL.

## Key passages

### §8 Semantic Relations — scope and intent

> "skos:semanticRelation: links between SKOS concepts where the link is inherent in the meaning of the linked concepts."

> "skos:related is used to assert an associative link between two SKOS concepts, indicating that two concepts are inherently 'related', but that one is not in any way more general than the other."

### §8.3 Class & Property Definitions — formal statements

> "S21: skos:related, skos:broaderTransitive, and skos:narrowerTransitive are sub-properties of skos:semanticRelation."

> "S23: skos:related is an instance of owl:SymmetricProperty."

### §8.3 — inference from symmetry (Example 30)

> "If <A> skos:related <B>, this entails <B> skos:related <A>."

### §8.4 — integrity condition (S27)

> "S27: skos:related is disjoint with the property skos:broaderTransitive."

This prevents a concept pair from simultaneously bearing both an associative and a (transitive) hierarchical link, enforcing the fundamental distinction between associative and hierarchical relations.

### §8.6.4 — non-transitivity

> "skos:related is not a transitive property."

Therefore `<A> skos:related <B>` and `<B> skos:related <C>` do not entail `<A> skos:related <C>`.

### §8.1 — hierarchical vs. associative distinction

> "hierarchical and associative relations [are] fundamentally distinct in nature."

### §10 Mapping Relations — skos:relatedMatch

> "skos:relatedMatch functions as an associative mapping link between two concepts."

> "S40-41: skos:relatedMatch is a sub-property of both skos:mappingRelation and skos:related."

> "S44: skos:relatedMatch is an instance of owl:SymmetricProperty."

## Structural metadata

- **Document type:** W3C Recommendation
- **Topic coverage:** SKOS full vocabulary — Concepts, Labels, Semantic Relations, Documentation, Collections, Mapping Relations, Integrity Conditions
- **Sections directly relevant to this facet:** §8 (Semantic Relations), §8.1–8.4, §8.6.4, §10 (Mapping Relations / skos:relatedMatch)
- **Key formal statements:** S19–S27 (semantic relations), S38–S44 (mapping relations)
- **OWL compatibility:** SKOS is defined as an OWL Full vocabulary; `owl:SymmetricProperty` is the formal mechanism for symmetry
- **Acquisition note:** Full verbatim HTML of the W3C TR was fetched via WebFetch on 2026-06-04. Section-level anchor fragments (#semantic-relations, #S23, #mapping) were also fetched for confirmatory detail. The WebFetch tool returns markdown-converted content; exact typographic rendering may differ from the original HTML, but statement numbers and definitions are faithfully transcribed.
