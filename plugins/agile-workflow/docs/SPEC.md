# SPEC: agile-workflow

Technical contracts for the agile-workflow plugin: manifest, frontmatter,
file layouts, distribution, scripts, hooks, tooling. Implementation must
conform to this spec; deviations are bugs.

## Plugin manifest

Located at `plugins/agile-workflow/.claude-plugin/plugin.json`:

```json
{
  "name": "agile-workflow",
  "description": "Markdown-based work-tracking substrate for AI-driven projects. Items as files in .work/, late-binding releases, gates that produce items, goal-backed autopilot queue runner. See docs/VISION.md.",
  "version": "0.10.0",
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

For hook script paths, use the portable plugin-root form
`${PLUGIN_ROOT:-${CLAUDE_PLUGIN_ROOT}}`. Codex sets `PLUGIN_ROOT` /
`PLUGIN_DATA` and also exports Claude-compatible variables; Claude sets
`CLAUDE_PLUGIN_ROOT` / `CLAUDE_PLUGIN_DATA`.

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

Body: an unscoped capture sized to the input. Simple ideas can be one
paragraph; richer context notes or roadmap-style multi-arc thoughts can keep
bullets, references, and current-situation context. Kind, stage, parent,
dependencies, release binding, and decomposition remain unknown until `scope`
promotes the item.

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
- perf        throughput, latency, memory — routes to perf-design
- refactor    behavior-preserving structural change ONLY — fails the black-box test (any observable behavior change for callers) means NOT a refactor — routes to refactor-design

## Slug conventions
<format and prefix rules>

## Stage overrides
<only if the project deviates from the master>

## Terminal-tier retention
<delete-refs | retain-bodies>

## Gate config
gates_for_release: [security, tests, cruft, docs, patterns]
```

The default `gates_for_release` order is fixed: **security → tests → cruft
→ docs → patterns**. Override only if the project has a justified reason.

`terminal-tier retention` (default **`delete-refs`**) controls what persists on disk when an item
reaches a terminal tier. With `delete-refs`, archiving a done item leaves a **bodyless stub**
(frontmatter + `# Title` + `git_ref:`), and a release **collapses** its bound items into a single
`releases/<version>/release-<version>.md` summary — full bodies live only in git history, so terminal
prose (which carries zero design authority) cannot leak to future agents. `retain-bodies` is the
legacy behavior (full bodies kept under `.work/archive/` and `.work/releases/<version>/`).

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

