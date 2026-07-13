---
name: feature-design
description: >
  ALWAYS invoke when the user asks to design or flesh out a feature at stage:drafting; do not write
  design prose inline. Designs the feature inside its agile-workflow item body, grounded in foundation
  docs and code, then spawns child stories with depends_on chains and advances drafting to
  implementing. Use for greenfield features without [refactor], [perf], [prose], or [research] tags;
  route [refactor] to refactor-design, [perf] to perf-design, [prose] to prose-author, [research] to
  the agentic-research research-orchestrator, and epic decomposition to epic-design. UI/UX mockups are
  fallback here, inherited from the parent epic when available.
---

# Feature-Design

You design a feature in the agile-workflow substrate. The design lives in the
feature item's body — there is no separate `docs/designs/<name>.md`. As the design
takes shape, child stories are spawned with declared `depends_on` chains. When the
design is done, you advance the feature's stage `drafting → implementing`.

This skill is the feature-level entry point in the design family. The family
routes by item kind and tags:
- `epic-design` — `kind: epic` at `stage: drafting` (decomposes into features; an epic
  carrying `[research]` is a research-program epic — routes here as normal decomposition,
  whose children are `[research]` features each with their own `research_dials:` registration;
  the tag at epic level signals program decomposition, never an epic-level registration)
- `feature-design` (this skill) — `kind: feature`, no specialized tag
- `refactor-design` — `kind: feature` with `tags: [refactor]`
- `perf-design` — `kind: feature` with `tags: [perf]`
- `prose-author` — `kind: feature` with `tags: [prose]` (no-code-surface work —
  the authoring lane, not a design step: brief-as-design, no Explore / pre-mortem / question gate)
- `agentic-research:research-orchestrator` (**cross-plugin**) — `kind: feature` with
  `tags: [research]`. A grounded research engagement is an *input* that grounds other work,
  not a code design: the orchestrator reads the item's `research_dials:` block (the
  commissioning subset of the registration) and runs the ARD walk; gates run inline; it
  never binds to a release. Requires the
  `agentic-research` plugin (without it, `[research]` is an inert project tag — fall through
  to `feature-design`).

The cross-plugin target `agentic-research:research-orchestrator` is a fixed pairing contract;
a deployment substituting a different research entry skill edits these routing rows.

