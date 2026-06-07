---
id: epic-agentic-research-foundation-docs
kind: feature
stage: done
tags: [docs]
parent: epic-agentic-research
depends_on: [epic-agentic-research-scaffold]
release_binding: null
gate_origin: null
created: 2026-06-03
updated: 2026-06-04
---

# Foundation docs adaptation + versioning reconciliation

## Brief
Adapt ARD's framework documentation into the plugin's own `docs/` — plugin-local,
per the VISION convention that the repo "stays thin and defers; each plugin
carries its own foundation docs." Bring across SPEC.md (invariant architecture),
CATALOGS.md (the extensible v0.2 inventory: failure-shapes, source-classes,
verification-job catalogs, registration enums, provenance values), ADOPTING.md
(tiered adoption), and VERSIONING.md. Reconcile ARD's "spec bundle versions as a
unit" model with the repo's per-plugin `bump-version.sh` semver: record the
plugin's own `0.1.0` as "adopts ARD v0.2" and document how the two versioning
models relate. Preserve ARD's `AGENTS.md` / `CLAUDE.md` / `GEMINI.md`
shared-substance + thin-import-shim pattern — which already matches the repo's
"portable knowledge shared, native ergonomics separate" rule — and extend it to
the Codex (native `AGENTS.md`) and Pi surfaces.

Does NOT cover: the skills/agents (engagement-engine), the substrate mechanics
(substrate-tier), or the binary.

## Epic context
- Parent epic: `epic-agentic-research`
- Position in epic: consumer of `epic-agentic-research-scaffold`; the "documented
  discipline" deliverable. Parallel with engagement-engine and substrate-tier.

## Foundation references
- `/tmp/ARD/` @ `6218f08` (v0.3.0) — `SPEC.md`, `CATALOGS.md`, `ADOPTING.md`,
  `VERSIONING.md`, `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`
- `/tmp/ARD/ard.json` — release manifest: canonical version + vendorable-surface +
  vendor-mode taxonomy (the machine source this feature documents how we consume)
- `/tmp/ARD/kernel/catalogs.json` + `/tmp/ARD/kernel/README.md` — the `data`-mode
  catalog members + the kernel/example split rationale
- `AGENTS.md` — "Versioning" section + `scripts/bump-version.sh` semantics
- `docs/VISION.md` — plugin-local-docs convention ("stays thin and defers")
- `plugins/agile-workflow/docs/` — plugin-local foundation-docs precedent

## Design inputs (carried forward)
- **This feature owns the ARD-sync *policy***: the ARD-axis → plugin-action mapping
  (ARD PATCH → plugin patch; ARD MINOR → re-sync catalogs/ports, plugin minor/patch;
  ARD MAJOR → migration, plugin major), the decoupled-semver rule (the plugin's semver
  is independent of the adopted ARD version), and the single-source provenance-record
  design. The `epic-agentic-research-ard-sync` feature implements the *tooling* that
  enforces this policy. The v0.2 → v0.3.0 re-sync is now the worked example.
- **ARD v0.3.0 ships this policy as a contract — adopt it rather than reinventing it.**
  Upstream `VERSIONING.md` now carries the exact per-axis **adopter-action table**
  (PATCH → re-sync verbatim surface + run conformance; MINOR → re-sync `catalogs.json`
  data + re-run conformance; MAJOR → migrate + re-vendor schema). Our docs should
  *reference* `ard.json` as the canonical version source and reproduce/point at that
  table, not author a divergent one.
- **Consume `kernel/catalogs.json` as DATA, not narration.** Where SPEC/CATALOGS
  adaptation would otherwise re-list failure-shapes, source-classes, lint categories,
  statuses, enums, or provenance values, point at `catalogs.json` (the `data`-mode
  artifact, generated upstream by `tools/gen-contract.py`) instead of hand-copying the
  members — hand-copying is precisely the drift this release removes. Re-narrate only
  the *architecture* (SPEC prose), never the *inventory* (catalog members).
- **Document the vendor-mode taxonomy** (`verbatim` / `data` / `verify`) and the
  kernel-vs-example split as the organizing frame for our `docs/`: which vendored
  artifacts are copied-unaltered (discipline, lint, templates, schema), which are
  consumed-as-data (catalogs), and which are run-to-verify (conformance).
- **Re-point doc references `example/` → `kernel/`** (ADOPTING.md and friends moved the
  vendorable surface; the lint is now `kernel/lint-citations.py`, etc.).

