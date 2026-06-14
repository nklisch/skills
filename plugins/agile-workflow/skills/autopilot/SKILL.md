---
name: autopilot
description: >
  Goal-statement or direct-invocation queue driver for agile-workflow. Use when
  a harness goal or user request says to run autopilot, drain ready work, finish
  an epic, continue through .work/active/, or make autonomous progress on the
  substrate. Reads .work/active/, picks ready items by depends_on and stage,
  delegates to design, implement, and review skills, commits transitions, and
  repeats until the scope is done or blocked. Before reporting complete, runs a
  final peer-review/fresh-context completion pass and fixes or files accepted
  findings. No /loop or --resume mechanics; the harness goal/continuation
  feature owns long-running persistence. Epic-scoped by default; --all drains
  all active work; free-text scope directives are allowed.
user-invocable: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Agent, Skill
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
- **Blocked** when in-scope items remain but none are ready, an item has a hard
  blocker, or the review circuit-breaker escalated unresolved work.
- **Interrupted** when the user stops the run. Finish the current safe
  transition, commit if anything changed, summarize the remaining queue, and
  let the harness/user decide whether to continue the goal later.

## Arguments

- `autopilot <epic-id>` - drain items under `<epic-id>` transitively via the
  parent chain until the scoped queue is done or blocked.
- `autopilot --all` - drain all `.work/active/` items.
- `autopilot <free-text>` - interpret as a scope directive, such as "finish the
  dangling work", "wrap up phase 14", or "drain everything tagged refactor".
  Log the interpretation in the run summary. When scope is ambiguous, prefer the
  broader active-work interpretation. `.work/backlog/` is always out of scope.

## Prerequisites

Two gates, with different timing:

1. **Before anything:** `.work/CONVENTIONS.md` exists. If not, halt: "No substrate found. Run
   `/agile-workflow:convert` first."
2. **After Phase 1 resolves the scope** (the check is route-aware, so it runs against the
   resolved work set): foundation docs exist (`docs/VISION.md` or `docs/SPEC.md`) — required
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

### Phase 1: Resolve Scope

Build the scope from the argument:

- Epic id: include the epic plus descendants through `parent` links.
- `--all`: include every item in `.work/active/{epics,features,stories}/`.
- Free text: inspect item ids, tags, parents, titles, and bodies; select the
  matching active subset and record the interpretation.

Only active items are candidates. Backlog items must be promoted through
`scope` before autopilot can touch them.

**Settle the implementation tier once, here at kickoff** — don't let it default
silently per wave. If the goal/args/user named a tier (or the project fixes one in
`.work/CONVENTIONS.md`), honor it. Otherwise, when the goal permits interaction, ask
once (AskUserQuestion: `sonnet`/`mixed`/`opus`, or Codex `codex-medium`/`codex-high`/
`codex-xhigh`) and lock it for the whole run. Under an autonomous goal contract that
forbids mid-run questions, use the `implement-orchestrator` default and **state the
tier in the run summary** so a cheap-tier drain is never a silent surprise. Pass the
settled tier down in the Phase 4 caller note so `implement-orchestrator` does not
re-ask.

### Phase 2: Build The Queue

Filter candidates to `stage` in `{drafting, implementing, review}`.

An item is ready when every `depends_on` entry is terminal:

- `stage: done`, or
- already moved to `.work/releases/` or `.work/archive/`.

Use `.work/bin/work-view` when it can answer the query; otherwise read
frontmatter directly.

**`[scan]`-tagged items are never queued.** `work-view --ready`/`--blocked` exclude
them by construction — they are engagement-owned scan-campaign scaffold driven by
`/agile-workflow:deep-code-scan`, not ordinary work. (If you fall back to reading
frontmatter directly because `work-view` is unavailable, replicate this: skip any
item whose `tags` contain `scan`.) The remediation a scan produces is a separate
`fix-<goal>` epic with normal routing tags — that drains here as usual.

### Phase 3: Pick The Next Item

Sort ready candidates by:

1. `depends_on` count ascending
2. `created` ascending

Pop the first item. If there are no ready candidates, evaluate the stop rules.

For `stage: implementing`, the picked item is only an anchor. Hand the whole
in-scope implementing band to `implement-orchestrator`; do not pre-bundle it
yourself.

### Phase 4: Delegate Work

Invoke the relevant skill through `Skill` or the local skill mechanism. Include
this caller note in every delegated prompt:

> Delegated by an active agile-workflow autopilot goal for `<scope>`. Resolve
> ambiguities with judgment, log rationale in the item body, and do not ask
> strategic questions unless a hard halt condition applies. Implementation tier
> for this run: `<settled tier>` — use it for worker dispatch; do not re-ask. For large or risky
> design decisions, use the cross-model advisory review policy from
> `principles/SKILL.md` only when a different model class is available; peer
> failures are non-blocking. If that policy launches Claude Opus through
> peeragent, allow 10 to 30 minutes for large reviews; lack of output after a few
> minutes does not mean it has hung. When hosted in Pi, use native Pi subagents
> for same-harness worker/scout/reviewer fanout when available; keep peeragent
> for cross-model or cross-harness review.

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
- `stage: review` -> `review <id>` (review self-selects its lane: a **story**
  fast-advances on `implement`'s verification with no peer pass; a **feature** or
  **epic** gets a fresh-context deep review — cross-model via peeragent when a
  different class is reachable, else a native Pi reviewer/oracle subagent when
  hosted in Pi and available, else a fresh top-class sub-agent)

