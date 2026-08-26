# Specification: Workbench

## Authority boundaries

```text
.work/
├── CONVENTIONS.md
├── active/.gitkeep
├── active/<id>.md
├── backlog/.gitkeep
├── backlog/<id>.md
├── completed/.gitkeep
├── completed/<id>.md
├── releases/.gitkeep
└── releases/<version>.md

.research/
├── CONVENTIONS.md
├── attestations/.gitkeep
├── attestations/<handle>.md
├── briefs/.gitkeep
├── briefs/<id>.md
└── bibliography.yaml

.knowledge/index.json
.knowledge/index-exclusions.txt  # optional tracked path-prefix exclusions
.mockups/<item-id>/index.html
docs/<repository-wide foundations>
docs/<sub-project>/<scope-owned foundations>
<sub-project>/docs/<scope-owned foundations>
.agents/skills/patterns/  # canonical pattern index and references
.agents/skills/scan-*/    # optional reusable project scan lenses
.claude/skills/patterns  # relative symlink when CLAUDE.md exists
AGENTS.md
CLAUDE.md                # optional relative symlink to AGENTS.md
```

- `.work/` records outcomes the project may decide and deliver.
- `.research/` records externally fetched evidence and grounded synthesis.
- Foundation documents record high-level current or explicitly intended project
  truth, not delivery tracking or implementation machinery.
- `.agents/skills/patterns/` records detailed recurring implementation shapes
  when the project has patterns worth teaching to future agents.
- `.agents/skills/scan-*/` optionally records reusable project-specific scan
  lenses; natural-language one-off concerns need no catalog entry.
- `.knowledge/index.json` is committed discovery metadata with no independent
  authority.

Workbench and agile-workflow are mutually exclusive `.work/` owners.

## Activation and routing

Workbench's stateful workflow is active only when an upward-found
`.work/CONVENTIONS.md` declares `owner: workbench`. Every stateful skill checks
that boundary and is ignored when it is absent or another system owns `.work/`.
`setup` is the sole pre-adoption mutation route and runs only when the user
explicitly invokes it or states that they want to initialize, adopt, migrate,
upgrade, refresh, or reconcile Workbench. The same explicit-request requirement
applies to already-owned repositories; detection, drift, or another skill's
recommendation never invokes setup. `ideate` may run before adoption because it
is conversational and write-free; it must not create Workbench or research
state without an explicit adoption and handoff choice.

Before stateful work, a capability compares the `workbench_version` in
conventions with the verified loaded plugin manifest. A difference is an
advisory signal that project conventions and loaded workflow guidance may have
drifted: recommend setup when the project stamp is missing or older, and
recommend updating Workbench before setup when the loaded plugin is older. Work
continues unless an actual schema or capability incompatibility is encountered.
A mismatch never invokes setup automatically or implies upgrade consent.

Ownership activates the stateful capabilities, not universal routing. Those
skills engage only for concrete Workbench workflows whose outcome, evidence,
backlog capture, or release state belongs in Workbench. Ideate may support
exploratory conversation without implying adoption. Conversational lookups,
general explanations, unrelated reviews and audits, and other requests that do
not need Workbench state remain ordinary requests.

## Communication and durable state

Unless a skill names a repository path or artifact, questions, offers,
proposals, recommendations, explanations, summaries, and reports happen in the
current conversation. These replies are chat prose, not repository artifacts.
Workbench does not create report files or durable no-op records unless the user
requests them.

Durable state is limited to explicitly named work items, foundations, project
pattern catalogs, user-confirmed project scan-lens skills, research artifacts,
mockups, generated indexes, completion stubs, release summaries, and repository
conventions.

## Agent instruction boundary

The canonical root `AGENTS.md` is a compact, high-salience cross-agent operating
contract. Its Workbench block holds the information an agent needs before a
stateful skill takes over: ownership and activation, skill routing, human scope
authority, the boundary between chat and durable output, the basic work-unit
model, and the requirement to verify, reconcile, review, and close delivery.
Confirmed repository-specific coding or operating invariants may join it when
they must bind every agent.

`AGENTS.md` does not mirror the Workbench specification. Conditional workflow
mechanics, schemas, review-pass convergence, roadmap handling, pattern promotion,
release cleanup, and other capability-specific rules remain in
`.work/CONVENTIONS.md` or the skill and reference that owns them. Foundation
documents retain durable project truth; tool configuration retains mechanical
rules. This separation keeps the always-loaded contract short enough to remain
salient while preserving precise behavior at the point of use.

