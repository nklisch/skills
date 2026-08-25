# Agile-Workflow Guide

> ## Maintenance mode (KTLO)
>
> `agile-workflow` is stable and **supported in maintenance mode**: bug
> fixes and compatibility work land, but no new feature development is
> planned. Existing projects keep working, and this guide remains accurate
> for them.
>
> **New projects** should adopt
> [`workbench`](../plugins/workbench/README.md) — requirements-first
> delivery driven by ordinary conversation, with grounded research built in.
> Workbench's `setup` skill consolidates an existing agile-workflow
> substrate into one clean state.

Use this guide to run an existing `agile-workflow` project with an agent.
The single habit that separates a smooth run from a frustrating one is the
**alignment one-two** before autopilot: surface the directional choices
once, capture your answers in the substrate, then let the agent drain the
queue. The sections below are organized around that loop.

For deeper specs, see
`plugins/agile-workflow/docs/{VISION,SPEC,ARCHITECTURE,PRINCIPLES,MIGRATION}.md`.

## Before you start

You need:

- a project that already uses `agile-workflow`, or foundation docs at
  `docs/VISION.md` or `docs/SPEC.md` before you bootstrap it;
- Git, because commits are the audit trail;
- an agent harness with the plugin installed;
- `ux-ui-design` if the project has user interfaces and you want
  mockup-first alignment.

If you are starting a new project, use
[`workbench`](../plugins/workbench/README.md) instead. To consolidate an
existing project onto Workbench, run `/workbench:setup`.

## Install or refresh the plugin

```bash
# Claude Code
/plugin marketplace add nklisch/skills
/plugin install agile-workflow@nklisch-skills

# OpenAI Codex
codex plugin marketplace add https://github.com/nklisch/skills
codex plugin install agile-workflow

# Pi (via the pi-plugins manager)
pi install npm:@nklisch/pi-plugins
# then, inside Pi:
/plugins marketplace add nklisch/skills
/plugins add agile-workflow@nklisch-skills --scope user
# or, from a local checkout:
pi install -l ./plugins/agile-workflow
```

The substrate skills are shared across all three harnesses. Restart your
harness after installing — hooks don't take effect mid-session.

**Expected result:** the shared skills are available, and substrate
projects load their project rules at session start. Hooks are inert
without a substrate — they check for `.work/CONVENTIONS.md` and exit
silently in other repos — so the plugin is safe to install globally.

## The working model

`agile-workflow` stores each piece of work as a markdown **item** under
`.work/`. The item's frontmatter carries state and relationships. Its body
accumulates the brief, design, mockups, implementation notes, and review
findings.

Three rules explain most of the system:

1. **The item is the work.** There is no separate design or progress
   document.
2. **Dependencies set order.** `depends_on` controls readiness; `parent`
   records hierarchy.
3. **Binding happens late.** An item gets a release only when you cut one.

## Your role in the loop

You set intent. The agent moves items. Concretely:

- **Decide direction.** What's worth doing next? Which idea should be
  promoted? Is this feature ready for review? Should we cut a release?
- **Provide context.** When the agent asks "what do you mean by X?",
  answer it. When you have a clarifying constraint, surface it.
- **Invoke a few broad entry points at the right moments.** Some are slash
  commands; autopilot is best started as a goal statement. Everything else
  routes from conversation.
- **Review what the agent produced.** Designs, code, gate findings — your
  eyes on the result before stages advance to `done`.

What you don't have to do:

- Edit `.work/` files by hand. They're plain markdown, but the agent reads
  and writes them as part of normal conversation.
- Run any CLI directly. A query script (`.work/bin/work-view`) exists for
  the agent — when you want queue state, just ask.
- Track item state in your head. The substrate is the source of truth, and
  the agent reads it on every session start.
- Re-feed context across sessions. A fresh session picks up active work
  from `.work/active/` automatically, via the SessionStart hook.

## The core habit: align before autopilot

Run this before every autopilot goal — and any time you want autopilot to
inherit your calls instead of guessing:

```
/agile-workflow:epic-design --only-questions --all
/agile-workflow:feature-design --only-questions --all
```

The **alignment one-two** walks every drafting item in each tier, surfaces
high-leverage product, architecture, and scope questions specific to that
item, asks you, and captures your answers under `## Design decisions` in
each item body. Neither pass advances stage or decomposes children —
that's left to the real design pass autopilot runs later.

