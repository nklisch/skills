---
description: "Cross-project pattern for choosing Claude model and effort level per skill role. Defines four archetypes (orchestration, parallel-worker, synthesis, volume-extraction) with model+effort recommendations, cost considerations, and application guidance for skills that spawn sub-agents."
type: pattern
updated: 2026-04-15
---

# Skill Pattern: Model Selection

> Cross-project pattern. How to choose Claude model and effort level for each role in a skill, especially when a skill spawns sub-agents.

---

## Purpose

Skills — especially those that orchestrate sub-agents — have two levers that affect cost, speed, and quality: **which Claude model** to use, and **how much reasoning effort** to invest. Used well, these save 3-5× on cost with no quality loss. Used poorly, they waste money on easy tasks and shortchange hard ones.

This pattern defines four archetypes that cover the common roles inside a skill, with model + effort recommendations for each.

---

## The Two Levers

### Model

| Model | Strengths | Cost (approx) | Use when |
|-------|-----------|--------------|----------|
| **Opus 4.6** | Deepest reasoning, best on open-ended problems with cascading consequences | $15 / $75 per 1M tokens (in/out) | The task is hard, the stakes are high, or errors compound |
| **Sonnet 4.6** | Balanced — strong reasoning at meaningful cost savings | $3 / $15 per 1M tokens | The task is scoped, the quality bar is "good enough that a human can validate quickly" |
| **Haiku 4.5** | Fastest, cheapest, structured output reliable | $1 / $5 per 1M tokens | The task is well-defined, volume is high, errors are recoverable |

Rough guideline: **Opus is 5× Sonnet cost, Sonnet is 3× Haiku cost.** The quality gap is highly task-dependent — on narrow extraction tasks, Haiku may be indistinguishable from Opus. On open-ended reasoning, the gap is large.

### Effort

Effort maps to how much thinking budget the model invests before responding. Higher effort helps on:
- Open-ended reasoning ("design the system")
- Multi-step decomposition ("break this problem down")
- Cross-referencing ("which of these is most consistent with X")

Effort helps less on:
- Structured extraction ("pull the entities from this text")
- Format conversion ("convert this to JSON")
- Simple classification ("tag/no-tag")

**Rule of thumb:** match effort to the reasoning depth the task demands. Don't spend effort budget on tasks that are mostly pattern-matching.

---

## Four Archetypes

Every role inside a skill tends to fall into one of four archetypes. Name the archetype, pick the defaults.

### 1. Orchestration

**Model + Effort:** Opus, high

**Characteristics:**
- Few calls per skill invocation (1-5)
- Decisions that cascade into many downstream calls
- Design-space exploration: decomposition, stopping criteria, dispatch logic
- High cost of being wrong

**Examples:**
- `/ideate` — exploring the problem space
- `/architecture` — designing modules and data flow
- `/design` — producing the per-phase design doc
- `/doc-review` — cross-doc consistency checking
- Deep research orchestrator — decomposition, dispatch decisions
- `/refactor-design` — identifying high-value refactors
- `/security-review` — domain selection + severity judgment

**Anti-pattern:** running orchestration on Sonnet to save cost. The orchestrator makes decisions that drive everything downstream. A bad decomposition by a cheaper model wastes 5-10× what was saved.

### 2. Parallel Worker

**Model + Effort:** Sonnet, medium

**Characteristics:**
- Many parallel instances (3-10+)
- Scoped task with a clear boundary
- Cost scales with N workers — each dollar matters
- Quality bar is "good enough that synthesis can integrate"

**Examples:**
- `/research` investigation agents (one per sub-question)
- Deep research specialists (one per leaf domain)
- `/scout` parallel search agents (one per adjacent area)
- `/cruft-cleaner` parallel cleanup agents (one per file/region)
- `/implement-orchestrator` workers (one per file)

**Anti-pattern:** running parallel workers on Opus. At 5 parallel agents × 100K tokens each, the cost jumps from ~$7.50 (Sonnet) to ~$37.50 (Opus) for often indistinguishable output.

### 3. Synthesis / Judgment

**Model + Effort:** Opus, high (or Sonnet high for cost-sensitive judgment)

**Characteristics:**
- One call that integrates N inputs
- Quality matters (the output is what the user sees)
- Requires judgment: contradiction detection, relative importance, coherent narrative

