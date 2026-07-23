# ARD — Baseline Catalogs

The inventory companion to [SPEC.md](SPEC.md), which specifies ARD as a framework for grounded, verifiable research conducted by AI agents — a tunable control-space of always-on checks plus selectable gates. Where the spec names what is **invariant**, this file populates the framework's **current baseline** — the catalogs an adopter starts from and **extends**.

Every catalog here is **closed-with-extension**: coin an ad-hoc option (lowercase-hyphen), document it inline at the point of use, surface it for consolidation, and promote it to baseline at roughly three independent uses. Nothing here is a fixed ceiling; the lists grow (and prune) under your own empirical pressure. This is the adopt-and-extend boundary the architecture-vs-inventory cleavage keeps visible.

The **consolidation surface** — where surfaced ad-hoc options are reviewed for promotion — is a deployment choice: for a solo deployment it is the maintainer's own judgment over this file; a shared, multi-party adoption needs a named venue (a registry, a periodic review). The recipe's invariant is the *gradient* (coin → use → promote at recurrence), not a specific review mechanism.

---

## 1. Failure-shape inventory

Failure shapes are named in ARD's **locus-of-failure** coordinate system (see [SPEC.md](SPEC.md) [§2](SPEC.md#2-the-failures-ard-addresses)) — seven loci keyed to *where in the trajectory the failure lives*: `AQ` Acquisition · `GR` Grounding · `CX` Context-use · `CO` Composition · `FR` Framing · `PR` Propagation · `WM` Warrant/meta. The current baseline is **twenty-seven shapes across all seven loci**: 11 Grounding, 1 Context-use, 4 Acquisition, 3 Composition, 2 Framing, 3 Propagation, 3 Warrant/meta. (v0.1 carried fourteen across six loci with `WM` unpopulated; v0.2 populated `WM` and added `GR.1c`/`GR.6`/`GR.7` and `CO.2`/`CO.3` under empirical pressure; v0.5 adds `AQ.3` under the proactive-enrichment acquisition discipline; v0.6 commits `AQ.2`'s fence and adds `PR.3` (non-propagated correction) and `GR.8` (disclaiming attestation), and commits the `FR.2`, `WM.1`, and `PR.1` fences (adding the lineage-DAG detection job to `PR.1`/`PR.2`); v0.7 adds `AQ.4` (inadequate-attempt blocking) and the forward-looking `GR.9` (metadata recall-sourcing), refines the `PR.3` fence with a class-complete sweep, extends source-bound discipline to the metadata tier ([SPEC.md](SPEC.md) §4.1), and adds cross-model verification as a verification-stack property ([SPEC.md](SPEC.md) §7) plus a `decision-relevance` registration field ([SPEC.md](SPEC.md) §9) — each a MINOR inventory/control growth.) The full inventory is below; the **Fence** column carries each shape's committed fence, or `—` for the **forward-looking** shapes — defined for legibility, with prevention/detection directions but no committed fence yet (each gains one when it earns it). It is a living artifact that grows as new reproductions are documented; a deployment maintains the full per-shape detail (mechanism + fence per shape) as its own analytical-tier artifact.

