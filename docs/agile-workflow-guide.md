# Agile-Workflow Guide

How to use the `agile-workflow` plugin to track and ship software work using
a markdown-based substrate that lives in your repo.

This guide is for humans collaborating with an agent on a project that uses
agile-workflow. It explains what your role looks like, when to invoke specific
entry points or goal statements, and how to set things up so the agent —
especially `autopilot` — runs well.

For deep specs, see
`plugins/agile-workflow/docs/{VISION,SPEC,ARCHITECTURE,PRINCIPLES,MIGRATION}.md`.

> **Note on the deprecated `workflow` plugin.** This repo previously shipped a
> sibling `workflow` plugin (doc-driven). It is **deprecated and no longer
> supported.** New work should use `agile-workflow`. If you have an existing
> project on `workflow`, `/agile-workflow:convert` will migrate it (see
> *Migrating an existing project* below).

## What this is

`agile-workflow` tracks work as **items** — markdown files with YAML
frontmatter in `.work/`. The body of each item carries the brief, the
design, and implementation notes as stages advance. Releases are
late-binding (you decide what ships at release time, not at scope time).
Gates produce items to fix instead of pass/fail reports. And `autopilot`
drains the queue autonomously when the work is shaped well enough to let
it.

The whole plugin is shaped around one idea: **front-load the directional
choices, then let the agent run.** This guide walks through how.

## How you interact with this system

**You set intent. The agent moves items.**

Your role in a project that uses agile-workflow:

- **Decide direction.** What's the next thing worth doing? Which idea should
  be promoted? Is this feature ready for review? Should we cut a release?
- **Provide context.** When the agent asks "what do you mean by X?" — answer.
  When you have a clarifying constraint, surface it.
- **Invoke a few broad entry points at the right moments.** Some are slash
  commands, and autopilot is best started as a goal statement. Everything else
  routes from conversation.
- **Review what the agent produced.** Designs, code, gate findings — your eyes
  on the result, before stages advance to `done`.

What you **don't** have to do:
- Edit `.work/` files by hand.
- Run any CLI directly. There's a query script (`.work/bin/work-view`), but
  it exists for the agent — when you want to know what's ready, what's
  blocked, what's waiting for you, just ask.
- Track item state in your head. The substrate is the source of truth and
  the agent reads it on every session start.
- Re-feed context across sessions. A fresh session picks up active work from
  `.work/active/` automatically, via the SessionStart hook.

## The substrate at a glance

When you bootstrap agile-workflow in a project (`/agile-workflow:convert`),
this layout appears in the repo:

```
.work/
├── active/
│   ├── epics/<id>.md         multi-feature arcs in flight
│   ├── features/<id>.md      design + implementation units
│   └── stories/<id>.md       single-session work units
├── backlog/<id>.md           parked ideas, unscoped
├── releases/<version>/       shipped bundles
├── archive/<id>.md           done items not bound to a release
├── bin/work-view             query script (the agent uses this)
└── CONVENTIONS.md            project-specific overrides
AGENTS.md                         canonical agent instructions (slim: orientation + pointers + read-directive)
CLAUDE.md -> AGENTS.md            Claude Code compatibility
.agents/
├── rules/*.md                    force-loaded agent rules (agile-workflow.md + patterns.md digest + your own; hook-injected)
└── skills/patterns/              detailed reusable code patterns
docs/                              foundation docs (VISION, SPEC, ARCHITECTURE)
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
<written when /ux-ui-design generates mocks against this item>

## Implementation notes
<accumulated by /agile-workflow:implement as work progresses>
```

The body is the work. Brief → design → mockups → implementation notes →
review findings all live in the same file as stages advance. There is no
parallel design doc.

