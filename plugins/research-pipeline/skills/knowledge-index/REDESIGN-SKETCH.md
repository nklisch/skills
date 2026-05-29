---
description: Design rationale for the /knowledge-index v2 redesign. The canonical schema spec lives in SKILL.md — this doc preserves the *why* behind the design.
type: design
updated: 2026-05-03
status: rationale-only — implementation lives in SKILL.md
---

# /knowledge-index — Redesign Rationale

> **This doc is design rationale, not the canonical schema.** For the field spec, lint rules, regenerator workflow, and migration phases, read [SKILL.md](SKILL.md) — that's the load-bearing source of truth. This sketch documents *why* the design landed where it did, the open questions resolved during design, the ds-engine pilot, and the friction discovered there. Future agents authoring docs should read SKILL.md first.

> **Pilot-validated 2026-05-03.** Original 5 open questions resolved; ds-engine 10-doc pilot run; 5 schema revisions applied from [PILOT-FRICTION-LOG.md](PILOT-FRICTION-LOG.md). Implementation landed in SKILL.md and the sibling skills.

## Pilot revisions (2026-05-03)

Applied after the ds-engine 10-doc pilot:

1. **`supersession_note:` is now a first-class optional field.** Used when a doc is partially superseded — parts invalidated by a later change but the doc as a whole remains useful. Distinct from `superseded_by:` (which marks full supersession). 3 of 4 research docs in the pilot needed this.
2. **`decisions:` cap guidance:** 5–9 highest-leverage commitments at index-readable depth. Sub-system details belong in their own architecture doc's `decisions:`, not propagated upward. Lint warns at >12; doesn't block.
3. **Migration phase 2 includes `description:` rewrite.** Existing descriptions are usually content-listings, not question-framings. Repurposing-in-place still requires re-authoring. ~3 min/doc.
4. **Historical-kind summary framing:** "Captures X (as of authorship); not yet refreshed for Y." Distinguishes legacy summaries from their descriptions.
5. **`kind:` is mostly derivable from `type:` + `status:`.** Regenerator defaults it; authors set explicitly only to override. Lint validates the derivation when `kind:` is set explicitly.

See [PILOT-FRICTION-LOG.md](PILOT-FRICTION-LOG.md) for full pilot results.

## Why

Current state (observed across this and prior sessions):

1. **Append-only writes from multiple skills cause drift.** `/research`, `/brief`, `/architecture`, `/epicize` each *append* to `knowledge-index.yaml`. None reconcile. Header claims "auto-generated" but nothing actually regenerates. Stale descriptions persist; recently caught examples: "Primer C blocks ds-engine track" (retired), "Compiled knowledge served to ds-engine via gateway" (after migration).
2. **Description bimodality forces unnecessary file opens.** Some descriptions ("tiered hybrid Pattern C/A/B authoring + four-stage PII") save real reads; others ("Phased build plan.") force opening the file anyway. Bimodal because the field is unstructured prose.
3. **No tiering.** Entire ~26KB file loaded at session start regardless of session topic. Most sessions read <10% of the corpus the index advertises.
4. **No relationship surfacing.** Supersession chains, blocking-brief edges, parent/child campaign links live in frontmatter `related[]` and `superseded_by:` but aren't surfaced in the index. Manual greps required.
5. **No lint.** Doc-on-disk-not-in-index, broken `superseded_by:` chains, frontmatter `updated:` not matching git history, descriptions making grep-falsifiable claims — all caught manually after the fact.

## Architecture (the move)

**Frontmatter is the only source of truth.** `knowledge-index.yaml` is fully regenerated from frontmatter on every `/knowledge-index` invocation. The file is purely derived; sibling skills (`/research`, `/brief`, etc.) write *frontmatter* in their output, and `/knowledge-index` regenerates the index. Sibling skills no longer touch the index file.

**Two-layer index.** A terse top layer always loaded at session start (~5KB). A rich on-demand layer fetched when a topic match triggers it (~25KB).

**Structured rich descriptions.** Replace free-text `description:` with a 3-field schema (`summary` / `decisions` / `consumer_hint`). Optional `kind: planning | research | historical` switches the schema for docs that don't fit (research outputs, archived docs).

**Lint pass runs alongside regenerate.** Catches the silent-drift cases that bit me this session.

---

## New file format

Two files instead of one:

### `docs/knowledge-index.yaml` (always loaded — terse)

