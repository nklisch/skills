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
- **The verbatim meta-fence ENFORCER** — `ard/tools/meta-fences.py` was already
  NOT ported (the scaffold left it out), so there is no enforcer in the absorbed
  tree to delete. (`gen-contract.py` SURVIVES — it's the catalogs.json regenerator
  per the scaffold's SSOT fork, not a drop.)

### `ARD-Version` stamp policy (decided — peer-surfaced)

The `ARD-Version: 0.7.0` stamps in 10 `ard-core/` files (`discipline.md`,
`kernel/README.md`, the 4 `templates/*`, `lint-citations.py`, `conformance/run.py`,
`conformance/README.md`, `tools/gen-contract.py`) **are KEPT as passive internal
snapshot-version metadata** — they record which ARD snapshot `ard-core/`
represents (useful for the revisit-if-2nd-adopter re-extraction). They are already
passive (the meta-fence *enforcer* was never ported), so the absorption retires
the *fence* (enforcement), not the *stamp* (provenance). **Do NOT strip them.**
What changes: any *prose that frames them as a vendoring meta-fence / dual-pin
artifact* (e.g. `discipline.md:6` "verbatim vendorable artifact per ard.json")
gets reframed to "internal snapshot metadata"; the stamp lines themselves stay.
(Rejected: strip all stamps — loses the snapshot-provenance the re-extraction
escape hatch wants, for no gain since they're already non-enforcing.)

### Adopter-vendoring language in the conformance surface (in scope — peer-surfaced, pass 2 + 3)

The "a thing adopters vendor / your vendored-or-ported lint" framing appears in
**three** conformance files (all from when ARD was a published framework others
adopt). Post-absorption `ard-core/conformance/` is internal — **reframe all three**
to internal / reference-lint validation phrasing:
- `conformance/README.md:4` — "**Vendor this directory** and run it against your
  **vendored or ported** lint".
- `conformance/expected.json:2` — `_comment`: "Any **vendored or ported** lint
  must reproduce these" (pass-3 blocker — same framing, must go too).
- `conformance/run.py:8` — "Any **adopter who vendored or ported**…".

**Genuinely different — LEAVE AS-IS (whitelist with rationale):**
- The generic `run.py --lint <path>` "validate your own implementation"
  *capability* text — that's the runner's portable usage, not adopter-vendoring framing.
- `lint-citations.py:175` "Attestations are **vendored substrate** a compromised
  or hostile source could…" — this is the **SSRF / untrusted-source threat model**,
  a different sense of "vendored" (third-party content fetched into the substrate),
  unrelated to plugin-vendoring. Do not touch.
- `lint-citations.py:105` "a vendored lint" — borderline-generic capability note;
  reword only if trivially clear, else leave (low value, churns byte-identity).

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
- **Channel manifests + marketplace (peer-surfaced)** — the "Adopts ARD v0.X"
  string lives across **4 surfaces / 5 occurrences**: `.claude-plugin/plugin.json:3`,
  `.codex-plugin/plugin.json:4` **and** `:14`, `package.json:4`, root
  `.claude-plugin/marketplace.json:45` (the staler v0.5.1). Reframe all to the
  absorbed identity (drop the external version-pin phrasing). The marketplace-facing
  surface — do not miss it. (See Unit 2 for the authoritative line list.)
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

No `ard-sync`, `vendored_paths`, `not_yet_vendored`, `drift_check`, or
vendoring-narrative references survive in the plugin (the **absorbed-identity
end state** — the authoritative check is the narrowed grep in `## Testing`, not a
blanket `adopts` sweep: the word `adopts`/`adopted` legitimately survives in
prose describing that the *plugin* adopted ARD as its internal discipline — only
the *external version-pin* "adopts ARD vX" phrasing goes). Docs describe the
absorbed model and name the rejected path + escape hatch inline. `check-doc-links`
(or the repo's link checker) passes — no dangling links to removed paths or to the
(root-half) submodule.

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

### Scope expansion (design-review pass 1 — vendoring narrative is repo-wide, not plugin-dir-only)

The first design draft scoped to the plugin dir. The peer found vendoring
narrative the absorption must reframe in **more places**, including inside the
`ard-core/` tree itself (those files were copied verbatim from the separate-repo
source and carry its framing):

- **`AGENTS.md:17` (REPO ROOT, canonical)** — the plugin-map row says
  agentic-research "vendors ARD's `kernel/` consumption-contract surface, pinned in
  `plugins/agentic-research/ard.json`." Canonical repo guidance — reframe to the
  absorbed model (ARD is internal; no `ard.json` pin).
- **`ard-core/kernel/discipline.md:6`** — the canonical discipline body itself says
  "This is a `verbatim` vendorable artifact (per `ard.json`)." Now false (no
  `ard.json`; it IS the source, not a vendorable copy). Reframe — but **carefully**:
  this is the discipline that gets inlined into dispatches, and it is also a
  byte-source for any future re-distillation. Reword the vendoring framing to the
  absorbed reality without disturbing §1-8 (the must-travel content). NB: editing
  this file changes the conformance/byte-identity story vs the `ard/` source — the
  scaffold's "byte-identical to source" property is intentionally broken here
  (absorbed ≠ vendored); note it so a future diff-check doesn't flag it.
- **`ard-core/kernel/README.md:55`** — a whole "## Vendoring + drift checks"
  section; reframe/remove.
- **`ard-core/README.md:9`** — the migration-status note (authored by the scaffold);
  once F3 lands, the migration IS complete, so soften "the plugin's skills/scripts
  are repointed BY collapse-vendoring" → "are repointed" (present tense; the
  hedge is no longer needed post-F2/F3).
- **`skills/research-orchestrator/SKILL.md:382`** + **`skills/convert/SKILL.md:94`**
  ("ARD v0.6.0 supplies…") + **`templates/acquisitions.md:1`** (the
  "NOT a vendored ARD artifact / carries no ARD-Version" comment) — reframe the
  separate-framework / version-pin / vendoring language.

### Units

1. **Delete the sync machinery** — `git rm scripts/ard-sync.py
   scripts/tests/test_ard_sync.py ard.json`. Sweep for any remaining import/ref to
   `ard_sync` or `ard.json` (the `tests/` dir may have an `__init__` or runner).
   **Public-surface note:** `README.md:10` documented `ard.json` as "public truth"
   — retiring it is part of why the **conformance-bump (F4) bump may be major /
   needs the pre-1.0 exception note** (already flagged in F4). Name that dependency.
2. **Reframe the channel manifests + marketplace (4 surfaces / 5 occurrences)** —
   `.claude-plugin/plugin.json:3`, `.codex-plugin/plugin.json:4` **and** `:14`
   (two occurrences in this file), `package.json:4`, root
   `.claude-plugin/marketplace.json:45` (the staler v0.5.1 one). Replace
   "Adopts ARD v0.X" with the absorbed-identity phrasing (ARD is the plugin's
   internal discipline; no external version pin). Keep the cross-channel `version`
   fields (plugin semver) in lockstep — they are NOT the ARD version.
3. **Reframe `README.md`** — the lead ("Adopts ARD v0.6.0 … pinned in ard.json …
   Upstream framework by Kevoun") → absorbed model; README:32 ("vendored verbatim")
   → "wraps `ard-core/kernel/discipline.md`" (the F2-flagged drift). Name the
   rejected separate-repo path + the revisit-if-2nd-adopter escape hatch inline.
4. **Reframe `docs/{VERSIONING,ADOPTION,ARCHITECTURE,HANDOFF}.md`** — remove the
   dual-pin / vendor-map tables (ADOPTION's "Vendor-mode taxonomy" §31-39 +
   "Vendor map" §41-56 — both pure vendoring, delete; the rest of ADOPTION is
   real substrate content that SURVIVES: Adoption stance, Standing-up `.research/`,
   The discipline, The verification floor, Cross-harness degradation), VERSIONING's
   re-sync rows, the workbench/engine split, the byte-parity fence narrative.
   Repoint any `scripts/{lint-citations,catalogs,conformance,schema}` reference to
   `ard-core/kernel/...`. Describe the absorbed, empirical-first model; point at
   `ard-core/evidence/` (primary warrant) + `ard-core/theory/` (opt-in).
   **`HANDOFF.md` — touch ONLY vendoring/identity language; preserve the live
   `.work`↔`.research` contract semantics** (`HANDOFF.md:21` is the working
   contract — do not disturb it). While here, reconcile a **pre-existing**
   inconsistency the peer surfaced (independent of vendoring): `research-handoff/SKILL.md:32`
   still expects a campaign `dispatch.md`, while `research-orchestrator/SKILL.md:241`
   says a work-item-commissioned engagement carries the registration on the work
   item (no `dispatch.md`). Align the two — small, but it lives in the same files;
   if it proves larger than a wording fix, park it as a separate backlog item
   rather than expand F3's scope.
5. **Rewrite the F1 dangling links** — `ard-core/SPEC.md` (5 targets:
   `VERSIONING.md`, `LICENSE`, `ADOPTING.md`, `example/`, `.research/`) +
   `ard-core/theory/README.md` (`../.gitignore`), per `ard-core/.dangling-links-inventory.md`.
   Per-target calls (peer-refined):
   - `.research/` → **repoint to `theory/`** (the trace tier ported there).
   - `example/`, `ADOPTING.md`, `../.gitignore` → **drop** (publication surface /
     source-relative path with no absorbed equivalent).
   - `VERSIONING.md` → repoint to the plugin's reframed `../../docs/VERSIONING.md`
     **only if** that doc now owns the internal ARD snapshot/version policy
     (Unit 4 decides); otherwise **drop** the header link.
   - `LICENSE` → repoint to the repo/plugin LICENSE **only if** that link is
     intentionally useful in `ard-core/SPEC.md`; otherwise **drop** the badge.
   Re-run the full-tree dangling scan → asserts clean.

### Implementation order
1. Unit 1 (delete sync machinery + ard.json) — removes the things the docs point at
2. Units 2-4 (reframe manifests + README + docs) — can interleave; all narrative
3. Unit 5 (rewrite ard-core dangling links) — last; re-scan asserts clean

### Child stories
**None** — one coherent doc-reframe + delete stride. Tightly coupled (every unit
serves the single "absorbed identity, no dangling refs" end-state); shared
acceptance (the sweeps below). No parallelizable independent chunk.

## Testing
- **No vendoring-narrative survives** (NARROWED grep — the broad one false-positives):
  `rg -i "ard-sync|adopts ARD|vendored_paths|not_yet_vendored|drift_check|dual-pin|meta-fence|vendorable|workbench/engine|pinned in.*ard\.json"` over the plugin + `AGENTS.md` → empty (except the `.work` item itself).
  **Do NOT grep bare `byte-identical|byte-parity`** — those are valid in
  `scripts/research-view.sh:22` + `research-view-parity.test.sh:2` (the
  research-view Rust/bash parity, unrelated to ARD vendoring). **`vendored-source`
  in `ard-core` is a research-acquisition concept** (a source class), NOT plugin
  vendoring — whitelist it. Check `byte-identical` hits by hand for ARD-vendoring
  context only.
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