You can read these files (they're plain markdown), but you don't edit them.
The agent reads and writes them as part of normal conversation.

## Quick start (greenfield)

Install `agile-workflow` through the channel you are using:

```bash
# Claude Code
/plugin marketplace add nklisch/skills
/plugin install agile-workflow@nklisch-skills

# OpenAI Codex
codex plugin marketplace add https://github.com/nklisch/skills
codex plugin install agile-workflow

# Pi
pi install npm:@nklisch/pi-agile-workflow
# or, from a local checkout:
pi install -l ./plugins/agile-workflow
```

The substrate skills are shared across all three. Pi also loads the package's
native extension, which gives you `/aw status`, `/aw ready`, and `/aw autopilot`
shortcuts around the same `.work/` queue.

```bash
# 1. Foundation docs
/agile-workflow:ideate

# 2. Visual identity — palette + components — so every later mock inherits
/ux-ui-design:palette
/ux-ui-design:components

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

Steps 6 and 7 are the heart of it. Read the *killer workflows* section below
for why this sequence matters.

## Quick start (existing repo)

```bash
# 1. Bootstrap the substrate (detects existing project shape)
/agile-workflow:convert

# 2. (Optional) Audit + mirror existing UI into mocks
/ux-ui-design:adopt

# 3. Cluster your backlog or fresh ideas into structured work
/agile-workflow:scope    # batch mode — clusters everything in backlog
# or scope individual items: /agile-workflow:scope <id>

# 4. Same alignment one-two before autopilot
/agile-workflow:epic-design --only-questions --all
/agile-workflow:feature-design --only-questions --all

# 5. Drain with a harness goal
Goal: Use agile-workflow autopilot to drain --all
```

In Pi, `/aw status` shows the ready/review/blocked snapshot, `/aw ready` lists
ready items, and `/aw autopilot <scope>` queues the shared
`$agile-workflow:autopilot` skill.

## Killer workflows (the rhythm that makes this click)

The whole plugin is shaped to let `autopilot` carry as much work as
possible. Autopilot only runs well when it doesn't have to guess on
directional choices. Front-loading those choices is the highest-leverage
habit in the loop.

**You can absolutely skip autopilot** and run skills manually in
conversation — but if you do plan to use autopilot, these are the moves
that make it work.

### 1. The alignment one-two before autopilot

```
/agile-workflow:epic-design --only-questions --all
/agile-workflow:feature-design --only-questions --all
```

This is the rhythm. Both passes walk every drafting item in their tier,
surface high-leverage product / architecture / scope questions specific to
that item, ask you via `AskUserQuestion`, and capture your answers under
`## Design decisions` in each item body. Neither pass advances stage or
decomposes children — that's left to the real design pass autopilot will
run later.

- **`epic-design --only-questions`** handles the arc-level choices: what's
  this epic actually delivering, what's in scope vs explicitly out, what
  shape does the user experience take. This is where the load-bearing
  decisions get made. When `ux-ui-design` is installed, this pass also
  invokes `:screens` and `:flows` for the cross-feature journeys clear at
  this tier — the visual decisions get pinned at the same time as the
  product ones.
- **`feature-design --only-questions`** drills into each feature: which
  components to reuse, where the edges are, what the acceptance criteria
  look like. This pass picks up any remaining `:screens`/`:flows` for
  surfaces not covered upstream.

Why this works:

- **Autopilot inherits your answers.** When the full design passes run under
  autopilot later, they read `## Design decisions` and `## Mockups` and
  skip their own question-asking phase. No autonomous guessing on direction.
- **One sitting beats N pauses.** Doing all the Q&A up front replaces
  autopilot pausing per-item mid-run — or worse, not pausing and committing
  to a wrong direction across multiple features before you notice.
- **Cheap now, expensive later.** Catching a wrong directional choice
  before code or child items land is far cheaper than unwinding it after
  autopilot has built on top of it.

`--only-questions` refuses to run *inside* an active autopilot goal — it's
explicitly a pre-autopilot, human-in-the-loop step. The right rhythm is:

```
--only-questions --all (both tiers) → review captured decisions
→ Goal: Use agile-workflow autopilot to drain --all
```

You can skip this only when the drafting queue is empty or every drafting
item's body already pins every directional choice. Rare in practice.

### 2. Greenfield bootstrap with mocks first

For a fresh project, the full sequence is:

```
ideate → palette + components → convert → epicize
       → epic-design --only-questions --all       (with screens/flows mocks)
       → feature-design --only-questions --all    (with more mocks)
       → Goal: Use agile-workflow autopilot to drain --all
```

The palette/components first means every later mock inherits the visual
voice. The two `--only-questions` passes mean every later autopilot stride
inherits both directional and visual alignment. By the time autopilot runs,
it knows what to build *and* what it should look like.

### 3. Backlog grooming → structured plan

When you have a pile of unstructured ideas in `.work/backlog/`:

```
/agile-workflow:scope                              # batch — clusters everything
/agile-workflow:epic-design --only-questions --all # align on the new epics
/agile-workflow:feature-design --only-questions --all
Goal: Use agile-workflow autopilot to drain --all
```

The batch `scope` pass clusters the whole backlog by code seam and
capability arc, proposes a structure, confirms once with you, then writes
everything as epics / features / stories with declared `depends_on`.

You can also filter: *"scope the auth stuff"* narrows the batch to one
area. *"Scope idea-csv-export as a feature under epic-export"* promotes one
item.

### 4. Mock first at every phase

Whenever a new screen or flow shows up in the design queue, mock it before
designing it in code. The tier-ordering rule:

- **Tier 1 (after ideate):** `palette` + `components` — the foundation
- **Tier 2 (during `epic-design --only-questions`):** `screens` + `flows`
  for load-bearing cross-feature journeys
- **Tier 3 (during `feature-design --only-questions`):** more `screens` +
  `flows` for per-feature surfaces
- **Tier 4 (ad-hoc):** one-off mocks mid-design when a particular surface
  needs exploration before proceeding

You do most of the work at tiers 1 and 2 — the big choices. Tier 3 fills
in the gaps. Tier 4 is the escape hatch.

See [ux-ui-design-guide.md](ux-ui-design-guide.md) for the full mock-first
loop.

## The broad entry points you'll use

Most operations route from conversation. These entry points are different —
broad enough or consequential enough that you trigger them deliberately. Three
are slash commands; autopilot is best expressed as a harness goal statement.

### `/agile-workflow:ideate`

**What it does.** Workshop foundation docs (VISION, SPEC, ARCHITECTURE,
PRINCIPLES) by interviewing you about the project's purpose, constraints,
and shape. Output lands in `docs/`.

**When to invoke.**
- Once at project start (greenfield).
- Whenever the project's premise shifts enough that the foundation docs no
  longer describe present intent. Examples: a major pivot, a new platform
  target, a renamed primary user.
- Before `/agile-workflow:convert` if no foundation docs exist yet (convert
  refuses to bootstrap a project without VISION or SPEC — it has no anchor
  for later design passes).

**Pair with `palette`.** If `ux-ui-design` is installed, this skill
recommends running `/ux-ui-design:palette` right after — so the visual
identity is locked before epics start to land.

**Ordering.** Always before `convert` and `epicize`.

### `/agile-workflow:epicize`

**What it does.** Reads the foundation docs and decomposes them into a set
of epics — multi-feature arcs sized to deliver concrete capability. Each
epic gets a file in `.work/active/epics/` with `depends_on` chains so the
order of work is encoded in the substrate.

**When to invoke.**
- Right after `convert` on a freshly bootstrapped greenfield project.
- Periodically as the project grows and a new arc surfaces (e.g., after a
  big `/ideate` refresh).
- When you've accumulated several backlog ideas that obviously cluster into
  an arc, ask the agent to scope them, then `epicize` to organize.

**Ordering.** After `ideate` + `convert`, before serious work begins.

### Autopilot Goal

**What it does.** Drains a queue of ready work without further input from you.
Picks items by dependency (least-blocked first), invokes the right skill for
each stage (design family for `drafting`, implement family for `implementing`,
review for `review`), advances stages, commits per transition, and repeats
until the goal scope is done or blocked.

Autopilot does not schedule `/loop` tasks or maintain its own resume command.
Claude/Codex harness goal/continuation features keep long-running work alive.
The substrate is the resume point: a continued run re-reads `.work/active/`.

**Always do this first.** Run the alignment one-two (see *Killer workflows*
above):

```
/agile-workflow:epic-design --only-questions --all
/agile-workflow:feature-design --only-questions --all
```

This locks in directional choices and mocks before autopilot starts. Autopilot
inherits everything and runs without autonomous guessing.

**How to start it.**
- `Goal: Use agile-workflow autopilot to drain <epic-id>` — drain everything
  under one epic.
- `Goal: Use agile-workflow autopilot to drain --all` — drain every ready item
  in `.work/active/`. Use this when you want broad progress while you step
  away.
- Direct `/agile-workflow:autopilot <scope>` still works, but goal text is the
  preferred shape for long runs because the harness owns continuation.

**When NOT to invoke.**
- When you have a specific item you want done with your own input — invoke
  the relevant skill in conversation instead (*"design feature-X"*,
  *"implement story-Y"*).
- When the queue is small and you want to stay close to the work.

**How to interrupt.** Just send a message. Autopilot finishes the current
item cleanly, commits, and stops. No special halt command.

**What to do when it stops.**
- If it hit a blocker: read the agent's report. Often the blocker is "this
  feature needs your design input" or "this story has unclear acceptance
  criteria." Resolve in conversation, then continue the same goal or start a
  new autopilot goal for the remaining scope.
- If it found nothing ready: queue is drained, or every remaining item is
  blocked. Look at what's blocking and unblock it.

### `/agile-workflow:release-deploy <version>`

**What it does.** Cuts a release.
1. **Bind** — interactive prompt asking which `done` items go in this
   release. Their `release_binding` gets set.
2. **Run gates** — invokes the gate sequence in `CONVENTIONS.md` order
   (default: security → tests → cruft → docs → patterns). Each gate scans
   the bound bundle and produces items as findings (not pass/fail reports).
3. **Wait for readiness** — release ships when every item with
   `release_binding: <version>` is at `stage: done`. If items remain,
   `release-deploy` halts with the pending list.
4. **Ship** — per the project's release mapping (chosen at convert time:
   tag-based, branch-held, release-branch, or none). `none` means
   release-deploy only gates and archives the bundle; publishing/version
   bumping stays with the project's external release mechanism.
