# Workbench Guide

Adopt Workbench in a repository, then drive real work through an agent in
ordinary conversation — while the decisions, evidence, and delivery state
stay recorded in your repo.

This is a how-to guide for humans collaborating with an agent on a project
that uses, or is about to adopt, Workbench. After reading it you can
install the plugin, adopt a repo, phrase requests, steer autonomy and
review depth, use research, park findings, and cut a release summary. The
full mental model lives in
[plugins/workbench/README.md](../plugins/workbench/README.md); this guide
is about doing the work.

## What you get from Workbench

Workbench turns plain language into the control surface for project work.
You describe the outcome; the agent learns the repo, asks about the
choices only you can settle, and drives the agreed scope to a verified
finish. While it works, four durable layers record what matters:

- **A working agreement** — `.work/CONVENTIONS.md` records how agents
  verify, review, deliver, and collaborate here.
- **A small ledger** — `.work/` tracks active outcomes and parked context
  so the next session does not depend on chat history.
- **An evidence layer** — `.research/` keeps externally fetched evidence
  separate from project decisions.
- **Focused capabilities** — ideation, design, delivery, parking,
  releases, and research engage when your request needs them.

You do not move cards through stages or design an orchestration topology.
You describe the outcome. The ordinary route is a small useful item, delivery,
verification and reconciliation, appropriate review, and closure. Before any
task requiring multiple sub-agents, the agent discovers
available models and aligns models and thinking levels with you in chat. This
includes scans, research, and sequential assignments without durable topology.
Your explicit choices or confirmed project preferences provide standing alignment. Otherwise the agent asks once about
the lineup before dispatch. Collaborative work waits for plan alignment.
Adaptive and autonomous work proceed with routine choices inside your granted
authority and aligned model/effort choices.

An adopted repository may record a concise, user-confirmed
`## Overbuilding calibration` in `.work/CONVENTIONS.md`: project context, likely
overbuilding, justified complexity, and reasons to revisit it. Every design and
review applies this lens, including loose requests, without importing other
Workbench mechanics. Setup establishes or reconciles it; ideate can propose a
confirmed refinement without turning exploration into an automatic write.

## Before you start

You need:

- a Git repository (Workbench records delivery state inside it);
- Claude Code, OpenAI Codex, or Pi;
- the plugin installed (next section);
- `ux-ui-design` if the project has user interfaces and you want mockup
  alignment in `.mockups/`.

Check who owns `.work/` before adopting. Workbench and `agile-workflow`
use mutually exclusive `.work/` schemas — do not run both as workflow
owners in one repository. Workbench's `setup` consolidates an existing
agile-workflow substrate into one clean state instead.

## Install Workbench

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

**Expected result:** Stateful Workbench skills are installed but inactive;
write-free `ideate` may still support exploration. Setup runs only after a
direct invocation or a natural-language statement that the user wants
Workbench initialized, adopted, migrated, upgraded, refreshed, or reconciled.
Repository detection, drift, or another skill's recommendation is not consent.

## Adopt a repository

Tell your agent:

> Set up Workbench in this repository.

`setup` works from any starting state — greenfield, ad-hoc notes, or an
existing workflow system — and converges the repo to one clean Workbench
state. It runs in four core moves, with a fifth continuation for greenfields:

1. **Inventory first.** It reads Git state, agent instructions, workflow
   config, ledgers, plans, research, indexes, foundation docs, CI, and
   scripts before touching anything.
2. **Propose a working agreement.** It recommends conventions grounded in the
   repository. Accept them together or adjust individual choices. Separate
   questions focus on consequential unresolved decisions, not every setting.
   Refresh shows meaningful changes without re-asking settled choices.
3. **Convert semantically.** Every source artifact gets exactly one
   disposition: retain, consolidate, move, or remove. References that
   point at removed sources are rewritten or removed first.
4. **Stamp, validate, then remove.** It stamps the exact loaded Workbench
   version once in conventions, runs the validator, then deletes what it
   migrated. It leaves no `.bak`
   copies, migration archives, legacy folders, or parallel substrates.
