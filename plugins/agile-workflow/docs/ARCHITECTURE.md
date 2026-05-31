# ARCHITECTURE: agile-workflow

How the substrate is laid out, how items move through it, how skills compose,
how autopilot drains queues respecting dependencies, how gates produce items,
and how the rules-file-as-agent-interface keeps it all navigable.

## Substrate layout

The substrate lives in `.work/` at the project root. Four tiers, two utility
files:

```
.work/
├── active/                in-flight, scoped, advancing through stages
│   ├── epics/<id>.md
│   ├── features/<id>.md
│   └── stories/<id>.md
├── backlog/               parked, unscoped, awaiting promotion
│   └── <id>.md            flat — no kind subdirectories
├── releases/              shipped bundles, one folder per version
│   └── <version>/
│       ├── <release-id>.md   the release item itself
│       └── <id>.md           items bound to this release
├── archive/               done items not bound to any release
│   └── <id>.md
├── bin/                   platform-matched prebuilt binary (or bash fallback)
│   └── work-view          installed by install-work-view.sh via convert
└── CONVENTIONS.md         project-specific overrides
```

Items live as files. Their location encodes their tier; their frontmatter
encodes everything else. Moving a file between tiers IS the operation that
transitions the item.

## Item lifecycle

An item flows through tiers as work progresses on it.

```
                       ┌──────────────┐
                       │   creation   │
                       └──────┬───────┘
                              │
       ┌──────────────────────┼────────────────────────┐
       │                      │                        │
       ▼                      ▼                        ▼
  /park                /scope (small/med)         /scope (large)
       │                      │                        │
       ▼                      ▼                        ▼
  backlog/<id>.md      active/<kind>/<id>.md     active/<kind>/<id>.md
                                                 + foundation docs roll
                              │
                              ▼
                  /design | /refactor-design | /perf-design
                  (routed by tags)
                              │
                              ▼
                       stage: drafting → implementing
                       (design written into body; child stories spawned)
                              │
                              ▼
                  /implement-orchestrator (default; scope-driven,
                  cross-feature waves) or /implement (inline alternative)
                              │
                              ▼
                       stage: review
                              │
                              ▼
                       /review (advance to done)
                              │
            ┌─────────────────┼─────────────────┐
            ▼                 ▼                 ▼
   /release-deploy        no binding        no binding,
   binds to release                         superseded
            │                 │                 │
            ▼                 ▼                 ▼
   releases/<v>/<id>     archive/<id>      archive/<id>
```

### Item creation entry points

1. **`/park`** — captures a quick idea mid-conversation as a flat backlog
   file. Used when something surfaces that shouldn't derail the current
   thread.
2. **`/scope` on a backlog item** — promotes an existing backlog idea to
   active, decides its kind (epic/feature/story), and writes the kind-file
   with full frontmatter including any declared dependencies.
3. **`/scope` on a fresh request** — when a new direction arrives directly
   to active without parking first. If scope is large enough to change the
   project's vision/spec/architecture, scope rolls foundation docs forward
   as part of the operation.

### Stage advancement

Stages advance only when work completes; they are never pre-populated.

| Kind | drafting | implementing | review | done |
|---|---|---|---|---|
| epic | initial state when scoped | once children are designed and started | once all children are at review/done | once all children are at done |
| feature | initial state when scoped | once design is written into body and acceptance criteria clear | once code lands and tests pass | once user-facing review approves |
| story | optional initial state | initial state more often (skips drafting) | once code lands | once user/code-review approves |
| release | initial state when cut | once gates begin running (`stage: quality-gate`) | n/a | n/a — terminal stage is `released` |

The PostToolUse hook auto-bumps `updated:` whenever an item file is edited;
skills only need to advance `stage:` explicitly.

## Dependency graph

Items declare ordering via `depends_on: [<id>, ...]`. This is **sequencing**,
distinct from `parent` (which is **hierarchy**).

### Rules

- An item is **ready** when it is in the active tier, its `stage` is
  `drafting`, `implementing`, or `review`, AND every `depends_on` entry is
  terminal (`stage: done`/`released`, or resident in `releases/`/`archive/`).
- Dependencies must form a DAG. Cycles are invalid; skills that produce
  items must validate no cycle is introduced before writing.
- Cross-tier dependencies are allowed (a feature can depend on an epic;
  a story can depend on a feature in another epic).
