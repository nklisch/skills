# nklisch/skills

A software development workflow suite for Claude Code — from ideation through implementation, refactoring, testing, and release.

Available as a **Claude Code plugin** and via **[skilltap](https://github.com/nklisch/skilltap)**.

## Install

### As a Plugin (Claude Code)

```bash
# Step 1: Add the marketplace
/plugin marketplace add nklisch/skills

# Step 2: Install plugins
/plugin install workflow@nklisch-skills          # doc-driven workflow
/plugin install agile-workflow@nklisch-skills    # substrate-driven workflow (sibling)
/plugin install skill-authoring@nklisch-skills
```

Three plugins available:
- **workflow** — 24 skills for the full development pipeline (design, implement, refactor, fix, review, test, ship). Doc-driven: design docs as artifacts, roadmap-shaped phase plans.
- **agile-workflow** — 25 skills for substrate-driven work tracking. Items as files in `.work/`, late-binding releases, gates that produce items, autopilot queue runner. Sibling to `workflow`. See [docs/agile-workflow-guide.md](docs/agile-workflow-guide.md).
- **skill-authoring** — 3 skills for creating, evaluating, and refining agent skills

### Choosing between workflow and agile-workflow

| Pick `workflow` if... | Pick `agile-workflow` if... |
|---|---|
| Design docs as artifacts (`docs/designs/<name>.md`) fit your habits | You'd rather design live inside the work item itself |
| Roadmap-shaped phase plans match your project | You want late-binding releases (no upfront commitment to which features ship) |
| You're comfortable re-feeding context to fresh sessions | You want sessions to pick up active work from `.work/` automatically (via SessionStart queue snapshot hook) |
| You ship by tagging or merging on a fixed cadence | You want gates (security, tests, cruft, docs, patterns) that produce items to fix rather than pass/fail reports |

Both plugins share the same code-design principles (Ports & Adapters, SSOT, Generated Contracts, Fail Fast) and the rolling-foundation discipline for `docs/`. Pick one per project; both stay supported.

### Via Skilltap

```bash
# Add this tap
skilltap tap add nklisch https://github.com/nklisch/skills

# Install individual skills
skilltap install design
skilltap install implement
skilltap install research
```

## Workflow Skills

These skills form an iterative pipeline. See [docs/workflow-guide.md](docs/workflow-guide.md) for the full usage guide.

### Pipeline

```
ideate → roadmap                    ← project start
    ↓
autopilot                           ← autonomous end-to-end execution
    ── OR ── manual workflow:
    ↓
design → implement/implement-orchestrator ← core phases (from roadmap)
    ↓
refactor-design → implement → extract-patterns  ← every 2-4 phases
    ↓
bold-refactor / perf-design → implement         ← targeted improvements
    ↓
extend                              ← scope additions (small or large)
    ↓
refactor-conventions-creator        ← once after 3-5 phases
    ↓
security-review → design → implement           ← security audit pass
    ↓
fix                                 ← bugs found along the way
    ↓
review                              ← peer-review changes before shipping
    ↓
release                              ← ship it
```

| Skill | What it does |
|-------|-------------|
| **ideate** | Interactive project definition workshop. Produces foundation docs (VISION.md, SPEC.md, ARCHITECTURE.md). Includes anti-vision, competitive landscape, and maximalist-vs-minimalist contrast to attack the idea. Run once at project start. |
| **roadmap** | Generate an agent-optimized project roadmap from foundation docs. Decomposes into phases with dependencies and test checkpoints. |
| **autopilot** | Autonomously execute an entire roadmap end-to-end. Loops design → implement-orchestrator → test per phase with refactoring passes. Tracks progress for cross-session resume. |
| **extend** | Add capability to an existing project. Branches on scope: small additions produce a feature brief; major expansions update foundation docs and roadmap. |
| **design** | Produce detailed implementation units with exact interfaces, types, and acceptance criteria. Considers 2-3 architectural options, designs the trickiest unit first, includes a pre-mortem. |
| **implement** | Write code from a design or plan. Single Sonnet agent. Best for <20 files. Moves the design doc to `docs/designs/completed/` after success. |
| **implement-orchestrator** | Opus orchestrator that spawns Sonnet agents. For 20+ files or independent subsystems. Moves the design doc to `docs/designs/completed/` after success. |
| **research** | Investigate libraries, APIs, and SDKs. Produces a research doc and an auto-loading reference skill. |
| **refactor-design** | Find duplication, missing abstractions, code smells, and dead weight. Produces a refactor plan that implement executes. |
| **bold-refactor** | Find beautiful code abstractions and cross-cutting simplifications using conceptual lenses (elimination, unification, inversion, etc.). Produces an implement-ready design. |
| **extract-patterns** | Document reusable code patterns for consistency across future work. |
| **refactor-conventions-creator** | Interview-based. Generates a project-specific refactor-conventions skill that scans for both stylistic and structural issues. |
| **perf-design** | Profile performance bottlenecks and design optimized solutions. Follows a strict optimization hierarchy. |
| **security-review** | Comprehensive security audit. Discovers stack, user selects focus domains, produces scored report with severity-classified findings. |
| **cruft-cleaner** | Sweep for AI-accumulated cruft (dead code, stale comments, defensive bloat). Triages by confidence, parallel cleanup. |
| **test-quality** | Spec-driven test gap analysis. Derives tests from contracts, not code. Reworks tautological tests (rewrites or deletes). Writes new tests. |
| **e2e-test-design** | Design golden-path and adversarial e2e test suites. Output uses the implementation-units format so /implement can execute it directly. |
| **fix** | Diagnose and repair a specific bug. Reproduces, bisects, writes a failing test, applies the minimal fix, confirms. |
| **review** | Review a code change — branch diff, commit, range, working tree, unpushed commits, or PR. Produces Blocker / Important / Nit findings. |
| **repo-eval** | Multi-dimensional codebase evaluation. Launches parallel explore agents, cross-checks claims, produces a calibrated 1-10 scorecard with prioritized recommendations. |
| **tool-evaluator** | Self-evaluate agent tool usage in the current conversation. Produces a report with recommendations for tool authors. |
| **update-documentation** | Align all docs to code after changes. Includes a doc-organization audit that moves misplaced files into the canonical `docs/` structure. |
| **release** | Draft changelog, confirm with user, run the project's release mechanism. |

## Agile-Workflow Skills

These skills operate over a markdown-based work-tracking substrate (`.work/`)
that lives in the repo. See [docs/agile-workflow-guide.md](docs/agile-workflow-guide.md)
for the full usage guide.

### Pipeline

```
ideate → convert → epicize          ← project bootstrap (greenfield)
    └── OR convert (alone)          ← migrate existing repo
    ↓
park / scope / fix                  ← capture & promotion (model-invocable)
    ↓
design / refactor-design /          ← design family (tag-routed)
perf-design                         ←   tags: [refactor] / [perf] route to specialists
    ↓
implement / implement-orchestrator  ← production
    ↓
review                              ← peer review at stage:review
    ↓
release-deploy                      ← bind, gate (security → tests → cruft → docs → patterns), ship
    ↓
autopilot <epic>                    ← queue runner over the whole substrate
                                      OR --all for everything in active
```

### Bootstrap (user-invocable)

| Skill | What it does |
|-------|-------------|
| **ideate** | Foundation-docs workshop. Produces VISION.md, SPEC.md, ARCHITECTURE.md that encode rolling-foundation from day one. |
| **convert** | Bootstrap the `.work/` substrate. Detects project shape (workflow-plugin / ad-hoc / no-tracking / greenfield), seeds initial items, writes `.claude/rules/agile-workflow.md`, runs the conventions interview, copies `work-view`, appends a CLAUDE.md section, produces MIGRATION_REPORT.md. Idempotent via `--update`. |
| **epicize** | Decompose foundation docs into multiple epics in `.work/active/epics/` with declared `depends_on` chains. |

### Capture & promotion (model-invocable — agent picks naturally)

| Skill | What it does |
|-------|-------------|
| **park** | Quick capture into `.work/backlog/`. Triggers on "park this", "add to backlog". |
| **scope** | Promote backlog item or fresh request into `.work/active/` as epic/feature/story. For large scope, rolls foundation docs forward in the same stride. Cycle-prevention via `work-view --blocking`. |
| **fix** | Single-stride bug repair. Reproduces, identifies root cause, writes failing test, applies minimal fix, lands story at stage:review. |

### Design family (model-invocable, tag-routed)

| Skill | Triggered by | What it produces |
|-------|---|---|
| **design** | feature at stage:drafting, no specialized tag | Greenfield design — written INTO feature body, child stories spawned with depends_on, advances stage to implementing |
| **refactor-design** | feature with tags:[refactor] | Code-smell scan, before/after step shape, risk + rollback per step |
| **perf-design** | feature with tags:[perf] | Bottleneck identification, optimization hierarchy (algorithmic > I/O > idioms > parallelism), benchmark scaffolds |

### Production + review (model-invocable)

| Skill | What it does |
|-------|-------------|
| **implement** | Read item body (design is in there), write code, run build+tests, advance stage implementing → review. Single-stride sequential. |
| **implement-orchestrator** | For features with > 3 child stories: walk depends_on graph, spawn parallel Sonnet agents capped at 3 per wave. |
| **review** | Structured peer review with five lenses including foundation-doc alignment. Triages findings into items so they don't disappear into prose. |

### Release & autonomous (mostly user-invocable)

| Skill | What it does |
|-------|-------------|
| **release-deploy** | Bind items to a version, run all configured gates in CONVENTIONS.md order, wait for readiness, ship per release mapping (tag-based / branch-held / release-branch), archive items via git mv. Idempotent. |
| **autopilot** | Queue runner. Picks next ready item respecting depends_on (topological sort with FIFO tie-break), invokes the right skill, advances stage, repeats. Watchdog `/loop` tasks survive compaction. Epic-scoped default; `--all` drains everything. |
| **bold-refactor** | Architectural reconception via conceptual lenses. Produces a refactor EPIC with child features tagged [refactor]. User-invocable only — too aggressive for auto-trigger. |

### Gates (model-invocable; produce items, NOT pass/fail reports)

All five fire during release-deploy's quality-gate stage in the order configured in CONVENTIONS.md (default: security → tests → cruft → docs → patterns).

| Skill | Items produced |
|-------|---|
| **gate-security** | Security findings with `gate_origin: security`, `tags: [security]` |
| **gate-tests** | Coverage gaps + tautological-test reworks with `gate_origin: tests` |
| **gate-cruft** | Dead code / cruft cleanup items with `gate_origin: cruft` |
| **gate-docs** | Foundation-doc drift items (enforces rolling-foundation) with `gate_origin: docs` |
| **gate-patterns** | Reusable patterns extracted to `.claude/skills/patterns/` |

### Reference (carried from workflow)

| Skill | What it does |
|-------|-------------|
| **principles** | Code-design (Ports & Adapters, SSOT, Generated Contracts, Fail Fast) + substrate-execution (Item-IS-the-Work, Rolling-Foundation, Late-Binding) principles. Auto-loads. |
| **research, repo-eval, tool-evaluator, refactor-conventions-creator** | Carried from `workflow`, unchanged behavior — they don't need substrate adaptation. |

### Skill Authoring

| Skill | What it does |
|-------|-------------|
| **write-tool-skill** | Create distributable reference skills for your project's tool, CLI, MCP server, or library — for others to install. |
| **skill-idea-refiner** | Refine a rough skill idea into a well-designed skill. Guides through ideation, scoping, and scaffolding. |
| **skill-evaluator** | Evaluate skills against type-specific quality rubrics. Produces scored reports with improvements. |
| **tool-evaluator** | Self-evaluate agent tool usage in the current conversation. Produces a report with recommendations for tool authors. |

### Principles (auto-load)

| Skill | What it enforces |
|-------|-----------------|
| **principles** | Ports & Adapters, Single Source of Truth, Generated Contracts, Fail Fast — with per-phase guidance for design time and implementation time. Plus **Rolling-Foundation** (foundation docs in `docs/` describe vision and current intent — what is true now or will be true once in-flight design lands — never history; they roll forward in place). Auto-loads when /design, /implement, /extend, or /update-documentation is active. |

## Library & Tool References

Reference skills that auto-load when their library is detected. Installed individually via skilltap.

| Skill | Library |
|-------|---------|
| **bun** | Bun runtime — Bun.$, Bun.file, bun:test |
| **zod-v4** | Zod v4 — schemas, safeParse, transforms |
| **biome-v2** | Biome v2 — linter/formatter config |
| **drizzle-v0** | Drizzle ORM v0.45+ PostgreSQL |
| **hono-v4** | Hono v4 — routes, middleware, SSE |
| **tanstack-query-v5** | TanStack Query v5 (React Query) |
| **tanstack-router-v1** | TanStack Router v1 — file-based routing |
| **tanstack-table-v8** | TanStack Table v8 — headless tables |
| **zustand-v5** | Zustand v5 — state management |
| **citty** | citty CLI framework (UnJS) |
| **clack-prompts** | @clack/prompts — terminal UI |
| **smol-toml** | smol-toml — TOML parser/serializer |
| **claude-cli-sdk** | @nklisch/claude-cli-sdk |
| **schemars** | schemars 1.x — Rust JSON Schema generation |

## Other Skills

| Skill | What it does |
|-------|-------------|
| **design-pages** | Design GitHub Pages for a project |
| **clean-memory** | Audit and refine MEMORY.md |

## Canonical layout (in projects using these skills)

### Projects on `workflow`

```
docs/
├── VISION.md, SPEC.md, ARCHITECTURE.md, ROADMAP.md, etc.   ← foundation docs (from ideate, roadmap, extend)
├── PROGRESS.md                                              ← autopilot state
├── designs/                                                 ← active design docs
│   ├── {name}.md                                            ← from /design
│   ├── refactor-{name}.md                                   ← from /refactor-design
│   ├── perf-{name}.md                                       ← from /perf-design
│   ├── bold-{name}.md                                       ← from /bold-refactor
│   ├── e2e-{name}.md                                        ← from /e2e-test-design
│   └── completed/                                           ← moved here by /implement after success
└── features/                                                ← briefs from /extend (small mode)
```

`/update-documentation` includes a Phase 6 audit that detects misplaced docs and offers to
`git mv` them into the canonical layout.

### Projects on `agile-workflow`

```
.work/
├── active/{epics,features,stories}/  ← in-flight items (markdown + frontmatter)
├── backlog/                           ← parked ideas, unscoped
├── releases/<version>/                ← shipped bundles
├── archive/                           ← done items not bound to a release
├── bin/work-view                      ← query script (copied by /agile-workflow:convert)
└── CONVENTIONS.md                     ← project-specific overrides
.claude/rules/agile-workflow.md        ← navigation rules (auto-loads on .work/** and docs/**)
docs/                                  ← foundation docs (VISION, SPEC, ARCHITECTURE) — roll forward in place
```

Items are markdown files with structured frontmatter (`id, kind, stage, tags, parent, depends_on, release_binding, gate_origin, created, updated`). Design lives inside the item's body — there are no parallel design docs. See [docs/agile-workflow-guide.md](docs/agile-workflow-guide.md).

Skills only deviate from these defaults if your project clearly has a different convention already in place.

## Repo Structure (this repo)

```
plugins/workflow/                  # workflow plugin (24 skills, doc-driven)
├── skills/                        #   skill source
└── docs/                          #   plugin foundation docs (some)
plugins/agile-workflow/            # agile-workflow plugin (25 skills, substrate-driven)
├── skills/                        #   skill source
├── docs/                          #   foundation docs (VISION, SPEC, ARCHITECTURE, PRINCIPLES, MIGRATION)
├── hooks/                         #   SessionStart + PostToolUse hook scripts
├── scripts/work-view.sh           #   substrate query CLI (copied by /convert into target repos)
└── .claude-plugin/plugin.json
plugins/skill-authoring/skills/    # skill-authoring plugin skills
.agents/skills/                    # reference, principle, and utility skills (skilltap)
.claude-plugin/                    # Claude Code plugin manifest (root)
docs/                              # human-facing guides — workflow-guide.md, agile-workflow-guide.md
tap.json                           # skilltap registry
```

## Requirements

- Claude Code with Task/Agent tool support
- Git repository