5. **Continue greenfields into ideation.** When no code or foundation yet
   establishes a coherent project direction, setup routes directly into
   `ideate`. That continuation reads setup's canonical foundation format and
   confirmed documentation choices before helping you shape the initial docs.
   For a software project, it also resolves or explicitly defers the durable
   engineering shape: stack, repository topology, dependency rules, runtime and
   deployment composition, contract and persistence authority, testing layers,
   generation policy, and engineering gates.

Removals are classified before they happen. A clean tracked file is
recoverable from Git. Before removing anything modified, untracked,
ignored, or otherwise unrecoverable, `setup` requires either a pre-state
commit you make or your explicit confirmation of the exact removal list.
It removes project-scoped competing workflow plugins after their content
is converted, and reports any user- or machine-scoped competing installs
for you to uninstall.

### Core defaults you set during adoption

The proposed agreement includes four core defaults and explains their practical
effect. You can approve them together, adjust a choice, or defer an unsettled
decision. Setup records confirmed choices in `.work/CONVENTIONS.md`.

| Default | Choices | Recommendation |
|---|---|---|
| **`autonomy`** | `collaborative`, `adaptive`, `autonomous` | `adaptive` for most repos — ask about human-owned choices, decide routine reversible details |
| **`review_weight`** | `none`, `light`, `standard`, `thorough`, `maximum` | `standard` — exactly one proportionate pass for each selected design target and completed integrated boundary; corrections are verified, not re-reviewed |
| **`simplification_posture`** | `hygiene`, `balanced`, `structural` | `balanced` — actively simplify the affected boundary without making unrelated cleanup part of delivery |
| **`completed_items`** | `summarize`, `discard` | `summarize` keeps temporary stubs that make the next release easier to draft; `discard` relies on Git history instead |

Optional execution posture, commit posture, evidence depth, release gates,
roadmap recognition, and the Claude compatibility projection stay visible in the
agreement. Opt in, decline, or defer; accepting a bundle approves only its
explicit choices. Missing execution or commit posture means adaptive behavior;
missing `evidence_depth` means `standard` verification, mockup inspection, and
pattern-harvest breadth. No field needs a separate
question merely to populate it. Destructive migration still follows its recovery
and exact-removal approval rules.

`setup` may also recommend broader conventions from repo evidence — for
example, parking useful out-of-scope findings instead of expanding scope,
testing behavior at stable interfaces, or resolving a repeated coding or module
boundary inconsistency. It inspects coding rules, structural foundations, tool
configuration, and project patterns, but asks no preference question without
concrete evidence. Confirmed rules go to their owning tool, `AGENTS.md`,
foundation, or canonical `.agents/skills/patterns/` catalog. Setup always
creates a valid empty pattern index, but writes no pattern references without an
evidence-backed maintenance outcome. It proactively offers root `CLAUDE.md` as
a relative symlink to canonical `AGENTS.md`. When `CLAUDE.md` exists, it
maintains `.claude/skills/patterns` as a relative symlink to the
canonical `.agents` catalog after preserving any divergent content.

**Expected result:** `.work/` exists with conventions recorded and stamped with
the loaded Workbench version,
`AGENTS.md` carries the Workbench operating rules, the canonical pattern index
exists, and prior workflow files are consolidated or removed. `setup` may omit
`.research/` and `.knowledge/` until the project has research worth retaining. In a greenfield
repository with no coherent direction yet, setup continues directly into
`ideate`; ideation uses setup's foundation-document contract and the
configuration you just confirmed, then offers the smallest useful initial
foundation set for your explicit write handoff.

The initial foundation set is not limited to product concepts. A small project
may keep its engineering shape in `ARCHITECTURE.md`; a larger repository may use
`ENGINEERING.md`, `TECHNICAL-FOUNDATION.md`, or a scope-owned equivalent. The
agent prefers compact trees, tables, and source-controlled diagrams when they
make topology or authority clearer than prose. Markdown with Mermaid is the
portable default, while repository-native diagram formats remain valid when a
Markdown foundation links and explains them.

