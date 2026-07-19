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
  "version": "0.15.3",
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
research_refs: [<slug>...]       # optional (research artifacts this item tracks/consumes)
research_origin: <slug>|null    # optional (research artifact that spawned this item)
scan_origin: <slug>|null        # optional (scan campaign that spawned this item)
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
| `depends_on` | array of slugs | **Implementation sequencing.** Items this cannot start until all listed dependencies have completed verified implementation (`stage: review` or terminal `done`/`released`). Review remains required for final completion but does not block the next implementation layer. May be empty. Distinct from `parent`. |
| `release_binding` | version string or null | Late-binding. `null` until the user binds. Format matches the release file's version (e.g., `v1.2.0`). |
| `gate_origin` | gate name or null | `null` for user-scoped items. One of `security`, `tests`, `cruft`, `docs`, `patterns`, `refactor` when produced by a gate (`refactor` is the opt-in gate's value). |
| `research_refs` | array of slug strings | **Optional; defaults to `[]`.** The research artifacts (`.research/` slugs or handles) this work item tracks or consumes — the Arrow 1 coordination link. Missing → `[]`. Query: `work-view --research-refs <slug>` (membership). See `plugins/agentic-research/docs/HANDOFF.md` for the cross-tier contract. |
| `research_origin` | slug or null | **Optional; defaults to `null`.** The research artifact that spawned this work item — the Arrow 2 grounding link. Mirrors `gate_origin`. Missing/empty/`"null"` → `null`. Query: `work-view --research-origin <slug>` (or `null`). See `plugins/agentic-research/docs/HANDOFF.md`. |
| `scan_origin` | slug or null | **Optional; defaults to `null`.** The scan campaign (`scan-<goal>`) that produced this work item — the `deep-code-scan` linkage. Mirrors `research_origin`. Missing/empty/`"null"` → `null`. Query: `work-view --scan-origin <slug>` (or `null`). |
| `created` | ISO date | `YYYY-MM-DD`. Set on creation; never modified. FIFO tie-break in autopilot. |
| `updated` | ISO date | `YYYY-MM-DD`. Auto-bumped by PostToolUse hook on every item edit. |

### Stage flow per kind

```
epic:             drafting → implementing → review → done
feature:          drafting → implementing → review → done
child story:      implementing → done
standalone story: implementing → review → done   (often skips drafting)
release:          planned → quality-gate → released
task:             [ ] → [x]                      (checklist line in parent body)
```

Stages advance only when work completes. No pre-population. Child stories are
design and acceptance checkpoints: green implementation verification advances
them directly from `implementing` to `done`. They never enter `review`. A
standalone story (`parent: null`) receives a bounded inline review because no
parent feature supplies that boundary, but never an independent, fresh-context,
or cross-model review. A feature is the normal implementation, integration,
verification, and review boundary. Production skills advance a feature to
`review` only after all child stories are `done` and integrated verification is
green, then continue through the selected feature review lane by default. An
explicit `stop-at-review` request may leave a feature or standalone story there.
An item at `review` has completed verified implementation and therefore satisfies
`depends_on` for downstream implementation: review may run concurrently with the
next dependency layer. Final completion and release still require review to
finish and the item to reach `done`.

Once all child features have completed feature-level review and are `done`, the
epic advances from `implementing` to `review` for its own deeper aggregate pass.
Epic review targets end-to-end capability, cross-feature contracts, cumulative
operational/release risk, and foundation alignment rather than repeating child
feature details. Review depth generally rises with scope: broad boundaries reveal
integration gaps, while tiny-scope review tends toward pedantry and
unproductive over-engineering. Review effort applies to features, epics, and
final autopilot completion bundles; standalone stories always use the bounded
inline lane. Fresh-reviewer findings are proposals: the receiving agent
verifies and classifies them against repository context. Only credible material
current-cycle risk blocks feature advancement; valid lower-priority findings
are parked unbound.

### Questions and advisory review

Normal design resolves routine, reversible decisions with judgment and records
the rationale. The structured question tool is reserved for choices that set
product direction, materially change user-facing behavior or an external
contract, or commit the project to an expensive, difficult-to-reverse path.
`--only-questions` remains an explicit interactive alignment mode and does not
design or advance an item; an active autopilot run instead chooses the least
irreversible sound option and logs it.

Advisory review is risk-driven in direct and autopilot modes. When independent
review is warranted, completeness/advisory review precedes adversarial review,
and a pass is called cross-model only when the reviewer is a known different
model class. Design-time advisory failure is non-blocking; final autopilot
completion must clear the review path required by its effective weight. The
effective `review_weight` resolves from an explicit invocation, then project
convention, then `standard`:

- `none` — no independent reviewer; green implementation verification and
  acceptance evidence are still required.
- `light` — at most one focused pass where risk warrants it, followed by
  adjudication, material-blocker fixes, verification, and closure without
  re-review.
- `standard` — the default: exactly one balanced fresh-context pass, followed by
  adjudication, material-blocker fixes, verification, and closure without
  re-review.
- `thorough` — repeat review → adjudicate → fix → verify until a pass yields no
  receiver-confirmed material current-cycle blockers.
- `maximum` — use the `thorough` convergence rule with multi-model,
  complementary-then-adversarial coverage when available.

Reviewer capability and lens breadth adapt to target risk, but closure policy is
binding. Epic scope and deep lenses do not silently escalate `standard` beyond
one pass. In convergence lanes, smaller findings are parked unbound, kept as
nits, or rejected by receiver judgment; they do not keep the loop open. A
successful review path requires every proposed finding to be adjudicated, not
implemented. The receiving orchestrator weighs acceptance
criteria, supported users and deployment shape, likelihood, blast radius,
recoverability, safeguards, and delay cost. It fixes or activates material
current-cycle blockers, parks valid lower-priority concerns in the unbound
backlog, and rejects unsupported advice with a rationale. Reviewer labels and
repetition are evidence, not authority.

### Backlog item shape

Items in `.work/backlog/` are leaner — `kind` and `stage` are unknown until
a scoping pass fixes them.

```yaml
---
id: <slug>
created: YYYY-MM-DD
updated: YYYY-MM-DD   # optional; written by park (== created), bumped by the hook on edit
tags: [<tag>, ...]
---
```

`updated` is **optional** on the backlog contract (it is not in
`BACKLOG_REQUIRED`). `park` writes it equal to `created` at creation, and the
PostToolUse hook bumps it on every edit. When absent (e.g. a legacy item parked
before this contract), consumers treat the last-touched date as `created`. This
gives a backlog grooming/staleness query a reliable last-touched signal without
requiring the field — see `backlog_staleness_days` under §`.work/CONVENTIONS.md`.

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
- prose       no-code-surface deliverable (docs, conventions, copy) — routes to prose-author (lean authoring lane: brief-as-design, inline implement)  # optional — omit if `prose` already means something else in your project (token name may change before v1.0)
- research    grounded research engagement — an input, not a shippable — routes cross-plugin to agentic-research:research-orchestrator; carries a research_dials: block (the commissioning subset of the registration), does not bind to a release, gates run inline (only when the agentic-research plugin is installed)

## Slug conventions
<format and prefix rules>

## Stage overrides
<only if the project deviates from the master>

## Terminal-tier retention
<delete-refs | retain-bodies>

## Gate config
gates_for_release: [security, tests, cruft, docs, patterns]
gate_finding_routing:
  critical: implementing
  high: implementing
  medium: drafting
  low: backlog
  info: skip
gate_refactor_scan_library_roots:
  - .agents/skills
  - .claude/skills
binding_guard: warn
epic_cohesion: phased
review_weight: standard
backlog_staleness_days: 90
```

The default `gates_for_release` order is fixed: **security → tests → cruft
→ docs → patterns**. Override only if the project has a justified reason.

Release-bound items define each gate's focus, not a hard scan boundary. A gate
may follow concrete evidence into adjacent dependencies, shared infrastructure,
or system-wide mechanisms. Findings caused by, exposed by, or materially
relevant to the release bind to it. Merely ambient discoveries must be written
to the unbound backlog, so wider inspection does not silently expand release
scope. Any cruft proposal that reduces behavior, validation, determinism,
compatibility, safety, or another meaningful guarantee requires explicit user
confirmation before it becomes active removal work.

**`gate-refactor` is an opt-in gate** — not in the default list. Add it when your project has
scan-rule libraries installed under `gate_refactor_scan_library_roots` (defaults:
`{project}/.agents/skills/scan-*/SKILL.md`, then
`{project}/.claude/skills/scan-*/SKILL.md`). The gate discovers and loads all libraries it finds,
then checks the release bundle's changed files against every rule. With no libraries installed it
logs a graceful skip and continues — not an error. Example opt-in:

```yaml
gates_for_release: [security, tests, cruft, docs, patterns, refactor]
```

**`gate_finding_routing`** controls how item-producing gates place findings after
each gate normalizes its local vocabulary. Defaults preserve the built-in routing:
`critical` and `high` create active stories at `stage: implementing`, `medium`
creates active stories at `stage: drafting`, `low` writes a backlog file, and
`info` is skipped. Valid target values are `implementing`, `drafting`, `backlog`,
and `skip`; missing keys fall back to defaults. `skip` means no work item is
emitted, but the gate still reports skipped counts in its conversational output
and in any durable gate-run record it already writes. Gate vocabularies stay
gate-local: security and tests normalize `Critical|High|Medium|Low`, docs
normalizes `High|Medium`, and cruft/refactor normalize `High|Medium|Low`.

**`gate_refactor_scan_library_roots`** controls the parent directories
`gate-refactor` searches for scan-rule libraries. Defaults preserve current
behavior: `.agents/skills` first, `.claude/skills` second. Relative paths resolve
from the project/substrate root; absolute paths are allowed. The gate still only
loads libraries matching `scan-*/SKILL.md` below each configured root. Duplicate
libraries are deduped by derived library tag in configured root order, so the
first discovered library wins. Roots outside the project tree expand the trust
boundary because the gate loads instructions and reference files from those
locations.

**`binding_guard`** (default **`warn`** when absent) controls the Phase 3.5 binding-consistency check
in `release-deploy`. Values: `warn` | `halt` | `off`. `warn` runs all three checks and records any
finding as a durable warning in the release body (replace-or-skip, not appended), then continues.
`halt` stops the release on any acted-on finding (for projects that hold the no-cross-version-drift
invariant). `off` skips the checks entirely (short-circuits before any walk).

**`epic_cohesion`** (default **`phased`** when absent) governs the severity of an *unbound child of
a bound parent* (an INCOMPLETE finding). `phased` treats INCOMPLETE entries as informational —
listed in the warn report, never counting toward a halt (an epic may ship across releases). `total`
treats them as mismatches acted on per `binding_guard`, like CONFLICTs (the project holds "epics
ship whole"). CONFLICTs (a child bound to a *different* version than its bound parent, or a done
parent unbound while its children are bound) always follow `binding_guard` regardless of this dial.

**`review_weight`** is optional and defaults to **`standard`** when absent. Valid values are
`none`, `light`, `standard`, `thorough`, and `maximum`. An explicit invocation selector overrides
the project value. The setting controls independent-review depth and closure policy; it never
relaxes implementation verification or acceptance evidence. `standard` is the
single-pass default, while only `thorough` and `maximum` enable multi-pass
convergence. The canonical level semantics and lane selection live in the
`principles` and `review` skills rather than in project bootstrap configuration.

**`backlog_staleness_days`** (integer; **absent ⇒ feature inert**) is the age threshold for the
opt-in backlog staleness query `work-view --stale`. When set, `--stale` lists `.work/backlog/`
items whose last-touched date — `updated` if present, else `created` — is more than this many days
before today (local time). When the key is absent, `--stale` surfaces nothing and prints a
one-line "no `backlog_staleness_days` configured" notice (exit 0) — a project that does not opt in
sees no behavior change. This is the query surface a backlog grooming capability consumes; it does
not auto-prune anything.

`terminal-tier retention` (default **`delete-refs`**) is **one merged convention** covering the
whole terminal lifecycle — archival, late-binding, and release collapse — not just on-disk byte
retention. With `delete-refs`:

1. **Archive (decoupled from release).** A `done` item with no `release_binding` becomes a
   **bodyless stub** (frontmatter + `# Title` + `git_ref:` + `archived_atop:`). Its body is pruned to
   git, so terminal prose (which carries zero design authority) cannot leak to future agents.
   `archived_atop` records the release baseline the item was done atop — stamped once, immutable.
2. **Late-bind unbound archived stubs.** A release pulls in **all unbound archived stubs**
   (`release_binding: null`), confirms the set with the user, and sets their `release_binding`. Each
   stub's `archived_atop` records the baseline it was done atop and is kept as provenance (it surfaces
   in the release summary), NOT used as the gather filter — filtering by strict `archived_atop ==
   prior tag` would strand a stub forever whenever a release is skipped. Late-bound archived stubs
   are re-gated during the release. Gates that need the item body must hydrate it from the stub's
   `git_ref`; a pruned stub body is a lookup requirement, not a reason to skip the item.
