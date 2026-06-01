---
id: epic-agents-rules-autoload-convert-safety
kind: feature
stage: done
tags: [skill]
parent: epic-agents-rules-autoload
depends_on: [epic-agents-rules-autoload-convert-extract]
release_binding: 0.9.0
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

## Implementation notes (2026-05-31)

Implemented all six units in `convert/SKILL.md` and reconciled
`references/legacy-overlap-migration.md`. Re-read the post-`convert-extract`
file first (line numbers had shifted); built on Phase 6.5, the slim AGENTS
template, and the `agile-workflow:rules` marker convention without contradicting
them.

**Unit 1 — Content-integrity gate.** Added a single mandatory
"Content-integrity gate (before any destructive op)" rule as a blockquote in
Phase 1.8, sited immediately above the existing reference-integrity rule and
declared to run FIRST. Scope = ALL destructive overwrites (delete / move /
symlink / shim / copy-over / managed-section overwrite / mirror replacement).
Defined as a hard precondition: every block must be terminal or the op does not
run. Referenced (not re-defined) from every destructive site. Added an explicit
"plugin-managed-marker content never counts as preserved user-content" rule.

**Unit 2 — Block-level preservation manifest.** Added a `#### Block-level
preservation manifest` subsection: Markdown-aware block boundaries (frontmatter,
heading sections, atomic fences/tables/lists, atomic HTML marker regions,
blank-line paragraph groups when no headings); per-block classify
(`structural-pattern` | `rule-prose` | `ambiguous`) → route → terminal state
(`landed_existing` | `landed_this_run` | `preserved_in_place` | `ambiguous`,
idempotent); provenance verification via `sha256(normalized source block)`
written as a trailing `<!-- agile-workflow:provenance src-sha256=... -->` comment
+ required semantic anchors, NOT byte-hash; keep-source-if-no-trustworthy-
provenance. Added a `#### Manifest edge cases` subsection covering empty,
already-shimmed, symlink-loop/dangling (`unsafe`), and partial-prior-migration.

**Unit 3 — convert-owned verbatim legacy-pattern importer.** Replaced every
"fold/defer per gate-patterns Phase 1" instruction (Phase 7 legacy
`.claude/rules/patterns.md` handling AND Phase 8.6 bespoke convergence) with a
convert-owned importer that writes each legacy structural-pattern block to
`.agents/skills/patterns/<slug>.md` in the gate-patterns Phase 4 file format +
Phase 5 index format, VERBATIM with NO 3+-occurrence discovery filter, then
updates the index idempotently. Stated the discovery-vs-import ownership split
in three places (Phase 7 importer block, Phase 8.6, Guardrails). Confirmed for
myself that gate-patterns Phase 1 only reads existing patterns and Phase 3
enforces the 3+ filter — so it is a discovery writer, never a lossless importer.

**Unit 4 — canonical-destination reconciliation.** Routed legacy NON-pattern
rule prose to `.agents/rules/<name>.md` (e.g. `project.md`) consistently in
Phase 2.5, Phase 7, Sync S1, and Sync S3 — never the AGENTS canonical file.
Grepped all prose-routing sites; the Codex pass named two (Phase 7, S3) but I
found and fixed more: Phase 2.5 ("→ the selected AGENTS target"), the Phase 7
`## Imported Claude Pattern Rules` heading + shim text, S1's `.claude/rules`
routing summary, and a stale S4 preservation exception that listed "imported
legacy Claude pattern-rules content" as living in AGENTS-outside-markers (now
corrected to entrypoint-only). Added the plugin-managed-marker exclusion. Also
reconciled the reference's DIY→canonical mapping table, the single-owner deferral
table, and the patterns.md split note.

**Unit 5 — carve-outs + verified delegation + drift_user atomicity.**
`patterns.md` carve-out: it is NEVER "generated cleanup", so the `generated-only`
shortcut does not authorize shimming it — shim only under explicit per-path
confirmation AFTER the content-integrity gate passes (stated in Phase 7 and S3).
Phase 8.6 now verifies imported patterns landed (presence + provenance + anchors)
BEFORE removing the bespoke source. S3 drift_user/ambiguous sequence is now
**confirm → import → verify → shim** (never shim before a verified import),
stated in both S3 and the reference.

**Unit 6 — edge cases.** Covered in the `#### Manifest edge cases` subsection
(Unit 2) and the reference's content-integrity-on-move procedure: empty file →
`empty` (still confirm + reference-integrity, no migration); already-shimmed →
verify target non-dangling, don't migrate shim text; symlink loop/dangling →
`unsafe`, leave in place; partial prior migration → idempotent manifest, no
duplication.

