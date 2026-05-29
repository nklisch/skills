---
name: epicize
description: >
  Decompose architecture + research briefs into epic items at .work/active/epics/.
  Adaptive grounding: heavy when research briefs exist (knowledge-index +
  the project's .research/ corpus), light foundation-docs-only
  otherwise. Defers per-feature acceptance criteria and implementation detail to
  /epic-design and /feature-design downstream. Emits epic items with depends_on chains
  for autopilot draining. Tags epics with [needs-brief] when downstream design requires
  a research brief.
user-invocable: true
allowed-tools: Read, Write, Glob, Grep, Bash, AskUserQuestion, Task
model: opus
---

# Epicize

You read the project's foundation docs + research corpus and produce **multiple epics**
at `.work/active/epics/`, each at `stage: drafting`, with declared `depends_on` chains
where one epic's output feeds another.

Epics are containment shapes — multi-feature architectural arcs. Each epic later gets
designed (`/epic-design` decomposes it into child features; `/feature-design` writes
detailed design content per feature). This skill establishes the top-level decomposition
only.

**This is the merged version** of Nathan's `agile-workflow:epicize` (foundation-doc-grounded,
substrate-emitting) and Andrew's `roadmap` (research-grounded, knowledge-index-aware). It
behaves as a strict superset: with research present, it does heavy grounding; without
research, it falls back to Nathan's foundation-doc-only flow.

**You follow the build process at `${CLAUDE_PLUGIN_ROOT}/docs/build-process.md`.** Read it before starting.

**Read `${CLAUDE_PLUGIN_ROOT}/docs/first-principles.md` for consideration.** Apply its thinking moves — especially Challenge and Synthesize — to question epic boundary assumptions and find high-leverage sequencing.

## Prerequisites

- **Substrate bootstrapped.** `.work/CONVENTIONS.md` must exist. If not, halt and tell
  the user to run `/agile-workflow:convert` first.
- **Foundation docs exist.** At minimum the project must have a vision/north-star doc
  + an architecture doc (per `.work/CONVENTIONS.md` `foundation_docs:` declaration —
  default Nathan layout is `docs/VISION.md` + `docs/ARCHITECTURE.md`; ds-engine layout
  is `docs/architecture/north-star-*.md` + `docs/architecture/architecture.md`). If
  missing, halt and tell the user to run `/research-pipeline:ideate` first.

## Model Assignment

Per [model-selection-pattern.md](${CLAUDE_PLUGIN_ROOT}/docs/model-selection-pattern.md):

