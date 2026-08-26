# Workbench

Workbench lets you collaborate with coding agents on real projects through
ordinary conversation while preserving the decisions, evidence, and delivery
state that matter later.

You describe the outcome. The agent learns the repository, asks for the
decisions that belong to you, and drives the agreed scope to a verified finish.
When external evidence matters, the same plugin can produce grounded research
and connect confirmed findings back to project work.

Workbench works with Claude Code, OpenAI Codex, and Pi. Its behavior is shared
across all three agents; only installation and presentation differ.

## Goals

Workbench is designed to:

- keep ordinary language as the main way people direct work;
- let agents continue substantial work across sessions;
- keep consequential choices and authority with the human;
- make verification, useful testing, and proportionate review part of delivery;
- discover and triage improvement opportunities without silently starting work;
- keep source evidence, agent inference, and project decisions distinct;
- leave one clean project state that another person or agent can understand.

## The mental model

Think of Workbench as four things:

1. **A working agreement** — project conventions say how agents should verify,
   review, deliver, research, and collaborate, and record which Workbench
   release last reconciled that agreement.
2. **A small durable memory** — `.work/` records active outcomes and useful
   deferred context so the next session does not depend on chat history.
3. **An evidence layer** — `.research/` keeps fetched external evidence and
   grounded synthesis separate from project decisions.
4. **A set of focused capabilities** — ideation, design, delivery, scanning,
   parking, release summaries, research, and research handoff are available
   when the request needs them.

Natural language remains the control surface for concrete Workbench workflows.
You do not move cards through stages or decide how agents should coordinate
before asking for tracked project work. This does not make Workbench a universal
router: unrelated conversation, lookups, explanations, and reviews that do not
need its capabilities remain ordinary requests.

Workbench's stateful skills require an upward-found `.work/CONVENTIONS.md`
declaring `owner: workbench`. `setup` is the explicit adoption route. `ideate`
is the only capability that may also run before adoption because it remains a
write-free conversation; it creates no project state unless you choose a
handoff and explicitly adopt the required substrate. Setup never starts from
repository detection, drift, or another skill's recommendation; you must invoke
it or state that you want Workbench initialized, adopted, migrated, upgraded,
refreshed, or reconciled.

```text
Early, substantial, uncertain, or coupled work ─→ ideate ─→ chosen handoff
Clear, coherent or multi-unit outcome ───────────→ work
Consequential implementation shape ─────────────→ design
One named implementation-ready feature or story → deliver
work ─→ deliver ready items ─→ integrate wider boundary ─→ close

Look for or investigate opportunities ─→ scan ─→ selected handoff
Useful but out of scope ───────────────→ park
Completed outcomes ───────────────────→ release (optional scan-lens gates)
External evidence needed ─────────────→ research ─→ confirmed handoff
```

Design reasoning always happens. The dedicated `design` skill is used when the
implementation shape is consequential; obvious, local, reversible choices stay
inside normal delivery. Research is used when a decision depends on evidence
outside the repository, not simply because the agent needs to read the code.

Ideation is based on the value of discovery, not ambiguity or size alone. It is
preferred for the initial exploration of substantial or cross-cutting work when
a short collaborative pass could materially improve what gets designed. A
large mechanical change with an established outcome can move directly through
`work`; a smaller request may need `ideate` when connected product, domain, or
business decisions still shape what should be built. An explicit request to go
straight to design or execution bypasses that preflight.

## What a session looks like

Suppose you ask, “Drive the onboarding epic to done.”

The agent reads the repository, Workbench conventions, and the epic before
acting. It asks only for consequential choices the repository cannot answer,
routes through design if the implementation shape warrants it, and sends each
ready feature or story through `deliver`. Features receive integrated item
review; nested stories return verification evidence to their owning feature.
`work` integrates the delivered units and closes the full requested boundary. If
it finds a worthwhile analytics cleanup that is unrelated to onboarding, it offers
to park that finding rather than silently expanding the work.

The durable record remains ordinary Markdown. You can read or edit it directly;
the agent is responsible for keeping its structure valid. When the conventions
version and loaded plugin version differ, the agent gives one helpful update and
setup recommendation without blocking legitimate work.

