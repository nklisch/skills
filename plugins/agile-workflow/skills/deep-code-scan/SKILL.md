---
name: deep-code-scan
description: >
  Multi-lane, decomposition-first codebase scan campaign for agile-workflow. Use when the user asks
  for a deep code scan, comprehensive audit, whole-repo issue hunt, or organized fix plan that spans
  multiple lanes such as correctness, tests, performance, security, quality, structure, or
  architecture. Interviews for goal, lanes, rigor, scanner tier, and altitude bands; maps the repo
  from leaf to system scope; fans out scoped scanners; runs a review gauntlet; and consolidates
  surviving findings into one fix epic. For a single-domain scan, route to the specialist instead.
---

# Deep Code Scan

You orchestrate a **scan campaign**: a goal-driven, decomposition-first sweep of a codebase
that starts at the smallest units and scopes outward, dispatches multi-model scanner agents
(the shipped agile-workflow `scanner` role when available) in parallel, verifies what they find,
and returns an organized remediation plan instead of a
pile of loose findings.

This is the **campaign layer above** the depth scanners. It does not re-implement them. Its
unique work is the four things none of the specialists do on their own:

1. **Decomposition-first planning** — map the repo into altitude bands and turn that map into a
   reviewable epic before any scanning tokens burn.
2. **The small→large sweep** — scan leaves first, then let each wider altitude consume the
   findings below it, so module- and system-level scanners are primed by what the leaves
   revealed.
3. **Temporary durable scan artifacts** — preallocate per-scanner artifact paths and require scanners
   to write their own packets/findings there, so compaction cannot erase in-flight evidence; prune
   those raw artifacts after the final summary and fix epic are collated.
4. **Cross-model verification** — a different-model adversarial/peer pass over findings, so the
   campaign's output is hardened, not just generated.
5. **Intelligent fix bundling** — consolidate everything into one coherent fix epic clustered by
   locality and theme, not 200 backlog stubs.

## Composition, not replacement (read this before worrying about overlap)

The depth specialists stay exactly where they are. In-campaign, `deep-code-scan` **only reuses their
reference catalogs as scanner knowledge** — it does **not** invoke the specialist skills mid-campaign.
Several of them mint and commit their own `.work/` items (bold-refactor commits epics, refactor-design
emits stories, bug-scan gate-writes); invoking them in-campaign would bypass the gauntlet and create
items outside `fix-<goal>`. The rightmost column is the **standalone alternative** — what to run
*instead of* a campaign when the user only needs that one specialist:

| Lane | Reuses (loaded as scanner knowledge) | Standalone alternative (instead of a campaign) |
|---|---|---|
| correctness | `bug-scan/references/*` (8 bug domains) | `/agile-workflow:bug-scan <path>` |
| tests | `gate-tests` coverage analysis (bad tests, gaps, stale fixtures, weak assertions) | `/agile-workflow:gate-tests` |
| performance | `perf-scout/references/*` (11 perf lenses) | `/agile-workflow:perf-scout <path>` |
| quality / holistic | `code-audit/skills/repo-eval/references/*` (9 dimensions) | `/code-audit:repo-eval <path>` |
| structure / refactor | `refactor-design` discovery heuristics | `/agile-workflow:refactor-design <path>` |
| architecture / bold | `bold-refactor` conceptual lenses (elimination, unification, inversion, algebraic, declarative, domain crystallization) | `/agile-workflow:bold-refactor` |
| security | `gate-security` audit domains | `/agile-workflow:gate-security` |
| custom | a bespoke brief built from the user's goal | — |

**When NOT to use this skill:** a **single-domain scan — even whole-repo** (just correctness, just
tests, just perf, just security), a single directory, or a one-shot report. Those are exactly what
the specialists are *for* (`bug-scan` already scans the whole repo for correctness, `gate-tests` for
test gaps, etc.) — point the user at them. `deep-code-scan` earns its weight only when the scan
**spans multiple lanes**, or is a **custom cross-cutting goal that genuinely needs the
decompose → scan → gauntlet → consolidate campaign**. If the request is narrower, say so and route
it to the specialist instead of spinning up a campaign.

## The structure it builds

