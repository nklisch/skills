---
name: review
description: >
  ALWAYS invoke this skill when the user asks to review a substrate feature or standalone story, an
  eligible item is at stage:review, or the user says "review this". Routes by item scope: child
  stories close on verification without review, standalone stories get a bounded inline pass,
  features get integrated review, and epics get deeper aggregate review. Also supports out-of-band
  reviews of branches, commits, PRs, working trees, or unpushed commits without substrate side
  effects. Uses standard and deep lanes with fresh context when useful.
---

# Review

Review integrated work at its real contract boundary without serializing later
implementation. An item at `review` has completed verified implementation and
therefore satisfies downstream `depends_on` edges while review runs. In substrate mode that
boundary is a **feature at `stage: review`**. Child stories are design and
acceptance checkpoints: implementation verification advances them directly to
`done`; they never enter review. A standalone story (`parent: null`) is the narrow
exception and receives a bounded inline review, never an independent,
fresh-context, or cross-model review. Epics receive their own deeper aggregate
review once all child features are done; broader review is valuable because
integration and capability gaps emerge above the child diff.

The skill also supports out-of-band review of a branch, commit, PR, working tree,
or unpushed commits. Resolve the mode before changing files:

- **Substrate mode** reviews features, epics, or standalone stories, may file findings,
  advances or bounces the target, rolls eligible parents to `review`, and commits
  review metadata.
- **Standalone mode** prints a review and leaves the substrate and git history
  alone unless the user explicitly asks to track findings.

## References

Load only what the selected path needs:

| Reference | Load when |
|---|---|
| [target-resolution.md](references/target-resolution.md) | Determining a feature/epic aggregate, PR, branch, commit range, or standalone target. |
| [review-lenses.md](references/review-lenses.md) | Reviewing code changes. |
| [deep-review.md](references/deep-review.md) | A feature, epic, or explicit deep target needs fresh-context breadth. |
| [../principles/references/models.md](../principles/references/models.md) | Selecting different-class or same-harness fresh-context reviewers. |
| [../principles/references/subagents.md](../principles/references/subagents.md) | Building a fresh-context reviewer brief. |
| [substrate-side-effects.md](references/substrate-side-effects.md) | Filing findings, changing reviewed-item stages, rolling up parents, archiving, or committing. |

## Invocation modes

| Invocation | Behavior |
|---|---|
| `review <feature-id>` | Review one feature at `stage: review`. |
| `review` / `review --all` | Drain every eligible feature, epic, and standalone story at `stage: review`; normalize legacy child stories. |
| `review <NL filter>` | Drain matching review-ready items using kind-appropriate lanes. |
| `review <story-id>` | If child: do not review; normalize from verification. If standalone: run bounded inline review without an independent/cross-model reviewer. |
| `review <epic-id>` | After all child features are done, run the epic's deeper aggregate review. |
| `review <branch/commit/range/PR/wip>` | Review out of band and print a verdict. |
| `review --review-weight <level> <target>` | Set feature/epic/standalone independent-review effort: `none`, `light`, `standard`, `thorough`, or `maximum`. |
| `review --deep <target>` | Request the strongest depth permitted by the effective weight. |

In batch modes, run independent feature and epic reviews concurrently when
reviewer capacity allows; they do not need to be sequential. Output one
consolidated summary with verdicts per reviewed item and total finding counts.

## Review weight

Resolve one effective `review_weight`: explicit caller selector, caller note,
`.work/CONVENTIONS.md`, then `standard`. The weight is an effort budget, not a
verdict or fixed agent count.

| Weight | Feature/epic/standalone intent |
|---|---|
| `none` | No independent reviewer. Administratively require green integrated verification and acceptance evidence. |
| `light` | At most one focused fresh-context pass where feature or epic risk warrants it. |
| `standard` | Balanced fresh-context feature review and a deeper fresh-context epic review. |
| `thorough` | Additional complementary and adversarial coverage where useful. |
| `maximum` | Multi-model, multi-pass complementary → adversarial review for features and epics when available. |

Child stories do not consume review weight. Standalone stories always use the
same bounded inline lane regardless of weight and never spawn an independent or
cross-model reviewer. Risk broad enough to deserve independent review means the
work should be scoped as a feature. A final autopilot completion review may
inspect an aggregate bundle in addition to the epic item review; neither turns
child stories into review targets.

## Lanes

### Story routing

Resolve `parent` before doing review work.

**Child story (`parent: <feature-id>`) — direct closure, not review:**

1. Read implementation notes and confirm green verification addresses the
   checkpoint.
2. Advance directly to `done`, or return to `implementing` for missing/failing
   evidence. Do not run code-review lenses or spawn a reviewer.
3. If all siblings are now `done`, make the parent feature review-ready after
   integrated feature verification.

New production skills must never put child stories into `review`; this path only
normalizes legacy state.

**Standalone story (`parent: null`) — bounded inline review:**

1. Read the story, implementation diff, reproduction/acceptance evidence, and
   verification record.
2. Walk the applicable core review lenses in the host context, bounded to the
   story's narrow scope.
3. Never spawn an independent, fresh-context, or cross-model reviewer, regardless
   of review weight or risk. If that depth is warranted, bounce and rescope the
   work as a feature.
4. Approve to `done` or bounce to `implementing` with durable findings.

### Feature and epic review

A feature is the normal substrate implementation-review unit. Green child-story
evidence is input, not approval: review the integrated feature contract,
aggregate diff, and acceptance criteria.

An epic receives a separate, deeper aggregate review after every child feature
is done. Do not repeat line-level feature review. Instead inspect end-to-end
capability completeness, cross-feature contracts, cumulative foundation-doc
alignment, operational/release interactions, and risks that only appear at the
larger boundary. In general, review depth rises with scope; tiny-scope review is
kept deliberately light to avoid pedantry and over-engineering.

