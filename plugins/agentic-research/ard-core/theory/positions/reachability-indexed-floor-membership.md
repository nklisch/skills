---
slug: reachability-indexed-floor-membership
status: settled
authored: 2026-05-30
provenance: agent-synthesis
temporal_contract: write-once-on-converge
---

# The hard floor is a reachability-indexed security fence: shape-relative membership, per-instance non-erodability

> Ported research position behind ARD v0.1 — the reasoning trace for a framework commitment; see [../../SPEC.md](../../SPEC.md). The attestation layer is not reproduced in this repo (it paraphrases copyrighted sources), so the load-bearing passages are quoted inline and the works are listed under [§Sources](#sources) — the reasoning stands on its own here.

## What this position is about

ARD's verification machinery includes a concept called the **hard floor**: a set of checks that an engagement must always run, regardless of how the rest of the engagement is configured. Understanding this position requires understanding what the floor is, why fixing its *membership* is harder than it looks, and what test resolves the difficulty.

### The floor: two parts

ARD's control-space distinguishes two parts of its foundational layer:

- **The hard part** (non-erodable): certain verification steps are always mandatory. No engagement configuration can turn them off. They fire whether or not the practitioner believes this particular instance needs them.
- **The soft majority** (skippable-when-N/A): most other checks apply to the overwhelming majority of engagements but can be legitimately omitted when they are genuinely inapplicable to the current shape.

The hard part encodes a specific epistemic distrust: the practitioner's own in-flight judgment that "this particular synthesis looks fine, we can skip the fabrication check" is exactly the kind of judgment that anchor-and-drift fabrication is designed to pass. The floor exists precisely *not* to trust that judgment.

### The problem: what settles a membership dispute?

Once you accept that the hard floor exists and that its contents are non-erodable, you face a second question: *which options belong in it?*

A natural first answer is: **an option is hard iff its content was fixed at design time** — iff the framework's designers committed it as mandatory. But this test is circular. It restates the definition rather than adjudicating it. Saying "X is in the hard floor because the designers put it there" cannot distinguish between a legitimately mandatory check and a mandatory-looking habit. It gives no criterion an external adopter or skeptic can apply. And crucially, it cannot settle a *boundary dispute* — when a reasonable practitioner asks "should this particular check be in the hard floor for this kind of engagement?", the commitment-time test has no answer except "ask the designers."

A second candidate is **Kaplow's rules-versus-standards framework** from legal economics. Kaplow (1992) offers a principled, non-circular criterion for when to specify content ex-ante (a "rule") versus leaving it to case-by-case judgment (a "standard"): rules pay off when conduct is frequent and factually homogeneous, because the upfront promulgation cost is distributed over many applications, and each application then runs cheaply [kaplow-rules-vs-standards]{19} {confidence: search-summary}. Kaplow attributes the frequency tradeoff to the following: "If there will be many enforcement actions, the added cost from having resolved the issue on a wholesale basis at the promulgation stage will be outweighed by the benefit of having avoided additional costs repeatedly incurred in giving content to a standard on a retail basis" (p. 563, via [kaplow-rules-vs-standards]{19} {confidence: search-summary}).

This criterion is genuinely non-circular and offers a real discriminator. But applied to a *safety floor*, it produces the wrong answer. A rare-but-catastrophic guard — one whose failure the framework can least afford — comes out looking like a *standard* under Kaplow, because its triggering conduct is infrequent. The logic pushes exactly the safeguards you most need into the optional tier. Kaplow's cost-frequency optimization is the correct tool for choosing between rules and standards in law; it is the wrong tool for deciding which safety fence must never be switched off.

The position here is that Kaplow grounds the *vocabulary* of the rules-vs-standards distinction but cannot supply the *membership criterion* for a safety floor.

## The non-circular test

The fitting criterion draws from a different tradition: **fail-safe defaults** in safety-critical systems design. HandWiki's summary records Saltzer and Schroeder's (1975) principle as: "Base access decisions on permission rather than exclusion" [saltzer-schroeder-principles]{13}. The arc42 quality model extends this into a fuller statement:

> "When a system encounters an unexpected condition — unknown input, missing configuration, corrupted state, or unhandled error — it transitions to a predefined safe state rather than continuing in an undefined or hazardous mode." [arc42-fail-safe-defaults]{9}

The configuration-independence corollary is what matters here: "Define an explicit safe-state configuration for every component and operational mode" — safety must hold *regardless of which configuration is active* [arc42-fail-safe-defaults]{9}. A safety fence cannot be conditional on the current configuration, because the unexpected condition may arise precisely when the configuration is unusual.

Transposing this into ARD's membership question yields a **two-clause, shape-relative test**:

> A control option **C** is in the hard floor **of a research-shape S** iff
> (a) the failure **C** fences is **structurally reachable in S**, *and*
> (b) removing **C** leaves that named failure with **no remaining backstop**.

Both clauses must hold. Clause (a) is the reachability gate: a fence only belongs in the floor of shapes where the failure it prevents can actually occur. Clause (b) is the backstop gate: even if the failure is reachable, a fence only belongs in the hard floor if dropping it leaves the failure entirely uncovered — not merely less covered.

The reachability framing tightens an analogy available from control theory. Wikipedia's controllability article defines the concept as "the ability of an external input (the vector of control variables) to move the internal state of a system from any initial state to any final state in a finite time interval" [wikipedia-controllability]{10} — the reachable set is the set of states the system can actually reach from its starting configuration. Applied to failure-fencing: if a failure state is not in the reachable set of a given research shape, a fence against it carries no load. The shape literally cannot produce the failure.

## The load-bearing distinction

The test above licenses a distinction that is easy to state but easy to conflate in practice:

- **Structural inapplicability** (shape-level; categorical and checkable): the engagement shape cannot produce the condition the failure attaches to. A breadth-survey or scout engagement that emits a landscape brief with no cross-specialist join *structurally cannot* exhibit cross-specialist contradiction-smoothing — there is no synthesis join in which contradictions could be smoothed. Pruning a fence that guards against cross-specialist smoothing from this shape's floor is **lossless**. The failure is not being accepted; it simply cannot occur.
- **Per-instance N/A** (case-level; untrusted): "this particular synthesis doesn't need the fabrication check; the citations look fine." This is the judgment anchor-and-drift is *designed to pass*, and it is exactly what the hard floor exists not to trust. The check looks most unnecessary precisely when the failure is most present but not yet visible.

The floor's non-erodability guards against per-instance N/A, not against structural shape-level inapplicability. This is what makes the hard floor legitimately **shape-relative** while remaining **non-erodable within each shape**.

An example makes the distinction concrete. The `evaluate` gate — an isolated-context evaluator sub-agent that checks synthesis output without access to the decomposition rationale or campaign-internal context — guards against a specific failure: FR.1 self-confirming framing (see the failure-shape inventory in CATALOGS.md), where the synthesis author's engaged perspective shapes the output in ways a fresh reader would notice but the author cannot. For a single-agent, single-pass scout engagement that emits a landscape brief, there is no cross-specialist synthesis artifact for the evaluator to evaluate. The failure the evaluator fences is structurally unreachable: no cross-specialist join occurs, so cross-specialist framing-contamination cannot arise. The `evaluate` gate is therefore **out of a scout shape's hard floor** — it is not mandatory for that shape. This is lossless pruning.

Contrast this with a practitioner saying "I've read through this multi-specialist synthesis and it looks clean; we can skip the evaluator this time." That is per-instance judgment. The FR.1 failure is structurally reachable in a multi-specialist campaign (the cross-specialist join exists); the evaluator is the backstop against framing-contamination in that join; removing it leaves that failure uncovered. The `evaluate` gate is therefore in the hard floor for multi-specialist synthesis shapes. The practitioner's clean-looking synthesis is not grounds for pruning it.

The floor is **shape-relative** (a scout's floor ⊊ a decomposed campaign's floor) while remaining **non-erodable within each shape**.

## The required guard: shape classification cannot itself be eroded

Shape-relativity introduces a new attack surface. If membership in the hard floor is relative to the engagement's declared shape, a practitioner could self-reclassify their engagement in flight — from "multi-specialist campaign" to "scout" — in order to shrink the floor and skip a gate. This is not structural inapplicability; it is shape-as-a-handle-for-erasure.

The guard against this is that **shape classification must be a committed, kickoff-level determination**, not an in-flight self-reclassification. Re-shaping to shrink the floor is subject to the same asymmetric rigor rule: a deployment that sets `scope_authority` to `pre-registered` forbids in-flight re-shaping; one that sets `in-engagement-judgment` permits re-shaping only as a logged checkpoint co-decision with the operator, not as a silent unilateral choice.

The logic: you cannot erode the floor per-instance, and you cannot silently re-shape to shrink it. Without this guard, shape-relativity is an erosion hole; with it, shape-relativity is a sound fail-safe.

## Disconfirming analysis

**Against the reachability test itself:** the most direct challenge is that "structural reachability" is not itself always clearly decidable — a practitioner might dispute whether a failure is structurally reachable in their shape. This is a genuine limitation. The test is sharpest for categorical cases (a scout with no cross-specialist join structurally cannot smooth cross-specialist contradictions). It becomes harder at the margins — engagements that are partially multi-specialist, or shapes that produce a synthesis without a full decomposition phase. The position does not claim the test is always easy to apply; it claims the test is non-circular and draws the right line, in contrast to commitment-time (circular) and Kaplow cost-frequency (mismatched optimization).

**Against grounding the floor in fail-safe defaults:** one could argue that fail-safe defaults is a principle for *access control* (Saltzer and Schroeder's original context was information protection) and that importing it into research methodology is a loose analogy. HandWiki's summary of Saltzer and Schroeder characterizes these as design guidelines grounded in experience, not mathematical invariants [saltzer-schroeder-principles]{13} — they are design wisdom, not proofs. The arc42 source extends the principle to software systems broadly [arc42-fail-safe-defaults]{9}, which is closer to ARD's domain. The position's claim is structural: a floor whose contents hold regardless of which configuration is active is the right safety design, and fail-safe defaults is the tradition that names this property. Whether or not you grant the tradition-import, the structural argument stands on its own.

**Against the Kaplow contrast:** one could argue that Kaplow's framework is relevant after all — that rarely-occurring anchor-and-drift failures might justify a standard rather than a rule, exactly as Kaplow predicts. The position's response is that frequency is the wrong axis for a safety floor. A rare catastrophe is not less catastrophic because it is rare; the fail-safe-defaults tradition exists precisely to handle rare-but-catastrophic events by keeping the safe state always active. The Kaplow contrast is not a dismissal of Kaplow but a scope claim: Kaplow applies to the choice of legal governance instrument, not to the design of safety fences whose function depends on being unconditional.

## Contradictions

The tension between Kaplow and fail-safe defaults is itself a structural finding. The two sources give opposite verdicts on a rare-but-catastrophic guard:

| Position | Source | Verdict for a rare-but-catastrophic guard |
|---|---|---|
| Frequent conduct warrants ex-ante specification | Kaplow (1992) via [kaplow-rules-vs-standards]{19} {confidence: search-summary}, [parchomovsky-stein-catalogs]{21}, [bodansky-rules-standards-intl-law]{20} | Guard stays *optional* (low frequency → standard, not rule) |
| Safe state holds regardless of configuration | Fail-safe defaults [arc42-fail-safe-defaults]{9}, [saltzer-schroeder-principles]{13} | Guard stays *mandatory* regardless of frequency |

Both positions are internally coherent. They are answering different questions: Kaplow answers "what governance instrument minimizes total cost?"; fail-safe defaults answers "how do you design a system that does not fail in dangerous ways when something unexpected happens?". A safety floor is the second question, not the first.

## Status and scope

This is a refinement of how the floor's membership is *described and defended*. It strengthens defensibility: "the floor is a security fence whose contents are which failures your research shape can actually reach" is more defensible than "the floor is what we committed at design time." The reachability test is ratified as the hard floor's membership definition in the derive-not-enumerate form: per-shape floors derive from the test, with no enumerated `shape → floor` mapping maintained in the framework. The test is the definition; the per-shape floors are its application.

## Revisit if

- A future framework revision proposes (or declines) formal enumerated shape-indexing of the floor — settle or supersede accordingly.
- A failure shape is found that is reachable in a shape yet whose fence is argued out per-instance — tests whether the structural-vs-per-instance line holds in practice.
- Kaplow primary text becomes accessible — re-verify the cost-frequency reading the contrast rests on. (The Kaplow attestation is at `substrate_confidence: search-summary`; key passages are confirmed as verbatim cite-throughs via two directly-fetched secondary sources, but direct engagement with the full text was blocked.)
- An adopter finds a marginal case where structural reachability is genuinely unclear — the test may need a secondary criterion for ambiguous shapes.

---

## Sources

- **[arc42-fail-safe-defaults]{9}** — arc42 Quality Model, "Fail-Safe Defaults" entry. Online reference at <https://quality.arc42.org/approaches/fail-safe-defaults>. Engaged: full entry. Key claims: safe state holds independent of which configuration is active; directional asymmetry toward restriction when ambiguity arises; atomic safe-state transitions.

- **[saltzer-schroeder-principles]{13}** — HandWiki, "Saltzer and Schroeder's design principles." Online reference at <https://handwiki.org/wiki/Saltzer_and_Schroeder%27s_design_principles> (CC-BY-SA-4.0). Secondary source for: Saltzer, Jerome H. and Schroeder, Michael D., "The Protection of Information in Computer Systems," MIT, 1975. Engaged: the fail-safe defaults principle ("Base access decisions on permission rather than exclusion") and surrounding context on the eight design principles. The HandWiki entry notes these are "design guidelines grounded in experience," not mathematical invariants.

- **[wikipedia-controllability]{10}** — Wikipedia, "Controllability." Online article at <https://en.wikipedia.org/wiki/Controllability> (CC-BY-SA-4.0). Engaged: §State controllability (core definition), §Continuous LTI systems (Kalman rank condition). Key passage: "the ability of an external input (the vector of control variables) to move the internal state of a system from any initial state to any final state in a finite time interval."

- **[kaplow-rules-vs-standards]{19}** — Kaplow, Louis. "Rules Versus Standards: An Economic Analysis." *Duke Law Journal* 42:3 (1992): 557–629. **Note: primary text inaccessible (HTTP 403/405 on multiple paths); attested at `substrate_confidence: search-summary` via two directly-fetched secondary sources that quote Kaplow verbatim with page-specific anchors.** Key passages confirmed via cite-through: p. 557 (definitional: "the only distinction between rules and standards is the extent to which efforts to give content to the law are undertaken before or after individuals act"); p. 563 (frequency tradeoff: "If there will be many enforcement actions, the added cost from having resolved the issue on a wholesale basis at the promulgation stage will be outweighed by the benefit..."); p. 563 (when standards are preferred: "when frequency [of regulated conduct] is low, a standard tends to be preferable").

- **[bodansky-rules-standards-intl-law]{20}** — Bodansky, Daniel. "Rules and Standards in International Law." NYU Law School preliminary draft, March 2003. Used here as attestation intermediary for Kaplow (1992) cite-throughs. PDF fetched from <https://www.iilj.org/wp-content/uploads/2017/02/Bodansky-Rules-and-Standards-in-International-Law-2003.pdf>. Note: the document states "Not for quotation or citation"; used only to confirm Kaplow verbatim passages (p. 557, pp. 563–64).

- **[parchomovsky-stein-catalogs]{21}** — Parchomovsky, Gideon and Stein, Alex. "Catalogs." *Columbia Law Review* 115 (2015): 165. PDF fetched from <https://www.columbialawreview.org/wp-content/uploads/2016/04/Parchomovsky-Stein.pdf>. Used here as attestation intermediary for Kaplow (1992) cite-throughs. Key Kaplow passages confirmed via numbered footnotes at pp. 563, 569, 609.
