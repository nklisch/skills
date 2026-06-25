---
slug: registration-schema-store-pole-earns-its-place
status: settled
authored: 2026-05-31
provenance: agent-synthesis
temporal_contract: write-once-on-converge
---

# The registration schema's always-present, explicitly-stored field posture is defensible; one field (`analytical_artifact_type`) remains a derive-candidate

> Ported research position behind ARD v0.1 — the reasoning trace for the always-present field posture in the dispatch-time registration contract; see [../../SPEC.md](../../SPEC.md). The attestation layer is not reproduced in this repo (it paraphrases copyrighted sources), so the load-bearing passages are quoted inline and the works are listed under [§Sources](#sources) — the reasoning stands on its own here.

## What the registration contract is and what the tension is

Every ARD research engagement begins with a **dispatch-time registration**: a small, explicit record that declares the engagement's structural properties before any source is fetched. The registration names things such as what goal the engagement is trying to converge on (`intent`), what kind of artifact it is expected to produce (`output_kind`), which verification gates should fire (`verification_rigor`), and what authority the engagement has to revise its scope in flight (`scope_authority`). These ten fields in the registration record play a routing role: the rest of the framework reads them to know which primitives to load, which decision-points to activate, and which verification gates belong in the hard floor for this engagement's shape.

The design commits to an **always-present, explicitly-stored** posture: all ten fields are stored directly in the registration record, regardless of whether some could be derived from others (the registration grew from nine to ten in v0.7.0 with `decision_relevance`; the store-pole posture this position argues is count-independent). This is sometimes called the **store-pole** design — the record holds the complete explicit state. An alternative design — the **derive-pole** — would store only a minimal core and derive the rest at read-time (e.g., "given that `intent` is X and `output_kind` is Y, you can compute `analytical_artifact_type`"). Derive-pole designs appeal to minimization arguments: fewer stored fields mean fewer fields to maintain, fewer fields to get out of sync, and less declaration overhead at dispatch.

The question this position addresses is: which design does the metadata-schema tradition endorse, and where (if anywhere) does a derive-pole alternative look genuinely justified?

## The design history that sharpens the question

ARD did not arrive at its always-present posture without prior simplification (the contract held nine fields when this assessment was authored; v0.7.0 later added `decision_relevance` for ten — the store-pole argument below is count-independent). Two fields were **already retired** before this assessment: `mode` (which took values like `close-reading`, `literature-survey`, `technology-survey`) and `engagement_locus` (which named whether the engagement was scoped per-source or per-campaign) were both dropped because they proved derivable — given `intent`, `consumer`, and `verification_rigor`, a reader could compute which mode was active. A third element, **`disconfirmation-mode`** (whether active disconfirmation firing happens at discrete named checkpoints, or continuously as a running discipline embedded in comparison), was also found to derive from `scope_authority`: pre-registered engagements naturally checkpoint; emergent engagements naturally embed. So it was never stored as a field.

This history makes the remaining fields (nine at the time of this assessment) look like targets for further simplification — a reader aware of how `mode` and `engagement_locus` got retired might ask whether additional fields could follow. The question is not idle: if four or five more fields were derivable, the registration contract could shrink to a minimal core, reducing declaration overhead meaningfully. The schema-design question is whether that reduction is warranted.

## The traditions that ground the store-pole

Three external metadata-schema traditions were examined to test whether always-present explicit storage is a defensible design or whether the derive-pole alternative is better-supported.

### ISO/IEC 11179: Metadata Registries

ISO/IEC 11179 is the international standard for metadata registries — the formal specification for how data elements and associated concepts are registered, identified, and administered so that data can be shared across organizations [iso-iec-11179]{7} {confidence: search-summary}. Its core construct is the **administered item**: anything that is subject to administrative governance in a registry. Every administered item carries a set of explicit, always-present attributes across five categories — Identifying (the unique identifier, registration-authority identifier, version), Naming (at least one name per registration authority), Definitional (what the item means, subject to completeness requirements that depend on registration state), Administrative (stewardship, registration status, version history), and Relational (relationships to other registered items) [iso-iec-11179]{7}.

The standard's **registration-status lifecycle** is the load-bearing case: registration status has two sub-types, lifecycle (tracing improvement and progression toward quality — submitted → recorded → qualified → standard → preferred → superseded → retired) and documentation (tracing the administrative process of the registration authority's handling). Neither sub-type is derivable from the item's semantic content — you cannot look at a data element's definition and determine whether the registration authority has approved it. Registration-status fields are stored explicitly as administrative metadata distinct from definitional or descriptive metadata; the standard's design implicitly favors explicit stored records here, because governance accountability requires auditable records [iso-iec-11179]{7} {confidence: search-summary}.

