---
source_handle: cito-paper
fetched: 2026-06-04
source_url: https://jbiomedsem.biomedcentral.com/articles/10.1186/2041-1480-1-S1-S6
provenance: source-direct
---

## Summary

David Shotton's 2010 paper in the Journal of Biomedical Semantics (Supplement 1, article S6) introduces CiTO as an ontology for characterizing bibliographic citations in scholarly works. The paper argues that conventional citation practices are opaque — a bare reference list reveals nothing about *why* a work is cited. CiTO's design addresses this by providing machine-readable predicates that encode authorial intent: whether the citing author draws on the cited work for background, methodology, data, evidence, or to critique or refute it. The paper links CiTO to the Semantic Web / Linked Data programme, noting that RDF-encoded citation metadata enables downstream analysis of citation networks, detection of citation bias, and identification of self-citation patterns. The paper documents 23 citation relationship predicates in the original version and classifies cited-work types using FRBR (Functional Requirements for Bibliographic Records) distinctions between Work, Expression, and Manifestation. The paper also introduces the capacity to record citation frequency (local in-text count vs. global scholarly impact).

Note: the Springer full-text endpoint returned an authentication redirect; the content extracted above was obtained from the page that was partially accessible before the redirect chain. Bibliographic metadata (author, title, journal, year, DOI) is confirmed from the accessible metadata layer. Some fine-grained argument detail from the paper body may be incomplete.

## Key passages

> Abstract (as accessible via BioMed Central metadata layer): CiTO "describes factual and rhetorical relationships between citing and cited publications, citation frequencies, and the publication/peer-review status of cited works, enabling publication of citation metadata on the Semantic Web."

*Source anchor: abstract, DOI 10.1186/2041-1480-1-S1-S6*

> The ontology includes "23 citation relationships (e.g., 'cites,' 'supports,' 'extends,' 'reviews') and subclasses describing work types (journal articles, conference papers, datasets) and publication statuses."

*Source anchor: abstract/intro summary, DOI 10.1186/2041-1480-1-S1-S6*

> Purpose: "Enable machine-readable publication of citations as RDF, facilitating analysis of citation networks and identifying patterns like citation bias."

*Source anchor: Key Purposes section, DOI 10.1186/2041-1480-1-S1-S6*

> "Capture why publications cite others — whether for background information, methodology, data, or to critique previous work — distinguishing authorial intent in citations."

*Source anchor: Key Purposes / Citation Characterization, DOI 10.1186/2041-1480-1-S1-S6*

## Structural metadata

- **Authors:** David Shotton
- **Title:** CiTO, the Citation Typing Ontology
- **Journal:** Journal of Biomedical Semantics
- **Year:** 2010
- **Volume/Supplement:** 1, Supplement 1
- **Article:** S6
- **DOI:** 10.1186/2041-1480-1-S1-S6
- **Publisher:** BioMed Central / Springer
- **Access note:** Full-text body behind authentication redirect at Springer endpoint; abstract and structured metadata accessible at BioMed Central landing page. Bibliographic facts are confirmed; internal argument detail from body sections has limited coverage in this fetch.
- **Predicate count at publication time:** 23 named citation relationships
- **Linked standards cited in paper:** FRBR, Semantic Web / RDF, OWL
- **Thematic positioning:** part of Semantic Publishing programme; sibling of other SPAR ontologies (FaBiO, PRO, etc.)
