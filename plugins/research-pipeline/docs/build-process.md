# Build Process

Standard methodology for building projects. Follow this process for all new projects and modules. Skills (slash commands) automate each step — see the Pipeline section for the full flow.

## Where This Lives

This document is the source of truth. It's enforced through three layers:

| File | Scope | Purpose |
|------|-------|---------|
| `~/.claude/CLAUDE.md` | Global — always loaded in every conversation | Hard guardrails. Cannot be dropped even in long sessions. |
| Project-level `CLAUDE.md` | Loaded when working in a project | Points to this document. |
| `skills/docs/build-process.md` | This file | Full methodology, reference, and checklists. Human-readable and portable. |

If the rules here conflict with a project-level doc, this document wins.

---

## The Pipeline

Every project follows this pipeline. Skills in `code blocks` are slash commands.

```
SESSION START (every session that isn't truly the first one on a project)
│
├─ 0. Load Existing Knowledge  /knowledge-index   ← ESSENTIAL
│     └─ scans docs/knowledge-index.yaml + planning docs
│     └─ shows what briefs, architecture, roadmap, and research exist
│     └─ prevents duplicate work and surfaces relevant context for the task
│     └─ skip ONLY when starting a brand-new project with no docs yet
│
PROJECT START (truly new project — no existing docs)
│
├─ 1. Define the Project       /ideate
│     └─ produces: north-star.md (vision, principles, domain model, research plan)
│     └─ auto-calls /scout during ideation (breadth-first prior art discovery)
│     └─ produces: scout-landscape.md (adjacent projects, patterns, lessons)
│     └─ scout's research recommendations merge into the north star's research plan
│
├─ 2. Research the Domain      /research  (for a focused topic, one domain)
│                              /deep-research  (for topics spanning 5+ orthogonal facets)
│                              /research-program  (for megatopics spanning multiple domains)
│     └─ produces: domain briefs (+ reference skills for /research; parent + specialist briefs
│        for /deep-research; program + super-parent + N campaigns for /research-program)
│     └─ repeat until all critical domains are understood
│     └─ don't rush this — assumptions here cause rewrites later
│     └─ escalation is user-gated: /research → /deep-research → /research-program
│
├─ 3. Design the Architecture  /architecture
│     └─ produces: architecture.md (modules, data flow, conventions)
│     └─ grounded in north star + domain briefs — no unresearched assumptions
│     └─ run /doc-review — verify architecture matches north star + briefs
│
├─ 4. Plan the Build           /roadmap
│     └─ produces: roadmap.md (blocking briefs, Input/Output/Tests per phase)
│     └─ run /doc-review — verify roadmap matches architecture + north star
│
│  ┌── PER PHASE ──────────────────────────────────────────────┐
│  │                                                           │
│  ├─ 5. Brief (if listed)     /brief                          │
│  │     └─ produces: curated domain brief for the builder     │
│  │                                                           │
│  ├─ 6. Design                /design                         │
│  │     └─ produces: design doc (interfaces, types,           │
│  │        acceptance criteria, file paths)                    │
│  │                                                           │
│  ├─ 7. Build                 /implement or /implement-orchestrator
│  │     └─ produces: code + tests                             │
│  │                                                           │
│  ├─ 8. PR + CI               (branch → PR → CI green → merge)
│  │     └─ phase done when PR merges                          │
│  │                                                           │
│  ├─ 9. Update Docs           /update-documentation           │
│  │     └─ syncs all docs to code changes                     │
│  │                                                           │
│  └───────────────────────────────────────────────────────────┘
│
│  ┌── EVERY 2-4 PHASES ──────────────────────────────────────┐
│  │                                                           │
│  ├─ Quality Checkpoint (every 2-4 phases)                    │
│  │  ├─ /quality-checkpoint → orchestrator; runs the four     │
│  │  │                        below on a shared scope and      │
│  │  │                        produces a consolidated summary  │
│  │  │  ├─ /doc-review      → planning-doc consistency        │
│  │  │  ├─ /refactor-design → duplication / abstractions      │
│  │  │  ├─ /extract-patterns→ document reusable patterns      │
│  │  │  └─ /test-quality    → spec-driven test gaps           │
│  │  │                                                         │
│  │  └─ Or run any of the four individually if the full        │
│  │     checkpoint isn't warranted                              │
│  └───────────────────────────────────────────────────────────┘
│
│  ┌── PRE-DEPLOY ────────────────────────────────────────────┐
│  │                                                           │
│  ├─ /security-review       → comprehensive audit, scored     │
│  │                           report, address Critical/High   │
│  │                           before deploying                │
│  └───────────────────────────────────────────────────────────┘
│
├─ /update-documentation maintains the Features section of architecture.md
│     └─ what the tool can do today — updated after each phase, not written once
│
├─ Deploy (final phase)
│     └─ Terraform via CI only — see Infrastructure Safety
│
│  ┌── ONGOING / AS-NEEDED ───────────────────────────────────┐
│  │                                                           │
│  ├─ /cruft-cleaner         → remove dead code, AI bloat      │
│  ├─ /bold-refactor         → find architectural              │
│  │                           simplifications                  │
│  ├─ /feature               → quick extension outside roadmap  │
│  ├─ /expand                → scope expansion for subsystems   │
│  ├─ /repo-eval             → multi-dimensional codebase       │
│  │                           scoring                          │
│  ├─ /e2e-test-design       → end-to-end test suite design     │
│  ├─ /release               → changelog + release              │
│  └───────────────────────────────────────────────────────────┘

KNOWLEDGE INDEX (essential infrastructure, maintained automatically):
  /knowledge-index runs at the start of every session that isn't truly
  the first one on a project. This is non-negotiable — agents that skip
  it duplicate prior work and miss available context.

  Doc-producing skills (/ideate, /scout, /research, /deep-research,
  /research-program, /architecture, /brief, /epicize, /refactor-design,
  /feature, /extract-patterns, /expand) emit conformant frontmatter and
  call /knowledge-index to regenerate the index. The index is fully
  derived from frontmatter — never hand-edited.
  Doc-maintaining skills (/update-documentation, /doc-review) call
  /knowledge-index after creating, modifying, or fixing docs.
  Skills that consume context (/design, /implement, /brief, etc.)
  should check the index FIRST before researching from scratch or
  duplicating work.
```

