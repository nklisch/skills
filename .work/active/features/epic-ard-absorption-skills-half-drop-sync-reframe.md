---
id: epic-ard-absorption-skills-half-drop-sync-reframe
kind: feature
stage: drafting
tags: [plugin]
parent: epic-ard-absorption-skills-half
depends_on: [epic-ard-absorption-skills-half-collapse-vendoring, epic-ard-absorption-skills-half-evidence-ledger]
release_binding: null
gate_origin: null
created: 2026-06-24
updated: 2026-06-25
---

# Drop the sync machinery + reframe plugin docs to empirical-first

## Brief

Retire the byte-vendoring / dual-pin machinery entirely, and rewrite the plugin's
identity docs to the absorbed, empirical-first model. After this feature there is
no `ard-sync.py`, no `adopts` pin, no verbatim meta-fence — and the docs describe
ARD as the plugin's internal, empirically-warranted discipline (a periodically
distilled snapshot of practice), not a separately-published framework the plugin
vendors.

## Dependencies (both peer-confirmed)

- **`collapse-vendoring`** — both this and F2 touch `ard.json` and `README.md`;
  serializing avoids merge churn on the same files, and the doc reframe reads more
  honestly *after* the vendoring is gone (docs describe the landed state, not a
  half-migrated one).
- **`evidence-ledger`** — the doc reframe NAMES `ard-core/evidence/` as the
  **primary warrant tier**. Pointing the docs at an *empty* evidence tier would
  ship an incoherent migration (peer pass-2 blocker). So the seeded tier must
  exist before this feature reframes the docs. This transitively gates
  `conformance-bump` on the evidence seed too — the terminal ship path can no
  longer finish with an unseeded warrant tier.

## What to drop

- **`scripts/ard-sync.py`** + **`scripts/tests/test_ard_sync.py`** — deleted.
- **`ard.json`** — strip `adopts`, `vendored_paths`, `not_yet_vendored`,
  `drift_check`. Decide at design whether anything meaningful survives (e.g. a
  `framework`/`homepage`/snapshot-version record) or the file is retired entirely.
  If a snapshot-version record is kept, it is the **internal** ARD snapshot
  version (decoupled from plugin semver) — the root-half's versioning sub-decision.
