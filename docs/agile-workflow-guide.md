# Agile-Workflow Guide

How to use the `agile-workflow` plugin to track and ship software work using a
markdown-based substrate that lives in your repo.

This guide is for humans collaborating with an agent on a project that uses
agile-workflow. It explains what your role looks like, when to invoke
specific slash commands, and how to leverage the agent without micromanaging
the substrate. For deep specs, see
`plugins/agile-workflow/docs/{VISION,SPEC,ARCHITECTURE,PRINCIPLES,MIGRATION}.md`.

## What this is

`agile-workflow` is a sibling plugin to `workflow`. Both ship from this repo;
both stay supported. Pick one per project.

| Use `workflow` when... | Use `agile-workflow` when... |
|---|---|
| You like design docs as artifacts (`docs/designs/<name>.md`) | You want design to live inside the work item itself |
| Roadmap-shaped phase plans fit your project | You want late-binding releases (no upfront commitment to which features ship in v0.1) |
| You're comfortable re-feeding context to fresh sessions | You want a session to pick up active work from `.work/` automatically |
| You ship versioned releases by tagging or merging on a fixed cadence | You want gates (security, tests, cruft, docs, patterns) that produce items to fix, not pass/fail reports |

The two plugins do not share skills or state. A project picks one and sticks
with it.

## How you interact with this system

**You set intent. The agent moves items.**

Your role in a project that uses agile-workflow:

- **Decide direction.** What's the next thing worth doing? Which idea should
  be promoted? Is this feature ready for review? Should we cut a release?
- **Provide context.** When the agent asks "what do you mean by X?" — answer.
  When you have a clarifying constraint, surface it.
- **Invoke a few slash commands at the right moments.** There are four worth
  knowing by name (covered below). Everything else routes from conversation.
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

If you've used the `workflow` plugin: the conversational rhythm is the same.
The difference is that work lives in `.work/` items instead of `docs/designs/`,
and stage advances drive the lifecycle instead of doc-existence.

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
.claude/rules/agile-workflow.md   agent navigation rules (auto-loads)
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

## Implementation notes
<accumulated by /agile-workflow:implement as work progresses>
```

The body is the work. Brief → design → implementation notes → review findings
all live in the same file as stages advance. There is no parallel design doc.

You can read these files (they're plain markdown), but you don't edit them.
The agent reads and writes them as part of normal conversation.

## Quick start

```bash
# 1. Install the plugin
/plugin install agile-workflow@nklisch-skills

# 2. In your target project, set up foundation docs (greenfield only)
/agile-workflow:ideate

# 3. Bootstrap the substrate
/agile-workflow:convert