> "Registration status specifies the state of an administered item that is in the registry, in the view of the registration authority." [iso-iec-11179]{7} {confidence: search-summary}

The ISO 11179 architecture also formally separates the **definitional/semantic layer** (what a data element means) from the **administrative layer** (who submitted it, what status it holds, which authority governs it, its version history). Both layers are stored as explicit attributes. The administrative layer is not derivable from the definitional layer — they are orthogonal.

The analogy to ARD's registration contract is direct: `verification_rigor`, `temporal_contract`, `consumer`, `scope_authority`, and `primitives_opts_out` function as the administrative layer of ARD's dispatch record. They govern how the engagement is processed and accounted for; they are not derivable from the engagement's semantic content (`intent` + `output_kind`).

**Substrate-confidence note.** ISO/IEC 11179 is a paywalled standard; the ISO/IEC 11179 attestation was built from secondary sources (Wikipedia, Konfirmity.com, Aristotle Metadata Registry documentation, and ISO catalog pages). The core architecture — explicit attribute categories, mandatory administrative fields, register-status as always-stored administrative metadata — is consistently described across multiple independent secondary sources, so the reading is treated as reliable at `search-summary` depth. The position does not rest on ISO 11179 alone; the derive-vs-store verdict is corroborated by the source-direct faceted-classification and Dublin Core attestations below.

### Faceted classification and faceted search

Faceted classification, developed by S. R. Ranganathan (originating with his 1933 Colon Classification), decomposes a subject into multiple independent, combinable dimensions — **facets** — rather than placing it in a single predetermined hierarchical slot [wikipedia-faceted-classification]{11}. Ranganathan's PMEST formula names five fundamental facets: Personality (the focal subject), Matter (substance, properties, materials), Energy (processes, operations, activities), Space (geographic location), and Time (dates or seasons). These are the independent dimensions whose combination fully specifies any compound subject.

The analysis-synthesis structure is the key move: a subject is first analyzed into its constituent facets (each independent), then synthesized by combining those facet values into a compound expression using notation — punctuation marks, notably colons. The system works because **each facet is pre-specified independently** — when you synthesize, you are combining pre-existing facet assignments, not deriving them from one another.

Faceted search — the applied digital heir of Ranganathan's approach — carries the same architecture directly. The Wikipedia article on faceted search defines it as a technique that "augments lexical search with a faceted navigation system, allowing users to narrow results by applying filters based on a faceted classification of the items" [wikipedia-faceted-search]{12}. The article notes that facet values may be derived through text analysis techniques or drawn from pre-existing database fields [wikipedia-faceted-search]{12}. The argument here is that for interactive filter operations at dispatch-routing time, the faceted-search tradition's filter-based architecture implies that values available at query time — whether pre-stored or pre-derived — are what enable efficient narrowing operations. Where ARD's registration contract parallels this architecture is that the ten registration fields function as routing facets that the framework reads before any source-engagement begins; deriving those values lazily at routing time would add a computation step the pre-declaration posture avoids. This is an inference from the faceted-search architecture's structure rather than a direct claim the source makes.

The analogy to ARD's registration contract: the ten registration fields function as routing facets — `intent` is one facet (convergence posture), `verification_rigor` is another (which verification gates fire), `scope_authority` is another (how scope decisions are made in flight), and so on. The derive-at-routing-time alternative for routing facets buys declaration convenience at a cost the pre-declaration architecture avoids — the same tradeoff the faceted-search database architecture makes visible.

> Faceted systems enable "classifications to be accessed and ordered in multiple ways" rather than through rigid, single-path structures. [wikipedia-faceted-search]{12}

### Dublin Core and DC TAP: the apparent derive-pole counter-example

Dublin Core (DCMES — Dublin Core Metadata Element Set) is frequently cited as a model for minimalist metadata design. Its base specification contains 15 elements, all of them optional and repeatable, with no mandatory fields [dcmi-elements]{5}. Dublin Core emerged from a 1995 workshop seeking the lowest-common-denominator metadata vocabulary for the web — the all-optional design was an explicit choice to maximize uptake across diverse adopters by imposing no mandatory core.

This looks like pressure toward a minimize-the-mandatory-fields approach — if even Dublin Core, the metadata community's minimal-interoperability standard, requires nothing, why should ARD's registration contract require everything?

The counter-argument is that Dublin Core addresses a **different design axis**. Its all-optional design names a position on the **mandatory-vs-optional** axis: which fields the record *must* carry at all. ARD's store-pole posture names a position on the **store-vs-derive** axis: how the values of fields the record *does* carry are obtained. These are different axes. Dublin Core takes a minimalist position on mandatory-vs-optional; it addresses which fields a record must carry, not how the values of those fields are obtained [dcmi-elements]{5}. On the store-vs-derive axis it takes no position. The axes are orthogonal.

