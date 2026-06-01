# Vision: agile-workflow

**agile-workflow** is a Claude Code plugin that ships a markdown-based
work-tracking substrate for AI-driven software projects. Work lives as plain
markdown items in a `.work/` directory inside the repo. Each item is a single
file with structured frontmatter — its body accumulates the brief, the design,
the implementation notes, and the review findings as work progresses. Skills
operate as verbs over those files. There are no parallel design docs, no
separate progress trackers, no tracking-board dependencies. The repo is the
system of record.

## Why this exists

AI-driven software projects accumulate document sprawl: design docs that
disagree with the code, progress files that go stale, roadmaps that bind
features to releases the project never ships. The agent re-explains itself
every session because it can't trust what it reads. The user re-feeds context
because the artifacts have drifted from reality.

The substrate pattern collapses this. The item file *is* the work. Stage
advances as work happens. Foundation docs roll forward — they describe the
system as it is now or as it is intended to become, never as it was. Git
carries history; the active truth is what's in the file. An agent picking up a
fresh session reads `.work/active/`, runs the prescribed grep primitives, and
knows what's in flight without being re-fed.

## Substrate philosophy

The plugin enforces three execution principles:

- **The item file is the work.** No parallel design docs. No separate
  progress trackers. The brief, the design, the implementation notes, the
  review findings — all accumulate in the item's body as stages advance.
  Reading the file IS reading the state of work.
- **Foundation docs roll forward.** `docs/VISION.md`, `docs/SPEC.md`,
  `docs/ARCHITECTURE.md` describe current truth or intended future state.
  When implementation changes what those docs assert, the docs update to
  match the new truth. No "previously this worked differently." No legacy
  comments. Git is the audit trail.
- **Late-bind everything.** No upfront roadmap. No pre-populated stages.
  No pre-tagged release bindings. Items advance stages when work actually
  completes. Releases bind items only when the user cuts a version.

The plugin's `principles` skill loads these alongside the code-design
principles (Ports & Adapters, Single Source of Truth, Generated Contracts,
Fail Fast) carried over from `workflow`. The two paradigms — substrate
execution and code design — operate together during agile-workflow work.

## Who this is for

Project owners running AI-driven development who want:

- A work-tracking substrate that lives with the repo, not behind a service
- Cross-session continuity without manually re-feeding context to the agent
- A pattern that scales from solo single-project to long-running
  maintenance loops
- Tooling-portable substrate (git, plain markdown, a small compiled binary
  with a bash fallback — no MCP, no auth, no daemon)

This is a sibling pattern to the existing `workflow` plugin. Both ship from
the same repo. Pick agile-workflow for projects where the substrate's
continuity and item-as-state model fits; pick `workflow` for projects where
doc-as-artifact tracking suits better.

## What success looks like for v0.1.0

agile-workflow ships v0.1.0 complete:

- 25 skills covering ideation, conversion, scoping, design (greenfield +
  refactor + perf), implementation, review, gates, release, and autopilot
- A compiled `work-view` CLI (with a pure-bash fallback) for fast queries by
  stage, tag, kind, parent, release binding, and dependency state
- Shared Codex/Claude command hooks that inject queue/principles context only
  for actionable workflow prompts, auto-bump `updated:`, and surface cheap
  substrate validation issues
- A real project taken end-to-end through ideate → convert → epicize →
  scope → design → implement → review → release-deploy on the substrate

The pattern proves itself when a fresh session in a substrate-bootstrapped
repo picks up active work without re-feed, when an autopilot run drains an
epic to done autonomously across compaction events while respecting the
declared dependency graph, and when foundation docs five features later
still describe the present without legacy comments.

## Relationship to workflow

`agile-workflow` does not replace `workflow`. Both ship from this repo and
stay supported. They distribute the same way (the Claude Code and OpenAI Codex
marketplaces), version independently, and never share skills.

- Choose **`workflow`** when the project wants design docs as artifacts,
  roadmaps with phases, a stable doc-driven cycle, and minimal change to
  existing development habits.
- Choose **`agile-workflow`** when the project wants the item-as-state
  substrate, late-binding releases, gates that produce items, and the
  cross-session continuity that comes from the substrate's discipline.

For depth on the principles, see [PRINCIPLES.md](./PRINCIPLES.md).
For the technical contracts, see [SPEC.md](./SPEC.md).
For the substrate's internal design, see [ARCHITECTURE.md](./ARCHITECTURE.md).
For the on-ramp from existing project shapes, see [MIGRATION.md](./MIGRATION.md).
