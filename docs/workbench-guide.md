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

**Expected result:** Workbench's skills are available to the agent. You
don't need to invoke them by name — natural language is the control
surface, and the agent routes from your intent and the repository state.

## Adopt a repository

Tell your agent:

> Set up Workbench in this repository.

`setup` works from any starting state — greenfield, ad-hoc notes, or an
existing workflow system — and converges the repo to one clean Workbench
state. It runs in four moves:

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
4. **Validate, then remove.** It runs the validator, then deletes what it
   migrated. It leaves no `.bak` copies, no migration archives, no legacy
   folders, and no parallel substrates.

Removals are classified before they happen. A clean tracked file is
recoverable from Git. Before removing anything modified, untracked,
ignored, or otherwise unrecoverable, `setup` requires either a pre-state
commit you make or your explicit confirmation of the exact removal list.
It removes project-scoped competing workflow plugins after their content
is converted, and reports any user- or machine-scoped competing installs
for you to uninstall.

### Three defaults you set during adoption

`setup` always asks about three defaults and records your confirmed
choices in `.work/CONVENTIONS.md`. You can change any of them later by
editing that file.

| Default | Choices | Recommendation |
|---|---|---|
| **`autonomy`** | `collaborative`, `adaptive`, `autonomous` | `adaptive` for most repos — ask about human-owned choices, decide routine reversible details |
| **`review_weight`** | `none`, `light`, `standard`, `thorough`, `maximum` | `standard` — one balanced independent review pass on substantive work |
| **`completed_items`** | `summarize`, `discard` | `summarize` if you want release summaries later; `discard` if Git history is enough (this turns off `release`) |

`setup` may also recommend broader conventions from repo evidence — for
example, parking useful out-of-scope findings instead of expanding scope,
or testing behavior at stable interfaces instead of coupling tests to
implementation details. It writes nothing binding without your answer.

**Expected result:** `.work/` exists with conventions recorded,
`AGENTS.md` carries the Workbench operating rules, and prior workflow
files are consolidated or removed. `setup` may omit `.research/` and
`.knowledge/` until the project has research worth retaining.

**If setup stops:** resolve the exact ambiguity or removal risk it
reports. Don't keep two active workflow substrates as a workaround.

## Make requests in plain language

You don't need to name a skill. Describe the outcome and the agent routes
from your intent and the repo state.

| You say | What happens |
|---|---|
| *"Help me think through this project"* | `ideate` — structured exploration that writes nothing until you pick a handoff |
| *"Implement the rate-limiting feature"* | `work` — scopes, designs if consequential, implements, verifies, reviews, closes |
| *"Drive the onboarding epic to done"* | `work` across the full epic boundary, not just the next item |
| *"Design this refactor with me"* | `design` in collaborative mode — options discussed before anything binds |
| *"Park this finding for later"* | `park` — smallest useful backlog item, then back to the work in progress |
| *"Research the prior art for this decision"* | `research` — fetched sources, per-source attestations, a grounded brief |
| *"Turn the confirmed findings into work"* | `research-handoff` — proposes items, creates only the ones you confirm |
| *"Prepare the v0.3 release summary"* | `release` — collapses completion stubs into one versioned summary |

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

1. **Read first.** The agent reads the repo, the conventions, and the
   epic before acting.
2. **Ask only what the repo can't answer.** It surfaces the consequential
   choices — product direction, irreversible actions, missing
   requirements — and decides routine details itself.
3. **Record only durable state.** Temporary agent tasks don't become
   ledger items; the ledger tracks outcomes, not process. Ordering edges explain
   why one item should finish first. Independent items remain available for
   parallel work.
4. **Route design when the shape is consequential.** If the
   implementation shape matters, it routes through `design` and picks the
   lens that fits: new work, refactor or cleanup, performance, defect or
   reliability, UI/UX, or data, migration, or integration. Obvious,
   local, reversible choices stay inline. Design is conditional routing,
   not a mandatory stage.
5. **Implement and verify.** It writes the code, verifies behavior at
   stable interfaces using your existing test machinery, and exercises
   meaningful user journeys.
6. **Review at the configured weight.** It applies the effective
   `review_weight` and adjudicates findings rather than accepting them
   blindly.
7. **Park out-of-scope findings.** If it uncovers something valuable but
   unrelated — say, an analytics cleanup — it offers to `park` it instead
   of silently expanding the work.
8. **Close the full boundary.** Every item in the epic completes,
   verified, with foundation docs reconciled if durable truth changed.

The durable record is ordinary Markdown. You can read or edit `.work/`
items directly; the agent keeps their structure valid.

## Steer autonomy and review depth

Two repo defaults shape how the agent works, and both are overridable per
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

**Review weight** controls independent review of consequential designs
and completed implementation:

- `none` — self-review and behavioral verification only.
- `light` — at most one focused independent pass when risk warrants.
- `standard` (the usual default) — one balanced independent pass for
  substantive work.
- `thorough` — review, correct, and verify until no confirmed material
  issue remains.
- `maximum` — thorough convergence with adversarial perspectives and more
  than one model when available.

Only `thorough` and `maximum` repeat independent passes. Two more things
to know about review:

- **Review is not verification.** A reviewer saying "looks good" does not
  prove behavior works. The agent treats the two as separate obligations.
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

## Cut a release summary

If your repo keeps `completed_items: summarize`, finished work leaves
compact outcome stubs in `.work/completed/`. When you are ready to bind a
version:

> Prepare the v0.3.0 release summary.

`release` verifies the eligible stubs, writes one
`.work/releases/<version>.md` summary, removes the stubs it used, and
runs repository-defined checks. That is all it does. It does not tag,
publish, deploy, or bump versions — your project's own release mechanism
owns those.

## Reference: the durable state

After adoption, the repo carries:

```
.work/
├── CONVENTIONS.md      # collaboration, review, verification, delivery rules
├── active/             # outcomes currently being delivered
├── backlog/            # useful context parked for later
├── completed/          # compact outcome stubs (if retained)
└── releases/           # versioned outcome summaries

.research/
├── CONVENTIONS.md      # evidence and privacy rules
├── attestations/       # what individual fetched sources support
├── briefs/             # grounded synthesis across sources
└── bibliography.yaml   # generated — don't edit by hand

.knowledge/index.json   # deterministic discovery metadata
.mockups/               # optional UI alignment artifacts
docs/                   # current or intended project truth
AGENTS.md               # canonical cross-agent instructions
```

Each layer has one job. Code and foundation docs are the technical truth.
Git is the history. `.work/` is the delivery state between them.
`.research/` is evidence. The knowledge index is discovery metadata with
no authority of its own.

## Recover from common stops

- **The agent offers setup instead of working.** Delivery skills require
  an adopted repo. Run `setup`, or say you're just exploring — `ideate`
  works before adoption.
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
- **A release summary says there's nothing to bind.** Your repo is
  probably `completed_items: discard` — stubs aren't retained, so
  `release` has no input. Switch to `summarize` in
  `.work/CONVENTIONS.md` if you want release summaries going forward.
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
