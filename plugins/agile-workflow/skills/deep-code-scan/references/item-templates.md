# Item Templates — scan scaffold + fix epic

All items follow the agile-workflow active-tier schema (see `docs/SPEC.md`). Two kinds of structure:

- **Scan scaffold** (`scan-<goal>` epic + lane features + altitude stories) — **engagement-owned
  working state**. `deep-code-scan` creates it, drives it, and advances it to `done` *within the same
  run*. It is not a queue for `autopilot` to drain (see the routing guardrail in SKILL.md).
- **Artifact ledger** (`.work/scan-artifacts/scan-<goal>/`) — temporary scanner-written raw packets,
  candidate findings, per-scanner status files, orchestrator-accepted rollups, and gauntlet inputs.
  The scan scaffold links to it while the campaign is running; Phase 6 deletes it after the scan/fix
  item bodies contain the collated durable record.
- **Fix epic** (`fix-<goal>`) — the **durable deliverable**. Ordinary remediation work that plugs
  straight into the normal design → implement → release machinery.

## The `scan_origin` linkage field

`scan_origin: <campaign-slug>` is a **first-class linkage field**, mirroring `research_origin` —
queryable via `work-view --scan-origin <slug>`, inert (`null`/absent) when not set, no validation
warning when omitted. It records the scan campaign that produced an item:

- **Fix items** carry `scan_origin: scan-<goal>` so the remediation traces back to its audit, and
  re-runs can dedupe against prior campaigns.
- **Scan items** also carry it (`scan_origin: scan-<goal>`) for symmetry and single-query recall of
  the whole scaffold; their `parent` chain already nests them under the epic.

> **Paired scan-aware substrate (one rollout, modeled on `research_origin`).** This skill assumes a
> substrate patch that ships alongside it:
> 1. `scan_origin` in `docs/SPEC.md` + the `work-view` parser/model/filter + a `--scan-origin` flag + tests;
> 2. `scan` / lane / band tags registered in `.work/CONVENTIONS.md`;
> 3. **autopilot excludes `[scan]`-tagged items from its ready queue** — the structural guarantee the
>    engagement-owned scaffold can't be misrouted to `implement-orchestrator`.
>
> Until that lands in a given install, `scan_origin` is inert (the parser ignores unknown frontmatter),
> `grep -rl 'scan-<goal>' .work/` is the fallback query, and scan items are autopilot-grabbable — so
> the Phase 0 preflight warns before creating them.

## Canonical tags (slug-safe)

Tags must be single kebab tokens — never display names with slashes/spaces ("quality / holistic").
Scan items use the **scan-domain** tags below; fix items use the **project's** routing taxonomy
(`.work/CONVENTIONS.md`) so design routing works.

| Lane (display) | scan tag |
|---|---|
| correctness | `correctness` |
| tests | `tests` |
| performance | `performance` |
| security | `security` |
| quality / holistic | `quality` |
| structure / refactor | `structure` |
| architecture / bold | `architecture` |
| custom | `custom` |

Every scan item also carries the umbrella `scan` tag (the `[scan]` tag is the discriminator
`autopilot` uses to skip the engagement-owned scaffold); stories add a band tag (`leaf` / `module` /
`subsystem` / `system`). **Registering `scan` + the lane/band tags in `.work/CONVENTIONS.md` is a
rollout prerequisite**, shipped with the paired substrate change — not an optional aside.

**Fix items never carry `[scan]`.** They use the project's routing taxonomy so design routing works
*and* so `autopilot` drains them normally — a fix item tagged `[scan]` would be skipped.

---

## Scan scaffold

### Scan campaign epic — `.work/active/epics/scan-<goal>.md`

```yaml
---
id: scan-<goal>
kind: epic
stage: drafting        # drafting at creation; -> implementing once the Phase 3 plan is approved;
                       # -> done at end of the run (audit complete). NOT release-bound.
tags: [scan, <lane-tags...>]
parent: null
depends_on: []
release_binding: null  # a scan is an input/audit, never a release-bundle member
gate_origin: null
scan_origin: scan-<goal>   # self-anchor: the campaign id
created: YYYY-MM-DD
updated: YYYY-MM-DD
---

# Scan campaign: <goal>

## Goal
<verbatim user goal — the north star every scanner serves>

## Dials
- lanes: [<lane>, ...]
- rigor: floor | standard | full
- altitude bands: [leaf, module, subsystem, system]

## Agent budget   <!-- approved at the Phase 3 checkpoint -->
- max scanners per wave: <n> · leaf batch size: <n files/scanner>
- est. scanner calls: <n> · est. verification/review calls (Gate 1 + Gate 2 rounds, evaluate): <n>
- **est. total agent calls: <n>**

## Component map
<the band -> [components] map from decomposition; this is what was approved at the checkpoint>

## Artifact ledger
- root: `.work/scan-artifacts/scan-<goal>/`
- manifest: `.work/scan-artifacts/scan-<goal>/manifest.jsonl`
- raw packets: `.work/scan-artifacts/scan-<goal>/raw/`
- scanner candidates: `.work/scan-artifacts/scan-<goal>/candidates/`
- scanner statuses: `.work/scan-artifacts/scan-<goal>/status/`
- accepted findings: `.work/scan-artifacts/scan-<goal>/accepted/`
- rollups: `.work/scan-artifacts/scan-<goal>/rollups/`
- lifecycle: temporary; removed after final collation

## Campaign record   <!-- filled at Phase 6; a done+unbound epic body is git-historical and may later
                          be pruned to a stub, so the DURABLE summary also rides fix-<goal> -->
- lanes run / components scanned / findings by severity
- review gauntlet: rounds, dropped (by lens) + why, contested/advisory items (Low findings live here)
- fix epic emitted: `fix-<goal>` (<M> features)
- artifact cleanup: `.work/scan-artifacts/scan-<goal>/` removed after collation
```

