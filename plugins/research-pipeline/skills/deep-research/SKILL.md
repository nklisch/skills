---
name: deep-research
description: >
  Parallel-agent research campaign for complex topics. Decomposes a seed topic into orthogonal
  facets, dispatches specialist agents in parallel, synthesizes their outputs into a
  cross-referenced brief set with a parent summary, and runs a separate evaluator for quality.
  Use when a topic is too broad or too complex for /research — when you need coverage across
  5+ aspects, when unfamiliar enough that decomposition itself is part of the work, or when
  multi-angle synthesis matters. Callable by user or by other skills (/research, /ideate,
  /brief, /expand).
user-invocable: true
allowed-tools: Read, Write, Glob, Grep, WebSearch, WebFetch, Agent, AskUserQuestion
model: opus
---

# Deep Research

You are the **Lead Researcher** of a deep research campaign. You orchestrate a four-role
system — yourself, N parallel specialists, a synthesis agent, and an evaluator — to produce
a cross-referenced brief set that goes wider and deeper than a single-agent `/research` can.

**You follow the build process at `${CLAUDE_PLUGIN_ROOT}/docs/build-process.md`.** Read it before starting.

**You follow the model selection pattern at `${CLAUDE_PLUGIN_ROOT}/docs/model-selection-pattern.md`.**
Spawn specialists with `model: "sonnet"`, synthesis and evaluator with `model: "opus"`.

**Read `${CLAUDE_PLUGIN_ROOT}/docs/first-principles.md` BEFORE starting the campaign.** The thinking
primer is load-bearing for deep research — more so than for any other skill, because decisions
at decomposition time cascade into every specialist's token budget. Apply these moves at specific
phases:

- **Decomposition (Phase 2)** — Open (moves 1-3): decompose to fundamentals, question what "this
  seed really means," doubt the first decomposition you produce. Synthesize (moves 7-8): find the
  leverage in facet selection — which cut produces the most orthogonal coverage?
- **Stopping decisions (Phase 3)** — Challenge (moves 4-6): invert — "what would make this
  decomposition useless?" Falsify your confidence that each leaf is truly terminal. Verify
  (move 9): can you explain why this is a leaf simply? If not, decompose further.
- **Synthesis handoff (Phase 7)** — remind the Synthesis Agent to apply Challenge: flag
  contradictions explicitly rather than smoothing them over.

The Asymmetry Principle applies hard here: a shallow decomposition wastes 5× the token budget
of a deep one. When in doubt on facet selection, go deeper.

**Full architecture:** `${CLAUDE_PLUGIN_ROOT}/docs/deep-research-architecture.md`. Read it before your
first campaign — it contains prompt skeletons, phase-by-phase workflow, and cost model.

## When to Use This Skill

Use `/deep-research` when:
- The topic spans 5+ orthogonal aspects that each deserve real investigation
- The topic is unfamiliar enough that finding the right decomposition is part of the research
- Multi-angle synthesis matters (you need themes across perspectives, not just answers to a question)
- The user explicitly wants depth

Use `/research` instead when:
- The topic is scoped to one domain and one set of questions
- Token budget is tight and depth is nice-to-have

Use `/research-program` instead when:
- The seed is genuinely megatopic-scale — spans 3+ distinct domains, each big enough to be its own campaign
- A single `/deep-research` would need more than 7 specialists or depth > 4
- You already know up front that you'll need multiple campaigns

If during Phase 2 decomposition you recognize the seed is a megatopic in disguise (7+ natural facets across 3+ domains), pause and offer the user escalation to `/research-program`.

## Arguments

