# Agile-Workflow Guide

How to use the `agile-workflow` plugin to track and ship software work using a
markdown-based substrate that lives in your repo.

This guide is for humans reading about agile-workflow for the first time, or
returning users who want a refresher on the day-to-day flow. For deep specs
see `plugins/agile-workflow/docs/{VISION,SPEC,ARCHITECTURE,PRINCIPLES,MIGRATION}.md`.

## What this is

`agile-workflow` is a sibling plugin to `workflow`. Both ship from this repo;
both stay supported. Pick one per project.

| Use `workflow` when... | Use `agile-workflow` when... |
|---|---|
| You like design docs as artifacts (`docs/designs/<name>.md`) | You want design to live inside the work item itself |
| Roadmap-shaped phase plans fit your project | You want late-binding releases (no upfront commitment to which features ship in v0.1) |
| You're comfortable re-feeding context to fresh sessions | You want a session to pick up active work from `.work/` automatically |
| You ship versioned releases by tagging or merging on a fixed cadence | You want gates (security, tests, cruft, docs, patterns) that produce items to fix, not pass/fail reports |

The two plugins do not share skills or state. A project picks one and sticks
with it.

## The substrate at a glance

When you bootstrap agile-workflow in a project (`/agile-workflow:convert`),
this layout appears in the repo:

```
.work/
├── active/
│   ├── epics/<id>.md         multi-feature arcs in flight
│   ├── features/<id>.md      design + implementation units
│   └── stories/<id>.md       single-session work units
├── backlog/<id>.md           parked ideas, unscoped
├── releases/<version>/       shipped bundles
├── archive/<id>.md           done items not bound to a release
├── bin/work-view             query script
└── CONVENTIONS.md            project-specific overrides
.claude/rules/agile-workflow.md   agent navigation rules (auto-loads)
docs/                              foundation docs (VISION, SPEC, ARCHITECTURE)
```

Every item is a markdown file with structured frontmatter:

```yaml
---
id: feature-csv-export
kind: feature
stage: implementing
tags: [content]
parent: epic-export-pipeline
depends_on: [feature-data-schema]
release_binding: null
gate_origin: null
created: 2026-05-09
updated: 2026-05-10
---

# CSV Export

## Brief
<what this is, why it exists>

## Design
<written by /agile-workflow:feature-design — not a separate doc>

## Implementation notes
<accumulated by /agile-workflow:implement as work progresses>
```

The body is the work. Brief → design → implementation notes → review findings
all live in the same file as stages advance. There is no parallel design doc.

## Quick start (5-minute version)

```bash
# Step 1: install the plugin
/plugin install agile-workflow@nklisch-skills

# Step 2: in your target project, set up foundation docs (greenfield only)
/agile-workflow:ideate

# Step 3: bootstrap the substrate
/agile-workflow:convert

# Step 4: decompose foundation docs into epics
/agile-workflow:epicize

# From here, just talk to the agent. It picks the right skill from context:
"park the idea of CSV export"           → /agile-workflow:park
"scope this as a feature"                → /agile-workflow:scope
"design feature-csv-export"              → /agile-workflow:feature-design
"decompose epic-billing"                 → /agile-workflow:epic-design
"implement story-csv-export-validation"  → /agile-workflow:implement
"review feature-csv-export"              → /agile-workflow:review
"fix the typo in README.md"              → /agile-workflow:fix

# When you're ready to ship:
/agile-workflow:release-deploy v0.1.0
```

## The daily flow

A typical session in a project that's already bootstrapped:

### Session start

Open Claude Code in the project. The `SessionStart` hook fires
`session-start-snapshot.sh`, which prints a queue snapshot:

```
## Substrate snapshot

### Awaiting your review (stage: review)
- feature-uploads-retry  [content]

### Ready to work (--ready)
1. story-rate-limits      parent=feature-uploads-retry depends_on=[]
2. feature-quota-tracking parent=epic-rate-limits

### Blocked (depends_on unmet)
- story-quota-display  blocked by feature-uploads-retry

### Backlog (top 5 by created)
- idea-archive-format     2026-04-22
- idea-quotas-dashboard   2026-04-21
```

You see immediately what's ready, what's waiting on you, and what's backlogged.
No re-feed needed.

### Work the queue

Tell the agent what you want to do, or let it pick. Common moves:

- **Park an idea mid-conversation** — "park the idea of an admin dashboard for
  later." The `park` skill writes a flat backlog file and gets out of your way.
- **Scope a backlog item to active** — "let's scope idea-csv-export as a
  feature." `scope` decides epic/feature/story sizing, declares dependencies,
  and (for large scope) rolls foundation docs forward in place.
- **Decompose an epic** — "decompose epic-billing." `epic-design` reads the
  epic body and foundation docs, identifies feature-level capability arcs,
  and spawns child feature files at `stage: drafting` with declared
  `depends_on`. Autopilot routes here automatically when an epic is at
  `drafting`.
- **Design a feature** — "design feature-csv-export." The right skill in the
  design family fires based on tags: `feature-design` for greenfield,
  `refactor-design` for `[refactor]`-tagged, `perf-design` for `[perf]`-tagged.
  The design lands inside the feature item's body.
