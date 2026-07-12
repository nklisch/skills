---
name: refactor-design
description: >
  ALWAYS invoke this skill when the user asks to scan for refactor opportunities, plan a refactor, or
  design a [refactor]-tagged feature. Discovery mode scans code smells, separates pure refactors from
  behavior changes, and emits substrate items. Per-feature mode plans an existing [refactor] feature
  at stage:drafting, writes the plan into the feature body, spawns child stories with depends_on
  chains, and advances drafting to implementing. Uses sensible built-in refactor heuristics by
  default, and extends them with a project-specific refactor-conventions catalog when present.
---

# Refactor-Design

You plan a refactor for a feature tagged `[refactor]` at `stage: drafting` in the
agile-workflow substrate. The plan lives in the feature item's body, structured as
discrete refactor steps with current/target states, risk assessments, and rollback
paths. Each step that warrants its own implementation pass becomes a child story.

A refactor preserves behavior. If you find yourself adding capability, that's not a
refactor — escalate via `/agile-workflow:scope` to add a feature without `[refactor]`
tag instead.

`refactor-design` has its own sensible defaults: code smells, missing
abstractions, established pattern drift, naming inconsistencies, and dead weight.
If `.agents/skills/refactor-conventions/` exists, treat it as an additional
project-specific lens. It extends the default scan; it never replaces it. If the
catalog is absent, proceed normally.

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

Read `docs/VISION.md`, `docs/SPEC.md`, `docs/ARCHITECTURE.md`, `AGENTS.md` /
`CLAUDE.md`, `.agents/rules/*.md` (if present) — the project's force-loaded
agent rules (tag semantics, test integrity, review policy) — `.work/CONVENTIONS.md`,
and, if present, `.agents/skills/refactor-conventions/SKILL.md` plus relevant
referenced rule files. One pass — orient, don't memorize.

### Phase D3: Code-smell scan

Run a read-first scope-size probe. If the target is a small file set or one
obvious module, scan it directly across the Phase 3 lenses and skip sub-agents;
direct reading usually catches refactor shape better than broad summaries.

For medium or large targets, run the same sub-agent scan as Phase 3 of
per-feature mode (Code Smells, Missing Abstractions, Pattern Violations &
Naming Inconsistencies, Dead Weight, and optional Project Refactor Conventions)
but scoped to the target from Phase D1 instead of one feature's area. The
optional conventions scan only runs when `.agents/skills/refactor-conventions/`
exists. After direct or agent scan results, read 2-3 key files yourself to
verify.

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
references + one-line rationale. Include the source lens when useful
(`code-smell`, `missing-abstraction`, `pattern-drift`, `dead-weight`, or
`refactor-convention:<rule>`). Set `gate_origin: refactor-design` for trace.
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
- **Next**: `/agile-workflow:scope` (batch mode) to cluster further, or start
  an autopilot goal to drain. Behavior-changing items will route to
  feature-design when their stage advances.

## Workflow — `--only-questions` mode

Mirrors `feature-design`'s `--only-questions` mode, scoped to `[refactor]`-tagged
drafting features. Iterate over the target set:

1. Read the feature; skip if not `[refactor]`-tagged or not at `stage: drafting`
2. Light ground (foundation docs + AGENTS.md / CLAUDE.md)
3. Read-first map of the feature's area; use one exploratory sub-agent only if the
   area is still unclear. Include `.agents/skills/refactor-conventions/` as
   context when present.
4. Use the structured question tool for refactor-specific strategic ambiguities
   such as API compatibility, migration shape, or rollback strategy.
5. Capture answers under `## Design decisions` in the feature body
6. Do NOT design or advance stage — let the design family pick up later
7. Commit per feature: `refactor-design --only-questions: <id>`

Requires interactive mode; refuse under autopilot. Otherwise defer question and advisory policy to `principles/SKILL.md` Parts III–IV.

## Workflow — per-feature mode

### Phase 1: Read the feature item

Read `.work/active/features/<id>.md`. Confirm:
- `kind: feature`
- `stage: drafting`
- `tags` includes `refactor`

The brief should describe what's being refactored and why. Use it as input.