Dublin Core's **DC TAP** (Dublin Core Tabular Application Profiles) — the mechanism for specifying deployment-specific obligation constraints on top of base Dublin Core — actually reinforces the store-pole direction in a relevant way. DC TAP is the layer through which a specific community can designate elements as mandatory, optional, or `mandatory-if-applicable` (noted in the DC TAP notes column) [dcmi-elements]{5}. The DC TAP Primer states:

> "Shapes in the profile may be the same as the structures defined in the metadata model, or they may be defined in the profile as a **derived view** over the metadata." [dcmi-elements]{5}

In DC TAP a "derived view" is an application-profile shape defined as a projection over the metadata model — a structural view, not a license to compute one element's value from another. By analogy (`extends`), this validates the general pattern ARD already follows: store the base explicitly, expose derived views on top — as ARD does in treating `disconfirmation-mode` as a derived view over `scope_authority`. DC TAP does not endorse replacing the stored base with derived fields.

## How the traditions converge

All three traditions converge on the same structural conclusion: the base record is stored explicitly; derived views are legitimate additions on top, not replacements of the stored fields.

- ISO/IEC 11179 treats administrative and registration-status attributes as explicitly stored, because governance accountability requires auditable records; its design implicitly favors explicit storage over derivation for the administrative layer [iso-iec-11179]{7} {confidence: search-summary}.
- Faceted classification pre-specifies each facet value independently; faceted search's filter-based architecture makes those values available at query time rather than computed on demand. The implied store-pole reasoning is that pre-declaration supports efficient routing — though the sources describe the architecture rather than explicitly prescribing it as a design rule [wikipedia-faceted-classification]{11} [wikipedia-faceted-search]{12}.
- Dublin Core is all-optional on mandatory-vs-optional (a different axis), but DC TAP's derived-view pattern validates derive-discipline *on top* of a stored base — and that is the pattern ARD already follows for `disconfirmation-mode` [dcmi-elements]{5}.

The derive-pole alternative (compute missing fields from stored others at read-time) finds no endorsement from any of the three traditions as a substitute for the base. The derive-pole has a legitimate role as a view layer; it is not a foundation pattern.

## The one derive-candidate that remains

The field `analytical_artifact_type` names whether the engagement's analytical-tier output is a **converging artifact** (a specialist brief or campaign summary that closes at engagement-end — `per-campaign-brief`) or an **accumulating substrate** (a working-hypothesis ledger that grows across multiple arcs — `accumulative-ledger`). The distinction matters because it tells the engagement whether to aim for convergence and termination or to accumulate and continue.

This field follows the same pattern that retired `mode` and `engagement_locus`: it appears nearly derivable from the combination of `intent` and `output_kind`. An engagement with `intent: terminate-in-position` and `output_kind: synthesis-brief` is almost certainly `per-campaign-brief`; an engagement with `intent: build-substrate` and `output_kind: hypothesis-capture` is almost certainly `accumulative-ledger`. The derivation holds in the majority of cases.

However, a disconfirming pass found a genuine non-derivable edge case: `intent: validate-claim` combined with `output_kind: hypothesis-capture` is genuinely **ambiguous between the two artifact types**. A validate-claim engagement whose output is a hypothesis-capture could be either a converging engagement (the claim is tested and a settled position is reached) or an accumulating engagement (evidence is collected in a ledger for later synthesis). The combination does not resolve to a single artifact type without additional information. This is not a manufactured edge case to preserve a field; it is a real dispatch-configuration that cannot be handled by derivation alone.

That genuine ambiguity is the reason `analytical_artifact_type` is **not cleanly retirable** under the same argument that retired `mode` and `engagement_locus`. A DC-TAP-style profile would designate it `mandatory-if-applicable` rather than always-present — meaning: always declare it if you are in a dispatch-configuration where the derivation is ambiguous. Under ARD's uniform-shape (always-present) anti-silent-drift posture, the field is declared in all dispatches, even when the value is redundant with other fields in the non-ambiguous majority. That is a deliberate choice: silent drift under a default is a named failure pattern, and the always-present posture prevents the failure at the cost of some declaration overhead.

The field is therefore held as always-present under the uniform-shape justification, with a path to retirement: if operational dispatch evidence across a large sample shows the ambiguous edge case does not arise in practice — or if the ambiguous case proves reliably distinguishable through additional registered context — the field can be dropped.

## Disconfirming analysis

The disconfirming direction examined was: does any metadata-schema tradition endorse a derive-pole design for goal-registration or workflow-registration records specifically? The concern: if ontology registries or research-methodology schemas systematically prefer minimal stored cores with derived views over a stored base, the store-pole verdict would need to be qualified.

