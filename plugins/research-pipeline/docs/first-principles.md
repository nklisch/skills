---
description: "Thinking methodology primer — 10 moves for deep, first-principles reasoning during research, ideation, and architecture"
type: primer
updated: 2026-04-14
---

# Thinking with First Principles

A practical toolkit for deep thinking. 10 moves drawn from Aristotle, Descartes, Socrates, Munger, Popper, Feynman, Meadows, and Kahneman — distilled into concrete operations you can apply during any thinking-heavy phase of the build process.

**How to use this:** Read before beginning thinking-heavy work (`/research`, `/ideate`, `/architecture`). Apply the moves that fit the context. Follow the rhythm as a default, not a rule.

**The Asymmetry Principle:** The cost of not going deep enough is much higher than the cost of going too deep. Shallow thinking that calcifies into architecture causes rewrites. Extra time spent on deep thinking costs tokens. **When in doubt, go deeper.**

---

## Thinking Moves

### Open — decompose the problem

#### 1. Decompose to Fundamentals
Break the problem into its irreducible components before forming conclusions.

**Why:** Without decomposition, you inherit the structure of whatever you looked at first — someone else's framing, a familiar pattern, a precedent. You end up reasoning by analogy instead of from the actual problem.
**How:** Ask "what are the fundamental components of this problem?" Then for each component: "can this be broken down further?" Stop when you reach elements that are self-evident or empirically verifiable. Build understanding upward from there.
**Example:** When researching a data pipeline, don't start with "how does Airflow work." Start with: what data exists? Where does it come from? What transformations are required? What are the actual latency and correctness requirements? Then evaluate tools against those fundamentals.

#### 2. Question Deeply
Use structured questioning to move from surface understanding to bedrock.

**Why:** The first answer is almost never the deepest answer. Stopping at surface-level understanding produces surface-level research that propagates into surface-level architecture.
**How:** Apply six question types in ascending depth: (1) **Clarify** — "what exactly does this mean?" (2) **Probe assumptions** — "is this always true? what if the opposite were true?" (3) **Probe evidence** — "what supports this? is there reason to doubt it?" (4) **Explore alternatives** — "what would someone with a different background think?" (5) **Trace implications** — "if this is true, what else must follow?" (6) **Meta-question** — "are we asking the right questions?" Also use iterative "why?" — keep asking why until you hit a structural or system-level cause, not a surface symptom.
**Example:** Investigating an API that returns inconsistent results. Don't stop at "the API is flaky." Why is it flaky? What are the actual consistency guarantees? What does the documentation promise vs. what we observe? What would a different mental model of this API's behavior explain?

#### 3. Doubt What You Know
Separate verified knowledge from assumption. What survives skepticism?

**Why:** The most dangerous assumptions are the ones nobody thinks to question — "everyone knows" claims, training data, past experience applied to new contexts. Unquestioned assumptions become invisible constraints.
**How:** For each thing you believe about a domain, ask: what's the source? Has the source been wrong before? Am I applying experience from a different context? Would this still be true if the context changed? Only verified, sourced claims count as foundations.
**Example:** "This database handles joins efficiently" — is that always true? For what data volumes? With what table structures? What does the documentation actually say about join performance at your scale? Verify before designing around the assumption.

---

### Challenge — stress-test your thinking

#### 4. Invert the Problem
Ask "what would guarantee failure?" and avoid it.

**Why:** Additive thinking has blind spots — you focus on what to do and miss what to avoid. Subtractive thinking surfaces risks, failure modes, and anti-patterns that forward thinking misses entirely.
**How:** For any goal or decision, flip it. "What would make this architecture fragile?" "What would make this research useless?" "What would guarantee this project fails?" List the answers, then design to avoid each one. Use pre-mortems: imagine the project has failed — what went wrong?
**Example:** Designing a knowledge system. Instead of asking "what makes a good knowledge base?", ask "what makes a knowledge base useless?" Stale content, no discovery mechanism, wrong level of abstraction, no feedback loop. Now design to prevent each of those.

#### 5. Seek Falsification
Ask "what would prove this wrong?" Try to disprove your ideas before building on them.

