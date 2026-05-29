---
name: knowledge-index
description: >
  Regenerate the project knowledge index from frontmatter — produces a three-layer model.
  Layer 1: knowledge-index-nav.yaml (~5-8KB, auto-loaded at session start within the
  harness's 10KB hook-output cap; surfaces corpus counts + 15 most-recent docs + docs
  flagged with nav_priority: high in frontmatter). Layer 2: knowledge-index.yaml (terse
  full per-doc index, on-demand via Read). Layer 3: knowledge-index-detail.yaml (rich
  layer with summaries / decisions / key_findings / related, on-demand). Runs an inline
  lint pass that catches drift, broken supersession chains, and missing required fields.
  Navigator size warned at 8KB / errored at 10KB. Run at the start of any session, or
  anytime you've added or modified docs.
user-invocable: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
model: sonnet
---

# Knowledge Index

You regenerate the project knowledge index from frontmatter and run lint. Frontmatter is the
**only** source of truth — both index files (terse + detail) are fully derived on every
invocation. Sibling skills (`/research`, `/brief`, `/architecture`, `/epicize`) write
frontmatter; this skill regenerates the index.

## Why this design

Earlier versions of this skill let sibling skills *append* to the index. That caused drift:
each skill appended but none reconciled, header claimed "auto-generated" but nothing
regenerated, stale descriptions persisted across migrations. Frontmatter-as-source-of-truth
plus regeneration kills that drift class entirely.

Three-layer output is sized for the harness's 10KB hook-output cap. The navigator layer
(`knowledge-index-nav.yaml`, ~5-8KB) is auto-loaded at session start and gives corpus
situational awareness only: counts by `kind`, top 15 most-recently-updated docs, and
docs explicitly flagged with `nav_priority: high` in frontmatter. The terse layer
(`knowledge-index.yaml`) carries the full per-doc index and is read on-demand. The
detail layer (`knowledge-index-detail.yaml`) carries summaries / decisions /
key_findings / related and is read on-demand when a topic match triggers it.

Why three layers: as the corpus grows past ~100-150 docs, the terse layer itself
exceeds the harness's 10KB inline cap and the SessionStart hook degrades to a
preview-plus-pointer. The navigator restores cheap passive context without requiring a
larger payload — see `docs/design/knowledge-retrieval.md` (in the consuming project) for
the design rationale and the dev-time vs production-retrieval distinction.

## Model Assignment

Per [model-selection-pattern.md](../docs/model-selection-pattern.md):