5. **Archive** — bound items collapse into one `.work/releases/<version>/release-<version>.md`
   summary; bodies are pruned to git history or kept on disk per the project's
   terminal-tier retention. The release file flips to `stage: released`.

**When to invoke.**
- When you have a coherent set of done items that belong together as a
  shipped version.
- Re-invoke as you drive gate-produced findings to done. It's idempotent —
  rerun safely; it advances readiness without duplicating work.

**Ordering.** Items must reach `stage: done` before they can be bound. The
gate skills run inside this command; you don't invoke them yourself.

## Skills the agent picks for you (so you know what's happening)

The agent picks operational skills from conversation. You don't name them,
but knowing what each does helps you steer.

### Capture and promotion

- **`park`** fires when you say things like "park this idea" or "remind me
  to think about X later." Output: a flat, unscoped file in `.work/backlog/`.
  It can preserve a short idea, richer current-context note, or roadmap-style
  thought without promoting or designing it.
- **`scope`** fires when you say "let's scope idea-X as a feature" or
  "promote that to active." Output: file moves from `.work/backlog/` to
  `.work/active/<kind>/`, frontmatter populated, dependencies declared. For
  large scope, `scope` rolls foundation docs forward as part of the move.
  Say "scope the backlog" (or just "scope") and it clusters every backlog
  item — does a light pass over the codebase to spot natural seams, proposes
  epics / features / stories, confirms with you once, then writes everything.
  Filter with natural language ("scope the auth stuff") to narrow.
