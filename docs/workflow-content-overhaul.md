# Design: Workflow Plugin Content Overhaul

## Overview

This is a content-focused overhaul of the `workflow` plugin — improving the workflows themselves, not the file structure. Three buckets: **cleanup consolidations** (4 units), **workflow content improvements** (9 units), **new skills** (2 units) — 15 units total. Plus one pure deletion and one cross-cutting addition (patterns-skill mention).

The reconception that drove this: workflows are content, not architecture. Skills are structured prompts in markdown, discovered by description matching, executed by Claude reading the body. Improvements that survive that medium are: better thinking embedded in phases, sharper sub-agent briefs, missing skills that fill genuine gaps, and consolidations where two skills are demonstrably the same shape.

Reconceptions that did NOT survive contact with the medium and were dropped: "three primitives" (kills auto-invocation), "plan-as-code" (no consumer for the JSON), "effect-handler runtime" (no runtime exists).

**Note on `/fix`:** A `/fix` skill existed previously and was deleted (see `workflow-suite-improvements-design.md`). That old `/fix` consumed `VERIFICATION.md` from a since-removed `/verify` skill. The new `/fix` proposed here has different shape — it's a diagnose-and-repair workflow (reproduce → bisect → failing test → fix → confirm), not a gap-filling workflow.

---

## Implementation Units

### Bucket 1: Cleanup Consolidations

---

### Unit 1: Delete duplicate `repo-eval/repo-eval/` directory

**Files to delete:**
- `plugins/workflow/skills/repo-eval/repo-eval/` (entire subdirectory)

**Implementation Notes:**
- Verbatim duplicate of `plugins/workflow/skills/repo-eval/`. Confirmed identical with `diff -r`.
- Untracked in git (shows as `??` in status). Pure noise.

**Acceptance Criteria:**
- [ ] `plugins/workflow/skills/repo-eval/repo-eval/` no longer exists
- [ ] No skill or reference points to `repo-eval/repo-eval/` paths

---

### Unit 2: REMOVED — keep inline Explore calibration

**Rationale for removal:** The "(model: sonnet minimum, opus for large or complex codebases)" calibration must stay inlined in skills as a defensive measure. The workflow plugin ships its own `Explore.md` that overrides the built-in Haiku Explore with a Sonnet default — but skills may run in environments where that override isn't loaded (e.g., distributed via skilltap into a project that doesn't have the workflow plugin installed). The inline calibration ensures skills behave correctly even in those environments.

This unit is preserved as a record so the suggestion isn't re-raised in a future overhaul.

---

### Unit 3: Merge `design-principles` + `implementation-principles` → `/principles`

**Files:**
- New: `plugins/workflow/skills/principles/SKILL.md`
- Delete: `plugins/workflow/skills/design-principles/`
- Delete: `plugins/workflow/skills/implementation-principles/`
- Update: `tap.json` (remove both old entries, add one new `principles` entry)
- Update: any skill that references `design-principles` or `implementation-principles` (currently `design`, `implement`, `implement-orchestrator`, `refactor-design`, `test-quality`)

**SKILL.md structure:**

```markdown
---
name: principles
description: >
  Architectural and code-level principles (Ports & Adapters, Single Source of Truth,
  Generated Contracts, Fail Fast). Auto-loads when designing modules, defining interfaces,
  writing new code, or any time the design or implement skills are active.
user-invocable: false
---

# Principles

## 1. Ports & Adapters
### At design time
{current design-principles content}
### At implementation time
{current implementation-principles content}

## 2. Single Source of Truth
### At design time
{...}
### At implementation time
{...}

## 3. Generated Contracts
### At design time
{...}
### At implementation time
{...}

## 4. Fail Fast (implementation only)
{current implementation-principles content for Fail Fast}
```

**Implementation Notes:**
- Keep the same three principles + Fail Fast. No content removed.
- The "at design time" / "at implementation time" subsections preserve the per-phase guidance both old skills offered.
- Description must keep both auto-load triggers (design + implementation contexts) so it fires for both.
- Update referencing skills to invoke `/principles` instead of `/design-principles` or `/implementation-principles`.

**Acceptance Criteria:**
- [ ] One `principles` skill exists with content from both predecessors
- [ ] Both old principle directories deleted
- [ ] `tap.json` has one `principles` entry, neither old entry
- [ ] All referencing skills updated
- [ ] Auto-loading still triggers for both design-time and implementation-time contexts

---

### Unit 4: Merge `feature` + `expand` → `/extend`

**Files:**
- New: `plugins/workflow/skills/extend/SKILL.md`
- Delete: `plugins/workflow/skills/feature/`
- Delete: `plugins/workflow/skills/expand/`
- Update: `tap.json`
- Update: any skill that references `feature` or `expand` by name

**SKILL.md structure:**