**If setup stops:** resolve the exact ambiguity or removal risk it
reports. Don't keep two active workflow substrates as a workaround.

## Make Workbench requests in plain language

After adoption, you don't need to name a skill for concrete Workbench
workflows. Describe the tracked project outcome and the agent routes from your
intent and the repo state. Adoption does not make every request a Workbench
workflow: unrelated lookups, explanations, reviews, and other requests that do
not need its capabilities remain ordinary requests. Before adoption, `ideate`
may still provide write-free exploration; stateful Workbench skills remain
inactive unless you explicitly ask `setup` to adopt the repository.

| You say | What happens |
|---|---|
| *"Help me think through this project"* | `ideate` — structured exploration before or after adoption that writes nothing until you pick a handoff |
| *"Implement the rate-limiting outcome"* | `work` — scopes, designs if consequential, and owns the full requested boundary |
| *"Deliver the ready rate-limiting feature"* | `deliver` — implements, verifies, reviews, reconciles, and closes that one ready item |
| *"Drive the onboarding epic to done"* | `work` across the full epic boundary, not just the next item |
| *"Design this refactor with me"* | `design` in collaborative mode — options discussed before anything binds |
| *"Park this finding for later"* | `park` — smallest useful backlog item, then back to the work in progress |
| *"Run context scanner medium"* | `context-scan` — rates the current task's context and prepares eligible recovery for medium or higher findings |
| *"Research the prior art for this decision"* | `research` — fetched sources, per-source attestations, a grounded brief |
| *"Turn the confirmed findings into work"* | `research-handoff` — proposes items, creates only the ones you confirm |
| *"Prepare the v0.3 release summary"* | `release` — collapses completion stubs into one versioned summary |

### Check context before it obscures the work

Use `context-scan` or "run context scanner" for a one-time assessment by a
diagnostic sub-agent. Append `none`, `low`, `medium`, `high`, or `critical` to
choose the minimum finding severity for automatic remediation. Omission means
`high`; `none` gives a report and advice without starting remediation. Each
finding has its own rating, evidence, confidence, and suggested action.

Recovery may preserve continuation state or prepare a design handoff to divide
overloaded workstreams. Instruction rewrites are prepared only in a separate
branch and isolated checkout for review, never automatically applied. If that
isolation is unavailable, the agent reports the limitation and leaves rewriting
for an explicit request. Limited context visibility is disclosed; unavailable
delegation yields a labeled advisory assessment. See the
[context-scan skill](../plugins/workbench/skills/context-scan/SKILL.md) for details.

### Work versus deliver

Use `work` for an outcome that still needs scoping, requirements, design routing,
several implementation units, or wider integration. `work` remains responsible
for the complete boundary and uses `deliver`'s contract for ready implementation.
That is usually a continuation, not a context switch. Settled scope and decisions
carry forward without repeated readiness checks or permission questions.

Use `deliver` directly for one named active feature or story whose requirements
and implementation shape are ready. A feature or standalone story receives its
integrated review before closure, possibly shared with several other deliveries.
Pending shared review keeps that item active. A story nested under a feature is an
implementation slice: it closes after verification and leaves integrated review
to the owning feature. Under `work` orchestration, deliverers report shared
pattern implications and never close the parent boundary.

For example, a small fix may use one compact item, a local decision, implementation,
tests, and a focused inline review before closure. If a technical assumption changes,
the owner updates that decision and its dependent checks instead of restarting.
Changed product requirements still need your input. Another context remains useful
when its expertise or independent challenge earns the handoff cost; inline work
is not a blanket rule.

### Design contracts and optional specifications

The work item is the contract between design, review, and implementation.
The designer writes and revises the design directly in that item. The outcome
owner adjudicates scope and acceptance rather than rewriting the design for an
implementer. Reviewers remain read-only. Accepted design corrections reach the
item before dependent implementation, and dispatch points to the recorded contract.
Inline work follows the same rule without requiring separate agents.

