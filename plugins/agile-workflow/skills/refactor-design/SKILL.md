---
name: refactor-design
description: >
  ALWAYS invoke this skill when the user asks to scan for refactor opportunities, plan
  a refactor, or design a [refactor]-tagged feature — do not start restructuring code
  inline. Two modes. Discovery mode (default with no arg, `--all`, `<path>`, or
  `<NL scope>`) scans code for smells (duplication, long files, deep nesting, god
  functions, leaky abstractions, dead weight), classifies findings as pure-refactor or
  behavior-changing, and emits substrate items — pure-refactor findings get
  `[refactor]` tag; behavior changers get no tag so feature-design picks them up.
  Per-feature mode (default when given a feature id) plans the refactor for an
  existing `[refactor]`-tagged feature at stage:drafting, written INTO the feature's
  body, with child stories and depends_on chains, then advances stage drafting ->
  implementing. For greenfield design use /agile-workflow:feature-design; for perf use
  /agile-workflow:perf-design; for architectural reconceptions use
  /agile-workflow:bold-refactor. Triggers on "find refactor opportunities", "scan for
  smells", "design this refactor", "let's refactor", "refactor <path>".
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Task
---

# Refactor-Design

You plan a refactor for a feature tagged `[refactor]` at `stage: drafting` in the
agile-workflow substrate. The plan lives in the feature item's body, structured as
discrete refactor steps with current/target states, risk assessments, and rollback
paths. Each step that warrants its own implementation pass becomes a child story.

A refactor preserves behavior. If you find yourself adding capability, that's not a
refactor — escalate via `/agile-workflow:scope` to add a feature without `[refactor]`
tag instead.

## Trigger

The agent picks this skill in two cases:
- A feature at `stage: drafting` with `tags: [refactor, ...]` is ready for design (per-feature mode)
- The user asks to find refactor candidates ("audit for cruft", "what should we clean up", "find refactor candidates") (discovery mode)

Common phrases:
- per-feature: "design the refactor of X", "plan the refactor for feature Y"
- discovery: "find refactor candidates", "scan for cruft", "what should we clean up here"

## Invocation modes

| Invocation | Behavior |
|---|---|
| `refactor-design` (no arg) / `--all` | **Discovery mode**: sweep the whole codebase for refactor candidates, emit items |
| `refactor-design <path>` | Discovery mode scoped to a path |
| `refactor-design <NL scope>` (e.g. "the auth module") | Discovery mode scoped by NL filter |
| `refactor-design <feature-id>` | **Per-feature mode**: design the refactor for an existing `[refactor]`-tagged feature at `stage: drafting` |
| `refactor-design --only-questions <id>` / `--only-questions --all` | Question-only alignment pass over `[refactor]`-tagged drafting features. Mirrors feature-design's `--only-questions` mode — surfaces ambiguities, captures answers under `## Design decisions`, does NOT design or advance stage. Requires interactive mode. |

Disambiguation: an arg is treated as a feature id only if
`.work/active/features/<arg>.md` exists and has `tags: [refactor]`. Otherwise
discovery mode against the arg as path or NL scope.

## Workflow — discovery mode

Use this path for `refactor-design`, `--all`, `<path>`, or `<NL scope>`. Goal:
scan the target, classify findings, emit items so the substrate can drain
them.

### Phase D1: Resolve scope

- no arg / `--all` → whole codebase
- `<path>` → that directory or file
- `<NL scope>` → interpret against the codebase structure; log the interpretation

### Phase D2: Ground yourself

Read `docs/VISION.md`, `docs/SPEC.md`, `docs/ARCHITECTURE.md`, `CLAUDE.md`, and
`.work/CONVENTIONS.md`. One pass — orient, don't memorize.

### Phase D3: Code-smell scan via parallel Task agents

Run the same parallel sub-agent scan as Phase 3 of per-feature mode (Code
Smells, Missing Abstractions, Pattern Violations & Naming Inconsistencies,
Dead Weight) but scoped to the target from Phase D1 instead of one feature's
area. After results, read 2-3 key files yourself to verify.

### Phase D4: Classify each finding

Each finding is either:

- **Pure refactor** — behavior-preserving. Examples: extract helper to dedupe,
  split god file, rename for clarity, dead code removal.
