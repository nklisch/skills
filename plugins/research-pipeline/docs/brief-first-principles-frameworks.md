---
description: "Domain brief on established first-principles thinking frameworks — classical and modern — distilled into actionable thinking moves for the primer"
type: brief
updated: 2026-04-14
---

# Brief: First-Principles Thinking Frameworks

## Purpose

This brief surveys established frameworks for first-principles reasoning — classical and modern — and distills them into concrete, actionable thinking moves. It feeds directly into the first-principles primer (`skills/docs/first-principles.md`), which will be referenced by thinking-heavy build process skills (`/research`, `/ideate`, `/architecture`).

The goal is not a philosophy survey. It's a curated inventory of **what works, why it works, and how to apply it** — specifically for software design, domain research, and knowledge systems.

---

## Frameworks Investigated

### 1. Aristotelian First Principles

**Origin:** Aristotle, *Posterior Analytics* and *Metaphysics* (4th century BCE).

**Core idea:** Knowledge is built upward from *archai* — first principles that are irreducible and self-evident. "In every systematic inquiry where there are first principles, or causes, or elements, knowledge and science result from acquiring knowledge of these." The law of non-contradiction ("the same attribute cannot both belong and not belong to the same subject at once") is the most fundamental example.

**Method:** Move from what's familiar to what's fundamental. Decompose complex phenomena into their basic elements. Then build understanding upward through demonstration — each conclusion grounded in the principles beneath it.

**Actionable move: Decompose to Fundamentals.** Before forming opinions about a domain, break it into its irreducible components. What are the basic elements? What can't be broken down further? Build understanding from those elements upward.

