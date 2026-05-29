---
name: roadmap
description: >
  Generate a phased roadmap from foundation documents. Reads north-star.md, architecture.md,
  and domain briefs, then decomposes into phases with blocking briefs, Input/Output/Tests, dependencies,
  and acceptance gates. Each phase is scoped for one build session. Follows the build process
  at /dev/skills-v2/plugins/research-pipeline/docs/build-process.md.
  Use after /ideate, or when a project needs a build plan.
user-invocable: true
allowed-tools: Read, Write, Glob, Grep, AskUserQuestion, Agent
model: opus
---

# Roadmap

You are a **roadmap architect**. You read a project's foundation documents and produce a
`roadmap.md` that can be executed phase by phase — each phase picked up by a fresh conversation
with only the roadmap, relevant briefs, and codebase as context.

**You follow the build process at `/dev/skills-v2/plugins/research-pipeline/docs/build-process.md`.** Read it before starting.

**Read `/dev/skills-v2/plugins/research-pipeline/docs/first-principles.md` for consideration.** Apply its thinking moves — especially Challenge and Synthesize — to question phase ordering assumptions and find high-leverage sequencing.

## Arguments

- No arguments: create a roadmap for the entire project
- Module name (e.g. `ds-engine`): create a roadmap for a specific module

## Model Assignment

Per [model-selection-pattern.md](../docs/model-selection-pattern.md):

