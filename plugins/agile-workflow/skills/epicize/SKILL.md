---
name: epicize
description: >
  Decompose foundation docs into multiple epics seeded in .work/active/epics/ with
  declared dependencies. Reads VISION.md, SPEC.md, ARCHITECTURE.md, identifies
  capability arcs, proposes an epic decomposition with depends_on chains, and writes
  the epic files at stage:drafting after user confirmation. Use after
  /agile-workflow:convert on a greenfield project, or any time foundation docs need
  epic decomposition. User-invocable only — interactive workshop.
user-invocable: true
disable-model-invocation: true
allowed-tools: Read, Write, Glob, Grep, Bash, AskUserQuestion
model: opus
---

# Epicize

You read the project's foundation docs and produce **multiple epics** at
`.work/active/epics/`, each at `stage: drafting`, with declared `depends_on` chains
where one epic's output feeds another.

Epics are containment shapes — multi-feature architectural arcs. Each epic eventually
gets designed (via the design family on its child features) and implemented. Epicize
just establishes the top-level decomposition.

## Prerequisites

- Substrate bootstrapped (`.work/CONVENTIONS.md` exists). If not, halt and tell the
  user to run `/agile-workflow:convert` first.
- Foundation docs exist in `docs/`. At minimum `docs/VISION.md` AND
  `docs/ARCHITECTURE.md` (or equivalents). If missing, halt and tell the user to run
  `/agile-workflow:ideate` first.

## Think like an agent

Before decomposing anything, think about what an agent (in autopilot or manual
mode) would need to execute each epic:

- **What can be built in one design + implement cycle?** A child feature under
  the epic should fit comfortably in one `/agile-workflow:feature-design` →
  `/agile-workflow:implement` pass — 5-15 implementation units. If a single
  child feature would need more, the epic is too coarse; split.
- **What can be parallelized?** If two children of an epic don't share types or
  files, declare them with no `depends_on` between them. The autopilot fans
  them out as parallel agents.
