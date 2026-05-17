---
name: scope
description: >
  ALWAYS invoke this skill when the user asks to scope, promote, formalize, cluster,
  or track new work — do not start drafting items inline. Promotes ideas from
  .work/backlog/ or fresh user requests into the active tier as epics, features, or
  stories with declared dependencies. Use when scoping new work, formalizing a new
  direction, clustering backlog, or promoting an idea into tracking. Triggers on
  "scope this", "scope it", "let's scope", "scope <id>", "scope the backlog",
  "promote this", "let's track this", "this should be a feature/epic/story", or any
  request to formalize a new direction. For vision/spec/architecture changes, also
  rolls foundation docs forward in the same stride.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, AskUserQuestion
---

# Scope

You promote an idea to active substrate work. You decide the right kind (epic /
feature / story), declare dependencies, and — if scope is large enough to change the
project's standing context — roll foundation docs forward as part of the same operation.

## When to invoke

Trigger phrases:
- "scope this", "promote this to active"
- "let's track this as a feature"
- "this needs to be a feature/epic/story"
- A new direction surfaces and the user wants to formalize it
- "scope the backlog", "scope all of this", "cluster the backlog",
  "promote the backlog", or `scope <NL filter>` like "scope the auth stuff"
  → batch / clustering mode (see Invocation modes below)

If the user wants to fix a bug, use `/agile-workflow:fix`. If they want to capture
an idea without acting on it, use `/agile-workflow:park`.

## Invocation modes

| Invocation | Behavior |
|---|---|
| `scope <id>` | Single-idea mode — promote one backlog item at `.work/backlog/<id>.md`. |
| `scope <free-form idea>` | Single-idea mode — distill the user's fresh idea, then promote. |
| `scope` (no arg) | **Default → equivalent to `--all`**: batch / clustering mode over all of `.work/backlog/`. |
| `scope --all` | Explicit batch / clustering mode over all of `.work/backlog/`. |
| `scope <NL filter>` (e.g. `scope the auth-related stuff`, `scope everything tagged perf`) | Batch / clustering mode over the filtered subset of `.work/backlog/`. The filter is interpreted by the agent as a directive against the backlog, not parsed as a flag. |

**Disambiguation.** An arg is treated as a backlog `<id>` only if
`.work/backlog/<arg>.md` exists. Otherwise: if it reads like a one-paragraph
fresh idea, treat as single-idea mode; if it reads like a filter directive over
the backlog (mentions tags, areas, themes, or "everything that..."), treat as
batch-filter mode. When genuinely ambiguous, prefer batch-filter mode and
confirm via `AskUserQuestion` before writing — a bigger read costs nothing, but
a fresh idea misread as a filter wastes user time.

## Workflow — batch / clustering mode

Use this path for `scope`, `scope --all`, or `scope <NL filter>`. Goal: read the
targeted backlog, find natural clusters, propose a structure (epics / features /
stories), confirm with the user once, then promote.

### Phase B1: Inventory the backlog

Read every targeted backlog file. Targeting:
- `scope` / `scope --all` → all of `.work/backlog/*.md`
- `scope <NL filter>` → interpret the filter against each backlog file's body
  and tags; keep matches. Log the interpretation for the run summary.

For each item, capture id, brief, tags, and any inline hints (referenced files,
areas, related ids).

If the targeted set is empty, halt with a clear message — suggest a narrower
filter or `/agile-workflow:park` for fresh ideas.

If the targeted set is a single item, fall through to single-idea mode with
that item.

### Phase B2: Light grounding

Read `docs/VISION.md`, `docs/SPEC.md`, `docs/ARCHITECTURE.md`, `.work/CONVENTIONS.md`,
and `CLAUDE.md`. One pass, skim — you're orienting, not absorbing every detail.
You'll re-read selectively for large clusters in Phase B5.

### Phase B3: Map code areas (one Explore agent)

