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
AGENTS.md
```

- `.work/` records outcomes the project may decide and deliver.
- `.research/` records externally fetched evidence and grounded synthesis.
- Foundation documents record current or explicitly intended project truth.
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

Durable state is limited to explicitly named work items, foundations, research
artifacts, mockups, generated indexes, completion stubs, release summaries, and
repository conventions.

## Work conventions

`.work/CONVENTIONS.md` begins with:

```yaml
---
owner: workbench
schema: 1
completed_items: summarize|discard
review_weight: none|light|standard|thorough|maximum
autonomy: adaptive|collaborative|autonomous
---
```

Setup always asks the user how completed items should be retained, the
repository's documentation conventions (foundation layout, naming, and
contract-truth ownership), and whether to establish or extend
`docs/PRINCIPLES.md` — from derived candidates, the core suggested invariants
(contract truth ownership, compatibility is earned), and, when bootstrapping,
optional code-design principle candidates; it also aligns
repository-specific conventions, including review weight and autonomy. It may recommend
conventions from repository evidence, including parking useful out-of-scope
findings and behavior-focused testing, but writes no new convention without
confirmation. A missing `review_weight` resolves to `standard`; missing
`autonomy` resolves to `adaptive`.

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

The first non-empty active-item body line is a Markdown title. At least one
non-empty content line follows it. Each active item communicates its outcome,
scope, and observable acceptance evidence, but the headings may fit the work.

Focused audits, cleanup, and refactors use tags rather than new item kinds.
Prototype items use the `prototype` tag. They name the question, representative
surface, evidence, and expected disposition: discard, revise, or adopt. Closure
records what was learned, carries material learning into the affected
foundation or active item, and removes code marked for discard. Revision or
adoption is an explicit next outcome.

## Completion

Completed work never remains active.

- `completed_items: summarize` replaces an active item with a compact
  `.work/completed/<id>.md` outcome stub.
- `completed_items: discard` removes the active item after verification.

Before closure, active children are completed. Remaining relationships and
matching sequencing entries are reconciled in the same edit. `release` may
collapse selected completion stubs into one `.work/releases/<version>.md`; it
does not tag, publish, or deploy.

## Design behavior

Design reasoning is always required. Before formal design, `ideate` is preferred
when initial exploration of substantial, cross-cutting, or early-stage work
could materially change what should be designed, unless the user explicitly
requests direct design. Size alone does not decide the route. Repository evidence and brief reasoning
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
conditional overlays. Designs separate requirements, facts, assumptions, and
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
boundary. Every reviewer is instructed not to invent requirements or expand
scope, to flag overbuilding, and to judge against the rational expectations of
the actual project type. Missing or contradicted authorized requirements may be
blocking findings; adjacent improvements are non-blocking follow-ups and may be
parked. Only `thorough` and `maximum` repeat independent passes.

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

Verification targets stable interfaces and meaningful user journeys. A test
must protect enough behavior, contract, boundary, risk, or regression to justify
its maintenance cost. Review follows the effective weight, and findings are
verified before acceptance.

Verification reuses existing tests, fixtures, commands, environments,
observability, and benchmark machinery first. Small, cheap, contained evidence
may be added directly. A new or materially expanded test framework, simulation
platform, benchmark system, mock service, synthetic environment, or validation
architecture requires user discussion.

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
the user, maps useful truth to the canonical destinations, validates retained
content block by block, rewrites inbound references, and only then removes
superseded artifacts. Its canonical-layout reference owns the shared foundation
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
folders. A second run produces no material change.

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
additional context: read conventions and foundations first, route only concrete
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

`validate-workbench.py` checks ownership, canonical directories and clone-stable
markers, item schemas, globally unique ids, title and body presence, parent-kind
pairs, parent and sequencing cycles, relationship integrity, readiness state,
sequencing and blocker evidence, research and mock references, and superseded
substrate paths. Semantic tier fit and reason quality remain review judgments.

`lint-research.py` checks attestation metadata, sensitive markers, mandatory
attested-detail and disconfirming sections, and citation resolution. Reference
format and safety remain judgment rules in the research discipline.
`build-knowledge-index.py --check` rejects stale committed output.