Conversational questions, proposals, progress summaries, and completion replies
remain chat prose unless the workflow explicitly names a repository artifact.
Workbench does not create report files or durable no-op records unless you ask
for them.

## The durable project state

Workbench keeps its state deliberately small:

```text
.work/
├── CONVENTIONS.md      # collaboration, review, verification, and delivery rules
├── active/             # outcomes currently being delivered
├── backlog/            # useful context parked for later
├── completed/          # compact completion summaries, when retained
└── releases/           # versioned outcome summaries

.research/
├── CONVENTIONS.md      # evidence and privacy rules
├── bibliography.yaml   # generated from attestations; do not edit by hand
├── attestations/       # what individual fetched sources support
└── briefs/             # grounded synthesis across sources

.knowledge/
├── index.json           # deterministic discovery metadata
└── index-exclusions.txt # optional tracked path-prefix exclusions

.mockups/                # optional UI alignment artifacts
.agents/skills/patterns/ # canonical pattern index; references grow from evidence
.agents/skills/scan-*/   # optional user-confirmed project scan lenses
docs/                    # current or intended project truth
AGENTS.md                # canonical cross-agent instructions
```

`AGENTS.md` is deliberately compact. Its managed Workbench block carries the
cross-agent ownership, routing, authority, output, and completion rules needed
before a skill takes over. Detailed schemas, review convergence, roadmap
handling, release cleanup, and other conditional mechanics stay in the
conventions, skills, and references that own them.

### How agents organize work

Agents use features as the normal delivery and integrated review unit. An epic
groups at least two independently meaningful feature outcomes. A story is a
narrow independently verifiable slice. Features and stories may stand alone, so
small work does not need wrapper items. Nested work follows
`epic → feature → story` without skipping a tier.

Agents create separate items only when those items need their own status,
relationships, ownership, or cross-session history. Temporary agent tasks stay
out of the ledger.

Writing down an epic, feature, or story does not certify that it is fully
designed. Before starting each item, the agent reads its current scope and the
affected repository surfaces. Consequential implementation shape goes through
`design` and its configured review before implementation or delegation;
obvious, local, reversible choices remain inline.

For several meaningful units, `work` owns orchestration, dependency order,
delegation, integration, and acceptance across the requested boundary. For one
small coherent unit, the same skill normally executes directly rather than
creating coordination overhead.

Hierarchy describes how outcomes belong together. Ordering is separate.
`blocked_by` says another active item should finish first because serial work
reduces rework, ambiguity, or integration risk. Independent items stay edge-free
so agents can run them in parallel. Non-obvious ordering may be explained in
ordinary item prose when useful. `related_to` preserves useful context without
controlling readiness.

Both people and agents can use `park` when they uncover something valuable that
does not belong in the current scope. It records the smallest useful backlog
item — context, why it may matter, and known evidence — without inventing
priority, requirements, ownership, or design. The agent then returns to the
work already in progress, so capturing the finding does not interrupt or expand
the current workflow.

### What each layer means

Code and foundation documents remain the technical truth. Git remains the
history. Workbench records the delivery state needed to get from one to the
other.

When design or implementation changes durable project truth, the agent updates
the affected root or sub-project foundations in place, checks them during
review, and reports either the changes or why the existing assertions remain
accurate. If indexed documentation changed, it also rebuilds and checks the
knowledge index.

Research attestations record what external sources actually support. Research
briefs synthesize across those sources. The knowledge index makes durable
material discoverable, but it is not evidence or project truth on its own.
When a repository contains companion checkouts, generated documentation, or
other irrelevant trees, it can track repository-relative path prefixes in
`.knowledge/index-exclusions.txt`. The builder prunes those trees before
scanning; agents choose exclusions from repository context and keep intended
project documentation visible.

Workbench validators check structure, relationships, citations, and generated
state whenever agents create or reshape the corresponding artifacts.