Load target resolution, review lenses, and deep-review guidance for both tiers.

When independent review is enabled, use a different-class reviewer when
available; otherwise use the strongest suitable same-harness fresh-context
reviewer. Label a pass cross-model only when the selected model class differs
from the host. Preserve complementary-before-adversarial order. If the selected
weight requires fresh context and no path is available, record the limitation
and block rather than approving inline.

### Standalone review

Resolve the branch, commit, range, PR, working tree, or unpushed target. Walk the
applicable lenses and print findings. Do not mutate `.work` or commit unless the
user explicitly requests tracking.

## Workflow

### Phase 0: Resolve mode and target kind

Prefer substrate mode for matching active item ids or when review-ready features
exist. Use standalone mode for named branches, commits, ranges, PRs, or working
trees. Under autopilot, resolve ambiguity from substrate state rather than asking.

Route by kind and parent before review work:

- child story → direct verification closure, never review;
- standalone story → bounded inline substrate review, never independent or
  cross-model;
- feature → normal integrated substrate review;
- epic → deeper aggregate substrate review after all child features are done;
- non-item target → standalone review.

### Phase 1: Gather context

For feature substrate review, read:

- the feature body, acceptance criteria, implementation summary, and verification;
- all direct child-story bodies and their completion evidence;
- the aggregate implementation commits and surrounding code;
- project instructions, `.agents/rules/*.md` as the project's force-loaded agent
  rules, and touched foundation assertions.

For epic review, read the epic brief and decomposition, every child feature's
review record, cumulative touched paths and contracts, and the end-to-end
acceptance/foundation context. Review aggregate behavior rather than repeating
per-line child review.

For standalone-story review, read its body, implementation diff, and
verification evidence. For out-of-band standalone review, read the target
description and enough surrounding code to understand intent.

### Phase 2: Review the feature, epic, or standalone target

For features and epics, load
[target-resolution.md](references/target-resolution.md),
[review-lenses.md](references/review-lenses.md), and
[deep-review.md](references/deep-review.md). Calibrate fresh-context topology to
the effective weight, observed risk, and scope tier. Review integrated feature
behavior rather than each child story; review epic-level capability and
cross-feature interactions rather than repeating child-feature detail.

For standalone stories, use a bounded inline core-lens walk and never delegate
review. For out-of-band targets, use the standard lens walk unless deep review
was requested or clearly warranted within the weight ceiling.

If a feature diff is empty, approve only when complete green integrated
verification and acceptance evidence explain why; otherwise bounce for missing
review scope. In interactive standalone mode, report the empty target and stop.

### Phase 3: Adjudicate findings

Reviewer output is evidence, not authority. The receiving agent verifies each
claim against repository context and classifies it:

- **Blocker** — credible material current-cycle risk to required correctness,
  security, data integrity, public contracts, acceptance criteria, release
  safety, or trustworthy verification. Fix or keep active before advancing.
- **Important** — valid work below that bar. Park unbound with the risk rationale
  and continue the reviewed feature.
- **Nit** — optional polish kept only in review notes.
- **Rejected** — unsupported, inapplicable, or cost-disproportionate advice;
  record a brief reason.

Reviewer confidence, severity labels, or repetition do not determine the verdict.

### Phase 4: Finish substrate review

Load [substrate-side-effects.md](references/substrate-side-effects.md).

- With no receiver-confirmed blockers, advance the feature, epic, or standalone
  story `review → done`.
- With blockers, return the reviewed item to `implementing` with durable review
  findings.
- File accepted current-cycle blockers active and lower-priority findings in the
  unbound backlog according to the side-effects contract.
- Append the review record and commit the reviewed-item transition.

After a feature reaches `done`, inspect its parent epic. If every direct child
feature is `done`, advance the epic from `implementing → review`, append a
`Child features reviewed and complete` note, and commit that transition. Start
the deeper epic review without blocking any downstream implementation whose
dependencies are now implementation-complete.

### Phase 5: Finish standalone review

Print the structured verdict. Do not modify `.work` or commit. If the user asks
to track findings, load the side-effects reference and create only the requested
items.

## Output

```markdown
# Review: <feature-epic-or-standalone-target>

## Summary
<2-3 sentences>

## Verdict
Approve | Approve with comments | Request changes | Block

## Findings
### Blockers
- **<title>** (`file:line`): <impact and required direction>

### Important
- **<title>** (`file:line`): <explanation and direction>

### Nits
- <optional polish>

### Rejected proposals
- <proposal>: <repository-context reason>

## Notes
<mode, effective weight, reviewer path, evidence, skipped lenses, limitations>
```

For child-story compatibility closure, report verification and the direct
transition; do not label it a review verdict. For standalone stories, report the
bounded inline verdict and state that no independent/cross-model reviewer ran.
For epic roll-up, report the child features whose completed reviews made the
epic review-ready, then report the deeper epic verdict separately.

## Guardrails

- Child stories never enter review.
- Standalone stories receive bounded inline review but never independent,
  fresh-context, or cross-model review.
- Feature is the normal substrate implementation-review boundary.
- Epics receive their own deeper aggregate review after child features are done.
  Do not repeat line-level child review; inspect larger-scope integration and
  capability risk.
- Resolve mode and kind before making changes.
- Do not pad reviews with invented concerns or low-value nits.
- Read actual files and surrounding context, not only diff lines.
- A false, stale, or contradictory foundation assertion can block; missing
  coverage and unimplemented future intent are not drift.
- Do not advance a reviewed item with receiver-confirmed material blockers. Parking
  lower-risk work does not block completion.
