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

You do not move cards through stages or pick an orchestration topology.
You describe the outcome; the agent routes internally.

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
2. **Align conventions with you.** It asks one consequential decision at
   a time. For every recommendation it shows the evidence, risk, proposed
   rule, and why it is the recommended choice — never a generic
   checklist.
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

Removals are classified before they happen. A clean tracked file is
recoverable from Git. Before removing anything modified, untracked,
ignored, or otherwise unrecoverable, `setup` requires either a pre-state
commit you make or your explicit confirmation of the exact removal list.
It removes project-scoped competing workflow plugins after their content
is converted, and reports any user- or machine-scoped competing installs
for you to uninstall.

### Core defaults you set during adoption

`setup` always asks about four core defaults and records your confirmed choices
in `.work/CONVENTIONS.md`. You can change any of them later by editing that
file.

| Default | Choices | Recommendation |
|---|---|---|
| **`autonomy`** | `collaborative`, `adaptive`, `autonomous` | `adaptive` for most repos — ask about human-owned choices, decide routine reversible details |
| **`review_weight`** | `none`, `light`, `standard`, `thorough`, `maximum` | `standard` — exactly one balanced independent pass for each substantive design and completed integrated boundary; corrections are verified, not re-reviewed |
| **`simplification_posture`** | `hygiene`, `balanced`, `structural` | `balanced` — actively simplify the affected boundary without making unrelated cleanup part of delivery |
| **`completed_items`** | `summarize`, `discard` | `summarize` keeps temporary stubs that make the next release easier to draft; `discard` relies on Git history instead |

Commit granularity is an optional, evidence-led convention. When repository
history, merge policy, shared-agent practice, or an existing preference makes
it consequential, setup may offer `commit_posture`: `adaptive`, `feature`,
`checkpoint`, `batch`, or `preserve`. Missing configuration means adaptive;
Workbench does not ask merely to populate the field.

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
| *"Research the prior art for this decision"* | `research` — fetched sources, per-source attestations, a grounded brief |
| *"Turn the confirmed findings into work"* | `research-handoff` — proposes items, creates only the ones you confirm |
| *"Prepare the v0.3 release summary"* | `release` — collapses completion stubs into one versioned summary |

### Work versus deliver

Use `work` for an outcome that still needs scoping, requirements, design routing,
several implementation units, or wider integration. `work` remains responsible
for the complete boundary and assigns each ready feature or story to `deliver`.

Use `deliver` directly for one named active feature or story whose requirements
and implementation shape are ready. A feature or standalone story receives its
integrated review before closure. A story nested under a feature is an
implementation slice: it closes after verification and leaves integrated review
to the owning feature. Under `work` orchestration, deliverers report shared
pattern implications and never close the parent boundary.

### Pattern maintenance boundaries

Setup creates an empty project-pattern index so future agents share one
canonical destination. Ordinary feature delivery may repair a documented
pattern that became stale, but it does not add new patterns merely because one
implementation looks reusable.

During a large multi-feature or multi-epic `work` run, deliverers return concrete
candidate evidence to the outcome owner. At an explicit integration or planning
boundary, `work` decides whether enough real recurrence exists. When it does,
`work` creates a normal pattern/refactor/cleanup feature at the valid hierarchy
level and sends it through `deliver` before closing the wider boundary. No fixed
number of features or periodic cadence triggers this pass. You can also request
pattern detection or extraction directly, which creates the same bounded
maintenance feature without waiting for a larger run.

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

Workbench does not treat every large request as an epic. A feature is the
normal delivery and review unit. An epic groups at least two meaningful feature
outcomes. A story is a narrow verifiable slice. Features and stories can stand
alone, while nested work follows `epic → feature → story`.

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
   not a mandatory stage.
5. **Deliver ready items.** Each ready feature or story routes through
   `deliver`. It reads relevant project patterns, writes only its owned surface,
   and verifies behavior at stable interfaces. Features and standalone stories
   receive integrated item review. Nested stories return evidence to their
   owning feature instead of duplicating review. Orchestrated deliverers report
   stale patterns and credible promotion candidates instead of editing the
   shared catalog.
6. **Integrate project truth.** The `work` outcome owner integrates the units,
   adjudicates any pattern updates, reconciles affected foundations, and keeps
   pattern changes evidence-based rather than turning delivery into a conformity
   sweep.
7. **Review at the configured weight.** It applies the effective
   `review_weight` and adjudicates findings rather than accepting them
   blindly. Review uses a stable commit range or a clearly bounded working-tree
   diff according to the effective commit posture.
8. **Shape history safely.** Commit boundaries represent meaningful changes,
   not ledger transitions. Feature squashing is advisory and happens only when
   the selected posture favors it and the history is exclusively owned and safe
   to rewrite.
9. **Park out-of-scope findings.** If it uncovers something valuable but
   unrelated — say, an analytics cleanup — it offers to `park` it instead
   of silently expanding the work.
10. **Close the full boundary.** Every item in the epic completes,
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

**Review weight** controls independent review of consequential designs
and completed implementation inside concrete Workbench workflows. It does not
control general reviews, audits, planning discussions, explanations, or loose
requests merely because they happen in the same repository:

- `none` — self-review and behavioral verification only.
- `light` — at most one focused independent pass when risk warrants.
- `standard` (the usual default) — one balanced independent pass for
  substantive work.
- `thorough` — review, correct, and verify until no confirmed material
  issue remains.
- `maximum` — thorough convergence with adversarial perspectives and more
  than one model when available.

Review weight controls pass depth and repetition; simplification posture
controls the simplification emphasis within each pass. Only `thorough` and
`maximum` repeat independent passes. Two more things
to know about review:

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
- **Missing reviewers get disclosed.** When the configured weight needs
  an independent reviewer and none is reachable, the agent says so and
  asks how to proceed — it does not quietly approve its own work.

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
docs hold high-level repository or sub-project purpose, boundaries, principles,
architecture, observable behavior, and guarantees. They do not track item
status, implementation plans, qualification procedures, receipts, or evidence;
`.work/` items are that detailed work record. A larger project may use
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
- **The agent approved its own work.** That shouldn't happen silently at
  `standard` weight or above — it should have disclosed the missing
  independent reviewer. Ask it to get a fresh-context review, or lower
  the weight deliberately for this request.
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

- **Describe outcomes, not workflow steps.** Workbench adapts internally;
  you never pick stages or topology.
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