```yaml
# Auto-generated. DO NOT EDIT BY HAND. Run /knowledge-index to regenerate.
# Generated: 2026-05-03 from frontmatter scan of docs/.
generated_at: 2026-05-03T18:42:00Z
generated_from: frontmatter
total_docs: 52
schema_version: 2

documents:
  - path: docs/architecture/north-star-ds-engine.md
    title: "North Star: DS-Engine"
    type: north-star
    kind: planning
    updated: 2026-05-03
    consumer_hint: "Read first when joining ds-engine — vision, five components, tier model, scenarios."

  - path: docs/programs/bq-native-execution-surface/super-parent.md
    title: "Program Synthesis: BQ-Native Execution Surface"
    type: brief
    kind: research
    updated: 2026-05-03
    status: draft
    research_method: /research-program
    consumer_hint: "Read when designing the tier policy DAG — three-rung tier model, 41-trap catalog, decision DAG contract."

  - path: docs/briefs/decision-dag-design.md
    title: "Brief: Decision DAG Design"
    type: brief
    kind: historical
    status: superseded
    superseded_by: docs/architecture/dag-design.md
    updated: 2026-03-30
    consumer_hint: "[SUPERSEDED] — pre-migration DAG design; current design lives at superseded_by path."

# ... ~50 more entries, each ~5-7 lines
```

The terse layer carries: path, title, type, kind, updated, optional status/superseded_by/research_method, and the single most useful field: **consumer_hint** — "when should I read this?"

### `docs/knowledge-index-detail.yaml` (on-demand — rich)

```yaml
# Auto-generated. DO NOT EDIT BY HAND.
# Detail layer — load on demand when surfacing a specific doc.
generated_at: 2026-05-03T18:42:00Z

documents:
  docs/architecture/north-star-ds-engine.md:
    summary: |
      Vision and architecture for ds-engine — hosted MCP server with tiered BQ-native/Python
      execution, agent-authored Vega-Lite viz, and an output layer (RunSpec/RunSnapshot/run
      viewer) that unifies adhoc and persistent dashboards.
    decisions:
      - Three-rung tier model (BQ-native / BigFrames-mediated / Python-on-sample) with refused-by-default Tier 3
      - Tiered hybrid viz authoring (Pattern C typed tools default + Pattern A direct JSON fallback + Pattern B narrow)
      - Hybrid render pipeline (vega-embed CSR + vl-convert SSR)
      - GCS+BQ storage; no Firestore; Cloud Tasks (not Cloud Scheduler) for scheduler dedup
      - Four-stage PII scrubbing (query / RunSnapshot persist / spec persist / serve)
    related:
      - {slug: docs/architecture/architecture.md, relationship: "details"}
      - {slug: docs/migrations/grimoire-separation-plan.md, relationship: "context"}

  docs/programs/bq-native-execution-surface/super-parent.md:
    summary: |
      Synthesis of 7 campaigns mapping BQ-native execution surface for ds-engine. Defines
      the three-rung tier model, the 41-trap silent-trap catalog, and the decision DAG
      contract that ds-engine self-publishes post-migration.
    decisions:
      - Tier-1.5 sub-tag for Vertex-backed BQML (cost shape distinct from pure BQ)
      - Unified cost-confirm rule: total_usd_hi > $5 OR high_uncertainty
      - 41 traps catalogued with detection probes and dispatch actions
    related:
      - {slug: docs/architecture/dag-design.md, relationship: "produces-contract-for"}
      - {slug: docs/programs/bq-native-execution-surface/program-report.md, relationship: "evaluated-by"}

# ... ~50 more entries
```

The detail layer is keyed by path (so a single lookup), uses pipe-folded `summary:` for prose, structured `decisions:` for the locked-in commitments, and surfaces `related[]` from frontmatter so I don't have to grep.

---

## Frontmatter convention (what authors need to add)

The current convention is mostly there — strengthen it:

