# Workbench

A requirements-first software delivery plugin for Claude Code, OpenAI Codex,
and Pi. Workbench keeps a lightweight `.work/` ledger while leaving research,
UI exploration, design, implementation, review, scans, orchestration, and commit
boundaries to informed agent judgment.

## Skills

| Skill | Purpose |
|---|---|
| `setup` | Create or adopt the Workbench substrate and managed project instructions. |
| `work` | Scope, clarify, research, mock, design, implement, review, scan, or autonomously finish requested work. |
| `park` | Capture useful context for later without derailing current work. |
| `release` | Collapse completed archive stubs into one release summary. |

## Core behavior

- Foundation documents contain current or intended future high-level truth, not
  code-level implementation detail.
- Grounded evidence lives in `.research/`, interactive requirements walkthroughs
  live in `.mockups/`, and work items reference both.
- UI directions are described through their felt qualities and concrete visual
  decisions, not named style catalogs or examples to imitate.
- Mockups become a working end-to-end walkthrough and receive browser/vision
  refinement before user review when those tools are available.
- Completed items immediately archive as stubs for summarized releases, or are
  removed in projects with no release lifecycle.
- Substantial design checks elimination, project principles, existing pattern
  fit, emerging recurrence, and cohesive adjacent refactoring.
- Pattern harvesting updates `.agents/skills/patterns/` at signal-rich feature,
  autonomous-scope, and release boundaries rather than through fixed gates.
- Commits follow coherent delivery boundaries rather than every workflow event.
- Projects may optionally override six shorthand preferences in
  `.work/CONVENTIONS.md`: interaction, rigor, review, capability, execution, and
  commits. Explicit user direction overrides them for one request without
  mutating the project defaults.

Workbench and `agile-workflow` intentionally use different `.work/` schemas and
must not be installed into the same project substrate.

## Installation

```bash
# Claude Code
/plugin marketplace add nklisch/skills
/plugin install workbench@nklisch-skills

# OpenAI Codex
codex plugin marketplace add https://github.com/nklisch/skills
codex plugin install workbench

# Pi
pi install npm:@nklisch/pi-workbench
# local development
pi install -l ./plugins/workbench
```

Start with `/workbench:setup`, then work naturally: “scope this,” “mock the full
journey,” “implement this feature,” “scan authentication,” or “finish the active
CLI work.”
