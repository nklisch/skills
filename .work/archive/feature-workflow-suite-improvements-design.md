---
id: feature-workflow-suite-improvements-design
kind: feature
stage: done
tags: [plugin]
parent: null
depends_on: []
release_binding: null
gate_origin: null
created: 2026-05-08
updated: 2026-05-30
---

# Design: Workflow Suite Improvements

## Overview

Tighten the workflow skill suite into a cohesive system where **implement is the universal consumer** of all planning skills. Three changes: retire redundant verification skills, standardize output formats so implement can consume any planning skill's output, and clarify skill selection.

## Implementation Units

### Unit 1: Delete verify, fix, and quality-gate skills

**Files to delete**:
- `.agents/skills/verify/SKILL.md`
- `.agents/skills/fix/SKILL.md`
- `.agents/skills/quality-gate/SKILL.md`

**Implementation Notes**:
- Delete the entire skill directories, not just the SKILL.md files
- These are retired because implement already self-verifies (Phase 4) and implement-orchestrator has its own review phases (5-6)

**Acceptance Criteria**:
- [ ] `.agents/skills/verify/` directory deleted
- [ ] `.agents/skills/fix/` directory deleted
- [ ] `.agents/skills/quality-gate/` directory deleted

---

### Unit 2: Remove verify/fix/quality-gate from tap.json

**File**: `.agents/skills/` — n/a, file is `tap.json` at repo root

```json
// DELETE these three entries from the "skills" array:
{
  "name": "verify",
  "description": "Verify implementation against design. Use when code has been written and needs checking.",
  "repo": "nklisch/skills",
  "tags": ["verification", "quality", "agentic", "workflow", "pipeline"]
},
{
  "name": "fix",
  "description": "Fix gaps from VERIFICATION.md. Use when verification found issues that need resolution.",
  "repo": "nklisch/skills",
  "tags": ["bugfix", "quality", "agentic", "workflow", "pipeline"]
},
{
  "name": "quality-gate",
  "description": "Final quality assessment for a feature or phase. Use when checking if work is complete enough to move on.",
  "repo": "nklisch/skills",
  "tags": ["quality", "assessment", "agentic", "workflow", "pipeline"]
}
```

Also update these descriptions in tap.json:

```json
// implement — add selection criteria
{
  "name": "implement",
  "description": "Write code from a design or plan document. Use for designs targeting fewer than ~20 files or with tightly coupled units.",
  ...
}

// implement-orchestrator — add selection criteria
{
  "name": "implement-orchestrator",
  "description": "Orchestrate implementation by spawning Sonnet task agents. Use for large designs (20+ files) or designs with independent subsystems that benefit from parallel implementation.",
  ...
}

// stylistic-refactor-creator — backlog → plan
{
  "name": "stylistic-refactor-creator",
  "description": "Create or update a project-specific stylistic-refactor skill. Explores the repo, researches stack-specific best practices, interviews the user, then generates a skill that scans for opportunities and produces a prioritized refactoring plan.",
  ...
}

// structural-refactor-creator — backlog → plan
{
  "name": "structural-refactor-creator",
  "description": "Create or update a project-specific structural-refactor skill. Explores the repo, researches organizational conventions, interviews the user about structural preferences, then generates a skill that scans for issues and produces a prioritized refactoring plan.",
  ...
}
```

**Acceptance Criteria**:
- [ ] verify, fix, quality-gate entries removed from tap.json
- [ ] implement description updated with selection criteria
- [ ] implement-orchestrator description updated with selection criteria
- [ ] Creator descriptions say "plan" not "backlog"

---

### Unit 3: Update design SKILL.md — remove verify reference

**File**: `.agents/skills/design/SKILL.md`

Change line 38 from:
```
The design document you produce is consumed directly by the **implement** agent to write code. This is the most critical document in the pipeline — every ambiguity here becomes a guess during implementation. It is also used by the **verify** agent to check whether implementation matches intent.
```

To:
```
The design document you produce is consumed directly by the **implement** agent to write code. This is the most critical document in the pipeline — every ambiguity here becomes a guess during implementation.
```

Also standardize "Step" → "Phase" in the Workflow section headers:
- `### Step 1: Read Project Documents` → `### Phase 1: Read Project Documents`
- `### Step 2: Explore Codebase via Sub-Agents` → `### Phase 2: Explore Codebase via Sub-Agents`
- `### Step 3: Cross-Check Sub-Agent Results` → `### Phase 3: Cross-Check Sub-Agent Results`
- `### Step 4: Design Implementation Units` → `### Phase 4: Design Implementation Units`
- `### Step 5: Design Test Approach` → `### Phase 5: Design Test Approach`
- `### Step 6: Specify Order and Write` → `### Phase 6: Specify Order and Write`