## Work conventions

`.work/CONVENTIONS.md` begins with:

```yaml
---
owner: workbench
schema: 1
workbench_version: <exact-loaded-plugin-semver>
completed_items: summarize|discard
review_weight: none|light|standard|thorough|maximum
simplification_posture: hygiene|balanced|structural
autonomy: adaptive|collaborative|autonomous
execution_posture: inline|adaptive|orchestrated  # optional; missing means adaptive
commit_posture: adaptive|feature|checkpoint|batch|preserve  # optional; missing means adaptive
roadmap: true|false  # optional; missing means false
release_gates:       # optional; missing or empty means disabled
  - compatibility
  - test-quality
---
```

`release_gates` is a simple list of unique lowercase kebab-case scan-lens names.
Absent or empty means Workbench adds no release gates. A project defines or
narrows a configured gate with a concise `### <gate-name>` stance under
`## Release gates` in the conventions body. When a project-specific lens is
reused or needs detailed method and references, the user may explicitly approve
`.agents/skills/scan-<gate-name>/SKILL.md`; Workbench never generates or promotes
one by default. Bundled scan lenses are adaptive starting points, not a closed
registry. At release, each configured lens is
applied to the release boundary; only unresolved findings that materially
violate that project's stated expectation block summary and cleanup. Preferred
tool unavailability triggers a credible fallback or an explicit evidence limit,
not an automatic failure.

Setup always asks the user how completed items should be retained, the
repository's documentation conventions (foundation layout, naming, and
contract-truth ownership), and whether to establish or extend
`docs/PRINCIPLES.md` — from derived candidates, the core suggested invariants
(contract truth ownership, compatibility is earned, leave it simpler), and,
when bootstrapping, optional code-design principle candidates; it also aligns
repository-specific conventions, including review weight, simplification
posture, and autonomy. Setup always offers its optional configurations — execution
posture, commit posture, release gates, Workbench recognition of a user-owned roadmap, and the
`CLAUDE.md` compatibility projection — as explicit opt-in, decline, or defer
choices. Repository evidence may recommend a choice but never controls whether
it is offered or silently adopts it. On refresh, setup presents an already
confirmed choice as the current setting rather than re-asking it. Commit posture
and release gates remain absent when declined or deferred; the adaptive Git
posture and no Workbench gates apply. Setup preserves confirmed gate names and definitions;
it never installs a universal set or adds, drops, or rewrites a gate without
confirmation.

Repository evidence is an open-ended search for unique, project-specific
conventions, not a filter limited to Workbench's predefined configuration.
Setup may propose operating agreements that have no Workbench field when
concrete practice, friction, risk, or an existing rule supports them — including
parking useful out-of-scope findings and behavior-focused testing. It does not
invent ungrounded coding, structural, or pattern preferences. It routes
mechanical rules to tool configuration, concise operating rules to `AGENTS.md`,
architecture and principles to foundations, and proven recurring implementation
shapes to `.agents/skills/patterns/`. It writes no new convention without
confirmation. A missing `review_weight`
resolves to `standard`; missing `simplification_posture` resolves to `balanced`;
missing `autonomy` resolves to
`adaptive`; missing `commit_posture` resolves to
`adaptive`; missing `execution_posture` resolves to `adaptive`; missing
`roadmap` resolves to `false`.
`workbench_version` has no fallback: setup stamps it from the verified loaded
plugin after successful reconciliation. The frontmatter schema is closed.
Confirmed repository-specific delivery rules that have no narrower authority
belong as named prose in the conventions body, not as invented configuration
keys or forced matches to a Workbench category.

## Active items

```yaml
---
id: <stable-kebab-id>
kind: epic|feature|story
status: active|blocked
tags: []
parent: null
blocked_by: []
related_to: []
research_refs: []
mock_refs: []
created: YYYY-MM-DD
updated: YYYY-MM-DD
---
```

A feature is the default delivery and integrated review unit. An epic is a
top-level outcome with at least two independently meaningful feature outcomes
that can be named. A story is a narrow independently verifiable slice. Features
may be top-level or belong to epics. Stories may be top-level or belong to
features. Nested hierarchy follows `epic → feature → story` without skipping or
reversing a tier. Skills and review judge whether an item's meaning fits its
tier. The validator enforces structural parent-kind pairs.

