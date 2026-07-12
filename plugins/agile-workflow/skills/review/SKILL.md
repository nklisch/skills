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
| [../principles/references/subagents.md](../principles/references/subagents.md) | Mapping fresh-context reviewer roles across Claude, Codex, and Pi. |
| [substrate-side-effects.md](references/substrate-side-effects.md) | Substrate mode needs findings filed, stages advanced or bounced, records appended, or a commit made. |

## Invocation Modes

| Invocation | Behavior |
|---|---|
| `review <id>` | Review one substrate item. |
| `review` | Default to `--all`: drain every item at `stage: review`. |
| `review --all` | Drain every item at `stage: review`. |
| `review <NL filter>` | Drain a filtered subset of the review queue. Interpret the filter against item bodies, tags, and parent chains. |
| `review <branch/commit/range/PR/wip>` | Out-of-band review. Review the target diff and print a verdict. |
| `review --review-weight <level> <target>` | Set independent-review effort: `none`, `light`, `standard`, `thorough`, or `maximum`. An explicit selector wins over caller notes and project configuration. |
| `deep review <target>` / `review --deep <target>` | Request deep risk coverage; reviewer topology still respects the effective review weight. |

In batch modes (`--all` / NL filter), loop through the matched set and output a
single consolidated summary at the end: verdicts per item plus total finding
counts.

## Review Weight And Lanes

Resolve one effective `review_weight` before choosing a lane. The valid scale is
`none | light | standard | thorough | maximum`; reject unknown values at the
boundary. Precedence is:

1. explicit `--review-weight <level>` or an unambiguous natural-language caller selector
2. an autopilot/production-skill caller note carrying the effective level
3. `review_weight` in `.work/CONVENTIONS.md`
4. `standard`

The weight is an effort budget, not a verdict and not a fixed orchestration
recipe. Risk, evidence, and item tier determine how to spend it; current models
choose the exact topology within the stated ceiling/intent. Record the effective
weight, its source, selected lane, and decisive risk/evidence signals in Review
Notes.

| Weight | High-level review intent |
|---|---|
| `none` | No independent reviewer. Perform an administrative review of the target's own green verification and acceptance evidence; close only when both are sufficient. |
| `light` | Stories remain verification-only. Larger items receive at most one focused fresh-context pass. |
| `standard` | Balanced risk-based default: fast low-risk stories, focused Standard work out of band, and fresh-context Deep review for features, epics, and escalated stories. |
| `thorough` | Increase independent coverage with additional fresh-context passes or reviewers where the risk surface benefits; keep complementary before adversarial. |
| `maximum` | For features/epics, use multi-model, multi-pass complementary → adversarial review when those capabilities exist. Dynamically escalate stories according to risk rather than reviewing every story identically. |

Lane selection is `weight + risk + evidence + kind-as-heuristic`. Resolve mode
first, gather enough context to identify risk, then choose:

| Starting point | Default lane | Evidence or risk adjustment |
|---|---|---|
| **story item** | **Fast** | Keep Fast only with recorded green verification and no escalation signal. Escalate to Deep for a caller-interface change, security or correctness surface, cross-cutting scope, a touched foundation-doc claim, or explicit `--deep`. |
| **out-of-band target** | **Standard** | Use Deep only when explicitly requested; otherwise calibrate the Standard lens walk to the observed risk. |
| **feature / epic item** | **Deep** | Kind signals aggregate contract risk; green child evidence informs the review but does not replace the parent's own review. |
| **explicit `--deep` target** | **Deep** | Request the strongest depth the effective weight permits; depth overrides the kind heuristic, not an explicit weight ceiling. |

Risk is not inferred from size alone. A tiny authentication or public-contract
change can require Deep; a broad mechanical change can remain Standard when its
evidence and contracts make that safe. `none` is the explicit exception to
independent fresh-context review: it still performs the item's own acceptance
check and records a verdict, so it never turns child completion into automatic
parent approval.

### Fast Lane

A genuinely low-risk story uses the fast lane; `none` also uses this
administrative shape for every tier:

1. Read the item body, recorded implementation scope, and acceptance criteria.
2. Confirm an implementation/verification record exists and reports green build
   and tests (or an explicit reason the change needs no executable checks).
3. Confirm the recorded evidence addresses the item's acceptance criteria.
4. Check explicitly for the escalation signals above. At `standard` or higher,
   switch a risky story to Deep before issuing a verdict. At `none` or `light`,
   stay within the selected effort ceiling and record the unexamined risk.
5. If verification and acceptance evidence are green, load
   [substrate-side-effects.md](references/substrate-side-effects.md) and advance
   `review -> done` with a one-line record naming the weight and evidence.
6. If evidence is absent or failing, run only cheap verification that fits the
   selected weight or bounce `review -> implementing` with a
   `## Review findings` note.