- Dependencies on archived or released items count as `done` — those tiers
  are terminal-done.

### When skills declare dependencies

| Skill | Declares dependencies between |
|---|---|
| `scope` | The new item and any items the user mentions as prerequisites |
| `epic-design` | Child features of the epic being decomposed (some sequential, some parallel) |
| `feature-design` / `refactor-design` / `perf-design` | Child stories of the feature being designed (some sequential, some parallel) |
| `implement-orchestrator` | Read existing dependencies; do not modify; respect when fanning out |
| `epicize` | Epics where one's output feeds another |
| `convert` | Inferred from source: workflow `ROADMAP.md` phase order → epic-level deps; ad-hoc gets no inferred deps |
| `bold-refactor` | Child features of a refactor epic when order matters |

### Cycle prevention

Every skill that adds a `depends_on` entry runs a quick reachability check
via `work-view --blocking <id>` before writing. If adding the entry would
create a cycle (target reaches back to the source), the skill reports the
cycle and asks the user to resolve.

## Tier transitions

| From | To | Trigger | Mechanism |
|---|---|---|---|
| (none) | backlog | `/park` | New file in `.work/backlog/<id>.md` |
| backlog | active | `/scope` | `git mv` to `.work/active/<kind>/<id>.md`; frontmatter populated |
| (none) | active | `/scope` (skipping backlog) | New file in `.work/active/<kind>/<id>.md` |
| active | releases | `/release-deploy` shipping | `git mv` to `.work/releases/<version>/<id>.md`; `release_binding` already set |
| active | archive | item reaches `done` without `release_binding` | `git mv` to `.work/archive/<id>.md` |
| backlog | (deleted) | user discards via `/scope` rejection | `git rm` (history retained) |

Every tier transition is a `git mv` so history is preserved. The substrate's
audit trail IS the git log of the file's path changes.

## AGENTS.md substrate section

`convert` writes a **slim** agile-workflow section into the selected AGENTS
target in every bootstrapped project. It is dense pointers — substrate
orientation, `work-view` query patterns, grep-able pointers to the canonical
rules file `.agents/rules/agile-workflow.md` and the `patterns` skill, and a
MANDATORY "read `.agents/rules/*.md` before designing/implementing/reviewing"
read-directive. Every line is something the agent greps or runs as a literal
command, not narrative prose. The dense behavioral rules (tag semantics, test
integrity, advisory review, entry points) do not live here — they live in
`.agents/rules/agile-workflow.md`, which the hook force-loads (see Hook scripts)
and the design/implement/review skills read in their grounding phase. The
read-directive is the graceful-degradation guarantee: AGENTS always loads, so
even when the hook does not fire (no substrate, untrusted hook, non-coding
session) the agent is told where the rules live.

Navigation reference content:

````markdown
---
description: Agile-workflow substrate navigation rules
paths: ['.work/**', 'docs/**']
---

# Agile-Workflow Substrate Navigation

## Folder structure
.work/active/{epics,features,stories}/  in-flight, scoped
.work/backlog/                           parked, unscoped
.work/releases/<version>/                shipped bundles
.work/archive/                           done items not bound to a release

## Item kinds
epic     multi-feature arc; has children    parent of features
feature  design + implementation unit       parent of stories
story    single-session unit                leaf or has tasks
task     checklist line in parent body      not its own file
release  version bundle in releases/        binds items via release_binding

## Stages
epic     drafting → implementing → review → done
feature  drafting → implementing → review → done
story    implementing → review → done       (often skips drafting)
task     [ ] → [x]
release  planned → quality-gate → released

## Frontmatter
id, kind, stage, tags[], parent, depends_on[], release_binding,
gate_origin, created, updated

## Querying with work-view (primary tool)

`.work/bin/work-view` is the canonical query tool — use it instead of
hand-grepping frontmatter. Filters compose with AND semantics; combine
freely. Run `--help` for the authoritative flag list.

### Filters
--stage <stage>      drafting | implementing | review | done | released
--tag <tag>          repeatable; AND across tags
--kind <kind>        epic | feature | story | release
--parent <id>        direct children of given item
--release <version>  items with release_binding: <version>
--gate <name>        items produced by gate <name>
--ready              active-tier drafting/implementing/review, all depends_on terminal
--blocked            active-tier drafting/implementing/review, >=1 non-terminal dep
--blocking <id>      items that depend on <id>