---

## Knowledge Index

Every project accumulates knowledge — briefs, architecture docs, research findings. The knowledge index (`docs/knowledge-index.yaml`) tracks all of it so future sessions know what context is available.

**The knowledge index is essential infrastructure, not optional polish.** Skipping it leads to: duplicated research, contradicted prior decisions, agents flying blind on context that's already available, and architectural drift. Every project past day one should have a knowledge index, and every session past day one should consult it.

**How it works:**
- `/knowledge-index` — regenerates the index from frontmatter and presents available knowledge. Two-layer output: terse `knowledge-index.yaml` (always loaded at session start) + rich `knowledge-index-detail.yaml` (on-demand). Inline lint pass catches drift.
- The index is fully **derived from frontmatter**. Sibling skills write conformant frontmatter on the docs they produce; `/knowledge-index` regenerates. Nothing else writes to the index files.
- Skills that consume context (`/design`, `/implement`, `/brief`, `/architecture`, etc.) check the index BEFORE doing any work that might already be done.

**The rules:**
1. **Session start: load it.** The terse `knowledge-index.yaml` auto-loads. The agent's first action should not be searching the codebase — it should be checking what's already known.
2. **Before researching: check it.** A `/research` invocation should not begin without confirming a relevant brief doesn't already exist.
3. **Before designing: check it.** `/design` reads the index for blocking briefs before producing a design doc.
4. **After writing a doc: regenerate it.** Every doc-producing skill calls `/knowledge-index` after writing. Hand-written planning docs trigger the same regeneration. Never hand-edit `knowledge-index.yaml` or `knowledge-index-detail.yaml` — they're derived artifacts.

**Doc frontmatter convention:** Every indexable doc declares `description`, `type`, `updated`, `summary`, `kind` (often derived from `type`+`status`), and either `decisions:` (planning) or `key_findings:` (research). See `knowledge-index/SKILL.md` for the full schema and `knowledge-index/REDESIGN-SKETCH.md` for design rationale.

---

## When to Use `/brief` vs `/feature` vs `/expand`

These three skills all produce scoping documents but serve different purposes:

| Situation | Skill | Why |
|-----------|-------|-----|
| A roadmap phase lists a **blocking brief** — domain knowledge is needed before building | `/brief` | Domain research for the knowledge layer. Produces a curated brief optimized for agent consumption. Updates the knowledge index. |
| You need a **quick software extension** outside the core roadmap — self-contained, typically small | `/feature` | Software-dev scoped. Explores the codebase, interviews about requirements, produces a feature brief that `/design` consumes. Doesn't change the roadmap. |
| You're adding a **new subsystem or capability** that changes the project's scope | `/expand` | Larger than a feature, smaller than re-running `/ideate`. Updates foundation docs (north star, architecture) and feeds into a roadmap update. |