If the feature you're looking at has `[refactor]`, `[perf]`, `[prose]`, or `[research]`
in `tags`, you were misrouted. Don't try to design it — log a one-line note to the item
body ("Misrouted to feature-design; should have gone to refactor-design / perf-design /
prose-author / the agentic-research research-orchestrator based on tags") and return without advancing the
stage. The caller (autopilot or human) will route correctly on the next pass.

## Trigger

Auto-triggers when the agent identifies a feature at `stage: drafting` ready for
design, with no specialized tag. Common phrases:
- "design feature X"
- "let's design this feature"
- "this feature is ready to design"

## Invocation modes

The skill accepts an optional `--only-questions` flag and an optional target.

| Invocation | Behavior |
|---|---|
| `<feature-id>` (default) | Full design pass on one feature — workflow Phases 1-9. |
| `<feature-id> --only-questions` | Question-only pass on one feature — runs the read/ground phases, surfaces ambiguities, asks the user, captures answers in the body, does NOT design or advance stage. |
| `--only-questions <id1> <id2> ...` | Question-only pass over each listed feature, in order. |
| `--only-questions --all` | Question-only pass over every `kind: feature` at `stage: drafting` in `.work/active/features/` whose `tags` does not contain `refactor`, `perf`, `prose`, or `research`. Iterate in dependency order (features with fewer unresolved upstream deps first). |

`--only-questions` mode exists so a user can align with the agent on
high-level direction across many drafting features in one session, then
hand off to an autopilot goal for the full design + implement pass. Autopilot
inherits the captured answers from each feature body and no longer has to use
judgment on those points.

`--only-questions` requires interactive mode — if an active autopilot run or
harness goal is driving this session, refuse to run and report that the flag is
for interactive alignment only.
Do not run cross-model advisory review in `--only-questions` mode — the user is
the alignment signal.

## Workflow — `--only-questions` mode

Use this path when invoked with `--only-questions`. Iterate over the
target set (one feature, an explicit list, or every drafting feature
under `--all` per the table above).

For each feature in the target set:

1. **Read the feature item** at `.work/active/features/<id>.md`.
   - Skip if `kind` is not `feature`, if `stage` is not `drafting`, or if
     `tags` contains `refactor`, `perf`, `prose`, or `research`. Log the skip and move on.
2. **Ground yourself** — read the parent epic body if `parent` is set, plus
   the foundation docs (`docs/VISION.md`, `docs/SPEC.md`,
   `docs/ARCHITECTURE.md`) and `AGENTS.md` / `CLAUDE.md`. Treat AGENTS as
   canonical when both exist. Be efficient: skim, don't exhaustively re-read
   across iterations within one session.
3. **Map the codebase lightly** — start with direct Read/Glob/Grep over the
   obvious area. Use one exploratory sub-agent only if local reading
   leaves a real unknown; skip the full three-agent parallel sweep used in
   the default mode because you're not designing units.
4. **Run Phase 4.6 (UI surface fallback)** when `ux-ui-design` is installed
   — same rules as default mode (inheritance check, mock only when
   upstream coverage is missing). Most ask-questions runs find the parent
   epic already mocked and skip here.
5. **Surface ambiguities** — run Phase 4.5 as written above, but always in
   the interactive branch (use `structured question tool`). Do not resolve with
   judgment — the whole point of this mode is to capture user answers.
6. **Capture answers** — append (or merge into existing) `## Design
   decisions` in the feature body:
   ```markdown
   ## Design decisions
   - **<question>**: <choice> — <one-line rationale>
   ```
   If the section already exists, merge — don't duplicate previously
   answered questions, and don't overwrite prior answers without flagging
   the conflict to the user.
7. **Do NOT** spawn child stories, write the design body, or advance the
   stage. The feature stays at `stage: drafting` so the design family can
   pick it up later.
8. **Commit per feature**:
   ```bash
   git add .work/active/features/<id>.md
   git commit -m "feature-design --only-questions: <id>"
   ```

### Output (`--only-questions` mode)

In conversation, after the run:
- **Aligned**: list of feature ids and the count of design decisions
  captured per feature
- **Skipped**: list of feature ids and reason (wrong stage, wrong tag, no
  ambiguities found)
- **Next**: features stay at `stage: drafting` — start an autopilot goal for
  `<epic-id>` or `--all`, or use direct `/agile-workflow:autopilot <scope>`.
  The design pass on each feature will inherit the captured answers.

## Workflow

### Phase 1: Read the feature item

Read the feature file at `.work/active/features/<id>.md`. Confirm:
- `kind: feature`
- `stage: drafting`
- `tags` does NOT include `refactor`, `perf`, `prose`, or `research` (otherwise log a
  misroute note and return without advancing — see the description block above)

The body should already have a brief from `scope`. Use it as the seed for design.

### Phase 2: Ground yourself

The principles skill auto-loads — code-design includes proportional rigor, code
economy, useful tests, and leaving touched areas simpler; substrate-execution
includes Item-IS-the-Work, Rolling-Foundation, and Late-Binding.

Read:
1. `docs/VISION.md`, `docs/SPEC.md`, `docs/ARCHITECTURE.md` (foundation docs that
   constrain this feature)
2. `AGENTS.md` / `CLAUDE.md` (project conventions; AGENTS is canonical)
2a. `.agents/rules/*.md` (if present) — the project's force-loaded agent rules
   (tag semantics, test integrity, review policy)
3. The parent epic if `parent` is set — read `.work/active/epics/<parent>.md`
4. Existing source code in the area the feature touches
5. Research docs in `docs/research/` if the feature uses libraries you haven't
   verified

### Phase 3: Map the codebase

Run a read-first scope-size probe before spawning exploratory sub-agents:

1. Use Glob/`rg --files` to identify likely directories, entry points, and
   existing tests.
2. Use Grep/`rg` for feature terms, route names, exported types, and nearby
   helpers.
3. Read 2-5 representative source/test files yourself.

Then choose the dispatch size:

- **Small/bounded feature** — known module or a few obvious files: skip exploratory fanout
  and use direct reading.
- **Medium/unclear feature** — one area but uncertain patterns: spawn one
  read-only exploratory sub-agent with a combined brief.
- **Broad/cross-cutting feature** — distinct structure, interface, and test
  questions across separate areas: spawn parallel read-only exploratory sub-agents.

For exploratory fanout:
- Use the host's generic/general-purpose subagent prompted with the explorer capsule from `../principles/references/subagents.md`, at medium reasoning by default.
- Use high or strongest reviewer reasoning for large or complex codebases.
- If no generic subagent adapter is available, keep the bounded mapping in the host session.

Possible prompts:
1. **Codebase Structure** — directory layout, modules, entry points, exports
2. **Interface & Type Inventory** — exported interfaces, types, signatures with file paths
3. **Test Structure** — test patterns, helpers, fixtures, organization

After direct reading or Explore results, **read 2-3 key source files yourself**
to verify findings.

### Phase 4: Re-align to project standards

Re-read `AGENTS.md` and `CLAUDE.md` if present at root, `.agents/`, or
`.claude/`, plus `.agents/rules/*.md` (if present) — the project's force-loaded
agent rules (tag semantics, test integrity, review policy). Treat AGENTS as
canonical if they disagree. Recency improves adherence. Confirm your approach
aligns with project conventions.

### Phase 4.5: Resolve design decisions

Identify concrete decisions raised by this feature's requirements, architecture,
scope, integrations, and UX. Ignore points already settled by the brief, parent,
foundation docs, code, or an existing `## Design decisions` section, and defer
safe implementation details. Zero open decisions is valid.

Apply `principles/SKILL.md` Part III exactly: resolve routine, reversible points
with judgment and a logged rationale; reserve structured questions for product
direction, external contracts, and expensive hard-to-reverse choices. Apply
Part IV's risk-driven advisory policy in both direct and autopilot modes; do not
restate reviewer topology here.

Record decisions in the feature body:

```markdown
## Design decisions
- **<decision>**: <choice> — <one-line rationale>
```

When autopilot is the active driver, it never asks; use evidence and the least
irreversible sound choice. Only contradictory state that Part III identifies as
a hard halt blocks advancement.

### Phase 4.6: UI surface fallback (runs when ux-ui-design is installed)

This is the **fallback** mockup tier per `ux-ui-principles`. Epic-design
Phase 4.6 is primary; this phase exists to catch surfaces it didn't cover.

**Inheritance check first.** Read the parent epic body for a `## Mockups`
section and check `.mockups/screens/<this-feature-id>/` and
`.mockups/flows/` for existing mocks. If coverage exists, copy those paths
into this feature's `## Mockups` section and **skip the rest of this
phase**. Do not re-mock.

**Fallback only when upstream coverage is missing** — i.e. there's no
parent epic, the epic body shows a `## UI alignment deferred` note, OR a
genuinely-new surface emerged after epic-design ran. Then:

- **Net-new screen** → `/ux-ui-design:screens <feature-id>`.
- **Multi-screen flow tighter than the feature** → `/ux-ui-design:flows
  <flow-name>` (rare).
- **Minor composition reusing existing patterns** → skip; note the
  feature inherits from `<epic-id>`'s mocks.
- **No UI surface** → skip.

If prominent UI surface is missing both coverage AND a deferred note, the
epic-design tier should have caught it. Proceed with the fallback mock
and flag the discrepancy in the run output.

Skip this phase entirely if `ux-ui-design` is not installed.

### Phase 5: Design the units

The substantive phase. Don't rush.

#### 5a. Architectural options

Name 2-3 plausible high-level approaches:
- One-paragraph description each
- Key tradeoff (what it optimizes for, what it sacrifices)
- Why it might or might not fit this project

Choose one explicitly. State why over the others.

#### 5b. Trickiest unit first

Among the units you'll design, name the one with highest unknowns or most novel
logic. Design it first and most carefully — the rest hangs on whether this is feasible.

#### 5c. Design each unit

For each unit, specify:
- **Exact file path** (e.g., `src/domain/user.ts`, not "the user file")
- **Code showing interfaces, types, and function signatures** in the project's language
- **Implementation notes** for non-obvious logic
- **Acceptance criteria** as testable assertions

Make strong decisions about abstractions, naming, and module boundaries.

#### 5d. Elimination and cleanup pass

Before adding another unit or abstraction, ask what this feature can delete,
inline, consolidate, or make unnecessary in the area it touches. Consider code,
tests, checks, configuration, compatibility paths, and existing abstractions.
Fold safe cohesive cleanup into a unit. Create explicit `[refactor]` or
`[cleanup]` child stories when the cleanup is worthwhile but independently
reviewable; park broader work. If a candidate reduces behavior or guarantees,
record it as a design decision for user confirmation rather than assuming
removal.

### Phase 5.5: Pre-mortem

Before finalizing, attack the design:
- What's the riskiest assumption?
- What would have to be true for this to fail in production?
- What's the fallback if the riskiest unit doesn't work?
- Where am I least sure?

If a serious risk surfaces, revise the design or add a spike unit that validates the
risky assumption first. Document discovered risks in a `## Risks` section in the
feature body.

### Phase 6: Test approach

Design the smallest useful test surface:
- **Interface tests** — important behavior at stable public boundaries and
  cross-unit seams
- **Regression tests** — bugs or demonstrated risks this work must not repeat
- **Unit tests** — only for genuinely complex isolated logic where examples add
  confidence
- **Test removal** — duplicate, tautological, obsolete, or implementation-bound
  tests this change can safely retire
- **Test data** — only fixtures or factories the chosen tests actually need

Do not create a test for every unit, branch, edge, or acceptance statement by
default. State what risk or contract each proposed test protects. Hard-to-test
important behavior may indicate a bad boundary; simple code needing no isolated
test is not itself a design flaw.

### Phase 7: Order and child stories

Specify implementation order — what must exist before what. Decide whether to
spawn child stories or treat the feature itself as the single implementation
unit.

#### When to spawn stories

Stories are **design checkpoints**, not default implementation-agent units.
The parent feature remains the normal ownership, implementation, verification,
and review bundle. Spawn stories when at least one checkpoint materially helps:

- **Non-trivial dependencies.** Story A blocks B blocks C; declaring
  `depends_on:` makes the intended implementation order visible.
- **Multi-session continuity.** A long feature benefits from durable checkpoints
  that show which design elements and acceptance slices are complete.
- **Heterogeneous acceptance.** Different design elements have distinct,
  meaningful verification evidence (for example UI behavior, IPC failures, and
  schema behavior).
- **Decision traceability.** A design element is important enough to preserve as
  a named checkpoint even though one feature worker will usually implement it.

Do not spawn stories merely to manufacture parallel worker targets. The normal
orchestrator baseline is one implementation agent per feature, carrying its
stories as checkpoints. Only an unusually large feature should split across
multiple coherent write-ownership bundles; story boundaries may inform that
split but do not define one worker each.

#### When stories are pure overhead

Skip stories when **all** of these hold:

- Retroactive capture of already-done work (if the work is already done, just
  land it under the feature)
- Single-stride implementation with no useful intermediate checkpoint
- Tight cohesion (the acceptance evidence and implementation cannot be
  meaningfully separated)
- The natural decomposition is just "frontend / backend" or another package
  boundary with no distinct design checkpoint

#### Spawning a story

For each child story to spawn:
- Create `.work/active/stories/<feature-id>-<story-slug>.md`
- Frontmatter: `kind: story`, `stage: implementing`, `parent: <feature-id>`,
  `depends_on: [...]` (declare which sibling checkpoints must finish first)
- Body: the design element/checkpoint, its acceptance evidence, and any ordering
  constraints. Do not describe it as an agent assignment.

Cycle check: run `.work/bin/work-view --blocking <story-id>` before adding any
`depends_on` entry.

### Phase 8: Write design INTO the feature body

Update the feature file. Append (after the existing brief) sections like:

```markdown
## Architectural choice
<chosen approach + rationale>

## Implementation Units

### Unit N: <name>
**File**: `src/path/to/file.ext`
**Story**: `<story-id>` (if spawned as a separate story)

\`\`\`<lang>
// Exact interfaces, types, signatures
\`\`\`

**Implementation Notes**:
- <key detail>

**Acceptance Criteria**:
- [ ] <testable assertion>

---

## Implementation Order
1. <unit / story>
2. <unit / story>

## Simplification
- <code/tests/checks/abstractions removed, consolidated, or intentionally retained>
- <cleanup/refactor stories, if any>

## Testing
- <interface, regression, or complex-unit tests and the value each protects>
- <low-value tests to remove, if any>

## Risks
<from pre-mortem, if any>
```

### Phase 9: Advance stage and commit

1. Edit the feature file's frontmatter: `stage: drafting → implementing`. The
   PostToolUse hook auto-bumps `updated:`.
2. Commit:
   ```bash
   git add .work/active/features/<id>.md .work/active/stories/<feature-id>-*.md
   git commit -m "feature-design: <feature-id> (<N> child stories)"
   ```

## Output (default mode)

(For `--only-questions` mode output, see the section above.)

In conversation:
- **Designed**: `<feature-id>` advanced to `stage: implementing`
- **Child stories**: list with `depends_on` chains
- **Implementation order**: 1, 2, 3, ...
- **Risks flagged**: list (or "none")
- **Next**: `/agile-workflow:implement-orchestrator <feature-id>` for the normal
  one-agent feature bundle, or `/agile-workflow:implement <feature-id>` when the
  current host should keep the cohesive delivery inline. Split an unusually
  large feature only when write ownership and dependencies justify it.

## Guardrails

- The design lives in the feature's body. NEVER create `docs/designs/<name>.md` —
  that's a workflow-plugin pattern; agile-workflow uses item-IS-the-work.
- **UI/UX mockups are FALLBACK here.** Check the parent epic body for
  `## Mockups` first; reference and skip. Only mock at this tier for
  genuinely-new surfaces the parent epic didn't cover, and flag the
  upstream gap rather than silently back-filling.
- Specify types and signatures EXACTLY. Vague descriptions become guesses during
  implementation, and guesses become bugs.
- Design error handling explicitly. Undesigned error paths are the #1 source of
  production surprises.
- Build on existing patterns in the codebase — consistency reduces cognitive load.
- Cycle prevention is mandatory for `depends_on`. Use `work-view --blocking`.
- Don't pre-populate stage on child stories beyond `implementing`. Stage advances
  through actual work, not at design time.
- `--only-questions` mode never advances stage, never spawns stories, and never
  writes design content beyond the `## Design decisions` section. If you find
  yourself doing any of those, you're in the wrong mode.
- `--only-questions` is interactive-only — refuse to run when an active
  autopilot run or harness goal is driving the session.