`setup` stamps its loaded plugin version once in conventions after successful
reconciliation. Skills, validation, and the session reminder use differences as
advisory upgrade/setup guidance without duplicating a warning into every work
item. Setup also
asks you for the repository's defaults — autonomy, review weight,
simplification posture, what happens to finished items, and your documentation
conventions (where foundation documents live, how they are named, and whether
contract truth lives in code or
documents) — and records them where they belong, mostly `.work/CONVENTIONS.md`,
where you can change them later. It always offers the optional Workbench
configurations as opt-in, decline, or defer choices: execution posture, commit
posture, release gates, Workbench recognition of a user-owned roadmap, and the `CLAUDE.md`
compatibility projection. Repository evidence may explain why one is useful,
but never hides the choice or adopts it for you.

Setup also inspects coding rules, structural foundations, tool configuration,
and pattern catalogs to discover unique repository-specific conventions. Those
candidates may fall outside Workbench's named configuration: evidence is an
open-ended discovery lens, not a predefined checklist. Each confirmed rule goes
to its narrowest authority; a repository-specific delivery rule with no narrower
home becomes named prose in the conventions body, never an invented configuration
key or a generic refactor-conventions layer. Setup also asks whether to establish
or extend `docs/PRINCIPLES.md` —
recommending three core invariants (contract truth ownership, compatibility is
earned, and leave it simpler), offering optional code-design principles when
bootstrapping, and adding anything it derives from the repository itself. For
finished items:

- `summarize` keeps a compact temporary outcome stub for the next release;
- `discard` removes the item after verification and lets release summarize from
  Git history.

Both postures support release. After a successful release, Workbench removes all
completed outcome files and keeps the concise version summary plus Git history.

The optional `.mockups/` directory holds interactive UI walkthroughs when a
user journey needs alignment. They are requirements evidence, not production
code.

## How to think about the agent

The agent is neither a passive ticket taker nor an unconstrained project owner.
It is a collaborator working inside the outcome and authority you set.

You should expect the agent to:

- inspect the repository before asking questions it can answer itself;
- distinguish product decisions from reversible implementation choices;
- park worthwhile discoveries that would expand the current scope;
- verify claims with evidence and evaluate reviewer feedback rather than
  accepting it automatically;
- leave repository state coherent enough for another agent or session to
  continue.

You should not expect autonomy to override permission. Production actions,
real-data migrations, irreversible decisions, missing product direction,
external coordination, and material scope expansion still return to a human.

Questions, explanations, diagnoses, and general reviews remain ordinary
read-only requests unless you also ask the agent to make changes. They do not
become Workbench workflows or inherit its review setting merely because the
repository has adopted Workbench.

## Collaboration and autonomy

Workbench resolves one posture for each request: your wording first, then the
repository default, then `adaptive`.

| Autonomy | What it means |
|---|---|
| `collaborative` | Discuss ideal and appropriately scoped options before binding consequential decisions. |
| `adaptive` | Ask about human-owned choices; decide routine, reversible details. This is the default. |
| `autonomous` | Drive the authorized outcome to completion and choose the strongest maintainable solution inside it. |

Your current request wins over the default. “Design this with me” is
collaborative even in an autonomous repository. “Drive these epics to done” is
autonomous inside those epics even when the default is adaptive.

Autonomy controls participation and continuation. It does not change quality,
scope, permissions, or safety.

## Design without overdesign

Workbench rewards durable simplicity, not the smallest diff.

A good design has as few concepts as the problem allows, fits the repository,
and leaves a maintainable intended state inside the authorized outcome. The
user's original intent, accepted item, and applicable foundation truth bound the
design. Foundation documents clarify constraints; they do not make every
adjacent aspiration current scope. Necessary implementation detail is design;
new product requirements or adjacent capabilities require a scope decision.

Design judgment also fits the actual project. A prototype, internal tool, small
utility, and public production platform do not rationally need the same
hardening, extensibility, compatibility machinery, infrastructure, or test
surface. Workbench treats unjustified machinery as overbuilding, not quality.

Formal design is not determined by an item's size label. Small and modest work
usually stays inline when repository evidence and brief reasoning can resolve
the choices confidently. The dedicated skill earns its cost when discovery,
alternatives, interface boundaries, or consequential trade-offs need to be
settled before implementation. Who performs that design follows the execution
posture; a formal design can remain entirely in the main agent context.

