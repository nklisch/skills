# MIGRATION: agile-workflow

How `/agile-workflow:convert` bootstraps the substrate across four project
shapes: an existing `workflow`-plugin-formatted repo, an ad-hoc-tracked
repo, an untracked repo, and a greenfield repo. For each shape, this doc
specifies what `convert` reads, what it asks the user, what it produces,
what it leaves alone, and where it commits.

`convert` is interactive at boundaries. It scans, proposes, asks, then
commits the migration as a single git commit so the user can revert
cleanly if a read was wrong. Treat the source layout as ground truth for
*content*; treat the user as ground truth for *intent*.

## Project shape detection

`convert` runs detection signals in this order. The first match wins.

| Shape | Signal |
|---|---|
| `workflow`-plugin | `docs/designs/` exists OR `docs/ROADMAP.md` exists OR `docs/PROGRESS.md` exists |
| ad-hoc-tracked | `TODO.md`, `BACKLOG.md`, `NOTES.md`, or `tasks/` directory exists at repo root |
| no-tracking | Repo has source code (any non-empty `src/`, `lib/`, `app/`, or language-specific equivalent) but no detected tracking files |
| greenfield | No source code OR only `README.md` and config files |

The user can override detection with `convert --shape <shape>` if the
heuristic is wrong (rare).

## Foundation docs handling (all shapes)

`convert` requires foundation docs at minimum (`docs/VISION.md` or
`docs/SPEC.md`). If absent:

- Halts with the message: *"No foundation docs found at `docs/VISION.md`
  or `docs/SPEC.md`. Run `/agile-workflow:ideate` first to produce
  foundation docs, then re-run `/agile-workflow:convert`."*

If foundation docs exist, `convert` reads them (does not modify) and uses
their content to inform initial item seeding decisions. Foundation docs
roll forward only when items get scoped or implemented; `convert` itself
never edits them.

## Conventions interview (all shapes)

`convert` runs an interactive interview to populate `.work/CONVENTIONS.md`.
Questions, in order:

1. **Release mapping** — `branch-held | tag-based | release-branch | none`.
   Default offered: `tag-based`. Asked every time; never inferred silently.
2. **Tag taxonomy** — `convert` proposes a starter set based on detected
   project type (e.g., `[security, perf, refactor, content, infra]`)
   and asks the user to confirm or edit. Project-specific tags get
   one-line semantics each.
3. **Slug conventions** — defaults to `kebab-case` with parent-prefix for
   children. User can override.
4. **Stage overrides** — none by default. User can declare custom stages
   here if they have a strong reason.
5. **Gate config** — defaults to
   `gates_for_release: [security, tests, cruft, docs, patterns]`.
   User can reorder or omit gates per project.

Answers land in `.work/CONVENTIONS.md` in the format specified by SPEC.md.

## Path A: Workflow plugin → agile-workflow

### What convert reads

| Source | Used for |
|---|---|
| `docs/designs/<name>.md` | In-flight features. The design content becomes the feature item's body. |
| `docs/designs/completed/<name>.md` | Done features. The design content becomes the body of an archived or retro-released item. |
| `docs/ROADMAP.md` | Phase decomposition. Each phase becomes an epic at `stage: drafting` (if no children built yet) or `stage: implementing` (if some children done). Phase ordering becomes epic-level `depends_on` chain. |
| `docs/PROGRESS.md` | Resume hints. Deviation logs become notes in the relevant items' bodies. |
| `docs/VISION.md`, `docs/SPEC.md`, `docs/ARCHITECTURE.md` | Read-only. Used as standing context. |
| `git log docs/designs/` | Recency signals — recently edited designs are likely in flight. |

### What convert asks the user

- Confirm the inferred mapping for each `docs/designs/<name>.md` →
  feature item: "This will become `feature-<slug>` at
  `stage: implementing`. Confirm or rename?"
- Confirm the retro-release strategy for `docs/designs/completed/`:
  *"Synthesize `.work/releases/v0/` containing all completed designs as
  done features (default), or move them straight to `.work/archive/`?"*
