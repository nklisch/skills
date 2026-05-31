---
name: convert
description: >
  Bootstrap or sync the agile-workflow substrate. Auto-detects repo state:
  bootstrap creates .work/, CONVENTIONS.md, the canonical AGENTS.md section,
  Claude compatibility, work-view, and migrated items; sync refreshes
  plugin-owned artifacts plus optional skill catalog mirrors while preserving
  user-owned CONVENTIONS.md, refactor rules, and substrate state. `convert
  --update` performs one-pass artifact alignment. Discovery-driven: sweeps both
  skill roots to detect bespoke DIY skills that overlap plugin-owned concepts
  (patterns, refactor conventions, plan-doc generators) and offers to converge
  them to the canonical layout, deferring to the owning skill for placement.
  Checks inbound references before moving any path and rewrites or shims them.
  Always asks whether destructive cleanup is in scope before deleting, moving,
  or replacing legacy artifacts; preserve-only is the default.
user-invocable: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, AskUserQuestion
---

# Convert

You bootstrap OR sync the `.work/` substrate in a target project. Plain `convert`
inspects the current repo and auto-routes:

- **Bootstrap** — no substrate yet. Migrate from whatever tracking shape exists
  (or seed empty for greenfield). Full migration matrix in `docs/MIGRATION.md`.
- **Sync** — substrate exists. Refresh plugin-shipped artifacts so a project
  picks up plugin upgrades. Preserves all user content.

Convert is **discovery-driven, not a fixed checklist.** It enumerates the actual
state of the repo — both skill roots, the rules tree, every agent entrypoint —
and classifies what it finds, rather than probing a hardcoded set of known
paths. Bespoke DIY skills and rules that mirror a plugin-owned concept
(patterns, refactor conventions, cleanup, plan-doc generators) are usually
*convergence signals* — the project hand-rolled something the plugin now owns —
not intentional divergence to preserve. The detection sweep, the DIY→canonical
mapping, the classification taxonomy, the reference-integrity rule, and the
single-owner deferral table live in
[`references/legacy-overlap-migration.md`](references/legacy-overlap-migration.md);
read it before any discovery, convergence, or cleanup step.

Convert distinguishes **alignment** from **cleanup**:

- **Alignment** adds or refreshes plugin-owned artifacts: `.work/bin/work-view`,
  the marked agile-workflow AGENTS section, missing shims, and generated wrapper
  text that can be refreshed without losing user content.
- **Cleanup** deletes, moves, or replaces existing legacy artifacts: old tracking
  docs, duplicate Claude files, divergent `.claude/skills/*` copies, or legacy
  generated plan files. Cleanup is opt-in and path-specific.

**Convert places content; the owning skill defines where it lives.** For any
plugin-owned concept, defer to its owner's canonical location instead of
carrying a divergent rule: reusable patterns → `gate-patterns` Phase 1
(`.agents/skills/patterns/`); refactor conventions →
`refactor-conventions-creator` Phase 1/5 (AGENTS style section +
`.agents/skills/refactor-conventions/`). See the single-owner deferral table in
the reference.

## Arguments

- `convert` — auto-detect mode (recommended). Bootstraps if no substrate is
  present, otherwise syncs plugin artifacts and reports drift.
- `convert --update` — explicit sync / one-pass artifact alignment. Identical
  to auto-sync, but useful when you want to assert intent or repair plugin
  artifacts, AGENTS/CLAUDE compatibility, `.work/bin/work-view`, pattern-skill
  mirrors, and refactor-conventions catalog placement in one pass.
- `convert --shape <shape>` — force a specific source shape for bootstrap
  (`workflow-plugin`, `ad-hoc`, `no-tracking`, `greenfield`). Errors if the
  substrate already exists — remove `.work/` first to force a re-bootstrap.

## Workflow

### Phase 1: Preflight

1. Verify foundation docs exist: `docs/VISION.md` OR `docs/SPEC.md`. If neither:
   > Halt. "No foundation docs found. Run `/agile-workflow:ideate` first to produce
   > foundation docs, then re-run `/agile-workflow:convert`."
2. Verify CWD is a git repo. If not, ask: "This isn't a git repo. agile-workflow's
   substrate relies on git for the audit trail. Run `git init` first?"

### Phase 1.5: Detect run mode

Compute substrate health by checking these markers:

| Marker | What to check |
|---|---|
| `substrate_root` | `.work/` directory exists |
| `conventions` | `.work/CONVENTIONS.md` exists |
| `managed_section` | Some root instruction file (`AGENTS.md` or `CLAUDE.md`) contains `<!-- agile-workflow:start -->`. Whichever holds it is the detected canonical instruction file for this repo — direction-agnostic, since `entrypoint_model` isn't decided until Phase 1.8 |
| `entrypoint_compat` | The *other* root entrypoint (the one without the managed section) is a symlink/shim to the canonical instruction file, OR itself contains the section for legacy installs |
| `work_view` | `.work/bin/work-view` exists and is executable |

Route on the result:

| Condition | Mode | Notes |
|---|---|---|
| `--shape` was passed AND `substrate_root` is false | **bootstrap** | Forced source-shape bootstrap. |
| `--shape` was passed AND `substrate_root` is true | halt | "Substrate already bootstrapped at `.work/`. Remove it first to force a re-bootstrap, or drop `--shape` to sync." |
| `--update` was passed AND `substrate_root` is false | halt | "No substrate found. Run `convert` (without `--update`) to bootstrap." |
| `--update` was passed AND `substrate_root` is true | **sync** | Explicit sync. |
| No args AND `substrate_root` is false | **bootstrap** | Standard fresh project flow. |
| No args AND `substrate_root` is true | **sync** | Auto-sync. Log the decision: "Substrate detected at `.work/` — running in sync mode. Use `--shape` after removing `.work/` if you want a re-bootstrap." |

When in **bootstrap mode**, continue with Phase 1.6. When in **sync mode**, skip
Phase 1.6, run Phase 1.7 and Phase 1.8, then jump to the Sync Workflow section
below.

### Phase 1.6 (bootstrap only): Check for in-flight working-tree work

Run `git status --porcelain` and note the count of changed/untracked files.
If > 5, this is a "dirty repo bootstrap" — uncommitted work needs to be
captured into the substrate alongside the migration, otherwise autopilot
will have nothing to drain right after bootstrap. See Phase 8.5 for
capture handling.