- **`fix`** fires for quick bugs: "fix the typo in README" or "the pagination
  is off by one." Single-stride: reproduces, finds root cause, writes a
  failing test, applies the minimal fix, lands the story at `stage: review`.

### Design family (kind- and tag-routed)

When you say "design feature-X" or autopilot reaches a `drafting` item, one
of these fires based on item kind and tags:

- **`epic-design`** — fires for an epic at `stage: drafting`. Decomposes it
  into child features with `depends_on` chains. Output: child feature files
  spawned at `stage: drafting`. When `ux-ui-design` is installed, this is
  the **primary tier for UI mocks** — palette + screens + flows across the
  decomposition; `--only-questions` always runs the mock pass.
- **`feature-design`** — fires for an untagged feature at `stage: drafting`.
  Greenfield design: vision absorption, codebase mapping, unit decomposition,
  pre-mortem, test design. Inherits parent-epic mocks; only invokes
  `:screens`/`:flows` for minor surfaces not covered upstream.
- **`refactor-design`** — two modes. When a feature is tagged `[refactor]`:
  plans the refactor (cost/benefit, before/after, rollback per step). When
  you ask "find refactor candidates" or "what should we clean up here":
  scans the codebase (or a path / NL scope), classifies findings as
  pure-refactor or behavior-changing, and emits items. Pure-refactor
  findings come back tagged `[refactor]`; behavior-changing ones route to
  `feature-design` on a later pass.
- **`perf-design`** — two modes. When a feature is tagged `[perf]`:
  bottleneck identification, optimization hierarchy, benchmark scaffolds.
  When you ask "find perf issues" or "what's slow here": picks the top 3-5
  likely hot paths in the target scope, profiles them, emits items per
  bottleneck.

