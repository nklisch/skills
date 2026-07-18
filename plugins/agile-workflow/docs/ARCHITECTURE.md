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
├── bin/                   git-tracked, not-gitignored installed entrypoint
│   └── work-view          prebuilt binary where supported; bash fallback otherwise
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
                  /implement-orchestrator (delegated topology)
                  or /implement (cohesive inline delivery)
                              │
                              ▼
              child story? ── yes ── verified → stage: done
                    │ no
                    ▼
                 stage: review
       (standalone story / feature / epic; non-blocking)
                    │
                    ▼
       kind- and scope-appropriate /review lane
       (bounded standalone; integrated feature; deep epic)
                    │
                    ▼
                 stage: done
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

1. **`/park`** — captures an unscoped backlog note mid-conversation as a flat
   backlog file. It may be a quick idea, a richer context note, or a
   roadmap-style multi-arc thought; it preserves supplied context without
   proactively designing or binding the work. Used when something surfaces
   that shouldn't derail the current thread.
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
| epic | initial state when scoped | once children are designed and started | once all child features have completed feature review and the epic is ready for deeper aggregate review | once the epic's selected review lane approves |
| feature | initial state when scoped | once design is written into the body and acceptance criteria are clear | once all story checkpoints are done and integrated verification is green | once the feature's selected review lane approves |
| child story | optional initial state | initial state more often (skips drafting) | n/a | once implementation and required verification are green |
| standalone story | optional initial state | initial state more often (skips drafting) | after verified implementation | once bounded inline review approves; never independent/cross-model |
| release | initial state when cut | once gates begin running (`stage: quality-gate`) | n/a | n/a — terminal stage is `released` |

`review` is a feature-only implementation state, not a mandatory user handoff.
Child stories are design and acceptance checkpoints; verified child stories
advance directly from `implementing` to `done`. Standalone stories receive a
bounded inline review because no feature supplies that boundary, but never an
independent, fresh-context, or cross-model review. A feature advances to `review`
only after its checkpoints and integrated verification are complete, and
production skills continue through that review in the same invocation by
default. Review does not block the next dependency layer: an item at `review`
satisfies downstream implementation dependencies. Once child features are done,
the epic receives its own deeper aggregate review for end-to-end capability,
cross-feature contracts, and cumulative risk. This larger-scope pass avoids
repeating line-level feature review.

The PostToolUse hook auto-bumps `updated:` whenever an item file is edited;
skills only need to advance `stage:` explicitly.

## Dependency graph

Items declare ordering via `depends_on: [<id>, ...]`. This is **sequencing**,
distinct from `parent` (which is **hierarchy**).

### Rules

- An item is **ready** when it is in the active tier, its `stage` is
  `drafting`, `implementing`, or `review`, AND every `depends_on` entry has
  completed verified implementation (`stage: review`, `done`, or `released`, or
  resident in `releases/`/`archive/`). Review remains required for final
  completion but does not serialize downstream implementation.
- Dependencies must form a DAG. Cycles are invalid; skills that produce
  items must validate no cycle is introduced before writing.
- Cross-tier dependencies are allowed (a feature can depend on an epic;
  a story can depend on a feature in another epic).
- Dependencies on archived or released items count as terminal. Active items at
  `review` count as implementation-ready but remain non-terminal until review
  approves them to `done`.

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
| active | releases | `/release-deploy` shipping | bound bodies collapse into one `.work/releases/<version>/release-<version>.md` summary; the bodies are `git rm`'d (recoverable via the per-item `git ref`). Legacy `retain-bodies` mode `git mv`s each `<id>.md` instead |
| active | archive | item reaches `done` without `release_binding` | stripped to a bodyless stub at `.work/archive/<id>.md` (frontmatter + `# Title` + `git_ref` + `archived_atop`, the immutable release baseline a later release late-binds against); body pruned. Legacy `retain-bodies` mode `git mv`s the full body |
| backlog | (deleted) | user discards via `/scope` rejection | `git rm` (history retained) |

Active and backlog transitions are `git mv` so history is preserved by path. Terminal transitions
(`delete-refs`, the default) prune bodies to refs — a bodyless archive stub or a single release
summary — and git history retains the full content. Either way the substrate's audit trail IS the
git log.

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
feature  design + implementation + review unit  parent of stories
story    checkpoint (child) or small standalone unit  leaf or has tasks
task     checklist line in parent body      not its own file
release  version bundle in releases/        binds items via release_binding