- Confirm the inferred epic-level dependencies from `ROADMAP.md` phase
  ordering: "Phase 2 depends on Phase 1 — yes? Phase 4 depends on
  Phase 3 — yes? (etc.)"

### What convert produces

```
.work/
├── active/
│   ├── epics/<phase-slug>.md         from ROADMAP.md phases
│   ├── features/<design-slug>.md     from docs/designs/<name>.md (open)
│   └── stories/                       (empty initially; populated via design)
├── backlog/                           (empty initially)
├── releases/
│   └── v0/<design-slug>.md           from docs/designs/completed/ (retro-release default)
├── archive/                           (or here, if user opted out of retro-release)
├── bin/work-view
└── CONVENTIONS.md
AGENTS.md (canonical agile-workflow section)
CLAUDE.md -> AGENTS.md (or shim if symlinks are unavailable)
```

The retro-release `v0` carries all previously-completed work as a single
archived bundle. Its release item has `stage: released` and a `created`
date matching the earliest design in the set. This preserves continuity
without falsely implying those items shipped together.

### What convert leaves alone

- `docs/designs/` and `docs/designs/completed/` — the source files stay
  untouched after migration. They become read-only history. The user can
  delete them after verifying the migration via the report.
- `docs/ROADMAP.md` — left in place as historical context. The substrate
  no longer reads it; epics in `.work/active/epics/` are the new source
  of truth. The user can delete it if desired.
- `docs/PROGRESS.md` — left in place as historical context. The substrate
  is the new progress source. Delete if desired.
- All foundation docs (VISION/SPEC/ARCHITECTURE/etc.)
- Source code, tests, configuration

### Commit shape

A single git commit titled `chore: bootstrap agile-workflow substrate`
containing:
- New `.work/` skeleton with seeded items
- New or updated `AGENTS.md` agile-workflow section
- `CLAUDE.md` compatibility symlink or shim
- `MIGRATION_REPORT.md` at repo root

The user can revert this single commit cleanly if the read was wrong.

## Path B: Ad-hoc tracking → agile-workflow

### What convert reads

| Source | Used for |
|---|---|
| `TODO.md` | Each `- [ ]` line becomes a backlog item; each `- [x]` line is reported but not seeded (user can request archive item creation if they want continuity) |
| `BACKLOG.md` | Same as TODO.md but with bullet items |
| `NOTES.md`, `tasks/*.md` | Each section heading or each file becomes a backlog item with the section/file body as the idea description |
| Foundation docs | Read-only, standing context |

No epic decomposition is inferred. No dependencies are inferred. The user
runs `/agile-workflow:epicize` after `convert` to decompose foundation
docs into epics; backlog items remain in backlog until the user runs
`/agile-workflow:scope` on them.

### What convert asks the user

- Confirm the count and shape: *"Found 23 items in `TODO.md`. Seed all
  as backlog items, or filter? (Showing first 5 to confirm formatting.)"*
- For each `tasks/<file>.md`: *"Seed `tasks/foo.md` as backlog item
  `idea-foo`?"*
- Whether to delete the source files after migration (default: no)

### What convert produces

```
.work/
├── active/                           empty initially
├── backlog/<idea-slug>.md           one per item from sources
├── releases/                         empty
├── archive/                          empty
├── bin/work-view
└── CONVENTIONS.md
AGENTS.md
CLAUDE.md -> AGENTS.md (or shim)
```

Each backlog item has minimal frontmatter: `id`, `created`, `tags` (empty
or inferred from source structure if user opts in). Body is the idea
description from the source.

### What convert leaves alone

- `TODO.md`, `BACKLOG.md`, `NOTES.md`, `tasks/` — left in place by default.
  User can delete after verifying.
- Foundation docs, source code, tests, config

### Commit shape

Same single-commit pattern as Path A.

## Path C: No tracking → agile-workflow

### What convert reads

| Source | Used for |
|---|---|
| Foundation docs | Read-only, standing context |
| Source code structure | Light scan for likely-epic boundaries (top-level `src/` modules), but does not auto-create epics |
| `git log` recent activity | Identifies recently active areas as candidates for backlog seeding (offered to user) |

### What convert asks the user

