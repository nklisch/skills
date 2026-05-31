# Architecture

How this repo is organized and how one git tree resolves into installable
plugins for two vendors. This is the meta map; plugin-internal architecture
lives in each plugin's own `docs/ARCHITECTURE.md`.

## Repo layout

```
.
├── plugins/                 # the shippable plugins (one directory each)
│   ├── agile-workflow/       # flagship — substrate work tracking
│   ├── ux-ui-design/         # mockup-first UI design
│   ├── nates-toolkit/        # standalone utility skills
│   └── workflow/             # DEPRECATED, frozen, kept for existing installs
├── .agents/skills/          # standalone reference-skill library (non-plugin)
├── .claude-plugin/
│   └── marketplace.json     # install index for both vendors
├── scripts/
│   └── bump-version.sh      # the version gate (bumps both manifests together)
├── docs/                    # this meta layer (VISION, SPEC, ARCHITECTURE)
├── .claude/                 # repo-level Claude config + instructions
├── README.md
└── tap.json                 # legacy skilltap index (slated for removal)
```

`.agents/skills/` holds the curated reference library — library references
(`zod-v4`, `hono-v4`, `drizzle-v0`, the tanstack family, `bun`, `biome-v2`,
`smol-toml`, `citty`, `clack-prompts`, `schemars`, `claude-cli-sdk`),
ecosystem-research skills (`claude-code-marketplace`, `codex-plugin-format`),
and a few standalone workflow skills (`clean-memory`, `design-pages`). These
auto-load on relevant context and are not part of any plugin.

## Plugin anatomy

Each `plugins/<name>/` directory carries both vendor manifests and a mix of
cross-vendor and Claude-only components:

```
plugins/<name>/
├── .claude-plugin/plugin.json   # Claude Code manifest        ┐ dual manifests,
├── .codex-plugin/plugin.json    # Codex manifest              ┘ same version
├── skills/                      # SKILL.md units  — cross-vendor
├── commands/                    # slash commands  — Claude-only
├── hooks/                       # event hooks     — Claude-only
├── docs/                        # plugin foundation docs (optional)
├── CHANGELOG.md
└── README.md
```

The cross-vendor/Claude-only split is the rule from `docs/SPEC.md`: skills cross
both vendors; `commands/`, `hooks/`, and any `agents/` definitions are
Claude-only and simply absent under Codex.

## Distribution wiring

A single index drives both marketplaces:

- **Local plugins** are listed in `.claude-plugin/marketplace.json` with a
  string-path source (`"./plugins/<name>"`). Claude Code reads this directly;
  Codex reads the same file as an alternative marketplace location.
- **External plugins** (`krometrail`, `peeragent`) are federated via
  `git-subdir` sources pointing at their own repos, so the marketplace can offer
  plugins that do not live in this tree.
- **Version integrity** flows through `scripts/bump-version.sh`, which keeps a
  plugin's two manifests in lockstep and refuses to act on a dirty plugin
  directory.

## The substrate-access model

The flagship's substrate is plain files: `.work/` items as markdown with YAML
frontmatter, which are the single source of truth. Two surfaces read that one
substrate, each tuned for a different consumer:

- **Agent surface — the `work-view` CLI.** Built for agent ergonomics: terse,
  parseable, scriptable output, and dependency-aware filtering. This is what the
  design, implement, review, and autopilot skills call to decide what to act on.
- **Human surface — the `work-board` web view.** A browser-rendered board for
  people to see the substrate at a glance.

The shape is deliberate: one substrate, two adapters, distinct ergonomics for
distinct consumers — the Ports & Adapters and Single-Source-of-Truth principles
agile-workflow defines for itself, applied to its own tooling. How those
surfaces are built, and how they evolve, is owned by
`plugins/agile-workflow/docs/ARCHITECTURE.md` and tracked as work in `.work/` —
not pinned here.

## Where internals live

- Substrate item lifecycle, gates, releases, and the work-view query model →
  `plugins/agile-workflow/docs/{ARCHITECTURE,SPEC,PRINCIPLES}.md`.
- Mockup-first design layout → the `ux-ui-design` plugin.
- Distribution constraints and versioning rules → `docs/SPEC.md`.
- Purpose and the dogfooding thesis → `docs/VISION.md`.