```
EPIC  scan-<goal>                          the campaign (goal encoded; engagement-owned scaffold)
 ├─ FEATURE  scan-<goal>-correctness        a LANE (one selected domain/mode; locks its scanner tier)
 │   ├─ STORY scan-<goal>-correctness-leaf       altitude: functions / single files   deps: []
 │   ├─ STORY scan-<goal>-correctness-module     altitude: dirs / modules             deps: [leaf]
 │   ├─ STORY scan-<goal>-correctness-subsystem  altitude: bounded contexts           deps: [module]
 │   └─ STORY scan-<goal>-correctness-system     altitude: cross-cutting / whole repo deps: [subsystem]
 ├─ FEATURE  scan-<goal>-performance         another lane (same altitude story spine)
 └─ FEATURE  scan-<goal>-security            another lane
        within each altitude story: fan out N parallel multi-model scanners
        across that altitude's components; each scanner loads the lane's references.
        later altitudes read the findings recorded by earlier ones.

  ── then consolidation ──>

EPIC  fix-<goal>                            the OUTPUT: one organized remediation plan
 ├─ FEATURE clustered by locality/theme     (body cites Source: scan-<goal>)
 └─ STORY   concrete fixes
```

- **Epic = the campaign** (one per goal). **Feature = a lane** (the user-selected domains/modes;
  each locks its scanner tier). **Story = an altitude band**, `depends_on`-chained leaf→system so
  the sweep is a visible, ordered structure and wider scans inherit narrower findings.
- **Fan-out happens inside an altitude story**, across the components at that altitude — that is
  where the parallel multi-model agents live.
- The **scan scaffold is engagement-owned working state** ("we're looking") — `deep-code-scan`
  creates it, drives it, and closes it to `done` within the same run; it is not a queue for
  `autopilot`. The **fix epic is the durable deliverable** ("here's the organized work"), carrying
  the audit summary that outlives the (prunable) scan epic. Keeping them separate mirrors
  research → handoff.
- The **scanner packets, candidate findings, and intermediate rollups are temporary durable working
  artifacts** under `.work/scan-artifacts/scan-<goal>/`. Scanners write their own unique files there;
  story/fix bodies carry the durable summaries. After Phase 6 collates the final record, remove the
  artifact root so the git tree does not retain raw scan junk.

## Dials (settle these WITH the user at kickoff — never silently)

Five dials shape the campaign. Propose, discuss, settle — this is an interview, and a
mispositioned dial costs the whole campaign.

- **`goal`** — the campaign's north star, captured free-form from the conversation ("find every
  place we drop cancellation", "all correctness risk", "everything"). Presets exist
  (`all-issues`, `correctness`, `tests`, `security`, `performance`, `quality`) but the goal can be
  any target the user names. It frames what counts as a finding and becomes the epic slug.
- **`lanes`** — which scan lanes are in scope (the menu in the table above). The user's picks
  *become the features*. `all-issues` selects correctness, tests, performance, security, quality, and
  structure; **`architecture` (bold-refactor) is opt-in even under `all-issues`** — it's the
  highest-risk, highest-review-cost lane, so the user adds it deliberately. A focused goal may select
  one lane.
- **`rigor`** — `floor` / `standard` / `full`, the verification depth (see Verification). Infer
  from how load-bearing the output is; surface your inference.
