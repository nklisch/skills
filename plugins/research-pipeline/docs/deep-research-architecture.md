---
description: "Architecture for the deep-research skill — four-role orchestrator-workers pattern, PMEST-faceted decomposition, veto+weighted stopping, separate synthesis and evaluator agents, per-role model assignments, integration with /ideate /brief /expand."
type: architecture
updated: 2026-04-15
---

# Architecture: Deep Research

*Last updated: 2026-04-15*

> How the skill is structured. For *what* and *why*, see [North Star](deep-research-north-star.md).

## Thinking Layer

Deep research is the most thinking-intensive skill in the suite. Three phases are load-bearing, and each maps to specific [first-principles](first-principles.md) moves:

| Phase | Emphasis | Why |
|-------|----------|-----|
| **Decomposition** (Phase 2) | Open + Synthesize | The domain tree bounds campaign quality. Open (decompose to fundamentals, doubt the first cut) + Synthesize (find facet selection with the most orthogonal leverage). |
| **Stopping decisions** (Phase 3) | Challenge + Verify | Falsify "is this truly a leaf?" Invert the stopping criteria — "what would make this decomposition useless?" Verify each leaf is self-explainable. |
| **Synthesis** (Phase 7) | Challenge + Synthesize | Invert: "what would make these briefs useless together?" Find leverage in cross-references. Challenge contradictions rather than smooth them over. |

**The Asymmetry Principle governs this skill.** A bad decomposition wastes N specialists × token budget on wrong questions. The cost of going deep during Phases 2-3 is always less than the cost of a shallow campaign. When in doubt, decompose further; when uncertain a leaf is truly terminal, split it.

## System Overview

Deep research is a standalone skill (`/deep-research`) that can also be called from `/ideate`, `/brief`, `/research`, and `/expand` when a topic warrants deeper multi-agent treatment. It produces a directory of N draft briefs + a parent brief + a campaign quality report.

```
Callers                          Deep Research                        Output
┌────────────┐              ┌─────────────────────┐              ┌───────────────────┐
│ user       │──direct────▶│                     │              │ docs/briefs/<seed>/│
│ /deep-     │              │  Lead Researcher    │              │   parent.md       │
│   research │              │  (Opus high)        │──dispatches─▶│   <facet-1>.md    │
├────────────┤              │        ↓            │              │   <facet-2>.md    │
│ /ideate    │──may-call──▶│  Decompose           │              │   <facet-N>.md    │
│ (complex   │              │  Stop? Dispatch?    │              │   campaign.md     │
│  domains)  │              │        ↓            │              │   (quality report)│
├────────────┤              │  ┌─────────────┐   │              └───────────────────┘
│ /brief     │──may-call──▶│  │ N Specialists │   │                       │
│ (phase-    │              │  │ (Sonnet mid)  │   │                 knowledge-index
│  blocking) │              │  │ parallel      │   │                 updated
├────────────┤              │  └─────────────┘   │
│ /research  │──escalates─▶│        ↓            │
│ (topic too │              │  Synthesis Agent    │
│  broad)    │              │  (Opus high)        │
├────────────┤              │        ↓            │
│ /expand    │──may-call──▶│  Evaluator Agent    │
│ (new       │              │  (Opus high)        │
│  domain)   │              │        ↓            │
└────────────┘              │  Write output       │
                            └─────────────────────┘
                                    │
                            Uses: Agent (sub-agents with
                            explicit model=), WebSearch,
                            WebFetch, knowledge/search,
                            knowledge-index, AskUserQuestion
```

## Four Roles

Each role has its own prompt, context window, and model assignment.

### Lead Researcher (Orchestrator)

