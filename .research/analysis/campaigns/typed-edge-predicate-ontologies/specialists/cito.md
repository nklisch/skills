---
provenance: agent-synthesis
authored: 2026-06-04
---

# CiTO — Citation Typing Ontology: Facet Brief

**Campaign:** typed-edge-predicate-ontologies
**Facet:** CiTO as source-ontology for ARD typed cross-reference predicates

---

## What CiTO is

The Citation Typing Ontology (CiTO) is an OWL 2 DL ontology whose stated purpose is to enable "characterization of the nature or type of citations, both factually and rhetorically" [cito-spec]{5}. It was created by David Shotton and Silvio Peroni, with contributions from Paolo Ciccarese and Tim Clark, and is published at the IRI `http://purl.org/spar/cito` under CC BY 4.0. The current version is 2.8.1 (2018-02-16) [cito-spec]{5}.

CiTO belongs to the SPAR (Semantic Publishing and Referencing) family of ontologies. Its founding motivation, stated in the 2010 Journal of Biomedical Semantics paper, is that conventional citation lists are opaque: a bare reference reveals nothing about *why* the cited work is cited [cito-paper]{6}. CiTO addresses this by providing a controlled, machine-readable predicate vocabulary encoding authorial intent — whether a citation draws on background, methodology, data, evidence, or is made to agree with, critique, or refute the cited work [cito-paper]{6}.

All CiTO citation predicates are sub-properties of the top-level `cites` property, which means asserting any specific predicate also entails the bare `cites` relation [cito-spec]{5}. The ontology defines 70+ named object properties in version 2.8.1; the original 2010 paper documented 23 [cito-paper]{6}.

---

## The factual/rhetorical axis

CiTO's design explicitly distinguishes two axes of citation typing [cito-spec]{5}:

- **Factual (epistemic-use) citations** — characterise what the cited work objectively supplies to the citing work: data, methods, evidence, background context. The predicate encodes a transfer of epistemic content.
- **Rhetorical (stance) citations** — characterise how the citing author positions the cited work argumentatively: agreement, disagreement, support, refutation, critique.

This axis is not decorative; it is the ontology's primary organising principle and the reason it was designed as a sub-property hierarchy rather than a flat enumeration.

---

## ARD predicates derived from CiTO, with definitions

Each entry below identifies the CiTO source predicate, its verbatim definition from the ontology spec, and its function in an ARD-style typed cross-reference graph.

### `cites`
> "The citing entity cites the cited entity, either directly and explicitly (as in the reference list of a journal article), indirectly (e.g. by citing a more recent paper by the same group on the same topic), or implicitly (e.g. as in artistic quotations or parodies, or in cases of plagiarism)." [cito-spec]{5}

**ARD role:** the untyped fallback — bare citation without a more specific predicate. Because all other predicates are sub-properties, any of them entails `cites`. Use when no more specific relation is known.

---

### `citesAsEvidence`
> "The citing entity cites the cited entity as source of factual evidence for statements it contains." [cito-spec]{5}

**ARD role:** use when a research finding, attestation, or claim draws on a source as empirical grounding. Factual axis. Sub-property of `cites`.

---

### `extends`
> "The citing entity extends facts, ideas or understandings presented in the cited entity." [cito-spec]{5}

**ARD role:** use when an ARD analysis item or position builds forward from a prior result — adding scope, deepening a finding, or applying a framework to a new domain. Marks intellectual lineage without mere repetition. Sub-property of `cites`.

---

### `refutes`
> "The citing entity refutes statements, ideas or conclusions presented in the cited entity." [cito-spec]{5}

**ARD role:** use in disconfirming analysis when evidence or argument in the citing item contradicts a conclusion in the cited source. Rhetorical/negative-stance axis. Sub-property of `cites`.

---

### `usesMethodIn`
> "The citing entity describes work that uses a method detailed in the cited entity." [cito-spec]{5}

**ARD role:** use when an ARD research procedure (a search protocol, evaluation rubric, gate criterion) is adopted from a cited source. Factual/methodological axis. Sub-property of `cites`.

---

### `obtainsBackgroundFrom`
> "The citing entity obtains background information from the cited entity." [cito-spec]{5}

**ARD role:** use when a brief, position, or analysis draws contextual framing from a source without using it as direct evidence. Factual axis (context-setting rather than evidence). Sub-property of `cites`.

---

### `supports`
> "The citing entity provides intellectual or factual support for statements, ideas or conclusions presented in the cited entity." [cito-spec]{5}

**ARD role:** use when a cited item's conclusions align with and reinforce the citing item's position. Rhetorical/positive-stance axis. Distinguished from `citesAsEvidence` in directionality: `supports` means the citing item *endorses* the cited item's conclusions; `citesAsEvidence` means the citing item *uses* the cited item as evidence for its own claims. Sub-property of `cites`.

---

### Additional CiTO predicates of potential ARD interest