**Acceptance Criteria**:
- [ ] No reference to verify agent remains
- [ ] All workflow steps use "Phase N" heading format

---

### Unit 4: Update implement SKILL.md — broaden input + add selection criteria

**File**: `.agents/skills/implement/SKILL.md`

Change frontmatter description from:
```yaml
description: "Write code from a design document. Use when a design exists and code needs to be written."
```
To:
```yaml
description: >
  Write code from a design or plan document. Use when a design, refactor plan, or refactoring
  plan exists and code needs to be written. Best for plans targeting fewer than ~20 files or
  with tightly coupled units. For larger or parallelizable work, use implement-orchestrator instead.
```

Change "Your Role" section — replace first sentence:
```
You implement code according to the design document, reconciling it with the current repo state.
```
With:
```
You implement code according to the design or plan document, reconciling it with the current repo state.
```

Change Phase 1 step 1 from:
```
1. Find and read the design document for the target (see "You MUST read these files" above for discovery steps)
```
To:
```
1. Find and read the design or plan document for the target (see "You MUST read these files" above for discovery steps)
```

In "You MUST read these files", change item 1 from:
```
1. **Design document** — implementation spec (REQUIRED). If `{{design_path}}` is provided, use it. Otherwise, assess the project structure to find the design doc (e.g., in `docs/`, `design/`, or the project root). If not found, ask the user.
```
To:
```
1. **Design or plan document** — implementation spec (REQUIRED). This may be a design doc, refactor plan, or refactoring plan — all use similar structure with file paths, code changes, and acceptance criteria. If `{{design_path}}` is provided, use it. Otherwise, assess the project structure to find it (e.g., in `docs/`, `design/`, or the project root). If not found, ask the user.
```

**Implementation Notes**:
- Do NOT rename `{{design_path}}` variable — it's a stable interface across the suite
- The broadening is in language only; implement's phases already work generically with any structured plan

**Acceptance Criteria**:
- [ ] Description includes selection criteria (< ~20 files)
- [ ] Description mentions it accepts design docs, refactor plans, and refactoring plans
- [ ] Internal references say "design or plan" consistently
- [ ] `{{design_path}}` variable name unchanged

---

### Unit 5: Update implement-orchestrator SKILL.md — add selection criteria

**File**: `.agents/skills/implement-orchestrator/SKILL.md`

Change frontmatter description from:
```yaml
description: >
  Orchestrate implementation of a design document by spawning Sonnet task agents.
  Use when a design doc exists and you want parallel, autonomous implementation.
  Opus reads the design, splits work into agent-sized units, crafts focused prompts,
  and spawns Sonnet agents to implement them.
```
To:
```yaml
description: >
  Orchestrate implementation of a design or plan document by spawning Sonnet task agents.
  Use for large designs (20+ files) or designs with independent subsystems that benefit
  from parallel implementation. Opus reads the plan, splits work into agent-sized units,
  crafts focused prompts, and spawns Sonnet agents to implement them.
```

**Implementation Notes**:
- Same broadening as implement — "design" → "design or plan" in description and key references
- Do NOT change the internal workflow phases — they already work generically

**Acceptance Criteria**:
- [ ] Description includes selection criteria (20+ files, independent subsystems)
- [ ] Description mentions it accepts plans, not just designs

---

### Unit 6: Adapt refactor-design output format

**File**: `.agents/skills/refactor-design/SKILL.md`

Replace the output template (current lines 86-107) with:

````markdown
## Output

Determine where to write the refactor plan by assessing the project structure — look for existing docs or design directories (e.g., `docs/`, `design/`) and follow the convention. If no convention is apparent, pick a logical location or ask the user.

Structure:

```markdown
# Refactor Plan: {Focus Area}

## Overview
{What needs refactoring and why — summarize the key problems found}

## Refactor Steps

### Step 1: {Name}
**Priority**: High/Medium/Low
**Risk**: Low/Medium/High
**Files**: `src/path/file.ts`, `src/path/other.ts`

**Current State**:
\`\`\`{lang}
// Actual code showing what exists now
\`\`\`

**Target State**:
\`\`\`{lang}
// Exact code showing what it should look like after
\`\`\`

**Implementation Notes**:
- How to get from current to target
- Non-obvious considerations

**Acceptance Criteria**:
- [ ] Build passes
- [ ] Tests pass
- [ ] {specific structural/behavioral check}

---

## Implementation Order
1. Step to implement first (lowest dependency)
2. Next step
```
````