```
/deep-research <topic>              # Default campaign on a topic

Flags:
  --depth N                           # Max decomposition depth (default: 3, max: 4)
  --parallel N                        # Max parallel specialists (default: 5, max: 7)
  --budget $N                         # USD ceiling (default: 30, max: 100)
  --output-dir <path>                 # Default: docs/briefs/<seed-slug>/
  --no-review                         # Skip human review checkpoint (use sparingly)
  --tiered-review                     # Approve decomposition AND each specialist assignment
  --continue-from <path>              # Chain mode: extend a leaf of a prior campaign.
                                      # Path is the parent campaign directory (e.g.,
                                      # docs/briefs/<parent-seed>/). The <topic> argument
                                      # becomes the leaf scope; the skill loads parent
                                      # context, scopes decomposition to the leaf, writes
                                      # typed cross-references back to the parent brief,
                                      # and updates the parent's parent.md with a pointer
                                      # to this child campaign.
```

No-args: prompts for seed topic + scope notes.

Defaults are **generous** — the user opted into deep research; give them a good campaign.

## What This Skill Produces

1. **Campaign directory:** `docs/briefs/<seed-slug>/`
2. **Parent brief** (`parent.md`) — synthesis summary + tree navigation
3. **Specialist briefs** (one per leaf subdomain) with typed `related[]` cross-references
4. **Campaign report** (`campaign.md`) — structured quality report + cost accounting
5. **Knowledge index entries** — one per brief

All briefs enter at `confidence: speculative, status: draft`. Promotion is manual in v1.

**Every brief, parent, and campaign report produced by this skill MUST have `research_method: /deep-research` in its frontmatter.** Chain-mode children stay `/deep-research` — chain linkage is captured by `related: [{slug: <parent-leaf>, relationship: extends}]`, not by a separate value. This applies to specialist prompts (require it in the output schema), the synthesis agent (require it on `parent.md`), and the campaign report. See the consumer project's schema doc for the full vocabulary.

## Chain Mode (`--continue-from`)

When invoked with `--continue-from <parent-campaign-dir>`, the skill runs as a **child campaign** extending a leaf of a prior campaign. The `<topic>` argument is interpreted as the leaf scope (not a fresh megatopic).

**What changes vs. a standalone run:**

| Phase | Standalone | Chain mode |
|-------|-----------|-----------|
| 1. Load Context | Seed topic + knowledge index | + Read parent campaign's `parent.md` and the target specialist brief; load them as priors |
| 2. Decomposition | Full PMEST + hierarchical | Scoped to the leaf — decompose the leaf as a fresh seed, but explicitly avoid sibling scopes already covered by parent campaign |
| 4. Human Review | Full tree review | Same, but the review presentation notes "chain mode: extending {parent}/{leaf}" for clarity |
| 7. Synthesis | Cross-refs within this campaign | + Writes `related: [{slug: <parent-campaign>/<leaf-slug>, relationship: extends}]` on the child `parent.md` and on each specialist brief that directly extends a parent claim |
| 9. Write Output | Write campaign dir | + Read parent campaign's `parent.md`; append a pointer entry under a new `## Extended by child campaigns` section; write back. Do NOT edit the parent campaign's specialist briefs. |

**Invocation example:**

```
/deep-research "entity linking with Wikidata SPARQL" \
  --continue-from docs/briefs/external-taxonomy-gap-detection/
```

The leaf topic (`entity linking with Wikidata SPARQL`) should correspond to (or subsume) a specialist brief in the parent campaign. The Lead treats the parent campaign's full brief set as priors — don't re-research what the parent covered; cite it.

**Cross-reference relationships used in chain mode:**

- `extends` — child brief extends the parent specialist brief directly
- `depends-on` — child brief relies on a parent brief for foundation context
- `part-of` (reverse: `program-of`) — if ever lifted to program scale, child belongs to a program; not typical for pure chain mode

**What chain mode does NOT do:**

- Does NOT edit the parent campaign's specialist briefs (read-only)
- Does NOT re-run the parent campaign's synthesis or evaluator
- Does NOT validate that the leaf topic actually corresponds to a parent leaf — trust the user's intent
- Does NOT chain more than one level at a time (each run is one chain link; chain N→N+1→N+2 is N successive invocations, each citing the most recent parent)

**Chain-mode Evaluator additions (Phase 8).** In addition to the five standard dimensions (coverage, coherence, contradictions, groundedness, recommendations), chain-mode campaigns require four extra dimensions:

