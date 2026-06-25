---
id: feature-collapse-ard-version-into-plugin-semver
kind: feature
stage: review
tags: [plugin, docs]
parent: null
depends_on: []
release_binding: null
gate_origin: null
created: 2026-06-25
updated: 2026-06-25
---

# Collapse the independent ARD content-version into the plugin SemVer

## Brief

ARD now lives only inside the `agentic-research` plugin (`ard-core/`) — the separate
framework repo and the dual-pin were retired when ARD was absorbed (commits #25/#26). Tracking a
second internal version (an ARD content snapshot `0.7.0` next to the plugin's package SemVer
`0.6.2`) no longer earns its place: there is no external ARD consumer left, and a reader has to
reconcile two numbers that move on different cadences for the same artifact.

**Settled decision (operator-confirmed 2026-06-25): fully collapse to the plugin SemVer.** The
plugin's own SemVer becomes the single version everywhere. The independent `0.7.0` content
snapshot retires as a *live* version; ARD's pre-absorption numbering line (v0.1 → v0.7) is frozen
as historical provenance, not carried forward. Scope is plugin-internal (`plugins/agentic-research/`);
nothing outside the plugin pins ARD's version any more (no `ard.json`, no submodule dual-pin).

## Strategic decisions

- **How far does the collapse go?**: Fully collapse to plugin SemVer — remove the independent
  `0.7.0` content snapshot entirely, rather than retiring the stamp but keeping a separate
  discipline-CHANGELOG number, or keeping the dual version and merely documenting it. Rationale:
  with no external ARD consumer, a second number for the same artifact is pure reconciliation cost;
  `docs/VERSIONING.md` already declares "one release version: the plugin's own SemVer", so this
  finishes a collapse that was already most of the way done.

## Grounding — the state on disk is further along than this item's origin read

Investigation (2026-06-25) found the dual-version is **already mostly decoupled**, which narrows the
work and rules out the "it's load-bearing, tread carefully" framing the backlog note implied:

- `docs/VERSIONING.md` **already** states the policy: *"ARD versions with the plugin. There is one
  release version: the plugin's own SemVer."* The release-version decision is made; this feature
  removes the residual passive snapshot and makes the doc match reality.
- The `ARD-Version: 0.7.0` stamp is **already** documented as *"passive metadata, not an enforced
  pin — nothing keys off it, no drift check runs against it."* Verified true.
- **Nothing reads `catalog_baseline` or `x-ard-version` as logic.** They are generated/recorded
  values, not active gates. `conformance/run.py`'s "baseline" means a *check group* (citation
  statuses), not a version baseline — it never validates against `0.7.0`.
- `gen-contract.py` **parses** the `(v0.7.0)` title from `CATALOGS.md` into `catalog_baseline`
  (line ~180-183). This is the one piece of active logic touching the version — it changes when the
  title version is dropped.

## Two categories of `0.7.0` occurrences — handle differently

This is **not** a blind find-replace. Two distinct categories:

### Category A — live version machinery (REMOVE / rework — this is the collapse)

- The 10 `ARD-Version: 0.7.0` stamps: `kernel/discipline.md`, `kernel/README.md`,
  `kernel/lint-citations.py`, `kernel/conformance/run.py`, `kernel/conformance/README.md`,
  `tools/gen-contract.py`, and `kernel/templates/{INDEX,attestation,dispatch,precis}.md`.
- `kernel/catalogs.json` `catalog_baseline: "0.7.0"` (generated — see gen-contract below).
- `kernel/schema/attestation.schema.json` `x-ard-version: "0.7.0"`.
- `SPEC.md:3` `**Snapshot 0.7.0**`.
- `CATALOGS.md:1` title `# ARD — Baseline Catalogs (v0.7.0)` and `CATALOGS.md:280` footer
  `*This catalog is the v0.7.0 baseline.*`.
- `tools/gen-contract.py` `build()` regex that parses the `(v0.7.0)` title into `catalog_baseline`
  — rework so dropping the title version does not break contract generation, and so
  `gen-contract.py --check` still passes against the regenerated `catalogs.json`.

### Category B — historical evolution provenance (PRESERVE as frozen labels — do NOT erase)

These record *when* a shape/field was added during ARD's pre-collapse life. They are legitimate
archaeology; erasing them loses real history. They become references to a now-frozen historical
numbering line (v0.1 → v0.7), not a live version:

- `CATALOGS.md` / `SPEC.md` inline narration ("v0.7 adds `AQ.4`…", "v0.1 carried fourteen across
  six loci…", "the cut otherwise remains provisional…").
- `evidence/ledger.md`, `evidence/README.md` "v0.7 grounding entries / v0.7 peer review confirmed".
- `theory/COMMITMENTS.md` "**v0.7.0 additions** — grounding noted…".
- `theory/positions/registration-schema-store-pole-earns-its-place.md` "grew from nine to ten in
  v0.7.0".

Design must keep A and B cleanly separated. A reasonable framing: A is "what version is this?"
(retired — answer is the plugin SemVer); B is "when in ARD's history did X land?" (preserved —
answer is a frozen v0.X label).

## Doc rework

Rewrite `docs/VERSIONING.md` to describe the **single-version world**:
- Drop "The ARD-Version stamp" section (the stamps are gone).
- Keep / sharpen the "discipline change → which SemVer axis" mapping (a new catalog member is
  patch/minor; a `[handle]{N}` wire-form or normative-minimum attestation change is major).
- Add a short note framing v0.1 → v0.7 as the **historical ARD numbering line, now frozen** — so a
  future reader who finds "v0.7" in CATALOGS/ledger/COMMITMENTS understands it as pre-collapse
  history, not a live parallel version.

## Verification (must hold after the change)

- `python3 plugins/agentic-research/ard-core/kernel/conformance/run.py` → passes (currently 57/57).
- `python3 plugins/agentic-research/ard-core/tools/gen-contract.py --check` → in sync.
- No remaining *active* `0.7.0` version value in Category A surfaces; Category B history intact.
- **Broad token sweep** (the real net — per cross-model review, not just the `ard-core` grep):
  `rg "ARD-Version|x-ard-version|catalog_baseline|Snapshot 0\.7\.0|v0\.7\.0 baseline" plugins/agentic-research`
  returns nothing. (Bare `v0.7` / "v0.7 adds…" Category-B history will still match a looser grep —
  that's expected and correct; this token list targets only the live-machinery phrasings.)

## Coordination note (not a dependency)

`story-record-refresh-verification-scope` references `SPEC.md:221` by line number, and
`theory/COMMITMENTS.md` cites SPEC sections by anchor. Removing `SPEC.md:3` (`Snapshot 0.7.0`)
shifts SPEC line numbers by one. Not a `depends_on` (the two items are independent per the original
note), but design/implement should sanity-check any line-number references after editing SPEC.md.

## Design decisions

No open ambiguities — the directional call is settled (operator: fully collapse) and the
investigation above pins the mechanism. Two implementation-level calls, decided here:

- **`catalog_baseline` disposition**: drop the key from the generated contract entirely (remove the
  title-version regex from `gen-contract.py` `build()`), rather than retaining it pointed at the
  plugin SemVer. Rationale: nothing reads it; a value pointed at the SemVer would just be a second
  copy of the manifest version drifting out of sync. The contract loses a dead field.
- **`x-ard-version` disposition**: remove the field from `attestation.schema.json`; keep
  `x-ard-tier`. Rationale: nothing validates against it; the schema's own `description` already
  states the normative-minimum "changes only on a MAJOR bump" — the SemVer-axis semantics live in
  the prose, not in a decorative version field.

## Architectural choice

**Single-stride feature, no child stories.** The change is tightly cohesive — every edit is a
mechanical removal/rewrite of the same retired version concept, and all of it is verified by the
same two gates (conformance `run.py`, `gen-contract.py --check`) plus the grep. There is no
parallelizable fan-out, no internal dependency chain, and no heterogeneous acceptance surface that
would pay for story decomposition. Per the design-family decomposition heuristics, stories would be
pure overhead here. The feature is its own implementation unit.

## Implementation units

All paths under `plugins/agentic-research/`.

### Unit 1 — Remove the 10 `ARD-Version:` stamps AND the prose that describes them
Strip the stamp line from each: `ard-core/kernel/discipline.md`, `kernel/README.md`,
`kernel/lint-citations.py`, `kernel/conformance/run.py`, `kernel/conformance/README.md`,
`tools/gen-contract.py`, `kernel/templates/{INDEX,attestation,dispatch,precis}.md`.
- Markdown stamps are an HTML comment on line 1 (`<!-- ARD-Version: 0.7.0 -->`); remove the line.
- Python stamps are a `# ARD-Version: 0.7.0` comment near the top (after the SPDX line); remove the
  comment line, leave SPDX + shebang intact.

**Also remove the prose that explains the stamp** (a stamp-line removal that leaves dangling
"the stamp above…" prose is incomplete — caught by the cross-model review):
- `ard-core/kernel/README.md` — delete the whole `## Snapshot stamp` section (~lines 60-66+, "Every
  file here carries a passive `ARD-Version:` stamp…").
- `ard-core/kernel/discipline.md` — remove the trailing parenthetical aside on the propagation
  paragraph: *"(The `ARD-Version` stamp above is passive snapshot-version metadata, not an enforced
  fence.)"* Leave the rest of that paragraph intact.
- `plugins/agentic-research/templates/acquisitions.md` — **outside `ard-core/`** (an `ard-core`-only
  grep misses it). The header comment says "(carries no ARD-Version stamp)"; reword to drop the
  stamp reference — e.g. "a deployment artifact, not part of the ARD core surface." (The *point* of
  that aside — that this file isn't ARD-core — survives; only the now-retired stamp concept goes.)

- **Acceptance:** `grep -rln "ARD-Version" plugins/agentic-research` returns nothing (note: whole
  plugin, not just `ard-core` — the acquisitions template lives outside it).

### Unit 2 — Drop `catalog_baseline` from the generated contract
**File:** `ard-core/tools/gen-contract.py` — in `build()`, remove the `m = re.search(...title...)`
line and the `"catalog_baseline": ...` entry from the returned dict. Then regenerate:
`python3 ard-core/tools/gen-contract.py` (rewrites `kernel/catalogs.json` without the key) and
commit the regenerated JSON.
- **Acceptance:** `kernel/catalogs.json` has no `catalog_baseline`; `gen-contract.py --check` exits 0.

### Unit 3 — Remove `x-ard-version` from the schema
**File:** `ard-core/kernel/schema/attestation.schema.json` — delete the `"x-ard-version": "0.7.0",`
line; keep `x-ard-tier` and everything else.
- **Acceptance:** valid JSON; no `x-ard-version` remains; schema still parses.

### Unit 4 — Drop the live snapshot from SPEC + CATALOGS (Category A only)
- `ard-core/SPEC.md:3` — remove `**Snapshot 0.7.0** · ` so the line becomes just the versioning
  link (or fold the link into the §intro), per the VERSIONING rewrite. Keep the `[versioning]`
  pointer so SPEC still routes a reader to the policy.
- `ard-core/CATALOGS.md:1` — retitle `# ARD — Baseline Catalogs (v0.7.0)` → `# ARD — Baseline
  Catalogs` (no parenthetical version).
- `ard-core/CATALOGS.md:280` footer — rewrite `*This catalog is the v0.7.0 baseline. Extend it…*`
  → `*This catalog is the baseline inventory. Extend it…*` (drop the version, keep the grow-by-
  extension intent).
- **Do NOT touch** the inline evolution narration in these files ("v0.7 adds `AQ.4`…", "v0.1
  carried fourteen…") — that is Category B.
- **Acceptance:** no `(v0.7.0)` title, no `Snapshot 0.7.0`, no "v0.7.0 baseline" footer; inline
  "v0.X adds…" history untouched.

### Unit 5 — Rewrite `docs/VERSIONING.md`
**File:** `plugins/agentic-research/docs/VERSIONING.md`.
- Drop the "The ARD-Version stamp" section (stamps are gone).
- Keep + sharpen "The plugin's SemVer" and the discipline-change → SemVer-axis mapping (new catalog
  member = patch/minor; `[handle]{N}` wire-form or normative-minimum attestation change = major).
- Add a short "Historical numbering" note: v0.1 → v0.7 was ARD's pre-absorption numbering line, now
  **frozen** — a "v0.7" appearing in CATALOGS/SPEC/ledger/COMMITMENTS is pre-collapse history, not
  a live parallel version. Going forward, the plugin SemVer is the only version. This note also
  disambiguates the Category-B inline phrasing the cross-model review flagged: lines like "each a
  MINOR inventory/control growth" in CATALOGS describe how shapes were classified *under the frozen
  v0.X line*, not current bump guidance — the SemVer-axis mapping above is the live policy.
- Keep the conformance section.

## Implementation order
1. Unit 1 (stamps) — independent.
2. Unit 2 (gen-contract + regenerate JSON) — independent of 1.
3. Unit 3 (schema) — independent.
4. Unit 4 (SPEC/CATALOGS Category-A edits) — independent.
5. Unit 5 (VERSIONING.md rewrite) — last, so it describes the end-state the other units produce.

No ordering dependency among 1–4; do them in any order, regenerate the JSON after Unit 2, then run
both gates. Unit 5 is authored against the realized end-state.

## Testing / verification
This is config-and-prose; the "tests" are the existing gates run after the edits:
- `python3 plugins/agentic-research/ard-core/kernel/conformance/run.py` → 57/57 (unchanged — nothing
  conformance checks touches the version).
- `python3 plugins/agentic-research/ard-core/tools/gen-contract.py --check` → in sync (proves the
  regenerated JSON matches the edited prose with `catalog_baseline` gone).
- `python3 -c "import json; json.load(open('.../attestation.schema.json'))"` → schema still valid.
- `grep -rl "ARD-Version" plugins/agentic-research/ard-core` → empty.
- Manual: Category B "v0.X adds…" narration still present in CATALOGS/SPEC/ledger/COMMITMENTS.

## Risks
- **Stale regeneration trap.** If Unit 2 edits `build()` but the committer forgets to regenerate
  `catalogs.json`, `--check` fails. Mitigation: the order step regenerates before running gates.
- **Over-deletion of Category B.** A careless grep-and-delete of "0.7" could strip the historical
  narration. Mitigation: Unit 4 explicitly fences the inline history; the verification grep targets
  the *stamp* token (`ARD-Version`), not bare `0.7`.
- **Dangling "see versioning" intent.** If SPEC's snapshot line is removed wholesale, the
  `[versioning]` pointer must survive (Unit 4 keeps it) so readers can still find the policy.

## Other agent review

Cross-model design review (Codex, high effort, 2026-06-25). Verified the plan against the actual
files; conformance currently 57/57 and `gen-contract.py --check` in sync on the unchanged tree.
Accepted findings (all folded into the units above):

- **Missed Category A surface outside `ard-core/`:** `templates/acquisitions.md:2` references the
  ARD-Version stamp; an `ard-core`-scoped grep misses it. → Added to Unit 1.
- **Stamp prose, not just stamp lines:** `kernel/README.md` `## Snapshot stamp` section and a
  `discipline.md` parenthetical *describe* the stamp and dangle once it's gone. → Added to Unit 1.
- **Broaden the final verification net** to a plugin-wide token sweep, not the `ard-core` grep. →
  Verification section updated.
- **`gen-contract.py --check` is a byte-for-byte `json.dumps(indent=2)` compare** — the JSON must be
  regenerated AND committed after dropping `catalog_baseline` from `build()`, or the gate fails. →
  Already captured in Unit 2 + the stale-regeneration risk.
- **Category-B phrasing caveat:** "MINOR inventory/control growth" can read as current bump guidance
  unless VERSIONING.md frames v0.1→v0.7 as frozen. → Folded into Unit 5.
- **`x-ard-version` safe to remove** (no consumer/validator/test; `$id` is the schema identity);
  single-stride decomposition confirmed.
- **Version bump is a final mechanical step** after the feature commits land — `bump-version.sh`
  refuses a dirty plugin dir and auto-commits. (Bump is a release-time action, not part of this
  feature's edits; noted so implementation doesn't bump mid-stride.)

## Implementation notes (2026-06-25)

All 5 units landed; 16 files changed under `plugins/agentic-research/`. Gates green:
- Conformance `run.py` → **57/57** (unchanged — nothing it checks touched the version).
- `gen-contract.py --check` → **in sync** (JSON regenerated after dropping `catalog_baseline`).
- Schema + `catalogs.json` both valid JSON; `catalog_baseline` absent.
- Live-machinery sweep `rg "ARD-Version|x-ard-version|catalog_baseline|Snapshot 0\.7\.0|v0\.7\.0 baseline" plugins/agentic-research` → **empty**.
- Category B history intact (CATALOGS/SPEC "v0.7 adds…", COMMITMENTS "v0.7.0 additions", 6 ledger
  refs, 3 positions refs all preserved).

**Operator steer applied mid-implementation:** dropped all "there is no separate ARD content version"
/ "the plugin SemVer is the single version" framing — a plugin adopter has no prior awareness of a
dual version, so stating its absence reads as answering an unasked question. VERSIONING.md, the
kernel README `## Versioning` section, and the SPEC header now state the policy forward-only, with no
archaeology of the retired snapshot. (This also dropped the planned "frozen historical numbering"
note in Unit 5 — unnecessary, and it would have *introduced* the dual-version awareness it meant to
retire. Category-B inline "MINOR inventory/control growth" phrasing is consistent with the SemVer
axis mapping on its own and needs no disambiguating note.)

Bump deferred: `bump-version.sh` is a release-time action (refuses a dirty dir, auto-commits) — not
part of this feature's edits. Operator decides release binding + bump axis later.

## Origin

Surfaced 2026-06-25 during the v0.7-propagation epic-blocker work (PR #28); operator scoped it as a
separate deliberate decision, explicitly NOT folded into the blocker fixes. The blocker fixes and
`story-record-refresh-verification-scope` proceed on the (then) dual-version basis independently of
this feature.
