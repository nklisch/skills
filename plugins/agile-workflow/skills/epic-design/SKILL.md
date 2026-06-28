---
name: epic-design
description: >
  ALWAYS invoke this skill when the user asks to design, decompose, or pick up an epic at
  stage:drafting. Reads the epic, foundation docs, and codebase; identifies child feature arcs; writes
  feature files with parent and depends_on metadata; updates the epic body with the realized
  decomposition; and advances drafting to implementing. When ux-ui-design is installed, includes
  mockup planning for net-new screens and journeys.
---

# Epic-Design

You design an epic in the agile-workflow substrate. The decomposition lives in
the epic item's body (replacing the provisional "Anticipated child features"
sketch with the realized list), and child feature files are spawned at
`.work/active/features/` with declared `depends_on` chains. When the
decomposition is done, you advance the epic's stage `drafting → implementing`.

This skill is the design-family entry point for `kind: epic`. The downstream
feature-design family (`design`, `refactor-design`, `perf-design`) then runs
on each child feature individually.

## Trigger

Auto-triggers when the agent identifies an epic at `stage: drafting` ready for
decomposition — often inside an active autopilot goal.
Common phrases:
- "design epic X"
- "decompose this epic"
- "this epic is ready to break down"

User-invocable too when the user wants to break down a specific epic without
running full autopilot.

## Invocation modes

| Invocation | Behavior |
|---|---|
| `epic-design <id>` (default) | Full design pass on one epic — workflow Phases 1-7. |
| `epic-design --only-questions <id>` | Question-only pass on one epic — runs read/ground phases, surfaces strategic ambiguities (Phase 4.7), captures answers under `## Design decisions`, does NOT decompose or advance stage. |
| `epic-design --only-questions <id1> <id2> ...` | Question-only pass over each listed epic, in order. |
| `epic-design --only-questions --all` | Question-only pass over every epic at `stage: drafting` in `.work/active/epics/`. Iterate in dependency order. |