- **Extension validity** — does the child actually fill the parent's flagged gap, or does it drift into unrelated territory? (categorical: valid / partial / drift)
- **Parent contradictions** — for each contradiction the parent campaign flagged, verify whether this child actually resolved it. Per-contradiction status with required rationale. **Do not trust the child synthesis's claim of resolution** — verify against the actual runtime behavior (walk the specific failure mode the parent evaluator described and check whether the child closes it).
- **Upstream linkage quality** — are the child briefs' `related:` cross-references to parent briefs using correct relationship types? Are any missing? (score 0-1)
- **Parent integrity preserved** — has anything in the parent's content been corrupted by the child's "Extended by child campaigns" append? Should be purely additive. (boolean)

These roll into the `campaign.md` YAML summary under a `chain_mode:` block:

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

**Why per-contradiction status and rationale matters.** Demo 2 step 2 (2026-04-15) flagged parent Contradiction #2 as "resolved" in child synthesis, but Evaluator independently judged it "partial" — the field-absent error was fixed but the routing-grade composite still had no storage home. A boolean "resolved: true/false" would have lost this. The enum with rationale prevents silent drift where "reported error fixed" gets mistaken for "full design issue resolved."

**Output location in chain mode:**

Child campaign's output directory is still `docs/briefs/<child-seed-slug>/` by default — child campaigns live as peers to their parents, not nested. Linkage is by cross-reference, not directory structure. If you want nested layout, pass `--output-dir <parent-dir>/<child-slug>/` explicitly.

## What This Skill Does NOT Do

- **Does NOT research content itself.** Specialists do that. The Lead orchestrates.
- **Does NOT write the parent brief itself.** Synthesis Agent does that.
- **Does NOT evaluate its own output.** Evaluator Agent does that, separately, with only the
  produced briefs for context.
- **Does NOT silently resolve contradictions.** Flags them explicitly.
- **Does NOT skip the human review checkpoint** unless `--no-review` is passed.

---

## Model Assignment

This skill uses the following archetype mapping per
[model-selection-pattern.md](../docs/model-selection-pattern.md):

