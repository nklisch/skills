---
description: "North star for the deep-research skill — parallel-agent research campaigns that go wider and deeper than /research by decomposing a topic, dispatching specialists in parallel, and compiling structured cross-referenced briefs."
type: north-star
updated: 2026-04-15
---

# North Star: Deep Research

*Last updated: 2026-04-15*

## Vision

A skill (`/deep-research`) that investigates a topic with more breadth and depth than a single agent can hold. Given a seed topic, it decomposes the domain into orthogonal facets, dispatches specialist agents to research each facet in parallel, then compiles their findings into a set of cross-referenced briefs plus a parent brief that synthesizes the whole.

Deep research is the middle tier of a three-scale research family: `/research` (question scale) → `/deep-research` (domain scale) → `/research-program` (megatopic scale). All three use the same fractal four-role pattern. `/research` is the right tool for focused, single-domain investigation. `/deep-research` is the right tool when a topic spans 5+ orthogonal facets or when decomposition itself is part of the research. `/research-program` is the right tool when a topic spans 3+ distinct domains, each big enough to warrant its own campaign — see [research-skills-overview.md](research-skills-overview.md) for the family view.

## Problem

The existing `/research` skill is single-agent. It does a fine job on narrow topics, but:

- **Context ceiling.** One agent can't hold enough context to investigate 5-15 facets of a complex domain deeply. Breadth forces shallow; depth forces narrow.
- **No decomposition discipline.** `/research` doesn't separate "what are the right sub-questions?" from "how do I answer them?" Both collapse into one prompt, and decomposition quality suffers.
- **No parallel coverage.** Investigations that are logically parallel run sequentially, multiplying time for no correctness gain.
- **No synthesis role.** The same agent that investigates also writes up findings. Synthesis is a different cognitive task with different failure modes — collapsing them hurts both.
- **No quality gate.** Output is whatever the agent produced. No separate evaluator checks coverage, contradictions, or source grounding.

For a complex seed ("cEDH metagame analysis," "org-wide data platform architecture," "how do knowledge graphs work in production"), `/research` produces a brief that *covers* the topic but misses the depth an expert would demand. Deep research exists to close that gap.

## Principles

### 1. Human seeds, agents expand

A human provides the seed topic and validates the decomposition before dispatch. Agents do the breadth-and-depth legwork that would take a human hours or days. A human shouldn't research 15 facets of a topic by hand; they should seed the topic and review the tree.

### 2. Parallel independent research, sequential synthesis

Specialists research in parallel — each has its own context window, its own subdomain, its own sources. Synthesis runs sequentially over all outputs. This captures 80%+ of the speed benefit while maintaining coherent final output. Pure-parallel (including synthesis) introduces merge conflicts. Pure-sequential is slow.

### 3. Orchestrator-workers, not a conversation

Specialists don't talk to each other. They talk to the orchestrator. The orchestrator owns the plan; specialists are stateless workers scoped to a subdomain. This is Anthropic's reference pattern — 90.2% improvement over single-agent on internal research eval.

### 4. Four distinct roles

Each with its own prompt and context window:

- **Lead Researcher (orchestrator)** — decomposes, dispatches, tracks progress
- **Specialists (N parallel)** — each investigates one leaf subdomain deeply
- **Synthesis Agent** — compiles specialist outputs into a coherent parent brief with typed cross-references
- **Evaluator Agent** — separate from everything else, assesses coverage, coherence, contradictions, grounding

Collapsing roles degrades both. The orchestrator is bad at synthesis because its context is polluted with plan state. Synthesis is bad at evaluation because it's emotionally attached to the output it just wrote.

### 5. Prefer good results over saving tokens

Deep research is opt-in. If a user invoked it, they wanted the deeper treatment. Defaults favor quality: 5-7 parallel specialists, depth 3, generous per-specialist budgets. Hard fences exist (cost ceilings, depth limits) but start generous and only tighten based on observed behavior. Don't hand people a worse tool to save money they were willing to spend.

### 6. Structured over scattered

Specialist outputs are not appended; they're compiled. Each specialist's brief gets typed cross-references to siblings. A parent brief summarizes the domain tree. The whole campaign is a structured, navigable set — not a dump of N disconnected docs.

### 7. Additive to the build process

Deep research integrates as an additional option in the existing pipeline, not a replacement. `/research` remains valid for focused work. `/deep-research` can be user-invoked directly, called from `/ideate` when scout identifies complex research needs, or called from `/brief` when a phase needs deep coverage. The build process doesn't bend around it; it plugs in.

