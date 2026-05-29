---
description: "Architecture for the research-program skill — four-role orchestrator-workers pattern at megatopic scale, campaigns as full /deep-research runs, sequential/parallel dispatch with a dependency DAG, cross-campaign synthesis, program-level evaluation with isolated context. Third tier of the research-skills family."
type: architecture
updated: 2026-04-15
---

# Architecture: Research Program

*Last updated: 2026-04-15*

> How the skill is structured. For the family context, see [Research Skills Overview](research-skills-overview.md). For the scale below, see [Deep Research Architecture](deep-research-architecture.md).

## Thinking Layer

Research program is the most thinking-intensive research skill. Decomposition at program scale decides which **domains** warrant their own campaigns — a choice that cascades into campaigns' decompositions, which cascade into specialists' investigations. Three phases are load-bearing, and each maps to specific [first-principles](first-principles.md) moves:

| Phase | Emphasis | Why |
|-------|----------|-----|
| **Program decomposition** (Phase 2) | Open + Challenge | Identifying distinct domains requires questioning the megatopic's natural boundaries. Don't accept the first cut; find the decomposition where domains are independently meaningful yet collectively cover the megatopic. |
| **Dependency resolution** (Phase 3) | Challenge + Verify | Which campaigns genuinely need prior findings as priors? Invert — "what would make this dependency spurious?" Sequential dependencies inflate wall-clock; parallel misses real couplings. |
| **Cross-campaign synthesis** (Phase 7) | Synthesize + Challenge | Find program-level themes that no single campaign could surface. Flag cross-domain contradictions rather than smoothing them over — these are often the most valuable findings. |

**The Asymmetry Principle sharpens at program scale.** A bad program decomposition wastes N campaigns × 5 specialists × 150K tokens on structurally wrong questions. A medium program is ~$35-60; a wasted one is that much *plus* the cost of re-running. When in doubt on campaign selection, decompose the megatopic further, consider more campaigns, or split a proposed campaign in two.

## System Overview

Research program is a standalone skill (`/research-program`) callable by the user directly or by upstream skills (`/ideate`, `/brief`, `/expand`) when a topic is genuinely megatopic-scale. It can also be escalated to from `/deep-research` when a campaign's seed turns out to span multiple domains. It produces a program directory containing a meta-plan, cross-campaign synthesis, program-level evaluation, and one full `/deep-research` campaign output per constituent campaign.

```
Callers                          Research Program                       Output
┌────────────┐              ┌──────────────────────┐              ┌──────────────────────┐
│ user       │──direct─────▶│                     │              │ docs/programs/<slug>/│
│ /research- │              │  Program Planner     │              │   program.md         │
│   program  │              │  (Opus high)         │──dispatches─▶│   super-parent.md    │
├────────────┤              │        ↓             │              │   program-report.md  │
│ /ideate    │──may-call───▶│  Decompose →         │              │   campaigns/         │
│ (megatopic │              │  Dependencies →      │              │     01-<slug>/       │
│  initiative)              │  Plan review         │              │     02-<slug>/       │
├────────────┤              │        ↓             │              │     03-<slug>/       │
│ /brief     │──may-call───▶│  ┌─────────────────┐ │              │     ...              │
│ (multi-    │              │  │ N Campaigns     │ │              └──────────────────────┘
│  blocking  │              │  │ (each = one     │ │                       │
│  briefs)   │              │  │  /deep-research │ │                 programs index
├────────────┤              │  │  run)           │ │                 updated; knowledge
│ /deep-     │──escalates──▶│  │ sequential or   │ │                 index entries per
│  research  │              │  │ parallel DAG    │ │                 brief
│ (megatopic │              │  └─────────────────┘ │
│  detected) │              │        ↓             │
├────────────┤              │  Cross-Campaign      │
│ /expand    │──may-call───▶│  Synthesizer         │
└────────────┘              │  (Opus high)         │
                            │        ↓             │
                            │  Program Evaluator   │
                            │  (Opus high, isolated)
                            │        ↓             │
                            │  Write output        │
                            └──────────────────────┘
                                    │
                            Uses: Agent (campaigns spawned as
                            Opus sub-agents that themselves
                            spawn Sonnet specialists),
                            knowledge/search, knowledge-index,
                            AskUserQuestion
```

## Four Roles

Each role has its own prompt, context window, and model assignment. This is the `/deep-research` four-role pattern lifted one level: what were "specialists" at domain scale become "campaigns" at megatopic scale. Each campaign is itself a full four-role tree.

### Program Planner (Orchestrator)

