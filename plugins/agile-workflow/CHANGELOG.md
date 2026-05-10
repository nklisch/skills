# Changelog

## v0.4.0 — gates run in opus sub-agents, autopilot drives continuously

Two related shifts in how heavy thinking gets dispatched and how the queue
runner paces itself.

- **Gates are sub-agent driven.** All five quality gates (`gate-security`,
  `gate-cruft`, `gate-docs`, `gate-tests`, `gate-patterns`) now delegate
  their full analysis to a single opus sub-agent. The orchestrator skill
  becomes a thin shell: prepare bundle context, dispatch the sub-agent
  with a methodology brief, convert the structured findings it returns
  into items (or pattern files, for `gate-patterns`), commit. The heavy
  reasoning runs in an isolated context — domain audits, drift detection,
  contract extraction, pattern discovery — leaving the orchestrator's
  context lean and the analysis quality consistent. Orchestrator model
  dropped from `opus` to `sonnet` for the four item-producing gates;
  `gate-patterns` was already sonnet.
- **Autopilot drives continuously; watchdog ticks are a hidden
  safeguard.** Earlier wording around "session survives compaction" and a
  "context approaching ~600k tokens" stop condition made the agent
  self-throttle — pacing work against the watchdog ticks instead of
  draining the queue. The skill now states explicitly: drive the queue
  without pausing, the ticks are a harness-level safeguard you do not
  reason about once scheduled, and there are exactly three stop
  conditions (queue empty / truly stuck / user stop signal). Compaction
  prediction is removed entirely — the harness handles it.

## v0.3.2 — autopilot delegates to loop skill instead of prescribing args

v0.3.1 prescribed `Skill(skill="loop", args="30m /agile-workflow:autopilot
--resume")` directly in autopilot's Phase 1, which still over-specified the
invocation — agents either guessed at the args format or skipped the loop
skill entirely and went straight to CronCreate. Phase 1 and Phase 8 now just
say "load the loop skill via the Skill tool and follow its instructions" and
describe the desired schedule (30m + 3h, --resume), letting the loop skill
handle the actual scheduling mechanics.

## v0.3.1 — autopilot /loop invocation fix

The `autopilot` skill instructed the agent to run `/loop ...` in bare code
blocks, which agents interpreted as bash commands and ran via the Bash tool —
silently dropping the watchdog scaffolding. Phase 1 (schedule) and Phase 8
(cancel) now spell out the `Skill` tool invocation explicitly:
`Skill(skill="loop", args="...")`.

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
