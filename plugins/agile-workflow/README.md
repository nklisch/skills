# agile-workflow

A substrate-driven work-tracking plugin for Claude Code (and Codex) — items as files in `.work/` with YAML frontmatter, late-binding releases, gates that produce items, and a goal-backed autopilot queue runner designed to tee up autonomous agent runs that actually ship the right thing.

> **Note:** This plugin includes one extension from skills-v2: **`gate-infra`** adds release-time infrastructure-safety auditing (Terraform state divergence, secrets, CI-only enforcement). See the gates section below.

## Install

```bash
# Step 1: Add the skills-v2 marketplace
/plugin marketplace add andrewclark88/skills-v2

# Step 2: Install agile-workflow
/plugin install agile-workflow@andrewclark88-skills-v2
```

If you want only Nathan's upstream version (without the skills-v2 extensions), install from his marketplace instead:

```bash
/plugin marketplace add nklisch/skills
/plugin install agile-workflow@nklisch-skills
```

## Foundation docs

- **[docs/VISION.md](./docs/VISION.md)** — what this is and why it exists
- **[docs/SPEC.md](./docs/SPEC.md)** — frontmatter contract, file layouts, hook contracts, work-view flag set
- **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)** — substrate layout, item lifecycle, autopilot algorithm, gate orchestration, full skill catalog
- **[docs/PRINCIPLES.md](./docs/PRINCIPLES.md)** — code-design + substrate-execution principles
- **[docs/MIGRATION.md](./docs/MIGRATION.md)** — `convert`'s behavior across project shapes

## Pipeline

```
ideate → convert → epicize           ← project bootstrap (greenfield)
    ↓
park / scope / fix                   ← capture & promotion (agent picks)
    ↓
epic-design --only-questions --all   ← align on big choices (also runs UI mocks)
feature-design --only-questions --all   ← drill in per feature
    ↓
Goal: Use agile-workflow autopilot to drain --all
    ↓
release-deploy <version>             ← bind, gate, ship
```

The two `--only-questions` passes are the killer move — front-load every directional choice and mock so autopilot runs without guessing.

### Always-do step: `epic-design --only-questions` before autopilot

The single highest-leverage habit in the agile-workflow loop: run `/agile-workflow:epic-design --only-questions --all` (or per-epic with an `<epic-id>`) **before** any autopilot goal or direct invocation. It surfaces 2–5 directional product/architecture/scope questions per drafting epic, captures your answers under `## Design decisions` in each epic body, and does NOT decompose or advance stage. Autopilot then inherits those answers — no autonomous judgment on directional choices, and one human checkpoint instead of N pauses scattered through the run.

## Bootstrap (user-invocable)

| Skill | What it does |
|-------|-------------|
| **ideate** | Foundation-docs workshop. Produces VISION.md, SPEC.md, ARCHITECTURE.md that encode rolling-foundation from day one. |
| **convert** | Bootstrap the `.work/` substrate. Detects project shape (legacy workflow-plugin / ad-hoc / no-tracking / greenfield), seeds initial items, writes the canonical AGENTS.md section, keeps CLAUDE.md as a symlink/shim for compatibility, runs the conventions interview, copies `work-view`, produces MIGRATION_REPORT.md. Idempotent via `--update`. |
| **epicize** | Decompose foundation docs into multiple epics in `.work/active/epics/` with declared `depends_on` chains. |

## Capture & promotion (agent picks naturally)

| Skill | What it does |
|-------|-------------|
| **park** | Quick capture into `.work/backlog/`. Triggers on "park this", "add to backlog". |
| **scope** | Promote backlog item or fresh request into `.work/active/` as epic/feature/story. For large scope, rolls foundation docs forward in the same stride. **Batch mode** (no arg, `--all`, or NL filter) clusters the whole backlog by code seam and capability arc, proposes a structure, confirms once with the user, then writes everything. |
| **fix** | Single-stride bug repair. Reproduces, identifies root cause, writes failing test, applies minimal fix, lands story at stage:review. |

## Design family (agent picks; kind- and tag-routed)

| Skill | Triggered by | What it produces |
|-------|---|---|
| **epic-design** | epic at stage:drafting | Decomposes the epic into child features at stage:drafting with declared depends_on chains, written INTO the epic body; advances epic to implementing. Primary tier for `ux-ui-design` mocks. |
| **feature-design** | feature at stage:drafting, no specialized tag | Greenfield design — written INTO feature body, child stories spawned with depends_on, advances stage to implementing. Fallback tier for mocks. |
| **refactor-design** | feature with tags:[refactor], OR discovery (no arg / path / NL scope) | Per-feature: code-smell scan, before/after step shape, risk + rollback per step. Discovery: scans target scope, classifies findings as pure-refactor or behavior-changing, emits items. |
| **perf-design** | feature with tags:[perf], OR discovery (no arg / path / NL scope) | Per-feature: bottleneck identification, optimization hierarchy (algorithmic > I/O > idioms > parallelism), benchmark scaffolds. Discovery: picks top 3-5 likely hot paths, profiles them, emits items per bottleneck. |

## Production + review (agent picks)

| Skill | What it does |
|-------|-------------|
| **implement** | Read item body (design is in there), write code, run build+tests, advance stage implementing → review. Single-stride sequential. |
| **implement-orchestrator** | For implementation bands: walk depends_on graph, decide bundles/waves/write-scope isolation, and dispatch implementation sub-agents when parallelism is beneficial. |
| **review** | Structured peer review with five lenses including foundation-doc alignment. Triages findings into items. Accepts `<id>`, `--all` / no arg (drain the review queue), or NL filter. |