| Shape | Name | Fence |
|---|---|---|
| `GR.1a` | Anchor-and-drift — surrounding context composed while the anchor is fetched | per-source attestation + three-state citation + verification stack |
| `GR.1b` | Within-source attribution swap (figures correct, mapping reversed) | per-source attestation + semantic citation-chain walk |
| `GR.1c` | Cite-through fabrication shielded by source authority — the cite-through is structurally correct but the cited-from passage is subtly strengthened beyond what the source states | per-source attestation with quote-context anchors + adversarial-read quote-context walk (sharpens `GR.4`'s fence for the strengthening-via-authority pattern) |
| `GR.2` | Source unfetched — a training-recalled claim presented as cited | — *(forward-looking)* |
| `GR.3` | Composed claims with no source attempt (effort estimates, counts, comparatives) | — *(forward-looking; forbidden by the [composed-claim discipline](SPEC.md#44-composed-claim-discipline))* |
| `GR.4` | Quote-context distortion — quote accurate, surrounding qualifier stripped | adversarial-read quote-context walk |
| `GR.5` | Thin attestation passing lint — frontmatter correct, body un-anchored | lint structural check + adversarial-read complement |
| `GR.6` | Attestation-abuse — attestation form is correct (anchors present, key passages transcribed) but authored without genuine source engagement; lint and thin-attestation checks both pass | bracket directive (partial) + adversarial-read gloss-fit job (attestation-paraphrase vs independent source-summary) — *detection pending* |
| `GR.7` | Paradigm-trained gestalt failure — per-claim substrate is accurate, but the agent's gestalt of the whole source fits a trained category rather than the source's own argument structure. Includes the **per-claim facet** — *source-posture presupposition*: a sentence-level claim about the source's *own stance or intent* ("drew the wrong conclusion", "the most optimistic finding"), read as source-attributable when the source names no such posture (finer-grained than the whole-source gestalt; distinct from corpus-comparative / superlative-value claims, which weigh a source against the corpus rather than impute a stance to it) | bracket directive (partial) + adversarial-read independent-gestalt job (read the source independently, compare gestalts), extended to walk per-claim source-posture attributions — *detection pending* |
| `GR.8` | Disclaiming attestation — a claim cited to an attestation whose own body *affirmatively denies or scopes out* the cited sub-claim; the handle resolves and the attestation is substantive (anchored), so lint and the `GR.5` thin-attestation check both pass. Distinct from `GR.2` (no attestation / training-recall) and `GR.5` (attestation present but thin / un-anchored): here the attestation is present, anchored, *and contradicts the claim it is cited for* | adversarial-read semantic citation-chain walk (job (a)) — verifies not only that the attestation *supports* the claim but that its gaps / scope section does not *deny* it; prevention via the honest-gaps-recording attestation discipline (an attestation that records what the source does not confirm is doing its job) — *not lint-detectable (the disclaimer is semantic; the handle resolves)* |
| `GR.9` | Metadata recall-sourcing — a bibliographic / provenance metadata value (a per-corpus bibliography (`BIBLIOGRAPHY.md`) or `{N}`-bibliography entry's Source URL, DOI, or date) committed from training-recall rather than read off the fetched source: correct-from-memory but not present in the attestation. Distinct from `GR.2` (whole source unfetched) — here the source is fetched and attested, yet the *metadata* is recalled | — *(forward-looking; forbidden by the metadata-tier source-bound discipline, [SPEC.md](SPEC.md) [§4.1](SPEC.md#41-source-bound-citation-discipline); detection candidate: lint bibliography↔attestation metadata-desync + adversarial-read metadata-binding job)* |
| `CX.1` | Noise domination — less-relevant retrieved content used over more-relevant | adversarial-read relevance-weighting (**detection only** — see [SPEC.md](SPEC.md) [§11](SPEC.md#11-known-limitations)) |
| `AQ.1` | Coverage gaps / unknown-unknowns | isolated-context evaluator (coverage component) |
| `AQ.2` | Stale substrate — once-correct content now out of date | `substrate-check` staleness-diff — on finding prior substrate, diff it against current sources; a stale diff fires a **refresh** re-engagement ([SPEC.md](SPEC.md) [§4.8](SPEC.md#48-corrections-vs-reversals)) |
| `AQ.3` | Fabricated acquisition candidate — a training-recalled source surfaced as worth-acquiring (most readily in proactive enrichment), not grounded in a fetched source that names it | source-bound acquisition-candidate discipline ([SPEC.md](SPEC.md) [§4.1](SPEC.md#41-source-bound-citation-discipline)) — a proposed source must point at a fetched source that names it as canonical; the recalled-from-training state is forbidden for suggestions as for citations |
| `AQ.4` | Inadequate-attempt blocking — a source declared `blocking` / unavailable on a shallow acquisition attempt (a single-tool transport block, e.g. a session-gated 403, treated as terminal) when a stronger acquisition mode would succeed; transport-block conflated with content-unavailability | acquisition-mode-exhaustion discipline ([SPEC.md](SPEC.md) [§4.1](SPEC.md#41-source-bound-citation-discipline)) — a `blocking` classification requires either the failure classified as genuine content-unavailability (a hard, not transport / transient, condition) or the available acquisition modes exhausted (best-tool → browser-class → authenticated → operator-escalation) |
| `CO.1` | Smoothed contradictions in cross-source synthesis — including **synthesis-artifact self-smoothing**: a contradiction the artifact's own structured form preserves (a table / ledger row) is reintegrated into a unified middle by the surrounding prose (distinct from cross-source smoothing, where the contradiction never surfaces at all) | `## Contradictions` discipline + adversarial-read coherence-read (job (c)) — reads the synthesizing prose against the artifact's own structured contradictions, not only across sources |
| `CO.2` | Premature normalization of abnormal discourse — a substrate-surfaced novel framing is translated into existing vocabulary before its abnormality is adequately surfaced; the normalized form passes the whole stack | — *(forward-looking; candidate: an explicit `## Novel framings` synthesis section + a novel-framings adversarial-read job with access to descriptive-tier captures)* |
| `CO.3` | Cross-tradition convergence-smoothing — multiple traditions' framings of a *convergent* shape merged into one vocabulary, losing per-tradition prescriptive content (harder to detect than `CO.1`: the surface signal is agreement, not disagreement) | encoder-side translation-table discipline (each tradition's term preserved; convergence named at the shape-diagnosed level; framings stand side-by-side) + tradition-isolation adversarial-read job — *detection pending* |
| `FR.1` | Self-confirming framing | isolated-context evaluator (structural isolation) |
| `FR.2` | Premature commitment — a position asserted before its grounding substrate is engaged; reproduced as **orientation-leak** (a detail present only in an orientation / lens artifact consulted to seed the engagement, surfaced as source-attested) and **attribution-costume** (a true, internally-derived conclusion dressed as drawn from the source literature — the conclusion survives; only the attribution is fabricated) | substrate-before-stance discipline ([§4.3](SPEC.md#43-the-substrate-test) substrate test + [§4.6](SPEC.md#46-strict-layer-directionality) strict layer-directionality) + the **LENS-not-substrate** tier ([§4.6](SPEC.md#46-strict-layer-directionality): an artifact consulted to seed an engagement is a non-citable lens, never a source) + adversarial-read semantic citation-chain walk (detection — the handle resolves to the lens or to no source; only the semantic walk catches it) |
| `PR.1` | Drift-inheritance through paraphrase chains — small per-step distortion compounding across multi-step composition | strict layer-directionality ([SPEC.md](SPEC.md) [§4.6](SPEC.md#46-strict-layer-directionality) — the structural prevention against drift-inheritance) + adversarial-read lineage-DAG distortion walk (job (i), §4 — detection job-spec; the mechanical graph-build is deployment-operationalized) |
| `PR.2` | Decomposition-framing lock-in — a facet cut inherits a lens all downstream work runs inside | multi-sampling at `decompose` (≥3 candidates + comparative + bracket) + the persisted **decomposition-rationale** artifact ([SPEC.md](SPEC.md) [§10.6](SPEC.md#106-decomposition-rationale-multi-specialist--program-walks)) + adversarial-read lineage-DAG distortion walk (job (i) — detection of lock-in the bracket missed) |
| `PR.3` | Non-propagated correction — a correction diagnosed in a synthesis-tier artifact never reaches the downstream artifact it corrects; the record ends up right while the artifact it was meant to fix stays wrong | the §4.8 downstream-reconciliation obligation, verified at the `reconcile` decision-point (§6 below) via the spot-check reconciliation-completeness job (§10 below) — completeness spans corrected positions at every tier; a class-shaped finding additionally requires a **class-complete sweep** (every same-class instance across every tier, not only the flagged ones) |
| `WM.1` | Per-artifact-warrant fallacy — an artifact passes per-artifact checks but the corpus context that grounded its claims has shifted (warrant is corpus-distributed, not per-artifact) | corpus-tier warrant check paired with the per-artifact substrate test — when a per-artifact attestation's corpus warrant has moved under it, hold the divergence as a tension and file an acquisition candidate rather than resolving it per-artifact; periodic corpus-walk detection committed as a job-spec, *detection-implementation deployment-side* |
| `WM.2` | Theory-ladenness of substrate-test outputs — the substrate test is itself paradigm-conditioned; framings the framework's paradigm naturalizes stay invisible to in-paradigm verification | — *(forward-looking; candidate: framework-external review — an adopter, reviewer, or non-framework-trained agent from a different epistemic tradition)* |
| `WM.3` | Consumer-side decoding-frame mismatch — an artifact's encoded intent (held-pending vs settled; substrate vs deliverable) is mis-received by a downstream consumer; the encoder's stack catches encoding-side failures, not consumer-side decoding | — *(forward-looking; candidate: per-artifact decoding-frame declaration + a consumer-side uptake-confirmation step)* |

The `GR.1` umbrella is the canonical anchor-and-drift region; `GR.1a` / `GR.1b` / `GR.1c` are its sub-shapes (it carries no standalone row). The **`WM` (Warrant/meta) locus** — defined-but-unpopulated at v0.1 — is populated at v0.2 (`WM.1–3`): meta-shapes that operate on the framework's own warrant (corpus-distributed warrant; the substrate test's own paradigm-conditioning; consumer-side reception) rather than on a per-claim retrieval-to-output trajectory; their fences are correspondingly forward-looking. **The ordinal indexes shapes within a locus and is independent of fence status** — a forward-looking shape keeps its ordinal when it earns a fence; the numbering never reflows.

---

## 2. Source-class soft enum + attestation shapes

Twelve baseline source classes identify which attestation-body shape and handle convention applies:

`paper` · `book-chapter` · `essays` · `tool-doc` · `blog-post` · `journal-essay` · `github-readme` · `wiki-page` · `light-form` · `standard` · `talk-podcast` · `source-code`

**Five-component write-discipline** (across all classes unless a class says skip): (1) paraphrased summary — the source's argument in the agent's words, no synthesis prose, no project framing; (2) key passages — verbatim blockquotes for load-bearing claims, each with a source-internal anchor (section / page / paragraph / timecode); (3) structural metadata — organization, section list, version, extraction-quality flags; (4) nothing composed beyond the source; (5) substrate-test pass — usable by a reader without the deployment's context.

| Class | Handle convention | Load-bearing field(s) |
|---|---|---|
| `paper` | `<first-author>-<paper-slug>` | version (papers revise) |
| `book-chapter` | `<author>-<book-slug>-ch<N>` | edition (chapter numbering varies across editions) |
| `essays` | `<author>-<essay-slug>` | collection (essay-author attribution, not editor) |
| `tool-doc` | `<tool>-<topic>` | version (docs revise frequently) |
| `blog-post` | `<author-or-venue>-<post-slug>` | author byline, post date |
| `journal-essay` | `<author>-<piece-slug>` | `original_venue` (journal + issue + year — editorial-curated venue, distinct from a later web-repost URL) |
| `github-readme` | `<owner>-<repo>` | license (SPDX), last-commit |
| `wiki-page` | `<wiki-slug>-<page-slug>` | fetched-date (wikis drift), license |
| `light-form` | `<platform>-<thread-id>` | paraphrase-only (no verbatim posts; PII risk) |
| `standard` | `<body>-<doc-number>` | version + section anchors (revise at section granularity) |
| `talk-podcast` | `<speaker>-<talk-slug>` | transcript-source (hand-cleaned vs auto-captioned) |
| `source-code` | `<project>-<component>` | subclass (`engine` / `dependency` / `gameplay-foundations` / `gameplay-systems`); license (SPDX — varies per source, check per-piece) |

**Engagement-time bracketing** (`bracket` verb) fires structurally when the goal is claim-validation or external-calibration, or for sources whose engagement mode is "audit existing framing"; it is optional otherwise, where the attestation primitive does the structural fence. Optional cross-class frontmatter: `extraction_pipeline` (records the pipeline used — drift-detectability across re-extractions) and `substrate_confidence` (`source-direct` / `search-summary` / `snippet-thin` — engagement depth, defaulting to source-direct).

### Per-class IP profile + raw-layer treatment

A deployment that ingests source material into a durable reference tier inherits an IP discipline ARD's attestation primitive does not by itself carry: license variation drives downstream paraphrase / quotation / redistribution scope, while raw-layer storage is uniform. This layer is **agent-agnostic guidance, not legal advice** — adopters apply their own jurisdiction's rules.

**Raw-layer convention (all classes).** Gitignore (or otherwise exclude from the committed substrate) every raw fetch and extracted-text companion — *including public-domain raws*, for consistency. Size, drift, PII, and "we don't own it" jointly motivate the uniform rule; **license variation drives downstream discipline, not raw-layer decisions**. The committed substrate is the agent-authored attestation / index, not the source.

| Class | Typical upstream license | Downstream discipline |
|---|---|---|
| `paper` | All-rights-reserved; CC variants common at preprint servers | Paraphrase + load-bearing quotation under fair use for criticism/comment; CC permits verbatim with attribution. Cite the exact version — papers revise. |
| `book-chapter` / `essays` | All-rights-reserved (default copyright); occasional public domain | Paraphrase + sparing quotation under fair use; the extracted markdown is itself a derivative work; verbatim reproduction infringes. Per-essay (not editor) attribution for collections. |
| `tool-doc` | Project OSS license, or vendor all-rights-reserved | Paraphrase + quotation under fair use; OSS-permissive licenses permit verbatim with attribution. Version-pin is load-bearing — tool surfaces revise. |
| `blog-post` | All-rights-reserved (author retains rights) | Paraphrase + quotation for criticism/comment; attribute the author by name regardless of strict license terms. |
| `journal-essay` | Editorial-venue rights layered over author rights — the venue holds the original publication rights; a later web-repost may be with or without permission | Paraphrase + load-bearing quotation under fair use (same downstream as `blog-post`); cite the canonical journal + issue + year (the `original_venue`), not a later web-repost URL. Editorial curation is a downstream epistemic-weight signal distinct from self-published web. |
| `github-readme` | Project license (record SPDX) | Per-license quotation of README prose; **do not lift code into project artifacts — clean-room discipline is stricter than any individual license requires.** |
| `wiki-page` | CC-BY-SA on most large wikis (verify per-wiki) | Redistributable with attribution; share-alike is the load-bearing clause; name the wiki + page. Date-fetched is load-bearing — wikis drift. |
| `light-form` (forum/thread/issue) | All-rights-reserved per-poster | **Paraphrase only — do not commit verbatim posts. PII risk where usernames are real names.** |
| `standard` | Varies — public domain (government works), permissive grants (e.g. some RFC bodies), or copyright-restricted (many industry SDOs) | Public-domain/permissive grants permit verbatim; cite by stable identifier (document number). Version-pin + section anchors load-bearing — standards revise at section granularity. |
| `talk-podcast` | All-rights-reserved, multi-byline (speaker + venue/publisher of the recording) | Paraphrase + quotation under fair use; mark quote-accuracy posture (hand-cleaned vs auto-captioned). Auto-caption dumps are derivative works — do not commit. |
| `source-code` | Varies per source — `engine` / `dependency` (a depended-on engine, library, or service) are typically OSS (MIT / Apache-2.0 / GPL / MPL — check per-piece); a studied work's own `gameplay-foundations` / `gameplay-systems` are typically all-rights-reserved | **No verbatim code regardless of license** — a clean-room discipline stricter than any individual license requires; the fence is uniform across subclasses (neither permissively-granted nor copyleft-granted code may be copy-pasted into derivative work — copyleft code pasted into a proprietary product is the canonical trap). Commitable index-layer content: a file-tree manifest (paths + sizes + extensions — structural facts, not copyrightable expression), a public-symbol inventory (class / method signatures as paraphrase, never decompiled bodies), and an architectural-overview paraphrase. **Do not commit grep output that captures comments or string literals — they carry creative expression.** Raw layer: wholesale gitignore. |

**`source-code` subclasses.** A directly-read source tree is sub-classed by what it is, all sharing the clean-room IP fence above: `engine` (a standalone reusable engine or runtime's source — e.g. an OSS engine project); `dependency` (a depended-on library or service daemon's source); `gameplay-foundations` (a studied game's *own* reusable infrastructure — scripting / event / FSM / serialization, **including persistence / save-schema formats**); `gameplay-systems` (game-specific subsystems built on those foundations). The engine-vs-game-code distinction follows the game-engine-architecture literature, generalized here to any third-party source; whether the two game-specific subclasses are tracked as one or two is a deployment call (identical IP treatment). **Creative content** — a work's narrative, writing, worldbuilding, or art assets — is *not* source code: it is creative-expression IP with a different IP profile and a vehicle-agnostic span (digital, tabletop, print, and beyond), out of this class's scope.

**Bibliography-layer expectation.** A reference corpus carries a **corpus-level license declaration** — a visible callout near the top of its `BIBLIOGRAPHY.md` — as the canonical agent-facing surface for the corpus's upstream license, so an agent engaging the corpus encounters the downstream-discipline constraint before it quotes.

### Vendored-source acquisition (pinned-source-clone)

A `source-code` source is usually *acquired*, not merely fetched — and for an **open-source dependency** (an `engine` or `dependency` subclass) the highest-rigor research corpus is the **source tree cloned at the pinned version actually in use**, not the project's web documentation. When an engagement targets such a dependency, the canonical acquisition move is:

1. **Clone the source, checked out at the pinned version** in use (plus the comparison version(s) for delta work), and treat the source tree as the **primary corpus** (`source-direct`, the `source-code` class): attest to specific files at specific tags; verify a claim by reading / diffing the code, not by trusting the changelog.
2. **Treat the project's web docs as the subordinate tier** (`tool-doc`, `search-summary` confidence) — useful for orientation and for capabilities the source doesn't make legible, but subordinate to the source when they disagree or when version-precision matters.

The gain over doc-research: claims get **verified, not attributed** (a diff a downstream verifier can re-run, vs. a changelog citation); the version-pin is **exact** (`git checkout <tag>` vs. docs that drift to latest); and the fabrication risk shifts from **recall** — the central anti-fabrication concern ([SPEC.md](SPEC.md) [§4.1](SPEC.md#41-source-bound-citation-discipline)) — to **misread**, which is more tractable.

**Two-pronged applicability gate** — vendored-source is a mode you *select into*, not a default; the gate is load-bearing, not advisory. Apply it only when **(a)** the source is available (open-source, license-permitting a clone-and-read — closed / commercial dependencies fall back to the doc (`tool-doc`) tier) **and (b)** the question is about **behavior or version-internals** ("did this fix land in the version we run", "what does this operator actually do"). It does **not** apply to API-signature lookup (docs suffice — source-reading is waste) or to design / genre / market / what-works questions (source-internals are not the relevant rigor). And it **complements, does not replace, empirical spikes**: code read correctly can still be wrong about *runtime* behavior — a code-read-confirmed claim is not a reproduced one.

---

## 3. Lint pattern catalog

Mechanical substrate-test patterns matched against synthesis output. `lint` is a hard-floor gate; this is its diagnostic catalog. Six baseline categories:

1. **Decimals with source attributions** (`decimal-with-attribution`) — a decimal figure adjacent to a source name; highest empirical failure rate. Flags proximity for verification.
2. **Version numbers** (`version-number`) — version identifiers in comparative/attributional claims without an in-corpus anchor.
3. **File / word / page counts** (`count-without-unit-citation`) — numeric counts with units and no citation.
4. **Comparative superlatives** (`comparative-superlative`) — "the only X with Y", "the strongest baseline" — claims requiring a full-set survey the agent did not perform.
5. **Named-feature claims** (`named-feature-claim`) — capabilities attributed to a tool/system by name without a fetched anchor.
6. **Composed effort estimates** (`composed-effort-estimate`) — quantitative effort claims constructed without substrate (forbidden per [SPEC.md](SPEC.md) [§4.4](SPEC.md#44-composed-claim-discipline)).

The six **categories** are the invariant diagnostic targets; the specific **matchers** (regexes, token-window heuristics, what counts as "adjacent" or as an "in-corpus anchor") are deployment latitude — an adopter implements detectors fit to its corpus. A category fires to flag a claim for human spot-check, not to auto-reject; the floor is "these shapes get checked," not a fixed regex set. New categories follow the extension recipe.

### Citation-chain integrity check

For every `[handle]{N}` occurrence, **six handle-resolution checks** (the reference kernel implements these on its two invariants) plus a **seventh, corpus-bibliography correspondence check** a deployment implements where its `BIBLIOGRAPHY.md` enumerates pieces: (1) **handle resolution** — an attestation exists at the expected location; (2) **source-handle match** — the attestation's recorded handle equals the cited handle; (3) **handle uniqueness** — exactly one attestation declares that `source_handle` (a handle that resolves to two or more sources is ambiguous and breaks the chain's stability); (4) **source resolution** — the recorded URL/path resolves (URL failures warn, path failures error); (5) **provenance present** — both attestation and citing brief carry provenance; (6) **scope** — applies to all `[handle]{N}` in the linted files; (7) **piece-slug↔bibliography correspondence** *(compound / multi-piece handles; deployment-implemented)* — for a compound handle of the form `<source>-<piece-slug>`, the `<piece-slug>` component corresponds to the piece the `{N}` indexes in the source's per-corpus bibliography (`BIBLIOGRAPHY.md`), so a handle cannot imply a scope (a part, a chapter) the indexed entry does not carry. The kernel resolves by handle (checks 1–6); check 7's `{N}`↔bibliography resolution depends on the deployment's bibliography structure — beyond the normative-minimum attestation frontmatter — so it is **deployment-mapped**, not part of the reference kernel lint. Two further integrity fences run alongside the chain checks: a **canonical-handle** check — a handle must be ASCII-lowercase, so an uppercase or homoglyph (e.g. Cyrillic-lookalike) handle is `non-canonical-handle`, the fence against a lookalike resolving silently beside the real one (the wire-form captures `[\w-]+` permissively so the malformed handle surfaces rather than matching); and a **frontmatter-uniqueness** check — a duplicated resolution-critical frontmatter key is `duplicate-frontmatter-key`, a split-brain between this lint's last-wins read and a first-wins reader. Per-citation status — seven broken-chain values plus four non-broken values:

- **Broken:** `unresolved-handle` (no attestation at the expected path) · `mismatched-source-handle` (attestation exists but `source_handle` differs) · `colliding-handle` (two or more attestations declare the same `source_handle` — the cited handle resolves ambiguously) · `unreachable-source` (URL/path does not resolve) · `missing-provenance` (attestation or citing brief lacks `provenance`) · `non-canonical-handle` (the handle is not ASCII-lowercase — uppercase or a homoglyph) · `duplicate-frontmatter-key` (a resolution-critical frontmatter key declared 2+ times — split-brain).
- `resolved` — every integrity and handle-resolution check passes (no broken status).
- `intra-program-resolved` *(non-broken)* — the handle resolves not to an attestation but to a recognized **analytical-tier intra-program reference** (a position artifact, or a specialist/parent brief). A valid analytical-tier reference, not a broken chain — surfaced distinctly so analytical-tier framing re-used as if source-attested stays visible (the `GR.4`/analytical-inheritance concern).
- `reduced-substrate-attestation` *(non-broken)* — the attestation resolves and `source_handle` matches, but its provenance deliberately marks reduced engagement depth (`search-summary` / `snippet` / `unspecified`, per the `substrate_confidence` axis). A valid lower-depth resolution, not a broken chain — surfaced distinctly so the reduced depth is visible downstream.
- `acquisition-candidate` *(non-broken)* — the attestation resolves and `source_handle` matches, but it is marked an **intentionally-unfetched acquisition candidate** (the acquisition-pending escape hatch, [SPEC.md](SPEC.md) [§4.1](SPEC.md#41-source-bound-citation-discipline)). A deliberate not-yet-fetched source, not a failure — surfaced distinctly so a paywalled / deferred candidate is not conflated with `unreachable-source` or fabrication in the broken count.

`resolved`, `intra-program-resolved`, `reduced-substrate-attestation`, and `acquisition-candidate` are excluded from the broken-chain set and from any `--exit-code-on` threshold. Default posture is lint-only-warn; blocking on a severity threshold is opt-in.

---

## 4. Adversarial-reader job catalog

`adversarial-read` invokes a capable-model sub-agent with full access to synthesis output, briefs, attestations, and lint output. Four baseline jobs:

- **(a) Semantic citation-chain walk** — for each load-bearing claim, walk back to the cited attestation and verify it *semantically supports* the claim (distinct from lint's resolution check). Two sharpenings: (i) the cited *specific* must be present in the attestation body, not merely that the attestation is on-topic — the **read-but-not-attested** gap, where the handle resolves and the attestation is substantive yet the cited detail never landed in it (distinct from `GR.5` structurally-thin / un-anchored: this is anchored-but-the-cited-specific-is-missing); (ii) the attestation's own gaps / scope section must not *deny* the cited sub-claim — the **disclaiming-attestation** shape (`GR.8`).
- **(b) Claim-shapes lint missed** — plausible-looking attributions with no citation; cite-throughs over-extended beyond the in-corpus source; comparatives framed as descriptions.
- **(c) Coherence-read for smoothed contradictions** — read as a coherent argument; flag where two sources were merged under a paraphrase that papers over disagreement. Also reads a synthesis artifact's *own* prose against its structured form — flagging a contradiction preserved in a table / ledger row but smoothed back into a unified middle by the surrounding prose (the **synthesis-artifact self-smoothing** facet of `CO.1`).
- **(d) Noise-domination / relevance-weighting** — read *all* retrieved attestations for each major claim, not just the cited ones; flag a less-relevant citation where a more-relevant attestation went uncited. (The `CX.1` detection fence.)

Five extension jobs deepen coverage: **(e)** quote-context walk (`GR.4`); **(f)** analytical-tier inheritance walk (catches analytical framing re-used as if source-attested); **(g)** line-reference walk (sub-attestation granularity); **(h)** thin-attestation check (`GR.5`); **(i)** propagation / lineage-DAG distortion walk (`PR.1` / `PR.2`) — for a load-bearing claim, walk its derivation lineage as a directed acyclic graph over the **existing** citation + layer-directionality edges (raw → attestation → engagement-unit → synthesis) and flag where the claim's distortion *derives from* a prior-step distortion (`PR.1` drift-inheritance through the paraphrase chain) or where downstream work runs inside a decomposition-framing lens it inherited (`PR.2` lock-in the decomposition-rationale bracket missed). A capable-model edge-distortion judgment along the lineage, **not** an NLI/embedding pipeline — the structural graph is what the artifacts already encode; the mechanical graph-build is a deployment operationalization. Verdict: `APPROVED` / `NEEDS-REVISION`; a `NEEDS-REVISION` triggers a revision pass before `evaluate`.

---

## 5. Evaluator job catalog

`evaluate` invokes an **isolated-context** sub-agent — it sees only the synthesis output and the engagement seed, not the decomposition rationale, briefs, or attestations. Isolation is the fence against shared-context blind spots (`FR.1`). Five-component spec:

1. **Coverage** — does the synthesis address the seed's scope; what is omitted without acknowledgment?
2. **Coherence** — does it hold together; any internal tensions or join-seam inconsistencies?
3. **Contradictions** — is there a `## Contradictions` section; are the contradictions substantive; does the body contradict it?
4. **Groundedness** — do claims *present as* source-grounded (the evaluator can't verify chains but can read the citation posture)?
5. **Recommendations** — priority-ordered revision targets when the verdict is `NEEDS-REVISION`.

### Contradiction-surfacing shape

The contradiction-handling discipline ([SPEC.md](SPEC.md) [§4.5](SPEC.md#45-contradiction-handling-discipline)) is verified by adversarial-read job (c) and evaluator component 3, so the artifacts it produces carry a minimal shape:

**Ledger row** — one per surfaced divergence: `L-<n>` · `[handle-a]{N}` vs `[handle-b]{M}` · **\<relationship-type\>** · one-line statement of the divergence · discriminating-substrate pointer (or `unresolved`). Relationship-type ∈ {`contradicts`, `tension`, `qualifies`, `incommensurable`, `sublation`}.

**`## Contradictions` section** — in any cross-source synthesis, named positions stand side-by-side, each citing its handle, with no merged or averaged position:

```
## Contradictions
- **<dimension>** — [handle-a]{N} holds X; [handle-b]{M} holds Y.
  <relationship-type>. <resolution path, or "this engagement does not resolve">.
```

---

## 6. Decision-point catalog

The walk activates an applicable subset of these in the order [SPEC.md](SPEC.md) [§10.1](SPEC.md#101-the-decision-graph-activation--ordering) fixes. Tier: **D** = research-discipline (direct verb application), **V** = verification-stack orchestration (mechanism invoked), **M** = meta-workflow coordination.

| Decision-point | Tier | Fires | Conditional |
|---|---|---|---|
| `dispatch-time-registration` | M | — (coordination) | always (entry act) |
| `substrate-check` | D | `substrate-check` | always |
| `decompose` | D | `decompose` (+ `self-flag`) | when the walk admits decomposition |
| `specialist-dispatch` | M | — (coordination) | multi-specialist walks only |
| `attest` | D | `attest` (+ `bracket`, `stage`, `self-flag`) | always (`bracket` conditional) |
| `synthesize` | D | `synthesize` (+ `seek-disconfirming`, `stage`, `self-flag`) | always — `{within-specialist}` and/or `{cross-specialist}` scope |
| `lint` | V | `lint` | always (hard floor) |
| `adversarial-read` | V | `adversarial-read` | selectable; in-floor for synthesis-producing shapes |
| `evaluate` | V | `evaluate` | selectable; reachable only when a cross-synthesis artifact exists |
| `spot-check` | D | `spot-check` | always (hard floor; terminal) |
| `user-validation` | D | `user-validation` | when the user is the committing party |
| `promote` | D | `promote` | when converged substrate warrants cross-arc lifting |
| `reconcile` | D | `reconcile` | re-engagement walks only (terminal) — verify the re-authored artifact reflects its corrections |

The two `M` coordination decision-points are named-and-ordered by the framework; the coordination *acts* (how dispatch happens, how fan-out is spawned) are a deployment's orchestration topology.

---

## 7. Registration enums

Value catalogs for the ten registration fields ([SPEC.md](SPEC.md) [§9](SPEC.md#9-the-registration-contract)). (`decision_relevance` is a free-text field, not an enum — no value catalog.)

**`intent`** (5): `terminate-in-position` · `build-substrate` · `survey-landscape` · `validate-claim` · `calibrate-external`.

**`output_kind`** (11; single value or list for cascade-producing goals): `position` · `synthesis-brief` · `landscape-brief` · `attestation` · `corpus-piece` · `precis` · `hypothesis-capture` · `hypothesis-ledger` · `vocab-capture` · `adoption-recommendations` · `questions-list`. *(A position is promoted by research; a downstream project authors any decision record citing it — the two are separate acts.)*

**`temporal_contract`** (5):

| Value | Stop + after-revision semantics |
|---|---|
| `write-once-on-converge` | authored once on convergence; supersession via new artifact |
| `extend-on-source-rev` | extends in place when substrate revises (attestations, precis, indices) |
| `supersedes-prior` | breadth/claim-bound; superseded on a named trigger |
| `ttl-bounded` | time-bounded; auto-stales after a recorded TTL |
| `re-engage-on-trigger` | question-driven; re-engages in place on a checkable trigger |

**`verification_rigor`** (activation-profiles over the verification gate-catalog — a *subset-select* control, not a closed magnitude switch; every profile includes the hard floor `lint`+`spot-check`, and the selectable gates `adversarial-read`+`evaluate` are what a profile adds):

| Profile | Selectable gates activated (over the always-on floor) |
|---|---|
| `floor` | ∅ — hard floor only (`lint` + `spot-check`) |
| `standard` | `{adversarial-read}` |
| `full` | `{adversarial-read, evaluate}` |

These are named **subsets over the gate-catalog**, not a fixed magnitude enum: "go custom" (naming an explicit gate set) is first-class, and the catalog is closed-with-extension (a future gate may join). The three profiles form an ascending chain because reachability forecloses the off-chain config — `evaluate` is only reachable on a cross-specialist synthesis shape, and on those shapes `adversarial-read` is itself in-floor, so `{evaluate}` without `{adversarial-read}` has no shape where it is both legal and needed ([SPEC.md](SPEC.md) [§3.1](SPEC.md#31-the-floor--the-always-activated-core), §7).

**`scope_authority`** (3): `pre-registered` · `mixed` · `in-engagement-judgment`. **`analytical_artifact_type`** (2): `per-campaign-brief` (converging) · `accumulative-ledger` (accumulating). **`consumer`**: free-text, common values `future-agent` / `future-engagement` / `methodology-revisers` / `calibrated-work`.

**`primitives_extends`** / **`primitives_opts_out`**: free-text lists of verb or primitive names (drawn from the verb-set, [SPEC.md](SPEC.md) [§6](SPEC.md#6-the-act-vocabulary-the-verbs)) — engagement-specific additions and omissions respectively. Each `primitives_opts_out` entry carries a one-line rationale (an omission must be justified, never silent). Both default to empty.

---

## 8. Provenance values

Artifact-local warrant, rendered visibly (see [SPEC.md](SPEC.md) [§10.4](SPEC.md#104-citation-form-and-provenance)):

| Value | Applies to |
|---|---|
| `source-direct` | reference raws, indices, per-piece notes, vocab captures |
| `agent-authored-from-raw` | precis files, hypothesis captures |
| `agent-synthesis` | cross-source analytical artifacts (briefs, syntheses, positions, ledgers) |
| `generated-listing` | mechanically produced listings (no editorial content) |
| `hybrid-curated` | hand-authored kernel with agent-derived sections |

---

## 9. Typed-edge predicates

Research-band artifacts may carry **typed cross-references** in frontmatter — the optional `related:` data contract ([SPEC.md](SPEC.md) [§10.5](SPEC.md#105-typed-cross-references-optional)): directed, typed links between artifacts (a precis *grounds* a position; a decision *implements* a design) that a graph index can read. The baseline vocabulary is twelve predicates, each with a named source-ancestor for traceable provenance, drawn from established citation/argumentation ontologies (CiTO, IBIS/Toulmin, SKOS) plus substrate-native. The set is **closed-with-extension** — coin a substrate-native predicate only with a cited source-ancestor or an explicit no-ancestor rationale.

| Predicate | Source ancestor | Semantic |
|---|---|---|
| `cites` | CiTO `cito:cites` | Generic citation (root of the citation-predicate tree) |
| `citesAsEvidence` | CiTO `cito:citesAsEvidence` | Cites as a source of factual evidence |
| `extends` | CiTO `cito:extends` | Builds on prior work with new content |
| `refutes` | CiTO `cito:refutes` | Explicit disagreement; the cited claim is shown false |
| `usesMethodIn` | CiTO `cito:usesMethodIn` | Adopts a methodology from the cited work |
| `obtainsBackgroundFrom` | CiTO `cito:obtainsBackgroundFrom` | Contextual / background citation |
| `grounds` | Toulmin (data → claim) | Evidence backs a claim (research grounds a decision) |
| `supports` | IBIS argument-to-position; CiTO `cito:supports` | An argument supports a position |
| `objects-to` | IBIS argument-to-position; CiTO `cito:critiques`/`disputes` | An argument contests a position |
| `related` | SKOS `skos:related` | Generic associative link when no stronger type fits (the only symmetric predicate) |
| `implements` | Substrate-native (no clean ontology ancestor) | An implementation realizes a design / decision |
| `contrasts` | Substrate-native (partial CiTO `citesAsRelated`) | An alternative without disagreement (sibling approach) |

Structural predicates that already live as top-level frontmatter — `parent` (containment), `supersedes` / `superseded_by` (lineage) — stay top-level, not under `related:`. Direction, inverse-derivation, and the extension policy are specified at [SPEC.md](SPEC.md) [§10.5](SPEC.md#105-typed-cross-references-optional).

---

## 10. Spot-check job catalog

`spot-check` is the terminal, full-substrate, human-context gate ([SPEC.md](SPEC.md) [§7](SPEC.md#7-the-verification-stack-the-rigor-control)) — it runs last, with full access, at a human's categorical-sampling vantage. Its jobs are catalogued here (closed-with-extension, like §4 / §5): the gate always fires; which jobs it runs is profile- and shape-dependent. A spot-check-tier job fires at the spot-check gate (over the synthesis), or — where a terminal verb anchors a full-substrate check, as `reconcile` does for a re-engagement — at that decision-point, after the act it verifies; the *tier* (terminal, full-substrate), not a single station, is the unifying property.

- **(a) Reconciliation completeness** — at the `reconcile` decision-point (§6 above), for a **re-engagement** ([SPEC.md](SPEC.md) [§4.8](SPEC.md#48-corrections-vs-reversals)), verify that every corrected position is reflected in the artifact it corrects (the discharge of §4.8's downstream-reconciliation obligation; the `PR.3` fence). Per §4.8, completeness spans corrected positions at **every tier** — a per-source correction and a synthesis-tier correction are equally bound; enumerating only one tier reproduces the failure. **And when a finding is class-shaped, completeness spans every same-class instance across every tier — a class-complete sweep — not only the flagged ones**: a subset-fix that leaves unflagged same-class siblings is the same non-propagation failure at the class level (the §4.8 class-complete-sweep requirement). This entry is the obligation's spot-check-tier firing site.

---

*This catalog is the baseline inventory. Extend it — the lists are designed to grow.*
