# Architecture

This is the meta map for the `nklisch/skills` repository. It explains how
one git tree resolves into installable plugins for four agent harnesses
— Claude Code, OpenAI Codex, Google Antigravity (AGY), and Pi — and where each concern lives.
Plugin-internal architecture stays in each plugin's own `docs/`.

The repo is built around one shape: a single source tree, four install
pipelines. A few terms carry the rest of this document:

- **Harness** — an agent runtime: Claude Code, Codex, Antigravity, or Pi.
- **Channel** — a harness's install pipeline. Each harness reads its own
  catalog or manifest and resolves plugins to its own format.
- **Catalog / Registry** — a JSON file listing installable plugins and their source.
  Native catalogs live in this repo for Claude and Codex; Antigravity uses
  `plugins.json`; Pi reads them through a bridge.
- **Manifest** — a per-plugin JSON file declaring identity, version, and
  surface to one channel (`plugin.json`, `.claude-plugin/plugin.json`, `.codex-plugin/plugin.json`).
- **Substrate** — the plain-file state a workflow plugin reads and writes.
  agile-workflow uses `.work/`; agentic-research uses `.research/`.

## Repo layout

```
.
├── plugins/                 # the shippable plugins (one directory each)
│   ├── workbench/            # centerpiece — requirements-first delivery + research
│   ├── agile-workflow/       # structured substrate work tracking (maintenance mode)
│   ├── ux-ui-design/         # standalone mockup-first UI design
│   ├── code-audit/           # standalone markdown code audits
│   ├── nates-toolkit/        # standalone utility skills
│   ├── agentic-research/     # grounded research discipline + .research substrate
│   ├── agent-coordination/   # sparse cross-agent coordination ledger
│   ├── prose-craft/          # prose drafting, lens review, refine cycle
│   ├── declaudify/           # Claude Code-only every-turn writing posture
│   └── workflow/             # DEPRECATED, frozen, kept for existing installs
├── .agents/skills/          # standalone reference-skill library (non-plugin)
├── .agents/plugins.json     # native Antigravity workspace plugin registry
├── .claude-plugin/
│   └── marketplace.json     # native Claude Code install catalog
├── .agents/plugins/
│   └── marketplace.json     # native Codex install catalog
├── scripts/
│   └── bump-version.sh      # version gate — bumps all three manifests in lockstep
├── docs/                    # this meta layer (VISION, SPEC, ARCHITECTURE) + guides
└── README.md
```

`.agents/skills/` is the curated reference library. It holds API references
(`zod-v4`, `hono-v4`, `drizzle-v0`, the tanstack family, `bun`,
`biome-v2`, `smol-toml`, `citty`, `clack-prompts`, `schemars`,
`claude-cli-sdk`, `zustand-v5`), ecosystem-research skills
(`claude-code-marketplace`, `codex-plugin-format`), and a few standalone
workflow skills (`clean-memory`, `design-pages`, `patterns`,
`repo-skill-style`). They auto-load on relevant context and belong to no
plugin. The marketplaces distribute plugins, not loose skills, so a
reference skill that needs distribution is folded into a plugin.

## How a plugin is structured

Each cross-channel `plugins/<name>/` directory carries three channel manifests
plus a mix of shared and harness-specific components. A host-specific plugin
may carry only the manifest and components for its target host; `declaudify`
is the intentional Claude Code-only exception. Because Pi consumes the Claude
catalog through its bridge, a Claude-only entry may still be discoverable in
Pi; that does not make it a supported Pi plugin:

```
plugins/<name>/
├── plugin.json                  # Antigravity manifest
├── .claude-plugin/plugin.json   # Claude manifest
├── .codex-plugin/plugin.json    # Codex manifest
├── skills/                      # SKILL.md units  — shared
├── commands/                    # slash commands  — Claude-specific
├── agents/                      # subagent defs   — Claude-specific
├── hooks/                       # event hooks     — harness-specific
├── docs/                        # plugin foundation docs (optional)
├── scripts/                     # plugin tooling (optional)
├── CHANGELOG.md
└── README.md
```

Two facts own the rest:

- **Three manifests for cross-channel plugins, no `package.json`.** A
  cross-channel plugin declares itself to Claude Code, Codex, and Antigravity
  through one manifest each. Host-specific plugins may intentionally omit the
  other manifests; `declaudify` declares only Claude Code metadata because its
  hook has no supported equivalent in the other catalogs. Pi packaging moved to
  the `nklisch/pi-extensions` repo, so this tree carries no per-plugin
  `package.json`. `scripts/bump-version.sh` treats the Claude manifest as
  the canonical version source.
- **Shared surface first, harness-specific after.** `skills/` is the bulk
  of every plugin's durable value. It crosses all four harnesses through
  the open Agent Skills standard. Commands, hooks, and agent definitions
  are exposed only where the target harness supports them; in other
  harnesses they degrade to absent, never to broken. Pi-native runtime
  extensions belong in `nklisch/pi-extensions`, not here.

## How plugins reach four harnesses

Native discovery configurations live in this repo:

| Harness | Configuration / Manifest | Local source shape |
|---|---|---|
| Claude Code | `.claude-plugin/marketplace.json` | string path: `"./plugins/<name>"` |
| Codex | `.agents/plugins/marketplace.json` | object: `{ "source": "local", "path": "./plugins/<name>" }` |
| Antigravity | `.agents/plugins.json` + `plugin.json` | entry path: `"plugins/<name>"` |

Both catalogs also federate the same three external companions
(`krometrail`, `peeragent`, `skilltap`) through `git-subdir` sources that
point at their own repositories.

Pi does not get a third catalog in this tree. It consumes the same two
through the `@nklisch/pi-plugins` bridge, maintained in
`nklisch/pi-extensions`. A Pi user installs the bridge once, registers the
catalog, then adds plugins by name:

```
pi install npm:@nklisch/pi-plugins
/plugins marketplace add nklisch/skills
/plugins add <name>@nklisch-skills --scope user
```

The bridge discovers skills by directory convention, so a plugin that is
well-formed for Claude and Codex is well-formed for Pi. Pi-native tool
packages (`pi-plugins` itself, `pi-background-tasks`, `pi-zai-research`)
publish to npm from `nklisch/pi-extensions`, which is also where Pi
runtime extensions are developed.

**Version integrity.** A plugin's two manifests must agree on identity and
version. `scripts/bump-version.sh <plugin> <major|minor|patch>` enforces
this: it reads the Claude manifest's version, requires the Codex manifest
to match before bumping, writes both, and commits the change. It refuses
to run on a dirty plugin directory so the published bump commit carries
only the version change. For `agile-workflow` and `agentic-research` it
also projects the new semver into each plugin's compiled-view version
stamp and bash fallback. Full distribution rules and semver policy live in
`docs/SPEC.md`.

## The .work substrate: one source, two surfaces

agile-workflow's substrate is plain files. Items in `.work/` are markdown
with YAML frontmatter, and that directory is the single source of truth.
Two surfaces read it, each tuned to its consumer:

- **Agent surface — `work-view`.** A CLI built for agent ergonomics: terse
  parseable output and dependency-aware filtering. The design, implement,
  review, and autopilot skills call it to decide what to act on.
- **Human surface — `work-view board`.** A localhost web view of the same
  `.work/` files, served by a small board adapter so people can see state
  at a glance.

The shape is one substrate, two adapters, distinct ergonomics for distinct
consumers — the Ports & Adapters and Single-Source-of-Truth principles
applied to agile-workflow's own tooling. How those surfaces are built,
shipped as prebuilt binaries, and evolved is owned by
`plugins/agile-workflow/docs/ARCHITECTURE.md`, not pinned here.

## Where to read next

- Requirements-first delivery, opportunity scanning, optional release gates,
  research evidence, and compact release summaries →
  `plugins/workbench/docs/{VISION,SPEC}.md`.
- Structured substrate lifecycle, gates, releases, and the work-view query
  model (maintenance mode) →
  `plugins/agile-workflow/docs/{ARCHITECTURE,SPEC,PRINCIPLES}.md`.
- Standalone mockup-first design layout → the `ux-ui-design` plugin.
- Standalone markdown audit reports → the `code-audit` plugin.
- Grounded research substrate and citation discipline → the
  `agentic-research` plugin.
- Sparse cross-agent handoffs and claims → the `agent-coordination` plugin.
- Distribution constraints and versioning rules → `docs/SPEC.md`.
- Purpose and the dogfooding thesis → `docs/VISION.md`.
