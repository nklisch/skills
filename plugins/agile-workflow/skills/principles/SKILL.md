---
name: principles
description: >
  agile-workflow principles — code-design (clear boundaries, proportional rigor, code economy,
  useful tests, and continuous simplification) and substrate-execution (Item-IS-the-Work,
  Rolling-Foundation, Late-Binding).
  Auto-loads when designing modules, defining interfaces, writing or implementing code, scoping work
  in the substrate, advancing stages, scoping releases, or any time the agile-workflow
  design/implement/review skills are active.
---

# Principles

Two paradigms operate together during agile-workflow work:

- **Code-design principles** (Part I) — how to write good code at design time and
  implementation time. Carried from `workflow:principles`.
- **Substrate-execution principles** (Part II) — how work moves through the
  `.work/` substrate. New for agile-workflow.

Each principle has guidance for design time and implementation time.

---

# Part I — Code-Design Principles

These principles stay active during design and implementation. Load
[references/code-design.md](references/code-design.md) when concrete mechanics,
checklists, or examples are needed.

## 1. Ports & Adapters

Domain logic stays independent of databases, filesystems, HTTP, time,
randomness, and other infrastructure. The domain defines the ports it needs;
adapters implement them, and composition roots wire the two together.

## 2. Single Source of Truth

Growing variant sets have one authoritative typed registry. Types, validation,
routing, and display derive from it rather than re-enumerating the variants.

## 3. Generated Contracts

Boundary types derive from the schema, router, database model, or a generation
step. Consumers import or infer that contract instead of maintaining hand-written
copies.

## 4. Fail Fast—Where It Matters

Validate untrusted input and required external contracts at system boundaries.
Add internal checks only when the project's actual risks justify them. Do not
manufacture exhaustive invariants, edge handling, determinism, or defensive
layers that the product's scope and consequences do not need.

## 5. Code Economy

Short, direct code is a virtue when it stays clear. Prefer fewer concepts,
layers, branches, options, and lines over speculative generality. Match rigor to
the project's context rather than engineering every codebase as critical
infrastructure.

## 6. Tests Earn Their Keep

Test stable interfaces, important behavior, and regressions learned from real
bugs. Unit-test genuinely complex units, not every wrapper, branch, or line.
Tests are maintained code: remove duplicate, tautological, implementation-bound,
or otherwise low-value tests when their upkeep exceeds the confidence they add.

## 7. Leave It Simpler

Exploration, design, and implementation include an elimination pass. In the
area being touched, look for code, tests, checks, abstractions, compatibility
paths, and complexity that the feature can make unnecessary. Fold safe,
cohesive cleanup into the work or create explicit cleanup/refactor stories;
park broader opportunities. Question whole systems when warranted, but ask the
user before removing behavior, guarantees, validation, compatibility, or safety.

---

# Part II — Substrate-Execution Principles

These principles govern how work moves through the substrate. They shape stage
transitions, item bodies, foundation-doc evolution, release binding, and agent
dispatch. The agent applies these whenever operating on `.work/` or `docs/`,
and whenever choosing discovery or implementation dispatch during substrate
work.

## 8. Item-IS-the-Work

The unit of work is its file. The brief, the design, the implementation notes, and the review findings all accumulate in the item's body as stages advance. Reading the file IS reading the state of the work.

### What this forbids

