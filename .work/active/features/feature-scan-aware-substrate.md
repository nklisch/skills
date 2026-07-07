---
id: feature-scan-aware-substrate
kind: feature
stage: done
tags: [tooling]
parent: null
depends_on: []
release_binding: null
gate_origin: null
created: 2026-06-13
updated: 2026-07-07
---

# Scan-aware substrate (paired with the deep-code-scan skill)

## Brief
Make the agile-workflow substrate aware of `deep-code-scan` campaigns. Adds the first-class
`scan_origin` linkage field (mirroring `research_origin`) and makes the engagement-owned scan
scaffold structurally invisible to autopilot via a `[scan]`-tag exclusion from `--ready`/`--blocked`.
Ships in the same rollout as the `deep-code-scan` skill so the skill's assumptions hold.

## Design

### 1. `scan_origin` field (mirror of `research_origin`)
- `work-view` (Rust): add `scan_origin: Option<String>` to the item model + frontmatter parser
  (normalized: missing / `null` / `"null"` / empty → `None`), a `Filter.scan: Match`, the
  `item_matches` predicate, the `--scan-origin <slug>` CLI flag (hand-rolled parser, `nullable_match`
  like `--research-origin`), help text, the feed DTO (`feed.rs`) + temp-Item constructions
  (`render.rs`, `actionable.rs`). Mirror the research_origin tests across parse/filter/args/integration.
- `docs/SPEC.md`: frontmatter template + field-semantics row + CLI filter table + JSON feed schema.
- `.work/CONVENTIONS.md`: `scan_origin` under Linkage fields.

### 2. `[scan]` exclusion from `--ready`/`--blocked` (the structural guarantee)
- `work-view` (Rust): `is_actionable_candidate` (actionable.rs) returns false for any item whose
  `tags` contain `scan`. Engagement-owned scan scaffold is therefore never surfaced as ready/blocked
  work and never grabbed by autopilot. Fix epics (no `[scan]` tag) drain normally.
- `docs/SPEC.md`: note the exclusion on `--ready`/`--blocked`.
- `.work/CONVENTIONS.md`: register the `deep-code-scan` reserved tags (`scan` + lanes + bands) and
  flag `scan` as load-bearing.
- `autopilot/SKILL.md`: Phase 2 note that `[scan]` items are never queued (+ frontmatter-fallback rule).

### 3. convert sync delivery
- `convert/SKILL.md`: the Phase S3 `work-view` reinstall delivers scan-awareness (`--scan-origin` +
  `[scan]` exclusion); plus a non-destructive offer to register the scan taxonomy / `scan_origin` in
  user-owned CONVENTIONS.

## Acceptance criteria
- `work-view --scan-origin <slug>` filters by `scan_origin`; `--scan-origin null` selects unset.
- A `[scan]`-tagged active `implementing` item is absent from `--ready` and `--blocked`; an otherwise
  identical untagged item is present.
- `scan_origin` round-trips through parse + the JSON feed.
- `cargo test --workspace` green; new tests mirror the research_origin suite + a `[scan]`-exclusion test.

## Implementation notes
- Rust changes delegated to a focused implementation sub-agent against an exact research_origin map.
- Markdown surfaces (SPEC, CONVENTIONS, convert, autopilot) authored directly.
- dist/ binaries are rebuilt by CI (build-work-view.yml), NOT hand-committed.
- **Verified:** `cargo test --workspace` green — 133 (cli unit) + 94 (cli integration) + 77 (core
  unit) + 31 (core integration) + 4 (doc-tests), 0 failed. New tests mirror the research_origin
  suite across parse/filter/args/integration, plus a `[scan]`-exclusion test in actionable.rs and a
  feed-serialization assertion. `--scan-origin scan-demo` verified end-to-end on the golden fixture.

## Review (2026-07-06)

**Verdict**: Approve with comments

**Mode/Depth**: substrate / deep (two-phase: advisory → adversarial), fresh-context `openai-codex/gpt-5.5`.

**Blockers**: none.

**Important** (filed as backlog):
- Bash fallback (`scripts/work-view.sh`) is not scan-aware — no `--scan-origin` flag, no `[scan]`-tag exclusion from actionable. Since `install-work-view.sh` can install the fallback on unsupported platforms, the "structural guarantee" isn't universal. → `idea-scan-aware-bash-fallback-parity`
- Managed AGENTS/frontmatter summaries (convert SKILL.md) omit `scan_origin` — `convert --update` can regenerate project instructions missing a first-class field. → `idea-convert-managed-summary-scan-origin`

**Nits**: stale test-count note in the item body (older cargo counts; current run is 156+103+77+31+4).

**Notes**: Rust implementation faithfully mirrors `research_origin` across parse/filter/args/integration/feed; `[scan]`-exclusion uses exact tag equality (doesn't over-exclude). Cargo suite re-run green. deep-code-scan consumer exists and relies on this substrate. The two important findings are distribution/doc-parity gaps, not capability gaps — the Rust core is sound. Filed as backlog; not blocking v0.1.0-class advancement.
