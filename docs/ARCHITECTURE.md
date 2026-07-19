# Architecture

How this repo is organized and how one git tree resolves into installable
plugins and packages for three agent harnesses. This is the meta map;
plugin-internal architecture lives in each plugin's own `docs/ARCHITECTURE.md`.

## Repo layout

```
.
├── plugins/                 # the shippable plugins (one directory each)
│   ├── agile-workflow/       # flagship — structured substrate work tracking
│   ├── workbench/            # flexible requirements-first work ledger
│   ├── ux-ui-design/         # standalone mockup-first UI design
│   ├── code-audit/           # standalone markdown code audits
│   ├── nates-toolkit/        # standalone utility skills
│   ├── agentic-research/     # grounded research discipline + .research substrate
│   ├── agent-coordination/   # sparse cross-agent coordination ledger
│   ├── background-tasks/     # detached job tools (Pi package only)
│   ├── pi-sandbox/           # first-party bwrap hardening (Pi package only)
│   ├── zai-research/         # Z.ai research MCP + Pi-native tools
│   └── workflow/             # DEPRECATED, frozen, kept for existing installs
├── .agents/skills/          # standalone reference-skill library (non-plugin)
├── .claude-plugin/
│   └── marketplace.json     # native Claude Code install index
├── .agents/plugins/
│   └── marketplace.json     # native Codex install index
├── scripts/
│   └── bump-version.sh      # the version gate (bumps channel metadata together)
├── docs/                    # this meta layer (VISION, SPEC, ARCHITECTURE)
├── .claude/                 # repo-level Claude config + instructions
└── README.md
```

`.agents/skills/` holds the curated reference library — library references
(`zod-v4`, `hono-v4`, `drizzle-v0`, the tanstack family, `bun`, `biome-v2`,
`smol-toml`, `citty`, `clack-prompts`, `schemars`, `claude-cli-sdk`),
ecosystem-research skills (`claude-code-marketplace`, `codex-plugin-format`),
and a few standalone workflow skills (`clean-memory`, `design-pages`). These
auto-load on relevant context and are not part of any plugin.

## Plugin anatomy

Each `plugins/<name>/` directory carries channel metadata and a mix of shared
and harness-specific components:

```
plugins/<name>/
├── .claude-plugin/plugin.json   # Claude Code manifest (omitted for Pi-only packages)
├── .codex-plugin/plugin.json    # Codex manifest (omitted for Pi-only packages)
├── package.json                 # Pi package metadata
├── skills/                      # SKILL.md units  — shared
├── commands/                    # slash commands  — Claude-specific
├── hooks/                       # event hooks     — harness-specific
├── extensions/                  # Pi extensions   — Pi-specific, when needed
├── prompts/                     # Pi prompt templates, when needed
├── docs/                        # plugin foundation docs (optional)
├── CHANGELOG.md
└── README.md
```

The shared/harness-specific split is the rule from `docs/SPEC.md`: skills cross
all three harnesses; command, hook, extension, prompt, theme, and agent surfaces
are exposed only where the target harness supports them. A plugin whose
capability is pi-runtime-only ships `package.json` and omits both
`.claude-plugin/` and `.codex-plugin/`; `background-tasks` and `pi-sandbox` are
the current examples and are not registered in the Claude/Codex marketplace.

## Distribution wiring

Two native catalogs carry the same ordered plugin identities with
channel-appropriate source shapes:

- `.claude-plugin/marketplace.json` uses Claude Code's string-path source for
  local plugins (`"./plugins/<name>"`).
- `.agents/plugins/marketplace.json` uses Codex's explicit local source objects.
- External plugins (`krometrail`, `peeragent`, `skilltap`) are federated in both
  catalogs through semantically equivalent `git-subdir` sources pointing at
  their own repositories.
- **Version integrity** flows through `scripts/bump-version.sh`, which keeps a
  plugin's channel metadata in lockstep and refuses to act on a dirty plugin
  directory.

Pi distribution is package-native. For cross-channel plugins, Pi package
metadata lives beside the Claude and Codex manifests, points at the same
`skills/` tree, and adds Pi-native extensions or prompt templates only when they
improve the user experience beyond raw skill loading. Pi-only packages have no
Claude or Codex manifests because their capability exists only in the Pi
runtime; `background-tasks` and `pi-sandbox` are the current examples. The root
Pi aggregate keeps `agile-workflow` as its default `.work/` owner and omits the
mutually exclusive `workbench` skills; users install Workbench's package
individually. External companions such as `peeragent` are not re-exported by
this repo's root Pi package; Pi users
install them from their own package roots, for example
`pi install git:github.com/nklisch/peeragent@v0.4.1`.

## The substrate-access model

The flagship's substrate is plain files: `.work/` items as markdown with YAML
frontmatter, which are the single source of truth. Two surfaces read that one
substrate, each tuned for a different consumer:

- **Agent surface — the `work-view` CLI.** Built for agent ergonomics: terse,
  parseable, scriptable output, and dependency-aware filtering. This is what the
  design, implement, review, and autopilot skills call to decide what to act on.
- **Human surface — the `work-view board` web view.** A live localhost board
  for people to see the substrate at a glance, served by the compiled
  `work-view` adapter over the same `.work/` files.

The shape is deliberate: one substrate, two adapters, distinct ergonomics for
distinct consumers — the Ports & Adapters and Single-Source-of-Truth principles
agile-workflow defines for itself, applied to its own tooling. How those
surfaces are built, and how they evolve, is owned by
`plugins/agile-workflow/docs/ARCHITECTURE.md` and tracked as work in `.work/` —
not pinned here.

## Where internals live

- Structured substrate lifecycle, gates, releases, and the work-view query
  model → `plugins/agile-workflow/docs/{ARCHITECTURE,SPEC,PRINCIPLES}.md`.
- Flexible requirements-first work, research references, UI walkthroughs, and
  compact release summaries → `plugins/workbench/docs/{VISION,SPEC}.md`.
- Standalone mockup-first design layout → the `ux-ui-design` plugin.
- Standalone markdown audit reports → the `code-audit` plugin.
- Grounded research substrate and citation discipline → the `agentic-research`
  plugin.
- Sparse cross-agent handoffs and claims → the `agent-coordination` plugin.
- Distribution constraints and versioning rules → `docs/SPEC.md`.
- Purpose and the dogfooding thesis → `docs/VISION.md`.
