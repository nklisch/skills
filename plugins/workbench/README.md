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
- keep source evidence, agent inference, and project decisions distinct;
- leave one clean project state that another person or agent can understand.

## The mental model

Think of Workbench as four things:

1. **A working agreement** — project conventions say how agents should verify,
   review, deliver, research, and collaborate.
2. **A small durable memory** — `.work/` records active outcomes and useful
   deferred context so the next session does not depend on chat history.
3. **An evidence layer** — `.research/` keeps fetched external evidence and
   grounded synthesis separate from project decisions.
4. **A set of focused capabilities** — ideation, design, delivery, parking,
   release summaries, research, and research handoff are available when the
   request needs them.

Natural language remains the control surface. You do not move cards through
stages or decide how agents should coordinate before asking for work.

Delivery skills — `work`, `design`, `park`, and `release` — require the
repository to adopt Workbench through `setup`. Until then they stop and offer
setup rather than creating a competing workflow. `ideate` works before
adoption, so you can think a project through first and decide afterward whether
to adopt anything.

```text
Uncertain or coupled decisions ─→ ideate ─→ chosen handoff
Clear, coherent outcome ─────────────────────────→ work
Consequential implementation shape ─→ design ─→ work
work ─→ verify ─→ review ─→ close

Useful but out of scope ──→ park
Completed outcomes ───────→ release
External evidence needed ─→ research ─→ confirmed handoff
```

Design reasoning always happens. The dedicated `design` skill is used when the
implementation shape is consequential; obvious, local, reversible choices stay
inside normal delivery. Research is used when a decision depends on evidence
outside the repository, not simply because the agent needs to read the code.

Ideation is based on decision uncertainty, not project size. A large, coherent
initiative can move directly through `work`; a smaller request may need
`ideate` when several connected product, domain, or business decisions still
shape what should be built. For broad uncertainty, the agent surveys the open
decisions before examining the most consequential one in depth.

## What a session looks like

Suppose you ask, “Drive the onboarding epic to done.”

The agent reads the repository, Workbench conventions, and the epic before
acting. It asks only for consequential choices the repository cannot answer,
routes through design if the implementation shape warrants it, and then
implements, verifies, reviews, and closes the full requested boundary. If it
finds a worthwhile analytics cleanup that is unrelated to onboarding, it offers
to park that finding rather than silently expanding the work.

The durable record remains ordinary Markdown. You can read or edit it directly;
the agent is responsible for keeping its structure valid.

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
└── index.json           # deterministic discovery metadata

.mockups/                # optional UI alignment artifacts
docs/                    # current or intended project truth
AGENTS.md                # canonical cross-agent instructions
```

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
reduces rework, ambiguity, or integration risk. Each edge records that reason
in `## Sequencing`. Independent items stay edge-free so agents can run them in
parallel. `related_to` preserves useful context without controlling readiness.

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

Workbench validators check structure, relationships, citations, and generated
state whenever agents create or reshape the corresponding artifacts.

`setup` asks you for the repository's defaults — autonomy, review weight, what
happens to finished items, and your documentation conventions (where foundation
documents live, how they are named, and whether contract truth lives in code or
documents) — and records them where they belong, mostly `.work/CONVENTIONS.md`,
where you can change them later. It also asks whether to establish or extend
`docs/PRINCIPLES.md` — recommending two core invariants (contract truth
ownership, compatibility is earned), offering optional code-design principles
when bootstrapping, and adding anything it derives from the repository itself. For finished items:

- `summarize` keeps a compact outcome stub, which can later feed a release
  summary;
- `discard` removes the item after verification. Release summaries need
  retained stubs, so this option turns off `release`.

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

Questions, explanations, diagnoses, and reviews are read-only unless you also
ask the agent to make changes.

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
and leaves a maintainable intended state.

Formal design is not determined by an item's size label. Small and modest work
usually stays inline when repository evidence and brief reasoning can resolve
the choices confidently. The dedicated skill earns its cost when discovery,
alternatives, interface boundaries, or consequential trade-offs need to be
settled before implementation. When available, Workbench prefers a dedicated
fresh-context design agent and a reviewer from another model family, while the
orchestrator retains responsibility for the final choice.

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

## Review depth

One `review_weight` controls independent review of both consequential designs
and completed implementation. An independent pass means another agent reviews
the artifact without relying on the conversation that produced it.

| Weight | Expected review |
|---|---|
| `none` | Self-review and behavioral verification only. |
| `light` | At most one focused independent pass when risk warrants it. |
| `standard` | One balanced independent pass for substantive work. This is the default. |
| `thorough` | Review, correct, and verify repeatedly until no confirmed material issue remains. |
| `maximum` | Thorough convergence using different specialties, adversarial perspectives, and more than one model when available. |

Review is not verification. A reviewer saying “looks good” does not prove the
behavior works. When the selected weight requires an independent reviewer and
none is available, the agent should disclose that limitation and ask how you
want to proceed rather than quietly approving its own work.

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
| [`ideate`](skills/ideate/SKILL.md) | The outcome is unclear or several coupled human-owned decisions prevent reliable scoping. |
| [`design`](skills/design/SKILL.md) | Implementation shape is consequential or you explicitly want a technical design. |
| [`work`](skills/work/SKILL.md) | Scoping or delivering a clear outcome, feature, epic, or group of epics. |
| [`park`](skills/park/SKILL.md) | Preserving a useful finding without expanding current work. |
| [`release`](skills/release/SKILL.md) | Collapsing retained completion stubs into a concise version summary. It does not tag, publish, or deploy. |
| [`research`](skills/research/SKILL.md) | Investigating an external, unstable, unfamiliar, contested, or decision-relevant question. |
| [`research-handoff`](skills/research-handoff/SKILL.md) | Turning selected research findings into proposed Workbench outcomes. |

You can invoke a skill explicitly, but normal requests should not require you to
know which one is appropriate. The agent routes based on your intent and the
repository state.

## Session posture hook

The plugin ships one lightweight `SessionStart` hook. In a Workbench-owned
repository it injects a short, static reminder of high-level posture — read
conventions and foundations first, keep scope narrow, orchestrate multi-unit
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

Then ask:

- “Set up Workbench in this repository.”
- “Help me think through this project.”
- “Design this refactor with me.”
- “Implement this feature.”
- “Drive the onboarding epics to done.”
- “Park this finding for later.”
- “Research the prior art for this decision.”
- “Turn the confirmed findings in this brief into proposed Workbench items.”

`setup` rewrites the repository into one clean state, and that includes deleting
files it has migrated. It does not leave `.bak` copies or a legacy folder.
Anything clean and tracked is recoverable from Git. Before removing anything
modified, untracked, ignored, or otherwise unrecoverable, it asks you to create
a pre-state commit or shows you the exact removal list for confirmation.

Re-running `setup` on a repository that already uses Workbench is an upgrade
and sync pass: it detects drift from the current plugin version — conventions
questions a newer version asks that the repository never settled, missing
fields, superseded layout — and reconciles it without re-asking choices you
already made.

Workbench and `agile-workflow` use mutually exclusive `.work/` schemas. Use
`setup` to convert rather than running both systems in the same project.
