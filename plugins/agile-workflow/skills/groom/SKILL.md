---
name: groom
description: >
  Backlog hygiene sweep for the agile-workflow substrate. Use when the user asks to groom the
  backlog, audit backlog hygiene, find stale/dead/duplicate/superseded backlog items, or clean up
  .work/backlog/. Triggers on "groom the backlog", "backlog hygiene", "find stale items", "what's
  dead in the backlog", "any duplicates in the backlog". Reads .work/backlog/, classifies items
  (DONE / SUPERSEDED / DUPLICATE / STALE / MERGEABLE / VALID) from date/metadata signals plus a
  grounded semantic pass, and writes a triage REPORT of proposals. Propose-not-prune: it never
  auto-archives, merges, or deletes — every disposition is operator-confirmed per finding, and dead
  items route through the project's terminal-tier retention convention. Opt-in and inert when not
  invoked; the staleness face is additionally inert unless backlog_staleness_days is configured.
---

# Groom

You audit the project's `.work/backlog/` tier for hygiene problems and produce a **triage report
of proposals** — never silent mutation. Backlogs accrete entropy: items finish elsewhere, later
work supersedes them, duplicates pile up, and parked ideas go stale. Grooming surfaces that for a
human; it does not prune on its own.

This is a **user-invocable sweep, not a release gate.** The backlog has no release binding, so
grooming is not part of `gates_for_release` / `release-deploy`. It borrows the gates'
item-producer discipline (produce findings, never mutate silently) and is structured like `park` /
`scope` (operates on `.work/`, verifies substrate first).

## When to invoke

Auto-trigger on hygiene phrases: "groom the backlog", "backlog hygiene", "audit the backlog",
"find stale / dead / duplicate / superseded items", "what's dead in the backlog", "clean up the
backlog". If the user wants to *add* an idea, that is `park`; if they want to *promote* one, that
is `scope`. Groom is for auditing what is already parked.

## Core discipline (load-bearing)

- **Propose-not-prune.** Every non-VALID classification is a *proposal*. You write a report; you
  apply a disposition only after explicit per-finding operator confirmation. Archive / merge /
  delete are never automatic.
- **Ground every claim.** Mechanical findings name the signal that fired (age, missing field, a
  cited id that is now `done`). Semantic findings (DUPLICATE / SUPERSEDED / MERGEABLE) must quote
  the overlapping text from both items — no classification without a citation. Uncertain → propose
  as a question, never assert. This is the anti-fabrication floor: do not claim "superseded"
  without the grounding a reader could check.
- **Inherit disposition; don't re-decide it.** Confirmed DONE / SUPERSEDED items are disposed
  through the project's **terminal-tier retention** convention (read it from
  `.work/CONVENTIONS.md`), not a policy this skill invents.
- **No imposed cadence.** Groom runs when invoked. A deployment may schedule a recurring sweep,
  but the skill neither assumes nor requires continuous operation.

## Workflow

### Phase 1: Verify substrate

Confirm `.work/CONVENTIONS.md` exists in the project (walk up from CWD). If not, halt:
> "No agile-workflow substrate found. Run `/agile-workflow:convert` to bootstrap, then retry."

Read from `.work/CONVENTIONS.md`: the **Terminal-tier retention** value (`delete-refs` default /
`retain-bodies`) and whether `backlog_staleness_days` is set.

### Phase 2: Mechanical pass (cheap, deterministic)

These signals need no judgment. For each, record the item id + the signal that fired.

1. **STALE (age).** Run `.work/bin/work-view --stale`. This lists backlog items whose last-touched
   date — `updated` if present, else `created` — exceeds `backlog_staleness_days`. If the key is
   absent, `--stale` reports itself inert; note "staleness face inert (no `backlog_staleness_days`
   configured)" in the report and continue with the other checks. Do not invent a threshold.
2. **Missing-field.** Flag backlog items missing a required field (`id`, `created`, `tags`) — a
   malformed capture worth a human look.
3. **Cites-done-work.** Scan each backlog item body for references to a feature/release/story id;
   cross-check with `work-view` whether that id is now `stage: done` (or shipped). **Query with
   `--scope all`** (e.g. `work-view --scope all --stage done`): completed work usually lives in the
   terminal tiers (`archive/`, `releases/`), which `work-view` hides by default — without widening
   scope this check would miss exactly the shipped/archived work it exists to catch. An item whose
   premise cites already-completed work is a **DONE candidate** — flag it with the cited id.

