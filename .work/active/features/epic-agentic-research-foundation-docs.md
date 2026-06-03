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
- `/tmp/ARD/` — `SPEC.md`, `CATALOGS.md`, `ADOPTING.md`, `VERSIONING.md`, `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`
- `AGENTS.md` — "Versioning" section + `scripts/bump-version.sh` semantics
- `docs/VISION.md` — plugin-local-docs convention ("stays thin and defers")
- `plugins/agile-workflow/docs/` — plugin-local foundation-docs precedent
