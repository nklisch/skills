---
id: epic-ard-absorption-skills-half-conformance-bump
kind: feature
stage: implementing
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

### Operator decisions (settled 2026-06-25)

- **Bump level: MINOR (0.5.0 → 0.6.0)** + an inline note in `docs/VERSIONING.md`
  recording the `ard.json` retirement as the one ard.json-reader-breaking change
  pre-1.0. (Rejected major: the operator-facing surface — the lint command shim,
  the skills, `.research/`, the citation lint — is intact; the broken `ard.json`
  contract served the dead external-publication audience.)
- **Push timing: AFTER the epic-level final cross-model loop.** Verify the gate now
  (no push); run the whole-epic final review; fix any findings; then
  `bump-version.sh` (which auto-pushes) as the deliberate FINAL act, so the
  published 0.6.0 reflects the consensus-reviewed state. This feature therefore
  splits: **verify-now** (the widened 9-check gate, at design/impl) + **bump-later**
  (the post-epic-loop final action).

### Bump level — rationale (decided minor above)

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

## Testing (the gate) — WIDENED per design-review pass 1

The original 6 checks covered ARD/kernel/manifests but missed installability,
whole-plugin link integrity, and skill validation (peer-surfaced). The gate is now:
1. `ard-core/kernel/conformance/run.py` → 57/57
2. `gen-contract.py --check` → in sync
3. `scripts/lint-citations.py` shim runs (public path preserved)
4. `scripts/refresh-scan.py` runs (import repointed)
5. **whole-plugin** deleted-path scan (not manifest-only): no live reference to
   `ard.json`, `ard-sync`, `scripts/{catalogs.json,schema/,conformance/}`, or the
   4 removed templates anywhere in the plugin (skills, scripts, docs, ard-core).
6. versions lockstep before bump; +1 minor after, still lockstep
7. **local markdown links pass** over the whole plugin (the repo link checker /
   the dangling scan) — no dangling ref from the reframe.
8. **skill validators pass** for all 4 skills (`research-orchestrator`,
   `research-discipline`, `research-handoff`, `convert`) — the collapse + reframe
   didn't break a SKILL.md.
9. **`docs/VERSIONING.md` carries the `ard.json` retirement note** (the minor-bump
   exception — peer-required before a minor bump). ✓ added.
Then: `bump-version.sh agentic-research minor` succeeds (clean plugin dir),
versions advance to 0.6.0 in lockstep.

## Risks
- **Bump level is a public-contract judgment** — settled with the operator: minor.
- **`bump-version.sh` auto-pushes** — settled: push AFTER the epic-level final loop,
  as the deliberate final act (so the pushed 0.6.0 reflects consensus-reviewed state).

## Release-readiness sequencing (peer-surfaced — PRE-EXISTING, not absorption-caused)

The peer found the committed `research-view/dist/` binaries report stale versions
(`0.4.0`/`0.1.0` vs the `0.5.0` manifests), so `install-research-view.sh`'s
version-match check fails on this host. **This is pre-existing** — verified the
absorption diff does not touch `research-view/` at all (its binaries are refreshed
by a separate post-merge CI step, last run well before this work). `bump-version.sh`
deliberately does NOT rebuild dist binaries (it updates manifests + the
`.research-view-version` stamp + `research-view.sh`, and explicitly says not to
cut a release until the binary CI refresh lands).

**Consequence for the bump sequence (does NOT block this feature's verify gate):**
the post-bump release readiness is: epic-level final loop passes → `bump-version.sh
minor` (bumps + pushes manifests, stamps research-view as `0.6.0`) → **the existing
research-view binary CI refreshes the prebuilt dist** → installer version-match
passes → publish/cut. The binary refresh is the existing CI's job, not an inline
step here. This feature's gate verifies the ABSORPTION's correctness; the stale-binary
condition is a standing release-pipeline item the bump simply must not get ahead of.
(If the operator wants the stale binaries fixed as part of this push, that's a
separate `research-view`-scoped task — flag at the bump, don't fold into the absorption.)

## Other agent review

**Design consensus** (Codex high-effort, session `…129172c22fb8`), 2 passes:
- **Pass 1** — 1 blocker (acceptance misses stale `research-view` dist binaries →
  installer fails) + 2 important (ard.json-retirement note missing from VERSIONING.md;
  acceptance too narrow). Resolved: research-view staleness confirmed PRE-EXISTING
  + CI-handled (out of absorption scope — a release sequencing dependency, not an
  inline fix); VERSIONING.md note added; gate WIDENED to 9 checks. The widened gate
  **caught a real bug** — `HANDOFF.md:107` stale backtick `templates/dispatch.md`
  (deleted by collapse-vendoring; link-checker misses backtick spans) → repointed to
  `ard-core/kernel/templates/dispatch.md`.
- **Pass 2: "no blockers — consensus."** Peer independently re-verified all 9 gate
  checks + the HANDOFF fix + the VERSIONING note + the research-view scope boundary.
  One nit (stale "6-check" wording) — fixed.

**Verify-now gate: PASSING** (lead + peer verified) — conformance 57/57, gen-check
in sync, lint shim + refresh-scan run, versions lockstep 0.5.0, whole-plugin
deleted-path scan clean, 0 dangling links, 4 skill validators pass, VERSIONING
absorption note present. The **bump-later** action (minor 0.5.0→0.6.0, auto-push)
is held for the deliberate final step after the epic-level cross-model loop.
