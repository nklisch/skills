# Vision

**A curated workshop for agent tooling — skills and plugins that make AI coding
agents more capable, proven by running the workshop on its own output.**

## Why this exists

AI coding agents are only as good as the context and tooling they are handed.
Left generic, they re-derive the same workflows, re-learn the same library
APIs, and re-invent the same project scaffolding on every task. This repo
closes that gap: it packages durable agent capability — requirements-first
delivery, grounded research, UI mockup generation, markdown code audits,
coordination protocols, library references, skill-authoring tooling — as
installable skills and plugins, authored to a bar a thoughtful peer would
defend.

The audience is people building with Claude Code, OpenAI Codex, and Pi who
want their agents to arrive already knowing how to work.

## What this is

A single git tree that authors and distributes agent skills and plugins
through two native marketplaces — **Claude Code** and **OpenAI Codex** — with
**Pi** installing the same catalog through the pi-plugins bridge. Skills follow
the open Agent Skills standard so the durable procedural knowledge crosses
harnesses unchanged; each harness can add native ergonomics around that shared
core. Pi-native runtime packages live in the separate `nklisch/pi-extensions`
repo.

The catalog centers on **workbench**: requirements-first delivery and adaptive
opportunity scanning driven by ordinary conversation, with optional
project-defined release gates and grounded research as an integrated evidence
layer.
Around it sit standalone plugins — `ux-ui-design` (mockup-first UI design),
`code-audit` (markdown audits), `nates-toolkit` (utilities),
`agentic-research` (research discipline), `agent-coordination` (cross-agent
ledger), `prose-craft` (prose craftsmanship), `sol-calibration` (agent
working-posture calibration), and `declaudify` (a Claude
Code-only writing-posture hook) — a curated library of reference skills, and
federated external plugins.

**agile-workflow**, the catalog's structured stage-and-gate work tracker,
remains supported in maintenance mode: it receives bug fixes and
compatibility work, and its existing projects keep working, but new feature
development happens in workbench instead.

## The dogfooding thesis

This repo runs on the plugins it ships. Its own work is tracked in
Workbench's `.work/` substrate — the same files and flow any adopter gets —
and its grounded evidence lives in Workbench's `.research/` tier. If the
catalog's own workflow tooling cannot carry the weight of building the
catalog, that is a signal worth catching before an adopter hits it.

## What this is not

- **Not a product or application.** The deliverables are skills and plugins,
  not a running service.
- **Not a monolith.** The plugins version independently; skill names overlap
  across them by design, and the plugin a skill lives in sets its meaning.
- **Not a roadmap repository.** Foundation docs describe current truth or
  intended future state, never past state. Time-bound commitments live as
  items in `.work/`, never as doc prose.

## What success looks like

- **Channel parity where promised** — every cross-channel supported plugin
  installs and behaves in Claude Code, Codex, and Pi (through the bridge), with
  harness-native ergonomics where each environment supports them. Host-specific
  plugins such as `declaudify` are clearly labeled, omitted from unsupported
  native catalogs, and not claimed as supported by the bridge.
- **Skills that trigger on intent** — they fire when they should and stay
  silent when they should not.
- **A trustworthy ledger** — `.work/` is the single source of truth for this
  repo's work, and an agent reading it can answer "what can I do next?"
  correctly at any point, not just one.
- **Lockstep metadata** — a cross-channel plugin's Claude manifest and Codex
  manifest never disagree about what it is.

## Where the details live

This is the meta layer; it stays thin and defers. Each plugin carries its own
foundation docs — read those for purpose and internals:

- **workbench** (centerpiece) — `plugins/workbench/docs/{VISION,SPEC}.md`
- **agile-workflow** (maintenance mode) —
  `plugins/agile-workflow/docs/{VISION,SPEC,ARCHITECTURE,PRINCIPLES}.md`
- **Other plugins** — see each plugin directory, README, and manifests.

Repo-level structure and distribution mechanics live in
`docs/ARCHITECTURE.md`; distribution constraints and versioning rules live in
`docs/SPEC.md`.
