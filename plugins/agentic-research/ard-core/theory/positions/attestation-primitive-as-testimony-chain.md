---
slug: attestation-primitive-as-testimony-chain
status: settled
authored: 2026-05-21
provenance: agent-synthesis
temporal_contract: write-once-on-converge
---

# The per-source attestation primitive is a testimony chain in Coady's sense

> Ported research position behind ARD v0.1 — the reasoning trace for a framework commitment; see [../../SPEC.md](../../SPEC.md). The attestation layer is not reproduced in this repo (it paraphrases copyrighted sources), so load-bearing passages are quoted inline and works are listed under [§Sources](#sources).

## What is the per-source attestation primitive?

ARD's fabrication problem is specific: an agent fetches a source, uses verifiable figures from it accurately, then composes the surrounding categorical framing — which dataset, which baseline, which version, which paper — from training memory rather than from what the source actually says. The verifiable substrate anchors the appearance of grounding; the surrounding categorical context drifts. This is anchor-and-drift fabrication, the canonical fabrication shape ARD fences (SPEC [§2](../../SPEC.md#2-the-failures-ard-addresses)). Fetch-first discipline alone does not prevent it.

ARD's structural answer is the **per-source attestation primitive**: before composing any synthesis claim citing a source, the agent must author a dedicated attestation file — a paraphrase of the source in the agent's own words, with verbatim key passages anchored to specific sections or pages, and structural metadata describing the source's organization. Only after the attestation file exists may the agent compose synthesis claims, which then cite the attestation by a stable handle (`[handle]{N}` form) rather than citing the raw source directly.

The citation chain that results has three hops:

```
synthesis claim
  → cites attestation by [handle]{N}
  → attestation paraphrases raw source (with per-section key-passage anchors)
  → raw source (fetched)
```

Each hop is auditable. A lint mechanism can verify that the handle resolves to a file, that the file's `source_handle:` matches, and that the file carries a `provenance: source-direct` marker. A semantic adversarial re-read can verify that the attestation actually supports the claim as stated — not just that the file exists.

The question this position answers is: **what does this chain shape mean epistemically?** The testimony-epistemology tradition, particularly C. A. J. Coady's *Testimony* (1992), supplies a tradition-anchored vocabulary for exactly this structure — and the mapping is illuminating, not merely decorative.

## What testimony epistemology says — Coady's framework

**Testimony as a basic epistemic source.** The dominant post-Cartesian epistemology treated testimony with suspicion: our reliance on what others tell us must ultimately be justified by our own individual observations and inductive reasoning — otherwise we are epistemically dependent on others in a way that cannot be grounded. David Hume's argument in "Of Miracles" is the canonical reductionist statement: our acceptance of testimony is warranted because we have observed that reports and facts regularly correlate.

Coady's *Testimony* (1992) is the book that reopened this question in contemporary analytic epistemology, and its central argument is a sustained dismantling of that reductionist picture. Coady argues Hume's reductionist thesis (*RT*) bifurcates fatally when pressed: in the "common experience" form, the experience that is supposed to justify our reliance on testimony is itself known by testimony — the justification is viciously circular. In the "individual observation" form, the claim is empirically false: no individual person has directly observed the correlations that would be required.

> "Modern epistemologists tirelessly pursue the nature and role of memory, perception, inductive and deductive reasoning but devote no analysis and argument to testimony although prima facie it belongs on this list. After all when we inquire into the basis of some claim by asking: 'Why do you believe that?' or 'How do you know that?' the answer 'Jones told me' can be just as appropriate as 'I saw it' or 'I remember it', 'It follows from this' or 'It usually happens like that'." [coady-testimony]{34} Ch. 1, p. 6

His positive view is that testimony is a *fundamental* epistemic source — what he calls the Fundamentalist position (identifying most closely with Thomas Reid):

> "It is best, I think, to see all four [perception, memory, inference, testimony] as on a level though with perception at the centre." [coady-testimony]{34} Ch. 8, p. 147

Perception sits at the centre because testimony is mediated through it — we hear or read reports — but this structural position grants perception no *reductive priority* over testimony. Testimony knowledge can be *direct* in the same sense perceptual knowledge is direct: the agent does not need to establish the witness's reliability in advance before the acceptance of testimony yields knowledge, any more than a perceiver needs to establish in advance that they are not a brain in a vat.

**Default-trust with built-in critical capacities.** If testimony is basic, how should an agent calibrate its acceptance? Coady's Chapter 2 gives the structural answer:

> "Contrary to what we are inclined, unreflectively, to suppose, the attitudes of critical appraisal and of trust are not diametrically opposed… What happens characteristically in the reception of testimony is that the audience operates a sort of learning mechanism which has certain critical capacities built into it. The mechanism may be thought of as partly innate, though modified by experience, especially in the matter of critical capacities… we may have 'no reason to doubt' another's communication even where there is no question of our being gullible; we may simply recognize that the standard warning signs of deceit, confusion, or mistake are not present." [coady-testimony]{34} Ch. 2, p. 47

Coady's immediately preceding paragraph, at pp. 45–46, makes the logical structure explicit: "even for adults, the critical attitude is itself founded upon a general stance of trust, just as the adult awareness of the way memory plays us false rests upon a broader confidence in recollective powers." [coady-testimony]{34} Ch. 2, pp. 45–46

The picture: trust is the default; critical capacities trigger on *warning signs* — internal inconsistency in the report, conflict with other credible reports, signs of evident deception or error, a witness type with a record of unreliability. Neither default-distrust-then-verify (the reductionist posture) nor uncritical default-trust (the naive posture). Structural: trust + critical capacities composed, not opposed.

**Believing the witness vs inference from the utterance.** Coady draws a structural distinction between two modes of epistemic relation to a speaker's output:

> "In the case of Jones we are making certain inferences from Jones's utterance which rely in no way upon Jones's trustworthiness; this contrasts with the testimony case where we are not just believing that p because of something or other about the witness's utterance but we are *believing the witness*." [coady-testimony]{34} Ch. 2, pp. 45–46

And in the same passage: "When we believe testimony we believe what is said because we trust the witness." [coady-testimony]{34} Ch. 2, pp. 45–46

In Coady's usage, *believing what is said* is the content-side of *believing the witness* — the two come together in a single testimonial relation. The genuine Coady contrast is between that testimonial relation (where trust is the ground) and the non-testimonial mode where an agent extracts information inferentially from an utterance without entering into a trust relation with the speaker as agent. When we engage in the testimonial mode, we receive the content because we trust the source. When we engage inferentially — treating the utterance as data to mine without that trust relation — we are not in testimonial reception at all.

## How the three-hop chain maps onto Coady's framework

**The chain shape is a testimony chain.** The three-hop structure — raw source testifying → attestation-author receiving and re-testifying → synthesis-author receiving and composing — is structurally the testimony chain Coady analyzes throughout the book, and most directly in his Chapter 11 argument against Locke's claim that testimony decays through transmission.

Locke held that as testimony passes through intermediate witnesses, it loses evidential force geometrically — each link introduces degradation. Coady's Chapter 11 counter-argument is that this picture is wrong: intermediate links with genuine critical capacity do not introduce decay; they actively filter and corroborate. The chain retains — and can strengthen — evidential force when each link exercises the critical capacity the learning mechanism carries.

The attestation file is exactly such an intermediate link. The attestation-author engages the raw source in the *believing-the-witness* posture Coady names, paraphrasing the content, anchoring key passages, and recording structural metadata. This is not passive relay; it is active critical mediation. The synthesis-author then engages the attestation in the same posture, trusting the attestation-author's record unless the verification stack surfaces warning signs.

**The three ARD commitments map cleanly onto Coady's three structural elements:**

*First, testimony is basic — source attestation is basic substrate.* The discipline treats the fetched source as the ground: the source's testimony is the authority, and the attestation-author's job is to receive it faithfully. The no-cite-from-training-recall rule is the direct operationalization of this: training memory is not testimony in Coady's sense — it has no witness, no competence condition, no chain of reception. Treating training memory as a citation source violates the testimonial structure at its foundation.

*Second, default-trust with built-in critical capacities — the verification stack.* Coady's learning mechanism (trust as default; critical capacities triggered by warning signs) maps structurally onto ARD's verification stack. The stack's four stages — lint, adversarial-read, evaluate, spot-check — are the "built-in critical capacities" at the agent-system scale. They trigger on warning signs: surface-signature claim shapes (lint), semantic citation-chain failures and smoothed contradictions (adversarial-read), shared-context blind spots (evaluate), and the residual gap the automated stages miss (spot-check). Neither the stack nor Coady's mechanism is an independent verification of every claim from first principles; both operate default-trust + triggered-critical-capacity.

*Third, the testimonial relation vs inference from the utterance — attestation vs defection.* Coady's contrast between believing-the-witness (the full testimonial relation, in which content is received because the witness is trusted) and inferring from the utterance (extracting data without entering the trust relation) maps directly onto what the attestation primitive fences:

- The **attestation file** instantiates the *believing-the-witness* relation: the attestation-author is in a trust relation with the source as agent. The attestation's job is faithful reception of the source's testimony — what the source actually says, in the source's own words where load-bearing, paraphrased faithfully otherwise.
- **Anchor-and-drift fabrication** is, in Coady's terms, a defection from this relation: the agent treats the source's output as an inferential anchor (the verifiable figure, the verifiable date) while composing the surrounding categorical context from training memory. The agent is not believing the witness; it is using the witness's output as a data-point for its own prior beliefs. The attestation primitive structurally prevents this by requiring the full testimonial posture — the attestation file as the record of the *believing-the-witness* step — before any synthesis composing can begin.

Note: the claim that the synthesis-claim layer represents a second distinct Coady posture ("believing what is said" vs "believing the witness") goes beyond what Coady himself argues. In Coady, these are not two separate postures — they are the content-side and the trust-side of the same testimonial relation. The relevant ARD analysis is that the attestation file establishes the testimonial relation (believing-the-witness), and anchor-and-drift fabrication defects from it. The synthesis claim layer represents content established by that testimonial step carrying forward into composition — an analytical extension of the mapping, not a second Coady posture.

## The chain shape relative to the contemporary LLM-testimony literature

A separate question is whether this multi-hop nested chain appears in the contemporary philosophical literature on LLM outputs as testimony. Four papers constitute the corpus of primary LLM-testimony work engaged at source-direct or near-source-direct depth:

- **Freiman (2024)** [freiman-ai-testimony-2024]{22} — argues mainstream testimonial theories structurally reject technological artifacts as testifiers due to three anthropocentric assumptions (lacking intentions; not normatively assessable; unable to constitute a trust-relation object). Proposes "AI-testimony" as an alternative concept for single-hop LLM outputs. Engages single-hop question: *can an LLM's output be testimony?* No evidence of Coady engagement at search-summary depth (paper body paywalled; bibliography not verified). {confidence: search-summary}

- **He & Yang (2025)** [he-testimony-by-llms-2025]{23} — argues LLM outputs can be a genuine source of knowledge if LLMs robustly perform Reidian propensities of veracity and cautiousness (Reid's framework applied to LLMs). Critiques Lackey's assurance theory. Engages single-hop question: *under what conditions is an LLM's output testimony?* {confidence: search-summary}

- **Petruzella (2025)** [petruzella-inconsistency-critique-2025]{24} — the inconsistency critique: argues that our actual epistemic practices treat AI outputs as testimony across many domains while selectively withdrawing testimonial standing in the inner-states domain; the asymmetry is unprincipled. Engages Fricker's informant-vs-source distinction and Goldberg's obligation-based account. Coady **not cited** (verified at body-fetch depth — absent from bibliography). Single-hop framing. {confidence: source-direct for bibliographic claims; search-summary for body content}

- **Fierro et al. (2024)** [fierro-defining-knowledge-llm-2024]{25} — surveys five epistemological definitions of knowledge and asks which apply to LLMs; proposes evaluation protocols for testing knowledge-attribution. Engages JTB and successors (Sartwell, Nozick, Williamson, Zagzebski, Austin). Whether testimony epistemology figures are engaged remains a source-direct gap. {confidence: source-direct for the five definitions and cited epistemologists; search-summary for the testimony-engagement question}

All four papers engage the **single-hop question**: is a given LLM output testimony? Can an LLM be a testifier? None engages the **multi-hop nested chain** that ARD instantiates — the chain in which an agent receives a source as testimony (attests it), then re-testifies to a synthesis claim that cites the attestation. This is a structurally different configuration: not "is the LLM's output testimony to its reader" but "can an LLM-mediated research chain be structurally organized as a warranted testimony chain, and what does that require?"

The gap in the LLM-testimony literature is not a failure of quality; it is a difference of question. The LLM-testimony papers are asking epistemological questions about a deployed AI system's outputs as they reach an end-user (a single-hop question with the LLM as the testifier). ARD's question is about how an LLM-mediated research process can be organized to preserve the testimonial structure of the citation chain across multiple agent-mediated hops. These are different questions, and the tradition has engaged the former while leaving the latter untouched.

**Substrate-thinness disclosure carried forward.** Freiman (2024) and He & Yang (2025) remain at search-summary depth due to paywall barriers (Taylor & Francis and Springer respectively). The claim that neither engages the multi-hop nested chain is warranted by what is visible at search-summary depth, but cannot be made with source-direct certainty for those two papers. Petruzella (2025) is source-direct-verified for bibliographic absence of Coady; Fierro et al. (2024) is source-direct-verified for the five definitions and epistemologist list, but the testimony-engagement question remains a gap.

## What the mapping does not commit to

**Not a derivation — a vocabulary enrichment.** The testimony-tradition mapping does not change the attestation primitive's architecture; it supplies a tradition-anchored register for what the primitive already does. The primitive's justification at the architectural level is empirical and structural: anchor-and-drift is the documented fabrication shape ARD fences (SPEC [§2](../../SPEC.md#2-the-failures-ard-addresses)), and fetch-first discipline alone is demonstrably insufficient against it. The testimony-tradition vocabulary names the structural shape in terms the tradition has analyzed and confirmed; it does not derive the architecture from Coady's premises.

**Not a claim to novelty relative to the testimony-epistemology tradition.** The multi-hop testimony chain is tradition-recognizable. Coady's Chapter 11 analysis of warranted transmission through intermediate witnesses covers this shape. What is novel is the operationalization at the LLM-agent layer — the specific configuration of agent-as-attestation-author, attestation-file as intermediate link, and synthesis-brief as downstream receiver — and the absence of this configuration in the contemporary LLM-testimony literature.

**Not a commitment to Coady as the unique correct framing.** The testimony tradition has a post-1992 debate — transmission accounts (Burge, Lackey, Faulkner) — about whether testimonial warrant is *transmitted* from speaker to hearer through a chain or *generated fresh* at each reception by the speaker's act of assurance. Coady's framework predates and does not adjudicate this debate. The position carries Coady as the primary-text anchor and acknowledges the tradition's internal diversity. Lackey's framework in *Learning from Words* — which the NDPR review [lackey-learning-from-words-ndpr]{26} characterizes as occupying a "hybrid" position between reductionism and anti-reductionism, requiring a positive contribution from both the speaker's words and the hearer's epistemic situation — may bear on the chain structure in ways the position cannot adjudicate without source-direct engagement of Lackey's primary text. Whether Lackey's generation-vs-transmission distinction diverges materially from Coady's default-trust framework on the credibility question is an open question the position leaves explicit.

## Failure modes the tradition names

Coady's framework, carefully read, also names three failure modes the chain can exhibit — and ARD's structural discipline partially addresses two of them, not fully the third.

**First: honest-source-error.** Coady explicitly criticizes Reid for treating testimony failure as failure through dishonesty. His correction: "a great deal of testimony consists of passing on perceptual information and, where it is mistaken, the mistake will, in all honesty, usually be transmitted" [coady-testimony]{34} Ch. 7, p. 127. A sincere, competent witness can be wrong — and the chain faithfully transmits the error. The attestation primitive addresses this only incidentally: the five-component write-discipline is structured for faithfulness, not for competence-evaluation. If the source is wrong, a faithful attestation faithfully records the error, and the synthesis claim inherits it. This is a named gap in the chain's warrant structure, not a structural feature of the chain.

**Second: thin-attestation as competence failure.** Coady's natural testimony definition requires that the speaker "has the relevant competence, authority, or credentials to state truly that p" [coady-testimony]{34} Ch. 2, p. 42. A thin attestation — one that paraphrases at whole-source granularity with no per-section anchors and no key-passage blockquotes — is, in Coady's terms, an attestation whose author did not exercise the competence condition. The attestation passes structural checks (the file exists; the frontmatter is correct) but fails to constitute genuine testimonial competence for per-claim citation walks at section granularity. ARD fences this with both a structural thin-attestation lint check and an adversarial-reader job — the structural fence Coady's tradition motivates.

**Third: defection from believing-the-witness.** Anchor-and-drift fabrication is, in Coady's terms, a defection from the *believing-the-witness* relation: the agent uses the source's verifiable output as an inferential anchor while composing the surrounding categorical context from training memory. The attestation primitive's structural fence — requiring the full testimonial-posture step before synthesis — directly addresses this. The attestation file is the record that the agent was in the *believing-the-witness* relation with the source; the citation chain makes this auditable.

## Disconfirming analysis

The principal disconfirming search asked: does Coady's framework, when read carefully, actually support the default-trust-with-built-in-critical-capacities mapping? Or does a careful reading of Chapter 2 surface a divergence the position glosses?

The load-bearing passages are Chapter 2, pp. 45–46 and p. 47, both quoted above. The pp. 45–46 passage states that "even for adults, the critical attitude is itself founded upon a general stance of trust" — not the reverse. The p. 47 passage makes the same point structurally (trust and critical appraisal are not diametrically opposed; the learning mechanism has critical capacities built in). The mapping is direct: trust as default; critical capacities as the triggered overlay. The disconfirming search did not find a passage where Coady inverts to default-distrust, or where the critical capacity is the primary mechanism and trust the derivative overlay. The mapping holds at primary-text depth.

A secondary disconfirming search asked: does the LLM-testimony literature engage the multi-hop nested chain at any point? Petruzella (2025) is source-direct-verified for Coady's absence. Fierro et al. (2024) is source-direct-verified for the epistemologists engaged — none who work on testimony chains in the relevant sense. Freiman (2024) and He & Yang (2025) remain at search-summary depth; the disconfirming claim is accordingly held at "appears not to engage" rather than "confirmed not to engage" for those two papers.

## Contradictions

No within-corpus contradiction surfaces at source-direct depth. The testimony tradition's internal debate (Coady's anti-reductivism vs the post-1992 transmission-vs-assurance divide) is a tradition-internal tension, not a contradiction between Coady and the LLM-testimony papers — those papers do not engage Coady's framework. The substrate-thinness on Freiman and He & Yang means a genuine contradiction could be hidden; this is the primary reason the "appears novel" hedge is load-bearing and the Revisit conditions below are genuine.

## Revisit if

- A primary-text engagement with Lackey's *Learning from Words* enters the corpus and the generation-vs-transmission distinction diverges materially from Coady's default-trust framework on the credibility question. The position's chain-structure analysis would need re-grounding against the transmission-vs-assurance debate.
- Source-direct acquisition of Freiman (2024) or He & Yang (2025) becomes possible and either engages the multi-hop nested chain. The "appears novel relative to the LLM-philosophy corpus" verdict would shift.
- A successor LLM-philosophy paper engages the multi-hop nested-chain shape substantively at source-direct depth.
- An adversarial reading of Coady's Chapter 2 learning-mechanism passages surfaces a divergence from the "default-trust with built-in critical capacities" gloss the position relies on.
- An adopter pressure case requires the chain-structure analysis to be articulated against the transmission-vs-assurance debate explicitly rather than resting on Coady's pre-1992 framing.

## Sources

- **[coady-testimony]{34}** — C. A. J. Coady, *Testimony: A Philosophical Study* (Clarendon Press / Oxford University Press, 1992; paperback reprint 1994). The book that reopened testimony as a topic in contemporary analytic epistemology. Engaged at source-direct depth across Parts I–III in full and Parts IV–V selectively. The load-bearing sections for this position: Ch. 2 ("What is Testimony?") on natural testimony, the believing-the-witness distinction, and the learning mechanism; Ch. 4 (the Reductionist Thesis critique); Ch. 7 (Reid's framework); Ch. 8 ("The Status of Testimony") on testimony as basic and non-inferential; Ch. 11 (the anti-decay argument against Locke).

- **[freiman-ai-testimony-2024]{22}** — Ori Freiman, "AI-Testimony, Conversational AIs and Our Anthropocentric Theory of Testimony," *Social Epistemology* 38(4):476–490, 2024. DOI: 10.1080/02691728.2024.2316622. Engaged at search-summary depth; paper body paywalled (Taylor & Francis). Proposes the concept "AI-testimony" for single-hop LLM outputs; identifies three anthropocentric assumptions behind mainstream testimonial theory's rejection of LLM outputs as testimony. *Substrate confidence: search-summary.*

- **[he-testimony-by-llms-2025]{23}** — Jinhua He and Chen Yang, "Testimony by LLMs," *AI & SOCIETY* 40(8):6201–6213, 2025. DOI: 10.1007/s00146-025-02366-y. Engaged at search-summary depth; paper body paywalled (Springer). Argues LLM outputs can be a genuine source of knowledge if LLMs robustly perform Reid's principles of veracity and cautiousness; critiques Lackey's assurance theory. *Substrate confidence: search-summary.*

- **[petruzella-inconsistency-critique-2025]{24}** — Gerol Petruzella, "The Inconsistency Critique: Epistemic Practices and AI Testimony About Inner States," arXiv preprint 2601.08850, submitted December 2025. Engaged at body-fetch depth for bibliography (arXiv HTML). The inconsistency critique: epistemic practices selectively withdraw AI testimonial standing in the inner-states domain in an unprincipled way. Deploys Fricker's informant-vs-source distinction and Goldberg's obligation-based account. Coady not in bibliography (verified at body-fetch depth). *Substrate confidence: source-direct for bibliographic claims; search-summary for body content.*

- **[fierro-defining-knowledge-llm-2024]{25}** — Constanza Fierro, Ruchira Dhar, Filippos Stamatiou, Anders Søgaard, Nicolas Garneau, "Defining Knowledge: Bridging Epistemology and Large Language Models," EMNLP 2024 (ACL Anthology 2024.emnlp-main.900). arXiv: 2410.02499. Engaged at body-fetch depth for the five definitions and surveyed epistemologists. Reviews five epistemological definitions of knowledge and surveys 100 philosophers and computer scientists on their preferences for knowledge definitions and views on LLM knowledge-attribution. Epistemologists engaged include Sartwell, Nozick, Williamson, Zagzebski, Austin — the JTB-and-successors lineage, not the testimony lineage. *Substrate confidence: source-direct for five definitions and epistemologist list; search-summary for testimony-engagement question.*

- **[lackey-learning-from-words-ndpr]{26}** — NDPR review of Jennifer Lackey, *Learning from Words: Testimony as a Source of Knowledge* (Oxford University Press, 2008). Source-direct on the NDPR review; Lackey's primary text not directly fetched. Claims about Lackey's position are cite-through via this review. The review characterizes Lackey as advancing a "hybrid" view between reductionism and anti-reductionism, and as arguing that testimonial knowledge can be generated in a hearer even when the speaker lacks it — a generation-vs-transmission distinction that departs from both Coady's anti-reductivism and the standard transmission account. *Substrate confidence: source-direct for the NDPR review; cite-through for Lackey's primary text.*
