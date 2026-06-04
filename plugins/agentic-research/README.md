# Agentic Research Discipline

Grounded, verifiable AI research as an installable plugin. The Agentic Research
Discipline (ARD) adds a non-erodable anti-fabrication floor, a per-engagement
control-space of selectable verification gates, and a `.research/` substrate tier
— attestations, precis, and analytical syntheses — that parallels
`agile-workflow`'s operational `.work/` tier. Citations use the `[handle]{N}`
convention backed by per-source attestations, enforced by a citation-chain lint.

Adopts **ARD v0.4.1** (pinned in [`ard.json`](ard.json) — the single source of truth
for the ARD version + vendored-surface map; the plugin's own semver is decoupled).
Upstream framework by Kevoun: <https://code.s-nc.org/Kevoun/ARD>.

> **Adoption status (experimental).** Landed: the `.research/` substrate tier and its
> conventions, the vendored citation lint + conformance set, the artifact templates, and
> the foundation docs in [`docs/`](docs/) ([ADOPTION](docs/ADOPTION.md) ·
> [VERSIONING](docs/VERSIONING.md) · [ARCHITECTURE](docs/ARCHITECTURE.md)), the two
> engagement skills (`research-orchestrator`, `research-discipline`), and the research↔work
> pairing contract ([HANDOFF](docs/HANDOFF.md)). Pending: the `research-view` query binary,
> and the *live* research↔work handoff (designed in HANDOFF.md; implementation is a follow-on epic).

## Skills

- **`research-orchestrator`** — the user-invocable engagement entry point. Reads the
  engagement dials (`scope_authority`, `verification_rigor`), sets them with you at kickoff,
  discovers fan-out topology from the seed, and walks the ARD decision-graph at the dialed
  verification depth — from a one-agent inline brief to an N-specialist campaign. Dispatches
  the verification roles (specialist, adversarial-reader, evaluator) inline.
- **`research-discipline`** — the auto-loaded anti-fabrication bundle (ARD `kernel/discipline.md`
  vendored verbatim). The orchestrator inlines it into every authoring dispatch so the
  discipline reaches sub-contexts (ARD SPEC §5).

See [docs/ADOPTION.md](docs/ADOPTION.md) for how the engagement engine maps onto the ARD SPEC.

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
