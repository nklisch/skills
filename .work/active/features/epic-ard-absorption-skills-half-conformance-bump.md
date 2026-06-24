---
id: epic-ard-absorption-skills-half-conformance-bump
kind: feature
stage: drafting
tags: [plugin]
parent: epic-ard-absorption-skills-half
depends_on: [epic-ard-absorption-skills-half-collapse-vendoring, epic-ard-absorption-skills-half-drop-sync-reframe]
release_binding: null
gate_origin: null
created: 2026-06-24
updated: 2026-06-24
---

# Conformance against the absorbed layout + version bump

## Brief

Validate the absorbed plugin end-to-end and ship it. Run the ARD conformance
suite (the reconciled baseline count — see Tasks) against the `ard-core/` layout, fix any path breakage the
migration introduced, then bump the `agentic-research` plugin version. This is
the last feature before the epic's final cross-model review loop.

## Tasks

- **Conformance** — `ard-core/conformance/run.py` reproduces the canonical
  verdicts against the lint at its `ard-core/` home. **Check count = whatever the
  baseline actually is** (the conformance README says 57; the peer's live run
  reported 56/56 with 26 baseline — do NOT pre-bake a number here; the scaffold
  feature reconciles the true count, and this feature asserts the migrated layout
  reproduces it exactly). Fix any path/import breakage from the move.
- **Cross-channel metadata sanity** — `.claude-plugin/`, `.codex-plugin/`,
  `package.json` still reference only paths that exist post-migration (no
  pointer to removed `scripts/ard-sync.py`, the dropped `ard.json` keys, etc.).
- **Public-path smoke checks (peer-surfaced)** — conformance alone does not
  exercise the public-path contracts the migration must preserve. Add explicit
  smoke checks: (1) `scripts/lint-citations.py` compat shim runs and delegates to
  `ard-core/lint-citations.py` (same output on a known input); (2)
  `scripts/refresh-scan.py` imports / `--help` works after its import was
  repointed in F2. These guard the operator-facing surface the bump claims to
  preserve.
- **Catalogs regen check (if SSOT fork chose regeneratable)** — if the scaffold
  feature kept `CATALOGS.md` + `gen-contract.py` in `ard-core/`, confirm
  `catalogs.json` is in sync (`gen-contract.py --check`).
- **Version bump** — `./scripts/bump-version.sh agentic-research <minor|major>`.
  **Bump level:** default **minor**, contingent on F2 landing the
  `scripts/lint-citations.py` compatibility wrapper (peer-surfaced) so the public
  operator command path is preserved. If F2/operator instead chose to break the
  public script path, OR treats `ard.json`'s schema as a public adopter contract,
  this becomes **major** ("plugin restructure" per VERSIONING.md:63 — and document
  the exception inline if choosing minor pre-1.0). Resolve the final level against
  what F2 actually landed. Note: `bump-version.sh` auto-commits + pushes and
  refuses a dirty plugin dir — commit ALL migration work first (CLAUDE.md
  §Versioning: feature changes must be committed before the bump).

## Epic context

- Parent epic: `epic-ard-absorption-skills-half`
- Position in epic: terminal gate — depends on both collapse-vendoring and
  drop-sync-reframe; the final cross-model loop runs after this lands.

## Foundation references

- `plugins/agentic-research/scripts/conformance/` → `ard-core/conformance/`.
- `scripts/bump-version.sh` (root of skills repo).
- Skills-repo CLAUDE.md §Versioning (commit-before-bump discipline).

## Verification

Conformance passes at the reconciled baseline count against the absorbed layout. Channel metadata references no
removed paths. Plugin version bumped and pushed. The plugin installs/loads with
`ard-core/` as the only kernel surface.
