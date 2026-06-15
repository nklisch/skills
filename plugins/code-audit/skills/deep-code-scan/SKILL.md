---
name: deep-code-scan
description: >
  Multi-lane, decomposition-first codebase scan campaign that writes markdown docs only. Use when
  the user asks for a deep code scan, comprehensive audit, whole-repo issue hunt, or organized
  remediation plan spanning multiple lanes such as correctness, tests, performance, security,
  quality, structure, or architecture without adopting agile-workflow. Interviews for goal, lanes,
  rigor, scanner tier, and altitude bands; maps the repo; fans out scoped scanners; runs a review
  gauntlet; and consolidates findings into a code-audit scan folder of markdown documents.
---

# Deep Code Scan

Orchestrate a goal-driven scan campaign: decompose the codebase, scan from narrow components outward,
verify findings, and produce an organized remediation plan. This standalone variant writes markdown
documents under `code-audit/scan-<goal>/`. It never creates `.work/` items, backlog entries, release
gates, or commits.

Use this when the scan spans multiple lanes or needs the decompose -> scan -> review -> consolidate
campaign shape. For a single-domain pass, route to the specialist skill: `bug-scan`, `perf-scout`,
`repo-eval`, or `bold-refactor`.

## Deliverables

Default output root:

```text
code-audit/scan-<goal>/
  00-plan.md
  01-component-map.md
  02-findings-ledger.md
  03-review-gauntlet.md
  04-remediation-plan.md
```

Temporary scanner packets may live under `code-audit/scan-<goal>/.artifacts/` while the campaign is
running. After final collation, remove that scratch directory unless the user asks to keep raw
packets.

## Composition, Not Replacement

In-campaign scanners reuse local reference catalogs. Do not invoke specialist skills mid-campaign;
load their references as scanner knowledge:

| Lane | Reference source | Standalone alternative |
|---|---|---|
| correctness | `../bug-scan/references/*` | `bug-scan <path>` |
| performance | `../perf-scout/references/*` | `perf-scout <path>` |
| quality / holistic | `../repo-eval/references/*` | `repo-eval <path>` |
| architecture / bold | `../bold-refactor/SKILL.md` conceptual lenses | `bold-refactor <path>` |
| tests | lane-catalog test guidance | focused test-audit scanner |
| tests | lane-catalog test guidance | `test-scan <path>` |
| security | lane-catalog security guidance | `security-scan <path>` |
| structure / refactor | lane-catalog refactor guidance plus project pattern docs | focused structure scanner |
| custom | bespoke brief from the user's goal | none |

## Dials

Set these with the user before scanning:

- **Goal**: the north star, such as `all-issues`, `correctness`, `performance`, or a custom phrase.
- **Lanes**: selected scan domains. `all-issues` selects correctness, tests, performance, security,
  quality, and structure. Architecture/bold is opt-in.
- **Rigor**: `floor`, `standard`, or `full`.
- **Scanner tier**: `mixed`, `codex-high`, `codex-xhigh`, `claude-opus`, `claude-sonnet`, or the
  nearest host-native equivalents.
- **Altitude bands**: default `leaf -> module -> subsystem -> system`; trim for small repos.

Compute an agent budget before scanning. If the plan implies more than about 150 total scanner/review
calls or more than 20 scanners in one wave, surface that cost and narrow the plan unless the user
explicitly accepts it.

## Phase 1: Kickoff Interview

Read enough of the repo to propose grounded dials: top-level layout, manifests, languages, entry
points, tests, and docs. Ask concise questions or use a structured question tool to settle the dials.

Do not proceed to fan-out until the user has approved the goal, lanes, bands, and budget.

## Phase 2: Decompose The Codebase

Build the altitude component map. Read [references/decomposition.md](references/decomposition.md)
for the method.

Output the approved map to `01-component-map.md`: `band -> components`, where each component has a
stable slug, role, file set, and parent edges for roll-up.

## Phase 3: Write The Plan

Create `00-plan.md` before scanning. It records:
- goal and scope;
- selected lanes and why;
- altitude bands and component counts;
- scanner tier per lane;
- rigor;
- estimated scanner calls and review calls;
- output root and temporary artifact policy.

Stop and present the plan. Adjust if the user redirects.

## Phase 4: Drive The Scan

Walk each lane and its bands from narrow to broad. At each band, fan out parallel scanner sub-agents
across components. Read [references/scanner-brief.md](references/scanner-brief.md) for the dispatch
brief and finding schema.

Each scanner is read-only over source code and writes only its assigned temporary markdown packet.
The orchestrator spot-checks candidate findings, writes accepted findings to
`02-findings-ledger.md`, and rolls concise inherited findings upward to the next band.

## Phase 5: Review Gauntlet

Run the review gauntlet before consolidation. Read
[references/review-gauntlet.md](references/review-gauntlet.md). At `standard` rigor, run at least two
fresh-context review rounds; at `full`, run to convergence or cap at four rounds. Record the ledger
in `03-review-gauntlet.md`.

## Phase 6: Consolidate

Cluster surviving findings into an implementation-neutral remediation plan. Read
[references/consolidation.md](references/consolidation.md). Write `04-remediation-plan.md` with:
- findings grouped by fix locality and theme;
- severity and confidence;
- recommended sequence;
- risks and intent constraints;
- validation checks to run before and after implementation;
- advisory findings that did not become recommended work.

Ask before writing the final remediation plan if the campaign is large enough that the clusters are a
substantial commitment.

## Phase 7: Close

Make sure the five markdown deliverables are present and internally consistent. Remove
`code-audit/scan-<goal>/.artifacts/` after final collation unless the user asked to keep it. Summarize
to the user:
- output root;
- lanes and components scanned;
- severity counts;
- top clusters;
- review-gauntlet outcome;
- recommended next implementation step.

## Guardrails

- Plan before scanning.
- Load specialist references as knowledge; do not invoke specialist skills mid-campaign.
- Findings need `file:line` and in-context rationale.
- Review findings before turning them into recommendations.
- Consolidate; do not flood the report with one disconnected task per finding.
- Do not implement fixes.
- Do not write `.work/`, backlog, release, or tracking artifacts.
