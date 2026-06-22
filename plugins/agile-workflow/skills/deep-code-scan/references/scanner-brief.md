# Scanner Dispatch — brief template, model diversity, finding schema

Scanners are the workers of an altitude story. Use the shipped agile-workflow `scanner` role when
available. They are **source-read-only**, **scoped to one component**, and **armed with the lane's
references**. Their only writes are their assigned artifact files. The orchestrator never re-does
their work.

## Model diversity (the "different models in parallel" rule)

The lane's **scanner tier is locked at plan time** (the kickoff dial, recorded in the lane feature
body). Read it and honor it; the guidance below is what each tier means, with `mixed` as the
default. Whatever the scanner tier, the cross-model **gauntlet** (Verification) still runs on a
*different* class — independence there is non-negotiable.

Single-model fan-out gives single-model blind spots, so the default `mixed`
tier spreads the wave across the host's available model classes or reasoning
settings. Use stronger reviewer reasoning on dense, subtle, high-altitude, or
high-risk components; use the capable default for smaller leaf components and
high-volume waves. The `codex-high` and `codex-xhigh` tiers map directly to
Codex high and extra-high reasoning; other hosts should map those tiers to
their closest source-read-only reviewer/scanner settings.

The cross-model **adversarial** pass (Verification, `rigor ≥ standard`) should run on a *different*
model class than the bulk of the scanners — that is where `peeragent` fits, and it is pre-approved
for cross-review.

## Dispatch rules

- All component-scanners for one altitude band go out in **one message** (parallel).
- Each scanner is scoped to **its component's file list only**, plus the **inherited findings** from
  the band below (so wider scans reason about interactions, not re-find leaf bugs).
- If a scanner errors, record it as a coverage gap in the story body — do not blind-retry.
- If a scanner returns >25 findings, ask it to keep the top 25 by severity; a flood
  usually means pattern over-matching.
- Scanners may write only their assigned artifact files under `.work/scan-artifacts/scan-<goal>/`.
  They must not edit source files, `.work/active/` items, shared manifests, or another scanner's
  paths.

## Scanner brief template

> You are a **source-read-only scanner agent** for the **<lane>** lane at the **<band>** altitude.
> Follow the agile-workflow scanner contract: scoped inspection, caller-authorized artifacts only,
> no fixes, and no recursive sub-agents.
>
> **Scan goal (the campaign north star):** <goal — verbatim from the user>
> Everything you report must serve this goal. A finding outside the goal is noise.
>
> **Reference(s) — load FIRST and apply their named patterns:**
> <absolute paths from the lane catalog, e.g. bug-scan/references/concurrency-races.md>
>
> **Scope — scan ONLY these files:**
> ```
> <component file list>
> ```
>
> **Artifact paths — write ONLY these files:**
> - raw packet: `.work/scan-artifacts/scan-<goal>/raw/<lane>/<band>/<component>.md`
> - candidate findings: `.work/scan-artifacts/scan-<goal>/candidates/<lane>/<band>/<component>.jsonl`
> - status: `.work/scan-artifacts/scan-<goal>/status/<lane>/<band>/<component>.json`
>
> **Inherited findings from the band below (reason about interactions; don't re-report these):**
> ```
> <file:line + one-line summary pairs, or "none — this is the leaf band">
> ```
>
> **Stack profile:** <languages, frameworks, relevant primitives>
>
> **Method:**
> 1. Load the reference(s); note the patterns and detection signals relevant to the goal.
> 2. (If the lane calls for it) web-search 1–3 times for current pitfalls for this stack/version.
> 3. Apply the detection signals to the scope. Read every flagged site — **confirm in context**.
>    Grep hits alone are not findings.
> 4. Consider how your component interacts with the inherited findings (a leaf bug may compose into
>    a module-level hazard worth its own, higher-severity finding).
>
> **For each confirmed finding, return:**
> - **Title** (one line)
> - **Lane / Band**: <lane> / <band>
> - **Pattern**: named pattern from the reference, or "new"
> - **Severity**: Critical | High | Medium | Low (rubric below)
> - **Location**: `file:line`
> - **Evidence**: 1–5 lines of the offending code, fenced
> - **Why it matters** (1–2 sentences — the specific failure mode, tied to the goal)
> - **Remediation direction** (a direction, not a finished fix)
> - **Fix locality**: `local` (single site) | `module` (one component) | `cross-cutting` (spans
>   components) — this feeds consolidation clustering.
>
> **Rules:** cite `file:line` for every finding; confirm in context; don't fabricate (empty is
> valid and honest); don't implement fixes; stay in scope; skip anything in the inherited list.
>
> **Write artifacts, then return only status:**
> 1. Write the raw packet markdown to the assigned raw packet path. The packet starts with
>    `## <lane>/<band> — <component>`, then the findings, then a `## Summary` line.
> 2. Write candidate findings as JSONL to the assigned candidate path. Use one JSON object per
>    confirmed finding; write an empty file if there are no findings.
> 3. Write the status JSON to the assigned status path, including counts and `status: "ok"` or
>    `status: "error"`.
> 4. Return one terse line in chat: `wrote <raw> <candidates> <status>`.