`blocked_by` records deliberate queue order. Use an edge for a hard prerequisite
or when serial work materially reduces rework, ambiguity, or integration risk.
Leave independent work edge-free for parallel execution. Parentage and shared
files do not imply order. The item may explain non-obvious ordering where that
context is useful, but `blocked_by` is itself the machine-readable order and no
fixed prose section is required. An item is `blocked` when it has `blocked_by`
edges or an exact `## Blocker` section
that names an external condition and how it clears. Otherwise it is `active`.
`related_to` carries non-ordering context and may be reciprocal.

The first non-empty active-item body line is a Markdown title. Each active item
then communicates its outcome, scope, and observable acceptance evidence, but
the headings may fit the work. Version compatibility is checked once from
`.work/CONVENTIONS.md` and reinforced by the skills and session reminder; it is
not duplicated into every item.

Focused audits, cleanup, and refactors use tags rather than new item kinds.
Prototype items use the `prototype` tag. They name the question, representative
surface, evidence, and expected disposition: discard, revise, or adopt. Closure
records what was learned, carries material learning into the affected
foundation or active item, and removes code marked for discard. Revision or
adoption is an explicit next outcome.

## Completion

Completed work never remains active.

- `completed_items: summarize` replaces an active item with a temporary compact
  `.work/completed/<id>.md` outcome stub for the next release.
- `completed_items: discard` removes the active item after verification and
  leaves release to summarize from Git history.

Both postures preserve `.work/completed/.gitkeep` and
`.work/releases/.gitkeep`. Before closure, active children are completed and
relationships are reconciled. `release` writes one version summary from stubs or
ordinary Git history, then removes every completed outcome file after successful
checks. It does not tag, publish, or deploy.

## Design behavior

Design reasoning is always required. Before formal design, `ideate` is preferred
when initial exploration of substantial, cross-cutting, or early-stage work
could materially change what should be designed, unless the user explicitly
requests direct design. Size alone does not decide the route. Repository evidence
and brief reasoning
may resolve local, reversible choices inline. `design` is callable directly or
from `work` when implementation shape needs meaningful discovery, alternatives,
boundary definition, or adjudication. This is conditional routing, not a size
threshold or required lifecycle stage.

During ideation, proposed solution shapes are grounded in repository
conventions, principles, foundations, architecture, and reusable mechanisms.
When materially distinct, the agent contrasts a minimum coherent solution, a
repository-fit recommendation, and an expanded or ideal option without treating
three choices as a fixed template. Each serious option distinguishes necessary
from avoidable complexity and accounts for its full durable footprint, including
state, copied or generated artifacts, hooks, configuration, tests, validation,
and operations. A system-level simplification outside the initial scope may be
offered with explicit trade-offs and scope labeling, but it cannot silently
enter the selected handoff. Machinery for correctness, accounting,
verification, state management, or determinism is evaluated as a costed choice:
it must protect a concrete product risk or durable invariant strongly enough to
earn its synchronization, constraint, migration, and recovery burden. This
shared lens follows the choice through formal design, implementation,
behavioral verification, and review. It seeks the smallest durable protection;
it does not waive accepted guarantees or evidence.

Design keeps outcome-specific reasoning in the active item and uses one primary
lens:

- new work;
- prototype or feasibility;
- refactor or cleanup;
- performance;
- defect or reliability;
- UI/UX;
- data, migration, or integration.

Security, privacy, accessibility, operations, compatibility, and testing are
risk overlays. Designs separate requirements, facts, assumptions, and
decisions; state meaningful alternatives only where choice matters; identify
boundaries, verification, risk, and recovery; and prefer the simplest coherent
maintainable shape rather than the smallest diff. They may resolve necessary
implementation detail but never invent product requirements or expand the
accepted outcome. The user's original intent, accepted item, and applicable
foundation truth bound the design; foundation aspirations outside that outcome
do not silently enter scope. Design judgment is calibrated to the project's
actual type, maturity, audience, deployment context, and stated risks so an
agent's preferred ideal architecture cannot justify overbuilding.

Effective autonomy resolves from explicit request language, repository
conventions, then `adaptive`:

- `collaborative` discusses ideal and scoped states before binding;
- `adaptive` asks about consequential human-owned choices and resolves routine
  reversible decisions;
- `autonomous` chooses the strongest maintainable solution inside the
  authorized outcome and parks improvements outside it.

Autonomy never expands scope, authority, safety boundaries, or quality
obligations. Workarounds require a real constraint and retain the constraint,
consequence, and better future direction.

