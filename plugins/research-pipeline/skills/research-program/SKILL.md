---
name: research-program
description: >
  Parallel multi-campaign research for megatopic-scale seeds that span multiple domains.
  Decomposes into 3-7 distinct campaigns (each a full /deep-research run), dispatches per
  a dependency DAG, synthesizes cross-campaign themes, evaluates at program scale with
  isolated context. Third tier of the research-skills family: /research → /deep-research
  → /research-program. Use when a topic is too broad for a single /deep-research, or when
  chain-mode /deep-research runs would exceed 2-3 links.
user-invocable: true
allowed-tools: Read, Write, Glob, Grep, Agent, AskUserQuestion
model: opus
---

# Research Program

You are the **Program Planner** of a research program. You orchestrate a four-role system — yourself, N parallel campaigns (each itself a full `/deep-research` tree), a cross-campaign synthesizer, and a program evaluator — to produce a coordinated multi-domain research body.

**You follow the build process at `/dev/skills-v2/plugins/research-pipeline/docs/build-process.md`.** Read it before starting.

**You follow the model selection pattern at `/dev/skills-v2/plugins/research-pipeline/docs/model-selection-pattern.md`.** Spawn campaign Leads with `model: "opus"`; Synthesizer and Evaluator with `model: "opus"`.

**Read `/dev/skills-v2/plugins/research-pipeline/docs/first-principles.md` BEFORE starting.** Decomposition at program scale cascades into N campaigns × 5 specialists of token budget. Apply moves at specific phases:

- **Program decomposition (Phase 2)** — Open + Challenge: identifying distinct domains requires questioning the megatopic's natural boundaries
- **Dependency resolution (Phase 3)** — Challenge + Verify: invert "what would make this dependency spurious?"
- **Cross-campaign synthesis (Phase 7)** — Synthesize + Challenge: find program-level themes no single campaign surfaces; flag cross-domain contradictions instead of smoothing them over

**The Asymmetry Principle sharpens here**: a bad program decomposition wastes ~$60-80 on structurally wrong campaigns. When in doubt on campaign selection, decompose further or split a proposed campaign.

**Full architecture:** `/dev/skills-v2/plugins/research-pipeline/docs/research-program-architecture.md` — prompt skeletons, phase-by-phase workflow, cost model, demo-validated principles.

**Family context:** `/dev/skills-v2/plugins/research-pipeline/docs/research-skills-overview.md` — how `/research`, `/deep-research`, and `/research-program` compose (same fractal pattern at three scales).

## When to Use This Skill

Use `/research-program` when:

- The topic spans 3+ distinct domains, each substantively large enough to warrant its own campaign
- A single `/deep-research` would exceed 7 specialists or need depth 4
- Chain-mode `/deep-research` would exceed 2-3 links
- Cross-domain themes and contradictions matter (not just within-domain)
- The user explicitly wants a multi-campaign coordinated output

Use `/deep-research` instead when:

- The topic fits in one domain even if it spans 5+ facets
- A 3-7 specialist decomposition at depth 1-3 covers it

## Arguments

```
/research-program <megatopic>         # Default program

Flags:
  --campaigns N                         # Target campaign count (default: Planner decides 3-7)
  --budget $N                           # USD ceiling (default: 100, max: 400)
  --output-dir <path>                   # Default: docs/programs/<slug>/
  --parallel                            # Dispatch all independent campaigns concurrently
  --sequential                          # Force fully-sequential dispatch
  --no-review                           # Skip program plan review (use sparingly)
  --review-campaign-trees               # Also review each campaign's internal tree before dispatch
  --per-campaign-budget $N              # Override per-campaign budget (default: program / N)
```

No-args: prompts for megatopic + scope notes + optional existing programs/campaigns to build on.

## What This Skill Produces

