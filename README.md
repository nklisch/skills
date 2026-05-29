# skills-v2

**A research-grounded, agile-substrate workflow suite for Claude Code — a fork of [nklisch/skills](https://github.com/nklisch/skills) with an additional `research-pipeline` plugin layering research, architecture, and per-phase rigor on top of the agile-workflow substrate.**

Use this when you want agents that ship real projects: ideation → research → architecture → epicize → per-feature design → implement → review → release, with substrate-tracked work, late-binding releases, gate-as-items, autopilot draining, doc-review, and infrastructure safety baked in. Every step is a skill. Every skill is opinionated about what it produces. Every doc and every item is indexed so future sessions never start blind.

Full methodology: [`plugins/research-pipeline/docs/build-process.md`](plugins/research-pipeline/docs/build-process.md)

---

## What's In Here

| Layer | What it is | Where to look |
|-------|-----------|---------------|
| **Two first-party plugins** | `research-pipeline` (research family, architecture, brief, knowledge-index, doc-review, quality-checkpoint, init-project, plus merged `epicize`/`epic-design`/`feature-design`) + extensions to `agile-workflow` (new `gate-infra` + gate-docs/gate-tests policy extensions) | [`plugins/research-pipeline/`](plugins/research-pipeline/) |
| **Forked agile-workflow plugin** | Nathan Klisch's substrate-driven work-tracking + autopilot + 5 default gates + late-binding releases — the foundation everything else builds on | [`plugins/agile-workflow/`](plugins/agile-workflow/) |
| **Optional Nathan plugins** | `ux-ui-design` (mockup-first UI), `skill-authoring` (write your own skills) | [`plugins/ux-ui-design/`](plugins/ux-ui-design/), [`plugins/skill-authoring/`](plugins/skill-authoring/) |
| **Project template** | Canonical scaffold dropped into new projects — `docs/` folders + `.work/` substrate seed + `knowledge-index.yaml` + lean `CLAUDE.md` + portable `.claude/rules` | [`plugins/research-pipeline/templates/project/`](plugins/research-pipeline/templates/project/) (applied by `/research-pipeline:init-project`) |
| **Research skills family** | Three scales of the same fractal pattern: `/research` (question) → `/deep-research` (domain) → `/research-program` (megatopic) | [`plugins/research-pipeline/docs/research-skills-overview.md`](plugins/research-pipeline/docs/research-skills-overview.md) |
| **Thinking layer** | First-principles primer loaded by thinking-heavy skills | [`plugins/research-pipeline/docs/first-principles.md`](plugins/research-pipeline/docs/first-principles.md) |
| **System design layer** | 15 design moves loaded by design-heavy and refactor skills | [`plugins/research-pipeline/docs/system-design.md`](plugins/research-pipeline/docs/system-design.md) |
| **Oblique strategies** | 10 lateral thinking moves loaded when ideation gets stuck | [`plugins/research-pipeline/docs/oblique-strategies.md`](plugins/research-pipeline/docs/oblique-strategies.md) |
| **Model selection** | Four-archetype framework for picking Opus/Sonnet/Haiku + effort per role | [`plugins/research-pipeline/docs/model-selection-pattern.md`](plugins/research-pipeline/docs/model-selection-pattern.md) |
| **Knowledge patterns** | Cross-project architectural patterns for building knowledge layers | [`plugins/research-pipeline/docs/knowledge-layer-overview.md`](plugins/research-pipeline/docs/knowledge-layer-overview.md) and three pattern docs |
| **Build process** | The full methodology that ties skills, gates, substrate items, and infrastructure safety together | [`plugins/research-pipeline/docs/build-process.md`](plugins/research-pipeline/docs/build-process.md) |

---

## The Pipeline

```
SESSION START
└─ Auto-loaded: knowledge-index nav + .work/ substrate snapshot (both via plugin hooks)

PROJECT START (truly new)
/research-pipeline:init-project  → Scaffold the knowledge layer + invoke agile-workflow:convert
                                   to bootstrap the .work/ substrate.

/research-pipeline:ideate        → 4 foundation docs (VISION/SPEC/ARCHITECTURE/PRINCIPLES)
                                   + research-plan.md + auto-/scout.
                                   Detects existing docs (won't overwrite).

/research-pipeline:scout         → Prior art discovery (called from /ideate; also standalone).

┌── RESEARCH FAMILY (three scales, same fractal pattern) ──────────┐
│                                                                   │
│  /research-pipeline:research           Question scale.            │
│  /research-pipeline:deep-research      Domain scale.               │
│  /research-pipeline:research-program   Megatopic scale.            │
│                                                                   │
│  All three produce briefs the rest of the pipeline consumes.      │
│  Isolation prevents framing bias; reuse check cites existing work.│
│                                                                   │
└───────────────────────────────────────────────────────────────────┘

/research-pipeline:architecture  → Detailed architecture (modules, data flow, conventions).
                                   Grounded in north-star + domain briefs.

/research-pipeline:epicize       → Emit epic items to .work/active/epics/ with depends_on
                                   chains. Adaptive: heavy with research, light without.

┌── PER EPIC ──────────────────────────────────────────────────────┐
│                                                                   │
│  /research-pipeline:brief         Curated domain brief (if        │
│                                   [needs-brief] tag is on epic).  │
│  /research-pipeline:epic-design   Decompose epic into feature     │
│                                   items. `--only-questions` mode  │
│                                   for cross-epic alignment.       │
│  /research-pipeline:feature-design Write detailed design into     │
│                                   feature body. `--only-questions`│
│                                   for autopilot-bound features.   │
│  /agile-workflow:implement        Code + tests; advance stage     │
│                                   drafting → implementing → review.│
│  /agile-workflow:review           5-lens peer review; advance to  │
│                                   done.                            │
│  /agile-workflow:autopilot        Goal-backed queue runner.       │
│                                   Drains the depends_on graph.    │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘

┌── QUALITY CHECKPOINT (every 2-4 features or pre-release) ────────┐
│  /research-pipeline:quality-checkpoint                            │
│      Orchestrates 7 gates (security, tests, cruft, docs+extension,│
│      patterns, infra) + doc-review. Findings emit as ITEMS, not  │
│      reports — autopilot drains them.                             │
└───────────────────────────────────────────────────────────────────┘

┌── RELEASE ───────────────────────────────────────────────────────┐
│  /agile-workflow:release-deploy <version>                        │
│      Late-binding: bind unbound `done` items to the version,     │
│      run gates in CONVENTIONS.md order, wait for readiness,      │
│      ship per release mapping, archive items via git mv.         │
│      Idempotent.                                                  │
└───────────────────────────────────────────────────────────────────┘

┌── AS NEEDED ─────────────────────────────────────────────────────┐
│  /research-pipeline:update-documentation  Sync docs to code.     │
│  /research-pipeline:update-epicize        Revisit epic graph.    │
│  /research-pipeline:doc-review            Audit planning docs.   │
│  /research-pipeline:security-review       Pre-deploy audit.      │
│  /research-pipeline:test-quality          Spec-driven test gaps. │
│  /research-pipeline:expand                Scope expansion.       │
│  /agile-workflow:park                     Quick capture.         │
│  /agile-workflow:scope                    Promote to active.     │
│  /agile-workflow:fix                      Single-stride bug fix. │
│  /agile-workflow:refactor-design          Per-feature or scan.   │
│  /agile-workflow:perf-design              Performance scan.      │
│  /agile-workflow:bold-refactor            Architectural sweep.   │
│  /agile-workflow:repo-eval                Codebase audit.        │
│  /agile-workflow:e2e-test-design          E2E test design.       │
└───────────────────────────────────────────────────────────────────┘
```

---

## What's Special

### 1. The knowledge index ties everything together

Every project has a **three-layer** knowledge index, fully **derived from frontmatter**:

- `docs/knowledge-index-nav.yaml` (**navigator, ~5-8KB**) — auto-loaded at session start within the harness's 10KB hook-output cap. Corpus counts by `kind`, top 15 most-recently-updated high-signal docs, and docs flagged `nav_priority: high` in frontmatter. Cheap situational awareness.
- `docs/knowledge-index.yaml` (terse, scales with doc count — typically 5KB-250KB) — on-demand via Read. Title, type, kind, `consumer_hint` ("when do I read this?") for every doc. Auto-loaded for small projects where it fits under 10KB; on-demand thereafter.
- `docs/knowledge-index-detail.yaml` (rich, on-demand) — `summary`, `decisions:` / `key_findings:`, `supersession_note:`, `related[]` cross-references. Loaded when a topic match triggers it.

**Why three layers:** as a corpus grows past ~100-150 docs, the terse layer alone exceeds the harness's 10,000-character inline hook-output cap, and the SessionStart hook silently degrades to a truncated preview + file pointer. The navigator restores cheap passive context: it stays under the cap by representing the corpus through aggregates + curated subsets rather than per-doc records. The full per-doc index is one `Read` away.

**Substrate-extended.** The knowledge-index now also indexes `.work/` items alongside `docs/` — epic / feature / story items show up under a new `kind: substrate` axis, giving sessions situational awareness of in-flight work, not just planning docs.

**Sibling skills don't write to the index.** They emit conformant frontmatter on the docs they produce and call `/research-pipeline:knowledge-index`, which regenerates all three layers from frontmatter and runs an inline lint pass (including a navigator-size check: warn at 8KB, error at 10KB). This kills append-drift entirely — the index can't go stale relative to source.

**Frontmatter convention (v2, redesigned 2026-05-03):**
- `description:` — "when do I read this?" hook (becomes `consumer_hint` in terse layer)
- `type:` — north-star | architecture | roadmap | brief | program-parent | program-report | design | features | ideate | workon | module-rules | …
- `kind:` — `planning` | `research` | `historical` | `substrate` (usually derived from `type:` + `status:`)
- `summary:` — 1-2 sentences on what's in the doc
- `decisions:` — required for `kind: planning` (5-9 highest-leverage commitments)
- `key_findings:` — required for `kind: research` (3-7 bullets); both fields allowed on syntheses that bottom-line a recommendation
- `supersession_note:` — optional, for partially-stale docs
- `research_method:` — auto-stamped by `/brief`, `/research`, `/deep-research`, `/research-program`

See [`plugins/research-pipeline/skills/knowledge-index/SKILL.md`](plugins/research-pipeline/skills/knowledge-index/SKILL.md) for the full spec and [`plugins/research-pipeline/docs/build-process.md`](plugins/research-pipeline/docs/build-process.md) for how the index threads through every skill.

### 2. First-principles thinking layer

Thinking-heavy skills load a concrete thinking primer before starting: 10 moves organized as **Open → Challenge → Synthesize → Verify**. Each skill declares which moves to emphasize.

Loaded by: `/research`, `/deep-research`, `/research-program`, `/ideate`, `/architecture`, `/brief`, `/epicize`.

See [`plugins/research-pipeline/docs/first-principles.md`](plugins/research-pipeline/docs/first-principles.md).

### 3. Oblique strategies (lateral thinking)

When structured thinking gets stuck — circular ideation, local optima, over-constrained problems — oblique strategies provide lateral moves: 10 techniques across **Reframe → Constrain → Stimulate**. Inspired by Brian Eno, Edward de Bono, TRIZ, and design thinking.

The key: use lateral moves to FIND new directions, then switch back to first-principles to EVALUATE them. The two primers work as a pair.

Loaded by: `/ideate` (primary), `/architecture` (when options seem equal), `/expand` (when scope feels forced).

See [`plugins/research-pipeline/docs/oblique-strategies.md`](plugins/research-pipeline/docs/oblique-strategies.md).

### 4. System design layer

Design-heavy skills and design-sensitive refactor/expansion skills load a system design primer before starting: 15 moves organized across **Structure → Interfaces → Data → Scale → Reliability**. The unifying principle is "earn your complexity" — 12 moves are design-in (cheap now, expensive to retrofit), 3 are earn-in (add only with measured evidence). Each skill declares which moves to emphasize.

| Skill | Emphasis | Why |
|-------|----------|-----|
| `/architecture` | Structure + Interfaces | Highest-leverage decisions that cascade |
| `/epic-design` | Structure + Interfaces | Decomposition shape locks downstream parallelism |
| `/feature-design` | Interfaces + Data | Bridges architecture to implementation |
| `/implement` | Data + Scale + Reliability | Where design meets reality |
| `/brief` | All (when topic is system design) | Curate toward the decisions builders face |
| `/refactor-design` | Interfaces + Structure | Surfacing the abstractions that *should* exist |
| `/bold-refactor` | Structure | Collapsing premature boundaries, undoing irreversible decisions |
| `/expand` | Structure + Contracts | Defining new boundaries and their contracts before building |

See [`plugins/research-pipeline/docs/system-design.md`](plugins/research-pipeline/docs/system-design.md).

### 5. Model-selection framework

Claude has two levers — **model** (Opus/Sonnet/Haiku) and **effort** (thinking budget). Used well, they save 3-5× cost with no quality loss. Used poorly, they waste money on easy tasks and shortchange hard ones.

The pattern doc defines four archetypes — every role inside every skill maps to one:

| Archetype | Model + Effort | Typical role |
|-----------|---------------|-------------|
| **Orchestration** | Opus high | Few calls, cascading consequences (`/architecture`, `/epic-design`, `/feature-design`, `/deep-research` Lead, `/research-program` Planner) |
| **Parallel worker** | Sonnet medium | Many parallel, scoped (research sub-agents, deep-research specialists, implement-orchestrator workers). At program scale, campaigns themselves are the workers — each a full Opus+Sonnet tree. |
| **Synthesis / judgment** | Opus high | One call, integrates N inputs (synthesis agents, `/brief`, cross-campaign synthesizers + evaluators, gate audit) |
| **Volume / structured extraction** | Haiku low | Many calls, well-defined task (entity extraction, citation verification) |

Every SKILL.md that spawns sub-agents declares its archetype mapping in a **Model Assignment** section. See [`plugins/research-pipeline/docs/model-selection-pattern.md`](plugins/research-pipeline/docs/model-selection-pattern.md).

### 6. The Research Skills Family — three scales of the same fractal pattern

The research tools (`/research`, `/deep-research`, `/research-program`) are a single architectural pattern applied at three scales. Every scale has the same four roles: an **Orchestrator** that decomposes and dispatches, **Workers** that investigate in parallel with isolated contexts, a **Synthesizer** that reconciles their outputs, and an **Evaluator** that judges quality independently. What changes across scales is what each role orchestrates and how much is delegated.

| Scale | Skill | Orchestrator | Workers | Unit of output | Cost (calibrated) |
|-------|-------|-------------|---------|---------------|-------------------|
| Question | `/research` | Researcher (Opus) | 3-5 Sonnet sub-agents | One domain brief + reference skill | ~$3-5 |
| Domain | `/deep-research` | Lead (Opus) | 5-7 Sonnet specialists | Campaign dir (parent + N briefs + quality report) | ~$6 scoped, ~$12-15 default |
| Megatopic | `/research-program` | Planner (Opus) | 3-7 Campaigns (full `/deep-research` runs) | Program dir (plan + super-parent + N campaigns + program evaluation) | ~$35-75 |

**Isolation is the load-bearing principle.** Workers never see each other's full output (only sibling titles). Synthesizer sees everything. Evaluator sees only the produced briefs + seed — not the orchestrator's reasoning, not the decomposition tree. This prevents framing-bias inheritance: the Evaluator judges *what was produced*, not *what was intended*. The same rule applies at every scale.

**Composition:** `/research` escalates to `/deep-research` when topic is broad; `/deep-research` escalates to `/research-program` when seed is megatopic. `/deep-research --continue-from` extends a leaf of a prior campaign via chain mode. All three share reuse checks — existing briefs and campaigns are cited rather than re-run.

Grounded in Anthropic's multi-agent research pattern: 90% time reduction, 90.2% quality improvement over single-agent Opus on internal research eval.

See [`plugins/research-pipeline/docs/research-skills-overview.md`](plugins/research-pipeline/docs/research-skills-overview.md) (family view) · [`plugins/research-pipeline/docs/deep-research-north-star.md`](plugins/research-pipeline/docs/deep-research-north-star.md) + [`plugins/research-pipeline/docs/deep-research-architecture.md`](plugins/research-pipeline/docs/deep-research-architecture.md) · [`plugins/research-pipeline/docs/research-program-architecture.md`](plugins/research-pipeline/docs/research-program-architecture.md).

### 7. Cross-project knowledge patterns

Four pattern docs abstract the knowledge-layer design used by any project with a knowledge base. Storage/retrieval/generation are three independent concerns; adopt them in any order.

| Pattern | What it covers |
|---------|---------------|
| [Overview](plugins/research-pipeline/docs/knowledge-layer-overview.md) | The LLM Wiki pattern; three concerns; scale ladder |
| [Storage](plugins/research-pipeline/docs/knowledge-storage-pattern.md) | Frontmatter schema, typed cross-references, knowledge graph, backends |
| [Retrieval](plugins/research-pipeline/docs/knowledge-retrieval-pattern.md) | Tiered retrieval (L0-L3), metadata-first filtering, search ladder (v1-v3) |
| [Generation](plugins/research-pipeline/docs/knowledge-generation-pattern.md) | Ingest, refresh, lint, LLM enrichment, provenance, lifecycle |

### 8. Quality gates, not ceremony

- **`/research-pipeline:doc-review`** catches cross-doc drift with cascading passes (system-level → per-module). Triggered after `/architecture`, after `/epicize`, at quality checkpoints, and when `/update-documentation` changes planning docs. **Auto-fix loop has a mandatory re-audit gate** — every iteration's exit gate REQUIRES a freshly-dispatched Sonnet Agent for the audit; orchestrator self-verification is forbidden.
- **Loop exit gates are external-verifier-only across all skills.** Any loop converging on a quality criterion (auto-fix, evaluator pass, gate verification) MUST delegate the exit decision to a separately-dispatched verifier in a fresh context.
- **`/research-pipeline:security-review`** produces a scored report before deploy. Address Critical/High first.
- **`/agile-workflow:gate-infra`** (our addition) audits the release bundle for Terraform state divergence, missing CI-only enforcement, missing environment-gated reviewers on production deploys, JSON service-account keys in the repo, secrets in `.tf`/`.env` files, and migrations applied outside CI.
- **Every feature ships tests.** A feature is done when its item reaches `stage: done` with `gate_origin: tests` items resolved.
- **Infrastructure safety is non-negotiable.** `terraform apply` runs in CI only. Resources are prefixed. State is remote. `prevent_destroy` on critical resources. `gate-infra` enforces this at release time.

### 9. Agile substrate (forked from nklisch/skills)

Work is tracked as markdown files in `.work/` with YAML frontmatter — items, not docs.
Three tiers: `.work/active/{epics,features,stories}/` for in-flight, `.work/backlog/`
for parked, `.work/releases/<version>/` for shipped bundles. Late-binding releases:
items are bound to a version only when `/agile-workflow:release-deploy <version>`
runs — no premature commitment to scope. Gates emit ITEMS (tracked work), not reports.
Autopilot drains the depends_on graph autonomously.

See [`plugins/agile-workflow/README.md`](plugins/agile-workflow/README.md) for the substrate's full design.

---

## How to Use

1. **Start a new conversation.** Describe your idea or task.
2. **Session-start hooks** load the knowledge-index navigator + a `.work/` substrate snapshot automatically.
3. **Type the slash command** for the current step (e.g., `/research-pipeline:ideate` for a new project, `/agile-workflow:autopilot` to drain queued items).
4. **The skill guides you.** It asks questions, researches, produces docs, writes items.
5. **You decide when to advance.** Each skill has checkpoints. Say "this is solid" to move on, or "let's research more" to go deeper.
6. **Repeat** through the pipeline until the project ships via `/agile-workflow:release-deploy <version>`.

---

## Skills Catalog

All skills are invocable as namespaced slash commands once their plugin is installed. Use `/<plugin>:<skill>` (e.g., `/research-pipeline:research`, `/agile-workflow:scope`).

### research-pipeline (ours)

#### Pipeline & Planning

| Skill | Step | What it produces |
|-------|------|-----------------|
| [`/research-pipeline:knowledge-index`](plugins/research-pipeline/skills/knowledge-index/SKILL.md) | Session start | Catalog of all available project knowledge (3-layer; substrate-aware) |
| [`/research-pipeline:init-project`](plugins/research-pipeline/skills/init-project/SKILL.md) | 0. Scaffold | Drops the canonical template + invokes `/agile-workflow:convert` to seed `.work/` |
| [`/research-pipeline:ideate`](plugins/research-pipeline/skills/ideate/SKILL.md) | 1. Define | 4 foundation docs (VISION/SPEC/ARCHITECTURE/PRINCIPLES) + research-plan.md + auto-`/scout`. Detects existing docs (won't overwrite) |
| [`/research-pipeline:scout`](plugins/research-pipeline/skills/scout/SKILL.md) | 1.5 Scout | Landscape brief + research recommendations (Opus orchestrator + Sonnet workers) |
| [`/research-pipeline:research`](plugins/research-pipeline/skills/research/SKILL.md) | 2. Research (question) | Domain brief + auto-loading reference skill |
| [`/research-pipeline:deep-research`](plugins/research-pipeline/skills/deep-research/SKILL.md) | 2. Research (domain) | N cross-referenced briefs + parent synthesis + quality report |
| [`/research-pipeline:research-program`](plugins/research-pipeline/skills/research-program/SKILL.md) | 2. Research (megatopic) | Program directory: plan + super-parent + N campaigns + program evaluation |
| [`/research-pipeline:architecture`](plugins/research-pipeline/skills/architecture/SKILL.md) | 3. Design | Architecture doc (modules, data flow, conventions) |
| [`/research-pipeline:epicize`](plugins/research-pipeline/skills/epicize/SKILL.md) | 4. Plan | Epic items in `.work/active/epics/` with depends_on chains. Adaptive: heavy with research, light without |

#### Per Epic / Per Feature

| Skill | Step | What it produces |
|-------|------|-----------------|
| [`/research-pipeline:brief`](plugins/research-pipeline/skills/brief/SKILL.md) | 5. | Curated domain brief written into epic body (if `[needs-brief]` tag) |
| [`/research-pipeline:epic-design`](plugins/research-pipeline/skills/epic-design/SKILL.md) | 6a. | Decompose epic into feature items. `--only-questions` mode for cross-epic alignment |
| [`/research-pipeline:feature-design`](plugins/research-pipeline/skills/feature-design/SKILL.md) | 6b. | Write detailed design into feature body. `--only-questions` mode for autopilot-bound features |
| [`/research-pipeline:update-documentation`](plugins/research-pipeline/skills/update-documentation/SKILL.md) | 9. | Docs synced to code changes; frontmatter verified. Triggers `/doc-review` if planning docs changed |
| [`/research-pipeline:update-epicize`](plugins/research-pipeline/skills/update-epicize/SKILL.md) | After phases | Revised epic graph reflecting what was learned during implementation |

#### Quality Checkpoints

| Skill | What it produces |
|-------|-----------------|
| [`/research-pipeline:quality-checkpoint`](plugins/research-pipeline/skills/quality-checkpoint/SKILL.md) | Orchestrates 7 gates (security, tests, cruft, docs+extension, patterns, infra) + doc-review. Findings emit as items |
| [`/research-pipeline:doc-review`](plugins/research-pipeline/skills/doc-review/SKILL.md) | Planning doc consistency report (cascading: system → modules); auto-fix loop (cap: 5 iterations) |
| [`/research-pipeline:test-quality`](plugins/research-pipeline/skills/test-quality/SKILL.md) | Spec-driven test gap analysis (parses item `## Acceptance Criteria` checkboxes) |
| [`/research-pipeline:security-review`](plugins/research-pipeline/skills/security-review/SKILL.md) | Scored security report — address Critical/High before deploying |
| [`/research-pipeline:expand`](plugins/research-pipeline/skills/expand/SKILL.md) | Expansion doc for a subsystem when scope grows |

#### Auto-Loading Principles (not slash-invocable)

| Principle | What it enforces | When loaded |
|-----------|-----------------|-------------|
| [`build-process`](plugins/research-pipeline/skills/build-process/) | The full methodology | Always loaded |
| [`engineering-principles`](plugins/research-pipeline/skills/engineering-principles/) | Ports & Adapters, Single Source of Truth, Generated Contracts, Fail Fast (code-design level) | Loaded by `/architecture`, `/epic-design`, `/feature-design`, `/refactor-design` |

### agile-workflow (Nathan's, extended)

The full substrate-driven workflow Nathan ships, plus our `gate-infra` extension. See [`plugins/agile-workflow/README.md`](plugins/agile-workflow/README.md) for Nathan's plugin guide.

#### Bootstrap

| Skill | What it does |
|-------|-------------|
| [`/agile-workflow:ideate`](plugins/agile-workflow/skills/ideate/SKILL.md) | Foundation-docs workshop (Nathan's version — produces VISION/SPEC/ARCHITECTURE). Redundant if you use `/research-pipeline:ideate`, which produces all three plus PRINCIPLES + research-plan |
| [`/agile-workflow:convert`](plugins/agile-workflow/skills/convert/SKILL.md) | Bootstrap `.work/` substrate. Invoked automatically by `/research-pipeline:init-project` |
| [`/agile-workflow:epicize`](plugins/agile-workflow/skills/epicize/SKILL.md) | Nathan's version — foundation-docs-only flow. Use `/research-pipeline:epicize` instead for research-grounded grants |

#### Capture & promotion

| Skill | What it does |
|-------|-------------|
| [`/agile-workflow:park`](plugins/agile-workflow/skills/park/SKILL.md) | Quick capture into `.work/backlog/`. Triggers on "park this", "add to backlog" |
| [`/agile-workflow:scope`](plugins/agile-workflow/skills/scope/SKILL.md) | Promote backlog item or fresh request into `.work/active/` as epic/feature/story. Batch mode clusters whole backlog by code seam |
| [`/agile-workflow:fix`](plugins/agile-workflow/skills/fix/SKILL.md) | Single-stride bug repair. Reproduce → root cause → failing test → minimal fix → land at stage:review |

#### Design family

| Skill | Triggered by | What it produces |
|-------|---|---|
| [`/agile-workflow:epic-design`](plugins/agile-workflow/skills/epic-design/SKILL.md) | epic at stage:drafting | Nathan's version. Use `/research-pipeline:epic-design` instead for research-grounded design with knowledge-index loading |
| [`/agile-workflow:feature-design`](plugins/agile-workflow/skills/feature-design/SKILL.md) | feature at stage:drafting | Nathan's version. Use `/research-pipeline:feature-design` instead for our merged version |
| [`/agile-workflow:refactor-design`](plugins/agile-workflow/skills/refactor-design/SKILL.md) | feature with `tags:[refactor]`, OR discovery scope | Per-feature: code-smell scan, before/after, risk + rollback. Discovery: scans target scope, classifies findings, emits items |
| [`/agile-workflow:perf-design`](plugins/agile-workflow/skills/perf-design/SKILL.md) | feature with `tags:[perf]`, OR discovery scope | Per-feature: bottleneck ID, optimization hierarchy, benchmark scaffolds. Discovery: top 3-5 hot paths profiled |

#### Production + review

| Skill | What it does |
|-------|-------------|
| [`/agile-workflow:implement`](plugins/agile-workflow/skills/implement/SKILL.md) | Read item body, write code, run build+tests, advance stage implementing → review |
| [`/agile-workflow:implement-orchestrator`](plugins/agile-workflow/skills/implement-orchestrator/SKILL.md) | Walk depends_on graph, decide bundles/waves, dispatch implementation sub-agents when parallelism is beneficial |
| [`/agile-workflow:review`](plugins/agile-workflow/skills/review/SKILL.md) | Structured peer review with five lenses including foundation-doc alignment. Triages findings into items |

#### Release & autonomous

| Skill | What it does |
|-------|-------------|
| [`/agile-workflow:release-deploy`](plugins/agile-workflow/skills/release-deploy/SKILL.md) | Bind items to a version, run all configured gates in CONVENTIONS.md order, ship per release mapping, archive items via git mv. Idempotent |
| [`/agile-workflow:autopilot`](plugins/agile-workflow/skills/autopilot/SKILL.md) | Goal-backed queue runner. Picks next ready item respecting depends_on, invokes right skill, advances stage, repeats until goal scope is done or blocked |
| [`/agile-workflow:bold-refactor`](plugins/agile-workflow/skills/bold-refactor/SKILL.md) | Architectural reconception via conceptual lenses. Sweeps a target and produces one or more refactor EPICs with child features tagged `[refactor]` |

#### Gates (produce items, NOT pass/fail reports)

All gates fire during `release-deploy`'s quality-gate stage in CONVENTIONS.md order (default: security → tests → cruft → docs → patterns → infra).

| Skill | Items produced |
|-------|---|
| [`/agile-workflow:gate-security`](plugins/agile-workflow/skills/gate-security/SKILL.md) | Security findings with `gate_origin: security`, `tags: [security]` |
| [`/agile-workflow:gate-tests`](plugins/agile-workflow/skills/gate-tests/SKILL.md) | Coverage gaps + tautological-test reworks with `gate_origin: tests` (extended by us with spec-driven coverage policy) |
| [`/agile-workflow:gate-cruft`](plugins/agile-workflow/skills/gate-cruft/SKILL.md) | Dead code / cruft cleanup items with `gate_origin: cruft` |
| [`/agile-workflow:gate-docs`](plugins/agile-workflow/skills/gate-docs/SKILL.md) | Foundation-doc drift items with `gate_origin: docs` (extended by us with cascading consistency + knowledge-index-drift + brief-blocking-phase checks) |
| [`/agile-workflow:gate-patterns`](plugins/agile-workflow/skills/gate-patterns/SKILL.md) | Reusable patterns extracted to `.agents/skills/patterns/` with optional Claude mirror |
| [`/agile-workflow:gate-infra`](plugins/agile-workflow/skills/gate-infra/SKILL.md) | **OURS.** Terraform state divergence, missing CI-only enforcement, missing prod environment reviewer, JSON service-account keys, secrets in `.tf`/`.env`, manually-applied migrations. Severity-staged (Critical/High → implementing; Medium → drafting; Low → backlog) |

#### Reference

| Skill | What it does |
|-------|-------------|
| [`/agile-workflow:principles`](plugins/agile-workflow/skills/principles/SKILL.md) | Substrate-execution principles (Item-IS-the-Work, Rolling-Foundation, Late-Binding). Auto-loads |
| [`/agile-workflow:research`](plugins/agile-workflow/skills/research/SKILL.md) | Nathan's library/API/SDK research. Redundant if you use `/research-pipeline:research` |
| [`/agile-workflow:repo-eval`](plugins/agile-workflow/skills/repo-eval/SKILL.md) | Multi-dimensional codebase audit. Files top recommendations as substrate items tagged `[audit]` |
| [`/agile-workflow:e2e-test-design`](plugins/agile-workflow/skills/e2e-test-design/SKILL.md) | Designs golden-path + adversarial E2E test suite |
| [`/agile-workflow:bug-scan`](plugins/agile-workflow/skills/bug-scan/SKILL.md) | Sweep for likely bugs; emit fix items |
| [`/agile-workflow:tool-evaluator`](plugins/agile-workflow/skills/tool-evaluator/SKILL.md) | Self-evaluate agent tool usage in the current conversation |
| [`/agile-workflow:refactor-conventions-creator`](plugins/agile-workflow/skills/refactor-conventions-creator/SKILL.md) | Interview-based. Generates a project-specific refactor-conventions skill |

---

## Cross-Cutting Docs

These are not skills — they're patterns and primers that skills reference.

| Doc | What it covers | Who uses it |
|-----|---------------|-------------|
| [`docs/first-principles.md`](plugins/research-pipeline/docs/first-principles.md) | 10 thinking moves (Open / Challenge / Synthesize / Verify) + per-skill emphasis table | `/research`, `/deep-research`, `/research-program`, `/ideate`, `/architecture`, `/brief`, `/epicize` |
| [`docs/oblique-strategies.md`](plugins/research-pipeline/docs/oblique-strategies.md) | 10 lateral thinking moves (Reframe / Constrain / Stimulate) for when structured approaches get stuck | `/ideate`, `/architecture`, `/expand` |
| [`docs/system-design.md`](plugins/research-pipeline/docs/system-design.md) | 15 design moves across 5 concerns + per-skill emphasis table | `/architecture`, `/epic-design`, `/feature-design`, `/refactor-design`, `/bold-refactor`, `/expand`, `/brief`, `/implement` |
| [`docs/model-selection-pattern.md`](plugins/research-pipeline/docs/model-selection-pattern.md) | Four archetypes (orchestration, parallel-worker, synthesis, volume-extraction) with model + effort recommendations | Every skill that spawns sub-agents |
| [`docs/knowledge-layer-overview.md`](plugins/research-pipeline/docs/knowledge-layer-overview.md) + 3 pattern docs | Cross-project knowledge-layer architecture (storage, retrieval, generation) | Any project building a knowledge layer |
| [`docs/build-process.md`](plugins/research-pipeline/docs/build-process.md) | Full methodology: pipeline, doc ownership, substrate items, PR/CI gates, infrastructure safety | Always loaded |
| [`docs/gate-docs-extension.md`](plugins/research-pipeline/docs/gate-docs-extension.md) | Policy: cascading consistency + knowledge-index drift + brief-blocking-phase consistency added to `/agile-workflow:gate-docs` | `/research-pipeline:quality-checkpoint` |
| [`docs/gate-tests-extension.md`](plugins/research-pipeline/docs/gate-tests-extension.md) | Policy: spec-driven coverage added to `/agile-workflow:gate-tests` | `/research-pipeline:quality-checkpoint` |

### Skill-level architecture docs

Some skills have their own north-star + architecture docs for deeper reference:

| Skill | Docs |
|-------|------|
| `/scout` | [north-star](plugins/research-pipeline/docs/scout-north-star.md) + [architecture](plugins/research-pipeline/docs/scout-architecture.md) |
| Research family (overview) | [overview](plugins/research-pipeline/docs/research-skills-overview.md) — unifying view of `/research` + `/deep-research` + `/research-program` |
| `/deep-research` | [north-star](plugins/research-pipeline/docs/deep-research-north-star.md) + [architecture](plugins/research-pipeline/docs/deep-research-architecture.md) |
| `/research-program` | [architecture](plugins/research-pipeline/docs/research-program-architecture.md) |
| first-principles primer | [north-star](plugins/research-pipeline/docs/first-principles-north-star.md) + [architecture](plugins/research-pipeline/docs/first-principles-architecture.md) + [research brief](plugins/research-pipeline/docs/brief-first-principles-frameworks.md) |
| knowledge-edge creator (planned) | [north-star](plugins/research-pipeline/docs/knowledge-edge-north-star.md) |

---

## Key Rules

1. **Load the knowledge index first.** Every session starts with auto-loaded navigator + substrate snapshot (via plugin hooks). Run `/research-pipeline:knowledge-index` to regenerate when stale.
2. **Research before design.** Don't make architecture decisions based on assumptions.
3. **Items, not docs, track work.** Substrate items in `.work/` are the source of truth for in-flight work, not parallel design docs.
4. **Late-binding releases — bind items to a version only when shipping.** No premature commitment to release scope. `/agile-workflow:release-deploy <version>` is the only place items get bound.
5. **Rolling-foundation: docs describe present intent.** Planning docs (north-star, architecture, etc.) describe how things ARE now, not how they used to be. Historical decision records move to `docs/architecture/history/`.
6. **Each planning doc has one job.** Vision / architecture / epic graph. No duplication.
7. **Every feature ships with tests.** A feature is done when its item reaches `stage: done` with gate-tests items resolved.
8. **Never `terraform apply` locally.** CI only, on merge to main. `gate-infra` enforces this at release time.
9. **Never commit secrets.** `gate-infra` enforces this at release time.
10. **Quality checkpoint every 2-4 features.** `/research-pipeline:quality-checkpoint` orchestrates 7 gates + doc-review.
11. **Security review before deploy.** No Critical/High findings.
12. **Every SKILL.md declares its Model Assignment.** Explicit model choice per role — don't default to Opus everywhere.
13. **Thinking-heavy skills load `first-principles.md` before starting.** Shallow thinking propagates downstream.
14. **Design-heavy skills load `system-design.md` before starting.** 15 moves across Structure, Interfaces, Data, Scale, Reliability. Earn your complexity.
15. **Loop exit gates are external-verifier-only.** Any quality-converging loop delegates the exit decision to a separately-dispatched verifier in a fresh context.

---

## Installation

skills-v2 is distributed as a Claude Code plugin marketplace. Install via the plugin commands inside Claude Code:

```bash
/plugin marketplace add andrewclark88/skills-v2
/plugin install agile-workflow@andrewclark88-skills-v2
/plugin install research-pipeline@andrewclark88-skills-v2
/plugin install ux-ui-design@andrewclark88-skills-v2     # optional
/plugin install skill-authoring@andrewclark88-skills-v2  # optional
```

Both `agile-workflow` and `research-pipeline` ship hooks. Once installed:

- **SessionStart** prints the knowledge-index navigator (`research-pipeline`) + a `.work/` substrate snapshot (`agile-workflow`).
- **PostToolUse** bumps `updated:` frontmatter on docs (`research-pipeline`) and `.work/` items (`agile-workflow`) when they're edited.

No `~/.claude/settings.json` SessionStart hook is needed — the plugin hooks supersede it. To roll back to the pre-fork inline hook, uninstall the plugins and restore the inline SessionStart in your settings.

### Local development

To work on the plugins themselves, clone the repo and add it as a local marketplace:

```bash
git clone https://github.com/andrewclark88/skills-v2.git ~/dev/skills-v2
# Inside Claude Code (use the path you cloned to):
/plugin marketplace add ~/dev/skills-v2
/plugin install agile-workflow
/plugin install research-pipeline
```

Edits to `plugins/*/skills/*/SKILL.md` are visible immediately to new sessions.

---

## Repo Layout

```
skills-v2/
├── README.md                                  ← you are here
├── plugins/
│   ├── agile-workflow/                        ← Nathan's plugin, extended (gate-infra added)
│   ├── research-pipeline/                     ← our plugin (research + planning + grounding)
│   ├── ux-ui-design/                          ← Nathan's plugin (optional)
│   └── skill-authoring/                       ← Nathan's plugin (optional)
└── (plugin manifests, hooks, scripts under each plugin/)
```

Each plugin owns:

- `.claude-plugin/plugin.json` — manifest
- `skills/<skill-name>/SKILL.md` — skill source
- `docs/` — plugin-internal cross-cutting docs
- `hooks/hooks.json` + `hooks/scripts/*.sh` — SessionStart / PostToolUse hooks
- `README.md` — plugin guide

See per-plugin READMEs:

- [`plugins/research-pipeline/README.md`](plugins/research-pipeline/README.md) — research-pipeline plugin guide
- [`plugins/agile-workflow/README.md`](plugins/agile-workflow/README.md) — agile-workflow plugin guide (Nathan's, with our `gate-infra` addition noted)

---

## Design Philosophy

- **Opinionated over flexible.** Each skill has a single job and strong defaults. Less configuration, more convergence.
- **Substrate over docs.** In-flight work lives as items in `.work/`, not parallel design docs. Design content lives inside the item body.
- **Late-binding over upfront commitment.** Items aren't bound to a release until ship time. Scope can be revised until the moment of release.
- **Items, not reports.** Gates produce tracked work, not pass/fail PDFs. Findings have owners and depend_on chains.
- **Research before architecture.** Briefs are compiled knowledge, not chunked raw docs. The knowledge layer uses the LLM Wiki pattern.
- **Good results over token savings.** Defaults favor quality; fences exist but start generous. Model selection saves cost where quality isn't impacted, not where it is.
- **Data-driven over hand-curated.** When there's a data source, build a pipeline.
- **Explicit over implicit.** Every sub-agent dispatch names its model. Every doc has frontmatter. Every item has acceptance criteria.

---

## Acknowledgments

Built as a fork of [nklisch/skills](https://github.com/nklisch/skills). The `agile-workflow` plugin (substrate, gates, late-binding releases, autopilot) and `ux-ui-design` plugin are Nathan Klisch's work, extended in this fork with `gate-infra` and `gate-docs`/`gate-tests` policy extensions. The `research-pipeline` plugin (research family, architecture, epicize, brief, epic-design, feature-design, knowledge-index, doc-review, quality-checkpoint) is first-party and adds research-grounded planning on top of the substrate. To track upstream improvements: `git fetch upstream && git diff upstream/main`.
