# Skill Suite Evaluation: Core Workflow Skills

**Type:** Workflow suite (7 Workflow + 2 Interactive meta-skills)
**Evaluated:** 2026-03-21

## Skills Evaluated

| Skill | Type | Lines | References |
|-------|------|-------|------------|
| design | Workflow | 174 | — |
| implement | Workflow | 105 | — |
| implement-orchestrator | Workflow | 161 | — |
| refactor-design | Workflow | 125 | — |
| extract-patterns | Workflow | 168 | — |
| stylistic-refactor-creator | Interactive | 240 | common-styles.md (92 lines) |
| structural-refactor-creator | Interactive | 260 | common-structures.md (92 lines) |
| verify | Workflow | 135 | — |
| fix | Workflow | 93 | — |

## Scores

| Dimension | Score | Notes |
|-----------|-------|-------|
| Token Efficiency | 5 | All skills 93-260 lines; no bloat; reference files under 100 lines |
| Activation Reliability | 3 | All manually invoked; implement vs implement-orchestrator selection unclear from descriptions alone |
| Structural Quality | 4 | Consistent pattern across all skills; minor Step/Phase terminology inconsistency |
| Content Quality | 4 | Good output templates, consistent terminology, concrete instructions |
| Progressive Disclosure | 4 | Creators use references well; others appropriately self-contained |
| Phase Structure | 4 | Clear phases with logical ordering; good dependency awareness |
| Validation & Error Handling | 3 | implement self-verifies, making verify→fix redundant; suite validation story is confused |
| Freedom Calibration | 4 | Design gives creative room; implement is constrained to design doc; good balance |
| Output Specification | 5 | Every skill has concrete output template with location guidance |
| **Overall** | **4.0** | |

## Strengths

- **Consistent structural pattern**: Every skill follows the same skeleton — frontmatter → role → anti-patterns → progress tracking → phased workflow → output template → commit workflow → completion criteria. This makes the suite feel cohesive and predictable for both users and agents.
- **Excellent scope boundaries between refactoring concerns**: refactor-design (code re-use/abstractions), stylistic-refactor (coding style), structural-refactor (file/folder organization). Each creator's anti-patterns explicitly carve out the others' territory.
- **Token-efficient**: No skill exceeds 260 lines. Reference files are under 100 lines. No content an LLM already knows.
- **Output templates are concrete**: Every skill shows the exact markdown structure of its output with field-level detail. Agents know exactly what to produce.
- **Anti-patterns sections are specific**: Not vague "don't do bad things" — each lists concrete behaviors to avoid with rationale.

## Findings

### 1. verify + fix are redundant with implement's self-verify (Score: 3/5)

**Issue:** `implement` already has Phase 4: Self-Verify that re-reads design requirements, verifies all requirements are implemented, runs build, and runs tests. `implement-orchestrator` has Phase 5 (Review Results) and Phase 6 (Final Verification). The verify→fix pipeline duplicates this with extra overhead:

- verify produces a verification report artifact
- verify uses parallel sub-agents for design compliance + quality
- fix reads the report and makes targeted changes

But in practice, if implement's self-verify catches issues, it fixes them inline. If it doesn't, the user re-runs implement or fixes things directly rather than invoking a separate two-skill pipeline.

**Rubric:** Validation & Error Handling — "Does each phase validate its own output before proceeding?"

**Recommendation:** Retire verify and fix. If the parallel sub-agent review from verify has value, fold it into implement's Phase 4 as an optional deeper verification step. The written verification report artifact could become part of implement's output when gaps are found.

### 2. Output format coupling is broken across the suite (Score: 3/5)

**Issue:** The suite's power comes from implement being the universal consumer — all planning skills should output in a format implement can directly consume. Currently:

- **design** outputs "Implementation Units" with file paths, interfaces, acceptance criteria → implement consumes this well
- **refactor-design** outputs "Refactor Steps" with Current State/Target State/Approach → implement can *probably* consume this, but the format differs enough to cause friction
- **stylistic-refactor** (generated) outputs a "prioritized refactoring backlog" with tiers → implement cannot directly consume a backlog; the terminology and format don't match
- **structural-refactor** (generated) outputs the same backlog format → same issue

**Rubric:** Output Specification — "Can the output be verified? Is there a template?"