Ordinary designs stay in the item. Dense contracts may use an optional Markdown
specification at `.work/attachments/<item-id>/contract.md`. The item links to it,
and implementers read it as part of the design. Use exact interfaces, transition
tables, error behavior, and examples where they remove consequential guessing.
Link existing executable schemas or interfaces rather than copying them.

Attachments are always deleted when their owning item completes, whether the
project discards completed items or keeps summaries. They are not archived or
moved into documentation as completed designs. Reconcile needed durable truth
and remaining references before deletion. Interrupted work retains its active
item and attachments. See the
[attachment contract](../plugins/workbench/skills/work/references/design-attachments.md)
for details.

### Pattern maintenance boundaries

Setup creates an empty project-pattern index so future agents share one
canonical destination. Ordinary feature delivery may repair a documented
pattern that became stale, but it does not add new patterns merely because one
implementation looks reusable.

During a multi-feature or multi-epic run, deliverers return useful candidate
evidence to the outcome owner. Required cleanup keeps the agreed outcome
correct and coherent. Recurrence may justify recommending pattern extraction,
but it does not authorize more work. Optional extraction requires your selected
outcome or an accepted scope that already includes it. An unanswered offer does
not delay closure. Independent follow-ups stay independent. You can also request
pattern detection or extraction directly as a bounded maintenance feature.

A few phrasing habits pay off:

- **Name the boundary.** "Drive epics A and B to done" tells the agent to
  continue through the whole scope, not stop after one feature.
- **State intent, not procedure.** "Finish the rate limiting" beats "now
  run the work skill."
- **Name exclusions when they matter.** The agent parks useful work
  outside the boundary instead of silently absorbing it.
- **Set participation in the request when it matters.** "Design this
  with me" is collaborative even in an autonomous repo. "Drive these
  epics to done" is autonomous inside that scope even when the default is
  adaptive. Your wording wins over the repo default.

Questions, explanations, and diagnoses are read-only unless you also ask
for changes.

## Your role in the loop

The agent is a collaborator inside the outcome and authority you set —
neither a passive ticket taker nor an unconstrained project owner.

Expect it to inspect the repository before asking questions it can answer
itself, to bring you the consequential choices, and to decide routine
reversible details on its own. Expect it to say so when evidence is weak,
rather than perform certainty.

What stays with you, always: product decisions, irreversible or
production actions, real-data migrations, external coordination, and
anything that materially expands the scope you gave. Autonomy settings
change how much the agent drives — never your permissions, the scope, or
the quality bar.

## Walkthrough: drive an epic to done

Suppose you ask: *"Drive the onboarding epic to done."*

Workbench uses features as the normal delivery unit. For item hierarchy,
splitting growing work, and completion cleanup, follow the
[lifecycle guidance](../plugins/workbench/skills/work/references/lifecycle.md).

1. **Read first.** The agent reads the repo, the conventions, and the epic
   before acting. If the stamped Workbench version differs from the loaded
   plugin, it recommends the appropriate update and setup reconciliation but
   continues unless it encounters a concrete incompatibility.
2. **Ask only what the repo can't answer.** It surfaces the consequential
   choices — product direction, irreversible actions, missing
   requirements — and decides routine details itself.
3. **Record only durable state.** Temporary agent tasks don't become
   ledger items; the ledger tracks outcomes, not process. Ordering edges explain
   why one item should finish first. Independent items remain available for
   parallel work.
4. **Explore before committing when it adds value.** Initial substantial or
   cross-cutting work routes through `ideate` when a short collaborative pass
   could materially improve what gets designed, unless you request direct
   design or execution. Large mechanical work with an established outcome can
   skip that preflight. If the implementation shape then matters, it routes
   through `design` and picks the
   lens that fits: new work, refactor or cleanup, performance, defect or
   reliability, UI/UX, or data, migration, or integration. Obvious,
   local, reversible choices stay inline. Design is conditional routing,
   not a mandatory stage. Separately align whether this run needs no design-review
   pass, review of selected decisions, or a broader design review. Reuse explicit
   direction or confirmed standing preferences rather than asking per feature.