**Decision tree:**
- Does this change the project's architecture or scope? → `/expand`
- Does this need domain knowledge research (rules, APIs, protocols)? → `/brief`
- Is this a self-contained software addition within existing architecture? → `/feature`

If you're unsure, start with `/brief` — domain knowledge never hurts, and `/feature` can consume a brief's output.

---

## When to Use `/research` vs `/deep-research` vs `/research-program`

Three scales of the same fractal pattern (same four-role architecture: orchestrator + isolated parallel workers + synthesis + isolated evaluator). All three produce briefs the build process consumes; they differ in breadth, shape, and cost.

| Situation | Skill | Shape | Cost (calibrated) |
|-----------|-------|-------|-------------------|
| Focused topic, one domain, clear question | `/research` | Orchestrator + 3-5 Sonnet sub-agents, synthesis in parent | ~$3-5 |
| Topic spans 5+ orthogonal aspects, or decomposition is part of the work, or multi-angle synthesis matters | `/deep-research` | Lead + 3-7 Sonnet specialists (parallel, isolated) + spawned Opus Synthesis + spawned Opus Evaluator | ~$6 scoped, ~$12-15 default |
| Megatopic spans multiple distinct domains (3+), each big enough to be its own campaign | `/research-program` | Planner + 3-7 Campaigns (each a full `/deep-research` tree) + Cross-Campaign Synthesizer + Program Evaluator | ~$35-75 |

**Escalation ladder:** `/research` can escalate to `/deep-research` when it detects the topic is broad. `/deep-research` can escalate to `/research-program` when its Lead recognizes the seed is actually a megatopic. `/ideate`, `/brief`, and `/expand` can all call any of the three directly based on the shape of what they need. Escalation is always user-gated.

**Chain mode:** `/deep-research --continue-from <parent-campaign-dir>` extends a leaf of a prior campaign — loads parent context, scopes decomposition to the leaf, writes typed cross-references back, appends a child-pointer section to the parent's `parent.md`. Use when a finished campaign's output reveals one leaf turned out to be its own domain. Chains longer than 2-3 links typically mean the topic should have been `/research-program` from the start.

**Reuse check:** every scale's Phase 1 checks `knowledge-index.yaml` for existing work. Cite existing briefs and campaigns instead of re-running — saves $6-15 per cited campaign at program scale.

See [`research-skills-overview.md`](research-skills-overview.md) for the full family view (fractal pattern, composition points, isolation rules). Full architectures: [`deep-research-architecture.md`](deep-research-architecture.md), [`research-program-architecture.md`](research-program-architecture.md).

---

## Model Selection

Skills that spawn sub-agents follow the [Model Selection Pattern](model-selection-pattern.md) — four archetypes (orchestration, parallel-worker, synthesis, volume-extraction) with explicit model (Opus/Sonnet/Haiku) and effort recommendations. Each skill's SKILL.md declares its archetype mapping.

**The short version:**
- **Orchestration** (few calls, high stakes — e.g. `/architecture`, `/design`, `/deep-research` Lead) → Opus high
- **Parallel workers** (many parallel, scoped — e.g. research sub-agents, deep-research specialists) → Sonnet medium
- **Synthesis / judgment** (one call, integrates N inputs) → Opus high
- **Volume / structured extraction** (many calls, well-defined task) → Haiku low

Cost impact (calibrated from demos 2026-04-15): a scoped `/deep-research` campaign costs ~$6 using the mix, a default campaign ~$12-15, vs ~$50-75 if everything ran on Opus. A 4-campaign `/research-program` lands at ~$35-60.

---

## Step Details

### 1. Define the Project (`/ideate`)

Interactive workshop. Explore the idea, refine it, produce a north star. Also identify what domains need research before architecture can be designed. Auto-calls `/scout` for breadth-first prior art discovery — finding adjacent projects, approaches, and lessons learned before committing to a direction.

**Produces:** `north-star.md` (vision, principles, domain model, research plan) + `scout-landscape.md` (prior art).

**Does NOT produce architecture.** Architecture requires domain research first. Don't design how to build something until you understand the domain it operates in.

### 2. Research the Domain (`/research`)

Deep investigation of each domain identified in step 1. Use for external systems, protocols, APIs, analytical methods, hardware, regulations — anything the project builds on.

**Produces:** Domain briefs + auto-loading reference skills.

**Be aggressive about research.** It's far cheaper to spend a session researching than to discover mid-build that the domain works differently than assumed. If you're not sure whether something needs research, it does.

