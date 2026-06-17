# Agentic Research Discipline

Grounded, verifiable AI research as an installable plugin. The Agentic Research
Discipline (ARD) adds a non-erodable anti-fabrication floor, a per-engagement
control-space of selectable verification gates, and a `.research/` substrate tier
— attestations, precis, and analytical syntheses — that parallels
`agile-workflow`'s operational `.work/` tier. Citations use the `[handle]{N}`
convention backed by per-source attestations, enforced by a citation-chain lint.

Adopts **ARD v0.6.0** (pinned in [`ard.json`](ard.json) — the single source of truth
for the ARD version + vendored-surface map; the plugin's own semver is decoupled).
Upstream framework by Kevoun: <https://code.s-nc.org/Kevoun/ARD>.

> **Adoption status (experimental).** Landed: the `.research/` substrate tier and its
> conventions, the vendored citation lint + conformance set, the artifact templates, and
> the foundation docs in [`docs/`](docs/) ([ADOPTION](docs/ADOPTION.md) ·
> [VERSIONING](docs/VERSIONING.md) · [ARCHITECTURE](docs/ARCHITECTURE.md)), the two
> engagement skills (`research-orchestrator`, `research-discipline`), the `research-view`
> query binary (the prebuilt per-platform dist binaries land via post-merge CI — see
> "Prebuilt binaries and CI" below), and the **live** research↔work handoff — both arrows
> working: the `research_refs`/`research_origin` linkage fields, the `research-handoff`
> emission skill (Arrow 2), and the commissioning convention (Arrow 1), per
> [HANDOFF](docs/HANDOFF.md).

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

## research-view binary

`research-view` is a query tool for the `.research/` substrate. It ships as a
prebuilt static binary for the four supported platforms, with a pure-bash
fallback for everything else.

### Installing research-view

After installing the plugin, run the installer from the repo root:

```bash
PLUGIN_ROOT=./plugins/agentic-research bash plugins/agentic-research/scripts/install-research-view.sh
```

The installer:

1. Reads the plugin version from `${PLUGIN_ROOT}/.claude-plugin/plugin.json`.
2. Resolves `uname -s`/`uname -m` to one of four target triples
   (`x86_64-unknown-linux-musl`, `aarch64-unknown-linux-musl`,
   `x86_64-apple-darwin`, `aarch64-apple-darwin`).
3. Copies the matching prebuilt from
   `${PLUGIN_ROOT}/research-view/dist/<triple>/research-view` to
   `.research/bin/research-view` in the current directory.
4. Smoke-tests `--help` and verifies `--version` matches the plugin version
   before atomically moving the binary into place.
5. Falls back to `${PLUGIN_ROOT}/scripts/research-view.sh` (the pure-bash
   implementation) when the platform is unsupported.

On success it prints one of:

```
installed prebuilt <triple> (research-view <semver>)
installed bash fallback (research-view <semver>)
```

### Prebuilt binaries and CI

The prebuilt binaries under `research-view/dist/<triple>/research-view` are
cross-compiled and committed by the CI workflow at
`.github/workflows/build-research-view.yml`. They are **not** built locally.
To refresh them after a version bump, trigger the workflow manually with
`commit_binaries=true` **on the post-bump commit** (not before it — the bump
writes the version stamp that CI bakes into the binary).

Until the binary-refresh CI run lands, the installer's version check will
intentionally fail on supported platforms. Do not cut a release before the
binary-refresh commit appears.