5. **Explain durable topology when needed.** An epic or broad feature set may
   need shared execution state across integrations or sessions. The agent
   explains ownership, models and thinking levels, parallelism, review, and the
   next integration point. It reuses your explicit or project-confirmed model
   preferences, otherwise asks once about the lineup. Departures need alignment
   unless their fallback is already authorized. Collaborative work waits for
   plan alignment. Adaptive and autonomous work proceed with routine choices
   within that alignment. New material costs, changed isolation or data exposure,
   external actions, requirements, or scope still need authority. Many large
   boundaries need no topology.
6. **Deliver ready items.** Each ready feature or story routes through
   `deliver`. It reads relevant project patterns, writes only its owned surface,
   and verifies behavior at stable interfaces. Features and standalone stories
   may share an integrated review checkpoint and stay active until acceptance.
   Nested stories return evidence to their owning feature instead of duplicating review. Orchestrated deliverers report
   stale patterns and credible promotion candidates instead of editing the
   shared catalog.
7. **Integrate project truth.** The `work` outcome owner integrates the units,
   adjudicates any pattern updates, reconciles affected foundations, and keeps
   pattern changes evidence-based rather than turning delivery into a conformity
   sweep.
8. **Review at the configured weight.** It applies the effective
   `review_weight` and adjudicates findings rather than accepting them
   blindly. Review uses a stable commit range or a clearly bounded working-tree
   diff according to the effective commit posture.
9. **Shape history safely.** Commit boundaries represent meaningful changes,
   not ledger transitions. Feature squashing is advisory and happens only when
   the selected posture favors it and the history is exclusively owned and safe
   to rewrite.
10. **Park out-of-scope findings.** If it uncovers something valuable but
    unrelated — say, an analytics cleanup — it offers to `park` it instead
    of silently expanding the work.
11. **Close the full boundary.** Every item in the epic completes,
    verified, with foundation docs reconciled if durable truth changed.

The durable record is ordinary Markdown. You can read or edit `.work/`
items directly; the agent keeps their structure valid.

## Steer autonomy, simplification, and review depth

Three repo defaults shape how the agent works, and each is overridable per
request.

**Autonomy** controls participation and continuation:

- `collaborative` — discuss ideal and appropriately scoped options before
  consequential decisions bind.
- `adaptive` (the usual default) — ask about human-owned choices; decide
  routine reversible details.
- `autonomous` — drive the authorized outcome to completion, choosing the
  strongest maintainable solution inside it.

Autonomy never expands scope, permissions, safety boundaries, or quality
obligations. Every posture still pauses for missing product direction,
material scope expansion, production or real-data actions, irreversible
changes, and external coordination.

**Simplification posture** controls how proactively design, implementation, and
review pursue behavior-preserving reduction:

- `hygiene` — keep the touched area clean and catch obvious accidental
  complexity or algorithmic overwork;
- `balanced` — actively simplify across the affected contract boundary;
- `structural` — challenge the full authorized outcome boundary and permit
  cohesive file breakouts, consolidation, or substantial restructuring.

Every posture preserves behavior and measured performance constraints and
avoids obvious plausible performance regressions. It does not authorize
unrelated cleanup or speculative low-level optimization.

**Review weight** controls the depth of selected design reviews and completed
implementation reviews inside concrete Workbench workflows. It does not require
a design-review pass or determine how many features share a review. Execution posture determines
whether the review stays inline or uses a separate context. It does not
control general reviews, audits, planning discussions, explanations, or loose
requests merely because they happen in the same repository:

- `none` — self-review and behavioral verification only.
- `light` — at most one focused pass when risk warrants.
- `standard` (the usual default) — exactly one proportionate pass for each
  selected design target and completed integrated boundary. Correct, verify, and
  self-review findings without another distinct pass.