The effective `execution_posture` resolves from explicit user direction, the
optional project convention, then `adaptive`. It governs the core delivery
roles without changing formal design or review obligations:

- `inline` keeps design, implementation, and review in the main agent context;
- `adaptive` normally keeps stories and small coherent features inline and uses
  dedicated or mixed roles when focus, consequence, isolation, specialization,
  or throughput earns the handoff cost;
- `orchestrated` prefers dedicated design, implementation, and review agents
  when available while the main agent owns synthesis and integration.

Item kind and apparent size are routing hints, not thresholds. A project may
state a preferred mixed role assignment in convention prose, and explicit user
direction always overrides the default. Scan, research, and other specialist
workflows retain their own proportionate fan-out rules.

For a concrete Workbench design or delivery workflow, the effective
`review_weight` resolves from explicit user direction, `.work/CONVENTIONS.md`,
then `standard`. It does not govern general reviews, audits, planning,
explanations, or unrelated requests made in the repository:

- `none` adds no distinct review pass while preserving verification;
- `light` permits at most one risk-warranted pass;
- `standard` gives each substantive design and each completed integrated
  implementation boundary exactly one balanced pass, then corrects,
  verifies, and self-reviews findings without re-reviewing that target;
- `thorough` uses distinct passes, correcting and verifying between them
  until no unresolved blocking finding remains; material, minor, and nit
  findings may be parked, accepted, or rejected through outcome-owner
  adjudication;
- `maximum` uses thorough convergence with complementary, adversarial, and
  cross-model coverage when the execution posture permits and it is available
  until no unresolved material or blocking finding remains; minor and nit
  findings may remain.

Review implementation-shaping designs before implementation becomes expensive
to reverse. Review completed implementation at its integrated contract
boundary. Model selection follows role fit: creative taste, technical precision,
implementation throughput, and complementary review are distinct strengths.
Reasoning level follows task difficulty, while consequence changes verification
and review rather than automatically increasing reasoning effort. Current model
examples and calibration live in the
[model-role reference](../skills/work/references/model-roles.md).

Every reviewer is instructed not to invent requirements or expand scope, to
flag overbuilding, and to judge against the rational expectations of the actual
project type. Before each formal design or implementation review, the reviewer
reads `.work/CONVENTIONS.md`, repository-wide principles, and applicable
scope-owned principles and uses them as lenses inside the authorized outcome.
They do not create requirements or enlarge scope. Missing or contradicted
authorized requirements may be blocking findings; adjacent improvements are
non-blocking follow-ups and may be parked.
A correction and its verification are not another distinct pass. Only
`thorough`, `maximum`, or explicit user direction repeat distinct passes over
the same target. Thorough review converges when no unresolved blocking finding
remains; maximum review converges when no unresolved material finding remains.
Minor and nit
findings are non-blocking. A project may state a review-count preference in
conventions, but Workbench does not interpret or enforce it; explicit user
direction controls any limit or early stop. If convergence cannot make further
corrective progress, report the remaining findings for user disposition.

Refactor and cleanup work — and any change that makes decomposition
decisions — additionally applies a shared structural-hygiene lens at
`standard` weight and above, in both the refactor design lens and the
implementation-review pass. The lens judges structure, conditionals,
decomposition, and hygiene against the repository's own conventions and
language idioms rather than absolute thresholds, and its findings follow the
same scope disposition: material inside the authorized boundary, parked
outside it. See the
[structural-hygiene reference](../skills/work/references/structure.md).

The effective `simplification_posture` separately resolves from explicit user
direction, `.work/CONVENTIONS.md`, then `balanced`. It governs design,
implementation, and each applicable review pass:

- `hygiene` prevents or removes obvious local clutter and accidental complexity
  in the touched area without broadening the boundary to hunt for refactors;
- `balanced` actively seeks cohesive behavior-preserving simplification across
  the affected contract boundary;
- `structural` challenges the decomposition of the full authorized outcome
  boundary and permits cohesive file breakouts, consolidation, and substantial
  restructuring when the result is demonstrably simpler and verifiable.

Every posture retains the hygiene floor, preserves observable behavior and
measured performance constraints, and avoids obvious plausible performance
regressions in affected code. It does not require speculative profiling,
benchmarking, or low-level optimization without a constraint or credible risk.
The posture controls simplification emphasis, while `review_weight` controls
review depth and repetition and execution posture controls runner topology. It never makes unrelated cleanup part
of acceptance.

## Work behavior

