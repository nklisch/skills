---
name: review
description: >
  ALWAYS invoke this skill when the user asks to review a substrate item, an item is at stage:review,
  or the user says "review this". Substrate-first: reviews tracked items, files follow-up items, and
  advances or bounces them. Also supports out-of-band reviews of branches, commits, PRs, working
  trees, or unpushed commits without substrate side effects. Uses fast, standard, and deep lanes; deep
  review runs in fresh context when useful. Triggers on "review item X", "review this", "review this item",
  "deep review", "is this ready", and "verdict on this item".
---

# Review

You review work that is ready for evaluation. The primary path is a substrate
item at `stage: review`: a feature, story, or epic whose work is done and ready
to advance or bounce. The skill can also perform an out-of-band review of a
branch, commit, PR, working tree, or unpushed commits when the user wants a
one-off verdict outside the substrate.

Core invariant: resolve the mode before changing files. **Substrate mode** may
create `.work` findings, advance or bounce items, archive files, and commit
review metadata. **Standalone mode** prints a review and leaves the substrate and
git history alone unless the user explicitly asks to track or commit the review.

## References

Load only the reference needed for the selected lane:

| Reference | Load when |
|---|---|
| [target-resolution.md](references/target-resolution.md) | Determining the target diff, PR, branch, commit range, or epic aggregate scope. |
| [review-lenses.md](references/review-lenses.md) | Running a standard or deep review of code changes. |
| [deep-review.md](references/deep-review.md) | The lane is feature, epic, explicit `--deep`, or the user asks for a more robust review. |
| [../principles/references/models.md](../principles/references/models.md) | Picking the reviewer/peer, host→peer pairing, and the two-phase advisory→adversarial order for deep reviews. |
| [substrate-side-effects.md](references/substrate-side-effects.md) | Substrate mode needs findings filed, stages advanced or bounced, records appended, or a commit made. |

## Invocation Modes

| Invocation | Behavior |
|---|---|
| `review <id>` | Review one substrate item. |
| `review` | Default to `--all`: drain every item at `stage: review`. |
| `review --all` | Drain every item at `stage: review`. |
| `review <NL filter>` | Drain a filtered subset of the review queue. Interpret the filter against item bodies, tags, and parent chains. |
| `review <branch/commit/range/PR/wip>` | Out-of-band review. Review the target diff and print a verdict. |
| `deep review <target>` / `review --deep <target>` | Use deep mode for a substrate item or out-of-band target. |

In batch modes (`--all` / NL filter), loop through the matched set and output a
single consolidated summary at the end: verdicts per item plus total finding
counts.

## Review Lanes

Review cost should match what the target can actually surface. Resolve mode
first, then pick the lane:

| Target | Lane | What runs |
|---|---|---|
| **story item** | **Fast** | Confirm the green implementation verification already recorded by `implement`, then advance and roll up. No lens walk, no diff re-analysis, no peer. |
| **out-of-band target** | **Standard** | Review the diff in the current context using the core lenses. Print a structured verdict. No substrate writes, no stage changes, no commit. |
| **feature / epic item** | **Deep** | Full lens review using fresh-context evaluation when available. |
| **explicit `--deep` target** | **Deep** | Use the deep lens set even for an out-of-band target. For a story item, keep the fast lane unless the caller explicitly asked for `--deep`. |

### Fast Lane

Stories use the fast lane by default:

1. Read the story body.
2. Confirm an implementation/verification record exists and reports green build
   and tests.
3. If verification is present and green, load
   [substrate-side-effects.md](references/substrate-side-effects.md) and advance
   `review -> done` with a one-line record:
   `Verdict: Approve - story verified by implement; fast-lane advance`.
4. If verification is absent or failing, either run cheap verification yourself
   or bounce `review -> implementing` with a `## Review findings` note.

Skip the lens walk for fast-lane stories. Do not deep-review a story unless the
caller explicitly requested `--deep`.

### Standard Lane

Standalone reviews use the standard lane. Load
[target-resolution.md](references/target-resolution.md) and
[review-lenses.md](references/review-lenses.md), read enough surrounding code to
understand the change, then print the structured review. Do not create `.work`
items, advance stages, archive files, or commit metadata unless the user
explicitly converts the findings into substrate work.

### Deep Lane

Feature, epic, and explicit deep reviews use the deep lane. Load
[deep-review.md](references/deep-review.md) plus any target or lens reference it
points to. Prefer fresh-context evaluation when available; if no fresh reviewer
is reachable, do a degraded inline deep review and record that limitation in
Notes rather than skipping the review. Deep reviews follow the two-phase order
— **completeness/advisory, then adversarial** — and for a feature/epic (deep or
complex scope) use **two different model classes** when available, one per phase
(see [../principles/references/models.md](../principles/references/models.md)).

## Workflow

### Phase 0: Resolve Mode And Depth

Default to substrate mode when the target looks like a work item id, when any
item is at `stage: review`, or when autopilot delegated the review. Use
standalone mode when the user names a branch, commit, commit range, PR number,
`wip`, working tree, or otherwise asks for an out-of-band code review.

