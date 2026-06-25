---
slug: hermeneutic-circle-settlement-externally-confirmed
status: settled
authored: 2026-05-30
provenance: agent-synthesis
temporal_contract: write-once-on-converge
---

# Strict directionality and the hermeneutic circle — why ARD layers them rather than choosing

> Ported research position behind ARD v0.1 — the reasoning trace for the strict-layer-directionality commitment (SPEC [§4.6](../../SPEC.md#46-strict-layer-directionality)) and the fused-horizons known-limitation (SPEC [§11](../../SPEC.md#11-known-limitations)); see [../../SPEC.md](../../SPEC.md). The attestation layer is not reproduced in this repo (it paraphrases copyrighted sources), so the load-bearing passages are quoted inline and the works are listed under [§Sources](#sources) — the reasoning stands on its own here.

## What the two commitments are

**Strict layer-directionality** (SPEC [§4.6](../../SPEC.md#46-strict-layer-directionality)) is ARD's rule that authoring reads *down* the substrate gradient, never up: a descriptive-layer artifact (a per-source attestation, an engagement-unit aggregation) is authored from the raw source, and does **not** consult the analytical-tier artifacts that sit above it — cross-source syntheses, positions, glossaries. The fence is against **drift-inheritance**: when each layer paraphrases the prior layer's *interpretation* rather than the source, a framing error introduced once propagates downward and compounds, wearing the appearance of source-grounding at every step.

**The hermeneutic circle** is the central claim of philosophical hermeneutics — and read naively, it says that rule is impossible. Gadamer's account (*Truth and Method*, Part Two, ch. 4) is that understanding always begins from a *fore-projection* (Vorgriff): the reader anticipates the meaning of the whole before grasping the parts, and revises that anticipation as the parts resist it.

> "A person who is trying to understand a text is always projecting. He projects a meaning for the text as a whole as soon as some initial meaning emerges in the text. … Working out this fore-projection, which is constantly revised in terms of what emerges as he penetrates into the meaning, is understanding what is there." — Gadamer, p. 279 [gadamer-truth-and-method]{30}

For Gadamer this is not a defect to be cleaned away by method. The "prejudices" (Vorurteile — literally pre-judgments) an interpreter brings are the *enabling condition* of understanding, not noise to be filtered out: "the prejudices of the individual, far more than his judgments, constitute the historical reality of his being" (p. 289). The circle is **ontological, not methodological**:

> "The circle, then, is not formal in nature. It is neither subjective nor objective, but describes understanding as the interplay of the movement of tradition and the movement of the interpreter. The anticipation of meaning that governs our understanding of a text is not an act of subjectivity, but proceeds from the commonality that binds us to the tradition." — Gadamer, p. 305 [gadamer-truth-and-method]{30}

## The tension

The two appear to collide. If pre-understanding *always* conditions engagement — if there is no presuppositionless reading — then a rule saying "engage the source without consulting prior interpretation" looks either naive (it asks for an impossible suspension of all pre-understanding) or self-undermining (the agent's prior framing is operative whether or not an analytical *artifact* is in front of it). A skeptic is right to press the question: does strict directionality claim to abolish the circle? Because if it does, the hermeneutic tradition says it cannot.

## ARD's resolution — a layered settlement, not a denial

ARD does not claim to abolish the circle; it **locates** it. The settlement has two layers:

- **At the descriptive (per-source) layer, directionality is strict — but it fences less than "suspend all pre-understanding."** Strict directionality does not assert presuppositionless reading. It fences one *specific, structural, checkable* channel of contamination: reading an **analytical-tier artifact** up-gradient while authoring a descriptive one. That is the avoidable channel through which one engagement's interpretation silently becomes the next engagement's "source." Gadamer's own prescription is not the quarantine of all pre-understanding (impossible) but making it *answerable to the text*: "The important thing is to be aware of one's own bias, so that the text can present itself in all its otherness and thus assert its own truth against one's own fore-meanings" (p. 282). ARD's `bracket` verb is the make-it-explicit act; strict directionality is the structural complement that removes the one contamination channel a rule *can* remove.
- **At the verification layer, the circle is operationalized, not suppressed.** The fore-projection-and-revision movement the circle describes is exactly what ARD's iterative-return mechanisms perform on synthesis output: a fresh-context adversarial re-read and an isolated-context evaluation (SPEC [§7](../../SPEC.md#7-the-verification-stack-the-rigor-control)) re-engage the produced artifact from a different vantage and revise what the first pass projected. The circle is honored where revision belongs — after a first reading exists to be revised — rather than smuggled into the descriptive layer, where it would license the drift-inheritance the directionality rule exists to fence.

The two commitments fence different failures at different layers, and both stand: strict directionality fences drift-inheritance *during* engagement; iterative-return enacts the hermeneutic circle *at* verification.

## The traditions practice the same pairing

This layering is not an ARD device to dodge the objection. The note-taking and hermeneutic traditions ARD engaged independently practice the same two-step.

**Zettelkasten (Ahrens / Luhmann).** Ahrens grounds the slip-box's bottom-up emergence in Gadamer's circle explicitly — "Every intellectual endeavour starts from an already existing preconception … Basically, that is what Hans-Georg Gadamer called the hermeneutic circle" (§7) — yet the *per-source* discipline he prescribes is strict and source-first: the reader translates the source into their own words **before** it enters the network. "…we have to translate them into our own language to prepare them to be embedded into the new contexts of our own thinking" (§10.1) [ahrens-smart-notes]{32}. The circular movement runs between the *whole slip-box* (the accumulated horizon) and each new source — Luhmann reads "with an eye towards possible connections in the slip-box" (Luhmann, quoted in Ahrens §10) — not *within* the single-source translation step. Luhmann's own essay locates the generative, surprising behaviour in the slip-box's combinatorial network: the slip-box becomes "a competent partner of communication" whose unplanned combinations surface "at the occasion of writing notes or making queries" [luhmann-communicating-slip-boxes]{33}. That is precisely ARD's split — strict at the per-source descriptive step; circular at the system/synthesis level.

**Ricoeur's hermeneutical arc.** Ricoeur makes the sequence explicit: interpretation moves naive understanding → explanation → appropriation. "In the beginning, understanding is a guess. At the end, it satisfies the concept of appropriation. Explanation, then, will appear as the mediation between two stages of understanding" (p. 74) [ricoeur-interpretation-theory]{31}. The critical/validating moment comes *after* the initial engagement — and Ricoeur is careful that it is validation, not mechanical proof: "validation is not verification. It is an argumentative discipline comparable to the juridical procedures used in legal interpretation, a logic of uncertainty and of qualitative probability" (p. 78). ARD's verification stack is structurally an arc of this shape: a first reading, then an argumentative re-engagement that does not reduce to a checklist.

**Gadamer's two levels.** Gadamer's circle itself runs at two levels: the per-source fore-projection that is revised in-engagement, and the *prior horizon* (tradition) that conditions which questions are even asked before a source is opened. Strict directionality addresses the first and is honest that it does not touch the second — no rule reaches the prior horizon, and the tradition holds that none can. The settlement is therefore scoped, not over-claimed: it removes a contamination channel, it does not claim to make the agent presuppositionless.

## The honest boundary — the fused-horizons gap

The same traditions that confirm the pairing also mark its limit, and ARD records it as a known limitation rather than papering over it (SPEC [§11](../../SPEC.md#11-known-limitations)). For Gadamer, the *point* of understanding is the **fusion of horizons** — "understanding is always the fusion of these horizons supposedly existing by themselves" (p. 317) — in which the interpreter ends with an *expanded* horizon, holding questions they could not have asked before. Ricoeur's appropriation is the same movement: "it is the text, with its universal power of world disclosure, which gives a self to the ego" (pp. 94–95), and appropriation "implies a moment of dispossession."

ARD's iterative-return mechanisms revise fore-projection *within* the framework's existing horizon. They do **not** capture horizon-*expansion* — the reshaped questions a reader holds *after* genuine engagement — and no ARD artifact does. This is not a tractable bug: genuine horizon-expansion requires encounter with a horizon *outside* the paradigm, which a re-read from a fresh angle within the same paradigm cannot manufacture. The tradition explains *why* the gap is structurally ineliminable — which is what lets ARD name it as a boundary of the settlement rather than a defect in it.

## Sources

- **[gadamer-truth-and-method]{30}** — Hans-Georg Gadamer, *Truth and Method* (*Wahrheit und Methode*, 1960), revised 2nd edition, trans. Joel Weinsheimer & Donald G. Marshall (Bloomsbury Academic, 2013). Engaged: Part Two, ch. 4 ("Elements of a Theory of Hermeneutic Experience"), pp. 278–376.
- **[ricoeur-interpretation-theory]{31}** — Paul Ricoeur, *Interpretation Theory: Discourse and the Surplus of Meaning* (Texas Christian University Press, 1976). Engaged: Essay 4 ("Explanation and Understanding"), pp. 71–88, and Conclusion, pp. 89–95.
- **[ahrens-smart-notes]{32}** — Sönke Ahrens, *How to Take Smart Notes*, 2nd edition (2022). Engaged: §7 ("Nobody Ever Starts from Scratch") and §10 ("Read With a Pen in Hand").
- **[luhmann-communicating-slip-boxes]{33}** — Niklas Luhmann, "Communicating with Slip Boxes" (1992; German original c. 1980/81), trans. Manfred Kuehn, <https://luhmann.surge.sh/communicating-with-slip-boxes>.

## Revisit if

- A note-taking or interpretation tradition surfaces that practices *descriptive-layer* circularity — consulting prior analytical syntheses *during* fresh-source engagement — without treating it as a failure. That would pressure the claim that the traditions converge on ARD's split.
- The fused-horizons gap acquires a tractable artifact-tier target (an artifact that genuinely captures post-engagement horizon-expansion). The "structurally ineliminable" framing would then need narrowing.
- An adopter finds strict directionality fencing materially more (or less) than drift-inheritance in their domain — re-scope what the rule claims to fence.
