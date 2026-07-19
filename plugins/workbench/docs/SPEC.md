# Specification: Workbench

## Substrate ownership

`.work/CONVENTIONS.md` begins with:

```yaml
---
owner: workbench
schema: 1
release_mode: summarized|none
# Optional project overrides:
# interaction: collaborative|checkpointed|autonomous
# rigor: lean|standard|rigorous
# review: inline|fresh|cross-model|convergent
# capability: efficient|adaptive|maximum
# execution: cohesive|adaptive|parallel
# commits: delivery|checkpoint|granular
---
```

Workbench and agile-workflow use different `.work/` contracts and must not
operate on the same project simultaneously. A skill halts rather than guessing
when the ownership marker is absent or names another owner.

The six workflow keys are optional. Resolve each independently from explicit
user direction in the current prompt or active user-authored goal, then the
project convention, then Workbench's default: `checkpointed`, `standard`,
`fresh`, `adaptive`, `adaptive`, and `delivery`, respectively. Prompt overrides
apply only to that requested scope and are never written back unless the user
explicitly asks to change project defaults. Natural-language equivalents are
valid; explicit model names are narrower prompt overrides and do not belong in
project conventions.

## Layout

```text
.work/
├── CONVENTIONS.md
├── active/<id>.md
├── backlog/<id>.md
├── archive/<id>.md      # release_mode: summarized only
└── releases/<version>.md
.research/<id>.md         # grounded research artifacts
.mockups/<item-id>/         # interactive requirements walkthroughs
docs/PRINCIPLES.md          # optional project-owned engineering philosophy
.agents/skills/patterns/    # optional observed code-pattern catalog
```

`.research/` and `.mockups/` are separate artifact tiers, not work queues.
Research files preserve evidence and a reusable synthesis; work items point to
them through `research_refs`. UI walkthroughs may contain several HTML pages and
shared local assets; `index.html` is always the entry point shown to the user,
and work items point to them through `mock_refs`.

## Active item frontmatter

```yaml
---
id: onboarding-flow
kind: epic|feature|story|scan
status: active|blocked
tags: [ui, auth]
parent: account-experience|null
hard_dependencies: [session-contract]
soft_dependencies: [password-recovery]
research_refs: [.research/session-options.md]
mock_refs: [.mockups/onboarding-flow/index.html]
release: null
created: YYYY-MM-DD
updated: YYYY-MM-DD
---
```

`story` is the smallest durable outcome or concern worth tracking. It does not
imply a worker assignment, fixed size, lifecycle, or commit boundary; temporary
execution tasks remain in the item's `## Execution approach`.

Only `active` and `blocked` are valid active statuses. `research_refs` and
`mock_refs` are optional arrays and default to empty. Readiness is derived from
hard dependencies. Soft dependencies communicate useful ordering or shared
context but never mechanically block execution. Temporary agent-work units and
their dependencies belong in `## Execution approach`; they become separate
items only when independently durable tracking is useful.

The body has no mandatory section inventory. Common sections are Intent,
Requirements, Decisions and open questions, Design, Execution approach,
Progress and discoveries, Blocker, and Review. Keep detailed research in
`.research/` and UI walkthroughs in `.mockups/`; the item records their references
and the decisions they informed. Add only sections that carry useful state.

## Backlog items

Backlog files require only `id`, `created`, `updated`, and `tags`. Their bodies
preserve the useful amount of context supplied by the user without inventing a
design or active-work structure.

## Completion

`done` and `completed` are invalid resting statuses in `.work/active/`.
Completion is one atomic filesystem transition:

- `release_mode: summarized`: replace the active item with
  `.work/archive/<id>.md`, a small stub containing identity, relationships,
  completion date, and a one- or two-sentence outcome.
- `release_mode: none`: remove the active item.

The same transition applies to epics, features, tasks, and scans. Before and
after substantive work, sweep `.work/active/` for legacy or interrupted terminal
items, verify their completion evidence against the repository, and archive or
remove them. Never infer completion from a stale label alone.

A release selects eligible archive stubs, writes one
`.work/releases/<version>.md` summary, and removes the selected individual
stubs. The release summary is the retained substrate record; code, foundation
documents, and Git remain the durable technical record.

## Foundation documents

`docs/PRINCIPLES.md`, when present, is project-owned. Setup elicits it from
existing direction, repository evidence, and user-confirmed trade-offs;
Workbench does not install universal code-design doctrine. It contains
high-level engineering philosophy, while concrete recurring implementation
structures live in `.agents/skills/patterns/`.

Foundation documents are project-selective files such as `docs/VISION.md`,
`docs/ARCHITECTURE.md`, `docs/SPEC.md`, or `docs/CONTRACTS.md`. They may omit
implementation details and lesser capabilities. Every statement they do make
must describe current truth or clearly intended future truth.

Before completing affected work:

1. identify assertions changed or contradicted by the work;
2. update or remove those assertions in place;
3. keep only vision, direction, architectural boundaries, high-level design,
   and durable contracts;
4. remove historical narration and code-level implementation detail;
5. do not add documentation merely for completeness.

## Bug-fix evidence

Reported defects are reproduced before correction whenever possible. A stable
regression test should fail for the expected reason before the fix and pass
after it; when an automated test would be misleading or disproportionately
costly, preserve another repeatable before/after check and record why. Diagnose
root cause, avoid speculative changes for unreproduced reports, never weaken a
test to obtain green output, and run proportionate adjacent verification.

## Embedded maintenance

Substantial design includes an elimination, project-principle fit, existing
pattern fit, emerging recurrence, and adjacent behavior-preserving cleanup
pass. Cohesive cleanup may travel with the delivery; broader work is parked.
Behavior-changing opportunities remain normal features or stories.

Pattern harvesting is signal-driven at stable feature-sized, autonomous-scope,
or release boundaries. It begins from changed code and follows concrete
candidates into nearby consumers. Roughly three genuine occurrences are a
strong recurrence signal, not a loophole or fixed schedule. New and evolved
patterns update `.agents/skills/patterns/` in the same coherent delivery commit;
aesthetic inconsistency and churn-only conformity produce no work.

## Commit boundaries

With the default `commits: delivery`, use one coherent commit per feature-sized
delivery when the project permits agent commits. That commit may include
requirements/design updates, code, tests, foundation reconciliation, and the
active-item archive/removal. `checkpoint` retains meaningful design,
implementation, and integration boundaries; `granular` favors independently
reviewable or reversible units. Separate commits are never required merely by
item edits or status changes.

## Managed project instructions

Setup writes a short marked section to the canonical project `AGENTS.md`. It
contains substrate ownership and layout, the foundation-document invariant,
requirements-first behavior, completion/archive behavior, and pointers to
`.work/CONVENTIONS.md`. It preserves all content outside the markers.