- `thorough` — review, correct, and verify until no unresolved blocking finding
  remains. The owner may revise, reject, or park material non-blocking findings.
- `maximum` — converge until no unresolved material or blocking finding remains,
  with adversarial perspectives and model diversity when execution preferences
  permit and suitable models are available.

**Review boundaries are adaptive.** Small implementation units can share a larger
review-and-fix pass. The agent groups coherent work when shared context and
integration visibility outweigh delayed feedback. It chooses earlier checkpoints
when consequence, uncertainty, or context limits make a large pass less useful.
Each delivery still receives prompt verification. Features and standalone stories
remain active until their shared review, corrections, and acceptance are complete.
A shared pass replaces per-feature passes rather than adding to them.

You can state a preference in conventions prose or for one run:

> Implement in small deliveries, review related features together, and skip a
> separate design review this run unless new evidence warrants discussing it.

Design review is independently optional. Agree once on no separate pass, focused
decisions, or a broader review, then revisit only material changes. Related feature
decisions can share a selected design review before expensive dependent work.
These preferences need no new configuration fields or batch records.

Review weight controls pass depth and repetition; simplification posture
controls the simplification emphasis within each pass. Only `thorough` and
`maximum` repeat distinct passes unless you explicitly request otherwise.
A short inline review can satisfy a pass without claiming independence. Effort
and reporting follow the risk: what was checked, actionable findings, and material
evidence limits, not a required form. Other things to know:

- **Review is not verification.** A reviewer saying "looks good" does not
  prove behavior works. The agent treats the two as separate obligations.
- **Review cannot expand scope.** Reviewers check the user's original intent,
  accepted design, and applicable foundation truth. They do not invent
  requirements, impose their preferred ideal architecture, or turn adjacent
  improvements into acceptance blockers. They also flag overbuilding relative
  to the project's actual type and risks.
- **Refactor work gets a structural-hygiene lens.** At `standard` weight and
  above, refactor and cleanup items — and any change that reshapes
  decomposition — are also judged on structure, conditionals, and breakout
  quality, calibrated against the codebase's own conventions and language
  idioms rather than fixed thresholds.
- **Requested independence stays explicit.** If you request an independent or
  cross-model reviewer and none is reachable, the agent asks how to proceed.
  Review weight alone does not require delegation.

## Use research for external evidence

Commission research when a decision depends on evidence outside the repo
— prior art, current libraries or standards, unfamiliar domains,
contested questions. Reading your own code is project context, not
research.

Ask in natural language: *"Research the prior art for this architecture
decision, and look for evidence against the leading option."*

You get back two durable artifacts in `.research/`:

- **Attestations** — per-source records of what the agent actually
  fetched and what each source supports. The agent creates an attestation
  *before* it cites the source. Model memory never becomes a citation.
- **A brief** — synthesis across sources that separates evidence from
  inference, includes disconfirming evidence, and preserves
  contradictions instead of averaging them away.

Both survive the conversation, and you can trace every cited detail from
a brief back to an attestation and a fetched source. Research is never
rewritten to agree with a later product decision, and a project decision
is never presented as if an external source established it.

The research conventions name the provider that owns `.research/`. The bundled
provider also offers a verification-rigor dial independent from investigation
size: `floor` applies grounding and deterministic checks, `standard` adds a
semantic source-support pass, `full` adds an isolated check for coverage and
framing drift, and `adaptive` chooses proportionately. An alternate owner may
define its own artifacts and gates; Workbench does not run the bundled tools
over that provider's substrate.

### From research to work

Research does not silently create work. The `research-handoff` skill
reads a selected brief, proposes concrete Workbench items, and creates
only the ones you confirm. The original research stays unchanged.

### When to commit research, and what to keep out

Commit research when the evidence will influence a consequential
decision, needs to survive the session, or should be inspectable later.
Small conversational lookups don't need a committed brief.

Workbench never fetches, attests, synthesizes, or indexes PII, PHI,
credentials, session material, or other prohibited sensitive data. Narrow
or redact the source, or use an approved non-LLM process instead.