The tag you suggest at scope time decides the design path. Untagged →
greenfield. `[refactor]` → refactor design. `[perf]` → perf design. You can
also ask either skill to **discover** candidates directly — no existing
item required.

### Production

- **`implement`** — single-stride code from item body. Reads the design,
  writes code, runs tests, advances to `review`. Use for stories or small
  features.
- **`implement-orchestrator`** — fans implementation sub-agents over child
  stories respecting `depends_on`. It chooses bundles, wave width, and worktree
  isolation. Use for features with several child stories that have a non-trivial
  dependency graph. The agent picks this when scope warrants; you can also ask
  for it explicitly.

### Review

- **`review`** fires when you say "review feature-X" or autopilot reaches a
  `review` item. Structured peer review across five lenses: correctness,
  tests, design, security, breaking changes, foundation-doc alignment.
  Findings get triaged into items so they don't evaporate into prose. Auto-
  advances `review → done` if everything passes; otherwise sends the item
  back to `implementing` with the new findings as child items. Say "review
  everything at review" or "review the auth stuff" and it walks the queue
  in batch with a single summary at the end.

### Gates (release-time only)

These don't fire from conversation — they fire from inside `release-deploy`.
Worth knowing they exist so the items they produce make sense:

- **`gate-security`** — scans bound items' code changes against a security
  checklist. Produces items tagged `[security]`.
- **`gate-tests`** — scans coverage of bound items' acceptance criteria.
  Produces items tagged `[testing]` for gaps.
- **`gate-cruft`** — finds dead code introduced or revealed by the bundle.
  Produces items tagged `[cleanup]`.
- **`gate-docs`** — checks foundation-doc alignment with the bundle's
  behavior changes. Produces items tagged `[documentation]`. This is the
  rolling-foundation safety net — it catches drift even when you forget to
  update a doc when shipping a feature.
- **`gate-patterns`** — surfaces reusable patterns that emerged in the
  bundle. Produces pattern-skill files plus a tracking item.

### Reference and helpers

- **`principles`** auto-loads during design, implement, review, and any time
  foundation docs are touched.
- **`code-audit` plugin scans** — optional companion reports when you want
  markdown audit deliverables without writing `.work` items. Use those for
  report-only deep scans, bug/security/test scans, perf scouting, bold refactor
  proposals, and `repo-eval` scorecards.
- **`research`** and **`refactor-conventions-creator`** — auto-loading or
  one-shot helpers.

## A typical day

### Actionable prompt context

Open Claude Code or Codex in the project. At session start (and again after the
context is compacted), the hook **force-loads your project rules** — every
`.agents/rules/*.md` file — into the agent's context. That includes the
plugin-managed `.agents/rules/agile-workflow.md` (tag semantics, test integrity,
review policy, entry points), the `.agents/rules/patterns.md` digest from
`gate-patterns`, and any rules you add yourself. This is the reliable,
cross-vendor replacement for the legacy Claude-only `.claude/rules/`: rules reach
the agent in both Claude Code and Codex, exactly once per session (re-injected
after compaction or whenever a rules file changes, via per-epoch + content-hash
dedup). It is content-agnostic — drop any `*.md` into `.agents/rules/` and it
loads. In Codex, `PostCompact` itself is side-effect-only because Codex does not
accept `additionalContext` on that event; rules reload through `SessionStart`
with `source: compact`.

You can tune this in `.work/CONVENTIONS.md`: `rules_context: off` disables the
injection, and `rules_context_max_bytes: <int>` (default 12000) caps the size.
In Codex, plugin-bundled hooks must be reviewed and trusted before they run;
enabling the plugin alone does not auto-trust them.

For *actionable workflow prompts* — *"review feature-uploads-retry"*,
*"drain the auth epic"*, *"scope the backlog"* — `prompt-context.py` may add a
small principles capsule once per session when the prompt calls for it: code
design, dispatch economy, or advisory review. It does not inject queue snapshots
at prompt time; use `work-view`, `/aw status`, `/aw ready`, or the board for
queue state. Idle chat and explainer prompts get no capsule.

### Driving work

Tell the agent your intent. Common moves and what they trigger.

Either style works — invoke the slash command directly, or describe what you
want in plain language and the agent picks the skill. Slash form is faster
when you know the verb; conversational form is more natural when you're
thinking out loud.