`work` keeps a clear request in one workflow even when it requires requirements,
design, implementation, review, integration, or several epics. It resolves
autonomy from the request and conventions, gathers human input for
consequential human-owned choices, and continues until the full named boundary
is complete or externally blocked.

If the outcome, ownership boundary, or success shape cannot yet form coherent
work, `work` routes through `ideate`. It also prefers ideation for valuable
initial exploration of substantial or cross-cutting work when that pass could
materially improve what gets designed. Established mechanical work and explicit
requests for direct design or execution bypass the preflight. Ideate preserves
a no-write boundary until the user selects a handoff.

Standalone cleanup, simplification, and refactoring are ordinary bounded work.
Behavior-preserving cleanup may travel with a delivery when cohesive; intended
behavior changes require explicit requirements.

Every implementation-ready feature or story routes through `deliver`. In direct
mode, `deliver` owns that single item's implementation, appropriate integrated
review, truth reconciliation, pattern decisions, and closure. In orchestrated
mode, `work` supplies the parent outcome, owned write surface, integration
contract, effective Git posture, and return evidence. The deliverer never writes
the shared pattern catalog or closes the parent boundary.

Features and standalone stories are integrated review boundaries. A story
nested under a feature is an implementation slice: `deliver` verifies and closes
it, then returns evidence for the feature's integrated review instead of running
a duplicate review pass. `work` remains the natural-language outcome owner
for scoping, requirements, design routing, multi-unit orchestration, wider
integration, and parent closure. It does not repeat completed item-level review;
it reviews only substantive wider integration behavior not already covered.

Verification targets stable interfaces and meaningful user journeys. A test
must protect enough behavior, contract, boundary, risk, or regression to justify
its maintenance cost. Review follows the effective weight, and findings are
verified before acceptance.

Commit boundaries represent meaningful code changes, not Workbench item
transitions. Effective `commit_posture` resolves from explicit user direction,
the optional project convention, then `adaptive`: `feature` prefers one coherent
feature commit when safe; `checkpoint` retains meaningful verified slices;
`batch` groups closely related outcomes at an integration boundary; `preserve`
retains natural history; and `adaptive` follows repository practice, ownership,
change shape, and concurrency. Before review, identify a stable commit range or
a clearly bounded working-tree diff. Squashing is advisory and never required
for acceptance. Workbench does not require ledger-only commits or rewrite
shared, published, or concurrently owned history to achieve an ideal shape.

Verification reuses existing tests, fixtures, commands, environments,
observability, and benchmark machinery first. Small, cheap, contained evidence
may be added directly. A new or materially expanded test framework, simulation
platform, benchmark system, mock service, synthetic environment, or validation
architecture requires user discussion.

## Project pattern maintenance

Setup always creates a portable `.agents/skills/patterns/SKILL.md` navigation
index. It may remain an empty stub. Focused Markdown references own confirmed
pattern details; the index links them without duplicating their rule bodies.

Ordinary delivery repairs an existing pattern made stale by current work but
does not promote a new pattern. During a user-authorized multi-unit boundary,
deliverers report candidate evidence and the active parent retains it under
`## Maintenance evidence`: completed item ids, real consumers or examples,
recurrence, the emerging preferred shape, and expected maintenance value.

At an explicit integration or planning boundary, `work` disposes of every
candidate under the effective autonomy posture. Neither a fixed count nor a
periodic schedule triggers extraction. Evidence that satisfies Workbench's
[maintenance guidance](../skills/work/references/maintenance.md) creates an
ordinary feature tagged `pattern` and, when relevant, `refactor` or `cleanup`.
The feature belongs under the active epic when that epic owns the boundary;
otherwise it is top-level. It must complete before the owning boundary closes.
Immature useful evidence is offered for parking; rejected coincidence is
removed. A direct user request to detect or extract patterns creates the same
feature without waiting for a large run.

Only that accepted maintenance feature may add new pattern references and any
cohesive behavior-preserving cleanup. Nested stories and orchestrated delivery
never write the shared catalog. Generic stack advice, one-off choices, formatter
rules, and aesthetic coincidence are not project patterns.

## Foundation reconciliation

Foundation documents contain durable, high-level current behavior or explicitly
intended project truth, not progress narration, delivery tracking, or
item-specific implementation and qualification machinery. They describe the
repository or a scope-owned sub-project through purpose, boundaries, principles,
high-level architecture, observable behavior, guarantees, and intended
direction. Work-item ids and status, delivery-unit numbering, implementation
plans, qualification commands or runners, receipt paths, and evidence history
belong in Workbench items or their owning code, scripts, tests, and focused
references. Workbench items remain the work record.

