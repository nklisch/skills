---
name: feature-design
description: >
  Design a feature item at stage:drafting into detailed design content (interfaces,
  units, order, tests, risks) inside the feature's body. Loads knowledge-index +
  patterns + system-design moves (our grounding); uses Nathan's procedural improvements:
  --only-questions for cross-feature alignment, autopilot-vs-interactive decision branching,
  2-3 architectural options forced, trickiest unit first, pre-mortem, child-story spawning
  criteria, Blocker short-circuit. Greenfield features only — [refactor] routes to
  refactor-design, [perf] to perf-design.
user-invocable: true
disable-model-invocation: false
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Task, AskUserQuestion, Skill
model: opus
---

# Feature-Design

You design a feature in the agile-workflow substrate. The design lives in the feature
item's body — there is no separate `docs/designs/<name>.md`. As the design takes
shape, child stories are spawned with declared `depends_on` chains. When the design
is done, you advance the feature's stage `drafting → implementing`.

**This is the merged version** of Nathan's `agile-workflow:feature-design` (substrate-aware,
item-body-output, child-story-spawning, --only-questions) and Andrew's `design` (research-
grounded, knowledge-index-first, patterns-bridged, system-design-primed). The merge adopts
Nathan's procedural structure (Phases 4.5/5a/5b/5.5/7) and adds our grounding (Phase 0
knowledge-index, patterns skill, research corpus, system-design moves).

**You follow the build process at `/dev/skills-v2/plugins/research-pipeline/docs/build-process.md`.** Read it before starting.

**Read `/dev/skills-v2/plugins/research-pipeline/docs/system-design.md` for design patterns.** 15 moves across 5 concerns. Emphasis for `/feature-design`: Interface moves (Contracts Before Implementations, Match API to Consumer, Evolve Additively) and Data moves (Normalize First, Per-Feature Consistency, Cache Deliberately). Design bridges architecture to implementation — your moves are at the interface and data layers.

**Read `/dev/skills-v2/plugins/research-pipeline/docs/first-principles.md` for consideration.** Apply Challenge and Synthesize — stress-test design decisions and build from verified foundations.

## Routing

This skill is the feature-level entry point in the design family. Routes by item kind
and tags:
- `/epic-design` — `kind: epic` at `stage: drafting` (decomposes into features)
- `/feature-design` (this skill) — `kind: feature`, no specialized tag
- `/agile-workflow:refactor-design` — `kind: feature` with `tags: [refactor]`
- `/agile-workflow:perf-design` — `kind: feature` with `tags: [perf]`