**Run `/research` multiple times** — once per domain. Don't try to research everything in one pass.

### 3. Design the Architecture (`/architecture`)

Technical design, informed by the north star AND domain briefs. Now you know enough to make real decisions.

**Produces:** `architecture.md` (modules, data flow, conventions, dependencies).

**Prerequisites:** North star and relevant domain briefs MUST exist. If you discover during architecture that a domain isn't understood, stop and run `/research` first.

**Ground every decision in research.** Not "we'll use X" but "we'll use X because the domain brief confirmed it fits our constraints."

**After writing architecture.md, run `/doc-review`.** Architecture is the first doc that must be consistent with both the north star and domain briefs. Catch contradictions before building a roadmap on top of them.

### Document Types & Ownership

Three planning doc types + one knowledge type. Each has one job. No duplication across types.

When content belongs in two places, put it in one and reference the other.

#### North Star (`type: north-star`)

**Owns:** Vision, principles, domain model — the "what and why."
**Does NOT own:** File paths, phase status, technical implementation, module structure.
**Produced by:** `/ideate`

**Required sections:**
- **Vision** — 1-2 sentences
- **Problem** — what's broken today
- **Principles** — 5-7 rules that guide every decision
- **Domain Model** — core concepts and their relationships
- **Research Plan** — domains that need `/research` before `/architecture`, with status
- **Related Documents** — links to scout landscape, architecture, roadmap

#### Architecture (`type: architecture`)

**Owns:** How the system is built — modules, data flow, conventions, dependencies, cross-cutting design decisions.
**Does NOT own:** Vision/principles (north star), phase status (roadmap).
**Produced by:** `/architecture`. Maintained by `/update-documentation` after each phase.

**Required sections:**
- **System Overview** — diagram
- **Module Map** — file/directory → responsibility → external dependency
- **Data Flow** — how data moves through the system
- **Conventions** — code org, API patterns, error handling, testing
- **Dependencies** — table
- **What's Deferred** — and why

**Optional sections (as the project needs them):**
- **Features** — what the tool can do today, organized by user-facing capability. Maintained by `/update-documentation`.
- **Knowledge Store** — if the project has searchable knowledge (knowledge-store.md)
- **Tool/Dependency Map** — cross-module dependencies (tool-use-map.md)
- **Development Workflow** — local dev, CI, deployment model
- **Other cross-cutting design docs** — whatever the project needs

All architecture-type docs live in `docs/architecture/`. There can be multiple files — one main `architecture.md` plus supplementary docs like `knowledge-store.md`, `tool-use-map.md`, etc. All typed as `architecture` in the knowledge index.

#### Roadmap (`type: roadmap`)

**Owns:** Phases, status, dependencies, blocking briefs, decisions, open questions — the "when and in what order."
**Does NOT own:** Module internals, domain model, architecture details.
**Produced by:** `/epicize`

**Required sections:**
- **Acceptance gate** — how a phase is considered done (PR + CI + tests)
- **Phase table** — each phase with: blocking briefs, read before building, build, output, done-when (automated vs manual)
- **Quality checkpoints** — every 2-4 phases
- **Security review** — pre-deploy
- **Dependency graph** — ASCII diagram
- **Decisions (locked)** — choices made and rationale
- **Open questions** — unresolved items

#### Briefs (`type: brief`)

**Owns:** Curated domain knowledge — facts, research findings, implementation context.
**Does NOT own:** Design decisions, system architecture, phase status.
**Produced by:** `/research` (domain investigation), `/brief` (phase-specific context)
**Checked by:** `knowledge/lint` (staleness, orphans, contradictions) — NOT `/doc-review`

### 4. Plan the Build (`/epicize`)

Produces a roadmap where each phase is a self-contained build spec, completable in one session.

**After writing roadmap.md, run `/doc-review`.** The roadmap references everything — architecture, briefs, phase numbers, blocking dependencies. Verify it all agrees before building starts. This is the last consistency gate before implementation.

**Every phase has:**
- **Blocking briefs** — domain knowledge that must be written before the phase begins
- **Read before building** — docs and code to load into context
- **Build** — what to implement (specific files, endpoints, features)
- **Output** — files produced
- **Tests** — acceptance criteria, split into automated and manual
- **Dependencies** — what must exist before this phase starts

Status tracking: DONE / NEXT / blank.

### 5. Brief-Driven Development (`/brief`)

Before each implementation phase, **write the brief that unblocks it.** Briefs are curated domain knowledge optimized for agent consumption — not raw research, not architecture, not tutorials. They answer: "what does the builder need to know to implement this phase correctly?"