## Stages
epic              drafting → implementing → review → done
feature           drafting → implementing → review → done
child story       implementing → done
standalone story  implementing → review → done
task     [ ] → [x]
release  planned → quality-gate → released

## Frontmatter
id, kind, stage, tags[], parent, depends_on[], release_binding,
gate_origin, research_refs[], research_origin, created, updated

`research_refs` and `research_origin` are optional linkage fields that connect
`.work/` items to `.research/` artifacts (mirroring `gate_origin`). Missing →
`[]` / `null`, no validation warning. Query via `--research-refs <slug>` and
`--research-origin <slug>`. See `plugins/agentic-research/docs/HANDOFF.md` for
the cross-tier contract; the emission and commissioning arrows that populate these
fields are implemented (live) in the `agentic-research` plugin.

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
--ready              active-tier drafting/implementing/review, deps at review or terminal
--blocked            active-tier drafting/implementing/review, >=1 implementation-incomplete dep
--blocking <id>      items that depend on <id>

### Output modes
(default tabular)    columns: ID  KIND  STAGE  TAGS  PARENT
--paths              one file path per line (pipe-friendly)
--cat                full item bodies, separated by ---
--count              match count only

### Common queries

# Items ready to work right now
.work/bin/work-view --ready

# Items awaiting an agent review pass
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
2. .work/bin/work-view --stage review  items awaiting an agent review pass
3. .work/bin/work-view --ready         items ready to work
4. Identify your work: explicit user ask, or pick the next ready item

## Stage transition discipline
- Update `stage:` and let PostToolUse hook auto-bump `updated:`
- Commit after each stage transition (one commit per item per transition)
- Do not pre-populate stages; advance only as work completes

## Foundation docs (rolling-forward principle)
docs/ holds standing context: VISION.md, SPEC.md, ARCHITECTURE.md, etc.
- Foundation docs describe the system's current state or intended future state
- Future-state claims are valid before implementation exists; foundation docs
  need not mention every capability
- Never retain superseded behavior descriptions or versioned migration notes
- Update only assertions that become false, stale, or contradictory; omission is
  not drift
- Git history is the audit trail; the doc carries the active truth
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
`.work/active/`. That argument selects queue breadth; it does not combine the
selected items into a new implementation scope. Each ready item's body, stage,
and design define its current work boundary; an undecomposed epic is design
work, not an implementation claim. In both cases, autopilot does not create
`/loop` schedules or maintain a progress file; harness goal/continuation owns
long-running persistence and `.work/active/` is the resume point.

### Strategic alignment before autonomous work

Normal design resolves routine, reversible decisions with judgment and records
the rationale. Use the structured question tool only for choices that set
product direction, materially affect user-facing behavior or an external
contract, or commit the project to an expensive, difficult-to-reverse path.

`epic-design --only-questions <id>` (or `--all`) remains the explicit
interactive alignment mode when the operator wants those strategic decisions
captured under `## Design decisions` before autonomous work. It does not design,
decompose, or advance an item, and it refuses to run inside autopilot. Autopilot
does not stop for ordinary ambiguity: it uses the existing decisions and
foundation evidence, chooses the least irreversible sound path, and records the
rationale.

Advisory review follows risk in both direct and autopilot design. Independent
review uses completeness/advisory before adversarial posture, is labeled
cross-model only for a known different model class, and is non-blocking at
design time. Final autopilot completion still requires the successful review
path selected by the effective review weight. The receiving orchestrator owns
finding disposition: it verifies reviewer proposals in repository context,
keeps only credible material current-cycle risks blocking, and parks valid
lower-priority work in the unbound backlog. Child stories skip review;
standalone stories use a bounded non-cross-model lane; features get integrated
review; epics get a deeper aggregate pass. At the default `standard` weight,
both feature and epic review are single-pass—the epic pass is broader, not more
iterative. Only `thorough` and `maximum` re-review corrected snapshots until no
material blockers remain. Review-ready items satisfy downstream implementation
dependencies, so review does not serialize the next wave.

### Queue selection algorithm