## Release & autonomous

| Skill | What it does |
|-------|-------------|
| **release-deploy** | Bind items to a version, run all configured gates in CONVENTIONS.md order, wait for readiness, ship per release mapping, archive items via git mv. Idempotent. |
| **autopilot** | Goal-backed queue runner. Picks next ready item respecting depends_on, invokes the right skill, advances stage, repeats until the goal scope is done or blocked. Invokable from goal text such as "Use agile-workflow autopilot to drain --all"; direct `/agile-workflow:autopilot <scope>` still works. Harness goal/continuation owns persistence, not `/loop`. |
| **bold-refactor** | Architectural reconception via conceptual lenses. Sweeps a target and produces one or more refactor EPICs with child features tagged [refactor]. User-invocable only — too aggressive for auto-trigger. |

## Gates (agent picks; produce items, NOT pass/fail reports)

All gates fire during release-deploy's quality-gate stage in CONVENTIONS.md order (default: security → tests → cruft → docs → patterns → infra).

| Skill | Items produced |
|-------|---|
| **gate-security** | Security findings with `gate_origin: security`, `tags: [security]` |
| **gate-tests** | Coverage gaps + tautological-test reworks with `gate_origin: tests` |
| **gate-cruft** | Dead code / cruft cleanup items with `gate_origin: cruft` |
| **gate-docs** | Foundation-doc drift items (enforces rolling-foundation) with `gate_origin: docs` |
| **gate-patterns** | Reusable patterns extracted to `.agents/skills/patterns/` with optional Claude mirror |
| **gate-infra** | **skills-v2 extension.** Release-time infrastructure-safety audit: Terraform state divergence (no local `terraform apply`), CI-only enforcement in workflow files, environment-gated reviewers on production deploys, JSON service-account keys checked in, secrets in `.tf`/`.env` files, manually-applied migrations. Severity-staged (Critical/High → stage:implementing; Medium → drafting; Low → backlog). |

## Reference

| Skill | What it does |
|-------|-------------|
| **principles** | Code-design (Ports & Adapters, SSOT, Generated Contracts, Fail Fast) + substrate-execution (Item-IS-the-Work, Rolling-Foundation, Late-Binding) principles. Auto-loads. |
| **research** | Investigate libraries, APIs, SDKs. Produces a research doc and auto-loading reference skill. |
| **repo-eval** | Multi-dimensional codebase audit. Files top recommendations as substrate items tagged `[audit]` when a substrate exists. |
| **tool-evaluator** | Self-evaluate agent tool usage in the current conversation. Recommendations for tool authors. |
| **refactor-conventions-creator** | Interview-based. Generates a project-specific refactor-conventions skill. |
| **bug-scan** | Sweep a target scope for likely bugs; emit fix items. |
| **e2e-test-design** | Design golden-path + adversarial E2E test suites. |

## Canonical layout (in projects using this plugin)

```
.work/
├── active/{epics,features,stories}/  ← in-flight items (markdown + frontmatter)
├── backlog/                           ← parked ideas, unscoped
├── releases/<version>/                ← shipped bundles
├── archive/                           ← done items not bound to a release
├── bin/work-view                      ← query script (copied by /agile-workflow:convert)
└── CONVENTIONS.md                     ← project-specific overrides
AGENTS.md                              ← canonical agent instructions
CLAUDE.md -> AGENTS.md                 ← Claude Code compatibility
.mockups/                              ← only if ux-ui-design is also installed
docs/                                  ← foundation docs (VISION, SPEC, ARCHITECTURE) — roll forward in place
```

Items are markdown files with structured frontmatter (`id, kind, stage, tags, parent, depends_on, release_binding, gate_origin, created, updated`). Design lives inside the item's body — there are no parallel design docs. Foundation docs in `docs/` roll forward in place.

## Human-facing tools

- **`/agile-workflow:board`** — render `.work/` as a self-contained HTML kanban board (Backlog → Drafting → In Progress → Review → Done) with a Releases section. Pure bash + a single template, no toolchain. Auto-opens in your default browser. Re-run to refresh. Supports `--print`, `--out <path>`, and `--serve [port]`.

Stages advance as work completes. Releases late-bind.

## Pairing with `ux-ui-design`

When both plugins are installed, mocks land at four tiers (highest tier first wins, downstream inherits):

- **After `ideate`** → `palette` + `components`
- **During `epic-design --only-questions`** → `screens` + `flows` for cross-feature journeys
- **During `feature-design --only-questions`** → more `screens` + `flows` for per-feature surfaces
- **Ad-hoc during design work** → one-off mocks when a particular surface needs exploration

This is the killer pairing: do mocks alongside the `--only-questions` passes so autopilot inherits visual alignment along with directional choices.

## Pairing with `research-pipeline` (skills-v2 only)

When `research-pipeline` is also installed (the default in skills-v2), the design family graduates from foundation-docs-only to research-grounded. The merged skills live in `research-pipeline`:

- `/research-pipeline:ideate` produces 4 foundation docs + research-plan.md + auto-`/scout`, replacing `/agile-workflow:ideate`.
- `/research-pipeline:epicize` decomposes architecture + research briefs into epic items, adapting to whether research exists.
- `/research-pipeline:epic-design` and `/research-pipeline:feature-design` add knowledge-index loading, patterns-skill bridge, system-design moves, and `.research/` orientation on top of Nathan's `--only-questions` procedure.

Use Nathan's `/agile-workflow:*` versions when you don't want the research layer; use `/research-pipeline:*` when you do.

## License

MIT
