# Agentic Research Discipline (ARD) — Specification

[Versioning](../docs/VERSIONING.md)

ARD is a framework for grounded, verifiable, adopter-portable research conducted by or with AI agents. It codifies a research discipline — an anti-fabrication core ([§4](#4-the-anti-fabrication-core-the-hard-floor)), a multi-stage verification stack ([§7](#7-the-verification-stack-the-rigor-control)), and a **control-space** navigated against a non-erodable floor ([§3](#3-the-control-space-model)) — that addresses a documented inventory of agentic research-failure shapes ([§2](#2-the-failures-ard-addresses)). The discipline is the framework's substance; the inventory is the failure-space it is measured against. The shapes are not equally fenced, and ARD is precise about which is which: it **structurally fences anchor-and-drift fabrication** — one prominent shape, and the one whose fence is tightest — *detects*, though does not yet prevent, the highest-frequency adjacent shape (noise domination; [§11](#11-known-limitations)), commits per-shape fences on most of the rest, and leaves a residual set forward-looking. [§11](#11-known-limitations) names honestly what is detected-but-not-prevented.

This document is the **architecture** — what is invariant across adopters. The framework's current baseline catalogs (the failure-shape inventory, source-class shapes, the lint pattern set, the decision-point catalog, registration enums) are populated in the companion [CATALOGS.md](CATALOGS.md) and grow by extension. The plugin's engagement engine is the worked instantiation, and the reasoning trace behind each commitment lives in [theory/](theory/). The spec plus [CATALOGS.md](CATALOGS.md) are self-contained; the trace is concrete support, not a prerequisite for implementing it.

ARD is **agent-agnostic**: it names invariants, not an implementation. Where this spec describes a tier or mechanism by concept ("the attestation tier", "a citation-chain lint mechanism"), a deployment maps the concept to its own filesystem and tooling — the example shows one such mapping.

---

## 1. What ARD is

ARD is a **floors-and-affordances framework, not a procedure.** Floors catch the downside; affordances handle the unanticipated; human-in-the-loop checkpoints are where human and agent navigate together. Its deliberate incompleteness is the design, not a deficiency — explicit rules cannot pre-empt what an agent notices mid-engagement, so the framework supplies a non-erodable core, a space of adjustable controls, and checkpoints, rather than a complete script.

Two substrate namespaces hold distinct content:

- **Operational substrate** — the deployment's working memory about its own operations (decisions, sessions, work items).
- **Research substrate** — external source material, per-source attestations, engagement-unit aggregations, and analytical artifacts.

The cleavage is load-bearing: analysis informs operational decisions, not the reverse. This spec concerns the research substrate.

---

## 2. The failures ARD addresses

ARD addresses a **documented inventory of agentic research-failure shapes**, named in ARD's own **locus-of-failure** coordinate system — seven loci keyed to *where in the research trajectory the failure lives*: `AQ` (Acquisition — what enters the corpus), `GR` (Grounding — fidelity to a fetched source), `CX` (Context-use — weighting across the retrieved set), `CO` (Composition — the cross-source synthesis act), `FR` (Framing — the agent's own epistemic posture), `PR` (Propagation — multi-step error inheritance across the trajectory), and `WM` (Warrant/meta — failures of the framework's own warrant). The baseline spans **twenty-seven shapes across all seven loci** (the `WM` locus, unpopulated at v0.1, was populated at v0.2; v0.5 adds the proactive-enrichment acquisition shape `AQ.3`; v0.6 adds `PR.3` and `GR.8` and commits the `AQ.2`, `FR.2`, `WM.1`, and `PR.1` fences; v0.7 adds `AQ.4` and the forward-looking `GR.9`, refines the `PR.3` fence with a class-complete sweep, extends source-bound discipline to the metadata tier, and adds cross-model verification as a verification-stack property); the inventory is tabled with its committed fences in [CATALOGS.md](CATALOGS.md) §1 and grows by extension as new shapes are documented. The discipline ([§4](#4-the-anti-fabrication-core-the-hard-floor)), the verification stack ([§7](#7-the-verification-stack-the-rigor-control)), and the control-space ([§3](#3-the-control-space-model)) are the framework's substance; this inventory is the failure-space against which they are measured. The shapes are not equally fenced: ARD **structurally fences** one — anchor-and-drift (`GR.1`) — **detects** the highest-frequency adjacent shape (noise domination, `CX.1`, [§11](#11-known-limitations)), **commits** per-shape fences on most of the rest, and **names** a residual set as forward-looking until each earns its own. This section explains the canonical shape and how to read the coordinates; [CATALOGS.md](CATALOGS.md) §1 carries the honest per-shape status.

**Anchor-and-drift fabrication** is the canonical shape — the one that motivated the framework, and the one whose fence is tightest. It is not hallucination in the simple sense — it is a composed fabrication that passes surface credibility checks. The agent fetches a source; uses it faithfully for the load-bearing, verifiable-by-inspection substrate (a figure, a date, a version, a count, a name); then composes the surrounding categorical attribution — which dataset, which baseline, which version, which architectural layer — from training-recall rather than from the fetched source. The verifiable substrate anchors the appearance of grounding; the surrounding context drifts.

The pattern's defining property: **successful source retrieval does not prevent it.** Fetch-first discipline alone is insufficient — retrieval succeeds and the fabrication composes around the retrieved anchor. This is why the per-source attestation primitive ([§4.2](#42-the-per-source-attestation-primitive)), not retrieval, does the structural work, and why a composed misattribution can pass mechanical lint and adversarial review alike and still need the always-on terminal spot-check ([§7](#7-the-verification-stack-the-rigor-control)) to catch it. ARD's shapes are its own — derived from observed failures of this kind, not borrowed; the defensibility trace ([theory/](theory/)) carries the externally-grounded positions behind each commitment.

**Reading the coordinates.** The codes are ARD's own. Each locus names *where in the trajectory the failure lives*, and the two-letter prefix self-describes that locus; the ordinal indexes shapes within the locus. Anchor-and-drift is **Grounding / misattribution** (`GR.1`), an umbrella over two sub-shapes: surrounding-context composed while the anchor is fetched (`GR.1a`), and within-source attribution swap (`GR.1b`). The full per-shape detail is a deployment-maintained living artifact.

---

## 3. The control-space model

ARD's settable elements are **one kind of thing.** The positioning dials, the failure-shape inventory, the verb-set, the verification gates, the adversarial-read jobs, the lint patterns — all are **controls**. The framework is a **registry of controls**; an engagement is a **trajectory** through the control-space: a starting configuration, adjusted in flight, with human checkpoints at the co-decision points. This is a consolidating lens, not a new mechanism — it names a shape the framework's parts already share.

**A control** = an **option-set** + a **select-cardinality** + a **lifecycle**:

- *Select-cardinality* is either single-select (**pick one value** — the control is a **dial**) or subset-select (**activate an applicable subset**).
- The option-set is realized as a **store**: a dial's store is a **soft-enum**; a subset-select control's store is a **catalog**. An engagement **activates** the applicable subset (or, for a dial, picks the one value); active options **fire** at their implement-point.
- *Lifecycle* = set-point / implement-point / revisit-point.

Options are a durable, reused library. The catalog **grows** by a closed-with-extension recipe (coin an ad-hoc option; document it inline; surface it for consolidation; promote it to baseline at roughly three independent uses) and **shrinks** by retirement. Whether an in-flight ad-hoc option is a one-off or deserves codifying is an agent judgment — part of the discipline.

These per-control stores — the catalogs, and the dials' soft-enums — are exactly what [CATALOGS.md](CATALOGS.md) publishes at their current baseline. The *catalog* named here and the *baseline catalogs* in that document are one notion at two scopes: a single control's option-store, and the published collection of them all.

### 3.1 The floor — the always-activated core

The floor is not a bolted-on layer; it is the emergent core of options nearly every engagement activates. It has two parts:

- A **hard part**, activated by *commitment* regardless of applicability — the anti-fabrication core ([§4](#4-the-anti-fabrication-core-the-hard-floor)) and the terminal spot-check ([§7](#7-the-verification-stack-the-rigor-control)). **Non-erodable.** This is the rigor-erosion guard.
- A **soft majority**, activated by *ubiquity of applicability* — skippable only when genuinely not-applicable, and then logged as not-applicable, never silently dropped.

**Membership in the hard floor is reachability-indexed and shape-relative.** An option **C** is in the hard floor *of a research-shape S* iff (a) the failure **C** fences is **structurally reachable in S**, and (b) removing **C** leaves that failure with **no remaining backstop**. Per-shape floors *derive* from this test — there is no enumerated shape→floor table. The floor is a fail-safe-defaults security fence: the safe state holds whatever configuration is active.

Non-erodability guards against *per-instance* "not needed here" judgment — the exact judgment anchor-and-drift is built to pass — **not** against *structural, shape-level* inapplicability. A breadth-survey that emits no cross-specialist synthesis structurally cannot smooth cross-specialist contradictions, so the cross-specialist-synthesis fence ([§7](#7-the-verification-stack-the-rigor-control)) is simply out of that shape's floor. The floor is therefore legitimately shape-relative while remaining non-erodable within each shape.

> **Guard.** Shape classification must be a committed, kickoff-level determination governed by the scope-authority dial ([§8](#8-the-positioning-dials-the-dial-space)) — not in-flight self-reclassification. Re-shaping to shrink the floor is scope-adaptivity, which scope-authority permissions; you cannot silently re-shape to drop a fence. Without this guard, shape-relativity is an erosion hole; with it, it is sound.
>
> Shape classification is an **agent-or-human judgment at kickoff**, not a mechanical derivation an adopter must build. The reachability test is a reasoning aid applied at that checkpoint, and the worked `evaluate`-drops-from-a-scout case ([§7](#7-the-verification-stack-the-rigor-control)) is its template — there is no executable shape→floor function to implement.

### 3.2 Activation-profiles

An **activation-profile** is a named common configuration — it pre-selects a commonly-used option-set *across all controls* for a recognizable engagement type. Four profiles make the space legible: **focused** (depth on one question), **breadth-survey** (landscape mapping), **decomposed** (structured multi-facet), **program-scale** (coordination across campaigns). These are named starting configurations, not presets the framework mandates. The reference posture is "pick a profile (or go custom), then adjust in flight."

### 3.3 Lifecycle — pre-disposition and in-flight adjustment

Kickoff sets the **pre-dispositions** — usually pick a profile, then adjust — co-decided with the human. In flight, each control re-adjusts at its **signal-local revisit-point**: *a control revisits where the signal that would change it actually arises.*

- **Scope-class controls** (decomposition, dimensions/cuts, source-acquisition, scale/fan-out) revisit **post-campaign** — the completeness signal comes from reading the findings whole.
- **Verification-class controls** (which gates, which jobs, which failure-shapes) revisit **at the verification stages** — the fidelity signal comes from lint / adversarial-read / evaluate.

You cannot sensibly re-scope at adversarial review: that stage emits no scope-completeness signal. A signal that arises *out of place* (an adversarial-read job surfacing a *scope* gap rather than a fidelity fix) is **routed** to the control's proper revisit-point — not handled in place, not dropped.

### 3.4 Two adaptivity axes, asymmetric

Adaptivity is *derived*, not a separate control:

- **Scope-adaptivity** (re-decompose, re-scope, sample more) is **permissioned by the scope-authority dial**: pre-registered forbids it; in-engagement-judgment is its native mode; mixed allows it at named points.
- **Rigor-adaptivity** (escalate or prune verification) is **asymmetric**: always allowed *upward* (escalate scrutiny on evidence, even for a pre-registered engagement), *floor-bounded* downward (never below the hard floor). "Less" only ever prunes genuinely-not-applicable options — lossless, not rigor reduction.

When in-flight discovery surfaces growth (a catalog gains an option; a new dimension appears), the checkpoint choice is **absorb** (expand the engagement now) or **defer** (land this round, spawn a follow-on) — isomorphic to a work-item lifecycle.

---

## 4. The anti-fabrication core (the hard floor)

These disciplines are the commitment-activated hard floor. They always apply where their failure is structurally reachable.

### 4.1 Source-bound citation discipline

Every citation in research output must point at a source actually fetched during the authoring engagement, or cite through a fetched source. A **three-state rule**:

- **In-corpus / fetched** — assert with a citation to the fetched source (the `[handle]{N}` form, [§10](#10-data-contracts)).
- **Cited-by-another-source** — when a fetched source attributes a position to a source not in the corpus, assert as *"Source X attributes to Y that…"* with the citation pointing at the fetched source. Do not extend to independent claims about the non-corpus author.
- **Recalled from training** — **forbidden as a citation.** If a source feels relevant from memory, fetch it. If it is inaccessible, acknowledge the gap and drop the citation.

**No-footnote-fabrication.** When an in-corpus source names a non-corpus author with no bibliographic detail, cite-through-without-footnote is sufficient. Do not invent footnote content (title, year, venue) to make output look uniform. Visible asymmetry is the disciplined outcome.

**Acquisition-pending escape hatch.** When a non-corpus source surfaces as load-bearing, route through an acquisition note and defer the assertion until the source is fetched — rather than asserting from training-recall.

**Vendored-source acquisition.** Acquisition is also a *which-corpus* choice, not only a fetch-or-defer one: when the load-bearing source is an available open-source dependency and the question is about its behavior or version-internals, the canonical corpus to acquire is the **source tree cloned at the pinned version in use** (the `source-direct` primary), with the project's docs the subordinate tier — the vendored-source acquisition pattern + its two-pronged applicability gate are catalogued at [CATALOGS.md](CATALOGS.md) §2.

**Acquisition candidates are themselves source-bound.** Acquisition surfaces in two modes: *reactive* — a load-bearing source that could not be fetched (the escape hatch above) — and *proactive enrichment* — noticing, while researching, sources that would deepen the corpus beyond what was fetched, even where no specific claim is blocked. Proactive enrichment is a recall-fabrication vector: a request to surface sources "worth acquiring" is readily answered from training-recall, reproducing the recalled-from-training failure in the acquisition act rather than the citation act. The same three-state rule therefore binds a *suggested* source as it binds a *cited* one — a proactive-enrichment candidate must point at a fetched source that names it as canonical for the engagement; a candidate grounded only in memory is training-recall and is dropped. (A blocking candidate is self-grounding *only when the fetch attempt exhausted the available acquisition modes* — the `AQ.4` fence below.) This fences `AQ.3` ([CATALOGS §1](CATALOGS.md)).

**Blocking is mode-exhaustion-bound — the `AQ.4` fence.** A `blocking` classification is self-grounding only when the fetch attempt **exhausted the available acquisition modes**: escalating from the default tool through browser-class, authenticated, and operator-mediated fetches before declaring a source unavailable. A single-tool transport block — a session-gated 403, an anti-bot challenge, a JS-rendered page a simple fetch cannot read — is *not* content-unavailability; treating it as terminal is **inadequate-attempt blocking** (`AQ.4`), which abandons an acquirable source and over-declares a coverage gap. Distinguish a *transport* failure (transient or blocked — escalate the mode) from a *content* failure (the source genuinely does not exist — a hard 404/410); only the latter, or genuine mode-exhaustion, warrants `blocking`.

**Acquired is not attested.** A source already present in the corpus — a raw fetch on disk, an ingested book — whose target section is not yet attested is in the **acquired-but-unattested** state, distinct from *unacquired*. It routes to *attest-from-disk* (read the on-disk raw, write the attestation), never to re-acquisition; and until attested it is not citable from recall — citing an on-disk-but-unattested source from memory is the `GR.2` recalled-from-training state riding on a misclassified acquisition state.

### 4.2 The per-source attestation primitive

The architectural commitment that **separates attestation from composition.** A per-source attestation sits between source fetch and synthesis. Synthesis claims cite the attestation by handle rather than the raw source, preserving an auditable chain:

```
synthesis claim → cites attestation by [handle]{N} → attestation paraphrases raw → raw source (fetched)
```

Each hop is auditable. A citation-chain lint mechanism verifies handle resolution, source resolution, and provenance presence. Attestations live at the **attestation tier**, keyed by a stable handle that is the citation anchor.

The **citation wire-form** is `[handle]{N}` — `handle` matches `[\w-]+` and identifies the source (and resolves to its attestation); `N` matches `\d+` and indexes the source's entry in its per-corpus bibliography. The full match grammar is `\[([\w-]+)\]\{(\d+)\}`. This is the invariant an adopter's lint resolves against. The wire-form **captures** `[\w-]+` permissively so a malformed handle surfaces for flagging rather than failing to match; a **canonical** handle is **ASCII-lowercase** (`[a-z0-9-]+`), and a lint flags an uppercase or non-ASCII (homoglyph) handle as non-canonical — a lookalike must not resolve silently beside the real one.

Every attestation carries a **normative-minimum frontmatter** — the fields the citation chain depends on:

```yaml
source_handle: <handle>            # MUST equal the [handle] in citing prose
fetched: <YYYY-MM-DD>
source_url: <URL>                  # one of source_url / source_path is required
source_path: <local-path>          # for ingested / local sources
provenance: source-direct
```

A lint resolves `[handle]{N}` to an attestation at the deployment's attestation tier (the path template is a deployment mapping; the *handle→file* resolution is the invariant), then checks `source_handle` matches, the source resolves, and provenance is present. Per-source-class frontmatter extensions (`source_class`, `version`, `source_venue`, …) are in [CATALOGS.md](CATALOGS.md). The body has five components: paraphrased summary; key passages with source-internal anchors; structural metadata; nothing composed beyond the source; substrate-test pass. A claim cites the attestation only once its cited specific is recorded there — the load-bearing detail is paraphrased or quoted into the body *before* the citation is written; a citation whose specific never landed in the attestation (the handle resolves, the body is substantive, yet the detail is absent) is the read-but-not-attested gap, caught semantically downstream ([CATALOGS.md](CATALOGS.md) §4 job (a)).

**Bibliographic metadata is source-bound too.** The source-bound rule ([§4.1](#41-source-bound-citation-discipline)) binds not only citations and attestation bodies but the **bibliographic-metadata tier** — a per-corpus bibliography (`BIBLIOGRAPHY.md`) or `{N}`-bibliography entry's source URL, DOI, publication date, and venue. A metadata value belongs in committed substrate only when read off the fetched source and recorded in its attestation, never filled from training-recall — *even when the recalled value is correct*. A correct-from-memory DOI absent from the attestation is the recalled-from-training state one tier down from the body citation: **metadata recall-sourcing** (`GR.9`). Read the value off the source, or leave the field unfilled and marked pending; a correct-but-ungrounded value is still ungrounded.

### 4.3 The substrate test

Two tests fence what should not appear in research artifacts, applied at write-time and re-read time:

- **Project-framing test** — *could a reader without the deployment's context use this artifact?* Deployment-specific editorial belongs downstream, not in the artifact.
- **Agent-task-context test** — *does this read as the first descriptive engagement with the source, even on a re-engagement?* References to authoring history belong in session notes, not the artifact body.

### 4.4 Composed-claim discipline

Composed effort estimates, version/file counts, comparative superlatives, and named-feature claims are forbidden without substrate — no single fetched source backs a comparative or quantitative claim the agent constructs by inference, and such claims inherit the anchor-and-drift risk. Reformulate to a **relative anchor** ("comparable to X", "lower than Y", where X/Y are in-corpus) or surface as an **open question** for human estimation.

### 4.5 Contradiction-handling discipline

When sources diverge, surface the disagreement structurally — never write a unified position that averages or splits the difference under a paraphrase. Divergences become a **ledger row** tagged with both source handles and a relationship-type (`contradicts`, `tension`, `qualifies`, `incommensurable`, `sublation`), and an explicit `## Contradictions` section in cross-source synthesis where named positions stand side-by-side. Resolution paths: commit a downstream decision with rationale; or explicitly decline to resolve (a position in itself); or — sparingly, where genuinely warranted — author a sublation that takes both positions up into a higher determination, citing both. The guard: a "higher determination" that is an averaging-paraphrase wearing a label is the exact failure this fences.

### 4.6 Strict layer directionality

The research substrate is layered ([§10](#10-data-contracts)). Authoring reads **down the gradient, never up**: descriptive-layer authoring (attestation, engagement-unit aggregation, per-source captures) does not consult analytical-tier artifacts; engagement-unit aggregation reads raw source, not orientation notes. This is the structural fence against **drift-inheritance** — the cumulative distortion that propagates when each layer paraphrases the prior layer's interpretation rather than the raw source.

The hermeneutic-circle objection (prior understanding always conditions engagement) is acknowledged and answered at a different layer: strict directionality holds at the descriptive layer; iterative-return ([§7](#7-the-verification-stack-the-rigor-control)'s adversarial-read and evaluate) operationalizes the hermeneutic posture at the verification layer. The two fence different failures at different layers and both stand.

In a **re-engagement** ([§4.8](#48-corrections-vs-reversals)), the prior artifact being re-authored is read as a **claim-extraction lens** — consulted for orientation, never cited as a source (it is not a reference- or attestation-tier artifact). Citing the lens as substrate launders prior synthesis into fresh evidence — asserting grounding before the source substrate is engaged, the premature-commitment shape (`FR.2`).

**Marked-alternative affordance.** Strict directionality forbids importing analytical framing into a descriptive artifact — but a genuinely useful framing sometimes has no analytical-tier home yet, and the choice between silently embedding it (the failure this fences) and dropping it (reflexive pure-description perfectionism) is a false one. The permitted exception is an **attributed inline marker** that names the artifact whose reading the framing is: `(<artifact>-introduced reading: … — though the source presents this as …)`. The attribution is what makes it auditable rather than laundered — the framing is carried in the descriptive body but explicitly marked as *not* source-attested, so a downstream reader (and the adversarial-read) can see it is the artifact's reading, not the source's. This is an **exception form, not a failure shape**: it converts a silent import into a visible, attributed one. It is distinct from `bracket` (which suspends the agent's *own* prior framing at engagement-time, [§6](#6-the-act-vocabulary-the-verbs)) — the marked alternative carries an attributed framing *forward* in the descriptive tier rather than suspending it.

### 4.7 Per-claim epistemic-status markers

Claims carry markers only where attestation alone is insufficient — **the absence of a marker is the positive attestation signal** (exception-noise minimization). Markers distinguish source-attested from composed: `extends` (author builds beyond the source), `{inferred: <verb>}` (composed across attestations — convergence / divergence / tension / aggregate), `{ambiguous: <pointer>}` (unresolved contradiction, resolvable in principle), `{contested: <locus>}` (a standing field-level dispute the engagement records but does not adjudicate), `{incommensurable: <pointer>}` (sources that cannot be stated in a shared frame), `{confidence: <depth>}` (the cited source was engaged at less-than-source-direct depth). Marker vocabulary is closed-with-extension.

### 4.8 Corrections vs reversals

Artifacts change three structurally distinct ways, and distinguishing them prevents silent rewriting that erases substrate. A **correction** preserves the position (fix in place + a revisions log). A **reversal** changes the position (a new artifact at a new path with a `supersedes` pointer; the prior is retained as the historical record). A **refresh** re-authors the *whole* artifact in place over revised substrate — *position-agnostic* (the position may or may not change); prior content is superseded in place rather than path-forked. Scope is the differentiator: a correction is a localized in-place fix, a reversal a new path, a refresh a whole-artifact re-author.

A refresh is the change-mode of a **re-engagement** — re-running an engagement over substrate that already exists (a staleness-driven refresh of a prior brief; an audit-and-enrich pass over prior work). A re-engagement is registered as a **recipe over existing fields, not a new dial**: `temporal_contract: supersedes-prior` (or `re-engage-on-trigger`) + an existing `intent` + the refresh change-mode. A deployment that reaches for a bespoke "engagement-nature" field maps it onto this recipe — the framework retires derivable fields rather than storing them ([§8](#8-the-positioning-dials-the-dial-space)).

A correction carries a **downstream-reconciliation obligation**: it is not discharged until it is reflected in the artifact it corrects. A correction diagnosed in a synthesis-tier artifact that never reaches the downstream artifact it names leaves the record right and the artifact wrong (the `PR.3` failure). Completeness spans **every corrected position regardless of which tier recorded it** — a per-source correction and a synthesis-tier correction are equally bound, and enumerating only one tier's corrections reproduces the failure. When a correction is **class-shaped** — one instance of a recurring defect class (a quote-fidelity slip, a recall-sourced metadata value, a naming-convention miss) — completeness additionally requires a **class-complete sweep**: every same-class instance across every tier, not only the flagged ones. A subset-fix that leaves unflagged siblings of the same class is the same non-propagation failure at the class level. The obligation discharges at the `reconcile` decision-point ([§6](#6-the-act-vocabulary-the-verbs)) — verified by the spot-check-tier reconciliation-completeness job ([CATALOGS.md](CATALOGS.md) §10).

A correction also has a **direction**: when verification finds a claim that is *true against source* but not yet reflected in the substrate it cites — a citation resolving to an attestation that does not yet contain the cited specific — the correction **extends the substrate and re-points the citation; it does not patch or soften the prose claim.** The defect is missing attestation content, not a false claim, and softening the claim to fit the thin attestation would discard a true, source-grounded finding. Correct *toward* the substrate, never away from the finding.

---

## 5. Discipline propagation (the invariant)

Whenever research authoring happens in a sub-context — any agent that composes research output without the orchestrator's full context — **the discipline must travel into that sub-context.** A sub-context that authors without the anti-fabrication core reintroduces exactly the failure the framework fences. This is invariant for any adopter on any agent system, however sub-contexts are spawned. The load-bearing content that must reach every authoring sub-context is the source-bound citation discipline, the substrate test, the no-footnote-fabrication fence, the per-source attestation requirement, the contradiction-handling discipline, and the composed-claim discipline.

The **propagation mechanism** is deployment-specific — preload a discipline bundle into each sub-agent, inline the bundle verbatim in each dispatch, or use any host-native context propagation that guarantees the content arrives. The invariant is that it arrives; the mechanism is a deployment choice.

---

## 6. The act-vocabulary (the verbs)

ARD codifies fifteen verbs naming the discrete acts of a research engagement; the set is closed-with-extension. They are the vocabulary of what *fires* at decision-points ([§7](#7-the-verification-stack-the-rigor-control)). Eleven **anchor decision-points** (one verb = one decision-point): `substrate-check`, `decompose`, `attest`, `synthesize`, `lint`, `adversarial-read`, `evaluate`, `spot-check`, `user-validation`, `promote`, `reconcile`. Four are **composite-firing sub-verbs** that fire within a parent: `bracket` (within `attest`, conditional — engagement-time suspension of prior framing), `seek-disconfirming` (within `synthesize` — active disconfirming search before composing each load-bearing claim), `self-flag` (per-phase reflexive noticing), `stage` (opportunistic surfacing of cross-source noticings). Per-verb definitions are in [CATALOGS.md](CATALOGS.md). `reconcile` is the terminal act of a **re-engagement** walk ([§4.8](#48-corrections-vs-reversals)) — the re-engagement analog of `promote` — fired only when the walk re-authors an existing artifact, to verify it reflects the corrections it was meant to apply.

*(Counts reconcile thus: **15 verbs** = 11 anchor + 4 sub-verbs. The decision-graph ([§10.1](#101-the-decision-graph-activation--ordering)) names **13 decision-points** = those 11 verb-anchored points + 2 coordination acts (`dispatch-time-registration`, `specialist-dispatch`), which are not discipline verbs.)*

---

## 7. The verification stack (the rigor control)

Synthesis warrants multi-stage verification. The *existence* of the stack is invariant; its composition is the current baseline. The stack is the **rigor control of the control-space** — a **catalog** of gates you subset-select from, with a hard-floor core, not a monolithic switch.

Four gates, each catching what the priors structurally cannot:

| Gate | Floor status | Catches |
|---|---|---|
| `lint` | **hard floor** | surface-signature claim-shapes + citation-chain integrity (mechanical) |
| `adversarial-read` | selectable | semantic claim-shapes, smoothed contradictions, relevance-weighting (a fresh-context read) |
| `evaluate` | selectable | shared-context blind spots, via structural context-isolation |
| `spot-check` | **hard floor** | the residual gap — the always-on terminal human-context check |

`lint` + `spot-check` are the **hard floor** (always fire — the anti-fabrication core). `adversarial-read` + `evaluate` are genuinely **selectable**, and whether a selectable gate is in a given shape's floor is decided by the reachability test ([§3.1](#31-the-floor--the-always-activated-core)): `evaluate` fences **cross-specialist** framing-contamination, so it drops out of a single-pass scout's floor (no cross-synthesis artifact exists for it to fence) and re-enters the floor of any **cross-specialist (multi-path) synthesis** shape.

**Why spot-check is load-bearing.** A composed misattribution can pass both the mechanical lint and the adversarial read and still be caught at the final human-context spot-check: the terminal gate runs with full substrate access at a human's categorical-sampling vantage, which surfaces residual composed attributions the automated gates leave behind. It is the last-resort fence for that residual, not a quality-assurance nicety.

**`verification_rigor` profiles are activation-profiles over this catalog** — named subsets of the selectable gates (`floor` = the hard floor alone; `standard` = `+ adversarial-read`; `full` = `+ adversarial-read + evaluate`); every profile includes the hard floor and varies by which selectable gates it adds. The three form an ascending chain because `evaluate` is only reachable where `adversarial-read` is already in-floor ([§3.1](#31-the-floor--the-always-activated-core)) — so the off-chain `{evaluate}`-only config has no shape that needs it. Activating a gate independently of the profile label ("go custom") is first-class, and the gate-catalog is closed-with-extension. Rigor escalates upward freely and is floor-bounded downward.

**Sampling breadth is not floor erosion.** A hard-floor gate always *fires* in every profile — that is the non-erodable invariant. What a profile may vary is a floor gate's *sampling breadth*: a lighter profile may run `spot-check` over a smaller categorical sample. The gate still fires (presence is invariant); how widely it samples is a depth choice within the firing gate. Floor erosion would be a hard-floor gate *not firing*; reduced sampling of a gate that does fire is not erosion. (Sampling breadth still ratchets upward freely on evidence.)

**Scale / fan-out is a separate control** — how wide the harvest is (how many specialists) — that lives next to `decompose` and revisits post-campaign. It is not part of the rigor control and must not be conflated with it.

**Incremental re-verification on refresh.** When a **refresh** ([§4.8](#48-corrections-vs-reversals)) re-authors an existing artifact, the stack re-runs over the **changed or added substrate** — the new or revised citation range — not the whole artifact; the prior-verified set is grandfathered, **recorded explicitly** so the verification scope stays auditable. The hard-floor gates still fire, over the delta. (A silent whole-artifact re-verification claim, or un-recorded grandfathering, is the failure this fences.)

**Bounded independence — procedural, not paradigmatic.** The stack's independence is *procedural*: each stage catches what the priors structurally cannot. It is **not paradigmatic** — all four stages share the failure-shape inventory as their common exemplar set, so they carry *correlated* blind-spots for failure shapes the framework has not yet named. Read "four independent stages" as *procedurally independent within the paradigm*, not as paradigm-independent robustness. (See [§11](#11-known-limitations).)

**Model diversity is a verification-stack property — the partial fence for correlated blind-spots.** Just as sampling breadth varies *how widely* a firing gate samples, **model diversity** varies *which model runs* a selectable gate: running `adversarial-read` or `evaluate` on a model from a different family than the author (and than the other gates) **partially decorrelates** the shared-paradigm blind-spots named above. It is a property over the existing gates, not a new gate — it changes *who checks*, not *what is checked* — and it composes with any profile (a deployment may require it at `full`, or offer a `full+` profile). The decorrelation is **partial, not paradigm-independence**: a different model is still a language model, and the most capable models exhibit correlated errors even across providers and training lineages, so model diversity *reduces* shared blind-spots without eliminating them — residual correlation must be assumed, and the greatest available paradigm distance (a different model family and pretraining lineage) is preferred. This is the committed (partial) fence for the correlated-verifier limitation ([§11](#11-known-limitations)); the external grounding is recorded in the [theory/](theory/) defensibility trace (`COMMITMENTS.md`).

---

## 8. The positioning dials (the dial-space)

A research engagement is positioned in a continuous parametric space — the **dial-space** — rather than chosen from a preset. An engagement is positioned at dispatch by setting each dial. The dial count and cut are a **working position**, not settled — validated so far by limited operational use. Three positioning dials, plus a rigor axis alongside:

- **scope-authority** *(protocol ↔ judgment)* — where authority over the engagement's scope and unit sits: `pre-registered` / `mixed` / `in-engagement-judgment`. A stored field; a declared default the engagement may revise, not a hard lock. It governs three derived properties: unit-emergence, disconfirmation timing, and re-dialing authority.
- **engagement-unit** *(granularity)* — the smallest source-scope at which the source constructs a coherent whole. **Deliberately emergent, not stored** — discovered at read-time, following the engagement's purpose.
- **disconfirmation-mode** *(checkpointed ↔ embedded)* — when active disconfirming-search fires. **Derived from scope-authority, not stored** — protocol engagements checkpoint; emergent engagements embed.

**verification-rigor** rides alongside as the rigor control ([§7](#7-the-verification-stack-the-rigor-control)) — it governs *which verification gates fire*, not engagement positioning. It is not a fourth positioning dial, and is distinct both from disconfirmation-mode (which times disconfirmation) and from scale/fan-out (a separate scope-class control).

Only scope-authority and verification-rigor are stored; engagement-unit is emergent and disconfirmation-mode is derived. The framework retires derivable fields rather than storing them.

**Engagement depth is not a fourth dial.** The depth an engagement warrants is *derived*, not positioned: it follows from the **decision-relevance** of the question — what downstream decision a finding would change — declared at registration ([§9](#9-the-registration-contract)), not stored as a positioning coordinate. Per the retire-derivable-fields principle, ARD carries a `decision_relevance` registration field and a kickoff gate rather than a depth-vs-breadth dial: the operator states the yield hypothesis ("what decision changes if this finds X?") and right-sizes rigor and fan-out to it. This resolves the §11 provisional "fourth dial" question in the no-new-dial direction.

---

## 9. The registration contract

Every engagement is dispatched with a registration declaration that names the goal's structural properties — it is the dispatch-time act that **sets the controls.** Registration is dispatch-time, not artifact-time: research artifacts carry only intrinsic metadata, and a reader without the deployment's context should be able to use an artifact without decoding the dispatching goal vocabulary. Output should stand on its own merits.

Ten fields, always present (a uniform shape prevents silent default drift): `intent`, `output_kind`, `consumer`, `verification_rigor`, `temporal_contract`, `primitives_extends`, `primitives_opts_out`, `decision_relevance`, plus the two engagement-shape fields `scope_authority` and `analytical_artifact_type`. **`decision_relevance`** is the dispatch-time **yield hypothesis** — a free-text declaration (not an enum) naming the downstream decision a finding would change ("what decision flips if this finds X?"). It is the value-of-information gate on depth: a question whose answer cannot change any decision warrants no depth, and the engagement right-sizes rigor and fan-out to the stated decision. A kickoff gate requires it be stated before depth is set. The external grounding (value-of-information / expected value of sample information) is recorded in the [theory/](theory/) defensibility trace. Value catalogs are in [CATALOGS.md](CATALOGS.md). The persistence form is a deployment choice — a conversation transcript suffices for a single-pass walk; a persisted registration artifact suits multi-specialist and multi-campaign walks. The registration's *existence* is invariant; its persistence form is not. A recurring field-combination may be named as a **recipe** (e.g. the re-engagement recipe, [§4.8](#48-corrections-vs-reversals)) so a recurring engagement-shape stays legible without storing a new dial.

---

## 10. Data contracts

### 10.1 The decision-graph (activation + ordering)

A **walk** activates an applicable subset of decision-points in constraint-respecting order. The activation subset is positioned at dispatch (a profile, then adjusted); the **ordering constraints are invariant**:

```
dispatch-time-registration
  → substrate-check
  → decompose  → [specialist-dispatch, when multi-specialist]
  → attest
  → synthesize → lint → adversarial-read → evaluate → spot-check
  → [user-validation, conditional] → promote
  → [reconcile, when the walk is a re-engagement]
```

For multi-specialist walks, `lint` fires against within-specialist briefs *before* cross-specialist synthesis, and `adversarial-read` fires *after* it — placing the mechanical check at the earliest useful point and the adversarial read where cross-specialist smoothing risk is highest. The decision-graph *names* the coordination acts (`dispatch-time-registration`, `specialist-dispatch`) and fixes their ordering; the acts themselves are a deployment's orchestration topology.

### 10.2 Substrate band layout

The research substrate has four tiers, read down-gradient only ([§4.6](#46-strict-layer-directionality)):

- **Reference (source-direct)** — raw fetches, per-corpus `BIBLIOGRAPHY.md` + acquisition recipe. No agent-authored analysis here.
- **Attestation** — per-source first-read, keyed by stable handle. The citation anchor.
- **Engagement-unit (precis)** — source-coherent aggregations authored from raw; the unit is identified by reading (shape-arises-from-source).
- **Analytical** — cross-source work: named-pattern catalogs and glossaries; standalone briefs; campaign bundles; settled positions; working/cross-arc hypothesis ledgers.

### 10.3 Temporal contract per artifact

Every artifact carries a temporal contract encoding both stop semantics (when does its engagement conclude?) and after-revision semantics (how does it change when its substrate changes?). Five baseline contracts: `write-once-on-converge`, `extend-on-source-rev`, `supersedes-prior`, `ttl-bounded`, `re-engage-on-trigger`. Per-tier defaults reduce declaration overhead; semantics are in [CATALOGS.md](CATALOGS.md).

### 10.4 Citation form and provenance

Citations use the `[handle]{N}` wire form — `handle` identifies the source (and resolves to an attestation), `N` indexes into a per-corpus bibliography. Artifacts carry a `provenance` field declaring authorial role (source-direct / authored-from-raw / synthesis / generated / hybrid), rendered visibly so readers calibrate trust without reading frontmatter. An optional per-citation manifest adds span-anchoring (a quote + surrounding context, the only cross-extraction-stable anchor) and provenance metadata when a citation warrants it.

### 10.5 Typed cross-references (optional)

`[handle]{N}` citations link a *claim to a source*. An artifact may additionally carry **typed cross-references** to *other artifacts* — a `related:` frontmatter list of directed, typed edges that a graph index can read (a precis grounds a position; a decision implements a design):

```yaml
related:
  - to: <slug-or-relative-path>
    type: <predicate>          # from the closed-with-extension vocabulary, CATALOGS §9
    note: <optional rationale>
```

- **Directed from the carrier outward** — the artifact whose frontmatter carries the edge is the source; `to:` is the target (a precis's `type: grounds` edge means *this precis grounds the target*). `related` (SKOS-derived) is the only symmetric predicate.
- **Author forward only; derive reverse views.** A graph index maintains the reverse index; manually authoring both directions drifts out of sync.
- **Closed-with-extension vocabulary** ([CATALOGS §9](CATALOGS.md)) — a baseline of twelve predicates drawn from established citation/argumentation ontologies (CiTO, IBIS/Toulmin, SKOS) plus substrate-native; extend only with a cited source-ancestor or an explicit no-ancestor rationale.
- **Optional + opt-in.** Artifacts without typed-edge needs use prose links or `[handle]{N}` alone; structural predicates (`parent`, `supersedes`/`superseded_by`) stay as their established top-level fields, not under `related:`.

The contract is the `related:` shape + the directionality rule; the predicate vocabulary grows by extension like the other catalogs.

### 10.6 Decomposition rationale (multi-specialist / program walks)

The `decompose` verb's multi-sampling discipline ([§6](#6-the-act-vocabulary-the-verbs)) is the named mitigation for **decomposition-framing lock-in** (`PR.2`, [CATALOGS §1](CATALOGS.md)) — a facet cut inheriting a lens all downstream work then runs inside. That discipline is **inert unless the candidates are persisted**: lock-in takes hold precisely when the cut is reasoned through in-context but no artifact records the alternatives, so the chosen lens becomes invisible to every later reader. The persisted artifact is what makes the prevention real.

A **decomposition-rationale** artifact is therefore **mandatory for multi-specialist and program-scale walks** (single-pass / light walks where `decompose` does not fire are exempt). It carries:

- **≥3 decomposition candidates** — the alternative facet sets (or, for breadth-survey shapes, vector sets: direct / adjacent / analogous) that were genuinely considered.
- **A comparative assessment** — why the candidates differ and what each would surface or foreclose.
- **The chosen sample** — the cut taken forward.
- **A `self-flag` note** — the reflexive noticing of what framing is shaping the facet choice.
- **A bracket-framing line** — what the chosen lens may foreclose, named explicitly so a downstream reader can see the boundary the cut drew.

The artifact is authored **before specialist dispatch** and feeds the decomposition checkpoint (the candidates surfaced to the committing party are the ones persisted). **Program-scale walks write it at both cuts** — once at the program-DAG decomposition and once at each campaign's facet decomposition. Where it lives is a deployment choice (the plugin's engagement engine persists it at the campaign/program substrate root); the contract is the **mandatory-on-multi-path** rule + the five required contents.

---

## 11. Known limitations

ARD names its gaps deliberately rather than letting a comprehensive-fencing claim stand over them.

- **Noise domination (`CX.1`) is detected, not prevented.** The dominant failure mode by frequency in production data is the agent using less-relevant retrieved content while ignoring more-relevant retrieved content. ARD **detects** it (the adversarial-read relevance-weighting job reads *all* retrieved attestations for each major claim, not just the cited ones) but does not yet **prevent** it — a `rank-by-relevance` prevention layer is committed in principle and deferred in implementation. An adopter should treat noise-domination as fenced by detection, not closed.

- **Verification-stack independence is procedural, not paradigmatic** ([§7](#7-the-verification-stack-the-rigor-control)). The four stages share a common exemplar set (the failure-shape inventory), so they carry correlated blind-spots for shapes the framework has not yet named. The independence is real *within* the paradigm; it is not paradigm-independent robustness. A proposed (not yet committed) mitigation: treat out-of-category signals — findings fitting no named failure shape — as the tell of an out-of-paradigm shape, and route rather than dismiss them. ARD also commits a **partial** fence: **model-diverse verification** ([§7](#7-the-verification-stack-the-rigor-control)) — running a selectable gate on a different model family partially decorrelates the shared-paradigm blind-spots. It is partial by construction (a different model is still a language model; the most capable models correlate even across providers), so the limitation is *reduced, not closed* — residual correlation must be assumed. The route-out-of-category-signals mitigation remains the complement for shapes no model yet catches.

- **The tacit-knowledge surface gap.** Explicit rules cannot pre-empirically surface what a reflective practitioner catches in-engagement. This is named as **design rationale, not apology**: the floors-and-affordances governing kind ([§3](#3-the-control-space-model)) *is* the structural answer — floors, affordances, and checkpoints rather than a complete procedure. What remains a genuine gap is the narrower question of whether a dedicated post-engagement reflexivity *artifact* earns its place; the per-phase `self-flag` verb is the closest existing analog.

- **The fused-horizons artifact gap.** No artifact captures post-engagement horizon-expansion — the reshaped questions a reader ends an engagement holding. The iterative-return mechanisms ([§4.6](#46-strict-layer-directionality), [§7](#7-the-verification-stack-the-rigor-control)) evaluate what was produced, not what the producer now understands differently. Acknowledged; revisited if empirical pressure surfaces an artifact-tier need.

- **The dial-space cut is provisional** ([§8](#8-the-positioning-dials-the-dial-space)). Three dials is a working position validated by limited use, not settled — a fourth dial (an engagement-style / validity-criteria axis, or a depth-vs-breadth split) may yet earn its place, or the cut may re-form. v0.7 resolves the **depth-vs-breadth** candidate in the **no-new-dial** direction: engagement depth is *derived* from decision-relevance, so it enters as a `decision_relevance` registration field ([§9](#9-the-registration-contract)), not a stored positioning dial. The cut otherwise remains provisional — an engagement-style / validity-criteria axis may still earn its place.

---

## 12. Adopting ARD

ARD operates a deliberate **architecture-vs-inventory cleavage**, and instantiating it respects it:

- The **architecture** (this document) is what is invariant — the shape a deployment must preserve: the anti-fabrication core, the verification-stack existence, the control-space model, the data contracts.
- The **inventory** ([CATALOGS.md](CATALOGS.md)) is the current baseline — a starting point, **extended** via the closed-with-extension recipe ([§3](#3-the-control-space-model)). New failure-shapes, source-classes, verbs, lint patterns, and enum values are expected to grow as the domain pressures them.

A deployment maps each concept this spec names to its own substrate and tooling; the `agentic-research` plugin's engagement engine is the worked instantiation (a dynamic orchestrator + supporting rules, with deployment-specific paths and tooling made concrete). It is **one instantiation, not the framework**; any decomposition that preserves the invariants here satisfies ARD. The reasoning trace behind each commitment — the sources engaged and the positions settled — lives in [theory/](theory/), one hop from this spec, so the architecture stands alone while its defensibility stays traceable.

Instantiating ARD means: preserve the floor, instantiate the controls, keep the cleavage visible, and let the catalogs grow under empirical pressure.