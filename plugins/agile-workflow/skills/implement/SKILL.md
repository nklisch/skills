---
name: implement
description: >
  ALWAYS invoke this skill when the user explicitly asks to implement a substrate item inline, when
  the work is cohesive enough for one owner, or when the deliverable is no-code prose (a [prose]
  item of any size that needs no coordination). Inline implementation of an item at
  stage:implementing. Reads the design in the item body, implements and verifies it, records the
  chosen execution capability, advances child stories directly to done, and reviews standalone
  stories or features unless the caller requests stop-at-review. Prefer /agile-workflow:implement-orchestrator when ownership, sequencing, or
  uncertainty makes delegated coordination useful. Triggers on "implement this inline", "implement
  this item inline", "just do it inline", or a focused explicit delivery.
---

# Implement

You implement a substrate item — feature or story at `stage: implementing` — by
reading the design embedded in its body and writing code that conforms. The item
file is your spec. When the item is a feature, its child stories are design and
acceptance checkpoints inside the same default ownership bundle, not separate
agent assignments. The item body is also your scratchpad: you add implementation
notes there as you work.

## Trigger

`/agile-workflow:implement-orchestrator` is the default routing for implementation
that benefits from coordination. This skill is the **inline alternative** — the
same lifecycle, owned by the current agent without implementation fan-out.
Choose between them from cohesion, ownership, sequencing, and uncertainty:

- Prefer inline when one owner can carry a cohesive feature and its story
  checkpoints end to end, a handoff would lose useful context, or the caller
  explicitly requests inline execution.
- Prefer the orchestrator for multiple features or when an unusually large
  feature has independent ownership surfaces, dependency-driven sequencing,
  useful parallelism, or enough uncertainty that isolated workers improve
  delivery. Do not route one worker per story by default.
- Tiny changes (roughly tens of lines or a couple of files) are a useful hint
  toward inline execution, never a routing gate.
- **No-code prose** (`[prose]`) qualifies for inline execution on
  **no-coordination** grounds regardless of length. Prose is never routed to the
  orchestrator merely because it is long.

Common phrases:
- "implement story X", "implement this feature"
- "let's code feature Y"
- "the design is ready, start building"
- "just do it inline"

## Workflow

### Phase 1: Ground yourself

The principles skill auto-loads (both code-design and substrate-execution paradigms
active during implementation).

Read:
1. **The item file** at `.work/active/{features,stories}/<id>.md` — this is your
   spec. The design is in there. Note whether `tags:` contains `prose`; that switches the
   workflow into prose mode below.
2. **The parent feature** if implementing a story, or **all child-story
   checkpoints** if implementing a feature. The feature owns the integrated
   implementation and review boundary; its stories supply ordering and acceptance
   evidence.
3. **Foundation docs** referenced by the design: `docs/SPEC.md`, `docs/ARCHITECTURE.md`
4. `AGENTS.md` and `CLAUDE.md` (root, `.agents/`, or `.claude/`) for project
   conventions. Treat AGENTS as canonical if they disagree.
4a. `.agents/rules/*.md` (if present) — the project's force-loaded agent rules
   (tag semantics, test integrity, review policy)
5. **Research docs** referenced by the design: `docs/research/<topic>.md` if any
6. **Existing source code** the design references — verify interfaces, signatures,
   module paths

### Phase 2: Verify dependency readiness

If the item has `depends_on`, run:

```bash
.work/bin/work-view --scope all --stage review --paths
.work/bin/work-view --scope all --stage done --paths
.work/bin/work-view --scope all --stage released --paths
```

Treat the union as implementation-complete (release/archive tiers are terminal
regardless of stage, so also inspect any named dependency found there). Confirm every entry in `depends_on` has completed verified implementation:
active at `stage: review` or `done`, or resident in releases/archive. Review may
still be pending; that does not block this implementation layer.

If any dep has not reached one of those states, append a one-line note to the
item body and return without advancing:

> Skipped: depends_on `<dep-id>` has not completed implementation (stage:`<x>`).

Autopilot pre-filters via `work-view --ready` so this should rarely fire under
autopilot. Interactive callers will see the note and can choose to fix the
dep or remove it.

### Phase 2.5: Choose delivery mode and capability

If the item carries `tags: [prose]`, use **prose mode** for the rest of this skill:

- Treat the item body as a writing brief, not a code design.
- Treat the target docs, rules, conventions, copy, or research write-up as the integration surface.
- Skip source-code mapping and build/test assumptions unless the prose claim depends on a code fact
  or the repo has explicit docs checks.
- Do not spawn an exploratory sub-agent just to map code. Use a read-only sub-agent only when the
  document's factual basis is broad enough that local reading leaves named unknowns.

For non-prose items, continue in code mode.

For either mode, select execution capability from the item's risk and scope
unless the caller, a stable project convention, or an autopilot caller note
overrides it. Do not ask a routine model-tier question. Also resolve the
effective `review_weight`: explicit caller override, then project convention,
otherwise `standard`. Record both choices in Phase 7; the principles and review
skills own the weight matrix.