- **What's needed before starting?** Dependencies aren't just code — research
  needs (unfamiliar libraries, APIs you don't know cold), seed data,
  configuration. If an epic uses a library no one has touched yet, plan for a
  research pass on the first child.
- **How do you know an epic is done?** Not "it looks right" — every child
  feature reaches `stage: done`. Stage transitions are the agent-readable
  completion signal.
- **What design artifact feeds implementation?** Each child feature's body
  accumulates the design when `/agile-workflow:feature-design` (or
  refactor-design / perf-design) runs on it. The epic's body is a brief, not a
  design — `/agile-workflow:epic-design` later writes the realized
  decomposition into it.

## Anti-patterns

- **Don't produce a phase plan.** Epics are containment shapes, not temporal
  slots. No "Phase 1: Auth, Phase 2: Profiles, Phase 3: Admin." Use the
  dependency graph; let the autopilot pick what's ready.
- **Don't split by layer.** Epic-DB / Epic-API / Epic-UI is anti-pattern unless
  the layers are genuinely independent products. Split by capability instead:
  "core search works" / "results link to the right app" / "users can see it in
  a browser."
- **Don't pad with refactor or test epics.** Refactoring happens incrementally
  via `/agile-workflow:refactor-design` on tagged features. Testing happens
  through gate-tests at release time and per-feature acceptance criteria. Don't
  manufacture epics for either.
- **Don't estimate.** No "this epic is bigger than that one" sizing labels. The
  agent doesn't benefit from difficulty ratings; the work either fits in 5-15
  child-feature units or it should be split further.
- **Don't pre-bind to releases.** Epics get `release_binding: null`. Binding
  happens only when `/agile-workflow:release-deploy` runs.
- **Don't include deployment as an epic** unless deployment infrastructure is
  the core value of the project.

## Workflow

### Phase 1: Read foundation

Read every foundation doc the project has:
- `docs/VISION.md`
- `docs/SPEC.md`
- `docs/ARCHITECTURE.md`
- `docs/PRINCIPLES.md` (if exists)
- Domain-specific docs (UX, CONTRACT, GAMEPLAY, DATA-SPEC, etc.)

Build a mental model of the system as foundation describes it.

### Phase 2: Identify capability arcs

Look for natural decomposition seams. Signals:
- ARCHITECTURE.md describes distinct components or boundaries — each is a candidate
  epic
- VISION.md identifies multiple capability areas — each is a candidate epic
- SPEC.md groups requirements by domain — each group is a candidate epic
- Sequencing implied by the docs (foundation systems before consumers, contracts
  before clients, etc.) — these become `depends_on` chains

Aim for 3-8 epics for a typical project. Fewer than 3 means you should consider whether
this project even needs epic-level decomposition (maybe just go straight to features).
More than 8 means you're slicing too thin — collapse some.

### Phase 3: Propose dependencies

For each epic candidate, identify what must be done first:
- "Auth epic must be at done before User-Profile epic can start" → User-Profile
  `depends_on: [epic-auth]`
- Independent epics (no shared types, no cross-cutting concerns) have no dependencies
  and can be worked in parallel

### Phase 4: Confirm with user

Present the proposed decomposition via AskUserQuestion or conversational summary:

```
Proposed epic decomposition (4 epics):

1. epic-substrate-foundation
   depends_on: []
   covers: foundation work that everything else builds on

2. epic-auth
   depends_on: [epic-substrate-foundation]
   covers: authentication and session management

3. epic-user-profile
   depends_on: [epic-auth]
   covers: profile CRUD, avatar handling, settings

4. epic-admin-dashboard
   depends_on: [epic-auth]
   covers: admin-only views, user management
```

Iterate with the user — they may collapse, split, rename, or reorder epics. Confirm
each rename and dependency edge before writing.

### Phase 5: Write epic files

For each confirmed epic, write `.work/active/epics/<id>.md`:

```yaml
---
id: epic-<slug>
kind: epic
stage: drafting
tags: [<tag>, ...]   # if a clear category from foundation docs
parent: null
depends_on: [<epic-id>, ...]
release_binding: null
gate_origin: null
created: YYYY-MM-DD
updated: YYYY-MM-DD
---

# <Epic Name>

## Brief
<two to four paragraphs: what this epic delivers, what capability area it covers,
why it exists, what it does NOT cover>

## Foundation references
- `docs/VISION.md` — relevant section(s)
- `docs/ARCHITECTURE.md` — relevant component(s)
- (other foundation docs as relevant)

## Anticipated child features
<NOT a commitment — a sketch of where features will likely live under this epic.
The actual feature decomposition happens at design time, not now. Keep this short
and provisional.>

<!-- The design pass on each child feature will fill in real specifics. -->
```

### Phase 6: Cycle check

Run `.work/bin/work-view --blocking <id> --paths` for each epic against its
`depends_on`. If any cycle exists, surface it and ask the user to break it before
committing.

### Phase 7: Commit

```bash
git add .work/active/epics/
git commit -m "epicize: <N> epics seeded from foundation docs"
```

## Output

In conversation:
- **Seeded**: list of `<id>` per epic with `depends_on` per epic
- **Suggested next step**: pick one epic to start with —
  `/agile-workflow:autopilot <epic-id>` for autonomous execution, or scope a feature
  under one of the epics manually for guided exploration

## Guardrails

- Epics produced here are at `stage: drafting`. Their bodies are briefs and
  references — NOT designs. Design happens at the feature level under each epic, not
  at the epic level.
- Anticipated child features are provisional, not commitments. Don't pre-create child
  feature files at epicize time — that's `/agile-workflow:scope` (manual) or
  `/agile-workflow:epic-design` (autopilot-driven) when the epic is ready to be
  decomposed into real feature files.
- Don't pre-bind epics to releases. `release_binding` stays `null` until
  `/agile-workflow:release-deploy` runs.
- Don't infer `depends_on` purely from docs without confirming with the user.
  Doc ordering doesn't always mean execution dependency.
- If the foundation docs don't have enough content to identify capability arcs,
  halt and tell the user to run `/agile-workflow:ideate` to flesh out
  ARCHITECTURE.md before epicizing.