- **`epic-design --only-questions`** handles arc-level choices: what this
  epic actually delivers, what's in scope versus out, what shape the user
  experience takes. When `ux-ui-design` is installed, this pass also
  offers its concierge for UI surfaces — visual decisions get pinned at
  the same time as product ones.
- **`feature-design --only-questions`** drills into each feature: which
  components to reuse, where the edges are, what the acceptance criteria
  look like. It offers the concierge for any surfaces the epic's alignment
  didn't cover.

Why this works:

- **Autopilot inherits your answers.** When the full design passes run
  under autopilot later, they read `## Design decisions` and `## Mockups`
  and skip their own question-asking phase. No autonomous guessing on
  direction.
- **One sitting beats N pauses.** Doing all the Q&A up front replaces
  autopilot pausing per item mid-run — or worse, not pausing and
  committing to a wrong direction across multiple features before you
  notice.
- **Cheap now, expensive later.** Catching a wrong directional choice
  before code or child items land is far cheaper than unwinding it after
  autopilot has built on top of it.

`--only-questions` refuses to run *inside* an active autopilot goal — it's
explicitly a pre-autopilot, human-in-the-loop step. The right rhythm is:

```
--only-questions --all  (both tiers)
→ review captured decisions
→ Goal: Use agile-workflow autopilot to drain --all
```

You can skip the one-two only when the drafting queue is empty or every
drafting item's body already pins every directional choice. Rare in
practice. You can also skip autopilot entirely and run skills manually in
conversation — but if you plan to use autopilot, this is the move that
makes it work.

### Align backlog work after scoping

When `.work/backlog/` contains unstructured ideas, shape the queue before
you start the goal:

```
/agile-workflow:scope                              # batch — clusters everything
/agile-workflow:epic-design --only-questions --all # align on the new epics
/agile-workflow:feature-design --only-questions --all
Goal: Use agile-workflow autopilot to drain --all
```

Batch `scope` clusters the whole backlog by code seam and capability arc,
proposes a structure, confirms once with you, then writes everything as
epics / features / stories with declared `depends_on`. You can narrow it
in plain language: *"scope the auth stuff."*

### Align the visual direction as you go

For interface work, align before production code. The `ux-ui-design`
plugin's concierge interviews and adapts the artifact shape to the
project; the natural moments to run it:

1. After ideation, when the visual direction is still open.
2. During epic alignment, for load-bearing surfaces and journeys.
3. During feature alignment, for surfaces the epic didn't cover.
4. Ad hoc, whenever a later design exposes a new surface.

The full visual workflow is in
[ux-ui-design-guide.md](ux-ui-design-guide.md).

## Bootstrap a greenfield repository

Use this sequence only for a project already committed to `agile-workflow`.
New projects should use Workbench.

```bash
# 1. Foundation docs
/agile-workflow:ideate

# 2. Visual identity, while direction is open — the concierge adapts the shape
/ux-ui-design:ux-ui

# 3. Bootstrap the substrate
/agile-workflow:convert

# 4. Decompose foundation docs into epics
/agile-workflow:epicize

# 5. Lock in directional choices and mock big surfaces across every drafting epic
/agile-workflow:epic-design --only-questions --all

# 6. Drill in per feature — scope + remaining mocks before autopilot starts
/agile-workflow:feature-design --only-questions --all

# 7. Drain with a harness goal
Goal: Use agile-workflow autopilot to drain --all
```

`convert` requires `docs/VISION.md` or `docs/SPEC.md`. If it stops because
both are missing, run `/agile-workflow:ideate`, review the resulting
foundation docs, and run `convert` again.

**Expected result:** `.work/` exists, `epicize` has created drafting
epics, the alignment passes have recorded decisions without advancing
stages, and the goal can proceed without guessing at product direction.
Settling the visual direction early means every later mock inherits the
visual voice; the two `--only-questions` passes mean every later autopilot
stride inherits both directional and visual alignment.

## Bootstrap an existing repository

`convert` detects the current project shape and proposes a migration
before it writes:

```bash
# 1. Bootstrap the substrate (detects existing project shape)
/agile-workflow:convert

# 2. (Optional) Audit + mock the existing UI with the concierge
/ux-ui-design:ux-ui

# 3. Cluster your backlog or fresh ideas into structured work
/agile-workflow:scope    # batch mode — clusters everything in backlog
# or scope individual items: /agile-workflow:scope <id>

# 4. Same alignment one-two before autopilot
/agile-workflow:epic-design --only-questions --all
/agile-workflow:feature-design --only-questions --all

# 5. Drain with a harness goal
Goal: Use agile-workflow autopilot to drain --all
```