- **`scanner tier`** — which agent/model tier the scanner fan-out uses, **locked per lane** at plan
  time (recorded in each lane feature's body, not frontmatter). One enum, used everywhere:
  `opus | mixed | sonnet | codex-high | codex-xhigh | gemini | zai-high | zai-xhigh`. `mixed`
  (default) gives model diversity — opus on dense/high-altitude components + sonnet on leaves,
  drawing on the host's available classes; `opus`/`sonnet` pin one Claude model; `codex-high`/
  `codex-xhigh` set Codex reasoning effort; `gemini` pins Gemini; `zai-high`/`zai-xhigh` set
  Z.AI GLM 5.2 reasoning effort (model fixed `glm-5.2`). Offer it per lane or once for all. The
  role→capability→model mapping and which classes count as distinct is in
  [../principles/references/models.md](../principles/references/models.md). The choice binds that
  lane's scanners; the cross-model gauntlet still uses a *different* class regardless, and for a
  deep/complex campaign uses **two** different classes if available (advisory phase + adversarial
  phase) — independence is non-negotiable.
- **`altitude bands`** — the default sweep is `leaf → module → subsystem → system`. Trim or
  rename to fit the repo (a tiny library may be just `file → repo`; a monorepo may add
  `package`). The bands become each lane's story spine.

## The walk

### Phase 0 — Substrate check + scan-aware preflight
`deep-code-scan` is substrate-first. If `.work/CONVENTIONS.md` is absent, stop and tell the user
to run `/agile-workflow:convert` first — the campaign's whole output is substrate items. Do not
fall back to a loose report; that is what standalone `bug-scan` is for.

Then preflight the **paired scan-aware substrate** this skill assumes (all ship together with it):
(1) the `scan_origin` field in SPEC + the `work-view --scan-origin` flag; (2) `scan` / lane / band
tags registered in `.work/CONVENTIONS.md`; (3) **autopilot excludes `[scan]` items from its ready
queue** — the structural guarantee the scaffold isn't misrouted. Probe cheaply (e.g.
`work-view --scan-origin x` exits cleanly; CONVENTIONS lists the scan tags). **If the scan-aware
substrate is missing, do not silently proceed** — warn that active scan items would be
autopilot-grabbable on this install, and get explicit user acknowledgment (or have them land the
paired feature first). This is a hard checkpoint, not a footnote.

### Phase 1 — Kickoff interview (set the dials)
Use the available structured question tool when the harness provides one; otherwise ask concise
direct questions. Drive the conversation to settle `goal`, `lanes`, `rigor`, `scanner tier`, and
`altitude bands`.
Read enough of the repo first (languages, frameworks, top-level layout, entry points —
`git ls-files`, manifests) to propose *grounded* lanes and bands, not generic ones. Confirm before
proceeding.

### Phase 2 — Decompose the codebase
Build the **altitude component map**: for each band, the concrete list of components to scan.
This is the skill's signature move — get it right and everything downstream is scoped cleanly.
See [references/decomposition.md](references/decomposition.md) for the method (module-boundary
detection, dependency-graph cues, `ast-grep` structural probes, how to keep the leaf set
tractable). Spawn 1–3 parallel exploratory sub-agents for a large repo; do it inline
for a small one. The output is a map: `band → [components]` with a one-line role per component.

### Phase 3 — Write the scan plan (FIRST DELIVERABLE) + checkpoint
Create the scan campaign epic, its lane features (each recording its locked scanner tier), and
their altitude stories, using the frontmatter in
[references/item-templates.md](references/item-templates.md). Wire `depends_on` leaf→system within
each lane; lanes are independent (parallel) unless the user says one informs another. Write the
component map into the relevant story bodies as their scope.

Create the campaign artifact root before fan-out:
`.work/scan-artifacts/scan-<goal>/`. Record that path in the scan epic body and initialize the
directory structure described in [references/artifact-ledger.md](references/artifact-ledger.md).
Before each scanner wave, preallocate one unique `raw`, `candidates`, and `status` path per scanner
and include those paths in its brief. Treat this directory as durable **in-flight** campaign state:
leave it untracked/ignored, reload from it after compaction or context reset, and delete it after
final collation. Checkpoint commits include only the summaries copied into `.work` item bodies, not
the ignored scanner artifact files.

**Compute and record an agent budget.** The fan-out is `components × (domains per lane)` and can
explode — eight bug domains across hundreds of leaf files is thousands of agent calls. Before the
checkpoint, estimate and write into the epic body: max scanners per wave, leaf batch size (files per
scanner), the total **scanner** calls, AND the **verification/review** calls the rigor dial implies
(Gate 1 + Gate 2 rounds, revisions, the `full`-rigor campaign evaluate) — the gauntlet is not free.
Report the **total estimated agent calls**. If it exceeds a sane threshold (rule of thumb: >150 total
agent calls, or >20 scanners per wave), surface it so the user can narrow lanes, coarsen bands, raise
the batch size, or drop rigor. The budget — both numbers — is part of what they approve.

Then **stop and present the plan** (the epic/feature/story layout + the component map + the budget)
for review. This is the plan-first gate: the user approves or adjusts the shape before any scanning
runs. Adjust and re-confirm if they redirect. Commit the plan:
`deep-code-scan: plan <goal> (<L> lanes, <B> bands, ~<N> agent calls)`.

