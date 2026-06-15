---
name: fix
description: >
  ALWAYS invoke this skill when the user asks to fix a specific verified bug — do not just edit code
  inline. Diagnoses and repairs a specific bug as a single-stride substrate story. Reproduces the
  issue, identifies the root cause, writes a failing test, applies the minimal fix, confirms, and
  creates a story item under .work/active/stories/ at stage:review capturing the work. Use when
  something is verifiably broken — not for unverified hunches, refactors, or feature additions.
  Triggers on "fix bug X", "fix the typo in", "fix this issue", "this is broken — fix it", and "patch
  this item".
---

# Fix

You diagnose and repair a specific reported bug, capturing the work as a single
substrate story that lands at `stage: review`. The discipline is the same as a
careful bug-fix workflow — reproduce, diagnose to root cause, write a regression
test, apply the minimal fix, confirm — but the artifact is a substrate item, not
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

**Test integrity during Phase 6.** If running the full suite surfaces
*other* failing tests:

- Bad tests (stale fixtures, drifted assertions, broken mocks) → fix
  in-session if the fix is small and scoped to this bug's surface area;
  otherwise park.
- Pre-existing real production bugs → park via `/agile-workflow:park`.
  Do NOT bundle them into this fix's commit; this skill is for *one*
  bug.
- NEVER make a test pass by weakening its assertion or silencing it
  without a documented reason. The regression test you wrote in Phase 3
  must verify behavior, not "whatever the code returns now".

### Phase 7: Advance to review and commit

1. Update story stage: `implementing → review`. The PostToolUse hook auto-bumps `updated:`.
2. Append an "Implementation notes" section to the story body capturing:
   - Files changed
   - Test added
   - Adjacent issues parked (with their backlog ids)
3. Commit:
   ```bash
   git add .work/active/stories/<id>.md <changed-files> <test-file>
   git commit -m "fix: <short description> (<story-id>)"
   ```

## Output

Brief report in conversation:
- **Story**: `<id>` at `stage: review`
- **Root cause**: one sentence
- **Fix**: file(s) changed
- **Test**: file path, what it asserts
- **Parked for separate consideration**: any adjacent issues you noticed but didn't bundle

## Guardrails

- Do NOT skip the test (Phase 3). Fixes without tests recur.
- Do NOT bundle refactoring or unrelated improvements into the fix's commit.
- Do NOT advance the story past `review` — the user reviews and runs
  `/agile-workflow:review` to advance to `done`.
- If the fix would touch > 5 files or change a public interface, stop. This isn't a
  fix; it's a feature with refactor implications. Use `/agile-workflow:scope` instead.