Review `MIGRATION_REPORT.md` after conversion. Confirm the item mappings
and dependencies before deleting any legacy files.

## Start and steer autopilot

Autopilot drains a queue of ready work without further input from you. It
repeatedly:

1. finds active items whose dependencies have completed;
2. chooses the least-blocked item;
3. routes drafting items to the appropriate design skill;
4. routes implementation through the suitable production lane;
5. runs the review lane required by item kind;
6. rereads the substrate, commits transitions, and continues.

A review-ready item can unblock the next implementation layer; review is
non-blocking for dependency-ordered work. Final completion and release
still require reviewed items to reach `done`.

**Always run the alignment one-two first.** Start long runs with goal text
rather than a direct slash command:

- `Goal: Use agile-workflow autopilot to drain <epic-id>` — drain
  everything under one epic.
- `Goal: Use agile-workflow autopilot to drain --all` — drain every ready
  item in `.work/active/`.

Direct `/agile-workflow:autopilot <scope>` still works. Goal text is
preferred because the harness owns continuation across long runs; the
substrate, not a separate progress file, is the resume point.

Don't invoke autopilot when you want to stay close to one hard item —
invoke the relevant skill in conversation instead (*"design feature-X"*,
*"implement story-Y"*). To interrupt, just send a message: autopilot
finishes the current item cleanly, commits, and stops. When it halts on a
blocker, read the report, resolve the blocker in conversation, then
continue the same goal.

## Cut a release

Releases are late-bound: items carry no `release_binding` until you
explicitly cut a version. Start or resume a release with
`/agile-workflow:release-deploy <version>`, which moves through five
steps:

1. **Bind.** You confirm which completed work belongs to the version;
   `release-deploy` sets `release_binding` on the selected items.
2. **Run gates.** The agent runs the gate order from
   `.work/CONVENTIONS.md` (default: security → tests → cruft → docs →
   patterns). Gates produce work items as findings, not one-time
   pass/fail reports.
3. **Wait for readiness.** Every bound item, including gate findings,
   must reach `stage: done`. If any remain, the command stops with a
   pending list.
4. **Ship.** The agent follows the configured release mapping:
   `tag-based`, `branch-held`, `release-branch`, or `none`. With `none`,
   it performs no tag, branch, merge, push, or version bump; external
   publishing remains separate.
5. **Archive.** The bundle collapses into
   `.work/releases/<version>/release-<version>.md`, and the release file
   flips to `stage: released`. Git preserves the detailed history.

`release-deploy` is idempotent. Drive any gate-produced items to `done`,
then run the same command again — it resumes from the release file instead
of creating duplicate gate findings.

## Use the substrate as shared memory

A converted project has this structure:

```
.work/
├── active/
│   ├── epics/<id>.md         multi-feature arcs in flight
│   ├── features/<id>.md      design + implementation + review units
│   └── stories/<id>.md       child checkpoints or small standalone work
├── backlog/<id>.md           parked ideas, unscoped
├── releases/<version>/       shipped bundles
├── archive/<id>.md           done items not bound to a release
├── bin/work-view             query script (the agent uses this)
└── CONVENTIONS.md            project-specific overrides
AGENTS.md                     canonical agent instructions
CLAUDE.md -> AGENTS.md        Claude Code compatibility
.agents/
├── rules/*.md                force-loaded agent rules (hook-injected)
└── skills/patterns/          detailed reusable code patterns
docs/                         foundation docs (VISION, SPEC, ARCHITECTURE)
```

Every item is a markdown file with structured frontmatter:

```yaml
---
id: feature-csv-export
kind: feature
stage: implementing
tags: [content]
parent: epic-export-pipeline
depends_on: [feature-data-schema]
release_binding: null
gate_origin: null
created: 2026-05-09
updated: 2026-05-10
---

# CSV Export

## Brief
<what this is, why it exists>

## Design
<written by /agile-workflow:feature-design — not a separate doc>

## Mockups
<written when the ux-ui skill generates mocks against this item>

## Implementation notes
<accumulated by /agile-workflow:implement as work progresses>
```

The body is the work. Brief → design → mockups → implementation notes →
review findings all live in the same file as stages advance. There is no
parallel design doc. You can read these files in an editor, but let the
agent update them so state, dates, validation, and commits stay
consistent.