### Output modes
(default tabular)    columns: ID  KIND  STAGE  TAGS  PARENT
--paths              one file path per line (pipe-friendly)
--cat                full item bodies, separated by ---
--count              match count only

### Common queries

# Items ready to work right now
.work/bin/work-view --ready

# Items awaiting user review
.work/bin/work-view --stage review

# All children of an epic
.work/bin/work-view --parent <epic-id>

# Children of an epic that are still blocked
.work/bin/work-view --parent <epic-id> --blocked

# Read full bodies of every item bound to a release
.work/bin/work-view --release v1.2.0 --cat

# Security-tagged items currently implementing
.work/bin/work-view --stage implementing --tag security

# Items that would unblock if <id> finishes
.work/bin/work-view --blocking <id>

# Pipe paths into another tool
.work/bin/work-view --ready --paths | xargs grep -l 'TODO'

## Fallback: raw substrate access

When work-view doesn't fit (e.g. searching item bodies, not frontmatter):

# Search inside item bodies
grep -rn '<phrase>' .work/active/

# Item history
git log -p -- .work/active/features/<id>.md

# Recent substrate changes
git log --since='1 day ago' -- .work/

## Session start checklist
1. cat .work/CONVENTIONS.md            project-specific overrides
2. .work/bin/work-view --stage review  items waiting on user
3. .work/bin/work-view --ready         items ready to work
4. Identify your work: explicit user ask, or pick the next ready item

## Stage transition discipline
- Update `stage:` and let PostToolUse hook auto-bump `updated:`
- Commit after each stage transition (one commit per item per transition)
- Do not pre-populate stages; advance only as work completes

## Foundation docs (rolling-forward principle)
docs/ holds standing context: VISION.md, SPEC.md, ARCHITECTURE.md, etc.
- Foundation docs describe the system as it is NOW
- Never add "previously this was…" or "note: in v1.2 we…"
- When implementation changes a foundation-doc assertion, update the doc
- Git history is the audit trail; the doc is the present
````

The agent loads this automatically when working in `.work/` or `docs/`. The
`paths:` glob keeps it out of the way when working elsewhere.

## Design family routing

Four skills share the design slot, routed by item kind first, then tags:

| Skill | Triggered by | Cognitive shape |
|---|---|---|
| `epic-design` | epic at `stage: drafting` | Epic decomposition: capability-arc identification, child-feature spawning with `depends_on` chains, decomposition pre-mortem. Writes the realized decomposition into the epic body |
| `feature-design` | feature at `stage: drafting`, no specialized tag | Greenfield feature design: vision absorption, codebase mapping, unit decomposition, pre-mortem, test design |
| `refactor-design` | feature with `tags: [refactor]` at `stage: drafting` | Refactor planning: code-smell scan, before/after step shape, risk + rollback per step, cost-benefit framing |
| `perf-design` | feature with `tags: [perf]` at `stage: drafting` | Perf design: bottleneck identification, measurement strategy, hot-path analysis |

Each writes its output into the item's body and advances stage to
`implementing`. `epic-design` spawns child features at `stage: drafting` (which
the feature-level family then picks up); the feature-level skills spawn child
stories at `stage: implementing` with declared dependencies.

The model picks the right skill from kind + tags. SKILL.md `description:`
fields cross-reference each other so the agent doesn't pick the wrong one.
New design specializations (e.g., `security-design`) join the family by
adding a tag and a skill — no architectural change.

## Autopilot algorithm

Autopilot is the queue policy for autonomous substrate goals. The preferred
shape is a harness goal statement that names the skill and scope:

```text
Use agile-workflow autopilot to drain <epic-id>
Use agile-workflow autopilot to drain --all
```

Direct skill invocation remains supported: `/agile-workflow:autopilot
<epic-id>` drains one epic, and `/agile-workflow:autopilot --all` drains all of
`.work/active/`. In both cases, autopilot does not create `/loop` schedules or
maintain a progress file; harness goal/continuation owns long-running
persistence and `.work/active/` is the resume point.

### Pre-flight: align on strategic questions first

**Before kicking off autopilot, run `epic-design --only-questions` over the
epics you're about to drain.** This is the single highest-leverage step in
the agile-workflow loop and should generally always be done.

```bash
# Per-epic — align on one epic before autopilot picks it up
/agile-workflow:epic-design --only-questions <epic-id>

# Cover the whole active queue at once — recommended before a --all autopilot goal
/agile-workflow:epic-design --only-questions --all
```