**Why:** Confirmation bias makes you look for evidence that supports your conclusions. Falsification forces you to look for evidence that breaks them. Ideas that survive genuine attempts at disproval are much stronger foundations.
**How:** For each conclusion or design decision, articulate what would disprove it. Then look for that evidence. If you can't articulate what would disprove it, you don't understand it well enough. Hold conclusions provisionally — "best available," not "proven."
**Example:** You conclude that a microservices architecture fits the project. What would prove that wrong? If the team is small, if the services would need tight coordination, if the deployment complexity outweighs the modularity benefit. Actively look for those conditions before committing.

#### 6. Trace Consequences
Ask "and then what?" Map 1st, 2nd, 3rd order effects across time.

**Why:** First-order thinking produces obvious conclusions. Second-order thinking reveals hidden consequences, feedback loops, and unintended effects. Most architectural mistakes come from not thinking past the immediate result.
**How:** For each decision, identify the immediate effect (1st order). Then ask "and then what?" for each effect. Continue to 2nd and 3rd order. Consider effects across time horizons — what does this look like in a week, a month, a year? What feedback loops does this create?
**Example:** Choosing to denormalize a database table for read performance (1st order: faster reads). And then what? Write complexity increases, data consistency requires application-level enforcement, schema changes become harder, future developers inherit the complexity. Are the read performance gains worth those second-order costs?

---

### Synthesize — build understanding

#### 7. Find Leverage Points
Where does a small change produce a large effect? Intervene there.

**Why:** Most design debates happen at the parameter level — which framework, which library, which API pattern. The highest-leverage decisions are about goals (what is this system *for*?), rules (what constraints does it operate under?), and information flows (who knows what, when?). Intervening at the wrong level wastes effort.
**How:** When analyzing a domain or designing a system, rank the decisions by leverage. Are we debating parameters when we should be questioning goals? Is there a structural change that would make several parameter-level decisions irrelevant? Intervene at the highest leverage point accessible.
**Example:** A team debates which monitoring tool to use (parameter). The higher-leverage question: what information does the team need to make good decisions, and when do they need it? That question might reveal that the problem isn't the tool — it's that errors are invisible until users report them. The leverage point is the information flow, not the parameter.

#### 8. Apply Multiple Lenses
Look at the problem from multiple disciplines and perspectives. No single lens is complete.

**Why:** A single perspective creates blind spots. Looking at a system only from a technical lens misses user experience. Looking only from a data lens misses operational concerns. The real picture emerges from overlaying multiple views.
**How:** For each problem or design decision, deliberately shift perspectives. What does this look like from the user's perspective? From an operations perspective? From a data integrity perspective? From a cost perspective? From a security perspective? Where do the perspectives conflict — and what does that conflict reveal?
**Example:** Designing an API endpoint. Technical lens: clean REST semantics. User lens: what does the consumer actually need? Operations lens: how does this behave under load? Data lens: what consistency guarantees matter? The design that satisfies all four is better than the one that optimizes for only one.

---

### Verify — confirm depth

#### 9. Test Your Understanding
If you can't explain it simply, you don't understand it. Use this as a diagnostic.

**Why:** Complexity in explanation signals gaps in understanding. The gaps in your explanation point directly to the gaps in your knowledge — and those gaps are where architectural mistakes hide.
**How:** After researching a domain or making a design decision, try to explain it in plain language. Where does your explanation get vague or hand-wavy? Those are the gaps. Go back and fill them before building on the knowledge. If you can't explain *why* a decision is right — not just *what* it is — dig deeper.
**Example:** You've researched a complex authentication protocol. Can you explain, in simple terms, why it's secure? What happens at each step? Where the trust boundaries are? If any of those answers are "it just works that way," you have a gap that could become an architectural mistake.

#### 10. Check Your Thinking Mode
Am I in System 1 (fast, automatic) when I should be in System 2 (slow, deliberate)?