Also added: a content-integrity-on-move procedure to
`references/legacy-overlap-migration.md` (sited above reference-integrity-on-move,
declared to run first), and tied the Phase 6.5 "verify before slimming" step to
the content-integrity gate (the managed-section-overwrite is the gate specialized
to the AGENTS slim — convert-extract's work, now cross-referenced not duplicated).

### Design judgments logged
- Kept the gate defined ONCE (Phase 1.8 blockquote) and referenced from 14 sites
  rather than copying the full text — per the "define once, reference" constraint
  and the largest-blast-radius risk note.
- Cited gate-patterns Phase 4 (file format) + Phase 5 (index format) for the
  importer, not Phase 1 (which only reads existing) — Phase 1 mentions remaining
  in the doc explicitly say "defines the file/index format", no discovery routing.
- Provenance comment uses the existing `agile-workflow:` HTML-comment marker
  namespace for consistency with the plugin's marker convention.

### Verification grep results (read-through is the test)
- **(a) every destructive site references the content-integrity gate** — 14
  `content-integrity`/`content integrity` references: gate definition (Phase
  1.8), Phase 2.5 shim, Phase 6.5 slim/managed-section overwrite, Phase 7
  Claude-file replace + legacy-rules shim (×2), Phase 8 legacy-cleanup git mv/rm,
  Phase 8.6 bespoke-source removal, Sync S1 entrypoint heuristic, Sync S3
  entrypoint replace + legacy-rules shim + cleanup candidates (×2), Guardrails.
- **(c) routing consistent** — `grep -nE '(rule[ -]?prose|style.*prose|agent-rule
  prose).*(canonical instruction file|AGENTS target|into AGENTS)'` returns NONE.
  All rule-prose destinations are `.agents/rules/<name>.md`.
- **(d) verbatim import does not invoke discovery** — `grep` for "fold/defer per
  gate-patterns Phase 1" returns NONE; the only remaining `gate-patterns Phase 1`
  mention explicitly scopes it to file/index *format*. Seven "NO 3+-occurrence /
  no discovery filter" statements present.
- **(e) convert-extract work intact** — Phase 6.5 (rules-first-then-slim), the
  `agile-workflow:rules:start/end` markers, the slim AGENTS template, and the
  verify-before-slimming step are all present and unbroken.

## Review (2026-05-31, deep lane, cross-model via Codex/peeragent)

Codex (effort high) reviewed implementation commit `abaf56e`. Verdict: **Block** —
2 blockers + 2 important. All fixed inline (small, clear, safe corrections mapping
1:1 to the findings), then re-verified:
- **Blocker — `preserved_in_place` could still be destroyed.** The gate conflated
  *content-safe* with *source-removable*. Fixed: the gate now splits into
  **source-eliminating ops** (delete/move/shim/symlink — permitted ONLY when every
  user block is `landed_*`; any `preserved_in_place`/`ambiguous` block keeps the
  source) vs **regenerable-copy ops** (managed-section overwrite, mirror replace —
  only after the canonical home is verified). Phase 7's shim condition and the
  `preserved_in_place` manifest note updated to match.
- **Blocker — provenance could false-positive "preserved".** Replaced "digest
  present + semantic anchors" with **recompute-and-compare**: normalize the
  destination region (excluding the marker), hash it, and require equality with the
  recorded `src-sha256`; a marker/anchor alone is never sufficient. Mismatch (or no
  locatable region) → `preserved_in_place`, keep source. The verbatim importer
  hash-matches by construction.
- **Important — ungated destructive sites.** Added the content-integrity gate to
  nested-Claude-duplicate normalization (claude-source carve-out + sync) and
  `.claude/skills/*` mirror replacement.
- **Important — Phase 2.5 routing contradiction.** "all imported content → canonical
  instruction file" now carves out legacy rule-prose → `.agents/rules/<name>.md`.

Re-verification greps: "Source-eliminating ops" + "every user block is landed"
present; "Verify by recomputing" present; old weak-anchor language gone (0); 14
content-integrity references; Phase 2.5 carve-out present; hook script still parses.
Bounce count: 1 (fixed inline, not re-queued). Verdict after fixes: **Approve** —
advanced `review → done`. The autopilot Phase 8 final loop will re-review the full
bundle as backstop.