Also standardize the workflow section to use "Phase" headers consistently. The current workflow (lines 64-78) uses a numbered list — change to:

```markdown
### Phase 1: Read Context
Read the vision document, patterns, and CLAUDE.md guidelines.

### Phase 2: Explore via Sub-Agents
Use the **Task tool** to spawn parallel Explore sub-agents (model: **sonnet** minimum, **opus** for large or complex codebases):
...

### Phase 3: Identify and Categorize
IDENTIFY refactoring opportunities, categorized by:
...

### Phase 4: Design Refactor Steps
PLAN each refactor as a discrete, testable step with current/target code and acceptance criteria.

### Phase 5: Order and Write
ORDER by dependency and priority, then WRITE the refactor plan.
```

**Implementation Notes**:
- The key change is adding `Current State` / `Target State` as **code blocks** (not prose), `Implementation Notes`, and `Acceptance Criteria` to each step — mirroring design's Implementation Units format
- Added `Overview` section and `Implementation Order` section to match design's output structure
- This makes refactor-design output directly consumable by implement

**Acceptance Criteria**:
- [ ] Each refactor step has Current State and Target State as code blocks
- [ ] Each step has Implementation Notes and Acceptance Criteria
- [ ] Output has Implementation Order section
- [ ] Workflow uses Phase N headers consistently
- [ ] implement can consume a refactor plan step as if it were a design unit

---

### Unit 7: Update stylistic-refactor-creator generated skill template

**File**: `.agents/skills/stylistic-refactor-creator/SKILL.md`

Replace the generated SKILL.md's output section (lines 136-158 in the template) with:

````markdown
## Output

Write the refactoring plan to a `.md` file in a logical project location. Name and place it
based on the project's conventions — e.g., `docs/stylistic-refactor-design.md`,
or `{docs-dir}/stylistic-refactor-design.md`. If the project has a `docs/` directory, prefer it.
If no obvious location exists, place it at the repo root as `stylistic-refactor-design.md`.

The document should be a **prioritized refactoring plan** with these sections:

### High Value

Refactors that significantly improve readability, consistency, or maintainability
with low risk. Each entry must be **implement-ready**:

#### {N}. {Name}
**File**: `src/path/file.ts:42`
**Style**: {which style rule}

