---
name: autopilot
description: >
  Goal-statement or direct-invocation queue driver for agile-workflow. Use when a harness goal or user
  request says to run autopilot, drain ready work, finish an epic, continue through .work/active/, or
  make autonomous progress on the substrate. Reads .work/active/, picks ready items by depends_on and
  stage, delegates feature-scoped design and implementation, reviews completed features, commits
  transitions, and repeats until the scope is done or blocked. Before reporting complete, runs the
  weight-selected final peer-review/fresh-context completion path, adjudicates reviewer proposals,
  fixes material blockers, and parks lower-risk
  valid findings. No /loop or --resume mechanics; the harness goal/continuation feature owns
  long-running persistence. Epic-scoped by default; --all drains all active work; free-text scope
  directives are allowed.
---

# Autopilot

Autopilot is the queue policy that runs inside a harness goal. It can also be
called directly as a skill. It does not schedule watchdog loops, manage timers,
or maintain a progress file. The substrate is the state, and the harness
goal/continuation feature is responsible for carrying long-running work across
compaction or continuation turns.

Agents may invoke this skill when the active goal statement or user request asks
for autonomous substrate progress. The user can still invoke it directly.

## Goal Contract

The cleanest invocation is a goal statement that names autopilot:

> Use agile-workflow autopilot to drain `<scope>` until all in-scope active
> items are done or blocked.

When an active goal exists, treat the goal statement as the invocation surface
and run this skill inside that goal. Do not create a nested goal. If no active
goal exists, run the same queue policy inline for the direct invocation.

Only create a new harness goal when the caller explicitly asks the agent to
create/start one and the harness exposes that API. Otherwise, attach to the
active goal or run inline.

Use `.work/active/` as the resume point. Do not call `/loop`, do not create
watchdog schedules, and do not support `--resume`; those are legacy mechanics.

When running under a harness goal, mark/report the goal outcome this way. When
running inline, use the same categories in the final summary:

- **Complete** when no in-scope active item remains at `drafting`,
  `implementing`, or `review`.
- **Blocked** when in-scope items remain but none are ready or an item has a
  genuine hard blocker that autonomous diagnosis and correction cannot resolve.
  Review bounce count alone is never a blocker.
- **Interrupted** when the user stops the run. Finish the current safe
  transition, commit if anything changed, summarize the remaining queue, and
  let the harness/user decide whether to continue the goal later.

## Arguments

- `autopilot <epic-id>` - drain items under `<epic-id>` transitively via the
  parent chain until the scoped queue is done or blocked.
- `autopilot --all` - drain all `.work/active/` items.
- `autopilot --review-weight <level> <scope>` - set review effort to `none`,
  `light`, `standard`, `thorough`, or `maximum` for item reviews and final
  completion review. An unambiguous natural-language equivalent is also valid.
- `autopilot <free-text>` - interpret as a scope directive, such as "finish the
  dangling work", "wrap up phase 14", or "drain everything tagged refactor".
  Log the interpretation in the run summary. When scope is ambiguous, prefer the
  broader active-work interpretation. `.work/backlog/` is always out of scope.

## Prerequisites

Two gates, with different timing:

1. **Before anything:** `.work/CONVENTIONS.md` exists. If not, halt: "No substrate found. Run
   `/agile-workflow:convert` first."
2. **After Phase 1 resolves the queue selection** (the check is route-aware, so it runs
   against the resolved work set): foundation docs exist (`docs/VISION.md` or `docs/SPEC.md`) — required
   when the scope contains **any** item that routes to the design family (`epic-design` /
   `feature-design` / `refactor-design` / `perf-design`), which read foundation docs as their
   design anchor. *(Design family = skills that read foundation docs as their design anchor; a
   deployment adding such a skill extends this list.)* If absent in that case, halt the whole
   run with a clear message **before delegating any item** — including in a mixed scope: do not
   partially drain the non-design-family items, a partial drain leaves the queue in a state the
   goal statement didn't describe. A scope with no design-family routes — drafting items that
   all route cross-plugin to `agentic-research:research-orchestrator` (`[research]` items anchor
   on the commissioning item body + the research substrate, not VISION/SPEC), and/or
   `implementing`/`review` items only — runs without foundation docs.