### Lane feature — `.work/active/features/scan-<goal>-<lane>.md`

```yaml
---
id: scan-<goal>-<lane>
kind: feature
stage: drafting        # -> implementing as its bands run; -> done when the lane is scanned
tags: [scan, <lane>]
parent: scan-<goal>
depends_on: []         # lanes independent unless one informs another
release_binding: null
gate_origin: null
scan_origin: scan-<goal>
created: YYYY-MM-DD
updated: YYYY-MM-DD
---

# Lane: <lane>

## Scanner tier   <!-- LOCKED at plan time from the kickoff dial; binds this lane's fan-out -->
opus | mixed | sonnet | codex-high | codex-xhigh

## Reference knowledge
<paths from lane-catalog.md this lane's scanners load>

## Altitude spine
<the bands this lane uses — may be a subset; see lane-catalog "story spine">
```

### Altitude story — `.work/active/stories/scan-<goal>-<lane>-<band>.md`

```yaml
---
id: scan-<goal>-<lane>-<band>
kind: story
stage: implementing    # -> review -> done as the band is scanned + spot-checked
tags: [scan, <lane>, <band>]
parent: scan-<goal>-<lane>
depends_on: [scan-<goal>-<lane>-<band-below>]   # leaf: [] ; module deps on leaf ; etc.
release_binding: null
gate_origin: null
scan_origin: scan-<goal>
created: YYYY-MM-DD
updated: YYYY-MM-DD
---

# <lane> / <band>

## Scope (components)
<this band's component list from the map>

## Inherited findings
<file:line summaries rolled up from the band below by path ownership — or "leaf band, none">

## Findings   <!-- written after the fan-out + per-band spot-check -->
### Critical / High / Medium
- `file:line` — <title> — fix locality: local|module|cross-cutting — <one line>
### Low (advisory — stays here, NOT minted as backlog stubs)
- `file:line` — <title> — <one line>

## Artifact links
- raw packets: `.work/scan-artifacts/scan-<goal>/raw/<lane>/<band>/`
- scanner candidates: `.work/scan-artifacts/scan-<goal>/candidates/<lane>/<band>/`
- scanner statuses: `.work/scan-artifacts/scan-<goal>/status/<lane>/<band>/`
- accepted findings: `.work/scan-artifacts/scan-<goal>/accepted/<lane>/<band>.jsonl`
- rollup: `.work/scan-artifacts/scan-<goal>/rollups/<lane>/<band>.md`

## Coverage gaps
<components/domains skipped + why, scanner errors>
```

---

## Fix epic (the deliverable) — `.work/active/epics/fix-<goal>.md`

Emitted operator-confirmed at Phase 5, after the draft packet clears gauntlet Gate 2.

```yaml
---
id: fix-<goal>
kind: epic
stage: drafting        # ready for epic/feature design + autopilot — ordinary work from here
tags: [<project taxonomy tags reflecting the clusters>]
parent: null
depends_on: []
release_binding: null  # binds to a release later, via release-deploy, like any work
gate_origin: null
scan_origin: scan-<goal>
created: YYYY-MM-DD
updated: YYYY-MM-DD
---

# Remediation: <goal>

**Source:** scan campaign `scan-<goal>` — <N> findings survived the review gauntlet.

## Clusters
<one line per fix feature: what it resolves, how many findings, why grouped>

## Audit summary (durable)
<finding counts by severity + lane; the persistent record, since the scan epic may be pruned>

## Resolved finding index (durable — idempotency anchor)
<every finding this campaign actioned, as `file:line — <slug>` fingerprints, one per line. Lives on
the fix EPIC (not just child features) so re-runs match against one durable list even after the scan
scaffold and fix children are archived/pruned.>
```

### Fix feature / fix story

`.work/active/features/fix-<goal>-<cluster>.md` and `.work/active/stories/fix-<goal>-<cluster>-<n>.md`

```yaml
---
id: fix-<goal>-<cluster>
kind: feature                       # or story for a single-stride isolated fix
stage: drafting
tags: [<project routing tag: refactor / perf / bug / security / ...>]
parent: fix-<goal>
depends_on: [fix-<goal>-<foundational-cluster>]   # foundational clusters land first
release_binding: null
gate_origin: null
scan_origin: scan-<goal>
created: YYYY-MM-DD
updated: YYYY-MM-DD
---

# Fix: <cluster name>

## Findings resolved
- `file:line` — <title> (severity)

## Cluster rationale
<why these are one unit; the shared root cause or shared remedy>

## Review gauntlet verdict
<survived rounds; context/intent constraints the fix MUST respect — e.g.
"keep the parser dependency-free per patterns/hand-rolled-peekable-flag-parser">
```

> **Routing matters.** Tag each fix cluster with the project taxonomy so agile-workflow routes its
> design correctly: behavior-preserving cleanup → `[refactor]` (→ refactor-design), perf → `[perf]`
> (→ perf-design), correctness/security → its domain tag (→ feature-design). The gauntlet's
> Intent-lens constraints ride in the body so the designer can't undo a deliberate choice.