Mechanical findings are higher-confidence; still proposals, never auto-applied.

### Phase 3: Semantic pass (grounded; default on, skippable)

Dispatch **one read-only deep sub-agent** over the backlog item bodies to propose:

- **DUPLICATE** — two items expressing the same intent.
- **SUPERSEDED** — a later item (or landed work) obsoletes an earlier one.
- **MERGEABLE / CLUSTER** — N items that are really one epic/feature.

The sub-agent prompt MUST carry the grounding requirement verbatim: *every proposed classification
quotes the overlapping text from each item involved; no classification without a citation;
uncertain pairings are surfaced as questions, not assertions.* If the host has no sub-agent path,
run the pass inline and record the reduced isolation in the report.

The user may skip this pass ("groom, mechanical only") — then report STALE / missing-field /
cites-done only.

### Phase 4: Write the triage report

Write `groom-report-<date>.md` to the project's scratchpad tier — a transient location, NEVER
`.work/backlog/` (that would add items to the backlog this sweep exists to shrink). Resolve the
destination in this order: use `.work/scratch/` if it exists, else `.memory/scratchpad/` if it
exists, else emit the report inline in conversation and write no file. For each finding:

```
<CLASSIFICATION>  <item-id>   — <signal / grounding>
  e.g. STALE       idea-foo    — 180d since last-touched (threshold 90)
       DONE?       idea-bar    — cites feature-baz, now stage:done
       DUPLICATE   idea-x ~ idea-y — both describe <quoted overlap from each>
       SUPERSEDED  idea-old    — by idea-new: "<quote>" vs "<quote>"
       MERGEABLE   idea-a,b,c  — one epic: <shared theme + quotes>
```

VALID items are not listed individually (a count suffices) — the report is the exception set.

### Phase 5: Per-finding confirmation and disposition

For each non-VALID finding, ask the operator before acting. Nothing moves without confirmation.

- **DONE / SUPERSEDED (confirmed)** → dispose through **terminal-tier retention**: under
  `delete-refs`, archive as a bodyless stub; under `retain-bodies`, archive with body kept. (This
  is the same terminal disposition the review skill uses — honor the project's value, do not
  re-decide close-vs-archive.) For SUPERSEDED, first fold any unique detail into the superseding
  item.
- **DUPLICATE (confirmed)** → fold unique detail into the kept item, then dispose the absorbed one
  per the same convention.
- **MERGEABLE (confirmed)** → this is a `scope` act: hand off to `/agile-workflow:scope` to cluster
  the items into one epic/feature, rather than mutating inline.
- **STALE (confirmed dead)** → treat as DONE/SUPERSEDED disposition; **STALE but still wanted** →
  leave in place (touching it bumps `updated`, resetting the staleness clock — which is correct: a
  human reaffirmed it).
- **Declined** → leave the item untouched; optionally note the reaffirmation.

Commit only the dispositions the operator confirmed:

```bash
git add .work/  # the archived stubs / merged items actually changed
git commit -m "groom: <N> items disposed (<counts by class>)"
```

## Output

In conversation:
- **Report**: path (or inline) + counts by classification.
- **Confirmed**: items disposed and how (archived / merged / handed to scope).
- **Left**: stale-but-reaffirmed and declined counts.
- **Next**: `/agile-workflow:scope` for any MERGEABLE clusters the operator wants promoted.

## Guardrails

- **Never auto-prune.** No archive / merge / delete without per-finding confirmation. A report with
  zero confirmed dispositions is a valid, complete run.
- **Never fabricate a supersession or duplicate claim.** Semantic findings without quoted grounding
  do not get written. "I'm not sure these are duplicates — confirm?" is correct; asserting it is not.
- **Don't add items to the backlog.** The report is transient; it never becomes a `.work/backlog/`
  file. Grooming reduces entropy, it does not produce more items to triage.
- **Don't re-decide terminal disposition.** Inherit `Terminal-tier retention`; an unrecognized
  value defaults to keeping the body (safe) with a warning, exactly as the release/review paths do.
- **Don't impose a cadence.** Invocation-driven; schedulability is a deployment choice.
- **Inert without opt-in.** The staleness face requires `backlog_staleness_days`; absent, it
  reports inert and the other faces still run. The skill as a whole is a no-op unless invoked.
