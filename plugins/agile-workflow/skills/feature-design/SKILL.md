---
name: feature-design
description: >
  ALWAYS invoke when the user asks to design or flesh out a feature at
  stage:drafting; do not write design prose inline. Designs the feature inside
  its agile-workflow item body, grounded in foundation docs and code, then
  spawns child stories with depends_on chains and advances drafting ->
  implementing. Use for greenfield features without [refactor] or [perf] tags;
  route [refactor] to refactor-design, [perf] to perf-design, and epic
  decomposition to epic-design. UI/UX mockups are fallback here, inherited from
  the parent epic when available.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Task, AskUserQuestion
---

# Feature-Design

You design a feature in the agile-workflow substrate. The design lives in the
feature item's body — there is no separate `docs/designs/<name>.md`. As the design
takes shape, child stories are spawned with declared `depends_on` chains. When the
design is done, you advance the feature's stage `drafting → implementing`.

This skill is the feature-level entry point in the design family. The family
routes by item kind and tags:
- `epic-design` — `kind: epic` at `stage: drafting` (decomposes into features)
- `feature-design` (this skill) — `kind: feature`, no specialized tag
- `refactor-design` — `kind: feature` with `tags: [refactor]`
- `perf-design` — `kind: feature` with `tags: [perf]`
- `prose-author` — `kind: feature` with `tags: [prose]` (no-code-surface work —
  the authoring lane, not a design step: brief-as-design, no Explore / pre-mortem / question gate)