```yaml
---
# Required (already in current convention)
description: |
  One-line "when do I read this?" hook. Becomes consumer_hint in the terse index.
  Frame as the question this doc answers, not as a content list.
type: north-star | architecture | roadmap | brief | program-parent | program-report | design | features | ideate | workon
updated: 2026-05-03

# NEW — required for the rich layer
summary: |                                  # 1-2 sentences, what's in the doc
  Vision and architecture for ds-engine ...

# kind: usually derivable from type + status (see derivation rule below); set explicitly to override
kind: planning | research | historical

# decisions: required for kind: planning, optional for kind: research, forbidden for kind: historical
# Cap: 5-9 highest-leverage commitments at index-readable depth.
# Sub-system details belong in their own doc's decisions, not propagated upward.
decisions:
  - "Three-rung tier model with refused-by-default Tier 3"
  - "Cloud Tasks (not Cloud Scheduler) for scheduler dedup"

# key_findings: required for kind: research, optional for kind: planning, forbidden for kind: historical
key_findings:
  - "Vega-Lite + vega-embed is the lowest-friction agent-authored viz path"
  - "Pattern A direct JSON emission needs schema-validation correction loop"

# supersession_note: optional. Use when parts of the doc are superseded but the whole remains useful.
# Distinct from superseded_by: (which marks full supersession of the entire doc).
supersession_note: |
  Authored 2026-05-02 before the X migration. The "Y" section is superseded;
  the cross-cutting themes and recommendations remain authoritative.

# Optional (existing)
title: Override for first # heading
blocks_phase: "5b"
status: draft | locked | superseded | legacy
superseded_by: path/to/successor.md
research_method: /research | /deep-research | /research-program | hand-written | migrated
related:
  - {slug: ..., relationship: depends-on | extends | contradicts | refines | parallel-to}
---
```

### Field semantics

**`description:` → `consumer_hint` in terse layer.** Frame as the question this doc answers ("Read when designing the tier policy..."), not "what does it contain" ("Three-rung tier policy + 41-trap catalog..."). Authors are nudged toward question-framing.

**`summary:`.** 1–2 sentences on what's in the doc. Different from description: summary tells you *what's in it*; consumer_hint tells you *when to read it*.