### Phase 3: Map integration points

For `[prose]` items, map prose integration points instead:

- list the target docs/rules/copy files named by the brief
- read nearby sections for terminology, tone, and current conventions
- verify any concrete API, command, path, or behavior claim against the repo before writing it
- check for duplicate or conflicting guidance in `AGENTS.md`, `.agents/rules/*.md`, docs, and skill
  references

Then skip to Phase 6 in prose mode.

Start with a local scope-size probe using Read/Glob/Grep:

- list the files named by the design
- search for public exports, shared utilities, type definitions, and module
  boundaries in the target area
- search for matching test helpers and fixtures
- read the 1-3 files most likely to define the integration contract

If this answers the integration question, skip exploratory fanout and continue. Inline
implementation is often chosen because the scope is small enough for direct
reading.

Spawn one read-only exploratory sub-agent only when the integration surface is still
unclear or broader than a few obvious files:
- Use the host's generic/general-purpose subagent prompted with the explorer capsule from `../principles/references/subagents.md`, at medium reasoning by default.
- Use high or strongest reviewer reasoning for large or complex codebases.
- If no generic subagent adapter is available, keep the bounded mapping in the host session.
- For the dynamic explorer prompt posture, load
  `../principles/references/subagents.md`; do not assume named agile-workflow
  roles are installed.

Brief:
- "Find all public exports, shared utilities, type definitions, and module
  boundaries that <new code area> must integrate with. Include file paths and
  signatures. Also check for existing test helpers and fixtures."

After direct reading or Explore results, **spot-check 1-2 key integration
points** by reading those files yourself.

### Phase 4: Plan and reconcile design vs reality

For each file the design says to modify or depend on:
- Confirm the file exists at the path the design specifies
- Confirm interfaces, types, signatures match the design's expectations
- Note any discrepancies — the design captured intent at design time; the repo is
  current ground truth

Reconcile silently if changes are minor and obvious. Surface significant discrepancies
in the implementation notes you'll write in Phase 7.

#### Phase 4a: Detect "code already exists" (land mode)

Check if the implementation already exists in the working tree (typical for
items captured retroactively by `convert` Phase 8.5 or manual scope).
Signals: a "Files in this cluster" list in the body, a retroactive-capture
note, sparse design with concrete file paths matching `git status`. Two or
more signals → land mode.

In land mode:
1. Read the existing code; update the body's design section to reflect
   as-built reality (paths, interfaces, signatures).
2. Validate — typecheck, lint, tests scoped to touched packages
   (`pnpm --filter`, `cargo -p`, `pytest <path>`).
3. Fill high-value test gaps at stable interfaces, for complex logic, or for
   demonstrated regressions; remove obsolete or low-value tests exposed by the work.
4. Skip Phase 6 (no new code) and go straight to Phase 7 (notes — log
   "Land mode" explicitly), Phase 8 (verify), Phase 9 (commit + advance).

### Phase 5: Re-align to project standards

Re-read `AGENTS.md` and `CLAUDE.md` if present at root, `.agents/`, or
`.claude/`, plus `.agents/rules/*.md` (if present) — the project's force-loaded
agent rules (tag semantics, test integrity, review policy). Treat AGENTS as
canonical when they disagree. Recency improves adherence.

### Phase 6: Implement

For `[prose]` items:
1. Write the requested prose deliverable in the target file(s), preserving surrounding structure,
   markers, and ownership boundaries.
2. Keep statements current-state oriented. Do not add history narratives unless the target file is
   explicitly historical.
3. Remove or reconcile obsolete duplicate wording when the brief requires a single source of truth.
4. Verify links, commands, file paths, skill names, and frontmatter examples against the repo.
5. Do not run unrelated code builds solely because the repository has one.

For code items:

For each unit/file in the item's design:
1. Write the code following the design's specifications — exact types, signatures,
   contracts
2. Apply established patterns from the codebase without adding speculative layers
3. Handle the error paths and guarantees the design actually requires
4. Write tests only where they protect an important interface, complex unit, or
   demonstrated regression; remove low-value tests the change makes obsolete
5. Update module exports (index files) so new code integrates cleanly
6. Run an elimination pass over the touched area: delete, inline, or consolidate
   code, checks, abstractions, compatibility paths, and test machinery made
   unnecessary by the implementation

Safe behavior-preserving cleanup that is cohesive with the touched code is part
of the task. Park larger or unrelated cleanup, and stop for a design decision
before weakening behavior, guarantees, validation, compatibility, or safety.
Prefer short, direct, readable code over a generalized framework.

### Phase 7: Update item body with implementation notes

Append (or update) an "Implementation notes" section in the item's body:

```markdown
## Implementation notes
- Execution capability: <choice and brief risk/scope rationale>
- Review weight: <effective value and source: caller, project, or default>
- Files changed: <list>
- Tests added/removed: <list and the interface, complexity, or regression value>
- Simplification: <code, checks, abstractions, or compatibility paths removed/consolidated>
- Discrepancies from design: <list with one-line explanation each, or "none">
- Adjacent issues parked: <list of backlog ids if any, or "none">
```