```
1. Collect candidate items:
   - if epic-scoped: items with parent == <epic-id>, transitively
     (include grandchildren via parent chain)
   - if --all: all items in .work/active/
2. Filter to stage in {drafting, implementing, review}
3. For each candidate, check depends_on:
   - all deps must have verified implementation complete (`review`, `done`, or
     terminal release/archive tier)
   - candidates with implementation-incomplete deps are filtered out
4. Sort the remaining candidates by:
   - depends_on count ascending (less-blocked items first)
   - created ascending (FIFO tie-break)
5. Pop the first item.
6. Work it:
   - if drafting → invoke the design skill selected by kind and tags
   - if implementing → invoke /implement-orchestrator with the autopilot
     scope (the picked item is an anchor; the orchestrator defaults to one
     worker per feature, may bundle related features, and splits only unusually
     large features with coherent ownership). Use /implement when one cohesive
     delivery is safer in the host context.
   - if review → invoke /review without blocking the next implementation layer;
     child stories bypass review, standalone stories use bounded inline review,
     features use normal review, and epics use deeper aggregate review
7. Re-read substrate state after the production skill returns; it may already
   have completed review and eligible parent roll-up. Commit each item
   transition separately.
8. Apply the effective review weight. At `light`/`standard`, run at most one
   independent pass, fix and verify receiver-confirmed material blockers, then
   finish without re-review. At `thorough`/`maximum`, repeat implementation →
   verification → review until a pass yields no receiver-confirmed material
   current-cycle blockers. Park valid lower-priority findings unbound; nits and
   rejected proposals also do not keep a convergence loop open.
9. Goto 1 unless a stop condition applies.
```

The implementation orchestrator guarantees outcomes rather than prescribing a
recipe: dependency-graph scheduling, cycle validation, write-set-independent
parallelism, explicit ownership, per-wave integration verification, one commit
per item, worker self-containment, and conservative parent roll-up. It chooses
bundle shape, wave width, isolation, and worker briefs for the actual work; no
fixed sizes or prompt templates are part of the contract. Worker capability is
chosen from the concrete ready work and its risk—not from the breadth of the
queue selector—unless an explicit caller or stable project convention overrides
it, and the choice is recorded rather than routinely asked.

Autopilot resolves one effective `review_weight` for the run: explicit
invocation selector, then `.work/CONVENTIONS.md`, then `standard`. The five
levels — `none`, `light`, `standard`, `thorough`, and `maximum` — scale
independent-review depth and select closure policy. `standard` is explicitly the
single-pass default: one balanced review, then adjudicate, fix material blockers,
verify, and finish. Only `thorough` and `maximum` repeat review after fixes, and
they stop when a pass has no receiver-confirmed material current-cycle blockers;
smaller findings are parked or noted by judgment. Even `none` requires green
implementation verification and acceptance evidence.

### Stop conditions

- Empty queue (all candidates exhausted)
- User invokes a halt command or sends a manual prompt
- A skill reports a genuine blocker that autonomous diagnosis and correction
  cannot resolve

For `thorough` and `maximum`, repeated review passes are not a stop condition;
autopilot keeps correcting until a pass has no material blockers or exposes a
genuine blocker it cannot fix. `standard` never repeats independent review:
after its one pass, verified material-blocker fixes close the item.

### Harness goal continuation

Autopilot does not own continuation mechanics. Claude/Codex harness goal
features keep the run alive across compaction and continuation turns. If a run
resumes, the agent re-reads `.work/active/` and applies the same queue selection
algorithm. There is no `--resume`, no watchdog `/loop`, and no `PROGRESS.md`.

### Adaptive simplification during autopilot

Refactoring is part of normal feature design and implementation, where the agent
adapts its simplification pass to the amount and shape of recent feature work.
Autopilot does not turn completed-item counts into dedicated refactor scans;
child stories are design checkpoints, not cadence counters.

A dedicated `refactor-design` discovery pass runs only when the user explicitly
asks the current run for one. Existing `[refactor]` items still route normally.
`bold-refactor` also remains explicitly user-requested. Explicit user
instructions override every default here.

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
project worktree. Where the host supports hook-specific context, they emit the
`.agents/rules/` block (below) directly as the primary rules firing. Codex
`PostCompact` is side-effect-only because Codex rejects `hookSpecificOutput` on
that event; Codex rules context flows through `SessionStart` with `source:
compact`.

**`.agents/rules/` rules loader:** the script force-loads every
`<root>/.agents/rules/*.md` file (sorted, concatenated under a
`## Project Rules (.agents/rules/)` heading) into agent context, so producers
(`convert` writes `.agents/rules/agile-workflow.md`; `gate-patterns` writes
`.agents/rules/patterns.md`; the user adds their own) reach the agent reliably
in both Claude Code and Codex. It is content-agnostic — it injects whatever
`*.md` files exist. **SessionStart and host-supported PostCompact context output
emit unconditionally** (mirroring the legacy `.claude/rules/` force-load, and
guaranteeing re-injection after compaction even with no user prompt). Codex uses
`SessionStart` with `source: compact` instead of emitting context from
`PostCompact`. Per-epoch + SHA-256 content-hash dedup means rules load exactly
once per `(epoch, content)`. `.work/CONVENTIONS.md` may set
`rules_context: on|off` (default on) and `rules_context_max_bytes: <int>`
(default 12000); the byte cap truncates with a notice while hashing the
untruncated content so any edit re-injects.