> **Engagement-owned, enforced structurally.** The scan scaffold is owned by `deep-code-scan`: it
> drives the scaffold in Phase 4 and closes it within the run, like research-orchestrator owning its
> engagement. This is **not** left to a documentation warning — the paired substrate change ships
> autopilot **scan-awareness**: `autopilot` excludes `[scan]`-tagged items from its ready queue by
> construction, so a stray `autopilot --all` cannot grab a `stage: implementing` scan story and route
> it to `implement-orchestrator`. The discriminator is the `[scan]` tag; the **fix** epic carries
> project routing tags (not `[scan]`), so it drains through normal autopilot like any other work.
> Until that substrate change lands in a given install, `[scan]` items are still grabbable — so on an
> un-upgraded install, do not run `autopilot --all` against an in-flight campaign.

### Phase 4 — Drive the scan (the fan-out)
Walk lanes; within a lane, walk altitude stories **leaf → system in dependency order** (each band
reads the findings the band below recorded). For each altitude story, fan out **parallel
multi-model scanner agents across that altitude's components** — use the shipped
agile-workflow `scanner` role when available, and see
[references/scanner-brief.md](references/scanner-brief.md) for the brief, the model-diversity
rule, and the finding schema. Each scanner loads the lane's references (per the
[lane catalog](references/lane-catalog.md)).

Each scanner writes its own packet, candidate findings, and status files directly to its assigned
paths, then replies with only a compact status line. The orchestrator must never receive or hold the
full scanner output in chat. At the band checkpoint, collate scanner status files, spot-check from
the saved packets/candidates, write accepted findings to the altitude story and rollup, and advance
only after the artifact manifest is current. A finding is not a finding without a confirmed
`file:line` and a read-in-context rationale — grep hits alone never count. The full multi-round
gauntlet runs at **Gate 1** once all lanes/bands have scanned, just before consolidation.

### Phase 5 — Consolidate into the fix epic (gauntleted, operator-confirmed)
This is what makes the output usable. First materialize the Gate 1 input packet from the artifact
rollups, then run the **review gauntlet's Gate 1** over that packet (multi-round, cross-model — see
Verification) so only survivors proceed. Then collect, dedupe by `file:line`, and **cluster** into a
coherent remediation plan — by fix-locality, by theme, by shared root cause — rather than emitting
one item per finding. See
[references/consolidation.md](references/consolidation.md) for the clustering method and the fix
epic's shape. Persist the proposed plan as a **fix-epic draft packet** inside the artifact root and
run *that* through the **gauntlet's Gate 2** — fresh-context reviewers need a concrete artifact, and
clustering can introduce new context/intent problems a single finding didn't have. **Then propose
the fix epic and ask before materializing it** (like `research-handoff` — never an auto-flood). On
confirmation, write `fix-<goal>` + its clustered features/stories, each carrying `scan_origin:
scan-<goal>` back to the campaign. Commit:
`deep-code-scan: emit fix epic for <goal> (<N> findings -> <M> features)`.

### Phase 6 — Close and report
Append a campaign record to the scan epic body (lanes run, components scanned, finding counts by
severity, verification outcomes, artifact root status, fix-epic id) and advance the scan epic to
`stage: done` — the audit is complete; it is not release-bound, and verification ran inline. Once the
fix epic and campaign record contain the collated durable summary, delete
`.work/scan-artifacts/scan-<goal>/`; the closeout commit should contain only the collated `.work`
item changes. Report to the user:
goal, lanes, components scanned, findings by severity, the fix epic id + its feature breakdown,
and the suggested next step (`/agile-workflow:autopilot` scoped to `fix-<goal>`, or
`/agile-workflow:scope` to reprioritize).

## Scanner dispatch (the fan-out spec)

The scanning happens **in the scanner agents, not in your context** — your job is mapping,
dispatch, artifact-path preallocation, checkpoint collation, verification, and consolidation. Do
not re-do a scanner's work in the orchestrator.

- **Parallel, single message.** Dispatch all of an altitude's component-scanners in one message so
  they run concurrently. Do not serialize.