```markdown
---
name: extend
description: >
  Add capability to an existing project. Handles both small one-off features and
  major scope expansions. Reads foundation docs, explores the codebase, then
  branches: small additions produce a feature brief for design; large expansions
  update foundation docs and roadmap before designing.
user-invocable: true
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Agent, AskUserQuestion, WebSearch
model: opus
---

# Extend

## Phase 1: Understand Project (shared)
{combined Phase 1 from feature + expand — read foundation docs, explore codebase,
read patterns}

## Phase 2: Explore the Idea (shared)
{conversation about what + why + where}

## Phase 3: Scope Branching (NEW)
AskUserQuestion checkpoint: "Is this a small addition or a major expansion?"
- Small (one-off feature, doesn't change architecture) → continue to Phase 4a
- Major (new subsystem, architectural shift, new domain area) → continue to Phase 4b

## Phase 4a: Feature Brief Path
{current feature Phase 3-4: define + write brief that design consumes}

## Phase 4b: Expansion Path
{current expand Phase 3-5: assess impact, update foundation docs, update roadmap}
```

**Implementation Notes:**
- The branching question is the entire point — both skills today share their first 60% of work, then diverge.
- Description is broader so auto-loading triggers on both "add a feature" and "expand the project."
- Risk acknowledged: loses two distinct trigger phrases. Mitigation: include both keyword sets ("add feature," "extend," "expand," "new capability") in description.

**Acceptance Criteria:**
- [ ] Single `extend` skill replaces both
- [ ] Both old skill directories deleted
- [ ] `tap.json` updated
- [ ] Branching question executed in Phase 3
- [ ] Both small and large additions reach a working state

---

### Unit 5: Merge `stylistic-refactor-creator` + `structural-refactor-creator` → `/refactor-conventions-creator`

**Files:**
- New: `plugins/workflow/skills/refactor-conventions-creator/SKILL.md`
- New: `plugins/workflow/skills/refactor-conventions-creator/references/common-styles.md` (moved from stylistic-refactor-creator)
- New: `plugins/workflow/skills/refactor-conventions-creator/references/common-structures.md` (moved from structural-refactor-creator)
- Delete: `plugins/workflow/skills/stylistic-refactor-creator/`
- Delete: `plugins/workflow/skills/structural-refactor-creator/`
- Update: `tap.json`

**SKILL.md structure:**

```markdown
---
name: refactor-conventions-creator
description: >
  Create or update a project-specific refactor-conventions skill. Explores the repo,
  researches stack-specific best practices, interviews the user about both stylistic
  preferences (early returns, error handling, paradigm) and structural preferences
  (file size, folder layout, module boundaries, co-location), then generates a
  combined skill with multiple reference files. The generated skill scans for
  opportunities and produces a prioritized refactoring plan.
user-invocable: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Agent, WebSearch, WebFetch, AskUserQuestion
---

# Refactor Conventions Creator

## Phase 1: Check for Existing Skill
{merged check}

## Phase 2: Explore the Codebase
{both style + structure scans, in one phase}

## Phase 3: Research Stack-Specific Conventions
{both style + structure research}

## Phase 4: Interview the User
{integrated interview covering both axes — present findings together, let user
opt into rules across both categories}

## Phase 5: Generate the Skill
Produces `{skill-dir}/refactor-conventions/` with:
- SKILL.md (index pointing to all rule references)
- references/style/{rule-slug}.md (one per stylistic rule)
- references/structure/{rule-slug}.md (one per structural rule)

The generated skill produces a prioritized plan with separate sections for
style violations and structure violations, but in one unified plan document.
```

**Implementation Notes:**
- The two existing creators are 80% structurally identical (Check → Explore → Research → Interview → Generate → Confirm). Merge cuts the duplication.
- Generated skill has TWO reference categories (style/, structure/) so the user can still mentally separate them.
- Plan document generated by the generated skill has separate "Style Refactors" and "Structure Refactors" sections — preserving the conceptual division at output time.
- `references/common-styles.md` and `references/common-structures.md` are moved verbatim — they're already separate files.

**Acceptance Criteria:**
- [ ] Single `refactor-conventions-creator` skill replaces both
- [ ] Both old creator directories deleted
- [ ] Generated skill produces both kinds of rules in one plan
- [ ] `tap.json` updated

---

### Bucket 2: Workflow Content Improvements

---

### Unit 6: Add pre-mortem step to `design`, `bold-refactor`, `refactor-design`

**Files:**
- `plugins/workflow/skills/design/SKILL.md`
- `plugins/workflow/skills/bold-refactor/SKILL.md`
- `plugins/workflow/skills/refactor-design/SKILL.md`

**Content to add (in `design`, between Phase 5 "Design Implementation Units" and Phase 6 "Design Test Approach"):**

```markdown
### Phase 5.5: Pre-Mortem

Before finalizing the design, take five minutes to attack it. Ask:

- **What's the riskiest assumption in this design?** Name it explicitly.
- **What would have to be true for this to fail in production?** Be specific.
- **What's the fallback if the riskiest unit doesn't work?** A path that doesn't blow up the whole design.
- **Where am I least sure?** Mark those units. They get extra design care or
  early-implementation validation.

If the pre-mortem surfaces a serious risk, revise the design or add a "Spike" unit
that validates the risky assumption before committing the rest. Document risks
discovered and how the design handles them in a "Risks" section near the end.
```

