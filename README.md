# nklisch/skills

A catalog of plugins and reference skills for AI coding agents — **Claude
Code**, **OpenAI Codex**, and **Pi**. The plugins cover requirements-first
delivery, grounded research, UI mockups, code audits, prose craftsmanship, and
cross-agent coordination.

The centerpiece is **Workbench**. You describe an outcome in plain language;
the agent learns the repository, asks you for the decisions that belong to
you, and drives the agreed scope to a verified finish. Decisions, evidence,
and delivery state live in the repository, not in the chat that produced them.

## Install

You need Claude Code with Task/Agent tool support, the OpenAI Codex CLI, or
Pi. To adopt Workbench in a project, that project must be a Git repository.

Pick your harness below. Install Workbench first, then add any standalone
plugins you want.

### Claude Code

```bash
/plugin marketplace add nklisch/skills

/plugin install workbench@nklisch-skills          # the centerpiece
/plugin install ux-ui-design@nklisch-skills       # mockup-first UI design
/plugin install code-audit@nklisch-skills         # markdown code audits
/plugin install nates-toolkit@nklisch-skills      # utility skills
/plugin install agentic-research@nklisch-skills   # grounded research discipline
/plugin install agent-coordination@nklisch-skills # cross-agent ledger
/plugin install prose-craft@nklisch-skills        # prose drafting and review
```

### OpenAI Codex

```bash
codex plugin marketplace add https://github.com/nklisch/skills

codex plugin install workbench
codex plugin install ux-ui-design
codex plugin install code-audit
codex plugin install nates-toolkit
codex plugin install agentic-research
codex plugin install agent-coordination
codex plugin install prose-craft
```

### Pi

Pi installs go through [`pi-plugins`](https://github.com/nklisch/pi-extensions),
the plugin marketplace and lifecycle manager. This repo no longer publishes
npm packages — `pi-plugins` does.

```bash
pi install npm:@nklisch/pi-plugins
```

Then, inside Pi:

```text
/plugins marketplace add nklisch/skills
/plugins add workbench@nklisch-skills --scope user
/plugins add ux-ui-design@nklisch-skills --scope user
/plugins add code-audit@nklisch-skills --scope user
/plugins add nates-toolkit@nklisch-skills --scope user
/plugins add agentic-research@nklisch-skills --scope user
/plugins add agent-coordination@nklisch-skills --scope user
/plugins add prose-craft@nklisch-skills --scope user
```

Use `--scope project` instead of `--scope user` to enable a plugin for one
repository only.

The Pi-native tool packages publish to npm from the
[pi-extensions](https://github.com/nklisch/pi-extensions) repository:

```bash
pi install npm:@nklisch/pi-background-tasks   # background jobs and monitors
pi install npm:@nklisch/pi-zai-research       # Z.ai research tools
```

**peeragent** (cross-harness peer delegation for implementation, research, and
review) is an external companion. Install it through the bridge or from
[its own repository](https://github.com/nklisch/peeragent):

```text
/plugins add peeragent@nklisch-skills --scope user
```

```bash
pi install git:github.com/nklisch/peeragent@v0.6.0
```

## Start using Workbench

After installing, ask your agent:

> Set up Workbench in this repository.

Workbench `setup` asks how you want agents to collaborate, review, verify, and
close completed work, then writes a small `.work/` ledger into the repository.
From there, direct the agent in ordinary language: "Implement this feature,"
"Drive the onboarding epic to done," or "Research the prior art for this
decision."

The [Workbench guide](docs/workbench-guide.md) walks through adopting a
repo and driving work; the [plugin README](plugins/workbench/README.md)
covers the mental model — autonomy settings, review weights, design lenses,
and the research discipline.

## Choose one `.work/` owner

Workbench and agile-workflow both own a `.work/` directory, and they are
mutually exclusive within one project. Pick one:

| Pick | Best fit | Status |
|---|---|---|
| **Workbench** | Requirements-first delivery through ordinary conversation, with a compact ledger and integrated research. Consolidates older workflows — including an existing agile-workflow substrate — through `setup`. | Active development. Recommended for new projects. |
| **agile-workflow** | Projects that already rely on its explicit stage-and-gate pipeline and autopilot queue runner. | Supported in maintenance mode: bug fixes and compatibility work, no new feature development. |

> **Deprecated:** the older `workflow` plugin (doc-driven, `docs/designs/`) is
> unmaintained. Existing installs keep working. Migrate to agile-workflow with
> `/agile-workflow:convert`, or consolidate onto Workbench with
> `/workbench:setup`. The old guide remains at
> [docs/workflow-guide.md](docs/workflow-guide.md) for reference.

## The plugins

| Plugin | What it does | More |
|---|---|---|
| **workbench** | Requirements-first delivery. Plain-language outcomes drive design, weighted review, and externally grounded research tracked in `.work/` and `.research/`. | [Guide](docs/workbench-guide.md) · [README](plugins/workbench/README.md) |
| **ux-ui-design** | Mockup-first UI design. Throwaway single-file HTML mockups in `.mockups/` to align on direction before production code. | [docs/ux-ui-design-guide.md](docs/ux-ui-design-guide.md) |
| **code-audit** | Markdown-first audits with no workflow dependency: deep code, bug, security, and test scans; perf scouting; repo scorecards. | [plugins/code-audit/README.md](plugins/code-audit/README.md) |
| **nates-toolkit** | Project-agnostic utilities — plain-language re-explanation, agent self-reflection, skill authoring and auditing. | [plugins/nates-toolkit/README.md](plugins/nates-toolkit/README.md) |
| **agentic-research** | Grounded, verifiable research discipline with attestations and citation gates. Stands alone or pairs with a work tracker. | [plugins/agentic-research/README.md](plugins/agentic-research/README.md) |
| **agent-coordination** | Sparse cross-agent coordination ledger for shared repositories, backed by GitHub Discussions. | [plugins/agent-coordination/README.md](plugins/agent-coordination/README.md) |
| **prose-craft** | Prose craftsmanship for human-facing docs: style-contract drafting, six-lens review, multi-model refine cycle. | [plugins/prose-craft/README.md](plugins/prose-craft/README.md) |
| **agile-workflow** | Structured stage-and-gate work tracking with a goal-backed autopilot queue. **Supported in maintenance mode** — see above. | [docs/agile-workflow-guide.md](docs/agile-workflow-guide.md) |

## Reference skills

Beyond the plugins, `.agents/skills/` carries a curated library of reference
skills that auto-load when their library or topic appears in the work — Bun,
Zod v4, Biome v2, Drizzle, Hono, the TanStack family, Zustand, citty,
@clack/prompts, smol-toml, schemars, and others. A few standalone utilities
(`clean-memory`, `design-pages`) and ecosystem research notes round it out.

## Repository layout

```
plugins/<name>/          # one directory per plugin, each with shared skills/
                         # plus Claude and Codex channel metadata
.agents/skills/          # standalone reference-skill library (non-plugin)
.claude-plugin/          # Claude Code marketplace catalog
.agents/plugins/         # Codex marketplace catalog
scripts/bump-version.sh  # per-plugin version gate across all channel metadata
docs/                    # repo-level vision, spec, architecture, and guides
```

Every supported plugin ships the same `skills/` directory to all three
harnesses and keeps its Claude and Codex manifests in version lockstep; the
Pi bridge consumes the same catalogs.
The distribution rules live in [docs/SPEC.md](docs/SPEC.md); the layout and
wiring live in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md); the purpose and
dogfooding thesis live in [docs/VISION.md](docs/VISION.md).