### Phase 1.7: Discover legacy, duplicate, and overlapping artifacts

Before any bootstrap or sync writes, run the **detection sweep** from
[`references/legacy-overlap-migration.md`](references/legacy-overlap-migration.md).
Do not probe a hardcoded path list — enumerate and classify:

1. **Legacy tracking docs** (fixed candidates are fine here, they're not
   skills): `docs/designs/`, `docs/designs/completed/`, `docs/ROADMAP.md`,
   `docs/PROGRESS.md`, `TODO.md`, `BACKLOG.md`, `NOTES.md`, `tasks/`.
2. **Agent entrypoints**: regular-file `CLAUDE.md`, `.claude/CLAUDE.md`,
   `.agents/CLAUDE.md`, plus the AGENTS candidates from Phase 2.5.
3. **Skill-root sweep**: `ls -d .agents/skills/*/ .claude/skills/*/` and
   `ls .claude/rules/*.md`. For each entry, read its header (name +
   description) and classify it via the taxonomy in the reference:
   `canonical` / `plugin-mirror-symlink` / `plugin-mirror-divergent-copy` /
   `bespoke` / `unrelated` (project skills that mirror no plugin concept — left
   untouched). Diff the actual contents of any `.agents` vs `.claude` pair —
   duplicated-but-drifted copies in both roots are a real shape this repo has
   hit, and a fixed-path check never finds them.
4. **Overlap flags**: mark any `bespoke` entry that mirrors a plugin-owned
   concept, instructs writing a standalone plan doc, or is a user-invocable
   command superseded by a plugin gate (see the reference's overlap-candidate
   rules). These become the convergence question in Phase 1.8.

Record the classified inventory in the run notes (and `MIGRATION_REPORT.md` for
bootstrap). If the sweep finds nothing legacy, duplicate, or overlapping, set
`cleanup_scope: preserve-only`, note "no convergence candidates", and continue.

### Phase 1.8: Decisions checkpoint

Surface the real decisions the sweep uncovered. Ask only the questions that
apply — skip any whose trigger condition is absent.

**1. Entrypoint model (ask only when a healthy `CLAUDE.md` exists and there is
no `AGENTS.md` at any candidate location — i.e. a Claude-native repo).** Flipping
a working repo's source of truth is disruptive and must be explicit. This is a
dual-marketplace repo, so a root-readable `AGENTS.md` is required either way;
the genuine toggle is what happens to `CLAUDE.md`:

> "This is a healthy Claude-native repo with no `AGENTS.md`. Codex needs a
> root-readable `AGENTS.md` regardless — how should `CLAUDE.md` relate to it?"

- **Adopt AGENTS-canonical (Recommended)** — migrate `CLAUDE.md` content into a
  new root `AGENTS.md` (the source of truth), then point `CLAUDE.md` at it via
  symlink/shim.
- **Keep CLAUDE.md as the content source** — `CLAUDE.md` stays the file the team
  edits; create a thin root `AGENTS.md` pointer/shim so Codex can read it.

Record as `entrypoint_model: agents-canonical | claude-source`.

**Deriving the model when not asking** (so it persists across reruns):
- **Sync / already-converted repo** — if Phase 1.5 found the managed section in
  `CLAUDE.md`, set `entrypoint_model: claude-source`; if it's in `AGENTS.md`, set
  `agents-canonical`. Never re-flip a converted repo by defaulting — honor the
  shape it already has.
- **Bootstrap, trigger absent** (an `AGENTS.md` already exists, or there's no
  `CLAUDE.md`) — default silently to `agents-canonical`.

**2. Per-overlap convergence (ask only when Phase 1.7 flagged ≥1 `bespoke`
overlap OR ≥1 `plugin-mirror-divergent-copy`).** Batch ALL such entries into a
**single `multiSelect` question** — do not ask one question per skill. For each
entry, name the artifact, what it mirrors, and the canonical destination from
the mapping table. Both buckets feed the same `converge` set: `bespoke` entries
migrate to canonical; `plugin-mirror-divergent-copy` entries get their unique
content reconciled into `.agents` and the mirror re-established.

> "Found artifacts that should converge to the canonical layout. Which should I
> converge? (Unselected stay untouched.)"
>
> Options (one per detected entry):
> - `structural-refactor → refactor-conventions (.agents/skills/refactor-conventions/)`
> - `extract-patterns → gate-patterns (.agents/skills/patterns/)` — **removes the `/extract-patterns` command**
> - `patterns (drifted copies in .agents + .claude) → reconcile into .agents, re-mirror`
> - …

Record the chosen set as `converge: [<artifact>, …]`. Converging an artifact
that backs a user-invocable command means that command goes away — call this out
explicitly in the option description so the user is opting into losing a slash
command they type. `canonical`, `plugin-mirror-symlink`, and `unrelated` entries
are never offered here — they need no convergence.

**3. Cleanup scope (always ask when any legacy/duplicate/overlap candidate
exists).**

> "Beyond converging the artifacts above, how much cleanup of the *old* files is
> in scope?"

- **Preserve all (Recommended)** — add/refresh/converge artifacts and import
  useful legacy content, but do not delete, move, or replace existing legacy
  files (convergence still writes the new canonical copy; the old file stays).
- **Generated only** — may replace known generated duplicate/shim/mirror files
  with current symlinks or shims after preserving/importing content.
- **Legacy cleanup** — may also remove or move old tracking artifacts and
  converged-away bespoke skills, but only after a second confirmation listing
  exact paths.

Record as `cleanup_scope: preserve-only | generated-only | legacy-cleanup`
(`legacy-cleanup` includes generated cleanup).

**Reference integrity is mandatory regardless of `cleanup_scope`.** Before any
`git mv` / `git rm` / replace-with-symlink / replace-with-shim, follow the
reference-integrity-on-move procedure in the reference: grep the repo for
inbound references (especially `.work/` items and `docs/`), then rewrite them or
leave a redirect shim, and report which. Never strand a live pointer. Every
destructive action still needs an exact path list in the plan; prefer `git mv`
to a clearly named legacy location for retention, `git rm` only for paths the
user explicitly chose to delete, and never broad globs.

### Phase 2: Detect project shape

Detection signals (first match wins):