## Design decisions
- **Doc depth**: Thin — reference upstream. Plugin docs document only OUR adaptation
  and cite ARD `SPEC`/`CATALOGS` by section number; never copy the big prose. Matches
  v0.3.0's anti-re-narration thesis + the repo's "stays thin and defers" rule.
- **Agent files**: Defer to repo convention. No plugin-local `AGENTS.md`/`CLAUDE.md`.
  The repo centralizes agent rules in the root `AGENTS.md` (`.claude/CLAUDE.md` is a
  symlink to it) and no plugin ships its own. ARD's shim pattern is preserved as a
  documented note, not a replicated structure. (Supersedes the brief's shim directive.)
- **Doc set**: Small mirror set — `docs/ADOPTION.md`, `docs/VERSIONING.md`,
  `docs/ARCHITECTURE.md`. Parallels `agile-workflow/docs/` at smaller scale.
- **catalogs.json**: reference-only (no generator). Where members would be listed, link
  to `scripts/catalogs.json` as the data source. (Building a renderer would re-create the
  prose↔data drift v0.3.0 removes.)

## Architectural choice
Three focused, thin plugin-local docs that **reference** canonical ARD prose rather than
fork it, plus two foundation-doc drift fixes. Chosen over: (a) a single consolidated doc
(less parity with `agile-workflow/docs/`, harder to point dependents at a stable
section); (b) a full ARD-surface mirror with vendored prose (re-introduces copy-drift,
duplicates `catalogs.json`, makes every ARD bump a large re-sync). The thin/reference
stance keeps the plugin's docs a *consumer's adaptation layer* over an upstream that owns
the spec — the same separation `ard.json` draws between canonical prose and derived
surface. The authoritative machine pin/vendor-map stays in `ard.json`; docs explain and
link, they don't restate.

## Implementation Units
Single-stride, one author (see Implementation Order for why no child stories). Five
artifacts: three new docs + two drift fixes.

### Unit 1: docs/VERSIONING.md  (trickiest — design first)
**File**: `plugins/agentic-research/docs/VERSIONING.md`
The feature OWNS the ARD-sync policy; this doc is its home. Contents:
- **Two decoupled version axes**: (1) the plugin's own SemVer (`package.json` +
  channel manifests, bumped by `scripts/bump-version.sh` when the *plugin* changes —
  currently **0.1.1**); (2) the adopted ARD version (pinned in
  `plugins/agentic-research/ard.json` `adopts` — currently **v0.3.0** — recorded as
  metadata, NOT the plugin's version). State plainly why they're decoupled.
- **Single-source provenance record**: `ard.json` (`adopts{version,release_tag,
  commit_sha,catalog_baseline}` + `vendored_paths`); the human-facing "Adopts ARD vX"
  strings derive from it.
- **Adopter-action mapping** (ARD bump axis → plugin action) — reproduce + link upstream
  `VERSIONING.md`'s per-axis table: ARD PATCH → re-sync verbatim surface (`git diff
  <tag>..<tag> -- kernel/`) + run conformance, plugin patch/none; ARD MINOR → re-sync the
  `data` surface (`scripts/catalogs.json`) + re-run conformance, plugin minor/patch; ARD
  MAJOR → migrate + re-vendor verbatim + `schema/`, plugin major.
- **Drift check**: `grep -r ARD-Version` over the vendored surface; `git diff` vs the
  pinned tag. Point at `epic-agentic-research-ard-sync` for the repeatable tool; cite the
  v0.2→v0.3.0 re-sync as the worked example.
**Acceptance**:
- [ ] Both axes named with current values (plugin 0.1.1 / ARD v0.3.0) and explicitly decoupled
- [ ] Adopter-action table present and consistent with upstream `VERSIONING.md` (no divergent mapping)
- [ ] `ard.json` named as the single pin source; `ard-sync` referenced as the tool
- [ ] Every command shown runs (`grep -r ARD-Version`, conformance, bump-version)

### Unit 2: docs/ADOPTION.md
**File**: `plugins/agentic-research/docs/ADOPTION.md`
The orientation doc — how this plugin adopts ARD. Contents:
- What ARD is (1 para) + links to canonical upstream `SPEC`/`CATALOGS`/`README` (by name + section, not copied).
- **Adoption stance**: vendor the `kernel/` surface; do not fork the prose; pin in `ard.json`.
- **Vendor-mode taxonomy** (`verbatim`/`data`/`verify`) + the **kernel-vs-example split**:
  we take `kernel/` (cross-harness) + the Claude `example/` wiring via engagement-engine;
  non-Claude channels take `kernel/` only. **Path mappings** (upstream `kernel/X` → our
  `scripts/`·`templates/`) explained; authoritative map is `ard.json` `vendored_paths`
  (link, don't duplicate).
- **The discipline** (1-para orientation only): canonical in ARD SPEC §4–5, rendered
  verbatim in `kernel/discipline.md`, vendored into the `research-discipline` skill by
  engagement-engine (forward-ref; currently in `ard.json` `not_yet_vendored`). Do NOT
  restate the six sections.
- **Verification floor**: lint (`scripts/lint-citations.py`, data-sourced from
  `scripts/catalogs.json`) + conformance (`scripts/conformance/run.py`). Catalog members
  (failure-shapes, source-classes, lint categories, enums, statuses) live in
  `scripts/catalogs.json` — link, never re-list.
- **Cross-harness degradation**: lint + (future) `research-view` binary are cross-harness; the three Claude agents degrade to absent.
**Acceptance**:
- [ ] vendor-mode taxonomy + kernel/example split explained; path mappings agree with `ard.json` `vendored_paths`
- [ ] No hand-listed catalog members anywhere — every such reference links to `scripts/catalogs.json`
- [ ] Discipline section is orientation only (≤1 para), pointing at SPEC §4–5 + the vendored bundle; six sections NOT restated
- [ ] All internal links resolve

### Unit 3: docs/ARCHITECTURE.md
**File**: `plugins/agentic-research/docs/ARCHITECTURE.md`
The two-substrate note the epic deferred here. Contents:
- **Two substrates**: operational `.work/` (agile-workflow — what we decide/build) and
  research `.research/` (agentic-research — grounded source material). Parallel tiers.
- **The cleavage / directionality**: analysis informs operational decisions, never the
  reverse; within `.research/`, read down-gradient only (reference→attestation→precis→analysis).
- **The pairing**: the research→work handoff (designed in `work-handoff`, not live) — a
  campaign emits `.work/` items gate-style, degrading when no `.work/` is present
  (precedent: `repo-eval`). Forward-ref `work-handoff`.
- Distinguish our **full four-tier** `.research/` from ARD's own narrower trace-only `.research/`.
**Acceptance**:
- [ ] Two-substrate cleavage + directionality documented; references `substrate-tier` (tier def) + `work-handoff` (pairing)
- [ ] Our full substrate distinguished from ARD's trace-only `.research/`

### Unit 4 (drift fix): root AGENTS.md plugin-map row
**File**: `AGENTS.md` (root; `.claude/CLAUDE.md` symlinks to it — one edit updates both)
The agentic-research row still says "adoption of ARD v0.2" → update to **v0.3.0** and note
the consumption-contract vendoring in one line. Keep it a single map row.
**Acceptance**:
- [ ] Row reads v0.3.0; no v0.2 straggler for agentic-research in `AGENTS.md`

### Unit 5 (drift fix): plugin README.md scaffold-status
**File**: `plugins/agentic-research/README.md`
The "Scaffold status" blockquote lists the lint, the `.research/` tier definition, and
templates as landing "in subsequent features" — but `substrate-tier` is **done**. Update to
reflect reality (tier + lint + templates + conformance landed; remaining: engagement-engine
skills/agents, `research-view` binary, these foundation docs) and link `docs/`.
**Acceptance**:
- [ ] README reflects current reality; no already-landed piece described as pending; links to `docs/`

## Implementation Order
1. `docs/VERSIONING.md` (trickiest; the others reference its axes/policy)
2. `docs/ADOPTION.md` (references the vendor-mode taxonomy; cross-links VERSIONING)
3. `docs/ARCHITECTURE.md` (independent; the two-substrate note)
4. Drift fixes: root `AGENTS.md` row + plugin `README.md` scaffold-status

**No child stories — single stride, one author.** The three docs share one vendor map,
one pin (`ard.json`), and cross-reference each other; splitting them across parallel
agents would fragment voice and risk three slightly-different phrasings of the same
vendor map. Cohesion + small size (3 short reference docs + 2 edits) beat fan-out here.
Implement via `/agile-workflow:implement` (inline) when picked up.

## Verification
Docs have no unit tests; acceptance is mechanically checkable at implement time:
- **Link check**: every internal path/section link resolves (no dangling).
- **No re-narration**: `grep` confirms docs don't hand-list catalog members — they link
  to `scripts/catalogs.json`.
- **Pin consistency**: doc version references say v0.3.0 (ARD) / 0.1.1 (plugin); vendor
  map matches `ard.json` `vendored_paths`.
- **Runnable commands**: the `grep -r ARD-Version` / conformance / bump commands shown in
  VERSIONING.md actually run.

## Risks
- **Section-reference rot.** "Reference ARD SPEC §N" dangles if upstream renumbers on a
  bump. Mitigation: cite by section **name + number** (e.g. "SPEC §4.2, the per-source
  attestation primitive"), and fold doc-reference drift into `ard-sync`'s check surface.
- **Fourth-place drift.** Docs risk becoming a 4th copy of facts already in `README` /
  `.research/CONVENTIONS.md` / `ard.json`. Mitigation: docs **link** to those as sources
  of truth (esp. `ard.json` for the vendor map) rather than restating them.
- **Forward-reference to unvendored discipline.** `ADOPTION.md` references
  `kernel/discipline.md`, which isn't vendored yet (lands with engagement-engine).
  Mitigation: describe it as the bundle engagement-engine will vendor; `ard.json`
  `not_yet_vendored` already records the gap honestly.

## Implementation notes
- **Files created**: `plugins/agentic-research/docs/{VERSIONING,ADOPTION,ARCHITECTURE}.md`
  (the small mirror set, thin/reference style — cite ARD by section, link `ard.json` as the
  authoritative pin/vendor-map, point catalog members at `scripts/catalogs.json`, never
  re-list them).
- **Files changed (drift fixes)**: `plugins/agentic-research/README.md` (Scaffold-status →
  Adoption-status: substrate-tier landed, links `docs/`); `AGENTS.md` (plugin-map row ARD
  v0.2 → v0.3.0 + consumption-contract note; `.claude/CLAUDE.md` symlinks to it, so one edit
  covers both); `.research/CONVENTIONS.md` (see discrepancy below).
- **Discrepancies from design**:
  - *6th drift fix surfaced during implementation.* `.research/CONVENTIONS.md` already
    forward-referenced "`plugins/agentic-research/docs/` (SPEC/CATALOGS)" — a dangling
    pointer under the thin/reference strategy (there is no local `docs/SPEC.md`/`CATALOGS.md`).
    Reconciled it to point at `docs/ADOPTION.md` (orientation, links upstream) + name
    `scripts/catalogs.json` as the data home. Design's 5-unit set → 6 with this.
  - *Vendor-map table expanded to 1:1.* `ADOPTION.md`'s map first used brace-collapsed
    `kernel/templates/{attestation,precis,INDEX}.md`; expanded to three explicit rows so it
    is byte-verifiable against `ard.json` `vendored_paths` (acceptance criterion).
- **Tests added**: none (docs). **Verification run**: all internal links resolve; vendor map
  1:1 with `ard.json` (7/7 keys); no catalog-member re-narration in docs; pins consistent
  (ARD v0.3.0 / plugin 0.1.1; v0.2 only as the re-sync worked-example reference); every
  doc-instructed command runs — lint exit 0, conformance 15/15, `grep -r ARD-Version` finds
  the 6 stamped files, `bump-version.sh` usage responds.
- **Adjacent issues parked**: none.

## Review (approve · deep · fresh-context)
Verdict: **Approve**. Reviewed by an independent fresh-context agent (cold verification
against ground truth: ARD upstream `6218f08`, `ard.json`, the vendored surface). All 8
checks PASS — section references resolve with the claimed meanings; the ADOPTION vendor
map is 1:1 with `ard.json` `vendored_paths` (7/7, modes + on-disk targets correct); every
doc-instructed command runs (lint exit 0, conformance 15/15, drift grep → 6 stamped files);
no catalog-member re-narration; README/AGENTS/CONVENTIONS drift fixes accurately describe
current repo reality; pins internally consistent (ARD v0.3.0 / plugin 0.1.1). No blockers,
no important findings.
- Two nits, both fixed in-session before advancing: (1) `ADOPTION.md` cited *§4.6* alone
  for the never-re-narrate rule → now *§4.6/§5*, matching upstream `ard.json`'s pairing;
  (2) `VERSIONING.md` PATCH-row `git diff <tag>..<tag>` → space form `git diff <tag> <tag>`
  to match upstream's syntax.
Fast-track: deep review clean, nits resolved → advance review → done.