**The rule:** If a roadmap phase lists a blocking brief, run `/brief` before the phase begins. The skill reads the roadmap phase, researches the domain, and produces a structured brief.

**`/research` vs `/brief`:** Research investigates broadly and produces a reference. Brief takes research (or does its own) and distills it into implementation-ready context for a specific phase. Research feeds briefs; briefs feed builds.

### 6. Design (`/design`)

Produces a detailed design document from the roadmap phase spec. Contains:
- Exact file paths
- Full interfaces and types in the project's language
- Function signatures
- Implementation notes for non-obvious logic
- Acceptance criteria (testable assertions, not subjective)
- Implementation order (resolves dependencies)

**The design doc is the bridge between the roadmap (what to build) and implementation (building it).** An implementer agent can write code from it without asking questions.

### 7. Build (`/implement` or `/implement-orchestrator`)

Implement the design document.

- **`/implement`** — single agent, best for phases with <20 files
- **`/implement-orchestrator`** — Opus orchestrator spawns parallel Sonnet agents, best for large phases or parallelizable work

Output includes code AND tests. Tests are the contract — a phase is done when its tests pass.

### 8. PR + CI

All code goes through a PR. The phase is done when:

1. Automated tests pass
2. Docker build succeeds (if applicable)
3. Human confirms manual checks (if any)
4. PR is opened, CI passes, and PR is merged to main

**A phase is not done until its PR is merged.** Working locally is not enough.

### 9. Update Documentation (`/update-documentation`)

After each phase, sync all docs to the code changes just made. Catches drift between what was planned and what was built.

**If planning docs were modified** (architecture, roadmap, north star, cross-cutting designs), `/update-documentation` triggers `/doc-review` to check cross-doc consistency. Changes to one planning doc can contradict another — doc-review catches that.

### Quality Checkpoints (every 2-4 phases)

After 2-4 implementation phases, pause and run a quality pass. Two equivalent paths:

**Path A (preferred): `/quality-checkpoint`** — orchestrates the four sub-skills below on a shared scope (defaults to the latest completed roadmap phase), produces a consolidated summary, and asks what to act on.

**Path B: run sub-skills individually** — when you only need one, or want full control over scope per sub-skill:

- **`/doc-review`** — audit planning docs for consistency (run first — doc issues reveal code issues)
- **`/refactor-design`** — find duplication, missing abstractions. Produces a refactor plan. Implement it.
- **`/extract-patterns`** — document reusable code patterns for consistency.
- **`/test-quality`** — spec-driven test gap analysis. Writes missing tests.

**Also run `/doc-review` after major design changes**, not just at quality checkpoints. If you changed the architecture, added a module, or resolved an open question — check that all docs agree.

**`/doc-review` runs at three points in the pipeline:**
1. **After `/architecture`** — verify architecture matches north star + domain briefs
2. **After `/epicize`** — verify roadmap matches architecture + north star + briefs
3. **Every 2-4 implementation phases** — catch drift introduced during building
4. **When triggered by `/update-documentation`** — if planning docs were modified

### Doc Review: Cascading Passes (`/doc-review`)

`/doc-review` uses cascading passes to check consistency at multiple levels. This is especially important for multi-module projects where module docs can drift from system-level docs.

```
Pass 1: System-Level
  north-star ↔ architecture ↔ roadmap ↔ cross-cutting designs (knowledge-store, tool-use-map)
  → Are these internally consistent?

Pass 2+: System + Module (one pass per module, discovered dynamically)
  All of Pass 1 + module's north star
  → Does the module's scope match the roadmap phases?
  → Does the module's architecture match the system architecture?
  → Does the module reference cross-cutting systems correctly?
  → Are MCP primitives, frontmatter specs, and phase numbers consistent?
```

**Module discovery is dynamic.** The skill finds modules by scanning the knowledge index and `docs/*/architecture/` directories. No hardcoded module list — works for any project with any number of modules.

**Arguments:**
- No args: full cascade (system + all modules)
- Module name: system + that module only
- `--system-only`: system-level only, skip module passes

### Pre-Deploy Security Review

Before any production deployment:

- **`/security-review`** — comprehensive audit. Discovers stack, lets you choose focus domains (auth, injection, secrets, dependencies, API, infra, crypto, data protection, error handling). Researches current best practices. Produces a scored markdown report with severity-classified findings.
- **Address all Critical and High findings before deploying.** Medium findings should be tracked. Low/Info are best-effort.
- The security report feeds into `/design` for remediation planning.

