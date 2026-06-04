---
id: epic-agentic-research-ard-sync
kind: feature
stage: drafting
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