Spawn **one** `Agent` sub-agent with `subagent_type: Explore` (medium breadth).
Give it:
- The list of targeted backlog ideas (id + brief, one per line)
- A one-paragraph summary of the foundation docs from Phase B2
- The question: "Which areas of the codebase do these ideas touch, and what
  natural seams (modules, packages, bounded contexts) group them?"

Expect back an area-map keyed by code seam, with backlog ids attached to each
seam plus a one-line rationale. Don't recurse — one pass.

If the agent's confidence is low for an idea (no clear code touchpoint), note
it and fall back to text-only clustering for that idea in Phase B4.

### Phase B4: Cluster

Using the area-map plus the backlog text, group ideas into clusters. Each
proposed cluster gets a kind, a parent decision, and a one-line rationale.

Sizing heuristics (same as single-idea-mode Phase 2, applied per cluster):

| Cluster shape | Proposed kind |
|---|---|
| 1 item, no architectural shift | story (standalone) |
| 2-5 cohesive items in one area, deserves a design pass, no foundation-doc impact | feature; backlog items become child stories or design inputs |
| Multi-feature scope, OR shifts vision / spec / architecture / audience, OR a clear capability arc that wants `epic-design` decomposition | epic |

Bias rules:
- **Lean smaller** — prefer multiple features over one giant epic. But forming
  an epic as a *natural grouping* is fine even without a foundation-doc shift:
  if a set of backlog items clearly belongs under one capability arc, hand it
  to `/agile-workflow:epic-design` rather than pre-flattening it into features
  here.
- **Don't force-cluster.** Ideas that don't naturally belong with anything else
  are leftovers; handle them in Phase B6.

### Phase B5: Strategic decisions (per large cluster)

For each cluster sized **large** (epic with foundation-doc impact), run the
single-idea-mode Phase 1.7 logic — derive 2-5 strategic-level ambiguities for
that cluster (vision / spec / architecture / audience layer) and queue them
for the Phase B7 confirmation gate.

For small / medium clusters and for "natural grouping" epics with no
foundation-doc impact, skip — strategic ambiguities fall to `epic-design` or
`feature-design` later.

If more than 3 clusters are sized large, defer strategic decisions to the
design family entirely — don't try to consolidate them into one round.

### Phase B6: Prepare leftovers question

Identify backlog items that didn't fit any cluster. Queue a multi-select
question for the Phase B7 gate, offering per leftover:
- promote as standalone story
- promote as standalone feature
- leave in `.work/backlog/` (default)

### Phase B7: Confirm with the user (single round-trip)

Make **one** `AskUserQuestion` call covering all of the below (the tool accepts
1-4 questions per call):

1. **Cluster structure** — present each cluster (ids included, proposed kind,
   proposed parent, one-line rationale) and accept adjustments. Common NL
   feedback: "merge clusters 2 and 3", "split that cluster", "make X an epic
   instead", "move Y under Z". The "Other" option handles free-form replies.
2. **Strategic decisions** — one question per large cluster from Phase B5
   (skip if more than 3 large clusters per the Phase B5 rule).
3. **Leftovers disposition** — the multi-select question prepared in Phase B6.

Apply the adjustments and proceed. **One gate is enough** — do not loop on a
second confirmation round.

### Phase B8: Promote each confirmed cluster

For each cluster, run the single-idea-mode Phases 3-6 inline:

1. **Declare dependencies** — within-cluster (child stories under a feature)
   and cross-cluster (one feature depends on another's output). Use
   `work-view --blocking` for cycle detection.
2. **Foundation-doc roll-forward** (large clusters only) — full Phase 4 of
   single-idea mode, scoped to that cluster's impact.
3. **Write item files** — the parent (epic or feature) plus any child files.
   Use `git mv` to move backlog files into the new structure where they map
   1:1; reference the backlog idea in the parent's brief and `git rm` the
   backlog file where it was absorbed without a direct child.
4. **Commit per cluster** — `scope: <cluster-id> (<kind>, <size>)` with a
   foundation-doc roll-forward note where applicable.

Promote leftovers per the Phase B7 decision (one commit per promoted leftover,
same message format).

### Phase B9: Output

In conversation:
- **Filter interpretation** (NL-filter mode only): one-line description of how
  the filter was applied
- **Clusters promoted**: for each, `<id> (<kind>, <size>)` with member backlog ids
- **Leftovers**: list with disposition (promoted as standalone story/feature, or
  left in backlog)
- **Foundation docs rolled forward**: list of files touched (or "none")
- **Next**: design family picks up drafting features/epics
  (`/agile-workflow:feature-design`, `epic-design`, `refactor-design`, or
  `perf-design` based on kind and tags); implementing stories are ready for
  `/agile-workflow:autopilot` or `/agile-workflow:implement-orchestrator`.

## Workflow — single-idea mode

Use this path for `scope <id>` and `scope <free-form idea>`. The phases below
also serve as the per-cluster engine for batch mode Phase B8.

### Phase 1: Source the idea

The input is one of:
- A backlog item: `.work/backlog/<id>.md` exists. Read its body.
- A fresh request: the user is describing the idea directly. Distill it to a clear
  one-paragraph statement.

### Phase 1.5: Explore the idea (large-scope only)

For small or medium scope, skip this phase — go to Phase 1.7.

For large scope (something that may change vision/spec/architecture), have a
short freeform conversation before sizing. Cover:

- **What** — what does this add? What's the user-facing behavior or new
  capability?
- **Why** — what problem does it solve? What's the motivation?
- **Where** — where does it fit in the existing architecture? What does it
  touch?
- **Scale** — focused addition or significant new direction?
- **Dependencies** — external APIs, libraries, or internal features required?
- **Constraints** — performance, compatibility, security considerations?

Push for specificity. "Handle errors well" becomes "invalid input returns a 400
with a structured error body." When you can articulate the addition clearly,
summarize and ask: "Did I get this right?"

Then proceed to Phase 1.7.

### Phase 1.7: Surface strategic-level design ambiguities

Before sizing or writing the item, derive specific, concrete strategic
questions about *this* idea — directional choices at the vision / spec /
architecture / audience layer. These are the calls that, if locked in now,
will set the frame for the whole epic and any foundation-doc roll-forward.
The questions must come from the actual idea; examples of the *shape* only:

- "Is this aimed at our existing users or a new audience segment?"
- "Should this live as a new bounded context, or extend the existing
  domain model?"
- "Is real-time sync a v1 requirement, or is eventual-consistency
  acceptable?"
- "Do we expose this externally (public API surface) or keep it
  internal-only for now?"
- "Does this displace an existing capability, or sit alongside it?"

These sit a layer *above* `epic-design` Phase 4.7 and `feature-design`
Phase 4.5 — those resolve epic- and feature-internal direction. Phase 1.7
resolves the framing that determines what the epic even *is*. Skip anything
the foundation docs or the user's prompt already pin. Skip anything that is
safely an epic-design or feature-design call (decomposition, boundaries,
interfaces).

Aim for 2-5 questions. Zero is fine if the user's brief and foundation docs
already pin every strategic choice. For small (story) and medium (feature)
scope, the bar is higher — only ask if a strategic ambiguity genuinely
affects framing; otherwise skip directly to Phase 2.

Use `AskUserQuestion` to ask. Capture answers in the item body under a
`## Strategic decisions` section so the downstream design family inherits
the locked-in direction:

```markdown
## Strategic decisions
- **<question>**: <choice> — <one-line rationale>
```

For large scope, the answers here directly inform the foundation-doc
roll-forward in Phase 4.

### Phase 1.8: UI surface alignment (runs when ux-ui-design is installed)

Per the tier rule in `ux-ui-principles` (mock at the highest tier where it
can land), scope-tier locks the design system and any clear cross-feature
journey before the item is written.

- **Large scope + UI (epic-shaped)** →
  1. If `.mockups/design-system/tokens.css` does NOT exist, invoke
     `/ux-ui-design:palette` during the Phase 4 roll-forward.
  2. If the idea spans a multi-screen journey that's already clear (signup,
     onboarding, checkout, recovery), invoke `/ux-ui-design:flows
     <flow-name>`. Reference the path under `## Strategic decisions` so
     `epic-design` Phase 4.6 inherits it.

  Screen-level mocks belong to `epic-design` once the decomposition exists.