The design skill selects the lens that matches the work:

- new work;
- prototype or feasibility;
- refactor or cleanup;
- performance;
- defect or reliability;
- UI/UX;
- data, migration, or integration.

Security, privacy, accessibility, operations, compatibility, and testing are
considered when relevant instead of being applied as automatic checklists.

A prototype is a learning outcome, not an abbreviated production release. Its
design names the question, representative behavior, evidence, and intended
disposition: discard, revise, or adopt through a maintainable design.

Workarounds are sometimes correct because scope, time, compatibility, or
authority is genuinely constrained. When that happens, the constraint,
consequence, and better future direction should be explicit.

## Simplification posture

Workbench keeps baseline code hygiene at every level and lets each repository
choose how proactively concrete workflows pursue behavior-preserving reduction:

| Posture | Expected simplification |
|---|---|
| `hygiene` | Keep the touched area clean and catch obvious accidental complexity or algorithmic overwork without hunting beyond it. |
| `balanced` | Actively simplify the affected contract boundary, including cohesive file movement or decomposition when worthwhile. This is the default. |
| `structural` | Challenge the full authorized outcome boundary and permit cohesive file breakouts, consolidation, or substantial restructuring when demonstrably simpler and verifiable. |

The posture applies to design, implementation, and each applicable review pass.
It does not expand the requested outcome. Simplification preserves observable
behavior and measured performance constraints and avoids obvious plausible
performance regressions in affected code; it does not trigger speculative
profiling or low-level optimization when performance is not constrained or
plausibly affected.

## Project patterns during delivery

Setup always creates the portable `.agents/skills/patterns/SKILL.md` index. It
starts as an honest empty stub. Focused references enter only through an
explicit pattern-extraction maintenance feature; ordinary delivery does not
promote patterns ad hoc. This is neither a style checklist nor a periodic gate.

During a user-authorized multi-unit `work` boundary, deliverers report candidate
evidence and the active parent accumulates it. At an explicit integration or
planning boundary, `work` adjudicates the evidence using the
[maintenance guidance](skills/work/references/maintenance.md). No item count or
schedule triggers extraction. Enough concrete recurrence can produce an
ordinary feature tagged `pattern` and, when relevant, `refactor` or `cleanup`.
The feature belongs under the active epic or stays top-level when no epic owns
the boundary, and `deliver` completes it before wider closure. Immature evidence
is offered for parking; aesthetic coincidence is dropped. A direct user request
to detect or extract patterns creates the same maintenance feature immediately.

Ordinary delivery still repairs an existing pattern made stale by current work.
Nested stories and orchestrated units never write the shared catalog. Mechanical
formatting remains in tools, concise coding rules in `AGENTS.md`, and
architecture and principles in foundation documents.

`work` remains the natural-language outcome owner for ambiguous, unscoped,
multi-unit, and end-to-end requests. `deliver` is the bounded skill for one named
implementation-ready feature or story. Features and standalone stories receive
item-level integrated review; nested stories return verification evidence to
the owning feature instead of duplicating its review.

## Commit posture

Commit boundaries represent meaningful changes, not Workbench item transitions.
The optional `commit_posture` may be `adaptive`, `feature`, `checkpoint`,
`batch`, or `preserve`; missing configuration uses the adaptive default. An
explicit request overrides the project setting.

Review normally targets a coherent commit range, but it may use a clearly
bounded working-tree diff when committing would interfere with concurrent work.
Feature-level squashing is a preference only under the matching posture and
only for exclusively owned history where consolidation is simple and safe.
Workbench never requires ledger-only commits or rewrites shared history to
achieve an ideal shape.

## Execution posture

Projects may choose how Workbench assigns its core delivery roles:

| Posture | Expected execution |
|---|---|
| `inline` | The main agent performs design, implementation, and review. |
| `adaptive` | Keep stories and small coherent features inline; use dedicated or mixed roles when their focus earns the handoff cost. This is the default. |
| `orchestrated` | Prefer dedicated design, implementation, and review agents when available; the main agent owns synthesis and integration. |

