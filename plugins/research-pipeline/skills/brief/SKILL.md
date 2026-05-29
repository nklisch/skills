---
name: brief
description: >
  Write a domain brief that gives a future build session the curated context it needs.
  Takes a topic + the roadmap phase it unblocks, researches deeply, then produces a
  structured brief document optimized for agent consumption. Briefs are the bridge between
  raw domain knowledge and implementation — they answer "what does the builder need to know?"
  Use when a roadmap phase lists a blocking brief, or when a build session needs domain context.
user-invocable: true
allowed-tools: Read, Write, Glob, Grep, AskUserQuestion, WebSearch, WebFetch, Agent
model: opus
---

# Brief

You write **domain briefs** — curated reference documents that give a future build session
exactly the context it needs to implement a roadmap phase correctly. A brief is not raw
research, not architecture, not a tutorial. It's the distilled domain knowledge that prevents
a builder from making wrong assumptions.

**You follow the build process at `${CLAUDE_PLUGIN_ROOT}/docs/build-process.md`.** Read it before starting.

**Read `${CLAUDE_PLUGIN_ROOT}/docs/first-principles.md` for consideration.** Apply its thinking moves — especially Open and Verify — to decompose domains deeply and confirm you truly understand what you're curating.

**Read `${CLAUDE_PLUGIN_ROOT}/docs/system-design.md` when the brief covers system design topics.** The 15 design moves inform what a builder needs to know — curate toward the decisions they'll face (structure, interfaces, data, scale, reliability), not just the domain facts.

## Arguments

- `<topic>` — what the brief covers (e.g., "turn-structure", "mana-system", "technique-inventory")
- Optional: `--phase <N>` — which roadmap phase this brief unblocks

## Model Assignment

Per [model-selection-pattern.md](../docs/model-selection-pattern.md):

- **Brief author (this skill's main loop)** — Synthesis. Opus high effort. Runs in parent context.
- **Research sub-agents (Phase 2, when used)** — Parallel worker. Sonnet medium. Parallel when investigating multiple aspects.

Curation requires judgment about what to include, what to cite, and what depth serves the builder — the orchestrator warrants Opus. Parallel research on aspects is scoped where Sonnet is sufficient. For broader topics, escalate to `/deep-research`; when a phase has 3+ blocking briefs that form a coherent multi-domain program, escalate further to `/research-program` (its super-parent can serve as the phase-level blocking brief, with campaign-level briefs backing it).

## What Makes a Good Brief

A brief is good when a fresh conversation can read it and build correctly without additional
research. Test it mentally: "If I read only this brief and the codebase, could I implement
the phase without going back to Google?"

**Good briefs have:**
- **Precision over breadth.** Cover what matters for implementation, not everything about the topic.
- **Rules with numbers.** Not "mana empties between phases" but "mana pool empties at the end of each step (CR 500.4)."
- **Worked examples.** Not "the stack resolves LIFO" but "Player A casts Counterspell targeting Player B's Oracle. Oracle trigger is already on the stack. Counterspell goes on top. Resolves: Counterspell counters Oracle spell. Oracle trigger still resolves (CR 603.7)."
- **Implementation guidance.** Not just "what the rules say" but "what this means for the engine" — data structures, edge cases, decision points.
- **Concrete card/scenario lists.** Not "some cards have replacement effects" but "Necropotence: draw replacement + discard-to-exile. Mox Diamond: enter-or-die replacement. Gemstone Caverns: pre-game replacement."

**Bad briefs are:**
- Textbook summaries (too broad, not implementation-focused)
- Architecture docs disguised as briefs (that belongs in architecture.md)
- Opinions without evidence (briefs are facts, not design decisions)
- Missing the edge cases that will break the implementation

## Workflow

### Phase 1: Understand the Consumer

Before researching anything, understand who will read this brief and why.

1. **Read the roadmap** — find the phase this brief unblocks. Read the phase spec:
   what's being built, what tests must pass, what architecture is touched.
2. **Read existing briefs** — check `docs/briefs/` for related briefs already written.
   Don't duplicate. Cross-reference.
3. **Read the architecture doc** — understand how the system works so you can write
   implementation-relevant guidance.

**Ask yourself:** "What questions will the builder have that the codebase and roadmap don't answer?"
Those questions define the brief's scope.

### Phase 2: Research

Investigate the domain deeply. Use every tool available:

- **WebSearch/WebFetch** — official documentation, specifications, rule books, API docs
- **Agent subagents (`model: "sonnet"`)** — spawn parallel researchers for different aspects of the topic
- **Existing code** — if the project has related code, read it to understand what patterns are established
- **Existing data** — if the project has data (card pools, technique inventories, etc.), analyze it to ground the brief in reality

**For broad blocking briefs, consider `/deep-research` instead.** If the phase's blocking brief spans 5+ orthogonal aspects (a whole subsystem's worth of domain knowledge, not just one topic), escalate to `/deep-research`. It produces a cross-referenced brief set with a parent summary — better coverage for broad topics than a single agent. Most blocking briefs are focused enough for `/brief` alone; only escalate when the breadth genuinely warrants it. See [build-process.md § When to Use /research vs /deep-research](${CLAUDE_PLUGIN_ROOT}/docs/build-process.md).