- **Behavior-changing** — adds capability, fixes a bug, alters semantics.
  Examples: handling an unhandled error case discovered mid-scan, replacing a
  silent failure with explicit reporting, splitting a function in a way that
  changes call-site contracts.

If unclear, default to behavior-changing — feature-design will refine the
classification at its own pass.

### Phase D5: Decide item size per finding

| Finding shape | Item kind | Stage |
|---|---|---|
| Single-file, surgical, no design needed | story | `implementing` |
| Multi-file or needs a design pass | feature | `drafting` |
| Cohesive cluster of 3+ findings in one area | feature | `drafting` (group findings as child stories of one feature) |

For pure-refactor findings, tag `[refactor]`. For behavior-changing findings,
omit the `[refactor]` tag — let feature-design handle them.

### Phase D6: Emit items and commit

For each finding (or cluster), write the item file with brief + file:line
references + one-line rationale. Set `gate_origin: refactor-design` for trace.
Cycle-check `depends_on` if any.

Commit per batch:
```bash
git add .work/active/stories/ .work/active/features/
git commit -m "refactor-design discovery: <N> findings (<M> pure-refactor, <K> behavior-changing)"
```

### Phase D7: Output

In conversation:
- **Scope**: how the target was interpreted
- **Findings**: count by classification (pure-refactor vs behavior-changing)
- **Items emitted**: counts by kind (story / feature) with new ids
- **Next**: `/agile-workflow:scope` (batch mode) to cluster further, or
  `/agile-workflow:autopilot` to drain. Behavior-changing items will route to
  feature-design when their stage advances.

## Workflow — `--only-questions` mode

Mirrors `feature-design`'s `--only-questions` mode, scoped to `[refactor]`-tagged
drafting features. Iterate over the target set:

1. Read the feature; skip if not `[refactor]`-tagged or not at `stage: drafting`
2. Light ground (foundation docs + CLAUDE.md)
3. One Task Explore over the feature's area
4. Surface strategic ambiguities specific to the refactor (e.g., "preserve API
   shape or break consumers?", "in-place or shadow-then-swap?", "rollback
   strategy when atomic?"). Use AskUserQuestion.
5. Capture answers under `## Design decisions` in the feature body
6. Do NOT design or advance stage — let the design family pick up later
7. Commit per feature: `refactor-design --only-questions: <id>`

Requires interactive mode; refuse to run under autopilot.

## Workflow — per-feature mode

### Phase 1: Read the feature item

Read `.work/active/features/<id>.md`. Confirm:
- `kind: feature`
- `stage: drafting`
- `tags` includes `refactor`

The brief should describe what's being refactored and why. Use it as input.

### Phase 2: Ground yourself

The principles skill auto-loads. Read:
- `docs/VISION.md`, `docs/SPEC.md`, `docs/ARCHITECTURE.md` (refactor must not
  violate spec constraints)
- `CLAUDE.md`
- The parent epic if `parent` is set
- The code under refactor — read it thoroughly, don't refactor blind

### Phase 3: Code-smell scan via parallel Task agents

Use the **Task tool** to spawn parallel Explore sub-agents (sonnet minimum). Send
all in one message; wait for all.

1. **Code Smells** — "Find code that smells off in <area>. Look for: duplicated
   logic across files; long files (>500 lines); deep nesting (>4 levels); god
   functions (>100 lines doing multiple distinct things); god modules (>15
   methods or multiple responsibilities); leaky abstractions (consumers reaching
   past a module's public API). Report each with file:line and a one-line
   explanation."

2. **Missing Abstractions** — "Find places where multiple modules implement
   similar logic that could be extracted. Report each with file:line references
   and which modules would benefit."

3. **Pattern Violations & Naming Inconsistencies** — "Read `.claude/skills/patterns/*.md`
   if they exist. Find code that deviates from established patterns. Report
   naming inconsistencies — same concept named differently across modules. Report
   each with file:line."

4. **Dead Weight** — "Find dead code: unused exports (cross-check against grep
   for importers), commented-out blocks, TODO/FIXME where the work is clearly
   already done, files with very few callers. Report each with file:line."

After results, **read 2-3 key files yourself** to verify findings.

### Phase 4: Categorize findings

Sort the findings into:
- **High value** — reduces duplication, extracts shared abstractions, consolidates
  similar code
- **Medium value** — improves consistency, aligns with established patterns
- **Low value** — minor structural improvements

Each refactor step you plan must articulate the value. If you can't articulate the
payoff, drop the step.

### Phase 5: Design refactor steps

For each step, specify:
- **Step name and value tier** (High / Medium / Low)
- **Files affected**: paths
- **Current state**: actual code showing what exists now
- **Target state**: exact code showing what it should look like after
- **Implementation notes**: how to get from current to target; non-obvious considerations
- **Acceptance criteria**: build passes, tests pass, plus specific structural/behavioral
  check
- **Risk**: Low / Medium / High — what could go wrong
- **Rollback**: how to revert this step if it breaks something

**Step independence rule**: each step should be applicable, buildable, testable, and
committable in isolation. If a step bundles multiple unrelated refactors, split
them — when one breaks, you want to roll back only that change, not lose every
unrelated improvement bundled with it.

**Atomic-step acknowledgment**: some refactors are inherently atomic (renaming a public
API, schema migrations, contract changes). Acknowledge irreversibility explicitly and,
where possible, stage behind feature flags or migration scripts.

### Phase 6: Spawn child stories

Each significant refactor step that warrants its own implementation pass becomes a
child story:
- `.work/active/stories/<feature-id>-step-<N>.md`
- `kind: story`, `stage: implementing`, `parent: <feature-id>`,
  `tags: [refactor]`, `depends_on: [...]` (chain in step order)
- Body: the step's current/target/notes/acceptance/risk/rollback content

Cycle check via `.work/bin/work-view --blocking` before writing any `depends_on`.

For trivial single-file refactors that fit in one inline pass, skip child stories.

### Phase 7: Write plan INTO feature body

Append to the feature file's body:

```markdown
## Refactor Overview
<key problems found, summary of proposed steps>

## Refactor Steps

### Step 1: <name>
**Priority**: High/Medium/Low
**Risk**: Low/Medium/High
**Files**: `src/path/file.ext`, ...
**Story**: `<story-id>` (if spawned)

**Current State**:
\`\`\`<lang>
// Actual code now
\`\`\`

**Target State**:
\`\`\`<lang>
// Exact code after
\`\`\`

**Implementation Notes**:
- <how to get from current to target>

**Acceptance Criteria**:
- [ ] Build passes
- [ ] Tests pass
- [ ] <specific structural/behavioral check>

**Rollback**: <how to revert if needed>

---

### Step 2: <name>
...

## Implementation Order
1. <step / story>
2. <step / story>
```

### Phase 8: Advance stage and commit

1. Update feature frontmatter: `stage: drafting → implementing`. PostToolUse hook
   bumps `updated:`.
2. Commit:
   ```bash
   git add .work/active/features/<id>.md .work/active/stories/<feature-id>-step-*.md
   git commit -m "refactor-design: <feature-id> (<N> steps)"
   ```

## Output

In conversation:
- **Designed**: `<feature-id>` advanced to `stage: implementing`
- **Steps**: list with priority and risk
- **Child stories**: list with `depends_on` chain
- **Atomic steps acknowledged**: any that can't be cleanly rolled back
- **Next**: `/agile-workflow:implement <story-id>` for sequential, or
  `/agile-workflow:implement-orchestrator <feature-id>` for parallel agents

## Guardrails

- A refactor preserves behavior. If a step would change behavior, that's a feature
  add — escalate via `/agile-workflow:scope` instead.
- Each step is self-contained and committable in isolation. Multi-step PRs lose the
  ability to roll back individual steps.
- Specify test verification for every step. A refactor without verification is a hope.
- Prioritize measurable improvements (less duplication, clearer boundaries) over
  aesthetic preferences. Beauty that doesn't reduce complexity isn't worth the risk.
- If a refactor changes a public API, include a migration path. Breaking consumers
  without a path forward creates more work than the refactor saves.
- Cycle prevention is mandatory for `depends_on`. Use `work-view --blocking`.
- The plan lives in the feature's body. NEVER create `docs/designs/refactor-<name>.md`
  — that's a workflow-plugin pattern.