If both interpretations are plausible, prefer substrate mode but ask the user
before mutating `.work`. If the caller is autopilot or a harness goal, do not
ask: choose substrate mode and the next review item.

Depth:
- **Fast**: story item with green implementation verification.
- **Standard**: out-of-band target or explicitly lightweight review.
- **Deep**: feature/epic item, explicit `--deep`, or a review where the user asks
  for robustness across design, contracts, release, and operational dimensions.

### Phase 1: Identify The Target

Substrate mode:
- If the caller passed an item id, target that item.
- Otherwise run `.work/bin/work-view --stage review --paths`.
- If multiple items are at `review` and autopilot delegated the call, pick the
  most recent by `updated:` and proceed.
- If multiple items are at `review` for an interactive caller, ask which one.

Standalone mode:
- Use the branch, commit, range, PR, working tree, or `wip` target from the user.
- If the target is ambiguous, ask before fetching the diff.

### Phase 2: Gather Context

Substrate mode:
- Read the item file.
- Internalize the brief, design, implementation notes, and verification evidence.
- For a feature, also read each child story body.

Standalone mode:
- Read the user's stated target.
- Read PR description or commit messages when available.
- Read enough surrounding project context to understand the author's intent.

All modes:
- Read `AGENTS.md` / `CLAUDE.md` for conventions when present.
- Read `.agents/rules/*.md` (if present) — the project's force-loaded agent
  rules (tag semantics, test integrity, review policy).
- Read foundation docs the change touches, such as `docs/SPEC.md` or
  `docs/ARCHITECTURE.md`.

### Phase 3: Determine The Change Scope

Load [target-resolution.md](references/target-resolution.md). Use it to gather
the diff, PR metadata, commit messages, or epic aggregate scope.

If the non-epic diff is empty:
- Autopilot substrate mode: advance only if the item has complete green
  verification evidence; otherwise bounce for missing review scope.
- Interactive substrate mode: ask which range to review.
- Standalone mode: report that there is no diff to review and stop.

### Phase 4: Review

Fast lane:
- Confirm verification and skip code lenses.

Standard lane:
- Load [review-lenses.md](references/review-lenses.md).
- Walk the applicable lenses and note any skipped lens with the reason.

Deep lane:
- Load [deep-review.md](references/deep-review.md).
- Use fresh-context evaluation when available.
- Apply the core lenses plus the deep dimensions.

### Phase 5: Classify Findings

- **Blocker**: must be fixed before advancing or merging. Examples:
  correctness bug, security vulnerability, undocumented breaking change,
  foundation-doc drift, or a test that proves the change is wrong.
- **Important**: should be addressed but is not strictly blocking. Examples:
  missing tests for meaningful logic, questionable design, unclear naming, minor
  security gap, or refactor opportunity.
- **Nit**: optional improvement, style polish, small documentation improvement,
  or nonessential refactor.

If there are zero blockers and zero important findings, say so plainly. Do not
pad the review with invented concerns.

### Phase 6: Finish

Standalone mode:
- Print the structured review.
- Do not modify `.work`.
- Do not commit anything.
- If the user asks to track findings, load
  [substrate-side-effects.md](references/substrate-side-effects.md) and convert
  only the requested findings into substrate work.

Substrate mode:
- Load [substrate-side-effects.md](references/substrate-side-effects.md).
- File above-nit findings into the substrate.
- Advance the item if there are no blockers, or bounce it if blockers exist.
- Append the review record.
- Commit the substrate changes.

## Output

```markdown
# Review: <target>

## Summary
<2-3 sentences>

## Verdict
Approve | Approve with comments | Request changes | Block

## Findings

### Blockers
- **<title>** (`file:line`): <what is wrong, why it matters>
  -> Item: `<finding-item-id>` (substrate mode only)

### Important
- **<title>** (`file:line`): <explanation and direction>
  -> Item: `<finding-item-id>` (substrate mode only)

### Nits
- Nit: <brief note> (`file:line`)

## Notes
<mode, depth, skipped lenses, limitations, or anything else worth recording>
```

If no findings above nit level in substrate mode: "This change looks good.
Nothing blocking or significant to flag. Item advanced to `stage: done`."

If no findings above nit level in standalone mode: "This change looks good.
Nothing blocking or significant to flag."

## Guardrails

- Resolve mode before making changes. Substrate mode may mutate `.work`;
  standalone mode prints a review and leaves the workspace alone.
- Do not pad with nits to look thorough.
- Do not invent concerns to balance positive feedback. "Looks good, ship it" is
  valuable.
- Do not require tests for changes that clearly do not need them: typo fixes,
  comment-only changes, or config-only changes.
- Read actual files for context, not just diff lines.
- If you do not understand the change well enough to judge it, say so
  explicitly. "I would want the author to explain why X before approving" is a
  valid finding.
- In substrate mode, findings above nit-level become items. Do not let real
  concerns evaporate into review prose.
- Review's security check is lightweight. For a full security gate, use
  `/agile-workflow:gate-security`.
- Foundation-doc drift is a blocker, not a nit. Rolling foundation is a hard
  rule.
- Do not advance an item past review unless the verdict is Approve or Approve
  with comments. Pushing through blockers defeats the point of the stage.