**Model:** Opus, high effort. Runs in parent context (inherits user's session).

**Responsibilities:**
- Decompose the megatopic into a campaign plan (3-7 campaigns, each with seed + scope notes + dependencies)
- Identify cross-campaign dependencies (which campaigns need prior findings as priors)
- Compute dispatch DAG (sequential edges + parallel groups)
- Present the plan for human review with inline edit support
- Spawn campaigns per the DAG; pass priors to dependent campaigns from completed ones
- Monitor campaigns at the program level; handle failures (full campaign abort → partial program with gap markers)
- Hand off to Cross-Campaign Synthesizer and Program Evaluator after all campaigns complete

**Context it holds:**
- Megatopic, user arguments, program budget
- Existing knowledge (from `knowledge/search` and knowledge-index — briefs, campaigns, and programs)
- Campaign plan (evolving through review)
- Campaign statuses (queued / dispatched / running / complete / failed / partial)
- Campaign outputs (parent.md + specialist briefs + campaign reports, as they become available)

**What it does NOT do:**
- Decompose within campaigns (each campaign's Lead does that)
- Write the super-parent (Cross-Campaign Synthesizer does that)
- Evaluate program quality (Program Evaluator does that)
- Bypass the human review checkpoint unless `--no-review` was passed

### Campaigns (Workers, = full `/deep-research` runs)

**Model:** Each campaign's Lead is Opus, spawned via Agent with `model: "opus"`. Each Lead then spawns its own Sonnet specialists, Synthesis Agent (Opus), and Evaluator Agent (Opus) per the `/deep-research` architecture.

**Spawn mechanism.** The Program Planner invokes each campaign by spawning an Opus Agent whose prompt tells it to follow the `/deep-research` workflow for its assigned seed.

**Known limitation (discovered in first program run, 2026-04-16):** Spawned campaign Leads cannot access the Agent tool — nested agent spawning is not supported in the current Claude Code infrastructure. This means each campaign runs as **single-agent research** (the Lead does all investigation, synthesis, and evaluation itself) rather than the designed four-role tree (Lead → Sonnet specialists → Opus synthesis → Opus evaluation). Quality remains high (program-1 achieved 0.86 coverage, 4.2/5 coherence) but the cost model and parallelism benefits of the four-role tree do not apply. When nested spawning becomes available, campaign Leads should revert to the full `/deep-research` workflow.

This spawned Lead is functionally identical to a user-invoked `/deep-research` Lead, except:

- Its seed is passed in (not prompted)
- It receives scope notes from the program plan (what to focus on, what to exclude)
- In sequential mode, it receives prior campaigns' `parent.md` files as priors
- Its human review checkpoint is skipped by default (the program-level review already happened). Can be re-enabled with `--review-campaign-trees`.
- Its output directory is `docs/programs/<program-slug>/campaigns/NN-<campaign-slug>/` rather than `docs/briefs/<seed-slug>/`.

Otherwise, a campaign's internals are completely standard — same four roles (Lead, Specialists, Synthesis, Evaluator), same isolation rules, same failure handling. See [Deep Research Architecture](deep-research-architecture.md).

**Responsibilities:**
- Complete the assigned campaign per `/deep-research` workflow
- Return the campaign's parent.md, specialist briefs, and campaign.md to the Program Planner
- Honor scope notes: don't drift into sibling campaigns' domains

**Context each receives:**
- Campaign seed (from program plan)
- Scope notes (rationale, in-scope, out-of-scope, sibling campaign titles)
- Priors (prior campaigns' parent.md summaries, sequential mode only)
- Relevant existing briefs from the knowledge layer (filtered to this campaign's domain)
- Per-campaign budget (default: program budget / N campaigns, with overrides)

**What they do NOT do:**
- See other campaigns' specialist briefs during their own run
- Talk directly to other campaigns
- Rewrite the program plan

### Cross-Campaign Synthesizer

**Model:** Opus, high effort. Spawned as a dedicated agent with `model: "opus"`. One instance per program.

**Responsibilities:**
- Read all campaign parents + all specialist briefs across the program
- Identify program-level themes (patterns that span campaigns, which no single campaign could surface)
- Add typed cross-references between briefs across campaigns (not within — each campaign's Synthesis already did its internal cross-refs)
- Detect and flag cross-campaign contradictions (explicit flagging — never silently resolved)
- Write `super-parent.md` — the program-level navigational synthesis
- Append to each campaign's `parent.md` a `## Part of program: <program-slug>` section pointing back to the super-parent (the cross-campaign linkage primitive — proven in chain-mode demos to work as a simple, reliable bridge without mutating other campaign content)
- Return the enriched cross-references to be written back to specialist briefs

**Context it holds:**
- The program plan (megatopic, campaign decomposition, rationale)
- All campaign parent.md files
- All specialist briefs across the program
- Existing program cross-reference vocabulary (same as deep-research plus program-level relationships: `program-of`, `parallel-to`, `depends-on`)

**What it does NOT do:**
- Re-synthesize within campaigns (each campaign's Synthesis Agent already did that — respect those outputs)
- Research additional content
- Silently resolve cross-campaign contradictions
- Edit campaign parents or specialist briefs beyond adding cross-references
- **Trust child-campaign claims of resolution at face value.** Individual campaign parents may claim they resolved contradictions flagged upstream; the Synthesizer flags these claims as *claims* (not facts) in the super-parent, and leaves independent verification to the Program Evaluator. Chain-mode demo evidence (2026-04-15) shows synthesis-reported resolutions are wrong roughly half the time in the direction of optimism (reporting "resolved" when the Evaluator judges "partial").

### Program Evaluator

**Model:** Opus, high effort. Spawned as a dedicated agent with `model: "opus"`. One instance per program. **Runs AFTER Cross-Campaign Synthesis, separately.**

**Responsibilities:**
- Assess program-level coverage (does the set of campaigns cover the megatopic? generate an expected campaign outline and compare against actual campaigns)
- Assess program-level coherence (do the campaigns form a coherent body, or do they read as disconnected silos?)
- Detect cross-campaign contradictions independently of the Synthesizer's flags (second pass)
- **Reassess severity** for each contradiction — synthesis's severity is input, not verdict. Demo data (2026-04-15) shows severity reassessment happens in ~50% of campaigns.
- **Verify resolution claims, don't trust them.** When one campaign claims to have resolved a contradiction flagged by another (or when the Synthesizer claims cross-campaign resolution), independently walk the specific failure mode and check closure. Report per-contradiction status as `resolved | partial | unresolved` with rationale. Demo 2 step 2 (2026-04-15) surfaced this as load-bearing: child synthesis reported "resolved" where Evaluator correctly judged "partial" — the runtime error was fixed but the underlying design issue remained.
- Check groundedness at the program level (are major claims in the super-parent traceable to specialist briefs?)
- Produce structured quality report with recommendations for follow-up programs or campaigns

**Context it receives:**
- ONLY the produced briefs (campaign parents + specialist briefs + super-parent)
- Megatopic seed
- Expected program/brief schema
- **NOT the program plan, NOT individual campaign evaluators' reports, NOT the Planner's rationale, NOT campaign Leads' prompts**

**What it does NOT do:**
- Know the orchestration's intent (isolation prevents framing bias)
- Re-evaluate individual campaigns (each campaign's Evaluator already did that)
- Revise any briefs (just reports)
- Promote/demote briefs (Planner decides based on report)

**Why a separate program-level Evaluator.** Individual campaign Evaluators score their own briefs in isolation. None of them see the program as a whole. Program-scale coverage (does campaign A + campaign B + campaign C collectively cover the megatopic?) and program-scale coherence (do they read as a unified body?) can only be judged by a role that sees the whole assembly — and must be judged without knowing what the Planner *intended*, to avoid inheriting the Planner's framing.

## Model Assignment Summary

Per [model-selection-pattern.md](model-selection-pattern.md):

| Role | Archetype | Model | Effort | Calls per program |
|------|-----------|-------|--------|-------------------|
| Program Planner | Orchestration | Opus | high | ~3-10 (plan + dispatch + monitoring) |
| Campaigns (each a full `/deep-research` tree) | Nested orchestrator-workers | Opus Lead + Sonnet specialists | mixed | N campaigns (default 3-5) |
| Cross-Campaign Synthesizer | Synthesis | Opus | high | 1 |
| Program Evaluator | Synthesis/judgment | Opus | high | 1 |

**Rough cost for a default medium program:** ~$35-75 (calibrated from demos). See cost model.

## Skill Workflow

### Phase 1: Load Context

The Program Planner loads:

1. **Skill arguments** — megatopic + any flags (max campaigns, program budget, parallel mode)
2. **Invocation mode** — user-invoked / called-from-`/ideate` / called-from-`/brief` / called-from-`/deep-research` (escalation) / called-from-`/expand`. Affects how results are handed off.
3. **Knowledge index** — `/knowledge-index` to see what exists
4. **Existing knowledge search** — `knowledge/search` for briefs, campaigns, and programs related to the megatopic. Programs are first-class here: if a prior program covers part of the megatopic, cite it and scope around it.
5. **Project docs** — CLAUDE.md, architecture, relevant north stars

**Minimum requirement:** a megatopic (argument, or prompted if missing).

**Reuse check output:** a short summary of what's already known — existing briefs, completed campaigns, and prior programs. Feeds into decomposition (don't propose a campaign that duplicates existing work; scope campaigns to fill gaps).

### Phase 2: Program Decomposition

Two-pass, mirroring `/deep-research`'s decomposition but at program scale.

**Pass 1: Domain decomposition.**

Identify 3-7 distinct domains within the megatopic. Prompt structure:

- Each domain should be **substantively large** — at least 5 orthogonal facets' worth of material (otherwise it's better as a specialist brief inside another campaign)
- Domains should be **semantically distinct** — no two should plausibly cover the same territory
- Domains should **collectively cover the megatopic** — together they should answer the megatopic's central questions
- Domains should be **stable under re-derivation** — if you decomposed three times, the top-level cut would roughly agree

Starting prompt forms for domain decomposition:

- By **perspective** (stakeholder-driven megatopics — "each group sees the problem differently")
- By **layer** (system-driven megatopics — infrastructure, middleware, application, interface)
- By **lifecycle** (process-driven megatopics — discovery, design, implementation, operation, evolution)
- By **faceted adaptation** (knowledge-driven megatopics — PMEST scaled: each of Personality/Matter/Energy/Space/Time becomes a campaign)

Not every pattern applies to every megatopic. The Planner picks the one that produces the most orthogonal domain cut.

**Pass 2: Campaign scoping.**

For each proposed campaign, draft:

- **Seed topic** — the campaign's focal question or subject
- **Scope notes** — what's in, what's out (explicit about boundaries with sibling campaigns)
- **Rationale** — why this campaign deserves its own `/deep-research` run instead of being a facet within another campaign
- **Estimated campaign budget** — starts from calibrated ~$6-15 range × typicality adjustment (scoped vs deeper)
- **Dependency declaration** — `depends_on: [prior-campaign-ids]` or `independent: true`

### Phase 3: Dependency Resolution and Dispatch Order

The Planner resolves the dependency DAG:

- **Parallel-eligible campaigns:** no `depends_on`, can dispatch simultaneously
- **Sequential chains:** `depends_on` edges impose ordering; each depender starts after its dependees complete
- **Dispatch groups:** campaigns in the same group dispatch together; the group completes when all its members complete

Default dispatch mode: **sequential chains where dependencies exist, parallel groups elsewhere.** Users who want all-parallel (faster, same cost) pass `--parallel`; users who want all-sequential (cheaper peak, safer resume) pass `--sequential`.

**Stopping decisions per campaign** (analog to `/deep-research` Phase 3):

**Vetos (hard stops):**

| Signal | Default |
|--------|---------|
| Campaign count ceiling | 7 |
| Program budget exceeded | $100 (configurable `--budget`) |
| Megatopic actually covered by existing programs/campaigns | cite instead of re-run |

**Soft signals:**

- Campaign distinctness (proposed campaigns must be semantically distinct; high overlap triggers merge)
- Campaign substance (proposed campaign must be big enough to warrant `/deep-research`; tiny campaigns merge or downgrade to specialist briefs in another campaign)
- Reuse overlap (if an existing campaign covers ≥70% of a proposed campaign's scope, cite it and retire the proposal)

### Phase 4: Human Review of Program Plan

The Planner presents the proposed plan via AskUserQuestion.

**Format:**

```
Proposed research program on: "{megatopic}"

Campaigns:
  01. {Campaign 1 title}
      Seed: "{seed topic}"
      Scope: {in-scope / out-of-scope}
      Depends on: {prior campaigns or "independent"}
      Estimated budget: ${budget}

  02. {Campaign 2 title}
      ...

Dispatch order: [01, 02, 03] sequential  or  [01 | 02, 03] parallel-then-sequential

Quality flags:
  ⚠ {Campaign 2} and {Campaign 5} have 0.72 scope overlap (consider merging)
  ⚠ {Campaign 3} scope is marginal — could be 5 specialists in {Campaign 1} instead
  ℹ Existing campaign `{slug}` covers part of {Campaign 4} — will cite, not re-research
  ⚠ Dispatch DAG has no parallelism (all sequential) — wall-clock will be long

Total program estimate: ~${total} across {N} campaigns.

Proceed as shown, or would you like to adjust?
```

Users can: approve, edit (rename/merge/split/add/remove campaigns), adjust dependencies, flip sequential↔parallel, adjust per-campaign budgets, cancel. Approval gates dispatch.

Skip this phase only if `--no-review` was passed. For high-stakes programs, `--review-campaign-trees` enables review of each campaign's internal decomposition tree before its specialists dispatch (tiered review).

### Phase 5: Dispatch

For each campaign in the DAG, when its dependencies are complete, the Planner spawns an Opus agent that will act as the campaign's Lead:

```
Agent({
  description: "Program campaign {NN}: {campaign title}",
  subagent_type: "general-purpose",
  model: "opus",
  prompt: <campaign-lead prompt — see prompt skeletons — includes seed, scope notes,
           priors from completed dependees, program context, per-campaign budget,
           output directory for this campaign>,
  run_in_background: true
})
```

Each spawned Lead runs the full `/deep-research` workflow internally: decomposes the seed, dispatches its own Sonnet specialists, runs its own Synthesis and Evaluator, writes its own campaign output directory.

**Parallel groups** dispatch concurrently (multiple spawned Leads running at once). **Sequential edges** block the dependent campaign's dispatch until its dependees have completed.

### Phase 6: Monitor

At the program level, the Planner monitors campaign statuses, not specialist-level progress (each campaign's Lead handles its own specialists):

- **Campaign started / in-progress / complete / partial / failed**
- **Running wall-clock** per campaign and for the program overall
- **Running cost** per campaign and for the program overall
- **Emergent signals** — if a campaign's Evaluator returns low coverage or high contradiction count, the Planner may flag it before dispatching dependents

**Per-campaign failure handling:**

- **Campaign partial** (some specialists failed but Synthesis/Evaluation completed) → accept, mark as partial in program plan, continue
- **Campaign failed** (Synthesis or Evaluation failed, or catastrophic specialist failures) → retry once with same seed and broadened budget; if still fails, mark as failed in program plan, propagate gap to downstream dependents, continue
- **Campaign over budget** → truncate per `/deep-research`'s rules; propagate partial result
- **Program over budget** → halt dispatch of un-started campaigns; run Cross-Campaign Synthesis and Evaluation on what was completed; mark program as partial

**Never silently fail.** Every failure mode produces a structured signal that propagates to Cross-Campaign Synthesis, Program Evaluation, and the final handoff.

**Progress to the user (high-level, low-detail):** "Campaign 2/5 (embeddings-clustering) complete. Campaign 3/5 (entity-linking) running — 3/5 specialists in progress. Budget used: $34 / $100."

### Phase 7: Cross-Campaign Synthesis

After all campaigns complete (or are marked partial/failed), the Planner spawns the Cross-Campaign Synthesizer:

```
Agent({
  description: "Cross-campaign synthesis: {megatopic}",
  subagent_type: "general-purpose",
  model: "opus",
  prompt: <synthesis prompt with program plan + all campaign parents + all specialist briefs>
})
```

**Synthesizer outputs:**

- **super-parent.md** — program-level navigational synthesis. Structure:
  - Context: megatopic and why
  - Program decomposition (the plan, with links to each campaign)
  - Program-level themes (what emerged across campaigns)
  - Cross-campaign contradictions (flagged explicitly; not resolved)
  - Coverage assessment at program scale
  - Related programs / major related briefs
  - Program metadata (campaign list, cost, duration)
- **Cross-campaign cross-references** — typed `related[]` additions to specialist briefs that reference briefs in other campaigns. Uses the standard vocabulary plus program-level relationships: `parallel-to`, `depends-on`, `program-of`.
- **Cross-campaign contradictions report** — explicit, itemized, not resolved.

### Phase 8: Program Evaluation

After Cross-Campaign Synthesis, the Planner spawns the Program Evaluator with **only the produced briefs + megatopic** — no program plan, no campaign evaluators' reports, no Synthesizer's rationale:

```
Agent({
  description: "Evaluate research program: {megatopic}",
  subagent_type: "general-purpose",
  model: "opus",
  prompt: <evaluator prompt — sees ONLY the super-parent + all campaign parents +
           all specialist briefs + the megatopic>
})
```

**Evaluator outputs (structured report):**

```yaml
program_coverage:
  expected_domains: [LLM-generated outline at program scale]
  covered_domains: [intersect with campaigns]
  coverage_ratio: 0.78
  uncovered_high_priority: [list]
program_coherence:
  g_eval_score: 4.0 / 5
  silos_detected: 1   # campaigns that read as disconnected from the program
cross_campaign_contradictions:
  flagged_pairs: [{campaign_a, campaign_b, conflict, severity}]
  severity_reassessments:
    - id: CC1
      synthesizer_severity: low
      your_severity: medium
      rationale: "..."
claimed_resolutions:   # verification of synthesizer- or child-claimed resolutions
  - id: C2
    claimed_by: synthesizer | campaign-<slug>
    claimed_status: resolved
    verified_status: resolved | partial | unresolved
    rationale: "What runtime behavior still breaks, if any"
groundedness:
  super_parent_claims_traced: 0.84
  unsupported_claims: [...]
recommendations:
  follow_up_campaigns: [...]
  follow_up_programs: [...]
  campaigns_needing_revision: [...]
  briefs_needing_revision: [...]
```

### Phase 9: Write Output

The Planner writes:

1. **Program directory** — `docs/programs/<program-slug>/`
2. **program.md** — the meta-plan (written after dispatch completes, reflecting what actually happened vs. what was planned)
3. **Campaign directories** — `campaigns/NN-<slug>/` per campaign, each containing the standard `/deep-research` output (parent.md, specialist briefs, campaign.md)
4. **super-parent.md** — the Synthesizer's program-level synthesis
5. **program-report.md** — the Program Evaluator's structured report
6. **Knowledge index updates** — entry for every brief + the super-parent + (optionally) the program.md itself. Program-level entries use `type: program-parent` to distinguish from campaign parents.

All briefs enter at `confidence: speculative, status: draft` per the family principle. The super-parent also starts at `draft`. Promotion is manual in v1.

### Phase 10: Handoff

Report to the user (or calling skill):

- **Program summary** — N campaigns, cross-campaign themes, cost, duration
- **Cross-campaign contradictions** — explicit list
- **Program-level coverage score** from the Program Evaluator
- **Follow-up recommendations** — individual briefs needing revision, campaigns worth revisiting, potential follow-up programs
- **Directory path** for the user to review and promote

## Arguments and Flags

```
/research-program <megatopic>         # Default program on a megatopic

Flags:
  --campaigns N                         # Target campaign count (default: Planner decides 3-7)
  --budget $N                           # USD ceiling (default: 100, max: 400)
  --output-dir <path>                   # Default: docs/programs/<slug>/
  --parallel                            # Dispatch all independent campaigns in parallel
  --sequential                          # Force fully-sequential dispatch
  --no-review                           # Skip program plan review (use sparingly)
  --review-campaign-trees               # Also review each campaign's tree before dispatch
  --per-campaign-budget $N              # Override per-campaign budget (default: program / N)
```

**Default philosophy:** generous. Programs are opt-in; the user explicitly chose this scale. Defaults produce strong programs; flags tighten or loosen.

**No-args invocation:** prompts for megatopic + scope notes + optional existing programs/campaigns to build on.

## Output Structure

```
docs/programs/<program-slug>/
├── program.md                       # Planner's meta-plan (after-the-fact reflection)
├── super-parent.md                  # Synthesizer's program-level narrative
├── program-report.md                # Program Evaluator's structured report
└── campaigns/
    ├── 01-<campaign-slug>/          # Full /deep-research output, untouched
    │   ├── parent.md
    │   ├── <specialist-1>.md
    │   ├── <specialist-2>.md
    │   └── campaign.md
    ├── 02-<campaign-slug>/
    └── NN-<campaign-slug>/
```

**program.md structure:**

```markdown
---
description: "Research program: {megatopic}"
type: program-parent
content_type: program-plan
updated: {date}
confidence: speculative
status: draft
---

# Research Program: {Megatopic}

## Context
{What the program investigated and why}

## Decomposition
{The campaign plan with dependency DAG and rationale}

## Campaigns
  01. {Campaign title} — `campaigns/01-<slug>/` — status: complete
      Seed: "..."
      Scope: ...
      Depends on: ...
  02. ...

## Program Metadata
{Total budget, duration, dispatch mode, quality scores rollup}
```

**super-parent.md structure:**

```markdown
---
description: "Program synthesis: {megatopic}"
type: brief
content_type: program-synthesis
updated: {date}
confidence: speculative
status: draft
---

# Program Synthesis: {Megatopic}

## Context
{The megatopic and why it warranted program-scale research}

## Program Map
{Navigable tree of campaigns with one-line summaries, linked}

## Program-Level Themes
{Patterns that span campaigns — the key value of program-scale synthesis}

## Cross-Campaign Contradictions Flagged
{Explicit list — not silently resolved}

## Coverage Assessment at Program Scale
{What the program covered; what it did not}

## Related Programs / Briefs
{Cross-references to prior work at any scale}

## Campaign Quality Rollup
{Per-campaign evaluation summaries, linked}
```

**program-report.md** contains the Program Evaluator's structured quality report + program metadata + cost accounting.

## Budget and Fences

### Defaults

| Parameter | Default | Rationale |
|-----------|---------|-----------|
| Target campaigns | 3-5 (Planner decides) | 3 is a small program; 5 is a medium program |
| Max campaigns | 7 | Beyond 7, the megatopic likely decomposes into two programs |
| Per-campaign budget | program budget / N (typically $15-25) | Calibrated actuals: $6-15 per scoped campaign |
| Program dollar budget | $100 | Covers a comfortable 4-5 campaign program with headroom |
| Program time budget | 2-3 hours wall-clock | Parallel dispatch possible; sequential chains extend this |
| Dispatch mode | hybrid DAG | Sequential where dependencies exist, parallel elsewhere |

### Hard fences (not overridable without flags)

- **Max campaigns: 7.** Above this, decompose into two programs (the decomposition itself becomes a question; don't hide it inside one oversized program).
- **Max program budget: $400.** Above this, the user must explicitly pass `--budget`.
- **No nested programs.** Programs cannot contain other programs. The tree stops at three tiers total (`/research` → `/deep-research` → `/research-program`).

### Soft fences (warn, continue)

- Program trending >50% over budget → warn, ask whether to continue or halt remaining dispatch
- Two proposed campaigns have >0.7 scope overlap → warn before dispatch, suggest merge
- A proposed campaign's scope note is narrower than a typical specialist brief → warn, suggest folding into a sibling campaign
- Program Evaluator's coverage score <0.5 → suggest follow-up campaigns or a v2 program

## Cost Model

Using the [Model Selection Pattern](model-selection-pattern.md) math:

| Role | Model | Typical tokens | Typical cost |
|------|-------|---------------|-------------|
| Program Planner | Opus | ~3-5 calls × 60K tokens | ~$3-5 |
| 4 Campaigns (each a /deep-research) | mixed | 4 × $6-15 | ~$24-60 |
| Cross-Campaign Synthesizer | Opus | 1 × 300K tokens | ~$6 |
| Program Evaluator | Opus | 1 × 200K tokens | ~$4 |
| **Total (default medium program, 4 campaigns)** | | | **~$37-75** |

Small program (3 campaigns, scoped): ~$28-35.
Large program (7 campaigns, tighter per-campaign budgets): ~$70-100.
Max (7 campaigns, max per-campaign budget): up to the $400 ceiling.

**Calibrated from Demo 1 (2026-04-15).** Originally estimated $17 per campaign; actuals came in at ~$6 for scoped single-level campaigns and ~$12-15 for deeper ones. The $100 program budget default is generous at this calibration — a typical 4-campaign program lands at $35-60. Revised calibration updated throughout this section.

**Reuse savings.** Every existing campaign or program cited instead of re-run saves $6-15 per cited campaign. A program that cites two prior campaigns costs ~$20-30 instead of ~$50-60.

**Why not cheaper.** Running the Synthesizer and Evaluator on Sonnet would save ~$8, but program-scale judgment quality matters — these roles see more text than their campaign-level counterparts and make bigger-consequence calls. The mix captures most savings while keeping quality where it matters.

## Integration with Build Process

### User-invoked standalone

```
/research-program "end-to-end knowledge gap detection system"
```

The full flow above. Output: program directory. User reviews and promotes.

### Called from `/ideate`

After scout produces its landscape, `/ideate` may recognize the whole initiative is megatopic-scale and suggest `/research-program` instead of enumerating individual `/research` calls. Trigger: the initiative spans 3+ domains that each warrant their own campaign.

Change to `/ideate` SKILL.md: in the research-planning phase, if the initiative decomposes into multiple research-worthy domains, suggest `/research-program`.

### Called from `/brief`

When a phase or a cluster of phases has multiple blocking briefs that form a coherent program (e.g., "we need to understand embeddings, clustering, entity extraction, and graph analysis before we can design the knowledge-edge creator"), `/brief` can invoke `/research-program` rather than producing each brief independently. Result: a program whose super-parent serves as the phase-level blocking brief, with campaign-level briefs backing it.

Change to `/brief` SKILL.md: add a branch — if the roadmap shows 3+ blocking briefs in one area, suggest `/research-program`.

### Escalation from `/deep-research`

When `/deep-research` is loading context (Phase 1) or decomposing (Phase 2), the Lead may recognize that the seed is a megatopic in disguise — symptoms include 7+ natural facets, multiple perspectives that each want their own decomposition, or overlap with existing campaigns suggesting a broader initiative. In that case, the Lead pauses and offers:

```
The seed appears to be megatopic-scale (7+ natural facets across 3+ domains).
Recommend /research-program for better structure?
```

User approves → `/deep-research` hands off to `/research-program` with the seed as the megatopic.

Change to `/deep-research` SKILL.md: add a decomposition-time check for megatopic signals; offer escalation when they fire.

### Called from `/expand`

When scope expansion introduces a cluster of new subsystems or a whole new domain, `/research-program` is often the right scale.

Change to `/expand` SKILL.md: suggest `/research-program` for substantial scope changes; keep `/deep-research` for scope changes within an existing domain.

## Prompt Skeletons

### Program Planner system prompt (key excerpt)

```
You are the Program Planner orchestrating a research program on: {megatopic}.

Your responsibilities:
1. Decompose the megatopic into a campaign plan (3-7 campaigns, each with seed, scope notes,
   dependencies, budget).
2. Identify the dispatch DAG (sequential edges + parallel groups).
3. Present the plan to the human for review before dispatch.
4. Dispatch campaigns via Agent(model="opus") — each is a full /deep-research run.
5. Pass priors (prior campaigns' parent.md) to sequential dependents.
6. Monitor campaign-level progress; handle failures (retry once → partial → continue).
7. After all complete: hand off to Cross-Campaign Synthesizer.
8. After synthesis: hand off to Program Evaluator.
9. Write final output; run `/knowledge-index` to regenerate the index from frontmatter (do NOT hand-edit `docs/knowledge-index.yaml`).

Do NOT:
- Decompose within campaigns (each campaign's Lead does that)
- Write the super-parent (Synthesizer does that)
- Evaluate program quality (Evaluator does that)
- Propose a campaign that duplicates existing briefs/campaigns/programs — cite instead

The decomposition is the most leveraged decision. A bad campaign plan wastes N × $6-15
(calibrated). When in doubt on campaign selection, decompose further or split a proposed
campaign.
```

### Campaign Lead system prompt (key excerpt — delta from /deep-research)

```
You are the Lead Researcher for campaign {NN}/{total} in research program "{megatopic}".

Your seed: {campaign seed}
Your scope notes: {in-scope / out-of-scope / boundaries with siblings}
Sibling campaigns (for awareness, do not research these): {sibling titles + one-line summaries}
Your priors (from completed dependee campaigns): {prior parent.md summaries, or "none"}
Your output directory: docs/programs/{program-slug}/campaigns/{NN}-{campaign-slug}/
Your budget: ${budget}

Follow the /deep-research workflow for your assigned seed:
1. Decompose (PMEST + hierarchical refinement)
2. Evaluate stopping
3. {If --review-campaign-trees is on} present tree for human review
4. Dispatch Sonnet specialists
5. Monitor; handle failures
6. Hand off to your campaign Synthesis Agent
7. Hand off to your campaign Evaluator Agent
8. Write campaign output to your output directory

Constraints:
- Respect scope notes — do not drift into sibling campaigns' domains
- Cite priors where relevant; do not duplicate their research
- Do NOT write cross-campaign references — the program's Synthesizer handles that
```

### Cross-Campaign Synthesizer system prompt (key excerpt)

```
You are the Cross-Campaign Synthesizer for research program "{megatopic}".

You have been given:
- The program plan (campaigns + rationale + dependencies)
- All campaign parent.md files (N files)
- All specialist briefs across all campaigns

Your task:
1. Read all outputs. Do not research additional content.
2. Identify program-level themes — patterns that span campaigns, which no single campaign
   could surface. Write these as the primary content of super-parent.md.
3. Add typed cross-references between briefs across campaigns. Use the standard vocabulary
   plus program-level relationships: parallel-to, depends-on, program-of.
4. Identify cross-campaign contradictions. Flag each explicitly. Do NOT silently resolve.
5. Write super-parent.md: Context, Program Map, Program-Level Themes, Cross-Campaign
   Contradictions Flagged, Coverage Assessment, Related, Campaign Quality Rollup.

Do NOT:
- Re-synthesize within campaigns (each campaign's Synthesis already did that)
- Research additional content
- Silently resolve contradictions
- Edit campaign parents or specialist briefs beyond adding cross-references
```

### Program Evaluator system prompt (key excerpt)

```
You are the Program Evaluator for research program "{megatopic}".

You have been given ONLY the produced briefs — super-parent.md, all campaign parent.md files,
all specialist briefs — plus the megatopic. You have NOT been given the program plan,
individual campaign evaluators' reports, or any orchestrator rationale. This is intentional:
evaluate what was produced, not what was intended.

Your task:
1. Program Coverage: generate an expected program outline at the domain level. Check coverage.
2. Program Coherence: assess whether campaigns form a coherent body. Flag silos.
3. Cross-Campaign Contradictions: independent pass; don't rely on the Synthesizer's flags.
   Report each as (campaign_a, campaign_b, conflict, severity).
4. Severity reassessment: for each contradiction the Synthesizer flagged, independently judge
   its severity. When your judgment differs, report (id, synthesizer_severity, your_severity,
   rationale). This is a standard output, not exceptional — demo data shows ~50% of campaigns
   involve a severity reassessment.
5. Verify resolution claims, don't trust them: for each claimed resolution (by Synthesizer
   or by any child campaign's parent.md), independently walk the specific failure mode and
   judge `resolved | partial | unresolved` with required rationale. Demo evidence: child
   synthesis claims "resolved" where Evaluator judges "partial" ~50% of the time.
6. Groundedness: check super-parent claims are traceable to specialist briefs.
7. Recommendations: follow-up campaigns, follow-up programs, revision needs.

Output: structured YAML + prose summary.

Constraints:
- Only reference provided briefs; do not use external knowledge to "verify" claims
- Do not second-guess individual campaign decompositions — that was each campaign's scope
- Your job is program-scale coverage, coherence, and contradictions
```

## Program History

Every program logs to `docs/programs/<program-slug>/program.md` frontmatter + body. Structured fields (in addition to the universal frontmatter — `description`, `type`, `updated`, and `research_method: /research-program` are required at the top of every program-level doc and per-campaign output):

```yaml
program_id: <uuid>
megatopic: "..."
started_at: <timestamp>
completed_at: <timestamp>
invocation:
  mode: user | ideate | brief | deep-research (escalated) | expand
  arguments: { ... }
  budget: $100
plan:
  campaigns:
    - campaign_id: 01
      slug: "..."
      seed: "..."
      depends_on: []
      status: complete | partial | failed
      duration_seconds: ...
      cost_usd: ...
dispatch:
  mode: hybrid | sequential | parallel
  dag: [[01], [02, 03], [04]]  # dispatch groups in order
cross_campaign:
  themes_identified: 5
  contradictions_flagged: 2
  cross_refs_added: 18
program_quality:
  coverage_ratio: 0.78
  coherence_score: 4.0
  silos_detected: 1
  groundedness_avg: 0.84
cost:
  total_tokens: {N}
  estimated_usd: {$}
```

This supports future features (program-level learning, chain-of-programs analysis, reuse-check improvements). For v1, it's a structured log — readable by humans, parseable by future tooling.

## Conventions

### Tone of outputs

program.md and super-parent.md should be narrative and navigational, not summaries of summaries. The super-parent's value is identifying program-level themes that no campaign surfaced — be opinionated about what matters.

### Naming

- Program directory: `docs/programs/<program-slug>/` where `<program-slug>` is a kebab-case megatopic slug
- Campaign directories: `campaigns/NN-<campaign-slug>/` where `NN` is zero-padded dispatch order
- Plan doc: always `program.md`
- Synthesis doc: always `super-parent.md`
- Quality report: always `program-report.md`

### Frontmatter

All briefs produced by a program start at `confidence: speculative, status: draft`. Program-level entries use `type: program-parent` (for program.md) and `content_type: program-synthesis` (for super-parent.md) to distinguish from campaign-level counterparts.

### Cross-reference vocabulary

Standard (see [knowledge-storage-pattern.md](knowledge-storage-pattern.md)) plus program-level additions:

- `program-of` — brief is part of this program
- `parallel-to` — two campaigns address related domains independently
- `depends-on` — campaign B used findings from campaign A as priors

## Dependencies

| Dependency | Purpose | Notes |
|------------|---------|-------|
| Agent tool (with `model:` parameter) | Spawn campaign Leads as Opus sub-agents | Core primitive |
| /deep-research | Campaigns are full /deep-research runs | Planner uses its workflow via a spawned Lead prompt |
| knowledge-index | Context loading, output registration | Existing infrastructure |
| knowledge/search (future) | Curated context for Planner and campaigns | Falls back to filesystem search in projects without BQ |
| AskUserQuestion | Human review checkpoint | Already available |
| `/ideate` SKILL.md | Integration — megatopic escalation | One-time edit |
| `/brief` SKILL.md | Integration — multi-brief program | One-time edit |
| `/deep-research` SKILL.md | Integration — escalation from decomposition | One-time edit |
| `/expand` SKILL.md | Integration — major scope changes | One-time edit |

No external infrastructure. No code. Pure skill orchestration.

## What's Deferred

- **Nested programs** — explicitly out of scope. Three tiers is the ceiling.
- **Mid-program replanning** — if campaign 2 surfaces a finding that should reshape the remaining plan, v1 does not replan. Flagged by Evaluator as a recommendation; user decides on a follow-up program.
- **Partial-result resumption** — if the API drops mid-program, v1 does not resume automatically. Mitigation: each phase boundary is written to disk so manual resumption is possible.
- **Cross-program synthesis** — when multiple programs share themes, a super-program-level synthesis could surface them. Deferred — rare use case, revisit after multiple programs exist.
- **Dynamic dispatch DAG** — campaigns that become eligible for parallel dispatch mid-program based on emergent findings. v1 uses the DAG as declared in the plan.
- **Campaign-level gap → program-level stub** — if a campaign evaluator recommends a follow-up campaign, v1 surfaces this in the program report but does not auto-create a stub. Revisit when the knowledge-edge creator is integrated.
- **Program-level campaign history in BigQuery** — v1 logs to filesystem. BQ-backed program history supports cross-program learning and analytics. Defer to the same phase that moves campaign history to BQ.
- **Auto-escalation from `/deep-research`** — silent escalation when megatopic is detected. v1 always asks the user. Auto-escalation considered only after trust in detection heuristics is proven.
- **Budget-aware dispatch ordering** — dispatching cheap campaigns first to fail fast on budget issues. v1 dispatches per declared DAG.
- **Nested agent spawning** — campaign Leads spawning their own Sonnet specialists. Currently blocked by infrastructure (Agent tool unavailable inside spawned agents). When this unblocks, campaigns should use the full four-role `/deep-research` tree. Until then, single-agent campaign execution produces strong results (0.86 coverage at program scale in first run).

## Open Questions

1. **How does the Planner decide between campaigns and specialist briefs at the boundary?** A candidate that's "too small for a campaign but too large for a specialist" is ambiguous. v1 uses the substantive-enough-for-5-facets heuristic; may need refinement after real programs.
2. **Per-campaign human review tradeoff.** `--review-campaign-trees` gives control but fatigues the user across 3-7 trees. Does program-level review adequately substitute for per-campaign review in most cases? Needs real-program data.
3. **Sequential vs parallel default.** v1 defaults to hybrid DAG. Is that the right default, or should it be fully sequential (safer, slower) or fully parallel (faster, higher peak cost)? Revisit after demo programs.
4. **Failure propagation to dependents.** If campaign A fails, its dependent B was supposed to receive A's parent.md as priors. v1 lets B proceed without those priors (its scope stands on its own). Is that right, or should B be cancelled? Depends on coupling strength.
5. **Program Evaluator's expected-outline approach.** For single campaigns, the Evaluator generates an expected brief outline. For programs, it generates an expected domain outline — a more abstract comparison. How reliable is this at program scale? Needs calibration from real programs.
6. **Reuse-check granularity.** How similar must an existing campaign be to "cite instead of re-run"? v1 uses a soft threshold; may need tuning.
7. **Program budget allocation.** v1 defaults to equal budgets across campaigns. Should the Planner weight budgets by expected campaign difficulty? Likely yes, but needs calibration.
8. **Handling cancelled campaigns.** If the user cancels mid-program (budget concerns, new priorities), does the partial program still synthesize and evaluate? v1: yes, with explicit partial markers throughout.

## Validation from Chain-Mode Demos

Demo 1 (2026-04-15) ran two `/deep-research` campaigns in succession — a fresh campaign on "knowledge-edge creator uncovered architecture," then a chain-mode extension via `--continue-from` on the concept-frequency matrix leaf. Chain mode is a manual, reactive version of what `/research-program` automates proactively. The demo validated four core architectural choices that this doc depends on:

1. **Fractal pattern holds.** Child campaigns run cleanly alongside parent campaigns; the four-role structure scales up. The Program Planner/Cross-Campaign Synthesizer/Program Evaluator triad maps directly onto the roles that worked at campaign scale.
2. **Additive append as the cross-campaign linkage primitive.** The chain-mode "Extended by child campaigns" section appended to the parent's `parent.md` worked without corrupting any existing parent content. Program-level synthesis uses the same mechanism in reverse (`Part of program:` back-pointer).
3. **Isolated Evaluator catches what Synthesis misses.** Chain-mode demo's Evaluator found 5 contradictions vs. synthesis's 4 — validating that the Program Evaluator, with its isolated context, will surface program-level issues that Cross-Campaign Synthesis might smooth over.
4. **Extension validity is a real failure mode.** Chain-mode Evaluator gained a dedicated "did the child actually fill the parent's flagged gap, or drift?" dimension. The equivalent at program scale is "did each campaign actually cover its assigned domain, or drift?" — already built into the Program Evaluator's dimensions. The demo surfaced this as load-bearing, not nice-to-have.

Coverage scores across the chain (0.83 → 0.92) also counter the intuition that downstream campaigns thin out — a scoped leaf is actually easier to cover fully than an open seed. This is worth remembering when allocating per-campaign budgets: later campaigns in a program don't necessarily need more budget than earlier ones.

## Related Documents

| Document | Purpose |
|----------|---------|
| [Research Skills Overview](research-skills-overview.md) | Unifying family view — the three-scale fractal |
| [Deep Research Architecture](deep-research-architecture.md) | Scale below — campaigns are /deep-research runs |
| [Deep Research North Star](deep-research-north-star.md) | Vision and principles (apply at program scale too) |
| [Model Selection Pattern](model-selection-pattern.md) | Archetype-based model+effort assignments |
| [First-Principles Primer](first-principles.md) | Thinking methodology applied at program scale |
| [Build Process](build-process.md) | Pipeline the research skills integrate into |
| [Knowledge Storage Pattern](knowledge-storage-pattern.md) | Cross-reference vocabulary, brief schema |
| [Knowledge Workers (grimoire)](../../grimoire/docs/architecture/north-star-knowledge-workers.md) | Capability-level vision |
