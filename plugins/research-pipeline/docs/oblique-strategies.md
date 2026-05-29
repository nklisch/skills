---
description: "Oblique strategies primer — lateral thinking moves for when structured approaches get stuck. The creative complement to first-principles."
type: primer
updated: 2026-04-15
---

# Oblique Strategies

A practical toolkit for lateral thinking. 10 moves drawn from Eno, de Bono, Koestler, Altshuller (TRIZ), and Munger — distilled into concrete operations you can apply when structured analysis hits a wall.

**How to use this:** Load when ideation is circular, stuck, or over-constrained. Use a move to generate a new direction, then switch back to structured thinking (first-principles) to evaluate it. Follow the rhythm as a default, not a rule.

**The Complementarity Principle:** First-principles thinking goes *deeper* within a frame. Oblique strategies go *sideways* to find a new frame. These are not competing approaches — they are two gears. **When depth isn't working, go lateral. When a lateral move produces a new direction, go deep.**

---

## When to Load This Primer

- The conversation has been going in circles for 3+ exchanges
- Every proposed solution feels like a variation of the same idea
- The problem seems over-constrained — no good option exists
- The team is anchored on one approach and can't see alternatives
- First-principles decomposition produced a tree but no insight
- You keep optimizing within a frame that might be wrong

---

## The Moves

### Phase 1: Reframe — change how you see it

#### 1. Flip the Goal
Ask "what would guarantee failure?" and avoid it.

**Why it works:** Additive thinking has blind spots — you focus on what to build and miss what to avoid. The brain is better at recognizing danger than optimizing for success. Inverting the goal leverages this asymmetry. (Munger, via Jacobi: "Invert, always invert.")
**How to apply:** Take the current goal. Reverse it. "What would make this API unusable?" "What would guarantee users abandon onboarding?" "What would make this architecture impossible to maintain?" List 5 answers. Now design to avoid each one.
**Example:** Stuck on "how do we make onboarding great?" Invert: what would make onboarding terrible? Require 12 fields before showing value. Hide the core feature behind three menus. Send a 10-step tutorial email. Force account creation before any interaction. Now avoid each one — and the onboarding designs itself through subtraction.

#### 2. Question the Question
Brainstorm the problem statement itself, not solutions.

**Why it works:** The framing of a problem determines the solution space. If you're stuck, the problem statement — not the solution — might be wrong. Most teams lock in their question early and never revisit it. (Design thinking: frame-storming, "How Might We" reframing.)
**How to apply:** Write down the current problem statement. Now generate 5 alternative framings. Change the verb, the subject, the assumed constraint. "How do we build better search?" becomes "How might users find what they need without searching?" or "What if the right content found the user?" Pick the most surprising reframe and ideate within it for 5 minutes.
**Example:** Stuck on "how do we reduce support tickets?" Reframe: "How might we make the product so clear that questions don't arise?" or "What if every support ticket improved the product automatically?" or "What if support were a feature, not a cost center?" Each reframe opens a different solution space.

#### 3. Borrow Eyes
Ask "what would [a specific, different person] do?"

**Why it works:** Your expertise creates blind spots — you can't see the problem fresh because you know too much about the constraints. Adopting another perspective bypasses your anchored assumptions. The more different the perspective, the bigger the frame shift. (Eno: "What would your closest friend do?")
**How to apply:** Pick a specific perspective: a 5-person startup, a user who hates your product, a competitor, a child, someone from an unrelated industry. Ask: "How would they solve this?" Don't filter for feasibility — the point is the perspective shift, not the literal answer.
**Example:** Stuck on how to design a complex data pipeline. Ask: "What would a restaurant kitchen do?" A kitchen manages throughput, staging, quality checks under time pressure, and inventory — structurally similar to a pipeline. The analogy might surface: a kitchen has a visible "order board" (observability), a clear station-to-station flow (pipeline stages), and an expediter who routes work (orchestrator). Which of these is your pipeline missing?

#### 4. State the Absurd
Make a deliberately impossible claim about the problem. Use it as a stepping stone.

