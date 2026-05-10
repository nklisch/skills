# Changelog

## v0.4.2 — human-facing work-board view

Adds a slash command and renderer that produce a self-contained HTML
kanban board from the project's `.work/` substrate.

- **`/agile-workflow:board`** — new slash command. Walks `.work/`, parses
  every item's frontmatter, and writes a single HTML file (no external
  assets) with five columns mapped from stage: Backlog → Drafting → In
  Progress → Review → Done. Auto-opens via `xdg-open` / `open` /
  `wslview` / `start` when a launcher is available.
- **`scripts/work-board.sh`** — pure-bash renderer. Reuses the
  `work-view` frontmatter parsing patterns. Item title and excerpt are
  base64-encoded into the embedded JSON so quotes, backticks, and
  `</script>` sequences round-trip safely. Computes ready/blocked
  signals and surfaces unmet dependencies on each card.
- **`scripts/work-board.template.html`** — embedded CSS/JS, light + dark
  modes via `prefers-color-scheme`, kind-colored card borders, kind/tag
  filter pills, fuzzy id/title search ('/' to focus), and a collapsed
  Releases section grouping items by `release_binding` /
  `.work/releases/<version>/` directory.

Flags: `--print` (skip auto-open), `--out <path>` (custom output path),
`--serve [port]` (tiny `python3 -m http.server` for remote access).

The renderer is read-only. Re-run the command to refresh — there's no
watcher, no daemon, no background process. Stays consistent with the
substrate philosophy: items are the source of truth.

## v0.4.1 — drop model: frontmatter, skills inherit session model

Removed the `model:` frontmatter field from every skill in the plugin
(previously a mix of `opus` and `sonnet`). Skills now run at whatever model
the session is on, rather than overriding for the current turn.

Rationale: the `model:` override changed the model only for the turn the
skill loaded into and reverted on the next prompt — useful only when a
specific tier was genuinely required. For a workflow plugin where the user
chooses the session model deliberately, forcing a different model per skill
fragmented behavior and silently consumed extra tier capacity. Inheriting
the session model is the right default. Sub-agent dispatches inside the
skill bodies still set model explicitly via the Agent tool's `model:`
parameter (e.g. the gates spawn opus sub-agents) — that's unchanged.

Also brings the frontmatter into alignment with the skilltap official
schema, which doesn't include `model:` at all.

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
