# Vision: agile-workflow

**agile-workflow** is a portable agent workflow plugin/package that ships a
markdown-based work-tracking substrate for AI-driven software projects. Work
lives as plain markdown items in a `.work/` directory inside the repo. Each item
is a single file with structured frontmatter — its body accumulates the brief,
the design, the implementation notes, and the review findings as work
progresses. Skills operate as verbs over those files, while each harness can add
native ergonomics around the same substrate. There are no parallel design docs,
no separate progress trackers, no tracking-board dependencies. The repo is the
system of record.

## Why this exists

AI-driven software projects accumulate document sprawl: design docs that
disagree with the code, progress files that go stale, roadmaps that bind
features to releases the project never ships. The agent re-explains itself
every session because it can't trust what it reads. The user re-feeds context
because the artifacts have drifted from reality.

The substrate pattern collapses this. The item file *is* the work. Stage
advances as work happens. Foundation docs roll forward — they describe the
system as it is now or as it is intended to become, never as it was. Git
carries history; the active truth is what's in the file. An agent picking up a
fresh session reads `.work/active/`, runs the prescribed grep primitives, and
knows what's in flight without being re-fed.

## Substrate philosophy

The plugin enforces three execution principles:

- **The item file is the work.** No parallel design docs. No separate
  progress trackers. The brief, the design, the implementation notes, the
  review findings — all accumulate in the item's body as stages advance.
  Reading the file IS reading the state of work.
- **Foundation docs roll forward.** `docs/VISION.md`, `docs/SPEC.md`,
  `docs/ARCHITECTURE.md` describe current truth or intended future state. They
  are selective rather than exhaustive: omission is allowed, and a future-state
  claim is valid before implementation exists. When an assertion becomes false,
  stale, or contradictory, it updates to match the new truth. No retained
  descriptions of superseded behavior or
  migration commentary. Git is the audit trail.
- **Late-bind everything.** No upfront roadmap. No pre-populated stages.
  No pre-tagged release bindings. Items advance stages when work actually
  completes. Releases bind items only when the user cuts a version.

The plugin's `principles` skill loads these alongside code-design principles
for clear boundaries, proportional rigor, code economy, useful tests, and
continuous simplification. The two paradigms—substrate execution and code
design—operate together during agile-workflow work.

## Who this is for

Project owners running AI-driven development who want:

- A work-tracking substrate that lives with the repo, not behind a service
- Cross-session continuity without manually re-feeding context to the agent
- A pattern that scales from solo single-project to long-running
  maintenance loops
- Tooling-portable substrate (git, plain markdown, a small compiled binary
  with a bash fallback — no MCP, no auth, no daemon)

This is the supported workflow pattern for new projects in this repo. The older
`workflow` plugin still ships only so existing installs do not break; migrate old
projects with `/agile-workflow:convert`.

## What success looks like now

agile-workflow is complete enough to operate as the supported workflow engine:

- 28 skills covering ideation, conversion, scoping, epic/feature design,
  refactor/perf/e2e design, implementation orchestration, review, bug fixing,
  board launch, bug scanning, release gates, release-deploy, and goal-backed
  autopilot.
- A compiled `work-view` CLI (with a pure-bash fallback on unsupported
  platforms) for fast queries by stage, tag, kind, parent, release binding,
  gate origin, and dependency state.
- An interactive `work-view board` surface over the same substrate feed, with
  kanban, dependency, table, detail, filter, and browsing views for humans.
- Shared Claude/Codex/Pi substrate context injection that force-loads rules at
  session/compaction boundaries, surfaces prompt-time principles capsules only
  for actionable workflow prompts, auto-bumps `updated:` where the harness
  supports it, and reports cheap substrate validation issues.
- Three-channel plugin distribution metadata: Claude Code marketplace, OpenAI
  Codex marketplace, and Pi packages share the same `skills/` source while
  each channel carries native metadata and ergonomics.
- Operational skills finish their semantic promise: verified implementation
  continues through a risk-appropriate review lane to `done` by default, while
  an explicit `stop-at-review` request preserves a deliberate handoff boundary.
  Review remains a real, independently evidenced state rather than an inline
  self-approval ceremony.
- Implementation orchestration starts from one worker per feature, may bundle
  related features when shared context reduces handoffs, and splits unusually
  large features only by coherent ownership. Child stories are checkpoints, not
  default worker units. Reviews run independently of the next dependency layer,
  while per-item evidence, verification, and commits remain distinct.
- Questions and advisory review are consequence-driven: routine reversible
  choices use recorded judgment; strategic or difficult-to-reverse choices get
  an explicit checkpoint; independent review scales through the project's
  high-level review weight while preserving fresh-context deep review. Child
  stories skip review, standalone stories use a bounded non-cross-model lane,
  features receive integrated review, and epics receive the deepest aggregate
  review because larger scope reveals integration and capability gaps. The
  default `standard` weight is deliberately decisive: one pass, receiver
  adjudication, material-blocker fixes, verification, then done without
  re-review. Only `thorough` and `maximum` repeat passes, and smaller findings
  are parked or noted rather than holding convergence open. Reviewer findings
  remain proposals: the receiving orchestrator weighs actual repository risk,
  blocks only on material current-cycle concerns, and parks valid lower-priority
  work rather than forcing every suggestion into implementation.
- Real releases move through scope → design → implement → review →
  release-deploy on the substrate; gates focus on bound work while following
  relevant evidence into adjacent or system-wide code, distinguish release
  findings from ambient backlog discoveries, and produce durable items. The
  release ships only after every bound item is terminal. Foundation docs roll
  forward, release binding stays late, and terminal retention keeps git as the
  audit trail without leaking obsolete authority.

The pattern proves itself when a fresh session in a substrate-bootstrapped repo
picks up active work without re-feed; when direct production work and autopilot
both finish decisively while respecting dependency, test-integrity, review, and
parent-roll-up invariants; and when foundation docs five features later still
make true, noncontradictory current-or-future claims without legacy comments.

## Relationship to workflow

`workflow` is deprecated and retained only for compatibility with existing
installs. New work should use `agile-workflow`; existing `workflow` projects
migrate via `/agile-workflow:convert`. Supported agile-workflow channels are
Claude Code, OpenAI Codex, and Pi; each channel adds native ergonomics around
shared skill content rather than forking the workflow model.

For depth on the principles, see [PRINCIPLES.md](./PRINCIPLES.md).
For the technical contracts, see [SPEC.md](./SPEC.md).
For the substrate's internal design, see [ARCHITECTURE.md](./ARCHITECTURE.md).
For the on-ramp from existing project shapes, see [MIGRATION.md](./MIGRATION.md).
