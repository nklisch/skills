---
id: feature-agile-workflow-lifecycle-agency
kind: feature
stage: implementing
tags: [skill, plugin]
parent: null
depends_on: []
release_binding: null
gate_origin: null
created: 2026-07-11
updated: 2026-07-12
---

# Simplify agile-workflow lifecycle and increase agent agency

## Brief

Simplify agile-workflow's operational skills so they state durable invariants, completion boundaries, and failure conditions while giving current models more freedom to size and orchestrate the work in front of them. Remove pseudo-precise line, file, bundle, and wave prescriptions; bundle examples and detailed worker prompt recipes are intentionally out of scope because modern models can derive execution topology from dependencies, ownership, repository shape, and risk.

Make lifecycle completion independent of execution mode. A direct implementation or bug-fix invocation should proactively continue through the appropriate review lane and finish at `done`, or return with a documented review bounce/blocker. `stage: review` remains a real state and review remains a separate fresh-context responsibility where warranted, but it is no longer a mandatory user-driven handoff. An explicit caller request such as "stop at review" preserves the old boundary when desired.

Keep the qualities that define the plugin: Item-IS-the-Work, dependency and cycle integrity, test integrity, fresh-context deep review, strategic checkpoints for irreversible choices, durable review findings, rolling foundation docs, late release binding, terminal retention, and conservative parent roll-up. The desired result is less ceremonial and more decisive, not weaker governance.

## Agreed direction

- Operational verbs finish their semantic promise: implementation and fix flows continue through review by default.
- Review depth follows risk and evidence, with item kind as a starting heuristic rather than a rigid rule.
- Inline versus delegated execution is chosen from cohesion, ownership, sequencing, and uncertainty rather than LoC/file counts.
- The orchestrator chooses its execution topology and host-native mechanism; remove bundle recipes, examples, fixed wave widths, and prescribed prompt templates.
- Worker/model capability is selected by the agent from risk and scope unless the caller or project explicitly overrides it; do not ask routinely.
- Normal design resolves routine/reversible decisions with judgment and logs rationale; reserve user questions for product direction, external contracts, and expensive irreversible choices. `--only-questions` remains the explicit alignment mode.
- Advisory review follows risk rather than being useful only under autopilot.
- Autopilot and project conventions expose a high-level `review_weight` selector (`none | light | standard | thorough | maximum`, default `standard`) that scales independent reviewer breadth and pass depth without prescribing exact orchestration. Explicit invocation overrides project convention. `none` skips independent review, never implementation verification.
- Model guidance recognizes GPT-5.6 Luna as the implementation workhorse, Sol as the preferred design/review/complex-code model and low-thinking bridge above Luna, Terra as a situational middle pick, and Fable as a high-cost design/orchestration/review specialist rather than a default implementer.
- The common prose lane and specific bug-fix lane should complete end to end instead of requiring ceremonial follow-up invocations.
- Consolidate repeated policy into canonical auto-loaded homes and shrink oversized skill bodies through progressive disclosure, without hiding load-bearing invariants in optional references.

## Acceptance criteria

- [ ] Direct `implement`, `implement-orchestrator`, and `fix` flows continue through review by default, with an explicit stop-at-review override.
- [ ] Review rolls completed children up through eligible parent review stages without requiring autopilot.
- [ ] Review lane selection accounts for risk/evidence rather than item kind alone and preserves fresh-context deep review.
- [ ] Hard LoC/file-count routing and fix cutoffs are removed or clearly demoted to non-binding hints.
- [ ] `implement-orchestrator` is rewritten around outcomes and invariants; detailed bundle examples, bundle sizing recipes, default wave width, worker prompt templates, and routine model-tier questions are removed.
- [ ] Design-family question policy is based on reversibility and user-facing consequence, while `--only-questions` remains interactive-only.
- [ ] Cross-model/fresh-context advisory review is risk-driven across direct and autopilot design modes.
- [ ] Effective review weight resolves explicit invocation → project convention → `standard`, is logged, and scales review from no independent reviewer through multi-model multi-pass review while leaving exact topology to the reviewing agent.
- [ ] Model recommendations cover GPT-5.6 Luna/Terra/Sol and Fable with role, effort, bridge, and cost guidance in the model-layer reference.
- [ ] Common prose work and verified bug fixes can complete through review in one invocation.
- [ ] Repeated dispatch, caller-awareness, routing, and test-integrity prose is consolidated without weakening worker self-containment.
- [ ] Touched SKILL.md files follow repo-skill-style limits through progressive disclosure where practical, and no updated SKILL.md exceeds 500 lines.
- [ ] Foundation docs accurately describe the revised lifecycle and orchestration policy.
- [ ] Skill validation, agile-workflow channel parity checks, and relevant repository tests pass.

