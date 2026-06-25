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
updated: 2026-06-25
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
  **Bump level:** **at least minor.** Two independent arguments push past patch:
  (1) the absorption silently advances the plugin's ARD content from v0.6.0 →
  v0.7.0 (new shapes AQ.4/GR.9/PR.3/decision_relevance, `dispatch.md` 9→10 fields,
  `discipline.md` additions — see the scaffold feature's "v0.7 drift" section) —
  the plugin gains real framework capability, not just internal restructuring;
  (2) the structural absorption itself. Default **minor**, contingent on F2 landing
  the `scripts/lint-citations.py` compat wrapper so the public operator path is
  preserved. Goes **major** if F2/operator breaks the public script path OR treats
  `ard.json`'s schema as a public adopter contract ("plugin restructure" per
  VERSIONING.md:63 — document the exception inline if choosing minor pre-1.0).
  Resolve against what F2 actually landed. Note: `bump-version.sh` auto-commits +
  pushes and refuses a dirty plugin dir — commit ALL migration work first
  (CLAUDE.md §Versioning: feature changes must be committed before the bump).

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

---

## Design

This is a thin **verification-and-bump** gate — the absorption's substance landed
in F1-F3. The acceptance suite already PASSES against the current absorbed state
(lead-verified at design): conformance **57/57**, `gen-contract --check` in sync,
the `lint-citations.py` shim + `refresh-scan.py` smoke-run, manifests reference no
deleted path, versions lockstep at 0.5.0. So this feature is: (a) a final
end-to-end confirmation, (b) the version bump.

### Bump level — DECISION REQUIRED (the one real call)

Two independent arguments put it **past patch**:
1. **v0.6→v0.7 content jump.** The absorption seeded `ard-core/` from v0.7.0, so
   the plugin gains real ARD framework capability over its prior v0.6.0 pin (new
   shapes AQ.4/GR.9/PR.3/decision_relevance, `dispatch.md` 9→10 fields, discipline
   additions). Additive new capability → **minor**.
2. **Structural absorption + `ard.json` retirement.** `ard.json` was documented as
   "public truth" (old README:10) and is deleted; the whole vendoring contract is
   gone. A consumer who read `ard.json` sees a breaking change → argues **major**
   ("plugin restructure" per the old VERSIONING.md guidance).

**Mitigations that pull toward minor:** the **public operator command path is
preserved** (the `scripts/lint-citations.py` compat shim — F2). The `.research/`
substrate, the skills, the citation lint surface, the `[handle]{N}` convention —
all unchanged for an *operator* of the plugin. Only an adopter *reading `ard.json`
as a contract* is affected, and that audience is exactly the
external-publication audience the absorption judged dead.

**Recommendation: minor (0.5.0 → 0.6.0),** with an inline note in the reframed
`docs/VERSIONING.md` recording the `ard.json` retirement as the one
backward-incompatible-for-ard.json-readers change, pre-1.0. **Surface to the
operator at design** — it has a public-contract dimension and the operator owns
the marketplace-facing call. (If the operator prefers major to signal the
restructure loudly, that's equally defensible; the recommendation is minor because
the operator-facing surface is intact and the broken contract served a dead
audience.)

### Bump mechanics
`./scripts/bump-version.sh agentic-research <level>` — it refuses on an uncommitted
plugin dir (commit ALL F1-F4 work first) and **auto-commits + pushes** the bump.
So this feature's own non-bump work (this design note, any final-fix) commits
first; the bump is the last action. It updates all 3 channel manifests in lockstep.

### Child stories
**None** — verification + one scripted bump. Single stride.

## Testing (the gate)
The 6-check acceptance suite above, re-run immediately before the bump:
1. `ard-core/kernel/conformance/run.py` → 57/57
2. `gen-contract.py --check` → in sync
3. `scripts/lint-citations.py` shim runs (public path preserved)
4. `scripts/refresh-scan.py` runs (import repointed)
5. manifests/marketplace reference no deleted path
6. versions lockstep before bump; +1 minor (or major) after, still lockstep
Then: `bump-version.sh` succeeds (clean plugin dir), pushes, versions advance in lockstep.

## Risks
- **Bump level is a public-contract judgment** — surfaced to the operator (above).
- **`bump-version.sh` auto-pushes** — an outward-facing action. Confirm the operator
  wants the push as part of this feature, or run the bump as the deliberate final
  step with explicit go-ahead. (The epic's final cross-model loop should pass
  *before* the push, so the pushed version reflects the consensus-reviewed state.)