# 4. Decompose foundation docs into epics
/agile-workflow:epicize
```

From here you talk to the agent. Some example openings:

- *"Park the idea of CSV export — we'll get to it after billing ships."*
- *"Pull idea-csv-export up and scope it as a feature under epic-export."*
- *"Design feature-csv-export, then start implementing the validation story."*
- *"What's waiting on me right now?"*
- *"Run autopilot on epic-billing — I'll be back in an hour."*
- *"Cut release v0.1.0 with the four features that just hit done."*

The agent picks the right skill from each ask, reads the substrate to ground
its work, and reports back what it did. You stay in director mode.

## The four slash commands you'll invoke yourself

Most operations route from conversation. These four are different — broad
enough or consequential enough that you trigger them deliberately.

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

**Ordering.** Always before `convert` and `epicize`. Other commands assume
foundation docs exist.

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

### `/agile-workflow:autopilot`

**What it does.** Drains a queue of ready work without further input from
you. Picks items by dependency (least-blocked first), invokes the right
skill for each (design family for `drafting`, implement family for
`implementing`, review for `review`), advances stages, commits per
transition. Stops cleanly on blockers, on your interjection, or near
context limits. Schedules watchdog `/loop` tasks so it survives
compaction.

**When to invoke.**
- `/agile-workflow:autopilot <epic-id>` — drain everything under one epic.
  Use this when an epic is ready to march and you want the agent to handle
  the sequence.
- `/agile-workflow:autopilot --all` — drain every ready item in
  `.work/active/`. Use this when you want the agent to make broad progress
  while you step away.
- `/agile-workflow:autopilot --resume` — pick up where a previous run left
  off. Idempotent; safe to invoke after a stop.

**When NOT to invoke.**
- When you have a specific item you want done with your own input — invoke
  the relevant skill in conversation instead ("design feature-X", "implement
  story-Y").
- When the queue is small and you want to stay close to the work.

**How to interrupt.** Just send a message. Autopilot finishes the current
item cleanly, commits, and stops. No special halt command.

**What to do when it stops.**
- If it hit a blocker: read the agent's report. Often the blocker is "this
  feature needs your design input" or "this story has unclear acceptance
  criteria." Resolve in conversation, then resume.
- If it hit context limits: invoke `/agile-workflow:autopilot --resume` in a
  fresh session. The substrate IS the resume point — there's no separate
  progress file to maintain.
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
   tag-based, branch-held, or release-branch).
5. **Archive** — bound items move via `git mv` from `.work/active/` to
   `.work/releases/<version>/`. The release file flips to `stage: released`.

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
  to think about X later." Output: a flat file in `.work/backlog/`.
- **`scope`** fires when you say "let's scope idea-X as a feature" or
  "promote that to active." Output: file moves from `.work/backlog/` to
  `.work/active/<kind>/`, frontmatter populated, dependencies declared. For
  large scope, `scope` rolls foundation docs forward as part of the move.
- **`fix`** fires for quick bugs: "fix the typo in README" or "the pagination
  is off by one." Single-stride: reproduces, finds root cause, writes a
  failing test, applies the minimal fix, lands the story at `stage: review`.

### Design family (kind- and tag-routed)

When you say "design feature-X" or autopilot reaches a `drafting` item, one
of these fires based on item kind and tags:

- **`epic-design`** — fires for an epic at `stage: drafting`. Decomposes it
  into child features with `depends_on` chains. Output: child feature files
  spawned at `stage: drafting`.
- **`feature-design`** — fires for an untagged feature at `stage: drafting`.
  Greenfield design: vision absorption, codebase mapping, unit decomposition,
  pre-mortem, test design.
- **`refactor-design`** — fires for a feature tagged `[refactor]`.
  Cost/benefit framing, before/after step shape, rollback per step.
- **`perf-design`** — fires for a feature tagged `[perf]`. Bottleneck
  identification, measurement strategy, hot-path analysis.

The tag you suggest at scope time decides the design path. Untagged →
greenfield. `[refactor]` → refactor design. `[perf]` → perf design.

### Production

- **`implement`** — single-stride code from item body. Reads the design,
  writes code, runs tests, advances to `review`. Use for stories or small
  features.
- **`implement-orchestrator`** — fans Sonnet sub-agents over child stories
  respecting `depends_on`. Use for features with several child stories that
  have a non-trivial dependency graph. The agent picks this when scope
  warrants; you can also ask for it explicitly.

### Review

- **`review`** fires when you say "review feature-X" or autopilot reaches a
  `review` item. Structured peer review across five lenses: correctness,
  tests, design, security, breaking changes, foundation-doc alignment.
  Findings get triaged into items so they don't evaporate into prose. Auto-
  advances `review → done` if everything passes; otherwise sends the item
  back to `implementing` with the new findings as child items.

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

### Reference and helpers (carried from workflow)

- **`principles`** auto-loads during design, implement, review, and any time
  foundation docs are touched.
- **`research`**, **`repo-eval`**, **`tool-evaluator`**,
  **`refactor-conventions-creator`** — auto-loading or one-shot helpers.

## A typical day

### Session start

Open Claude Code in the project. The `SessionStart` hook fires
`session-start-snapshot.sh`, which prints a queue snapshot:

```
## Substrate snapshot

