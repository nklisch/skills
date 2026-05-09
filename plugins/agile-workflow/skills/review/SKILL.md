---
name: review
description: >
  Review a substrate item at stage:review. Reads the item's design and implementation
  notes, runs a code review of the changes, classifies findings (blockers / important /
  nits), triages findings into items in the substrate (with appropriate tags), and
  advances the item to done if approved or back to implementing if changes needed.
  Triggers on items at stage:review or phrases like "review item X", "review this".
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Agent
model: opus
---

# Review

You review a substrate item that's at `stage: review` — a feature, story, or epic
whose work is done and ready for evaluation. The review is structured: blockers must
be fixed before advancing, important issues should be addressed, nits are optional.
Findings get triaged into the substrate as items with appropriate tags so they don't
disappear into prose.

## Trigger

The agent picks this skill when an item is at `stage: review`. Common phrases:
- "review feature X"
- "review this story"
- "is this ready to ship"
- "look at item Y"

The user can also explicitly invoke `/agile-workflow:review <id>`.

## Workflow

### Phase 1: Identify the target

If the user passed an id, target that item. Otherwise:

```bash
.work/bin/work-view --stage review --paths
```

If multiple items are at `review`, ask the user which one (or pick the most recent
by `updated:`).

### Phase 2: Read the item

Read the item file. Internalize:
- **Brief** — what was scoped
- **Design** — what was specified
- **Implementation notes** — what actually happened, including any deviations from
  design

If reviewing a feature with child stories, also read each child story's body
(get them via `work-view --kind story --parent <feature-id>`).

### Phase 3: Determine the change diff

For features and stories, the change diff is the git diff produced by the
implementation. Pick the right scoping pattern:

| Target | Command |
|---|---|
| Item's implementation commits | `git log --grep "<id>" --format='%H'`, then `git show <sha>` per |
| Current branch vs base | `git diff main...HEAD` (replace `main` with default branch) |
| Specific branch | `git diff main...<branch>` |
| Specific commit | `git show <sha>` |
| Commit range | `git diff <sha1>..<sha2>` |
| Working tree (uncommitted) | `git diff` |
| Unpushed commits | `git log @{u}..HEAD` then `git diff @{u}..HEAD` |
| PR by number | `gh pr view <N> --json files,additions,deletions,title,body`, then `gh pr diff <N>` |

For a feature with child stories, the diff spans all the stories' implementation
commits — find them by grepping for each story id, then unioning the patches.

If the diff is empty, tell the user and stop — there's nothing to review.

### Phase 4: Ground in the project

1. Read `CLAUDE.md` for conventions
2. Read `docs/PRINCIPLES.md` (or invoke the principles skill — it auto-loads)
3. Read foundation docs the change touches: `docs/SPEC.md`, `docs/ARCHITECTURE.md`

### Phase 5: Apply review lenses

Walk the change through each lens. Note explicitly which you skip and why.

**Correctness**:
- Does the change do what the design says?
- Edge cases handled? Off-by-one, null/undefined, async race, boundary issues?
- Resource leaks, infinite loops, unbounded growth?
- If a fix: does it address root cause or symptom?

**Tests**:
- Tests included for meaningful logic changes?
- Do tests verify the behavioral contract or implementation details?
- Edge cases covered, not just happy path?
- For bug fixes: regression test that would have caught the bug?

**Design alignment**:
- Does the implementation match the design (or are deviations documented)?
- Are abstractions earned (3+ usage sites or imminent need)?
- Could it be simpler?
- Does complexity push in the right direction (toward boundaries, away from core)?