`parent` and `depends_on` are not interchangeable. A parent groups work;
`depends_on` determines which work can start.

## Ask for state instead of tracking it yourself

At session start (and again after compaction), the hook force-loads your
project rules — every `.agents/rules/*.md` file — into the agent's
context. That includes the plugin-managed `agile-workflow.md` rules, the
`patterns.md` digest from `gate-patterns`, and any rules you add yourself.
Tune this in `.work/CONVENTIONS.md`: `rules_context: off` disables
injection, and `rules_context_max_bytes` (default 12000) caps the size. In
Codex, plugin-bundled hooks must be reviewed and trusted before they run.

The hook does not inject a queue snapshot. Ask the agent a direct
question — *"What's ready to work?"*, *"What's blocked?"*, *"What remains
under epic-uploads?"* — or use `work-view` or the board for queue state.
The `review` stage is an agent review boundary, not automatically a
request for your approval; ask which items genuinely require your
decision.

For direct queries, the agent uses `.work/bin/work-view`:

```bash
.work/bin/work-view --help              # full flag set
.work/bin/work-view --ready             # items ready to work
.work/bin/work-view --stage review      # items waiting on review
.work/bin/work-view --parent <epic-id>  # children of an epic
.work/bin/work-view --scope all         # include shipped/archived history
```

Every stage transition is a commit. When you ask "when did feature-X get
designed?", the agent reads `git log .work/active/features/<id>.md` to
answer. If you find yourself reaching for `work-view` often, that's a
signal to ask the agent more pointed questions instead.

## Use direct commands when you need a specific boundary

Most work starts from plain language. These direct forms are useful when
you want an exact target or batch:

| Ask / invoke | What happens |
|---|---|
| `/agile-workflow:park <desc>` or *"park the idea of an admin dashboard"* | Captures an unscoped item in `.work/backlog/`. |
| `/agile-workflow:scope <id>` or *"scope idea-csv-export as a feature"* | Promotes one backlog item and records its kind and dependencies. |
| `/agile-workflow:scope` or *"scope the backlog"* / *"scope the auth stuff"* | Proposes a batch structure, confirms once, then writes it. |
| `/agile-workflow:refactor-design` or *"find refactor candidates"* | Scans a requested scope and emits items classified pure-refactor vs behavior-changing. |
| `/agile-workflow:perf-design` or *"what's slow here?"* | Profiles the top 3–5 likely hot paths and emits items per bottleneck. |
| `/agile-workflow:epic-design <id>` or *"decompose epic-billing"* | Designs an epic and creates dependent child features at `stage: drafting`. |
| `/agile-workflow:feature-design <id>` or *"design feature-csv-export"* | Writes the design into the item body and advances it (routes to `refactor-design` / `perf-design` by tag). |
| `/agile-workflow:implement <id>` or *"implement feature-csv-export"* | Implements and verifies one cohesive item boundary. |
| `/agile-workflow:review <id>` or *"review feature-csv-export"* | Runs the kind-appropriate review and advances or returns the item. |
| `/agile-workflow:review` or *"review everything at review"* | Walks the review queue and returns one summary. |
| `/agile-workflow:fix <desc>` or *"fix the typo in README.md"* | Reproduces, repairs, verifies, and normally completes a focused bug story. |

The tag you suggest at scope time decides the design path: untagged →
greenfield design, `[refactor]` → refactor design, `[perf]` → perf design,
`[prose]` → the no-code authoring lane, `[research]` → grounded research
via the `agentic-research` plugin.

For a sweeping architectural reconception (not routine cleanup), use the
deliberately manual command:

```
/agile-workflow:bold-refactor "extract auth into a port"
```

Conceptual lenses (elimination, unification, inversion, and others)
surface candidate abstractions. Output is one or more refactor epics with
child features tagged `[refactor]`, ready for `refactor-design` and then
autopilot. Run it with no argument to sweep the whole codebase, or with a
path to focus. User-invocable only — too aggressive for the agent to
auto-trigger.

## Keep foundation docs current

The **rolling-foundation principle** keeps standing documentation useful:
`docs/VISION.md`, `docs/SPEC.md`, and `docs/ARCHITECTURE.md` describe what
is true now, or what will be true once accepted in-flight design lands.

Do not preserve superseded behavior with "previously," version-history
notes, or migration commentary. Update false, stale, or contradictory
assertions in place. Git carries the history.

