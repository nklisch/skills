# ARD evidence ledger

The empirical failure ledger — the primary warrant tier. Each entry records one
observed failure cluster and the discipline it warrants. Schema + authoring
discipline in [`README.md`](README.md).

> **Substrate-confidence caveat (whole ledger).** The v0.7 external grounding
> (handles `{41}`–`{52}`) was engaged at **search-summary** confidence —
> bibliographic existence verified, findings read via abstract / landing-page, not
> full source-direct reads — *except* the W3C PROV standards `{1}`/`{2}`, which are
> source-direct. This is recorded honestly per the `GR.9` discipline the ledger
> itself warrants (presenting search-summary as source-direct would be the very
> failure entry GR.9 fences). The grounding handles resolve against
> [`../theory/references.md`](../theory/references.md); the entries **re-render** the
> already-grounded `../theory/COMMITMENTS.md` "v0.7.0 additions" trace —
> COMMITMENTS is re-render provenance, never itself a cited warrant
> (lens-not-substrate, [`../kernel/discipline.md`](../kernel/discipline.md)).

---

### `AQ.4` — inadequate-attempt blocking (acquisition-mode-exhaustion fence, SPEC §4.1)

- **recurrence count:** 1 observed cluster (a **committed** fence — CATALOGS `AQ.4` / SPEC §4.1 — NOT forward-looking; `GR.9` is the forward-looking entry, not this one)
- **deployment:** ARD engagement practice (acquisition stage)
- **observed behavior:** a transport-level block (session-gated 403, anti-bot, JS-render requirement) treated as content-unavailability — the engagement declared a source "blocked" while a stronger acquisition mode (browser-class, authenticated, operator) remained untried.
- **mitigation:** acquisition-mode-exhaustion fence — escalate best-tool → browser-class → authenticated → operator before declaring blocking; the `AQ.3`-sibling extension of the acquisition discipline.
- **verification result:** fence wired into SPEC §4.1 + CATALOGS `AQ.4`; v0.7 cross-model peer review (4-pass consensus) confirmed the shape.
- **grounding:** bad-abandonment is a real failure mode — `[li-good-abandonment-search]{47}` (good-vs-bad abandonment), `[browne-cognitive-stopping-rules]{48}` (stopping rules fire prematurely). *The transport-vs-content cut itself is ARD **operational** classification (standard transient-vs-permanent fault practice), not a tradition-grounded claim. search-summary.*

### `GR.9` — metadata recall-sourcing (metadata-tier source-bound discipline, SPEC §4.1/§4.2)

- **recurrence count:** 1 (**forward-looking** — single observed cluster; the v0.7 peer caught an over-promotion attempt, so it is held forward-looking rather than asserted recurring)
- **deployment:** ARD synthesis practice (bibliography authoring)
- **observed behavior:** a `{N}` bibliography entry's URL / DOI / date recall-filled from training rather than read off the fetched source — the existence tier (title) is right while the metadata tier silently drifts.
- **mitigation:** metadata-tier source-bound extension — every metadata value bound to the fetch activity that produced it (the provenance-binding remedy), never recall-filled.
- **verification result:** wired into SPEC §4.1/§4.2 + CATALOGS `GR.9`; conformance carries the metadata-binding expectation.
- **grounding:** measured metadata-failure on *real* sources — `[chelli-hallucination-reference-accuracy]{45}` (DOI accuracy ~16–20% while titles ~99%), `[walters-fabrication-citations-chatgpt]{46}` (~24–43% of real citations carry substantive metadata errors); provenance-binding model `[w3c-prov-dm]{1}` / `[w3c-prov-o]{2}` (**source-direct**). *Empirical refs search-summary; W3C source-direct.*

### model-diversity verification property (SPEC §7 — a *partial* fence for the correlated-verifier limitation, §11)

- **recurrence count:** ≥1 (the correlated-verifier blind spot is an observed class; the property is a partial mitigation, not a fix)
- **deployment:** ARD verification stack (cross-model review)
- **observed behavior:** verifiers drawn from the same model family share errors and self-preference — a same-model re-run "confirms" what it should catch; even cross-provider review only *partially* decorrelates (the most capable models correlate across architectures).
- **mitigation:** model-diversity as a SPEC §7 verification property — prefer a different model class for verification; §11 names it explicitly a **partial** mitigation (reduces, never eliminates, shared blind spots).
- **verification result:** added to SPEC §7 + the §11 limitations framing; no new WM ordinal (operator decision — §11/WM.2 carries it).
- **grounding:** `[kim-correlated-errors-llms]{41}` (correlated even across providers — the honesty caveat), `[zheng-judging-llm-as-judge]{42}` (self-enhancement bias), `[bommasani-picking-same-person-monoculture]{43}` (monoculture → outcome homogenization), `[huang-llms-cannot-self-correct]{44}` (intrinsic self-correction fails without an external signal). *search-summary.*

### `decision_relevance` — value-of-information yield gate (registration field + kickoff gate, SPEC §9)

- **recurrence count:** 1 observed cluster (the warrant is the VOI principle + the committed registration gate, NOT an asserted cross-engagement recurrence — COMMITMENTS records the grounding + the gate, not a recurrence count)
- **deployment:** ARD registration / kickoff (engagement economics)
- **observed behavior:** research depth set without reference to decision impact — effort spent gathering information that cannot change the chosen action (zero value-of-information).
- **mitigation:** `decision_relevance` registration field + kickoff gate — "what decision changes if this finds X?"; depth derives from decision-relevance rather than a separate fourth dial.
- **verification result:** wired into SPEC §9 (9→10 registration fields) + the kickoff gate + the example orchestrator + dispatch template; v0.7 peer review confirmed it everywhere a registration is emitted.
- **grounding:** `[howard-information-value-theory]{49}` (VOI — information has zero value if it can't change the action), `[raiffa-schlaifer-applied-statistical-decision-theory]{51}` (EVSI — value of a specific depth of inquiry), `[stigler-economics-of-information]{50}` (marginal search stop), `[wald-sequential-analysis]{52}` (sequential stopping). *search-summary.*

### `PR.3` — class-complete correction sweep (fence refinement, SPEC §4.8)

- **recurrence count:** ≥1 (observed in the originating deployment's reconciliation work)
- **deployment:** ARD correction / reconciliation practice
- **observed behavior:** a class-shaped correction applied only to the flagged instances while unflagged same-class siblings persist — the same non-propagation failure, one level up at the class.
- **mitigation:** class-complete sweep — a class-shaped correction sweeps every same-class instance, not just the flagged ones; wired into the §10 reconciliation-completeness job.
- **verification result:** wired into SPEC §4.8 + CATALOGS `PR.3` + the firing §10 job (the v0.7 peer caught that it was named but not wired, and the fix wired it).
- **grounding:** **deployment-grounded** — the originating deployment's reconciliation-completeness evidence (a subset-flagged class whose unflagged siblings persist). No external tradition; not a recall-sourced claim.
