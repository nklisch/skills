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
.mockups/<item-id>/index.html
docs/<repository-wide foundations>
docs/<sub-project>/<scope-owned foundations>
<sub-project>/docs/<scope-owned foundations>
.agents/skills/patterns/  # canonical pattern index and references
.claude/skills/patterns  # relative symlink when CLAUDE.md exists
AGENTS.md
CLAUDE.md                # optional relative symlink to AGENTS.md
```

- `.work/` records outcomes the project may decide and deliver.
- `.research/` records externally fetched evidence and grounded synthesis.
- Foundation documents record current or explicitly intended project truth.
- `.agents/skills/patterns/` records detailed recurring implementation shapes
  when the project has patterns worth teaching to future agents.
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

Before a stateful capability mutates project state, it compares the exact
`workbench_version` in conventions with the verified loaded plugin manifest. A
missing or older project stamp stops and offers setup upgrade. An older loaded
plugin stops and requires the plugin itself to be updated before setup can
safely reconcile the project. Mismatch never invokes setup automatically;
write-free ideation remains available.

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
pattern catalogs, research artifacts, mockups, generated indexes, completion
stubs, release summaries, and repository conventions.

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
---
```

Setup always asks the user how completed items should be retained, the
repository's documentation conventions (foundation layout, naming, and
contract-truth ownership), and whether to establish or extend
`docs/PRINCIPLES.md` — from derived candidates, the core suggested invariants
(contract truth ownership, compatibility is earned, leave it simpler), and,
when bootstrapping, optional code-design principle candidates; it also aligns
repository-specific conventions, including review weight, simplification
posture, and autonomy. It may recommend conventions from repository evidence,
including parking useful out-of-scope findings and behavior-focused testing.
It inspects coding, structural, and pattern evidence but asks no preference
question without concrete evidence or an explicit existing user preference. It
routes mechanical rules to tool configuration, concise operating rules to
`AGENTS.md`, architecture and principles to foundations, and proven recurring
implementation shapes to `.agents/skills/patterns/`. It writes no new convention
without confirmation. A missing `review_weight`
resolves to `standard`; missing `simplification_posture` resolves to `balanced`;
missing `autonomy` resolves to `adaptive`. `workbench_version` has no fallback:
setup stamps it from the verified loaded plugin after successful reconciliation.

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
files do not imply order. Every edge has one non-empty reason in an exact
`## Sequencing` section:

```markdown
## Sequencing

- `feature-contract`: Its settled contract prevents avoidable rework here.
```

The section contains exactly one entry for each edge and no stale entries. An
item is `blocked` when it has `blocked_by` edges or an exact `## Blocker` section
that names an external condition and how it clears. Otherwise it is `active`.
`related_to` carries non-ordering context and may be reciprocal.

The first non-empty active-item body line is a Markdown title, followed by the
exact line:

> Workbench version mismatch: stop and offer setup upgrade.

Each active item then communicates its outcome, scope, and observable acceptance
evidence, but the headings may fit the work. Backlog items and completed stubs
carry the same line; release summaries do not.

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
threshold or required lifecycle stage. It keeps outcome-specific design in the
active item and uses one primary lens:

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

For a concrete Workbench design or delivery workflow, the effective
`review_weight` resolves from explicit user direction, `.work/CONVENTIONS.md`,
then `standard`. It does not govern general reviews, audits, planning,
explanations, or unrelated requests made in the repository:

- `none` uses self-review only while preserving verification;
- `light` permits at most one risk-warranted fresh-context pass;
- `standard` gives substantive designs and completed changes one balanced
  fresh-context pass;
- `thorough` repeats review and correction until no confirmed material issue
  remains;
- `maximum` adds complementary, adversarial, and cross-model coverage when
  available.

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
project type. Missing or contradicted authorized requirements may be blocking
findings; adjacent improvements are non-blocking follow-ups and may be parked.
Only `thorough` and `maximum` repeat independent passes.

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
independent-review depth and repetition. It never makes unrelated cleanup part
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
contract, and return evidence. The deliverer never writes the shared pattern
catalog or closes the parent boundary.