## Scan for opportunities

Ask naturally for a bounded investigation:

> Look for compatibility risks in the plugin install flow.

> Investigate our test architecture and propose the highest-value improvements.

> Scan deployment recovery for problems worth addressing.

Before substantial inspection, `scan` reflects its proposed goal, boundary,
result shape, constraints, and threshold for a material finding. It asks you to
settle any consequential part the request left open; a broad “scan the
repository” request does not silently become a general-purpose campaign. When
your request already settles the brief, it states that interpretation compactly
and proceeds.

`scan` then chooses relevant evidence, hypothesis, drift, evaluation, or
provocation lenses from the confirmed question and project. A focused concern
stays inline; complementary concerns may use a few fresh-context scanners; a
broad campaign is decomposed and confirmed with you before any fan-out or
scope expansion beyond the brief. What it finds is checked against your
backlog and prior scan items, so something already tracked is identified as
such instead of presented as new. Material claims are verified and related
findings are clustered into coherent opportunities rather than emitted as one
warning per location. An evaluation can also report verified strengths; those
need no disposition.

The result appears in conversation first. You decide what to discard,
investigate further, park, activate through work/design, or accept in a
location or authority your project has designated for such decisions. Only
selected product-level outcomes enter the backlog or active work. Scanning
does not implement fixes or start remediation merely because it found
something.

## Cut a release summary

When you are ready to bind completed outcomes to a version:

> Prepare the v0.3.0 release summary.

`release` uses verified completion stubs when present and ordinary Git history
when items were discarded. It asks only when the included outcomes are unclear,
writes one `.work/releases/<version>.md` summary, runs repository-defined checks,
and removes every completed outcome file. It preserves the canonical `.gitkeep`
files. It does not tag, publish, deploy, or bump versions — your project's own
release mechanism owns those.

Projects that need explicit release expectations can opt into `release_gates`
in `.work/CONVENTIONS.md`:

```yaml
release_gates:
  - compatibility
  - test-quality
```

Each name selects a scan lens. By default, a project defines what that gate
means as a short `### <gate-name>` stance in the conventions body. If a
project-specific lens is reused or needs enough detailed method and references
that conventions would become unwieldy, Workbench can create a reusable
`.agents/skills/scan-<gate-name>/SKILL.md` only after you explicitly approve it.
Workbench also ships adaptable starting lenses. Release applies each configured
lens to the completed outcome
boundary and asks you to disposition verified material findings. Only unresolved
findings that materially violate the project's stated expectation block release
completion. Ambient improvements can be discarded, investigated, or parked.
Unavailable preferred tooling falls back to another credible inspection path or
an explicit evidence limitation rather than failing solely because a tool is
missing.

## Reference: the durable state

After adoption, the repo carries:

```
.work/
├── CONVENTIONS.md      # collaboration, review, verification, delivery rules
├── active/             # outcomes currently being delivered
├── backlog/            # useful context parked for later
├── completed/          # temporary outcome stubs before release, when retained
└── releases/           # versioned outcome summaries

.research/
├── CONVENTIONS.md      # evidence and privacy rules
├── attestations/       # what individual fetched sources support
├── briefs/             # grounded synthesis across sources
└── bibliography.yaml   # generated — don't edit by hand

.knowledge/
├── index.json           # deterministic discovery metadata
└── index-exclusions.txt # optional tracked path-prefix exclusions
.mockups/               # optional UI alignment artifacts
.agents/skills/patterns/ # canonical index; references grow from evidence
.agents/skills/scan-*/   # optional user-confirmed project scan lenses
docs/                   # current or intended project truth
AGENTS.md               # canonical cross-agent instructions
```