- **Index regenerator (this skill's main loop)** — Volume / structured extraction. Sonnet medium. Runs in parent context.

Frontmatter parsing, lint, and YAML emission are mechanical structured work — Sonnet handles
this cleanly. No sub-agents.

## When This Runs

- **Start of any session** where work will be done on a project (auto-loads the **navigator** layer; full index is on-demand)
- **After any skill produces a new doc** (`/research`, `/brief`, `/architecture`, `/epicize`, `/ideate`) — those skills no longer touch the index file; they call this one
- **After manual doc edits** that change frontmatter
- **`--lint-only`** — CI mode, no writes, exits non-zero on errors

## Workflow

### Step 1: Discover all knowledge docs

**Docs corpus** — glob `docs/**/*.md` AND `.research/**/*.md` recursively. Exclude:
- `docs/_archive/**/*` (archived)
- `docs/**/doc-review-report-*.md` (audit artifacts)
- Any path matching `**/RESUME-STATE.md` or session artifacts (no frontmatter, by convention)

**Substrate corpus (when `.work/` exists)** — also glob `.work/active/**/*.md`,
`.work/backlog/**/*.md`, `.work/releases/**/*.md`, `.work/archive/**/*.md`. These are
substrate items emitted by the `agile-workflow` plugin. They have a different
frontmatter schema than docs (`id`/`kind`/`stage`/`depends_on` instead of
`type`/`description`/`summary`/`decisions`) and are linted separately (see Step 4).

For each match, parse the YAML frontmatter (the block between leading `---` and the next `---`).

### Step 2: Extract fields per doc

| Field | Required? | Source |
|-------|-----------|--------|
| `path` | required | filesystem path |
| `description` | required | frontmatter `description:` (becomes `consumer_hint` in terse layer) |
| `type` | required | frontmatter `type:` |
| `updated` | required | frontmatter `updated:` |
| `summary` | required for the rich layer | frontmatter `summary:` |
| `kind` | derivable | frontmatter `kind:` if set, else derived (see Step 3) |
| `decisions` | required for `kind: planning`; optional for `kind: research`; forbidden for `kind: historical` | frontmatter `decisions:` |
| `key_findings` | required for `kind: research`; optional for `kind: planning`; forbidden for `kind: historical` | frontmatter `key_findings:` |
| `supersession_note` | optional | frontmatter `supersession_note:` |
| `title` | optional | frontmatter `title:` → first `# heading` |
| `status` | optional | frontmatter `status:` (`draft | locked | superseded | legacy | in-progress`) |
| `superseded_by` | optional | frontmatter `superseded_by:` |
| `research_method` | optional | frontmatter `research_method:` |
| `blocks_phase` | optional | frontmatter `blocks_phase:` |
| `related` | optional | frontmatter `related:` (list of `{slug, relationship, note?}`) |

**Unknown frontmatter fields** (e.g., `content_type:`, `tags:`, `audience:`, `sources:`, `confidence:`, project-specific fields) are silently ignored — they don't appear in the index output but don't cause lint errors. Project-specific extensions live in source frontmatter freely; only the indexable fields above flow through.

**Slug resolution in `related[]`.** The canonical slug form in source frontmatter and index output is the **absolute path** `docs/<path>.md` rooted at the repo root. The regenerator also accepts and normalizes:
- Bare sibling filename (e.g., `parent`, `program`) — resolved against the doc's own directory; `.md` appended if missing
- Relative path (e.g., `../dashboarding-for-ai-agent-platform/parent`, `../../architecture/north-star-ds-engine`) — resolved against the doc's directory; `.md` appended if missing

After resolution, the target file MUST exist on disk. Resolution failures are errors (see Step 4). The detail-layer output always uses the canonical absolute form regardless of how the source was written. To avoid relying on resolution, prefer absolute slugs in source.

### Step 3: Derive `kind:` if not set

```
if status in ('legacy', 'superseded'):
    kind = 'historical'
elif type in ('north-star', 'architecture', 'roadmap', 'design', 'features',
              'ideate', 'workon', 'module-rules', 'pattern', 'refactor-plan',
              'feature', 'expansion'):
    kind = 'planning'
elif type in ('brief', 'program-parent', 'program-report', 'landscape'):
    kind = 'research'
else:
    kind = None  # lint warning
```

If `kind:` is set explicitly in frontmatter, use that and validate against the derivation
(lint warning if they disagree).

### Step 4: Run lint pass

**Lint mode is determined by the `schema_version` field at the top of `docs/knowledge-index.yaml`** (or the project's CLAUDE.md if the index doesn't yet exist):

- **`schema_version: 1`** — grace mode. Missing v2 fields produce **warnings**, not errors. Use during migration.
- **`schema_version: 2`** — enforce mode. Missing v2 fields produce **errors** that block regeneration. Use once a project has fully backfilled.
- **No `schema_version` field** — defaults to `1` (grace mode). New projects scaffolded by `/init-project` start at `2`.

Errors (block regeneration):
- Missing v1-baseline frontmatter (`description`, `type`, `updated`) — always an error regardless of mode
- Missing `summary:` — error in v2, warning in v1 (grace)
- Missing `decisions:` for `kind: planning` — error in v2, warning in v1 (grace)
- Missing `key_findings:` for `kind: research` — error in v2, warning in v1 (grace)
- `decisions:` or `key_findings:` present on `kind: historical` — always an error (these are forbidden, not optional)
- Broken `superseded_by:` chain (target file does not exist, except `TBD-*` placeholders) — always an error
- Broken `related[]` reference — slug fails resolution per Step 2 rules (target file does not exist after relative-path normalization)
- `related[]` item using `type:` key instead of `relationship:` — always an error (legacy authoring convention; rename to `relationship:`)
- `kind:` set explicitly but disagrees with derivation — always an error (signals author intent that doesn't match reality)

**Note on `kind: historical`:** missing `decisions:` and `key_findings:` is the CORRECT state — these fields are forbidden, so absence is expected and produces no warning or error. Lint must not warn on missing-decisions/key_findings for historical docs.

Warnings (print; do not block):
- `decisions:` count > 12 (cap guidance: 5–9 highest-leverage)
- `updated:` more than 60 days behind git mtime (`git log -1 --format=%cs -- <file>`) — skipped silently for files not yet in git history (untracked files have no mtime to compare against; not stale by definition)
- `status:` value not in the known enum (`draft | locked | superseded | legacy | in-progress`) — warning; suggest normalization to the closest enum value (e.g., `APPROVED — execution starts...` → `in-progress`; `COMPLETE — basis for...` → `locked`)
- `status: superseded` but no `supersession_note:` and no `superseded_by:`
- Doc on disk has no frontmatter (orphan; falls back to inference)
- `blocks_phase:` references a phase that doesn't exist in `docs/architecture/epicize.md` (if roadmap exists)

If `--lint-only`, print the report and exit. Otherwise continue.

If errors are present and `--no-lint` is NOT passed: stop, print errors, do not regenerate.
If `--no-lint`: print warnings but proceed.

**Substrate-item lint** (separate validator, applied to items under `.work/`):
- Required fields: `id`, `kind`, `stage`, `created`, `updated` — always errors if missing (except backlog items which have a leaner schema per Nathan's SPEC.md; their `kind` and `stage` are unknown until `/scope` promotes them, so missing-kind/missing-stage on backlog items is suppressed)
- `kind` must be one of `epic`, `feature`, `story`, `release` — error if outside that set
- `stage` must be one of `drafting`, `implementing`, `review`, `done`, `planned`, `quality-gate`, `released` — warning if outside that set (substrate may extend)
- `tags` and `depends_on` must be lists when present — error if scalar/string

Substrate items do NOT go through docs-style v1/v2 validation. They have their own schema (Nathan's `agile-workflow:SPEC.md`); we just sanity-check shape.

### Step 5: Write `docs/knowledge-index-nav.yaml` (navigator layer)

Full overwrite. This is the **layer auto-loaded at session start** — the harness inlines hook output up to 10,000 characters, so the navigator stays under that cap by carrying only aggregates + curated subsets, not per-doc records. Format:

```yaml
# Auto-generated. DO NOT EDIT BY HAND. Run /knowledge-index to regenerate.
# Navigator layer — auto-loaded at session start (capped at 10KB by harness).
# Provides corpus situational awareness only. Read knowledge-index.yaml for full index.

schema_version: 3
generated_at: <ISO 8601 timestamp>
generated_from: frontmatter
total_docs: <count>

by_kind:
  planning: <n>
  research: <n>
  historical: <n>

# Substrate items (.work/) by tier. Emitted only when .work/ exists with items.
# Query individual items via .work/bin/work-view (--ready, --blocked, --kind, etc.).
substrate_summary:                    # OMITTED when .work/ is absent
  active:
    epic: <n>
    feature: <n>
    story: <n>
    release: <n>
  backlog: <n>
  releases:
    v0.1: <n>                         # versions populated per .work/releases/<v>/ dirs
    v0.2: <n>
  archive: <n>

# Top 15 most-recently-updated high-signal docs (planning + super-parent.md +
# program-report.md + program.md only — specialist briefs and campaign parents
# skipped to avoid Run-day flooding the recent list).
recent:
  - path: <path>
    title: <title>
    kind: <kind>
    updated: <date>
  # ... up to 15 entries

# Docs flagged with nav_priority: high in frontmatter — explicit load-bearing list.
load_bearing:
  - path: <path>
    title: <title>
    kind: <kind>
  # ... typically 5-15 docs

# On-demand layers (Read tool):
full_index_path: docs/knowledge-index.yaml
detail_index_path: docs/knowledge-index-detail.yaml
```

**Size check:** warn at 8KB, error at 10KB. If the file exceeds 8KB, reduce the number of docs flagged `nav_priority: high` or shorten titles. If it exceeds 10KB, the SessionStart hook will truncate it and the auto-load degrades.

### Step 6: Write `docs/knowledge-index.yaml` (terse layer)

Full overwrite. Format:

```yaml
# Auto-generated. DO NOT EDIT BY HAND. Run /knowledge-index to regenerate.
# Frontmatter is the source of truth — edit each doc's frontmatter and re-run.
#
# schema_version controls lint mode:
#   1 = grace (missing v2 fields produce warnings, not errors)
#   2 = enforce (missing v2 fields are errors)
# Set to 2 once the project's docs are fully backfilled to v2 frontmatter.
schema_version: 2
generated_at: <ISO 8601 timestamp>
generated_from: frontmatter
total_docs: <count>

documents:
  # Group by kind: planning first, then research, then historical
  # Within each group, sort by type then by path
  - path: <path>
    title: <title>
    type: <type>
    kind: <kind>
    updated: <date>
    # Optional fields surface only if set:
    status: <status>
    research_method: <method>
    blocks_phase: <phase>
    superseded_by: <path>
    nav_priority: <high>
    consumer_hint: <description>
  ...
```

Per entry: ~5-9 lines (~500-800 bytes including consumer_hint). Total file size scales with doc count — typically ~5KB for ~50 docs, ~50KB for ~150 docs, ~200KB+ for ~300+ docs. Loaded on-demand via Read; the navigator (Step 5) handles session-start auto-load.

### Step 7: Write `docs/knowledge-index-detail.yaml` (rich layer)

Full overwrite. Format:

```yaml
# Auto-generated. DO NOT EDIT BY HAND.
# On-demand layer — load when surfacing a specific doc's full context.
generated_at: <ISO 8601 timestamp>
generated_from: frontmatter
schema_version: 2

documents:
  <path>:
    summary: |
      <multi-line summary>
    decisions:
      - <decision>
    key_findings:
      - <finding>
    supersession_note: |
      <multi-line note, if present>
    related:
      - {slug: <path>, relationship: <type>}
  ...
```

Keyed by path for O(1) lookup. Size scales with doc count and summary depth — typically ~25KB for ~50 docs, several MB for ~300+ docs. Read on-demand for topic matches.

### Step 8: Print summary

```
📋 Knowledge Index regenerated
=============================
Project: <project name>
Total docs: <N>
By kind: planning=<n>, research=<n>, historical=<n>

Lint:
  Errors:   <count>
  Warnings: <count>

Files written:
  docs/knowledge-index-nav.yaml     (navigator, ~<size>KB — auto-loaded at session start)
  docs/knowledge-index.yaml         (terse, ~<size>KB)
  docs/knowledge-index-detail.yaml  (detail, ~<size>KB)
```

If navigator size exceeds 8KB, print a warning. If it exceeds 10KB, print an error explaining that the harness will truncate it. If lint warnings or errors are present, print them grouped by severity with actionable "Fix:" suggestions.

## Frontmatter Convention (what authors must provide)

Every indexable doc must have:

```yaml
---
description: |
  One-line "when do I read this?" hook. Frame as the question this doc answers,
  not as a content list. (Becomes consumer_hint in the terse index.)
type: north-star | architecture | roadmap | brief | program-parent | program-report | design | features | ideate | workon
updated: 2026-05-03

summary: |
  1-2 sentences on what's in the doc. Different from description: this tells you
  what's IN it; description tells you WHEN to read it.

# decisions: required for kind: planning, optional for kind: research, forbidden for kind: historical
# Cap: 5-9 highest-leverage commitments at index-readable depth.
decisions:
  - "Three-rung tier model with refused-by-default Tier 3"
  - "Cloud Tasks (not Cloud Scheduler) for scheduler dedup"

# key_findings: required for kind: research, optional for kind: planning, forbidden for kind: historical
key_findings:
  - "Vega-Lite + vega-embed is the lowest-friction agent-authored viz path"

# Optional: supersession_note: when parts are stale but the doc remains load-bearing
supersession_note: |
  Authored 2026-05-02 before the X migration. The "Y" section is superseded; the
  cross-cutting themes and recommendations remain authoritative.

# Optional standard fields
title: Override for first # heading
kind: planning | research | historical    # usually derived; set only to override
status: draft | locked | superseded | legacy | in-progress
superseded_by: path/to/successor.md
research_method: /research | /deep-research | /research-program | hand-written | migrated
blocks_phase: "5b"
related:
  - {slug: path/to/other.md, relationship: depends-on | extends | contradicts | refines | parallel-to}
---
```

### Field guidance

**`description:`.** Frame as a question, not a content list. Bad: "Module map, data flow,
conventions, dependencies." Good: "Read when implementing or modifying any module — module
map, data flow, conventions, dependencies, and load-bearing storage / PII / render decisions."

**`summary:`.** What's in the doc. 1-2 sentences. Pipe-folded for multi-line.

**`decisions:`.** Locked-in commitments at index-readable depth. **Cap at 5–9** highest-leverage.
Sub-system details belong in their own architecture doc's `decisions:`, not propagated upward.
Lint warns at >12.

**`key_findings:`.** What the research showed (qualified, not yet committed). Required for
`kind: research`. Empty/omitted is OK if the doc is purely a planning-stage research artifact
that didn't reach findings.

**Both `decisions:` AND `key_findings:` on the same doc.** Allowed and useful for research
outputs that bottom-line a recommendation. `key_findings:` is what the research showed;
`decisions:` is what's now committed because of it.

**`supersession_note:`.** Use when parts of a doc are superseded but the doc as a whole
remains load-bearing. Distinct from `superseded_by:` (which marks full supersession). The
research outputs in ds-engine after the 2026-05-03 grimoire-separation migration are the
canonical example.

**Historical-kind summaries:** frame as "Captures X (as of authorship); not yet refreshed
for Y." Distinguishes legacy summaries from their descriptions.

### Standard vs Extended Types

**Standard types** (used across all projects):
`north-star`, `architecture`, `roadmap`, `brief`, `program-parent`, `program-report`,
`design`, `features`, `ideate`, `workon`, `module-rules`

**Extended types** (project-specific — valid when a project's domain warrants them):
- `entity-brief` — auto-generated per-entity dossiers (e.g., entity profiles, product pages)
- `pattern` — documented code patterns (produced by `/extract-patterns`)
- `refactor-plan` — refactoring proposals (produced by `/refactor-design`)
- `feature` — feature briefs (produced by `/feature`)
- `expansion` — scope expansion docs (produced by `/expand`)

Projects may add their own types. Document new types in the project's CLAUDE.md so future
sessions know they're intentional. The skill accepts any string for `type:`; lint validates
against a known list but treats unknowns as warnings, not errors.

## Migration from schema v1 to v2

If a project's existing `knowledge-index.yaml` has no `schema_version` field or `schema_version: 1`, it's in **grace mode** — missing v2 fields emit warnings, not errors. Backfill incrementally; flip to enforce when ready.

**Phase 1 — opt in to v2 (no backfill yet):**
- Add `schema_version: 1` to the index header explicitly (signals intentional grace mode, not legacy oversight)
- Run `/knowledge-index` — regenerator produces v2-shaped output where possible, falls back gracefully on v1-only frontmatter
- Existing `description:` is reused as `consumer_hint` automatically
- Lint emits warnings for missing v2 fields; project keeps working

**Phase 2 — backfill:**
- For each doc, add `summary:` and `decisions:` or `key_findings:` to frontmatter (LLM-draft from doc body; human reviews — ~3 min/doc)
- Rewrite `description:` from content-listing framing to question framing (consumer_hint style)
- Add `supersession_note:` for any partially-stale doc
- Re-run `/knowledge-index` periodically; track shrinking warning count

**Phase 3 — flip to enforce:**
- Once warning count is 0 (or remaining warnings are intentionally deferred), change `schema_version: 1` → `schema_version: 2` in the index header
- Subsequent `/knowledge-index` runs treat the same conditions as **errors** that block regeneration
- This prevents regression — new docs without proper frontmatter fail lint immediately

**For new projects** (`/init-project`): the scaffolded `knowledge-index.yaml` template starts at `schema_version: 2`. No grace period needed.

## Anti-Patterns

- **Don't hand-edit `knowledge-index.yaml` or `knowledge-index-detail.yaml`.** They are pure
  derivations. Edit the source frontmatter and re-run.
- **Don't let sibling skills append to the index.** Their job is to write conformant
  frontmatter and call this skill (or document that the user should).
- **Don't skip the lint pass to push through.** If lint flags errors, fix the underlying
  frontmatter. `--no-lint` is for emergencies, not for routine use.
- **Don't index `_archive/`, doc-review reports, or session-state artifacts.** They are
  not knowledge.
- **Don't skip the index check at session start.** If you're about to research something
  or write a brief, check the terse layer first to see if it already exists.