3. **One-summary release.** All bound items (active done + late-bound stubs) collapse into a single
   `.work/releases/<version>/release-<version>.md` table (id, title, kind, `archived_atop`, git ref).
   No per-item placement; full bodies live only in git history.

`retain-bodies` is the legacy opt-out (full bodies kept under `.work/archive/` and
`.work/releases/<version>/`); it keeps the same `archived_atop`/late-binding semantics, just without
pruning bodies. A repo that already carries a bespoke "Done-item archival" convention describing this
model should be **converged** into this one merged convention, not left as a duplicate (see
`convert`).

#### Archive stub shape

A `done` item with no `release_binding` and no active parent is archived as a bodyless stub. The
stub is frontmatter + the first `# <Title>` line only; the body is pruned to git history. Its
frontmatter carries two extra fields beyond the standard contract:

- `archived_atop: <release | pre-release>` — the release baseline the item was done atop (see
  computation below). Stamped **once** at archival; immutable thereafter.
- `git_ref: <sha>` — the commit where the full body lives. Recover it with
  `git show <git_ref>:<path>`.

```yaml
---
id: <id>
kind: <kind>
stage: done
tags: [...]
parent: null
depends_on: []
release_binding: null          # null until a release late-binds it
archived_atop: <release | pre-release>
git_ref: <sha>
created: <orig>
updated: <today>
---

# <Title>
```

