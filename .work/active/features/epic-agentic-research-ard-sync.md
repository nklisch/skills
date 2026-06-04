---
id: epic-agentic-research-ard-sync
kind: feature
stage: review
tags: [tooling]
parent: epic-agentic-research
depends_on: [epic-agentic-research-foundation-docs]
release_binding: null
gate_origin: null
created: 2026-06-03
updated: 2026-06-04
---

# ARD upstream-version sync

## Brief
A repeatable way to absorb ARD upstream version bumps, instead of hand-auditing each
one. This feature was surfaced by a real episode: ARD bumped v0.1 → v0.2 mid-adoption,
and absorbing it meant cloning two ARD states, diffing by hand, and editing ~12
scattered "adopts ARD v0.1" pins. That should be a one-liner next time.

The feature has two parts:
1. **A single-source provenance record** — consolidate the scattered "adopts ARD vX"
   strings into ONE place (e.g. `plugins/agentic-research/ARD_UPSTREAM` or a manifest
   field) recording `{ard_version, ard_commit_sha, vendored_paths}`. The manifests /
   READMEs reference the concept; the version lives in one spot.
2. **An `ard-sync` drift tool** — fetch a target ARD version, diff the vendored
   surface (templates, `lint-citations.py`, and the adapted SPEC/CATALOGS docs)
   against the recorded snapshot, report drift, and guide the re-sync + re-verify
   (run the lint smoke test as conformance) + plugin-semver bump.

Implements the sync **policy** defined by `foundation-docs` (the ARD-axis → plugin
action mapping; the decoupled-semver rule). Keeps the two version axes decoupled: the
plugin bumps its OWN semver when it changes; the ARD version is metadata.

## Epic context
- Parent epic: `epic-agentic-research`
- Position in epic: maintenance/operability feature — a follow-on, not on the critical
  path for the initial proposal. Depends on `foundation-docs` (which defines the
  policy this tool enforces).

## Foundation references
- `foundation-docs` feature — owns the versioning-reconciliation **policy** this implements.
- `scripts/bump-version.sh` — the plugin's own semver mechanism (decoupled from ARD's version).
- `plugins/agile-workflow/work-view/` — precedent for a plugin-shipped tool + its tests.

## Design inputs (carried forward)
- **The anticipated affordances SHIPPED in ARD v0.3.0** (upstream `6218f08`). The
  packaging improvements this feature was told to "use when present" are now present,
  so they are the **primary** design path (not the fallback). Design against:
  - **`ard.json`** as the single source of `{version, release_tag, commit_sha}` for the
    pin and of the `vendorable_surface[]` (each entry's `path` + `mode`:
    verbatim/data/verify). The consumer-side provenance record (part 1) **mirrors**
    this: `{ard_version, ard_commit_sha, vendored_paths}`, where `vendored_paths` maps
    each upstream `kernel/...` path to where we vendored it (we flattened the kernel —
    lint at `plugins/agentic-research/scripts/`, templates at `.../templates/`).
  - **`grep -r ARD-Version`** over the vendored copies vs upstream as the drift check;
    **`git diff <ref>..<ref> -- kernel/`** to enumerate exactly what changed.
  - **`kernel/conformance/run.py`** as the re-verify step (replaces the hand-rolled
    smoke test — see below).
  - **`kernel/catalogs.json`** drives the lint's category/status sets, so a MINOR
    inventory bump is absorbed as a *data* re-sync, not a code edit.
- **Two-clone diff is now the DEGRADE path**, used only when a target ARD version
  predates v0.3.0 (no `ard.json`/stamps/conformance). Keep it as fallback.
- **Upstream tags are present and verified** — annotated `v0.1` / `v0.2` / `v0.3.0`;
  `v0.3.0` → `6218f08` (matches `ard.json` `release_tag` + `origin/main`). Pin by
  **tag** and use `git diff v0.2 v0.3.0 -- kernel/` directly. Still design the tool to
  fall back to `commit_sha` / SHA-range diff for ARD versions that predate tagging.

### Worked example: absorb v0.2 → v0.3.0 (this feature's first concrete deliverable)
The motivating episode is now richer than the v0.1 → v0.2 hand-audit. v0.3.0 is the
first release the tool can absorb *with* the affordances. The re-sync produces a
tangible diff in our tree — make this a single guided run:
1. **Provenance record** — create the single-source pin (`{ard_version: 0.3.0,
   ard_commit_sha: 6218f08, vendored_paths: {...}}`) and re-point the ~6 scattered
   "Adopts ARD v0.2" strings (READMEs + 3 channel manifests) to reference it, so the
   pin lives in ONE place. NOTE: do this re-pin *together with* the re-vendor below —
   bumping the strings to v0.3.0 while the tree still ships the v0.2 surface would make
   the manifests lie. They honestly read "v0.2" until the surface is re-vendored.