### Awaiting your review (stage: review)
- feature-uploads-retry  [content]

### Ready to work (--ready)
1. story-rate-limits      parent=feature-uploads-retry depends_on=[]
2. feature-quota-tracking parent=epic-rate-limits

### Blocked (depends_on unmet)
- story-quota-display  blocked by feature-uploads-retry

### Backlog (top 5 by created)
- idea-archive-format     2026-04-22
- idea-quotas-dashboard   2026-04-21
```

You see immediately what's ready, what's waiting on you, and what's
backlogged. No re-feed needed. From here you decide what to do.

### Driving work

Tell the agent your intent. Common moves and what they trigger:

| What you say | What fires | What you get back |
|---|---|---|
| *"Park the idea of an admin dashboard for later."* | `park` | A flat file in `.work/backlog/`; agent confirms. |
| *"Scope idea-csv-export as a feature."* | `scope` | File moves to `.work/active/features/`; agent reports the new ID and any declared dependencies. |
| *"Decompose epic-billing."* | `epic-design` | Child features spawned at `stage: drafting` with `depends_on` chains; agent reports the structure. |
| *"Design feature-csv-export."* | `feature-design` (or `refactor-design`/`perf-design` by tag) | Design written into the feature item's body; stage advances to `implementing`; agent walks you through the design. |
| *"Implement story-csv-validate."* | `implement` | Code written, tests run, stage advances to `review`; agent reports what it built and any caveats. |
| *"Review feature-csv-export."* | `review` | Structured review; either advances to `done` or returns the item to `implementing` with findings. |
| *"Fix the typo in README.md."* | `fix` | New story spawned, fix landed, stage at `review`. |
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

### Driving an epic to done with autopilot

Epics are multi-feature arcs. To drain one autonomously:

```
/agile-workflow:autopilot epic-rate-limits
```

The agent works the queue: picks the next ready item, invokes the right
skill, advances stage, commits, repeats. You'll see periodic reports.
Items at `stage: review` come back to you — autopilot won't auto-advance
items past review without your eyes (unless it's running in a fully
autonomous review mode, which is opt-in).

You can interrupt by sending a message. Autopilot finishes the current
item, commits, and stops cleanly. Resume with
`/agile-workflow:autopilot --resume` — the substrate IS the resume
state.

For a full project drain (everything ready in `.work/active/`):
`/agile-workflow:autopilot --all`. That mode also triggers an
incremental refactor pass every 5 items completed.

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
for the agent to auto-trigger. Output is a refactor **epic** with child
features tagged `[refactor]`, ready for `refactor-design` to plan each
piece. From there, `autopilot` can drain the epic.

## Foundation docs roll forward

The plugin enforces the **rolling-foundation principle**: foundation docs in
`docs/` (VISION.md, SPEC.md, ARCHITECTURE.md) describe the project's vision
and current intent — what is true now, OR what will be true once in-flight
design lands. They roll forward in place. Never carry "previously" /
"in v1.x" / migration prose. Git is the audit trail; the doc carries the
present.

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

If you spot a doc that's lying about current state — disagrees with the
code, references a removed feature, repeats a since-revised assertion —
just say so. The agent will refresh it.

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
```

The agent runs this internally on every session start (via the hook) and
whenever it needs to navigate. If you find yourself reaching for it
yourself often, that's a signal to ask the agent more pointed questions
instead — "what's blocking story-X?" works better than running
`--blocking`.

## Migrating from the workflow plugin

If you've been using the `workflow` plugin and want to switch:

```
/agile-workflow:convert
```

`convert` detects the workflow-plugin layout (it sees `docs/designs/`,
`docs/ROADMAP.md`, `docs/PROGRESS.md`) and offers a structured migration:

- **Phase decomposition** — `docs/ROADMAP.md` phases become epics in
  `.work/active/epics/` with declared dependency chains