**Equivalent additions to bold-refactor and refactor-design:**
- In `bold-refactor`, add to Phase 4 (Design): "Before writing the design document, walk each accepted suggestion through a pre-mortem: what would have to go wrong for this reconception to be the wrong call? What does rollback look like at each step?"
- In `refactor-design`, add to Phase 5 (Design Refactor Steps): "For each refactor step, name the riskiest part and identify the safe fallback. If the step has no clear rollback, split it further."

**Acceptance Criteria:**
- [ ] All three skills have an explicit pre-mortem step
- [ ] The step names "riskiest assumption" as a specific question, not generic "what could go wrong"
- [ ] design's output document gains a "Risks" section

---

### Unit 7: Add patterns-skill mention to skills that touch code but don't currently mention it

**Files (final, after implementation-time deviation):**
- `plugins/workflow/skills/e2e-test-design/SKILL.md`
- `plugins/workflow/skills/test-quality/SKILL.md`
- `plugins/workflow/skills/cruft-cleaner/SKILL.md`

**Deviation from original plan:** The patterns-skill mention was originally proposed for `bold-refactor` and `perf-design` as well. Removed during implementation because those skills exist *to question or override patterns* — bold-refactor's whole point is conceptual reconception (often subverting patterns), and perf-design fixes often legitimately need to violate patterns (caching, denormalization, inlining across abstractions). Forcing pattern-awareness as a precondition biases both skills toward conservatism that defeats their purpose.

**Implementation Notes:**
- Each skill gets a one-line addition in its grounding/exploration phase, modeled on what `design` and `implement` already say
- Per-skill phrasing:
  - `e2e-test-design` (Phase 1 Understand the codebase): "Use the patterns skill to read test patterns — your designed tests should be runnable in the project's existing test infrastructure."
  - `test-quality` (Phase 1 Ground Yourself First): "Use the patterns skill to read test patterns — your new tests should follow the project's existing test structure."
  - `cruft-cleaner` (Phase 1 Detect): "Use the patterns skill to understand what's *intentionally* repetitive vs accidentally so — patterns are NOT cruft."

**Acceptance Criteria:**
- [ ] e2e-test-design, test-quality, cruft-cleaner mention the patterns skill in an early grounding phase
- [ ] Phrasing is consistent with the domain (test, cleanup)
- [ ] cruft-cleaner specifically mentions patterns as a guard against deleting intentional repetition
- [ ] bold-refactor and perf-design do NOT mention patterns (deliberate omission — see deviation note above)

---

### Unit 8: Make `ideate` attack the idea

**File**: `plugins/workflow/skills/ideate/SKILL.md`

**Changes to Phase 1 (Discovery):**

Add to the bulleted exploration list:
- **Anti-vision** — describe what failure looks like for this project. What would make you say "this didn't work"? Specific failure modes are clearer than generic success talk.
- **Competitive landscape** — who else is solving this? Why isn't their solution good enough? If "no one is" — be skeptical. Why not?

**New Phase 1.5 (after Discovery, before Refinement):**

```markdown
### Phase 1.5: Maximalist vs Minimalist Contrast

Before refining, generate two concrete versions of the project:

**Maximalist version:** "If you had unlimited budget, time, and team — what would
this project be at its most ambitious?" Describe the full vision, every feature,
every audience.

**Minimalist version:** "What's the smallest version of this that still proves
the core idea is worth pursuing? What's the absolute minimum that makes the
point?"

Present both versions to the user. Then ask: "Where between these two should
we land — and why?" The answer reveals what the user actually values.

This is a forcing function. The user's instinct will be to land near maximalist
("but this part matters too"). Push back. The interesting design conversation
is *where to cut*, not *what to keep*.
```

**Update Phase 2 (Refinement) checkpoint:**
- The summary now includes the chosen point on the maxi-mini spectrum and the explicit cuts that were made to land there.

**Implementation Notes:**
- This addition is the single largest content change in this overhaul. It transforms ideate from a sympathetic listener into a sparring partner.
- The maximalist/minimalist exercise is a generative one — Claude proposes both versions, the user reacts. Not a Q&A.
- Keep Discovery phase otherwise freeform — this is one focused interruption, not a process change.

**Acceptance Criteria:**
- [ ] Anti-vision and competitive landscape questions added to Discovery exploration
- [ ] Phase 1.5 (Maximalist vs Minimalist) exists with clear instructions for Claude to generate both
- [ ] Refinement checkpoint summary captures the chosen scope point and the cuts that produced it
- [ ] Doc menu warning added: "Do not propose all listed docs by default. Propose only what serves the chosen scope point."

---

### Unit 9: Beef up `design`'s thinking phase

**File**: `plugins/workflow/skills/design/SKILL.md`

**Replace Phase 5 (currently 8 lines) with:**

```markdown
### Phase 5: Design Implementation Units

This is the substantive phase. Don't rush it.

#### 5a. Consider 2-3 Architectural Options

Before designing units, name 2-3 plausible high-level approaches. For each:
- One-paragraph description
- Key tradeoff (what it optimizes for, what it sacrifices)
- Why it might or might not fit this project

Choose one explicitly. State why over the others. This is what separates a design
from "the first reasonable thing that came to mind."

#### 5b. Identify the Trickiest Unit

Among the units you'll design, name the one you're least sure about — the one with
the highest unknowns, the most novel logic, or the most external dependencies.

Design *this unit first* and design it most carefully. The rest of the design hangs
on whether this unit is feasible.

#### 5c. Design Each Unit

For each unit, specify:
- Exact file path
- Code showing interfaces, types, and function signatures in the project's language
- Implementation notes for non-obvious logic
- Acceptance criteria that are testable assertions, not vibes

Make strong decisions about abstractions, naming, and module boundaries. If you see
a better structure than what the vision doc implies, design it and explain why.
```