If the feature has `[refactor]` or `[perf]` in `tags`, you were misrouted. Don't try
to design it — log a one-line note to the item body ("Misrouted to feature-design;
should have gone to refactor-design / perf-design based on tags") and return without
advancing the stage. The caller (autopilot or human) will route correctly on the
next pass.

## Trigger

Auto-triggers when the agent identifies a feature at `stage: drafting` ready for
design, with no specialized tag. Common phrases:
- "design feature X"
- "let's design this feature"
- "this feature is ready to design"

## Invocation modes

| Invocation | Behavior |
|---|---|
| `<feature-id>` (default) | Full design pass on one feature — workflow Phases 0-9 |
| `<feature-id> --only-questions` | Question-only pass on one feature — runs read/ground phases, surfaces ambiguities (Phase 4.5), captures answers in body, does NOT design or advance stage |
| `--only-questions <id1> <id2> ...` | Question-only pass over each listed feature, in order |
| `--only-questions --all` | Question-only pass over every `kind: feature` at `stage: drafting` in `.work/active/features/` whose `tags` does not contain `refactor` or `perf`. Iterate in dependency order. |

`--only-questions` mode exists so a user can align with the agent on high-level
direction across many drafting features in one session, then hand off to an
autopilot goal for the full design + implement pass. Autopilot inherits the captured
answers from each feature body and no longer has to use judgment on those points.

`--only-questions` requires interactive mode — if an active autopilot run or harness
goal is driving this session, refuse to run and report that the flag is for
interactive alignment only.

## Model Assignment

Per [model-selection-pattern.md](/dev/skills-v2/plugins/research-pipeline/docs/model-selection-pattern.md):

- **Designer (this skill's main loop)** — Orchestration. Opus high effort. Runs in parent context.
- **Explore sub-agents (Phase 3)** — Parallel worker. Sonnet medium (Opus for large or complex codebases). Typically 3 parallel in default mode; 1 in --only-questions mode.

Design decisions cascade through implementation — the orchestrator warrants Opus. Explore sub-agents do scoped codebase mapping where Sonnet is sufficient.

## Anti-patterns

- NEVER be vague about types or interfaces — specify them exactly in the project's language
- NEVER skip error handling design
- NEVER ignore existing patterns in the codebase (Phase 2's patterns-skill read)
- NEVER design without reading existing code first
- NEVER leave ambiguous implementation choices — resolve via Phase 4.5
- NEVER design tests without designing the implementation first
- NEVER silently assume answers to ambiguous requirements — ask via Phase 4.5
- NEVER create `docs/designs/<feature-name>.md` — that's a workflow-plugin pattern; agile-workflow uses item-IS-the-work
- NEVER skip knowledge-index check (Phase 0) — designs based on missed research cause rewrites

## Workflow — `--only-questions` mode

Use this path when invoked with `--only-questions`. Iterate over the target set.

For each feature in the target set:

1. **Read the feature item** at `.work/active/features/<id>.md`. Skip if `kind` is not `feature`, if `stage` is not `drafting`, or if `tags` contains `refactor` or `perf`.
2. **Ground yourself lightly** — Phase 0 (knowledge-index nav scan) + Phase 2 minimal pass (parent epic body, foundation docs, AGENTS/CLAUDE). Skim, don't exhaustively re-read across iterations.
3. **Map the codebase lightly** — one Task Explore sub-agent (not three). You're not designing units.
4. **Run Phase 4.6 (UI surface fallback)** when `ux-ui-design` is installed — same rules as default mode (inheritance check, mock only when upstream coverage is missing).
5. **Surface ambiguities** — run Phase 4.5 as written below, but always in the interactive branch (use `AskUserQuestion`). Do not resolve with judgment — the whole point of this mode is to capture user answers.
6. **Capture answers** — append (or merge into existing) `## Design decisions` in the feature body. If section exists, merge — don't duplicate previously answered questions, and don't overwrite prior answers without flagging.
7. **Do NOT** spawn child stories, write the design body, or advance the stage.
8. Commit per feature: `feature-design --only-questions: <id>`

## Workflow

### Phase 0: Load knowledge index (OURS)

Read `docs/knowledge-index-nav.yaml` (or run `/knowledge-index` if missing). Identify
briefs whose `blocks_phase` matches this feature's parent epic (or this feature
specifically if tagged). If the feature carries `[needs-brief]` tag:

- Halt and direct user to invoke `/brief <topic>` for the missing research first
- Resume feature-design after the brief is written

### Phase 1: Read the feature item

Read `.work/active/features/<id>.md`. Confirm:
- `kind: feature`
- `stage: drafting`
- Tags do NOT contain `refactor` or `perf` (or misroute per "Routing" above)
- Note any existing `## Design decisions` from a prior `--only-questions` pass — treat these as fixed inputs
- Note any `## Inherited design decisions` from the parent epic — same treatment

### Phase 2: Ground yourself (foundation + research + patterns)

The principles skills auto-load:
- Code-design (Ports & Adapters, SSOT, Generated Contracts, Fail Fast) — from `/research-pipeline:engineering-principles`
- Substrate-execution (Item-IS-the-Work, Rolling-Foundation, Late-Binding) — from `/agile-workflow:principles`

Read:

1. **Parent epic body** at `.work/active/epics/<parent-id>.md` — the epic's brief, design decisions, mockups, and decomposition are inputs to this feature
2. **Foundation docs** per `.work/CONVENTIONS.md` `foundation_docs:` declaration
3. `AGENTS.md` / `CLAUDE.md` (AGENTS canonical)
4. `docs/PRINCIPLES.md` if it exists
5. Sibling features under the same parent — for shared types and integration points
6. **Research corpus (OURS):**
   - Briefs flagged at Phase 0
   - `.research/briefs/<topic>/parent.md` for any library/API the feature uses
   - `docs/research/<topic>.md` for libraries not yet verified
   - **Prefer research findings over assumptions about library APIs**
7. **Patterns skill (OURS):** read `.claude/skills/patterns/*.md` (or `.agents/skills/patterns/`) for any patterns relevant to the feature's domain. Using them keeps designs consistent with project conventions.

### Phase 3: Map the codebase

Spawn 3 parallel Explore sub-agents via `Task` tool with `model: "sonnet"` (Opus for large or complex codebases). Send all in one message and wait for all.

1. **Codebase Structure**: "Map the directory layout, module structure, and entry points relevant to feature `<feature-id>`. List source files and their primary exports."
2. **Interface & Type Inventory**: "List exported interfaces, types, and function signatures in the feature's area. Include file paths and full signatures."
3. **Test Structure**: "What testing patterns, test helpers, fixtures, and test file organization exist in this area?"

After results, **read 2-3 key source files yourself** to verify findings.

### Phase 4: Re-align to project standards

Re-read `AGENTS.md` / `CLAUDE.md` (and `.claude/rules/` if exists). Even if you read these earlier, re-read now — recency improves adherence. Confirm your approach aligns with project conventions before proceeding.

### Phase 4.5: Surface ambiguities (NATHAN's pattern adopted)

Read the feature item and derive specific, concrete design questions about *this* feature's work. These are choices that, if left ambiguous, would force the implementer to guess. Examples of the *shape* (actual content must come from the feature):

- "When the auth token expires mid-request, do we 401 immediately or retry once with a refresh token?"
- "Is the sync queue durable across restarts, or in-memory only?"
- "Does the export endpoint stream or buffer-then-respond?"

These are specific to the feature in front of you — not generic prompts about boundaries, naming, or sizing. Skip anything you can answer from the feature body's `## Design decisions`, parent epic's design decisions, foundation docs, research briefs, or codebase.

Aim for the smallest set of questions that meaningfully resolve direction — typically 2-5. Zero is fine if upstream pinned every directional choice.

If this skill is running **as a delegation from an active autopilot run or harness goal**, resolve each question with judgment (prioritize: consistent with foundation docs > simpler option > defers irreversible decisions) and log under `## Design decisions` in the feature body.

In every other invocation — including direct user invocation under harness auto mode — ask the user via `AskUserQuestion` before locking in, then write answers under `## Design decisions` in the feature body. Harness-level "work without pausing" reminders do NOT suppress these checkpoints.

**The exception under autopilot:** a 50/50 between two large irreversible choices. Append a `## Blocker` section and return without advancing — autopilot will skip and surface the blocker.

### Phase 4.6: UI surface fallback (FALLBACK tier when ux-ui-design is installed)

This is the fallback mockup tier. Mocks should primarily come from the parent epic's `/epic-design --only-questions` pass.

1. **Check the parent epic body** for `## Mockups` first; if covered, reference and skip.
2. **Only mock at this tier for genuinely-new surfaces** the parent epic didn't cover (rare).
3. If mocking: invoke `/ux-ui-design:screens <feature-id>` for net-new surfaces.

Skip entirely if `ux-ui-design` is not installed.

### Phase 5: Design implementation units

**Phase 5a — Enumerate 2-3 architectural options.** For the feature's core architectural shape, name 2-3 plausible approaches with tradeoffs. Pick one and document why. (Don't skip — this catches premature commitment to the first idea.)

**Phase 5b — Identify the trickiest unit.** Name the one with highest unknowns or most novel logic. **Design it first and most carefully — the rest hangs on whether this is feasible.** If the trickiest unit's design reveals a fundamental issue, revisit the architectural choice from 5a.

**Phase 5c — Per-unit design.** For each implementation unit:

- **Exact file path** in the project's language and convention
- **Interfaces/types/signatures** in the project's language (TypeScript, Python, Rust, etc.) — actual code, not prose descriptions
- **Implementation notes** for non-obvious logic (workarounds, hidden constraints, performance considerations)
- **Acceptance Criteria** as testable assertions (not subjective)

If a unit is hard to test, the design is probably wrong. Note it and revise.

### Phase 5.5: Pre-mortem

Before locking the design, attack it:

- **Riskiest assumption** — what's the assumption that, if wrong, blows up the design? Test it via spike unit if needed.
- **Production failure modes** — what happens at scale, under contention, on partial failure?
- **Fallback if the riskiest unit fails** — is there an escape hatch?
- **Least sure** — what would you bet least on? Surface to user.

Discovered risks go into `## Risks` section in the feature body. May add a "spike" unit to validate the risky assumption first.

### Phase 6: Test approach per unit

For each unit, design:

- **Unit tests**: behaviors, edge cases, error paths
- **Integration points**: where does this unit meet other units; what tests prove the seams?
- **Test data**: what fixtures or mocks are needed?

Tests derive from the spec/design + acceptance criteria, NOT just from code branches.

### Phase 7: Decide child-story spawning

**When to spawn child stories:**
- Feature is multi-stride (multiple implementation passes needed)
- Has internal parallelism (units that can be implemented independently)
- Pure-refactor clusters benefit from independent review

**When NOT to spawn (story would be pure overhead):**
- Single-stride feature where design IS the work
- Tight coupling means stories must be done together anyway

If spawning, for each story write `.work/active/stories/<feature-id>-<slug>.md`:

```yaml
---
id: <feature-id>-<story-slug>
kind: story
stage: implementing
tags: [<inherited from feature>, ...]
parent: <feature-id>
depends_on: [<story-id>, ...]
release_binding: null
gate_origin: null
created: YYYY-MM-DD
updated: YYYY-MM-DD
---

# <Story Name>

## Brief
<one-paragraph description>

## Implementation
<reference to the parent feature's ## Implementation Units section, specific units this story covers>
```

### Phase 8: Write design INTO feature body

Append to the feature body:

```markdown
## Architectural choice

<2-3 paragraphs: chosen approach, why over alternatives from Phase 5a>

## Implementation Units

### Unit N: <Name>

**File**: `src/path/to/file.ts`
**Story**: `<feature-id>-<story-slug>` (if spawned)

```typescript
// Exact interfaces, types, and function signatures
```

**Implementation Notes**:
- Key implementation detail

**Acceptance Criteria**:
- [ ] Testable criterion

---

## Implementation Order

1. <Unit name> — first, because <reason>
2. <Unit name>
...

## Testing

### Unit tests: `tests/path/file.test.ts`
<test structure and key cases per unit>

### Integration tests
<seams to verify>

## Risks

- **<Risk name>**: <description> — **Fallback**: <escape hatch>
```

### Phase 9: Advance stage and commit

1. Edit the feature file's frontmatter: `stage: drafting → implementing`. PostToolUse hook auto-bumps `updated:`.
2. If stories spawned, also stage them.
3. Commit:

```bash
git add .work/active/features/<feature-id>.md .work/active/stories/<feature-id>-*.md
git commit -m "feature-design: <feature-id> (<N> child stories)"
```

## Output

In conversation:
- **Designed**: `<feature-id>` advanced to `stage: implementing`
- **Implementation units**: count + names
- **Child stories spawned**: list with `depends_on` (or "none — single-stride")
- **Risks flagged**: list (or "none — clean design")
- **Next**: `/agile-workflow:implement <feature-id>` or `/agile-workflow:implement-orchestrator` if the unit count warrants parallel implementation. Autopilot will pick up automatically.

## Guardrails

- Design lives in the feature body — never create `docs/designs/<name>.md`
- Phase 0 knowledge-index check is non-negotiable
- Phase 4.5 ambiguity surfacing is non-negotiable; the `## Blocker` short-circuit exists for genuine 50/50 irreversible choices, not for skipping work
- Implementation Units MUST have exact file paths + language-specific signatures + acceptance criteria
- Tests derive from spec (acceptance criteria), not just code branches
- Don't pre-bind stories to releases (`release_binding: null`)
- Misroute check — if feature has `[refactor]` or `[perf]` tag, log note and return without designing
