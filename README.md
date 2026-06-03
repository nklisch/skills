# nklisch/skills

A software development workflow suite for Claude Code, OpenAI Codex, and Pi —
work tracking, UI/UX design, and standalone utility skills, designed to tee up
autonomous agent runs that actually ship the right thing.

Available as **Claude Code plugins**, **Codex plugins**, and **Pi packages**.

## Install

All supported plugins ship through three channels. The shared `skills/`
directory is the portable surface; each harness adds only its native metadata or
ergonomics.

### Claude Code

```bash
/plugin marketplace add nklisch/skills
/plugin install agile-workflow@nklisch-skills    # work tracking + autopilot
/plugin install ux-ui-design@nklisch-skills      # mockup-first UI design
/plugin install nates-toolkit@nklisch-skills     # standalone utility skills
```

### OpenAI Codex

```bash
codex plugin marketplace add https://github.com/nklisch/skills
codex plugin install agile-workflow
codex plugin install ux-ui-design
codex plugin install nates-toolkit
```

### Pi

```bash
# Install all supported Pi packages from the Git repo root
pi install git:github.com/nklisch/skills

# Or install individual published packages
pi install npm:@nklisch/pi-agile-workflow
pi install npm:@nklisch/pi-ux-ui-design
pi install npm:@nklisch/pi-nates-toolkit

# Local checkout/development installs
pi install -l .
pi install -l ./plugins/agile-workflow
pi install -l ./plugins/ux-ui-design
pi install -l ./plugins/nates-toolkit
```

Pi packages can load executable extensions in addition to shared skills. The root
Git install loads all supported plugins; the deprecated `workflow` plugin is not
included. Install from trusted sources; `agile-workflow` includes a Pi-native
`/aw` command for queue inspection and workflow handoffs.

## The three supported plugins

| Plugin | What it does | Guide |
|---|---|---|
| **agile-workflow** | Substrate-driven work tracking. Items as files in `.work/` with YAML frontmatter, late-binding releases, gates that produce items, goal-backed autopilot queue runner. | [docs/agile-workflow-guide.md](docs/agile-workflow-guide.md) |
| **ux-ui-design** | HTML/CSS/JS mockup-first UI design. Throwaway single-file mockups in `.mockups/` for alignment before any production code. Loosely integrated with agile-workflow. | [docs/ux-ui-design-guide.md](docs/ux-ui-design-guide.md) |
| **nates-toolkit** | Standalone utility skills, no workflow lock-in — explain in plain language, score a codebase, reflect on tool & skill usage, author and audit skills. |  |

The two big ones — `agile-workflow` + `ux-ui-design` — are designed to work
together. The killer workflow is to use `ux-ui-design` mocks during
`agile-workflow`'s pre-autopilot `--only-questions` passes, so autopilot
inherits both directional and visual alignment before any code lands. See
the agile-workflow guide for the full rhythm.

> **Deprecated:** the `workflow` plugin (doc-driven, `docs/designs/`-as-artifacts)
> is **deprecated and no longer supported.** Existing projects on it still
> work, but no new features or fixes will land. New projects should use
> `agile-workflow`. To migrate an existing `workflow` project, run
> `/agile-workflow:convert` — it detects the legacy layout and migrates
> automatically. The old guide at [docs/workflow-guide.md](docs/workflow-guide.md)
> remains for reference.

## agile-workflow

Twenty-six skills for tracking and shipping work via a markdown substrate in
`.work/`. See [docs/agile-workflow-guide.md](docs/agile-workflow-guide.md)
for the full guide.

### Pipeline

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

The two `--only-questions` passes are the killer move — front-load every
directional choice and mock so autopilot runs without guessing.

### Bootstrap (user-invocable)

| Skill | What it does |
|-------|-------------|
| **ideate** | Foundation-docs workshop. Produces VISION.md, SPEC.md, ARCHITECTURE.md that encode rolling-foundation from day one. |
| **convert** | Bootstrap the `.work/` substrate. Detects project shape (legacy workflow-plugin / ad-hoc / no-tracking / greenfield), seeds initial items, writes the canonical AGENTS.md section, keeps CLAUDE.md as a symlink/shim for compatibility, runs the conventions interview, copies `work-view`, produces MIGRATION_REPORT.md. Idempotent via `--update`. |
| **epicize** | Decompose foundation docs into multiple epics in `.work/active/epics/` with declared `depends_on` chains. |

### Capture & promotion (agent picks naturally)

| Skill | What it does |
|-------|-------------|
| **park** | Quick capture into `.work/backlog/`. Triggers on "park this", "add to backlog". |
| **scope** | Promote backlog item or fresh request into `.work/active/` as epic/feature/story. For large scope, rolls foundation docs forward in the same stride. **Batch mode** (no arg, `--all`, or NL filter) clusters the whole backlog by code seam and capability arc, proposes a structure, confirms once with the user, then writes everything. |
| **fix** | Single-stride bug repair. Reproduces, identifies root cause, writes failing test, applies minimal fix, lands story at stage:review. |