The acquired corpus was predominantly a **document-library tradition** (ISO 11179 for registry metadata; Dublin Core for bibliographic resource metadata; faceted classification for knowledge organization of documents). No research-methodology-registration or ontology-registry tradition was reached. This is an acknowledged gap — ontology registries (OBO Foundry, Wikidata's property constraints, W3C OWL ontologies) and scientific-workflow metadata schemas (PROV-O, schema.org dataset, W3C DCAT) represent a different tradition that could surface a derive-pole pattern for goal-descriptor fields specifically. If those traditions were examined and found to consistently minimize stored goal-descriptor fields in favor of derived computation, the verdict would shift toward NUANCED rather than the current unqualified store-pole confirmation.

Given that gap, the position is stated with appropriate scope: the **document-library metadata tradition** endorses the store-pole. A future pass at the ontology-registry and scientific-workflow traditions would either strengthen the verdict or introduce a named qualification.

## Scope and boundaries

This position settles the design question for the **always-present posture** of the registration schema. It does not settle:

- Whether `analytical_artifact_type` should eventually be retired (that is a conditional finding, dependent on operational dispatch evidence);
- Whether the registration schema's field *count* is otherwise correct (the field count at the time of this assessment — nine, pre-v0.7.0 — was the input to this assessment, not its output; other fields were not subjected to derive-vs-store testing here);
- Whether the ontology-registry tradition would produce a different verdict (it was not in scope).

## Revisit if

- Operational evidence across a large dispatch sample shows `analytical_artifact_type` is reliably derivable across all dispatch-configurations, including the `validate-claim + hypothesis-capture` edge case — promote the derive-candidate HOLD to retirement, or to confirmed-always-present if the edge case proves load-bearing in practice.
- A research-methodology-registration or ontology-registry tradition (not reached in the source corpus here — the acquired floor was predominantly document-library) surfaces a derive-pole pattern for goal-descriptor schemas — would pressure the store-pole verdict toward a nuanced qualification.
- A dispatch record is adopted as a shared multi-party registry — the administrative-metadata dimension (record-level provenance: who assigned which field, when, and why) becomes load-bearing, adding fields rather than removing them. ISO 11179's full administrative-metadata model would then apply more directly.
- Dublin Core's mandatory-vs-optional axis and ARD's store-vs-derive axis are found to collide in a new field design — revisit whether the two-axis framing is complete.

## Sources

- **[iso-iec-11179]{7}** — ISO/IEC 11179 *Metadata Registries*, 2023 edition (ISO/IEC JTC 1/SC 32). Primary parts engaged: Part 1 (Framework), Part 3 (Metamodel and basic attributes — Identifying, Naming, Definitional, Administrative, Relational attribute categories), Part 6 (Registration — registration-status lifecycle and documentation sub-types). Attested from secondary sources (Wikipedia's ISO/IEC 11179 article, Konfirmity.com glossary, Aristotle Metadata Registry help documentation, ISO.org catalog description) at `substrate_confidence: search-summary` — the normative text is paywalled; core architecture confirmed across multiple independent secondary sources.

- **[dcmi-elements]{5}** — Dublin Core Metadata Initiative, *DCMI Metadata Element Set* (DCMES), version 2012-06-14, <https://www.dublincore.org/specifications/dublin-core/dces/>. Normalized at ISO 15836, IETF RFC 5013, ANSI/NISO Z39.85. Engaged: the 15-element base specification (all elements optional and repeatable); the qualified-Dublin-Core namespace (`dcterms:`); the DC TAP (Tabular Application Profiles) primer, specifically the derived-view passage and the `mandatory`/`mandatory-if-applicable` obligation-constraint mechanism.

- **[wikipedia-faceted-classification]{11}** — Wikipedia, "Faceted classification," <https://en.wikipedia.org/wiki/Faceted_classification>. License: CC-BY-SA-4.0. Engaged: Ranganathan's PMEST formula; the analysis-synthesis structure; the notation used to combine facets (punctuation marks, notably colons); the relationship between faceted classification and faceted search (modern web navigation).

- **[wikipedia-faceted-search]{12}** — Wikipedia, "Faceted search," <https://en.wikipedia.org/wiki/Faceted_search>. License: CC-BY-SA-4.0. Engaged: the definition of faceted search as a technique augmenting lexical search with a faceted navigation system; the note that facet values may be derived through text analysis or drawn from existing database fields; the "classifications accessed and ordered in multiple ways" passage; the commercial adoption evidence (40% of major US retailers as of 2014); the relationship to Ranganathan's faceted-classification tradition.

## Revisions

- **2026-06-02** — term-consistency correction: the registration field `calibration_intensity` was renamed `verification_rigor` to match the published spec (a legibility rename; the field's role — the rigor control governing which verification gates fire — is unchanged). The position's argument is unaffected.