**Research with the consumer in mind.** Don't research everything about the topic — research
what the builder needs. If the phase is "implement the mana system," you don't need the history
of Magic mana rules. You need the current rules, the edge cases, and the cards the engine will
encounter most often.

### Phase 3: Outline

Before writing, outline the brief and get approval.

**AskUserQuestion checkpoint:** Present:
- Brief title and scope
- Which phase it unblocks
- Proposed sections (table of contents)
- What's in scope and what's out
- Key questions the brief will answer

Iterate until approved.

### Phase 4: Write

Write the brief. Structure it for the consumer:

#### Frontmatter Contract

Every brief produced by `/brief` MUST start with YAML frontmatter that includes — at minimum:

```yaml
---
description: {one-line summary}
type: brief
research_method: /brief
updated: {today's date, YYYY-MM-DD}
blocks_phase: {phase number, optional}
---
```

`research_method: /brief` is non-optional — it is how `/doc-review` distinguishes briefs produced by this skill from `/research`, `/deep-research`, or `/research-program` outputs (see project schema doc for the full value vocabulary). Projects that follow grimoire's universal frontmatter schema may extend with `slug`, `module`, `content_type`, `tags`, etc. — defer to the consumer project's schema for the full list.

#### Standard Brief Template

```markdown
# Brief: {Topic}

## Purpose

{What this brief covers and which phase it unblocks. 1-2 sentences.}

---

## {Core Section 1}

{The main content. Rules, specifications, data, worked examples.
Cite sources. Use tables for structured data. Use code blocks for
data structures, algorithms, or protocol formats.}

## {Core Section 2}

{Continue with logical sections. Each section should answer a
specific question the builder will have.}

## Implementation Notes

{What this means for the engine/system. Data structures, edge cases,
decision points, performance considerations. This is where the brief
goes from "what the domain says" to "what the builder should do."}

## Sources

{Every source consulted. URLs, document names, rule numbers.}
```

**Adapt the template.** The sections above are a starting point. A brief about card interactions
will look different from a brief about tournament rules or API endpoints. Structure for the content.

#### Writing Rules

- **Cite everything.** Rule numbers, API docs, source URLs. A builder should be able to verify any claim.
- **Use tables for structured data.** Card lists, rule summaries, API endpoints, technique inventories.
- **Use worked examples for complex interactions.** Walk through the stack resolution step by step. Show the mana calculation. Trace the API call sequence.
- **Flag the 80/20.** What are the most common cases? (Top 100 meta cards, most frequent tournament rules, most-used API endpoints.) Cover those thoroughly. Acknowledge the long tail but don't exhaustively document it.
- **Cross-reference other briefs.** Don't duplicate. If another brief covers a related topic, reference it: "See `stack-and-priority.md` for how triggered abilities queue."