- **Honor the lane's locked scanner tier** (the kickoff dial, in the lane feature body). `mixed`
  is the default for model diversity; `codex-high`/`codex-xhigh` set Codex reasoning effort; other
  hosts map the same dial to their native high-quality scanner options. The gauntlet still runs with
  independent fresh context regardless of the scanner tier.
- **Scoped tight.** Each scanner gets only its component's file list plus the findings inherited
  from the band below. Never the whole repo per scanner.
- **References, not re-derivation.** Each scanner loads the lane's reference file(s) and applies
  their named patterns. That is the progressive-disclosure win — keep it.
- **Scanners write artifacts themselves.** Each scanner receives unique `raw`, `candidates`, and
  `status` paths and writes them directly. It returns only a terse completion line to chat. If
  context compacts mid-campaign, restart from the status files, manifest, and story links, not from
  memory.

Full brief template, severity rubric, and output format: [references/scanner-brief.md](references/scanner-brief.md).
Artifact paths, manifest schema, rollups, checkpoint commits, and final cleanup:
[references/artifact-ledger.md](references/artifact-ledger.md).

## Verification — the multi-round review gauntlet (the rigor dial)

Scanners *generate*; a separate, **iterative, cross-model** pass *hardens*. This is the most
important quality mechanism in the skill. Auto-generated findings are riddled with three failure
modes, and each produces a "fix" that is worse than leaving the code alone: **false positives**,
**context-ignorant fixes** (locally real, but the remedy breaks the wider system), and — worst —
**goal-fighting fixes** that undo a *deliberate* design choice (swapping out the repo's
intentionally hand-rolled, dependency-free code for a library it avoids on purpose). The gauntlet
exists to kill all three before any fix is proposed. It is multi-round on purpose: one pass
rationalizes, several fresh passes converge on what's true.

Three lenses, applied every round at `rigor ≥ standard`:
- **Reality** — is the problem real and reachable *here*, or theoretical / already handled?
- **Context** — does the fix respect callers, invariants, and existing abstractions, or does treating
  it in isolation break the wider system?
- **Intent** — does the finding or its fix contradict a *deliberate* choice (foundation docs,
  `.work/CONVENTIONS.md`, `.agents/skills/patterns/`, "intentionally X" comments)? A documented
  pattern is **not** a finding; a fix that undoes an intentional decision is a regression wearing a
  fix's clothes — drop it.

| `rigor` | spot-check (you) | review gauntlet | campaign evaluate |
|---|---|---|---|
| `floor` | ✓ always | 1 combined pass (Reality min) | — |
| `standard` | ✓ always | ≥ 2 rounds, all 3 lenses, cross-model | — |
| `full` | ✓ always | rounds to convergence (cap 4), all lenses, cross-model, fresh ctx each | ✓ |

- **Independence is the whole game.** Each round runs in **fresh context** and, where a different
  model class is available, via `peeragent` (pre-approved for cross-review); same-model falls back to
  a fresh-context sub-agent. A round that re-reads its own prior reasoning converges by fatigue, not
  truth.
- **Two gates, same gauntlet.** *Gate 1* culls the raw findings before consolidation. *Gate 2*
  re-runs on the **drafted fix epic** — clustering can introduce new context/intent problems a single
  finding didn't have. The fix epic is emitted only after Gate 2 passes.
- **Persistent dissent → advisory, never forced.** A finding the rounds can't agree on is demoted to
  a human-judgment note on the scan epic, not shipped as a fix.
- **spot-check** (always, you, full context) samples survivors and re-reads the cited code, dropping
  anything grep-only or fabricated in place. **campaign evaluate** (at `full`, isolated context)
  judges whether the campaign *as a whole* met the goal — coverage gaps, lanes that under-delivered.
- Escalate upward freely on evidence; never prune below the spot-check floor.

Full loop, lens detail, and the ledger format: [references/review-gauntlet.md](references/review-gauntlet.md).

## Idempotency