- **Medium scope (feature) + UI surface that's net-new or novel** → tag the
  feature `[ui]` and note the surface in the body. Mocking happens at
  whichever tier picks it up next — `epic-design` if there's an epic parent,
  `feature-design` otherwise.

- **Small scope or no UI** → skip.

Skip this phase if `ux-ui-design` is not installed.

Then proceed to Phase 2.

### Phase 2: Size the scope

Three sizes determine what gets created and whether foundation docs roll forward.

| Size | Signals | Outputs |
|---|---|---|
| **Small (story)** | Single-session work, no architectural change, fits in one feature's scope | One story file at `.work/active/stories/<id>.md`, `stage: implementing` (often skips drafting) |
| **Medium (feature)** | Spans multiple files, deserves a design pass, may have child stories, no foundation-doc impact | One feature file at `.work/active/features/<id>.md`, `stage: drafting` |
| **Large (epic + foundation roll)** | Changes the project's vision, spec, architecture, or audience; spans multiple features; introduces a new capability area | Epic at `.work/active/epics/<id>.md` plus updates to `docs/VISION.md`, `docs/SPEC.md`, and/or `docs/ARCHITECTURE.md` per the rolling-foundation principle |

**Size check** — ask yourself:
- Does this contradict or extend a current foundation-doc assertion? → at least medium, possibly large
- Will it introduce a new contract, new boundary, or new architectural component? → large
- Is it one cohesive change in one area? → small or medium

If unclear, lean smaller — easier to upgrade a story to a feature than to unwind a
premature epic.

### Phase 3: Declare dependencies

Ask the user (or surface from context): what items, if any, must be at `stage: done`
before this can start?

- For a backlog item the user mentions as a prerequisite: add to `depends_on`
- For a related in-flight feature in the same area: consider adding to `depends_on`
  if the new work's design assumes the in-flight feature's output

**Cycle check**: if `<id>` is the new item and `<dep>` is a candidate dependency,
verify that `<dep>` does not transitively depend on `<id>`. Run:

```bash
.work/bin/work-view --blocking <id> --paths
```

If `<dep>` is in that output, adding `<dep>` to `<id>`'s `depends_on` would create a
cycle. Report it and ask the user to resolve.

### Phase 4: Foundation-doc roll-forward (large scope only)

When the scope is large, first do an **impact assessment** along four axes:

1. **Architecture impact** — does the current architecture support this, or
   does it need to evolve? New layers, boundaries, integration points?
2. **Spec impact** — new technical constraints, interfaces, non-functional
   requirements?
3. **Vision impact** — does the project's purpose or audience change, or just
   capabilities?
4. **Principles impact** — does this new direction force a new substrate or
   code-design principle, or fit existing ones?

Run `/agile-workflow:research` first if the expansion uses unfamiliar
technology and you don't yet have research docs for it.

Then identify which foundation docs need updating:

- **VISION.md** — if scope changes audience, success criteria, or the project's purpose
- **SPEC.md** — if scope introduces a new technical constraint, interface, or
  non-functional requirement
- **ARCHITECTURE.md** — if scope adds a component, changes a boundary, or alters data flow
- **PRINCIPLES.md** — only when a genuinely new principle emerges (rare)