### 8. Grounded synthesis

Specialists cite sources per claim. Synthesis preserves claim-level provenance. The evaluator verifies that claims trace to sources. When `knowledge/create` and the Anthropic Citations API are available, deep research produces briefs with full attribution chains. In v1 (before those exist), it produces briefs with structured `sources[]` frontmatter entries that downstream tooling can verify later.

### 9. First-principles thinking at every phase

Decomposition, stopping, and synthesis are thinking-intensive — more than any other skill in the suite. The Lead loads the [first-principles primer](first-principles.md) before starting and applies specific moves at specific phases: Open + Synthesize during decomposition, Challenge + Verify during stopping decisions, Challenge + Synthesize during compilation. The Asymmetry Principle governs: a shallow decomposition wastes the entire campaign's specialist budget. Going deep at Phase 2 is always cheaper than discovering a wrong decomposition after Phase 7.

## Domain Model

### Research Campaign

The top-level unit of work. A coordinated effort on a seed topic. Produces N draft briefs + a parent brief + a campaign quality report. Has a budget (tokens + time), a scope (the seed + any human-edited decomposition), and a history entry for learning across campaigns.

### Seed

What to research. Human-provided in v1. Can be a topic name, a research question, or a scope statement. The seed is the input to the decomposition step.

### Domain Tree

The hierarchical decomposition of the seed. Root = seed. Intermediate nodes = facets or sub-facets. Leaves = assignments for specialist agents. Depth governed by stopping criteria (not "go deep until budget runs out").

### Lead Researcher

The orchestrator. One per campaign. Responsibilities: decompose, evaluate stopping at each node, present tree for human review, dispatch specialists, monitor progress, handle failures, hand off to synthesis.

### Specialist

A research agent. One per leaf subdomain. Characteristics: focused (one subdomain), context-aware (receives relevant existing briefs + sibling titles), source-driven (cites sources), cross-reference-aware (suggests `related[]` links), bounded (has token/time budget).

### Synthesis Agent

One per campaign. Different role from Lead. Sees all specialist outputs but not the Lead's reasoning. Produces: parent brief, cross-references between specialist briefs, contradiction flags, campaign coverage statement.

### Evaluator Agent

One per campaign. Separate from everything else (sees only produced briefs, not the decomposition or specialist prompts). Produces: coverage score, coherence score, contradiction report, groundedness assessment. Structured quality report the Lead uses to decide whether to run follow-up campaigns.

### Campaign History

Every campaign is logged: seed, tree, assignments, briefs produced, quality report, cost, time. Enables learning — "topics like X tend to decompose into N facets at depth Y" — and supports future v2 features like gap-seeded autonomous research.

## Research Plan

**Complete.** All domains identified in earlier sessions have been researched:

- ✅ **Embeddings and clustering for gap detection** — [embeddings-clustering-gap-detection.md](../../grimoire/docs/briefs/embeddings-clustering-gap-detection.md)
- ✅ **External taxonomy (Wikipedia/Wikidata)** — [external-taxonomy-gap-detection.md](../../grimoire/docs/briefs/external-taxonomy-gap-detection.md)
- ✅ **Multi-agent orchestration** — [multi-agent-orchestration.md](../../grimoire/docs/briefs/multi-agent-orchestration.md)
- ✅ **Topic decomposition, stopping criteria, quality evaluation** — [research-campaign-design.md](../../grimoire/docs/briefs/research-campaign-design.md)

These briefs feed the architecture doc.

## Related Documents

| Document | Purpose |
|----------|---------|
| [Research Skills Overview](research-skills-overview.md) | Three-scale family view (/research → /deep-research → /research-program) |
| [Research Program Architecture](research-program-architecture.md) | The tier above — megatopic programs that dispatch /deep-research as campaigns |
| [Architecture](deep-research-architecture.md) | Workflow, roles, prompts, integrations |
| [Model Selection Pattern](model-selection-pattern.md) | Model + effort assignments per role |
| [Build Process](build-process.md) | The pipeline this skill integrates into |
| [First-Principles Primer](first-principles.md) | Thinking methodology — applies to decomposition and synthesis |
| [Knowledge Workers North Star (grimoire)](../../grimoire/docs/architecture/north-star-knowledge-workers.md) | The capability-level vision this skill partly implements |
| Research briefs (above) | The domain knowledge this skill is grounded in |