2. **Re-vendor the surface** from upstream `kernel/`: refresh `lint-citations.py`
   (gains catalogs.json sourcing + `ARD-Version:` stamp; backward-compatible), add
   `catalogs.json` (data) and `schema/attestation.schema.json` (verbatim), re-stamp
   templates.
3. **Swap the test** — delete the hand-rolled `scripts/tests/{test_lint.py,fixtures/
   {good,bad,thin}}` and run `kernel/conformance/run.py` against the vendored lint as
   the conformance check (all 7 chain statuses + thin + 6 pattern categories).
4. **Bump** the plugin's own semver (decoupled from ARD's) per `bump-version.sh`.
- Sequencing: implements the policy `foundation-docs` defines, so foundation-docs
  designs first; this feature then carries the tool + the worked re-sync.

### Re-sync executed inline (2026-06-04) — the *manual* worked run; the TOOL is still TODO
Steps 1–3 of the worked example above were performed by hand this session (the user
asked to absorb v0.3.0 inline). What landed in the tree:
- **Provenance record** `plugins/agentic-research/ard.json` — `{adopts: {version 0.3.0,
  release_tag v0.3.0, commit_sha 6218f08, catalog_baseline 0.2}, vendored_paths{…},
  not_yet_vendored{discipline.md, dispatch.md → engagement-engine}}`. The 5 human-facing
  "Adopts ARD v0.2" strings (plugin README, 3 channel manifests, `.research/README.md`)
  now read v0.3.0 and the plugin README points at `ard.json` as the source of truth.
- **Re-vendored from `kernel/`**: `scripts/lint-citations.py` (data-sources categories/
  statuses from `scripts/catalogs.json`, built-in fallback), new `scripts/catalogs.json`
  (data), new `scripts/schema/attestation.schema.json` (verbatim), re-stamped
  `templates/{attestation,precis,INDEX}.md` (ARD-Version: 0.3.0).
- **Test swapped**: removed `scripts/tests/{test_lint.py,fixtures/*}`; vendored
  `scripts/conformance/` (placed at `scripts/` so `run.py`'s default `../lint-citations.py`
  resolves). `python3 scripts/conformance/run.py` → **15/15** (8 statuses · 1 thin · 6
  pattern categories). Live substrate lint (`scripts/lint-citations.py .research/analysis/
  --exit-code-on high`) → exit 0, 0 broken / 0 thin.
- **STILL TODO (the actual feature):** (a) step 4 — the decoupled **plugin-semver bump**
  via `bump-version.sh` (held for explicit user go; the script auto-commits). (b) The
  `ard-sync` **tool itself** — this run was manual; the feature's deliverable is the
  repeatable command (read `ard.json`, `grep -r ARD-Version`, `git diff <tag>..<tag> --
  kernel/`, run conformance, guide the re-sync + bump). This feature is NOT done; the
  manual run is its validated worked example.
  - *Update (2026-06-04):* step 4 is **done** — `bump-version.sh agentic-research patch`
    ran to **v0.1.1** (committed locally). Only the **tool** remained; it is designed below.