- **Implement** — "implement story-csv-validate." The `implement` skill reads
  the design from the item body, writes code, runs tests, advances stage to
  `review`. For features with > 3 child stories that have a non-trivial
  dependency graph, use `implement-orchestrator` to fan out parallel agents.
- **Review** — "review feature-csv-export." Structured peer review with five
  lenses (correctness, tests, design, security, breaking changes,
  foundation-doc alignment). Findings get triaged into items so they don't
  evaporate into prose.
- **Fix a quick bug** — "fix the typo in README.md" or "fix the off-by-one in
  pagination." `fix` is single-stride: reproduces, finds root cause, writes a
  failing test, applies the minimal fix, lands the story at `stage: review`.

### Stage transitions are commits

Every stage advance is a commit. `git log .work/active/features/<id>.md`
shows the full history of an item — when it was scoped, when its design was
written, when it advanced to implementing, when it was reviewed.

### The work-view CLI

Inside any substrate-bootstrapped project, `.work/bin/work-view --help` is
your friend:

```bash
.work/bin/work-view --stage review            # items waiting on you
.work/bin/work-view --ready                   # items ready to work (deps satisfied)
.work/bin/work-view --blocked                 # items waiting on dependencies
.work/bin/work-view --tag security            # items tagged security
.work/bin/work-view --parent epic-uploads     # children of an epic
.work/bin/work-view --release v0.1.0          # items bound to a release
.work/bin/work-view --blocking story-foo      # items that depend on story-foo
```

Filters compose with AND semantics. Add `--paths`, `--cat`, or `--count` to
change output shape.

## Larger flows

### Driving an epic to done

Epics are multi-feature arcs. Drain one autonomously:

```bash
/agile-workflow:autopilot epic-rate-limits
```

Autopilot:
1. Builds the candidate queue from items under `epic-rate-limits` (transitive
   via `parent` chain)
2. Filters to items that are `ready` (all `depends_on` at `stage: done`)
3. Sorts by least-blocked first, FIFO tie-break
4. Picks the first item, invokes the right skill (design family for drafting,
   implement family for implementing), advances stage, repeats
5. Hands items at `stage: review` back to you (auto-advance is your
   responsibility)
6. Schedules watchdog `/loop` tasks (30m nudge + 3h re-engagement) so the run
   survives compaction

Stop conditions: empty queue, user halt, blocker, context approaching
compaction. All clean stops; autopilot is idempotent — `/agile-workflow:autopilot
--resume` picks up where it left off.

For a full project drain (all of `.work/active/`), use `--all`. That mode
also triggers an incremental refactor pass every 5 items completed.

### Cutting a release

Releases are late-bound. Items don't have a `release_binding` until you
explicitly cut a version:

```bash
/agile-workflow:release-deploy v0.1.0
```

The release flow:
1. **Bind** — interactive prompt: which `done` items go in this release? You
   pick; their `release_binding` gets set.
2. **Run gates** — `release-deploy` invokes the gates in `CONVENTIONS.md` order
   (default: security → tests → cruft → docs → patterns). Each gate scans the
   bound bundle and **produces items as findings** (not pass/fail reports).
3. **Wait for readiness** — release ships when every item with
   `release_binding: v0.1.0` (the original bound items + the gate-produced
   ones) is at `stage: done`. If items remain, `release-deploy` halts with the
   pending list. Drive them to done; re-run.
4. **Ship** — per the project's release mapping (tag-based / branch-held /
   release-branch — chosen at convert time).
5. **Archive** — bound items move via `git mv` from `.work/active/` to
   `.work/releases/v0.1.0/`. The release file flips to `stage: released`.

`release-deploy` is idempotent. Re-run safely after fixing gate findings.

### Major architectural reconceptions

For bold architectural reshapes (not routine refactoring), use `bold-refactor`:

```bash
/agile-workflow:bold-refactor "extract auth into a port"
```

This uses conceptual lenses (elimination, unification, inversion, etc.) to
surface beautiful abstractions. It's user-invocable only — too aggressive for
the agent to auto-trigger. Output is a refactor **epic** with child features
tagged `[refactor]`, ready for `refactor-design` to plan each piece.

## Foundation docs roll forward

The plugin enforces the **rolling-foundation principle**: foundation docs in
`docs/` (VISION.md, SPEC.md, ARCHITECTURE.md) describe the project's vision
and current intent — what is true now, OR what will be true once in-flight
design lands. They roll forward in place. Never carry "previously" /
"in v1.x" / migration prose. Git is the audit trail; the doc carries the
present.

Two timing styles for SPEC and ARCHITECTURE — both legitimate:

- **Code-first (default for routine features):** docs update at implementation
  merge.
- **Design-first (for large scope, initial ideation):** docs preflight-update
  at scope time, leading the code through the implementation window. The
  `scope` skill operates this way for large scope; `ideate` operates this way
  at bootstrap.

The forbidden patterns are identical in both styles: replace stale assertions
in place, never accumulate historical prose. The `gate-docs` skill at
release-deploy time is the backstop — it catches drift between intent and
reality regardless of style.