Each layer has one job. Code owns executable and structural truth. Foundation
docs hold durable repository or sub-project purpose, boundaries, principles,
architecture, engineering shape, observable behavior, and guarantees. They do
not track item status, implementation plans, qualification procedures,
receipts, or evidence; `.work/` items are that detailed work record. A larger
project may use
`docs/ROADMAP.md` as an optional, user-owned planning document for its
longer-horizon view. Its structure, metadata, and narrative are up to you; a
small, dense set of `.work/backlog/` links is the recommended standard when it
fits, not a requirement. Agents still determine operational state from `.work/`
and do not rewrite roadmap content incidentally. Setup may offer Workbench
recognition of this convention, but creates or adopts it only after your
explicit approval and never by default. Git is the history, `.research/` is
external evidence, and the knowledge index is discovery metadata with no
authority of its own. If local companion checkouts, generated documentation, or
another irrelevant tree would make that index noisy or clone-dependent, agents
may record repository-relative prefixes in
`.knowledge/index-exclusions.txt`. They should decide from repository context,
not directory names, and should not exclude intended documentation to hide an
indexing error.

## Recover from common issues

- **The stamped Workbench version differs from the loaded plugin.** The agent
  should mention the appropriate update and setup reconciliation once, then
  continue. Version drift is advisory; only a concrete schema or capability
  incompatibility blocks the requested work.
- **The agent creates Workbench state before adoption.** That is incorrect.
  Without `.work/CONVENTIONS.md` declaring `owner: workbench`, only write-free
  `ideate` may run; stateful skills remain inactive unless you explicitly ask
  `setup` to adopt the repository.
- **The agent keeps asking questions you consider obvious.** Your request
  implied a more collaborative posture than you want. Say "drive this to
  done autonomously" — the request wins over the repo default.
- **The agent reviewed inline.** This is valid under inline or adaptive execution
  when it deliberately inspected the result and verified behavior. It must not
  claim independent review. Ask for a fresh-context reviewer when that challenge
  matters; you do not need to change review weight to choose who reviews.
- **Scope grew past what you asked.** Material scope expansion should
  come back to you as a question or a parked item. Say "park everything
  outside the original request and show me what changed."
- **Setup found another `.work/` owner.** Choose conversion through
  `setup`. Don't let Workbench and `agile-workflow` write to the same
  substrate.
- **Release cannot identify the completed outcomes clearly.** Show it which
  outcomes belong in this version. Workbench uses stubs when available and Git
  history otherwise, but it does not guess through material ambiguity.
- **A doc in `docs/` contradicts the code.** Say so. Reconciling durable
  truth is part of delivery, not a separate chore.

## Tips

- **Describe outcomes, not workflow steps.** Workbench adapts internally. You
  can correct its execution model or request approval before it starts, without
  designing the workflow yourself.
- **Use `park` liberally.** Capturing a finding costs one small backlog
  item and keeps the current scope clean.
- **Ask diagnostic questions freely.** "What's in flight?", "why is this
  blocked?", "what did the research say about X?" — answered from the
  ledger and evidence layers, with no report file created unless you ask
  for one.
- **Let design stay conditional.** Consequential implementation shapes
  deserve dedicated design; obvious, local, reversible work is faster
  inline.
- **Keep foundations honest.** If a doc in `docs/` contradicts the code,
  say so — reconciling durable truth is part of delivery.
- **Treat research as evidence, not ammunition.** A good brief includes
  the disconfirming parts. Decide against it if you like — just don't ask
  the agent to rewrite it to match the decision.

## Where to read more

- [plugins/workbench/README.md](../plugins/workbench/README.md) — the
  full mental model: autonomy, review weights, design lenses, testing,
  and the research discipline in depth
- [plugins/workbench/docs/VISION.md](../plugins/workbench/docs/VISION.md)
  — what Workbench is and why it exists
- [plugins/workbench/docs/SPEC.md](../plugins/workbench/docs/SPEC.md) —
  item schema, lifecycle, and authority boundaries
- [agile-workflow-guide.md](agile-workflow-guide.md) — the
  maintenance-mode alternative, and what `setup` consolidates
- [ux-ui-design-guide.md](ux-ui-design-guide.md) — mockup-first UI
  alignment in `.mockups/`