1. **Program directory:** `docs/programs/<program-slug>/`
2. **program.md** — Planner's meta-plan (campaigns, dependencies, rationale)
3. **super-parent.md** — Synthesizer's cross-campaign narrative (program-level themes, contradictions, coverage)
4. **program-report.md** — Program Evaluator's structured quality report
5. **campaigns/NN-\<campaign-slug\>/** — full `/deep-research` output per campaign (parent.md + specialist briefs + campaign.md)
6. **Knowledge index entries** — one per brief + program-level entries. `program.md` uses `type: program-parent` + `content_type: program-plan`; `super-parent.md` uses `type: brief` + `content_type: program-synthesis`.

All briefs enter at `confidence: speculative, status: draft`. Promotion manual in v1.

**Every program-level doc, per-campaign output, and specialist brief produced by this skill MUST have `research_method: /research-program` in its frontmatter.** Single value across the whole program — campaign-level outputs are not relabeled `/deep-research` even though each campaign runs the deep-research workflow internally. The program's identity dominates. Apply at every Write step (program.md, super-parent.md, program-report.md, each campaign's parent.md / specialist briefs / campaign.md). See the consumer project's schema doc for the full vocabulary.

## What This Skill Does NOT Do

- Does NOT decompose within campaigns (each campaign's Lead does that via `/deep-research`)
- Does NOT write `super-parent.md` (Cross-Campaign Synthesizer does that)
- Does NOT evaluate program quality (Program Evaluator does that, isolated)
- **Does NOT trust child campaigns' claims of resolving parent contradictions** (Evaluator verifies independently — demo evidence shows these claims are wrong ~50% of the time in the direction of optimism)
- Does NOT chain programs or nest programs (no 4th tier; `/research-program` is the ceiling)
- Does NOT skip the program plan review unless `--no-review` is passed

## Model Assignment

| Role | Archetype | Model | Effort | Instances |
|------|-----------|-------|--------|-----------|
| Program Planner (this skill's main loop) | Orchestration | Opus | high | 1 (parent context) |
| Campaigns (each a full `/deep-research` tree) | Nested orchestrator-workers | Opus Lead + Sonnet specialists | mixed | N (default 3-5) |
| Cross-Campaign Synthesizer | Synthesis | Opus | high | 1 (spawned) |
| Program Evaluator | Synthesis/judgment | Opus | high | 1 (spawned, isolated) |

**Rough cost for a default medium program:** ~$35-75 (calibrated from demos). See [architecture doc](../docs/research-program-architecture.md) for breakdown.

## Workflow

### Phase 1: Load Context

1. **Skill arguments** — megatopic + flags
2. **Invocation mode** — user-invoked / called-from-`/ideate` / `/brief` / `/deep-research` (escalation) / `/expand`
3. **Knowledge index** — run `/knowledge-index` or read the project's index
4. **Existing campaigns and programs** — crucial reuse check. Prior campaigns/programs get cited, not re-run (saves $6-15 per cited campaign)
5. **Project docs** — CLAUDE.md, north stars, architecture
6. **Spawned-agent write preflight** — see Phase 1.5

### Phase 1.5: Spawned-Agent Write Preflight (MANDATORY — DO NOT SKIP)

**Before dispatching any campaign, smoke-test that spawned agents can write to the program output directory.** This catches a known infrastructure failure mode where spawned agents have a stricter permission profile than the parent session — observed multiple times in production (2026-05-04, 2026-05-05). When it fires, every campaign agent burns its full Opus budget (~$10-15 each) on research it can never persist.

**Procedure:**

1. From the parent session, create the program directory: `mkdir -p docs/programs/<program-slug>/campaigns/`
2. Write a smoke-test marker from the parent session: `<program-dir>/.write-preflight`. If this fails, fix permissions before continuing — the parent can't write, so the campaigns can't either.
3. Dispatch a tiny smoke-test Agent (Sonnet, low budget — ~5 cents) whose entire job is:
   - Try to Write a smoke-test file at `<program-dir>/.spawned-write-preflight`
   - If Write succeeds, report `OK`
   - If Write fails (permission denied, sandbox block, anything), report `BLOCKED` with the exact error
4. **Block dispatch until preflight passes.** If `BLOCKED`, surface to the user immediately:
   ```
   Spawned-agent writes are denied for <program-dir>. Campaigns cannot persist their outputs.
   Options:
     (a) grant write permission to the spawned-agent profile and retry preflight
     (b) abort and resume in a fresh session where the permission profile is correct
     (c) proceed with "return-content-inline" mode — each campaign returns its full file
         set as inline text in its result message; the parent session writes the files.
         This costs ~30-60K tokens of result-message content per program but works around
         the block.
   ```
5. Pass the preflight outcome forward to campaign-Lead prompts. If running in `(c) inline` mode, every campaign Lead's prompt MUST instruct: "Do NOT call Write. Return the full content of every output file inline as fenced markdown blocks in your final response, labeled with the file path. The parent session will persist the files."

**Why this is mandatory:**
- A failure here wastes $50-75 of Opus across 5 parallel campaigns before the parent notices
- The smoke test costs ~5 cents and 30 seconds
- The asymmetry is overwhelming — preflight always wins

**Do NOT skip this even on a "known-good" project.** Permission profiles change session-to-session. The smoke test is fast.

### Phase 2: Program Decomposition

Identify 3-7 distinct domains. Each domain should be:

- **Substantively large** (~5 facets' worth of material — otherwise it's a specialist brief in another campaign)
- **Semantically distinct** (no two domains should plausibly cover the same territory)
- **Collectively covering** the megatopic
- **Stable under re-derivation** (decomposing 3 times should roughly agree)

Decomposition shapes:

- **Perspective** — stakeholder-driven megatopics
- **Layer** — system-driven megatopics (infrastructure → interface)
- **Lifecycle** — process-driven megatopics (discovery → design → implementation → operation)
- **Faceted** — knowledge-driven megatopics (PMEST scaled to campaign level)

For each proposed campaign, draft: seed topic, scope notes (in/out), rationale, estimated budget, `depends_on` declaration.

### Phase 3: Dependency Resolution and Dispatch Order

Resolve the DAG: parallel-eligible groups and sequential chains. **Default: hybrid DAG** (sequential where dependencies exist, parallel elsewhere). `--parallel` forces all-parallel; `--sequential` forces all-sequential.

**Vetos (hard stops):** campaign count > 7, program budget exceeded, megatopic already covered by existing programs.

**Soft signals:** campaign distinctness, substance, reuse overlap ≥70% (cite, don't re-run).

### Phase 4: Human Review of Program Plan

Present plan via `AskUserQuestion`. Show: campaign list with seeds + scope + dependencies + budget, dispatch DAG, quality flags (overlap warnings, marginal campaigns, reuse opportunities), total estimate.

Skip only with `--no-review`. For high-stakes programs, `--review-campaign-trees` also reviews each campaign's internal tree during dispatch.

### Phase 5: Dispatch

For each campaign in DAG order, spawn an Opus Agent as the campaign's Lead:

```
Agent({
  description: "Program campaign {NN}: {campaign title}",
  subagent_type: "general-purpose",
  model: "opus",
  prompt: <campaign-lead prompt with seed, scope notes, priors from completed dependees,
           program context, per-campaign budget, output directory>,
  run_in_background: true
})
```

Each spawned Lead runs the full `/deep-research` workflow internally. Parallel groups dispatch concurrently; sequential edges block.

### Phase 6: Monitor

Track campaign statuses (not specialist-level). Handle failures:

- **Campaign partial** — accept, mark, continue
- **Campaign failed** — retry once with broadened budget; if still failing, mark failed and propagate gap to dependents
- **Campaign over budget** — truncate per `/deep-research` rules
- **Program over budget** — halt un-started campaigns; synthesize and evaluate completed ones as partial program

### Phase 7: Cross-Campaign Synthesis

Spawn Synthesizer (Opus):

```
Agent({
  description: "Cross-campaign synthesis: {megatopic}",
  subagent_type: "general-purpose",
  model: "opus",
  prompt: <synthesis prompt with program plan + all campaign parents + all specialist briefs>
})
```

Outputs:
- **super-parent.md** — program-level themes, cross-campaign contradictions flagged explicitly, coverage assessment at program scale
- **Cross-campaign cross-references** — typed `related[]` edges between briefs across campaigns (vocabulary includes `parallel-to`, `depends-on`, `program-of`)
- **"Part of program: \<slug\>" append** to each campaign's `parent.md` (additive, non-mutating — validated in chain-mode demos as the reliable linkage primitive)
- Flags any child-campaign *claims* of resolution as claims, not facts (leaves verification to Program Evaluator)

### Phase 8: Program Evaluation

Spawn Evaluator (Opus) with **only the produced briefs + megatopic seed** — no program plan, no Synthesizer rationale, no campaign evaluators' reports:

```
Agent({
  description: "Evaluate research program: {megatopic}",
  subagent_type: "general-purpose",
  model: "opus",
  prompt: <evaluator prompt — sees only super-parent + campaign parents + specialist briefs + megatopic>
})
```

Standard dimensions: program coverage, program coherence, cross-campaign contradictions (independent pass), groundedness, recommendations.

**Program-specific dimensions:**
- **Severity reassessment** — synthesis's severity is input, not verdict. Reassess independently. Demo data: ~50% of campaigns involve at least one severity reassessment.
  - **Conditional-severity support (Q-Ev3 process change, ratified 2026-05-12):** Master-trap entries may carry **either** a scalar `severity: <enum>` **or** a conditional `severity_conditional: {condition: <expr>, true: <severity>, false: <severity>}` block. On reassessment:
    - **Read both forms.** Walk every master-trap entry; recognize both scalar and conditional structures as valid inputs.
    - **Preserve input structure.** Scalar input → scalar output; conditional input → conditional output (with potentially-revised severities for one or both branches and rationale per branch).
    - **May propose promotions.** When reasoning concludes a scalar-severity master warrants conditional severity (e.g., severity depends on `production_deployment` / `decision_relevant` / `evaluation_mode` / similar dispatch-context predicate), emit a **CLAIM-tagged promotion proposal** — DO NOT auto-apply. Adjudication of proposed promotions is downstream (calibration session, not the Evaluator).
    - **Output schema.** Per-master output includes a `severity_model_proposed:` block in one of three shapes:
      - `{kind: "scalar", severity: <enum>, rationale: <str>}` — preserves scalar input or reassesses scalar.
      - `{kind: "conditional", condition: <expr>, true: <severity>, false: <severity>, rationale_true: <str>, rationale_false: <str>}` — preserves conditional input or reassesses conditional.
      - `{kind: "promotion_proposed", from: "scalar", to: "conditional", condition: <expr>, true: <severity>, false: <severity>, rationale: <str>, claim: true}` — flags a proposed promotion for downstream adjudication.
    - **Reference** — canonical conditional-severity model lives in the consuming project's rules (e.g. ds-engine `ratified-rules.md` Rule 6); the Evaluator does not redefine semantics, only applies them. Canonical predicates seen in evidence: `production_deployment`, `decision_relevant`, `evaluation_mode ∈ {production, report, preview}`, `forecasts_published`, `alert_system_downstream`, `multi_step_labels OR strong_autocorr_detected`, `novel_distribution`, `use_case ∈ {anomaly, forecast}`. New predicates are allowed when evidence supports them.
- **Verify resolution claims, don't trust them** — for each claimed resolution, walk the specific failure mode and independently judge `resolved | partial | unresolved` with rationale.

### Phase 9: Write Output

Write all outputs to the program directory. Run `/knowledge-index` to regenerate the index — do NOT hand-edit `docs/knowledge-index.yaml`. Each brief, parent, and report must have conformant frontmatter (`description`, `type`, `kind: research`, `summary`, `key_findings`, `research_method: /research-program`, `updated`). Use `type: program-parent` for `program.md` and `content_type: program-synthesis` for `super-parent.md`.

### Phase 10: Handoff

Report to user (or calling skill):
- **Program summary** — N campaigns, cross-campaign themes, cost, duration
- **Cross-campaign contradictions** — explicit list with severity
- **Coverage score** from Program Evaluator
- **Verified resolution status** for any claimed contradictions
- **Follow-up recommendations** — briefs/campaigns needing revision, potential follow-up programs
- **Directory path** for review and promotion

## Anti-Patterns

- **Don't orchestrate individual specialists yourself.** Campaigns handle that via `/deep-research`.
- **Don't write super-parent yourself.** Synthesizer does that.
- **Don't evaluate the program yourself.** Program Evaluator does that, in isolated context.
- **Don't trust child campaigns' claimed resolutions at face value.** Chain-mode demo evidence: child synthesis claims "resolved" where Evaluator correctly judges "partial" about half the time.
- **Don't silently smooth over cross-campaign contradictions.** Flag them; surface the disagreement.
- **Don't exceed 7 campaigns.** Above 7, the megatopic decomposes into two programs — run them separately.
- **Don't nest programs.** Three tiers total (`/research` → `/deep-research` → `/research-program`). Deferred by design.
- **Don't skip plan review** unless `--no-review` is explicit. Program decomposition is the single most leveraged decision in the campaign.
- **Don't dispatch with unresolved high-overlap warnings.** If two proposed campaigns have >0.7 scope overlap, merge them before dispatch.

## Tips

- **The program plan is the most leveraged decision.** Spend real effort in Phase 2. Demo evidence: a bad campaign plan wastes ~N × $6-15.
- **Default to sequential dispatch** in ambiguous cases. Enables prior-passing between campaigns and limits peak cost. Switch to `--parallel` only when campaigns are truly independent.
- **Reuse check is critical at program scale.** Every existing campaign cited saves ~$6-15. A program that cites two existing campaigns drops from ~$50 to ~$25.
- **Start with smaller programs.** Your first `/research-program` should be 3-4 campaigns, not 7. Build calibration before attempting larger.
- **Let campaigns own their own /deep-research workflows.** Your job is program-level orchestration, not campaign-internal decomposition.
- **Pipeline-shape megatopics are natural programs.** If the megatopic has stages (discovery → design → implementation → operation), map one campaign per stage — the cross-campaign synthesis surfaces the integration seams, which is exactly the program's value.
- **Expect Evaluator to downgrade some claimed resolutions.** That's signal, not noise — the Evaluator's independent verification is load-bearing.
- **Nested agent spawning is currently blocked.** Campaign Leads cannot spawn their own Sonnet specialists (Agent tool unavailable inside spawned agents). Campaigns execute as single-agent research. Quality is still strong (first program: 0.86 coverage, 4.2/5 coherence) but campaigns take longer per-unit and don't get the parallelism benefit. Write campaign prompts assuming single-agent execution until this infrastructure limitation is resolved.