**Lane-specific schemas override the generic fields above.** The `tests` lane is the notable case:
"Evidence" as *offending code* doesn't fit a *missing* test. A tests-lane finding instead records:
- **Title** · **Lane/Band** · **Severity** (gate-tests rubric) · **Location** (the under-tested
  `file:line` / public symbol) · **Expected behavior + its source** (acceptance criterion / contract
  / docstring — or "no spec source → this is a documentation/spec gap, not a test gap") ·
  **What's missing or wrong** (no test / weak assertion / over-mock / stale fixture / flake) ·
  **Suggested test** (direction) · **Fix locality**. See `lane-catalog.md` → tests.

## Severity rubric (shared across lanes)

| Severity | Meaning |
|---|---|
| Critical | Will cause data loss/corruption/hang/wrong outcome (or, for non-correctness lanes, the lane's equivalent severe failure) under realistic conditions. Must fix. |
| High | Incorrect behavior, crash, or serious degradation under uncommon-but-real conditions. Must fix. |
| Medium | Real issue, hard to trigger or limited blast radius. Should fix; deferrable with acknowledgement. |
| Low | Edge case, latent, defensive-only. Backlog-grade. |
| Info | Not a finding. Do not return Info entries. |

Non-correctness lanes reuse the same five tiers with the lane's meaning of "severe" (a perf
finding's Critical is a dominant hot path; a security finding's Critical is actively exploitable —
defer to the specialist reference's own rubric where it has one).

## Recording findings durably

Per band, do a **spot-check only** — you (the orchestrator), with full context, re-read the cited
code for each finding, drop grep-only or fabricated ones, and dedupe within the band. **Do not run
the multi-round cross-model gauntlet per band** — that fires once at Gate 1, after every lane/band
has scanned (see Verification in SKILL.md). Running it per band would multiply cost and converge on
local context the wider bands haven't seen yet.

Use the artifact ledger in `artifact-ledger.md`:

1. Preallocate unique raw, candidate, and status paths for each scanner before dispatch.
2. After the wave, verify every expected status file exists.
3. Build or refresh the manifest from the per-scanner status files.
4. Spot-check from the saved raw packet and candidate JSONL.
5. Write accepted findings to `accepted/<lane>/<band>.jsonl`.
6. Write the compact inheritance input to `rollups/<lane>/<band>.md`.
7. Write the summary into the altitude story body under `## Findings`, grouped by severity, with
   links to the raw packet(s) and rollup.

Low findings stay under their own advisory heading — not minted as backlog stubs. Advance the story
`implementing → review → done` once its band is scanned, spot-checked, and its artifact rollup is
written.

### Rolling findings up to the next band

The orchestrator reads `rollups/<lane>/<band-below>.md` between bands (scanner agents are stateless) and
injects only the relevant subset into each next-band scanner's brief. The roll-up is
**deterministic by explicit component membership** (defined in the component map — file sets +
parent edges, see `decomposition.md`), not naive path prefix: a band-N component's inherited set =
every confirmed band-(N-1) finding whose `file` is in a child component's file set. A finding in a
file shared by two parents rolls up to **both**; a finding owned by no single higher component goes
to the **cross-cutting bucket** the `system` band always inherits — so nothing is silently dropped.