Item kind and apparent size are useful hints, not thresholds. A large mechanical
change may remain inline, while a small specialized or consequential change may
benefit from another context. A project can state a preferred mixed split in
convention prose, and your current request always overrides the default.

Execution posture does not change whether formal design, verification, or
configured review depth applies. Scan, research, and other specialist workflows
retain their own proportionate fan-out behavior.

## Review depth

For a concrete Workbench workflow, one `review_weight` controls review depth for
both its consequential designs and its completed implementation. Execution
posture controls who performs that review. The setting is a delivery control, not a global
instruction for every review, audit, planning discussion, explanation, or loose
request in the repository.

| Weight | Expected review |
|---|---|
| `none` | No distinct review pass; behavioral verification remains required. |
| `light` | At most one focused pass when risk warrants it. |
| `standard` | Exactly one balanced pass for each eligible design and completed integrated implementation boundary. Correct, verify, and self-review findings without re-reviewing the target. This is the default. |
| `thorough` | Multi-pass convergence: correct and verify between passes until no unresolved blocking finding remains. Material, minor, and nit findings may be parked, accepted, or rejected through outcome-owner adjudication. |
| `maximum` | Thorough convergence using complementary and adversarial lenses, plus model diversity when the execution posture permits and it is available, until no unresolved material or blocking finding remains. Minor and nit findings may remain. |

For `standard`, an implementation-shaping design and its completed feature or
standalone story are separate one-pass targets. A correction and its verification
are not another pass; only `thorough`, `maximum`, or explicit user direction
permits re-reviewing the same target. Workbench does not enforce a numeric
review cap: a project may state a preference in convention prose, and explicit
user direction may bound, extend, or stop a review. When that ends a review
before convergence, report remaining findings for a clear user disposition.
Review weight controls pass depth and repetition; simplification posture controls
how strongly each pass looks for behavior-preserving reduction; execution
posture controls whether the pass is inline or fresh-context.
Refactor work and changes that reshape decomposition also get a
structural-hygiene lens at `standard` and above: structure, conditionals, and
breakout quality are judged against the codebase's own conventions and
language idioms, never against fixed numeric thresholds. Review
is not verification. A reviewer saying “looks good” does not prove the behavior
works. Review is not a second chance to redefine the project, either:
every reviewer is told not to invent requirements or expand scope, to judge the
work against the user's original intent and the rational expectations of the
actual project type, and to flag overbuilding. A missed authorized requirement
may block acceptance; a worthwhile adjacent improvement is a non-blocking
follow-up that can be parked.

Formal design and implementation reviewers also read Workbench conventions,
repository-wide principles, and principles owned by the affected scope. Those
are evaluation lenses within the accepted outcome, not permission to invent
requirements or widen it.

Under `inline`, the main agent performs distinct lens-separated passes without
claiming independence or model diversity. If you explicitly request an external,
independent, or cross-model reviewer and none is available, the agent discloses
that limitation and asks how you want to proceed.

## Testing and verification

Tests exist to protect meaningful behavior, contracts, boundaries, and known
regressions — not to cover every line. The agent reuses the test and benchmark
machinery your project already has and may add a small, contained test or probe
on its own.

Standing up new validation infrastructure is a project decision, not an
implementation detail, so the agent brings that to you before building it. When
it cannot produce credible evidence with what is available, it tells you the
limitation instead of reporting the work as done.

## Grounded research

Use research when the answer depends on evidence outside the repository:

- prior art and competing approaches;
- current libraries, APIs, products, policies, or standards;
- unfamiliar technical domains;
- adoption or architecture decisions with meaningful external claims;
- contested questions where disagreement matters;
- reusable background that future work should be able to discover.

Repository code and documentation are already project context. They should be
read directly and should not be repackaged as external source attestations.

Small conversational lookups do not always need a committed research brief.
Commit research when the evidence will influence a consequential decision,
needs to survive the current conversation, or should be independently
inspectable later.

### The research mental model

An **attestation** is a local, source-faithful record of what the agent actually
fetched and what that source supports.