Re-running a campaign must not duplicate items. Recall the prior campaign with
`work-view --scan-origin scan-<goal> --scope all` (or `grep -rl 'scan-<goal>' .work/` if the flag
isn't installed yet). Match findings by `file:line` against the fix epic's durable **`## Resolved finding index`** — not
the scan story bodies, which may have been pruned to bodyless archive stubs once `done` (SPEC
archival). If you must read an archived item's findings, hydrate its body from its `git_ref`.
Skip duplicates; tally and report skips, as `bug-scan` does for its parked items.

## Guardrails

- **Plan before scanning.** Phase 3's checkpoint is load-bearing — never skip straight to fan-out.
  The user approving the map is what makes a large campaign safe to run.
- **Reuse, don't reimplement; never invoke specialists in-campaign.** Load the specialists'
  references as scanner knowledge; do not paste their catalogs into this skill. If the user needs a
  single deep scoped pass, route out to the specialist *before* starting a campaign — once
  in-campaign, every lane is references-only fan-out (invoking an item-minting specialist would bypass
  the gauntlet and create items outside `fix-<goal>`).
- **Findings need `file:line` + context.** No fabrication; an empty lane is a valid, honest result.
  Score and report it as clean, not as ten weak findings.
- **Consolidate, never flood.** The deliverable is a clustered fix epic, confirmed before writing —
  not one backlog item per finding. This is the explicit reason `deep-code-scan` exists over a raw
  scan.
- **Gauntlet before you propose a single fix.** Every finding clears the multi-round, cross-model
  review gauntlet (Reality / Context / Intent) before it can become fix work, and the drafted fix
  epic clears it again. A fix that fights a deliberate repo choice is the worst output this skill can
  produce — the Intent lens exists to catch exactly that, and contested findings go to a human, not
  into the epic.
- **Budget the fan-out.** Compute and get the scanner budget approved at the checkpoint. A campaign
  that quietly spawns thousands of agents (domains × hundreds of leaves) is a footgun — batch leaves,
  prune irrelevant scope, and surface the estimate.
- **Persist before summarizing.** Every scanner packet, scanner candidate-finding file, accepted
  finding rollup, gauntlet input, and draft fix packet must exist on disk under
  `.work/scan-artifacts/scan-<goal>/` before you depend on it. The chat transcript is not durable
  storage; compaction is expected on large campaigns.
- **Clean after collating.** `.work/scan-artifacts/scan-<goal>/` is temporary campaign state, not the
  final audit record. After the fix epic, resolved finding index, campaign record, and gauntlet
  summary are written, remove the artifact root so raw scanner packets do not dirty the repo long
  term.
- **Scan scaffold is engagement-owned, enforced by the `[scan]` tag.** The paired substrate change
  makes `autopilot` skip `[scan]` items, so the scaffold can't be misrouted to `implement-orchestrator`.
  `deep-code-scan` drives scan execution; only the **fix** epic (no `[scan]` tag) is autopilot work.
  Never tag a fix item `[scan]`, or autopilot will skip the work you want done.
- **Not release-bound.** A scan is an input/audit; the scan epic carries `release_binding: null`
  and verification runs inline. Release gating is `release-deploy`'s job, on the *fix* work.
- **Respect scope.** Honor the chosen lanes, bands, and component map. Don't widen mid-campaign
  without surfacing it.
- **No fixes here.** This skill produces the scan ledger and the fix *plan*. Implementation flows
  through `/agile-workflow:autopilot` or `/agile-workflow:implement` over the fix epic.

## Related

- [`bug-scan`](../bug-scan/SKILL.md) — single-pass correctness hunt; its references are the
  correctness lane's knowledge.
- [`gate-tests`](../gate-tests/SKILL.md) — coverage-gap analysis; the tests lane's method.
- [`perf-scout`](../perf-scout/SKILL.md) — perf idea generation; its references + peer pass are the
  performance lane's knowledge.
- [`bold-refactor`](../bold-refactor/SKILL.md) — conceptual architecture lenses; the architecture
  lane's knowledge (and it already emits a `[refactor]` epic for a direct pass).
- [`repo-eval`](../../../code-audit/skills/repo-eval/SKILL.md) — holistic scorecard; the quality
  lane's knowledge.
- [`research-orchestrator`](../../../agentic-research/skills/research-orchestrator/SKILL.md) — the
  dial/checkpoint/verification model this skill mirrors, pointed at code instead of external sources.
- [`epic-design`](../epic-design/SKILL.md) / [`scope`](../scope/SKILL.md) — the substrate
  decomposition mechanics this skill writes against.