**Current**:
\`\`\`{lang}
// actual code from the repo
\`\`\`

**Target**:
\`\`\`{lang}
// refactored code
\`\`\`

**Acceptance Criteria**:
- [ ] Follows {style-name} rule
- [ ] Tests pass
- [ ] No behavior change

---

### Worth Considering

Valid refactors with moderate impact or moderate effort. Brief entries with
file paths and rationale — not implement-ready detail.

### Not Worth It

Code that technically violates a style but should NOT be refactored. Include WHY:
too destructive, too complex for marginal gain, would obscure domain logic, breaks
API contracts, or forces unnatural patterns. We want a unified feel, not refactoring
for refactoring's sake.
````

Also update these references throughout the file:
- All instances of "backlog" → "plan" (in description, output section, quality checklist)
- `stylistic-refactor-backlog.md` → `stylistic-refactor-design.md`

Update quality checklist item:
```
- [ ] Generated skill outputs a prioritized backlog with a "not worth it" section
```
To:
```
- [ ] Generated skill outputs a prioritized plan with implement-ready High Value entries and a "not worth it" section
```

**Acceptance Criteria**:
- [ ] No instances of "backlog" remain in the file
- [ ] High Value entries have File, Style, Current/Target code blocks, and Acceptance Criteria
- [ ] Worth Considering and Not Worth It tiers preserved
- [ ] Quality checklist updated

---

### Unit 8: Update structural-refactor-creator generated skill template

**File**: `.agents/skills/structural-refactor-creator/SKILL.md`

Same pattern as Unit 7, adapted for structural concerns. Replace the generated SKILL.md's output section (lines 154-176 in the template) with:

````markdown
## Output

Write the refactoring plan to a `.md` file in a logical project location. Name and place it
based on the project's conventions — e.g., `docs/structural-refactor-design.md`,
or `{docs-dir}/structural-refactor-design.md`. If the project has a `docs/` directory, prefer it.
If no obvious location exists, place it at the repo root as `structural-refactor-design.md`.

The document should be a **prioritized refactoring plan** with these sections:

### High Value

Structural changes that significantly improve navigability, maintainability, or developer
onboarding with low risk. Each entry must be **implement-ready**:

#### {N}. {Name}
**Files**: `src/path/old-location.ts` → `src/path/new-location.ts`
**Rule**: {which structural rule}

**Current**:
\`\`\`
{actual directory tree or file layout}
\`\`\`

**Target**:
\`\`\`
{reorganized structure}
\`\`\`

**Implementation Notes**:
- Import updates needed
- Files affected by the move

**Acceptance Criteria**:
- [ ] Files moved to target locations
- [ ] All imports updated
- [ ] Build passes
- [ ] Tests pass

---

### Worth Considering

Valid reorganizations with moderate impact or moderate effort. Brief entries with
file paths and rationale — not implement-ready detail.

### Not Worth It

Code that technically violates a structural rule but should NOT be reorganized. Include WHY:
too many dependents, would break imports across the codebase, churn outweighs benefit, the
current structure has historical reasons that still apply.
````

Also update throughout the file:
- All instances of "backlog" → "plan"
- `structural-refactor-backlog.md` → `structural-refactor-design.md`

Update quality checklist item:
```
- [ ] Generated skill outputs a prioritized backlog with a "not worth it" section
```
To:
```
- [ ] Generated skill outputs a prioritized plan with implement-ready High Value entries and a "not worth it" section
```

**Acceptance Criteria**:
- [ ] No instances of "backlog" remain in the file
- [ ] High Value entries have Files, Rule, Current/Target layouts, Implementation Notes, and Acceptance Criteria
- [ ] Worth Considering and Not Worth It tiers preserved
- [ ] Quality checklist updated

---

### Unit 9: Standardize extract-patterns terminology

**File**: `.agents/skills/extract-patterns/SKILL.md`

Change workflow headers from "Phase" (already correct) — actually, extract-patterns already uses "Phase 1", "Phase 2", "Phase 3". No change needed.

**Acceptance Criteria**:
- [ ] Confirmed extract-patterns already uses Phase headers (no change)

---

## Implementation Order

1. **Unit 1** — Delete verify, fix, quality-gate directories (no dependencies)
2. **Unit 2** — Update tap.json (depends on Unit 1 being committed)
3. **Unit 3** — Update design SKILL.md (no dependencies)
4. **Unit 4** — Update implement SKILL.md (no dependencies)
5. **Unit 5** — Update implement-orchestrator SKILL.md (no dependencies)
6. **Unit 6** — Adapt refactor-design output (no dependencies)
7. **Unit 7** — Update stylistic-refactor-creator template (no dependencies)
8. **Unit 8** — Update structural-refactor-creator template (no dependencies)

Units 3-8 are independent and can be implemented in parallel.
Unit 9 is a no-op (already correct).

## Testing

No automated tests exist for skills. Verification is manual via the test scenarios in the evaluation report (`docs/workflow-suite-evaluation.md`).

### Manual Verification

After implementation:
1. Confirm deleted directories don't exist
2. Confirm tap.json is valid JSON with no verify/fix/quality-gate entries
3. Confirm no file in the suite contains the word "backlog"
4. Confirm all workflow skills use "Phase N" headers (not "Step N")
5. Grep for "verify agent" across all skill files — should return zero results

```bash
# Verification commands
test ! -d .agents/skills/verify && echo "PASS: verify deleted"
test ! -d .agents/skills/fix && echo "PASS: fix deleted"
test ! -d .agents/skills/quality-gate && echo "PASS: quality-gate deleted"
python3 -c "import json; json.load(open('tap.json'))" && echo "PASS: valid JSON"
! grep -r "backlog" .agents/skills/{design,implement,implement-orchestrator,refactor-design,stylistic-refactor-creator,structural-refactor-creator,extract-patterns}/SKILL.md && echo "PASS: no backlog references"
! grep -r "verify agent" .agents/skills/*/SKILL.md && echo "PASS: no verify agent references"
! grep -r "Step [0-9]" .agents/skills/{design,refactor-design}/SKILL.md && echo "PASS: no Step N headers"
```

## Verification Checklist

- [ ] verify, fix, quality-gate directories deleted
- [ ] tap.json valid and updated
- [ ] implement accepts "design or plan" documents
- [ ] implement vs implement-orchestrator have clear selection criteria in descriptions
- [ ] refactor-design output has Current/Target code blocks + Acceptance Criteria
- [ ] Generated stylistic-refactor outputs implement-ready plan (not backlog)
- [ ] Generated structural-refactor outputs implement-ready plan (not backlog)
- [ ] All skills use "Phase N" headers consistently
- [ ] No references to verify, fix, or quality-gate remain in any suite skill