Two timings are valid:

- **Code-first** for routine work: update affected docs when
  implementation lands.
- **Design-first** for major scope: roll docs forward during scoping so
  they lead the implementation window. `scope` operates this way for large
  scope; `ideate` operates this way at bootstrap.

The release-time `gate-docs` check is the backstop — it flags drift
between intent and reality regardless of timing. If you spot a doc that's
lying about current or intended state, just say so; the agent refreshes
it in place.

## Understand `convert` before migrating

`/agile-workflow:convert` detects four project shapes:

1. **`workflow`-plugin layout** — `docs/designs/`, `docs/ROADMAP.md`, or
   `docs/PROGRESS.md`. Phases become epics, open designs become
   implementing features, and completed designs can become a
   retro-release at `.work/releases/v0/`. Source files stay in place as
   legacy history until you verify the migration via `MIGRATION_REPORT.md`.
2. **Ad-hoc tracking** — root `TODO.md`, `BACKLOG.md`, `NOTES.md`, or
   `tasks/`. Entries become backlog items after confirmation.
3. **No tracking** — source code exists without recognized tracking
   files. The command creates an empty substrate with foundation-doc
   references.
4. **Greenfield** — no source code, or only a README and configuration.
   The command creates an empty substrate ready for `epicize`.

`convert` is idempotent via `--update`. The full detection and migration
matrix is in `plugins/agile-workflow/docs/MIGRATION.md`. To move to
Workbench instead, run `/workbench:setup`.

## Ground work in external research when needed

When a work item needs external grounding before it can be designed —
"what does the industry do for X?" — commission a research engagement via
`/agentic-research:research-orchestrator` and cite the result with
`research_refs: [<slug>]` in the item's frontmatter. See
`plugins/agentic-research/docs/HANDOFF.md` for the commissioning recipe,
including when to use `depends_on` to gate the item on research
completion. Without the `agentic-research` plugin, `[research]` is an
inert tag and normal feature design handles the item.

## Recover from common stops

- **`convert` reports no foundation docs:** run `/agile-workflow:ideate`,
  review the docs, then retry conversion.
- **Alignment refuses to run:** stop or finish the active autopilot goal,
  then run both interactive `--only-questions` passes.
- **Autopilot reports blocked:** ask which dependency or recorded blocker
  is holding the queue, resolve it, and continue the same goal.
- **A release is not ready:** complete the listed bound items and gate
  findings, then rerun `/agile-workflow:release-deploy <version>`.
- **The queue looks stale after installation:** restart the harness so the
  new hook code loads, then ask the agent to reread `.work/`.

## Tips for productive collaboration

- **State intent, not procedure.** "Finish feature-rate-limits" works
  better than "now run the implement skill."
- **Ask diagnostic questions freely.** "What's blocked?", "Why is story-Y
  still drafting?" — all cheap, all routed through the substrate.
- **Tag at scope time.** Suggest `[refactor]` or `[perf]` when you scope a
  feature — that decides which design path runs.
- **Trust the rolling foundation.** If a foundation doc is wrong, say so;
  don't write a "previously…" note yourself.
- **Use autopilot for breadth, conversation for depth.** Autopilot shines
  with a queue of well-shaped items and a clear drain scope. For close
  collaboration on a hard design, just talk.
- **Always run the alignment one-two before autopilot.** Pair both passes
  with `ux-ui-design` mocks so autopilot inherits visual alignment too.
- **Don't pre-decompose.** Epicize at bootstrap; let features and stories
  emerge from `scope`, `epic-design`, and `feature-design` as work
  surfaces. The substrate rewards late-binding.

## Where to read more

- [ux-ui-design-guide.md](ux-ui-design-guide.md) — the mockup-first design
  loop that pairs with this plugin
- `plugins/agile-workflow/docs/VISION.md` — what this is and why it exists
- `plugins/agile-workflow/docs/SPEC.md` — frontmatter contract, file
  layouts, hook contracts, work-view flag set
- `plugins/agile-workflow/docs/ARCHITECTURE.md` — substrate layout, item
  lifecycle, autopilot algorithm, gate orchestration, full skill catalog
- `plugins/agile-workflow/docs/PRINCIPLES.md` — code-design and
  substrate-execution principles, deeply explained
- `plugins/agile-workflow/docs/MIGRATION.md` — `convert`'s behavior across
  the four project shapes
