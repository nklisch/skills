---
source_handle: cito-spec
fetched: 2026-06-04
source_url: https://sparontologies.github.io/cito/current/cito.html
provenance: source-direct
---

## Summary

CiTO (Citation Typing Ontology) is an OWL 2 DL ontology created by David Shotton and Silvio Peroni (with contributions from Paolo Ciccarese and Tim Clark), currently at version 2.8.1 (released 2018-02-16). Its stated purpose is to enable the formal characterization of the nature or type of citations between scholarly works, both factually (what the cited work provides: data, methods, evidence) and rhetorically (how the citing work positions the cited work: agreement, refutation, critique). The ontology is part of the SPAR (Semantic Publishing and Referencing) family, published under the Creative Commons Attribution 4.0 International licence. It defines a single top-level object property `cites`, with a rich hierarchy of sub-properties covering positive stance (supports, agreesWith, confirms, extends), negative stance (refutes, disputes, disagreesWith, corrects, critiques), epistemic use (citesAsEvidence, citesAsDataSource, usesMethodIn, obtainsBackgroundFrom), and hedged stance (qualifies). The ontology also defines a `Citation` class with subclasses for self-citation patterns and journal-cartel citation detection.

## Key passages

> "The Citation Typing Ontology (CiTO) is an ontology that enables characterization of the nature or type of citations, both factually and rhetorically."

*Source anchor: ontology abstract / IRI http://purl.org/spar/cito*

> **cites**: "The citing entity cites the cited entity, either directly and explicitly (as in the reference list of a journal article), indirectly (e.g. by citing a more recent paper by the same group on the same topic), or implicitly (e.g. as in artistic quotations or parodies, or in cases of plagiarism)."

*Source anchor: object property definition, http://purl.org/spar/cito/cites*

> **citesAsEvidence**: "The citing entity cites the cited entity as source of factual evidence for statements it contains."

*Source anchor: object property definition, http://purl.org/spar/cito/citesAsEvidence*

> **extends**: "The citing entity extends facts, ideas or understandings presented in the cited entity."

*Source anchor: object property definition, http://purl.org/spar/cito/extends*

> **refutes**: "The citing entity refutes statements, ideas or conclusions presented in the cited entity."

*Source anchor: object property definition, http://purl.org/spar/cito/refutes*

> **supports**: "The citing entity provides intellectual or factual support for statements, ideas or conclusions presented in the cited entity."

*Source anchor: object property definition, http://purl.org/spar/cito/supports*

> **usesMethodIn**: "The citing entity describes work that uses a method detailed in the cited entity."

*Source anchor: object property definition, http://purl.org/spar/cito/usesMethodIn*

> **obtainsBackgroundFrom**: "The citing entity obtains background information from the cited entity."

*Source anchor: object property definition, http://purl.org/spar/cito/obtainsBackgroundFrom*

> **agreesWith**: "The citing entity agrees with statements, ideas or conclusions presented in the cited entity."

*Source anchor: object property definition, http://purl.org/spar/cito/agreesWith*

> **corrects**: "The citing entity corrects statements, ideas or conclusions presented in the cited entity."

*Source anchor: object property definition, http://purl.org/spar/cito/corrects*

> **critiques**: "The citing entity critiques statements, ideas or conclusions presented in the cited entity."

*Source anchor: object property definition, http://purl.org/spar/cito/critiques*

> **disputes**: "The citing entity disputes statements, ideas or conclusions presented in the cited entity."

*Source anchor: object property definition, http://purl.org/spar/cito/disputes*

> **qualifies**: "The citing entity qualifies or places conditions or restrictions upon statements, ideas or conclusions presented in the cited entity."

*Source anchor: object property definition, http://purl.org/spar/cito/qualifies*

## Structural metadata

- **Ontology IRI:** http://purl.org/spar/cito
- **HTML spec URL:** https://sparontologies.github.io/cito/current/cito.html
- **Version:** 2.8.1 (2018-02-16); previous 2.8.0
- **Creators:** David Shotton, Silvio Peroni
- **Contributors:** Paolo Ciccarese, Tim Clark
- **Licence:** CC BY 4.0
- **OWL profile:** OWL 2 DL
- **Part of:** SPAR Ontologies family
- **Top-level property:** `cites` (with `isCitedBy` inverse); super-property is `refersTo` from SWAN ontology
- **Sub-property count:** 70+ named citation relationship properties
- **Top-level class:** `Citation`; subclasses include `SelfCitation`, `DistantCitation`, `JournalCartelCitation`
- **All named sub-properties are subproperty of `cites`**, meaning entailment: any specific citation predicate also asserts the bare `cites` relation
- **Rhetorical/factual axis:** explicitly stated design intent; operationalized through property categorisation (epistemic-use vs. stance properties)
