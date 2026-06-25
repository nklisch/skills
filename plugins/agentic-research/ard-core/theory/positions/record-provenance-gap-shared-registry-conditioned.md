---
slug: record-provenance-gap-shared-registry-conditioned
status: settled
authored: 2026-05-31
provenance: agent-synthesis
temporal_contract: write-once-on-converge
---

# ARD tracks the provenance of its sources, not of its own dispatch records — a real gap conditioned on shared-registry adoption

> Ported research position behind ARD v0.1 — the reasoning trace for a framework commitment; see [../../SPEC.md](../../SPEC.md). The attestation layer is not reproduced in this repo (it paraphrases copyrighted sources), so load-bearing passages are quoted inline and sources are listed under [§Sources](#sources).

## What provenance tracking means here, and what the gap is

To understand this position, three concepts need to be clear first: what ARD's provenance chain is, what a dispatch record is, and what record-level provenance would add.

**ARD's provenance chain for sources.** ARD is a research discipline framework that insists every factual claim in a research brief be traceable back to a fetched source. The citation form is `[handle]{N}` — a short identifier that resolves to a per-source attestation file, which in turn points at the raw document that was actually read. The chain has three auditable hops: a claim in the analysis brief cites a handle; the handle resolves to an attestation file that paraphrases the source and quotes key passages; the attestation file records where the source came from (`source_url:` or `source_path:`). A lint script can mechanically walk this chain and flag breaks. This is what "tracking provenance of sources" means: the genesis of every load-bearing claim is auditable.

**What a dispatch record is.** Every ARD research engagement begins with what the framework calls a registration declaration — a small metadata record that describes the engagement's intent and scope before any source is read. It answers questions such as: what is this research trying to do (`intent:`), what artifact will it produce (`output_kind:`), who or what will consume the result (`consumer:`), how deep should verification go (`verification_rigor:`), and what is the artifact's lifecycle contract (`temporal_contract:`). Together, these ten fields are the dispatch record. In the framework's reference operationalization, when one is persisted it takes the form of a `dispatch.md` file at the campaign root — though the framework's own layer treats persistence form as an operationalization choice, with a conversation transcript sufficing otherwise. Think of it as the research project's charter: it names what kind of work this is before the work begins.

**What the gap is.** ARD's dispatch record describes the engagement's goal-shape, but it carries no information about the record itself — who created it, when, and whether its fields have changed since it was first written. If a `temporal_contract:` value is revised mid-engagement (for example, moved from one lifecycle value to another), that revision leaves no trace in the record. The record holds the current value but not the history of how it arrived at that value. ARD exhaustively tracks the provenance of the external sources it reads; it does not track the provenance of its own administrative records.

This position characterizes that gap, explains why it is real, explains why it is nevertheless not a present commitment, and states the condition under which it would become one.

## Two independent analyses named the same absence

The gap was identified in two separate lines of analysis, each working a different source corpus. The convergence across disjoint corpora is what makes the finding trustworthy.

### The temporal face: W3C PROV

W3C PROV (the Provenance Data Model and its OWL2 ontology companion, PROV-O) is a W3C Recommendation that defines a conceptual framework for recording the provenance of digital artifacts. Its core claim is that provenance is fundamentally a graph — not a set of properties on individual artifacts but a network of named relationships connecting entities, activities, and agents.

PROV-DM defines three primary classes [w3c-prov-dm]{1}:

- **Entity** — "a physical, digital, conceptual, or other kind of thing with some fixed aspects; entities may be real or imaginary." Research artifacts — attestation files, briefs, dispatch records — are entities.
- **Activity** — "something that occurs over a period of time and acts upon or with entities." Authoring a brief, running a lint check, revising a temporal-contract value — these are activities.
- **Agent** — something bearing some form of responsibility for an activity taking place, for the existence of an entity, or for another agent's activity. A human researcher or a running AI agent is an agent in this sense [w3c-prov-dm]{1} [w3c-prov-o]{2}.

The framework connects these through named relations. The ones most relevant here are `wasRevisionOf` (a derivation where the resulting entity is a revised version of some original), `wasAttributedTo` (ascribes responsibility for an entity to an agent), and `generatedAtTime` (marks when an entity came into existence). PROV-DM describes the whole model as organized in six components, respectively dealing with entities and activities, and the time at which they were created, used, or ended; derivations of entities from entities; agents bearing responsibility; a mechanism to support provenance of provenance (bundles); properties to link entities that refer to the same thing; and collections [w3c-prov-dm]{1}. PROV's design holds these concerns are co-expressed in one traversable graph rather than fragmented across separate mechanisms [w3c-prov-dm]{1}.

What this means for ARD: if a dispatch record's `temporal_contract:` field is changed from one value to another, a complete PROV description of that event would link the revised record (`wasRevisionOf` the prior version), record when the revision occurred (`generatedAtTime`), and name who performed the revision (`wasAttributedTo`). ARD's current design records none of these. The `temporal_contract:` field holds the current value; it does not record the timestamp of the last change, the identity of who made the change, or a pointer to the prior version.

PROV also defines a bundle mechanism specifically to enable provenance of provenance: a bundle is a named set of provenance assertions that is itself an entity, so that one can state the provenance of provenance claims themselves — for example, recording who validated a set of provenance assertions [w3c-prov-dm]{1} [w3c-prov-o]{2} (the bundle mechanism is PROV-DM's; the "who validated" framing is PROV-O's). ARD's design has no slot for this.

The temporal analysis found a real, mild gap: ARD's temporal-contract frontmatter records the contract *value* but not when the contract was assigned, by whom, or when it was revised. Moving an artifact from one `temporal_contract:` state to another leaves no `wasRevisionOf` or `generatedAtTime` record of that state change.

### The registration face: ISO/IEC 11179 and NISO

The second analysis came from a different direction: the metadata registry and metadata typology traditions.

**ISO/IEC 11179** is the international standard for metadata registries. Its core construct is the "administered item" — any registry item subject to administration. ISO/IEC 11179 specifies five categories of attributes for administered items: Identifying (unique identifier, registration authority identifier, version), Naming (at least one name), Definitional (formal definition), Administrative (stewardship, registration status, version, submitting organization), and Relational (relationships to other items) [iso-iec-11179]{7} {confidence: search-summary}. Of these, the Identifying and Naming categories are always-mandatory; Administrative is mandatory for a governed item; Definitional and Relational are conditional or optional depending on registration state. The administrative category is mandatory for an administered item in a governed registry; on this position's reading, that mandatory administrative layer is what distinguishes a governed registry from an informal list. The standard specifies a registration-status lifecycle: submitted → recorded → qualified → standard → preferred → superseded → retired. Any change in an item's status is an administrative event that the registry records [iso-iec-11179]{7} {confidence: search-summary}.

**NISO's "Understanding Metadata"** established the widely-used three-type functional typology for metadata: descriptive (discovery and identification), administrative (lifecycle and governance of the resource as a managed object), and structural (assembly and navigation) [niso-metadata-typology]{8} {confidence: search-summary}. The discriminating principle is functional purpose: what does this metadata do for its user? Administrative metadata, in NISO's account,

> "provides information to help manage a resource, such as when and how it was created, file type and other technical information, and who can access it"

[niso-metadata-typology]{8} {confidence: search-summary}.

Applied to ARD's registration schema: the ten fields (`intent:`, `output_kind:`, `consumer:`, `verification_rigor:`, `temporal_contract:`, `primitives_extends:`, `primitives_opts_out:`, `decision_relevance:`, `scope_authority:`, `analytical_artifact_type:`) are all descriptive of the engagement's goal-shape. They answer "what kind of research engagement is this?" They carry no administrative layer — no record-creator identity, no record-creation timestamp, no registration-status lifecycle. ISO/IEC 11179's framing says this would matter for an administered item in a governed multi-party registry, where who submitted a registration and what its governance status is are mandatory attributes [iso-iec-11179]{7} {confidence: search-summary}.

**Dublin Core as a calibrating comparator.** The DCMI Metadata Element Set provides a useful comparator: a flat 15-element vocabulary where all elements are optional and repeatable, with no prescribed order [dcmi-elements]{5}. Dublin Core's base 15 elements notably do not include provenance-of-the-record itself — who created the metadata record, when. That metadata-about-metadata layer requires the qualified DC extension or an application profile. This confirms that the descriptive/administrative separation is a design choice point, not a default of all metadata schemes: Dublin Core's own design arrives at the descriptive layer first, adding administrative metadata (via qualified DC or an application profile) when governance demands it [dcmi-elements]{5}.

### The convergence

Two specialist analyses working entirely different corpora arrived at the same finding: ARD has a descriptive metadata layer for its dispatch records but no administrative metadata layer. The temporal analysis reached it through PROV's `wasRevisionOf`/`generatedAtTime` terms; the registration analysis reached it through ISO/IEC 11179's administered-item model. Both described the same structural absence from different vocabularies.

The convergence across disjoint corpora is what makes the finding trustworthy — not as a doubled-up version of the same concern, but as two independent frameworks independently identifying the same gap.

## Why the gap does not bite in the current single-deployment design

Both analyses also identified the same condition that limits the gap's force: the absence of a governance audience.

ISO/IEC 11179's administrative attributes (registration authority, stewardship, registration-status lifecycle) are designed for a **shared, multi-party, governed registry**. The standard's administered-item model assumes there is a registration authority (RA) — an entity with governance power over which items are submitted, reviewed, and promoted [iso-iec-11179]{7} {confidence: search-summary}. When a dispatch is a single-deployment, single-campaign-scoped act with no cross-team audience, there is no RA; there is no party checking whether the record has moved from "submitted" to "qualified"; there is no reason to record a registration-authority identifier. The administrative layer exists to support governance accountability, and where there is no governance audience, the overhead has no payoff.

The same reasoning applies to the temporal face. PROV's `wasRevisionOf` and `generatedAtTime` are most valuable when the artifact is shared with parties who need to audit its revision history — who cannot otherwise know whether the temporal contract they read today is the same one that was set at dispatch. In a single-deployment design where the same team authors and reads all dispatch records, and where all changes are either visible in the conversation transcript or in a git diff, the audit requirement is satisfied by mechanisms the deployment already has. A formal contract-log on every dispatch is overhead without a governance audience to read it.

Dublin Core's all-optional 15-element design, and the DC Application Profile framework's layering of obligation constraints onto that base, instantiate the same logic: the base vocabulary is minimal; communities add administrative obligations when their governance context requires them [dcmi-elements]{5}.

The condition that changes this calculus: if the registration declaration were to become a **shared, multi-party, governed registry** — if multiple teams submitted research registrations that a governance authority reviewed and promoted through a lifecycle — then all three traditions (PROV, ISO/IEC 11179, NISO) would say the administrative layer is no longer overhead but mandatory infrastructure. The gap would move from conditioned-hold to an active design commitment.

## What the commitment would look like if the condition fires

If the condition fires — multi-team shared-registry use of dispatch records emerges — the two faces of the gap suggest two concrete additions:

**The temporal face → a `## Contract log` pattern.** Analogous to the corrections-vs-reversals discipline's `## Revisions` log at the foot of position artifacts, dispatch records would carry a `## Contract log` body section. Each entry in the log would record: the old `temporal_contract:` value, the new value, the date of the change, and the identity of who made it. This is the minimal PROV-compatible record of contract-state changes — equivalent to `wasRevisionOf` + `generatedAtTime` expressed in a lightweight prose-and-YAML form rather than a full RDF graph.

**The registration face → administrative fields on the record itself.** Following ISO/IEC 11179's attribute categories, the dispatch record would add: a record-creator field (who opened this registration), a created-at timestamp (when it was opened), and a registration-status lifecycle (the dispatch record's own governance status, distinct from the engagement artifact's `temporal_contract:`). These fields track the registration *record* as an administered item, not the engagement it describes.

Neither addition is warranted today. Both would be designed specifications, not commitments, until the shared-registry condition holds.

## A companion defensibility note: why ARD fragments what PROV unifies

The analysis surfaced one additional finding that is worth stating explicitly as a design rationale rather than leaving to read as an oversight.

PROV-DM's design holds that the concerns it covers — revision, derivation, attribution, generation-time — should be co-expressed in a single traversable graph. ARD currently distributes these concerns across three separate subsystems: (1) the temporal-contract frontmatter on each artifact (handles revision semantics); (2) the citation manifest's PROV-O minimum subset (handles derivation, attribution, generation-time at the per-claim level); and (3) the artifact-level `provenance:` frontmatter (handles authorial role at the artifact level).

Does PROV's design indict this fragmentation? On inspection: PROV's six-component structure shows the concerns *are* separable — each is a distinct component. What PROV argues is that they should be traversable together, not that they must live in a single artifact or a single field. ARD's three subsystems are linked via the citation chain (a brief claim resolves through a handle to an attestation file to a source), which means the dependency graph is traversable even though the concern coverage is distributed. The fragmentation is consistent with PROV's traversability requirement.

The rationale for the distribution is also legitimate: the three subsystems operate at different granularities. The citation manifest's PROV-O subset works at per-claim precision (this exact quote, from this exact source, cited at this exact timestamp, by this exact agent). The `temporal_contract:` frontmatter works at artifact-level granularity (the lifecycle contract for the whole artifact). The `provenance:` frontmatter works at the authorial-role level (how was this file produced?). Co-locating all three in a single graph would flatten granularity distinctions that serve different downstream purposes.

This rationale is legitimate — but it should be stated as a deliberate design choice in the published specification rather than left for adopters to reconstruct. The observation that "ARD fragments what PROV unifies, for traversability reasons, at different granularities" earns explicit documentation.

## Disconfirming analysis

Before committing the convergence finding, two potential disconfirming paths were checked.

**Does the administrative-metadata gap actually have force for non-shared registries?** Both analyses checked whether the gap bites in the single-deployment case and concluded it does not [iso-iec-11179]{7} {confidence: search-summary} [dcmi-elements]{5}. ISO/IEC 11179's administered-item model is explicitly designed for multi-party governance; Dublin Core's all-optional base design and the application-profile layering convention both support the same conclusion: the administrative layer is earned, not default. The gap is real at the tradition level but context-conditioned.

**Does ARD's citation manifest already close the PROV gap?** The citation manifest adopts a four-field PROV-O minimum subset (handle → `wasDerivedFrom`, cited_at → `generatedAtTime`, cited_by → `wasAttributedTo`, source_sha → `hadPrimarySource`) [w3c-prov-o]{2}. This closes the gap for *source-level* provenance — it records when and by which agent a source was cited. It does not close the gap for *dispatch-record-level* provenance — the temporal-contract field's assignment history has no equivalent manifest. The manifest's scope is the citation act; the gap concerns the record-management act. These are distinct.

## Contradictions

No contradictions surface across the five sources. ISO/IEC 11179, NISO, Dublin Core, W3C PROV-DM, and W3C PROV-O agree on the descriptive/administrative distinction and on the condition under which administrative metadata is appropriate. The substrate-confidence caveat is worth repeating: the ISO/IEC 11179 and NISO attestations are `search-summary` depth (the full standards text was not directly read); the W3C PROV attestations are source-direct. The `search-summary` sources' architectural descriptions are consistent across multiple independent secondary sources, but readers working on high-stakes implementations of this position should verify the ISO/IEC 11179 and NISO claims against the normative texts directly.

## Summary position

ARD's lint-enforced citation chain exhaustively tracks the provenance of the external sources it engages. It does not track the provenance of its own dispatch and contract records — who created a registration, when, whether the `temporal_contract:` field has been revised and what its prior values were. Two independent analyses (one working the PROV tradition, one working the metadata-registry tradition) independently identified this as a structural gap.

The gap is real. It is also conditioned: both traditions say the administrative layer is appropriate for shared, multi-party, governed registries, and both say it is optional for private dispatch-time records with no governance audience. In the current single-deployment design, omitting record-level provenance is a reasonable scoping decision, not an oversight.

If and when a deployment adopts the registration declaration as a shared cross-team registry, the gap becomes an active design commitment: add a `## Contract log` pattern for temporal-contract-value changes, and add administrative fields (record-creator, created-at, registration-status) to the dispatch record schema.

A companion finding — that ARD fragments what PROV unifies, for defensible traversability-and-granularity reasons — should be documented explicitly in the published specification as a stated design choice rather than left to read as an oversight.

## Revisit if

- The dispatch record is adopted by multiple teams as a shared, governed registry — the gap moves from conditioned-hold to active design commitment; specify the `## Contract log` pattern and administrative fields then.
- A future ARD version provenance-tracks contract or registration changes for an unrelated reason (for example, audit requirements at a deployment) — this gap closes incidentally; record the closure.
- The PROV-O citation-manifest subset is extended to cover temporal-contract assignment history — the fragmentation rationalizes itself and the defensibility note narrows in scope.
- The single-deployment design assumption is revisited — for example, if a deployment publishes its dispatch records to an external research community — re-examine whether the governance-audience condition holds.

## Sources

- **[w3c-prov-dm]{1}** — W3C, *PROV-DM: The PROV Data Model*, W3C Recommendation 30 April 2013. <https://www.w3.org/TR/prov-dm/>. Engaged: §1 Introduction; §2 Component 1 (Entities and Activities); §3 Component 2 (Derivations); §4 Component 3 (Agents and Responsibility); §5 Component 4 (Bundles). Source-direct attestation.

- **[w3c-prov-o]{2}** — W3C, *PROV-O: The PROV Ontology*, W3C Recommendation 30 April 2013. <https://www.w3.org/TR/prov-o/>. Engaged: §2 Starting Point Terms; §3 Expanded Terms (derivation and temporal properties); §4 Qualified Terms (Qualification Pattern). Source-direct attestation.

- **[iso-iec-11179]{7}** — ISO/IEC, *ISO/IEC 11179: Information Technology — Metadata Registries*, 2023 edition (Parts 1, 3, 6). <https://en.wikipedia.org/wiki/ISO/IEC_11179> (Wikipedia summary; normative text paywalled). Engaged: Part 1 Framework (administered-item concept); Part 3 Basic attributes (five attribute categories); Part 6 Registration (registration-status lifecycle). *Substrate confidence: search-summary — normative text not directly read; architecture confirmed across multiple independent secondary sources.*

- **[niso-metadata-typology]{8}** — NISO, *Understanding Metadata* (2004 original; 2017 primer by Jenn Riley). Engaged via secondary sources at <https://www.metadataetc.org/metadatabasics/types.htm> and the DCC "What Are Metadata Standards" briefing paper. Engaged: three-type typology (descriptive / administrative / structural); administrative sub-types (technical, preservation, rights management). *Substrate confidence: search-summary — core typology cross-confirmed across multiple independent secondary sources; exact NISO text not directly read.*

- **[dcmi-elements]{5}** — Dublin Core Metadata Initiative, *DCMI Metadata Element Set* (DCMES), version 2012-06-14. <https://www.dublincore.org/specifications/dublin-core/dces/>. Engaged: 15 core elements; qualified DC refinements and encoding schemes; DC TAP application profile framework; dumb-down principle. Source-direct attestation.

## Revisions

- **2026-06-02** — term-consistency correction: the registration field `calibration_intensity` was renamed `verification_rigor` to match the published spec (a legibility rename; the field's role is unchanged). The position's argument is unaffected.