### Cleanup (as needed)

- **`/cruft-cleaner`** — remove dead code, stale comments, AI-accumulated bloat. Run when the codebase feels heavy.
- **`/bold-refactor`** — find beautiful cross-cutting simplifications. Run when you suspect the architecture can be fundamentally simplified.

---

## Working Principles

- **Data-driven over hand-curated.** When there's a data source, build a pipeline. Don't manually curate what can be automated.
- **Repeatable processes.** Pipelines should re-run (new data, new releases, meta shifts). One-off scripts become recurring commands.
- **Auto-generate, then enrich.** Generate what you can from existing data, layer in external sources, leave TODOs only for things requiring human judgment.
- **Don't hand-write what can be researched.** Use `/research`, web search, API exploration, and data analysis before asking for manual input.

---

## Loop Exit Gates: External Verifier Required

**Any loop that converges on a quality criterion — auto-fix loops, evaluator passes, gate verifications — MUST delegate the exit decision to a separately-dispatched verifier in a fresh context. The orchestrator's self-confidence is not an exit gate. This is non-negotiable across all skills.**

This rule applies to (non-exhaustive list):

- `/doc-review`'s auto-fix loop (re-audit dispatched as Sonnet Agent every iteration)
- `/deep-research`'s evaluator pass (Opus Agent, isolated context)
- `/research-program`'s program-level evaluator
- `/security-review`'s severity verification
- Any future loop skill that converges on quality criteria

### Why this is structural, not stylistic