**Model:** Opus, high effort. Runs in parent context (inherits user's session).

**Responsibilities:**
- Decompose the seed into a domain tree (PMEST-faceted first pass + LLM-based hierarchical refinement with MECE constraints)
- Evaluate stopping at each node (veto + weighted signals)
- Present tree for human review with inline edit support
- Dispatch specialists in parallel
- Monitor progress; handle failures (timeout + retry once → partial results)
- Hand off to synthesis

**Context it holds:**
- Seed topic, user arguments, campaign budget
- Existing knowledge (from `knowledge/search` and knowledge-index)
- Domain tree (evolving)
- Specialist statuses (running / complete / failed / partial)
- Decisions log (stopping rationales, human edits)

**What it does NOT do:**
- Research content (specialists do that)
- Write the parent brief (synthesis does that)
- Evaluate quality (evaluator does that)

### Specialists

**Model:** Sonnet, medium effort. Spawned via Agent tool with `model: "sonnet"`. N instances in parallel (default 5-7, configurable).

**Responsibilities:**
- Investigate one leaf subdomain deeply
- Iteratively: search → gather → filter
- Cite sources per claim (`sources: [{url, accessed_at, excerpt}]`)
- Suggest cross-references to sibling subdomains
- Report findings as a draft brief

**Context each receives:**
- Its subdomain description (the leaf node)
- Parent domain context (the seed)
- Sibling titles and one-line descriptions (NOT full outputs — causes interference)
- Relevant existing briefs from the knowledge layer (curated to the subdomain)
- Output schema (brief frontmatter + body conventions, including the required `research_method: /deep-research` stamp)
- Token/time budget

**What they do NOT do:**
- Talk to each other
- See orchestrator reasoning
- Decide what's in scope beyond their subdomain
- Write cross-references (they suggest; synthesis writes)

### Synthesis Agent

**Model:** Opus, high effort. Spawned as a dedicated agent with `model: "opus"`. One instance per campaign.

**Responsibilities:**
- Read all specialist draft briefs
- Add typed cross-references (`related: [{slug, relationship}]`)
- Identify and flag contradictions (preserves them explicitly — does not silently resolve)
- Write the parent brief — a summary of the full domain tree with navigational pointers
- Return the final brief set + contradictions report

**Context it holds:**
- The domain tree (nodes + descriptions)
- All specialist draft briefs (full content)
- Cross-reference vocabulary (uses, contextualizes, history-of, etc.)
- Output schema for parent brief (frontmatter must include `research_method: /deep-research`)

**What it does NOT do:**
- Re-research claims (that's the evaluator's job, sort of)
- Resolve contradictions silently
- Edit specialist briefs beyond adding cross-references

### Evaluator Agent

**Model:** Opus, high effort. Spawned as a dedicated agent with `model: "opus"`. One instance per campaign. **Runs AFTER synthesis, separately.**

**Responsibilities:**
- Assess coverage (via LLM-generated expected outline vs. actual briefs)
- Assess coherence (G-Eval style scoring)
- Detect contradictions (across briefs, complementing synthesis's flags)
- **Reassess severity** — for each contradiction synthesis flagged, independently judge its severity and provide rationale. When your judgment differs from synthesis's, report the delta explicitly. Demo data (2026-04-15) shows severity reassessment happens in 50% of campaigns — it is not exceptional; it's a standard output.
- Check groundedness (claims traceable to sources; `confidence` fields match groundedness scores)
- Produce structured quality report

**Context it receives:**
- ONLY the produced briefs (not decomposition reasoning, not specialist prompts)
- Seed topic
- Expected brief schema

**What it does NOT do:**
- Know the orchestrator's rationale (this avoids inheriting framing bias)
- Revise briefs (just reports)
- Promote/demote briefs (Lead decides based on report)

### (Future) CitationAgent

Not in v1. When the Anthropic Citations API is integrated, a Haiku-low agent will post-process specialist briefs for structured source attribution. Until then, the groundedness check lives in the Evaluator.

## Model Assignment Summary

Per [model-selection-pattern.md](model-selection-pattern.md):

| Role | Archetype | Model | Effort | Calls per campaign |
|------|-----------|-------|--------|-------------------|
| Lead Researcher | Orchestration | Opus | high | ~3-10 (decomposition + dispatch + monitoring) |
| Specialists | Parallel worker | Sonnet | medium | N parallel (default 5-7) |
| Synthesis Agent | Synthesis | Opus | high | 1 |
| Evaluator Agent | Synthesis/judgment | Opus | high | 1 |
| (Future) CitationAgent | Volume extraction | Haiku | low | N (one per specialist) |

**Rough cost for a default medium campaign:** ~$12-15 calibrated (originally estimated $15-20). See cost model section for breakdown and calibration notes.

## Skill Workflow

### Phase 1: Load Context

The Lead Researcher loads:

1. **Skill arguments** — seed topic + any flags (depth, budget, parallel count)
2. **Invocation mode** — user-invoked / called-from-`/ideate` / called-from-`/brief` / etc. Affects how results are handed off.
3. **Knowledge index** — `/knowledge-index` to see what briefs exist
4. **Existing knowledge search** — `knowledge/search` (or direct filesystem search in projects without BQ yet) for briefs related to the seed
5. **Project docs** — CLAUDE.md, architecture, relevant north stars if present

**Minimum requirement:** a seed topic (argument, or prompted if missing).

**Reuse check output:** a short summary of what's already known. Feeds into decomposition (don't decompose into subdomains we already have briefs for; note their existence for specialists to reference).

### Phase 2: Decomposition

Two-pass approach grounded in [research-campaign-design.md](../../grimoire/docs/briefs/research-campaign-design.md).

**Pass 1: Faceted decomposition.**

Identify 3-5 orthogonal facets of the seed. Ranganathan's PMEST is a starting prompt structure:

- **Personality** — the core object of the seed
- **Matter** — substance, properties, attributes
- **Energy** — actions, processes, dynamics
- **Space** — where, context, ecosystem
- **Time** — history, trends, evolution

Not every facet applies to every seed. The Lead identifies which PMEST facets are meaningful for this topic and expresses them as top-level branch names. For seeds that don't fit PMEST, alternative decomposition (perspective-guided STORM-style, or taxonomy-based via Wikidata subclasses) may be substituted.

**Pass 2: Hierarchical refinement.**

Within each facet, the Lead prompts itself to refine further. Explicit MECE constraints. Each child must be semantically distinct from siblings (post-hoc orthogonality check via embedding cosine similarity — optional v1).

At each potential split, evaluate the stopping criteria (Phase 3).

### Phase 3: Stopping Decisions

At each node: leaf or decompose further?

**Veto (hard stops):**

| Signal | Default |
|--------|---------|
| Depth ceiling | 3 levels (seed → facet → sub-facet → leaf) |
| Campaign budget | $30 (configurable `--budget`) |
| Per-branch budget | $6 (budget / top-level facets, adjustable) |

**Weighted signals (soft stops):**

- Information gain (embedding distinctness of proposed children; low similarity = distinct = continue, high similarity = merge or stop)
- Specificity ratio (children's descriptions not trivially narrow compared to parent)
- LLM quality gate ("is this child worth a standalone brief?")

Soft signals combine into a score; if below threshold, stop. If any veto fires, stop.

v1 keeps this simple — the Lead prompts itself to evaluate each split with the above criteria in plain language. Formal implementations (SPRT, Kneedle knee detection) are deferred.

### Phase 4: Human Review Checkpoint

The Lead presents the proposed domain tree via AskUserQuestion.

**Format:**

```
Proposed decomposition of "{seed topic}":

{Facet 1}
  ├─ {Sub-facet 1a}
  ├─ {Sub-facet 1b}
  └─ {Sub-facet 1c}
{Facet 2}
  ├─ ...

Quality flags:
  ⚠ {Sub-facet 2a} and {Sub-facet 2c} are 0.87 similar (possible merge)
  ⚠ Branch {Facet 3} stops at depth 1; others at depth 3 (uneven)
  ℹ No existing knowledge found for {Sub-facet 4b} (novel territory)

Budget estimate: ~$18 for 6 specialists. Depth 3.

Proceed as shown, or would you like to adjust the tree first?
```

Users can: approve, edit inline (rename / merge / split / add / remove), adjust budget, change parallelism. Approval gates dispatch.

For high-stakes campaigns, offer tiered approval (approve the tree AND approve individual specialist assignments with their contexts).

### Phase 5: Dispatch

The Lead spawns N specialists in parallel via the Agent tool.

**Each specialist invocation:**

```
Agent({
  description: "Deep research: {facet name}",
  subagent_type: "general-purpose",
  model: "sonnet",
  prompt: <specialist prompt — see prompt skeletons below>
})
```

All spawned concurrently. The Lead monitors via streamed partial results (where supported) and tracks statuses.

### Phase 6: Monitor

For each specialist:

- **Streaming partial results** over polling. Track progress events (started, searching, synthesizing, complete).
- **Per-specialist timeout** (default: 10 minutes wall clock). If exceeded without completion, request partial results.
- **Failure handling:**
  - Empty results → retry once with broadened scope; if still empty, mark "insufficient data"
  - Contradictions with sibling output → surface to synthesis (don't resolve in Lead)
  - Token budget exceeded → truncate with structured summary of what was covered
  - API failures → exponential backoff with jitter, max 3 retries, then partial results

**Progress to the user (high-frequency, low-detail):** "Specialist 3/6 (dispatching strategies): complete. Specialist 1/6 (tournament data): still searching. Budget used: $8 / $30."

### Phase 7: Synthesis

After all specialists complete (or are marked partial), the Lead hands off to the Synthesis Agent.

**Synthesis agent invocation:**

```
Agent({
  description: "Synthesize deep research campaign",
  subagent_type: "general-purpose",
  model: "opus",
  prompt: <synthesis prompt with all specialist outputs>
})
```

**Synthesis outputs:**
- Parent brief (summary + navigational pointers)
- Cross-references added to specialist briefs (typed `related[]` entries)
- Contradictions report (explicit flags, no silent resolution)

### Phase 8: Evaluation

After synthesis, the Lead hands off to the Evaluator Agent.

**Evaluator invocation:**

```
Agent({
  description: "Evaluate deep research campaign quality",
  subagent_type: "general-purpose",
  model: "opus",
  prompt: <evaluator prompt — sees ONLY the produced briefs + seed topic>
})
```

**Evaluator outputs (structured report):**

```yaml
coverage:
  expected_aspects: [LLM-generated outline]
  covered_aspects: [intersect with briefs]
  coverage_ratio: 0.82
  uncovered_high_priority: [list]
coherence:
  g_eval_score: 4.1 / 5
  embedding_variance: 0.22
contradictions:
  flagged_pairs: [{brief_a, brief_b, conflict, severity}]
  severity_reassessments:
    - id: C2
      synthesis_severity: low
      your_severity: medium
      rationale: "Would cause a runtime error if implemented as-is — functional impact broader than naming confusion"
groundedness:
  per_brief_scores: [{slug, score}]
  unsupported_claims: [...]
  average_source_reliability: medium-high
recommendations:
  follow_up_campaigns: [...]
  briefs_needing_revision: [...]
```

### Phase 9: Write Output

The Lead writes:

1. **Campaign directory** — `docs/briefs/<seed-slug>/`
2. **Specialist briefs** — one per leaf (with cross-refs added by synthesis)
3. **Parent brief** — `parent.md` at the directory root
4. **Campaign quality report** — `campaign.md` with the evaluator's structured report
5. **Knowledge index update** — entry for each brief

All briefs enter at `confidence: speculative, status: draft` per the north star principle "quality gates are non-negotiable." The user reviews and promotes manually in v1. When Phase 9c (`knowledge/create`) ships, the skill uses it directly with the right initial status.

## Arguments and Flags

```
/deep-research <topic>              # Default campaign

Flags:
  --depth N                           # Max decomposition depth (default: 3)
  --parallel N                        # Max parallel specialists (default: 5, cap: 7)
  --budget $N                         # USD ceiling (default: 30)
  --output-dir <path>                 # Where to write briefs (default: docs/briefs/<slug>/)
  --no-review                         # Skip human review checkpoint (use with caution)
  --tiered-review                     # Approve decomposition AND each specialist assignment
  --continue-from <path>              # Chain mode: extend a leaf of a prior campaign.
                                      # See Chain Mode section below.
  --seed-with-knowledge               # (v2) accept gap stubs as seed input
```

### Chain Mode (`--continue-from`)

When invoked with `--continue-from <parent-campaign-dir>`, the skill runs as a *child campaign* extending a leaf of a prior campaign. The `<topic>` argument is interpreted as the leaf scope.

**Behavior deltas from a standalone run:**

| Phase | Chain-mode addition |
|-------|--------------------|
| 1. Load Context | Parent campaign's `parent.md` + specialist briefs loaded as priors; anchor brief identified |
| 2. Decomposition | Scoped to the leaf; explicitly avoid sibling scopes already covered in the parent campaign |
| 7. Synthesis | Writes `related: [{slug: <parent>/<leaf>, relationship: extends}]` on the child brief set |
| 9. Write Output | Appends `## Extended by child campaigns` section to the parent campaign's `parent.md`; parent's specialist briefs are read-only |

**Linkage model.** Child campaigns live as peers to parents (`docs/briefs/<child-slug>/`), not nested. Parent-child relationship is expressed via typed cross-references, not directory structure. The user can request nested layout with `--output-dir`.

**Chain depth.** Each invocation adds one link. A chain of N runs is N sequential invocations, each passing the most recent parent via `--continue-from`. There is no formal chain-depth ceiling — but chains longer than 2-3 links typically signal that the topic should have been a `/research-program` from the start.

**Chain-mode Evaluator (Phase 8).** In addition to the five standard dimensions (coverage, coherence, contradictions, groundedness, recommendations), chain-mode campaigns require four extra dimensions, rolled up into a `chain_mode:` YAML block in `campaign.md`:

```yaml
chain_mode:
  extension_validity: valid | partial | drift
  parent_contradictions:
    - id: C1
      status: resolved | partial | unresolved
      rationale: "Brief explanation — what runtime behavior still breaks, if any"
  upstream_linkage_quality: 0.XX
  parent_integrity_preserved: true | false
```

Rationale: chain mode has its own failure modes that aren't caught by the standard dimensions. *Drift* (child covers something other than the flagged gap), *claimed-but-unreal resolution* (synthesis claims to resolve parent contradictions without actually doing so), *decorative upstream edges* (wrong relationship types or missing edges), and *parent corruption* (append overwrote or mangled parent content) all need dedicated signals. Demo 1 step 2 (2026-04-15) validated the dimensions; demo 2 step 2 (2026-04-15) surfaced the critical refinement that `parent_contradictions` needs per-contradiction status with required rationale (a boolean or two-list split loses the load-bearing "partial resolution" case).

**Key principle: Evaluator verifies resolution claims, does not trust them.** Child synthesis will often claim to resolve parent contradictions; the Evaluator's job is to independently walk the specific failure mode the parent evaluator described and check whether the child actually closes it. Demo 2 step 2 showed synthesis claiming "resolved" where Evaluator correctly judged "partial" — this divergence is load-bearing signal, not noise.

**Relationship to `/research-program`.** Informal chains of `/deep-research --continue-from` runs and formal `/research-program` invocations produce structurally similar output (a coordinated multi-campaign research body). The difference:

- Chain mode is *reactive* — the user decides after each campaign whether to extend. No program plan, no cross-campaign synthesis, no program-level evaluation.
- `/research-program` is *proactive* — megatopic is decomposed up front, campaigns are dispatched per a DAG, cross-campaign synthesis and program-level evaluation always run.

Use chain mode when a single leaf of an already-finished campaign turned out bigger than expected. Use `/research-program` when you know up front that a topic is multi-campaign, or when a chain has reached 3+ links and would benefit from formal synthesis.

**Default philosophy:** generous. The user opted into deep research; don't cheap out on them. Defaults produce good campaigns; flags tighten or loosen.

**No-args invocation:** prompts the user for a seed topic and scope notes.

## Output Structure

```
docs/briefs/<seed-slug>/
├── parent.md                    # Synthesis-written overview + navigation
├── <facet-1>.md                 # Specialist brief
├── <facet-2>.md                 # Specialist brief
├── <facet-N>.md                 # Specialist brief
└── campaign.md                  # Evaluator's quality report + metadata
```

**parent.md structure:**

```markdown
---
description: "Deep research campaign: {seed topic}"
type: brief
content_type: campaign-parent
updated: {date}
confidence: speculative
status: draft
---

# Deep Research: {Seed Topic}

## Context
{What was researched and why}

## Decomposition
{The tree, with links to each leaf brief}

## Key Findings
{Synthesis of major themes across specialists}

## Contradictions Flagged
{Explicit list — not silently resolved}

## Coverage Assessment
{What the campaign covered; what it did not}

## Related Campaigns / Briefs
{Cross-references to prior work}

## Campaign Metadata
{Budget used, duration, specialist count, quality scores}
```

**Each specialist brief (<facet-N>.md) follows the standard brief schema** ([schema.md](../../grimoire/docs/knowledge/architecture/schema.md)) with `content_type: brief`, typed `related[]` added by synthesis, and structured `sources[]`.

**campaign.md** contains the evaluator's structured quality report (YAML block + prose summary), a log of decomposition decisions, and cost accounting.

## Budget and Fences

User asked for high fences, prioritizing good results over token savings. The architecture honors that:

### Defaults

| Parameter | Default | Rationale |
|-----------|---------|-----------|
| Max specialists | 5 | Anthropic's reference uses 3-5. 5 is a generous default. |
| Max depth | 3 | Deeper than 3 rarely adds value; individual briefs handle internal complexity |
| Per-specialist time budget | 10 minutes | Long enough for serious research; short enough to detect stuck agents |
| Per-specialist token budget | 150K tokens | ~$0.75 at Sonnet rates; generous for iterative search |
| Campaign dollar budget | $30 | Covers a comfortable medium campaign with headroom |
| Campaign time budget | 30 minutes wall clock | Parallel specialists + sequential synthesis |

### Hard fences (not overridable without flags)

- Max parallel specialists: 7 (above this, the Lead should decompose into sub-orchestrators — deferred to v2)
- Max depth: 4 (deeper than this = design problem with the decomposition)
- Max campaign budget: $100 (above this, the user should explicitly pass `--budget`)

### Soft fences (warn, continue)

- If a campaign is trending toward exceeding its budget by >50%, the Lead warns and asks whether to continue or truncate
- If synthesis detects >3 contradictions, the Lead surfaces them to the user before writing output
- If the evaluator's coverage score is <0.5, the Lead suggests a follow-up campaign

## Cost Model

Using the [Model Selection Pattern](model-selection-pattern.md) math:

| Role | Model | Typical tokens | Typical cost |
|------|-------|---------------|-------------|
| Lead Researcher | Opus | ~3 calls × 50K tokens | ~$2.50 |
| 5 Specialists | Sonnet | 5 × 150K tokens | ~$7.50 |
| Synthesis Agent | Opus | 1 × 200K tokens | ~$4.00 |
| Evaluator Agent | Opus | 1 × 150K tokens | ~$3.00 |
| **Total (default campaign)** | | | **~$12-15 (calibrated; see below)** |

Large campaign (7 specialists, depth 4, higher per-specialist budget): ~$35-40.

If everything ran on Opus (naive): ~$50-75.
If everything ran on Sonnet (penny-pinching): ~$12-15 but with worse decomposition and synthesis quality.

The mix captures most savings while keeping quality where it matters.

### Calibration from Demo 1 (2026-04-15)

Two real campaigns (one fresh, one chain-mode extension), both at `--parallel 3 --budget 15`:

| Campaign | Specialists | Synthesis | Evaluator | Lead (est.) | Total |
|----------|-------------|-----------|-----------|-------------|-------|
| Fresh (3 facets, depth 1) | ~$1.10 | ~$1.40 | ~$2.10 | ~$1.00 | **~$5.60** |
| Chain-mode (3 facets, depth 1) | ~$1.10 | ~$1.85 | ~$2.00 | ~$1.10 | **~$6.05** |

Real cost came in at ~35% of the $17 default estimate. Two reasons:
- Single-level decomposition (3 facets, no sub-facets) produced strong output without needing depth-3 trees. The $17 estimate assumes a more complex decomposition.
- Per-specialist token usage was ~80K, not 150K. At ~5-6 min per specialist on scoped subdomains, they hit natural stopping points well before 150K.

**Revised calibration:**

- Small scoped campaign (3 specialists, depth 1): **~$6**
- Medium campaign (5 specialists, depth 2): **~$12-15** (extrapolated)
- Large megatopic campaign (7 specialists, depth 3): **~$20-25**

The original $30 budget default still works — it's a cap, not a target. Users with scoped seeds can safely pass `--budget 15`.

## Integration with Build Process

Deep research plugs into the pipeline at multiple points:

### User-invoked standalone

```
/deep-research "cEDH metagame analysis"
```

The full flow above. Output: brief directory. User manually promotes to `published` when reviewed.

### Called from `/research`

`/research` evaluates whether a topic warrants the deeper treatment. Trigger conditions:

- Topic spans 5+ orthogonal aspects
- User explicitly requests depth
- Topic is unfamiliar enough that decomposition itself is valuable

`/research` either completes normally (single-agent) or escalates:

```
/research decides topic is too broad
        ↓
/research suggests: "This topic is broad. Recommend /deep-research for coverage?"
        ↓
User approves → /research invokes /deep-research with the topic
```

Change to `/research` SKILL.md: add a check in Phase 1 (Scope) that evaluates breadth. If broad, suggest deep research.

### Called from `/ideate`

After scout produces its landscape, `/ideate` may identify domains that warrant deep research rather than standard `/research`. Typically these are the highest-complexity domains in the research plan.

Change to `/ideate` SKILL.md: in Phase 2 (Domain Identification), for each domain, note whether it's a `/research` or `/deep-research` candidate.

### Called from `/brief`

A roadmap phase may have a blocking brief that needs deep multi-facet coverage. `/brief` can invoke `/deep-research` instead of doing the research itself.

Change to `/brief` SKILL.md: add a branch — if the blocking brief scope is broad, invoke `/deep-research`; otherwise, do standard research and curation.

### Called from `/expand`

When scope expansion introduces a new subsystem, deep research may be warranted for that subsystem.

Change to `/expand` SKILL.md: suggest `/deep-research` for genuinely new subsystems (not just extensions of existing work).

## Prompt Skeletons

### Lead Researcher system prompt (key excerpt)

```
You are the Lead Researcher orchestrating a deep research campaign on: {seed topic}.

Your responsibilities:
1. Decompose the topic into a domain tree (PMEST-faceted first pass, then hierarchical refinement
   with MECE constraints within each facet).
2. At each potential split, decide: leaf or decompose further? Use veto + weighted signals:
   - VETO if: depth > {max_depth} OR budget exceeded
   - STOP if any child would be trivially narrow (specificity ratio check)
   - CONTINUE if: proposed children are semantically distinct (orthogonality) AND each is
     substantive enough to warrant a standalone brief
3. Present the tree to the human for review before dispatch.
4. Dispatch specialists in parallel via Agent(model="sonnet") with scoped contexts.
5. Monitor progress; handle failures (timeout → retry once → partial results).
6. After all complete: hand off to Synthesis Agent.
7. After synthesis: hand off to Evaluator Agent.
8. Write final output; run `/knowledge-index` to regenerate the index from frontmatter (do NOT hand-edit `docs/knowledge-index.yaml`).

Do NOT:
- Research content yourself (specialists do that)
- Write the parent brief yourself (synthesis does that)
- Evaluate quality yourself (evaluator does that)

Think carefully about the decomposition. The quality of the campaign is bounded by it.
```

### Specialist system prompt (key excerpt)

```
You are a research specialist investigating: {leaf subdomain description}.

Context:
- Seed topic: {seed}
- Parent facet: {parent facet description}
- Sibling subdomains (for awareness, do not research these): {sibling titles + one-line descriptions}
- Relevant existing knowledge: {curated list of existing brief summaries}
- Cross-reference targets: {sibling slugs for use in related[] suggestions}

Your budget: {token budget}, wall-clock: {time budget}.

Your task:
1. Deeply investigate this subdomain using web search, source reading, and reasoning.
2. Produce a draft brief in the standard schema. Include:
   - Frontmatter: description, slug, tags, audience, confidence: speculative, status: draft
   - Body: structured sections appropriate to the content
   - sources: [{url, accessed_at, excerpt}] with per-claim attribution
   - A final "Suggested cross-references to sibling subdomains" section listing candidate
     related[] edges with proposed relationship types (synthesis uses these as input)
3. Iteratively refine: search → gather → filter → write. Stop when budget runs out.
4. Return a ~100-word summary of your findings. Your summary MUST include a "Sibling scope
   avoided" line (1-2 sentences) listing what you noticed you could have covered but
   explicitly avoided per your boundaries. This signals decomposition quality to the
   evaluator and surfaces drift early.

Do NOT:
- Wander into sibling subdomains
- Write final cross-references yourself (suggest them in the "Suggested cross-references"
  section; synthesis writes the frontmatter edges)
- Research topics already covered by existing briefs (cite them instead)
```

### Synthesis system prompt (key excerpt)

```
You are the Synthesis Agent for a deep research campaign on: {seed topic}.

You have been given N draft briefs produced by specialists, plus the domain tree.

Your task:
1. Read all briefs. Do not research additional content.
2. Add typed cross-references between briefs. Use the closed vocabulary:
   uses, used-by, history-of, variant-of, enables, competes-with, contextualizes,
   applied-to, supersedes.
3. Identify contradictions — claims in different briefs that disagree. Flag each explicitly
   in the parent brief's "Contradictions Flagged" section. Do NOT silently resolve.
4. Write the parent brief. Structure: Context, Decomposition (tree with links), Key Findings
   (major themes across specialists), Contradictions Flagged, Coverage Assessment, Related,
   Campaign Metadata.
5. Self-review your cross-references before returning. For each edge you added, confirm (a)
   the slug target exists, (b) the relationship type matches the closed vocabulary, (c) the
   semantic match between the two briefs is real (not decorative). If any fail, revise.
   Demos showed this self-review catches 1-2 weak edges per campaign.

Do NOT:
- Research additional content
- Silently resolve contradictions
- Edit specialist briefs beyond adding cross-references
- Produce an appended list of specialist outputs — synthesize them
```

### Evaluator system prompt (key excerpt)

```
You are the Evaluator for a deep research campaign on: {seed topic}.

You have been given ONLY the produced briefs (N specialist briefs + parent brief). You have
NOT been given the decomposition reasoning or specialist prompts. This is intentional —
evaluate what was produced, not what the orchestrator intended.

Your task:
1. Coverage: generate an expected outline of a comprehensive treatment of {seed topic}.
   For each aspect, check if a brief covers it. Compute coverage ratio. Flag uncovered
   high-priority aspects.
2. Coherence: score the set of briefs for narrative coherence (1-5 with rationale). Use
   chain-of-thought reasoning.
3. Contradictions: scan for contradictions across briefs. Report each as
   (brief_a, brief_b, conflict_description, severity).
4. Severity reassessment: for each contradiction that synthesis flagged, independently
   judge its severity. When your judgment differs, report (id, synthesis_severity,
   your_severity, rationale). This is a standard output — not exceptional. Do not defer
   to synthesis on severity.
5. Groundedness: for each brief, check that claims are supported by the sources listed in
   frontmatter. Flag claims without supporting sources. Score per-brief groundedness.
6. Recommendations: suggest follow-up campaigns (for uncovered aspects) and briefs needing
   revision.

Output: structured YAML report + prose summary. The Lead will use this to decide next steps.

Constraints:
- Only reference provided briefs; do not use external knowledge to "verify" claims
- Output in structured format (claim/evidence/verdict triples for findings)
- If a brief cites a source you cannot evaluate (e.g., you don't know the source), flag as
  "unverified" rather than "supported" or "unsupported"
```

## Campaign History

Every campaign logs to `docs/briefs/<seed-slug>/campaign.md`:

```yaml
campaign_id: <uuid>
seed_topic: "..."
started_at: <timestamp>
completed_at: <timestamp>
invocation:
  mode: user | ideate | brief | research | expand
  arguments: { ... }
  budget: $30
domain_tree:
  - node_id: root
    description: "..."
    children: [...]
  # ...
specialist_outputs:
  - agent_id: specialist-1
    subdomain: "..."
    status: complete | partial | failed
    duration_seconds: 380
    tokens_used: 142000
    brief_slug: "..."
    sources_cited: [...]
synthesis:
  parent_brief_slug: parent
  cross_references_added: 14
  contradictions_flagged: 2
quality:
  coverage_ratio: 0.82
  coherence_score: 4.1
  contradictions_detected: 2
  groundedness_avg: 0.76
cost:
  total_tokens: 1240000
  estimated_usd: 17.80
```

This supports v2 features (gap-seeded research, budget calibration, decomposition learning). For v1, it's a structured log — readable by humans, parseable by future tooling.

## Conventions

### Tone of briefs

Specialist briefs should be practical and opinionated, like other project briefs. Assessments, not descriptions.

### Naming

- Campaign directory: `docs/briefs/<seed-slug>/` where `<seed-slug>` is a kebab-case version of the seed topic
- Specialist briefs: `<facet-slug>.md` (kebab-case)
- Parent brief: always `parent.md`
- Campaign report: always `campaign.md`

### Frontmatter

All briefs produced by deep research start at `confidence: speculative, status: draft`.

### Cross-reference vocabulary

Standard (see [knowledge-storage-pattern.md](knowledge-storage-pattern.md)): uses, used-by, history-of, variant-of, enables, competes-with, contextualizes, applied-to, supersedes.

## Dependencies

| Dependency | Purpose | Notes |
|------------|---------|-------|
| Agent tool (with `model:` parameter) | Spawn specialists, synthesis, evaluator | Core primitive |
| WebSearch, WebFetch | Specialist research | Already available |
| knowledge-index | Context loading, output registration | Existing infrastructure |
| knowledge/search (future) | Curated context for specialists | Falls back to filesystem search in projects without BQ |
| AskUserQuestion | Human review checkpoint | Already available |
| `/research` SKILL.md | Integration — escalation from /research | One-time edit |
| `/ideate` SKILL.md | Integration — domain classification | One-time edit |
| `/brief` SKILL.md | Integration — broad phase briefs | One-time edit |
| `/expand` SKILL.md | Integration — new subsystem research | One-time edit |

No external infrastructure. No code. Pure skill orchestration.

## What's Deferred

- **Gap-seeded autonomous research** (v2) — the Lead consumes `knowledge/gaps` output as seed input, running without a human-provided topic. Requires Phase 9d edge creator to exist.
- **`knowledge/create` integration** (v2) — instead of writing files directly, specialists call `knowledge/create` with quality-gated status. Requires Phase 9c.
- **Anthropic Citations API integration** (v2) — CitationAgent as a distinct role with Haiku for structured attribution.
- **Sub-orchestrators** — when a subdomain itself warrants its own parallel campaign. Deferred until flat orchestration (≤7 specialists) proves insufficient.
- **Formal SPRT stopping** — Wald's sequential probability ratio test. v1 uses plain-language LLM evaluation with veto + weighted signals.
- **Custom embedding-based decomposition** — using embeddings to validate orthogonality of proposed children. v1 relies on LLM judgment.
- **Campaign history in BigQuery** — v1 logs to filesystem. BQ-backed campaign history supports cross-campaign learning and analytics. Deferred to Phase 9e.
- **Dynamic effort adjustment** — scaling effort per agent based on progress signals. v1 uses fixed effort per role.
- **Model routing** — starting on Haiku and escalating on low-confidence outputs. v1 uses archetype-based defaults.
- **Shared adjacency mechanism** with the knowledge-edge creator — both find "what's adjacent." Shared infrastructure deferred until edge creator is also designed.

## Open Questions

1. **When exactly does `/research` escalate?** Triggering "too broad" needs a heuristic. Start with user choice, add automated detection later.
2. **How should the human review UI render the tree?** AskUserQuestion has text-only output. A collapsible tree view would be better; text bullets work for v1.
3. **Resumption after failure** — if the API goes down mid-campaign, how to resume? LangGraph's durable checkpointing solves this; v1 does not. Mitigation: log state to filesystem at each phase boundary so manual resumption is possible.
4. **Multi-campaign deduplication** — what if two campaigns would produce overlapping briefs? No detection in v1. Future: the knowledge index + reuse check helps naturally.
5. **Cost caps per role** — should specialists have their own $ cap, or just token budgets? Token budgets implicitly cap cost at Sonnet rates. Explicit $ caps for v2.
6. **Human checkpoints beyond decomposition review** — should there be approval before synthesis? Before evaluation? v1 has one checkpoint (decomposition); add more only if user requests.
7. **How do campaigns interact with `/doc-review`?** Campaign outputs are briefs; they should be subject to doc-review alongside other briefs. No special handling needed.
8. **Should the evaluator also check for outdated sources?** v1: no, that's `knowledge/lint`'s job. Evaluator focuses on coverage/coherence/contradictions/grounding at campaign time.

## Related Documents

| Document | Purpose |
|----------|---------|
| [Research Skills Overview](research-skills-overview.md) | Family view — how /research, /deep-research, /research-program compose |
| [Research Program Architecture](research-program-architecture.md) | The tier above — megatopic-scale programs that dispatch /deep-research as campaigns |
| [Deep Research North Star](deep-research-north-star.md) | Vision, principles, domain model |
| [Model Selection Pattern](model-selection-pattern.md) | Archetype-based model+effort assignments |
| [Build Process](build-process.md) | Pipeline deep research integrates into |
| [First-Principles Primer](first-principles.md) | Thinking methodology (applies to decomposition + synthesis) |
| [Scout Architecture](scout-architecture.md) | Sibling skill (outward prior-art discovery) |
| [Knowledge Workers (grimoire)](../../grimoire/docs/architecture/north-star-knowledge-workers.md) | Capability-level vision |
| [Embeddings/Clustering Brief](../../grimoire/docs/briefs/embeddings-clustering-gap-detection.md) | Research foundation — gap detection |
| [External Taxonomy Brief](../../grimoire/docs/briefs/external-taxonomy-gap-detection.md) | Research foundation — Wikidata integration |
| [Multi-Agent Orchestration Brief](../../grimoire/docs/briefs/multi-agent-orchestration.md) | Research foundation — orchestrator-workers |
| [Research Campaign Design Brief](../../grimoire/docs/briefs/research-campaign-design.md) | Research foundation — decomposition, stopping, quality |
