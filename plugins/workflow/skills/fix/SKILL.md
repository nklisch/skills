---
name: fix
description: >
  Diagnose and repair a specific bug or broken behavior. Reproduces the issue, bisects
  to the root cause, writes a failing test that captures the bug, applies the minimal fix,
  then confirms. Use when something is verifiably broken — not for unverified hunches,
  refactoring, or feature additions. Different from /refactor-design (which restructures
  working code) and /implement (which builds from a design doc).
user-invocable: true
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Agent, AskUserQuestion
model: opus
---

# Fix

You diagnose and repair a specific reported bug. The discipline here matters: many bugs
get "fixed" by changing code that affects the symptom but not the cause, leaving a latent
issue that resurfaces. You don't do that. You find the actual cause, prove it with a test,
and make the smallest change that actually fixes it.

**Note:** A previous `/fix` skill was removed (see `docs/designs/completed/workflow-suite-improvements-design.md`)
because it consumed output from a now-removed `/verify` skill. This is a different skill —
a diagnose-and-repair workflow, not a gap-filling workflow.

## Arguments

- No arguments: fix will gather the bug description from you interactively
- Description argument: pass the bug report or symptom directly

## Phase 1: Reproduce

A bug you can't reproduce can't be reliably fixed.

1. **Get the symptom** — read the user's description, the error message, the stack trace,
   the failing test output. If anything critical is missing (steps to reproduce, environment,
   specific inputs), use **AskUserQuestion** to fill the gap before proceeding.
2. **Read CLAUDE.md** — understand the project's build commands, test commands, and conventions
3. **Use the patterns skill** if it exists — understand established structures in the area
   you'll be touching, so the fix doesn't violate conventions
4. **Reproduce locally** — run the exact failing path. Capture the error verbatim.
   Use Bash to run the test or command that demonstrates the bug.

**If you cannot reproduce**, do not proceed with a fix. Document exactly what you tried
and ask the user for more specific reproduction steps. A bug you can't reproduce is one
you can't verify is fixed.

## Phase 2: Diagnose (Bisect to Root Cause)

Find what's actually wrong, not just what's near the symptom.

1. **Form a hypothesis** — where does the bug live? Which file, function, or assumption
   is the source? Read the relevant code and trace the data flow.
2. **Test the hypothesis** — add targeted logging if needed, use the debugger if available,
   read the code path from the error to its origin.
3. **Use git bisect if the bug is recent** — `git bisect` narrows the search dramatically
   when the bug is a regression. Find the commit that introduced it; its changes tell you
   exactly where to look.
4. **Name the root cause explicitly** — not "the function fails" but "the X function assumes
   Y is always present, but in case Z it's null because the upstream handler doesn't set it
   when authentication is via OAuth."
5. **Avoid hypothesis fixation** — if the first hypothesis doesn't match the evidence, discard
   it entirely and form a new one. Don't pile fixes on a wrong diagnosis.

**Root cause vs symptom:** A NullPointerException is a symptom. "The user object is built
without an email field when login is via OAuth" is a root cause. Fix the root cause.

## Phase 3: Capture in a Test

Before writing the fix, write a test that fails because of this bug.

This test:
- Becomes the regression guard that prevents the bug from returning
- Proves your fix actually works (it goes from red to green)
- Documents the behavior you're committing to

Use the project's test framework. Follow the project's conventions for where tests live and
how they're structured. Use existing fixtures and helpers.

Run the test now — it should **fail**. If it passes, either the reproduction is wrong or the
test doesn't cover the actual bug path. Diagnose before proceeding.

**If the bug is genuinely untestable** (requires specific timing, external infrastructure
you can't replicate): document why, write the closest approximation you can, and note the
limitation clearly in your output.

## Phase 4: Apply the Minimal Fix

The fix is the smallest change that:
- Makes the failing test pass
- Doesn't break any existing tests
- Addresses the root cause, not the symptom

Resist the urge to:
- Refactor adjacent code that isn't causing the bug
- "Improve" surrounding logic while you're in there
- Add defensive code beyond what addresses the root cause
- Expand the fix's scope to "clean things up"

These are valid improvements — but they belong in a separate commit, separate concern.
If you notice something genuinely worth addressing, note it in your output for follow-up.

## Phase 5: Confirm

1. **Run the new test** — it should pass now
2. **Run the full test suite** — nothing else should have regressed
3. **Re-run the original reproduction** — the symptom should be gone
4. **Verify against the user's report** — does this resolve what they actually described?

If any step fails, return to Phase 2. Do not ship a fix you can't confirm works.

## Output

Brief report in conversation:

- **Root cause**: one paragraph naming the specific code path and assumption that was wrong
- **Fix**: what changed and why the change addresses the root cause
- **Test added**: file path and what it asserts
- **Adjacent issues noticed but NOT fixed**: brief list with rationale (separate concerns)

## Commit Workflow

After confirmation passes:
1. Stage the source change(s) and the new test
2. Commit with a clear message: "fix: {short description of what was wrong}"
3. Do NOT push

## Guardrails

- Do not skip Phase 3 (write the test first) — fixes without tests recur
- Do not "fix" symptoms when the root cause is unclear — keep diagnosing
- Do not bundle refactoring or unrelated improvements into a fix commit
- If reproducing or diagnosing requires the user to take action (specific environment,
  credentials, test data), use AskUserQuestion — don't guess
- If the fix requires changes to multiple independent subsystems, consider whether this is
  actually a design problem. If so, stop and consider invoking /refactor-design instead.
  A symptom with a deep architectural cause can't be fixed with a targeted patch.
