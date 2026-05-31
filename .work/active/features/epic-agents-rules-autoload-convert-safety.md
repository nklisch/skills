---
id: epic-agents-rules-autoload-convert-safety
kind: feature
stage: implementing
tags: [skill]
parent: epic-agents-rules-autoload
depends_on: [epic-agents-rules-autoload-convert-extract]
release_binding: null
gate_origin: null
created: 2026-05-31
updated: 2026-05-31
---

# convert legacy-cleanup data-safety (content-integrity gate)

## Brief

Harden `convert` so legacy cleanup can NEVER lose data. Add a **content-integrity
gate** distinct from the existing reference-integrity (pointer-rewrite) rule: for
every legacy artifact, before any destructive step (`git rm` / shim /
symlink-replace), verify the content is present at its canonical replacement. For
split-destination files (notably `.claude/rules/patterns.md` → structural patterns
to `.agents/skills/patterns/`, prose to `.agents/rules/agile-workflow.md`),
implement a **block-level preservation manifest** (Codex finding 6): classify each
source block, route + hash-verify it to its destination OR preserve it in place as
ambiguous, before anything is shimmed/removed.

Addresses the 6 audit findings recorded in the epic body. Also adds a `patterns.md`
carve-out from `generated-only` cleanup (finding 5) and verifies bespoke-skill
convergence imports actually succeeded before removing the source (finding 6).
Backward-compat: full-AGENTS.md projects on `--update` migrate without loss.

