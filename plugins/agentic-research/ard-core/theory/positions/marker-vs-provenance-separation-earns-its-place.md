---
slug: marker-vs-provenance-separation-earns-its-place
status: settled
authored: 2026-05-31
provenance: agent-synthesis
temporal_contract: write-once-on-converge
---

# Claim-level `{confidence}` and file-level `provenance:` are distinct axes that earn their separate places

> Ported research position behind ARD v0.1 — the reasoning trace for a framework commitment; see [../../SPEC.md](../../SPEC.md). The attestation layer is not reproduced in this repo (it paraphrases copyrighted sources), so the load-bearing passages are quoted inline and the works are listed under [§Sources](#sources) — the reasoning stands on its own here.

## What the two markers are

ARD tracks the epistemic status of research artifacts at two different levels of granularity, and this position defends the decision to keep them separate rather than collapsing them into one.

**The file-level `provenance:` field** appears in the frontmatter of every research artifact. It declares the *authorial role* of the artifact as a whole: `source-direct` (the file was authored by reading the source), `agent-synthesis` (the file was composed by synthesizing across multiple sources), `agent-authored-from-raw` (an engagement-unit aggregation from raw material). It answers the question: *what kind of thing is this artifact?* A synthesis brief carries `provenance: agent-synthesis` whether it cites ten sources or two, and whether those sources were read cover-to-cover or skimmed.

**The per-claim `{confidence}` marker** appears inline in the body of synthesis briefs, attached to specific load-bearing claims. Its vocabulary is `source-direct` (the cited source was read fully), `search-summary` (the source was engaged at abstract or search-result depth), `snippet-thin` (only a brief extract was available). It answers the question: *how deeply was the specific source behind this specific claim actually engaged?* Unlike the file-level marker, it varies from claim to claim within the same artifact.

The question this position settles is whether both markers are necessary — or whether the file-level marker already carries all the epistemic information a reader needs, making the per-claim marker redundant overhead.

## The tension

A skeptic can reasonably press: why not just use the file-level marker at finer granularity? If a brief has claims backed by superficially engaged sources, annotate the brief as low-confidence. If everything was read fully, annotate it as high-confidence. This would be one field, not two.

The problem is that a single synthesis brief routinely contains a mix: some claims backed by sources read in full; others backed by sources accessed at abstract depth because the full text was paywalled; others built on sources skimmed for one relevant section. The file-level marker, being a single value, is forced to either misrepresent the mix (by picking one label for the whole file) or collapse to the minimum (flagging the whole file as low-confidence whenever any claim within it is thin, which loses information about which specific claims carry that concern).

Flattening the two axes into one makes the real epistemic distinctions invisible. A reader deserves to know not just "this synthesis was produced by an agent" but "this specific claim rests on a source the agent only read in abstract form." The per-claim marker carries that specific warning; the file-level marker does not.

## Why the annotation traditions confirm the separation

Read together, the three traditions surveyed converge on the same structural conclusion: the level of the *artifact* and the level of the *assertion within it* require separate metadata, and the two cannot be collapsed. Each tradition arrives at this independently; the convergence is the author's inference from separately attested source positions {inferred: convergence}.

### Nanopublication — assertion-level vs. container-level

The nanopublication model is a formal model (a working-draft specification) for publishing individual scientific claims as machine-readable, citable units [nanopub-guidelines]{6}. Its core architectural commitment is a mandatory split into three named RDF graphs:

- **Assertion graph** — the claim itself
- **Provenance graph** — how the assertion came to be; from what source; who generated it; when
- **Publication-Info graph** — metadata about the *nanopublication container* as a published entity (who published it, when)

The standard's trustworthiness rationale is stated directly:

> "The different levels of provenance enable users to assess the trustworthiness of data and provides a mechanism by which authors and institutions may be acknowledged for their contribution to the global knowledge graph." [nanopub-guidelines]{6}

The structural requirement ties the two graphs to different reference targets: provenance triples carry at least one reference to the assertion graph identifier, while publication-info triples carry at least one reference to the nanopublication URI itself [nanopub-guidelines]{6}. The two graphs point at different things — the provenance graph is *about the assertion*; the publication-info graph is *about the container*. They are not interchangeable.

ARD's two markers map cleanly onto this structure. The page-level `provenance:` field (artifact authorial role) corresponds to the Publication-Info graph — it describes the artifact as a published entity. The claim-level `{confidence}` marker (source-engagement depth) corresponds to the Provenance graph — it describes how the assertion was derived and from what. Different graphs by design; different ARD markers by the same logic.

Crucially, the nanopublication guidelines do not document a flattened single-graph alternative to the tripartite model; the tripartite split is presented as the model's core commitment [nanopub-guidelines]{6}.

### W3C Web Annotation — multi-level provenance can diverge

The W3C Web Annotation Data Model (a 2017 W3C Recommendation) provides a model for associating annotations with web resources [w3c-web-annotation]{3}. Its architecture distinguishes three objects that can each carry independent provenance metadata:

- The **Annotation** itself (the linking entity) — carries `creator` and `created` timestamps at the annotation level
- The **Body** (what is asserted) — can carry its own `creator` and `created` timestamps independent of the annotation's
- The **Target** (what is being annotated) — carries provenance *hints* at yet another level (the spec marks target-level provenance as hints to the client, not authoritative)

The model supports body-level timestamps independent of the annotation's, allowing body content to predate the annotation that links it to a target [w3c-web-annotation]{3}.

The key structural point for ARD is that the annotation-level provenance (who created the annotation as a whole) is a different question from body-level provenance (how was this specific body content produced). ARD's file-level `provenance:` and claim-level `{confidence}` mirror exactly this distinction: the artifact-level question vs. the claim-level question. The W3C model treats these as distinct questions, handled by distinct fields [w3c-web-annotation]{3}.

### TEI — `cert`/`degree` and `resp` are orthogonal axes

The Text Encoding Initiative (TEI) Guidelines' chapter on Certainty and Uncertainty (TEI P5, Chapter CE) provides formal markup for epistemic status in scholarly editions [tei-certainty]{4}. The core element is `<certainty>`, which marks the degree of confidence associated with a specific markup decision. Two attributes address distinct axes:

- `cert` (global shorthand on any TEI element) / `degree` (the attribute on the `<certainty>` element itself) — a numeric confidence level (0–1) measuring *how confident* the editor is about the markup
- `resp` — a pointer to the responsible party, indicating *who made* this markup decision

In TEI's design, the confidence attribute (`cert`/`degree`) and the responsibility attribute (`resp`) address orthogonal concerns — confidence versus responsibility — and either can be recorded without the other [tei-certainty]{4}. The `cert` attribute is the global shorthand applicable to any TEI element; the full `<certainty>` element with its `degree` attribute provides additional nuance, including the `locus` attribute that distinguishes which aspect of a markup decision is uncertain. Both forms serve the same confidence axis.

An editor can record a confidence level without identifying the responsible party, and can identify the responsible party without recording a confidence level. Neither field subsumes the other.

The further architectural commitment TEI makes is standoff placement: the `<certainty>` element is placed *separately* from the text it annotates, using a `target` attribute to point at the element it concerns [tei-certainty]{4}. This confirms that epistemic-status annotation operates at a different layer from the content it describes — they are structurally separated, not merged.

For ARD: TEI confirms that confidence (`cert`/`degree`) and responsibility (`resp`) are **orthogonal axes** — either can be recorded without the other, and in TEI both are optional [tei-certainty]{4}. That independence supports ARD's general commitment that distinct epistemic axes need not be collapsed into one field. The analogy is partial, though: TEI operates *both* axes at the assertion (markup) level, so it does not itself model ARD's *file-vs-claim* level split — the closer structural match for that is nanopublication's container-vs-assertion separation above. What TEI contributes is specifically the orthogonal-and-independent point, not a file-level-to-claim-level mapping.

## The disconfirming probe that did not fire

When this question was investigated, the probe was specifically designed to look for evidence that the traditions argue *against* the separation — that a unified, non-fragmented design would be preferable.

The leading disconfirming candidate was this: could you design a system where the file-level marker is made fine-grained enough (by splitting synthesis briefs by source-depth category) to eliminate the need for per-claim markers? In principle yes — but across the three traditions surveyed, none was found to endorse fragmenting content by epistemic depth at the file level, and each operates at the assertion level for assertion-level epistemic status {inferred: aggregate}.

A second candidate came from the W3C Web Annotation specification's note that target-level provenance is "intended as hints to the client, and are not to be considered authoritative information" [w3c-web-annotation]{3}. Could this suggest claim-level markers are similarly dispensable? No — on this position's reading, that characterization applies to properties of external resources copied into the annotation document, not to properties of the annotation body's own epistemic status (this scoping is the position's interpretation, not a distinction the specification states explicitly). The `{confidence}` marker is about how the *annotation author* engaged the source, which the specification treats very differently.