These are hard halts because the queue has no reliable substrate or design
anchor without them.

## Workflow

### Phase 1: Resolve Queue Selection

Build the queue selection from the argument:

- Epic id: include the epic plus descendants through `parent` links.
- `--all`: include every item in `.work/active/{epics,features,stories}/`.
- Free text: inspect item ids, tags, parents, titles, and bodies; select the
  matching active subset and record the interpretation.

This selection says which items autopilot may drain; it does not create one
combined implementation scope. `--all` means the whole active queue, not "all
of these technologies at once." The current work boundary comes from each ready
item's body, stage, and design; an undecomposed epic is design work, not an
implementation claim. In kickoff narration and capability rationale, describe
that concrete ready work and its stage—never synthesize a broader current scope
from tags, future intent, or blocked/later items.

Only active items are candidates. Backlog items must be promoted through
`scope` before autopilot can touch them.

Resolve worker capability and review weight at kickoff without a routine tier
question.

For worker capability, honor an explicit goal/argument/caller choice first, then
a stable `.work/CONVENTIONS.md` choice. Otherwise choose from the concrete ready
work and its risk—not from the breadth of the queue selector: bounded familiar
work can use baseline capability; cross-cutting, contract, or uncertain work
warrants raised capability; architectural, security-critical, or
high-consequence work warrants the highest available capability. This is
judgment, not a fixed item-kind mapping. Record the effective choice and reason
in the run summary and pass it in the Phase 4 caller note.

For `review_weight`, validate the five-level scale and resolve in this order:
explicit `--review-weight` or unambiguous natural-language selector,
`.work/CONVENTIONS.md`, then the default `standard`. Explicit caller selection
always wins. Record the effective weight and source in the run summary and pass
it in every Phase 4 caller note so production and review skills use one value
through parent roll-up and final completion review.

### Phase 2: Build The Queue

Filter candidates to `stage` in `{drafting, implementing, review}`.

An item is implementation-ready when every `depends_on` entry has completed
verified implementation:

- active at `stage: review` or `done`, or
- already moved to `.work/releases/` or `.work/archive/`.

Review remains required for final completion, but it never blocks dispatch of the
next dependency layer.

Use `.work/bin/work-view` when it can answer the query; otherwise read
frontmatter directly.

**`[scan]`-tagged items are never queued.** `work-view --ready`/`--blocked` exclude
them by construction — they are engagement-owned scan-campaign scaffold driven by
`/agile-workflow:deep-code-scan`, not ordinary work. (If you fall back to reading
frontmatter directly because `work-view` is unavailable, replicate this: skip any
item whose `tags` contain `scan`.) The remediation a scan produces is a separate
`fix-<goal>` epic with normal routing tags — that drains here as usual.

### Phase 3: Schedule Implementation And Review

Maintain two ready lanes:

- **production** — `drafting` and `implementing` items;
- **review** — features, epics, and standalone stories at `review` (plus legacy
  child-story normalization).

Sort each lane by `depends_on` count then `created`. Keep review work moving, but
do not let it serialize production: start independent reviews as reviewer
capacity allows, then dispatch the earliest ready production layer immediately.
Multiple unrelated feature reviews may run concurrently. If the host cannot run
both lanes concurrently, prefer the next dependency-ordered production step and
interleave review at the next safe boundary; final completion still waits for
all reviews.

For `stage: implementing`, the picked item is only an anchor. Hand the whole
in-scope implementing band to `implement-orchestrator`; do not pre-bundle it
yourself. The orchestrator uses one worker per feature as its baseline, may
bundle related features when shared context helps, treats child stories as design
checkpoints, and splits only unusually large features into coherent ownership
bundles. If neither lane has ready work, evaluate the stop rules.

### Phase 4: Delegate Work

Invoke the relevant skill through `Skill` or the local skill mechanism. Include
this caller note in every delegated prompt:

> Delegated by an active agile-workflow autopilot goal for `<scope>`. Resolve
> ambiguities with judgment, log rationale in the item body, and do not ask
> strategic questions unless a hard halt condition applies. Worker capability
> for this run: `<effective capability>` — selected because `<risk/scope reason>`;
> use it for dispatch and do not re-ask. Review weight for this run:
> `<none|light|standard|thorough|maximum>` (source: `<explicit|project|default>`);
> pass it unchanged to feature review and final completion review. `standard`
> is the default and means one independent pass, then adjudicate, fix, verify,
> and finish without re-review. Only `thorough` and `maximum` use multi-pass
> convergence. Apply the risk-driven advisory policy from `principles/SKILL.md`
> Part IV in direct and autopilot modes, and label review cross-model only when
> a different model class is actually selected. Treat reviewer findings as proposals: independently adjudicate them
> against repository context, fix or activate only material current-cycle
> blockers, and park valid lower-risk work in the unbound backlog. Peer failures
> during design are non-blocking. Preserve complementary→adversarial order when
> both phases run. For reviewer posture and
> host-native roles, load `principles/references/subagents.md`; for capability
> mapping, load `principles/references/models.md`. A top-tier reasoning peer may
> take 10 to 30 minutes; quiet output after a few minutes is not a hang.

Routing:

- `stage: drafting`, `kind: epic` -> `epic-design` (an epic carrying `[research]` is a
  research-program epic — it routes here as normal epic decomposition; its children are
  `[research]` features each carrying their own `research_dials:` registration; the tag at
  epic level signals program decomposition, never an epic-level registration)
- `stage: drafting`, feature with `tags: [refactor]` -> `refactor-design`
- `stage: drafting`, feature with `tags: [perf]` -> `perf-design`
- `stage: drafting`, feature with `tags: [prose]` -> `prose-author`
- `stage: drafting`, feature with `tags: [research]` -> `agentic-research:research-orchestrator`
  (**cross-plugin**; the orchestrator runs the grounded engagement end-to-end — verification
  gates fire inline, there is no separate implement step, and it never binds to a release.
  Requires the `agentic-research` plugin; without it, treat as a plain feature.)
- `stage: drafting`, other feature -> `feature-design`
- `stage: implementing`, epic -> skip direct implementation; children are the
  work targets
- `stage: implementing`, non-epic with `tags: [prose]` -> `implement <id>`
  (inline — single stride, no orchestration; prose does not need parallel
  coordination)