## Architectural choice

This is a behavior change to a skill system, so the "code" is SKILL.md prose,
stage-transition contracts, and the policy invariants those skills enforce. The
architecture is **contract-first**: define the shared lifecycle and selection
contracts once here, then have each story implement its owned files against the
same contract. Cross-story consistency comes from the contract, not from
sequencing — which is why the four skill-touching units run in parallel over a
disjoint file set.

Three decisions, each chosen over the alternative:

1. **Lifecycle completion is a default, not a mode switch.** The production
   skills (`implement`, `fix`, `implement-orchestrator`) continue through the
   review lane to `done` by default and honor an explicit `stop-at-review`
   override. *Alternative rejected:* a new `--complete` flag that opts in to
   end-to-end completion — that preserves the ceremonial two-invocation shape as
   the default, which is exactly the friction the brief removes. The override is
   the cheaper escape hatch and mirrors how `--only-questions` already frames
   opt-in boundaries.

2. **Review depth is selected from risk and evidence, with item kind as a
   starting heuristic only.** The review skill keeps its three lanes
   (fast/standard/deep) but the selection rule generalizes from "kind → lane"
   to "risk + evidence → lane, seeded by kind." Fresh-context deep review
   remains the floor for risky/complex targets. *Alternative rejected:* keep
   kind-based lanes and add a separate "risk lane" — that doubles the lane
   matrix and makes the fresh-context invariant harder to hold.

3. **The orchestrator is rewritten around outcomes and invariants, not
   recipes.** Remove bundle examples, sizing recipes, fixed wave widths,
   prescribed worker prompt templates, and the routine model-tier question.
   Keep the load-bearing invariants: dependency-graph-driven scheduling,
   write-set independence, per-wave verification, one commit per item,
   conservative parent roll-up, and worker self-containment. *Alternative
   rejected:* keep the recipes as "defaults" — the brief explicitly targets them,
   and current models derive better topology from ownership/dependency/risk than
   from fixed numbers.

A master invariant governs every story: **consolidation never weakens worker
self-containment.** Any prose moved to a reference stays required reading inside
worker prompts (the implementer capsule and any per-bundle prompt carry the full
test-integrity and boundary text); skill bodies keep a one-line pointer plus the
load-bearing one-liner.

## Shared contracts (each story implements its side)

### Lifecycle completion contract