**Security**:
- Does the change touch auth, authorization, input validation, secrets, external
  requests? Quick check of applicable items. (For full audit, that's `/agile-workflow:gate-security`.)
- SQL injection, XSS, command injection, path traversal?

**Breaking changes**:
- Does the change modify a public API, exported signature, schema, CLI, or config?
- If yes: intentional? Documented? Migration path?

**Foundation-doc alignment**:
- Does the implementation invalidate any foundation-doc assertion?
- If yes: did the implementer roll the doc forward?
- If foundation docs drifted: this is a finding (rolling-foundation principle).

**Naming and comments**:
- Are new functions, types, complex logic well-named?
- Are comments explaining *why* (high value) or *what* (usually noise)?

### Phase 6: Classify findings

- **Blocker** — must be fixed before advancing: correctness bug, security
  vulnerability, undocumented breaking change, foundation-doc drift, test that
  proves the change is wrong
- **Important** — should be addressed but not strictly blocking: missing tests for
  meaningful logic, questionable design, naming that obscures intent, minor security
  gap, refactor opportunity
- **Nit** — minor improvement: style polish, optional refactor, documentation
  enhancement

If there are zero blockers and zero important findings, say so plainly: "This change
looks good. Nothing blocking or significant to flag." Do not pad.

### Phase 7: Triage findings into items

For each finding above nit-level, create an item in the substrate so it doesn't
disappear into prose.

- **Blocker** → either fix inline (small) OR park as a story at
  `.work/active/stories/` with `stage: implementing`, `tags: [bug]` or appropriate
  category
- **Important** → park as a backlog item at `.work/backlog/` with appropriate tag,
  OR scope as a feature if substantial
- **Nit** → keep in conversation only; nits don't warrant items

These items have `gate_origin: null` because they're user-driven review findings,
not gate-driven. (Gates set `gate_origin`; manual review doesn't.)

### Phase 8: Decide and advance

**If no blockers**:
1. Advance the item: `stage: review → done`
2. If the item has `release_binding: <version>`, leave it in active (it'll be moved
   to `releases/<version>/` by `/agile-workflow:release-deploy`)
3. If no `release_binding` and no parent epic that's still active: move to
   `.work/archive/` via `git mv`
4. If the item is a child of an active epic: leave in active. The epic's stage
   advances when all children are done.

**If blockers exist**:
1. Set the item back to `stage: implementing`
2. Append a "Review findings" section to the item body listing blockers + the items
   you created for them
3. Don't archive

### Phase 9: Append review record

Update the item body with a "Review" section:

```markdown
## Review (YYYY-MM-DD)

**Verdict**: Approve | Approve with comments | Request changes | Block

**Blockers**: <list with item ids> (or "none")
**Important**: <list with item ids> (or "none")
**Nits**: <inline notes — not items>

**Notes**: <anything else worth recording>
```

### Phase 10: Commit

```bash
git add .work/active/<kind>s/<id>.md .work/active/stories/<finding-id>.md .work/backlog/<finding-id>.md  # whatever was created/modified
git commit -m "review: <id> (<verdict>)"
```

If the item moved to archive, include that in the commit:
```bash
git add .work/archive/<id>.md  # the moved file
git rm .work/active/<kind>s/<id>.md  # or use git mv before
```

## Output

In conversation, the structured review:

```
# Review: <id>

## Summary
<2-3 sentences>

## Verdict
Approve | Approve with comments | Request changes | Block

## Findings

### Blockers
- **<title>** (`file:line`): <what's wrong, why it matters>
  → Item: `<finding-item-id>`

### Important
- **<title>** (`file:line`): <explanation and direction>
  → Item: `<finding-item-id>`

### Nits
- Nit: <brief note> (`file:line`)

## Notes
<anything else>
```

If no findings above nit level: "This change looks good. Nothing blocking or
significant to flag. Item advanced to `stage: done`."

## Guardrails

- Don't pad with nits to look thorough.
- Don't invent concerns to balance positive feedback. "Looks good, ship it" is valuable.
- Don't require tests for changes that clearly don't need them (typo fixes, comment
  changes, config-only changes).
- Read actual files for context, not just diff lines.
- If you don't understand the change well enough to judge it, say so explicitly.
  "I'd want the author to explain why X before approving" is a valid finding.
- Findings above nit-level become items in the substrate. Don't let real concerns
  evaporate into review prose.
- Don't run the full security audit during review — for that, use
  `/agile-workflow:gate-security`. Review's security check is lightweight.
- Foundation-doc drift is a blocker, not a nit. Rolling-foundation is a hard rule.
- Don't advance an item past review unless the verdict is Approve. Pushing through
  blockers defeats the point of the stage.
