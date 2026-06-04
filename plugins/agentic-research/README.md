# Agentic Research Discipline

Grounded, verifiable AI research as an installable plugin. The Agentic Research
Discipline (ARD) adds a non-erodable anti-fabrication floor, a per-engagement
control-space of selectable verification gates, and a `.research/` substrate tier
— attestations, precis, and analytical syntheses — that parallels
`agile-workflow`'s operational `.work/` tier. Citations use the `[handle]{N}`
convention backed by per-source attestations, enforced by a citation-chain lint.

Adopts **ARD v0.3.0** (pinned in [`ard.json`](ard.json) — the single source of truth
for the ARD version + vendored-surface map; the plugin's own semver is decoupled).
Upstream framework by Kevoun: <https://code.s-nc.org/Kevoun/ARD>.

> **Adoption status (experimental).** Landed: the `.research/` substrate tier and its
> conventions, the vendored citation lint + conformance set, the artifact templates, and
> the foundation docs in [`docs/`](docs/) ([ADOPTION](docs/ADOPTION.md) ·
> [VERSIONING](docs/VERSIONING.md) · [ARCHITECTURE](docs/ARCHITECTURE.md)). Pending: the
> skills + Claude agents (engagement-engine), the `research-view` query binary, and the
> designed research→work handoff.

## Skills

_None yet — see scaffold status above. The `research-orchestrator` (engagement
entry point) and `research-discipline` (anti-fabrication bundle) skills land with
the engagement-engine feature._

## Installation

### Claude Code

```bash
/plugin marketplace add nklisch/skills
/plugin install agentic-research@nklisch-skills
```

### OpenAI Codex

```bash
codex plugin marketplace add https://github.com/nklisch/skills
codex plugin install agentic-research
```

### Pi

```bash
pi install npm:@nklisch/pi-agentic-research

# Local checkout/development install
pi install -l ./plugins/agentic-research
```

All three channels load the same shared `skills/` directory.