This is part of the rolling record of the item — a future agent reading this file
should see the design AND what actually happened.

### Phase 8: Self-verify

For `[prose]` items:
1. Proofread the changed text in context.
2. Run markdown/docs checks if the repo defines them.
3. Verify every concrete path, command, skill name, and version claim touched by the prose.
4. Walk through each acceptance criterion in the item body and confirm it is met.

For code items:

1. Run the build command from `AGENTS.md` / `CLAUDE.md`
2. Run the test command — all tests including new ones must pass
3. Walk through each acceptance criterion in the item body — confirm each is met
4. If any gap, fix or report

Don't claim done if tests don't pass. A known gap reported is better than a hidden one.

#### Test integrity

Follow the project's test-integrity rules and the worker posture in
`../principles/references/subagents.md`: fix bad tests in-session, park real
production bugs, and never game a test to make it pass.

### Phase 9: Commit and complete the lifecycle

Branch by item kind after Phase 8 is green.

#### Story

First inspect `parent`:

- **Child story (`parent: <feature-id>`)** — edit the story directly from
  `implementing → done`. Child stories are checkpoints and never receive review.
  Commit implementation and evidence with `implement: <id>`. When all siblings
  are `done`, verify the integrated feature, advance the feature to `review` in
  its own commit, and invoke feature review unless `stop-at-review` applies.
- **Standalone story (`parent: null`)** — edit the story from `implementing →
  review` and commit implementation with `implement: <id>`. Invoke
  `/agile-workflow:review <id>` in the same run unless `stop-at-review` applies.
  The standalone-story lane is bounded and inline: never use an independent,
  fresh-context, or cross-model reviewer.

A `stop-at-review` request can leave a standalone story or feature at review; it
never leaves a child story there.

#### Feature

1. If the feature has child stories, mark each satisfied checkpoint directly
   `done` with its own evidence and commit the code belonging to that checkpoint.
   Do not advance the feature until all child stories are `done`.
2. Edit the feature frontmatter `stage: implementing → review`, append integrated
   verification evidence, and commit the feature transition separately. Include
   source changes only when the feature has no child checkpoints or when a final
   integration change belongs to the feature rather than an already-committed
   story:
   ```bash
   git add .work/active/features/<id>.md <uncommitted-integration-files>
   git commit -m "implement: <id>"
   ```
3. Unless the caller explicitly requested a feature-level `stop-at-review` or a
   project convention sets that boundary, invoke `/agile-workflow:review <id>`
   in the same invocation and forward the effective `review_weight`. Under the
   default `standard`, review runs one independent pass, the receiver fixes and
   verifies accepted blockers, and the feature finishes without re-review.
   `thorough` and `maximum` instead continue review → fix → verify passes until a
   pass yields no receiver-confirmed material current-cycle blockers; the
   receiver parks or notes smaller findings rather than prolonging the loop.

A weight of `none` skips an independent reviewer, but feature review still
requires green integrated verification and acceptance evidence before
administrative closure. Epic scope and deep lenses never silently escalate
`standard` beyond its single pass.

## Output

In conversation:
- **Implemented**: child story `<id>` advanced directly to `stage: done`;
  standalone story or feature `<id>` advanced to `stage: done`, left at
  `stage: review` by explicit override, or returned to `stage: implementing`
- **Review**: feature or bounded standalone-story verdict, blocker, or "not
  applicable — child story checkpoint"
- **Files changed**: list
- **Tests added**: list
- **Execution capability**: choice and rationale
- **Review weight**: effective value and source
- **Discrepancies from design**: list (or "none")
- **Adjacent issues parked**: backlog ids (or "none")

## Guardrails

- The item file is your spec. If it conflicts with the repo, trust the repo's
  reality and note the discrepancy in implementation notes.
- The design's INTENT is your north star. The repo's INTERFACES are your reality.
  When they disagree, adapt the implementation, document the why.
- Implement fully or report a blocker. NEVER leave TODO comments or `unimplemented!`.
- Don't add unrequested features. Adapt to repo reality freely; expand scope never.
- Child stories never enter `review`; green verification advances them directly
  to `done`.
- Standalone stories enter bounded inline review, but never receive independent,
  fresh-context, or cross-model review.
- Features enter normal review; do not self-approve there. Invoke the feature
  review lane and honor its verdict.
- If you discover a genuine design flaw, don't muscle through. Append a
  `## Implementation discovery` section, set stage back to `drafting`, and
  return. The design family will pick it up on the next pass.
- Safe, cohesive simplification in the touched area belongs in the task. Park
  larger, unrelated, or behavior-changing opportunities instead of silently
  expanding scope.
- Test integrity is non-negotiable: follow the project rules and worker posture;
  fix bad tests, park real production bugs, and never game tests.
