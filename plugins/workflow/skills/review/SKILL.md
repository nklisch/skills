---
name: review
description: >
  Review a specific code change — branch diff, commit, commit range, working tree,
  unpushed commits, or PR by number. Produces a structured review with Blockers,
  Important issues, and Nits. Different from /repo-eval (full repository audit) and
  /security-review (full repository, security domain only). Use when you want a
  peer review of a focused change before it merges or ships.
user-invocable: true
disable-model-invocation: true
allowed-tools: Read, Glob, Grep, Bash, Agent, AskUserQuestion, WebFetch
model: opus
---

# Review

You review a specific code change as a thoughtful peer would. The goal is not to find
every nit — it's to surface what genuinely matters: bugs hiding in the change, design
choices worth reconsidering, missing tests, security concerns, breaking changes the
author may not have noticed.

A confident "this looks good, ship it" is as valuable as a list of blockers. Don't
manufacture concerns to look thorough.

## Arguments

- No arguments: review the current branch diff vs main
- Target argument: specify what to review — branch name, commit SHA, SHA range, PR number, or `wip`

## Phase 1: Identify the Target

Detect the target from the user's argument, or use the default (current branch vs main).

| Target | Command |
|--------|---------|
| Current branch vs base | `git diff main...HEAD` (or replace `main` with detected default branch) |
| Specific branch | `git diff main...{branch}` |
| Specific commit | `git show {sha}` |
| Commit range | `git diff {sha1}..{sha2}` |
| Working tree (uncommitted) | `git diff` |
| Unpushed commits | `git log @{u}..HEAD` then `git diff @{u}..HEAD` |
| PR by number | `gh pr view {N} --json files,additions,deletions,title,body` then `gh pr diff {N}` |

If the diff is empty, tell the user and stop — there is nothing to review.

If the target is ambiguous, use **AskUserQuestion** to clarify before fetching the diff.

## Phase 2: Ground in the Change

Before judging anything, understand what you're looking at.

1. **Read the diff in full** — every file modified, not just counts
2. **Read context** — for each modified function, read the surrounding code in the actual
   file (not just the diff hunk) to understand what the change is *for*, not just what
   it *does*. Use the Explore agent for large changes with many files.
3. **Use the patterns skill** if it exists — evaluate the change against established
   project structures
4. **Read CLAUDE.md** — project conventions and standards
5. **Read commit messages or PR description** — the author's stated intent. Evaluate
   whether the change matches it.

## Phase 3: Apply Review Lenses

Walk the change through each lens. Note explicitly which you skip and why.

### Correctness
- Does the change do what it says it does?
- Are there edge cases the change handles incorrectly or doesn't handle at all?
- Are there off-by-one, null/nil/undefined, async race, or boundary issues?
- Does the change introduce infinite loops, unbounded growth, or resource leaks?
- If the change fixes a bug, does it fix the actual root cause or just the symptom?

### Tests
- Did the change include tests? For meaningful logic changes, it should have.
- Do the tests verify the behavioral contract or the implementation?
  (Tests that break on refactoring but catch no bugs are testing the wrong thing.)
- Are edge cases covered, or only the happy path?
- If this is a bug fix, is there a regression test that would have caught this bug earlier?

### Design
- Is the change consistent with the project's established patterns?
- Does it introduce a new abstraction? If so, is the abstraction earned — does it exist
  in 3+ places, or would it exist in the future? A premature abstraction is worse than
  duplication.
- Could this have been done more simply?
- Does the change push complexity in the right direction (toward boundaries, away from
  core domain logic)?

### Security
- Does the change touch auth, authorization, input validation, secrets, or external
  requests? If so, quickly check the relevant items from the security domain checklists
  (do NOT run a full /security-review — just the applicable items).
- Does the change introduce SQL injection, XSS, command injection, or path traversal?

### Breaking changes
- Does the change modify a public API, exported function signature, schema, CLI interface,
  or config format?
- If yes — is the breaking change intentional? Is it documented? Is there a migration path?

### Comments and naming
- Are new functions, types, and complex logic well-named?
- Are comments explaining *why* (high value) vs *what* (usually noise)?
- Is anything undocumented that future maintainers will need to understand?

### Foundation-doc alignment

**Rolling-foundation principle (auto-loaded by `/principles`):** Foundation docs in
`docs/` (VISION, SPEC, ARCHITECTURE) describe the project's vision and current intent —
never its history. They roll forward in place.

- Does the change invalidate any assertion in `docs/VISION.md`, `docs/SPEC.md`, or
  `docs/ARCHITECTURE.md`?
- If yes — were those docs updated in the same change set to reflect the new reality?
- Did the change introduce "previously" / "in v1.x" / migration prose into a foundation
  doc? (Should not — git is the audit trail; the doc carries the present.)

Foundation-doc drift is **important** at minimum, **blocker** if the docs are part of
the project's published surface or if the divergence is large.

## Phase 4: Synthesize and Report

Classify findings:
- **Blocker** — must be fixed before merging: correctness bug, security vulnerability,
  undocumented breaking change, test that proves the change is wrong
- **Important** — should be addressed but not strictly blocking: missing tests for
  meaningful logic, questionable design, naming that obscures intent, minor security gap
- **Nit** — minor improvement: style polish, optional refactor, documentation enhancement.
  Prefix with "Nit:" so the author knows these are optional.

If there are zero blockers and zero important findings, say so plainly: "This change looks
good. Nothing blocking or significant to flag." Do not pad.

## Output

Print the review to the conversation. Only write a file if the user explicitly requests it.

```
# Review: {target description}

## Summary
{2-3 sentences: what the change does, overall assessment}

## Verdict
Approve | Approve with comments | Request changes | Block

## Findings

### Blockers
- **{title}** (`file:line`)
  {what's wrong, why it matters, direction for the fix — not the fix itself}

### Important
- **{title}** (`file:line`)
  {explanation and suggested direction}

### Nits
- Nit: {brief note} (`file:line`)

## Notes
{Anything else: things intentionally not reviewed, scope you couldn't verify,
follow-up suggestions worth considering separately}
```

If any section has no findings, omit it entirely.

## Guardrails

- Do not pad with nits to look thorough — call out only what genuinely matters
- Do not invent concerns to balance positive feedback — "looks good" is valuable
- Do not require tests for changes that clearly don't need them (typo fixes, comment
  changes, config-only changes) — apply judgment
- Read the actual files for context, not just the diff lines — context is everything
- If you don't understand the change well enough to judge it, say so explicitly —
  "I'd want the author to explain why X before approving" is a valid finding
- Security checks during review are lightweight (is anything obviously wrong?),
  not comprehensive — for a full security audit, use /security-review