**Update Phase 6 (Design Test Approach):**

Promote test design from afterthought to substantive phase. Replace the current one-paragraph treatment with:

```markdown
### Phase 6: Design Tests

Test design is half the value of a design doc — not an appendix. For each unit, design:

- **Unit tests** — what behaviors to verify, what edge cases to cover, what error
  paths to exercise. Tests follow the contract you designed in Phase 5; if the
  contract is precise, the tests write themselves.
- **Integration points** — where does this unit meet other units? What integration
  tests prove the seams hold?
- **Test data** — what fixtures, factories, or seed data are needed? Specify them.

If a unit is hard to test, the design is probably wrong. Note this and revise.
```

**Acceptance Criteria:**
- [ ] Phase 5 explicitly requires considering 2-3 architectural options
- [ ] Phase 5 explicitly requires identifying and designing the trickiest unit first
- [ ] Phase 6 promotes test design beyond a single paragraph
- [ ] Phase 6 includes test data / fixtures / integration points

---

### Unit 10: Drop `bold-refactor`'s quantity target; add "do nothing" option

**File**: `plugins/workflow/skills/bold-refactor/SKILL.md`

**Phase 2 (Provoke) change:**

Replace "Generate **3-5 bold suggestions**" with:

```
Generate suggestions until you've exhausted the lenses or run out of leverage.
Quality over quantity. One sharp suggestion is better than five mediocre ones.
If after applying every lens you only have one bold idea worth pursuing, that's
the right output. If you have eight, present the strongest five and note why
the others didn't make the cut.
```

**Phase 3 (Discuss) addition:**

Add as an explicit option:

```
- **Recommend "do nothing" when appropriate** — sometimes the right answer is
  that the existing code is fine, the user shouldn't refactor right now, and
  they should put effort elsewhere. If you genuinely believe this after the
  exploration, say so. A confident "this isn't worth refactoring" is more
  valuable than a forced suggestion.
```

**Acceptance Criteria:**
- [ ] No "3-5 suggestions" quantity target remains
- [ ] Phase 3 has an explicit "do nothing is a valid output" option
- [ ] Skill remains structurally similar otherwise

---

### Unit 11: Expand `refactor-design`'s sub-agent briefs

**File**: `plugins/workflow/skills/refactor-design/SKILL.md`

**Phase 2 (Explore via Sub-Agents) change:**

Replace the three current briefs (Duplicate Logic / Missing Abstractions / Pattern Violations) with these expanded ones:

```markdown
- **Code Smells**: "Find code that smells off. Look for: duplicated logic across
  files, long files (>500 lines or >300 if dense), deep nesting (>4 levels),
  god functions (>100 lines), god classes (>20 methods), leaky abstractions
  (modules exposing internals via consumers reaching past the public API).
  Report each finding with file:line."

- **Missing Abstractions**: "Find places where multiple modules implement similar
  logic that could be extracted into a shared utility, base class, or common helper.
  Report each opportunity with file:line references and which modules would benefit."

- **Pattern Violations & Naming**: "Read .claude/skills/patterns/*.md (if they exist).
  Find code that deviates from established patterns. Also report naming inconsistencies:
  the same concept named differently across modules, abbreviations used inconsistently,
  function names that don't match what they do. Report each violation with file:line."

- **Dead Weight**: "Find dead code, unused exports, commented-out code blocks, TODO
  comments referencing completed work, files that haven't been touched in months and
  may be obsolete. Cross-check exports against grep for consumers. Report each
  finding with file:line."
```

**Implementation Notes:**
- Goes from 3 briefs to 4. Still launchable in a single message (parallel).
- "Code Smells" combines the old "Duplicate Logic" with new size/nesting/god-object detection.
- "Dead Weight" overlaps cruft-cleaner — but cruft-cleaner is a separate user-initiated workflow. refactor-design produces a *plan*, cruft-cleaner *executes*. They can coexist.

**Acceptance Criteria:**
- [ ] Four sub-agent briefs in Phase 2, covering smells / missing abstractions / pattern violations / dead weight
- [ ] Briefs are concrete enough that an Explore agent knows what to grep for

---

### Unit 12: Fix `e2e-test-design` → implementation handoff

**Files:**
- `plugins/workflow/skills/e2e-test-design/SKILL.md`
- (Possibly) `plugins/workflow/skills/implement/SKILL.md`

**Implementation Notes:**

The clearest fix: e2e-test-design produces a design doc that uses **the same implementation-units format** as `design` produces. Then `implement` can consume it without modification — the skill already accepts "a design or plan document with file paths, code changes, and acceptance criteria."

**Changes to e2e-test-design:**

Replace the current freeform "Document structure" template (Phase 7 output) with the standard implementation-units format used by `design`:

```markdown
# Design: E2E Test Suite for {Project}

## Overview
{What this test suite covers, what it doesn't, where the tests live}

## Test Environment & Fixtures

### Unit 1: Test Infrastructure
**File**: `tests/e2e/setup.ts`

\`\`\`typescript
// fixtures, helpers, mock services, seed data — concrete file
\`\`\`

**Implementation Notes**: ...
**Acceptance Criteria**: ...

---

## Golden-Path Tests

### Unit 2: First-use journey test
**File**: `tests/e2e/first-use.test.ts`

\`\`\`typescript
// test skeleton with describe/it blocks, setup/teardown calls,
// assertion targets named explicitly
\`\`\`

**Implementation Notes**: {what real services this hits, what's mocked, what isn't}
**Acceptance Criteria**: ...

---

## Adversarial Tests

### Unit N: ...
{same format}

---

## Implementation Order
1. Test infrastructure first (Unit 1)
2. Golden-path tests (Units 2-N)
3. Adversarial tests last (they exercise infrastructure built by golden-path)

## Verification Checklist
{commands to run the suite}
```

**Implementation Notes:**
- The shape change is the entire fix: e2e-test-design now produces an output that `implement` can consume directly.
- The Phase 5 (Gather failure expectations) AskUserQuestion checkpoint stays — it's the source of assertion targets for adversarial tests.
- Test data / fixtures get their own implementation unit (Unit 1) instead of being scattered across test specs.
- Note in the skill body: "After producing the design, hand off to `/implement` (small suite) or `/implement-orchestrator` (large suite, especially if backend test infrastructure + frontend test suite are independent)."

**Acceptance Criteria:**
- [ ] e2e-test-design's output uses the implementation-units format
- [ ] Test infrastructure is its own unit, not scattered
- [ ] Skill body explicitly recommends handoff to /implement or /implement-orchestrator

---

### Unit 13: Beef up `autopilot`'s testing pass — real e2e theory

**File**: `plugins/workflow/skills/autopilot/SKILL.md`
**File**: `plugins/workflow/skills/autopilot/references/decision-frameworks.md`

**Implementation Notes:**

Keep "test passes at major boundaries" conceptually. The change is in **how** those passes work:

In Phase 5 (Testing Passes), expand from the current 4 lines to a more substantive section:

```markdown
### Phase 5: Testing Passes

At major boundaries, the per-phase test checkpoints aren't enough. Run a deeper
testing pass with the goal: **find real bugs, not produce green checkmarks**.

#### 5a. Test the contract, not the implementation

Invoke `/test-quality`. Its core principle is right: tests derived from reading
implementation are tautological — they prove the code does what the code does.
Tests derived from specs prove the code does what it should do. The reward of
a good test pass is a failing test that reveals a real bug — fix it, take pride.

When test-quality finds tautological tests in existing coverage, it reworks them
(figures out what the test *should* have been verifying — those are spec gaps
worth filling) or deletes them. Don't replace tautology with new tautology.

#### 5b. Test against reality

Invoke `/e2e-test-design` and then `/implement-orchestrator` to write the tests.
The goal is tests that exercise the product as close to real conditions as possible:

- Real database (test instance, not mock)
- Real HTTP requests (test server, not mocked client)
- Real file system (temp directory, not in-memory)
- Real time (with controlled clocks where determinism matters)
- Realistic data volumes (not just one row)

Mocks prove the mocks work. Reality proves the product works. Push the test
boundary out as far as the test infrastructure allows.

#### 5c. Adversarial coverage

The golden-path tests are the easy half. The bug-finding half is the adversarial
suite: invalid input, missing config, unavailable dependencies, boundary values,
interrupted operations. e2e-test-design's Phase 5 (Gather failure expectations)
is the source of assertion targets here.
```

**Decision-frameworks.md update:**

Replace the vague "Major Boundary Detection" section with concrete triggers:

```markdown
## Major Boundary Detection (for Testing Passes)

Trigger a deep testing pass when ANY of these become true:

- **Backend complete** — every roadmap phase that produces or modifies API/server
  code has been completed
- **Subsystem closed** — a named subsystem (auth, billing, search, etc.) has all
  its phases done
- **Stack transition** — about to start work that uses a fundamentally different
  layer (e.g., starting frontend after backend)
- **End of roadmap** — last phase complete

Do NOT skip the testing pass at end-of-roadmap, even if "everything seems fine."
That's exactly when the next bug ships.
```

**Acceptance Criteria:**
- [ ] Phase 5 explicitly states "find real bugs, not green checkmarks"
- [ ] The 5a/5b/5c structure makes test-quality's tautology focus + e2e-test-design's reality focus + adversarial focus all explicit
- [ ] Decision frameworks have concrete major-boundary triggers, not "when it feels right"

---

### Unit 14: `test-quality` reworks tautological tests (rewrite or delete)

**File**: `plugins/workflow/skills/test-quality/SKILL.md`

**Implementation Notes:**

Current test-quality writes new spec-derived tests but doesn't address existing tautological tests. Add this responsibility explicitly.

**Add a new Phase 1.5 (after Step 1.3 Survey Existing Tests, before Phase 2):**