`docs/ROADMAP.md` is not a foundation document; it is an optional, user-owned
planning document for projects that want a longer-horizon view. Its structure,
level of detail, and voice are the user's choice: narrative, metadata, horizon
or milestone grouping, status
language, and links to other material are all valid. A small, dense set of
links to `.work/backlog/` items is the recommended standard when it fits,
because the ledger retains the operational detail; it is not a required schema.

`.work/` remains the operational work record. Agents determine item state from
it rather than roadmap prose, and must not normalize, remove, or rewrite roadmap
content as an incidental effect of a work-item transition.

Setup always offers Workbench recognition of this convention as an optional
configuration, but creates or adopts the file and records `roadmap: true` only
after explicit user approval. Repository evidence may recommend it but never
implies consent; project size and an existing roadmap-like file do not either.
A roadmap that exists while `roadmap` is missing or `false` remains an unmanaged
user document rather than a setup-migration target. In that state, Workbench
neither treats it as workflow context nor changes it.

Design rolls foundations forward only after durable high-level truth is settled.
Implementation closure reconciles affected assertions against the integrated
result, reporting updated foundations, or—where an update was reasonably
expected—why existing assertions remain accurate.

Foundation names follow the repository's confirmed documentation conventions;
`VISION.md`, `ARCHITECTURE.md`, `PRINCIPLES.md`, `SPEC.md`, `JOURNEYS.md`, and
`WORKFLOWS.md` are examples, not a required set. A contract, schema, or
protocol has one structural authority: code owns structure for
repository-internal contracts while documents hold semantics, invariants,
conformance rules, and rationale; a contract consumed beyond the repository may
warrant a standalone or generated document spec, or a mix. No structural
definition is maintained by hand in two places.

Affected foundations are discovered from requirements, design, the final diff,
and the knowledge index. Reconciliation replaces stale assertions in place,
removes false claims, follows root or sub-project ownership, links rather than
duplicates cross-scope contracts, and removes delivery-specific detail that
belongs in the work record or executable surfaces. Git carries history.

Independent design and implementation review check foundation alignment and
altitude when the work affects durable project truth. When indexed documentation changes,
the agent rebuilds `.knowledge/index.json` and verifies committed freshness with
`--check`.

## Scan behavior

`scan` is Workbench's opportunity-discovery capability. It activates for a
bounded request to look for problems, investigate a quality concern, or propose
improvements in an adopted project; ordinary lookup, explanation, and delivery
of accepted work remain outside it. Before substantial inspection or fan-out,
it reflects the proposed goal, boundary, result posture, constraints, and
materiality threshold. It asks the user to confirm any consequential choice not
already explicit; a broad request never silently becomes a general-purpose
campaign. The request and repository determine the lenses, which may come from
bundled references, project `scan-*` skills, `CONVENTIONS.md`, or a one-off user
concern. The bundled lenses are not a closed catalog. Scan is the adopted
project's normal conversation-first route for these requests, but an
explicitly invoked standalone audit skill, or an explicit request for its
standalone report artifact, is honored on its own terms.

Scan scales from focused inline inspection through a few complementary
fresh-context passes to a decomposed campaign. Scan depth follows the confirmed
scope, consequence, uncertainty, and expected value; `review_weight` does not
govern it. It distinguishes verified defects and drift from evidence gaps,
hypotheses, evaluations, and architectural provocations; an evaluation reports
verified strengths and weaknesses, and only its actionable weaknesses or
opportunities take a disposition. Relevant backlog entries and prior or active
scan items are read before scanning, so already-tracked opportunities are
identified as such and are not updated without a user-selected disposition. It
verifies material claims, deduplicates root causes, clusters findings into
coherent opportunities, challenges high-cost, architectural, or weakly
evidenced proposals — inline or through a proportionate fresh-context pass — on
whether they are real in context, respect documented project intent, and still
earn action over doing nothing, and preserves coverage limits. Sub-agents are
source-read-only and return proposals rather than artifacts or state.

Results appear first as a concise opportunity deck in conversation. The user
chooses whether each cluster is discarded, investigated further, parked,
activated through work/design, or accepted in a location or authority the
project has designated for such decisions.
Only selected handoffs are written. Backlog stubs remain product-level outcomes
with evidence, not one item per warning, and scan never starts remediation by
itself. A multi-session campaign may temporarily track its discovery outcome as
one active feature tagged `scan`; raw scanner packets and standalone reports are
not durable state by default, and a standalone report is written only where the
project's conventions designate a durable location for one.