- **Epicize architect (this skill's main loop)** — Orchestration. Opus high effort. Runs in parent context.

Epic decomposition decisions cascade into every downstream design and implement phase — the orchestrator warrants Opus. This skill does not spawn sub-agents; reasoning happens in the parent context.

## Think like an agent

Before decomposing anything, think about what an agent (in autopilot or manual mode)
would need to execute each epic:

- **What can be built in one design + implement cycle?** A child feature under the
  epic should fit comfortably in one `/feature-design` → `/agile-workflow:implement`
  pass — 5-15 implementation units. If a single child feature would need more, the
  epic is too coarse; split.
- **What can be parallelized?** If two children of an epic don't share types or files,
  declare them with no `depends_on` between them. Autopilot fans them out as parallel
  agents.
- **What's needed before starting?** Dependencies aren't just code — research needs
  (unfamiliar libraries, APIs you don't know cold), seed data, configuration. If an
  epic uses a library no one has touched yet, plan for a research pass on the first
  child via `[needs-brief]` tag.
- **How do you know an epic is done?** Not "it looks right" — every child feature
  reaches `stage: done`. Stage transitions are the agent-readable completion signal.
- **What design artifact feeds implementation?** Each child feature's body accumulates
  the design when `/feature-design` runs on it. The epic's body is a brief, not a
  design — `/epic-design` later writes the realized decomposition into it.

## Anti-patterns

- **Don't produce a phase plan.** Epics are containment shapes, not temporal slots.
  No "Phase 1: Auth, Phase 2: Profiles, Phase 3: Admin." Use the dependency graph; let
  autopilot pick what's ready.
- **Don't split by layer.** Epic-DB / Epic-API / Epic-UI is anti-pattern unless layers
  are genuinely independent products. Split by capability: "core search works" /
  "results link to the right app" / "users can see it in a browser."
- **Don't pad with refactor or test epics.** Refactoring happens incrementally via
  `/agile-workflow:refactor-design` on tagged features. Testing happens through
  `gate-tests` at release time and per-feature acceptance criteria. Don't manufacture
  epics for either.
- **Don't estimate.** No "this epic is bigger than that one" sizing labels. The agent
  doesn't benefit from difficulty ratings; the work either fits in 5-15 child-feature
  units or it should be split further.
- **Don't pre-bind to releases.** Epics get `release_binding: null`. Binding happens
  only when `/agile-workflow:release-deploy` runs.
- **Don't include deployment as an epic** unless deployment infrastructure is the core
  value of the project.
- **Don't skip the knowledge-index check.** If research exists in `.research/` and the
  knowledge-index references it, you MUST surface relevant briefs in the epic bodies.
  Designs based on missed research context cause rewrites.

## Workflow

### Phase 0: Load knowledge index (OURS — adaptive grounding entry point)

Read `docs/knowledge-index-nav.yaml` if it exists (or run `/knowledge-index` if it
doesn't). Identify:

- Every architecture doc, brief, and research synthesis relevant to this project
- Briefs flagged with `nav_priority: high` in frontmatter (load-bearing for design)
- The corpus shape: heavy research-corpus → trigger heavy grounding; sparse → trigger
  light foundation-doc-only mode

If no `docs/knowledge-index-nav.yaml` AND no `.research/` directory AND no
`docs/briefs/`: enter **light mode** (Nathan's foundation-doc-only flow per Phase 1
below; skip Phase 0.5).

### Phase 0.5: Load research corpus (OURS — heavy-mode only)

If research exists:

- Read every brief whose `blocks_phase` frontmatter is null (uncommitted) or matches
  potential epic scope
- Read `.research/programs/*/super-parent.md` (program syntheses) — these often signal
  natural epic boundaries
- Read `.research/briefs/*/parent.md` (deep-research syntheses)
- Note any briefs already committed to phases (`blocks_phase: <id>`); these inform
  but don't drive epic decomposition

### Phase 1: Read foundation docs

Read every foundation doc declared in `.work/CONVENTIONS.md` `foundation_docs:` list.
For Nathan's default layout:
- `docs/VISION.md`
- `docs/SPEC.md`
- `docs/ARCHITECTURE.md`
- `docs/PRINCIPLES.md` (if exists)

For ds-engine-style nested layouts:
- `docs/architecture/north-star-*.md`
- `docs/architecture/architecture.md`
- `docs/architecture/dag-design.md`
- Other declared foundation docs

Build a mental model of the system as foundation describes it. Cross-reference with
research findings from Phase 0.5 — flag any architectural assumptions in foundation
docs that research contradicts (these are surfacing-for-user-decision later).

### Phase 2: Identify capability arcs

Look for natural decomposition seams. Signals:

- **Architecture** describes distinct components or boundaries — each is a candidate
  epic
- **Vision** identifies multiple capability areas — each is a candidate epic
- **Spec / north-star** groups requirements by domain — each group is a candidate epic
- **Research syntheses** identify integration boundaries (e.g., "X domain requires its
  own dispatcher") — these become epics
- **Sequencing implied by foundation docs** (foundation systems before consumers,
  contracts before clients) — these become `depends_on` chains

Aim for **3-8 epics** for a typical project. Fewer than 3 means you should consider
whether this project even needs epic-level decomposition (maybe just go straight to
features). More than 8 means slicing too thin — collapse some.

### Phase 3: Identify research-blocked epics (OURS — tag with [needs-brief])

For each epic candidate, ask: does designing/implementing this require a research
brief that doesn't yet exist?

- If a child feature would use a library/API/protocol that has NO research brief in
  the corpus → tag the epic `[needs-brief]`
- If a child feature would touch a domain (e.g. PII handling, scheduling, distributed
  state) that has thin research → tag `[needs-brief]`
- If the epic is well-covered by existing briefs → no tag

Epics tagged `[needs-brief]` will signal to downstream `/epic-design` and
`/feature-design` that a `/brief` pass is required before design work proceeds.

### Phase 4: Propose dependencies

For each epic candidate, identify what must be done first:

- "Auth epic must be at `done` before User-Profile epic can start" → User-Profile
  `depends_on: [epic-auth]`
- Independent epics (no shared types, no cross-cutting concerns) have no dependencies
  and can be worked in parallel
- Research-blocked epics depend on no other epic structurally, but their
  `[needs-brief]` tag signals that `/brief` runs first on the human-driven side

### Phase 5: Confirm with user

Present the proposed decomposition via `AskUserQuestion` or conversational summary:

```
Proposed epic decomposition (4 epics):

1. epic-substrate-foundation
   depends_on: []
   tags: []
   covers: foundation work that everything else builds on
   research grounding: docs/architecture/architecture.md §1

2. epic-auth
   depends_on: [epic-substrate-foundation]
   tags: [auth]
   covers: authentication and session management
   research grounding: .research/briefs/auth-providers/parent.md

3. epic-pii-handling
   depends_on: [epic-substrate-foundation]
   tags: [pii, needs-brief]   ← research thin; brief required
   covers: PII scrubbing across all data paths

4. epic-admin-dashboard
   depends_on: [epic-auth]
   tags: [admin]
   covers: admin-only views, user management
```

Iterate with the user — they may collapse, split, rename, or reorder epics. Confirm
each rename and dependency edge before writing. Surface any contradictions between
foundation docs and research that you flagged in Phase 1.

### Phase 6: Write epic files

For each confirmed epic, write `.work/active/epics/<id>.md`:

```yaml
---
id: epic-<slug>
kind: epic
stage: drafting
tags: [<tag>, ...]   # e.g. [needs-brief], or domain tag from foundation docs
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

## Research briefs

<links to .research/briefs/, .research/programs/, or docs/briefs/ that ground this
epic. Include 1-line summary per brief. If [needs-brief] tag is set, note here what
research is missing and what topic the future /brief invocation should cover.>

## Foundation references

- `docs/architecture/north-star-<project>.md` — relevant section(s)
- `docs/architecture/architecture.md` — relevant component(s)
- (other foundation docs as relevant)

## Anticipated child features

<NOT a commitment — a sketch of where features will likely live under this epic.
The actual feature decomposition happens at design time via /epic-design, not now.
Keep this short and provisional.>

<!-- The /epic-design pass will fill in real child feature specifics into a
## Decomposition section below this one. -->
```

Use `YYYY-MM-DD` from local time (matches Nathan's `post-tool-use-bump.sh` hook
convention; not UTC).

### Phase 7: Cycle check

Run `.work/bin/work-view --blocking <id> --paths` for each epic against its
`depends_on`. If any cycle exists, surface it and ask the user to break it before
committing.

### Phase 8: Commit

```bash
git add .work/active/epics/
git commit -m "epicize: <N> epics seeded from foundation docs"
```

## Output

In conversation:

- **Seeded**: list of `<id>` per epic with `depends_on` and tags
- **Research-blocked epics**: epics tagged `[needs-brief]` and what brief topic each needs
- **Suggested next steps**:
  - If any `[needs-brief]` epics: invoke `/brief <topic>` for each
  - Otherwise: pick one epic to start with — `/epic-design <epic-id>` for decomposition,
    or start an autopilot goal for `<epic-id>` for autonomous execution

## Guardrails

- Epics produced here are at `stage: drafting`. Their bodies are briefs and references
  — NOT designs. Design happens at the feature level via `/feature-design` later, not
  at the epic level.
- Anticipated child features are provisional, not commitments. Don't pre-create child
  feature files at epicize time — that's `/agile-workflow:scope` (manual) or
  `/epic-design` when the epic is ready to be decomposed into real feature files.
- Don't pre-bind epics to releases. `release_binding` stays `null` until
  `/agile-workflow:release-deploy` runs.
- Don't infer `depends_on` purely from docs without confirming with the user. Doc
  ordering doesn't always mean execution dependency.
- If the foundation docs don't have enough content to identify capability arcs,
  halt and tell the user to run `/research-pipeline:ideate` to flesh out the
  architecture before epicizing.
- If `[needs-brief]` epics have no candidate brief topic, ask the user — don't guess.
  An over-broad brief request is more expensive than asking.