```markdown
### Phase 1.5: Audit Tautological Tests

For each existing test mapped in Step 1.3, classify it:

- **Spec-derived** — tests a behavior that's stated in the spec or contract.
  Keep it.
- **Implementation-derived (tautological)** — tests that the code does what it
  does. Common signs: assertions that mirror the implementation literally,
  tests that broke the moment a refactor touched the function but caught
  no bug, tests using internal mocks that simulate what the function does
  step-by-step.

For each tautological test:

1. **Try to recover the missing spec.** What behavior was this test *meant* to
   verify? If you can articulate it from the spec or interface (not from the
   implementation), the test should be **rewritten** as a spec-derived test.
   These rewrites are gap-fills — the original test masked a real coverage hole.
2. **If no spec behavior is recoverable**, the test has no value. **Delete it.**
   Note the deletion in the report so the user sees what was removed.

Do NOT replace tautological tests with new tautological tests. If you can't
derive a real spec behavior, deletion is correct.
```

**Update the Output section:**

Add to the gap analysis report:

```
- **Tautological tests reworked** — list each: file:line, what it was, what it
  became (rewritten test or deleted)
- **Spec gaps surfaced via tautological tests** — when a tautological test
  hinted at a spec behavior that hadn't been formally tested, note it here
```

**Acceptance Criteria:**
- [ ] Phase 1.5 audits existing tests for tautology
- [ ] Tautological tests are either rewritten as spec-derived or deleted
- [ ] No replacement of tautology with new tautology
- [ ] Output report distinguishes "tautological tests reworked" from "new tests written"

---

### Bucket 3: New Skills

---

### Unit 15: Build `/fix` skill

**Files:**
- New: `plugins/workflow/skills/fix/SKILL.md`
- Update: `tap.json`

**SKILL.md structure:**

```markdown
---
name: fix
description: >
  Diagnose and repair a specific bug or broken behavior. Reproduces the issue,
  bisects to the root cause, writes a failing test that captures the bug, applies
  the minimal fix, then confirms. Use when something is verifiably broken — not
  for unverified hunches, refactoring, or feature additions.
user-invocable: true
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Agent, AskUserQuestion
model: opus
---

# Fix

You diagnose and repair a specific reported bug. The discipline here matters:
many bugs get "fixed" by changing code that affects the symptom but not the
cause, leaving a latent issue. You don't do that. You find the actual cause,
prove it with a test, and make the smallest change that fixes it.

## Important Note

A previous /fix skill was deleted (see workflow-suite-improvements-design.md)
because it consumed VERIFICATION.md from a now-removed /verify skill. This is
NOT that. This /fix is a diagnose-and-repair workflow.

## Phase 1: Reproduce

A bug you can't reproduce can't be reliably fixed.

1. **Get the symptom** — read the user's description, the error message, the
   stack trace. If anything is missing (steps to reproduce, environment,
   inputs), AskUserQuestion to fill the gap.
2. **Reproduce it locally** — run the exact failing path. Capture the error
   verbatim.
3. **Use the patterns skill** — read patterns relevant to the area to ensure
   your fix doesn't violate established structures.
4. **If you can't reproduce**, do not proceed. Document what you tried and
   ask the user for more info. A bug you can't reproduce is one you can't
   verify is fixed.

## Phase 2: Diagnose (Bisect to Root Cause)

Find what's actually wrong, not just what's near the symptom.

1. **Form a hypothesis** about where the bug lives (which file, which function,
   which assumption).
2. **Test the hypothesis** — read the suspect code, trace the data flow, add
   targeted logging or use the debugger if available.
3. **Bisect** — if the bug is recent, use git bisect to find the commit that
   introduced it. The commit's changes narrow the search dramatically.
4. **Identify the root cause** — name it specifically: "the X function assumes
   Y, but in case Z that assumption fails." Distinguish root cause from
   symptom: a NullPointerException is a symptom; "the user object is built
   without an email when login is via OAuth" is a cause.
5. **Avoid hypothesis fixation.** If the first hypothesis doesn't pan out,
   discard it and form a new one. Don't pile fixes on a wrong hypothesis.

## Phase 3: Capture in a Test

Before fixing, write a test that fails because of this bug. This test:
- Becomes the regression check that prevents the bug from returning
- Proves your fix actually fixes it (test goes from red to green)
- Documents the behavior you're committing to

Use the project's test framework. Place the test where the project's
conventions say it goes. Use existing fixtures and helpers.

If the bug is genuinely untestable (e.g., race condition that requires real
infrastructure), document why and write the closest test you can.

## Phase 4: Apply the Minimal Fix

The fix should be the smallest change that:
- Makes the failing test pass
- Doesn't break any existing tests
- Addresses the root cause, not the symptom

Resist the urge to refactor adjacent code, "improve" the surrounding logic,
or add defensive code beyond what fixes the bug. Those are separate concerns.
If you spot something genuinely worth refactoring, note it in the output for a
follow-up — don't pile it onto this fix.

## Phase 5: Confirm

1. Run the new test — it should now pass.
2. Run the full test suite — nothing else should have regressed.
3. Re-run the original reproduction case — the symptom should be gone.
4. Verify against the user's original report — does this resolve what they
   reported, not just what you think they reported?

## Output

- Modified source file(s)
- New test file or test addition
- Brief report:
  - **Root cause**: one paragraph
  - **Fix**: what changed and why
  - **Test added**: file path and what it asserts
  - **Adjacent issues noticed but NOT fixed**: list with rationale (separate concerns)

## Commit Workflow

After confirmation passes:
1. Stage the source change(s) and the new test
2. Commit with a message describing the bug and the fix
3. Do NOT push

## Guardrails

- Do not skip Phase 3 (test capture) — fixes without tests recur
- Do not "fix" symptoms when the cause is unclear — keep diagnosing
- Do not bundle unrelated improvements into a fix commit
- If the fix requires changes to multiple subsystems, the bug may be a
  design problem — stop and consider invoking /refactor-design instead
- If you cannot reproduce, do not fix — ask the user for more info
```