- *"No tracking system detected. Bootstrap an empty substrate, or seed
  initial backlog items based on recent git activity?"*
- If user opts to seed from git: *"Found 3 areas with recent commits:
  src/auth (12 commits last 2wk), src/payments (8 commits), src/admin
  (3 commits). Seed any as backlog ideas to revisit?"*

### What convert produces

```
.work/
├── active/                           empty
├── backlog/                          empty (or sparse seed if user opted in)
├── releases/                         empty
├── archive/                          empty
├── bin/work-view
└── CONVENTIONS.md
AGENTS.md
CLAUDE.md -> AGENTS.md (or shim)
```

The substrate is empty but bootstrapped. Subsequent work flows through
`scope` (for direct work) or `park` (for capture) as normal.

### Commit shape

Same single-commit pattern.

## Path D: Greenfield → agile-workflow

### What convert reads

- Foundation docs (must exist; halts if not, instructing user to run
  `/agile-workflow:ideate` first)

### What convert asks the user

- Conventions interview (release mapping, tag taxonomy, gate config)
- *"Run `/agile-workflow:epicize` next to decompose foundation docs into
  epics?"* — after substrate is bootstrapped

### What convert produces

```
.work/
├── active/                           empty
├── backlog/                          empty
├── releases/                         empty
├── archive/                          empty
├── bin/work-view
└── CONVENTIONS.md
AGENTS.md
CLAUDE.md -> AGENTS.md (or shim)
```

Empty but ready. The expected next step is `/agile-workflow:epicize` to
seed the initial epic set from foundation docs.

### Commit shape

Same single-commit pattern.

## MIGRATION_REPORT.md