What the pass does (see `epic-design` SKILL Phase 4.7): for each epic at
`stage: drafting`, it grounds in foundation docs + codebase, surfaces the
2–5 directional product / architecture / scope questions specific to that
epic, asks the user via `AskUserQuestion`, and writes the answers under
`## Design decisions` in the epic body. It does NOT decompose into child
features and does NOT advance stage — that's left to the real design pass.

Why it matters:

- **Autopilot inherits the answers.** When `epic-design` (full pass) runs
  later under autopilot, it reads the already-captured `## Design decisions`
  and skips Phase 4.7 — no autonomous judgment on directional choices,
  because they're already locked in by the user.
- **Cheap up front, expensive later.** Five minutes of interactive Q&A on
  the whole drafting queue prevents autopilot from committing to a wrong
  architectural direction across multiple features before the user notices.
- **One human checkpoint instead of N.** A single `--only-questions --all`
  pass answers every strategic question across the queue in one sitting,
  rather than autopilot pausing per-epic mid-run (or worse, not pausing and
  guessing).

`--only-questions` mode refuses to run under autopilot itself — it's
explicitly a pre-autopilot, human-in-the-loop step. The right invocation
shape is: `--only-questions --all` first, review the captured decisions,
then start an autopilot goal for `--all` (or `<epic-id>`).

### Queue selection algorithm

```
1. Collect candidate items:
   - if epic-scoped: items with parent == <epic-id>, transitively
     (include grandchildren via parent chain)
   - if --all: all items in .work/active/
2. Filter to stage in {drafting, implementing, review}
3. For each candidate, check depends_on:
   - all deps must be at stage: done (or in releases/archive)
   - candidates with unmet deps are filtered out
4. Sort the remaining candidates by:
   - depends_on count ascending (less-blocked items first)
   - created ascending (FIFO tie-break)
5. Pop the first item.
6. Work it:
   - if drafting → invoke /design (or /refactor-design / /perf-design by tag)
   - if implementing → invoke /implement-orchestrator with the autopilot
     scope (the picked item is an anchor; the orchestrator drains the whole
     in-scope implementing band as one batch, cross-feature is fine).
     /implement is reserved for the inline small-delivery case.
   - if review → invoke /review (autonomous: produces verdict, advances
     review→done or sends back to implementing)
7. Advance stage on completion. Commit.
8. Goto 1 unless stop condition.
```

### Stop conditions

- Empty queue (all candidates exhausted)
- User invokes a halt command or sends a manual prompt
- A skill reports a blocker that can't be resolved autonomously

### Harness goal continuation

Autopilot does not own continuation mechanics. Claude/Codex harness goal
features keep the run alive across compaction and continuation turns. If a run
resumes, the agent re-reads `.work/active/` and applies the same queue selection
algorithm. There is no `--resume`, no watchdog `/loop`, and no `PROGRESS.md`.

### Refactor cadence during --all mode

Every N items completed (default N=5), autopilot delegates a conservative
discovery pass to `refactor-design` over recently touched files. That skill
classifies pure refactors vs behavior-changing work and emits the appropriate
items. The next queue rebuild picks them up naturally.

The refactor cadence is conservative: never invokes `bold-refactor` (that's
user-only). Only scopes incremental refactor features.

## Hook script behavior

### `hooks/scripts/prompt-context.py`

**Activation gate:** exits 0 if no `.work/CONVENTIONS.md` exists in the hook
`cwd` or any ancestor.

**SessionStart / PostCompact effect:** updates prompt-context state under the
host-provided plugin data directory (`PLUGIN_DATA` / `CLAUDE_PLUGIN_DATA`),
falling back to `XDG_STATE_HOME`, `~/.local/state`, or the system temp directory
only when no plugin data directory is available. `SessionStart` resets the
per-session epoch and seen-set; `PostCompact` bumps the epoch. Prompt-time
principles capsules fire at most once per session, and once again after
resume/compaction. These events do not inject queue context and do not dirty the
project worktree. They DO emit the `.agents/rules/` block (below) directly — the
primary rules firing.

