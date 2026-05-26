# SPEC: agile-workflow

Technical contracts for the agile-workflow plugin: manifest, frontmatter,
file layouts, distribution, scripts, hooks, tooling. Implementation must
conform to this spec; deviations are bugs.

## Plugin manifest

Located at `plugins/agile-workflow/.claude-plugin/plugin.json`:

```json
{
  "name": "agile-workflow",
  "version": "0.1.0",
  "description": "Markdown-based work-tracking substrate for AI-driven projects",
  "author": { "name": "nklisch" },
  "repository": "https://github.com/nklisch/skills",
  "license": "MIT"
}
```

Auto-discovery picks up:
- `commands/*.md` — slash commands
- `skills/<name>/SKILL.md` — skills
- `hooks/hooks.json` — hook configurations
- `scripts/` — utility scripts (referenced via `${CLAUDE_PLUGIN_ROOT}`)

## Frontmatter contract

Every item file in `.work/active/` and `.work/releases/` has YAML
frontmatter at the top, validated by every skill that reads or writes items.

```yaml
---
id: <slug>                       # required, unique within active tier
kind: epic|feature|story|release # required
stage: <see stage flow>          # required
tags: [<tag>, ...]               # required (may be [])
parent: <slug>|null              # required (null for top-level)
depends_on: [<slug>, ...]        # required (may be [])
release_binding: <version>|null  # required
gate_origin: <gate-name>|null    # required (null unless gate-produced)
created: YYYY-MM-DD              # required
updated: YYYY-MM-DD              # required, auto-bumped by PostToolUse hook
---
```

### Field semantics

| Field | Type | Notes |
|---|---|---|
| `id` | slug string | kebab-case. Unique within `.work/active/`. Child slugs qualify with parent prefix (e.g., `playout-architecture-phase1`, not `phase1`). |
| `kind` | enum | `epic`, `feature`, `story`, or `release`. `task` items have no files — they're checklist lines in a parent's body. |
| `stage` | enum | Per-kind valid values; see Stage flow below. |
| `tags` | array of slug strings | Routing tags from the project's taxonomy in `.work/CONVENTIONS.md`. May be empty. Kebab-case. |
| `parent` | slug or null | **Hierarchy.** `null` for top-level. Points to a parent item's `id`. |
| `depends_on` | array of slugs | **Sequencing.** Items this cannot start until all listed are at `stage: done`. May be empty. Distinct from `parent`. |
| `release_binding` | version string or null | Late-binding. `null` until the user binds. Format matches the release file's version (e.g., `v1.2.0`). |
| `gate_origin` | gate name or null | `null` for user-scoped items. One of `security`, `tests`, `cruft`, `docs`, `patterns` when produced by a gate. |
| `created` | ISO date | `YYYY-MM-DD`. Set on creation; never modified. FIFO tie-break in autopilot. |
| `updated` | ISO date | `YYYY-MM-DD`. Auto-bumped by PostToolUse hook on every item edit. |

### Stage flow per kind

```
epic:    drafting → implementing → review → done
feature: drafting → implementing → review → done
story:   implementing → review → done   (often skips drafting)
release: planned → quality-gate → released
task:    [ ] → [x]                       (checklist line in parent body)
```

Stages advance only when work completes. No pre-population.

### Backlog item shape

Items in `.work/backlog/` are leaner — `kind` and `stage` are unknown until
a scoping pass fixes them.

```yaml
---
id: <slug>
created: YYYY-MM-DD
tags: [<tag>, ...]
---
```

Body: a one-paragraph idea description.

## Substrate file contracts

### `.work/CONVENTIONS.md`

Project-owned file written by `convert` interactively. Every operational
skill reads this at session start (via the SessionStart hook or directly).

```markdown
# Project Conventions

## Release mapping
<branch-held | tag-based | release-branch | none>

## Tag taxonomy
<list of tags this project uses, with one-line semantics>
- security    auth, validation, secrets, supply chain
- perf        throughput, latency, memory
- refactor    structural cleanup, no behavior change

## Slug conventions
<format and prefix rules>

## Stage overrides
<only if the project deviates from the master>

## Gate config
gates_for_release: [security, tests, cruft, docs, patterns]
```

The default `gates_for_release` order is fixed: **security → tests → cruft
→ docs → patterns**. Override only if the project has a justified reason.

### AGENTS.md section

`convert` appends or replaces, idempotently, a section in the project's
canonical AGENTS target delimited by HTML comment markers. It detects
`AGENTS.md`, `.agents/AGENTS.md`, and `.claude/AGENTS.md`, preferring root
`AGENTS.md` when present and otherwise creating a root symlink/shim so Codex has
a root-readable entrypoint.

