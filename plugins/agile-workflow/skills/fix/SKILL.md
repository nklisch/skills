---
name: fix
description: >
  ALWAYS invoke this skill when the user asks to fix a specific verified bug — do not just edit code
  inline. Diagnoses and repairs the bug as a focused substrate story: reproduces it, identifies the
  root cause, writes a failing test, applies the minimal fix, verifies it, and continues through
  review to done unless the caller requests stop-at-review. Use when something is verifiably broken,
  not for unverified hunches, refactors, feature additions, or architectural work. Triggers on "fix
  bug X", "fix the typo in", "fix this issue", "this is broken — fix it", and "patch this item".
---

# Fix

You diagnose and repair a specific reported bug, capturing the work as a focused
substrate story that completes through its review lane by default. The discipline
is reproduce, diagnose to root cause, write a regression test, apply the minimal
fix, confirm, and honor review's verdict. The artifact is the substrate item, not
a separate fix doc.

## When to invoke

Trigger phrases:
- "fix bug X", "fix the issue with Y", "fix this"
- "the typo in foo.md should be Z"
- "I'm seeing error X when Y happens"

Skip if:
- User wants a refactor (no broken behavior) → use `/agile-workflow:scope` with
  `tags: [refactor]`
- User wants a new feature → use `/agile-workflow:scope`
- The bug requires architectural changes spanning multiple subsystems → scope a
  feature instead, fix is for targeted patches

## Workflow

### Phase 1: Reproduce

A bug you can't reproduce can't be reliably fixed.

1. Get the symptom from the user's input — error message, stack trace, failing test,
   exact steps. If anything critical is missing (steps, environment, inputs), ask
   the user.
2. Read `AGENTS.md` / `CLAUDE.md` for build and test commands, plus
   `.agents/rules/*.md` (if present) — the project's force-loaded agent rules
   (tag semantics, test integrity, review policy).
3. Reproduce locally. Capture the error verbatim.

If you can't reproduce, halt and ask the user for more specific reproduction steps.

### Phase 2: Diagnose to root cause

1. Form a hypothesis. Read the relevant code; trace the data flow from symptom to source.
2. Test the hypothesis (logging, debugger, code reading).
3. Use `git bisect` if the bug is a recent regression.
4. Name the root cause explicitly — not "the function fails" but the specific
   assumption that's wrong, and where.

A NullPointerException is a symptom. "The user object is built without an email
field when login is via OAuth" is a root cause. Fix the root cause.

### Phase 3: Capture in a test

Before writing the fix, write a test that fails because of this bug. Use the project's
test framework. Run it; confirm it fails. The test becomes the regression guard.

If the bug is genuinely untestable (timing-dependent, external infra), document that
in the story body and write the closest approximation.

### Phase 4: Create the story item

Create `.work/active/stories/<id>.md`:

```yaml
---
id: story-fix-<short-slug>
kind: story
stage: implementing
tags: [bug]
parent: null
depends_on: []
release_binding: null
gate_origin: null
created: YYYY-MM-DD
updated: YYYY-MM-DD
---

# <one-line description>

## Symptom
<what the user reported, verbatim if useful>

## Root cause
<one paragraph: specific code path and assumption that was wrong>

## Fix approach
<what's changing, why it addresses the root cause>

## Regression test
<file path and what it asserts>
```

### Phase 5: Apply the minimal fix

The smallest change that:
- Makes the failing test pass
- Doesn't break any existing tests
- Addresses the root cause, not the symptom

**Resist the urge to:**
- Refactor adjacent code that isn't causing the bug
- "Improve" surrounding logic while you're in there
- Add defensive code beyond what addresses the root cause
- Expand the fix's scope to "clean things up"

These are valid improvements — but they belong in a separate concern. If you
notice something genuinely worth addressing, park it via `/agile-workflow:park`
for separate consideration — don't bundle.

### Phase 6: Confirm (four-step checklist)

1. **Run the new test** — it passes now
2. **Run the full test suite** — nothing else regressed
3. **Re-run the original reproduction** — the symptom is gone
4. **Verify against the user's report** — does this resolve what they actually
   described? (A test passing is necessary but not sufficient — confirm the
   *symptom* the user reported is gone.)

If any step fails, return to diagnosis. Do not ship a fix you can't confirm works.

**Test integrity during Phase 6.** Follow the project's test-integrity rules and
the worker posture in `../principles/references/subagents.md`: fix bad tests
in-session, park other production bugs rather than bundling them, and never game
a test to make it pass.

### Phase 7: Commit and complete the lifecycle

1. Update the story stage: `implementing → review`. The PostToolUse hook
   auto-bumps `updated:`.
2. Append an "Implementation notes" section capturing:
   - Execution capability selected from risk and scope, plus the rationale
   - Effective `review_weight` and its source
   - Files changed
   - Test added
   - Adjacent issues parked (with backlog ids)

   Choose capability without a routine model-tier question unless the caller or
   project explicitly overrides it. Resolve review weight from an explicit caller
   override, then project convention, otherwise `standard`; the principles and
   review skills own the weight matrix.
3. Commit the fix:
   ```bash
   git add .work/active/stories/<id>.md <changed-files> <test-file>
   git commit -m "fix: <short description> (<story-id>)"
   ```
4. Unless the caller explicitly requested `stop-at-review` (including "stop at
   review", "leave at review", or "hand off for review") or a project convention
   sets that boundary, invoke `/agile-workflow:review <id>` in the same invocation
   and forward the effective `review_weight`. The review lane owns its required
   context and verdict:
   - approve: advance and commit `review → done`
   - bounce: append `## Review findings`, return the story to `implementing`, and
     report the bounce
   - blocker: append `## Blocker` and report it without claiming completion

A weight of `none` skips independent review, but the review lane still requires
the same green verification and acceptance evidence before administrative
closure. Review remains a real lifecycle act, not silent self-approval. With
`stop-at-review`, leave the committed story at `review` and report the explicit
boundary.

## Output

Brief report in conversation:
- **Story**: `<id>` at `stage: done`, `stage: review` by explicit override, or
  `stage: implementing` after a documented bounce
- **Review**: lane verdict, limitation, or blocker
- **Root cause**: one sentence
- **Fix**: file(s) changed
- **Test**: file path and behavior asserted
- **Execution capability**: choice and rationale
- **Review weight**: effective value and source
- **Parked for separate consideration**: adjacent issues not bundled

## Guardrails

- Do NOT skip the test (Phase 3). Fixes without tests recur.
- Do NOT bundle refactoring or unrelated improvements into the fix's commit.
- Do not self-approve at `review`; invoke the review lane and honor its verdict.
- Broad scope (for example, many files, a public-interface change, or multiple
  subsystems) is a signal that this is a feature rather than a targeted fix, not
  a review-stop rule. Route it through `/agile-workflow:scope`.
