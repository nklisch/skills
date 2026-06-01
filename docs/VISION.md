# Vision

**A curated workshop for agent tooling — skills and plugins that make AI coding
agents more capable, proven by running the workshop on its own output.**

## Why this exists

AI coding agents are only as good as the context and tooling they are handed.
Left generic, they re-derive the same workflows, re-learn the same library APIs,
and re-invent the same project scaffolding on every task. This repo closes that
gap: it packages durable agent capability — work tracking, design workflows, UI
mockup generation, library references, skill-authoring tooling — as installable
skills and plugins, authored to a bar a thoughtful peer would defend.

The audience is people building with Claude Code, OpenAI Codex, and Pi who want
their agents to arrive already knowing how to work.

## What this is

A single git tree that authors and distributes agent skills, plugins, and
packages through three equal channels: the **Claude Code marketplace**, the
**OpenAI Codex marketplace**, and **Pi packages**. Every supported plugin ships
to all three. Skills follow the open Agent Skills standard so the durable
procedural knowledge crosses harnesses unchanged; each harness can add native
ergonomics around that shared core.

The catalog is anchored by a flagship — **agile-workflow** — a substrate where a
project's work lives as markdown files with structured frontmatter, and the
agent drains them. Around it sit `ux-ui-design` (mockup-first UI design),
`nates-toolkit` (standalone utilities), a curated library of reference skills,
and federated external plugins.

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

- **Channel parity** — every supported plugin installs and behaves in Claude
  Code, Codex, and Pi, with harness-native ergonomics where each environment
  supports them.
- **Skills that trigger on intent** — they fire when they should and stay silent
  when they should not.
- **A trustworthy substrate** — `.work/` is the single source of truth for this
  repo's work, and the agent-facing tooling answers "what can I do next?"
  correctly at any stage, not just one.
- **Lockstep metadata** — a plugin's Claude manifest, Codex manifest, and Pi
  package metadata never disagree about what it is.

## Where the details live

This is the meta layer; it stays thin and defers. Each plugin carries its own
foundation docs — read those for purpose and internals:

- **agile-workflow** (flagship) —
  `plugins/agile-workflow/docs/{VISION,SPEC,ARCHITECTURE,PRINCIPLES}.md`
- **Other plugins** — see each plugin directory and its
  `.claude-plugin/plugin.json`.

Repo-level structure and distribution mechanics live in `docs/ARCHITECTURE.md`;
distribution constraints and versioning rules live in `docs/SPEC.md`.