```markdown
<!-- agile-workflow:start -->
## Agile-Workflow Substrate

Work tracked in `.work/` as markdown items with YAML frontmatter
(`kind, stage, tags, parent, depends_on, release_binding`).
Layout: `.work/active/{epics,features,stories}/`, `.work/backlog/`,
`.work/releases/<version>/`, `.work/archive/`.

[full content — see ARCHITECTURE.md]
<!-- agile-workflow:end -->
```

`convert --update` replaces everything between the markers without touching
the rest of the selected AGENTS target.

### CLAUDE.md compatibility

Claude instruction files are not canonical. `convert` detects `CLAUDE.md`,
`.claude/CLAUDE.md`, and `.agents/CLAUDE.md`, then preserves Claude Code
compatibility by making each one a symlink to the selected AGENTS target where
possible. If symlinks are not available, it writes a short shim telling Claude
Code to read `AGENTS.md`.

When migrating an existing regular `CLAUDE.md`, `convert` imports non-duplicate
content into `AGENTS.md` before replacing it with the symlink or shim.

## File and directory layout

### Plugin source layout

```
plugins/agile-workflow/
├── .claude-plugin/
│   └── plugin.json
├── .codex-plugin/
│   └── plugin.json
├── docs/
│   ├── VISION.md
│   ├── SPEC.md
│   ├── ARCHITECTURE.md
│   ├── PRINCIPLES.md
│   └── MIGRATION.md
├── skills/<skill-name>/
│   ├── SKILL.md
│   └── references/<topic>.md
├── commands/
│   └── board.md
├── hooks/
│   ├── hooks.json
│   └── scripts/
│       ├── session-start-snapshot.sh
│       └── post-tool-use-bump.sh
├── scripts/
│   ├── work-view.sh
│   ├── work-board.sh
│   └── work-board.template.html
├── CHANGELOG.md
└── README.md
```

### Bootstrapped project layout

After `convert` runs in a project repo:

```
<project-root>/
├── .work/
│   ├── active/{epics,features,stories}/<id>.md
│   ├── backlog/<id>.md
│   ├── releases/<version>/<id>.md
│   ├── archive/<id>.md
│   ├── bin/work-view
│   └── CONVENTIONS.md
├── AGENTS.md
├── CLAUDE.md -> AGENTS.md
├── docs/
│   ├── VISION.md
│   ├── SPEC.md
│   └── ARCHITECTURE.md
```

## Distribution

Each agile-workflow skill registers as a `tap.json` entry following the
existing skills repo convention. The plugin distributes via skilltap.

Tap entries follow the existing `skilltap-author` shape, added to `tap.json`
at the repo root. No separate npm package, no separate registry.

## Version strategy

- Plugin version lives in `plugins/agile-workflow/.claude-plugin/plugin.json`
- Bumped via existing `./scripts/bump-version.sh agile-workflow <major|minor|patch>`
- Bump rules:
  - **patch** — new skill, bug fix, or minor update to an existing skill
  - **minor** — significant new capability or breaking change to a skill's workflow
  - **major** — plugin restructure, frontmatter contract change, or
    backwards-incompatible substrate evolution
- v0.1.0 is the initial release. Pre-1.0 signals that frontmatter and stage
  shapes may shift during the first real-project shakedown.
- Promote to v1.0.0 when the substrate has carried 2+ projects through a
  complete release cycle without contract changes.

## work-view script

Lives at `plugins/agile-workflow/scripts/work-view.sh`. Copied to
`.work/bin/work-view` by `convert`.

Pure bash. Optional enhancement via `yq` if installed; falls back to
`grep`+`sed` otherwise.

### Flag set

| Flag | Argument | Effect |
|---|---|---|
| `--stage` | `<stage>` | Filter to items at the given stage |
| `--tag` | `<tag>` | Filter to items with the given tag (repeatable, AND semantics) |
| `--kind` | `<kind>` | Filter to items of the given kind |
| `--parent` | `<id>` | Filter to direct children of the given item |
| `--release` | `<version>` | Filter by `release_binding` |
| `--gate` | `<gate>` | Filter by `gate_origin` |
| `--ready` | (none) | Items at `stage: implementing` with all `depends_on` at `stage: done` |
| `--blocked` | (none) | Items waiting on unresolved dependencies (annotates which) |
| `--blocking` | `<id>` | Reverse lookup: items that depend on `<id>` |
| `--paths` | (none) | Output only file paths (grep-pipe-friendly) |
| `--cat` | (none) | Output full bodies of matching items |
| `--count` | (none) | Output only the match count |
| `--help` | (none) | Show usage and exit |

Multiple filters compose with AND semantics.

### Output modes

- **Default (tabular):** `id | kind | stage | tags | parent` — padded rows
- **`--paths`:** one path per line
- **`--cat`:** full file bodies separated by `---` lines
- **`--count`:** integer

### Exit codes