The following predicates exist in CiTO and may be useful in ARD contradiction or verification workflows, though they are not listed as core ARD predicates in the campaign seed:

| Predicate | Definition (abbreviated) [cito-spec]{5} | ARD utility |
|---|---|---|
| `agreesWith` | citing entity agrees with statements/ideas in cited entity | positive stance, weaker than `supports` |
| `corrects` | citing entity corrects statements/conclusions in cited entity | factual-error correction; useful in attestation updates |
| `critiques` | citing entity critiques statements/conclusions in cited entity | structured critique without full refutation |
| `disputes` | citing entity disputes statements/conclusions in cited entity | weaker negation than `refutes` |
| `qualifies` | citing entity places conditions on statements/conclusions | nuanced hedging of a prior claim |
| `citesAsDataSource` | cited entity is source of data | data-specific variant of `citesAsEvidence` |
| `usesDataFrom` | citing work uses data presented in cited entity | narrower than `citesAsDataSource` |
| `usesConclusionsFrom` | citing work uses conclusions from cited entity | conclusion-reuse tracing |
| `confirms` | citing entity confirms facts/ideas in cited entity | independent confirmation (replication-adjacent) |

---

## What CiTO contributes to ARD

1. **A stable, externally-maintained predicate vocabulary.** Rather than inventing ad-hoc relation names, ARD can ground its typed-edge predicates in an ontology with a persistent IRI, versioned releases, and a published rationale [cito-spec]{5} [cito-paper]{6}.

2. **The factual/rhetorical distinction as a design primitive.** ARD's distinction between "this source supplies evidence" vs. "this source is positioned rhetorically" maps directly onto CiTO's explicit design axis [cito-spec]{5}.

3. **Sub-property entailment.** Any CiTO-derived typed edge also implicitly asserts `cites`, enabling generic citation-network traversal without losing specificity [cito-spec]{5}.

4. **Inverse properties.** Every CiTO predicate has a defined inverse (e.g. `isCitedAsEvidenceBy`, `isExtendedBy`, `isRefutedBy`), enabling bidirectional graph queries on the ARD `.research/` substrate without requiring separate inverse assertions [cito-spec]{5}.

5. **Semantic Web / Linked Data interoperability.** CiTO predicates are OWL object properties with stable IRIs in the `http://purl.org/spar/cito/` namespace; any ARD output using them is natively compatible with Semantic Web tooling and citation graph databases [cito-paper]{6}.

---

## Disconfirming analysis

**Claim under test:** CiTO predicates are a sufficient basis for ARD's typed cross-reference vocabulary.

**Disconfirming considerations identified:**

1. **CiTO is citation-centric, not general knowledge-graph-centric.** All predicates assume a *scholarly citation* context (a citing entity and a cited entity). ARD may need cross-reference predicates between non-bibliographic items (e.g. a `.work/` feature item refuting a `.research/` hypothesis). CiTO does not define predicates for that context. This is a scope gap, not an error in CiTO.

2. **Predicate inflation risk.** CiTO defines 70+ properties; using all of them in ARD may create cognitive overhead. The campaign seed lists only 7 core ARD predicates. CiTO's vocabulary is a superset; ARD needs a principled selection policy, which CiTO itself does not provide.

3. **No temporal or confidence semantics.** CiTO predicates are atemporal and do not encode confidence level. ARD's attestation layer adds both, but this means the ARD graph semantics are strictly richer than CiTO alone provides.

4. **Springer full-text inaccessible.** The 2010 paper body was not fully readable due to authentication redirect (see attestation `cito-paper`). Internal argument and any design decisions described in the paper body beyond the abstract are therefore not confirmed from source-direct access in this session. This is a gap in `cito-paper` coverage; `cito-spec` (the ontology HTML document itself) is fully accessible and covers the predicate definitions authoritatively.

**Outcome:** No disconfirming evidence was found that undermines CiTO as a suitable *grounding* ontology for ARD's listed predicates. The gaps identified are scope and policy matters — they argue for selective adoption of CiTO predicates within ARD, not against using CiTO as the source ontology.

---

## Contradictions

No source-level contradictions were found between `cito-spec` and `cito-paper`. The 2010 paper predicate count (23) vs. the current spec (70+) reflects ontology evolution between 2010 and 2018, not a contradiction — the later version is a superset [cito-spec]{5} [cito-paper]{6}.

---

## Revisit if

- The ARD predicate vocabulary expands beyond scholarly-citation contexts (e.g. software artifact cross-references, issue-tracker item relations): at that point, evaluate whether CiTO should be supplemented with a more general knowledge-graph relation ontology (e.g. SKOS, Dublin Core relations, or a custom ARD extension namespace).
- CiTO releases a version beyond 2.8.1 with breaking changes to property IRIs or definitions.
- Full-text access to Shotton 2010 becomes available, allowing verification of design-decision arguments in the paper body that are not recoverable from the abstract alone.