- Production skills advance work as far as the review lane warrants **in the
  same invocation**, by default. They do not stop at `review` unless an explicit
  `stop-at-review` request is present (caller says "stop at review", "leave at
  review", "hand off for review", or a project convention sets it).
- `stage: review` remains a real state. Reaching it is still a valid pause
  point; what changes is that the pause is no longer mandatory.
- The review act is unchanged in kind: where the lane demands fresh context, the
  skill spawns or requests it (deep lane). "Continue through review" does **not**
  mean self-review inline; it means the production skill invokes the review lane
  and the lane advances or bounces.
- A documented bounce (`review → implementing` with `## Review findings`) or
  blocker (`## Blocker`) is a valid completion — the skill returns having driven
  the work as far as it can.

### Review lane selection contract

- Lane = f(risk, evidence, kind-as-heuristic). Stories fast-advance on recorded
  green verification unless something raises the risk (interface change,
  security/correctness surface, cross-cutting scope, foundation-doc claim,
  explicit `--deep`). Features and epics get the deep lane. Out-of-band targets
  stay standard.
- Deep lane still prefers fresh context — different-class peer when reachable,
  else the strongest same-harness fresh-context sub-agent, else a degraded inline
  pass with a recorded limitation. Never review inline in the host's own context
  for deep targets.
- **Conservative parent roll-up now fires from the review lane, not only from
  autopilot.** After advancing a child to `done`, roll up each ancestor whose
  children are all terminal (a `done` story makes its feature roll-up-eligible;
  a `done` feature makes its epic roll-up-eligible), committing each transition.
  Stop at the first ancestor with a non-terminal child.

### Inline-vs-delegated and worker-capability contract

- The inline (`implement`) vs delegated (`implement-orchestrator`) choice is
  made from cohesion, ownership, sequencing, and uncertainty. The hard
  LoC/file-count routing and the fix cutoff are demoted to non-binding hints (or
  removed); they no longer gate the lane.
- Worker/model capability is selected by the agent from risk and scope, unless
  the caller (goal/args), a stable project convention, or an autopilot caller
  note explicitly overrides it. The routine "settle tier — ask once" question is
  removed; the agent chooses and states the choice in run notes.

### Alignment and advisory contract

- Design-family question policy is governed by **reversibility and
  user-facing consequence**, canonically in `principles` Part III. Routine
  reversible decisions resolve with judgment and a logged rationale; structured
  questions are reserved for product direction, external contracts, and
  expensive irreversible choices. `--only-questions` remains the explicit
  interactive-only alignment mode and is unchanged.
- Cross-model / fresh-context advisory review is **risk-driven across both
  direct and autopilot design modes** — no longer framed as autopilot-only. The
  two-phase order (advisory then adversarial), the different-model-class rule,
  the non-blocking design-time failure semantics, and the strict final-completion
  review path are all preserved.

### Review-weight contract

- Effective weight resolves in this order: explicit invocation/autopilot selector, `.work/CONVENTIONS.md`, then `standard`.
- The canonical levels are `none`, `light`, `standard`, `thorough`, and `maximum`. They express review intent and ceilings, not a rigid agent-count recipe.
- `none` performs no independent review but still requires green implementation verification and acceptance evidence before administrative closure. `light` minimizes ceremony. `standard` is the balanced risk-driven default. `thorough` increases fresh-context breadth and passes where risk warrants. `maximum` enables multi-model, multi-pass complementary-then-adversarial review for features and epics, with stories escalating dynamically by risk.
- Review records state the effective weight and actual path used. Missing model classes degrade honestly; they never masquerade as multi-model review.

### Consolidation and line-budget contract

- Repeated dispatch-economy, caller-awareness, routing, and test-integrity prose
  is consolidated to canonical homes (`principles` Parts II–V and
  `principles/references/`), with each skill keeping a one-line pointer plus the
  load-bearing one-liner.
- Worker-facing test-integrity and boundary prose stays in the worker prompt
  posture (`principles/references/subagents.md`) and any per-bundle prompt —
  consolidation never removes text a worker needs to be self-contained.
- Every touched SKILL.md ends at or below 500 lines. `implement-orchestrator`
  and `principles` (currently over budget) come down through the rewrite plus
  progressive disclosure; the design-family skills come down by removing restated
  policy prose.

## Implementation Units

Each unit is one child story owning a disjoint file set. The numbering is the
implementation order.

### Unit 1: Lifecycle completion + inline/delegated + worker capability for the inline production lane
**Files**: `skills/implement/SKILL.md`, `skills/fix/SKILL.md`, `skills/prose-author/SKILL.md` (handoff wording only)
**Story**: `feature-agile-workflow-lifecycle-agency-lifecycle-inline-lane`

Changes:
- `implement`: advance through the review lane to `done` by default (invoke
  review; honor bounce/blocker; honor explicit stop-at-review). Replace the
  "Don't advance past review" guardrail with the completion contract. Demote the
  ≤50 LoC / ≤2 files trigger to a non-binding hint; choose inline vs delegated
  from cohesion / ownership / sequencing / uncertainty. Remove any routine
  model-tier question; worker capability chosen from risk/scope unless
  overridden. Keep test-integrity as the load-bearing one-liner plus a pointer;
  the worker posture is unchanged.
- `fix`: continue the story through review to `done` by default (same contract,
  same override). Keep the >5-files / public-interface guard as a "this is a
  feature, not a fix" signal, not a review-stop. Same test-integrity
  consolidation.
- `prose-author`: update the Handoff so the inline implement path is described
  as continuing through revise/review to `done` by default. Prose's
  draft→write→revise rhythm is preserved; review is still a genuine revise pass,
  not a rubber stamp.

Acceptance:
- Direct `/implement` and `/fix` reach `done` (or return a documented
  bounce/blocker) in one invocation unless stop-at-review is requested.
- No hard LoC/file-count routing remains as a gate; only non-binding hints.
- No routine model-tier question; capability choice is logged.
- `implement/SKILL.md` and `fix/SKILL.md` ≤ 500 lines; worker test-integrity
  prose preserved.

### Unit 2: Orchestrator rewrite around outcomes and invariants
**File**: `skills/implement-orchestrator/SKILL.md`
**Story**: `feature-agile-workflow-lifecycle-agency-orchestrator-rewrite`

Changes:
- Rewrite the body around outcomes and invariants: dependency-graph-driven
  scheduling, write-set independence, per-wave verification, one commit per item,
  conservative parent roll-up (implementing → review), worker self-containment.
- Remove: bundle sizing recipes and the multi-item-bundle-criteria numerical
  prose, fixed/default wave widths, the long single-item and multi-item worker
  prompt templates, and the routine "settle implementation tier — ask once"
  question. Replace the prompt-template section with a statement that the
  orchestrator crafts self-contained worker prompts from the implementer posture
  in `principles/references/subagents.md`, including the load-bearing elements
  (ownership, dep readiness, land-mode, design-flaw escape hatch, verification,
  one commit per item, test-integrity, emotional framing) **without prescribing
  fixed wording or fixed sizes**.
- Apply the lifecycle completion contract: continue through the review lane for
  the scope (invoke review for advanced parents/items), honoring stop-at-review.
  Keep the implementing → review parent roll-up; the review → done roll-up is
  Unit 3's contract, which the orchestrator's output points at.
- Apply the worker-capability contract: choose worker capability from risk/scope
  unless caller/project overrides; state it in run notes; do not ask routinely.

Acceptance:
- No bundle examples, sizing recipes, fixed wave widths, or prescribed prompt
  templates remain.
- No routine model-tier question; capability is chosen from risk/scope and logged.
- Orchestrator continues through review by default; stop-at-review honored.
- `implement-orchestrator/SKILL.md` ≤ 500 lines; load-bearing invariants
  preserved; worker self-containment preserved (worker prompts still carry the
  full boundary/test-integrity text, generated from the posture reference).

### Unit 3: Review lane selection by risk/evidence + parent roll-up + autopilot review routing
**Files**: `skills/review/SKILL.md`, `skills/autopilot/SKILL.md`
**Story**: `feature-agile-workflow-lifecycle-agency-review-lane-rollup`

Changes:
- `review`: generalize lane selection from kind-only to risk + evidence (kind as
  starting heuristic). Stories still fast-advance on green verification unless
  risk raises; features/epics still deep; out-of-band still standard. Name the
  risk signals that escalate a story past fast (interface change,
  security/correctness surface, cross-cutting scope, foundation-doc claim,
  explicit `--deep`). Preserve fresh-context deep review and all guardrails. Add
  conservative parent roll-up from the review lane: after advancing a child to
  `done`, roll up eligible ancestors (feature → done, then epic → done),
  committing each transition; stop at the first ancestor with a non-terminal
  child.
- `autopilot`: confirm review routing is autonomous (it already is) and align
  the routing prose with the new default (production skills continue through
  review; autopilot rebuilds the queue and sees `done` items faster). Remove the
  routine "settle implementation tier — ask once" question — apply the
  worker-capability contract (choose from risk/scope unless caller note or
  project overrides; state in the run summary). Keep the final peer-review
  completion loop and the caller note; update the note's review/tier framing to
  match the generalized advisory and worker-capability contracts.

Acceptance:
- Lane selection accounts for risk/evidence, not kind alone; fresh-context deep
  review preserved.
- Review rolls completed children up through eligible parent review stages
  without requiring autopilot.
- No routine model-tier question in autopilot; capability choice logged in run
  summary.
- `review/SKILL.md` and `autopilot/SKILL.md` ≤ 500 lines.

### Unit 4: Question-policy convergence + advisory-review generalization + principles progressive disclosure
**Files**: `skills/principles/SKILL.md`, `skills/feature-design/SKILL.md`, `skills/epic-design/SKILL.md`, `skills/refactor-design/SKILL.md`, `skills/perf-design/SKILL.md`
**Story**: `feature-agile-workflow-lifecycle-agency-question-advisory-policy`

Changes:
- `principles` Part III: restate the question policy in **reversibility /
  user-facing-consequence** terms (routine reversible → judgment + log;
  structured questions reserved for product direction, external contracts,
  expensive irreversible choices). Keep `--only-questions` as the explicit
  interactive-only alignment mode. Keep the autopilot/non-autopilot
  disambiguation and the hard-halt list.
- `principles` Part IV: generalize advisory review from autopilot-only to
  **risk-driven across direct and autopilot design modes**. Preserve the
  two-phase order, the different-model-class rule, non-blocking design-time
  failures, and the strict final-completion review path. Move the detailed
  per-scope default table and the two-phase loop mechanics into
  `principles/references/` so the SKILL keeps only the load-bearing invariants —
  this is the progressive-disclosure surgery that brings `principles` under 500
  lines. Keep `references/models.md` as the model-layer source of truth.
- Design family (`feature-design`, `epic-design`, `refactor-design`,
  `perf-design`): replace the restated "surface ambiguities → ask" prose with a
  deference pointer to Part III's reversibility-based policy. Keep each skill's
  `--only-questions` mode definition (interactive-only, captures under
  `## Design decisions`, no advance). Drop duplicated caller-awareness
  paragraphs so each skill shrinks.

Acceptance:
- Question policy framed by reversibility/consequence in `principles`;
  design-family skills defer rather than restate.
- Advisory review is risk-driven across direct and autopilot design modes;
  two-phase order and fresh-context rules preserved.
- `--only-questions` unchanged (interactive-only, no advance).
- `principles/SKILL.md` ≤ 500 lines (progressive disclosure; load-bearing
  invariants stay in the SKILL, detail in references). Each design-family
  SKILL ≤ 500 lines and reduced from current size.

### Unit 5: Review-weight project configuration
**Files**: `skills/convert/SKILL.md`, `.work/CONVENTIONS.md`, targeted existing config tests
**Story**: `feature-agile-workflow-lifecycle-agency-review-weight-configuration`
**Depends on**: Units 1–4

Changes:
- Add `review_weight: standard` to generated project conventions without adding a bootstrap question; preserve existing values on sync and treat absence as `standard`.
- Dogfood the default in this repository and keep conversion prose pointed at the canonical policy rather than duplicating review recipes.

Acceptance:
- Fresh bootstrap exposes the selector; sync preserves it; older projects remain valid; no new interactive ceremony.

### Unit 6: Foundation docs roll-forward + consolidated validation
**Files**: `docs/VISION.md`, `docs/SPEC.md`, `docs/ARCHITECTURE.md`
**Story**: `feature-agile-workflow-lifecycle-agency-foundation-docs-and-validation`
**Depends on**: Units 1–5

Changes:
- Roll the foundation docs forward to describe the revised lifecycle (production
  skills complete through review to `done` by default; `stage: review` is a real
  state but not a mandatory user handoff; stop-at-review override) and the
  revised orchestration policy (outcomes/invariants; no fixed sizing,
  wave-width, or prompt-template prescriptions; worker capability chosen from
  risk/scope).
- Update the stage-advancement tables and prose (feature/story `done` is no
  longer framed as "user-facing review approves" but as "the review lane
  approves"); update the skill-catalog role rows for `implement`, `fix`,
  `implement-orchestrator`, and `review`; update the autopilot algorithm prose
  and the lifecycle diagram so review is not a mandatory handoff.
- Rolling-foundation discipline: replace stale assertions in place; no
  "previously" prose.
- Run the consolidated validation: the skill validator across every touched
  SKILL.md, `scripts/tests/channel-parity.test.sh`, and the relevant repo tests
  (`bump-version`, `agent-metadata`, `pi-package-metadata`). Fix or file any
  finding as a follow-up item.

Acceptance:
- VISION / SPEC / ARCHITECTURE describe the revised lifecycle and orchestration
  policy with no stale assertions.
- Skill validation, channel-parity, and relevant repo tests pass.

## Implementation Order

1. Units 1–4 in parallel — disjoint file sets (no file is edited by two units);
   all four implement their side of the shared contracts above.
2. Unit 5 after Units 1–4 — expose and dogfood project review-weight configuration.
3. Unit 6 after Unit 5 — docs describe the landed behavior; validation runs last.

Cross-story consistency on the shared contracts is enforced by this design
body, not by sequencing.

## Testing

This is a skill-system feature; the substrate has no runtime to exercise
stage transitions — they are agent-enforced contracts. The test surfaces are:

- **Lifecycle semantics**: for each production skill, trace the stage
  transitions asserted in the SKILL prose and confirm they reach `done` by
  default and stop at `review` only on the override. Cross-check the contract is
  consistent across implement / fix / orchestrator / review / autopilot.
- **Lane selection**: confirm the review SKILL names risk/evidence signals,
  preserves the fresh-context deep lane, and carries conservative parent
  roll-up language.
- **Orchestrator invariants**: confirm the rewritten SKILL preserves
  dependency-graph scheduling, write-set independence, per-wave verification,
  one-commit-per-item, parent roll-up, and worker self-containment — and contains
  no bundle examples, sizing recipes, fixed wave widths, or prescribed prompt
  templates.
- **Policy**: confirm `principles` frames questions by reversibility and advisory
  review as risk-driven across modes; confirm design-family skills defer rather
  than restate; confirm `--only-questions` is unchanged.
- **Line budgets**: `wc -l` on every touched SKILL.md ≤ 500.
- **Validation suite**: skill validator on every touched skill;
  `scripts/tests/channel-parity.test.sh`; relevant repo tests.
- **Doc drift**: grep VISION / SPEC / ARCHITECTURE for the old "user-facing
  review approves" / mandatory-handoff framing and confirm it is gone.

## Risks

- **Rubber-stamp reviews.** "Continue through review" could degenerate into
  inline self-approval. Mitigation: the review lane still selects fresh-context
  deep review for risk; the production skill invokes the review lane rather than
  approving its own work; guardrails are unchanged. Residual: an agent shortcuts
  the lane — observable as an item body missing a review record.
- **Over/under-fan-out after recipe removal.** Removing sizing numbers could let
  the orchestrator fan out too wide or too narrow. Mitigation: keep
  write-set-independence and dependency-layer invariants; the agent derives width
  from ownership/risk. Residual: a weak model mis-sizes — acceptable per the
  brief.
- **Advisory latency in interactive design.** Generalizing advisory review
  beyond autopilot could add peer latency to direct design. Mitigation:
  risk-driven (small/low-risk skips); non-blocking on failure; reversibility gate
  keeps it rare. Residual: a slow peer on a borderline-risk design — bounded by
  the non-blocking rule.
- **Consolidation hides invariants.** Moving prose to references could drop
  load-bearing text from a context the agent does not load. Mitigation: worker
  prompts stay self-contained; SKILL bodies keep invariants plus one-line
  pointers; references hold detail only. Residual: an agent skips the referenced
  file — bounded by keeping the load-bearing one-liner in the body.
- **Doc drift.** Foundation docs could lag the skill changes. Mitigation: Unit 5
  depends on Units 1–4; `gate-docs` is the long-term backstop.
