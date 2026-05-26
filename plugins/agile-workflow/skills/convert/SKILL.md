---
name: convert
description: >
  Bootstrap or sync the agile-workflow substrate in a project. Detects current repo
  state (no substrate / partially set up / fully set up) and auto-routes: bootstrap
  mode for fresh projects (creates .work/ skeleton + CONVENTIONS.md + canonical
  AGENTS.md section + Claude compatibility symlink/shim + migration based on detected
  source shape), sync mode for
  projects that already have the substrate (refreshes plugin-shipped artifacts —
  AGENTS.md section, CLAUDE.md compatibility, .work/bin/work-view — while preserving
  user-owned CONVENTIONS.md and substrate state, and reports drift).
  Idempotent — re-running on a healthy project is a no-op sync. User-invocable only
  since substrate work is consequential and interactive.
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

## Arguments

- `convert` — auto-detect mode (recommended). Bootstraps if no substrate is
  present, otherwise syncs plugin artifacts and reports drift.
- `convert --update` — explicit sync. Identical to auto-sync; useful in scripts
  or when you want to assert intent.
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
| `agents_md_section` | The selected AGENTS target exists AND contains `<!-- agile-workflow:start -->` |
| `claude_compat` | Any detected Claude instruction entrypoint is a symlink/shim to the selected AGENTS target, OR contains the agile-workflow section for legacy installs |
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

When in **sync mode**, jump to the Sync Workflow section below. Otherwise
continue with Phase 2.

### Phase 1.6 (bootstrap only): Check for in-flight working-tree work

Run `git status --porcelain` and note the count of changed/untracked files.
If > 5, this is a "dirty repo bootstrap" — uncommitted work needs to be
captured into the substrate alongside the migration, otherwise autopilot
will have nothing to drain right after bootstrap. See Phase 8.5 for
capture handling.

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
- Legacy Claude rules candidates: `.claude/rules/patterns.md`

Choose the canonical AGENTS target:

1. If `AGENTS.md` exists at the repo root, use it.
2. Else if `.agents/AGENTS.md` exists, use it and create `AGENTS.md` as a
   symlink to `.agents/AGENTS.md` when possible.
3. Else if `.claude/AGENTS.md` exists, use it and create `AGENTS.md` as a
   symlink to `.claude/AGENTS.md` when possible.
4. Else create root `AGENTS.md`.

If symlinks are unavailable, keep the existing nested AGENTS file as the content
source and write a root `AGENTS.md` shim or copy that clearly points to the
canonical nested file. Codex needs a root-readable `AGENTS.md`; do not leave only
a nested file unless the project has explicitly configured that fallback.

Legacy `.claude/rules/patterns.md` is not a separate canonical rules target.
When it exists, preserve its non-duplicate content by importing it into the
selected AGENTS target, then replace the legacy file with a short shim pointing
agents at `AGENTS.md`. If it does not exist, do not create it.

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

Copy `work-view` from the plugin to the project:

```bash
cp "${PLUGIN_ROOT:-${CLAUDE_PLUGIN_ROOT:-.}}/scripts/work-view.sh" .work/bin/work-view
chmod +x .work/bin/work-view
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

Project-level agent rules live in AGENTS.md. Do not create or maintain
`.claude/rules/patterns.md` as a source of truth; reusable structural patterns
belong in `.agents/skills/patterns/`.

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

Slash commands (user-invokable):
`/agile-workflow:ideate`, `/agile-workflow:epicize`,
`/agile-workflow:autopilot`, `/agile-workflow:release-deploy`.
<!-- agile-workflow:end -->
```

Preserve all content outside the markers. If the selected AGENTS target does
not exist, create it with this section as the whole body.

### Phase 7: Preserve Claude Code compatibility

The selected AGENTS target is canonical. Claude instruction files are only
compatibility entrypoints for Claude Code and should not become independent
copies.