**Source:** [Wikipedia: First Principle](https://en.wikipedia.org/wiki/First_principle), [IEP: Aristotle's Epistemology](https://iep.utm.edu/aristotle-epistemology/)

---

### 2. Descartes' Methodical Doubt

**Origin:** René Descartes, *Meditations on First Philosophy* (1641).

**Core idea:** Systematically doubt everything that can be doubted. Whatever survives radical skepticism is genuinely known; everything else is assumption. The method strips away uncertain beliefs layer by layer until reaching bedrock certainty ("Cogito, ergo sum").

**Method:** Three steps: (1) Question everything acquired through senses — if they've deceived you once, they're suspect. (2) Extend skepticism to rational thought — even mathematical truths could be undermined. (3) What remains after total doubt is your foundation.

**Actionable move: Doubt What You Know.** For each thing you believe is true about a domain, ask: can I doubt this? What's the source? Has the source been wrong before? What survives skepticism is genuine knowledge; everything else is assumption that needs verification.

**Application to our work:** When researching a domain, separate what you *know* from what you *assume*. Training data, past experience, and "common knowledge" are all candidates for doubt. Only verified, sourced claims count as foundations.

**Source:** [Britannica: Methodic Doubt](https://www.britannica.com/topic/methodic-doubt), [SEP: Descartes' Epistemology](https://plato.stanford.edu/entries/descartes-epistemology/)

---

### 3. Socratic Questioning

**Origin:** Socrates, as recorded by Plato (5th century BCE). Formalized in modern education and cognitive therapy.

**Core idea:** Disciplined questioning that pursues thought in many directions — to explore complex ideas, uncover assumptions, analyze concepts, distinguish what we know from what we don't, and follow out logical consequences.

**The six question types (ascending depth):**

1. **Clarification** — "What do you mean by that? Could you explain further?" Purpose: surface vague thinking.
2. **Probing assumptions** — "Is this always the case? What if the opposite were true?" Purpose: test foundational beliefs.
3. **Probing evidence** — "What evidence supports this? Is there reason to doubt it?" Purpose: demand justification.
4. **Exploring alternatives** — "What might someone else think? What's the counter-argument?" Purpose: broaden perspective.
5. **Tracing implications** — "If this is true, what else follows? What are the consequences?" Purpose: follow logical chains.
6. **Meta-questioning** — "Why are we asking this question? Which questions proved most useful?" Purpose: improve the inquiry itself.

**Actionable move: Question Deeply.** Apply structured questioning to any domain investigation. Start with clarification, escalate through assumption-probing and evidence-probing, explore alternatives, trace implications, and reflect on the quality of your questions. The six types form a complete toolkit for deep inquiry.

**Source:** [Wikipedia: Socratic Questioning](https://en.wikipedia.org/wiki/Socratic_questioning), [Colorado State: The Socratic Method](https://tilt.colostate.edu/the-socratic-method/)

---

### 4. Musk's Physics-Based Reasoning

**Origin:** Elon Musk, applied at SpaceX, Tesla, and other ventures. Explicitly draws on physics training.

**Core idea:** "Boil things down to the most fundamental truths and reason up from there, as opposed to reasoning by analogy." Most people reason by analogy — "we do this because it's like something else that was done." First-principles reasoning asks "what are we sure is true?" and builds from there.

**The key distinction — analogy vs. first principles:**
- **Analogy:** "Rockets have always cost $65M, so rockets cost $65M." Mentally easy, limited by precedent.
- **First principles:** "What is a rocket made of? What do those materials cost on the commodity market?" Reveals that materials are ~2% of the typical price. Mentally harder, enables breakthrough.

**Method:** (1) Identify the problem. (2) Break down to physical/material fundamentals. (3) Check actual costs/constraints at the fundamental level. (4) Rebuild from there, unconstrained by convention.

**Battery example in full:** Conventional wisdom said battery packs cost $600/kWh "because that's what they've historically cost." Musk decomposed: what are the constituent materials (cobalt, nickel, aluminum, carbon, polymers, steel)? What do they cost on the London Metal Exchange? Answer: ~$80/kWh. The 7.5x gap was convention, not physics.

**Actionable move: Decompose to Fundamentals (applied).** When evaluating a domain, don't start with "how does the existing solution work?" Start with "what does this domain fundamentally require?" Separate the actual constraints (physics, logic, data) from the inherited ones (convention, precedent, "how it's always been done").

**Source:** [James Clear: First Principles](https://jamesclear.com/first-principles), [Farnam Street: First Principles](https://fs.blog/first-principles/)

---

### 5. Munger's Mental Models / Latticework

**Origin:** Charlie Munger, vice chairman of Berkshire Hathaway. Influenced by multiple disciplines.

**Core idea:** "All the wisdom in the world is not to be found in one little academic department." Build a "latticework" of mental models drawn from diverse disciplines (psychology, economics, biology, physics, history, mathematics). The real power comes not from isolated models but from combining and overlaying them.

**Key principle:** Reduce blind spots by looking at problems through multiple lenses. A single model creates a single perspective; multiple models reveal what any single one misses.

**Actionable move: Apply Multiple Lenses.** When investigating a domain or making a design decision, deliberately look at it from multiple perspectives. What does this look like from a data perspective? A user perspective? A systems perspective? An economic perspective? No single lens is complete.

**Source:** [ModelThinkers: Munger's Latticework](https://modelthinkers.com/mental-model/mungers-latticework), [Farnam Street](https://fs.blog/first-principles/)

---

### 6. Inversion (Munger / Jacobi)

**Origin:** Carl Gustav Jacobi (mathematician): "Invert, always invert." Popularized by Charlie Munger.

**Core idea:** Instead of asking "how do I achieve X?", ask "what would guarantee I fail at X?" Then avoid those things. "It is remarkable how much long-term advantage [we] have gotten by trying to be consistently not stupid, instead of trying to be very intelligent."

**Two forms:**
1. **Goal inversion:** Want innovation? Ask "what kills innovation?" (bureaucracy, fear of failure, information silos). Avoid those.
2. **Pre-mortem:** Before starting a project, imagine it has failed. What went wrong? Use that to prevent failure.

**Practical examples:**
- Want to speed up research? Ask "how could I make this process slower?" (be disorganized, lose track of sources, fail to take notes). Do the opposite.
- Want a robust architecture? Ask "what would make this architecture fragile?" (tight coupling, hidden dependencies, single points of failure). Avoid those.

**Actionable move: Invert the Problem.** For any goal or design decision, flip it. Ask "what would make this fail?" Identify the failure modes, then design to avoid them. Subtractive thinking often reveals what additive thinking misses.

**Source:** [Farnam Street: Inversion](https://fs.blog/inversion/), [ModelThinkers: Inversion](https://modelthinkers.com/mental-model/inversion)

---

### 7. Popper's Falsification / Scientific Method

**Origin:** Karl Popper, *The Logic of Scientific Discovery* (1934).

**Core idea:** A theory is scientific if and only if it makes predictions that could be contradicted by evidence. Science should attempt to *disprove* theories, not confirm them. The willingness to be proven wrong is the hallmark of honest inquiry.

**Key asymmetry:** Observing 1,000 white swans doesn't prove "all swans are white." One black swan disproves it. Confirmation is weak; falsification is strong.

**The key question:** "What would it take to show this is false?"

**Method:** (1) Form a hypothesis. (2) Deduce testable predictions. (3) Design tests that could *disprove* the hypothesis (not just confirm it). (4) If it survives, it's provisionally accepted — not proven.

**Actionable move: Seek Falsification.** For each conclusion, design, or assumption, ask "what would prove this wrong?" Actively look for disconfirming evidence. If you can't articulate what would disprove your idea, you don't understand it well enough.

**Source:** [SEP: Karl Popper](https://plato.stanford.edu/entries/popper/), [Simply Psychology: Falsification](https://www.simplypsychology.org/karl-popper.html)

---

### 8. Second-Order Thinking

**Origin:** Howard Marks (investor), popularized by Farnam Street. Related to systems thinking.

**Core idea:** First-order thinking asks "what's the immediate result?" Second-order thinking asks "and then what?" Most people stop at first-order effects. The ripple effects — across time, across stakeholders — are where the real consequences live.

**Method:** (1) Identify the immediate effect of a decision. (2) Ask "and then what?" for each first-order effect. (3) Continue to 2nd and 3rd order. (4) Consider effects across time horizons (10 minutes, 10 months, 10 years).

**Why it matters:** First-order thinking produces similar conclusions for everyone (it's obvious). Second-order thinking reveals hidden patterns — it's where insight lives.

**Actionable move: Trace Consequences.** For each design decision, architectural choice, or research conclusion, ask "and then what?" at least twice. Map the ripple effects. What second-order consequences would this create? What feedback loops does it establish?

**Source:** [Farnam Street: Second-Order Thinking](https://fs.blog/second-order-thinking/)

---

### 9. Five Whys (Toyota / Ohno)

**Origin:** Sakichi Toyoda, formalized by Taiichi Ohno in the Toyota Production System.

**Core idea:** When something goes wrong (or when investigating a domain), ask "why?" iteratively — typically five times — to move from symptoms to root causes. The analysis must always end at a *system, process, or structural cause*, never at a person.

**Key principle:** "A problem you fix at the symptom level will recur. A problem you fix at the root cause level stays fixed."

**Method:** Start with the observed problem. Ask "why?" The answer becomes the next "why?" Continue until you reach a structural/system-level cause. The number five is a guideline, not a rule — sometimes three is enough, sometimes you need seven.

**Important constraint:** Root causes are always about systems. Individuals operate within systems; the system is what you can redesign.

**Actionable move (merged with Socratic Questioning into "Question Deeply"):** Use iterative "why?" questioning to drill past symptoms to root causes. Don't stop at the first plausible answer. Keep going until you hit a structural explanation.

**Source:** [Wikipedia: Five Whys](https://en.wikipedia.org/wiki/Five_whys), [OrcaLean: Toyota 5 Whys](https://www.orcalean.com/article/how-toyota-is-using-5-whys-method)

---

### 10. Feynman Technique / Algorithm

**Origin:** Richard Feynman, Nobel Prize-winning physicist.

**Two related techniques:**

**The Feynman Technique (learning/understanding):**
1. Choose a concept.
2. Explain it as if teaching a non-expert.
3. Identify gaps where your explanation breaks down.
4. Go back and fill the gaps, then simplify further.

**The Feynman Algorithm (problem-solving):**
1. Simplify the problem to its "essential puzzle" by asking basic questions: "What is the simplest example? How can you tell if the answer is right?"
2. Build a library of unsolved problems. When you learn new techniques, test them against the library.

**Core principle:** True understanding reveals itself through clear, simple explanation. If you can't explain it simply, you don't understand it yet — and the gaps in your explanation point to the gaps in your understanding.

**Actionable move: Test Your Understanding.** After researching a domain, try to explain your findings simply. Where does your explanation get vague or hand-wavy? Those are the gaps. Go back and fill them before building on the knowledge.

**Source:** [Farnam Street: Algorithm for Solving Problems](https://fs.blog/an-algorithm-for-solving-problems/), [Todoist: Feynman Technique](https://www.todoist.com/inspiration/feynman-technique)

---

### 11. Systems Thinking (Meadows)

**Origin:** Donella Meadows, *Thinking in Systems* (2008). Building on work by Jay Forrester and the Club of Rome.

**Core idea:** The world is made of interconnected systems driven by stocks, flows, feedback loops, delays, and leverage points. Most people intervene at parameters (the lowest-leverage point). The highest leverage comes from changing paradigms, goals, and rules.

**Meadows' 12 leverage points (least to most effective):**
12. Constants and parameters (tax rates, standards)
11. Buffer sizes (reserves, inventory)
10. Physical structure (infrastructure, networks)
9. Delays (time between action and feedback)
8. Negative feedback loops (self-correcting mechanisms)
7. Positive feedback loops (self-reinforcing cycles)
6. Information flows (who knows what)
5. Rules (laws, incentives, constraints)
4. Self-organization (ability to evolve new structures)
3. Goals (what the system aims for)
2. Paradigms (shared beliefs underlying the system)
1. Transcending paradigms (flexibility across worldviews)

**Key insight for our work:** Most architecture and design debates happen at the parameter level (which framework? which database? which API pattern?). The highest-leverage decisions are about goals (what is this system *for*?), rules (what constraints does it operate under?), and information flows (who knows what, when?).

**Actionable move: Find Leverage Points.** When analyzing a domain or designing a system, ask: where does a small change produce a large effect? Are we debating parameters when we should be questioning goals or rules? Intervene at the highest leverage point accessible.

**Source:** [Donella Meadows Project: Leverage Points](https://donellameadows.org/archives/leverage-points-places-to-intervene-in-a-system/), [Wikipedia: Twelve Leverage Points](https://en.wikipedia.org/wiki/Twelve_leverage_points)

---

### 12. Kahneman's Dual Process Theory

**Origin:** Daniel Kahneman, *Thinking, Fast and Slow* (2011).

**Core idea:** Two cognitive systems operate in parallel:
- **System 1:** Fast, automatic, intuitive. Runs 96% of thinking. Produces cognitive biases.
- **System 2:** Slow, deliberate, analytical. Requires effort. Produces careful reasoning.

**Key biases that undermine deep thinking:**
- **WYSIATI ("What You See Is All There Is"):** System 1 builds judgments from what's immediately available and systematically ignores what's absent. *This is the primary mechanism of shallow research.*
- **Confirmation bias:** System 1 looks for information that confirms existing beliefs, not information that challenges them.
- **Anchoring:** First piece of information encountered disproportionately influences subsequent reasoning.
- **Availability heuristic:** What comes easily to mind (training data, recent experience) is treated as representative.

**The problem:** System 2 is lazy. You only engage it when you genuinely have to. Most thinking defaults to System 1 — fast, automatic, and full of blind spots.

**Actionable move: Check Your Thinking Mode.** Periodically ask: am I in System 1 right now? Am I reasoning from what's immediately available (WYSIATI) rather than from what's actually true? Am I confirming my existing beliefs or genuinely investigating? The most valuable application of this move is recognizing *when* to slow down and shift to deliberate analysis.

**Source:** [The Decision Lab: System 1 and System 2](https://thedecisionlab.com/reference-guide/philosophy/system-1-and-system-2-thinking), [Farnam Street: Kahneman](https://fs.blog/daniel-kahneman-the-two-systems/)

---

### 13. Abductive Reasoning (Peirce)

**Origin:** Charles Sanders Peirce, late 19th century.

**Core idea:** Given a surprising observation, generate the hypothesis that best explains it, then test that hypothesis. Unlike deduction (certainty from premises) or induction (generalization from examples), abduction generates *new hypotheses* from incomplete evidence. "Inference to the best explanation."

**Method:** (1) Observe something surprising or unexplained. (2) Generate candidate hypotheses. (3) Evaluate which hypothesis best explains the evidence (economy, simplicity, explanatory power). (4) Deduce testable predictions from the best hypothesis. (5) Test them.

**Key principle:** Abductive conclusions are provisional — "best available," not "proven." The purpose is to generate hypotheses worth testing, not to establish truth.

**Actionable move (merged with Falsification into "Seek Falsification"):** When you encounter something surprising in a domain, generate hypotheses. Pick the best explanation and test it — but hold it provisionally, not as truth.

**Source:** [SEP: Abduction](https://plato.stanford.edu/entries/abduction/), [Wikipedia: Abductive Reasoning](https://en.wikipedia.org/wiki/Abductive_reasoning)

---

### 14. Metacognition

**Origin:** John Flavell (1979), educational psychology research.

**Core idea:** Thinking about your own thinking. Three phases: (1) **Plan** — choose a strategy before starting. (2) **Monitor** — track whether the strategy is working during the work. (3) **Evaluate** — assess effectiveness after completing the work.

**Why it matters:** Research shows metacognitive strategies produce +8 months of additional learning progress. The mechanism: people who monitor their own thinking catch errors, switch strategies when stuck, and allocate effort where it matters.

**Actionable move (merged with Kahneman into "Check Your Thinking Mode"):** Before starting a thinking-heavy phase, plan your approach. During the work, monitor: is this working? Am I going deep enough? After, evaluate: what did I miss? What would I do differently?

**Source:** [EEF: Metacognition and Self-Regulation](https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/metacognition-and-self-regulation)

---

## Failure Modes and Limitations

These are well-documented and must be addressed in the primer.

### 1. Wrong Level of Abstraction
You can reason correctly from first principles but at the wrong level — your logic is sound, but your conclusions don't connect to reality because you decomposed too far or not far enough. (Source: [Commoncog](https://commoncog.com/how-first-principles-thinking-fails/))

### 2. Wrong Set of Principles
You select principles that are individually true but collectively incomplete. The reasoning is valid; the premises are insufficient. "The only real test you have is against reality." (Source: [Commoncog](https://commoncog.com/how-first-principles-thinking-fails/))

### 3. Analysis Paralysis
Over-decomposition. Questioning everything without converging on conclusions. The cost is time and momentum — first-principles thinking without a stopping condition becomes infinite regression.

### 4. Reinventing the Wheel
Ignoring valid prior art in pursuit of "pure" first-principles reasoning. Established patterns exist for a reason. The goal is to *understand* why they exist, not to reject them by default.

### 5. Novice Trap
Beginners should learn established approaches before attempting to reason from scratch. First-principles thinking is most powerful when you have enough domain knowledge to decompose effectively. Without that knowledge, decomposition produces shallow or wrong results.

### 6. System 1 Override
Cognitive biases pull you back to shallow thinking even when you intend to think deeply. WYSIATI, confirmation bias, and anchoring are the primary culprits. The antidote is deliberate metacognition. (Source: Kahneman)

### 7. The Asymmetry Principle
**The cost of not going deep enough is much higher than the cost of going too deep.** Shallow thinking that calcifies into architecture causes rewrites. Extra time spent on deep thinking costs tokens. When in doubt, go deeper.

---

## Distilled Thinking Moves

These are the candidate moves for the primer, synthesized from all frameworks above:

| # | Move | Source Frameworks | Core Operation |
|---|------|-------------------|----------------|
| 1 | **Decompose to Fundamentals** | Aristotle, Musk | Break the problem to irreducible components before forming conclusions |
| 2 | **Question Deeply** | Socratic Method, Five Whys | Structured questioning: clarify → assumptions → evidence → alternatives → implications → meta |
| 3 | **Doubt What You Know** | Descartes | Separate verified knowledge from assumption. What survives skepticism? |
| 4 | **Invert the Problem** | Munger, Jacobi | Ask "what would guarantee failure?" and avoid it |
| 5 | **Seek Falsification** | Popper, Peirce | Ask "what would prove this wrong?" Try to disprove before building on |
| 6 | **Trace Consequences** | Second-Order Thinking | Ask "and then what?" Map 1st, 2nd, 3rd order effects across time |
| 7 | **Find Leverage Points** | Meadows | Where does a small change produce a large effect? Intervene there |
| 8 | **Apply Multiple Lenses** | Munger's Latticework | Look from multiple disciplines/perspectives. No single lens is complete |
| 9 | **Test Your Understanding** | Feynman | Explain it simply. Where explanation breaks = where understanding is missing |
| 10 | **Check Your Thinking Mode** | Kahneman, Metacognition | Am I in System 1? Am I reasoning from habit? When in doubt, slow down |

---

## Implementation Notes

**For the primer's architecture:**
- Each thinking move should include: what it is, why it matters, how to apply it, and a concrete example relevant to our work (software design, domain research, knowledge systems).
- The workflow section should provide a lightweight rhythm — not a rigid sequence — showing how these moves apply at different pipeline phases.
- The failure modes section should be prominent, not an afterthought. The guardrails matter as much as the moves.
- The guiding principle "when in doubt, go deeper" should be stated early and reinforced.

**For skill integration:**
- Consumer skills (`/research`, `/ideate`, `/architecture`) should include a directive: "Read `skills/docs/first-principles.md` for consideration before beginning your work."
- The primer should be self-contained — readable and applicable without needing the consumer skill's context.

**Open questions for architecture:**
- How much context-specific guidance per move? (Software vs. research vs. knowledge systems — same move, different examples?)
- Should the workflow section provide different rhythms for different consumer skills, or one universal rhythm?
- How do we handle the "novice trap" for autonomous agents? They don't have domain experience to draw on — the primer may need to address this explicitly.

---

## Sources

### Classical Philosophy
- [Wikipedia: First Principle](https://en.wikipedia.org/wiki/First_principle)
- [IEP: Aristotle's Epistemology](https://iep.utm.edu/aristotle-epistemology/)
- [Britannica: Methodic Doubt](https://www.britannica.com/topic/methodic-doubt)
- [SEP: Descartes' Epistemology](https://plato.stanford.edu/entries/descartes-epistemology/)
- [Wikipedia: Socratic Questioning](https://en.wikipedia.org/wiki/Socratic_questioning)

### Modern Applied Reasoning
- [Farnam Street: First Principles](https://fs.blog/first-principles/)
- [James Clear: First Principles — Elon Musk](https://jamesclear.com/first-principles)
- [ModelThinkers: Munger's Latticework](https://modelthinkers.com/mental-model/mungers-latticework)
- [Farnam Street: Inversion](https://fs.blog/inversion/)
- [Farnam Street: Second-Order Thinking](https://fs.blog/second-order-thinking/)

### Scientific Method
- [SEP: Karl Popper](https://plato.stanford.edu/entries/popper/)
- [Simply Psychology: Falsification](https://www.simplypsychology.org/karl-popper.html)
- [SEP: Abduction](https://plato.stanford.edu/entries/abduction/)

### Systems and Cognitive Science
- [Donella Meadows Project: Leverage Points](https://donellameadows.org/archives/leverage-points-places-to-intervene-in-a-system/)
- [The Decision Lab: System 1 and System 2](https://thedecisionlab.com/reference-guide/philosophy/system-1-and-system-2-thinking)
- [EEF: Metacognition](https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/metacognition-and-self-regulation)

### Software-Specific
- [Addy Osmani: First Principles for Software Engineers](https://addyosmani.com/blog/first-principles-thinking-software-engineers/)

### Failure Modes
- [Commoncog: How First Principles Thinking Fails](https://commoncog.com/how-first-principles-thinking-fails/)
- [Farnam Street: First Principles](https://fs.blog/first-principles/) (effort barrier, limiting beliefs)