Does NOT cover: the AGENTS.md slim itself (that's `convert-extract`); this feature
generalizes the content-integrity guarantee to all legacy artifacts.

## Epic context
- Parent epic: `epic-agents-rules-autoload`
- Position in epic: builds on `convert-extract`; same file (`convert/SKILL.md`),
  serialized via depends_on to avoid contention.

## Foundation references
- `plugins/agile-workflow/skills/convert/SKILL.md` — Phase 1.8 reference-integrity,
  Phase 2.5 routing, Phase 7, Phase 8.6, Sync S1/S3 (line numbers shifted after
  convert-extract; re-grep anchors at implement time)
- `plugins/agile-workflow/skills/convert/references/legacy-overlap-migration.md`
  — DIY→canonical mapping, patterns.md split note
- Parent epic body — the 6 data-safety findings
- `plugins/agile-workflow/skills/gate-patterns/SKILL.md` — Phase 1/4 (proves it is
  a *discovery* writer, not a lossless importer — see Codex finding below)

## Other agent review (Codex via peeragent, 2026-05-31)

One focused cross-model advisory pass on the planned content-integrity gate.
Accepted findings, folded into the design:
- **`gate-patterns Phase 1` is not a lossless import primitive** — it only writes
  patterns its 3+-occurrence discovery filter returns and explicitly says legacy
  `patterns.md` is convert's job. "Fold per gate-patterns Phase 1" can drop legacy
  single-use patterns / prose. → define a **convert-owned verbatim legacy-pattern
  import** (reuse the `.agents/skills/patterns/<slug>.md` + index format, NO
  discovery filter).
- **Byte-hash verify is too strict** when destinations reformat → use
  **source-digest provenance**: per source block, `sha256` of normalized text
  written into destination metadata/comment; verify destination presence + required
  semantic anchors. No trustworthy provenance writable → keep source in place.
- **Canonical-destination ambiguity**: convert-extract routes user prose to
  `.agents/rules/<name>.md` but Phase 7/S3 still route to AGENTS. → pick ONE rule:
  legacy non-pattern rule prose → `.agents/rules/<name>.md` (e.g. `project.md`);
  reconcile Phase 2.5/7/S3. Never count content inside plugin-managed markers as
  "preserved".
- **Gate scope = ALL destructive overwrites**: delete, move, symlink, shim,
  copy-over, managed-section overwrite, mirror replacement — not just
  `git rm`/shim/symlink.
- **Markdown-aware block boundaries**; idempotent manifest states; edge cases.

## Design decisions
- **Content-integrity is a new, mandatory gate distinct from reference-integrity**
  — reference-integrity preserves *pointers*; content-integrity preserves
  *content*. Both run before any destructive op; content-integrity first.
- **Legacy non-pattern rule prose canonical destination = `.agents/rules/<name>.md`**
  (not AGENTS) — consistent with the new `.agents/rules/` convention; the hook
  loads it. convert-safety reconciles the Phase 2.5/7/S3 routing.
- **Verbatim legacy import, never discovery** — convert owns a lossless importer;
  it does not route legacy content through gate-patterns' discovery filter.

## Implementation Units

Edits to `plugins/agile-workflow/skills/convert/SKILL.md` and
`references/legacy-overlap-migration.md`. Single cohesive gate; no child stories.

### Unit 1: Content-integrity gate (the core rule)
Add a "Content-integrity (mandatory, before any destructive op)" rule next to the
Phase 1.8 reference-integrity rule and reference it from every destructive site.
Definition: before **delete / move / symlink / shim / copy-over /
managed-section overwrite / mirror replacement** of any legacy artifact, verify
every block of its content is either (a) present at its canonical destination
(presence + provenance digest + semantic anchors) or (b) explicitly preserved in
place. If any block is unaccounted-for, **do not perform the destructive op** —
leave the artifact and report. Distinct from, and runs before, reference-integrity.

### Unit 2: Block-level preservation manifest
Define the manifest convert builds for a split/legacy file before touching it:
- **Markdown-aware blocks**: frontmatter = 1 block; each heading section = 1 block;
  fenced code / tables / lists kept atomic; HTML marker regions atomic; no headings
  → blank-line paragraph groups, keeping intro+fence together.
- **Per block**: classify → `structural-pattern` | `rule-prose` | `ambiguous`;
  route (patterns → `.agents/skills/patterns/`; rule-prose → `.agents/rules/<name>.md`;
  ambiguous → preserve in place); record state `landed_existing` | `landed_this_run`
  | `preserved_in_place` | `ambiguous` (idempotent — never duplicate a block).
- **Provenance verify** (not byte-hash): write `sha256(normalized source block)`
  into the destination as a trailing HTML comment / metadata, and verify presence +
  required semantic anchors. If no trustworthy provenance can be written, keep source.

### Unit 3: convert-owned verbatim legacy-pattern import
Replace "fold per gate-patterns Phase 1" (Phase 7 legacy `.claude/rules/patterns.md`
handling + Phase 8.6 bespoke convergence) with a convert-owned importer that writes
each legacy structural-pattern block to `.agents/skills/patterns/<slug>.md` in the
gate-patterns file/index format **verbatim, with NO 3+-occurrence filter**, then
updates the index. gate-patterns remains the *discovery* writer for new patterns;
convert owns lossless *import* of existing ones.

### Unit 4: Canonical-destination reconciliation
Update Phase 2.5, Phase 7, and Sync S3 so legacy non-pattern rule prose routes to
`.agents/rules/<name>.md` (e.g. `project.md`), consistently — not AGENTS. State
explicitly that content inside plugin-managed markers (`agile-workflow`,
`agile-workflow:rules`) is never counted as user-content "preserved".

### Unit 5: Carve-outs + verified delegation + drift_user atomicity
- **patterns.md carve-out**: never "generated cleanup"; shim only under explicit
  path confirmation AFTER content-integrity passes (overrides the
  `generated-only` shortcut at Phase 7).
- **Verified convergence (Phase 8.6)**: after importing bespoke patterns, verify
  they landed (Unit 2/3) before removing the bespoke source.
- **drift_user atomic sequence** (S3): confirm → import → **verify** → shim; never
  shim before verified import.

### Unit 6: Edge cases
Empty file → manifest `empty` (still confirm + reference-integrity, no migration);
already-shimmed → verify target exists/non-dangling, don't migrate shim text;
symlink loop/dangling → classify unsafe, leave in place; partial prior migration →
idempotent manifest, no duplication.

## Implementation Order
1. Unit 1 (gate rule) → Unit 2 (manifest) → Unit 3 (importer) → Unit 4 (routing
   reconcile) → Unit 5 (carve-outs) → Unit 6 (edge cases). Then re-grep the
   destructive sites and attach the gate reference to each.

## Testing
Skill doc — no automated harness. Verification: read-through confirming every
destructive site (delete/move/symlink/shim/copy-over/managed-section
overwrite/mirror replace) references the content-integrity gate; the manifest
states are coherent; routing destinations are consistent (no AGENTS vs
`.agents/rules/` contradiction); the verbatim-import path does not invoke
discovery. The mechanized guarantee is prose, not code — so the read-through IS
the test.

## Risks
- **Largest blast radius in the epic** — touches every convert destructive path.
  Mitigate by referencing one central gate rule rather than duplicating logic.
- **Routing reconciliation** may surface more Phase 7/S3 inconsistencies than the
  one Codex found — re-grep all prose-routing sites during implement.
- This feature edits the same file as `convert-extract` (done) — no contention
  now, but re-read the post-extract SKILL.md before editing.

## Child stories
None — one cohesive gate across convert. Large but single-concern; splitting would
fragment the gate definition.
