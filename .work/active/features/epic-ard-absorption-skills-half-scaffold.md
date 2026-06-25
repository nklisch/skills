---
id: epic-ard-absorption-skills-half-scaffold
kind: feature
stage: done
tags: [plugin]
parent: epic-ard-absorption-skills-half
depends_on: []
release_binding: null
gate_origin: null
created: 2026-06-24
updated: 2026-06-25
---

# Scaffold `ard-core/` — seed the single source of truth from v0.7.0

## Brief

Create `plugins/agentic-research/ard-core/` and seed it with the v0.7.0 ARD
content as the plugin's internal, single-source-of-truth discipline. This is the
foundation feature — F2 (vendoring collapse) and F3 (sync-drop + reframe) both
build on the `ard-core/` layout this lands.

At the end of this feature, `ard-core/` exists and is self-contained, but the
plugin's skills/scripts/docs **still point at the old vendored paths** — nothing
references `ard-core/` yet (that repointing is F2). The old `scripts/`-vendored
copies still exist (removed in F2). Conformance must stay green throughout (see
below).

## What lands in `ard-core/`

Seeded from ARD `main` at `b1dc0f3` (the v0.7.0 4-pass-consensus state). The
v0.7.0 revendor is **subsumed** — no separate ARD release.

**The authoritative file layout is the `## Architectural choice` target tree
below** (single source within this doc — the consumed kernel surface nests under
`ard-core/kernel/`, the generator under `ard-core/tools/`, canonical prose at
`ard-core/` root; the two-level shape is forced by the lint/generator path
constraint). In summary, `ard-core/` receives: the kernel surface (discipline,
catalogs.json, lint, schema, templates, conformance) under `kernel/`; `SPEC.md` +
`CATALOGS.md` + `tools/gen-contract.py` for SSOT; **all 11 theory positions** +
the 3 infra files under `theory/`; and the **schema/README-only** `evidence/`
tier (the v0.7 seed entries are the sibling `evidence-ledger` feature — this
feature lands the empty-but-shaped tier).

## Scope discovery — the canonical-vs-derived chain (beyond the epic's stated shape)

The epic's "target shape" listed `catalogs.{md,json}` but the real dependency
chain is larger. Verified during decomposition:

- **`scripts/catalogs.json` is GENERATED** from `CATALOGS.md` by
  `ard/tools/gen-contract.py` (its `_comment` says so). `CATALOGS.md` lives at
  the **`ard/` repo root**, not in `kernel/`. For `ard-core/` to be a true SSOT
  that can regenerate (not carry a frozen blob), it needs `CATALOGS.md` +
  `gen-contract.py`.
- **Plugin prose pervasively cross-references `ARD SPEC §N`** (README, ADOPTION,
  templates, schema, conformance README, orchestrator references). Those `§`
  pointers resolve against the prior vendored source today; in `ard-core/` they **dangle**
  unless `ard-core/` carries `SPEC.md`.
- `ard/tools/meta-fences.py` is the verbatim meta-fence (`ARD-Version:` stamping)
  — **dropped** in F3, not ported.