### Design family (agent picks; kind- and tag-routed)

| Skill | Triggered by | What it produces |
|-------|---|---|
| **epic-design** | epic at stage:drafting | Decomposes the epic into child features at stage:drafting with declared depends_on chains, written INTO the epic body; advances epic to implementing. Primary tier for `ux-ui-design` mocks. |
| **feature-design** | feature at stage:drafting, no specialized tag | Greenfield design — written INTO feature body, child stories spawned with depends_on, advances stage to implementing. Fallback tier for mocks. |
| **refactor-design** | feature with tags:[refactor], OR discovery (no arg / path / NL scope) | Per-feature: code-smell scan, before/after step shape, risk + rollback per step. Discovery: scans target scope, classifies findings as pure-refactor or behavior-changing, emits items. |
| **perf-design** | feature with tags:[perf], OR discovery (no arg / path / NL scope) | Per-feature: bottleneck identification, optimization hierarchy (algorithmic > I/O > idioms > parallelism), benchmark scaffolds. Discovery: picks top 3-5 likely hot paths, profiles them, emits items per bottleneck. |

### Production + review (agent picks)

| Skill | What it does |
|-------|-------------|
| **implement** | Read item body (design is in there), write code, run build+tests, advance stage implementing → review. Single-stride sequential. |
| **implement-orchestrator** | For implementation bands: walk depends_on graph, decide bundles/waves/write-scope isolation, and dispatch implementation sub-agents when parallelism is beneficial. |
| **review** | Granularity-gated. A **story** fast-advances on the build+tests `implement` already ran — no lens pass, no peer (a second same-context review there rarely finds anything). A **feature/epic** gets a deep lens review run in a **fresh context**: cross-model via `peeragent:peer-review` when a different model class is reachable, otherwise a fresh top-class sub-agent (an Opus host spawns a *new* Opus for fresh perspective). Triages findings into items. Accepts `<id>`, `--all` / no arg (drain the review queue), or NL filter. |

### Release & autonomous

| Skill | What it does |
|-------|-------------|
| **release-deploy** | Bind items to a version, run all configured gates in CONVENTIONS.md order, wait for readiness, ship per release mapping, archive items via git mv. Idempotent. |
| **autopilot** | Goal-backed queue runner. Picks next ready item respecting depends_on, invokes the right skill, advances stage, repeats until the goal scope is done or blocked — then runs a final cross-model peer-review pass over the whole completion bundle before reporting complete. Invokable from goal text such as "Use agile-workflow autopilot to drain --all"; direct `/agile-workflow:autopilot <scope>` still works. Harness goal/continuation owns persistence, not `/loop`. |
| **bold-refactor** | Architectural reconception via conceptual lenses. Sweeps a target and produces one or more refactor EPICs with child features tagged [refactor]. User-invocable only — too aggressive for auto-trigger. |

### Gates (agent picks; produce items, NOT pass/fail reports)

All five fire during release-deploy's quality-gate stage in CONVENTIONS.md
order (default: security → tests → cruft → docs → patterns).

| Skill | Items produced |
|-------|---|
| **gate-security** | Security findings with `gate_origin: security`, `tags: [security]` |
| **gate-tests** | Coverage gaps + tautological-test reworks with `gate_origin: tests` |
| **gate-cruft** | Dead code / cruft cleanup items with `gate_origin: cruft` |
| **gate-docs** | Foundation-doc drift items (enforces rolling-foundation) with `gate_origin: docs` |
| **gate-patterns** | Reusable patterns extracted to `.agents/skills/patterns/` with optional Claude mirror |

### Reference

| Skill | What it does |
|-------|-------------|
| **principles** | Code-design (Ports & Adapters, SSOT, Generated Contracts, Fail Fast) + substrate-execution (Item-IS-the-Work, Rolling-Foundation, Late-Binding) principles. Auto-loads. |
| **research** | Investigate libraries, APIs, SDKs. Produces a research doc and auto-loading reference skill. |
| **refactor-conventions-creator** | Interview-based. Generates a project-specific refactor-conventions skill. |

## ux-ui-design

Seven skills for mockup-first UI/UX design. Throwaway single-file HTML
mockups in `.mockups/` for alignment before any production code. See
[docs/ux-ui-design-guide.md](docs/ux-ui-design-guide.md) for the full guide.

