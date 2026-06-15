# Artifact Ledger — temporary durable scanner output and rollups

The artifact ledger prevents context loss during large scan campaigns. Scanner output can exceed the
orchestrator's context budget; the filesystem is the source of truth while the campaign is running.
It is **not** a permanent deliverable. After the final scan summary, fix epic, resolved finding
index, and gauntlet ledgers are collated, remove the artifact root.

## Root And Lifecycle

Create the root before Phase 4:

```text
.work/scan-artifacts/scan-<goal>/
  manifest.jsonl
  raw/<lane>/<band>/<component-slug>.md
  candidates/<lane>/<band>/<component-slug>.jsonl
  status/<lane>/<band>/<component-slug>.json
  accepted/<lane>/<band>.jsonl
  rollups/<lane>/<band>.md
  gate1-input.md
  gate1-ledger.md
  fix-draft.md
  gate2-ledger.md
```

Use stable lowercase slugs for components. If two components slug the same, prefix with the story's
component index: `003-parser.md`.

The repo should ignore `.work/scan-artifacts/`. Do not force-add it. These files are local recovery
state, not release artifacts.

Lifecycle:

1. Create the root before scanner fan-out.
2. Let scanners write their assigned raw/candidate/status files.
3. Collate accepted findings, rollups, Gate 1/Gate 2 inputs, and ledgers from those files.
4. Copy the durable summary into `.work/` scan/fix item bodies:
   - scan epic campaign record
   - altitude story findings and coverage gaps
   - fix epic audit summary
   - fix epic resolved finding index
   - fix feature/story finding citations and gauntlet constraints
5. Delete `.work/scan-artifacts/scan-<goal>/`.
6. Commit only the collated `.work` item updates. The final git tree should not keep raw scanner
   packets.

## Write Order

1. Before dispatch, the orchestrator creates the directories and assigns each scanner unique
   `raw`, `candidates`, and `status` paths.
2. Each scanner writes only those assigned files and returns one terse chat line naming them.
3. No scanner writes `manifest.jsonl`, story bodies, rollups, gate packets, source files, or another
   scanner's paths.
4. At the band checkpoint, the orchestrator verifies every expected `status` file exists.
5. The orchestrator rebuilds or appends `manifest.jsonl` from status files; no concurrent appends.
6. The orchestrator spot-checks candidate findings from disk, not from chat.
7. Accepted findings go to `accepted/<lane>/<band>.jsonl`; inheritance summaries go to
   `rollups/<lane>/<band>.md`.
8. Link raw packet directories, accepted findings, and rollups from the altitude story body.
9. For long-running campaigns, commit after each completed altitude story or approved checkpoint,
   but commit only collated `.work` item updates. Do not force-add `.work/scan-artifacts/`.

If context compacts, resume by reading `manifest.jsonl`, the current altitude story body, and the
needed `rollups/` files. Do not ask scanners to regenerate packets that already exist.

## Status And Manifest Schema

Each scanner writes one status file:

```json
{"scan":"scan-goal","lane":"correctness","band":"leaf","component":"parser","story":"scan-goal-correctness-leaf","status":"ok","raw_packet":".work/scan-artifacts/scan-goal/raw/correctness/leaf/parser.md","candidates":".work/scan-artifacts/scan-goal/candidates/correctness/leaf/parser.jsonl","counts":{"critical":0,"high":2,"medium":1,"low":0},"coverage_gap":false}
```

Use `status: "error"` and `coverage_gap: true` for scanner failures; include a short `error` string
and still write the status file. The orchestrator writes `manifest.jsonl` from these status files at
the checkpoint. Missing status files are coverage gaps too; record them in the story body and
manifest with `status: "missing"`.

## Raw Packets

Raw packets are scanner-authored markdown with a short metadata header:

```markdown
---
scan: scan-<goal>
lane: <lane>
band: <band>
component: <component-slug>
story: scan-<goal>-<lane>-<band>
status: ok
---

# Raw scanner packet: <lane>/<band>/<component>

<scanner output verbatim>
```

Do not edit scanner prose after writing it. Corrections belong in accepted findings and gauntlet
ledgers so the raw record remains auditable.

## Candidate And Accepted Findings

Each scanner writes candidate findings to its assigned `candidates/.../<component>.jsonl`. One JSON
object per finding; write an empty file for no findings:

```json
{"fingerprint":"src/parser.rs:42|correctness|null-handling","severity":"High","lane":"correctness","band":"leaf","component":"parser","location":"src/parser.rs:42","title":"Parser accepts empty owner","fix_locality":"local","raw_packet":"raw/correctness/leaf/parser.md","rationale":"Confirmed by reading the branch that bypasses owner validation."}
```

The fingerprint is the idempotency key for in-campaign dedupe. The orchestrator writes
spot-checked survivors to `accepted/<lane>/<band>.jsonl`, preserving `raw_packet` and adding
`accepted_by: "orchestrator-spot-check"` plus any drop reason for rejected candidates in the gate or
campaign ledger.

## Rollups

`rollups/<lane>/<band>.md` is the compact input for the next altitude band:

- counts by severity
- accepted finding fingerprints
- `file:line` + title + one-line rationale
- inherited parent/cross-cutting bucket assignment
- coverage gaps

The next band receives the relevant rollup excerpt, not every raw packet.

## Gate Packets

Before Gate 1, concatenate accepted findings into `gate1-input.md` with links to raw packets and
rollups. Reviewers get that path. After each round, write `gate1-ledger.md`.

Before Gate 2, write the proposed fix epic and child item bodies to `fix-draft.md`. Reviewers get
that path. After each round, write `gate2-ledger.md`.

## Cleanup Gate

Do not delete the artifact root until all of these are true:

- `fix-<goal>` exists or the user explicitly declined fix emission.
- The scan epic's `## Campaign record` includes counts by lane/severity, coverage gaps, contested
  findings, gauntlet outcomes, and whether a fix epic was emitted.
- The fix epic's `## Audit summary` and `## Resolved finding index` contain the survivors that drove
  the remediation plan.
- Each emitted fix feature/story cites the findings it resolves and the relevant gauntlet
  constraints.

Then delete `.work/scan-artifacts/scan-<goal>/`. If the campaign is abandoned before collation,
either resume and collate first or ask the user before deleting the only raw evidence.