**Examples:**
- `/research` synthesis step (compiles agent outputs into the brief)
- Deep research synthesis agent (compiles specialists into parent brief)
- Deep research evaluator agent (quality report across campaign)
- `/brief` curation (distills research into implementation-ready context)
- LLM-as-judge for gap relevance filtering

**Note:** synthesis and judgment are related but distinct. Synthesis writes the integrated output. Judgment produces a structured verdict (score, ranking, flag). Both warrant strong models.

**Anti-pattern:** skipping a dedicated synthesis step and letting the orchestrator "just write up the results." Synthesis is a different role with a different prompt. Running it in the orchestrator's context window dilutes both tasks.

### 4. Volume / Structured Extraction

**Model + Effort:** Haiku, low

**Characteristics:**
- Many calls per skill invocation (50-1000+)
- Well-defined structured task
- Output is verifiable (JSON schema, format match)
- Errors are recoverable (rerun the specific item)

**Examples:**
- Entity extraction per brief (`{covered: [], referenced: []}`)
- Citation verification (map claims to source excerpts)
- Summary generation for embeddings
- Slug matching / simple classification
- NLI pre-screening for contradictions
- Cluster naming (c-TF-IDF + simple LLM label)

**Anti-pattern:** running volume extraction on Sonnet or Opus. At 500 briefs × 2K tokens each, the difference is ~$1 (Haiku) vs ~$10 (Sonnet) vs ~$50 (Opus). Reserve the spend for tasks that actually need it.

---

## Decision Framework

When adding a role to a skill, answer four questions:

| Question | Signal for Opus | Signal for Sonnet | Signal for Haiku |
|----------|-----------------|-------------------|------------------|
| **Cognitive complexity** — how much reasoning depth? | Exploration, design, judgment across many dimensions | Scoped reasoning within a known domain | Pattern match, extract, classify |
| **Stakes** — cost of being wrong? | Decisions cascade into many downstream calls or into committed artifacts | One role's error is contained, synthesis can correct | Errors recoverable via rerun |
| **Volume** — how many calls per invocation? | 1-5 | 5-20 | 50+ |
| **Latency sensitivity** — is this blocking the user? | Mostly no (user expects thinking time) | Sometimes | Often — Haiku's speed matters |

Combine: **high complexity + high stakes + low volume** → Opus. **Medium + medium + medium** → Sonnet. **Low + low + high volume** → Haiku.

Effort scales with complexity: high effort on open-ended reasoning, low effort on structured extraction regardless of model.

---

## Applying in Skills

### How to express it

When a skill spawns sub-agents via the Agent tool, pass `model: "sonnet"` (or `"opus"`, `"haiku"`) explicitly. Don't rely on defaults — be intentional.

```
Agent({
  description: "Research sub-question",
  subagent_type: "general-purpose",
  model: "sonnet",
  prompt: "..."
})
```

When a skill's own logic runs in the parent context, it inherits the user's model. Skills designed to run under Opus (like `/architecture`) should document that assumption.

### How to document it in the skill

Every skill's SKILL.md should include a short "Model assignment" section:

```markdown
## Model Assignment

This skill uses the following archetype mapping (see skills/docs/model-selection-pattern.md):

- Orchestration (this skill's main loop) — Opus high, runs in parent context
- Research sub-agents (Phase 2) — Sonnet medium, N parallel
- Synthesis (Phase 3) — Opus high, spawned as dedicated agent
- Entity extraction (if needed) — Haiku low
```

This makes the cost profile explicit and auditable.

### How to estimate cost

Rough per-skill-invocation estimate:

```
cost ≈ Σ(role)  (input_tokens × model_input_cost + output_tokens × model_output_cost) × call_count
```

For deep research (medium campaign, 5 specialists, ~100K tokens each):
- Orchestrator: ~3 calls × 50K tokens × Opus = ~$2.50
- 5 Specialists: 5 × 100K tokens × Sonnet = ~$7.50
- Synthesis: 1 call × 200K tokens × Opus = ~$4
- CitationAgent + Evaluator: ~$1
- **Total: ~$15**

If everything ran on Opus: ~$50-75. If everything ran on Sonnet: ~$15-20. The mix captures most of the cost savings while keeping quality where it matters.

---

## Model Selection by Existing Skill