**`decisions:` vs `key_findings:`.** The split preserves the genre signal — a reader can tell at a glance whether a bullet is a finding (qualified) or a commitment (locked). Research outputs that bottom-line a recommendation use BOTH fields (`key_findings:` for what the research showed, `decisions:` for what's now committed because of it). Cap `decisions:` at **5–9 highest-leverage commitments** at index-readable depth — sub-system details belong in their own doc, not propagated upward.

**`supersession_note:`.** Use when parts of a doc are stale but the doc is still load-bearing. Common case: research outputs authored before a later architectural pivot. The cross-cutting themes survive; specific framing claims are stale. `supersession_note:` is the structured home for that nuance.

**`kind:` derivation.** Usually derivable from `type:` + `status:`:
- `type: north-star | architecture | roadmap | design | features | ideate | workon` → `kind: planning`
- `type: brief | program-parent | program-report` → `kind: research` (default)
- ANY `type:` with `status: legacy | superseded` → `kind: historical`

The regenerator applies the default. Authors set `kind:` explicitly only to override the derivation; lint validates the override.

**Historical-kind summary framing:** "Captures X (as of authorship); not yet refreshed for Y." Distinguishes legacy summaries from their descriptions and signals the gap relative to current state.

---

## Skill workflow (regenerate-from-frontmatter)

```
/knowledge-index [--lint-only | --no-lint]

1. Glob docs/**/*.md (excluding archived/, _archive/, doc-review-report-*.md)
2. For each file:
   - Parse frontmatter
   - If frontmatter missing or non-conformant → record lint warning, fall back to inference
   - Extract: path, title, type, kind, updated, status, superseded_by, research_method, blocks_phase, related, summary, decisions, description (→ consumer_hint)
3. Run lint pass (see below)
4. Write docs/knowledge-index.yaml (terse) — full overwrite
5. Write docs/knowledge-index-detail.yaml (rich) — full overwrite
6. If --lint-only: skip writes, only print lint report
7. Print summary: N docs indexed, M lint warnings, K lint errors

The skill never preserves hand-edits to either YAML file. Hand-edit the *frontmatter*; regenerate.
```

`/research`, `/brief`, `/architecture`, etc. **stop touching the index file.** They emit conformant frontmatter and call `/knowledge-index` (or document that the user should). This single change eliminates append-drift entirely.

---

## Lint pass (what it catches)

```
✗ ERROR: 3 docs missing required frontmatter (description, type, updated)
  - docs/briefs/old-brief.md
  - docs/programs/foo/legacy.md
  - docs/architecture/draft.md

⚠ WARNING: 2 docs claim kind: planning but no decisions: field
  - docs/architecture/sketch.md
  - docs/architecture/north-star-foo.md

✗ ERROR: 1 broken superseded_by chain
  - docs/briefs/old.md → docs/briefs/new.md (target does not exist)

⚠ WARNING: 4 docs with frontmatter updated: more than 60 days behind git mtime
  - docs/architecture/north-star.md (updated: 2026-01-15, last modified: 2026-04-22)
  ...

⚠ WARNING: 1 doc claims a phase that doesn't exist in roadmap
  - docs/briefs/foo.md blocks_phase: "9z" (roadmap has phases 1-9c)

⚠ WARNING: 2 orphaned doc files — exist on disk but excluded from index
  - docs/briefs/RESUME-STATE.md (no frontmatter)
  - docs/programs/foo/program-status.md (no frontmatter)

✗ ERROR: 1 broken related[] reference
  - docs/programs/foo/parent.md → related: docs/programs/bar (does not exist)
```

Default behavior: errors block index regeneration; warnings print but don't block. `--no-lint` skips. `--lint-only` is a CI mode.

---

## Migration path (for existing projects)

Phase 1 — additive:
1. Update `/knowledge-index` skill to support new schema (this sketch)
2. Existing `description:` field is reused as `consumer_hint` automatically (no breaking change at the field level)
3. New required fields (`summary`, `decisions`/`key_findings`) emit lint warnings, not errors, for first 30 days
4. Run `/knowledge-index` to regenerate — projects keep working with two-layer output

Phase 2 — backfill:
5. For each project's existing docs:
   - **Add `summary:`** — LLM-drafts first-cut from doc body; human reviews. ~1 min/doc.
   - **Add `decisions:` (planning) or `key_findings:` (research)** — LLM-drafts from doc body; human reviews and prunes. Cap at 5–9 decisions. Historical docs skip both fields.
   - **Rewrite `description:` as a `consumer_hint`** — flip "what's in it" framing to "when do I read it?". LLM can draft from `summary:` (it knows the content; just needs to invert the question). Human reviews. ~3 min/doc.
   - **Add `supersession_note:`** for any doc with parts that are stale but the doc remains load-bearing.
   - `kind:` is auto-derived from `type:` + `status:`; only set explicitly to override.

Phase 3 — enforce:
6. After backfill grace period, lint warnings for missing `summary` / `decisions` / `key_findings` become errors (per the kind rules).
7. Sibling skills (`/research`, `/brief`, `/architecture`, `/epicize`) updated to emit the new fields in their output frontmatter and stop touching the index file.
8. Projects with all docs conformant can declare `schema_version: 2` in their knowledge-index header.

---

## Resolved decisions (2026-05-03)

1. **Two files** — `knowledge-index.yaml` (terse, always-loaded) + `knowledge-index-detail.yaml` (rich, on-demand). Both auto-derived from frontmatter. Clean separation; tiering works.

2. **`consumer_hint` is hand-written**, repurposing the existing `description:` field — authors nudged toward "what question does this doc answer?" framing rather than "what's in it?". Zero new author burden.

3. **Lint runs inline** with `/knowledge-index` regeneration. Errors block regeneration; warnings print. `--no-lint` escape hatch and `--lint-only` CI mode supported.

4. **Non-`docs/` knowledge excluded.** README.md / CLAUDE.md / package READMEs are rules and operational context, not knowledge. CLAUDE.md is already auto-loaded by the harness. Index stays focused on planning + research output.

5. **`decisions:` and `key_findings:` are both first-class fields** (Option C from review):
   - `kind: planning` — `decisions:` required, `key_findings:` optional
   - `kind: research` — `key_findings:` required, `decisions:` optional (for research outputs that commit to recommendations, e.g., super-parent.md "Adopt Pattern C as default")
   - `kind: historical` — neither (the doc is a record, not a commitment)
   - The dual-field schema preserves the genre signal: a reader can tell at a glance whether a bullet is a finding (qualified) or a commitment (locked).

---

## What this fixes (revisiting the original observations)

| Observation | Fix |
|---|---|
| Drift from append-only writes | Frontmatter as source of truth; sibling skills stop touching index |
| Description bimodality | Structured `summary` + `decisions` + `consumer_hint` schema |
| Whole index loaded eagerly | Two-layer (terse always-on + rich on-demand) |
| Relationships not surfaced | `related[]` and `superseded_by:` propagated to detail layer |
| No staleness signal | Lint pass catches the common cases |
| Header `updated:` lies | Lint compares `updated:` to git mtime |

## What this doesn't fix

- Doesn't help if frontmatter itself rots (still requires authors to maintain it). But: (a) one place to update vs. two, (b) lint catches the most common rot.
- Doesn't reduce skill author burden much — they still write frontmatter, just no longer write index entries.
- Doesn't solve session-start cost entirely; the terse layer still loads at session start. But ~5KB vs ~26KB is a meaningful reduction.
