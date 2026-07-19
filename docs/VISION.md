# Vision

**A curated workshop for agent tooling — skills and plugins that make AI coding
agents more capable, proven by running the workshop on its own output.**

## Why this exists

AI coding agents are only as good as the context and tooling they are handed.
Left generic, they re-derive the same workflows, re-learn the same library APIs,
and re-invent the same project scaffolding on every task. This repo closes that
gap: it packages durable agent capability — work tracking, design workflows, UI
mockup generation, grounded research, markdown code audits, coordination
protocols, library references, skill-authoring tooling — as installable skills
and plugins, authored to a bar a thoughtful peer would defend.

The audience is people building with Claude Code, OpenAI Codex, and Pi who want
their agents to arrive already knowing how to work.

## What this is

A single git tree that authors and distributes agent skills, plugins, and
packages through three channels: the **Claude Code marketplace**, the **OpenAI
Codex marketplace**, and **Pi packages**. Supported cross-channel plugins ship
to all three. Capabilities that exist only in Pi's runtime ship as supported
Pi-only packages by design: `background-tasks` and `pi-sandbox` currently ship
`package.json` only, without Claude Code or Codex plugin manifests. Shared
skills follow the open Agent Skills standard so durable procedural knowledge
crosses applicable harnesses unchanged; each harness can add native ergonomics
around that shared core.

The catalog offers two distinct `.work/` systems: **agile-workflow** provides an
explicit lifecycle and autonomous queue runner, while **workbench** centers
requirements-first, judgment-led delivery with separate `.research/` evidence
and `.mockups/` walkthroughs. Around them sit `ux-ui-design` (standalone
mockup-first UI design),
`code-audit` (standalone markdown audits), `nates-toolkit` (standalone
utilities), `agentic-research` (grounded research discipline),
`agent-coordination` (sparse cross-agent ledger), a curated library of reference
skills, and federated external plugins.

## The dogfooding thesis

This repo runs on the plugin it ships. Its own work is tracked in
agile-workflow's `.work/` substrate — the same files, gates, and flow any
adopter gets. The first thing that substrate tracks is the construction of
agile-workflow's own tooling. If the flagship cannot carry the weight of
building itself, that is a signal worth catching before an adopter hits it.

## What this is not

- **Not a product or application.** The deliverables are skills and plugins, not
  a running service.
- **Not a monolith.** The plugins version independently; skill names overlap
  across them by design, and the plugin a skill lives in sets its meaning.
- **Not a roadmap repository.** Foundation docs describe current truth or
  intended future state, never past state. Time-bound commitments live as items
  in `.work/`, never as doc prose.

## What success looks like

- **Channel parity** — supported cross-channel plugins install and behave in
  Claude Code, Codex, and Pi, with harness-native ergonomics where each
  environment supports them. Supported Pi-only runtime packages intentionally
  target Pi and ship `package.json` only.
- **Skills that trigger on intent** — they fire when they should and stay silent
  when they should not.
- **A trustworthy substrate** — `.work/` is the single source of truth for this
  repo's work, and the agent-facing tooling answers "what can I do next?"
  correctly at any stage, not just one.
- **Lockstep metadata** — every channel metadata file a plugin ships agrees
  about what it is; Pi-only packages are not required to carry inapplicable
  Claude Code or Codex manifests.

## Where the details live

This is the meta layer; it stays thin and defers. Each plugin carries its own
foundation docs — read those for purpose and internals:

- **agile-workflow** (flagship) —
  `plugins/agile-workflow/docs/{VISION,SPEC,ARCHITECTURE,PRINCIPLES}.md`
- **workbench** — `plugins/workbench/docs/{VISION,SPEC}.md`
- **Other plugins** — see each plugin directory and README, plus its
  `.claude-plugin/plugin.json` when it is a cross-channel plugin or its
  `package.json` when it is Pi-only.

Repo-level structure and distribution mechanics live in `docs/ARCHITECTURE.md`;
distribution constraints and versioning rules live in `docs/SPEC.md`.