**Recommendation:** Standardize the output format. All planning skills should produce "plans" or "designs" with implementation steps that map to implement's expected input: file paths, current→target state, concrete changes, acceptance criteria. The generated refactoring skills should output a "refactoring plan" not a "backlog" — same structure as refactor-design's steps, so implement can consume any of them interchangeably.

### 3. implement vs implement-orchestrator selection criteria are unclear (Score: 3/5)

**Issue:** implement's description says "Write code from a design document. Use when a design exists and code needs to be written." implement-orchestrator says "Orchestrate implementation of a design document by spawning Sonnet task agents." Neither description tells the user *when to pick which*. The criteria are buried in implement-orchestrator's Phase 2 ("one agent per design is the default," "split into 2-3 agents only when the design has clearly independent subsystems or exceeds ~20 files").

**Rubric:** Activation Reliability — "States both what it does and when to use it"

**Recommendation:** Update the descriptions to include selection criteria. implement: "Use for designs under ~20 files or with tightly coupled units." implement-orchestrator: "Use for large designs (20+ files) or designs with independent subsystems that benefit from parallel implementation."

### 4. Step vs Phase terminology inconsistency (Score: 4/5)

**Issue:** design and extract-patterns use "Step 1, Step 2..." while implement, implement-orchestrator, and verify use "Phase 1, Phase 2...". refactor-design uses a numbered list without either label. This is cosmetic but breaks the suite's otherwise strong consistency.

**Rubric:** Structural Quality — "Logical section flow"

**Recommendation:** Pick one term (Phase is more standard for workflow skills) and apply it consistently.

## Test Scenarios

### Scenario 1: Pipeline Continuity (design → implement)
**What to test:** Output→input coupling between design and implement
**Prompt:** "Run /design for a new feature, then use /implement to build it from the design doc."
**Expected behavior:** implement finds and reads the design doc without user intervention; design's output format (Implementation Units with file paths, interfaces, acceptance criteria) maps directly to implement's Phase 1 expectations
**Failure signal:** implement can't locate the design doc, or the design's structure doesn't map cleanly to implement's expectations

### Scenario 2: Refactor-Plan → Implement Handoff
**What to test:** Whether refactor-design's output is directly consumable by implement
**Prompt:** "Run /refactor-design on the src/ directory, then use /implement to execute step 1."
**Expected behavior:** implement treats refactor-design's step as a design spec with file paths, current/target state, and verification criteria
**Failure signal:** implement struggles because refactor-design's format (Current State/Target State/Approach) doesn't match its expected input (implementation units with interfaces and acceptance criteria)

### Scenario 3: Creator Output → Implement Handoff
**What to test:** Whether generated refactoring skills produce output implement can consume
**Prompt:** "Run /stylistic-refactor-creator, then invoke the generated /stylistic-refactor skill, then use /implement to apply the top item."
**Expected behavior:** The generated skill produces a plan with concrete file changes that implement can execute
**Failure signal:** The generated skill produces a "backlog" with vague descriptions instead of implementable units

### Scenario 4: implement vs implement-orchestrator Selection
**What to test:** Whether users can distinguish when to use each
**Prompt:** "I have a design doc covering 3 files. Should I use /implement or /implement-orchestrator?"
**Expected behavior:** The user can determine from descriptions alone that implement is correct for 3 files
**Failure signal:** Descriptions don't give clear size/complexity guidance for selection

### Scenario 5: Suite Without verify/fix
**What to test:** Whether implement's self-verify is sufficient alone
**Prompt:** "Run /implement on a design with a subtle acceptance criterion. Don't use /verify afterward."
**Expected behavior:** implement's Phase 4 catches the subtle requirement and either implements it or reports a blocker
**Failure signal:** Self-verify is too shallow and misses what verify's parallel sub-agent review would have caught

## Summary

The suite is well-built at the individual skill level (4.0/5.0) with excellent token efficiency, consistent structure, and clear scope boundaries between refactoring concerns. The three highest-priority improvements are: (1) retire verify and fix — they duplicate implement's built-in self-verification, (2) standardize output formats so all planning skills produce "plans" that implement can consume interchangeably (not "backlogs"), and (3) clarify implement vs implement-orchestrator selection criteria in their descriptions. These changes would transform a collection of good individual skills into a tightly coupled workflow system.