**Resolved (cross-model consensus, pass 2): `ard-core/` carries `CATALOGS.md` +
`SPEC.md` + `gen-contract.py`.** Rationale: `SPEC.md` resolves the pervasive
`ARD SPEC §N` prose references once the external source is gone; `CATALOGS.md` + the
generator keep `catalogs.json` a *generated* contract (Single Source of Truth /
Generated Contracts principles) rather than a frozen vendored blob under a new
name. **Rejected:** keeping `catalogs.json` as a frozen blob — it only works if
you ALSO rewrite every `ARD SPEC §N` reference away from section citations, which
is more churn and worse provenance (the peer's words, and correct). The design
pass sizes the port (these are ~3 files + the generator) and confirms
`gen-contract.py`'s `ROOT`-relative paths resolve under `ard-core/`.

## Conformance-green invariant (peer-confirmed: F1 keeps conformance green by itself)

`conformance/run.py` uses `HERE`-relative paths — it defaults to the adjacent
`../lint-citations.py` (run.py:54) and `./expected.json`. **Decision (peer-aligned):
COPY, don't move.** This feature copies the kernel surface into `ard-core/` so
both the old `scripts/conformance/` *and* the new `ard-core/conformance/` pass
independently — `main` is never broken. F2 deletes the old `scripts/` copies once
every consumer is repointed. Acceptance for this feature includes:
**`ard-core/conformance/run.py` runs green against `ard-core/lint-citations.py`**
(the copied tree is self-contained) AND the existing `scripts/conformance/` still
passes at its own count.

**Count reconciled (design pass — real drift, not a stale doc):** the source
kernel at `b1dc0f3` (v0.7.0) runs **57/57 (27 baseline)**; the plugin's vendored
copy (pinned v0.6.0) runs **56/56 (26 baseline)**. The +1 is the v0.7.0 fixture
`c9-f1-real` the v0.6-pinned plugin never received. Since `ard-core` is seeded
from `b1dc0f3`, **the absorbed conformance is 57/57** — this migration carries the
pending v0.6→v0.7 revendor as a side effect (consistent with "the v0.7.0 revendor
is subsumed"). `ard-core/conformance` acceptance = **57/57**; the still-live old
`scripts/conformance` stays at **56/56** until F2 deletes it.

## Dangling local links in copied docs (peer-surfaced — F1 records, F3 fixes)

Copying `SPEC.md` and `kernel/README.md` verbatim brings their **local links to
not-ported files**: `SPEC.md` links `VERSIONING.md`, `LICENSE`, `example/`,
`.research/`, `ADOPTING.md` (`../ard/SPEC.md:3,7,340`); `kernel/README.md` links
`ard.json`, `VERSIONING.md`, `example/`, `ADOPTING.md` (`../ard/kernel/README.md:57,63,67`).
These resolve in the source repo but **dangle in `ard-core/`** because the
absorption deliberately drops the publication surface.

**Disposition:** F1 does NOT rewrite them (verbatim copy keeps diff-parity with
upstream and avoids guessing the absorbed targets before the docs reframe). F1
**inventories** them and hands the rewrite to **F3 (drop-sync-reframe)**, which is
already rewriting the doc identity — repointing/removing these dangling refs is in
its lane. F1's acceptance adds a **dangling-local-link scan** (below) so the set is
captured, not silently shipped. (The `ARD SPEC §N` *prose* references in plugin
files are the separate, already-resolved SSOT reason `SPEC.md` is ported at all —
distinct from these `[text](file)` markdown links inside the copied docs.)

## v0.7 drift is broader than the conformance fixture (peer-surfaced)

Seeding from `b1dc0f3` (v0.7.0) silently advances the plugin's ARD content from
its current v0.6.0 pin across more than the one conformance fixture:
`CATALOGS.md` (27 shapes; adds AQ.4, GR.9, PR.3 class-complete-sweep,
model-diverse verification, `decision_relevance`), `dispatch.md` (9→10 fields),
`discipline.md` (acquisition-mode exhaustion + metadata source-binding). **F1 is
safe** — it repoints no consumers, so nothing reads the new content yet. But this
is **intentional behavior drift the migration carries**, not a conformance-count
footnote:
- **F2 (collapse-vendoring)** must treat the repoint as activating v0.7 content —
  the consumers start reading the v0.7 `catalogs.json`/`dispatch.md`/`discipline.md`.
- **F4 (version bump)** must account for the v0.6→v0.7 content jump: the plugin
  gains real framework capability (new shapes/fields), which is a substantive
  argument the bump is **at least minor** independent of the compat-shim/path
  question. Named here so F4 doesn't under-call it as "internal restructure only."

## Epic context

- Parent epic: `epic-ard-absorption-skills-half`
- Position in epic: **foundation feature** — F2 and F3 both depend on this layout.

## Foundation references

- `plugins/agentic-research/ard.json` — the current dual-pin/vendor map being retired.
- ARD v0.7.0 content (the seed source).

## Evidence-ledger split (resolved)

The evidence-ledger SEEDING is split into the sibling feature
`epic-ard-absorption-skills-half-evidence-ledger` (depends on this scaffold) per
the peer's sizing read — it is synthesis with schema/entry-quality/validation
implications, not file moves. This feature lands only the directory + ledger
schema/README shape.

---

## Architectural choice — `ard-core/` MIRRORS the `ard/` two-level shape

**Decision: `ard-core/` reproduces the source's `{root-docs, tools/, kernel/}`
two-level layout, not a flattened one.** Forced by a hard constraint, not preference:

- `kernel/lint-citations.py` defaults `--catalogs` to **its own sibling**
  `<dir>/catalogs.json` (lint-citations.py:560).
- `tools/gen-contract.py` derives `ROOT = dirname(dirname(__file__))` and writes
  `--out` to `ROOT/kernel/catalogs.json` (gen-contract.py:36-37, 198).

Mutually consistent **only** in the two-level layout: the generator (`tools/`)
writes `kernel/catalogs.json`; the lint (`kernel/`) reads its sibling
`kernel/catalogs.json` — same file, both correct, **zero path edits**. Flattening
forces patching both scripts' path logic — gratuitous churn on vendored code we
want diff-clean against the source (SSOT / minimal-diff). **Rejected: flat
`ard-core/*`** — saves one directory level at the cost of editing generator + lint
path resolution and breaking diff-parity with the upstream we periodically distill.

### Target layout

```
plugins/agentic-research/ard-core/
  SPEC.md                      # from ard/SPEC.md    (resolves ARD SPEC §N refs)
  CATALOGS.md                  # from ard/CATALOGS.md (canonical prose; gen source)
  README.md                    # NEW: ard-core as absorbed SSOT; points at evidence/ + theory/
  kernel/
    discipline.md              # the ONE discipline body
    catalogs.json              # generated; regeneratable via tools/gen-contract.py
    lint-citations.py
    README.md
    schema/attestation.schema.json
    templates/{attestation,precis,INDEX,dispatch}.md
    conformance/{run.py,expected.json,README.md, attestation/, analysis/, briefs/}
  tools/
    gen-contract.py            # NOT meta-fences.py (that's the dropped fence)
  theory/
    README.md, COMMITMENTS.md, references.md   # from ard/.research/
    positions/*.md             # all 11 from ard/.research/positions/
  evidence/
    README.md                  # NEW: ledger schema/shape (this feature)
    ledger.md                  # NEW: empty-but-shaped (entries = evidence-ledger feature)
```

NOT ported: `ard/example/`, `ard/tools/meta-fences.py` (dropped fence), and the
`ard/`-repo-root harness/publication docs (`ADOPTING.md`, `AGENTS.md`,
`HARNESS_ADAPTERS.md`, `CLAUDE.md`, `CODEX.md`, `GEMINI.md`, `VERSIONING.md`,
`README.md`, `ard.json`) — those are the separate-framework publication surface
the absorption retires. If a consumer needs one, F2 surfaces it.

## Implementation Units

A mechanical copy + two new small authored files. **No child stories** — one
cohesive stride (copy a verified file set into one new tree, author two READMEs,
run two gates). Splitting would be pure overhead (tight cohesion, single session).

### Unit 1: copy the kernel surface (two-level)
`../ard/kernel/` → `ard-core/kernel/`: `discipline.md`, `catalogs.json`,
`lint-citations.py`, `README.md`, `schema/`, `templates/`, `conformance/` verbatim.
Preserve the executable bit on `lint-citations.py` + `conformance/run.py`.
**Acceptance:** `python3 ard-core/kernel/conformance/run.py` → **57/57**.

### Unit 2: copy the SSOT docs + generator
`../ard/SPEC.md`, `../ard/CATALOGS.md`, `../ard/tools/gen-contract.py` →
`ard-core/{SPEC.md, CATALOGS.md, tools/gen-contract.py}`.
**Acceptance:** `python3 ard-core/tools/gen-contract.py --check` → "in sync"
(proves the two-level paths resolve and copied `catalogs.json` matches copied
`CATALOGS.md`, no edits).

### Unit 3: port theory (all 11 positions + infra)
`../ard/.research/positions/*.md` (11) + `../ard/.research/{README,COMMITMENTS,references}.md`
→ `ard-core/theory/positions/` + `ard-core/theory/`.
**Acceptance:** 11 position files + the 3 infra files present.

### Unit 4: stand up the evidence tier (schema/shape ONLY)
NEW `ard-core/evidence/README.md` (the five-column ledger schema — recurrence
count · deployment · observed behavior · mitigation · verification result — plus
authoring discipline: source-bound, no recall-filled metadata) and
`ard-core/evidence/ledger.md` (shaped-but-empty; entries land in `evidence-ledger`).
**Acceptance:** both exist; README defines the five-field shape; named the **primary
warrant tier**.

### Unit 5: ard-core README
NEW `ard-core/README.md` — names `ard-core/` as the plugin's internal,
empirically-warranted SSOT; orients to `kernel/` (consumed surface), `evidence/`
(primary warrant), `theory/` (supplementary trace), `SPEC.md`/`CATALOGS.md`
(canonical prose). Per readme-discipline: user-facing orientation, not a
restatement of agent conventions. Present-tense (no prior-vendored/separate-framework
contrast — superseded by the present-tense decision).

## Implementation Order
1. Unit 1 (kernel) — establishes the tree + the conformance anchor
2. Unit 2 (SSOT docs + generator) — `gen --check` compares against `kernel/catalogs.json` (Unit 1)
3. Units 3, 4, 5 — independent; any order

## Testing
No new test *code* — validated by the existing gates + presence/link scans against the new tree:
- **`ard-core/kernel/conformance/run.py` → 57/57** (lint + fixtures intact, self-contained).
- **`ard-core/tools/gen-contract.py --check` → in sync** (two-level paths resolve; catalogs matches prose).
- **old `scripts/conformance/run.py` → 56/56** unchanged (copy-not-move proven; `main` never broke).
- File-presence assertions: theory (11 + 3), evidence README + ledger, ard-core README.
- **Dangling-local-link scan (peer-surfaced acceptance):** `rg` the copied
  `ard-core/SPEC.md` + `ard-core/kernel/README.md` (and any other copied doc) for
  markdown links to files NOT present in `ard-core/` (e.g. `VERSIONING.md`,
  `ADOPTING.md`, `example/`, `ard.json`, `LICENSE`, `.research/`). The scan does
  not *fail* F1 — it produces the inventory F3 consumes (F1 records, F3 rewrites).
  **A NON-EMPTY recorded inventory is the pass condition** — the dangles are known
  to exist (verbatim copy of docs that link not-ported files), so an *empty* scan
  means the scan itself is broken (false clean), not success. Acceptance = the
  inventory is captured AND non-empty.

## Risks
- **Conformance fixtures with embedded absolute/`ard/`-rooted paths.** `run.py` is
  `HERE`-relative (run.py:54) so the copied tree is self-contained — but a fixture
  or `expected.json` entry embedding a non-relative path would break. The 57/57
  run is the catch; fix any such fixture to relative (low likelihood).
- **`gen-contract.py` cross-module import.** Design read: it's path-arg-driven, no
  package import — the two-level mirror covers any file-relative needs. Flag if an
  unexpected import surfaces.
- **`.gitignore` interactions at source.** Copying file *contents* (not git state)
  sidesteps any gitignored raw tier under `ard/.research/`; the 11 positions + infra
  are verified tracked files at `b1dc0f3`. Dest `ard-core/` is freshly tracked.

## Implementation notes (2026-06-24)

Implemented inline as one stride. All 7 acceptance criteria pass on first run:
- **`ard-core/kernel/conformance/run.py` → 57/57** ✓ (v0.7 content landed; tree self-contained)
- **`ard-core/tools/gen-contract.py --check` → in sync** ✓ — the central design
  claim proven empirically: the two-level layout resolves both the lint's sibling
  `catalogs.json` and the generator's `ROOT/kernel/catalogs.json` with **zero path
  edits**.
- **old `scripts/conformance/run.py` → 56/56** unchanged ✓ (copy-not-move; `main` green)
- theory: 11 positions + 3 infra ✓ · evidence README + ledger ✓ · ard-core README ✓
- **dangling-link inventory non-empty** ✓ — captured for the F3 worklist.
  Computed set: only
  `SPEC.md` dangles (5 targets: `.research`, `ADOPTING.md`, `LICENSE`,
  `VERSIONING.md`, `example`). `CATALOGS.md` + `kernel/README.md` are clean (their
  links resolve within `ard-core/`) — a finding that *narrows* F3's worklist vs the
  peer's pass-1 estimate (which named `kernel/README.md` as also dangling; on the
  ported tree its links resolve to ported siblings).

Authored files (not verbatim copies): `ard-core/README.md` (the tree's orientation
doc), `ard-core/evidence/{README.md,ledger.md}` (five-field ledger schema +
shaped-empty ledger), and a dangling-link inventory used as the F3 hand-off.

**Implementation-review fixes (peer pass, job `…c28fc247`, Request-changes → fixed):**
- **`kernel/conformance/run.py` made executable** — `cp -p` preserved the source's
  `644` (the source `run.py` isn't +x; only `lint-citations.py` is), but the
  feature acceptance requires it executable. `chmod +x` applied; runs directly at
  57/57. NB: this is an intentional mode-divergence from source (byte-identical
  *content*, executable *mode*) — recorded so a future diff-parity check doesn't
  flag it as drift.
- **Dangling-link inventory widened to the full tree** — the first scan only
  checked 3 named docs and missed `theory/README.md → ../.gitignore` (resolved at
  source `ard/.research/README.md` → `ard/.gitignore`; dangles post-relocation).
  Re-scanned all `ard-core/**/*.md`; complete set is now 2 docs (`SPEC.md` ×5 +
  `theory/README.md` ×1). The inventory file carries the corrected full-tree scan
  command for F3.
- **`ard-core/README.md` wiring claim corrected** — it described consumers
  referencing `ard-core/` directly in present tense; F1 leaves consumers on legacy
  paths until F2/F3. Reframed as a `> Migration status` note (intended end state,
  not a claim every consumer is repointed yet).

## Other agent review

Cross-model design consensus loop (Codex high-effort, session `…1bc718c471dd`),
2 passes, verifying claims directly against `../ard` at `b1dc0f3`:
- **Pass 1** (3 important findings, all folded): stale flat-layout list
  contradicting the two-level decision → replaced with a pointer to the
  authoritative target tree; copied `SPEC.md`/`kernel/README.md` carry dangling
  local links to not-ported files → F1 inventories (non-empty-required scan), F3
  rewrites; v0.7 drift is broader than the one conformance fixture (CATALOGS 27
  shapes, dispatch 9→10, discipline additions) → named as intentional migration
  drift, F4 bump rationale updated to "at least minor" on the v0.6→v0.7 content
  jump. Confirmed: the two-level-vs-flat hard constraint, no-child-stories,
  conformance 57-vs-56 (delta = `c9-f1-real`).
- **Pass 2: "No blockers."** One non-blocking nit (the dangling-link acceptance
  should require a *non-empty* inventory — an empty scan is a false clean) — fixed.
- Design consensus reached after pass 2; design committed at `implementing`.

**Implementation review (Codex high-effort, session `…8ad8f6c6cb16`), 2 passes:**
- **Pass 1: Request changes** (3 findings — exec bit on `run.py`, narrow-scan
  dangling inventory missing `theory/README.md → ../.gitignore`, README
  overstated current wiring). All fixed; 49-file byte-identity confirmed by the peer.
- **Pass 2: "No blockers."** Verified `100755` mode, 57/57 direct-exec, gen in
  sync, old 56/56, full-tree scan matches inventory, byte-identity holds (only the
  intended mode divergence). Nit (inventory intro naming 3 docs) — fixed.
- **Implementation consensus reached.** Advanced to `review` (implemented +
  peer-reviewed-to-consensus; the feature awaits the epic-level final loop, not a
  separate review pass — the consensus loop already supplied the passed review path).