**Why:** 96% of thinking is automatic. System 1 produces cognitive biases: WYSIATI (reasoning only from what's in front of you), confirmation bias (seeking evidence that agrees with you), anchoring (over-weighting the first thing you saw). These are the primary mechanisms of shallow thinking.
**How:** Periodically pause and ask: Am I reasoning from what's immediately available, or from what's actually true? Am I confirming my existing beliefs or genuinely investigating? Did the first thing I read anchor my thinking? Am I rushing because the answer feels obvious? If any answer is yes, slow down and deliberately engage analytical thinking.
**Example:** You're researching database options and the first article you read makes a strong case for PostgreSQL. Notice the anchor. Before concluding, deliberately seek out the case *against* PostgreSQL for your use case. What would a DynamoDB advocate say? A SQLite advocate? Challenge the anchor before it becomes a decision.

---

## Workflow

**The rhythm:** Open → Challenge → Synthesize → Verify. This is a default thinking rhythm, not a rigid sequence. Move between phases as needed — circle back to Open if Challenge reveals gaps, revisit Challenge after Synthesize surfaces new assumptions.

**How to apply it:**
1. **Open:** Decompose the problem, question what you know, separate knowledge from assumption (moves 1-3)
2. **Challenge:** Invert the problem, try to falsify your conclusions, trace consequences (moves 4-6)
3. **Synthesize:** Find leverage points, apply multiple lenses, build understanding (moves 7-8)
4. **Verify:** Test your understanding by explaining simply, check your thinking mode (moves 9-10)

**Skill emphasis — where to spend more time:**

| Skill | Emphasis | Why |
|-------|----------|-----|
| `/research` | Open + Challenge | Decomposing and questioning the domain is the core job. Challenge assumptions hard — shallow research propagates downstream. |
| `/deep-research` | Open + Synthesize + Challenge | Decomposition is the highest-leverage decision (Open); facet selection and cross-referencing win through leverage (Synthesize); stopping decisions and contradiction flags require falsification (Challenge). A bad decomposition wastes every downstream specialist. |
| `/research-program` | Open + Challenge + Synthesize | Program decomposition chooses which *domains* get campaigns — highest-leverage decision at megatopic scale (Open + Challenge). Cross-campaign synthesis finds themes no single campaign surfaces; flag cross-domain contradictions (Synthesize + Challenge). |
| `/ideate` | Open + Synthesize | Deep exploration of the problem space, then convergence. Challenge is secondary during early ideation. |
| `/architecture` | Challenge + Synthesize | Fundamentals should already be researched. Focus on stress-testing decisions and building from verified foundations. |
| `/brief` | Open + Verify | Curating knowledge requires deep decomposition and confirming you truly understand what you're summarizing. |
| `/epicize` | Challenge + Synthesize | Question phase ordering assumptions. Find high-leverage sequencing. Trace consequences of dependency choices. |

---

## Guardrails

### Wrong Abstraction Level
Your logic is sound but your conclusions don't connect to reality — you decomposed too far or not far enough. **Antidote:** Test conclusions against concrete cases. If they feel disconnected from the actual problem, adjust the level of analysis.

### Wrong Set of Principles
You selected principles that are individually true but collectively incomplete. Reasoning is valid; premises are insufficient. **Antidote:** Cross-check with multiple lenses (move 8). The only real test is against reality, not just internal consistency.

### Analysis Paralysis
Decomposing without converging. Questioning everything without reaching conclusions. **Antidote:** Set a stopping condition. "Deep enough" means you can explain it simply (move 9) and your falsification attempts haven't broken it (move 5).

### Reinventing the Wheel
Ignoring valid prior art in pursuit of "pure" first-principles reasoning. **Antidote:** First-principles thinking means *understanding* why established patterns exist, not rejecting them by default. If the pattern fits the fundamentals, use it.

### System 1 Override
Cognitive biases pulling you back to shallow thinking even when you intend to think deeply. WYSIATI, confirmation bias, and anchoring are the primary culprits. **Antidote:** Deliberate metacognitive checks (move 10). Plan your thinking approach before starting, monitor during, evaluate after.

---

## Related Documents

| Document | Purpose |
|----------|---------|
| [North Star](first-principles-north-star.md) | Vision and principles for this primer |
| [Brief: Frameworks](brief-first-principles-frameworks.md) | Full research on 14 thinking frameworks — detailed history, examples, sources |
| [Architecture](first-principles-architecture.md) | Design decisions for this document's structure |
| [Build Process](build-process.md) | The pipeline this primer augments |