No compelling disconfirming evidence was found. The CONFIRM-distinct verdict is not manufactured; it is the outcome of an active search that failed to find grounds for collapse.

## The contrast with a parallel probe

A structurally identical probe ran simultaneously against W3C PROV (the W3C Provenance Ontology) applied to ARD's data-contract surfaces. That probe found a real gap: ARD fragments provenance-graph relationships that PROV unifies, and ARD omits record-provenance of its own dispatch records. (This finding is reported separately; it is not grounded in this file's source chain and cannot be independently verified by a reader of this file alone.)

The parallel probe here, against nanopublication and W3C Web Annotation, found the *opposite* result — the traditions confirm ARD's layer-separation rather than indicting it. The two outcomes are consistent on different axes: PROV unifies *provenance-graph relationships* (how one artifact derived from another), and ARD genuinely fragments these. Nanopublication unifies the *container* (assertion + its provenance + its publication-info travel together as a nanopublication) while *internally* separating the three by named graph — and ARD's claim-vs-file split mirrors that internal separation. That the nanopublication probe did not fire against ARD is evidence the confirmation is honest. The framework acknowledges the genuine gap PROV exposed; it also acknowledges the genuine confirmation nanopublication provides. These are different findings on different axes.

## What this means for ARD's design

The separation is not an ad-hoc addition or an oversight-that-could-be-cleaned-up. It reflects the same architectural commitment three annotation traditions independently reached: the level of the *artifact* and the level of the *assertion* require separate metadata because they answer separate questions, and a reader's ability to calibrate trust depends on both questions being answerable.