**Why it works:** A provocation interrupts the brain's established thinking pattern. You don't evaluate the provocation — you use it to reach ideas inaccessible by logical progression. The absurdity is the point: it throws you out of the groove. (De Bono's "Po" — provocation operator.)
**How to apply:** Take the problem and make a statement that is obviously false or impossible. "The database doesn't exist." "The user is also the developer." "The system has zero latency and infinite storage." Don't judge the statement. Instead ask: "If this were somehow true, what would follow?" Follow the implications for 2-3 steps.
**Example:** Designing a documentation system. "Po — the user writes the documentation." Absurd. But follow it: what if user behavior *generated* the docs? What if the most-viewed paths became the tutorial? What if error messages were so good they replaced documentation? What if support conversations auto-compiled into an FAQ? The provocation led somewhere real.

---

### Phase 2: Constrain — change the boundaries

#### 5. Ship Tomorrow
Add a brutal time constraint. What would you build if you had one day?

**Why it works:** Time pressure strips away nice-to-haves and exposes the essential kernel. Paradoxically, more freedom creates more paralysis (paradox of choice). A tight constraint reduces the search space, making the remaining space easier to explore deeply. Research consistently shows moderate constraints enhance creativity.
**How to apply:** Ask: "If we absolutely had to ship a working version tomorrow, what would it be?" Not "what corners would we cut" — that preserves the current design and degrades it. Instead: "What is the smallest thing that solves the core problem?" The answer is often a fundamentally different (and better) design, not a degraded version of the current one.
**Example:** Building a recommendation engine. The full vision: collaborative filtering, content-based scoring, real-time personalization. Ship-tomorrow version: sort by popularity within the user's category. That's one query. And it might be 80% as effective as the complex system — which means the complex system needs to justify its complexity against that baseline.

#### 6. Kill Your Favorite
Remove the thing you're most attached to. See what survives.

**Why it works:** Sunk cost fallacy and endowment effect make you overvalue what you've invested in. The feature you're most reluctant to cut is often the one dragging the design down — because you're protecting it from the scrutiny you apply to everything else. (Faulkner: "Kill your darlings." Eno: "Discard an axiom.")
**How to apply:** Identify the feature, pattern, or architectural choice you're most proud of or most invested in. Remove it. Don't replace it — just remove it. Now evaluate what's left. Is the remaining system still valuable? Often yes, and simpler. If it collapses, you've found the load-bearing element — which is also useful information.
**Example:** "We spent three sprints building the plugin architecture. But do we actually have plugins?" Kill it. "The real-time WebSocket sync is elegant engineering. But users check the dashboard once a day." Kill it — ship a cron job and a refresh button. The exercise reveals whether the design serves users or serves the builder's ego.

#### 7. Resolve, Don't Trade Off
Refuse the compromise. Find a solution that satisfies both sides of the contradiction.

**Why it works:** Most "impossible trade-offs" are only impossible within the current framing. TRIZ research (40,000+ patent analysis) found that inventive breakthroughs come from *eliminating* contradictions rather than compromising between them. The trade-off feels fundamental but is usually an artifact of the current design. (Altshuller: Ideal Final Result.)
**How to apply:** Name the specific contradiction: "We need X but X prevents Y." Now refuse the trade-off. Ask: "Is there a design where we get both X and Y?" Consider: can you get X at one time and Y at another? X in one part and Y in another? Can a third element provide X without affecting Y? Work backward from the ideal: "The system does both perfectly with no added complexity." What's the smallest obstacle between here and there?
**Example:** "The API needs to be both fast and flexible." Don't compromise with a medium-speed, medium-flexibility API. Instead: serve a fast, fixed summary endpoint AND a slower, flexible GraphQL endpoint. Or: pre-compute the 5 most common queries (fast) and support arbitrary queries as a separate path (flexible). The contradiction dissolves when you stop treating the API as a single thing.

---

### Phase 3: Stimulate — introduce the unexpected

#### 8. Steal From a Stranger
Study how a completely unrelated domain solves a structurally similar problem.

**Why it works:** The same structural patterns — speed vs. accuracy, flexibility vs. simplicity, growth vs. stability — appear across manufacturing, biology, logistics, urban planning, and software. Solutions transfer when you abstract past domain-specific details. TRIZ found that inventive solutions recur across unrelated industries. (Koestler: bisociation — creative breakthroughs at the intersection of two unrelated frames.)
**How to apply:** Identify the structural problem (not the domain-specific version). Then pick an unrelated domain and research how they handle it. Fruitful pairs: urban planning + system architecture (growth, zoning, traffic). Restaurant kitchens + deployment pipelines (throughput, staging, quality). Immune systems + security (pattern recognition, adaptive response). Ecology + distributed systems (resilience, cascade failure).
**Example:** Struggling with service discovery in a microservices architecture. Ask: "How do ants find food?" Ants use pheromone trails — a decentralized, self-reinforcing signaling system. No central directory. The structural analogy: what if services left "traces" of successful connections that other services could follow? This is essentially what service meshes do — but the biological analogy might reveal approaches the standard patterns miss.

#### 9. Force a Connection
Pick a random word. Force it to connect to the problem.

**Why it works:** The brain is a pattern-matching machine that will find connections between any two concepts if forced. The random word bypasses the tendency to follow familiar associative paths. Most connections will be useless. But the process of forcing them exercises different neural pathways than deliberate analysis, and occasionally produces a breakthrough that structured thinking never reaches. (De Bono: random entry. Eno: drawing a card from the deck.)
**How to apply:** Open a dictionary, Wikipedia, or any word list to a random entry. Take the first concrete noun. List 5 properties of that thing. Force-connect each property to the current problem. Don't filter for quality — generate first, evaluate later. If nothing useful emerges after 3 random words, move on.
**Example:** Problem: designing a notification system. Random word: "lighthouse." Properties: visible from far away, rotates (periodic), different patterns mean different things, only useful in bad conditions, unmanned. Applied: notifications should be visible without seeking them out (ambient awareness), periodic rather than constant (digest mode), different urgency levels should have distinct patterns (not just "1 new notification"), most valuable when things are going wrong (alert-centric, not activity-centric), should work without human maintenance (self-managing rules).

#### 10. Explain It to a Barista
Describe the system to someone with zero context. The gaps in your explanation are the gaps in your understanding.

**Why it works:** When thinking silently, the brain takes shortcuts and skips assumptions. Explaining to a naive audience forces complete articulation of every step. The "self-explanation effect" engages multiple cognitive pathways simultaneously, surfacing gaps that silent analysis conceals. The power is in choosing an audience so different that no jargon survives. (Rubber duck debugging, generalized beyond code.)
**How to apply:** Imagine explaining the current problem or design to someone who has never seen a computer. No technical terms. No acronyms. What does the system *actually do* for *actual humans*? Where does your explanation get vague, hand-wavy, or circular? Those are the gaps. The barista doesn't solve the problem — the act of translation does.
**Example:** "We're building a data pipeline that ingests events from multiple sources, transforms them through a DAG, and loads into a warehouse." Now explain it to a barista: "People do things on our app. We collect what they did, clean it up, organize it, and put it in a place where analysts can ask questions about it." Suddenly the questions are concrete: What things do people do? What does 'clean up' actually mean? What questions do analysts ask? Each vague spot in the translation is a design decision that hasn't been made yet.

---

## Skill Emphasis

| Skill | When to load | Moves to emphasize |
|-------|-------------|-------------------|
| `/ideate` | Stuck after 3+ circular exchanges | All — this is the primary consumer |
| `/architecture` | Two architectures seem equally valid | Reframe (Flip the Goal, Borrow Eyes) |
| `/expand` | Scope expansion feels forced or uninspired | Constrain (Ship Tomorrow, Kill Your Favorite) |
| `/research` | Research question feels too broad or too narrow | Reframe (Question the Question) + Stimulate (Steal From a Stranger) |
| `/design` | Design feels over-engineered or under-inspired | Constrain (Resolve Don't Trade Off) + Reframe (State the Absurd) |

---

## Guardrails

### Lateral Without Return
Generating creative directions without ever evaluating them rigorously. Oblique strategies produce *candidates*, not *decisions*. **Antidote:** After any lateral move produces a new direction, immediately switch to first-principles thinking. Decompose it, challenge it, trace its consequences. The lateral move finds the direction; structured thinking validates it.

### Move Chaining
Stacking lateral moves on top of each other without stopping to evaluate. Three reframes in a row produces confusion, not creativity. **Antidote:** Apply one move. If it produces a promising direction, stop and explore it deeply. If it doesn't, try one more. If two moves don't break the pattern, the problem may need more research, not more creativity.

### Novelty Bias
Preferring a new direction because it's novel, not because it's better. Lateral thinking is biased toward the unfamiliar — that's its job. But unfamiliar is not the same as good. **Antidote:** Apply the inversion test from Move 1 to any new direction. "What would make this new approach fail?" If the failure modes are worse than the original approach's limitations, the original was better.

### Avoiding Discomfort
Refusing to try moves that feel "unserious" (especially Phase 3). Random word association feels silly. Stating absurdities feels unprofessional. That discomfort is the technique working — it means you're leaving your familiar thinking patterns. **Antidote:** Commit to trying the move for 3 minutes before judging it. The output matters, not the process's dignity.

### Premature Lateral Thinking
Reaching for oblique strategies before doing the analytical work. Lateral moves are for when structured approaches have genuinely been tried and failed — not a shortcut past first-principles decomposition. **Antidote:** Before loading this primer, confirm that you've actually decomposed the problem, not just skimmed it.

---

## The Rhythm

1. **Start with first-principles** (structured, deep) — decompose the problem, question assumptions, trace consequences
2. **If stuck:** switch to oblique strategies (lateral, creative) — apply one move from the phase that fits
3. **When a new direction emerges:** switch back to first-principles — evaluate the direction rigorously
4. **If the direction holds up:** develop it with structured thinking. If it doesn't: try one more lateral move or return to step 1 with whatever you learned

**The escalation path:** Start with Reframe moves (lowest disruption). If reframing doesn't break the pattern, try Constrain moves (moderate disruption). If constraints don't break it either, try Stimulate moves (highest disruption, highest variance). If nothing works after 2-3 moves, the problem probably needs more *information* (research), not more *creativity* (lateral thinking).

---

## Related Documents

| Document | Purpose |
|----------|---------|
| [First Principles Primer](first-principles.md) | The complement — structured, deep thinking. Load first; switch to oblique strategies when stuck. |
| [System Design Primer](system-design.md) | Architectural pattern moves — a third gear alongside deep thinking and lateral thinking. |
| [Research Briefs](briefs/oblique-strategies/) | Full research behind this primer — 3 specialist briefs + synthesis |
| [Build Process](build-process.md) | The pipeline this primer augments |