[slim dense pointers + work-view query patterns + a MANDATORY
"read `.agents/rules/*.md` before designing/implementing/reviewing"
read-directive — see ARCHITECTURE.md]
<!-- agile-workflow:end -->
```

The managed section is **slim**: substrate orientation, `work-view` query
patterns, and grep-able pointers to the canonical rules file
`.agents/rules/agile-workflow.md` and the `patterns` skill, plus a mandatory
read-directive. `convert --update` replaces everything between the markers
without touching the rest of the selected AGENTS target.

### `.agents/rules/` agent rules

Dense behavioral rules (tag semantics, test integrity, advisory review, entry
points) live in the plugin-managed `.agents/rules/agile-workflow.md`, delimited
by `<!-- agile-workflow:rules:start/end -->` markers. The agile-workflow hook
force-loads every `.agents/rules/*.md` into agent context (see Hook contracts).
`convert` writes and verifies `.agents/rules/agile-workflow.md` BEFORE slimming
the AGENTS section, so the managed-section overwrite can never drop dense rule
content.

User-owned and migrated legacy rule prose lives in separate user-owned
`.agents/rules/<name>.md` files (e.g. `project.md`), never inside the plugin
`agile-workflow:rules` markers. When an older repo has `.claude/rules/*.md`,
`convert`'s content-integrity gate parses each file into Markdown-aware blocks,
routes structural patterns to `.agents/skills/patterns/` and rule prose to
`.agents/rules/<name>.md`, verifies every block landed at its canonical home,
and only then replaces the legacy path with a shim. `.claude/rules/patterns.md`
is not a supported canonical rules file; its content migrates the same way.

### CLAUDE.md compatibility

Claude instruction files are not canonical. `convert` detects `CLAUDE.md`,
`.claude/CLAUDE.md`, and `.agents/CLAUDE.md`, then preserves Claude Code
compatibility by making each one a symlink to the selected AGENTS target where
possible. If symlinks are not available, it writes a short shim telling Claude
Code to read `AGENTS.md`.

When migrating an existing regular `CLAUDE.md`, `convert` imports non-duplicate
content into `AGENTS.md` before replacing it with the symlink or shim.

When migrating an older `.claude/rules/*.md`, `convert` follows the same
preservation rule via the content-integrity gate: route each block to its
canonical home (`.agents/skills/patterns/` for structural patterns,
`.agents/rules/<name>.md` for rule prose), verify every block landed, then leave
only a compatibility shim at the legacy path.

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
├── hooks/
│   ├── hooks.json
│   └── scripts/
│       ├── prompt-context.py
│       └── substrate-maintainer.py
├── scripts/
│   ├── install-work-view.sh
│   ├── work-view.sh
│   └── work-board.sh
├── work-view/                            # Rust workspace: compiled work-view binary + board host
│   ├── crates/
│   │   ├── core/                         # work-view-core: parse, model, index, graph, filter
│   │   └── cli/                          # work-view binary (CLI + board host)
│   │       ├── src/board/                # board subcommand: server, feed, assets + embedded assets/
│   │       └── .work-view-version        # plugin-version stamp (lockstep with plugin.json)
│   └── dist/<target-triple>/work-view    # prebuilt per-platform binaries
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
│   ├── releases/<version>/release-<version>.md   # one summary doc (delete-refs)
│   ├── archive/<id>.md                            # bodyless ref stubs (delete-refs)
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

The plugin distributes through three equal channels:

- Claude Code via the repo-root `.claude-plugin/marketplace.json` and
  `plugins/agile-workflow/.claude-plugin/plugin.json`.
- OpenAI Codex via the same marketplace index and
  `plugins/agile-workflow/.codex-plugin/plugin.json`.
- Pi via package metadata in the plugin root, with the same `skills/` directory
  plus Pi-native extensions or prompt templates where they improve substrate
  ergonomics.

The three channel metadata files stay in lockstep on name, version,
description, repository, and license. Pi-specific runtime surfaces wrap the same
`.work/` substrate; they do not fork the workflow model.

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

### work-view `--version` lockstep

Both work-view implementations report the plugin semver so a deployed copy can
be checked against the plugin with a single string compare:

- The Rust CLI and the bash fallback (`scripts/work-view.sh`) each accept
  `--version` / `-V` and print `work-view <semver>\n` (exit 0). The reported
  `<semver>` is the agile-workflow **plugin** version from `plugin.json`, not the
  crate version. Output is byte-identical across both implementations (a parity
  test enforces this). The bash `--version` answer is emitted by a POSIX-safe
  prelude that runs before the Bash-4 guard, so it works even on macOS system
  bash 3.2.
- `plugin.json` is the single source of truth for the version.
  `bump-version.sh` projects it, in lockstep, into the Rust stamp file
  `work-view/crates/cli/.work-view-version` (compiled in via `include_str!`, no
  trailing newline) and the `WORK_VIEW_VERSION` literal in
  `scripts/work-view.sh`. A `cargo test` assertion fails loudly if the stamp
  drifts from `plugin.json`.
- The four prebuilt `dist/<triple>/work-view` binaries are compiled by CI **from
  the stamped source**, so they must be rebuilt on the **post-bump** commit:
  after `bump-version.sh` commits and pushes the bump, trigger the "Build
  work-view binaries" workflow (`workflow_dispatch`, `commit_binaries=true`)
  against the bumped commit so the shipped binaries self-report the new semver.
  Rebuilding before the bump would compile the old stamp and ship
  version-mismatched binaries. The installer rejects supported-platform
  prebuilts whose `--version` mismatches the plugin instead of silently
  downgrading to the Bash fallback, so the CI binary refresh must land before a
  bumped plugin is considered publishable.

## work-view binary

`convert` installs `work-view` into `.work/bin/work-view` via
`plugins/agile-workflow/scripts/install-work-view.sh`. The project-side tracked
entrypoint is the installed `work-view` artifact: a version-verified prebuilt
Rust binary on supported platforms, or the version-stamped Bash fallback only on
unsupported platforms. The entrypoint is kept fresh by the session hook
self-heal step, with convert using the same installer as a backstop. It is
git-tracked, not gitignored, and its `--version` stamp is compared to the plugin
version when hook or convert freshness checks run.

Prebuilt Rust binaries live under
`plugins/agile-workflow/work-view/dist/<target-triple>/work-view` and are the
standard install path. The compiled binary provides both the query filters and
`work-view board`. The Bash fallback (`scripts/work-view.sh`) is a degraded CLI
fallback for unsupported platforms only; it does not support the interactive
board. Supported prebuilt target triples:

| Triple | Platform |
|---|---|
| `x86_64-unknown-linux-musl` | Linux x86_64 (static) |
| `aarch64-unknown-linux-musl` | Linux aarch64 / ARM64 (static) |
| `x86_64-apple-darwin` | macOS Intel |
| `aarch64-apple-darwin` | macOS Apple Silicon (M1/M2/M3) |

Prebuilt binaries are produced by `.github/workflows/build-work-view.yml` and
committed to `dist/` via the manual refresh job after `bump-version.sh` commits
and pushes the version bump, so CI builds from the bumped source stamp. Users
need no Rust toolchain — only CI does.

The Bash fallback (`work-view.sh`) is pure bash, optional enhancement via `yq`
if installed, falls back to `grep`+`sed` otherwise. It is a **frozen, degraded
fallback** for platforms without a shipped prebuilt binary: it preserves the
core filter surface but intentionally does **not** implement newer Rust-only
features — no `--scope` (it always queries all tiers, the pre-scope default) and
no `work-view board`. bash<->Rust byte-parity is no longer enforced. Full
retirement of the Bash fallback (Rust-only) is tracked as a parked epic.

### Flag set

| Flag | Argument | Effect |
|---|---|---|
| `--stage` | `<stage>` | Filter to items at the given stage |
| `--tag` | `<tag>` | Filter to items with the given tag (repeatable, AND semantics) |
| `--kind` | `<kind>` | Filter to items of the given kind |
| `--parent` | `<id>` | Filter to direct children of the given item |
| `--release` | `<version>` | Filter by `release_binding` |
| `--gate` | `<gate>` | Filter by `gate_origin` |
| `--ready` | (none) | Active-tier items at `stage: drafting`, `implementing`, or `review` with all `depends_on` terminal (`done`/`released`, or resident in `releases/`/`archive/`) |
| `--blocked` | (none) | Active-tier items at `stage: drafting`, `implementing`, or `review` with at least one non-terminal dependency |
| `--blocking` | `<id>` | Reverse lookup: items that depend on `<id>` |
| `--scope` | `<active\|backlog\|releases\|archive\|all>` | Tiers to surface. Default (flag absent) = **active + backlog** (non-terminal); terminal tiers (`releases`/`archive`) are hidden unless requested. `--release`/`--gate` auto-widen to `all` unless `--scope` is set explicitly |
| `--paths` | (none) | Output only file paths (grep-pipe-friendly) |
| `--cat` | (none) | Output full bodies of matching items |
| `--count` | (none) | Output only the match count |
| `--help` | (none) | Show usage and exit |

Multiple filters compose with AND semantics. By default `work-view` surfaces only
the non-terminal tiers (active + backlog); the unbounded `releases/`/`archive/`
history is opt-in via `--scope`. Because release-bound and gate-origin items
migrate into the terminal `releases/` tier when a release ships, `--release` and
`--gate` are treated as lifecycle queries and auto-widen to all tiers unless an
explicit `--scope` overrides them. `--scope` is a Rust-binary feature; the frozen
Bash fallback does not implement it (see below).

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

## Interactive board

The human board surface is `plugins/agile-workflow/skills/board/SKILL.md` and
the compiled `work-view board` subcommand. It serves a live localhost view of
the `.work/` substrate, backed by the Rust query core and embedded assets. The
server binds `127.0.0.1`, scans upward from the requested port when that port is
busy, and never exposes the user's absolute paths or raw item frontmatter in the
browser API. Requests must carry a loopback `Host` authority (`127.0.0.1`,
`localhost`, or `[::1]`) so a page on a non-local origin cannot use DNS
rebinding to read the board feed.

`plugins/agile-workflow/scripts/work-board.sh` remains only as a compatibility
shim for older invocations. It does not render HTML. It checks for a
board-capable `.work/bin/work-view`, execs `.work/bin/work-view board "$@"` when
available, and otherwise prints an actionable compiled-binary requirement.

### Flag set

| Flag | Argument | Effect |
|---|---|---|
| `--port` | `<port>` | Bind localhost starting at this port, default `8181` |
| `--no-open` | (none) | Do not launch a browser after binding |
| `--print` | (none) | Alias for `--no-open` |
| `--help` | (none) | Show usage and exit |

### Swimlanes and stage columns

The kanban view groups items into **swimlanes by parent** — the item's `parent`
id, else its owning epic id, else a `(no parent)` lane. Within each lane it
renders one **column per distinct stage value**, in preferred order:

```
drafting → implementing → review → done → released
```

Any other stage values present in the items (e.g. `planned`, `quality-gate`)
follow as their own columns after the preferred order, with a trailing column
for items that have no stage. Stages are shown **verbatim** — the board does not
collapse or rename them. Backlog items are surfaced through the kind filter
(`backlog` is a selectable kind), not a dedicated column.

### Browser API shape

`GET /api/substrate` returns JSON with project metadata, diagnostics, and an
array of item objects:

```ts
{
  work_view_version: string;
  project: string;
  root_rel: string;
  diagnostics: {
    parse_errors: Array<{ rel_path: string; reason: string }>;
    validation_warnings: Array<ItemDiagnostic>;
    duplicate_ids: Array<ItemDiagnostic>;
  };
  items: Array<{
    id: string;
    kind: 'epic' | 'feature' | 'story' | 'release' | null;
    tier: 'active' | 'backlog' | 'releases' | 'archive';
    stage: string | null;
    parent: string | null;
    release_binding: string | null;
    gate_origin: string | null;
    created: string | null;
    updated: string | null;
    tags: string[];
    depends_on: string[];
    unmet_deps: string[];
    dependents: string[];
    children: string[];
    ready: boolean;
    blocked: boolean;
    is_terminal: boolean;
    body: string;
    rel_path: string;
  }>;
}

type ItemDiagnostic = {
  rel_path: string;
  tier: 'active' | 'backlog' | 'releases' | 'archive';
  id: string | null;
  field: string | null;
  reason: string;
};
```

The API intentionally omits absolute filesystem paths and the raw item text
envelope. Markdown body content is returned for display, while frontmatter is
represented by parsed fields.

### Exit codes

| Code | Meaning |
|---|---|
| `0` | Success |
| `1` | Usage error (bad flag) |
| `2` | Substrate not found |

## Hook contracts

Hooks live in `plugins/agile-workflow/hooks/hooks.json`.

### SessionStart / PostCompact hooks

```json
{
  "SessionStart": [
    {
      "matcher": "startup|resume|clear|compact",
      "hooks": [
        {
          "type": "command",
          "command": "PYTHONDONTWRITEBYTECODE=1 python3 ${PLUGIN_ROOT:-${CLAUDE_PLUGIN_ROOT}}/hooks/scripts/prompt-context.py",
          "timeout": 5
        }
      ]
    }
  ],
  "PostCompact": [
    {
      "matcher": "manual|auto",
      "hooks": [
        {
          "type": "command",
          "command": "PYTHONDONTWRITEBYTECODE=1 python3 ${PLUGIN_ROOT:-${CLAUDE_PLUGIN_ROOT}}/hooks/scripts/prompt-context.py",
          "timeout": 5
        }
      ]
    }
  ]
}
```

**Activation:** resolves the substrate root by walking up from the hook payload's
`cwd` (then `CLAUDE_PROJECT_DIR`, then the process working directory) until a
`.work/CONVENTIONS.md` is found; runs only if one exists, otherwise exits 0 with
no output.

**Effect:** updates prompt-context state under the host-provided plugin data
directory (`PLUGIN_DATA` / `CLAUDE_PLUGIN_DATA`), falling back to
`XDG_STATE_HOME`, `~/.local/state`, or the system temp directory only when no
plugin data directory is available. `SessionStart` resets the per-session epoch
and seen-set; `PostCompact` bumps the epoch so context re-injects after
compaction. This lets principles capsules fire once per session, and once again
after resume/compaction, without dirtying normal project worktrees. It does not
inject queue context at session start.

These events are also the **primary firing** of the `.agents/rules/`
rules-injection contract where the host accepts hook-specific context. They emit
the concatenated `.agents/rules/*.md` content as
`hookSpecificOutput.additionalContext` directly (after the epoch reset/bump),
unconditionally — no prompt to gate on. Codex is the exception for
`PostCompact`: Codex's `PostCompact` output schema does not allow
`hookSpecificOutput`, so that event only bumps the epoch and leaves context
reload to `SessionStart` with `source: compact`. This
keeps rules reloading at session start and after compaction, even during
auto-continuation with no user prompt, mirroring the legacy Claude-only
`.claude/rules/` force-load.

### `.agents/rules/` rules-injection contract

The hook force-loads every `.agents/rules/*.md` file into agent context so
producers (`convert`, `gate-patterns`, or the user) can drop content-agnostic
rule files there and have them reliably reach the agent in both Claude Code and
Codex. The contract:

- **Fires on:** `SessionStart` and host-supported `PostCompact` context output,
  unconditionally. On Codex, `PostCompact` is side-effect-only because its
  output schema does not allow `hookSpecificOutput`; `SessionStart` with
  `source: compact` carries the context.
- **Content:** all `<root>/.agents/rules/*.md` files, sorted by name,
  concatenated under a `## Project Rules (.agents/rules/)` heading.
- **Dedup:** per-session epoch + SHA-256 content hash. Rules inject exactly once
  per `(epoch, content-hash)` — re-injecting after a `PostCompact` epoch bump or
  when any `.agents/rules/*.md` file changes, but not otherwise.
- **Substrate gate:** only fires when `${CLAUDE_PROJECT_DIR}/.work/CONVENTIONS.md`
  exists, like all the prompt-context hooks.
- **CONVENTIONS flag + byte cap:** `.work/CONVENTIONS.md` may set
  `rules_context: on|off` (default `on`) to disable injection, and
  `rules_context_max_bytes: <int>` (default 12000) to cap the emitted size. A
  malformed CONVENTIONS keeps the enabled defaults so rules are never silently
  dropped; oversized content is truncated with a "read the files for full
  content" notice (the hash is computed over the untruncated content so any edit
  re-injects).

### UserPromptSubmit hook

```json
{
  "UserPromptSubmit": [
    {
      "hooks": [
        {
          "type": "command",
          "command": "PYTHONDONTWRITEBYTECODE=1 python3 ${PLUGIN_ROOT:-${CLAUDE_PLUGIN_ROOT}}/hooks/scripts/prompt-context.py",
          "timeout": 10
        }
      ]
    }
  ]
}
```

**Activation:** runs only if a substrate exists. Principles capsules additionally
require an actionable agile-workflow move: queue operations, stage movement,
explicit workflow verbs, or a known item id.

**Effect:** returns `hookSpecificOutput.additionalContext` with:
- The smallest relevant principles capsule, at most once per session per
  capsule: code design, dispatch economy, or advisory review.

It does not inject `.agents/rules/*.md` or queue snapshots at prompt time. Queue
state remains available through explicit `work-view`, `/aw`, or board commands.

### PostToolUse hook

```json
{
  "PostToolUse": [
    {
      "matcher": "Write|Edit|apply_patch",
      "hooks": [
        {
          "type": "command",
          "command": "PYTHONDONTWRITEBYTECODE=1 python3 ${PLUGIN_ROOT:-${CLAUDE_PLUGIN_ROOT}}/hooks/scripts/substrate-maintainer.py",
          "timeout": 5
        }
      ]
    }
  ]
}
```

**Activation:** runs only if the modified file path is under `.work/active/`,
`.work/backlog/`, `.work/releases/`, or `.work/archive/`. Otherwise exits 0.

**Effect:** auto-bumps the `updated:` frontmatter field of modified active or
backlog item files to today's date in **local time**. It then validates cheap
structural invariants for the touched item(s): required frontmatter, valid
kind/stage, filename/id match, duplicate id conflicts involving the touched
item, existing parents and dependencies, and `depends_on` cycles reachable from
the touched item. Validation issues are returned as
`hookSpecificOutput.additionalContext`; the hook does not invoke a model.

## Tooling requirements

### Required

- **bash** ≥ 4.0 — for the `work-view` bash fallback (`work-view.sh`) and the install helper (`install-work-view.sh`)
- **python3** — for plugin hook scripts
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