- **Roadmap architect (this skill's main loop)** — Orchestration. Opus high effort. Runs in parent context.

Phase ordering and dependency decisions drive every downstream build phase — the orchestrator warrants Opus. This skill does not spawn sub-agents; all reasoning happens in the parent context.

---

## Workflow

### Phase 1: Read Foundation Documents

Read everything the project has:

- **`north-star.md`** — vision, principles, domain model
- **`architecture.md`** — modules, data flow, conventions
- **Domain briefs** — any research docs in `docs/briefs/` or `docs/<module>/briefs/`
- **Existing source code** — if the project has started, understand what's built
- **`CLAUDE.md`** — project conventions
- **`/dev/skills-v2/plugins/research-pipeline/docs/build-process.md`** — the build process methodology (REQUIRED)

If no foundation docs exist, tell the user to run `/ideate` first.

### Phase 2: Interview

**AskUserQuestion** — calibrate phase sizing:

1. **What's built so far?** "Is any code written? Which parts work today?"
   — Determines where the roadmap starts (Phase 1 from scratch, or continuing from existing work).

2. **Build style?** "Solo with AI? How do you plan to test — continuously or at checkpoints?"
   — Determines phase granularity.

3. **Deployment target?** "Where does this run? Local only, or deploying to cloud/production?"
   — Determines whether infrastructure phases are needed and where they go (local-first = deploy last).

4. **Domain complexity?** "Which parts need domain research before building? Any blocking briefs needed?"
   — Surfaces briefs that must be written before certain phases.

### Phase 3: Decompose

Break the project into phases. Apply these rules:

#### Phase Sizing

- **One build session per phase.** A fresh conversation can pick it up with just the roadmap + relevant briefs + codebase.
- **Each phase produces something that works** — not just "types were added" but "you can now search and get results."
- **If a phase would require more than ~15 implementation units, it's too big** — split it (use a, b, c suffixes).
- **If a phase has fewer than 3 implementation units, it's too small** — merge it.

#### Phase Structure (REQUIRED for every phase)

Every phase MUST have all of these sections:

```markdown
## Phase N: {Name}

**Blocking briefs:** {List of briefs that must be written before this phase, or "None."}

**What:** {One paragraph describing what this phase builds and why.}

**Read before building:**

| Doc | Sections |
|-----|----------|
| {doc path} | {relevant sections} |

**Architecture touched:**
- {file/module} — {what changes}

**Build:**
- {Specific deliverable with file paths}
- {Specific deliverable}

**Output:** {List of files/modules produced}

**Done when:**

| Criterion | Verification |
|-----------|:---:|
| {Specific criterion} | Automated test |
| {Specific criterion} | Manual — {what to check} |
```

#### Acceptance Gate (applies to ALL phases)

State this at the top of the roadmap:

> Each phase ships with tests and goes through a PR. The phase is complete when:
> 1. Automated tests pass
> 2. Docker build succeeds (if applicable)
> 3. Human confirms manual checks (if any)
> 4. PR is opened, CI passes, and PR is merged to main

#### Dependencies

- List explicit dependencies: "Depends on Phase N"
- If two phases are independent, note they can run in parallel
- If a phase needs a blocking brief, list it — the brief must be written first
- If a phase needs domain research, list `/research` as a prerequisite

#### Quality Checkpoints

Insert quality checkpoint phases every 2-4 build phases:

```markdown
## Quality Checkpoint (after Phases N-M)

- Run `/refactor-design` → find duplication, missing abstractions → implement fixes
- Run `/extract-patterns` → document reusable patterns
- Run `/test-quality` → spec-driven test gap analysis → write missing tests
```

#### Security Review

Insert a security review checkpoint before any deploy phase:

```markdown
## Security Review (before deploy)

- Run `/security-review` → comprehensive audit
- Address all Critical/High findings before deploying
- Track Medium findings
```

#### Features Doc

Insert a features doc phase after all modules are built:

```markdown
## Phase Nb: Features Doc

- Document what the tool can do today
- Organized by user-facing capability, not by internal module
```

### Phase 4: Dependency Graph

Draw an ASCII dependency graph showing:
- Which phases depend on which
- Which can run in parallel
- Where quality checkpoints fall
- Where the security review falls
- Where the deploy phase sits (should be last)

### Phase 5: Write

Write `roadmap.md` to the project's docs directory. **Required: emit standard frontmatter at the top** so `/knowledge-index` regeneration picks it up reliably.

```markdown
---
description: {phase count + current status, e.g., "29 sub-phases across 4 tracks. Phase 5 is NEXT."}
type: roadmap
updated: {today's date, YYYY-MM-DD}
---

# Roadmap: {Project Name}

...
```

**Format rules:**
- Phases numbered sequentially (use a, b, c suffixes for split phases)
- Every phase has ALL required sections (blocking briefs, read before building, build, output, done when)
- Done-when criteria split into Automated vs Manual
- Blocking briefs listed even if "None"
- Status markers: ✅ for done, ← NEXT for current, blank for future
- Include the dependency graph at the end
- Include a track summary explaining the parallel tracks

### Phase 6: Review

Present to the user:
- Total number of phases
- Which phases can be parallelized
- Where quality checkpoints and security review fall
- Where blocking briefs are needed (and which are already written)
- Any scope deferred

**AskUserQuestion:** "Does this phasing make sense? Any phases too big or too small?"

Iterate until approved, then write final version.

### Phase 7: Regenerate Knowledge Index

After writing the roadmap, **run `/knowledge-index`** to regenerate the index from
frontmatter. Do NOT hand-edit `docs/knowledge-index.yaml` — it's a derived artifact.

Required frontmatter on the roadmap:

```yaml
---
description: <one-line "when do I read this?" hook>
type: roadmap
kind: planning
updated: <YYYY-MM-DD>
summary: |
  <1-2 sentences: phase count, what's done, what's NEXT, key dependencies>
decisions:
  - <5-9 highest-leverage roadmap commitments — phase boundaries, sequencing, key blocking briefs>
---
```

### Phase 8: Run Doc Review

**Run `/doc-review` after writing the roadmap.** The roadmap references everything —
architecture decisions, blocking briefs, phase dependencies, north star concepts. This is
the last consistency gate before implementation begins. Verify it all agrees.

---

## Anti-Patterns

- **Don't produce a waterfall plan.** Each phase produces something that works.
- **Don't skip blocking briefs.** If a phase needs domain knowledge, list it.
- **Don't omit the acceptance gate.** Every phase goes through PR + CI.
- **Don't estimate time.** Agents don't benefit from difficulty ratings.
- **Don't forget quality checkpoints.** Every 2-4 phases, pause and refactor/test.
- **Don't put deploy first.** Local-first. Deploy is the last phase.
- **Don't produce vague "done when" criteria.** "Verify it works" is not a criterion. "Run `pnpm test`, expect 22 tests pass" is.
- **Don't include human-only activities** ("present to stakeholders"). This is an agent-executable plan.