The orchestrator (the skill's main loop) is the same context that just produced the fixes / findings. It has motivated reasoning to declare the work done — token economy, fatigue, completion bias. **The orchestrator cannot verify itself.**

A separately-dispatched verifier in a fresh context has none of those biases. It reads only the inputs (briefs / docs / fixes) and produces a structured verdict. The exit decision is then mechanical: read the verdict's severity counts, exit if 0/0, otherwise iterate.

### Concrete pattern (applies to all loop skills)

For every iteration of a quality-convergence loop:

1. Apply fixes (orchestrator may do this directly or via dispatched fix agent).
2. **Dispatch a fresh verifier Agent.** New context, given only the inputs needed to verify. Required — this step is non-negotiable.
3. Verifier produces a structured report with severity counts (or equivalent quality signal).
4. **Read the verdict from the report.** Exit decision is mechanical: if severity counts indicate convergence (0 Critical, 0 High; or score ≥ threshold), exit. Otherwise iterate.
5. The orchestrator does NOT make the exit call from its own assessment, grep, spot-check, or "it looks fine."

### Anti-patterns explicitly forbidden

- Orchestrator manually grepping for the patterns the previous verifier flagged and declaring success
- Orchestrator spot-checking edited files and declaring "they look right"
- Orchestrator exiting the loop on its own confidence ("I'm sure that fixed it")
- Orchestrator skipping the verifier dispatch for token-economy reasons
- Orchestrator re-using a stale verifier output from a previous iteration

### Why this matters

Skill rules that say "re-run the audit" without enforcing structural separation can be violated by an orchestrator interpreting the rule loosely. Making the verifier-dispatch a required Agent call (visible in the tool-call trace) makes shortcut exits structurally observable. The cost of one extra dispatched audit is far less than the cost of an undetected regression.

---

## Thinking Layer

The pipeline's thinking-heavy skills (`/research`, `/deep-research`, `/research-program`, `/ideate`, `/architecture`, `/brief`, `/epicize`) load a first-principles thinking primer before starting work. The primer provides 10 concrete thinking moves organized in four phases:

1. **Open** — decompose the problem, question deeply, doubt what you know
2. **Challenge** — invert the problem, seek falsification, trace consequences
3. **Synthesize** — find leverage points, apply multiple lenses
4. **Verify** — test your understanding, check your thinking mode

**The Asymmetry Principle:** The cost of not going deep enough is much higher than the cost of going too deep. When in doubt, go deeper.

**For `/deep-research` specifically**, the thinking layer is load-bearing across three phases:
- **Decomposition** (Open + Synthesize) — faceted decomposition is the highest-leverage decision in a campaign; a bad tree wastes specialists × token budget on wrong questions
- **Stopping decisions** (Challenge + Verify) — falsify your confidence that each leaf is truly a leaf; test the decomposition by trying to find what's missing
- **Synthesis** (Challenge + Synthesize) — invert the campaign ("what would make these briefs useless?"), find leverage in cross-references, check for contradictions rather than smoothing them over

See [`docs/first-principles.md`](first-principles.md) for the full primer and per-skill emphasis table.

## System Design Layer

The pipeline's design-heavy skills (`/architecture`, `/design`, `/implement`, `/brief`) load a system design primer before starting work. The primer provides 15 concrete design moves organized across five concerns:

1. **Structure** — start monolith, invert at real boundaries, minimize irreversible decisions
2. **Interfaces** — contracts before implementations, match API to consumer, evolve additively
3. **Data** — normalize first, per-feature consistency, cache deliberately
4. **Scale** — idempotent operations, stateless services, scale vertically first
5. **Reliability** — instrument from day one, design for failure, validate at boundaries

**The Earn-Your-Complexity Principle:** 12 of the 15 moves are design-in (cheap to include from the start, expensive to retrofit). 3 are earn-in (add only with measured evidence). When in doubt, keep it simple.

The system design primer complements the first-principles thinking primer: first-principles teaches *how to think*; system-design teaches *how to design*. Skills that do both (like `/architecture`) load both.

See [`docs/system-design.md`](system-design.md) for the full primer and per-skill emphasis table.

---

## Infrastructure Safety Practices

These apply whenever a project deploys to shared cloud infrastructure (GCP, AWS, etc.). The goal: **never destroy or interfere with resources you don't own.**

### Terraform Rules

**Never apply locally.** Local `terraform apply` has no review, no audit trail, and no guardrails against destroying someone else's resources.

| Action | Where it runs | When |
|--------|--------------|------|
| `terraform init` | Local or CI | Anytime (safe, idempotent) |
| `terraform plan` | Local or CI | Anytime — review the plan carefully |
| `terraform apply` | **CI only, on merge to main** | After plan is reviewed and approved in PR |
| `terraform destroy` | **Never without explicit approval** | Requires manual confirmation + team review |

**Remote state is mandatory.** Terraform state must be stored in a remote backend (GCS bucket, S3, Terraform Cloud) with state locking enabled. Never commit `.tfstate` files to git.

```hcl
terraform {
  backend "gcs" {
    bucket = "<project>-terraform-state"
    prefix = "<service-name>"
  }
}
```

**State lock prevents concurrent applies.** If two CI jobs try to apply at the same time, the lock prevents conflicts. Never use `-lock=false`.

### Shared Project Safety

When deploying into a GCP project (or AWS account) that other teams use:

**Prefix all resources.** Every resource your project creates should be namespaced:
- GCS buckets: `<project-name>-<purpose>` (e.g., `myproject-briefs`)
- Service accounts: `<project-name>-<role>` (e.g., `myproject-server`)
- Secrets: `<project-name>-<secret>` (e.g., `myproject-bearer-token`)
- Cloud Run services: `<project-name>` (e.g., `myproject`)

**Never use wildcard IAM.** Don't grant project-level `roles/owner` or `roles/editor` to service accounts. Use the narrowest role on the specific resource.

**Import before managing.** If a resource already exists (someone created it manually), `terraform import` it into your state before writing the `.tf` file.

**Use `prevent_destroy` on critical resources:**

```hcl
resource "google_storage_bucket" "data" {
  lifecycle {
    prevent_destroy = true
  }
}
```

**Tag everything.** Add labels to all resources so ownership is clear:

```hcl
labels = {
  managed_by = "terraform"
  project    = "<project-name>"
  team       = "data"
}
```

### Secrets

**Never in code.** Secrets (API keys, tokens, passwords) never appear in:
- Source code (`.ts`, `.py`, `.tf` files)
- Terraform state committed to git
- Environment variable files committed to git (`.env`)
- CI/CD logs

**Where secrets live:**
- GCP Secret Manager (for deployed services)
- Local environment variables (for development)
- CI/CD secret store (GitHub Actions secrets, etc.)

### Pre-Flight Checklist (Before First `terraform apply`)

- [ ] Remote state backend exists (GCS bucket for state)
- [ ] State bucket has versioning enabled
- [ ] CI/CD pipeline is configured for plan-on-PR, apply-on-merge
- [ ] All resources are prefixed with project name
- [ ] IAM bindings are scoped to specific resources (not project-wide)
- [ ] Secrets are in Secret Manager (not in code or `.tfvars` committed to git)
- [ ] `prevent_destroy` is set on any resource that would be catastrophic to lose
- [ ] All resources have ownership labels
- [ ] Team has reviewed the initial `terraform plan` output

---

## PR & CI Checkpoints

**All code goes through PRs.** No direct pushes to main for application code or infrastructure.

### Application Code PR Pipeline

```
PR opened/updated:
  → Build (compile, lint)
  → Run full test suite
  → Docker build (verify the deployable image still builds)
  → All checks must pass before merge is allowed

Merge to main:
  → Same checks run again
  → (After deploy phase) Deploy
```

### Infrastructure PR Pipeline

```
PR opened/updated:
  → terraform init
  → terraform plan
  → Post plan output as PR comment
  → Require approval before merge

Merge to main:
  → terraform init
  → terraform plan (again, to catch drift)
  → terraform apply -auto-approve
```

### Branch Protection Rules

| Rule | Required |
|------|----------|
| PRs required before merge to main | Yes |
| At least 1 approval (or self-review for solo projects) | Yes |
| CI checks must pass | Yes |
| No direct pushes to main | Yes |
| No force pushes to main | Yes |

### What CI Checks Per Phase

Each roadmap phase ships tests. CI runs them all, not just the new phase's tests. The full suite is the regression gate.

| Check | When | Why |
|-------|------|-----|
| Build/compile | Every PR | Catch type errors, syntax issues |
| Unit tests | Every PR | Phase acceptance + regression |
| Docker build | Every PR | Verify the deployable image works |
| Terraform plan | Infra PRs only | Review before apply |
| Lint (if configured) | Every PR | Code quality |

---

## Git Practices

- **Commits are small and focused.** One logical change per commit.
- **PRs before merge.** No direct pushes to main. Code review required.
- **Don't commit generated files.** Data caches, build outputs, `.env` files, `.tfstate` — all gitignored.
- **Don't commit secrets.** Ever. Use pre-commit hooks or CI checks to catch accidental secret commits.

---

## Skill Reference

| Skill | When | What it produces |
|-------|------|-----------------|
| `/knowledge-index` | Start of every session | Shows all available project knowledge (briefs, docs) |
| `/ideate` | Step 1 (project start) | North star + research plan |
| `/scout` | Auto-called during /ideate + standalone + optionally from /expand | Landscape brief + research recommendations |
| `/research` | Step 2 (domain research) + before any phase using unfamiliar tech | Domain brief + auto-loading reference skill |
| `/deep-research` | Step 2 alternative for complex topics — parallel-agent campaign. Also callable from `/research`, `/ideate`, `/brief`, `/expand`. Use `--continue-from` for chain mode (extending a leaf of a prior campaign). | N cross-referenced briefs + parent synthesis + quality report |
| `/research-program` | Step 2 alternative for megatopic-scale initiatives spanning multiple domains (3+ campaigns). Escalation target from `/deep-research` when seed is truly megatopic. Also callable from `/ideate`, `/brief`, `/expand`. | Program directory (program plan + super-parent + N campaigns + program evaluation) |
| `/architecture` | Step 3 (after north star + domain briefs) | Architecture doc: modules, data flow, conventions |
| `/epicize` | Step 4 (after architecture) | Phased roadmap with blocking briefs, I/O/Tests |
| `/brief` | Step 5 (per phase, when blocking brief listed) | Curated domain brief optimized for the builder |
| `/update-epicize` | After building phases, when scope or blockers have shifted | Revised roadmap reflecting what was learned |
| `/design` | Step 6 (per phase) | Design doc: interfaces, types, file paths, acceptance criteria |
| `/implement` | Step 7 (per phase, <20 files) | Code + tests |
| `/implement-orchestrator` | Step 7 (per phase, 20+ files) | Code + tests (parallel agents) |
| `/update-documentation` | Step 9 (after each phase) | Updated docs synced to code |
| `/quality-checkpoint` | Quality checkpoint (every 2-4 phases) | Orchestrator — runs the four below on a shared scope and produces a consolidated summary |
| `/doc-review` | Quality checkpoint + after major design changes | Doc consistency report |
| `/refactor-design` | Quality checkpoint (every 2-4 phases) | Refactor plan |
| `/extract-patterns` | Quality checkpoint | Pattern documentation |
| `/test-quality` | Quality checkpoint | Spec-driven tests |
| `/security-review` | Pre-deploy | Scored security report |
| `/cruft-cleaner` | As needed | Cleanup report + fixes |
| `/bold-refactor` | As needed | Architectural simplification plan |
| `/feature` | As needed | Feature brief for quick extensions outside roadmap |
| `/expand` | As needed | Scope expansion doc for subsystems |
| `/repo-eval` | As needed | Multi-dimensional codebase scoring |
| `/e2e-test-design` | As needed | End-to-end test suite design |
| `/release` | As needed | Changelog + release notes |