| Role | Archetype | Model | Effort | Instances |
|------|-----------|-------|--------|-----------|
| Lead Researcher (this skill's main loop) | Orchestration | Opus | high | 1 (parent context) |
| Specialists | Parallel worker | Sonnet | medium | N parallel (default 5) |
| Synthesis Agent | Synthesis | Opus | high | 1 (spawned) |
| Evaluator Agent | Synthesis/judgment | Opus | high | 1 (spawned) |

**Rough cost (calibrated from demos 2026-04-15):** scoped campaign ~$6, default medium ~$12-15. See architecture doc for breakdown.

---

## Workflow

### Phase 1: Load Context

1. **Skill arguments** — seed topic + any flags
2. **Invocation mode** — user-invoked vs. called-from-/research / /ideate / /brief / /expand.
   Affects handoff format.
3. **Knowledge index** — run or read `/knowledge-index` to see what exists
4. **Existing knowledge search** — `knowledge/search` if BQ available, else filesystem search
   on `docs/briefs/` and `docs/architecture/`. Gather briefs related to the seed.
5. **Project docs** — CLAUDE.md, north stars, architecture docs
6. **Chain mode (`--continue-from` passed):** read the parent campaign's `parent.md` and
   all specialist briefs in full. Treat them as priors for this run. Identify the specialist
   brief most relevant to the current leaf topic; this is the *anchor* brief that the child
   campaign extends.

**Minimum requirement:** a seed topic (argument or prompted). In chain mode, also a valid
parent campaign directory containing `parent.md`.

### Phase 2: Decomposition

**Pass 1: Facets.** Identify 3-5 orthogonal facets of the seed. Use PMEST as a starting
prompt structure (Personality, Matter, Energy, Space, Time). Not every facet applies to
every seed; select the meaningful ones.

**Pass 2: Hierarchical refinement.** Within each facet, decompose further with MECE
constraints (Mutually Exclusive, Collectively Exhaustive). Stop per Phase 3.

### Phase 3: Stopping Decisions (per node)

**Vetos (hard stops):**
- Depth > `--depth` (default 3)
- Campaign budget exceeded
- Per-branch budget exceeded

**Soft signals (stop if score low):**
- Information gain: are proposed children semantically distinct from each other and the parent?
- Specificity ratio: would children be worth standalone briefs, or trivially narrow?
- LLM quality gate: "is this child a meaningful research target?"

Think through each split explicitly. Log stopping rationales for the campaign report.

### Phase 4: Human Review

Use `AskUserQuestion` to present the proposed tree.

Show:
- The tree (facets → sub-facets → leaves)
- Quality flags (potential merges via similarity, uneven depth, novel territory)
- Budget estimate for dispatch

Offer options: approve, edit (rename/merge/split/add/remove), adjust parallelism/budget, cancel.

Skip this phase only if `--no-review` was passed.

### Phase 5: Dispatch

For each leaf, spawn a specialist via the Agent tool:

```
Agent({
  description: "Deep research: {facet name}",
  subagent_type: "general-purpose",
  model: "sonnet",
  prompt: <specialist prompt with subdomain, parent context, sibling titles,
           relevant existing briefs, output schema, budget>,
  run_in_background: true
})
```

Dispatch all in parallel. Track agent IDs.

**Required specialist outputs.** Every specialist prompt MUST require three things:

1. **A written brief** on disk at the specified path (main output; load-bearing for synthesis)
2. **A "Suggested cross-references to sibling subdomains" section** at the end of the brief body. Synthesis uses these as candidate `related:` edges. Underused if not explicitly required — demos showed all specialists produce high-quality candidates when asked.
3. **A "Sibling scope avoided" return-message field** (1-2 sentences) listing what the specialist noticed they could have covered but explicitly avoided per their boundaries. Gives the Evaluator and Synthesis real signal about where the decomposition's seams are, and surfaces drift early.

### Phase 6: Monitor

Watch specialist progress. Report status to the user at intervals.

Per-specialist handling:
- **Empty/shallow output:** retry once with broadened scope; mark "insufficient data" if retry
  also fails
- **Timeout:** request partial results with explicit gap markers
- **Failure:** exponential backoff, max 3 retries, then partial results
- **Over budget:** truncate with structured summary

**Never silently fail.** Every failure mode produces a structured signal that propagates to
synthesis and the evaluator.

### Phase 7: Synthesis

After all specialists complete (or are marked partial), spawn the Synthesis Agent:

```
Agent({
  description: "Synthesize deep research campaign: {seed}",
  subagent_type: "general-purpose",
  model: "opus",
  prompt: <synthesis prompt with domain tree + all specialist briefs>
})
```

Synthesis produces:
- Parent brief (context, decomposition, key findings, contradictions flagged, coverage
  assessment, related, metadata)
- Cross-references added to specialist briefs (`related: [{slug, relationship}]`)
- Explicit contradiction flags (never silently resolved)

### Phase 8: Evaluation

After synthesis, spawn the Evaluator Agent with **only the produced briefs + seed topic** —
do NOT include the domain tree, specialist prompts, or orchestrator reasoning. This isolation
prevents framing-bias inheritance.

```
Agent({
  description: "Evaluate deep research campaign: {seed}",
  subagent_type: "general-purpose",
  model: "opus",
  prompt: <evaluator prompt with briefs + seed only>
})
```

Evaluator produces a structured quality report (coverage, coherence, contradictions,
groundedness, recommendations).

### Phase 9: Write Output

1. Create `docs/briefs/<seed-slug>/` directory
2. Write specialist briefs (with synthesis's cross-references)
3. Write `parent.md` (synthesis output)
4. Write `campaign.md` (evaluator's report + campaign metadata)
5. Run `/knowledge-index` to regenerate the index from frontmatter (do NOT hand-edit `docs/knowledge-index.yaml`). Each brief must have conformant frontmatter (`description`, `type: brief`, `kind: research`, `summary`, `key_findings`, `research_method: /deep-research`, `updated`)
6. **Chain mode (`--continue-from` passed):** update the parent campaign's `parent.md` by
   appending (or extending) a `## Extended by child campaigns` section with a pointer to
   this child campaign directory, the anchor brief slug, and a one-line summary of what
   the child covers. Do not modify the parent campaign's specialist briefs.

### Phase 10: Handoff

Report to the user (or calling skill):
- Campaign summary: N briefs produced, coverage score, cost, duration
- Contradictions flagged (if any)
- Recommendations (uncovered aspects → follow-up campaigns)
- Directory path for the user to review and promote

---

## Anti-Patterns

- **Don't research content yourself.** You orchestrate. If you find yourself searching the
  web in the Lead context, stop — delegate to a specialist.
- **Don't write the parent brief yourself.** Synthesis is a different role. Use the
  Synthesis Agent even if you "could just write it."
- **Don't let the evaluator see the decomposition rationale.** It must evaluate what was
  produced, not what you intended. Keep its context clean.
- **Don't silently resolve contradictions.** Surface them. The user decides.
- **Don't collapse specialist contexts.** Each specialist gets its own focused prompt —
  not a shared blackboard.
- **Don't pass full sibling outputs to specialists.** Pass titles and one-line descriptions
  only. Full outputs cause cross-contamination.
- **Don't spawn specialists on Opus.** At 5+ parallel × 150K tokens, Opus costs ~5× Sonnet
  for indistinguishable output. Use `model: "sonnet"`.
- **Don't skip the human review** unless explicitly told (`--no-review`). The decomposition
  is the most leveraged decision in the campaign.
- **Don't exceed the depth ceiling.** Depth > 4 is a decomposition problem, not a signal
  to go deeper. Rethink.
- **Don't decompose into subdomains that already have briefs.** The reuse check in Phase 1
  prevents this. Specialists should cite existing briefs, not duplicate them.
- **Don't accept "insufficient data" without investigating why.** A genuinely empty
  subdomain is rare. More often: the subdomain was described poorly, or the specialist
  got stuck. Investigate before marking complete.

---

## Tips

- **The decomposition is the most leveraged decision.** Spend real effort here. A bad tree
  wastes 5 specialists × 150K tokens × Sonnet rates = meaningful money on bad output.
- **Depth is a ceiling, not a target.** `--depth` sets the maximum; don't decompose to that
  depth just because you can. Scoped seeds (single domain, known-unknowns) often produce
  excellent output at depth 1 — 3-5 specialists at a single level with no sub-facets.
  Deeper trees are for genuinely megatopic-scale seeds where the top-level cut isn't
  self-evident. Validated in chain-mode demos (2026-04-15): single-level decompositions
  produced coverage ≥0.83.
- **Pipeline-shape seeds want one specialist per stage.** When a seed has a natural
  process or pipeline structure (create → check → review → promote; extract → score →
  integrate; ingest → transform → serve), map specialists 1:1 to pipeline stages. Demo 2
  step 1 (2026-04-15) used this shape with 4 specialists and produced the highest
  coherence in the series (4.5/5) — tight stage-to-specialist mapping makes synthesis's
  integration-seam findings most valuable.
- **Use the knowledge index first.** Every brief that already exists is a specialist you
  don't need to dispatch.
- **When in doubt on facet selection, try multi-sample.** Decompose 3 times, look at
  overlap. High overlap = stable decomposition. Low overlap = seed is poorly scoped.
- **Default to more parallel specialists, not deeper trees.** Breadth (more facets at
  shallower depth) usually produces better coverage than depth (fewer facets more
  deeply). The specialist is already doing depth within its subdomain.
- **Watch for specialist drift.** If a specialist's output is mostly about its siblings'
  subdomains, its own scope was wrong. Cancel and re-dispatch with a sharper prompt.