**tap.json entry:**

```json
{
  "name": "fix",
  "description": "Diagnose and repair a specific bug. Reproduces, bisects to root cause, writes a failing test, applies minimal fix, confirms. Use when something is verifiably broken.",
  "repo": "nklisch/skills",
  "tags": ["bugfix", "debugging", "diagnose", "repair", "agentic", "workflow"]
}
```

**Acceptance Criteria:**
- [ ] Skill exists with the 5-phase Reproduce → Diagnose → Test → Fix → Confirm shape
- [ ] Phase 1 fails closed if reproduction impossible
- [ ] Phase 3 (test capture) is mandatory, not optional
- [ ] tap.json includes the entry
- [ ] Skill description is distinct from old deleted /fix and from /implement

---

### Unit 16: Build `/review` skill

**Files:**
- New: `plugins/workflow/skills/review/SKILL.md`
- Update: `tap.json`

**SKILL.md structure:**

```markdown
---
name: review
description: >
  Review a specific code change — branch diff, commit, commit range, working tree,
  unpushed commits, or PR. Produces a structured review with prioritized findings.
  Different from /repo-eval (full repo) and /security-review (full repo, security
  domain). Use to audit a focused change before it merges or ships.
user-invocable: true
disable-model-invocation: true
allowed-tools: Read, Glob, Grep, Bash, Agent, AskUserQuestion, WebFetch
model: opus
---

# Review

You review a specific code change as a thoughtful peer would. The goal is not
to find every nit — the goal is to surface what genuinely matters: bugs hiding
in the change, design choices worth reconsidering, missing tests, security
concerns, breaking changes the author may not have noticed.

## Phase 1: Identify the Target

The target is flexible. Detect from the user's invocation, or AskUserQuestion:

| Target | How to fetch |
|--------|-------------|
| Branch diff vs base | `git diff {base}...HEAD` (default base: main) |
| Specific commit | `git show {sha}` |
| Commit range | `git diff {sha1}..{sha2}` |
| Working tree | `git diff` (uncommitted) |
| Unpushed commits | `git log @{u}..HEAD` + `git diff @{u}..HEAD` |
| PR by number | `gh pr view {N} --json` + `gh pr diff {N}` |

If the target is ambiguous, AskUserQuestion to clarify. If the target is empty
(no changes), tell the user and stop.

## Phase 2: Ground in the Change

Before judging, understand:

1. **Read the diff in full** — every modified file, not just summaries
2. **Read context** — for each modified function, read the surrounding code so
   you understand what the change is *for*, not just what it *does*
3. **Read the patterns skill** — to evaluate the change against established
   project structures
4. **Read CLAUDE.md** — project conventions matter for review
5. **Find the commit messages or PR description** — the author's stated intent
   helps you evaluate whether the change matches it

## Phase 3: Apply Review Lenses

Walk the change through these lenses. Not every lens applies to every change —
note explicitly which you skipped and why.

### Correctness
- Does the change do what it says it does?
- Are there edge cases the change handles incorrectly or doesn't handle?
- Are there off-by-one, null/nil, async race, or boundary issues?
- Does the change introduce any infinite loops, unbounded growth, or
  resource leaks?

### Tests
- Did the change include tests? If not, should it have?
- Do the tests test the contract or the implementation? (See test-quality
  for the framing — implementation-derived tests are tautological.)
- Are edge cases covered or only happy path?
- If the change fixes a bug, is there a regression test?

### Design
- Is the change consistent with the project's existing patterns?
- Does it introduce a new abstraction? Is the abstraction earned?
- Could this have been done more simply?
- Does the change push complexity in the right direction (toward boundaries,
  away from core domain logic)?

### Security
- Does the change touch authentication, authorization, input validation,
  secrets, or external requests? If so, evaluate per /security-review's
  domain checklist (don't run the full audit — just check the relevant items).
- Does the change introduce SQL injection, XSS, command injection, path
  traversal vectors?

### Breaking changes
- Does the change modify a public API, exported function signature, schema,
  or config format?
- If yes — is the breaking change intentional? Documented? Migrated?

### Comments and naming
- Are new functions, types, and complex logic adequately named?
- Are comments explaining *why* (worth keeping) vs *what* (deletable noise)?

## Phase 4: Synthesize

Group findings by severity:

- **Blocker** — must be fixed before merging (correctness bug, security
  vulnerability, undocumented breaking change)
- **Important** — should be addressed but not strictly blocking (missing tests,
  questionable design, naming issues that obscure intent)
- **Nit** — minor improvement opportunities (style polish, optional
  refactor, documentation enhancement)

If there are zero blockers and zero important findings, say so explicitly.
"This change is good to merge" is a valid output and a valuable one — don't
manufacture concerns.

## Output

Print the review to the conversation (don't write a file unless the user
asks). Structure:

```
# Review: {target description}