A synthesis brief with `provenance: agent-synthesis` tells a reader that the artifact is cross-source synthesis — but it says nothing about whether individual claims within it rest on sources read carefully or sources accessed only at abstract depth. Without the claim-level marker, the reader cannot calibrate trust at the claim level; they can only calibrate at the artifact level. For a reader deciding whether to rely on a specific claim in downstream work, artifact-level calibration is not enough.

The claim-level marker fills the gap the file-level marker structurally cannot fill.

## Revisit if

- A use-case emerges where a synthesis brief contains *only* claims of uniform source-engagement depth — every source either read fully or every source accessed at snippet depth — such that the per-claim marker adds no information over a file-level flag. In that case, reconsider whether a file-level variant of the depth marker (perhaps `all-source-direct: true`) could cover the uniform case, reducing per-claim overhead for briefs where homogeneous depth is a known property at write-time.
- An annotation standard emerges that provides a unified, non-fragmented treatment of assertion-level and container-level provenance in a way the current traditions do not — and that unified treatment is shown to be adequate for ARD's fabrication-fencing purpose. That would reopen the question of whether the separation is necessary or an artifact of the particular traditions surveyed.
- Adopter experience shows that authors systematically omit the per-claim marker where it should fire (e.g., `snippet-thin` claims passing without annotation), indicating that the two-layer design has a compliance problem in practice. In that case the design question shifts from "are the two axes conceptually distinct?" (they are) to "does the complexity of two axes produce worse actual epistemic marking than a simpler one-axis system?" — an empirical question about behavior, not a conceptual one.

## Sources

- **[nanopub-guidelines]{6}** — Nanopublication Guidelines (Working Draft), nanopub.net, 2014 (working draft accessed 2026-05-31). Engaged: §Tripartite structure (assertion, provenance, publication\_info); §Graph contents and requirements; §Integrity and trustworthiness. URL: <https://nanopub.net/guidelines/working_draft/>.
- **[w3c-web-annotation]{3}** — Robert Sanderson, Paolo Ciccarese, Benjamin Young (eds.), *Web Annotation Data Model*, W3C Recommendation, 23 February 2017. Engaged: §3.1 Annotations; §3.2 Bodies and Targets; §3.3.5 Motivation and Purpose; §3.4 Provenance of Annotations. URL: <https://www.w3.org/TR/annotation-model/>.
- **[tei-certainty]{4}** — TEI Consortium, *TEI P5: Guidelines for Electronic Text Encoding and Interchange*, Chapter CE: "Certainty, Uncertainty, and Responsibility" (current release, accessed 2026-05-31). Engaged: `<certainty>` element definition; `cert`, `resp`, `locus`, `degree` attributes; standoff placement pattern. URL: <https://tei-c.org/release/doc/tei-p5-doc/en/html/CE.html>.