**Misroute check.** Apply the black-box test to the brief: would any observable
behavior change for a caller of the public surface as a result of this work?
Signals you're misrouted: the brief describes new capability, an API or
contract change, swapped semantics, "replacing X with Y" rather than
"restructuring X," or "major rework of X." If any of those apply, this item
was mistagged. Strip `refactor` from the item's `tags` frontmatter, append a
one-line note to the body ("Misrouted to refactor-design; brief describes
behavior change rather than pure restructuring — retagged for feature-design"),
commit (`refactor-design misroute: <id> retagged for feature-design`), and
return without advancing the stage. Autopilot will reroute on the next pass.

### Phase 2: Ground yourself

The principles skill auto-loads. Read:
- `docs/VISION.md`, `docs/SPEC.md`, `docs/ARCHITECTURE.md` (refactor must not
  violate spec constraints)
- `AGENTS.md` / `CLAUDE.md`
- `.agents/rules/*.md` (if present) — the project's force-loaded agent rules
  (tag semantics, test integrity, review policy)
- `.agents/skills/refactor-conventions/SKILL.md` and relevant referenced rule
  files, if present. Treat these as project-specific extension lenses, not as
  replacements for the defaults below.
- The parent epic if `parent` is set
- The code under refactor — read it thoroughly, don't refactor blind

### Phase 3: Code-smell scan

Run a read-first scope-size probe before spawning exploratory sub-agents. If the
refactor target is a bounded module or small file set, inspect it directly
across the lenses below and skip exploratory fanout. If one area is unclear, use one
focused exploratory sub-agent. Use parallel exploratory sub-agents only when the lenses need separate
attention across a medium/large target.

The first four scan axes are mandatory. Run them even when a project-specific
refactor-conventions catalog exists. The catalog adds a fifth scan axis; it
does not narrow or disable the default refactor judgment.

- Use the host's generic/general-purpose subagent prompted with the scanner
  capsule from `../principles/references/subagents.md`: medium reasoning for
  focused scans, high reasoning for normal refactor discovery, and strongest
  reviewer reasoning only for large or architecture-heavy refactors.
- Agile-workflow does not ship a read-only Explore override, so use an existing
  deployment-provided read-only role only if it is already available; otherwise
  keep the host-local scan fallback.

1. **Code Smells** — "Find code that smells off in <area>. Look for: duplicated
   logic across files; long files (>500 lines); deep nesting (>4 levels); god
   functions (>100 lines doing multiple distinct things); god modules (>15
   methods or multiple responsibilities); leaky abstractions (consumers reaching
   past a module's public API). Report each with file:line and a one-line
   explanation."

2. **Missing Abstractions** — "Find places where multiple modules implement
   similar logic that could be extracted. Report each with file:line references
   and which modules would benefit."

3. **Pattern Violations & Naming Inconsistencies** — "Read
   `.agents/skills/patterns/*.md` and legacy `.claude/skills/patterns/*.md` if
   they exist. Find code that deviates from established patterns. Report
   naming inconsistencies — same concept named differently across modules. Report
   each with file:line."

4. **Dead Weight** — "Find dead code: unused exports (cross-check against grep
   for importers), commented-out blocks, TODO/FIXME where the work is clearly
   already done, files with very few callers. Report each with file:line."

5. **Project Refactor Conventions** — Run only when
   `.agents/skills/refactor-conventions/` exists. "Read
   `.agents/skills/refactor-conventions/SKILL.md`, its referenced rule files,
   and the `## Refactor Style Conventions` section in AGENTS.md if present.
   Find high-confidence convention drift in <area>. Report only issues where a
   behavior-preserving refactor has real value: less duplication, clearer
   boundaries, easier scanning, lower coordination cost, or alignment with a
   repeatedly-used project rule. Do not report churn-only violations. Include
   the rule name, file:line, why it matters, and whether it is small/surgical
   or multi-file."

After direct or agent scan results, **read 2-3 key files yourself** to verify
findings.

### Phase 4: Categorize findings

Sort the findings into:
- **High value** — reduces duplication, extracts shared abstractions, consolidates
  similar code, or corrects convention drift that materially improves module
  boundaries or repeated project workflow
- **Medium value** — improves consistency, aligns with established patterns
- **Low value** — minor structural improvements

Each refactor step you plan must articulate the value. If you can't articulate the
payoff, drop the step.

Convention drift by itself is not automatically high value. Aesthetic-only or
mass-import-churn fixes should be dropped or recorded as "not worth it" in the
run summary.

### Phase 5: Design refactor steps

For each step, specify:
- **Step name and value tier** (High / Medium / Low)
- **Source lens**: code smell / missing abstraction / pattern drift /
  dead weight / refactor convention `<rule>` (if applicable)
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
**Source Lens**: code smell / missing abstraction / pattern drift / dead weight / refactor convention `<rule>`
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
- **Convention-driven steps**: list or "none"
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
- Project-specific refactor conventions extend the defaults; they never replace
  the built-in scan. If no convention catalog exists, proceed normally.
- Convention violations are not automatically work. Emit only behavior-preserving
  refactors with meaningful payoff; record churn-only fixes as not worth it.
- If a refactor changes a public API, include a migration path. Breaking consumers
  without a path forward creates more work than the refactor saves.
- Cycle prevention is mandatory for `depends_on`. Use `work-view --blocking`.
- The plan lives in the feature's body. NEVER create `docs/designs/refactor-<name>.md`
  — that's a workflow-plugin pattern.