Release may invoke scan in release-bounded mode for optional `release_gates`.
The configured lens defines the expectation, release defines the scope, and only
unresolved material violations block completion. Ambient improvements follow
normal scan disposition rather than silently entering release scope.

## Research

The user's request is the authority for research direction, scope, and outcome.
Repository material grounds terminology, constraints, decision context, and
prior evidence; it does not silently expand external research into an
implementation or related-repository audit. The agent asks before source
acquisition when it cannot state the requested outcome clearly.

Small conversational lookups remain in chat. The agent initializes `.research/`
and writes a brief only when evidence must survive the conversation or inform a
consequential decision.

When `.research/` exists, `.research/CONVENTIONS.md` declares its provider
owner. The bundled contract is:

```yaml
---
owner: workbench-research
schema: 1
verification_rigor: adaptive|floor|standard|full
---
```

Missing rigor means `adaptive`. Another provider owns its own schema, artifact
shape, verification, index maintenance, and handoff. Core Workbench preserves
that boundary, and Workbench Research scripts decline an alternate-owned tree.

An attestation uses:

```yaml
---
source_handle: <lowercase-kebab-handle>
fetched: YYYY-MM-DD
source_title: <title>
source_url: <direct-reference-when-available>
---
```

Attestations contain source-faithful summaries and numbered citable details
under `## Attested details`. They do not contain project recommendations.
Repository files are project context and are not represented as external
attestations. A direct reference should identify what was fetched when one is
available. It must not contain credentials, tokens, or session material. When
no public URL exists, the attestation explains the external access surface.

A research brief uses:

```yaml
---
id: <id-matching-filename>
kind: research-brief
summary: <concise-summary>
updated: YYYY-MM-DD
source_handles: [<attested-handle>]
relationships: []
---
```

Every cited handle appears in `source_handles`. Relationship targets use the
repository-relative path of an indexed file. Relationships may use a
`<type>:<target>` string or a map with `type` and `target`.

Briefs cite details as `[handle]{N}`, distinguish source claims from inference,
preserve contradictions, and always include `## Disconfirming evidence`.
Research may use specialist fan-out only when every specialist receives the
full discipline, owns and lints its evidence, and the lead owns cross-source
synthesis.

Verification rigor is independent from source count, breadth, duration, and
fan-out. `floor` applies grounding discipline, deterministic validation, and a
lead spot-check of load-bearing conclusions. `standard` adds a semantic
source-support pass over the final brief and its evidence chain. `full` adds an
isolated evaluator that receives the accepted question and boundary, declared
product constraints, and final synthesis—but not sources or research history—
to detect coverage, framing, scope, contradiction, and groundedness drift.
`adaptive` chooses the lowest credible level from consequence, uncertainty,
novelty, disagreement, synthesis complexity, and corpus breadth. Project
principles guide judgment but never count as external evidence.

After interactive research, the skill may ask whether genuinely reusable
guidance should become a project skill. It never promotes a skill autonomously
or without explicit approval.

## Knowledge index

`build-knowledge-index.py` indexes root and sub-project documentation,
`.research/**/*.md`, and `.work/**/*.md`. It emits byte-stable JSON, rejects
duplicate namespace/id pairs and unresolved relationships, generates the
bibliography, and checks committed freshness with `--check`. Projects may
track `.knowledge/index-exclusions.txt` with one repository-relative path
prefix per line; the builder prunes those trees before traversal. Repeatable
`--exclude <path>` arguments add invocation-scoped exclusions. Exclusions are
selected from repository context when companion checkouts, generated docs, or
other irrelevant trees would undermine useful deterministic discovery; they
must not conceal errors in intended indexed material.

Allowed knowledge relationships are `supports`, `contradicts`, `informs`, and
`supersedes`. Work hierarchy and scheduling continue to use `parent`,
`blocked_by`, and `related_to`.

## Setup conversion