### Phase 5: Review

Present the completed brief. Highlight:
- Total length (aim for 200-500 lines — enough to be thorough, short enough to fit in context)
- Key insights that might surprise the builder
- Any gaps or areas where you couldn't find authoritative sources
- Related briefs that should be read alongside this one

**AskUserQuestion checkpoint:** "Does this cover what the builder needs? Anything missing or too detailed?"

Iterate until approved, then write to disk.

### Step 6: Regenerate the Knowledge Index

After writing the brief, **run `/knowledge-index`** to regenerate the index from frontmatter.

Do NOT hand-edit `docs/knowledge-index.yaml` — it's a derived artifact (per the redesign at
`${CLAUDE_PLUGIN_ROOT}/skills/knowledge-index/REDESIGN-SKETCH.md`). Frontmatter is the only source of truth;
your job is to write conformant frontmatter on the brief, then run `/knowledge-index`.

Required frontmatter on the brief (see `${CLAUDE_PLUGIN_ROOT}/skills/knowledge-index/SKILL.md` for the full
schema):

```yaml
---
description: <one-line "when do I read this?" hook — frame as the question this doc answers>
type: brief
kind: research                                    # usually derived from type; set explicitly to override
research_method: /brief
updated: <today's date YYYY-MM-DD>
blocks_phase: <phase number if applicable>
summary: |
  <1-2 sentences on what's in the brief>
key_findings:
  - <what the research showed; 3-7 bullets>
status: draft
---
```

If the project doesn't yet have a knowledge index, `/knowledge-index` will create it.

---

## Brief Types

Different phases need different kinds of briefs:

### Rules/Mechanics Briefs
For systems with formal rules (game rules, protocols, financial regulations).
- Cite rule numbers
- Cover edge cases exhaustively
- Worked examples for complex interactions
- Examples: `turn-structure.md`, `stack-and-priority.md`, `edh-tournament-rules.md`

### API/Integration Briefs
For external systems the project integrates with.
- Endpoint documentation with request/response examples
- Authentication and rate limiting
- Error handling patterns
- Examples: `external-api.md`, `data-ingestion.md`

### Domain Knowledge Briefs
For analytical or technical domains the project operates in.
- Technique inventories with selection criteria
- Decision frameworks with routing variables
- Worked examples with real data
- Examples: `technique-inventory-eda.md`, `decision-dag-design.md`

### Card/Entity Interaction Briefs
For projects with complex entity interactions (games, simulations).
- Most frequent entities from real data (not hypothetical)
- Interaction rules with stack/priority/timing
- Implementation priority ordering (by frequency × complexity)
- Examples: `meta-card-interactions.md`, `win-conditions.md`

### Pipeline/Process Briefs
For data pipelines and operational processes.
- Step-by-step flow with data shapes at each stage
- Error handling and retry strategies
- Expected scale and performance considerations
- Examples: `meta-seed-pipeline.md`

---

## Anti-Patterns

- **Don't write a textbook.** Briefs are implementation-focused, not educational.
- **Don't duplicate architecture docs.** Briefs cover domain knowledge, not system design.
- **Don't skip research.** A brief based on training data alone will have gaps. Search the web.
- **Don't ignore the data.** If the project has real data (card pools, tournament results, technique inventories), ground the brief in it. "The top 100 meta cards" is better than "common cards."
- **Don't write without knowing the consumer.** Read the roadmap phase first. A brief for Phase 5 is different from a brief for Phase 10.
- **Don't be vague.** "Mana abilities don't use the stack" → "Mana abilities (CR 605) do NOT use the stack. They resolve immediately. A player can activate mana abilities while casting a spell (CR 601.2g). Exception: Lion's Eye Diamond has a timing restriction — 'activate only as an instant' means it cannot be activated during spell casting."