```text
Question
   ↓
Fetch external sources
   ↓
Attest what each source actually says
   ↓
Compare, contradict, and synthesize
   ↓
Grounded brief
   ├──→ optional human-confirmed handoff to Workbench
   └──→ deterministic knowledge index (discovery only)
```

Research should not be rewritten to agree with a later product decision, and a
project decision should not be presented as though an external source
established it.

`.research/CONVENTIONS.md` names the provider that owns this substrate. With
`owner: workbench-research`, a separate `verification_rigor` setting tunes
semantic assurance without forcing a larger investigation: `floor` applies the
grounding discipline and deterministic checks, `standard` adds semantic
source-support review, `full` adds an isolated coverage and framing-drift
evaluation, and `adaptive` chooses proportionately. Another provider may own
`.research/` and define its own artifacts and gates; Workbench does not run the
bundled tools over that provider's substrate. Principles inform product
judgment in research, but never substitute for source evidence.

Suppose you ask, “Research the prior art for this architecture decision, and
look for evidence against the leading option.”

The agent clarifies which decision the research may change, fetches the relevant
sources, records the supported details source by source, and writes a brief that
separates evidence from inference. It reports contradictions and confidence
limits rather than manufacturing consensus.

Your request sets the research direction, scope, and outcome. The agent may read
the repository for terminology, constraints, decision context, and prior
research, but that context does not authorize an implementation audit or a
review of related repositories. It offers useful adjacent directions instead of
silently adding them. If the requested outcome is unclear, it asks before
fetching sources.

### How to think about the research agent

The agent is an evidence steward before it is an analyst.

You should expect it to:

- tell you when the available evidence is weak, stale, inaccessible, or
  inconclusive;
- ask before promoting reusable research guidance into a project skill;
- ask before turning findings into tracked Workbench work.

The agent should not use research as a performance of certainty. More sources do
not automatically mean better evidence, and a confident synthesis does not
erase disagreement in the underlying material.

Every committed brief follows the same minimum discipline:

1. Fetch each grounding source during the engagement. Model memory may point
   toward a source, but it never becomes a citation.
2. Create a per-source attestation before citing it.
3. Record the cited detail in that attestation.
4. Separate source statements from inference.
5. Include disconfirming evidence.
6. Preserve contradictions instead of averaging them away.
7. Pass deterministic citation and structure checks.

You do not choose between “quick,” “deep,” or “program” modes. The agent adapts
the depth internally. For a large question, it may assign independent source
areas to specialist agents; each specialist owns and validates its attestations,
while the lead agent owns cross-source synthesis and contradiction analysis.

### Sensitive information

Workbench must not fetch, attest, synthesize, or index PII, PHI, credentials,
session material, or other prohibited sensitive data. Narrow or redact the
source, or use an approved non-LLM process instead.

### From research to work

Research informs delivery, but it does not silently create delivery scope.

The `research-handoff` skill reads a selected brief and its evidence, proposes
concrete Workbench items, and asks which proposals you want to create. It emits
only the confirmed items and leaves the original research unchanged.

Sometimes research produces durable method or domain guidance that would be
more useful as a project skill. After an interactive engagement, the agent may
offer that option and explain the benefit and maintenance cost. It never
promotes a skill during an autonomous run and never creates or changes one
without explicit approval.

## The skills

| Skill | Use it when |
|---|---|
| [`setup`](skills/setup/SKILL.md) | Adopting Workbench or consolidating an existing workflow into one clean state. |
| [`ideate`](skills/ideate/SKILL.md) | Exploring uncertain, substantial, cross-cutting, or early-stage work before committing to scope or design; it may run before adoption. |
| [`design`](skills/design/SKILL.md) | Shaping consequential implementation after the outcome is understood, or when you explicitly request direct design. |
| [`deliver`](skills/deliver/SKILL.md) | Implementing, verifying, reviewing, and closing one named implementation-ready feature or story. |
| [`work`](skills/work/SKILL.md) | Scoping and owning a clear outcome, multi-unit boundary, epic, or group of epics. |
| [`park`](skills/park/SKILL.md) | Preserving a useful finding without expanding current work. |
| [`scan`](skills/scan/SKILL.md) | Investigating project concerns, verifying and clustering opportunities, and asking which findings should survive as handoffs. |
| [`release`](skills/release/SKILL.md) | Summarizing completed outcomes, optionally applying project-defined scan lenses as release gates, then cleaning retained completion files. It does not tag, publish, or deploy. |
| [`research`](skills/research/SKILL.md) | Investigating an external, unstable, unfamiliar, contested, or decision-relevant question. |
| [`research-handoff`](skills/research-handoff/SKILL.md) | Turning selected research findings into proposed Workbench outcomes. |