Handle every detected Claude candidate (`CLAUDE.md`, `.claude/CLAUDE.md`,
`.agents/CLAUDE.md`) as follows:

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
     AGENTS target.
3. If symlink creation is unavailable or unsafe in the environment, write this
   shim instead:

   ```markdown
   # Claude Code Instructions

   Canonical agent instructions live in AGENTS.md. Read that file.
   ```

The sync path follows the same rule: refresh `AGENTS.md`, then keep
Claude entrypoints pointing at it through symlinks or shims.

Handle `.claude/rules/patterns.md` as a legacy Claude rules file, not as a
Claude compatibility entrypoint:

1. If it exists as a regular file and contains content not already present in
   the selected AGENTS target, import that content under a short
   `## Imported Claude Pattern Rules` heading.
2. Replace `.claude/rules/patterns.md` with this shim:

   ```markdown
   # Pattern Rules

   Canonical project rules live in AGENTS.md. Read that file.
   ```

3. If the file is already a symlink or shim that points to `AGENTS.md`, leave it
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

Leave alone: `docs/designs/`, `docs/designs/completed/`, `docs/ROADMAP.md`,
`docs/PROGRESS.md`. They become legacy history; user can delete after verifying.

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

1. **Cluster** the changed files via a read-only Explore sub-agent: "Categorize
   these <N> files into 1-5 coherent feature buckets by path, imports, and
   diff content. Report each as slug + one-paragraph description + file
   list." Pass `git status --porcelain` and `git diff --stat` as context;
   don't read 50 diffs yourself.
2. **Confirm with the user** via AskUserQuestion (groups of 2-4 buckets if
   there are many). Allow merge / split / rename.
3. **Scope each cluster** as `.work/active/features/feature-<slug>.md` with
   `kind: feature, stage: implementing`, body = brief + "Files in this
   cluster" list + "Design captured retroactively from existing code". No
   parent or deps unless obvious.
4. **Bootstrap commit stays substrate-only** — don't commit the working-tree
   code yet. `implement`'s land mode (Phase 4a) handles validate-commit-advance
   per cluster after bootstrap.

### Phase 9: Write MIGRATION_REPORT.md

Write `MIGRATION_REPORT.md` at the repo root (NOT in `docs/`) per the format in
MIGRATION.md. Include: source shape, foundation docs detected (preserved), items
seeded by tier, files left in place, conventions chosen, next steps.

### Phase 10: Commit

Single git commit:

```bash
git add .work/ AGENTS.md .agents/AGENTS.md .claude/AGENTS.md CLAUDE.md .claude/CLAUDE.md .agents/CLAUDE.md MIGRATION_REPORT.md
# If a legacy rules shim was created or updated:
git add .claude/rules/patterns.md
git commit -m "chore: bootstrap agile-workflow substrate"
```

User reverts via `git revert HEAD` if anything looks wrong. Source files are
preserved across all paths.

## Sync Workflow

Entered via auto-detection when `.work/` exists, or explicitly via `--update`.
Non-destructive — refreshes plugin-shipped artifacts and reports drift.

### Phase S1: Audit substrate health

Re-use the marker checks from Phase 1.5 plus deeper checks:

- All five markers (`substrate_root`, `conventions`, `agents_md_section`,
  `claude_compat`, `work_view`) — present or missing
- Legacy `.claude/rules/patterns.md` — absent, shimmed to AGENTS, or containing
  importable legacy rules content
- For each plugin-shipped artifact that IS present, compare its content against
  the version in the current plugin source:
  - The selected AGENTS target section between `<!-- agile-workflow:start -->` /
    `<!-- agile-workflow:end -->` vs the canonical template in Phase 6
  - `.work/bin/work-view` vs `${PLUGIN_ROOT:-${CLAUDE_PLUGIN_ROOT}}/scripts/work-view.sh`
  - `CLAUDE.md` compatibility state (symlink/shim/legacy copy)
  - `.claude/rules/patterns.md` state (legacy content vs AGENTS shim)