For each affected doc:
1. Read the current version in full
2. Edit the relevant sections to reflect the **new present** — extend, replace, restructure as needed
3. **Do NOT add "previously" notes, "in v1.x", or migration prose.** Git carries
   history; the doc carries truth (rolling-foundation principle)

**Design-system lock-in (UI-bearing large scope only).** If Phase 1.8 flagged
palette or a flow, invoke `/ux-ui-design:palette` and/or
`/ux-ui-design:flows <flow-name>` here. The locked mocks ship in the same
roll-forward commit and are inherited by `epic-design` Phase 4.6.

### Phase 5: Write the item file

Per the SPEC.md frontmatter contract. Required fields for an item in active:

```yaml
---
id: <slug>
kind: epic|feature|story
stage: drafting    # or implementing for stories
tags: [<tag>, ...]
parent: <slug>|null
depends_on: [<slug>, ...]
release_binding: null
gate_origin: null
created: YYYY-MM-DD
updated: YYYY-MM-DD
---

# <name>

## Brief
<one to three paragraphs describing what this is and why it exists>

<!-- Subsequent sections (Design, Implementation Notes, etc.) accumulate as
work progresses. -->
```

If sourcing from `.work/backlog/<id>.md`, use `git mv` to move it:

```bash
git mv .work/backlog/<old-id>.md .work/active/<kind>s/<new-id>.md
```

Then edit the moved file to add full frontmatter and brief.

If a fresh request, just create the file directly with `Write`.

### Phase 6: Commit

```bash
git add .work/active/<kind>s/<id>.md docs/VISION.md docs/SPEC.md docs/ARCHITECTURE.md  # whichever exist + were changed
git commit -m "scope: <id> (<kind>, <size>)"
```

If foundation docs rolled forward, the commit message should note it:

```
scope: <id> (epic) + foundation roll-forward

Rolled forward: SPEC.md (added multi-tenancy section), ARCHITECTURE.md (added tenant boundary).
```

## Output (single-idea mode)

(Batch mode has its own output in Phase B9.)

In conversation:
- **Scoped**: `<id>` as `<kind>` at `stage: <stage>`
- **Parent**: `<parent-id>` (or "none — top-level")
- **Depends on**: `[<id>, ...]` (or "no dependencies")
- **Foundation docs rolled forward**: list of files touched (or "none")
- **Next**: for features at `drafting`, the design family will pick this up
  (`/agile-workflow:feature-design`, `refactor-design`, or `perf-design` based
  on tags); for epics at `drafting`, `/agile-workflow:epic-design` decomposes
  into child features.

## Guardrails

- Foundation docs roll forward IN PLACE — never add "previously" or "originally"
  prose. Git is the audit trail.
- Cycle detection is mandatory for `depends_on`. Use `work-view --blocking` before
  writing.
- Do NOT pre-populate stages beyond what the size mapping specifies. Don't set a
  feature to `implementing` at scope time — `design` does that when it advances.
- Do NOT pre-bind to a release. `release_binding` stays `null` until
  `/agile-workflow:release-deploy` runs.
- If sizing is genuinely unclear after Phase 2, ask the user via AskUserQuestion
  rather than guessing.
- **Batch mode: one confirmation gate, not many.** Phase B7 is a single
  `AskUserQuestion` call (up to 4 questions). Apply NL adjustments from the
  user's reply and proceed — do not loop on a second confirmation round.
- **Batch mode: one Explore agent in Phase B3, not three.** A single
  medium-breadth pass over the backlog list is enough. Don't fan out per
  cluster.
- **Batch mode: leftovers default to staying in backlog.** Forcing leftovers
  into a "miscellaneous" feature dilutes the clustering signal.
- **Batch mode: lean smaller, but accept natural-grouping epics.** Prefer
  multiple features over one giant epic; form an epic when there's a real
  capability arc that wants `epic-design` decomposition, not just to bundle
  loosely related items.