- `stage: implementing`, non-epic with `tags: [research]` -> `agentic-research:research-orchestrator`
  (resume/continue the engagement; research never flows through `implement-orchestrator` or
  `release-deploy` — a single-pass research engagement may be a story that skips `drafting`.
  Requires the `agentic-research` plugin; without it, treat as a plain implementing item ->
  `implement-orchestrator`, mirroring the drafting row's degrade.)
- `stage: implementing`, non-epic (and NOT `tags: [prose]` or `[research]`) -> `implement-orchestrator <scope>`
- `stage: review`, `kind: feature` -> `review --review-weight <effective weight>
  <id>`. Feature is the implementation-review boundary.
- `stage: review`, child story (`parent` set) -> compatibility normalization:
  confirm green implementation evidence and advance directly to `done`, or
  return to `implementing` for missing verification. Never review it.
- `stage: review`, standalone story (`parent: null`) -> bounded inline review.
  Never spawn an independent, fresh-context, or cross-model reviewer.
- `stage: review`, `kind: epic` -> deeper aggregate review after all child
  features are done. Focus on end-to-end capability, cross-feature contracts,
  cumulative operational/release risk, and foundation alignment rather than
  repeating child-feature detail.

Production skills advance child stories directly to `done`, continue standalone
stories, completed features, and epics through their kind-appropriate review
lanes. Review-ready items satisfy downstream dependencies, so
a pending review must not prevent dispatch of the next implementation layer.
Autopilot may therefore return to a queue where the delegated item and eligible
ancestors are already terminal. Rebuild the queue from disk rather than relying
on cached state.

If a delegated skill reports a hard blocker without a stage transition, append
a `## Blocker` section to the item body, commit that note, and continue with
other ready items. The final goal outcome is blocked if unresolved blockers
remain in scope.

### Phase 5: Review Closure

Child stories never enter this phase. Standalone stories use their bounded
inline lane. For features and epics, apply the effective weight exactly:

- `none`: close administratively from green verification and acceptance evidence.
- `light` / `standard`: run at most one independent pass. Adjudicate every
  proposal, fix receiver-confirmed blockers, verify the named fix set, and
  finish without another independent pass. If corrective work must be deferred,
  keep the item active with a note that later closure is fix-verification only.
- `thorough` / `maximum`: run review → adjudicate → fix → verify repeatedly.
  Continue until a pass yields no receiver-confirmed material current-cycle
  blockers. The receiving agent judges materiality; parked concerns, nits, and
  rejected proposals do not keep the loop open.

Track repeated passes only for `thorough` and `maximum`:

```text
passes[<reviewed-item-id>] = <independent passes completed>
```

If the same material finding survives a correction, treat recurrence as evidence
that the attempted fix or design model may be wrong: re-read the item and
foundation docs, diagnose the root cause, and revise design or implementation
notes when needed. There is no fixed pass limit for convergence weights; an
unfixable material current-cycle blocker is a genuine blocker. Never escalate `standard`
because a target is an epic, uses deep lenses, or the first pass found blockers.

### Phase 6: Adaptive Simplification

Do not schedule a dedicated refactor-discovery pass from item counts. Normal
feature design and implementation already inspect touched code for safe,
cohesive simplification; that work adapts to the amount and shape of recent
feature change. Child stories are checkpoints inside that work, not cadence
counters.

During ordinary autopilot, keep refactoring inside those feature workflows. Run
`refactor-design` in discovery mode only when the user explicitly asks the
current run to scan for refactor opportunities. Existing `[refactor]` items still
flow through their normal route. Never invoke `bold-refactor` unless the user
explicitly requests it. Explicit user instructions override every default here.

### Phase 7: Stop Rules

After each queue rebuild:

- If no in-scope active items remain at `drafting`, `implementing`, or `review`,
  run Phase 8 (Final Peer Review Loop) before reporting completion.
- If in-scope active items remain but none are ready, the goal is blocked on
  dependencies or unresolved blockers. Report the blocking ids.
- If the user interrupts, stop at the next safe boundary and report remaining
  state without claiming completion.
- Otherwise pick the next item and continue.

Do not stop because of elapsed time, context size, or "long run" concerns. The
harness owns continuation. Your job is to keep applying the queue policy until a
real stop rule fires.

### Phase 8: Final Completion Review

This is the last step before reporting `complete`. It runs in addition to any
design-time advisory passes and feature reviews, and is calibrated by the same
effective `review_weight`; the phase itself is never skipped. It reviews the
aggregate completion claim and integration evidence—not individual child-story
checkpoints. It complements rather than replaces feature and epic item reviews.

When the scoped queue appears drained:

1. Build a concise completion bundle:
   - scope interpretation
   - items advanced during this run
   - final state of in-scope epics/features/stories
   - commits associated with advanced items
   - notable design decisions, implementation deviations, blockers resolved,
     and verification results reported by delegated skills
2. Calibrate the completion review from the weight without turning it into a
   rigid dispatch recipe:
   - `none`: run no independent reviewer; administratively verify the completion
     bundle has green verification and acceptance evidence for every in-scope
     item, plus internally consistent terminal substrate state.
   - `light`: use at most one focused fresh-context pass over the bundle, then
     adjudicate, fix, verify, and finish without re-review.
   - `standard`: run exactly one balanced fresh-context pass, then adjudicate,
     fix receiver-confirmed blockers, verify, and finish without re-review.
     This is the normal default, not an implicit convergence loop.
   - `thorough`: repeat review → adjudicate → fix → verify until a pass yields
     no receiver-confirmed material current-cycle blockers; park or note smaller
     findings instead of prolonging the loop.
   - `maximum`: use the same convergence requirement with multi-model,
     complementary → adversarial coverage when available.
   Ask for bugs, missed acceptance criteria, unreviewed risks, false/stale/
   contradictory foundation-doc assertions, and substrate-state inconsistencies
   that would make "complete" premature. Foundation-doc omissions and
   unimplemented future-state claims are not findings. Exact reviewer count and
   pass depth remain model judgment within
   the weight's ceiling/intent.
3. When independent review runs, use a different-class peer when reachable;
   otherwise spawn a generic same-harness fresh-context reviewer from
   `principles/references/subagents.md` with the strongest appropriate
   capability. Label it cross-model only if the selected model class differs
   from the host. A top-tier reviewer may take 10 to 30 minutes; quiet output
   after a few minutes is not a hang.
4. If the effective weight requires fresh-context review and no such path is
   available or the selected path fails, do not report completion; mark the run
   blocked on final review and include the reason. `none` requires complete
   administrative evidence instead of a fresh reviewer; missing evidence blocks
   rather than becoming an invented pass.
5. The receiving autopilot agent adjudicates every proposed finding against the
   repository's acceptance criteria, users and deployment shape, likelihood,
   blast radius, recoverability, safeguards, and delay cost. Reviewer severity
   is evidence, not the verdict:
   - Receiver-confirmed material current-cycle blocker: fix it immediately when
     small and safe, or create/update an active item at the right stage
     (`drafting` for design gaps, `implementing` for concrete fixes); verify,
     commit, and rebuild the queue.
   - Valid but below the blocker bar: park an unbound backlog item with a brief
     risk rationale, commit it, and continue. It does not reopen the drained
     scope or prevent completion.
   - Nit or unsupported/inapplicable claim: note or reject it with a one-line
     rationale; do not create active work.
6. If rebuilding the queue finds new or regressed `drafting`, `implementing`, or
   `review` items in scope, return to Phase 2 and drain them. Parked review
   follow-ups remain outside autopilot scope until separately promoted.
7. Close according to the selected weight: after the one permitted pass and
   verified fixes for `light`/`standard`, or after a clean convergence pass for
   `thorough`/`maximum`. Once every proposal is adjudicated, no unresolved
   receiver-confirmed blocker remains, and the queue is still empty, report the
   goal as complete.

Record the final review in the autopilot final summary. Do not paste the full
peer transcript into item bodies; summarize accepted/rejected points where they
affect specific items.

## Output

Narrate briefly as items advance. Final summary:

- Queue selection and interpretation, kept distinct from item-defined
  implementation scope
- Items advanced to done
- Features, epics, and standalone stories reviewed and approved
- Review closure by item: single-pass fix-and-finish or multi-pass convergence,
  including recurring findings when applicable
- Genuinely blocked item ids and blocker reasons
- Any user-requested dedicated refactor scans run
- Implement-orchestrator bundle summary, if reported
- Effective worker capability and selection rationale
- Effective review weight and source
- Final completion-review status: administrative, cross-model, same-harness
  fresh-context, or failed; summarize blockers fixed/activated, lower-risk
  findings parked, and proposals rejected
- Goal outcome: complete, blocked, or interrupted

## Guardrails

- Never use structured question tool while an autopilot goal is actively driving the
  delegated work. Resolve with judgment and log rationale.
- Do not report `complete` until Phase 8 has run successfully at the effective
  review weight, every proposal has been adjudicated, and all receiver-confirmed
  material blockers have been fixed and verified or remain as genuine active
  blockers. `standard` requires one pass, not repeated review; `thorough` and
  `maximum` require a pass with no receiver-confirmed material current-cycle
  blockers; smaller findings are dispositioned by judgment.
  Parked lower-risk findings do not block completion.
- Commit after every item state change or blocker note.
- Do not push, force-push, or release; the user controls publication.
- Do not drain or promote `.work/backlog/`; it is outside autopilot scope.
  Review disposition may park valid lower-priority findings there without
  reopening the run.
- The substrate is the resume point. No `PROGRESS.md`, no watchdog loops, no
  `--resume`.