| Skill | What it does |
|-------|-------------|
| **palette** | Color + typography options as HTML previews. Locks the choice into `tokens.css`. |
| **components** | Showcase page of every button/input/card/modal in every state, plus a reusable `components.css`. |
| **motion** | Named easing-curve vocabulary, durations, springs, designed pauses — playable in browser, plus reusable `motion.css`. |
| **screens** | N (default 4) distinct HTML mockups for a single screen, plus a 2x2 comparison grid. |
| **flows** | Multi-page user flow with prev/next or hub-and-spoke chrome, plus index navigator. |
| **adopt** | Scans an existing codebase, inventories every UI surface, audits for inconsistencies, mirrors current UI into mocks OR reimagines them. |
| **ux-ui-principles** | Reference: storage layout, decision matrix, tech rule. Adds convention to project CLAUDE.md on first run. Auto-loads. |

### Plugged into agile-workflow

When both plugins are installed, mocks land at four tiers (highest tier
first wins, downstream inherits):

- **After `ideate`** → `palette` + `components`
- **During `epic-design --only-questions`** → `screens` + `flows` for cross-feature journeys
- **During `feature-design --only-questions`** → more `screens` + `flows` for per-feature surfaces
- **Ad-hoc during design work** → one-off mocks when a particular surface needs exploration

This is the killer pairing: do mocks alongside the `--only-questions`
passes so autopilot inherits visual alignment along with directional
choices.

## Nate's Toolkit

Standalone, project-agnostic utility skills with no workflow lock-in. Install
via `/plugin install nates-toolkit@nklisch-skills`.

| Skill | What it does |
|-------|-------------|
| **plainspeak** | Re-render the last thing said in vivid plain language — one everyday metaphor, one concrete example, a crisp restatement, at a chosen depth. Manual only (`/plainspeak`). |
| **repo-eval** | Multi-dimensional codebase audit — calibrated 1–10 scorecard with prioritized recommendations. Files findings as substrate items when an agile-workflow `.work/` exists. |
| **agent-reflection** | Reflect on how the agent's own tools and skills served it this session — confusion, inefficiency, friction, context cost. Prioritized recommendations for tool and skill authors. |
| **write-tool-skill** | Create distributable reference skills for a tool, CLI, MCP server, or library. |
| **skill-auditor** | Static quality audit of a skill against type-specific, triggering, and emotional-tone rubrics. Scored report with fixes and a trigger-test plan. |

## Library & Tool References

Reference skills that auto-load when their library is detected.

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

```
.work/
├── active/{epics,features,stories}/  ← in-flight items (markdown + frontmatter)
├── backlog/                           ← parked ideas, unscoped
├── releases/<version>/                ← shipped bundles
├── archive/                           ← done items not bound to a release
├── bin/work-view                      ← query script (copied by /agile-workflow:convert)
└── CONVENTIONS.md                     ← project-specific overrides
AGENTS.md                              ← canonical agent instructions (slim: orientation + pointers + read-directive)
CLAUDE.md -> AGENTS.md                 ← Claude Code compatibility
.agents/
├── rules/*.md                         ← force-loaded agent rules (agile-workflow.md + patterns.md digest + user rules; hook-injected)
└── skills/patterns/                   ← detailed reusable code patterns (gate-patterns source of truth)
.mockups/
├── design-system/                     ← palette, typography, components, motion + tokens.css/components.css/motion.css
├── screens/<feature>/                 ← N option HTMLs + index.html
└── flows/<flow-name>/                 ← numbered sequence + index.html
docs/                                  ← foundation docs (VISION, SPEC, ARCHITECTURE) — roll forward in place
```

Items are markdown files with structured frontmatter (`id, kind, stage,
tags, parent, depends_on, release_binding, gate_origin, created, updated`).
Design lives inside the item's body — there are no parallel design docs.
Mockups land in `.mockups/` and link back via a `## Mockups` section in
the item body. See the guides for the full conventions.

## Repo Structure (this repo)

```
plugins/agile-workflow/            # agile-workflow plugin (substrate-driven)
├── skills/                        #   skill source
├── docs/                          #   foundation docs (VISION, SPEC, ARCHITECTURE, PRINCIPLES, MIGRATION)
├── hooks/                         #   SessionStart/UserPromptSubmit/PostCompact + PostToolUse hook scripts
├── scripts/work-view.sh           #   substrate query CLI (copied by /convert into target repos)
└── .claude-plugin/plugin.json
plugins/ux-ui-design/              # ux-ui-design plugin (7 skills, mockup-first)
├── skills/                        #   skill source
└── docs/                          #   plugin design docs
plugins/nates-toolkit/skills/      # standalone utility skills (plainspeak, repo-eval, agent-reflection, write-tool-skill, skill-auditor)
plugins/workflow/                  # DEPRECATED — doc-driven, no longer supported
.agents/skills/                    # reference, principle, and utility skills
.claude-plugin/                    # Claude Code plugin manifest (root)
docs/                              # human-facing guides — agile-workflow-guide.md, ux-ui-design-guide.md, workflow-guide.md (deprecated)
```

## Requirements

- Claude Code with Task/Agent tool support (or Codex CLI)
- Git repository