**`.agents/rules/` rules loader:** the script force-loads every
`<root>/.agents/rules/*.md` file (sorted, concatenated under a
`## Project Rules (.agents/rules/)` heading) into agent context, so producers
(`convert` writes `.agents/rules/agile-workflow.md`; `gate-patterns` writes
`.agents/rules/patterns.md`; the user adds their own) reach the agent reliably
in both Claude Code and Codex. It is content-agnostic — it injects whatever
`*.md` files exist. Firing is hybrid: **SessionStart/PostCompact emit
unconditionally** (mirroring the legacy `.claude/rules/` force-load, and
guaranteeing re-injection after compaction even with no user prompt), and a
**UserPromptSubmit coding-prompt fallback** emits once per epoch if the
session-start emission did not happen. The fallback uses a broad coding-prompt
detector — wider than the workflow gate, catching "fix failing tests",
"continue", "debug this build error", or a bare file-path reference. All paths
share per-epoch + SHA-256 content-hash dedup, so rules load exactly once per
`(epoch, content)`. `.work/CONVENTIONS.md` may set `rules_context: on|off`
(default on) and `rules_context_max_bytes: <int>` (default 12000); the byte cap
truncates with a notice while hashing the untruncated content so any edit
re-injects.

**UserPromptSubmit effect:** the queue snapshot and principles capsules emit only
for actionable workflow prompts: queue operations, stage movement, explicit
agile-workflow verbs, or a known item id. Explainer prompts and idle chat stay
silent. The `.agents/rules/` fallback uses its own broader coding-prompt gate
(above), independent of the workflow gate.

When it fires, the script returns JSON `hookSpecificOutput.additionalContext`
containing a compact queue snapshot and any principles capsules that have not
already fired in the current session epoch:

```
## Agile Workflow Snapshot
Ready: 2
- story-rate-limits (story, parent=feature-uploads-retry)
Review: 1
- feature-uploads-retry (feature, parent=epic-uploads)
Blocked: 1
- story-quota-display (story, parent=feature-uploads-retry)

## Agile Workflow Principles
Code-design capsule:
- Ports & Adapters: keep domain logic independent of DB/filesystem/HTTP/time/randomness.
- Single Source of Truth: define growing variant sets once; derive downstream behavior.
...
```

Implementation: deterministic Python over `.work/` and `.work/bin/work-view`.
No LLM.

### `hooks/scripts/substrate-maintainer.py`

**Activation gate:** exits 0 if the modified path doesn't match a markdown item
under `.work/active/`, `.work/backlog/`, `.work/releases/`, or `.work/archive/`.

**Effect:** for active/backlog item edits, replaces the `updated:` line in
frontmatter with today's date in local time. It then validates cheap substrate
invariants for the touched item(s): required frontmatter, valid kind/stage,
filename/id match, duplicate id conflicts involving the touched item, existing
parents and dependencies, and `depends_on` cycles reachable from the touched
item. Issues are returned as `hookSpecificOutput.additionalContext` so the next
model turn sees them.

This is a deterministic command hook — no LLM.

## Gate orchestration

`/release-deploy` orchestrates the gate sequence after items are bound to
a release. Default order: **security → tests → cruft → docs → patterns**.
Override via `gates_for_release` in `.work/CONVENTIONS.md`.

### Gate-as-item-producer pattern

Each gate scans the bundle of items at `release_binding: <current-version>`
and produces new items rather than emitting a pass/fail report:

| Gate | What it scans | What it produces |
|---|---|---|
| `gate-security` | Bound items' code changes against security checklist | Items with `gate_origin: security`, tagged `[security]`, `release_binding` set |
| `gate-tests` | Coverage of bound items' acceptance criteria | Items with `gate_origin: tests`, tagged `[testing]` for gaps |
| `gate-cruft` | Dead code introduced or revealed by the bundle | Items with `gate_origin: cruft`, tagged `[cleanup]` |
| `gate-docs` | Foundation-doc alignment with the bundle's behavior changes | Items with `gate_origin: docs`, tagged `[documentation]` — enforces rolling-foundation |
| `gate-patterns` | Reusable patterns that emerged in the bundle | Detailed pattern-skill files in `.agents/skills/patterns/` (single source of truth) with optional Claude mirror, the generated hook-loaded `.agents/rules/patterns.md` digest (slug+one-liner index pointing back at the skill, with banner + source hash), plus a tracking item with `gate_origin: patterns` |

Gate-produced items get `stage: implementing` (high-confidence findings),
`stage: drafting` (medium-confidence), or land in `.work/backlog/`
(low-confidence — for future consideration).