Features and standalone stories are integrated review boundaries. A story
nested under a feature is an implementation slice: `deliver` verifies and closes
it, then returns evidence for the feature's integrated review instead of running
a duplicate independent pass. `work` remains the natural-language outcome owner
for scoping, requirements, design routing, multi-unit orchestration, wider
integration, and parent closure. It does not repeat completed item-level review;
it reviews only substantive wider integration behavior not already covered.

Verification targets stable interfaces and meaningful user journeys. A test
must protect enough behavior, contract, boundary, risk, or regression to justify
its maintenance cost. Review follows the effective weight, and findings are
verified before acceptance.

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

Foundation documents contain durable current behavior or explicitly intended
project truth, not progress narration. Design rolls them forward only after
durable truth is settled. Implementation closure reconciles affected assertions
against the integrated result, reporting updated foundations, or—where an update
was reasonably expected—why existing assertions remain accurate.

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
removes false claims, follows root or sub-project ownership, and links rather
than duplicates cross-scope contracts. Git carries history.

Independent design and implementation review check foundation alignment when
the work affects durable project truth. When indexed documentation changes,
the agent rebuilds `.knowledge/index.json` and verifies committed freshness with
`--check`.

## Research

The user's request is the authority for research direction, scope, and outcome.
Repository material grounds terminology, constraints, decision context, and
prior evidence; it does not silently expand external research into an
implementation or related-repository audit. The agent asks before source
acquisition when it cannot state the requested outcome clearly.

Small conversational lookups remain in chat. The agent initializes `.research/`
and writes a brief only when evidence must survive the conversation or inform a
consequential decision.

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

After interactive research, the skill may ask whether genuinely reusable
guidance should become a project skill. It never promotes a skill autonomously
or without explicit approval.

## Knowledge index

`build-knowledge-index.py` indexes root and sub-project documentation,
`.research/**/*.md`, and `.work/**/*.md`. It emits byte-stable JSON, rejects
duplicate namespace/id pairs and unresolved relationships, generates the
bibliography, and checks committed freshness with `--check`.

Allowed knowledge relationships are `supports`, `contradicts`, `informs`, and
`supersedes`. Work hierarchy and scheduling continue to use `parent`,
`blocked_by`, and `related_to`.

## Setup conversion

Setup inventories any existing workflow semantically, aligns conventions with
the user, maps useful truth to the canonical destinations, adds the canonical
version guard line to every active, backlog, and completed item, validates
retained content block by block, rewrites inbound references, and only then
removes superseded artifacts. Legacy convention and pattern catalogs are split
by meaning: mechanical rules move to tool configuration, concise operating
rules to `AGENTS.md`, structural and principle truth to foundations, and proven
recurring shapes to `.agents/skills/patterns/`. Generated wrappers, digests,
and workflow-specific scans are removed after migration. Setup creates or
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
before declaring Workbench delivery done. It explicitly leaves loose,
conversational, and unrelated requests outside Workbench.

The hook exists for ownership discoverability and post-compaction salience. It
parses nothing beyond the owner check, keeps no session state, and has no
escape-hatch flag — adopting Workbench is the opt-in. Skills remain the
contract; a host that does not run or trust hooks degrades to absent, never to
broken.

## Deterministic validation

`validate-workbench.py` checks ownership, exact plugin-version compatibility,
canonical work-item guard lines, canonical directories and clone-stable markers,
item schemas, globally unique ids, title and body presence, parent-kind
pairs, parent and sequencing cycles, relationship integrity, readiness state,
sequencing and blocker evidence, research and mock references, and superseded
substrate paths. Semantic tier fit and reason quality remain review judgments.

`lint-research.py` checks attestation metadata, sensitive markers, mandatory
attested-detail and disconfirming sections, and citation resolution. Reference
format and safety remain judgment rules in the research discipline.
`build-knowledge-index.py --check` rejects stale committed output.