The delegated skill owns its internal workflow and stage transition. After it
returns, rebuild the queue from disk rather than relying on cached state.

If a delegated skill reports a hard blocker without a stage transition, append
a `## Blocker` section to the item body, commit that note, and continue with
other ready items. The final goal outcome is blocked if unresolved blockers
remain in scope.

### Phase 5: Review Circuit-Breaker

Track per-item review bounces during the run:

```text
bounces[<item-id>] = times this item has gone implementing -> review -> implementing
```

If an item bounces back to `implementing` twice:

1. Append `## Stuck at review` with the latest blockers and the two-pass note.
2. Leave the item at `review`.
3. Log it as escalated.
4. Continue draining other ready work.

Escalated items make the final goal outcome blocked unless the user resolves
them before the run ends.

### Phase 6: Refactor Cadence (`--all` Only)

Every 5 items advanced to `done` in `--all` mode, delegate a conservative
discovery pass to `refactor-design` over files touched by those items:

1. Collect touched paths from the commits associated with those item ids.
2. Invoke `refactor-design <path...>` in discovery mode.
3. Let `refactor-design` classify and emit any follow-up items.
4. Rebuild the queue; newly emitted items are picked up naturally.

Never invoke `bold-refactor` from autopilot. It is too aggressive for autonomous
queue driving.

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

### Phase 8: Final Peer Review Loop

This is the last step before reporting `complete`. It runs in addition to any
design-time cross-model advisory passes from delegated skills.

When the scoped queue appears drained:

1. Build a concise completion bundle:
   - scope interpretation
   - items advanced during this run
   - final state of in-scope epics/features/stories
   - commits associated with advanced items
   - notable design decisions, implementation deviations, blockers resolved,
     and verification results reported by delegated skills
2. If `peer-review` is available with a different model class, run one
   cross-model peer-review loop over that completion bundle. Ask for bugs,
   missed acceptance criteria, unreviewed risks, foundation-doc drift, and
   substrate-state inconsistencies that would make "complete" premature. When
   the peer is Claude Opus via peeragent, expect large completion reviews to
   take 10 to 30 minutes; do not classify a quiet, still-running process as
   hung after only a few minutes.
3. If peeragent would use the same model class, do not use `peer-review`; use a
   native Pi reviewer/oracle subagent when hosted in Pi and available, otherwise
   a local inline review sub-agent as a fresh-context completion check, and
   record that it was not cross-model.
4. If peer-review is unavailable, use the native Pi reviewer/oracle fallback
   when hosted in Pi and available, otherwise the local inline review fallback.
   If the selected final-review path fails, do not report completion; mark the
   run blocked on final review and include the failure reason. Do not invent a
   pass.
5. For every substantive accepted finding:
   - Small and clearly safe fix: fix it immediately, run verification, commit,
     and rebuild the queue.
   - Needs tracked work: create or update a substrate item at the right stage
     (`drafting` for design gaps, `implementing` for concrete fixes), commit,
     and rebuild the queue.
   - Invalid or lower-value finding: reject it with a one-line rationale in the
     final review summary.
6. If rebuilding the queue finds new or regressed `drafting`, `implementing`, or
   `review` items in scope, return to Phase 2 and drain them. Completion is not
   allowed while accepted final-review findings remain active.
7. Once the final review path succeeds, produces no accepted
   blocking/substantive findings, and the queue is still empty, report the goal
   as complete.

Record the final review in the autopilot final summary. Do not paste the full
peer transcript into item bodies; summarize accepted/rejected points where they
affect specific items.

## Output

Narrate briefly as items advance. Final summary:

- Goal scope and interpretation
- Items advanced to done
- Items reviewed and approved
- Items reviewed and bounced
- Escalated or blocked item ids
- Refactor cadences run (`--all` only)
- Implement-orchestrator bundle summary, if reported
- Final peer-review status: cross-model, local fallback, skipped, or failed;
  include accepted findings fixed/filed and rejected findings summary
- Goal outcome: complete, blocked, or interrupted

## Guardrails

- Never use AskUserQuestion while an autopilot goal is actively driving the
  delegated work. Resolve with judgment and log rationale.
- Do not report `complete` until Phase 8 has run successfully and all accepted
  final-review findings have been fixed or filed back into the queue.
- Commit after every item state change or blocker note.
- Do not push, force-push, or release; the user controls publication.
- Do not touch `.work/backlog/` except to report that backlog items are out of
  scope.
- The substrate is the resume point. No `PROGRESS.md`, no watchdog loops, no
  `--resume`.