- **The verbatim meta-fence** — `ARD-Version:` stamping machinery and any plugin
  reference to `ard/tools/meta-fences.py`. (`gen-contract.py` is a separate
  question — it MAY survive in `ard-core/` as the catalogs.json regenerator; that
  is the scaffold feature's SSOT fork, not a drop here.)

## Docs to reframe (empirical-first identity)

- `README.md` — leads today with "Adopts ARD v0.6.0 … pinned in ard.json …
  Upstream framework by Kevoun." Rewrite to the absorbed model. **Also README:32**
  (flagged by F2's impl review): the `research-discipline` bullet still says
  "ARD `kernel/discipline.md` vendored verbatim" — reword to "wraps
  `ard-core/kernel/discipline.md` (the single source)", matching the collapsed
  SKILL.md F2 landed.
- `docs/VERSIONING.md`, `docs/ADOPTION.md`, `docs/ARCHITECTURE.md`,
  `docs/HANDOFF.md` — every reference to the dual-pin, the vendor map, the
  workbench/engine split, the byte-parity fence.
- The `research-discipline` skill's "vendored verbatim from ARD kernel" framing
  (it now wraps `ard-core/discipline.md`, the single source).
- **Channel manifests + marketplace (peer-surfaced)** — the "Adopts ARD v0.6.0"
  string also lives in `.codex-plugin/plugin.json:4`, `.claude-plugin/plugin.json:3`,
  `package.json:4`, and the root `.claude-plugin/marketplace.json:43`. Reframe
  all four to the absorbed identity (drop the version-pin phrasing, or replace
  with the internal-snapshot phrasing if the versioning sub-decision keeps a
  snapshot record). This is the marketplace-facing surface — do not miss it.
- **Dangling local links in the copied `ard-core/` docs (handed off from F1).**
  The scaffold copies `ard-core/SPEC.md` + `ard-core/kernel/README.md` verbatim,
  which carry markdown links to files the absorption does NOT port (`VERSIONING.md`,
  `ADOPTING.md`, `example/`, `ard.json`, `LICENSE`, `.research/`). F1 inventories
  them (its dangling-link scan); **F3 rewrites or removes them** — repoint to the
  absorbed equivalents where one exists (e.g. ARD versioning narrative now lives in
  the plugin's reframed `docs/VERSIONING.md`), drop the rest. Use F1's recorded
  inventory as the worklist; re-run the dangling-link scan after the rewrite and
  assert it's clean (`check-doc-links` over `ard-core/`).

**Name inline (artifacts-defend-themselves-inline discipline):**
- the **rejected** separate-repo / dual-pin / publication path (and *why* — publication judged dead);
- the **revisit-if-2nd-adopter** escape hatch (re-extract `ard-core/` to a standalone repo, extract-on-demand not rebuild).

## Empirical-first reframe content

The docs should land the reframe substance from the decision note: the empirical
*practice → observe → improve* loop is the engine; theory is opt-in vocabulary /
guardrails / stress-testing, not warrant; `ard-core/evidence/` is the primary
warrant tier. Point at `ard-core/evidence/` and `ard-core/theory/`.

## Epic context

- Parent epic: `epic-ard-absorption-skills-half`
- Position in epic: the identity/cleanup feature — runs after vendoring is gone.

## Foundation references

- Root decision note `2026-06-24-ard-absorption-decision`.
- `plugins/agentic-research/ard.json`, `README.md`, `docs/*`.

## Verification

No `ard-sync`, `adopts`, `vendored_paths`, or meta-fence references survive in
the plugin. Docs describe the absorbed model and name the rejected path + escape
hatch inline. `check-doc-links` (or the repo's link checker) passes — no dangling
links to removed paths or to the (root-half) submodule.

---

## Design (grounded against the surface)

### Decisions (grounded at design)

- **`ard.json` is RETIRED entirely, not stripped.** After removing the vendoring
  keys (`adopts`, `vendored_paths`, `not_yet_vendored`, `drift_check`), the only
  survivors are `framework`/`homepage` (now internal — ARD isn't a separate
  framework the plugin adopts) and `conformance` (which points at the *deleted*
  `scripts/conformance/run.py`). Nothing meaningful survives. Delete the file; its
  consumers (`ard-sync.py`, `test_ard_sync.py`, `ADOPTION.md`, `VERSIONING.md`,
  `README.md`) are all things this feature deletes or rewrites anyway. The
  internal ARD snapshot-version question is the root-half's call; the plugin's own
  semver (in the channel manifests) is the only version the plugin needs.
- **`marketplace.json` carries a STALE "Adopts ARD v0.5.1"** (root
  `.claude-plugin/marketplace.json:45`) — even older than the manifests' v0.6.0.
  The reframe replaces it with the absorbed-identity description (no version pin),
  fixing the drift as a side effect.

### Units

1. **Delete the sync machinery** — `git rm scripts/ard-sync.py
   scripts/tests/test_ard_sync.py ard.json`. Sweep for any remaining import/ref to
   `ard_sync` or `ard.json` (the `tests/` dir may have an `__init__` or runner).
2. **Reframe the channel manifests + marketplace (4 "Adopts ARD vX" strings)** —
   `.claude-plugin/plugin.json:3`, `.codex-plugin/plugin.json:4,14` (×2),
   `package.json:4`, root `.claude-plugin/marketplace.json:45` (the v0.5.1 one).
   Replace "Adopts ARD v0.X" with the absorbed-identity phrasing (ARD is the
   plugin's internal discipline; no external version pin). Keep the cross-channel
   `version` fields (plugin semver) in lockstep — they are NOT the ARD version.
3. **Reframe `README.md`** — the lead ("Adopts ARD v0.6.0 … pinned in ard.json …
   Upstream framework by Kevoun") → absorbed model; README:32 ("vendored verbatim")
   → "wraps `ard-core/kernel/discipline.md`" (the F2-flagged drift). Name the
   rejected separate-repo path + the revisit-if-2nd-adopter escape hatch inline.
4. **Reframe `docs/{VERSIONING,ADOPTION,ARCHITECTURE,HANDOFF}.md`** — remove the
   dual-pin / vendor-map tables (ADOPTION's "vendorable surface" §, VERSIONING's
   re-sync rows), the workbench/engine split, the byte-parity fence narrative.
   Repoint any `scripts/{lint-citations,catalogs,conformance,schema}` reference to
   `ard-core/kernel/...`. Describe the absorbed, empirical-first model; point at
   `ard-core/evidence/` (primary warrant) + `ard-core/theory/` (opt-in).
5. **Rewrite the F1 dangling links** — `ard-core/SPEC.md` (5 targets:
   `VERSIONING.md`, `LICENSE`, `ADOPTING.md`, `example/`, `.research/`) +
   `ard-core/theory/README.md` (`../.gitignore`), per `ard-core/.dangling-links-inventory.md`.
   Repoint where an absorbed equivalent exists (`.research/` → `theory/`), drop the
   rest (`example/`, `ADOPTING.md`, `LICENSE` badge, the gitignore ref). Re-run the
   full-tree dangling scan → asserts clean.

### Implementation order
1. Unit 1 (delete sync machinery + ard.json) — removes the things the docs point at
2. Units 2-4 (reframe manifests + README + docs) — can interleave; all narrative
3. Unit 5 (rewrite ard-core dangling links) — last; re-scan asserts clean

### Child stories
**None** — one coherent doc-reframe + delete stride. Tightly coupled (every unit
serves the single "absorbed identity, no dangling refs" end-state); shared
acceptance (the sweeps below). No parallelizable independent chunk.

## Testing
- **No vendoring-narrative survives:** `rg -i "ard-sync|adopts|vendored_paths|not_yet_vendored|drift_check|dual-pin|byte-identical|byte-parity|meta-fence|vendorable|workbench/engine"` over the plugin → empty (except this feature's own history / the `.work` item).
- **No stale "Adopts ARD vX" / "vendored verbatim"** in any manifest, marketplace, README, or doc.
- **`ard.json`, `scripts/ard-sync.py`, `scripts/tests/test_ard_sync.py` gone.**
- **Dangling-link scan clean:** the full-tree `ard-core/**/*.md` scan from F1 prints nothing; `check-doc-links` (or the repo checker) passes over the plugin.
- **Channel-metadata consistency:** `version` fields still in lockstep across `.claude-plugin`/`.codex-plugin`/`package.json` (bump-version.sh's precondition — F4 runs it).
- **Rejected-path + escape-hatch named inline** in README (per artifacts-defend-themselves-inline).

## Risks
- **Over-deletion of doc content.** The docs carry real, still-true content about
  the `.research/` substrate + the discipline — only the *vendoring narrative*
  goes. Mitigated by reframing (rewrite the vendoring sections) rather than
  wholesale deleting the docs.
- **`marketplace.json` is a ROOT file** (`skills/.claude-plugin/marketplace.json`),
  not under the plugin dir — bump-version.sh's dirty-plugin-dir check won't catch
  an uncommitted marketplace edit. Mitigated by committing it with this feature.
- **A dangling link an absorbed equivalent should fix but I drop.** Mitigated by
  the inventory worklist + judgment per target (repoint where an equivalent exists,
  drop only the genuinely-gone publication surface).