- Parallel design docs that exist alongside item files (no `docs/designs/<name>.md`)
- Separate progress files (no `PROGRESS.md` tracking what's in flight)
- Work memory that lives outside the substrate — chat history, user memory, an external board
- Code comments that duplicate item context (`// see story-foo for background`) — code references logical concepts, not tracking IDs

### What this enables

- Cross-session continuity without re-feeding context: a new session reads `.work/active/`, finds the item at `stage: implementing`, reads its body for the design, picks up where the last session left off
- Single source of truth for "what is the state of this work" — the item file
- Git as the audit trail — every state change is a commit on the file
- The agent's amnesia stops being a tax on the user

### At design time

- When designing a feature, write the design INTO the feature item's body. Do not create a separate `docs/designs/<name>.md`.
- When designing child stories under a feature, write each story's body inline as you spawn it. Each story file is self-contained.
- When implementation surfaces a discovery (a constraint, a discovered library, a forced pivot), edit the item's body to record it alongside the design.

### At implementation time

- Read the item file at start. The design is in there.
- Update the item's body as you work — discoveries, deviations from the design, integration notes
- After completing, the item's body is a complete record: brief → design → implementation notes → completion. A future agent reading it has the full story.
- Don't write `// see story-foo for context` in code. The story's context lives in the story's file.

### Design checklist

- [ ] No parallel design doc; design lives in feature/epic body
- [ ] No progress file; the substrate IS the progress
- [ ] Item body at completion is a complete record
- [ ] Code does not reference item IDs; only logical concepts

---

## 9. Rolling-Foundation

Foundation docs (`docs/VISION.md`, `docs/SPEC.md`, `docs/ARCHITECTURE.md`, and any others) describe what is true now or the future state the project intends to reach. A future-state claim remains valid before implementation exists. Foundation docs are selective standing context, not an exhaustive inventory: silence about a capability is allowed. They roll forward when an assertion becomes false, stale, or contradictory. Git carries history; the doc carries truth.

### Two timing styles

Both are legitimate; the project picks one or mixes per change size:

- **Code-first (default for routine features):** docs update at implementation merge, in the same commit set as the code that lands the change.
- **Design-first (for large scope, initial ideation, architectural shifts):** docs preflight-update at scope time, leading the code through the implementation window. The doc temporarily describes an intended near-future state. The agile-workflow `scope` skill operates this way for large scope; `ideate` operates this way at project bootstrap.

The discipline is identical in both styles: replace stale assertions in place, never accumulate "previously" / "in v1.x" / migration prose. `gate-docs` is an assertion-consistency backstop: it catches false, stale, or contradictory claims, but never treats missing coverage or merely unimplemented future intent as drift.

### What this forbids

- "Note: in v1.2 this was X" footnotes
- "Previously" / "originally" / "we used to" prose
- A "Migration notes" section retaining old behavior descriptions
- Compatibility shims documented in foundation docs (those go in code comments only)
- Changelog-style entries inside foundation docs

### What this enables

- A new contributor reads the doc and learns the system as it is or as it is intended to become — not as it was
- Foundation docs stay short and current rather than growing with every change
- `git log docs/<file>.md` shows every rolling-forward edit — perfect audit trail
- False, stale, or contradictory assertions become bugs that gate-docs surfaces; omissions and not-yet-implemented future claims do not

### At design time

- When scoping a feature that changes a foundation-doc assertion, decide the timing: code-first (defer the doc update) or design-first (preflight the update as part of scope)
- For large-scope `scope` operations, design-first is the default — `scope` rolls foundation docs forward as part of the same operation
- Identify any existing foundation assertions the design changes or contradicts; do not add coverage merely because the docs omit the capability
- If a feature's design contradicts a foundation doc, EITHER the design is wrong OR the doc is. Resolve before designing the implementation.

### At implementation time

- If working code-first: after implementing a change, ask "what does a foundation doc now say that's no longer true?" — update assertions in place, commit with the implementation
- If working design-first: the doc was preflight-updated at scope time. Verify the implementation matches the doc's assertion; if it deviates, adjust whichever was wrong (implementation or assertion).
- Replace stale assertions in place. Delete the old text. Never append.
- The `gate-docs` skill produces items only for remaining false, stale, or contradictory assertions—not missing coverage or unimplemented future intent.

### Design checklist

- [ ] Every assertion in SPEC and ARCHITECTURE is true for the current or intended-future state it claims (no stale assertions from superseded intent)
- [ ] VISION.md reflects the project's current direction, not past direction
- [ ] No "previously" / "originally" / "in v1.x" prose anywhere in `docs/`
- [ ] When a feature invalidates an existing foundation assertion, that assertion updates in the same commit set (code-first) or was preflight-updated and remains accurate (design-first)
- [ ] No finding or edit was created solely because foundation docs omit a capability or describe future intent not yet implemented
- [ ] `git log docs/<file>.md` shows the audit trail; the doc shows the present

---

## 10. Late-Binding

Items advance stages when work actually completes. Releases bind items only when the user cuts a version. Foundation docs are not pre-decided into a phase plan. Work happens, then commitments crystallize — not the other way around.

### What this forbids

- Pre-populated `stage:` values that don't reflect actual progress
- Pre-set `release_binding:` on items the user hasn't yet decided to ship
- A `ROADMAP.md` that pre-commits features to releases
- A "Sprint 3 backlog" promising specific items by a date
- Phase numbering that assigns items to a temporal slot upfront

### What this enables

- Items advance based on real completion, not a stale plan
- Releases capture what's ACTUALLY ready, not what was supposed to be ready
- Backlog items don't accumulate stale tags or premature decisions
- Pivots are cheap — change of plan doesn't require unwinding pre-bound items

### At design time

- When epicizing, declare epic dependencies via `depends_on`, NOT release bundling
- When scoping a feature, leave `release_binding: null` until a release is cut
- When designing child stories, declare sequencing via `depends_on`, NOT by pre-committing them to a release

### At implementation time

- Advance `stage:` only when the work for that stage actually completes
- Don't bind items to a release until the user invokes `/release-deploy`
- When work shifts (a feature gets postponed, a story gets cut), simply leave the item where it is — its current state is its truth

### Design checklist

- [ ] No pre-populated `stage` values
- [ ] No `release_binding` set without an active release-deploy
- [ ] Dependencies expressed via `depends_on`, not by ordering in any external plan
- [ ] No ROADMAP.md or equivalent that pre-commits work to releases

---

## 11. Agent Dispatch Economy

Sub-agents are for breadth, isolation, independent judgment, or parallel
implementation with clear write ownership. They are not a replacement for
reading, and they are not automatically better than local read-oriented tools.

Agile-workflow does not ship custom subagent definitions. When delegation is
useful, prompt the host's existing generic/general-purpose subagent mechanism
with a structured, task-specific brief. A same-harness subagent is
fresh-context by default; call it cross-model only when the harness explicitly
spawns it with a different model class (for example, Pi selecting another
provider/model for the subagent). Keep `peeragent` for cross-model or
cross-harness advisory/review paths when the harness cannot provide the needed
different model class itself, and fall back to direct single-agent execution
when no suitable subagent adapter is available. For the prompt skeleton and
posture capsules, load [references/subagents.md](references/subagents.md).

Before spawning read-only exploratory/discovery sub-agents, do a local scope-size probe:

- List likely roots with `rg --files`, Glob, manifests, route maps, package
  metadata, or `.work/bin/work-view`.
- Search obvious symbols, ids, and terms with `rg`/Grep.
- Read the item body, relevant foundation docs, `AGENTS.md` / `CLAUDE.md`, and
  2-5 representative source or test files.
- Name the unknowns that remain. If you cannot name a distinct unknown, do not
  spawn an agent just to feel thorough.

For implementation waves, start from **one implementation agent per feature**.
A feature is the normal context, verification, and review boundary. Its child
stories are design checkpoints that make acceptance slices and ordering visible;
they are not normally separate agent assignments. Bundle multiple related
features into one worker when shared context and sequential coherence save more
than the handoff would; preserve separate feature evidence and transitions.
Split one unusually large feature across multiple workers only when coherent
write ownership, dependency layers, or isolation justify it. Story boundaries
may inform that split, but never dictate it by themselves.

Choose the lightest mechanism that will produce better evidence:

| Scope signal | Dispatch choice |
|---|---|
| Known file(s), one module, or a handful of obvious integration points | Read directly with Read/Grep/Glob; skip exploratory fanout. |
| One bounded area but uncertain patterns or call sites | Use one focused exploratory sub-agent, then spot-check key files yourself. |
| Several independent surfaces with different questions | Use parallel exploratory sub-agents, one per surface/question. |
| Normal feature implementation | Give one worker the feature and its story checkpoints as a cohesive bundle. |
| Several related features with shared context | Bundle them into one sequential worker when that reduces handoffs; keep per-feature verification, transitions, and review. |
| Unusually large feature with independent write ownership | Split into coherent ownership bundles by write set and dependency layer; do not assign one worker per story by default. |
| Deep audit/review where fresh context is the point | Spawn a generic sub-agent with the skill's reviewer/scanner prompt posture and explicit output schema; if unavailable, use the skill's inline fallback. |

Parallel Explore only pays for itself when the prompts are genuinely different.
Three agents asking the same broad question usually return duplicated shallow
maps. Prefer one precise prompt or direct reading.

Record the dispatch rationale in run notes or the item body when it affects
scope, bundling, or wave width: "direct-read only", "one Explore for breadth",
or "parallel Explore across X/Y/Z surfaces". This makes the orchestration call
auditable later.

---

# Part III — Caller Awareness and Question Policy

**The normal rule is consequence-based, not mode-based.** Resolve routine,
reversible decisions with judgment and record the rationale in the item body.
Use the structured question tool only when the answer sets product direction,
materially changes user-facing behavior or an external contract, or commits the
project to an expensive choice that is difficult to reverse. Existing `## Design decisions` and foundation
docs are inputs; do not re-ask what they already settle.

Interactive mode permits those strategic questions. An active autopilot driver
never asks them: use available evidence and choose the least irreversible sound
option, logging the decision. Ordinary ambiguity must not halt the queue.

Autopilot mode is binary and detectable. It is on when this skill was delegated
by an explicit autopilot invocation, an active autopilot harness goal, or a
prompt clearly continuing/draining that scope. An autopilot caller note is the
strongest signal. If no active driver exists, the invocation is interactive.

## What does NOT count as autopilot

- **General harness "auto mode"** — a reminder to work autonomously changes
  conversational posture, but does not create an autopilot queue goal.
- **An earlier "just decide" instruction** — it applies to that decision, not a
  later explicit skill invocation.
- **A completed, blocked, or interrupted autopilot run** — later direct skill
  invocations are interactive again.

A direct `/agile-workflow:feature-design <id>` (or other design, implement, or
review skill) is interactive unless its prompt clearly belongs to an active
autopilot driver. The disambiguation test is: *"Can I point to the active
autopilot goal or caller note driving this invocation?"*

## What still warrants a hard halt (autopilot or not)

- Substrate not bootstrapped (no `.work/CONVENTIONS.md`)
- Foundation docs missing for a foundation-required workflow
- `depends_on` cycle detected when writing items
- Genuinely contradictory state the skill cannot recover from

Everything else resolves through evidence and judgment under autopilot. Prefer
the simpler, more reversible option and log why.

## Worked examples (autopilot mode)

| Situation | Judgment-mode action |
|---|---|
| Two architectural options both look valid | Pick the one with fewer moving parts; log the rationale. |
| Brief is vague, several plausible interpretations | Pick the one most consistent with foundation docs; log under `## Design decisions`. |
| Multiple candidate items at a stage and no id was passed | Pick most recent by `updated:`; the next iteration picks the next. |
| Wrong-tag invocation routed to you by mistake | Log a misroute note; return without advancing. |
| Empty diff during review after trying ranges | Advance to `done` with a "No diff found" note. |
| Item at unexpected stage | Choose the recoverable transition and log it. |

## Explicit alignment mode

`--only-questions` is unchanged: it is an explicit, interactive-only alignment
pass that captures answers under `## Design decisions`, does not design, and
does not advance stage. Refuse it when autopilot is the active driver. Inside
that mode, surface the target's meaningful strategic ambiguities even when a
normal design pass would resolve a reversible point autonomously.

## Skills this applies to

This policy governs `feature-design`, `epic-design`, `refactor-design`,
`perf-design`, `implement`, `implement-orchestrator`, and `review`, plus the
cross-plugin research orchestrator when routed from autopilot. Interactive-only
skills may remain workshop-oriented, but should still avoid questions whose
answers are routine and reversible.

---

# Part IV — Risk-Driven Advisory Review

Advisory review is selected by risk in both direct and autopilot design modes;
it is not a stage transition and is never triggered merely because autopilot is
active. Small, low-risk work skips it. Uncertain or risky work gains independent
scrutiny, while deep or complex work may use multiple model classes. Load
[references/advisory-review.md](references/advisory-review.md) for scope defaults,
two-phase mechanics, and the item-body record format. Model classes, host-peer
pairing, and concrete mechanism flags remain in
[references/models.md](references/models.md).

## `review_weight`

`review_weight` is the canonical caller/project control consumed by review and
autopilot. Allowed values are `none | light | standard | thorough | maximum`;
the default is **`standard`**. It controls both independent-review depth and the
closure policy for features, epics, and final completion bundles:

- `none` — explicitly opt out of independent review. Implementation
  verification and acceptance evidence remain mandatory.
- `light` — at most one focused fresh-context pass where risk warrants it, then
  adjudicate, fix any receiver-confirmed blockers, verify, and finish without a
  second independent pass.
- `standard` — the normal default: exactly one balanced fresh-context review
  pass, followed by receiver adjudication, blocker fixes, verification, and
  `done`. **Standard is single-pass review, not a convergence loop.**
- `thorough` — iterative fresh-context review: review, adjudicate, fix, verify,
  and review again until a pass produces no receiver-confirmed **material
  current-cycle blockers**. The receiver judges materiality in repository
  context; smaller findings are parked, noted as nits, or rejected and do not
  keep the loop open.
- `maximum` — the same convergence requirement as `thorough`, with
  complementary-then-adversarial, multi-model coverage when available.

Reviewer selection and lens breadth still adapt to artifact risk and item tier,
but the closure policy is binding. Do not silently escalate `standard` into
multi-pass review because the target is large, is an epic, uses `--deep`, or the
first pass found blockers. Multi-pass convergence requires an explicit
`thorough` or `maximum` effective weight. Explicit caller and project policy
takes precedence; record the effective weight, source, and any degradation.

## Load-bearing invariants

- **Feature-level implementation review:** child stories never enter `review`.
  Green implementation verification advances a child story directly from
  `implementing` to `done`; completed child stories make their feature eligible
  for review rather than creating review units of their own. A standalone story
  (`parent: null`) is the narrow exception: it receives a bounded review after
  verification, but never an independent or cross-model review. Epics receive
  their own deeper aggregate review after child features are done; review depth
  should generally increase with scope because integration and capability gaps
  emerge at feature and epic boundaries, while tiny-scope review tends toward
  pedantry and over-engineering.
- **Non-blocking review:** an item at `review` has completed implementation
  verification, so it satisfies downstream implementation dependencies while
  review runs. Dispatch the next dependency layer without waiting for the
  verdict. A bounce rejoins implementation; reverify affected downstream items
  only when the fix changes an interface or assumption they consume.
- **Different-class labeling:** call a pass cross-model only when the reviewer is
  known to be a different model class from the host. Otherwise label it
  fresh-context. Different-class review is valuable for independent blind spots,
  not greater authority.
- **Fresh-context semantics:** when independent review is warranted and a
  different class is unavailable, use the strongest suitable fresh-context
  reviewer available. Do not present inline self-review as independent.
- **Phase order within the selected weight:** when both complementary and
  adversarial coverage run, completeness / complementary / advisory comes
  first. `standard` still uses only one review pass; phase vocabulary must not
  turn the default into an implicit two-pass review.
- **Non-blocking design:** unavailable or failed design-time advisory review does
  not block direct or autopilot design. Continue with judgment and record the
  reason. A slow top-tier reviewer is not a failure until its appropriately
  sized timeout or mechanism reports failure.
- **Weight-aware completion:** final autopilot completion must clear the review
  path selected by the effective weight and adjudicate every proposal. `light`
  and `standard` run one successful fresh-context pass, fix and verify accepted
  blockers, then finish without re-review. `thorough` and `maximum` continue the
  review → fix → verify loop until a pass yields no receiver-confirmed material
  current-cycle blockers. Smaller findings are dispositioned by judgment and do
  not prolong the loop. At explicit weight `none`, documented implementation
  verification and acceptance evidence satisfy the path without independent
  review. A required fresh-context path that fails blocks completion.

## Recipient-owned finding disposition

Reviewer output is evidence, not authority. The receiving agent orchestrating the
run independently verifies each claim and assigns its disposition against the
repository's actual context: acceptance criteria, supported users and deployment
shape, likelihood, blast radius, recoverability, existing safeguards, and the
cost of delaying the current work. A reviewer's `blocker` label never binds the
receiver by itself, and disagreement is resolved by evidence rather than
seniority or model strength.

A finding blocks the current cycle only when the receiver judges it a credible,
material risk to required correctness, security, data integrity, public
contracts, acceptance criteria, release safety, or trustworthy verification.
Fix those findings now or keep an active item that prevents completion. Park a
valid concern below that bar in the unbound backlog with its risk rationale and
continue; leave nits in review notes, and reject unsupported findings with a
brief reason. Rarity alone does not make a case irrelevant, but a corner case's
likelihood and consequence must justify its delivery cost. Repetition across
review passes does not elevate severity by itself.

A successful review path therefore means independent scrutiny ran when required
and the receiving agent adjudicated the results. It does not mean every reviewer
suggestion was implemented or promoted into the active queue.

User instructions and project-level review/egress rules override defaults. Do
not invoke an external peer mechanism when policy prohibits it. `--only-questions`
is user alignment and therefore skips advisory review.

---

# Part V — Skill invocation patterns

Three arg shapes recur across the plugin. New skills should pick the one that
fits their role rather than inventing a fresh shape.

## Orchestration verbs (drain a queue)

`scope`, `implement-orchestrator`, `autopilot`, `review`

| Arg | Behavior |
|---|---|
| `<id>` or `<id-list>` | Operate on those items |
| `--all` or no arg | Operate on the full queue (default) |
| `<NL filter>` | Interpret free text against the queue; log the interpretation |

## Discovery + emit verbs (scan code, produce items)

`refactor-design`, `perf-design`, `bold-refactor`, and the gate
family (`gate-cruft`, `gate-security`, `gate-tests`, `gate-docs`,
`gate-patterns`)

| Arg | Behavior |
|---|---|
| no arg / `--all` | Sweep the relevant scope; release-bound items are a gate's focus, not a hard scan boundary |
| `<path>` | Scope to that subtree |
| `<NL scope>` | Interpret free text against the codebase; log the interpretation |
| `<feature-id>` (where applicable) | Per-feature design mode (refactor-design, perf-design) |

These skills *emit substrate items as findings* rather than gating pass/fail.
For release gates, follow relevant evidence into adjacent dependencies, shared
infrastructure, or system-wide mechanisms. Bind findings to the release only
when they are caused by, exposed by, or materially relevant to it; route merely
ambient discoveries to unbound backlog proposals so a gate does not silently
expand release scope.

## Per-item design verbs

`feature-design`, `epic-design`, `refactor-design`, `perf-design`

| Arg | Behavior |
|---|---|
| `<id>` | Full design pass on that item (default) |
| `--only-questions <id>` | Question-only alignment pass; captures answers under `## Design decisions`; does NOT design or advance stage |
| `--only-questions <id-list>` | Question-only pass over each listed item |
| `--only-questions --all` | Question-only pass over every drafting item of the matching kind/tags |

`--only-questions` always requires interactive mode and refuses to run under
autopilot.
