---
slug: anchor-and-drift-three-tradition-framings
status: settled
authored: 2026-05-21
provenance: agent-synthesis
temporal_contract: write-once-on-converge
---

# Anchor-and-drift as sign-grounding failure — three tradition-specific diagnoses

> Ported research position behind ARD v0.1 — the reasoning trace for a cross-tradition grounding of ARD's core fabrication failure; see [../../SPEC.md](../../SPEC.md). The attestation layer is not reproduced in this repo (it paraphrases copyrighted sources), so the load-bearing passages are quoted inline and the works are listed under [§Sources](#sources) — the reasoning stands on its own here.

## What this position is about

ARD's central anti-pattern is *anchor-and-drift fabrication*: an AI agent fetches a real source and correctly reproduces one verifiable surface from it (a figure, a version number, a citation handle) — the *anchor* — while composing the surrounding categorical attribution (which dataset, which baseline, which work the anchor applies to) from training-recall rather than from the fetched source. The verifiable anchor gives the output the appearance of source grounding; the surrounding context drifts.

This failure is recognizable enough from examples alone. But three separate philosophical traditions — Saussurean structural linguistics, the symbol-grounding lineage in philosophy of AI, and Peircean semiotic theory — each have vocabulary for diagnosing the *same structural shape* independently of each other and independently of AI research. When three traditions independently converge on the shape of a failure, that convergence supplies something empirical grounding does not: a framework for understanding *why* the failure has the shape it does, and what structural interventions the failure's shape suggests.

**This position makes one central claim: the convergence is at the level of the shape diagnosed — not at the level of what each tradition prescribes as a remedy.** Each tradition reaches different prescriptive conclusions. Paraphrasing them into a single unified fix would lose the genuine disagreement. The three framings are therefore held side-by-side throughout.

---

## What each tradition contributes

### 1. Saussurean structuralism — the dyadic sign broken at its signification face

#### The Saussurean framework

Ferdinand de Saussure's *Course in General Linguistics* (posthumous 1916; compiled from students' lecture notes by Bally and Sechehaye) argues that the central object of linguistics is not individual speech acts but *the language* (*la langue*) as a system. Within this system, the sign is a dual psychological entity uniting two faces:

- **Signal** (Roy Harris's 1983 translation of *signifiant*; the convention in most English scholarship renders this *signifier*): "the hearer's psychological impression of a sound" — not the physical sound, but the psychological form.
- **Signification** (*signifié*; conventionally *signified*): "generally of a more abstract kind: the concept."

The foundational principle is that the coupling between the two faces is *arbitrary* — "there is no internal connexion, for example, between the idea 'sister' and the French sequence of sounds *s-ö-r* which acts as its signal" [saussure-course-in-general-linguistics]{27} (Part One, ch.1 §2, std p.[100]).

This arbitrariness is not merely a curiosity. Saussure argues it entails *invariability*: precisely because the sign is not motivated by any natural connection between sound and concept, the linguistic community has no rational basis on which to deliberate a change. "There is no issue for the community of language users to discuss, even were they sufficiently aware to do so" [saussure-course-in-general-linguistics]{27} (Part One, ch.2 §1, std p.[107]). The coupling holds through convention, not through intrinsic fit.

The sign's value — what it *means* — is further not a positive property of the sign itself, but a differential one. Each sign is constituted by its contrasts with all the others. "In a language there are only differences, and no positive terms" [saussure-course-in-general-linguistics]{27} (Part Two, ch.4 §4, std p.[166]). The *mouton*/*sheep* example illustrates: French *mouton* does not have the same value as English *sheep* because English also has *mutton* for the dressed meat; the differential system carves the conceptual space differently [saussure-course-in-general-linguistics]{27} (Part Two, ch.4 §2, std p.[160]).

#### How anchor-and-drift reads under this framing

Anchor-and-drift is, in Saussurean terms, a *broken dyad*. The signal face of a sign is intact: the citation handle exists, the figure appears, the version number is present, the form is well-shaped. But the signification face has drifted — it has been assigned to a concept the fetched source does not support. The agent reproduces the signal while composing a signification from training-recall rather than recovering it from the convention the source establishes.

The Saussurean parallel to this is homophonic merger: Saussure notes that when two signals collapse into one through phonetic drift (his example: French *décrépit* and *décrépi*, which merge despite distinct Latin origins), "the ideas tend to merge as well" [saussure-course-in-general-linguistics]{27} (Part Two, ch.4 §4, std p.[167]). In anchor-and-drift, the inverse happens: the signal holds but the signification migrates. The form-chain (citation handle → signification) is not traversed against the source; it is completed from elsewhere.

#### The tradition's prescriptive content

The Saussurean account of how convention-maintenance works is systemic: signs are coupled to their signifieds through community convention within a closed system. The repair, at this level, is *re-establish the convention's coupling* — traverse the chain from signal to signification within the system the source constitutes, not within the agent's training-recalled system of associations. Per-source attestation, read in this register, is the act of re-establishing the coupling convention-specifically: the attestation is the record of what this source's signal was coupled to, as distinct from what the agent's training-recall would suggest.

---

### 2. Symbol-grounding lineage — form-only training cannot autonomously close the signal-to-meaning chain

#### The symbol-grounding problem

Stevan Harnad's 1990 paper "The Symbol Grounding Problem" names a structural problem for purely symbolic AI systems. A symbol system, in Harnad's usage (drawing on Newell, Pylyshyn, Fodor), is a set of physical tokens manipulated according to explicit rules, where manipulation is purely *syntactic* — based on shape, not meaning. Such a system is *semantically interpretable* (the tokens can be read as having meaning) but the interpretation is not *intrinsic* — it is parasitic on the meanings that interpreters project from outside.

> "How can the semantic interpretation of a formal symbol system be made intrinsic to the system, rather than just parasitic on the meanings in our heads? How can the meanings of the meaningless symbol tokens, manipulated solely on the basis of their (arbitrary) shapes, be grounded in anything but other meaningless symbols?" [harnad-symbol-grounding-problem]{14} (Abstract)

Harnad's "Chinese/Chinese Dictionary-Go-Round" illustrates the problem: trying to learn Chinese as a first language using only a Chinese/Chinese dictionary — each definition passes from one symbol-string to another, and the learner never arrives at what any of it means [harnad-symbol-grounding-problem]{14} (§2.2). The "hermeneutic hall of mirrors" is Harnad's phrase for the reverse of this: the programmer projects grounded meanings from their own head onto an AI system's ungrounded symbol manipulation, and the projection makes the system *appear* to understand [harnad-symbol-grounding-problem]{14} (footnote 6).

Harnad's proposed solution is a hybrid nonsymbolic/symbolic system: elementary symbols are grounded bottom-up in *iconic representations* (internal analog transforms of sensory projections) and *categorical representations* (learned feature-detectors that identify category members). Higher-order symbolic representations are composed from grounded elementary symbols. The grounding chain runs from world → iconic/categorical → elementary symbol → composed symbol; without this chain, symbol manipulation is purely syntactic.

#### Bender and Koller: the form/meaning argument extended to LLM training

Bender and Koller (2020) extend the symbol-grounding framing directly to language models trained on text:

> "We argue that *the language modeling task, because it only uses form as training data, cannot in principle lead to learning of meaning*." [bender-koller-climbing-towards-nlu]{15} (§1)

Their definition of meaning: M ⊆ E × I, pairs of linguistic expressions and the communicative intents they can evoke. Communicative intent is grounded in something external to language — the real world or abstract/hypothetical worlds. Without access to these communicative intents at training time, there is no signal from which to learn the form-to-meaning mapping. The octopus thought experiment makes this vivid: a deep-sea octopus that taps an underwater telegraph cable between two English speakers can learn to predict their exchanges statistically, but when one castaway asks for help building a coconut catapult, the octopus has no word-world mapping with which to respond usefully. The *listener* supplies meaning by active interpretation; it is "not that O's utterances make sense, but rather, that A can make sense of them" [bender-koller-climbing-towards-nlu]{15} (§4).

The stochastic parrots paper (Bender, Gebru, McMillan-Major, and Shmitchell, 2021) sharpens this into an explicit definition of what a language model produces:

> "Contrary to how it may seem when we observe its output, an LM is a system for haphazardly stitching together sequences of linguistic forms it has observed in its vast training data, according to probabilistic information about how they combine, but without any reference to meaning: a stochastic parrot." [bender-stochastic-parrots]{16} (§6.1)

The reception side is also critical: "the tendency of human interlocutors to impute meaning where there is none" [bender-stochastic-parrots]{16} (§1) means that even form-only output is mistaken for meaningful output, because the human listener does the interpretive work.

#### Shanahan's conditional reading

Murray Shanahan (2022/2023) offers a more conditional framing. His paper is a methodological position on how researchers should *talk about* LLMs: with care, given that LLMs are "generative mathematical model[s] of the statistical distribution of tokens in the vast public corpus of human-generated text" [shanahan-talking-about-llms]{17} (§2). Shanahan does not commit to the universal claim that a system based on an LLM could never warrant intentional vocabulary: "it is not the argument of this paper that a system based on a large language model could never, in principle, warrant description in terms of beliefs, intentions, reason, etc." [shanahan-talking-about-llms]{17} (§3). The argument is about current systems and what current discipline of talk requires.

Mitchell and Krakauer (2023) survey the debate from outside: a 2022 community survey of 480 NLP researchers found exactly 51% agreeing and 49% disagreeing with the statement that a text-only generative model could in principle understand language in some non-trivial sense [mitchell-krakauer-debate-over-understanding-llms]{18}. Their own framing opens the question of whether "unimaginably large systems of statistical correlations produce abilities that are *functionally equivalent* to human understanding" [mitchell-krakauer-debate-over-understanding-llms]{18} (key question 3). They do not answer it.

#### How anchor-and-drift reads under this framing

The symbol-grounding lineage diagnoses anchor-and-drift at the workflow-failure-shape tier (the framing this position applies) — the point where the trained form-completion capacities of an LLM are deployed in a research workflow that requires genuine symbol-to-source coupling. An LLM that has learned the *form* of citation — handle syntax, statistical associations between handles and adjacent content, plausible-sounding figure placements — can produce citation-shaped output without traversing the actual source the citation purports to point at. The form is correct; the grounding is absent.

The shape: the signal (the citation form, the verifiable anchor) is intact at the form layer. The grounding chain (handle → actual source → actual content the handle refers to) is not traversed. The agent completes the token sequence from within the space of forms it has seen, not from the dynamical relationship between the citation and the source. This is Harnad's Chinese/Chinese Dictionary-Go-Round at the research-workflow tier: the agent passes from form to form without ever arriving at the world.

#### The tradition's prescriptive content — and where it splits

The symbol-grounding lineage prescribes a *structural fence at workflow architecture*, not at the rule layer. Rule-text instructions that say "do not fabricate citations" add another token to the same form-completion practice; they do not change the structural situation in which form-only completion is what the agent does. The structural intervention — requiring the agent to traverse the actual source before composing a claim about it — changes the practice.

But the lineage's prescriptive position splits on whether any such structural fence is adequate:

- **Bender and Koller's universal-form-only critique**: any paraphrase or attestation produced by an LLM is itself form-only output. The attestation primitive requires the agent to read the source and produce a paraphrase; but the paraphrase is itself a form-completion act. On Bender and Koller's account, this does not satisfy the form/meaning gap — the agent is still manipulating form. The primitive addresses the citation-chain architecture; it does not address the deeper form-only thesis.
- **Shanahan's conditional-possibilist reading**: Shanahan's position is conditional — whether an augmented system (one with additional grounding mechanisms) could warrant fuller intentional vocabulary depends on what the augmentation provides. He does not foreclose the possibility. A per-source attestation primitive could be presented to Shanahan as one such structural augmentation — it adds a required pass through a source to the workflow.

**The split is genuine**: the two readings of what the primitive accomplishes, under the symbol-grounding framing, are not compatible within this tradition's own frame. Both positions are sourced and held.

---

### 3. Peircean triadic-sign theory — dynamic-interpretant drift masquerading as immediate-interpretant fidelity

#### Peirce's triadic sign structure

Charles Sanders Peirce's mature semiotic theory (developed through writings from 1893 to 1913, collected in *The Essential Peirce*, Vol. 2) treats the sign relation as irreducibly triadic: a Representamen (the sign vehicle) stands for an Object to an Interpretant. Neither the sign nor the object is sufficient; the triadic relation requires all three.

The Object comes in two forms, introduced by Peirce in his 1906-08 letters to Lady Welby: the **Immediate Object** (the object as the sign represents it, internal to the sign) versus the **Dynamical Object** (the object as it really is, external to the *sign* — "an object of actual *Experience*," which Peirce glosses as something "forced upon the mind in perception" and, he is explicit, not something out of the mind) [peirce-essential-peirce-vol-2]{28} (ch. 32, spring 1906, p. 478).

The Interpretant also divides — and this is the division most relevant to anchor-and-drift. In the 24-28 December 1908 excerpt:

> "It is likewise requisite to distinguish the *Immediate Interpretant,* i.e., the Interpretant represented or signified in the Sign, from the *Dynamic Interpretant,* or effect actually produced on the mind by the Sign; and both of these from the *Normal Interpretant,* or effect that would be produced on the mind by the Sign after sufficient development of thought." [peirce-essential-peirce-vol-2]{28} (ch. 32, p. 482)

The three interpretants differ in what they are relative to:
- The **Immediate Interpretant** is what the sign represents itself as meaning — the meaning the sign *presents at its surface*.
- The **Dynamic Interpretant** is what the sign actually produces in the mind — the effect the interpretation has in fact.
- The **Normal Interpretant** is the effect that *would* be produced after sufficient engagement — the ideal outcome of complete and faithful interpretation.

Peirce further specifies that a sign necessarily determines further interpretants, and those further interpretants in turn determine further signs:

> "Now it is of the essential nature of a symbol that it determines an interpretant, which is itself a symbol. A symbol, therefore, produces an endless series of interpretants. ... But every endless series must logically have a limit." [peirce-essential-peirce-vol-2]{28} (ch. 22, pp. 322-23)

The limit Peirce locates is Reality: "Reality, therefore, can only be regarded as the limit of the endless series of symbols" [peirce-essential-peirce-vol-2]{28} (ch. 22, p. 323). The chain of interpretants has a limit in the structure of the world the signs are about — Peirce's pragmatic commitment grounds the chain's terminus externally.

#### How anchor-and-drift reads under this framing

Anchor-and-drift, under the Peircean framing, is *dynamic-interpretant drift masquerading as immediate-interpretant fidelity*.

The **immediate interpretant** of a correctly-formed citation is well-grounded: the surface signal looks exactly as a correct citation should look. If a citation handle exists and follows the expected form, the sign presents itself as pointing at a real source. The agent's *immediate interpretant* — the meaning the sign presents at its surface — is satisfied.

But the **dynamic interpretant** — what the agent actually grasped — has drifted. The agent did not traverse the sign chain from handle to dynamical object (the actual source, as it really is). Instead, the agent completed the interpretant from within the association-space of its training, producing a dynamic interpretant that corresponds not to the dynamical object (the source) but to the agent's prior accumulated form-completion tendencies. The sign's dynamical object (the source's actual content) does not determine the dynamic interpretant; the interpretant is produced from elsewhere.

The **normal interpretant** — what sufficient developmental engagement with the source would produce — was never approached. A researcher who actually read the source, engaged with its structure, and traced the specific claim to its specific location would produce an interpretant constrained by the dynamical object. That is the normal interpretant's regulative ideal. Anchor-and-drift short-circuits this development: the immediate interpretant's plausible form licenses skipping the traversal.

Peirce's shop-floor grounding chain makes this concrete: asking for a piece of silk involves putting the measurement into reactive comparison with a yardstick, which by successive reactions resolves to "a certain real bar in Westminster" [peirce-essential-peirce-vol-2]{28} (ch. 22, p. 320). Each step in the chain is a real encounter with a dynamical object that constrains the next interpretant. Anchor-and-drift breaks the chain: the silk is measured by an imaginary yardstick — one assembled from form-completions that have never been put in reactive comparison with a real bar.

#### The tradition's prescriptive content

The Peircean framing prescribes: freeze a dynamic interpretant against which synthesis-time interpretants can be checked. The per-source attestation primitive, read in this register, operates as such a frozen dynamic interpretant — an authored paraphrase produced through actual engagement with the dynamical object (the source), against which later synthesis can be held. An attestation records what the dynamic interpretant actually was when the source was engaged; it is not a normal interpretant (which would require sufficient developmental engagement), but it is a grounded dynamic interpretant, produced by actual encounter rather than form-completion.

A further discipline-extension the Peircean framing makes available: an explicit marker on attestation files indicating "this is a best-available dynamic interpretant, not claimed to be a normal interpretant." Such a marker would acknowledge that the attestation captures what one engagement produced, while flagging that further engagement with the source could produce a different (and better-constrained) dynamic interpretant.

---

## Why the convergence is structural

Three traditions reaching the same diagnostic shape from different starting points — a Genevan structuralist account of sign-system closure, an American cognitive-science account of symbol grounding, and a pragmatist account of sign chains with dynamical objects — is a form of structural confirmation that no single tradition's vocabulary provides alone. The failure is not an accident of any particular framework's terminology; it has a shape that multiple distinct frameworks can reach independently.

This is the point the position asserts and wants to preserve: the convergence is at the shape diagnosed, not at what each tradition takes the shape to imply. The Saussurean framing says convention is what couples signal to signification, and re-establishing convention is what the repair requires. The symbol-grounding framing says form-only completion cannot produce genuine grounding, and structural workflow changes are required — but then splits on whether any such change is sufficient. The Peircean framing says the dynamic interpretant must be produced by actual encounter with the dynamical object, not by form-completion from elsewhere.

These are different claims about what the failure is and what fixes it. They cannot be merged into a single prescription without losing what each says.

---

## The Wittgensteinian substrate that makes the primitive operative

ARD's per-source attestation primitive does not derive its rationale from any one of the three traditions above. Its rationale rests on a different substrate: the Wittgensteinian insight that *meaning is constituted by practice*, not by any single internal state or rule.

Wittgenstein's *Philosophical Investigations* argues that following a rule is a practice (§202), not an interpretation (§201):

> "To obey a rule, to make a report, to give an order, to play a game of chess, are customs (uses, institutions). To understand a sentence means to understand a language. To understand a language means to be master of a technique." [wittgenstein-philosophical-investigations]{29} (§199)

And the famous formulation of what agreement in language consists of:

> "So you are saying that human agreement decides what is true and what is false?" — It is what human beings say that is true and false; and they agree in the language they use. That is not agreement in opinions but in form of life." [wittgenstein-philosophical-investigations]{29} (§241)

Bender and Koller invoke this explicitly when they distinguish what "meaning is use" actually means: "the slogan 'meaning is use' ... refers not to 'use' as 'distribution in a text corpus' but rather that language is *used* in the real world to convey communicative intents to real people" [bender-koller-climbing-towards-nlu]{15} (§7). Distributional frequency in a training corpus is not the practice that constitutes meaning; the actual communicative use — grounded in shared world and communicative intent — is.

The attestation primitive works, in this register, because it changes the *practice*: it requires an agent to traverse the actual source and produce a paraphrase grounded in what the source says, rather than completing the token sequence from statistical association. It is not an additional rule-text token competing with other rule-text tokens; it is a structural change to what is done. Under the Wittgensteinian framing, a structural change to practice is what changes meaning — which is why the primitive operates across all three of the tradition-specific framings above, even though none of them alone would have generated it.

---

## What this position does not commit to

**Not a unified position across the three traditions.** The diagnostic shape is shared; the prescriptions are not. Paraphrasing the three framings into one would produce a composite that misrepresents all three.

**Not a claim that these three framings exhaust the cross-tradition convergence.** Other semiotic traditions may converge on the same shape — the sign theories of Charles Morris and Umberto Eco are plausible candidates — but they were **not engaged in this corpus** and are not attested here. They are noted only as directions a later pass might pursue, not as sourced findings.

**Not a claim that the per-source attestation primitive resolves the form-only critique.** Bender and Koller's universal-form-only critique applies to the attestation paraphrase itself (a form-only output). The primitive addresses the *citation-chain architecture*; it does not, under Bender and Koller's framing, close the form/meaning gap. This is a genuine boundary of the argument.

**Not a claim that any single reading captures the correct "interpretation" of anchor-and-drift.** The three framings do different analytic work. Using all three simultaneously is more illuminating than choosing one.

---

## Disconfirming analysis

The main disconfirming pressure would be: does the convergence *actually hold*, or is it an artifact of selecting framings that happen to fit? The counter-reading is that the Saussurean framing requires a closed, synchronic system — which a research corpus managed over time is not — and that Peirce's chain-with-limit picture presupposes a convergence toward Reality that the epistemic situation of research may not provide. These are genuine pressures.

They do not undermine the diagnostic convergence (all three traditions identify the signal/signification or form/grounding or immediate-interpretant/dynamic-interpretant break). They do complicate any prescriptive reading that treats the three framings as supporting the same remedy. This complication is preserved above: the prescriptions diverge.

A second disconfirming pressure: Shanahan explicitly *disclaims* the universal-form-only thesis. If the symbol-grounding lineage's prescriptive position splits between Bender-Koller and Shanahan, then citing the "lineage" as having a single view misrepresents it. This position preserves the split explicitly and does not paper it over.

---

## Contradictions

**Within the symbol-grounding lineage on prescriptive sufficiency:**
- Bender and Koller (2020): No architectural augmentation lifts a form-only system to meaning. An attestation primitive that requires form-only paraphrase does not satisfy the grounding requirement. [bender-koller-climbing-towards-nlu]{15}
- Shanahan (2022/2023): The argument applies to *current* systems; a system with additional grounding mechanisms could in principle warrant fuller intentional vocabulary. [shanahan-talking-about-llms]{17}

These are not compatible within the form/meaning framing the lineage shares. Both are held.

**Within the Peircean framing on the limit of the interpretant chain:**
Peirce himself holds both (a) that a symbol produces an endless series of interpretants and (b) that every endless series must logically have a limit, which he locates in Reality [peirce-essential-peirce-vol-2]{28} (ch. 22, pp. 322-23). A contrasting reading of Peirce's limit-clause — locating the limit other than in asymptotic convergence on Reality — is associated with Eco but is not attested in this corpus. These two readings of the limit-clause have different implications for what "sufficient developmental engagement" would produce. The position uses the immediate/dynamic/normal interpretant axis for its practical application; the limit-axis carries this unresolved reading difference and is not merged.

---

## Revisit if

- The symbol-grounding lineage produces a successor paper that engages Brandom's inferentialism on LLM token-meaning at substantive depth. Inferentialism (meaning constituted by inferential role, not by causal grounding) would add a fourth tradition to the convergence — and might change what "adequate repair" looks like.
- Further Peirce engagement (the Collected Papers, particularly volumes 2, 4, and 8, on the interpretant and the limit-clause) resolves the within-Peirce reading difference. The Peircean framing would sharpen.
- A deployment finds that the three-framings posture cannot be operationalized without merger — that any practical implementation collapses the three into a unified prescription. The boundary between "diagnostic convergence" and "prescriptive convergence" would then need to be re-examined.
- An adopter encounters a fabrication failure that one of the three tradition-specific framings would not have predicted. The framing would need to be checked against the new failure's shape.

---

## Sources

- **[saussure-course-in-general-linguistics]{27}** — Ferdinand de Saussure, *Course in General Linguistics* (*Cours de linguistique générale*, posthumous 1916; compiled by Charles Bally and Albert Sechehaye from lecture notes, 1906–11). Engaged in the Roy Harris English translation, Bloomsbury Revelations 2013 edition (first published 1983), which retains the standard Payot 1922 second-edition pagination in margin brackets. Engaged sections: Introduction ch.3–4; Part One (all three chapters); Part Two ch.3–5 (pp.[25]–[174] in the standard pagination). Primary engagement: the sign as dyad (pp.[98]–[101]); invariability under arbitrariness (pp.[107]–[109]); language as form not substance (pp.[155]–[157]); value as differential (pp.[160]–[167]).

- **[harnad-symbol-grounding-problem]{14}** — Stevan Harnad, "The Symbol Grounding Problem," *Physica D* 42 (1990), pp. 335–346. Available at arXiv (cs/9906002). Engaged: abstract; §2 (the symbol grounding problem — Chinese Room, Chinese/Chinese Dictionary-Go-Round, connecting to the world); §3 (iconic and categorical representations); §5 (conclusions); footnote 6 ("hermeneutic hall of mirrors").

- **[bender-koller-climbing-towards-nlu]{15}** — Emily M. Bender and Alexander Koller, "Climbing towards NLU: On Meaning, Form, and Understanding in the Age of Data," *Proceedings of the 58th Annual Meeting of the Association for Computational Linguistics* (ACL 2020), pp. 5185–5198. Available at ACL Anthology. Engaged: §1 (introduction); §3 (what is meaning — form/meaning definition; symbol grounding problem reference); §4 (the octopus test); §7 (distributional semantics; Wittgenstein on meaning-as-use); §9 (counterarguments).

- **[bender-stochastic-parrots]{16}** — Emily M. Bender, Timnit Gebru, Angelina McMillan-Major, and Shmargaret Shmitchell, "On the Dangers of Stochastic Parrots: Can Language Models Be Too Big?" *Proceedings of the 2021 ACM Conference on Fairness, Accountability, and Transparency* (FAccT '21), pp. 610–623. Engaged: §1 (introduction); §5 (down the garden path — form/meaning argument; Saussure citation); §6.1 (coherence in the eye of the beholder; stochastic parrot definition).

- **[shanahan-talking-about-llms]{17}** — Murray Shanahan, "Talking About Large Language Models," arXiv:2212.03551v5 (December 2022, revised February 2023). Engaged: §2 (what LLMs really do; Wittgenstein citation on language as collective behaviour); §3 (LLMs and the intentional stance; the paper's conditional scope); §5 (do LLMs really know anything?); §13 (conclusion; "form of life" Wittgenstein reference).

- **[mitchell-krakauer-debate-over-understanding-llms]{18}** — Melanie Mitchell and David C. Krakauer, "The Debate Over Understanding in AI's Large Language Models," arXiv:2210.13966v3 (2023). Engaged: the three-question framing (category-error / concept-based / functionally-equivalent); the Michael et al. NLP community survey (51%/49% split); the functional-equivalence possibility.

- **[peirce-essential-peirce-vol-2]{28}** — Charles Sanders Peirce, *The Essential Peirce*, Volume 2 (1893–1913), ed. Peirce Edition Project (Nathan Houser, Christian Kloesel et al.), Indiana University Press, 1998. Engaged semiotic essays: ch. 2 (*What Is a Sign?*, 1894); ch. 21 (*Nomenclature and Divisions of Triadic Relations*, 1903 Syllabus); ch. 22 (*New Elements*, 1904); ch. 32 (*Excerpts from Letters to Lady Welby*, 1906–08). Primary engagement: the Representamen/Object/Interpretant triad (ch. 21, pp. 290–91); the Immediate/Dynamic/Normal Interpretant distinction (ch. 32, pp. 482); the Immediate/Dynamical Object distinction (ch. 32, p. 478); the endless-series-with-limit passage (ch. 22, pp. 322–23).

- **[wittgenstein-philosophical-investigations]{29}** — Ludwig Wittgenstein, *Philosophical Investigations*, 3rd edition, trans. G. E. M. Anscombe, Blackwell, 1953 (Part I complete by 1945; Part II written 1946–49). Engaged: §§1–7 (Augustinian picture; language-game introduced); §§19–23 (form of life; multiplicity of language-games); §§185–202 (rule-following; practice); §§217–242 (bedrock; agreement in form of life). Primary engagement for this position: §199 (obeying a rule is a custom/practice); §201–§202 (practice, not interpretation: "obeying a rule is a practice"); §241 (agreement in form of life, not opinions).