### Release readiness

A release is ready to ship when **all items with
`release_binding: <current-version>` are at `stage: done`**. Gate-produced
items count as part of this set. The release file's `stage` advances
`planned → quality-gate → released` accordingly.

### Idempotent re-runs

`/release-deploy` is idempotent. It doesn't duplicate items it's already
produced (skills check `gate_origin` and existing IDs before creating).
Re-running advances the release stage if the readiness condition flipped.

## AGENTS.md generation

`convert` and `epicize` both ensure the selected AGENTS target has the
agile-workflow section. The target can be `AGENTS.md`, `.agents/AGENTS.md`, or
`.claude/AGENTS.md`; root `AGENTS.md` is preferred and should exist as a
symlink/shim when the canonical content lives under `.agents/` or `.claude/`.
Format:

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
- `work-view --stage review` — items awaiting review
- `work-view --parent <id>` / `--blocking <id>` — hierarchy / sequencing
- `work-view --help` for the full flag set

Foundation docs in `docs/` describe the system NOW — never add legacy notes;
git history is the audit trail. The substrate itself is durable memory: record
decisions, blockers, implementation discoveries, and review findings in item
bodies instead of depending on chat history.

Reusable code patterns live in `.agents/skills/patterns/` (load the `patterns`
skill for detail). Project agent rules live in `.agents/rules/*.md`
(plugin-managed rules in `.agents/rules/agile-workflow.md`); do not maintain
`.claude/rules/*.md` as a source of truth.

