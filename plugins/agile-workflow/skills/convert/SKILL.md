---
name: convert
description: >
  Bootstrap the agile-workflow substrate in a project. Detects the project's current
  shape (workflow-plugin / ad-hoc / no-tracking / greenfield), seeds initial items
  from any source layout, writes the .claude/rules/agile-workflow.md navigation rules,
  runs the conventions interview to populate .work/CONVENTIONS.md, copies the work-view
  script into .work/bin/, appends the agile-workflow section to CLAUDE.md (with
  idempotency markers), produces MIGRATION_REPORT.md, and commits everything as a
  single revertible commit. Idempotent via --update for plugin upgrades. User-invocable
  only — substrate bootstrap is consequential and interactive.
user-invocable: true
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, AskUserQuestion
---

# Convert

You bootstrap the `.work/` substrate in a target project, migrating from whatever
tracking shape exists today (or starting empty for greenfield). The full migration
matrix is specified in `docs/MIGRATION.md` of the agile-workflow plugin source.

## Arguments

- `convert` — full bootstrap on a project (creates `.work/` skeleton + CONVENTIONS.md +
  rules file + CLAUDE.md addition + migration based on detected shape)
- `convert --update` — refresh plugin-shipped artifacts (rules file, work-view script,
  CLAUDE.md section). Preserves user-owned `.work/CONVENTIONS.md` and substrate state.
- `convert --shape <shape>` — force a specific detection (`workflow-plugin`, `ad-hoc`,
  `no-tracking`, `greenfield`)

## Workflow

### Phase 1: Preflight

1. Verify foundation docs exist: `docs/VISION.md` OR `docs/SPEC.md`. If neither:
   > Halt. "No foundation docs found. Run `/agile-workflow:ideate` first to produce
   > foundation docs, then re-run `/agile-workflow:convert`."
2. Verify CWD is a git repo. If not, ask: "This isn't a git repo. agile-workflow's
   substrate relies on git for the audit trail. Run `git init` first?"
3. Verify `.work/` doesn't already exist. If it does:
   - If `--update`: proceed to update mode
   - Otherwise: halt with "Substrate already bootstrapped. Use `convert --update` to
     refresh plugin artifacts, or remove `.work/` first if you want to re-bootstrap."
4. **Check for in-flight working-tree work.** Run `git status --porcelain` and
   note the count of changed/untracked files. If > 5, this is a "dirty repo
   bootstrap" — uncommitted work needs to be captured into the substrate
   alongside the migration, otherwise autopilot will have nothing to drain
   right after bootstrap. See Phase 8.5 for capture handling.

### Phase 2: Detect project shape

Detection signals (first match wins):

| Shape | Signal |
|---|---|
| `workflow-plugin` | `docs/designs/` exists OR `docs/ROADMAP.md` exists OR `docs/PROGRESS.md` exists |
| `ad-hoc` | `TODO.md`, `BACKLOG.md`, `NOTES.md`, or `tasks/` exists at repo root |
| `no-tracking` | Source code exists (`src/`, `lib/`, `app/`, etc.) but no tracking files |
| `greenfield` | No source code, only README and config files |

If `--shape` was passed, use it directly.

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
cp "${CLAUDE_PLUGIN_ROOT:-.}/scripts/work-view.sh" .work/bin/work-view
chmod +x .work/bin/work-view
```

(If `CLAUDE_PLUGIN_ROOT` is not exposed in the agent's shell environment, locate the
plugin source via the plugin manifest or fall back to a known cache path.)

### Phase 5: Write CONVENTIONS.md

Write `.work/CONVENTIONS.md` from the interview answers, following the format in SPEC.md.

### Phase 6: Write the rules file

Write `.claude/rules/agile-workflow.md` with the full content specified in
ARCHITECTURE.md. The rules file is dense pointers — folder structure, kinds, stages,
frontmatter, navigation primitives, session-start checklist, rolling-foundation reminder.

The frontmatter must include:

```yaml
---
description: Agile-workflow substrate navigation rules
paths: ['.work/**', 'docs/**']
---
```

### Phase 7: Append CLAUDE.md section

If `CLAUDE.md` exists at repo root, append the agile-workflow section between HTML
comment markers:

```markdown
<!-- agile-workflow:start -->
## Agile-Workflow Substrate

This project tracks work in `.work/` (markdown items + frontmatter).
See `.claude/rules/agile-workflow.md` for navigation primitives.

Quick reference:
- `.work/bin/work-view --help` — query items
- `.work/active/` — in-flight; `.work/backlog/` — parked ideas
- Foundation docs in `docs/` describe the system NOW; never add legacy notes

Common skills (auto-triggered by conversation):
- park an idea               | scope a backlog item up
- design a drafting feature  | implement an implementing feature
- review work at review      | fix a quick bug as a story

Heavy-weight skills (you invoke explicitly):
- /agile-workflow:ideate          — foundation docs
- /agile-workflow:epicize         — decompose into epics
- /agile-workflow:autopilot       — drain queue
- /agile-workflow:release-deploy  — bind, gate, ship
<!-- agile-workflow:end -->
```

If `CLAUDE.md` doesn't exist, create it with this section as the entire body.

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

Skip if Phase 1's `git status --porcelain` count was ≤ 5 (small changes go
into the bootstrap commit itself).

Otherwise, capture the in-flight code as substrate items so autopilot has
something to drain after bootstrap:

1. **Cluster** the changed files via a Task Explore sub-agent: "Categorize
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
git add .work/ .claude/rules/agile-workflow.md CLAUDE.md MIGRATION_REPORT.md
git commit -m "chore: bootstrap agile-workflow substrate"
```

User reverts via `git revert HEAD` if anything looks wrong. Source files are
preserved across all paths.

## --update mode

When invoked with `--update`:

1. Verify substrate exists. If not, halt: "No substrate found. Run `convert` (without
   --update) first."
2. Refresh:
   - `.claude/rules/agile-workflow.md` — overwrite with current plugin's version
   - `.work/bin/work-view` — overwrite with current plugin's script
   - The CLAUDE.md section between markers — overwrite
3. Preserve untouched:
   - `.work/CONVENTIONS.md`, all of `.work/active/`, `.work/backlog/`, `.work/releases/`,
     `.work/archive/`
   - The rest of CLAUDE.md outside the markers
4. If the user has manually edited inside the CLAUDE.md markers, show the diff and ask
   before overwriting.
5. Commit:

```bash
git add .claude/rules/agile-workflow.md .work/bin/work-view CLAUDE.md
git commit -m "chore: agile-workflow plugin update"
```

## Output

After bootstrap:
- Brief summary in conversation: shape detected, items seeded by tier, conventions
  chosen, next-step recommendation.
- Point at `MIGRATION_REPORT.md` for the full breakdown.

After --update:
- One-line confirmation: "Refreshed plugin artifacts. CONVENTIONS.md preserved."

## Guardrails

- Single-commit migration ALWAYS. No partial states. If anything errors mid-run,
  rollback (no commit). User can re-run cleanly.
- Source files are preserved across all paths. Convert never deletes user content.
- The conventions interview is mandatory. No silent inference of release mapping or
  tag taxonomy.
- Foundation docs are read-only from convert. They roll forward through `scope`,
  `design`, `implement`, NOT through bootstrap.
- `--update` never touches user-edited CONVENTIONS.md or substrate state. Refresh is
  only for plugin-shipped artifacts.