`--only-questions` mode requires interactive mode — refuse to run when an
active autopilot run or harness goal is driving the session (matches
feature-design's rule). When the design family runs later, captured answers are
inherited from each epic body, so autopilot no longer has to use judgment on
those points.

## Anti-patterns

These mirror `epicize`'s anti-patterns at the next level down:

- **Don't produce a phase plan.** Features are containment shapes, not temporal
  slots. Use the dependency graph; let the autopilot pick what's ready.
- **Don't split by layer.** Feature-DB / Feature-API / Feature-UI under one
  epic is an anti-pattern unless the layers are genuinely independent
  deliverables. Split by capability.
- **Don't pad with refactor or test features.** Refactoring happens incrementally
  via `/agile-workflow:refactor-design` on tagged features when actual smells
  surface. Don't manufacture features for either.
- **Don't design the features.** That's the per-feature design pass. Here you
  write a brief and declare dependencies — the feature body fills in interfaces,
  signatures, and test approach when its own design pass runs.
- **Don't pre-bind to releases.** Child features get `release_binding: null`.
- **Don't pre-populate child feature stages beyond `drafting`.** Stage advances
  through actual work.

## Workflow — `--only-questions` mode

Use this path when invoked with `--only-questions`. Iterate over the target set
(one epic, an explicit list, or every drafting epic under `--all`):

For each epic:
1. Read the epic file; skip if `kind` is not `epic` or `stage` is not `drafting`
2. Ground yourself (Phase 2 below — foundation docs + AGENTS.md / CLAUDE.md + parent if any; AGENTS is canonical)
3. Map the codebase lightly — direct Read/Glob/Grep first; use one Task
   Explore over the epic's area only when local reading leaves a real unknown
4. **Run Phase 4.6 (UI surface alignment)** — `--only-questions` is the
   visual alignment gate, not just the textual one. When `ux-ui-design` is
   installed, run the full Phase 4.6 pass; reference resulting paths in
   the epic body's `## Mockups` section.
5. Run Phase 4.7 (Surface high-level design ambiguities) in the interactive
   branch, always using `structured question tool`
6. Capture answers under `## Design decisions` in the epic body (merge with
   existing entries; don't overwrite without flagging)
7. Do NOT decompose into child features or advance stage
8. Commit per epic: `epic-design --only-questions: <id>`

Requires interactive mode; refuse to run under an active autopilot run or goal.
Do not run cross-model advisory review in this mode — the user is the alignment
signal.

## Workflow

### Phase 1: Read the epic

Read `.work/active/epics/<id>.md`. Confirm:
- `kind: epic`
- `stage: drafting`
- No direct children yet (see Phase 1.5)

Note the epic's `tags` — if `[refactor]` or `[perf]`, propagate the tag to
child features so the right design-family skill picks them up.

### Phase 1.5: Children-already-exist short-circuit

Run:

```bash
.work/bin/work-view --parent <epic-id> --paths
```

If direct children already exist, the decomposition was done previously (manually
via `scope`, or by an upstream skill like `bold-refactor`). Don't re-decompose.
Instead:

1. Verify the children form a coherent decomposition (every child has a
   sensible `parent: <epic-id>`, no obvious capability gaps relative to the
   brief).
2. Append a short note to the epic body: "Decomposition pre-existed — N child
   features, listed below."
3. Advance epic stage `drafting → implementing` and commit.
4. Skip Phases 2-7. Go to Output.

### Phase 2: Ground yourself

The principles skill auto-loads — both code-design (Ports & Adapters, SSOT,
Generated Contracts, Fail Fast) and substrate-execution (Item-IS-the-Work,
Rolling-Foundation, Late-Binding) are active.

Read:
1. `docs/VISION.md`, `docs/SPEC.md`, `docs/ARCHITECTURE.md` — foundation that
   constrains this epic
2. `AGENTS.md` / `CLAUDE.md` (project conventions; AGENTS is canonical)
2a. `.agents/rules/*.md` (if present) — the project's force-loaded agent rules
   (tag semantics, test integrity, review policy)
3. `docs/PRINCIPLES.md` if it exists
4. The epic's parent if `parent` is set (rare — epics usually top-level)
5. Sibling epics in `.work/active/epics/` — to see what they cover and avoid
   straddling boundaries
6. Research docs in `docs/research/` for any libraries the epic mentions
   that you haven't verified

### Phase 3: Map the codebase

Run a read-first scope-size probe before spawning exploratory sub-agents:

1. Use Glob/`rg --files` to identify likely directories, entry points, active
   sibling work, and tests.
2. Use Grep/`rg` for epic terms, capability names, exported types, route names,
   and shared integration points.
3. Read 2-5 representative source, test, and sibling item files yourself.

Then choose the dispatch size:

- **Small/bounded epic** — one known subsystem with obvious seams: skip exploratory fanout
  and map it directly.
- **Medium/unclear epic** — one area but missing ownership or dependency
  clarity: spawn one read-only exploratory sub-agent.
- **Broad/cross-cutting epic** — several independent surfaces or sibling-work
  interactions: spawn parallel read-only exploratory sub-agents.

For exploratory fanout:
- Use the host's generic/general-purpose subagent prompted with the explorer
  capsule from `../principles/references/subagents.md`, at medium reasoning by
  default.
- Use high or strongest reviewer reasoning for large or complex codebases.
- If no generic subagent adapter is available, keep direct host-local mapping.

Possible prompts:
1. **Existing surface in this epic's area** — what modules, components, or
   integration points already exist that this epic will extend or touch?
   Report file paths and brief responsibility per finding.
2. **Cross-cutting touchpoints** — what areas does this epic interact with
   (auth, persistence, transport, UI shell, etc.)? Each touchpoint is a
   candidate for a dedicated feature OR a constraint on existing features.
3. **Already-scoped sibling work** — features and stories under sibling epics
   in `.work/active/`. Report any overlap or shared types that imply a
   dependency edge from this epic's children to a sibling epic.

After direct reading or Explore results, **read 2-3 key source files yourself**
to verify findings.

### Phase 4: Identify feature arcs

Look for natural decomposition seams within the epic:

- The epic body's "Anticipated child features" sketch (if any) is your seed —
  it's provisional, but the user wrote it for a reason. Honor the spirit, refine
  the shape.
- Foundation-doc sections within the epic's scope often map to features.
- Capability arcs from the brief — "users can do X" usually maps to one feature;
  "system supports Y constraint" might be its own feature or fold into an
  existing one.
- Sequencing implied by the brief or the architecture (foundation systems
  before consumers, contracts before clients) — these become `depends_on`
  edges.

**Sizing rule (from epicize, mirrored down a level):** each child feature
should fit comfortably in one `/agile-workflow:feature-design` →
`/agile-workflow:implement` pass — 5-15 implementation units. If a single
candidate feature would need more, split it. If candidates feel tiny (1-2
units each), collapse them into one feature.

Aim for 2-6 child features per epic. Fewer than 2 means the epic was probably
sized as a feature; flag the user. More than 6 means you're slicing too thin;
collapse.

### Phase 4.5: Identify cross-feature dependencies

For each candidate feature, ask:
- What must be done first before this can be designed and implemented?
- Does this feature share types or contracts with another candidate? If yes,
  the producer of the type is a `depends_on`.
- Independent features (no shared types, no cross-cutting concerns) have no
  dependencies and can be parallelized by autopilot.

Cycle check: for every candidate `depends_on` edge, verify no cycle. Once the
child files exist (Phase 6) you'll re-check via `work-view --blocking`. For
now, sanity-check by hand.

### Phase 4.6: UI surface alignment (PRIMARY mockup tier — runs when ux-ui-design is installed)

This is the primary mockup tier per `ux-ui-principles`. Run the full UI
alignment pass against the candidate arcs from Phase 4. Err on mocking —
`feature-design` Phase 4.6 is the fallback, not a planned second pass.

1. **Palette** — if `.mockups/design-system/tokens.css` doesn't exist,
   invoke `/ux-ui-design:palette` first so subsequent mocks inherit tokens.
2. **Screens** — for every candidate feature with a net-new screen, page,
   modal, or major component, invoke `/ux-ui-design:screens <feature-id>`
   using the future child feature id (e.g. `epic-auth-login`).
3. **Flows** — for every multi-screen journey within the epic, invoke
   `/ux-ui-design:flows <flow-name>`.
4. **Existing-surface composition / no UI** — skip.

The `screens`/`flows` skills write a `## Mockups` section into each item
body automatically; reference those paths from the child feature briefs in
Phase 6 so `feature-design` inherits direction by reference.

**Caller awareness.** Under autopilot delegation, the mockup skills cannot
run (they need interactive input). Append a `## UI alignment deferred`
note to the epic body listing the surfaces, recommend the user run
`/agile-workflow:epic-design --only-questions <epic-id>`, and continue
decomposition. Child briefs note "mockups pending — see parent epic" so
`feature-design` knows to fall back. Every other invocation runs in full.

Skip this phase entirely if `ux-ui-design` is not installed.

### Phase 4.7: Surface high-level design ambiguities

Read the epic and the candidate decomposition you've sketched, and derive
specific, concrete high-level design questions about *this* epic's actual
work. These are the directional choices that, if locked in now, will keep
every child feature's later design pass aligned. Examples of the *shape* of
question to surface (the actual content must come from the epic):

- "For this epic's auth surface, do we use OAuth via the existing provider,
  or roll a local session model?"
- "Should the new sync engine push from server to client, pull from client
  on-demand, or both?"
- "Are we committing to multi-tenant data isolation in this epic, or is
  single-tenant acceptable for v1?"
- "Does the import pipeline need to handle CSV and Parquet, or just CSV?"

These are product/architecture/scope questions specific to the epic in
front of you — not generic prompts about boundaries, naming, or sizing.
Skip anything you can answer from the epic body, foundation docs, or
codebase. Skip anything that's safely a downstream feature-design call
(function signatures, exact file paths, per-unit test approach).

Aim for the smallest set of questions that meaningfully resolve direction
— typically 2-5. Zero is fine if the epic body and foundation docs already
pin every directional choice.

**Cross-model advisory review under autopilot.** If this skill is running as a
delegation from active autopilot, the epic has large/risky architectural
decisions, and the body does not already contain useful `## Design decisions`
from a prior `--only-questions` pass, apply the cross-model advisory review
policy from `principles/SKILL.md` before resolving the questions yourself.

Use one focused `peer` pass only when a different model class is available.
Ask for missing questions, risks, ambiguous constraints, and alternatives for
this epic's decomposition — not for a final verdict. Do not run the multi-pass
`peer-review` loop during routine autopilot design. If peeragent is
unavailable, the peer would use the same model class, or the invocation fails,
continue with host judgment and note that the advisory pass was skipped.
If the peeragent target is Claude Opus, allow 10 to 30 minutes for a large
review; no return after a few minutes is not evidence that it has hung.

Summarize the useful output under `## Other agent review` in the epic body and
fold accepted questions/risks into the decisions you log. Do not paste the peer
transcript into the item.

If this skill is running **as a delegation from an active autopilot run or
harness goal**, resolve each question with judgment (prioritize: consistent
with foundation docs > simpler option > defers irreversible decisions) and log
under `## Design decisions` in the epic body:

```markdown
## Design decisions
- **<question>**: <choice> — <one-line rationale>
```

In every other invocation — including direct user invocation under harness
auto mode (`permissions.defaultMode: "auto"`) — ask the user via
`structured question tool` before locking in, then write the answers under `## Design
decisions` in the epic body. Harness-level "work without pausing" reminders
do **not** suppress these checkpoints. See `principles/SKILL.md` Part III
for the full caller-awareness rule.

The child feature briefs you write in Phase 6 should reference the relevant
design decisions so each feature's later design pass inherits the locked-in
direction.

The exception under autopilot: a 50/50 between two large irreversible
choices (e.g., SQL vs document store for this epic's persistence layer).
Append a `## Blocker` section and return without advancing — autopilot will
skip and surface the blocker.

### Phase 5: Pre-mortem

Before writing files, attack the decomposition:
- What's the riskiest feature? Is it sized correctly?
- What capability is least clearly assigned to a feature? Is there a gap?
- Are any features so tightly coupled they should be one feature?
- Does the dependency chain create a critical path that defeats the parallelism
  intent?

Revise the decomposition if anything surfaces. Document discovered risks in a
`## Decomposition risks` section in the epic body.

### Phase 6: Write child feature files

For each child feature, create `.work/active/features/<feature-id>.md`:

```yaml
---
id: <epic-slug>-<feature-slug>
kind: feature
stage: drafting
tags: [<inherited from epic if [refactor] or [perf]>, ...]
parent: <epic-id>
depends_on: [<feature-id>, ...]
release_binding: null
gate_origin: null
created: YYYY-MM-DD
updated: YYYY-MM-DD
---

# <Feature Name>

## Brief
<two to three paragraphs: what this feature delivers within the epic, what
capability it covers, why it exists in this epic, what it does NOT cover>

## Epic context
- Parent epic: `<epic-id>`
- Position in epic: <e.g., "foundation feature — others depend on its types"
  / "consumer of feature-X" / "independent capability">

## Foundation references
- `docs/VISION.md` — relevant section(s) (only if directly relevant)
- `docs/ARCHITECTURE.md` — relevant component(s)
- (other foundation docs as relevant)

## Mockups
<!-- Only present when Phase 4.6 produced or inherited mocks covering this
feature. Reference the parent epic's chosen options by path; do NOT re-mock
at the feature tier. -->
- Inherits design system: `.mockups/design-system/tokens.css`
- Screens: `.mockups/screens/<feature-id>/index.html` — selected option-N
- Flow (if applicable): `.mockups/flows/<flow-name>/index.html`

<!-- The design pass on this feature (`/agile-workflow:feature-design`,
refactor-design, or perf-design) will fill in interfaces, signatures, and
implementation units. -->
```

Naming convention: `<epic-slug>-<feature-slug>` — e.g., epic `epic-auth`
spawns features `epic-auth-login`, `epic-auth-session`, `epic-auth-recovery`.
This makes parent-child relationships obvious from filenames at a glance.

### Phase 6.5: Cycle check

For every child feature with non-empty `depends_on`, run:

```bash
.work/bin/work-view --blocking <feature-id> --paths
```

If any candidate dependency appears in that output, the edge would create a
cycle. Drop or reroute the edge before continuing.

### Phase 7: Write decomposition INTO epic body

Update the epic file. Replace the provisional "Anticipated child features"
section (if present) with a `## Decomposition` section listing the realized
features:

```markdown
## Decomposition

<one-paragraph summary of the chosen decomposition and why this shape over
alternatives — e.g., "Split by capability: login flow, session handling, and
recovery are independent enough to parallelize after the shared session-type
feature lands.">

### Child features

- `<feature-id-1>` — <one-line description> — depends on: `[]`
- `<feature-id-2>` — <one-line description> — depends on: `[<feature-id-1>]`
- `<feature-id-3>` — <one-line description> — depends on: `[<feature-id-1>]`

### Decomposition risks

<from pre-mortem, if any. Otherwise omit the section.>
```

Do NOT write design content (interfaces, signatures, test plans) into the epic
body. That's feature-level work.

### Phase 8: Advance epic stage and commit

1. Edit the epic file's frontmatter: `stage: drafting → implementing`. The
   PostToolUse hook auto-bumps `updated:`.
2. Commit:

```bash
git add .work/active/epics/<epic-id>.md .work/active/features/<epic-id>-*.md
git commit -m "epic-design: <epic-id> (<N> child features)"
```

## Output

In conversation:
- **Decomposed**: `<epic-id>` advanced to `stage: implementing`
- **Child features**: list with `depends_on` chains, e.g.:
  - `epic-auth-session` — depends on: `[]`
  - `epic-auth-login` — depends on: `[epic-auth-session]`
  - `epic-auth-recovery` — depends on: `[epic-auth-session]`
- **Tags propagated**: list (or "none — greenfield")
- **Decomposition risks flagged**: list (or "none")
- **Next**: each child feature is at `stage: drafting` ready for the
  feature-design family (`/agile-workflow:feature-design`,
  `/agile-workflow:refactor-design`, or `/agile-workflow:perf-design` based on
  tags). Autopilot will pick them up automatically.

## Guardrails

- The decomposition lives in the epic's body. NEVER create
  `docs/designs/epic-<name>.md` — that's a workflow-plugin pattern;
  agile-workflow uses item-IS-the-work.
- **Phase 4.6 is the primary UI/UX mockup tier.** Don't defer net-new
  surfaces to `feature-design` — its mockup phase is a fallback only.
- **`--only-questions` always runs the mockup pass** — that mode IS the
  visual alignment gate.
- Child features are at `stage: drafting` — they get DESIGNED next, not
  implemented next. Don't pre-populate them at `implementing`.
- Don't write feature-level design content (interfaces, signatures, tests)
  into the epic body or the child feature briefs. That belongs in each
  feature's own design pass.
- Propagate `[refactor]` or `[perf]` tags from the epic to child features so
  the right design-family skill picks them up. Greenfield epics produce
  greenfield features.
- Aim for 2-6 child features per epic. Outside that range, ask whether the
  epic is sized correctly.
- Cycle prevention is mandatory for `depends_on`. Use `work-view --blocking`.
- If the epic already has direct children (Phase 1.5), short-circuit — advance
  the stage and stop. Don't re-decompose work the user or another skill
  already did.
- Don't pre-bind child features to releases. `release_binding` stays `null`
  until `/agile-workflow:release-deploy` runs.
- Don't manufacture refactor/test/deployment features just to have them.
  Those surface organically from gates and refactor-tagged work.