| Ask / invoke | What fires | What you get back |
|---|---|---|
| `/agile-workflow:park <desc>` or *"park the idea of an admin dashboard"* | `park` | A flat file in `.work/backlog/`; agent confirms. |
| `/agile-workflow:scope <id>` or *"scope idea-csv-export as a feature"* | `scope` | File moves to `.work/active/features/`; agent reports the new ID and any declared dependencies. |
| `/agile-workflow:scope` (no arg) or *"scope the backlog"* / *"scope the auth stuff"* | `scope` (batch) | Backlog clustered into a proposed structure; agent confirms once before writing everything. |
| `/agile-workflow:refactor-design` or *"find refactor candidates"* / *"what should we clean up?"* | `refactor-design` (discovery) | Items emitted for what was found, classified pure-refactor vs behavior-changing. |
| `/agile-workflow:perf-design` or *"what's slow here?"* / *"profile the API layer"* | `perf-design` (discovery) | Top 3-5 hot paths profiled, items emitted per bottleneck. |
| `/agile-workflow:review` (no arg) or *"review everything at review"* | `review` (batch) | Walks the review queue, single summary at the end. |
| `/agile-workflow:epic-design <id>` or *"decompose epic-billing"* | `epic-design` | Child features spawned at `stage: drafting` with `depends_on` chains; agent reports the structure. |
| `/agile-workflow:feature-design <id>` or *"design feature-csv-export"* | `feature-design` (or `refactor-design` / `perf-design` by tag) | Design written into the feature item's body; stage advances to `implementing`; agent walks you through the design. |
| `/agile-workflow:implement <id>` or *"implement story-csv-validate"* | `implement` | Code written, tests run, stage advances to `review`; agent reports what it built and any caveats. |
| `/agile-workflow:review <id>` or *"review feature-csv-export"* | `review` | Structured review; either advances to `done` or returns the item to `implementing` with findings. |
| `/agile-workflow:fix <desc>` or *"fix the typo in README.md"* | `fix` | New story spawned, fix landed, stage at `review`. |
| *"What's waiting on me?"* | (substrate query) | List of items at `stage: review`. |
| *"What's ready to work?"* | (substrate query) | List of items with deps satisfied. |
| *"What's in flight under epic-uploads?"* | (substrate query) | Children of the epic with their stages. |

Diagnostic questions ("what's blocked?", "what depends on story-X?", "show me
the design for feature-Y") all route through the agent reading the substrate.
You don't run any CLI.

### Stage transitions are commits

Every stage advance is a commit. When you ask "when did feature-X get
designed?" or "what changed when this advanced to review?", the agent reads
`git log .work/active/features/<id>.md` to answer. The full history of every
item is in git.

You don't need to think about commits — the agent commits per stage
transition automatically.

## Larger flows

### Cutting a release

Releases are late-bound. Items don't have a `release_binding` until you
explicitly cut a version:

```
/agile-workflow:release-deploy v0.1.0
```

The agent will:
1. Ask which done items go in this release.
2. Run the gates against the bound bundle, producing items for any findings.
3. Show you the readiness state — which items still need to reach done
   before the release can ship.
4. When everything is done, ship per the project's release mapping (set at
   convert time).

Findings the gates surface (security gaps, missing tests, doc drift) come
back as items. Drive them to done, then re-invoke
`/agile-workflow:release-deploy v0.1.0` — it's idempotent.

### Bold architectural reconceptions

For sweeping reshapes (not routine refactoring), use:

```
/agile-workflow:bold-refactor "extract auth into a port"
```

This uses conceptual lenses (elimination, unification, inversion, etc.) to
surface beautiful abstractions. It's user-invocable only — too aggressive
for the agent to auto-trigger. Output is one or more refactor **epics**
with child features tagged `[refactor]`, ready for `refactor-design` to
plan each piece. From there, `autopilot` can drain them. You can also run
it with no argument to sweep the whole codebase, or with a path
(`/agile-workflow:bold-refactor src/auth/`) to focus.

## Foundation docs roll forward

The plugin enforces the **rolling-foundation principle**: foundation docs in
`docs/` (VISION.md, SPEC.md, ARCHITECTURE.md) describe the project's vision
and current intent — what is true now, OR what will be true once in-flight
design lands. They roll forward in place. Never carry "previously" /
"in v1.x" / migration prose. Git is the audit trail; the doc carries the
active truth.