**UserPromptSubmit effect:** principles capsules emit only for actionable
workflow prompts: queue operations, stage movement, explicit agile-workflow
verbs, or a known item id. Explainer prompts and idle chat stay silent. The hook
does not inject `.agents/rules/*.md` or queue snapshots at prompt time.

When it fires, the script returns JSON `hookSpecificOutput.additionalContext`
containing any principles capsules that have not already fired in the current
session epoch:

```
## Agile Workflow Principles
Code-design capsule:
- Ports & Adapters: keep domain logic independent of DB/filesystem/HTTP/time/randomness.
- Single Source of Truth: define growing variant sets once; derive downstream behavior.
- Proportional rigor: validate real boundaries; add invariants, edge handling, and determinism only when context warrants them.
- Code economy: prefer the shortest clear solution; test useful interfaces, complex units, and bug regressions.
- Leave it simpler: adapt simplification to accumulated feature change as part of normal design and implementation; item counts never trigger standalone refactor runs; ask before reducing guarantees.
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

### Pi hook parity adapter

Pi does not load `hooks/hooks.json`, so the Pi package reaches parity through
`extensions/agile-workflow.ts`. The extension maps Pi lifecycle events to the
same Python scripts instead of maintaining a TypeScript copy of the rules:

- `before_agent_start` appends the `.agents/rules/*.md` block via the synthetic
  `PiBeforeAgentStart` prompt-context path, then asks the same script for any
  prompt-gated principles capsule and injects that capsule as a visible Pi
  message (`customType: agile-workflow-principles`).
- `session_start` and `session_compact` call the prompt-context script for the
  same epoch/self-heal side effects Claude/Codex hooks get.
- `tool_result` for mutating tools calls `substrate-maintainer.py`, so `updated:`
  bumps and cheap validation come from the same implementation in all channels.

The parity posture is: one substrate model, one generated rules source, one pair
of deterministic hook scripts, with each host only adapting event names and UI
plumbing. `scripts/tests/channel-parity.test.sh` guards that wiring.

## Gate orchestration

`/release-deploy` orchestrates the gate sequence after items are bound to
a release. Default order: **security → tests → cruft → docs → patterns**.
Override via `gates_for_release` in `.work/CONVENTIONS.md`.

### Gate-as-item-producer pattern

Each gate focuses on the bundle of items at
`release_binding: <current-version>` and produces new items rather than
emitting a pass/fail report. The bundle is a center of gravity, not a hard scan
boundary: gates may follow concrete evidence into adjacent dependencies, shared
infrastructure, or system-wide mechanisms. Findings caused by, exposed by, or
materially relevant to the release bind to it; merely ambient discoveries go
to the unbound backlog so the gate does not silently expand release scope.

| Gate | What it scans | What it produces |
|---|---|---|
| `gate-security` | Bound items' code changes against security checklist | Items with `gate_origin: security`, tagged `[security]`, `release_binding` set |
| `gate-tests` | Useful coverage at stable interfaces, complex units, and bug regressions; low-value tests exposed by the bundle | Items with `gate_origin: tests`, tagged `[testing]` for valuable gaps or removals |
| `gate-cruft` | Local or system-wide code, tests, checks, compatibility paths, and abstractions that may no longer earn their cost | Items with `gate_origin: cruft`, tagged `[cleanup]`; guarantee-reducing removals require user confirmation |
| `gate-docs` | Existing foundation assertions that may be false, stale, or contradictory; omissions and unimplemented future claims are excluded | Items with `gate_origin: docs`, tagged `[documentation]` — enforces rolling-foundation |
| `gate-patterns` | Reusable patterns that emerged in the bundle | Detailed pattern-skill files in `.agents/skills/patterns/` (single source of truth) with optional Claude mirror, the generated hook-loaded `.agents/rules/patterns.md` digest (slug+one-liner index pointing back at the skill, with banner + source hash), plus a tracking item with `gate_origin: patterns` |

For gates that emit findings as items, placement flows through
`gate_finding_routing` in `.work/CONVENTIONS.md` after the gate normalizes its
local vocabulary. The default routing is `critical`/`high` -> active story at
`stage: implementing`, `medium` -> active story at `stage: drafting`, `low` ->
`.work/backlog/`, and `info` -> `skip`. Gate-specific definitions remain local
to each gate: security uses severity, tests uses priority, and
docs/cruft/refactor use confidence.

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
(`kind, stage, tags, parent, depends_on, release_binding, research_refs, research_origin`).
Layout: `.work/active/{epics,features,stories}/`, `.work/backlog/`,
`.work/releases/<version>/`, `.work/archive/`.

**Primary query tool:** `.work/bin/work-view` filters by stage, tag, kind,
parent, and dependency. Common patterns:
- `work-view --ready` — items ready to work (deps satisfied)
- `work-view --stage review` — items awaiting review
- `work-view --parent <id>` / `--blocking <id>` — hierarchy / sequencing
- `work-view --help` for the full flag set

Foundation docs in `docs/` describe the system's current state or intended
future state, never the past; git history is the audit trail. Review existing
assertions only: missing coverage and unimplemented future intent are not drift;
flag only false, stale, or contradictory claims. The substrate
itself is durable memory: record decisions, blockers, implementation
discoveries, and review findings in item bodies instead of depending on chat
history.

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

### Delegation posture

Agile-workflow ships skills, hooks, the Pi `/aw` extension, and substrate tools;
it does **not** ship custom subagent definitions for Pi, Claude Code, or Codex.
When a skill needs breadth, isolation, fresh-context review, scanner work, or
parallel write ownership, it prompts the host's existing generic/general-purpose
subagent mechanism with a structured task brief. The shared prompt postures live
in `skills/principles/references/subagents.md`.

A same-harness delegated run is fresh-context by default. It counts as
cross-model only when the host explicitly spawns the subagent with a different
model class; otherwise use `peeragent` only when a cross-harness different model
class is needed and allowed.

Concrete model guidance lives in `skills/principles/references/models.md` and is
resolved against current availability when selection matters. GPT-5.6 Luna is
the cost-efficient routine implementation and fan-out workhorse; Sol is the
quality-first general coding choice and remains preferred for design, review,
and complex code; Terra is a situational middle pick. For OpenAI review
selection, any available GPT-5.6 tier takes precedence over GPT-5.5; use 5.5
only when no review-capable 5.6 model is available in the current harness.
Sonnet 5 is the capable
high-throughput Claude worker, Opus 4.8 the stable premium complex-coding and
review default, and Fable 5 the high-cost escalation for the hardest ambiguous,
long-running, orchestration, design, and review work. Model-specific prompting
is conditional and symptom-driven rather than fixed boilerplate. These are
capability recommendations, not fixed routing. Luna, Terra, Sol, and Codex share
OpenAI lineage, so moving among them can provide fresh context but is not
cross-model evidence.

### Bootstrap (user-invocable only)

| Skill | Role | Trigger |
|---|---|---|
| `ideate` | Foundation-docs workshop. Produces VISION.md, SPEC.md, ARCHITECTURE.md, optionally PRINCIPLES.md / MIGRATION.md. No substrate dependency. | User-invoked |
| `convert` | Bootstraps `.work/` substrate. Reads existing project shape, writes AGENTS.md section, creates CLAUDE.md compatibility symlink/shim, writes CONVENTIONS.md, installs the git-tracked `work-view` entrypoint via `install-work-view.sh` as a backstop to session hook self-heal (prebuilt binary on supported platforms, Bash fallback only otherwise), seeds initial items. Idempotent via `--update`. | User-invoked, depends on ideate having run |
| `epicize` | Reads foundation docs. Produces multiple epics in `.work/active/epics/` at `stage: drafting`, with declared dependencies. | User-invoked, depends on convert having run |

### Capture & promotion (model-invocable)

| Skill | Role | Trigger |
|---|---|---|
| `park` | Capture an unscoped idea, context note, or roadmap-style thought into `.work/backlog/`. Minimal frontmatter; body sized to the supplied context. | "park this", "remind me about X", "add to backlog" |
| `scope` | Promote backlog item or fresh request to `.work/active/`. Sizes as epic/feature/story. If large, rolls foundation docs forward. Declares dependencies. | "scope this", "promote this", "let's track this" |
| `fix` | Diagnose a verified bug as a cohesive story, reproduce it, add the failing test, apply the bounded repair, verify it, and continue through the selected review lane to `done` by default. Honors an explicit `stop-at-review` boundary and records bounces/blockers. | "fix bug X", "fix the typo in", "fix this issue" |
| `groom` | Backlog-hygiene sweep over `.work/backlog/`. Classifies items DONE/SUPERSEDED/DUPLICATE/STALE/MERGEABLE/VALID via mechanical signals (`work-view --stale`, missing-field, cites-done-work) + a grounded semantic pass; writes a triage report. Propose-not-prune: dispositions are operator-confirmed and route through terminal-tier retention; never auto-prunes. Not a release gate. Opt-in; staleness face inert unless `backlog_staleness_days` is set. | "groom the backlog", "backlog hygiene", "find stale/dead/duplicate items" |

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
| `implement-orchestrator` | Delegated implementation over a feature, epic, `--all`, or explicit set. Defaults to one worker per feature, may bundle related features into one sequential worker, and splits unusually large features only by coherent ownership. Story children are checkpoints, not worker units. Reviews run without blocking the next dependency layer. | implementing scope where separate ownership, isolation, sequencing, or shared feature context improves the result |
| `implement` | Cohesive inline delivery. Grounds in the item, implements and verifies it in the host context, closes child-story checkpoints directly, and continues standalone stories or features through their review lane. | work best kept under one ownership context, or an explicit inline request |

Choose between these production lanes from cohesion, write ownership,
dependency sequencing, isolation needs, and uncertainty. Line or file counts may
inform judgment but never gate the choice. Both honor valid review boundaries;
child stories never stop at review, standalone stories never use cross-model
review, and review does not serialize downstream implementation.

### Review & delivery (mixed invocability)

| Skill | Invocability | Role | Trigger |
|---|---|---|---|
| `review` | model-invocable | Reviews integrated features, uses a bounded inline lane for standalone stories, bypasses child stories, and gives epics a deeper aggregate review. Review-ready items satisfy downstream implementation dependencies, so reviews may run concurrently with later implementation waves. | feature, epic, or standalone story at `stage: review`, or explicit out-of-band target |
| `board` | user-invocable | Launch the live localhost substrate board through `work-view board`. Opens a browser after binding when a desktop session is available; prints the URL in headless sessions. | User-invoked when the user wants to inspect active work visually |
| `release-deploy` | user-invocable | Bind items to release, run gates, ship, archive. Idempotent. | User-invoked when ready to cut a version |
| `bold-refactor` | user-invocable | Multi-feature architectural refactor. Scopes a refactor epic with child features. Aggressive — only on user request. | User-invoked |
| `autopilot` | model- and user-invocable | Goal-backed queue runner. Drains an epic or all active work using the harness goal/continuation feature. | Goal text like "Use agile-workflow autopilot to drain <epic>" or direct `/agile-workflow:autopilot --all` |

### Gates (model-invocable, fire during release flow)

| Skill | Role |
|---|---|
| `gate-security` | Security scan over bound items; produces items with `gate_origin: security` |
| `gate-tests` | Test-coverage scan; produces gap items with `gate_origin: tests` |
| `gate-cruft` | Dead-code scan; produces cleanup items with `gate_origin: cruft` |
| `gate-docs` | Assertion-only foundation-doc alignment; ignores omissions and unimplemented future claims; produces doc-update items |
| `gate-patterns` | Pattern extraction; writes pattern skills (`.agents/skills/patterns/`), the generated `.agents/rules/patterns.md` digest, + tracking item with `gate_origin: patterns` |

All five fire during `release-deploy`'s `quality-gate` stage in the order
configured in `CONVENTIONS.md` (default: security → tests → cruft → docs
→ patterns).

### Reference / one-shot (carried from workflow)

| Skill | Role | Notes |
|---|---|---|
| `principles` | Loads code-design + substrate-execution principles | Code-design includes clear boundaries, proportional rigor, code economy, useful tests, and continuous simplification; substrate-execution includes item-IS-the-work, rolling-foundation, and late-binding |
| `research` | Investigate libraries/APIs | Carried; produces research docs in `docs/research/` (separate from `.work/`) |
| `refactor-conventions-creator` | Create project-specific refactor conventions skill | Carried |

Holistic report-only repository scoring is provided by `code-audit:repo-eval`;
end-of-session tool and skill reflection is provided by
`nates-toolkit:agent-reflection`.

---

This is the architecture. Skills compose; substrate persists; navigation is
grep-fast; autopilot drains respecting dependencies; gates produce items;
foundation docs roll forward.