In an adopted repository, you can invoke a skill explicitly, but concrete
Workbench requests should not require you to know which one is appropriate. The
agent routes based on your intent and the repository state while leaving
unrelated requests outside Workbench. In an uninitialized repository, `ideate`
may explore conversationally; all stateful skills remain inactive unless you
explicitly invoke `setup` to adopt Workbench.

## Session posture hook

The plugin ships one lightweight `SessionStart` hook. In a Workbench-owned
repository it injects a short, static reminder of high-level posture — read conventions
and foundations first, treat a plugin-version difference as advisory upgrade and
setup guidance, keep scope narrow, orchestrate multi-unit
boundaries, park out-of-scope findings, reconcile and close before done. It
exists for ownership discoverability and post-compaction salience; the skills
remain the contract, and a host that does not run hooks loses nothing. Codex
requires trusting the plugin's hook definition before it fires.

## Starting and adopting

Install from the `nklisch/skills` marketplace:

```bash
# Claude Code
/plugin marketplace add nklisch/skills
/plugin install workbench@nklisch-skills

# OpenAI Codex
codex plugin marketplace add https://github.com/nklisch/skills
codex plugin install workbench

# Pi (via the pi-plugins manager)
pi install npm:@nklisch/pi-plugins
# then, inside Pi:
/plugins marketplace add nklisch/skills
/plugins add workbench@nklisch-skills --scope user
```

Explicitly adopt the repository first:

- “Set up Workbench in this repository.”

After setup has established `owner: workbench`, ask:

- “Help me think through this tracked project outcome.”
- “Design this refactor with me.”
- “Implement this feature.”
- “Drive the onboarding epics to done.”
- “Park this finding for later.”
- “Research the prior art for this decision.”
- “Turn the confirmed findings in this brief into proposed Workbench items.”

`setup` rewrites the repository into one clean state, and that includes deleting
files it has migrated. In a greenfield repository, once ownership and
conventions are valid, setup continues directly into `ideate`. Ideation uses
setup's canonical foundation-document contract and confirmed documentation
choices to shape the project's initial foundations; it does not ask you to
invoke another skill or invent a second format, and it still waits for your
explicit foundation handoff before writing them.

Setup does not leave `.bak` copies or a legacy folder.
Anything clean and tracked is recoverable from Git. Before removing anything
modified, untracked, ignored, or otherwise unrecoverable, it asks you to create
a pre-state commit or shows you the exact removal list for confirmation.

Re-running `setup` on a repository that already uses Workbench is an upgrade
and sync pass: it detects drift from the stamped plugin version — conventions
questions a newer version asks that the repository never settled, missing
fields, superseded layout — and reconciles it without re-asking choices you
already made. It still offers an optional configuration that remains unsettled,
without re-opening one the repository already confirmed. It also migrates useful legacy refactor-convention and pattern
content into tool configuration, `AGENTS.md`, foundations, or the canonical
portable pattern catalog according to meaning. It creates an empty valid index
when no recurring pattern truth exists. Setup proactively offers root
`CLAUDE.md` as a relative symlink to canonical `AGENTS.md`. When `CLAUDE.md`
exists, it maintains `.claude/skills/patterns` as a relative
symlink to the canonical `.agents` catalog after conflict-safe reconciliation.
Stateful skills mention useful update and setup guidance when versions differ but
continue unless they encounter a concrete incompatibility.

Workbench and `agile-workflow` use mutually exclusive `.work/` schemas. Use
`setup` to convert rather than running both systems in the same project.