- **Active designs** — each `docs/designs/<name>.md` becomes a feature in
  `.work/active/features/` at `stage: implementing`, with the design content
  copied into the feature item's body
- **Completed designs** — by default synthesized into a retro-release at
  `.work/releases/v0/`. Opt out to archive directly.
- **Foundation docs preserved** — `docs/VISION.md`, `docs/SPEC.md`,
  `docs/ARCHITECTURE.md` stay where they are
- **Source files left alone** — `docs/designs/`, `docs/ROADMAP.md`,
  `docs/PROGRESS.md` stay in place as legacy history. Delete after verifying
  the migration via `MIGRATION_REPORT.md`.

The full migration matrix (with paths, ad-hoc, and greenfield variants) is in
`plugins/agile-workflow/docs/MIGRATION.md`.

## Skill catalog (reference)

Twenty-six skills across seven tiers. You'll only ever invoke a few
explicitly — the rest the agent picks for you.

### Bootstrap (you invoke)
- **ideate** — foundation-docs workshop
- **convert** — substrate bootstrap; idempotent via `--update`
- **epicize** — decompose foundation docs into epics with `depends_on` chains

### Capture & promotion (agent picks naturally)
- **park** — quick capture into `.work/backlog/`
- **scope** — promote to active; rolls foundation docs forward when large
- **fix** — single-stride bug repair

### Design family (agent picks; kind- and tag-routed)
- **epic-design** — decompose an epic at `stage: drafting` into child features
- **feature-design** — greenfield feature design (no specialized tag)
- **refactor-design** — for features tagged `[refactor]`
- **perf-design** — for features tagged `[perf]`

### Production (agent picks)
- **implement** — single-stride code from item body
- **implement-orchestrator** — fans Sonnet sub-agents over child stories
  respecting `depends_on`

### Review & delivery
- **review** *(agent picks)* — peer review at `stage: review`
- **release-deploy** *(you invoke)* — bind, gate, ship
- **autopilot** *(you invoke)* — autonomous queue runner
- **bold-refactor** *(you invoke)* — architectural reconception

### Gates (agent picks; produce items, not pass/fail; release-time only)
- **gate-security**, **gate-tests**, **gate-cruft**, **gate-docs**,
  **gate-patterns**

### Reference (carried from workflow)
- **principles** — code-design + substrate-execution principles
- **research**, **repo-eval**, **tool-evaluator**,
  **refactor-conventions-creator** — auto-loading or one-shot helpers

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
  when you have a queue of well-shaped items. When you want close
  collaboration on a hard design, just talk.
- **Items at review come back to you.** The agent's autonomous review can
  advance trivial items, but anything with judgment calls lands at
  `stage: review` for your eyes. Walk that queue regularly.
- **Restart Claude Code after install.** Hooks don't take effect mid-session.
  After `skilltap install nklisch/agile-workflow`, restart for the
  `SessionStart` and `PostToolUse` hooks to fire.
- **Don't pre-decompose.** Epicize at bootstrap; let features and stories
  emerge from `scope`, `epic-design`, and `feature-design` as work surfaces.
  The substrate rewards late-binding.
- **Hooks are inert without a substrate.** Both hooks (`SessionStart` queue
  snapshot, `PostToolUse` `updated:` auto-bump) check for
  `.work/CONVENTIONS.md` and exit silently in non-substrate repos. Safe to
  install globally.

## Where to read more

- `plugins/agile-workflow/docs/VISION.md` — what this is and why it exists (2-min read)
- `plugins/agile-workflow/docs/SPEC.md` — frontmatter contract, file layouts, hook contracts, work-view flag set
- `plugins/agile-workflow/docs/ARCHITECTURE.md` — substrate layout, item lifecycle, autopilot algorithm, gate orchestration, full skill catalog
- `plugins/agile-workflow/docs/PRINCIPLES.md` — code-design + substrate-execution principles, deeply explained
- `plugins/agile-workflow/docs/MIGRATION.md` — `convert`'s behavior across the four project shapes