After every `convert` run, a `MIGRATION_REPORT.md` is written at the
project root (NOT in `docs/`, since it's transient). The user reviews
this to confirm the migration was correct.

Format:

```markdown
# Migration Report — agile-workflow bootstrap

**Date:** 2026-05-09
**Source shape:** workflow-plugin
**Destination:** .work/ substrate

## Foundation docs detected
- docs/VISION.md (preserved)
- docs/SPEC.md (preserved)
- docs/ARCHITECTURE.md (preserved)

## Items seeded

### Epics (from docs/ROADMAP.md)
- epic-uploads-architecture (stage: implementing, depends_on: [])
- epic-rate-limits (stage: drafting, depends_on: [epic-uploads-architecture])
- epic-admin-dashboard (stage: drafting, depends_on: [epic-rate-limits])

### Features (from docs/designs/)
- feature-uploads-retry (stage: implementing, parent: epic-uploads-architecture)
- feature-quota-tracking (stage: implementing, parent: epic-rate-limits)

### Retro-release (from docs/designs/completed/)
- releases/v0/feature-auth-core (stage: done, release_binding: v0)
- releases/v0/feature-storage-layer (stage: done, release_binding: v0)
- releases/v0/release-v0 (stage: released)

### Backlog (none — workflow-plugin source had no backlog files)

## Files left in place (review and delete if desired)
- docs/designs/      (history; substrate now owns design content)
- docs/designs/completed/ (history; retro-released to releases/v0/)
- docs/ROADMAP.md   (replaced by epics in .work/active/epics/)
- docs/PROGRESS.md  (replaced by substrate state)

## Conventions chosen
- Release mapping: tag-based
- Tag taxonomy: [content, security, perf, refactor, infra]
- Gate order: security → tests → cruft → docs → patterns

## Next steps
1. Review the seeded items in .work/active/
2. Verify epic dependencies match your intent
3. Delete legacy docs/designs/ etc. once verified
4. Start an autopilot goal for `epic-uploads-architecture` to drain the first
   epic, or pick up an in-flight feature manually
```

The report stays at repo root through the user's review. Once verified,
the user deletes it (or commits its deletion).

## Idempotency: convert --update

`convert --update` re-runs in a substrate-bootstrapped repo to refresh
plugin-shipped artifacts.

### What --update refreshes

- `AGENTS.md` agile-workflow section — overwritten with the current plugin's
  slim version between markers, but only after `.agents/rules/agile-workflow.md`
  is written and verified (the content-integrity gate applies to the slim, so the
  managed-section overwrite can never drop dense rule content)
- `.agents/rules/agile-workflow.md` — the plugin-managed dense rules
  (tag semantics, test integrity, advisory review, entry points), refreshed
  between `<!-- agile-workflow:rules:start/end -->` markers; other
  `.agents/rules/*.md` (user-owned and migrated legacy rules) are preserved
- `.work/bin/work-view` — overwritten with the current plugin's script
- `CLAUDE.md` compatibility — converted to a symlink to `AGENTS.md`, or to a
  shim if symlinks are unavailable
- Legacy `.claude/rules/*.md` — migrated via the content-integrity gate: each
  Markdown-aware block routes to its canonical home (structural patterns →
  `.agents/skills/patterns/`, rule prose → `.agents/rules/<name>.md`), every
  block is verified to have landed, then the legacy path is replaced with a shim
- `hooks/hooks.json` — already in the plugin, but if the plugin's hook
  scripts changed, the user is alerted to restart their agent session

### What --update preserves

- `.work/CONVENTIONS.md` — user-owned, never touched by `--update`
- `.work/active/`, `.work/backlog/`, `.work/releases/`, `.work/archive/`
  — substrate state is sacred
- The rest of `AGENTS.md` outside the markers
- Any user edits to foundation docs

### Conflict handling

If the user manually edited inside the AGENTS.md markers, `--update`
warns and asks whether to overwrite. Default: do not overwrite — show
the diff and let the user merge manually.

If an existing regular `CLAUDE.md` contains content not yet present in
`AGENTS.md`, `--update` imports that content into `AGENTS.md` before replacing
`CLAUDE.md` with the compatibility symlink or shim.

If an older `.claude/rules/*.md` contains content not yet migrated, `--update`
runs the **content-integrity gate** before any destructive step: it parses the
file into Markdown-aware blocks, classifies each as a structural pattern (→
`.agents/skills/patterns/`), rule prose (→ `.agents/rules/<name>.md`), or
ambiguous, builds a block-level preservation manifest, and verifies every block
landed at its canonical destination. Only when every block is accounted for is
the legacy path replaced with a shim; an ambiguous block leaves the source in
place rather than risk loss. Verify-before-destroy: the replacement must exist
and hold the content before the source is removed.

If `.work/CONVENTIONS.md` is missing on `--update`, that's a corruption
signal — `convert --update` halts and instructs the user to either
restore from git or re-run `convert` (without `--update`) to bootstrap
afresh.

## Failure recovery

If `convert` fails partway through:

- The single-commit pattern means an interrupted run leaves the repo
  in its pre-migration state. Re-running `convert` from clean is safe.
- If the user notices errors AFTER the commit lands, `git revert HEAD`
  removes the migration cleanly. Source files are preserved by all
  paths, so re-running with adjustments is straightforward.
- If items were partially seeded but the conventions interview failed,
  `convert` leaves no `.work/CONVENTIONS.md` — subsequent operational
  skills will halt with "no substrate found," signaling that the
  bootstrap is incomplete.

## Failure modes worth flagging in the conventions interview

- **No release mapping declared** (user picked `none`). Effect:
  `/release-deploy` cannot ship — it will halt and instruct the user
  to declare a mapping. This is fine for projects that don't ship
  versioned software (internal tools, research codebases); the user
  acknowledges this trade-off.
- **Empty tag taxonomy.** Effect: tag-based skill routing degrades.
  `feature-design` always runs for features (no `[refactor]` or `[perf]` tag
  to route to specialized skills). This is a starter trade-off — the user can
  add tags later by editing CONVENTIONS.md.
- **Custom stage names.** Effect: every skill must read CONVENTIONS.md
  to know the project's stage names; the rules file's stage flow
  diagrams become aspirational rather than authoritative. Discouraged
  unless the project genuinely needs it.

`convert`'s interview surfaces these consequences before the user
locks in their choices.

---

After convert succeeds, the substrate is real and the next skill in
the workflow (typically `/agile-workflow:epicize` for greenfield, or
direct operational skills for migrations from existing projects) can
proceed.