Setup inventories any existing workflow semantically, aligns conventions with
the user, maps useful truth to the canonical destinations, validates retained
content block by block, rewrites inbound references, and only then
removes superseded artifacts. Legacy convention and pattern catalogs are split
by meaning: mechanical rules move to tool configuration, concise operating
rules to `AGENTS.md`, structural and principle truth to foundations, and proven
recurring shapes to `.agents/skills/patterns/`. Reusable evidence-based scan
lenses may move to `.agents/skills/scan-<name>/`; generated wrappers, reports,
digests, and workflow-specific scanner orchestration are removed after
migration. Setup creates or
reconciles the canonical portable pattern index, validates its references, and
does not manufacture entries or audit every retained pattern against code.

Setup proactively offers root `CLAUDE.md` as a relative symlink to canonical
root `AGENTS.md`, including when it is absent. When `CLAUDE.md` exists after
reconciliation, setup maintains
`.claude/skills/patterns` as a relative symlink to
`../../.agents/skills/patterns`. Correct links are no-ops. Conflicting files,
directories, broken or wrong-target links, and divergent mirrors are classified
and consolidated under normal recovery and exact-confirmation rules before
replacement; destructive inspection never follows the link.

Its canonical-layout reference owns the shared foundation
document contract: scope, durable-truth rules, authority, and the purpose of
common foundation types.

After a greenfield bootstrap establishes Workbench ownership and conventions but
no code or foundation establishes coherent project direction, setup routes
directly into `ideate` in the same engagement. It passes the confirmed
documentation conventions and links ideation to setup's foundation contract and
principle candidates. Ideation does not re-ask settled setup choices or duplicate
the format; it clarifies project intent and writes the smallest useful initial
foundation set only after the user selects that explicit handoff.

Every removal target is classified as clean tracked, modified tracked,
untracked, ignored, or otherwise unrecoverable. Clean tracked content is
recoverable from Git. Removing other content requires a pre-state commit or the
user's exact-list confirmation.

Setup removes repository-scoped competing workflow plugins after conversion and
reports user- or machine-scoped competing installs for the user to uninstall.
It creates no migration archives, compatibility copies, `.bak` files, or legacy
folders. Immediately before final validation it stages the exact loaded plugin
version in conventions; if validation or cleanup fails, it restores the prior
stamp so incomplete reconciliation cannot claim compatibility. A second run
produces no material change.

For a repository already owned by Workbench, setup runs as an upgrade and sync.
It detects missing conventions, malformed hierarchy, inconsistent readiness,
unexplained sequencing, and superseded layout. Setup normalizes facts it can
recover without invention. For legacy ordering edges without recoverable
reasons, it recommends removal and asks once about the ambiguous edge set. It
does not grandfather invalid structure or fabricate meaning. A second run
remains idempotent.

## Session posture hook

The plugin ships a single `SessionStart` hook (`hooks/hooks.json` +
`hooks/scripts/session-context.py`). When an upward-found `.work/CONVENTIONS.md`
declares `owner: workbench`, it emits a short, fully static posture reminder as
additional context: read conventions and foundations first, compare the stamped
Workbench version with the loaded plugin before stateful work, route only concrete
Workbench workflows through its skills, use features as the default delivery
unit, preserve strict nested tiers, keep independent work parallel, orchestrate
multi-unit boundaries, park out-of-scope findings, and reconcile and close
before declaring Workbench delivery done. For concrete design and delivery
reviews, it directs reviewers to the work skill's `references/review.md`, which
defines the proportional constraint lens and required review packet; reviewers propose and
the outcome owner verifies and adjudicates against product goals and evidence.
It explicitly leaves loose, conversational, and unrelated requests outside
Workbench.

The hook exists for ownership discoverability and post-compaction salience. It
parses nothing beyond the owner check, keeps no session state, and has no
escape-hatch flag — adopting Workbench is the opt-in. Skills remain the
contract; a host that does not run or trust hooks degrades to absent, never to
broken.

## Deterministic validation

`validate-workbench.py` checks ownership, reports plugin-version drift as an
advisory warning, and checks canonical directories and clone-stable markers,
item schemas, globally unique ids, title and body presence, parent-kind
pairs, parent and dependency cycles, relationship integrity, readiness state,
blocker evidence, research and mock references, superseded substrate paths,
the optional `execution_posture` and `commit_posture` enums, and the shape of a declared `release_gates`
list (unique lowercase kebab-case names). Semantic tier fit, roadmap authority
boundaries, gate-definition quality, and the value of ordering edges remain
review judgments.

`lint-research.py` checks attestation metadata, sensitive markers, mandatory
attested-detail and disconfirming sections, and citation resolution. Reference
format and safety remain judgment rules in the research discipline.
`build-knowledge-index.py --check` rejects stale committed output.
