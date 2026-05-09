---
name: design
description: >
  Design a feature at stage:drafting in the agile-workflow substrate. Reads the
  feature item, grounds in foundation docs and codebase, produces a detailed design
  WRITTEN INTO THE FEATURE'S BODY (not as a separate doc), spawns child story files
  with declared depends_on chains, and advances stage drafting -> implementing.
  Use for greenfield feature design — features without [refactor] or [perf] tags.
  For [refactor] use /agile-workflow:refactor-design; for [perf] use
  /agile-workflow:perf-design.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Task
model: opus
---

# Design

You design a feature in the agile-workflow substrate. The design lives in the
feature item's body — there is no separate `docs/designs/<name>.md`. As the design
takes shape, child stories are spawned with declared `depends_on` chains. When the
design is done, you advance the feature's stage `drafting → implementing`.

This skill is for **greenfield feature design** — features without `[refactor]` or
`[perf]` tags. The design family routes by tag:
- `design` (this skill) — feature with no specialized tag
- `refactor-design` — feature with `tags: [refactor]`
- `perf-design` — feature with `tags: [perf]`

If the feature you're looking at has `[refactor]` or `[perf]` in `tags`, halt and
tell the user to invoke the right specialized skill instead.

## Trigger

Auto-triggers when the agent identifies a feature at `stage: drafting` ready for
design, with no specialized tag. Common phrases:
- "design feature X"
- "let's design this feature"
- "this feature is ready to design"

## Workflow

### Phase 1: Read the feature item

Read the feature file at `.work/active/features/<id>.md`. Confirm:
- `kind: feature`
- `stage: drafting`
- `tags` does NOT include `refactor` or `perf` (otherwise halt and route)

The body should already have a brief from `scope`. Use it as the seed for design.

### Phase 2: Ground yourself

The principles skill auto-loads — both code-design (Ports & Adapters, SSOT,
Generated Contracts, Fail Fast) and substrate-execution (Item-IS-the-Work,
Rolling-Foundation, Late-Binding) are active.

Read:
1. `docs/VISION.md`, `docs/SPEC.md`, `docs/ARCHITECTURE.md` (foundation docs that
   constrain this feature)
2. `CLAUDE.md` (project conventions)
3. The parent epic if `parent` is set — read `.work/active/epics/<parent>.md`
4. Existing source code in the area the feature touches
5. Research docs in `docs/research/` if the feature uses libraries you haven't
   verified

### Phase 3: Map the codebase

Use the **Task tool** to spawn parallel Explore sub-agents (model: sonnet minimum,
opus for large codebases). Send all in one message and wait for all.

1. **Codebase Structure** — directory layout, modules, entry points, exports
2. **Interface & Type Inventory** — exported interfaces, types, signatures with file paths
3. **Test Structure** — test patterns, helpers, fixtures, organization

After results, **read 2-3 key source files yourself** to verify findings.

### Phase 4: Re-align to project standards

Re-read `CLAUDE.md` (project root and `.claude/` if both exist) and any files in
`.claude/rules/`. Recency improves adherence. Confirm your approach aligns with
project conventions.

### Phase 4.5: Surface ambiguities

Before locking in design decisions, identify ambiguities and unresolved
questions. Ask the user via AskUserQuestion to clarify these categories:

- **Requirements gaps** — missing acceptance criteria, unclear edge cases,
  undefined behavior for error states
- **Architecture trade-offs** — when multiple valid approaches exist, present
  the options with pros/cons and ask the user to choose
- **Scope boundaries** — what's in scope vs. out of scope when the brief is
  unclear
- **Integration assumptions** — expected behavior of external systems, APIs, or
  services the design depends on
- **UX decisions** — interaction details not covered by foundation UX docs

Do NOT guess on ambiguous points. A question now saves a rewrite later. After
the user clarifies, incorporate their answers into the design.

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

Specify implementation order — what must exist before what. Where there are clear
sub-units that warrant their own implementation passes, **spawn child stories**.

For each child story to spawn:
- Create `.work/active/stories/<feature-id>-<story-slug>.md`
- Frontmatter: `kind: story`, `stage: implementing`, `parent: <feature-id>`,
  `depends_on: [...]` (declare which sibling stories must finish first)
- Body: scope of this story, the unit(s) it implements, acceptance criteria

Cycle check: run `.work/bin/work-view --blocking <story-id>` before adding any
`depends_on` entry.

If the feature is small enough to implement as a single unit, skip child stories —
the feature itself is the implementation unit.

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
   git commit -m "design: <feature-id> (<N> child stories)"
   ```

## Output

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
- Specify types and signatures EXACTLY. Vague descriptions become guesses during
  implementation, and guesses become bugs.
- Design error handling explicitly. Undesigned error paths are the #1 source of
  production surprises.
- Build on existing patterns in the codebase — consistency reduces cognitive load.
- Cycle prevention is mandatory for `depends_on`. Use `work-view --blocking`.
- Don't pre-populate stage on child stories beyond `implementing`. Stage advances
  through actual work, not at design time.