Classify each artifact as one of:

| State | Meaning |
|---|---|
| `match` | Installed bytes match the plugin's current canonical version. No-op. |
| `drift_plugin` | Installed version differs because the plugin moved forward. Refresh. |
| `drift_user` | Installed version differs because the user edited it. Ask. |
| `missing` | Marker absent. Install fresh. |

Heuristic for `drift_plugin` vs `drift_user` on the selected AGENTS section: if
the installed text matches a known prior plugin release's template
(recognisable shape, just older content), assume `drift_plugin`. Otherwise
treat as `drift_user` and ask. If any Claude candidate has legacy content that
is not yet present in the selected AGENTS target, import it before replacing the
Claude file with a symlink or shim.

If `.claude/rules/patterns.md` is absent, treat the legacy-rules state as
`match` and take no action. If it contains non-shim content that is not yet
present in the selected AGENTS target, import it before replacing the legacy
rules file with the AGENTS shim. Treat user-edited or ambiguous content as
`drift_user` and ask before import; treat old generated pattern-rules content as
`drift_plugin`.

### Phase S2: Plan the sync

Produce a per-artifact plan: what's `match` (skip), what's `drift_plugin`
(auto-refresh), what's `drift_user` (ask before overwriting), what's `missing`
(install).

If every artifact is `match`, the sync is a true no-op — log "Substrate already
up to date. No changes." and return without committing.

If anything would change, summarise the plan and (when running interactively)
confirm before applying.

### Phase S3: Apply refreshes

For each artifact with a non-`match` state:

- Selected AGENTS target section between markers — overwrite with the canonical
  template from Phase 6. If the file lacks markers, append the section. If the
  file doesn't exist, create it.
- `.work/bin/work-view` — overwrite with the plugin's current script and
  `chmod +x`
- Claude compatibility — convert legacy generated content from any detected
  Claude candidate into the selected AGENTS target, then replace the Claude
  file with a symlink to that target. If symlinks are not available, write the
  shim from Phase 7.
- Legacy `.claude/rules/patterns.md` — only when present, import
  non-duplicate content into the selected AGENTS target, then replace the file
  with the Pattern Rules shim from Phase 7.

For `drift_user` items, only proceed after the user confirms.

### Phase S4: Preserve user state

These are NEVER touched in sync mode:

- `.work/CONVENTIONS.md` (user-owned)
- Everything under `.work/active/`, `.work/backlog/`, `.work/releases/`,
  `.work/archive/`
- AGENTS content outside the agile-workflow markers, except imported legacy
  Claude content and imported legacy Claude pattern-rules content the user
  confirms should become canonical
- `MIGRATION_REPORT.md` (a bootstrap artifact; sync never writes it)

### Phase S5: Commit

If any files were rewritten:

```bash
git add AGENTS.md .agents/AGENTS.md .claude/AGENTS.md CLAUDE.md .claude/CLAUDE.md .agents/CLAUDE.md .work/bin/work-view
# If a legacy rules shim was created or updated:
git add .claude/rules/patterns.md
git commit -m "chore: agile-workflow sync"
```

Skip the commit entirely if Phase S3 produced no file changes.

## Output

After bootstrap:
- Brief summary in conversation: shape detected, items seeded by tier, conventions
  chosen, next-step recommendation.
- Point at `MIGRATION_REPORT.md` for the full breakdown.

After sync (auto or `--update`):
- Per-artifact line: `match` / `refreshed (plugin drift)` / `refreshed (user
  drift, confirmed)` / `installed (was missing)`.
- If everything matched: one line — "Substrate already up to date. No changes."
- If anything changed: one line summary plus the commit sha.

## Guardrails

- **Bootstrap is a single-commit migration ALWAYS.** No partial states. If
  anything errors mid-run, rollback (no commit). User can re-run cleanly.
- Source files are preserved across all paths. Convert never deletes user content.
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
