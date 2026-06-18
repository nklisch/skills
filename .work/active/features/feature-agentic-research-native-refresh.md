---
id: feature-agentic-research-native-refresh
kind: feature
stage: implementing
tags: [skill]
parent: epic-agentic-research-reengagement
depends_on: [feature-agentic-research-refresh-entry]
release_binding: null
gate_origin: null
created: 2026-06-18
updated: 2026-06-18
---

# ARD-native refresh — drive the refresh-entry from acquisitions + staleness

## Brief

The **ARD-native front-half** of the re-engagement epic. Where `convert-bootstrap` handles
research authored *outside* ARD, this feature handles research authored *under* ARD that has
gone stale or has new acquisitions to fold in. Web sources update fast; an ARD artifact's
substrate drifts out from under it, and the orchestrator already emits acquisition targets
that complete held claims — so the trigger machinery largely exists. This feature **wires
those existing triggers to the refresh-entry**, it does not rebuild them.

Existing seams this feature consumes (all verified present in the plugin):
- **Acquisition offgas** (`templates/acquisitions.md`) — the orchestrator writes candidate
  sources at synthesis-time; the **`Completes:` join** records "acquired source → exactly
  these held claims to re-engage." That join *is* the enrichment worklist.
- **`enriching` urgency + the proactive lookout** — candidates that deepen the corpus without
  blocking; the standing signal that a refresh would add value.
- **`AQ.2 substrate-check`** staleness-diff (`catalogs.json` decision point) — on finding
  prior substrate, diff it against current sources; a stale diff fires a refresh.
- **`research-acquisition-queue`** — acquisitions already promote into `.work/`,
  operator-confirmed.

The deliverable: when an acquisition lands (or substrate goes stale), re-engage the held
claims it completes by handing the affected ARD-native artifact to the refresh-entry
(register `refresh` + `supersedes-prior`, re-author over the now-current sources).

## Epic context

- Parent epic: `epic-agentic-research-reengagement`
- Position: ARD-native front-half. `depends_on: [feature-agentic-research-refresh-entry]` —
  it drives the shared primitive; it cannot re-author without the doorway.

## Design decisions

- **Lint-shaped DETECTOR, not an operator-invoked skill.** The reframing that drives the design:
  the operator **cannot be the trigger** — they have no way to *know* a refresh is warranted
  (whether a previously-failed fetch is now re-acquirable, or whether a live source's content has
  drifted since its attestation, is invisible to them). So a "remember to run the refresh skill"
  shape is wrong. The detector runs **mechanically as a check, like `lint-citations.py`** — the
  operator's existing lint habit surfaces it; they don't have to think to trigger it.