Skip the lens walk only when evidence and the effective weight permit it. Kind
alone never grants an advance, and `none` never means "done because children
are done."

### Standard Lane

Standalone reviews use the standard lane unless the caller explicitly requests
Deep. Load [target-resolution.md](references/target-resolution.md) and
[review-lenses.md](references/review-lenses.md), read enough surrounding code to
understand the change, then print the structured review. Do not create `.work`
items, advance stages, archive files, or commit metadata unless the user
explicitly converts the findings into substrate work.

### Deep Lane

Feature, epic, escalated-story, and explicit deep reviews use the deep lane when
the effective weight permits independent review. Load
[deep-review.md](references/deep-review.md) plus any target or lens reference it
points to. The evaluation must run in fresh context: use a different-class peer
when reachable; otherwise use the strongest same-harness fresh-context
sub-agent prompted with the reviewer posture. If the selected weight calls for
fresh review and neither is available, record the limitation and block rather
than approving from the host context. Deep reviews never become inline
self-review; this requirement overrides any older inline-fallback wording in a
lane reference.

Calibrate depth from the weight table instead of treating Deep as one fixed
recipe. `light` caps a larger item's review at one fresh pass; `standard`
balances coverage against observed risk; `thorough` adds complementary and
adversarial coverage where useful; `maximum` seeks multi-model, multi-pass
complementary → adversarial convergence for features/epics and dynamically
escalates risky stories. These are ceilings and intent, not mandatory agent
counts. Preserve complementary-before-adversarial order whenever both run (see
[../principles/references/models.md](../principles/references/models.md) §6).

## Workflow

### Phase 0: Resolve Mode, Weight, And Depth

Default to substrate mode when the target looks like a work item id, when any
item is at `stage: review`, or when autopilot delegated the review. Use
standalone mode when the user names a branch, commit, commit range, PR number,
`wip`, working tree, or otherwise asks for an out-of-band code review.

Resolve and validate effective `review_weight` using the precedence above before
any mutation. Explicit caller selection always wins.

If both interpretations are plausible, prefer substrate mode but ask the user
before mutating `.work`. If the caller is autopilot or a harness goal, do not
ask: choose substrate mode and the next review item.

Depth after applying the weight ceiling:
- **Fast/administrative**: low-risk story with green evidence, any story at
  `light`, or any tier at `none`.
- **Standard**: out-of-band target unless explicitly deep.
- **Deep**: feature/epic item, risk-escalated story, explicit `--deep`, or a
  robustness request when the weight permits fresh-context evaluation.

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
- Internalize the brief, design, implementation notes, acceptance criteria, and
  verification evidence.
- For a feature or epic, read direct child bodies and their review evidence;
  children inform but never replace the parent's own review.

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

For Standard and Deep lanes, load
[target-resolution.md](references/target-resolution.md). Use it to gather the
diff, PR metadata, commit messages, or epic aggregate scope. Fast uses the
recorded implementation scope and verification instead of re-analyzing the
diff.

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
- Run the evaluation in fresh context at the effective weight; do not approve
  inline when the selected weight requires a fresh reviewer and none is available.
- Apply the core lenses plus the applicable deep dimensions.

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
- Append the review record and commit the reviewed item's transition.
- After an approval reaches `done`, run Conservative Parent Roll-Up below.

### Conservative Parent Roll-Up

A child's approval is evidence that an ancestor may be ready for review; it is
never approval of the ancestor itself. After advancing any item to `done`:

1. Find its immediate parent. If there is none, stop.
2. Count all direct children across active and terminal tiers. If any child is
   non-terminal, stop the entire roll-up at this ancestor.
3. If the parent is `implementing`, advance it to `review`, append a `Children
   complete` note, and commit that transition. If it is already `review`, leave
   the stage unchanged. Never change an implementing/review parent directly to
   `done` just because its children are done.
4. Run this skill on the parent using the normal weight/risk/evidence lane
   selection. Features and epics therefore receive their own Deep review when
   independent review is enabled, or their own administrative acceptance review
   at `none`.
5. Only an Approve or Approve-with-comments verdict may advance the parent to
   `done`; commit that review transition. A bounce or block stops roll-up.
6. Once the parent is approved and `done`, repeat from step 1 for its parent.

This recursion can complete story → feature → epic in one review invocation,
but every ancestor crosses its own real `review` stage and receives its own
selected review lane at the same effective weight. Preserve active parent bodies
while walking the chain; terminal retention/archive handling applies only where
the substrate-side-effects contract says the item is no longer needed for an
active parent.

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
Also report each ancestor moved to `review`, approved to `done`, bounced, or
left waiting on a non-terminal child.

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
- Child completion never substitutes for a parent's review. Roll-up may move an
  implementing parent to `review`, but only that parent's selected lane may move
  it to `done`.