Two timing styles for SPEC and ARCHITECTURE — both legitimate:

- **Code-first (default for routine features):** docs update at implementation
  merge.
- **Design-first (for large scope, initial ideation):** docs preflight-update
  at scope time, leading the code through the implementation window. The
  `scope` skill operates this way for large scope; `ideate` operates this way
  at bootstrap.

The forbidden patterns are identical in both styles: replace stale assertions
in place, never accumulate historical prose. The `gate-docs` skill at
release-deploy time is the backstop — it catches drift between intent and
reality regardless of style.

VISION.md is always future-looking. It rolls forward as the project's
direction evolves.

If you spot a doc that's lying about current or intended state — disagrees
with the code, references a removed feature, or repeats a since-revised
assertion — just say so. The agent will refresh it.

## Reading the substrate yourself (rare)

Most of the time you ask the agent and it answers. If you want to peek
without going through the agent, the items are plain markdown — open them
in your editor.

For queries beyond reading a single file, the agent uses
`.work/bin/work-view`. You don't need to run it, but it's there:

```bash
.work/bin/work-view --help              # full flag set
.work/bin/work-view --ready             # items ready to work
.work/bin/work-view --stage review      # items waiting on you
.work/bin/work-view --parent <epic-id>  # children of an epic
.work/bin/work-view --scope all         # include shipped/archived history
                                        # (default: active + backlog only)
```

The agent runs this internally on every session start (via the hook) and
whenever it needs to navigate. If you find yourself reaching for it
yourself often, that's a signal to ask the agent more pointed questions
instead — "what's blocking story-X?" works better than running
`--blocking`.

## Migrating an existing project

If you have an existing project (with or without the deprecated `workflow`
plugin), `/agile-workflow:convert` detects its shape and migrates:

```
/agile-workflow:convert
```

`convert` recognizes four project shapes:

- **`workflow`-plugin layout** (`docs/designs/`, `docs/ROADMAP.md`,
  `docs/PROGRESS.md`) — phases become epics, designs become features at
  `stage: implementing`, completed designs synthesize into a retro-release
  at `.work/releases/v0/` (opt out to archive). Source files left in place
  as legacy history; delete after verifying the migration via
  `MIGRATION_REPORT.md`.
- **Ad-hoc tracking** (loose markdown notes) — best-effort inventory into
  the substrate.
- **No tracking at all** — seeds an empty substrate with foundation-doc
  references.
- **Greenfield** — seeds the empty substrate ready for `epicize`.

Idempotent via `--update`. The full migration matrix is in
`plugins/agile-workflow/docs/MIGRATION.md`.

## Skill catalog (reference)

The catalog is grouped by how humans experience it. You'll only ever invoke a
few skills explicitly — the rest the agent picks for you from the substrate,
item kind, tags, release stage, and conversational intent.

### Bootstrap (you invoke)
- **ideate** — foundation-docs workshop
- **convert** — substrate bootstrap; idempotent via `--update`
- **epicize** — decompose foundation docs into epics with `depends_on` chains

### Capture & promotion (agent picks naturally)
- **park** — quick capture into `.work/backlog/`
- **scope** — promote to active; rolls foundation docs forward when large; clusters the whole backlog in batch mode
- **fix** — single-stride bug repair

### Design family (agent picks; kind- and tag-routed)
- **epic-design** — decompose an epic at `stage: drafting` into child features. Primary tier for UI mocks when `ux-ui-design` is installed.
- **feature-design** — greenfield feature design (no specialized tag). Fallback tier for UI mocks.
- **refactor-design** — for features tagged `[refactor]`; also discovery mode (scan codebase, emit items) when no feature is named
- **perf-design** — for features tagged `[perf]`; also discovery mode (profile hot paths, emit items)
- **prose-author** — no-code authoring lane for features tagged `[prose]`
- **e2e-test-design** — designs service-level-mocked e2e coverage for e2e/testing features
- **agentic-research:research-orchestrator** — cross-plugin research lane for features tagged `[research]`

### Production (agent picks)
- **implement** — single-stride code from item body
- **implement-orchestrator** — fans implementation sub-agents over child stories
  respecting `depends_on`