Reference table for skills in this repo. Skills should update their SKILL.md to match (or justify deviation).

| Skill | Main archetype | Model + effort |
|-------|---------------|----------------|
| `/ideate` | Orchestration | Opus high |
| `/scout` | Orchestration + parallel workers | Opus parent, Sonnet workers |
| `/research` | Orchestration + parallel workers + synthesis | Opus parent/synthesis, Sonnet workers |
| `/architecture` | Orchestration | Opus high |
| `/epicize` | Orchestration | Opus high |
| `/brief` | Synthesis | Opus high |
| `/design` | Orchestration | Opus high |
| `/implement` | Orchestration | Sonnet medium (code writing benefits less from Opus) |
| `/implement-orchestrator` | Orchestration + parallel workers | Opus orchestrator, Sonnet workers |
| `/doc-review` | Orchestration | Opus high |
| `/update-documentation` | Synthesis | Sonnet medium (scoped updates) |
| `/refactor-design` | Orchestration | Opus high |
| `/extract-patterns` | Synthesis | Sonnet medium |
| `/test-quality` | Orchestration | Sonnet medium |
| `/security-review` | Orchestration | Opus high |
| `/cruft-cleaner` | Orchestration + parallel workers | Sonnet orchestrator, Sonnet workers (many small calls) |
| `/deep-research` | All four archetypes | Opus Lead + Sonnet specialists (parallel) + Opus Synthesis + Opus Evaluator (isolated). Calibrated: scoped ~$6, default ~$12-15. See [deep-research-architecture.md](deep-research-architecture.md). |
| `/research-program` | Orchestration + nested orchestrator-workers + Synthesis + Judgment | Opus Planner + Opus campaign Leads (each runs single-agent research*) + Opus Cross-Campaign Synthesizer + Opus Program Evaluator (isolated). Calibrated: ~$35-75. See [research-program-architecture.md](research-program-architecture.md). |
| `/knowledge-edge` (planned) | Orchestration + volume extraction | Sonnet orchestrator, Haiku for entity extraction |

---

## Anti-Patterns

### "Use Opus for everything"

Tempting because it feels safer. In practice, 70-80% of skill work is parallel workers or volume extraction — Opus wastes money there. The right defaults for those roles produce indistinguishable output at a fraction of the cost.

### "Use Haiku for everything"

The mirror error. Haiku is excellent for structured extraction but loses on open-ended reasoning, decomposition, and cross-referencing. An orchestrator on Haiku produces decompositions that feel right but miss important dimensions. The mistakes compound downstream.

### "Use whatever the user picked"

Skills run a mix of orchestration, workers, and volume extraction in one invocation. The parent context model is one thing; sub-agent models are a separate choice. Always pick deliberately for spawned agents.

### "Match model to importance, not to task"

A skill-author instinct: "this is an important skill, use Opus." But "important" doesn't mean every role inside is equally hard. The orchestrator might need Opus; the 5 parallel workers might not.

### "Skip the synthesis step to save a call"

Running synthesis inside the orchestrator's context window "saves" one call but produces lower-quality synthesis (wrong role, polluted context). The one-call savings is much smaller than the quality loss. Keep synthesis as a dedicated role.

### "Skip effort tuning"

High effort on structured extraction burns thinking tokens for no gain. Low effort on decomposition produces shallow trees. Match effort to the reasoning the task actually needs.

---

## Open Questions

1. **Dynamic effort adjustment** — can effort scale within a skill invocation based on progress signals (stuck, converged, exploring)? Not widely used yet; worth experimenting.
2. **Model routing** — can a skill start on Haiku and escalate to Sonnet/Opus on low-confidence outputs? More complex than archetype-based defaults but may win on cost-per-quality.
3. **Fine-tuned specialist models** — at what scale does a fine-tuned Haiku beat a general-purpose Sonnet for a specific extraction task? Not practical yet at grimoire's scale but worth tracking.
4. **Prompt caching interaction** — Opus caches are more expensive per hit but cache hits are cheaper. How does model choice interact with caching strategy for repeatedly-used prompts?

---

## Related

- [build-process.md](build-process.md) — the pipeline this pattern augments
- [first-principles.md](first-principles.md) — thinking methodology, applies across models
- Individual skill SKILL.md files — each should declare its archetype mapping