If the feature you're looking at has `[refactor]`, `[perf]`, or `[prose]` in
`tags`, you were misrouted. Don't try to design it — log a one-line note to the
item body ("Misrouted to feature-design; should have gone to refactor-design /
perf-design / prose-author based on tags") and return without advancing the
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
| `--only-questions --all` | Question-only pass over every `kind: feature` at `stage: drafting` in `.work/active/features/` whose `tags` does not contain `refactor`, `perf`, or `prose`. Iterate in dependency order (features with fewer unresolved upstream deps first). |

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
     `tags` contains `refactor`, `perf`, or `prose`. Log the skip and move on.
2. **Ground yourself** — read the parent epic body if `parent` is set, plus
   the foundation docs (`docs/VISION.md`, `docs/SPEC.md`,
   `docs/ARCHITECTURE.md`) and `AGENTS.md` / `CLAUDE.md`. Treat AGENTS as
   canonical when both exist. Be efficient: skim, don't exhaustively re-read
   across iterations within one session.
3. **Map the codebase lightly** — start with direct Read/Glob/Grep over the
   obvious area. Use one Task-tool Explore sub-agent only if local reading
   leaves a real unknown; skip the full three-agent parallel sweep used in
   the default mode because you're not designing units.
4. **Run Phase 4.6 (UI surface fallback)** when `ux-ui-design` is installed
   — same rules as default mode (inheritance check, mock only when
   upstream coverage is missing). Most ask-questions runs find the parent
   epic already mocked and skip here.
5. **Surface ambiguities** — run Phase 4.5 as written above, but always in
   the interactive branch (use `AskUserQuestion`). Do not resolve with
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
- `tags` does NOT include `refactor`, `perf`, or `prose` (otherwise log a
  misroute note and return without advancing — see the description block above)

The body should already have a brief from `scope`. Use it as the seed for design.

### Phase 2: Ground yourself

The principles skill auto-loads — both code-design (Ports & Adapters, SSOT,
Generated Contracts, Fail Fast) and substrate-execution (Item-IS-the-Work,
Rolling-Foundation, Late-Binding) are active.

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

Run a read-first scope-size probe before spawning Explore agents:

1. Use Glob/`rg --files` to identify likely directories, entry points, and
   existing tests.
2. Use Grep/`rg` for feature terms, route names, exported types, and nearby
   helpers.
3. Read 2-5 representative source/test files yourself.

Then choose the dispatch size:

- **Small/bounded feature** — known module or a few obvious files: skip Explore
  and use direct reading.
- **Medium/unclear feature** — one area but uncertain patterns: spawn one
  read-only Explore agent with a combined brief.
- **Broad/cross-cutting feature** — distinct structure, interface, and test
  questions across separate areas: spawn parallel read-only Explore sub-agents.

For Explore:
- **Claude Code / Anthropic:** Task/Explore with Sonnet minimum, Opus for large
  or complex codebases.
- **Codex / OpenAI:** `explorer` sub-agents with `reasoning_effort: medium`;
  use `high` for large or complex codebases.
- **Pi path:** use native Pi `scout` or `context-builder` subagents for
  read-only mapping when hosted in Pi and available; otherwise keep direct
  host-local mapping.

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

### Phase 4.5: Surface ambiguities

Read the feature brief and the design space you've started to map, and
derive specific, concrete design questions about *this* feature's actual
work — requirements gaps, architecture trade-offs, scope boundaries,
integration assumptions, UX decisions. The questions must come from the
feature in front of you; examples of the *shape* only:

- "Should the cache invalidate on write or rely on TTL only?"
- "Does the upload accept multipart, or a presigned URL flow?"
- "When the parser hits a malformed row, do we skip and continue or fail
  the whole batch?"
- "Is paging cursor-based or offset-based?"

Skip anything the brief, parent epic body, foundation docs, or codebase
already pin. Skip anything that's safely an implementation-time call.

Aim for the smallest set of questions that meaningfully resolve direction
— typically 2-5. Zero is fine if everything's already pinned.

**Cross-model advisory review under autopilot.** If this skill is running as a
delegation from active autopilot, the feature has large/risky architectural
decisions, and the body does not already contain useful `## Design decisions`
from a prior `--only-questions` pass, apply the cross-model advisory review
policy from `principles/SKILL.md` before resolving the questions yourself.

Use one focused `peer` pass only when a different model class is available.
Ask for missing questions, risks, ambiguous constraints, and alternatives for
this feature's design — not for a final verdict. Do not run the multi-pass
`peer-review` loop during routine autopilot design. If peeragent is
unavailable, the peer would use the same model class, or the invocation fails,
continue with host judgment and note that the advisory pass was skipped.
If the peeragent target is Claude Opus, allow 10 to 30 minutes for a large
review; no return after a few minutes is not evidence that it has hung.

Summarize the useful output under `## Other agent review` in the feature body
and fold accepted questions/risks into the decisions you log. Do not paste the
peer transcript into the item.

If this skill is running **as a delegation from an active autopilot run or
harness goal**, resolve each question with judgment (prioritize: consistent
with foundation docs > simpler option > defers irreversible decisions) and log
under `## Design decisions` in the body:

```markdown
## Design decisions
- **<question>**: <choice> — <one-line rationale>
```

If the body already contains a `## Design decisions` section (from a prior
`--only-questions` pass or from `epic-design` Phase 4.7), treat those
locked-in answers as inputs — do NOT re-ask them.

In every other invocation — including direct user invocation under harness
auto mode (`permissions.defaultMode: "auto"`) — ask the user via
`AskUserQuestion` before locking in. Harness-level "work without pausing"
reminders do **not** suppress these checkpoints. See `principles/SKILL.md`
Part III for the full caller-awareness rule.

The exception under autopilot: a 50/50 between two large irreversible choices
(e.g., SQL vs document store). Append a `## Blocker` section and return
without advancing — autopilot will skip and surface the blocker.

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

For each unit, design:
- **Unit tests** — behaviors to verify, edge cases, error paths
- **Integration points** — where does this unit meet other units; what tests prove the seams
- **Test data** — fixtures, factories, seed data needed

If a unit is hard to test, the design is probably wrong. Note it and revise.

### Phase 7: Order and child stories

Specify implementation order — what must exist before what. Decide whether to
spawn child stories or treat the feature itself as the single implementation
unit.

#### When to spawn stories

Stories pay for themselves when **at least one** of these is true:

- **Parallelizable.** Three or more chunks can be implemented by independent
  agents simultaneously — `/agile-workflow:implement-orchestrator` wants
  stories so it has fan-out targets.
- **Non-trivial dependencies.** Story A blocks B blocks C; declaring
  `depends_on:` at the story level makes the chain visible without reading
  the full design body.
- **Multi-session work.** A feature that won't fit in one stride needs
  resume points. A story file gives a fresh agent a smaller surface to
  absorb than the entire feature design.
- **Heterogeneous acceptance.** Different chunks have different test
  surfaces (UI works / IPC errors / DB schema). Gates score per-story
  rather than per-feature, which is cleaner when the surfaces are genuinely
  different.

#### When stories are pure overhead

Skip stories when **all** of these hold:

- Retroactive capture of already-done work (stories are forward-looking
  containers; if the work is already done, just land it under the feature)
- Single-stride implementation (one session can finish the whole feature)
- Tight cohesion (every test exercises every code path; the chunks aren't
  meaningfully independent)
- The natural decomposition is just "frontend / backend" — that's the
  package boundary, not stories

#### Spawning a story

For each child story to spawn:
- Create `.work/active/stories/<feature-id>-<story-slug>.md`
- Frontmatter: `kind: story`, `stage: implementing`, `parent: <feature-id>`,
  `depends_on: [...]` (declare which sibling stories must finish first)
- Body: scope of this story, the unit(s) it implements, acceptance criteria

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

## Testing
### Unit Tests: `tests/path/<name>.test.ext`
<test approach for each unit>

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
- **Next**: `/agile-workflow:implement <story-id>` for sequential, or
  `/agile-workflow:implement-orchestrator <feature-id>` for parallel agents over
  the dependency graph

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