**Before designing, implementing, or reviewing, read `.agents/rules/*.md`** —
the project's force-loaded agent rules (tag semantics, test integrity, review
policy). The agile-workflow hook auto-loads these at session start and after
compaction; read them directly when working without the hook.
<!-- agile-workflow:end -->
```

The dense behavioral rules referenced by the read-directive live in
`.agents/rules/agile-workflow.md` (between `<!-- agile-workflow:rules:start/end -->`
markers), which `convert` writes and verifies BEFORE slimming the managed AGENTS
section, so the overwrite can never drop rule content. The broad entry points
(`/agile-workflow:ideate`, `/agile-workflow:epicize`, autopilot goals such as
"Use agile-workflow autopilot to drain --all", `/agile-workflow:release-deploy`)
live there alongside tag semantics, test integrity, and advisory-review rules.

### Idempotency rules

- `convert --update` re-runs the section between markers, leaves the rest
  of the selected AGENTS target alone
- If markers are missing, `convert` appends the section with markers
- If the rest of `AGENTS.md` has user edits, those are preserved
- If the user manually edits inside the markers, `convert --update` warns
  before overwriting (interactive confirm)
- `CLAUDE.md`, `.claude/CLAUDE.md`, and `.agents/CLAUDE.md` are maintained only
  as compatibility symlinks to the selected AGENTS target. If symlinks are
  unavailable, each becomes a short shim that points Claude Code at `AGENTS.md`.
- Legacy `.claude/rules/*.md` content migrates via `convert`'s content-integrity
  gate during bootstrap or sync: each Markdown-aware block routes to its
  canonical home (structural patterns → `.agents/skills/patterns/`, rule prose →
  `.agents/rules/<name>.md`), every block is verified to have landed, then the
  legacy path is replaced with a shim. It is never maintained as a parallel rules
  file.

## Skill catalog

All skills with their roles, invocability, and triggers.

### Bootstrap (user-invocable only)

| Skill | Role | Trigger |
|---|---|---|
| `ideate` | Foundation-docs workshop. Produces VISION.md, SPEC.md, ARCHITECTURE.md, optionally PRINCIPLES.md / MIGRATION.md. No substrate dependency. | User-invoked |
| `convert` | Bootstraps `.work/` substrate. Reads existing project shape, writes AGENTS.md section, creates CLAUDE.md compatibility symlink/shim, writes CONVENTIONS.md, installs the platform-matched prebuilt `work-view` binary via `install-work-view.sh` (falling back to `work-view.sh`), seeds initial items. Idempotent via `--update`. | User-invoked, depends on ideate having run |
| `epicize` | Reads foundation docs. Produces multiple epics in `.work/active/epics/` at `stage: drafting`, with declared dependencies. | User-invoked, depends on convert having run |

### Capture & promotion (model-invocable)

| Skill | Role | Trigger |
|---|---|---|
| `park` | Quick capture of an idea into `.work/backlog/`. One-paragraph file, minimal frontmatter. | "park this", "remind me about X", "add to backlog" |
| `scope` | Promote backlog item or fresh request to `.work/active/`. Sizes as epic/feature/story. If large, rolls foundation docs forward. Declares dependencies. | "scope this", "promote this", "let's track this" |
| `fix` | Park-and-implement quick bug as a story. Single-stride: creates story at `stage: implementing`, writes fix, advances to review. | "fix bug X", "fix the typo in", "fix this issue" |

### Design family (model-invocable, kind- and tag-routed)

| Skill | Role | Trigger |
|---|---|---|
| `epic-design` | Epic decomposition. Spawns child features with declared `depends_on`, writes realized decomposition into epic body, advances stage. | epic at `stage: drafting` |
| `feature-design` | Greenfield feature design. Writes design into feature body, advances stage. Spawns child stories with declared deps. | feature at `stage: drafting`, no specialized tag |
| `refactor-design` | Refactor planning. Code-smell scan, before/after steps, risk + rollback per step. | feature with `tags: [refactor]` at `stage: drafting` |
| `perf-design` | Perf design. Bottleneck identification, measurement strategy, hot-path analysis. | feature with `tags: [perf]` at `stage: drafting` |

### Production (model-invocable)

| Skill | Role | Trigger |
|---|---|---|
| `implement-orchestrator` | Default. Orchestrates implementation sub-agents over a scope (feature, epic, --all, or explicit list). Builds a unified `depends_on` graph across the scope (cross-feature is fine), chooses bundles/waves/write-scope isolation, and advances every parent feature whose children all reach `review`. | item(s) at `stage: implementing` |
| `implement` | Inline alternative. Read item body, write code, run build+tests, advance stage. | small / focused work where sub-agent fan-out wouldn't pay off, or user asks to implement inline |

### Review & delivery (mixed invocability)

| Skill | Invocability | Role | Trigger |
|---|---|---|---|
| `review` | model-invocable | Code review of changes for an item. Triages findings into items with proper tags. Advances to done if approved. | item at `stage: review` |
| `release-deploy` | user-invocable | Bind items to release, run gates, ship, archive. Idempotent. | User-invoked when ready to cut a version |
| `bold-refactor` | user-invocable | Multi-feature architectural refactor. Scopes a refactor epic with child features. Aggressive — only on user request. | User-invoked |
| `autopilot` | model- and user-invocable | Goal-backed queue runner. Drains an epic or all active work using the harness goal/continuation feature. | Goal text like "Use agile-workflow autopilot to drain <epic>" or direct `/agile-workflow:autopilot --all` |

### Gates (model-invocable, fire during release flow)

| Skill | Role |
|---|---|
| `gate-security` | Security scan over bound items; produces items with `gate_origin: security` |
| `gate-tests` | Test-coverage scan; produces gap items with `gate_origin: tests` |
| `gate-cruft` | Dead-code scan; produces cleanup items with `gate_origin: cruft` |
| `gate-docs` | Foundation-doc alignment; enforces rolling-foundation; produces doc-update items |
| `gate-patterns` | Pattern extraction; writes pattern skills (`.agents/skills/patterns/`), the generated `.agents/rules/patterns.md` digest, + tracking item with `gate_origin: patterns` |

All five fire during `release-deploy`'s `quality-gate` stage in the order
configured in `CONVENTIONS.md` (default: security → tests → cruft → docs
→ patterns).

### Reference / one-shot (carried from workflow)

| Skill | Role | Notes |
|---|---|---|
| `principles` | Loads code-design + substrate-execution principles | Code-design (Ports & Adapters, SSOT, Generated Contracts, Fail Fast) carried from workflow; substrate-execution (item-IS-the-work, rolling-foundation, late-binding) added |
| `research` | Investigate libraries/APIs | Carried; produces research docs in `docs/research/` (separate from `.work/`) |
| `refactor-conventions-creator` | Create project-specific refactor conventions skill | Carried |

(`repo-eval` and `tool-evaluator` were originally carried here, then extracted to the standalone `nates-toolkit` plugin since they have no substrate lock-in; `tool-evaluator` has since been renamed `agent-reflection`.)

---

This is the architecture. Skills compose; substrate persists; navigation is
grep-fast; autopilot drains respecting dependencies; gates produce items;
foundation docs roll forward.
