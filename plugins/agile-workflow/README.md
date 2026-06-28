# agile-workflow

Markdown-based work-tracking substrate for AI-driven projects. Items are
plain markdown files in `.work/` with structured frontmatter; skills operate
as verbs over those files; cross-session continuity comes from the
substrate, not from re-feeding context.

New projects should use `agile-workflow`. The older [`workflow`](../workflow/)
plugin remains in the repo only so existing installs do not break; migrate old
projects with `/agile-workflow:convert`.

## Foundation docs

- **[docs/VISION.md](./docs/VISION.md)** — what this is and why it exists
- **[docs/SPEC.md](./docs/SPEC.md)** — frontmatter contract, file layouts, hook contracts, work-view flag set
- **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)** — substrate layout, item lifecycle, autopilot algorithm, gate orchestration, full skill catalog
- **[docs/PRINCIPLES.md](./docs/PRINCIPLES.md)** — code-design + substrate-execution principles
- **[docs/MIGRATION.md](./docs/MIGRATION.md)** — `convert`'s behavior across project shapes

## Quick start

### Install

```bash
# Claude Code
/plugin marketplace add nklisch/skills
/plugin install agile-workflow@nklisch-skills

# OpenAI Codex
codex plugin marketplace add https://github.com/nklisch/skills
codex plugin install agile-workflow

# Pi
pi install npm:@nklisch/pi-agile-workflow
# or, from this repository:
pi install -l ./plugins/agile-workflow
```

Pi loads the same shared skills plus a native `/aw` extension command for queue
snapshots (`/aw status`, `/aw ready`) and workflow handoffs (`/aw autopilot`,
`/aw board`). Pi packages can execute extension code, so install from sources you
trust.

Agile-workflow does not ship custom subagent definitions for Pi, Claude Code,
or Codex. Skills that delegate work prompt the host's existing
generic/general-purpose subagent mechanism with a structured, task-specific
brief; see `skills/principles/references/subagents.md` for the shared prompt
postures.

### Bootstrap

```bash
# In a target project:
/agile-workflow:ideate            # produce foundation docs (greenfield)
/agile-workflow:convert           # bootstrap .work/ substrate
/agile-workflow:epicize           # decompose foundation docs into epics

# Before kicking off autopilot — align on strategic questions across every
# drafting epic. Recommended in nearly every run; see ARCHITECTURE.md
# "Pre-flight: align on strategic questions first".
/agile-workflow:epic-design --only-questions --all

# Then drain the queue with a harness goal
Goal: Use agile-workflow autopilot to drain --all

# ... or work normally; agent picks operational skills as conversation flows
```

### Always-do step: `epic-design --only-questions` before autopilot

The single highest-leverage habit in the agile-workflow loop: run
`/agile-workflow:epic-design --only-questions --all` (or per-epic with an
`<epic-id>`) **before** any autopilot goal or direct invocation. It surfaces 2–5
directional product/architecture/scope questions per drafting epic, captures
your answers under `## Design decisions` in each epic body, and does NOT
decompose or advance stage. Autopilot then inherits those answers — no
autonomous judgment on directional choices, and one human checkpoint
instead of N pauses scattered through the run.

## Substrate at a glance

```
.work/
├── active/{epics,features,stories}/  in-flight, scoped
├── backlog/                          parked, unscoped
├── releases/<version>/               shipped bundles
├── archive/                          done items not bound to a release
├── bin/work-view                     navigation CLI
└── CONVENTIONS.md                    project-specific overrides
```

## Human-facing tools

- **`$agile-workflow:board` / `work-view board`** — serve `.work/` as a live
  localhost board backed by the same substrate query model as the CLI. It binds
  to `127.0.0.1`, scans upward when the requested port is busy, opens a browser
  after binding when a desktop session is available, and prints the URL in
  headless sessions. Supports `--port <n>`, `--no-open`, and `--print`.

Every item is a markdown file with structured frontmatter
(`id, kind, stage, tags, parent, depends_on, release_binding, gate_origin, research_refs, research_origin, created, updated`).
Stages advance as work completes. Foundation docs in `docs/` roll forward.
Releases late-bind.

## License

MIT