### Review & delivery
- **review** *(agent picks)* — peer review at `stage: review`
- **release-deploy** *(you invoke)* — bind, gate, ship
- **autopilot** *(goal-backed; user or agent starts it)* — autonomous queue runner
- **bold-refactor** *(you invoke)* — architectural reconception
- **board** — human-facing `.work` board over the same substrate

### Scan and discovery helpers
- **deep-code-scan** — comprehensive multi-lane scan that emits substrate work
- **bug-scan** — correctness bug hunt that emits substrate work
- **perf-scout** — speculative performance idea deck that emits substrate work

### Gates (agent picks; produce items, not pass/fail; release-time only)
- **gate-security**, **gate-tests**, **gate-cruft**, **gate-docs**,
  **gate-patterns**, **gate-refactor**

### Reference
- **principles** — code-design + substrate-execution principles
- **research**, **refactor-conventions-creator** — auto-loading or one-shot helpers

## Tips for productive collaboration

- **State intent, not procedure.** "Get story-rate-limits to review" works
  better than "now run the implement skill." The agent picks the right path.
- **Ask diagnostic questions freely.** "What's blocked?", "What's the
  design for feature-X?", "Why is story-Y still drafting?" — all cheap, all
  routed through the substrate.
- **Tag at scope time.** When you scope something as a feature, suggest
  `[refactor]` or `[perf]` if it fits — that decides which design path runs.
  Untagged → standard greenfield design.
- **Trust the rolling foundation.** If a foundation doc is wrong, say so;
  don't write a "previously…" note yourself. The agent updates the doc in
  place.
- **Use autopilot for breadth, conversation for depth.** Autopilot is great
  when you have a queue of well-shaped items and can state the drain scope as a
  goal. When you want close collaboration on a hard design, just talk.
- **Always run the alignment one-two before autopilot.**
  `epic-design --only-questions --all` then
  `feature-design --only-questions --all` is the single highest-leverage
  habit in the loop. Pair both with `ux-ui-design` mocks so autopilot
  inherits visual alignment too. Skip only when the drafting queue is
  empty or every item body already pins every directional choice (rare).
- **Mock first at every phase.** When `ux-ui-design` is installed, mock big
  surfaces at tier 1 and tier 2 (palette/components after ideate, then
  screens/flows during the epic-level `--only-questions` pass) so
  everything downstream inherits the visual voice.
- **Items at review come back to you.** The agent's autonomous review can
  advance trivial items, but anything with judgment calls lands at
  `stage: review` for your eyes. Walk that queue regularly.
- **Restart Claude Code or Codex after install.** Hooks don't take effect
  mid-session. After installing the plugin (`/plugin install agile-workflow@nklisch-skills`), restart for the
  prompt-context and PostToolUse hooks to fire.
- **Don't pre-decompose.** Epicize at bootstrap; let features and stories
  emerge from `scope`, `epic-design`, and `feature-design` as work surfaces.
  The substrate rewards late-binding.
- **Hooks are inert without a substrate.** The prompt-context and substrate
  maintainer hooks check for `.work/CONVENTIONS.md` and exit silently in
  non-substrate repos. Safe to install globally.

## Grounding work items in research

When a work item needs external grounding before it can be designed — "what does
the industry do for X?", "is approach Y actually well-supported?" — commission a
research engagement via `/agentic-research:research-orchestrator` and cite the
result with `research_refs: [<slug>]` in the work item's frontmatter. See
`plugins/agentic-research/docs/HANDOFF.md` for the full commissioning recipe,
including when to use `depends_on` to gate the item on research completion.
Install `agentic-research` through the same Claude Code, Codex, or Pi channel as
`agile-workflow`; without it, `[research]` is just a project tag and normal
feature design handles the item.

## Where to read more

- [ux-ui-design-guide.md](ux-ui-design-guide.md) — the mockup-first design loop that pairs with this plugin
- `plugins/agile-workflow/docs/VISION.md` — what this is and why it exists (2-min read)
- `plugins/agile-workflow/docs/SPEC.md` — frontmatter contract, file layouts, hook contracts, work-view flag set
- `plugins/agile-workflow/docs/ARCHITECTURE.md` — substrate layout, item lifecycle, autopilot algorithm, gate orchestration, full skill catalog
- `plugins/agile-workflow/docs/PRINCIPLES.md` — code-design + substrate-execution principles, deeply explained
- `plugins/agile-workflow/docs/MIGRATION.md` — `convert`'s behavior across the four project shapes
