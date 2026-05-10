# Changelog

## v0.3.0 — autonomous review, caller awareness, orchestrator default

Autopilot now drains `stage: review` items end-to-end. Skills called by
autopilot use judgment instead of halting on ambiguity.

- **Autonomous review.** Autopilot routes `stage: review` items to the
  existing `review` skill. No new `auto-review` skill — same skill, both
  callers. When the last child reaches `done`, the review skill auto-advances
  the parent (feature or epic) to `review`, so epic-rooted graphs drain.
- **Circuit-breaker.** After an item bounces `implementing → review →
  implementing` twice, autopilot halts on it (leaves stage at review,
  escalates in summary, skips).
- **Caller awareness (principles Part III).** Rule: if
  `/agile-workflow:autopilot` was invoked this session, no AskUserQuestion,
  no halts on ambiguity — judgment + log. Otherwise, asking is fine. Hard
  halts only for substrate-missing, foundation-missing, depends_on cycle,
  contradictory state. Applied to `feature-design`, `perf-design`,
  `implement`, `implement-orchestrator`, `review`.
- **Orchestrator is the default for features.** Single-story features run
  as a one-agent wave; multi-story as multiple waves capped at 3 parallel
  per wave (no upper limit on waves). Per-story prompts mirror `implement`'s
  workflow (land mode, dep check, design-flaw rollback). `implement`
  standalone is now for stories and feature-without-children.
- **Free-text autopilot scope.** `autopilot finish the dangling work` etc.
  is interpreted as a scope directive, logged in the run summary.
- **Convert: per-design classification.** Each `docs/designs/` entry classified
  into one of five buckets (drafting / implementing / review / done-shipped /
  done-archived) with sensible defaults and user confirmation.
- **Convert: capture in-flight work.** Phase 8.5 clusters uncommitted
  working-tree files via Explore and scopes each cluster as a
  `stage: implementing` feature. `implement`'s land mode lands them.
- **Story heuristics.** `feature-design` Phase 7 now uses an explicit
  four-condition test (parallelizable / non-trivial deps / multi-session /
  heterogeneous acceptance) instead of vague "skip if small."
- **Hook timezone.** `updated:` bump uses local time, not UTC.

## v0.2.0 — design family covers epics

Autopilot can now drain epic-rooted graphs end-to-end. Previously, an epic at
`stage: drafting` was a dead end for autopilot (the `design` skill only
handled features, so autopilot's queue would empty out as soon as the only
in-scope item was an undecomposed epic).

- **New skill: `epic-design`** — decomposes an epic at `stage: drafting` into
  child features at `stage: drafting` with declared `depends_on` chains,
  written into the epic body. Mirrors `epicize` one level down.
- **Renamed: `design` → `feature-design`** — for symmetry with the new
  `epic-design`. Breaking change for any external invokers using
  `/agile-workflow:design`; update to `/agile-workflow:feature-design`.
- **Autopilot routing updated** — `kind: epic` at `drafting` now routes to
  `epic-design` instead of being skipped. Only `.work/backlog/` is out of
  scope for autopilot.
- Cross-references in `scope`, `epicize`, `refactor-design`, `perf-design`,
  `implement-orchestrator`, ARCHITECTURE.md, MIGRATION.md, README, and the
  agile-workflow guide updated to the new names.

## v0.1.0 — initial release

Substrate-based work-tracking plugin. Sibling to `workflow`.

- 25 skills covering ideation, conversion, scoping, design (greenfield + refactor + perf), implementation, review, gates, release, and autopilot
- `work-view` bash script for fast queries by stage, tag, kind, parent, release binding, and dependency state
- Two hooks (SessionStart queue snapshot, PostToolUse `updated:` auto-bump), both flag-gated by `.work/CONVENTIONS.md` presence
- Foundation docs: VISION, SPEC, ARCHITECTURE, PRINCIPLES, MIGRATION
- Pre-1.0 signals that frontmatter and stage shapes may shift during the first real-project shakedown