VISION.md is always future-looking. It rolls forward as the project's
direction evolves.

## Migrating from the workflow plugin

If you've been using the `workflow` plugin and want to switch:

```bash
/agile-workflow:convert
```

`convert` detects the workflow-plugin layout (it sees `docs/designs/`,
`docs/ROADMAP.md`, `docs/PROGRESS.md`) and offers a structured migration:

- **Phase decomposition** — `docs/ROADMAP.md` phases become epics in
  `.work/active/epics/` with declared dependency chains
- **Active designs** — each `docs/designs/<name>.md` becomes a feature in
  `.work/active/features/` at `stage: implementing`, with the design content
  copied into the feature item's body
- **Completed designs** — by default synthesized into a retro-release at
  `.work/releases/v0/`. Opt out to archive directly.
- **Foundation docs preserved** — `docs/VISION.md`, `docs/SPEC.md`,
  `docs/ARCHITECTURE.md` stay where they are
- **Source files left alone** — `docs/designs/`, `docs/ROADMAP.md`,
  `docs/PROGRESS.md` stay in place as legacy history. Delete after verifying
  the migration via `MIGRATION_REPORT.md`.

The full migration matrix (with paths, ad-hoc, and greenfield variants) is in
`plugins/agile-workflow/docs/MIGRATION.md`.

## Skill catalog

Twenty-six skills across seven tiers:

### Bootstrap (user-invocable)
- **ideate** — foundation-docs workshop
- **convert** — substrate bootstrap; idempotent via `--update`
- **epicize** — decompose foundation docs into epics with `depends_on` chains

### Capture & promotion (model-invocable, agent picks naturally)
- **park** — quick capture into `.work/backlog/`
- **scope** — promote to active; rolls foundation docs forward when large
- **fix** — single-stride bug repair

### Design family (model-invocable, kind- and tag-routed)
- **epic-design** — decompose an epic at `stage: drafting` into child features
- **feature-design** — greenfield feature design (no specialized tag)
- **refactor-design** — for features tagged `[refactor]`
- **perf-design** — for features tagged `[perf]`

### Production (model-invocable)
- **implement** — single-stride code from item body
- **implement-orchestrator** — fans Sonnet sub-agents over child stories
  respecting `depends_on`

### Review & delivery (mixed)
- **review** *(model-invocable)* — peer review at `stage: review`
- **release-deploy** *(user-invocable)* — bind, gate, ship
- **autopilot** *(user-invocable)* — autonomous queue runner
- **bold-refactor** *(user-invocable)* — architectural reconception

### Gates (model-invocable; produce items, not pass/fail)
- **gate-security**, **gate-tests**, **gate-cruft**, **gate-docs**,
  **gate-patterns**

### Reference (carried from workflow)
- **principles** — code-design + substrate-execution principles
- **research**, **repo-eval**, **tool-evaluator**,
  **refactor-conventions-creator** — auto-loading or one-shot helpers

## Tips and tricks

- **The item file IS the work.** Resist the urge to write `docs/designs/<x>.md`
  — design lives in the item's body. A future session reading the file gets
  the full story (brief → design → implementation notes → review findings).
- **Stage transitions are commits.** Each stage advance is its own commit so
  `git log` an item file becomes the audit trail.
- **`work-view` early and often.** The script is fast even on large
  substrates. `--ready` gives you the autopilot queue without invoking
  autopilot.
- **Don't pre-decompose.** Epicize at bootstrap; let features and stories
  emerge from `scope`, `epic-design`, and `feature-design` as work surfaces.
  The substrate rewards late-binding.
- **Hooks fire only with substrate.** Both hooks (`SessionStart` queue
  snapshot, `PostToolUse` `updated:` auto-bump) check for `.work/CONVENTIONS.md`
  and exit silently in non-substrate repos. They're inert by default.
- **Restart Claude Code after install.** Hooks don't take effect mid-session.
  After `skilltap install nklisch/agile-workflow`, restart for `SessionStart`
  and `PostToolUse` hooks to fire.
- **The principles skill auto-loads** during design, implement, review, and
  any time foundation docs are touched. The substrate-execution principles
  (Item-IS-the-Work, Rolling-Foundation, Late-Binding) operate alongside the
  code-design principles (Ports & Adapters, SSOT, Generated Contracts, Fail
  Fast).
- **`gate-docs` is your safety net for rolling-foundation.** Even if you forget
  to roll a doc forward when shipping a feature, gate-docs catches drift at
  release-deploy time and produces an item to fix.

## Where to read more

- `plugins/agile-workflow/docs/VISION.md` — what this is and why it exists (2-min read)
- `plugins/agile-workflow/docs/SPEC.md` — frontmatter contract, file layouts, hook contracts, work-view flag set
- `plugins/agile-workflow/docs/ARCHITECTURE.md` — substrate layout, item lifecycle, autopilot algorithm, gate orchestration, full skill catalog
- `plugins/agile-workflow/docs/PRINCIPLES.md` — code-design + substrate-execution principles, deeply explained
- `plugins/agile-workflow/docs/MIGRATION.md` — `convert`'s behavior across the four project shapes
