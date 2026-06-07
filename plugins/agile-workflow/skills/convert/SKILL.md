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
plugin-owned concept, defer to its owner's canonical *location and format*
instead of carrying a divergent rule: reusable patterns live in
`.agents/skills/patterns/` in the `gate-patterns` file/index format; refactor
conventions → `refactor-conventions-creator` Phase 1/5 (AGENTS style section +
`.agents/skills/refactor-conventions/`). One nuance for patterns: convert
*imports* existing legacy patterns there **verbatim and losslessly** (Phase 7),
whereas `gate-patterns` *discovers* new ones with its 3+-occurrence filter — same
location and format, different entry path. See the single-owner deferral table in
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
| `work_view` | `.work/bin/work-view` exists, is executable, and reports the current plugin version via `--version` |

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

**Content integrity is mandatory regardless of `cleanup_scope` — and runs
BEFORE reference integrity.** This is the central data-loss gate. It is
*distinct* from reference integrity: reference integrity preserves *pointers*
(no inbound link dangles); content integrity preserves *content* (no block of a
legacy artifact disappears without a verified home). A pointer can be cleanly
repointed while the content it pointed at is silently dropped — content
integrity closes that hole.

> **Content-integrity gate (before any destructive op).** A *destructive op* is
> any of: `git rm` / delete, `git mv` / move, replace-with-symlink,
> replace-with-shim, copy-over (overwriting a file's bytes), managed-section
> overwrite (rewriting content between `<!-- ...:start/end -->` markers), or
> mirror replacement (overwriting/symlinking a `.claude` mirror). Before
> performing a destructive op on a legacy artifact, build the **block-level
> preservation manifest** (below), then apply the rule for the op's kind:
> - **Source-eliminating ops** (delete, move, replace-with-shim,
>   replace-with-symlink — anything that removes the legacy file as a place its
>   content lives): permitted ONLY when **every** user block is `landed_existing`
>   or `landed_this_run`. A block still `preserved_in_place` means the source file
>   is its ONLY home, so the op **does NOT run** — leave the artifact exactly where
>   it is. `ambiguous` likewise blocks.
> - **Regenerable-copy ops** (managed-section overwrite of plugin markers, or
>   `.claude` mirror replacement where the `.agents` canonical is the home):
>   permitted only after the manifest confirms the canonical home already holds the
>   content — never overwrite the copy while the home is unverified.
>
> The gate is a hard precondition, not advice. `preserved_in_place` satisfies the
> *content-safety* check (the content still exists, in the source) but NEVER
> licenses removing that source. A manifest with any unaccounted-for block runs no
> destructive op; the artifact is reported as preserved-pending-review.

**Content inside plugin-managed markers is NEVER counted as preserved
user-content.** Blocks between `<!-- agile-workflow:start/end -->` or
`<!-- agile-workflow:rules:start/end -->` are plugin-owned and regenerated from
the template; they neither need preservation nor satisfy the gate for any
*user* block. Only user/legacy content blocks are subjects of the manifest.

#### Block-level preservation manifest

Before touching any legacy or split-destination artifact (notably a
`.claude/rules/*.md` that mixes structural patterns and prose), parse it into
**Markdown-aware blocks** and classify, route, and verify each:

1. **Block boundaries** (so a block is never split mid-thought):
   - YAML frontmatter, if present, is one block.
   - Each Markdown heading starts a new block; a heading section runs to the
     next heading of the same or higher level.
   - Fenced code blocks, tables, and lists are **atomic** — never split one
     across blocks; keep an introductory sentence with the fence/table/list it
     introduces.
   - HTML marker regions (`<!-- x:start -->` … `<!-- x:end -->`) are atomic.
   - If the file has no headings at all, group by blank-line-separated
     paragraphs, again keeping an intro line attached to a fence it introduces.
2. **Classify** each block as exactly one of:
   - `structural-pattern` — a reusable code shape with concrete examples
     (routes to `.agents/skills/patterns/`, see Phase 7's verbatim importer).
   - `rule-prose` — project style or agent-rule prose (routes to
     `.agents/rules/<name>.md`, e.g. `project.md`).
   - `ambiguous` — cannot be confidently classified, or has no trustworthy
     destination (preserve in place; never destroy).
3. **Route** per classification (patterns → `.agents/skills/patterns/`;
   rule-prose → `.agents/rules/<name>.md`; ambiguous → leave in source).
4. **Record a terminal state** per block, idempotently — re-running convert
   must never duplicate a block already landed:
   - `landed_existing` — the block's content is already present at its
     canonical destination (a prior run, or the user, put it there). No write.
   - `landed_this_run` — convert wrote it to the destination this run.
   - `preserved_in_place` — intentionally kept in the source file (ambiguous
     blocks, or blocks the user chose not to migrate). This block is content-safe
     (it still exists in the source) but pins the source in place: it makes the
     source NOT a candidate for any source-eliminating op (delete / move / shim /
     symlink), which require **every** block `landed_*`.
   - `ambiguous` — not yet resolved; blocks the destructive op until it becomes
     `preserved_in_place` or lands.
5. **Provenance verification (content-equality, not weak anchors).** A digest
   comment plus a matching heading does NOT prove the block's body landed — a
   destination could carry the marker and the slug while dropping the rationale,
   examples, or prose. Verification must prove the *content* is present while
   still tolerating pure *layout* reformatting. Per source block:
   - Compute `sha256` of the **normalized** source block (trim trailing
     whitespace per line, collapse runs of blank lines to one, strip the trailing
     newline). Write it into the destination region that holds the block as a
     trailing marker, e.g. `<!-- agile-workflow:provenance src-sha256=<digest> -->`.
     Locate that region by the block's semantic anchors (pattern name / slug, or
     heading text + fenced payload).
   - **Verify by recomputing**: normalize the destination region the same way
     (excluding the provenance marker) and confirm its `sha256` **equals** the
     recorded `src-sha256`. Presence of the marker or an anchor alone is never
     sufficient — the recomputed destination hash must match.
   - If the hashes cannot be made equal (the destination genuinely reworded the
     content rather than just re-laying-it-out), or no trustworthy region can be
     located, the block does **not** count as landed — mark it `preserved_in_place`
     and keep the source. The convert-owned importer (Phase 7) writes blocks
     **verbatim**, so its imports hash-match and become `landed_this_run`; only a
     pre-existing hand-edited destination risks a mismatch, and there the safe
     answer is to keep the source. Keeping a duplicate is always preferable to a
     deletion you cannot prove safe.

**Reference integrity is mandatory regardless of `cleanup_scope`, and runs
AFTER content integrity passes.** Before any `git mv` / `git rm` /
replace-with-symlink / replace-with-shim, follow the
reference-integrity-on-move procedure in the reference: grep the repo for
inbound references (especially `.work/` items and `docs/`), then rewrite them or
leave a redirect shim, and report which. Never strand a live pointer. Every
destructive action still needs an exact path list in the plan; prefer `git mv`
to a clearly named legacy location for retention, `git rm` only for paths the
user explicitly chose to delete, and never broad globs.

#### Manifest edge cases

- **Empty file** — manifest state `empty`. Still run reference integrity and
  confirm (no inbound references would dangle), but there is no content to
  migrate; a shim/removal is safe once references are handled.
- **Already-shimmed file** — if the file is already a redirect shim/symlink to
  the canonical destination, verify the target exists and is non-dangling, then
  leave it; do NOT treat the shim's own pointer text as content to migrate.
- **Symlink loop / dangling symlink** — classify `unsafe` and leave it in
  place; never follow into a loop or migrate a dangling target. Report it.
- **Partial prior migration** — some blocks already landed (a previous
  interrupted run): the manifest is idempotent, so already-present blocks are
  `landed_existing` and are not rewritten or duplicated; only unaccounted blocks
  are routed this run.

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
the conventions, and imported content go into the canonical instruction file —
**except** legacy rule-prose blocks, which route to `.agents/rules/<name>.md`
(e.g. `project.md`) per the Phase 1.8 content-integrity routing, never into the
canonical instruction file. The *other* entrypoint becomes a pointer to it
(Phase 7).

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
single-destination file. When any such file exists, build the **Phase 1.8
block-level preservation manifest** for it and route each block to its canonical
owner (per the DIY→canonical mapping in the reference):

- **Structural-pattern blocks** (recurring code shapes with examples) →
  `.agents/skills/patterns/`, via convert's **verbatim legacy-pattern importer**
  (Phase 7) — every legacy pattern lands losslessly, with NO 3+-occurrence
  discovery filter. `gate-patterns` Phase 4-5 defines the file/index *format*;
  convert does the importing. Do not paste these into AGENTS.
- **Rule-prose blocks** (project style / agent-rule prose) →
  `.agents/rules/<name>.md` (e.g. `project.md`), the user-owned rules file the
  hook force-loads — NOT the AGENTS canonical file and NOT inside the plugin
  `agile-workflow:rules` markers.
- **Ambiguous blocks** → preserve in place; never destroy.

Never dump a whole rules file into AGENTS under a generic heading — that
contradicts the canonical layout convert advertises in Phase 6, and rule prose's
canonical home is now `.agents/rules/<name>.md`. Preserve only non-duplicate
content (idempotent per the manifest). Replace any `.claude/rules/*.md` with a
short shim only when `cleanup_scope` allows generated cleanup or the user
confirms that exact path, and only after the **content-integrity gate** passes
(every block terminal) AND the reference-integrity check (both Phase 1.8) clears
the move; otherwise leave it in place and report it as legacy content that was
imported. Do not create `.claude/rules/*.md` files that don't already exist.

### Phase 3: Conventions interview

Run an interactive interview via AskUserQuestion. Six questions, in order:

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
6. **Terminal-tier retention** — `delete-refs | retain-bodies`. This is the ONE merged terminal
   convention (archival + `archived_atop` late-binding + one-summary release), not just byte
   retention. Default offered: `delete-refs` — archiving a done item leaves a **bodyless stub**
   carrying `archived_atop` (the immutable release baseline it was done atop, kept as provenance) +
   `git_ref`; a release **late-binds all unbound archived stubs** (no re-gating of already-done stubs)
   and **collapses** all bound items into one `releases/<version>/release-<version>.md` summary (id,
   title, kind, `archived_atop`, git ref); full bodies live in git history, so terminal prose cannot
   leak to future agents. Offer `retain-bodies` only for projects that deliberately keep full terminal
   bodies on disk (same `archived_atop`/late-binding semantics, bodies just not pruned).

### Phase 4: Create substrate skeleton

```bash
mkdir -p .work/active/epics .work/active/features .work/active/stories
mkdir -p .work/backlog .work/releases .work/archive .work/bin
```

Install `work-view` from the plugin to the project. On supported platforms this
installs the version-verified prebuilt Rust binary, including `work-view board`;
only unsupported platforms receive the version-stamped Bash fallback:

```bash
bash "${PLUGIN_ROOT:-${CLAUDE_PLUGIN_ROOT}}/scripts/install-work-view.sh"
```

(If neither `PLUGIN_ROOT` nor `CLAUDE_PLUGIN_ROOT` is exposed in the agent's shell
environment, locate the plugin source via the active skill/plugin path or manifest.)

### Phase 5: Write CONVENTIONS.md

Write `.work/CONVENTIONS.md` from the interview answers, following the format in SPEC.md. The
`## Terminal-tier retention` section is **value-only** — write the bare `delete-refs`/`retain-bodies`
value the user chose, not the merged prose (the prose lives in SPEC.md, never duplicated per project).
This bare-value form is exactly what a later sync classifies as `match`, so a freshly bootstrapped
repo never self-reports terminal-retention drift.

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
- `work-view --stage review` — items awaiting an agent review pass (`/agile-workflow:review`)
- `work-view --parent <id>` / `--blocking <id>` — hierarchy / sequencing
- `work-view --scope all` — include terminal tiers: `releases/` (one summary doc per version) and
  `archive/` (bodyless ref stubs). Full bodies live in git history. By default work-view shows only
  active + backlog; `--release` / `--gate` auto-widen to all tiers.
- `work-view --help` for the full flag set

Foundation docs in `docs/` describe the system's current state or intended
future state, never the past; git history is the audit trail. Item files are
the durable state: update the body with implementation discoveries, review
findings, blockers, and decisions instead of relying on chat history.

Reusable code patterns live in `.agents/skills/patterns/` (load the `patterns`
skill for detail). Project agent rules live in `.agents/rules/*.md`
(plugin-managed rules in `.agents/rules/agile-workflow.md`); do not maintain
`.claude/rules/*.md` as a source of truth.

**Before designing, implementing, or reviewing, read `.agents/rules/*.md`** —
the project's force-loaded agent rules (tag semantics, test integrity, review
policy). The agile-workflow hook auto-loads these at session start and after
compaction; read them directly when working without the hook. Do not rely on
UserPromptSubmit for rules or queue snapshots; query `work-view` when queue
state is needed.