## Design decisions
- **Tool scope: check-only.** `ard-sync.py --check` detects drift + reports a re-sync plan;
  the operator applies the re-copy by hand following the plan, then runs conformance. No
  `--apply` (sidesteps the tricky discipline-wrapper re-gen; matches the "near-trivial
  drift-check" vision; low-frequency tool).
- **ARD source: operator-provided checkout.** `--ard-repo PATH` points at a local ARD git
  checkout at the target ref. Zero-dependency, no network — consistent with
  `lint-citations.py`/`conformance`. Shells to `git -C <path> diff <tag>..<tag>` for the
  upstream change summary when git+tags are present, degrading gracefully.
- **Form: a zero-dep Python CLI** at `scripts/ard-sync.py` — consistent with the other
  committed tools (cross-harness, testable), not a Claude skill.
- **The vendored surface = `ard.json` `vendored_paths`.** The brief's "adapted SPEC/CATALOGS
  docs" is **superseded** by foundation-docs' thin/reference decision — we do not vendor
  SPEC/CATALOGS prose, so there is nothing to diff there. The tool diffs exactly the
  machine-checkable vendored kernel artifacts.
- **No child stories — single stride.** One cohesive tool + its test + a small doc-wiring
  edit; tight cohesion (the test is coupled to the tool), one author.

## Architectural choice
A single zero-dep Python drift-check CLI driven by `ard.json` as the source of truth, plus a
subprocess-cli-harness test and a doc-wiring edit. Chosen over: (a) check+apply (rejected —
the discipline-wrapper re-gen is tricky and the tool is low-frequency); (b) a Claude skill
(rejected — the lint/conformance precedent is a cross-harness CLI; a skill would be
Claude-only and untestable the same way); (c) tool-fetches-ARD (rejected — keeps the tooling
offline/zero-dep). The tool *reports + guides*; the operator (agent or human) applies and the
conformance runner is the gate.

## Implementation Units
Single-stride; three artifacts.

### Unit 1: scripts/ard-sync.py — the drift-check core (trickiest)
**File**: `plugins/agentic-research/scripts/ard-sync.py`
```
python3 ard-sync.py --ard-repo PATH [--ard-json PATH] [--format text|json]
  --ard-repo PATH   local ARD checkout at the TARGET ref (required)
  --ard-json PATH   consumer pin (default: ../ard.json relative to this script)
  --format          text (default) | json
  exit 0 = in sync · 1 = drift detected · 2 = error (bad paths/inputs)
```
Behavior:
1. **Load the consumer pin** from `ard.json`: `adopts{version,release_tag,commit_sha}` +
   `vendored_paths{ "kernel/X": "<plugin-rel path>" }`. plugin_root = dir of `ard.json`.
2. **Read the target version** from `<ard-repo>/ard.json` `version` (+ `vendorable_surface`
   for each path's **mode**). If the target predates `ard.json` (pre-v0.3.0), degrade:
   treat every entry as a whole-file verbatim compare and note the degrade.
3. **Per `vendored_paths` entry** — compare vendored copy (`plugin_root/<relpath>`) against
   target (`<ard-repo>/<key>`):
   - **file, verbatim/data** → byte-compare → `OK` | `DRIFT`.
   - **directory** (key ends `/`, e.g. `kernel/conformance/`) → recursive per-file compare.
   - **discipline body-embed** (`kernel/discipline.md` → `…/SKILL.md`) → compare the **body
     from the first `## ` numbered section onward** on both sides (the vendored SKILL.md
     wraps the verbatim body; only the body is the vendored artifact).
   - **missing target** (entry removed upstream) / **new kernel artifact** (in target
     `vendorable_surface` but not in our `vendored_paths`) → report as add/remove.
4. **ARD-Version stamp delta** — extract the `ARD-Version:` stamp from each stamped vendored
   copy + its target; report mismatches (belt-and-suspenders vs the `adopts.version` ↔ target
   version compare).
5. **git tag-diff (optional)** — if `<ard-repo>/.git` + both tags resolve, shell
   `git -C <ard-repo> diff <pinned_tag>..<target_tag> --stat -- kernel/` (fail-open:
   `timeout=`, `check=False`, `stderr=DEVNULL`); include the summary, else a one-line "skipped".
6. **Report + plan**: consumer pin → target version; per-artifact `OK`/`DRIFT (mode)`;
   adds/removes; a re-sync plan keyed by mode (verbatim DRIFT → `cp <kernel/X> <our-path>`;
   data DRIFT → re-sync the data file; verify → re-run conformance); the **suggested plugin
   bump axis** mapped from the ARD bump (consumer→target version delta) per
   `docs/VERSIONING.md`'s adopter-action table; and the closing commands
   (`python3 scripts/conformance/run.py`; `./scripts/bump-version.sh agentic-research <axis>`).
7. **Exit** 0 (in sync) / 1 (drift) / 2 (error). `--format json` emits the same as a structured object.
**Implementation notes**: stdlib only (`argparse`, `json`, `os`, `subprocess`, `filecmp`/byte
read, `re` for the stamp + body-extract). Resolve the discipline body boundary with the same
`^## ` anchor used in the S1 build.
**Acceptance**:
- [ ] In-sync surface → exit 0, reports "in sync" with the pin; a modified vendored file → exit 1, names that artifact `DRIFT`
- [ ] Discipline body-embed compared by body (wrapper changes alone do NOT report drift; a body change DOES)
- [ ] Directory entry (`conformance/`) compared recursively; the suggested bump axis matches VERSIONING.md's table; zero third-party imports

### Unit 2: scripts/tests/test_ard_sync.py — subprocess-cli-harness test
**File**: `plugins/agentic-research/scripts/tests/test_ard_sync.py` (+ `fixtures/`)
Fixtures: a minimal fake ARD checkout (`fixtures/fake-ard/{ard.json,kernel/…}`) + a fake
consumer (`fixtures/fake-consumer/{ard.json, <vendored copies>}`). Launch the real
`ard-sync.py` via subprocess (the repo's subprocess-cli-harness pattern) for two scenarios:
**in-sync** (vendored == kernel → exit 0) and **drift** (one vendored file mutated → exit 1 +
names the artifact). Zero-dep; run with `python3`.
**Acceptance**:
- [ ] Both scenarios pass (exit 0 / exit 1 + drift named); test is zero-dependency
- [ ] Fixture stamps use a **sentinel version** (e.g. `0.0.0-fixture`) so they don't masquerade as real vendored stamps in the drift grep

### Unit 3: doc-wiring (close the forward-references)
**Files**: `docs/VERSIONING.md` (its "repeatable tool … is the `ard-sync` feature (in
progress)" line → name `scripts/ard-sync.py` as the shipped drift tool, with the invocation);
`ard.json` `drift_check` field → reference `ard-sync.py` and **exclude `tests/`** from the
`grep -rl ARD-Version …` path (so fixtures don't pollute it).
**Acceptance**:
- [ ] VERSIONING.md names `ard-sync.py` (no "in progress"); `ard.json` `drift_check` excludes `tests/`; drift grep no longer matches fixtures

## Implementation Order
1. `scripts/ard-sync.py` (the tool; trickiest — the body-embed + mode logic)
2. `scripts/tests/test_ard_sync.py` + fixtures (validates it; sentinel-stamped)
3. doc-wiring (VERSIONING.md + ard.json drift_check)
Then **smoke it against reality**: run `ard-sync.py --ard-repo /tmp/ARD` (currently at
v0.3.0) — our surface is freshly synced, so it must report **in sync, exit 0** (a live
no-drift confirmation, the inverse of the worked example).

## Testing
- **Unit/CLI**: `test_ard_sync.py` (in-sync + drift fixtures, subprocess).
- **Live smoke**: `ard-sync.py --ard-repo /tmp/ARD` → exit 0 (we are pinned at v0.3.0 and the
  surface is current). Mutating one vendored file → exit 1 naming it.
- **No regressions**: `scripts/conformance/run.py` still 15/15; the drift grep no longer
  catches `tests/` fixtures.

## Risks
- **Discipline body-embed boundary.** If the `^## ` anchor differs between the SKILL.md and
  `kernel/discipline.md`, the body-compare false-positives. Mitigation: use the exact anchor
  from the S1 build (`## 1.`), and cover it in the test.
- **Vendor-mode source absent.** A pre-v0.3.0 target has no `ard.json`/`vendorable_surface`.
  Mitigation: the documented degrade — whole-file verbatim compare + a "modes unavailable" note.
- **Fixtures polluting the drift grep.** Test fixtures carry `ARD-Version`-like stamps.
  Mitigation: sentinel version + exclude `tests/` from `drift_check` (Unit 3).
- **Operator points at the wrong ref.** Garbage-in. Mitigation: the report prints the target
  version (read from `<ard-repo>/ard.json`) so the operator sees what they compared against.

## Implementation notes
- **Files created**: `scripts/ard-sync.py` (the zero-dep check-only drift CLI),
  `scripts/tests/test_ard_sync.py` (subprocess-cli-harness, tempdir-built fixtures).
- **Files changed**: `docs/VERSIONING.md` (names `ard-sync.py` as the drift tool, drops "in
  progress"; manual grep tightened); `ard.json` (`drift_check` → `ard-sync.py` + precise grep).
- **Discrepancies from design**:
  - *Removed the per-file `ARD-Version` stamp parse from the tool.* The `ard.json` `version`
    compare is the authoritative delta; per-file stamp parsing was redundant dead code (the
    human `grep` covers stamps). Simpler tool.
  - *Test builds fixtures in a TempDir* rather than committing a `fixtures/` tree — cleaner and
    sidesteps drift-grep pollution entirely (nothing committed carries a stamp). Added a 5th
    scenario (version-bump, identical kernel) to cover the delta/bump-axis path.
  - *Precision fix (surfaced in verify):* the documented drift grep is now `grep "ARD-Version:"`
    (colon) + `--exclude-dir=tests`, so it lists only genuinely-stamped vendored files —
    `ard-sync.py` mentions the string in prose but carries no stamp.
  - *Brief's "adapted SPEC/CATALOGS docs"* — superseded by foundation-docs' thin/reference
    decision (nothing vendored to diff there); the tool targets exactly `ard.json` `vendored_paths`.
- **Tests added**: `test_ard_sync.py` — **5/5** (in-sync · file-drift · body-drift ·
  wrapper-only-no-drift · version-bump).
- **Verification**: test 5/5; **live in-sync smoke** `ard-sync.py --ard-repo /tmp/ARD` → exit 0
  (all 9 artifacts `ok`, modes resolved, discipline body-embed `ok` despite differing wrapper);
  **live drift demo** — mutated real `scripts/catalogs.json` → `DRIFT` named + re-sync plan +
  exit 1, restored → exit 0; zero third-party imports; conformance 15/15; colon-grep lists only
  the 8 stamped vendored files.
- **Adjacent issues parked**: none.
