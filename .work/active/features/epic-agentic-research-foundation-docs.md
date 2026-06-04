---
id: epic-agentic-research-foundation-docs
kind: feature
stage: drafting
tags: [docs]
parent: epic-agentic-research
depends_on: [epic-agentic-research-scaffold]
release_binding: null
gate_origin: null
created: 2026-06-03
updated: 2026-06-03
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