Project-specific refactor style conventions belong in this file under
`## Refactor Style Conventions`. Detailed refactor convention references belong
in `.agents/skills/refactor-conventions/` and extend `refactor-design`'s
defaults; they do not replace the built-in scan and they do not create
standalone plan docs.

<!-- agile-workflow:end -->
```

Preserve all content outside the markers. If the selected AGENTS target does
not exist, create it with this section as the whole body. The dense behavioral
rules (tag semantics, test integrity, advisory review, entry points) no longer
live here — Phase 6.5 writes them to `.agents/rules/agile-workflow.md`, and the
slim section above points agents at `.agents/rules/*.md`.

**Research-substrate fields are conditional on the `agentic-research` plugin.**
The frontmatter field list above is agile-workflow's own. Only when the
`agentic-research` plugin is installed in the target project — its
`research-orchestrator` / `research-handoff` skills are available, or a
`.research/` tier already exists — extend the field list to
`(`kind, stage, tags, parent, depends_on, release_binding, research_refs, research_origin`)`
and add a one-line pointer to the `.work/` ↔ `.research/` handoff
(`plugins/agentic-research/docs/HANDOFF.md`). Without that plugin, omit
`research_refs` / `research_origin` and do not scaffold `.research/` or any
research docs — they are an optional agentic-research extension. (`work-view`
parses both fields harmlessly when unset, so an existing `.work/` substrate is
never broken by their absence; convert simply does not advertise them.)

### Phase 6.5: Write `.agents/rules/agile-workflow.md` (rules-first, then slim)

The dense agile-workflow behavioral rules live in a plugin-managed
`.agents/rules/agile-workflow.md`, force-loaded into agent context by the
agile-workflow SessionStart/PostCompact hook path (and read directly by the
design/implement/review skills' grounding). **Write and verify this file BEFORE
writing the slim AGENTS section
(Phase 6).** The slim section overwrites the managed AGENTS block, so the rules
must already exist at their new home or the dense content is lost.

1. `mkdir -p .agents/rules` and write `.agents/rules/agile-workflow.md`. Refresh
   only the content between the markers on sync; preserve anything outside them
   and every other `.agents/rules/*.md` (user-owned rules):

   ```markdown
   <!-- agile-workflow:rules:start -->
   ## Agile-Workflow Rules

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
   Same-model peers fall back to local sub-agents instead. Claude Opus peeragent
   calls can take 10 to 30 minutes on large reviews; no return after a few minutes
   is not evidence that the call has hung.

   Broad entry points:
   `/agile-workflow:ideate`, `/agile-workflow:epicize`,
   autopilot goals such as "Use agile-workflow autopilot to drain --all",
   and `/agile-workflow:release-deploy`.
   <!-- agile-workflow:rules:end -->
   ```

2. **Verify before slimming** (the content-integrity gate, Phase 1.8, applied to
   this managed-section overwrite — content verification, NOT just a non-empty +
   end-marker check): confirm `.agents/rules/agile-workflow.md` exists AND that the
   dense rule content the slim removes from AGENTS actually landed there — each
   section is present (`### Tag semantics`, `### Test integrity`, the
   advisory-review paragraph, and Broad entry points), or recompute per the Phase
   1.8 provenance check. Only when the content is verified present do you write or
   refresh the slim AGENTS section (Phase 6), overwriting the managed AGENTS block.
   If verification fails, halt without touching the AGENTS section — the project
   keeps its current (full) section intact (no data loss).

User-owned and legacy rule prose (e.g. non-pattern `.claude/rules/*` content)
goes into a separate user-owned `.agents/rules/<name>.md` (e.g. `project.md`),
never inside the plugin `agile-workflow:rules` markers. The SessionStart and
host-supported PostCompact hook paths inject every `.agents/rules/*.md`, so both
plugin and user rules reach the agent without prompt-time fallback output.

### Phase 7: Preserve Claude Code compatibility

The canonical instruction file (Phase 2.5) is canonical. The *other* entrypoints
are compatibility pointers and should not become independent copies.

**`entrypoint_model: claude-source` carve-out.** When the user chose to keep
`CLAUDE.md` as the content source, `CLAUDE.md` IS the canonical instruction file
and root `AGENTS.md` is its pointer (created in Phase 2.5). In this mode, do NOT
migrate `CLAUDE.md` into AGENTS, do NOT replace `CLAUDE.md` with a symlink, and
do NOT import its content elsewhere — the managed section and conventions were
written into `CLAUDE.md` itself. Still normalize any *nested* Claude duplicates
(`.claude/CLAUDE.md`, `.agents/CLAUDE.md`) to point at `CLAUDE.md` —
content-integrity gate first, so a nested duplicate carrying unique content not
already in `CLAUDE.md` is preserved, not replaced. Skip the rest of this phase's
root-`CLAUDE.md` handling.

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
     user confirms that exact path, **and only after the content-integrity gate
     (Phase 1.8) confirms every imported block landed** (presence + provenance +
     anchors). Otherwise leave it in place and report the duplicate entrypoint.
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
legacy Claude rules file, not a compatibility entrypoint. Build the **Phase 1.8
block-level preservation manifest** for it and route each block by classification
(see Phase 2.5 and the DIY→canonical mapping in the reference) — do not dump it
wholesale into AGENTS:

1. For each block of a regular-file rules file not already present at its
   canonical destination (`landed_existing`):
   - **Structural-pattern blocks** (chiefly in `patterns.md`) → import via the
     **convert-owned verbatim legacy-pattern importer** below. State after this
     step: `landed_this_run`.
   - **Rule-prose blocks** (the common case for other rules files) → write to
     `.agents/rules/<name>.md` (default `project.md`; NEVER `patterns.md`, which is
     reserved for gate-patterns' generated digest, and NEVER `agile-workflow.md`,
     which is plugin-managed) as user-owned rules the hook
     force-loads — under a short `## Imported Claude Rules` heading, OUTSIDE the
     plugin `agile-workflow:rules` markers. NOT the AGENTS canonical file.
   - **Ambiguous blocks** → `preserved_in_place`; leave them in the source.

   **Convert-owned verbatim legacy-pattern importer (NO discovery filter).**
   `gate-patterns` is a *discovery* writer: its sub-agent only emits patterns
   that recur 3+ times in the bundle, and it explicitly says legacy
   `.claude/rules/patterns.md` is convert's job — so routing legacy patterns
   "through gate-patterns Phase 1" would silently drop single-use and two-use
   legacy patterns. Convert therefore owns the lossless *import* of existing
   patterns, reusing only gate-patterns' file/index **format**:
   - For each structural-pattern block, write
     `.agents/skills/patterns/<slug>.md` verbatim in the gate-patterns
     Phase 4 file format (the pattern body — name, rationale, examples, when to
     use / not use, common violations — everything except the `Index entry`
     line). Apply **no 3+-occurrence filter**: every legacy pattern is imported,
     regardless of how many times it occurs.
   - Append the source-block provenance comment
     (`<!-- agile-workflow:provenance src-sha256=<digest> -->`) so the
     content-integrity gate can verify the import landed.
   - Update `.agents/skills/patterns/SKILL.md` (the index) per gate-patterns
     Phase 5, merging the new entries with any existing ones; never duplicate an
     entry already indexed.
   - gate-patterns remains the discovery writer for NEW patterns found in
     release bundles; convert owns lossless import of EXISTING legacy ones.
2. **Content-integrity gate before any shim/removal.** Replacing the rules file
   with the shim below is a source-eliminating op, so the content-integrity gate
   (Phase 1.8) permits it only when **every** user block is `landed_*` (any
   `preserved_in_place` or `ambiguous` block keeps the file in place, unshimmed),
   AND `cleanup_scope` allows generated cleanup or the user confirms that exact
   path, AND the reference-integrity check (Phase 1.8) has rewritten or shimmed any
   inbound references. **`patterns.md` carve-out:** `patterns.md` is NEVER
   treated as "generated cleanup" — its content is user/legacy data, so the
   `generated-only` shortcut does NOT authorize shimming it. Shim `patterns.md`
   only under explicit per-path user confirmation, AFTER the content-integrity
   gate passes. If any block is `ambiguous`/`unsafe`, leave the whole file in
   place and report it.

   ```markdown
   # Pattern Rules

   Reusable code patterns now live in `.agents/skills/patterns/` (load the
   `patterns` skill for detail). Project agent rules live in
   `.agents/rules/*.md`. Read those.
   ```

3. If the file is already a symlink or shim that points to the canonical
   destinations, verify the target exists and is non-dangling, then leave it
   alone (do not re-migrate the shim's pointer text as content).

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

**Terminal retention applies to seeding.** When `terminal-tier retention: delete-refs` (the
default), seed terminal buckets as refs, not full bodies: `done-archived` → a bodyless stub
(frontmatter + `# Title` + `git_ref` + `archived_atop`, per the review skill's stub shape; compute
`archived_atop` per the SPEC "`archived_atop` computation" — latest released tag at the item's
archival, else `pre-release`); `done-shipped` → a row in the single `release-v0.md` summary table
(id, title, kind, `archived_atop`, git ref), not a per-item file. Only `retain-bodies` keeps full
bodies.

**Sync existing substrates to delete-refs.** When converting/syncing a repo that already uses the
substrate and `delete-refs` is selected, detect retained full-body terminal items — full bodies in
`.work/archive/*.md` and `.work/releases/<version>/<id>.md` (anything beyond the
`release-<version>.md` summary) — and **offer** (AskUserQuestion; never force) to prune them to
current practice. The prune ALSO stamps `archived_atop`:

- archived bodies → bodyless stubs. Capture each `git_ref` from `git log -- <path>`. Stamp
  `archived_atop` from history: the latest release that existed at the commit where the item reached
  `done`/was archived (the newest release tag — or `.work/releases/<version>/` summary — reachable
  from `git log -- <path>`'s last touching commit), else `pre-release`. Stamp once; if a stub already
  carries `archived_atop`, preserve it.
- released bodies → folded into their `release-<version>.md` summary table (with their `archived_atop`
  column, `—` if unknowable from history), then `git rm`.

Preserve-only stays the default per convert's posture.

**Converge a bespoke "Done-item archival" convention.** A repo may already carry a hand-rolled
`## Done-item archival` (or similarly named) section in `.work/CONVENTIONS.md` describing
`archived_atop` late-binding. Detect it; do NOT duplicate it alongside the merged
`Terminal-tier retention` convention. Offer (AskUserQuestion; never force) to **converge** it: fold
its semantics into the one merged `Terminal-tier retention` section and remove the bespoke section,
preserving any project-specific rules it carried (custom in-body markers, date metadata, etc.) by
routing them to a user-owned `.agents/rules/<name>.md` rather than dropping them. The
content-integrity gate (Phase 1.8) applies before removing the bespoke section.

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
3. Apply only the confirmed path actions, and only after the content-integrity
   gate (Phase 1.8) confirms each path's content is preserved at its destination
   (the seeded `.work/` items here) and the reference-integrity check clears the
   move. Prefer `git mv` when the user wants a retained legacy copy; use
   `git rm` only for paths explicitly chosen for deletion.

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
  import their pattern definitions into `.agents/skills/patterns/` via the
  **convert-owned verbatim legacy-pattern importer** (Phase 7) — verbatim, in
  the gate-patterns file/index format, with NO 3+-occurrence discovery filter.
  Do NOT route them "through gate-patterns Phase 1" (its discovery filter would
  drop legacy single-use patterns). Keep an optional `.claude/skills/patterns/`
  symlink mirror.
- **Refactor-mirroring skills** (`structural-refactor`, `stylistic-refactor`,
  bespoke `refactor-conventions`) → split into AGENTS
  `## Refactor Style Conventions` (style rules) and
  `.agents/skills/refactor-conventions/` (detailed references) per
  `refactor-conventions-creator` Phase 5; drop any standalone-plan-doc
  instruction.
- **`plugin-mirror-divergent-copy` entries** → reconcile unique content into
  the `.agents` canonical, then re-establish the `.claude` mirror as a symlink.

Removing or replacing the bespoke source path is a destructive action governed
by the **content-integrity gate (Phase 1.8)**: build the block-level manifest
for the source, import its content, then **verify the import actually landed**
(presence + provenance digest + semantic anchors per the block-level
preservation manifest) BEFORE removing the source. Only after the gate passes, apply the reference-integrity-on-move
procedure (grep for inbound references — especially `.work/` items and `docs/` —
then rewrite or shim), and only then remove the original when `cleanup_scope`
allows it and the exact path is confirmed. If verification fails or any block is
ambiguous, write the canonical copy and leave the bespoke source in place,
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
git add .work/ AGENTS.md .agents/AGENTS.md .claude/AGENTS.md CLAUDE.md .claude/CLAUDE.md .agents/CLAUDE.md .agents/rules/ MIGRATION_REPORT.md
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
    `<!-- agile-workflow:end -->` vs the canonical (slim) template in Phase 6. If
    the section still carries the OLD dense prose inline (`### Tag semantics`,
    `### Test integrity`, the advisory-review paragraph), classify it
    `drift_plugin` "needs extraction" — Phase S3 migrates that prose to
    `.agents/rules/agile-workflow.md` (rules-first, then slim) without loss.
  - `.agents/rules/agile-workflow.md` between `<!-- agile-workflow:rules:start -->`
    / `<!-- agile-workflow:rules:end -->` vs the Phase 6.5 template — `missing`
    (install), `match` (skip), or `drift_plugin` (refresh the marker block only,
    preserving out-of-marker and other `.agents/rules/*.md`).
  - `.work/bin/work-view` — check existence and executability first (the
    `work_view` doctor marker). If `.work/bin/work-view` is absent or not
    executable, classify as `missing` and re-run the installer. If it exists and
    is executable, run `.work/bin/work-view --version` and compare its last token
    to the plugin version from
    `${PLUGIN_ROOT:-${CLAUDE_PLUGIN_ROOT}}/.claude-plugin/plugin.json`. If
    `--version` is unrecognized, empty, non-zero, or reports a different
    version, classify as `drift_plugin` and re-run the installer (this catches
    pre-versioning and stale plugin copies). If `--version` matches the plugin
    version, classify as `match`. Compare `--version`, never bytes; the
    source-stamped version is the freshness signal.
  - `CLAUDE.md` compatibility state (symlink/shim/legacy copy)
  - `.claude/rules/patterns.md` state (legacy content vs AGENTS shim)
  - `.work/CONVENTIONS.md` load-bearing tag entries (see below). The rest of
    CONVENTIONS is user-owned and untouched.
  - `.work/CONVENTIONS.md` **Terminal-tier retention** state (the merged convention — see
    "Terminal-tier retention drift" below). The per-project CONVENTIONS template is **value-only** (a
    `## Terminal-tier retention` heading + a bare `delete-refs`/`retain-bodies` value); the merged
    prose lives in SPEC.md, never duplicated per project. Classify it `missing` (no section/value at
    all — a real gap on repos converted before this convention existed), `match` (a bare
    `delete-refs`/`retain-bodies` value — the canonical value-only form), or `partial` only when the
    value is absent under the heading or contradictory/bespoke. Also detect a bespoke
    `## Done-item archival` (or similarly named) section that duplicates the merged model; flag it as
    a convergence candidate.
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

**Terminal-tier retention drift in CONVENTIONS.md.** This was a real gap: sync historically neither
seeded nor offered the terminal-retention convention, so repos converted before it existed silently
lack it. The per-project CONVENTIONS form is **value-only** — a `## Terminal-tier retention` heading
plus a bare `delete-refs`/`retain-bodies` value. The merged prose (archival + `archived_atop`
late-binding + one-summary release) lives in SPEC.md and is the single source of truth; it is NOT
duplicated into each project's CONVENTIONS.md. A bare value is therefore the **canonical** form, not
a partial one. Detect:

- **`missing`** — no `## Terminal-tier retention` section, OR a heading with no value under it. S3
  offers to add the heading + canonical value line (default `delete-refs`) — just the value line
  under the heading, not the full SPEC prose.
- **`match`** — a `## Terminal-tier retention` heading with a bare `delete-refs` or `retain-bodies`
  value. This is the canonical value-only form (prose lives in SPEC, not per project). No-op — a repo
  bootstrapped by this version lands here on its next sync.
- **`partial`** — the value is contradictory or bespoke: a value that is neither `delete-refs` nor
  `retain-bodies`, or inline prose under the heading that conflicts with the SPEC model. S3 offers to
  reconcile it to a canonical bare value.
- **bespoke-overlap** — a hand-rolled `## Done-item archival` (or similar) section describes the same
  `archived_atop` late-binding model. S3 offers to **converge** it into the one merged
  `Terminal-tier retention` section (route any project-specific rules it carries to a user-owned
  `.agents/rules/<name>.md`), not duplicate it.

**Retained terminal bodies (for the prune offer).** Independently of the convention text, scan for
full-body terminal items the merged `delete-refs` model would prune: any `.work/archive/*.md` carrying
body content beyond `# Title` (or lacking `archived_atop`/`git_ref`), and any
`.work/releases/<version>/<id>.md` other than the `release-<version>.md` summary. Record the count so
S3 can offer the prune-to-stubs migration (which stamps `archived_atop` + `git_ref` from history).

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
content not yet in `AGENTS.md`, import it and let the content-integrity gate
(Phase 1.8) verify it landed before replacing the Claude file with a
symlink/shim (S3); in `claude-source`, `CLAUDE.md` is canonical, so import
nothing out of it and only verify root `AGENTS.md` points at it.

If `.claude/rules/patterns.md` is absent, treat the legacy-rules state as
`match` and take no action. If it contains non-shim content not yet present at
its canonical destination, build the **Phase 1.8 block-level preservation
manifest** and route each block by classification before any shim: structural-
pattern blocks → `.agents/skills/patterns/` via convert's **verbatim
legacy-pattern importer** (Phase 7 — verbatim, no 3+-occurrence filter);
rule-prose blocks → `.agents/rules/<name>.md` (e.g. `project.md`), NOT the AGENTS
canonical file; ambiguous blocks → preserve in place. Do not import the whole
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

- `.agents/rules/agile-workflow.md` + canonical instruction section
  (rules-first, then slim) — FIRST write/refresh `.agents/rules/agile-workflow.md`
  between its `<!-- agile-workflow:rules:start/end -->` markers (Phase 6.5) and
  verify per the Phase 6.5 content check (the dense rule sections actually landed,
  not merely non-empty + end marker). THEN overwrite the
  AGENTS managed section with the slim Phase 6 template, in whichever file holds it
  per the derived `entrypoint_model` (`AGENTS.md` or, for `claude-source`,
  `CLAUDE.md`). If the file lacks markers, append the section; if it doesn't exist,
  create it. **Full-AGENTS migration:** when S1 found an AGENTS section that still
  carries the old dense prose (tag semantics / test integrity / advisory review
  inline), this IS the extraction migration — the rules-first verify guarantees
  the dense prose lands in `.agents/rules/agile-workflow.md` before the section is
  slimmed, so no rule content is lost. If the verify fails, do NOT slim — leave the
  existing full section intact and report it.
- `.work/bin/work-view` — reinstall via
  `bash "${PLUGIN_ROOT:-${CLAUDE_PLUGIN_ROOT}}/scripts/install-work-view.sh"`
  (installs the version-verified prebuilt Rust binary on supported platforms,
  with the Bash fallback only on unsupported platforms). This replaces any
  pre-versioning copy in place. After
  reinstalling, ensure `.work/bin/work-view` is tracked and agent-visible: run
  `git check-ignore .work/bin/work-view`; if it reports a matching ignore rule,
  surface that rule for removal or a negation entry under convert's
  preserve-by-default cleanup policy rather than silently editing ignore files.
  Ensure `.work/bin/work-view` is included in the Phase S5 `git add`.
- Entrypoint compatibility — refresh the pointer in the direction set by
  `entrypoint_model`:
  - `agents-canonical` — import legacy generated content from any detected
    Claude candidate into `AGENTS.md`, then replace the Claude file with a
    symlink/shim to it only after the content-integrity gate (Phase 1.8)
    confirms every imported block landed, AND `cleanup_scope` allows generated
    cleanup or the user confirms that exact path.
  - `claude-source` — `CLAUDE.md` is the canonical instruction file: its managed
    section between markers IS refreshed in place (handled by the canonical-file
    step above), but its content is never migrated out and the file is never
    replaced by a pointer. Here, only ensure root `AGENTS.md` is a symlink/shim
    pointing at `CLAUDE.md`, and normalize nested Claude duplicates to point at
    `CLAUDE.md` — content-integrity gate first, so a nested duplicate with unique
    content not already in `CLAUDE.md` is preserved, not replaced.
  If symlinks are unavailable, write the Phase 7 shim under the same cleanup
  authorization.
- Legacy `.claude/rules/*.md` — only when present, build the Phase 1.8
  block-level manifest and route non-duplicate blocks by classification
  (structural-pattern blocks → `.agents/skills/patterns/` via convert's verbatim
  legacy-pattern importer, NO discovery filter; rule-prose blocks →
  `.agents/rules/<name>.md`, NOT the AGENTS canonical file; ambiguous → preserve
  in place). The **`drift_user` / ambiguous atomic sequence** is
  **confirm → import → verify → shim** (never shim before a verified import):
  confirm with the user, import the blocks, run the content-integrity gate to
  verify they landed (presence + provenance + anchors), THEN — only when cleanup
  is authorized for that exact path and after the reference-integrity check —
  replace the file with the Phase 7 shim. `patterns.md` is never "generated
  cleanup"; shim it only under explicit per-path confirmation after the gate
  passes. Never import the whole file into AGENTS.
- Optional pattern and refactor-conventions mirrors — `.claude/skills/*` mirror
  replacement is a destructive op, so the content-integrity gate runs first: align
  `.claude/skills/*` to `.agents/skills/*` only when the `.agents` catalog exists
  (the verified home) and the Claude copy is absent, a symlink, or a known
  generated mirror, and cleanup is in scope for generated mirrors. If the Claude
  copy contains unique user content, the gate keeps it — reconcile that content
  into `.agents` first, then re-mirror; never overwrite it unverified.
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

- **Terminal-tier retention convention in `.work/CONVENTIONS.md`** — for the state flagged in S1
  (`missing` / `partial` / bespoke-overlap), offer via `AskUserQuestion` (never silently rewrite
  user-owned CONVENTIONS). A bare `delete-refs`/`retain-bodies` value is `match` and is left
  untouched — the merged prose lives in SPEC, not per project, so a bare value is canonical:
  - `missing` — "Your `.work/CONVENTIONS.md` has no `## Terminal-tier retention` value. Add it
    (default `delete-refs`)?" On accept, append **just the value-only form** — the
    `## Terminal-tier retention` heading + a bare `delete-refs` value line per the SPEC CONVENTIONS
    template — NOT the full SPEC prose (the prose is SPEC's, not duplicated into CONVENTIONS). A repo
    bootstrapped this way classifies as `match` on its next sync.
  - `partial` — only fires when the value is contradictory or bespoke (not a bare
    `delete-refs`/`retain-bodies`, or inline prose that conflicts with the SPEC model). "Your
    terminal-retention value is non-standard. Reconcile it to a canonical bare
    `delete-refs`/`retain-bodies` value?" Options: `Reconcile` / `Keep mine` / `Show diff`. On
    accept, replace the section with the value-only form (preserve the intended
    `delete-refs`/`retain-bodies` choice).
  - bespoke-overlap (a hand-rolled `## Done-item archival` section) — "You have a custom
    `## Done-item archival` section describing the same `archived_atop` model. Converge it into the
    one merged `Terminal-tier retention` convention (removing the duplicate, preserving any
    project-specific rules to `.agents/rules/<name>.md`)?" On accept, fold its semantics into the
    merged section, route project-specific rules to a user-owned rules file, and remove the bespoke
    section only after the content-integrity gate (Phase 1.8) confirms nothing is dropped.

- **Prune retained terminal bodies to stubs (the offer)** — when S1 found retained full-body terminal
  items and `delete-refs` is in effect, offer (`AskUserQuestion`; never force, preserve-only stays the
  default) the prune-to-current-practice migration from Phase 8's "Sync existing substrates to
  delete-refs": archived bodies → bodyless stubs (capture `git_ref` from `git log -- <path>`, stamp
  `archived_atop` from the history at the archival/done commit, else `pre-release`); released bodies →
  folded into their `release-<version>.md` summary table, then `git rm`. The content- and
  reference-integrity gates (Phase 1.8) apply before any `git rm`.

For `drift_user` items, only proceed after the user confirms.

For bespoke overlaps in the `converge` set, run Phase 8.6's convergence
(deferring to the owning skill for layout) — sync converges the same way
bootstrap does.

For cleanup candidates, only proceed when the candidate class is inside
`cleanup_scope`, the content-integrity gate (Phase 1.8) has confirmed each
candidate's content is preserved at its destination, and the
reference-integrity-on-move check (grep for inbound references, rewrite or shim)
clears the move — then ask with exact paths before applying any `git mv` or
`git rm`. If the user declines, or the content-integrity gate finds an
unaccounted block, leave the files and report them as preserved.

### Phase S4: Preserve user state

These are NEVER touched in sync mode:

- `.work/CONVENTIONS.md` user-customized content. The exceptions, each applied in Phase S3 ONLY with
  user confirmation, are: (a) load-bearing tag entries (`refactor`, `perf`) when they match a known
  prior plugin default verbatim, and (b) the `## Terminal-tier retention` convention when it is
  `missing`/`partial`/a bespoke `## Done-item archival` overlap (add / reconcile / converge). A bare
  `delete-refs`/`retain-bodies` value is `match` and is left untouched. Everything
  else in CONVENTIONS — release mapping, project tags, slug conventions, gate config, any user
  prose — is untouched.
- Everything under `.work/active/`, `.work/backlog/`, `.work/releases/`,
  `.work/archive/`
- User-authored rule references under `.agents/skills/refactor-conventions/`.
  Sync may refresh the generated `SKILL.md` wrapper when it matches a known old
  template, but it must not rewrite rule bodies, examples, exceptions, or scope
  content without explicit confirmation.
- `.agents/skills/patterns/` pattern bodies. Sync may align mirrors and import
  verbatim legacy patterns (Phase 7), but `gate-patterns` owns pattern
  *discovery*; sync never rewrites an existing pattern body without confirmation.
- User-authored `.agents/rules/*.md` — every file other than the plugin-managed
  `agile-workflow.md`, and any content outside `agile-workflow.md`'s
  `<!-- agile-workflow:rules:start/end -->` markers. Sync refreshes only the
  plugin block; it never touches user rule files or out-of-marker content.
- Content in the canonical instruction file (`AGENTS.md`, or `CLAUDE.md` in
  `claude-source`) outside the agile-workflow markers, except imported legacy
  Claude *entrypoint* content (under `## Imported Claude Code Instructions`) and
  synthesized refactor style convention summaries the user confirms should become
  canonical. (Legacy `.claude/rules/*.md` rule prose is NOT imported here — it
  goes to `.agents/rules/<name>.md`.)
- `MIGRATION_REPORT.md` (a bootstrap artifact; sync never writes it)
- Any cleanup candidate outside the chosen `cleanup_scope`
- Any cleanup candidate not listed by exact path in the confirmed cleanup plan

### Phase S5: Commit

If any files were rewritten:

```bash
git add AGENTS.md .agents/AGENTS.md .claude/AGENTS.md CLAUDE.md .claude/CLAUDE.md .agents/CLAUDE.md .agents/rules/ .work/bin/work-view
# If any legacy rules shim was created or updated (not just patterns.md):
git add .claude/rules/
# If optional project skill catalogs or mirrors were aligned or converged:
git add .agents/skills/patterns .claude/skills/patterns .agents/skills/refactor-conventions .claude/skills/refactor-conventions
# If load-bearing CONVENTIONS tag entries OR the terminal-retention convention were
# refreshed/added/converged with user confirmation:
git add .work/CONVENTIONS.md
# If the user accepted the prune-to-stubs migration (archived bodies → stubs, released bodies → summary):
git add .work/archive/ .work/releases/
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
- **Content integrity is mandatory before every destructive op, and runs first
  (Phase 1.8).** Before any delete / move / symlink / shim / copy-over /
  managed-section overwrite / mirror replacement of a legacy artifact, build the
  block-level preservation manifest and confirm every block is terminal
  (`landed_existing` / `landed_this_run` / `preserved_in_place`) — present at its
  canonical destination with provenance + semantic anchors, or kept in place. If
  any block is unaccounted-for, do NOT perform the op; leave the artifact and
  report. Content inside plugin-managed markers never counts as preserved
  user-content. This preserves *content*; reference integrity preserves
  *pointers* — both are required.
- **Reference integrity is mandatory before every move/remove, regardless of
  `cleanup_scope`, and runs after content integrity.** Grep the repo (especially
  `.work/` items and `docs/`) for inbound references to any path being moved,
  removed, or replaced; then rewrite them or leave a redirect shim, and report
  which. Never strand a live pointer.
- **Legacy patterns are imported verbatim, never discovered.** Convert owns the
  lossless import of existing legacy structural patterns into
  `.agents/skills/patterns/` (gate-patterns file/index format, NO 3+-occurrence
  filter). `gate-patterns` remains the discovery writer for NEW patterns in
  release bundles. Never route legacy pattern content through gate-patterns'
  discovery filter — it would drop single-use legacy patterns.
- **Discovery over checklist.** Enumerate and classify both skill roots and the
  rules tree; never assume the only overlaps are the canonical `patterns` and
  `refactor-conventions` catalogs. Bespoke skills mirroring plugin concepts,
  plan-doc generators, and superseded commands are convergence candidates.
- **Defer to the owning skill for canonical locations.** Convert places
  content; `gate-patterns` and `refactor-conventions-creator` own where it
  lives. Do not carry a divergent end-state (e.g. never dump pattern content
  into AGENTS, and route legacy rule prose to `.agents/rules/<name>.md`, not
  AGENTS).
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