## Summary
{2-3 sentences: what the change does, overall assessment}

## Verdict
{Approve | Approve with comments | Request changes | Block}

## Findings

### Blockers
- **{title}** (`file:line`)
  {what's wrong, why it matters, suggested direction for the fix}

### Important
- ...

### Nits
- ...

## Notes
{Anything else: things you intentionally didn't review, scope you couldn't
verify, follow-up suggestions}
```

## Guardrails

- Do not pad with nits to look thorough — call out only what genuinely matters
- Do not invent issues to balance positive feedback — honest "looks good" is
  valuable
- Do not require tests for changes where they don't apply (typo fixes, comment
  changes) — judgment over rules
- Read the actual code, not just the diff — context matters more than diff
  delta
- If you don't understand the change well enough to judge it, say so —
  "I'd want the author to explain X before approving" is a valid output
- Use the patterns skill to evaluate against project structure
```

**tap.json entry:**

```json
{
  "name": "review",
  "description": "Review a specific code change — branch diff, commit, commit range, working tree, unpushed commits, or PR. Produces a prioritized review with blockers, important issues, and nits. Different from /repo-eval and /security-review which audit the full repo.",
  "repo": "nklisch/skills",
  "tags": ["review", "code-review", "pr", "diff", "audit", "agentic", "workflow"]
}
```

**Acceptance Criteria:**
- [ ] Skill accepts all six target types listed in Phase 1
- [ ] Review lenses cover correctness, tests, design, security, breaking changes, naming
- [ ] Findings classified as Blocker / Important / Nit
- [ ] Output goes to conversation by default, not a file
- [ ] Skill references patterns skill for structural evaluation
- [ ] tap.json includes the entry
- [ ] Skill description distinguishes from /repo-eval and /security-review

---

## Implementation Order

Resolved by dependency:

1. **Unit 1** (delete duplicate dir) — pure cleanup, no dependencies, do first
2. **Unit 7** (patterns-skill mention) — independent additions to 5 skills
4. **Unit 6** (pre-mortem) — independent additions to 3 skills
5. **Unit 8** (ideate attacks the idea) — self-contained
6. **Unit 9** (design's thinking phase) — self-contained
7. **Unit 10** (drop bold-refactor quantity target) — self-contained
8. **Unit 11** (refactor-design briefs) — self-contained
9. **Unit 12** (e2e-test-design handoff) — self-contained
10. **Unit 14** (test-quality reworks tautological tests) — self-contained
11. **Unit 13** (autopilot testing pass) — references Units 12 and 14, do after both
12. **Unit 3** (merge principles) — affects multiple skills via skill references; do after Unit 6/7 settle
13. **Unit 4** (merge feature + expand) — independent merger
14. **Unit 5** (merge style+structure creators) — independent merger
15. **Unit 15** (build /fix) — new skill, independent
16. **Unit 16** (build /review) — new skill, independent

Total: 15 units across 3 buckets (plus Unit 2 preserved as a removed-with-rationale record). Estimated as a single implement-orchestrator pass with possibly 2-3 sub-agents (cleanup/mergers, content additions, new skills).

## Verification Checklist

After all units land:

- [ ] `find plugins/workflow/skills -name "SKILL.md" | xargs grep -L "patterns"` returns no code-touching skill
- [ ] `repo-eval/repo-eval/` does not exist
- [ ] `tap.json` has entries for: principles, extend, refactor-conventions-creator, fix, review (and no entries for design-principles, implementation-principles, feature, expand, stylistic-refactor-creator, structural-refactor-creator)
- [ ] `tap.json` is valid JSON
- [ ] All version-bump-worthy changes captured in the workflow plugin's CHANGELOG
- [ ] `./scripts/bump-version.sh workflow minor` executed (this is a significant content change set, warrants minor bump per repo conventions)

## Risks

- **Loss of distinct auto-load triggers** for the merged skills (principles, extend, refactor-conventions-creator). Mitigation: each merged skill's description should include the keyword sets from both predecessors.
- **CHANGELOG churn**: this is a large overhaul; the changelog entry needs to clearly enumerate the breaking changes (renamed/deleted skills) so users can update their muscle memory and any wrappers.
- **Existing PROGRESS.md / design docs reference deleted skill names**: any in-flight project that mentions `/feature` or `/design-principles` will need updating. Mitigation: changelog notes provide a migration table.

## Rollback Plan

Each unit is committable independently. If a unit causes problems, `git revert` that unit's commit. Risky units to commit separately:
- Unit 3 (merge principles) — affects many references
- Unit 4 (merge feature + expand) — discoverability risk
- Unit 13 (autopilot testing pass) — biggest content change to most complex skill

Safe units to bundle: pure additions (Units 6, 7, 8, 9, 10, 11, 14), pure new skills (Units 15, 16).