| Code | Meaning |
|---|---|
| `0` | Success |
| `1` | Usage error (bad flag, conflicting flags) |
| `2` | Substrate not found (no `.work/CONVENTIONS.md` in CWD or ancestor) |
| `3` | Internal error (corrupted item file, etc.) |

## work-board script

Lives at `plugins/agile-workflow/scripts/work-board.sh` with a paired
template at `plugins/agile-workflow/scripts/work-board.template.html`.
Read-only; emits a self-contained HTML kanban view of the substrate and
nothing else. Invoked via the slash command `/agile-workflow:board`.

Pure bash + awk + `base64`. Optional: `python3` only used by `--serve`.

### Flag set

| Flag | Argument | Effect |
|---|---|---|
| `--out` | `<path>` | Write HTML to this path (default: temp file) |
| `--print` | (none) | Print the output path; skip auto-opening a browser |
| `--no-open` | (none) | Alias for `--print` |
| `--serve` | `[port]` | Serve via `python3 -m http.server`, default `8181` |
| `--port` | `<port>` | Override the `--serve` port |
| `--help` | (none) | Show usage and exit |

### Stage → column mapping

```
Backlog       — items in .work/backlog/
Drafting      — stage: drafting (also: stage: planned for releases)
In Progress   — stage: implementing
Review        — stage: review (also: stage: quality-gate for releases)
Done          — stage: done | released, items in .work/archive/, items in .work/releases/
```

### Embedded data shape

The renderer emits a `<script type="application/json" id="items-data">`
block whose contents are a JSON array of item objects:

```ts
{
  id: string;
  kind: 'epic' | 'feature' | 'story' | 'release' | '';
  stage: string;
  parent: string | null;
  release_binding: string | null;
  gate_origin: string | null;
  created: string;
  updated: string;
  tags: string[];
  depends_on: string[];
  unmet_deps: string[];          // computed
  bucket: 'active' | 'backlog' | 'releases' | 'archive' | 'other';
  release_dir: string | null;    // version slug from .work/releases/<v>/...
  ready: boolean;                // implementing AND all deps done
  blocked: boolean;              // implementing AND ≥1 unmet dep
  title_b64: string;             // base64-encoded body title
  excerpt_b64: string;           // base64-encoded first paragraph
  path_b64: string;              // base64-encoded path relative to repo root
}
```

Item title and excerpt are base64-encoded so that quotes, backticks,
backslashes, and embedded `</script>` sequences in markdown bodies do not
corrupt the JSON envelope.

### Exit codes

| Code | Meaning |
|---|---|
| `0` | Success |
| `1` | Usage error (bad flag) or template missing |
| `2` | Substrate not found |

## Hook contracts

Hooks live in `plugins/agile-workflow/hooks/hooks.json`.

### SessionStart hook

```json
{
  "SessionStart": [
    {
      "matcher": "*",
      "hooks": [
        {
          "type": "command",
          "command": "bash ${CLAUDE_PLUGIN_ROOT}/hooks/scripts/session-start-snapshot.sh",
          "timeout": 10
        }
      ]
    }
  ]
}
```

**Activation:** runs only if `${CLAUDE_PROJECT_DIR}/.work/CONVENTIONS.md`
exists. Otherwise exits 0 with no output.

**Effect:** prints a queue snapshot to stdout (becomes part of the session's
initial context):
- Items at `stage: review` (waiting on user attention)
- Items at `stage: implementing` ordered by `--ready` first (the autopilot
  queue)
- Top 5 backlog items by `created` ascending

### PostToolUse hook

```json
{
  "PostToolUse": [
    {
      "matcher": "Write|Edit",
      "hooks": [
        {
          "type": "command",
          "command": "bash ${CLAUDE_PLUGIN_ROOT}/hooks/scripts/post-tool-use-bump.sh",
          "timeout": 5
        }
      ]
    }
  ]
}
```

**Activation:** runs only if the modified file path matches
`.work/active/**.md` or `.work/backlog/**.md`. Otherwise exits 0.

**Effect:** auto-bumps the `updated:` frontmatter field of the modified
item file to today's date in **local time** (the user's "today," not
UTC's "today" — keeps `updated:` consistent with what the user perceives
as the current date when they're working).

## Tooling requirements

### Required

- **bash** ≥ 4.0 — for `work-view` and hook scripts
- **grep** — POSIX-compatible
- **git** — substrate's audit trail; `work-view`'s history queries call `git log`

### Optional (auto-detected, falls back gracefully)

- **yq** — cleaner YAML parsing in `work-view` (faster on > 100 items)
- **jq** — JSON manipulation in some hook scripts
- **gh** — required only if the project's release mapping is `branch-held`
  (used by `release-deploy` to merge bound PRs)

### Not required

- No Node, Python, Rust, or other language toolchains
- No MCP server
- No external services or auth