#### `archived_atop` computation

`archived_atop` is the **latest released version at archival time**, computed deterministically:

1. The newest git tag matching the project's release tag shape (e.g. `git describe --tags
   --abbrev=0`), OR
2. the newest `.work/releases/<version>/` summary, when the project does not tag releases.
3. If neither exists yet — no release has ever shipped — use the `pre-release` sentinel.

Stamp it once when the stub is written and never rewrite it (it is the immutable baseline recorded as
provenance). Idempotent re-archival preserves the existing `archived_atop`. The
`/agile-workflow:release-deploy` bind phase gathers **all unbound archived stubs** (not only those
whose `archived_atop` matches the prior tag) and records each stub's `archived_atop` in the release
summary as provenance.

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
(`kind, stage, tags, parent, depends_on, release_binding, research_refs, research_origin`).
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
│   ├── archive/<id>.md                            # bodyless ref stubs w/ archived_atop + git_ref (delete-refs)
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

**Channel parity posture:** when agile-workflow adds or changes Claude/Codex hook
behavior, Pi must receive a native extension adapter in the same change unless a
host capability is explicitly impossible. The adapter should call the shared
hook scripts or read the same generated sources rather than reimplementing rules
in a parallel language. Drift is guarded by
`plugins/agile-workflow/scripts/tests/channel-parity.test.sh`.

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
| `--ready` | (none) | Active-tier items at `stage: drafting`, `implementing`, or `review` whose `depends_on` entries have verified implementation complete (`review`, `done`, `released`, or resident in `releases/`/`archive/`). **Excludes `[scan]`-tagged items** — they are engagement-owned by `deep-code-scan` and must not be drained by autopilot. |
| `--blocked` | (none) | Active-tier items at `stage: drafting`, `implementing`, or `review` with at least one dependency that has not completed verified implementation. Also excludes `[scan]`-tagged items. |
| `--blocking` | `<id>` | Reverse lookup: items that depend on `<id>` |
| `--scope` | `<active\|backlog\|releases\|archive\|all>` | Tiers to surface. Default (flag absent) = **active + backlog** (non-terminal); terminal tiers (`releases`/`archive`) are hidden unless requested. `--release`/`--gate` auto-widen to `all` unless `--scope` is set explicitly |
| `--research-origin` | `<slug>` | Filter by `research_origin` (use `null` to select items with no origin) |
| `--research-refs` | `<slug>` | Items whose `research_refs` list contains `<slug>` |
| `--scan-origin` | `<slug>` | Filter by `scan_origin` (use `null` to select items with no scan origin) |
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
    research_origin: string | null;
    research_refs: string[];
    scan_origin: string | null;
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

### Pi hook parity adapter

Pi packages do not consume `hooks/hooks.json`. The Pi package therefore exposes
`plugins/agile-workflow/extensions/agile-workflow.ts` as a **Pi hook parity
adapter**. It maps Pi-native events onto the same deterministic hook scripts:

- `session_start` → `prompt-context.py` with `hook_event_name: SessionStart` for
  epoch reset and work-view self-heal side effects.
- `session_compact` → `prompt-context.py` with `hook_event_name: PostCompact` for
  epoch bump side effects.
- `before_agent_start` → `prompt-context.py` twice: synthetic
  `hook_event_name: PiBeforeAgentStart` with `force_rules_context: true` to
  append `.agents/rules/*.md` into Pi's rebuilt-per-turn system prompt, then
  `hook_event_name: UserPromptSubmit` for the same prompt-gated principles
  capsules Claude/Codex receive. Principles are returned as an injected Pi
  message (`customType: agile-workflow-principles`) rather than hidden permanent
  instructions, matching hook-specific context visibility.
- `tool_result` for mutating tools (`write`, `edit`, `apply_patch`) →
  `substrate-maintainer.py` with `hook_event_name: PostToolUse`; validation
  output is appended to the tool result so the next model step sees the same
  substrate warnings.

This adapter is intentionally thin: `.agents/rules/`, `prompt-context.py`, and
`substrate-maintainer.py` remain the source of truth across Claude Code, Codex,
and Pi. Any change to hook behavior must update the adapter and the parity check
script in the same patch.

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