- **Detect + surface; the operator batch-triages; refresh-entry fires on accept.** The auto/manual
  line: detection is **automatic** (solves "operator doesn't know to look"); **mutation stays
  operator-confirmed** (refreshes *supersede* durable authoritative artifacts — the most
  consequential write in the substrate, and the epic held operator-confirmed-writes throughout).
  The check **writes nothing** — it produces a batch worklist + exit code. The operator triages the
  batch (drop genuinely-dead sources, accept re-acquisitions / drifts); accepted items drive
  refresh-entry. *Chosen over auto-firing on "clear-cut" cases* because (a) the hard, missing part
  is **detection**, which this automates; (b) the queue-drain is inherently a batch human-judgment
  step ("dead for good vs temporarily down?"), so auto-firing splits the picture rather than scaling
  it; (c) auto-mutating durable substrate breaks the non-erodable write-safety floor the whole ARD
  discipline fences (a source that 200s with changed content, or a transient revival, would silently
  rewrite authoritative research); (d) detect-surface is the **strictly more extensible MVP** — an
  opt-in `--auto-accept` policy for a narrow characterized case can bolt on later, but you cannot
  walk back from auto-firing once downstream assumes it. Start strict, loosen on evidence (mirrors
  the verification stack's own "escalate on evidence, never prune below the floor").
- **One mechanism, TWO detectors, one worklist — keyed on `source_handle`, the one join that IS
  machine-resolvable.** Staleness is the second detector bolted into the same scan (per the
  operator's reframe). **Critical substrate finding (design peer-review):** the joins this feature
  needs are mostly NOT machine-readable today — `Completes:` is **free-form prose** and
  acquisitions.md states **"no link back to the queue."** There is **no claim→artifact index**. So
  the detector keys on what IS resolvable: **`source_handle`** — the lint already resolves
  `[handle]{N}` citations to the citing artifact (`lint-citations.py` `--stats` does the by-handle/
  by-file deployment audit). The two detectors:
  1. **Acquisition flow-back** — for a queue `blocking` entry whose source maps to a `source_handle`
     (via the attestation/INDEX the entry's `Grounded-by`/handle names), re-probe the source; if it
     now fetches, the artifacts that **cite that handle** (resolved through the lint's handle→file
     map) are the refresh targets. Where a queue entry carries **no resolvable handle** (free-form
     `Completes:` only, no `Grounded-by`), the scan **cannot name the artifact** — it emits a
     `needs-artifact-binding` finding for the operator/queue to supply, rather than guessing. *(The
     `Completes:` join is template-only today; this feature builds the handle-keyed read AND surfaces
     the un-bindable entries as a queue-hygiene finding.)*
  2. **Staleness** — for each ARD-native attestation (`source_handle` + `source_url` + `fetched`),
     re-probe source liveness/change; the artifacts citing that handle are the targets. This path is
     **fully machine-resolvable** (attestations carry `source_handle`), unlike the free-form queue.
- **The queue-drain is the point — but the gating relation is NOT auto-mutated.** The standing
  `research-acquisition-queue` is append-only, dedup-by-source — `blocking` candidates accumulate and
  represent **acquisition-gated claims**. **Peer-review correction:** there is **no `depends_on`-style
  machine relation** from a queue source to the gated claims (the `.work/` gating model is
  work-item-id `depends_on`; acquisition promotion only merges by source, no backlink). So the scan
  does **not** "unlock downstream" by mutating a dependency — it **surfaces** the drain worklist
  (which `blocking` sources are now re-acquirable vs still-dead), and the operator's triage +
  subsequent refresh-entry re-authoring is what actually re-grounds the held claims. The "unlock" is
  the *operator's* batch action informed by the scan, not an automatic graph edit. The scan's job is
  to make the drain **visible and actionable**, not to perform it.
- **Staleness depth = source-liveness + change probe, reusing refresh-entry's `ard-native`
  re-validation.** Staleness uses the *same* probe refresh-entry's `ard-native` re-validation
  already defines (probe `source_url` liveness; dead/moved/changed = candidate) — no parallel
  content-differ. *Chosen over* a full re-fetch-and-content-diff of every source (heavy, duplicates
  re-validation) *and over* a pure TTL/time heuristic (crude — flags fresh-but-old artifacts, misses
  recently-changed sources). A TTL pre-filter MAY cheaply narrow the probe set, but the liveness/
  change probe is the decision.

## Open questions (resolved above)

The two scope-time questions are resolved: staleness is the **second detector in this feature** (not
separable); the trigger is a **lint-shaped check script** (not an operator-invoked skill / not an
orchestrator walk step) — mechanical detection, operator-confirmed mutation.

## Other agent review (cross-model design peer-review, GPT-5.5 via peeragent)

Per the "peer-review the design first" decision, a cross-model design loop (Codex/GPT-5.5 through
peeragent) ran before implementation. **It was the highest-value review of the epic** — pass 1
caught four blockers, all verified against source, exposing a *foundational* substrate gap the
original "just wire the triggers" framing missed:

- **Pass 1 — has-blockers (4 + 2 important).** All verified and accepted: (B1) the worklist couldn't
  name a refresh target — `Completes:` is free-form prose with "no link back to the queue", yet
  refresh-entry *requires* `prior_artifact_path`; (B2) `stale-dead` action was wrong — refresh-entry
  says a dead *cited* source → gap+offgas, not a queue drop; (B3) "unlock downstream" was hand-waved
  — there's no `depends_on` relation from a queue source to gated claims; (B4) the staleness taxonomy
  omitted `live-unverifiable`/`probe-failed` from the class contract. Plus: `enriching` promised but
  not detected; probe SSRF underspecified vs the lint's existing fence. The fix reshaped the feature:
  key on **`source_handle`** (the one machine-resolvable join), split dead-source actions by kind,
  reframe "unlock" as operator-mediated, make the informational classes first-class, reuse the lint's
  SSRF fence, and emit `needs-artifact-binding` where the substrate can't name a target.
- **Pass 2 — VERDICT: sound-to-implement.** All four blockers + both important RESOLVED; no new
  findings. One minor note (make the exit policy explicit so informational classes never become
  refresh candidates) — applied.

Nothing accepted on faith — each blocker re-verified against `acquisitions.md`, `refresh-reengagement.md`,
`attestation.schema.json`, the `.work/` gating model, and `lint-citations.py` before applying. The
loop turned an under-scoped "wiring" design into an honestly-scoped detector that respects the
substrate's real (limited) machine-readable joins.

## Architectural choice

A **zero-dependency Python check script** at `plugins/agentic-research/scripts/refresh-scan.py`,
alongside `lint-citations.py` — same surface the citation lint runs in (CI, pre-release gate,
manual), cross-harness and testable, no Claude dependency. It re-probes the standing acquisition
queue + the cited sources of ARD-native artifacts, classifies each candidate, and prints a **batch
worklist** + an exit code. It **writes nothing** to `.research/` (detection only). A thin
operator-facing wrapper (the migration/refresh report) drives `refresh-entry` per accepted item.

This mirrors the plugin's established tool shape: `lint-citations.py` (zero-dep, data-sourced,
report + exit code) and `ard-sync.py` (zero-dep drift-check, report + plan, operator applies). The
refresh-scan is a third tool in that family — *detects + reports + guides; the operator applies and
refresh-entry is the gate*.

Rejected: (a) a **skill** the operator invokes — reintroduces the exact "operator has to know to
trigger it" problem the lint-shape solves; (b) an **orchestrator walk step** — couples enrichment to
a running engagement, but acquisitions/drift arrive *between* engagements; (c) **auto-firing
refreshes** — breaks the operator-confirmed-durable-write floor (see Design decisions); (d) a
**parallel content-differ** for staleness — duplicates refresh-entry's `ard-native` re-validation.

## Implementation Units

A code unit (the script + its test) plus a thin doc/wiring unit. The script is the trickiest —
design it first.

### Unit 1: `scripts/refresh-scan.py` — the detector (zero-dep CLI)
**File**: `plugins/agentic-research/scripts/refresh-scan.py`
```
python3 refresh-scan.py [--research-dir .research] [--queue <path>] [--ttl-days N] [--format text|json]
  --research-dir   the .research/ root (default: .research)
  --queue          the research-acquisition-queue backlog item (default: discover in .work/backlog/)
  --ttl-days       optional cheap pre-filter: only probe sources whose attestation `fetched` is
                   older than N days (the liveness/change probe is still the decision)
  --format         text (default) | json
  exit 0 = nothing to refresh · 1 = candidates found · 2 = error (bad paths/inputs)
```
Behavior:
1. **Build the handle→artifact map** — reuse the lint's citation resolution (`lint-citations.py`
   `--stats` by-handle/by-file deployment audit) to know which artifacts cite each `source_handle`.
   This is the join that makes a source-level signal nameable as an artifact refresh target.
2. **Load the acquisition queue** (`research-acquisition-queue` backlog item) — its `blocking` and
   `enriching` entries. A `blocking` entry is self-grounding (a fetch was attempted + failed);
   `enriching` carries a `Grounded-by` handle. (`Completes:` is free-form prose — used as
   human-readable context in the report, NOT parsed as the machine join.)
3. **Detector A — acquisition flow-back (both urgencies).** For each queue entry, **SSRF-fenced
   re-probe** the source:
   - **`blocking`** (self-grounding; a fetch failed): if it now fetches → resolve to a `source_handle`
     (the entry's named handle, or an attestation whose `source_url` matches) → artifacts citing that
     handle are the refresh targets → `now-re-acquirable`.
   - **`enriching`** (the proactive lookout; carries a `Grounded-by` anchor): if the source is
     fetchable and would deepen the claims its `Grounded-by` handle anchors → `enriching-available`
     candidate (a *lower-priority* refresh — it deepens, doesn't unblock). The operator triages these
     after the blocking drain.
   - If an entry has **no resolvable handle** (free-form `Completes:` only, no `Grounded-by`/handle) →
     emit `needs-artifact-binding` (queue-hygiene finding; the scan does not guess the target).
4. **Detector B — staleness.** For each ARD-native attestation (`source_handle`, `source_url`,
   `fetched`; optional `--ttl-days` pre-filter), **SSRF-fenced probe** of liveness + change (reusing
   refresh-entry's `ard-native` re-validation semantics — named, not re-invented):
   - dead (404/removed) → **`stale-dead`**;
   - live + changed since `fetched` (per `Last-Modified`/`ETag`, or content-hash where a snapshot
     exists) → `stale-drifted`;
   - live + provably unchanged → `unchanged` (no candidate);
   - live but change **not determinable** (no `Last-Modified`/`ETag`/snapshot) → `live-unverifiable`
     (reported, operator decides — NEVER a fabricated `unchanged` or `drifted`);
   - probe error / network failure → `probe-failed` (fail-open, surfaced, re-probed next run).
   The artifacts citing that handle are the targets.
5. **Classify + report — actions split by SOURCE KIND (peer-review correction).** One batch worklist;
   the action differs by whether the dead/changed source is a *queue entry* or a *cited attestation*:
   - **queue `blocking` source** that is **still dead** → a **queue-drain** candidate: the operator
     may drop it from the standing queue (a queue-hygiene action on the `.work/` backlog item).
   - **cited attestation source** that is **`stale-dead`** → **NOT a queue drop**. Per refresh-entry,
     a dead *cited* source becomes a **gap**: mark the claim a gap, attempt a replacement, and emit
     it to the acquisition offgas (a dead cited source is a new acquisition candidate, never a silent
     drop). The scan reports this as a `gap-emit` action, deferring to refresh-entry's dead-source
     handling — it does not invent a drop.
   - `now-re-acquirable` / `stale-drifted` → refresh candidates (drive refresh-entry).
6. **Exit + guide** — the report closes with the operator triage step and, per refresh candidate, the
   `refresh-entry` call shape (`{prior_artifact_path, input_state: ard-native, completes_claims?,
   intended_output_kind?}`). The script **fires nothing** — it guides. `completes_claims` is populated
   only where a machine-resolvable claim scope exists; otherwise the refresh targets the whole artifact.
   **Class → role is explicit (no accidental refresh candidates):** only `now-re-acquirable` /
   `stale-drifted` / `enriching-available` are **refresh candidates**; `stale-dead` is a **gap-emit**;
   queue-still-dead is a **queue-drain**; `needs-artifact-binding` is a **queue-hygiene** finding; and
   `live-unverifiable` / `probe-failed` / `unchanged` are **informational only — NEVER refresh
   candidates** (they carry no refresh action). The exit code counts only the actionable classes:
   exit 1 iff ≥1 refresh-candidate / gap-emit / queue-drain / needs-artifact-binding exists;
   informational-only results (or a clean substrate) → exit 0. The code + tests assert that an
   informational class never appears in the refresh-candidate list.
**Implementation notes**: stdlib only (`argparse`, `json`, `urllib`, `os`, `re`, `datetime`,
`hashlib`). **Reuse `lint-citations.py`'s SSRF-hardened probe verbatim** (scheme allow-list to
http(s); resolved host must be a public IP — no loopback/link-local/private; bounded redirects) —
attestations are vendored substrate a hostile source could seed (lint-citations.py SSRF fence). The
"change since fetched" probe is best-effort and **honest** — `live-unverifiable` when undeterminable,
never a fabricated verdict. **Fail-open** on probe errors (`probe-failed`, never a crash).
**Acceptance**:
- [ ] Builds the handle→artifact map (reusing the lint's resolution); names refresh targets by `source_handle`
- [ ] Detector A: re-probes queue `blocking` entries → `now-re-acquirable` (resolvable handle) or `needs-artifact-binding` (no handle)
- [ ] Detector B: probes ARD-native attestations → `stale-dead` / `stale-drifted` / `unchanged` / `live-unverifiable` / `probe-failed` (all first-class)
- [ ] Actions split by source kind: queue-still-dead → queue-drain; cited `stale-dead` → `gap-emit` (NOT queue drop), per refresh-entry
- [ ] SSRF fences reused from `lint-citations.py` (scheme/host/redirect); writes nothing to `.research/`; exit 0/1/2; `--format json` mirrors text
- [ ] Fail-open (`probe-failed`); `live-unverifiable` never fabricated to `unchanged`/`drifted`; zero third-party imports

### Unit 2: `scripts/tests/test_refresh_scan.py` — subprocess-cli-harness test
**File**: `plugins/agentic-research/scripts/tests/test_refresh_scan.py` (+ tempdir fixtures)
Build a fake `.research/` (attestations with `source_handle`/`source_url`/`fetched` + artifacts
citing those handles) + a fake acquisition-queue in a TempDir; **stub the source probe** (inject a
fake fetcher so the test is offline/deterministic — no real network). Scenarios cover every class:
`now-re-acquirable` (blocking source now fetches, handle resolves); `needs-artifact-binding` (queue
entry, no resolvable handle); `enriching-available`; cited `stale-dead` → `gap-emit` (NOT a queue
drop); queue-still-dead → queue-drain; `stale-drifted`; `unchanged` (exit 0); `live-unverifiable`
(live, no Last-Modified/ETag/snapshot); `probe-failed` (fail-open). Plus an **SSRF-fence** scenario:
an attestation with a `file://` or private-IP `source_url` is refused by the probe (not fetched).
Zero-dep, `python3`.
**Acceptance**:
- [ ] Every class emitted in its scenario; exit 0 when nothing, 1 when candidates, 2 on error
- [ ] cited `stale-dead` produces `gap-emit`, NOT a queue-drop (the peer-review-corrected action split)
- [ ] `live-unverifiable` emitted when change is undeterminable (never silently `unchanged`)
- [ ] Informational classes (`live-unverifiable`/`probe-failed`/`unchanged`) never appear as refresh
      candidates and don't trip exit 1 on their own (the exit-policy assertion)
- [ ] SSRF fence scenario: non-public-http `source_url` refused (proves the lint fence is reused)
- [ ] The source probe is injectable/stubbed — the test makes no real network call
- [ ] Zero third-party imports

### Unit 3: doc + wiring — surface the detector + the drain loop
**Files**: `plugins/agentic-research/docs/HANDOFF.md` (or `ARCHITECTURE.md`) — document the
acquisition-queue **drain loop** (offgas accumulates `blocking` → refresh-scan detects
re-acquirable/stale → operator batch-triages → refresh-entry re-engages the completing claims →
downstream unblocks); the plugin README tool list; and a one-line pointer from the orchestrator's
`## Acquisition offgas` section to `refresh-scan.py` as the drain mechanism (the offgas writes the
queue; refresh-scan drains it).
**Acceptance**:
- [ ] The drain loop is documented end to end (offgas → scan → triage → refresh-entry → unblock)
- [ ] README tool list + orchestrator offgas-section pointer name `refresh-scan.py`
- [ ] Plugin version bump noted as a post-merge step (`./scripts/bump-version.sh agentic-research <major|minor|patch>` — `minor`)

## Implementation Order
1. Unit 1 (`refresh-scan.py` — the detector; trickiest: the two-detector classify + fail-open probe)
2. Unit 2 (the subprocess test with the stubbed probe — validates it offline)
3. Unit 3 (doc the drain loop + wiring)
Then **smoke it against the live repo's own `.research/`** — it should report `unchanged` for a
healthy substrate (exit 0), the inverse of a real detection.

## Testing
- **Unit/CLI**: `test_refresh_scan.py` — the full class set + SSRF fence, stubbed probe, subprocess.
- **Live smoke**: `refresh-scan.py --research-dir .research` on this repo → exit 0 / `unchanged` or
  `live-unverifiable` (the repo's substrate is healthy); mutating a fixture attestation `source_url`
  to a dead URL → a `stale-dead` → `gap-emit` candidate.
- **Hand-off contract match** — the guided `refresh-entry` call shape matches the contract exactly
  (`input_state: ard-native`, `completes_claims?` scoped, optional `intended_output_kind`). Unlike
  convert, native-refresh passes **`ard-native`** (these artifacts have a clean chain to revalidate),
  never `legacy`.
- **Action-split** — a dead *cited attestation* source produces `gap-emit` (per refresh-entry), a
  dead *queue* source produces queue-drain — the two never collapse to one "drop" action.
- **SSRF fence** — a non-public-http `source_url` (`file://`, private IP) is refused, proving the
  `lint-citations.py` fence is reused, not re-invented loosely.
- **No writes** — confirm the script touches nothing under `.research/` (detection only); a
  read-only-filesystem run still produces the worklist.

## Risks
- **No machine-readable claim→artifact / queue→artifact join exists (the load-bearing constraint,
  surfaced in design peer-review).** `Completes:` is free-form prose; acquisitions.md states "no link
  back to the queue"; there is no claim-id index. The scan therefore keys on **`source_handle`** (the
  one resolvable join — reusing the lint's `[handle]{N}`→file resolution) and **cannot** name a target
  for a queue entry with no resolvable handle. Mitigation: such entries are reported as
  `needs-artifact-binding` (a queue-hygiene finding the operator resolves), never guessed. This is why
  the feature *builds a handle-keyed read*, not a `Completes:`-prose parse.
- **Drift detection is best-effort.** Without a stored content snapshot, "changed since fetched" is
  only inferrable from HTTP metadata (`Last-Modified`/`ETag`), which many sources omit. Mitigation:
  `live-unverifiable` is a **first-class class**, reported honestly — never a false `unchanged`/
  `drifted`; the operator decides. (Future enhancement: attestations store a content hash at fetch
  time, making drift exact — parked, not this feature.)
- **The "unlock downstream" relation is operator-mediated, not an auto graph edit (peer-review
  correction).** There is no `depends_on` machine relation from a queue source to gated claims. The
  scan surfaces the drain worklist; the operator's triage + refresh-entry re-authoring re-grounds the
  claims. The scan never mutates a dependency graph or the queue itself.
- **Dead cited source ≠ queue drop (peer-review correction).** Per refresh-entry, a dead *cited*
  source becomes a **gap + acquisition offgas**, never a silent drop. The scan emits `gap-emit` and
  defers to refresh-entry's dead-source handling; only standing *queue* entries are drop candidates.
- **Probe SSRF.** The script makes outbound requests to substrate-controlled URLs. Mitigation: reuse
  `lint-citations.py`'s SSRF fence **verbatim** (http(s)-only scheme, public-IP-only host, bounded
  redirects) — covered by the SSRF test scenario.
- **Network flakiness.** Probing live sources is slow/flaky. Mitigation: fail-open (`probe-failed` per
  source, never a crash), a `--ttl-days` pre-filter to bound the probe set; the script is advisory (a
  missed probe surfaces next run).
- **Auto/manual line must hold.** The script must never write `.research/` or fire refresh-entry
  itself — that would break the operator-confirmed-write floor. Mitigation: the script has no write
  path at all (detection only); refresh-entry is invoked operator-side from the worklist. Covered by
  the "no writes" test.
- **Touches refresh-entry's `ard-native` re-validation logic.** Staleness reuses that probe; if the
  two drift apart, the scan and the actual refresh disagree on "stale." Mitigation: the scan
  references refresh-entry's re-validation definition as the single source of the probe semantics
  (named in the doc), not a re-implementation with different rules.