| Shape | Signal |
|---|---|
| `workflow-plugin` | `docs/designs/` exists OR `docs/ROADMAP.md` exists OR `docs/PROGRESS.md` exists |
| `ad-hoc` | `TODO.md`, `BACKLOG.md`, `NOTES.md`, or `tasks/` exists at repo root |
| `no-tracking` | Source code exists (`src/`, `lib/`, `app/`, etc.) but no tracking files |
| `greenfield` | No source code, only README and config files |

If `--shape` was passed, use it directly.

### Phase 2.5: Resolve agent instruction files

Instruction files can appear at the repo root or under agent-specific
directories. Detect all of these before writing:

- AGENTS candidates: `AGENTS.md`, `.agents/AGENTS.md`, `.claude/AGENTS.md`
- Claude candidates: `CLAUDE.md`, `.claude/CLAUDE.md`, `.agents/CLAUDE.md`
- Legacy Claude rules candidates: any `.claude/rules/*.md`

**The "canonical instruction file" is set by `entrypoint_model` (Phase 1.8).**
Everywhere this skill says "the selected AGENTS target," read it as "the
canonical instruction file" resolved here. The managed agile-workflow section,
the conventions, and all imported content go into the canonical instruction
file; the *other* entrypoint becomes a pointer to it (Phase 7).

- **`entrypoint_model: agents-canonical`** (default) — the canonical instruction
  file is an AGENTS target, chosen by this precedence:
  1. If `AGENTS.md` exists at the repo root, use it.
  2. Else if `.agents/AGENTS.md` exists, use it and create `AGENTS.md` as a
     symlink to `.agents/AGENTS.md` when possible.
  3. Else if `.claude/AGENTS.md` exists, use it and create `AGENTS.md` as a
     symlink to `.claude/AGENTS.md` when possible.
  4. Else create root `AGENTS.md`.
- **`entrypoint_model: claude-source`** — the canonical instruction file is the
  existing root `CLAUDE.md` (the team keeps editing it). Create root `AGENTS.md`
  as a symlink to `CLAUDE.md` so Codex reads the same content. If symlinks are
  unavailable, write a root `AGENTS.md` shim that points readers at `CLAUDE.md`.
  Do NOT migrate `CLAUDE.md` into an AGENTS file or replace it in this mode.

If symlinks are unavailable in `agents-canonical` mode, keep the existing nested
AGENTS file as the content source and write a root `AGENTS.md` shim or copy that
clearly points to the canonical nested file. Codex needs a root-readable
`AGENTS.md`; do not leave only a nested file unless the project has explicitly
configured that fallback.

Legacy `.claude/rules/*.md` files (e.g. `patterns.md`) are not separate
canonical rules targets, and `patterns.md` in particular is **not** a
single-destination file. When any such file exists, classify its *content* and
route each part to its canonical owner (per the DIY→canonical mapping in the
reference):

- **Structural-pattern definitions** (recurring code shapes with examples) →
  `.agents/skills/patterns/`, deferring to `gate-patterns` Phase 1 for layout.
  Do not paste these into AGENTS.
- **Project style / agent-rule prose** → the selected AGENTS target.

Never dump a whole rules file into AGENTS under a generic heading — that
contradicts the canonical layout convert advertises in Phase 6. Non-pattern
`.claude/rules/*.md` files are project style/agent rules: route their prose to
the canonical instruction file. Preserve only non-duplicate content. Replace any
`.claude/rules/*.md` with a short shim only when `cleanup_scope` allows generated
cleanup or the user confirms that exact path, and only after the
reference-integrity check (Phase 1.8) clears the move; otherwise leave it in
place and report it as legacy content that was imported. Do not create
`.claude/rules/*.md` files that don't already exist.

### Phase 3: Conventions interview

Run an interactive interview via AskUserQuestion. Five questions, in order:

1. **Release mapping** — `branch-held | tag-based | release-branch | none`. Default
   offered: `tag-based`. Always asked.
2. **Tag taxonomy** — propose a starter set based on detected project type
   (e.g., for a web app: `[security, perf, refactor, content, infra]`). User can
   confirm or edit. Each tag gets a one-line semantic.
3. **Slug conventions** — defaults to kebab-case with parent-prefix for children.
4. **Stage overrides** — none by default. Discouraged.
5. **Gate config** — defaults to
   `gates_for_release: [security, tests, cruft, docs, patterns]`. User can reorder
   or omit.

### Phase 4: Create substrate skeleton

```bash
mkdir -p .work/active/epics .work/active/features .work/active/stories
mkdir -p .work/backlog .work/releases .work/archive .work/bin
```

Install `work-view` from the plugin to the project (selects the platform-matched
prebuilt binary if available, falls back to the bash script):

```bash
bash "${PLUGIN_ROOT:-${CLAUDE_PLUGIN_ROOT}}/scripts/install-work-view.sh"
```

(If neither `PLUGIN_ROOT` nor `CLAUDE_PLUGIN_ROOT` is exposed in the agent's shell
environment, locate the plugin source via the active skill/plugin path or manifest.)

### Phase 5: Write CONVENTIONS.md

Write `.work/CONVENTIONS.md` from the interview answers, following the format in SPEC.md.

### Phase 6: Write the canonical AGENTS.md section

The selected AGENTS target is the canonical project instruction file for
agile-workflow. Write or refresh the agile-workflow section between HTML
comment markers:

```markdown
<!-- agile-workflow:start -->
## Agile-Workflow Substrate

Work tracked in `.work/` as markdown items with YAML frontmatter
(`kind, stage, tags, parent, depends_on, release_binding`).
Layout: `.work/active/{epics,features,stories}/`, `.work/backlog/`,
`.work/releases/<version>/`, `.work/archive/`.

**Primary query tool:** `.work/bin/work-view` filters by stage, tag, kind,
parent, and dependency. Common patterns:
- `work-view --ready` — items ready to work (deps satisfied)
- `work-view --stage review` — items waiting on user
- `work-view --parent <id>` / `--blocking <id>` — hierarchy / sequencing
- `work-view --help` for the full flag set

Foundation docs in `docs/` describe the system NOW — never add legacy notes;
git history is the audit trail. Item files are the durable state: update the
body with implementation discoveries, review findings, blockers, and decisions
instead of relying on chat history.

Project-level agent rules live in this file (the canonical agent instruction
file). Do not create or maintain `.claude/rules/*.md` as a source of truth;
reusable structural patterns belong in `.agents/skills/patterns/`.

Project-specific refactor style conventions belong in this file under
`## Refactor Style Conventions`. Detailed refactor convention references belong
in `.agents/skills/refactor-conventions/` and extend `refactor-design`'s
defaults; they do not replace the built-in scan and they do not create
standalone plan docs.

### Tag semantics

The `tags` field on items routes them to the right design skill. One tag has
load-bearing semantics — get this one right:

- **`[refactor]`** — behavior-preserving structural change ONLY. Apply the
  black-box test: would any observable behavior change for a caller of the
  public surface? If yes, this is NOT a refactor — drop the tag and let the
  item route through `feature-design`.
  - Counts as refactor: extract a helper to dedupe, split a god file, rename
    for clarity, remove dead code, inline a one-call abstraction.
  - Does NOT count as refactor (even if it feels "structural"): change an API
    signature, swap a storage backend with different consistency guarantees,
    replace a silent failure with an explicit error, split a function in a
    way that changes call-site contracts, "major rework of X."
- **`[perf]`** — performance work. Routes to `perf-design`.

All other tags are project-specific (see `.work/CONVENTIONS.md`) and do not
affect skill routing.

### Test integrity

When running, writing, or modifying tests:

- **File real production bugs as backlog items.** When a test failure
  surfaces an actual product bug (not a stale fixture, drifted assertion,
  or broken mock), park it via `/agile-workflow:park` instead of silently
  fixing it inline mid-test-pass. The backlog item is the audit trail.
- **Fix bad tests in-session.** Stale fixtures, drifted assertions, broken
  mocks, and outdated snapshots are test debt, not product bugs. Repair
  them as you go so the suite stays meaningful.
- **Then drain small backlog bugs with a full pass.** Once tests are
  green again, if a parked production bug is small enough for a single
  stride, pick it up immediately as `/agile-workflow:scope` → design →
  implement. Larger bugs stay in backlog for prioritization.
- **NEVER game a test to make it pass.** A failing test that documents
  *why* it fails — an inline comment naming the bug, a `skip` linked to a
  backlog id, an `xfail` with a reason — is more honest than a green test
  that lies. No `expect(true).toBe(true)`, no asserting on whatever the
  code happens to return, no deleting a test as "flaky" without
  root-causing first.

Cross-model advisory review: explicit user/project review instructions
override agile-workflow defaults. When peeragent is available with a different
model class, large/risky autopilot design decisions may use one advisory pass;
small/low-risk work skips it. Autopilot also runs a final peer-review loop
before reporting completion and fixes or files accepted findings first.
Same-model peers fall back to local sub-agents instead.

Broad entry points:
`/agile-workflow:ideate`, `/agile-workflow:epicize`,
autopilot goals such as "Use agile-workflow autopilot to drain --all",
and `/agile-workflow:release-deploy`.
<!-- agile-workflow:end -->
```

Preserve all content outside the markers. If the selected AGENTS target does
not exist, create it with this section as the whole body.

### Phase 7: Preserve Claude Code compatibility

The canonical instruction file (Phase 2.5) is canonical. The *other* entrypoints
are compatibility pointers and should not become independent copies.

**`entrypoint_model: claude-source` carve-out.** When the user chose to keep
`CLAUDE.md` as the content source, `CLAUDE.md` IS the canonical instruction file
and root `AGENTS.md` is its pointer (created in Phase 2.5). In this mode, do NOT
migrate `CLAUDE.md` into AGENTS, do NOT replace `CLAUDE.md` with a symlink, and
do NOT import its content elsewhere — the managed section and conventions were
written into `CLAUDE.md` itself. Still normalize any *nested* Claude duplicates
(`.claude/CLAUDE.md`, `.agents/CLAUDE.md`) to point at `CLAUDE.md`. Skip the
rest of this phase's root-`CLAUDE.md` handling.

In the default `agents-canonical` mode, handle every detected Claude candidate
(`CLAUDE.md`, `.claude/CLAUDE.md`, `.agents/CLAUDE.md`) as follows:

1. If the file is already a symlink to the selected AGENTS target or to root
   `AGENTS.md`, leave it alone.
2. If it exists as a regular file, read it before touching it.
   - If it contains an old agile-workflow marked section, migrate that section's
     current content into the selected AGENTS target only when it contains user
     edits not already present there.
   - Preserve non-agile Claude instructions by importing them into the selected
     AGENTS target under a short `## Imported Claude Code Instructions` heading,
     unless the same content is already present.
   - After import, replace the Claude file with a symlink to the selected
     AGENTS target only when `cleanup_scope` allows generated cleanup or the
     user confirms that exact path. Otherwise leave it in place and report the
     duplicate entrypoint.
3. If symlink creation is unavailable or unsafe in the environment, write this
   shim instead only when the same cleanup authorization exists. Otherwise leave
   the file in place and report it as a duplicate entrypoint:

   ```markdown
   # Claude Code Instructions

   Canonical agent instructions live in AGENTS.md. Read that file.
   ```

The sync path follows the same rule: refresh the canonical instruction file's
managed section in place, then keep the other entrypoint pointing at it through a
symlink or shim — in the direction set by `entrypoint_model` (default
`CLAUDE.md`→`AGENTS.md`; `claude-source` keeps `AGENTS.md`→`CLAUDE.md`). In
`claude-source`, refreshing `CLAUDE.md`'s managed section in place is expected;
what never happens is migrating its content out or replacing the file with a
pointer.

Handle every legacy `.claude/rules/*.md` file (not just `patterns.md`) as a
legacy Claude rules file, not a compatibility entrypoint, and **route its
content by type** (see Phase 2.5 and the DIY→canonical mapping in the
reference) — do not dump it wholesale into AGENTS:

1. If it exists as a regular file with content not already present at the
   canonical destination:
   - **Structural-pattern definitions** (chiefly in `patterns.md`) → write to
     `.agents/skills/patterns/`, deferring to `gate-patterns` Phase 1 for layout
     and index.
   - **Project style / agent-rule prose** (the common case for other rules
     files) → import into the canonical instruction file under a short
     `## Imported Claude Pattern Rules` heading.
2. Replace the rules file with the shim below only when `cleanup_scope` allows
   generated cleanup or the user confirms that exact path, and only after the
   reference-integrity check (Phase 1.8) has rewritten or shimmed any inbound
   references to it:

   ```markdown
   # Pattern Rules

   Canonical project rules live in the canonical agent instruction file;
   reusable code patterns live in `.agents/skills/patterns/`. Read those.
   ```

3. If the file is already a symlink or shim that points to the canonical
   instruction file, leave it
   alone.

### Phase 8: Per-shape migration

Per the matrix in MIGRATION.md, seed initial items:

#### Path A — workflow-plugin

**Per-design stage classification** (NOT a binary "active vs completed" split).
For each `docs/designs/<name>.md` AND each `docs/designs/completed/<name>.md`,
read the design body and `git log -- <path>` to infer state, then classify it
into one of five buckets:

| Bucket | Substrate placement | Frontmatter |
|---|---|---|
| `done-shipped` | `.work/releases/v0/feature-<name>.md` | `kind: feature, stage: done, release_binding: v0` |
| `done-archived` | `.work/archive/feature-<name>.md` | `kind: feature, stage: done` |
| `review` | `.work/active/features/feature-<name>.md` | `kind: feature, stage: review` |
| `implementing` | `.work/active/features/feature-<name>.md` | `kind: feature, stage: implementing` |
| `drafting` | `.work/active/features/feature-<name>.md` | `kind: feature, stage: drafting` |

Heuristics for inferred default (use these to pre-fill the per-design ask):
- In `docs/designs/completed/`, recent git activity, no obvious uncommitted
  follow-up → `done-shipped`
- In `docs/designs/completed/`, stale, no real adoption signal → `done-archived`
- In `docs/designs/`, code exists for it but tests/PRs pending → `review`
- In `docs/designs/`, code partially landed → `implementing`
- In `docs/designs/`, no code yet → `drafting`

Ask the user to confirm/edit the classification per design via AskUserQuestion
(group designs by inferred bucket if there are many, to keep the question count
under 4-options-per-call). The body of each new feature item = the original
design content.

If the user picks any `done-shipped` items, also create
`.work/releases/v0/release-v0.md` at `stage: released` to bind them.

For `docs/ROADMAP.md` phases:
1. Each phase becomes an epic at `.work/active/epics/epic-phase-<n>-<slug>.md`.
2. Stage inference from per-design classifications: if every child design under
   the phase is at `done-*`, the epic is at `stage: done` and goes to
   `.work/archive/epics/`. If any child is `implementing` or `review`, epic is
   at `stage: implementing`. Otherwise `stage: drafting`.
3. Phase ordering becomes `depends_on` chains (phase 2 depends on phase 1, etc.).
4. Confirm with the user via AskUserQuestion before committing.

For `docs/PROGRESS.md` deviation logs: fold notes into relevant items' bodies.

By default, leave alone: `docs/designs/`, `docs/designs/completed/`,
`docs/ROADMAP.md`, `docs/PROGRESS.md`. They become legacy history.

If `cleanup_scope: legacy-cleanup`, build a separate cleanup plan after item
creation:

1. List the exact legacy paths that are fully represented in `.work/`.
2. Ask the user whether to keep, move, or delete them.
3. Apply only the confirmed path actions. Prefer `git mv` when the user wants a
   retained legacy copy; use `git rm` only for paths explicitly chosen for
   deletion.

#### Path B — ad-hoc

For each `- [ ]` line in `TODO.md` / `BACKLOG.md`: create
`.work/backlog/idea-<slug>.md` with minimal frontmatter and body = the line text.

For each section heading or file in `NOTES.md` / `tasks/`: create
`.work/backlog/idea-<slug>.md` with body = the section/file content.

`- [x]` lines are reported but not seeded by default (offer to user).

No epic decomposition or dependency inference. User runs `/agile-workflow:epicize`
afterward.

#### Path C — no-tracking

Bootstrap an empty `.work/` skeleton. Optionally seed sparse backlog from recent
`git log` activity if the user opts in:

> "Found 3 areas with recent commits: src/auth (12), src/payments (8), src/admin
> (3). Seed any as backlog ideas to revisit?"

#### Path D — greenfield

Bootstrap empty `.work/`. Suggest running `/agile-workflow:epicize` next to seed
epics from the foundation docs.

### Phase 8.5: Capture in-flight working-tree work

Skip if Phase 1.6's `git status --porcelain` count was ≤ 5 (small changes go
into the bootstrap commit itself).

Otherwise, capture the in-flight code as substrate items so autopilot has
something to drain after bootstrap:

1. **Cluster** the changed files. Start with path grouping plus `git diff
   --stat`; if the changed set is still small enough to inspect directly, read
   the relevant diffs yourself. For large or unclear sets, use a read-only
   Explore sub-agent: "Categorize these <N> files into 1-5 coherent feature
   buckets by path, imports, and diff content. Report each as slug +
   one-paragraph description + file list." Pass `git status --porcelain` and
   `git diff --stat` as the sub-agent's context rather than dumping many full
   diffs into the prompt.
2. **Confirm with the user** via AskUserQuestion (groups of 2-4 buckets if
   there are many). Allow merge / split / rename.
3. **Scope each cluster** as `.work/active/features/feature-<slug>.md` with
   `kind: feature, stage: implementing`, body = brief + "Files in this
   cluster" list + "Design captured retroactively from existing code". No
   parent or deps unless obvious.
4. **Bootstrap commit stays substrate-only** — don't commit the working-tree
   code yet. `implement`'s land mode (Phase 4a) handles validate-commit-advance
   per cluster after bootstrap.

### Phase 8.6: Converge bespoke overlaps

For each artifact in the `converge` set chosen in Phase 1.8, migrate it to its
canonical destination (DIY→canonical mapping in the reference), deferring to the
owning skill for layout:

- **Pattern-mirroring skills** (`extract-patterns`, bespoke `patterns`) →
  fold their pattern definitions into `.agents/skills/patterns/` per
  `gate-patterns` Phase 1; keep an optional `.claude/skills/patterns/` symlink
  mirror.
- **Refactor-mirroring skills** (`structural-refactor`, `stylistic-refactor`,
  bespoke `refactor-conventions`) → split into AGENTS
  `## Refactor Style Conventions` (style rules) and
  `.agents/skills/refactor-conventions/` (detailed references) per
  `refactor-conventions-creator` Phase 5; drop any standalone-plan-doc
  instruction.
- **`plugin-mirror-divergent-copy` entries** → reconcile unique content into
  the `.agents` canonical, then re-establish the `.claude` mirror as a symlink.

Removing or replacing the bespoke source path is a destructive action: apply the
reference-integrity-on-move procedure first (grep for inbound references —
especially `.work/` items and `docs/` — then rewrite or shim), and only remove
the original when `cleanup_scope` allows it and the exact path is confirmed.
Otherwise write the canonical copy and leave the bespoke source in place,
reporting the duplication. If a converged artifact backed a user-invocable
command, note in `MIGRATION_REPORT.md` that the command is superseded.

### Phase 9: Write MIGRATION_REPORT.md

Write `MIGRATION_REPORT.md` at the repo root (NOT in `docs/`) per the format in
MIGRATION.md. Include: source shape, foundation docs detected (preserved), items
seeded by tier, the classified artifact inventory from Phase 1.7, entrypoint
model chosen, bespoke overlaps converged (with their canonical destinations and
any superseded commands), reference-integrity actions (paths moved/removed,
references found, rewritten vs shimmed), cleanup scope, files left in place,
cleanup actions taken, conventions chosen, next steps.

### Phase 10: Commit

Single git commit:

```bash
git add .work/ AGENTS.md .agents/AGENTS.md .claude/AGENTS.md CLAUDE.md .claude/CLAUDE.md .agents/CLAUDE.md MIGRATION_REPORT.md
# If a legacy rules shim was created or updated:
git add .claude/rules/
# If Phase 8.6 converged bespoke overlaps into the canonical catalogs:
git add .agents/skills/patterns .claude/skills/patterns .agents/skills/refactor-conventions .claude/skills/refactor-conventions
# If reference-integrity rewrote inbound references in existing items/docs:
git add .work/ docs/
# If cleanup was explicitly confirmed for exact paths:
git add -A <confirmed-cleanup-paths>
git commit -m "chore: bootstrap agile-workflow substrate"
```

User reverts via `git revert HEAD` if anything looks wrong. Source files are
preserved across all paths unless the user explicitly opted into cleanup and
confirmed exact paths.

## Sync Workflow

Entered via auto-detection when `.work/` exists, or explicitly via `--update`.
Non-destructive by default — refreshes plugin-shipped artifacts and reports
drift. Sync runs the same Phase 1.7 discovery sweep and Phase 1.8 decisions
checkpoint as bootstrap; convergence and cleanup run only when those steps put
them in scope.

### Phase S1: Audit substrate health

Re-use the marker checks from Phase 1.5 and the **classified artifact
inventory** from the Phase 1.7 discovery sweep (do not re-derive from a fixed
path list), plus deeper checks:

- All five markers (`substrate_root`, `conventions`, `managed_section`,
  `entrypoint_compat`, `work_view`) — present or missing
- Legacy `.claude/rules/patterns.md` — absent, shimmed to AGENTS, or containing
  importable legacy content (route by content type per Phase 2.5)
- Every skill-root entry from the Phase 1.7 sweep, carried with its taxonomy
  bucket (`canonical` / `plugin-mirror-symlink` / `plugin-mirror-divergent-copy`
  / `bespoke` / `unrelated`). Pay attention to `plugin-mirror-divergent-copy` —
  drifted duplicates in both `.agents` and `.claude` — and to `bespoke` overlaps
  that are convergence candidates, not just the canonical `patterns` and
  `refactor-conventions` catalogs. `unrelated` project skills are left untouched.
- Cleanup candidates, `entrypoint_model`, `converge` set, and `cleanup_scope`
  from Phase 1.8
- For each plugin-shipped artifact that IS present, compare its content against
  the version in the current plugin source:
  - The selected AGENTS target section between `<!-- agile-workflow:start -->` /
    `<!-- agile-workflow:end -->` vs the canonical template in Phase 6
  - `.work/bin/work-view` — check existence and executability (the `work_view`
    doctor marker). Do NOT compare bytes against `work-view.sh`; the installed
    file may be a prebuilt binary placed by `install-work-view.sh`, which is
    legitimately different from the bash fallback script. If `.work/bin/work-view`
    is absent or not executable, classify as `missing` and re-run the installer.
  - `CLAUDE.md` compatibility state (symlink/shim/legacy copy)
  - `.claude/rules/patterns.md` state (legacy content vs AGENTS shim)
  - `.work/CONVENTIONS.md` load-bearing tag entries (see below). The rest of
    CONVENTIONS is user-owned and untouched.
  - `.agents/skills/refactor-conventions/SKILL.md` wrapper shape when present:
    current catalog shape vs old generated template that writes standalone
    `.md` refactoring plans. Rule reference files are user-owned.
  - `.claude/skills/patterns/` and `.claude/skills/refactor-conventions/`
    mirror state: absent, symlink to `.agents`, byte-for-byte mirror, or
    divergent copy.

**Load-bearing tag drift in CONVENTIONS.md.** CONVENTIONS is user-owned, but a
narrow subset of its content — the entries for routing tags (`refactor`,
`perf`) — has plugin-defined semantics. When those entries match a known prior
plugin default verbatim, treat them as plugin-shipped drift candidates.

Known prior defaults to recognize:
- `refactor    structural cleanup, no behavior change` (verbatim, any leading
  `- `)
- `refactor    structural cleanup` (older terser variant)
- `perf        throughput, latency, memory` (without the routing note)

Detection rule for each load-bearing tag line:
- Line matches a known prior default verbatim → `drift_plugin` (offer refresh)
- Line is user-customized (any divergence from known defaults) → `match`
  (treat as intentional; do not touch)
- Line is absent entirely → `missing` (offer to add the canonical entry)

The current canonical entries live in `docs/SPEC.md` under
"`.work/CONVENTIONS.md` → Tag taxonomy" and must be kept in sync with that
template.

Classify each artifact as one of:

| State | Meaning |
|---|---|
| `match` | Installed bytes match the plugin's current canonical version. No-op. |
| `drift_plugin` | Installed version differs because the plugin moved forward. Refresh. |
| `drift_user` | Installed version differs because the user edited it. Ask. |
| `missing` | Marker absent. Install fresh. |

Heuristic for `drift_plugin` vs `drift_user` on the managed section: if the
installed text matches a known prior plugin release's template (recognisable
shape, just older content), assume `drift_plugin`. Otherwise treat as
`drift_user` and ask. The entrypoint-compatibility heuristic follows the derived
`entrypoint_model`: in `agents-canonical`, if a Claude candidate has legacy
content not yet in `AGENTS.md`, import it before replacing the Claude file with a
symlink/shim; in `claude-source`, `CLAUDE.md` is canonical, so import nothing out
of it and only verify root `AGENTS.md` points at it.

If `.claude/rules/patterns.md` is absent, treat the legacy-rules state as
`match` and take no action. If it contains non-shim content not yet present at
its canonical destination, **route by content type per Phase 2.5** before
replacing the file with the shim: structural-pattern definitions →
`.agents/skills/patterns/` (defer to `gate-patterns` Phase 1); project
style/agent-rule prose → the canonical instruction file. Do not import the whole
file into AGENTS. Treat user-edited or ambiguous content as `drift_user` and ask
before routing; treat old generated pattern-rules content as `drift_plugin`.
Apply the same content-routing to any other `.claude/rules/*.md`.

**Refactor-conventions catalog alignment.** This catalog is optional. If absent
from both `.agents` and `.claude`, treat it as `match` and do not create it.
When present:

- `.agents/skills/refactor-conventions/` is canonical.
- `.claude/skills/refactor-conventions/` is only a compatibility mirror.
- If only the Claude copy exists, classify as `drift_plugin` when it matches a
  known generated template; otherwise classify as `drift_user` and ask before
  copying it into `.agents`.
- If both copies exist and differ, classify as `drift_user`; ask whether to
  merge unique rule references into `.agents`, prefer `.agents`, or leave both.
- If the `.agents` `SKILL.md` contains the old generated instruction to write a
  standalone `.md` refactoring plan, classify only the wrapper as
  `drift_plugin`. Refresh the wrapper/index shape, but preserve
  `references/style/` and `references/structure/` content.
- If the catalog has style rule references but the selected AGENTS target lacks
  `## Refactor Style Conventions`, classify as `missing` and ask whether to
  synthesize concise AGENTS entries from the catalog. Do not invent style rules
  when the catalog lacks them.

### Phase S2: Plan the sync

Produce a per-artifact plan: what's `match` (skip), what's `drift_plugin`
(auto-refresh), what's `drift_user` (ask before overwriting), what's `missing`
(install).

Also produce a cleanup plan, even if the answer is "none":

- **Out of scope** — candidates found but preserved because
  `cleanup_scope: preserve-only`.
- **Generated cleanup candidates** — generated duplicate files/mirrors that can
  be replaced by symlinks/shims if `cleanup_scope` allows it.
- **Legacy cleanup candidates** — old tracking docs or task files that can be
  moved or removed only under `cleanup_scope: legacy-cleanup` and after exact
  path confirmation.

If every artifact is `match`, the sync is a true no-op — log "Substrate already
up to date. No changes." If cleanup candidates exist but cleanup is out of
scope, still report them as preserved and return without committing.

If anything would change, summarise the plan and (when running interactively)
confirm before applying.

### Phase S3: Apply refreshes

For each artifact with a non-`match` state:

- Canonical instruction file section between markers — overwrite with the
  canonical template from Phase 6, in whichever file holds it per the derived
  `entrypoint_model` (`AGENTS.md` or, for `claude-source`, `CLAUDE.md`). If the
  file lacks markers, append the section. If it doesn't exist, create it.
- `.work/bin/work-view` — reinstall via
  `bash "${PLUGIN_ROOT:-${CLAUDE_PLUGIN_ROOT}}/scripts/install-work-view.sh"`
  (selects the platform-matched prebuilt binary if available, falls back to the
  bash script)
- Entrypoint compatibility — refresh the pointer in the direction set by
  `entrypoint_model`:
  - `agents-canonical` — import legacy generated content from any detected
    Claude candidate into `AGENTS.md`, then replace the Claude file with a
    symlink/shim to it only when `cleanup_scope` allows generated cleanup or the
    user confirms that exact path.
  - `claude-source` — `CLAUDE.md` is the canonical instruction file: its managed
    section between markers IS refreshed in place (handled by the canonical-file
    step above), but its content is never migrated out and the file is never
    replaced by a pointer. Here, only ensure root `AGENTS.md` is a symlink/shim
    pointing at `CLAUDE.md`, and normalize nested Claude duplicates to point at
    `CLAUDE.md`.
  If symlinks are unavailable, write the Phase 7 shim under the same cleanup
  authorization.
- Legacy `.claude/rules/*.md` — only when present, route non-duplicate content
  by type per Phase 2.5 (structural patterns → `.agents/skills/patterns/`;
  style/agent-rule prose → the canonical instruction file), then replace the
  file with the Phase 7 shim only when cleanup is authorized for that exact path
  and after the reference-integrity check. Never import the whole file into
  AGENTS.
- Optional pattern and refactor-conventions mirrors — align `.claude/skills/*`
  to `.agents/skills/*` when the `.agents` catalog exists and the Claude copy is
  absent, a symlink, or a known generated mirror, and cleanup is in scope for
  generated mirrors. If the Claude copy contains unique user content, ask before
  import or replacement.
- Refactor-conventions wrapper — when `.agents/skills/refactor-conventions/`
  exists and its `SKILL.md` is a known old generated template, rewrite only
  `SKILL.md` to the current catalog/index shape. Preserve all rule reference
  files and user-authored examples.
- Refactor style conventions in AGENTS — if missing but derivable from
  `.agents/skills/refactor-conventions/references/style/`, ask before adding a
  concise `## Refactor Style Conventions` section. If the user declines, leave
  the catalog intact and report the mismatch.
- Load-bearing tag entries in `.work/CONVENTIONS.md` — for each entry flagged
  `drift_plugin` or `missing` in Phase S1, ask the user via `AskUserQuestion`
  before rewriting:
  > "Your `.work/CONVENTIONS.md` has the old default text for the `[refactor]`
  > tag. The current plugin default tightens the definition to lock the
  > `refactor-design` vs `feature-design` routing — refresh it?"
  > Options: `Refresh to current default` / `Keep my current text` /
  > `Show me the diff first`.

  If the user accepts, replace just that line in CONVENTIONS.md (preserve
  everything else). Do NOT rewrite the whole tag taxonomy section — only the
  lines flagged as drift. If the entry was `missing`, append it in the Tag
  taxonomy section.

For `drift_user` items, only proceed after the user confirms.

For bespoke overlaps in the `converge` set, run Phase 8.6's convergence
(deferring to the owning skill for layout) — sync converges the same way
bootstrap does.

For cleanup candidates, only proceed when the candidate class is inside
`cleanup_scope`, then run the reference-integrity-on-move check (grep for
inbound references, rewrite or shim) and ask with exact paths before applying
any `git mv` or `git rm`. If the user declines, leave the files and report them
as preserved.

### Phase S4: Preserve user state

These are NEVER touched in sync mode:

- `.work/CONVENTIONS.md` user-customized content. The single exception is
  load-bearing tag entries (`refactor`, `perf`) when they match a known prior
  plugin default verbatim — those may be refreshed in Phase S3 with user
  confirmation. Everything else in CONVENTIONS — release mapping, project
  tags, slug conventions, gate config, any user prose — is untouched.
- Everything under `.work/active/`, `.work/backlog/`, `.work/releases/`,
  `.work/archive/`
- User-authored rule references under `.agents/skills/refactor-conventions/`.
  Sync may refresh the generated `SKILL.md` wrapper when it matches a known old
  template, but it must not rewrite rule bodies, examples, exceptions, or scope
  content without explicit confirmation.
- `.agents/skills/patterns/` pattern bodies. Sync may align mirrors, but
  `gate-patterns` owns pattern discovery and updates.
- Content in the canonical instruction file (`AGENTS.md`, or `CLAUDE.md` in
  `claude-source`) outside the agile-workflow markers, except imported legacy
  Claude content, imported legacy Claude pattern-rules content, and synthesized
  refactor style convention summaries the user confirms should become canonical
- `MIGRATION_REPORT.md` (a bootstrap artifact; sync never writes it)
- Any cleanup candidate outside the chosen `cleanup_scope`
- Any cleanup candidate not listed by exact path in the confirmed cleanup plan

### Phase S5: Commit

If any files were rewritten:

```bash
git add AGENTS.md .agents/AGENTS.md .claude/AGENTS.md CLAUDE.md .claude/CLAUDE.md .agents/CLAUDE.md .work/bin/work-view
# If any legacy rules shim was created or updated (not just patterns.md):
git add .claude/rules/
# If optional project skill catalogs or mirrors were aligned or converged:
git add .agents/skills/patterns .claude/skills/patterns .agents/skills/refactor-conventions .claude/skills/refactor-conventions
# If load-bearing CONVENTIONS tag entries were refreshed with user confirmation:
git add .work/CONVENTIONS.md
# If reference-integrity rewrote inbound references in existing items/docs:
git add .work/ docs/
# If cleanup was explicitly confirmed for exact paths:
git add -A <confirmed-cleanup-paths>
git commit -m "chore: agile-workflow sync"
```

Skip the commit entirely if Phase S3 produced no file changes.

## Output

After bootstrap:
- Brief summary in conversation: shape detected, items seeded by tier, conventions
  chosen, entrypoint model, bespoke overlaps converged, cleanup scope, cleanup
  and reference-integrity actions taken or preserved, next-step recommendation.
- Point at `MIGRATION_REPORT.md` for the full breakdown.

After sync (auto or `--update`):
- Per-artifact line: `match` / `refreshed (plugin drift)` / `refreshed (user
  drift, confirmed)` / `installed (was missing)` / `converged (bespoke overlap)`.
- Include optional artifact status for pattern-skill mirrors and
  refactor-conventions catalog/mirrors when present, plus any
  `plugin-mirror-divergent-copy` reconciliations.
- Include cleanup scope plus preserved / cleaned exact paths, and any
  reference-integrity rewrites or shims.
- If everything matched: one line — "Substrate already up to date. No changes."
- If anything changed: one line summary plus the commit sha.

## Guardrails

- **Bootstrap is a single-commit migration ALWAYS.** No partial states. If
  anything errors mid-run, rollback (no commit). User can re-run cleanly.
- Source files are preserved across all paths by default. Convert never deletes
  user content unless the user explicitly opted into cleanup and confirmed exact
  paths.
- Destructive cleanup is opt-in. Default to `cleanup_scope: preserve-only`.
- Never delete, move, or replace existing legacy artifacts unless cleanup is in
  scope and the exact path appears in the confirmed cleanup plan.
- Prefer `git mv` for retained legacy artifacts. Use `git rm` only when the user
  explicitly chose deletion for exact paths. Never use broad cleanup globs.
- **Reference integrity is mandatory before every move/remove, regardless of
  `cleanup_scope`.** Grep the repo (especially `.work/` items and `docs/`) for
  inbound references to any path being moved, removed, or replaced; then rewrite
  them or leave a redirect shim, and report which. Never strand a live pointer.
- **Discovery over checklist.** Enumerate and classify both skill roots and the
  rules tree; never assume the only overlaps are the canonical `patterns` and
  `refactor-conventions` catalogs. Bespoke skills mirroring plugin concepts,
  plan-doc generators, and superseded commands are convergence candidates.
- **Defer to the owning skill for canonical locations.** Convert places
  content; `gate-patterns` and `refactor-conventions-creator` own where it
  lives. Do not carry a divergent end-state (e.g. never dump pattern content
  into AGENTS).
- The conventions interview is mandatory in bootstrap mode. No silent inference
  of release mapping or tag taxonomy.
- Foundation docs are read-only from convert. They roll forward through `scope`,
  `design`, `implement`, NOT through bootstrap.
- **Sync mode never touches user-edited CONVENTIONS.md or substrate state.**
  Refresh is only for plugin-shipped artifacts.
- **Sync is non-destructive on user edits.** When an installed artifact looks
  like a user customisation (not a known prior plugin template), confirm before
  overwriting. Don't silently clobber.
- **Sync is idempotent.** Re-running plain `convert` on a healthy, up-to-date
  project is a true no-op — no commit, no edits, just a status line.
- Auto-detection is the default. Treat `--update` as documentation of intent,
  not as a different code path — it routes through the same Sync Workflow.
