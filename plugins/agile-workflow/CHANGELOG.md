# Changelog

## v0.12.1

### Gate configurability

- **Gate finding routing** — documented `gate_finding_routing` in
  `.work/CONVENTIONS.md` so release gates normalize severity/priority/confidence
  to one project-level item-placement policy.
- **gate-refactor scan roots** — documented `gate_refactor_scan_library_roots`
  so monorepos can share scan-rule libraries while preserving the default
  `.agents/skills` then `.claude/skills` discovery order.

## v0.11.3

### Research-substrate linkage fields + agentic-research adoption

- **work-view research linkage** — the Item model gains `research_refs` (Arrow 1: a work item
  tracks/consumes research) and `research_origin` (Arrow 2: research that spawned the item), parsed
  from frontmatter and queryable via `--research-refs` / `--research-origin`. Mirrors the
  `gate_origin` precedent; both fields parse harmlessly when unset, so a plain `.work/` substrate is
  unaffected.
- **convert** — research-substrate fields are conditional on the `agentic-research` plugin. The
  canonical AGENTS block ships the base field list and only advertises `research_refs` /
  `research_origin` (plus the `.work/` ↔ `.research/` handoff pointer) when that plugin is installed;
  convert never scaffolds `.research/` on its own.

## v0.11.2

### Clarify `--stage review` semantics in seeded docs

- **convert / docs** — reworded the canonical AGENTS section template and architecture docs so
  `work-view --stage review` reads as "items awaiting an agent review pass (`/agile-workflow:review`)"
  rather than "items waiting on user." The review stage is the agent's review queue (advance or
  bounce), not a hold for human sign-off.

## v0.11.1

### Terminal-tier archival: merged `archived_atop` late-binding into delete-refs

- **`archived_atop` late-binding** — archived items are bodyless stubs stamping an immutable
  `archived_atop` baseline + `git_ref`; `release-deploy` late-binds all unbound archived stubs into
  one release summary.
- **Archive-stub gate hydration** — gate skills include `.work/archive/` stubs in the release
  bundle and hydrate historical bodies from `git_ref` when a body is needed.
- **convert** — one merged terminal-retention convention; sync detects/offers it and offers to prune
  existing retained terminal bodies to stubs (stamping `archived_atop` + `git_ref`).

## v0.11.0

### Delete-after-release terminal tiers

- Archived items become bodyless ref stubs; a release collapses bound items into one
  `releases/<version>/release-<version>.md` summary; full bodies live in git history. `convert` seeds
  the `terminal-tier retention` convention (default `delete-refs`).

_(0.10.x release notes: see git history.)_

## v0.9.5

### Three-channel distribution

- **Pi package channel** - Added Pi package metadata for supported plugins, kept
  package versions in lockstep with Claude/Codex metadata, and documented the
  three-channel distribution model across root and plugin guides.
- **Pi extension surface** - Added the agile-workflow Pi extension shell with
  `/aw` queue snapshots, parent/blocking lookups, and handoffs to shared board,
  autopilot, and scope skills.
- **Delegation policy** - Updated agile-workflow skills so worker/scout/reviewer
  routing names Pi-native subagents where available while preserving the shared
  skill contracts.

### Board and dependency view

- **Expanded browsing** - Added expandable epic and tag groups to the board
  sidebar without changing filter semantics.
- **Dependency canvas polish** - Added zoom, hand-pan, layout controls, compact
  web layout nodes, ephemeral dragging, clearer impact counts, and fixes for
  resize edge drift, node click jitter, Hand-mode detail opening, clipping, and
  the null-sentinel module import failure.

### Tests and release gates

- **Board JS behavior harness** - Added a no-build ES-module test harness plus
  coverage for markdown safety, filter composition, dependency/table behavior,
  kanban/detail behavior, and expanded browsing.
- **Hook concurrency and PostCompact audit** - Added deterministic coverage for
  hook state-file interleaving and verified Codex PostCompact output behavior.
- **Release-gate follow-ups** - Added Pi package metadata tests, Pi extension
  command tests, filtered dependency stub coverage, keyboard reachability
  coverage for tag expansion, and removed dead board-test harness cleanup code.

## v0.9.0

### Cross-vendor `.agents/rules/` auto-load

- **Generic rules loader** - A hook now injects `.agents/rules/*.md` into agent
  context in both Claude Code and Codex, so dense project rules and the pattern
  digest load automatically without per-tool wiring. Hook state-file writes are
  concurrency-hardened (unique temp names, fail-open on error, `fcntl` locking
  when available).
- **`convert` extracts rules** - `convert` lifts the dense agent-instruction
  block into `.agents/rules/agile-workflow.md`, guarded by a content-integrity
  gate that verifies content exists at its canonical replacement before any
  destructive op.
- **`gate-patterns` writes the digest** - The patterns gate emits a generated,
  hook-loaded `.agents/rules/patterns.md` digest (slug + one-liner index with a
  drift-detecting `src-sha256`) alongside the canonical pattern skills.
- **Skills ground on `.agents/rules/`** - The design/implement/review-family
  skills read `.agents/rules/*.md` during grounding.

### work-view freshness & anti-drift lifecycle

- **`work-view --version`** - Both the Rust binary and the bash fallback report
  the plugin version (`work-view <semver>`), kept in lockstep with `plugin.json`
  by `bump-version.sh`, so a single string compare answers "is this installed
  copy current?".
- **Self-heal install lifecycle** - The SessionStart hook and `convert` detect a
  missing or stale `.work/bin/work-view` and reinstall the version-stamped
  entrypoint; the probe fails open (never blocks the session) on timeout or
  error.

### Documentation

- Rolled the SPEC forward: the kanban surface is documented as parent swimlanes
  with verbatim per-stage columns (not a fixed 5-column collapse), and the plugin
  source layout now includes the `work-view/` Rust workspace.
- Refreshed pattern-skill example `file:line` references after board modules
  shifted positions.

### Internal

- New test coverage: `bump-version.sh` lockstep projection, `work-board.sh` shim
  routing, `convert` content-integrity structural guard, self-heal version-probe
  timeout fail-open, and a `$TMPDIR`-invariant substrate-root test.
- Codified 4 new code patterns (board view-module contract, local DOM
  text-element builder, fail-open subprocess probe, hand-written error `Display`).
- Removed dead board-view scaffolding (`placeholderView`, `registeredViews`, and
  orphaned CSS).

## v0.8.9

### Board UI polish

- **Mock-aligned board filters and metadata** - Removed the interactive board's
  Release filter section and release-binding metadata from cards, details, and
  the table surface. Missing values now render with the mock's dash treatment
  instead of a visible `(none)` sentinel, and null parent/release values are not
  exposed as filter chips.

## v0.8.8

### Interactive Substrate Board

- **Live `work-view board` surface** - Added the compiled localhost board host
  with `/healthz`, `/api/substrate`, embedded assets, loopback Host header
  hardening, busy-port scanning, and browser-open handling. `work-view serve`
  aliases the same read-only board server.
- **Board shell and views** - Added the no-build browser shell with shared
  filters, auto-hide, safe markdown rendering, shared item cards, diagnostics,
  theme/accent controls, and detail surface. Delivered kanban stage/swimlane,
  dependency graph, and sortable/filterable table views over the same substrate
  feed.
- **Board skill** - Added the user-invocable `agile-workflow:board` skill for
  launching `.work/bin/work-view board`, with clear failure handling when a
  project still has a non-board-capable bash fallback.
- **Legacy `/board` command removed** - Deleted the Claude-only `/board`
  command surface. `scripts/work-board.sh` remains only as a compatibility shim
  that delegates to `.work/bin/work-view board` when the installed binary
  supports it.

### Documentation

- Rolled forward the agile-workflow SPEC and ARCHITECTURE docs, plus the root
  substrate-access architecture note, from static generated board language to
  the live `work-view board` model.

## v0.8.6

### Substrate CLI

- **Compiled `work-view` CLI** - The `.work/` query tool is now a compiled Rust
  binary (`work-view-core` library + `work-view` CLI) with full flag/output
  parity over the bash script, on a shared query core (frontmatter parsing, the
  item model, dependency-graph evaluation, composable filters) that the
  forthcoming web board reuses. Ships per-platform with a pure-bash fallback.
- **Stage-aware `--ready` / `--blocked`** - `--ready` no longer hides
  design-ready (`drafting`) and review-ready items whose dependencies are
  satisfied; it surfaces any active-tier item at `drafting`, `implementing`, or
  `review` with all `depends_on` terminal (and `--blocked` the inverse). The
  prompt-context hook no longer double-lists a `review` item under both Ready
  and Review.
- **Platform install path** - `install-work-view.sh` selects the matching
  prebuilt binary (uname → target triple, smoke-test, atomic install), wired
  into `/agile-workflow:convert`, with the bash fallback when no binary matches.
  Added a CI cross-compile workflow and the `dist/` layout. Binaries are
  CI-produced; until the manual refresh job populates `dist/`, installs use the
  bash fallback (no regression).

### Also in this release (previously unreleased)

- **Review skill progressive disclosure** - Split the review skill into a
  substrate-first core plus references for target resolution, review lenses,
  deep-review mechanics, and substrate side effects. Supports standalone
  branch/PR/commit reviews without `.work` mutations and keeps deep-review mode
  adaptable across contracts, data, concurrency, release, and product/UX
  dimensions.
- **work-view single-pass parsing** - Rewrote `work-view.sh` frontmatter
  parsing to a single `awk` pass over the whole tree instead of spawning an
  `awk` (plus `tr`) per field per file. Measured on a 617-item repo: default
  table view drops from ~7.9s to ~0.12s (66x); output is now deterministically
  sorted by path, otherwise byte-for-byte identical to before.
- **Dual Codex/Claude hook set** - Replaced the eager SessionStart queue dump
  with prompt-gated context injection. Actionable workflow prompts get a compact
  queue snapshot plus once-per-session principles capsules; idle chat and
  explainer prompts stay silent. Capsule state lives in the host plugin data
  directory when available, with non-worktree fallbacks.
- **Substrate maintainer hook** - Expanded the PostToolUse hook from `updated:`
  bumping to deterministic touched-item validation: required frontmatter, valid
  kind/stage, filename/id match, parent/dependency existence, and dependency
  cycles reachable from the touched item.

### Documentation

- Foundation docs (VISION, SPEC, ARCHITECTURE) rolled forward: work-view bash
  script → compiled binary + fallback, and the stage-aware ready/blocked
  semantic.

### Internal

- First project pattern catalog under `.agents/skills/patterns/` (5 patterns
  extracted from the CLI work).
- Expanded test coverage: binary-level proof of the `--ready` drafting fix,
  exit-3 fatal-IO, the `--blocked` review case, the hook review-dedup, a
  `convert` install-routing guard, and bash-parity empty-result tests.
- Added an `actionlint` CI workflow for GitHub Actions files; removed dead code
  (unused `From<io::Error>` impl, an unused parameter, a vestigial no-op); added
  a root `.gitignore`.

## v0.7.7 - Skill metadata hotfix

- **Codex skill loading** - Shortened long agile-workflow skill frontmatter
  descriptions so every `SKILL.md` stays under Codex's 1024-character
  description limit. This fixes `perf-design` being skipped by Codex after the
  v0.7.6 release.
- **Goal-backed autopilot** - Reshaped `autopilot` as a model- and
  user-invocable queue policy that can be selected from a harness goal
  statement such as "Use agile-workflow autopilot to drain --all." Removed
  current docs' dependence on `/loop`, watchdog ticks, and `--resume`; the
  harness goal/continuation feature now owns long-running persistence.
- **Caller-awareness alignment** - Updated delegated skills and docs so
  "autopilot mode" means an active autopilot run or goal, not only a literal
  slash invocation in the transcript.

## v0.7.6 - Perf and refactor design alignment

Tightens performance-design guidance for low-level systems and makes refactor
conventions a cohesive extension of agile-workflow rather than a standalone
planning path.

- **Perf-design profiling depth** - The optimization hierarchy now calls out
  data locality and microarchitecture work explicitly, including cache locality,
  pointer chasing, allocation pressure, branch predictability, false sharing,
  NUMA effects, and benchmark/counter evidence for CPU-bound systems.
- **Profiling taxonomy** - Discovery mode now classifies workload baseline,
  on-CPU, memory/GC, I/O/serialization, off-CPU/synchronization, and
  cache-line/NUMA bottlenecks before emitting perf items.
- **Refactor conventions integration** - `refactor-conventions-creator` now
  writes short style summaries into AGENTS plus a canonical
  `.agents/skills/refactor-conventions/` catalog. `refactor-design` keeps its
  built-in defaults and treats the catalog only as an extension lens.
- **Convert one-pass alignment** - `convert --update` now covers AGENTS/CLAUDE
  compatibility, work-view, pattern-skill mirrors, and refactor-conventions
  catalog placement in one pass. Cleanup is opt-in: convert asks whether
  destructive cleanup is in scope and defaults to preserve-only.
- **Tool metadata fixes** - Skills that ask strategic questions now declare
  `AskUserQuestion` in their allowed tools.

## v0.7.5 - Tighten [refactor] tag routing

Stops mistagged "major rework" items from leaking into `refactor-design` when
they actually change observable behavior.

- **Sharper tag semantics** - The AGENTS.md section now ships a `### Tag
  semantics` subsection with the black-box test ("would any observable
  behavior change for a caller of the public surface?") plus contrasting
  examples on each side. Definition is re-read by agents mid-work, not just
  buried in CONVENTIONS.md. SPEC.md's CONVENTIONS template entries for
  `[refactor]` and `[perf]` are tightened to match.
- **Misroute self-heal in refactor-design** - Per-feature mode Phase 1 now
  applies the black-box test to the brief. If the item describes new
  capability, an API change, swapped semantics, or "rework rather than
  restructuring," it strips `[refactor]`, logs the misroute, commits, and
  returns without advancing - autopilot reroutes to `feature-design` on the
  next pass. Mirrors `feature-design`'s existing misroute guard.
- **Tag application gate in scope** - Phase 5 (single-idea) and Phase B4
  (batch clustering) now require the black-box test before applying
  `[refactor]` or `[perf]`. Stops the bad tag at the source.
- **Convert sync handles existing projects** - `convert` and
  `convert --update` now detect verbatim-stale tag entries in
  `.work/CONVENTIONS.md` (only the known prior plugin defaults — user-edited
  lines are treated as intentional) and offer to refresh them via
  AskUserQuestion. Non-destructive: only flagged lines are touched, never the
  rest of CONVENTIONS.

## v0.7.4 - AGENTS-backed legacy pattern rules migration

- **Gate-patterns rules source** - `gate-patterns` now reads project rules from
  AGENTS targets instead of treating `.claude/rules/patterns.md` as an input.
  `.agents/skills/patterns/` remains the canonical structural-pattern catalog,
  with `.claude/skills/patterns/` only as a legacy mirror.
- **Convert sync for older repos** - `convert` and `convert --update` now detect
  legacy `.claude/rules/patterns.md`, import non-duplicate content into the
  selected AGENTS target, and replace the legacy file with a shim so AGENTS is
  the single project-rules source.
- **Docs alignment** - SPEC, ARCHITECTURE, and MIGRATION now document AGENTS as
  the canonical rules home and `.agents/skills/patterns/` as the structural
  pattern-skill home.

## v0.7.2 - Codex sub-agent and AGENTS.md compatibility

Improves the plugin's Codex path while preserving Claude compatibility.

- **AGENTS.md canonicalization** - `convert` now writes the agile-workflow
  section to AGENTS.md and keeps CLAUDE.md as a symlink or compatibility shim.
  Root, `.agents/`, and `.claude/` instruction-file locations are detected.
- **Sub-agent routing** - implementation and gate skills now carry explicit
  inline guidance for Claude model choices and Codex reasoning effort. The
  implement orchestrator owns bundle/wave planning and may run large
  non-overlapping write paths in parallel.
- **Codex plugin metadata** - the Codex manifest now declares capabilities and
  a default prompt, and explicit-only skills ship Codex `agents/openai.yaml`
  policy files.
- **Hooks** - plugin hooks resolve both Codex and Claude plugin roots, and the
  PostToolUse hook recognizes Codex `apply_patch` payloads.
- **Pattern skills** - reusable pattern references are written under
  `.agents/skills/patterns` with optional Claude mirrors.

## v0.6.1 — UI/UX alignment promoted to scope/epic tier

Shifts where `ux-ui-design` mockups get produced. Epic-design Phase 4.6 is
now the PRIMARY mockup tier and errs on the side of mocking; feature-design
is the FALLBACK, used only for minor surfaces not covered upstream. The
`--only-questions` modes always run the mockup pass — they're the visual
alignment gate, not just the textual one.

- **`epic-design`** Phase 4.6 — primary mockup tier: palette + screens
  (for every net-new surface) + flows (for every journey). Under
  autopilot, defers with a `## UI alignment deferred` note. Child feature
  template now carries `## Mockups` for inheritance.
- **`epic-design --only-questions`** — mockup pass added to the workflow.
- **`feature-design`** Phase 4.6 — fallback tier. Inherits parent-epic
  mocks by reference; only invokes ux-ui-design for surfaces upstream
  missed.
- **`feature-design --only-questions`** — Phase 4.6 added with the same
  fallback rules.
- **`scope`** Phase 1.8 — large-scope + UI actively invokes `:palette`
  during the Phase 4 roll-forward and `:flows` for cross-feature
  journeys clear at scope time.
- **`ux-ui-design:ux-ui-principles`** — new "Where in the workflow to mock"
  section encoding the tier ordering; description rewritten in ALWAYS
  style to match agile-workflow conventions.

## v0.4.3 — orchestrator becomes default, scope-driven, cross-feature

Shifts the routing for `stage: implementing` work so the orchestrator is the
default path and is no longer scoped to a single parent feature.

- **`implement-orchestrator`** — now the default for everything at
  `stage: implementing` (features with or without children, lone stories,
  parentless items). Accepts a scope arg in any of four forms: a feature id
  (current behavior), an epic id, `--all`, or an explicit list of item ids.
  Phase 1 grounding reads every parent feature in the work set, not just
  one. Phase 2 builds a unified `depends_on` graph across the whole scope —
  cross-feature dependencies are first-class, not partitioned by parent.
  Phase 3 introduces a file-overlap conflict check before each wave; either
  serialize conflicting items into a later sub-wave or spawn the wave with
  `isolation: "worktree"`. Phase 9 advances **every** parent feature whose
  children are all at `review` (multi-parent), and leaves parents with
  out-of-scope implementing children at `implementing` until a later run
  finishes them.
- **`implement`** — repositioned as the inline alternative. Same single-stride
  workflow as before; the trigger now points at the orchestrator as the
  default and lists the cases where inline is the right call (small / focused
  work, user explicitly asks to land inline, mid-flow continuation). No
  numeric thresholds — the choice stays a judgment call.
- **`autopilot`** Phase 5 — when the picked anchor is at `stage: implementing`,
  hands the **full autopilot scope** (epic id, `--all`, or the reduced list
  from a free-text directive) to the orchestrator in one call. The
  orchestrator drains the entire in-scope implementing band, advancing
  parents along the way. Phase 4 documents that the picked item is an
  "anchor" only on the implementing branch — drafting and review continue
  to be processed one item at a time.
- **`docs/ARCHITECTURE.md`** — pipeline diagram, queue-selection algorithm,
  and skill table updated to reflect orchestrator-as-default and the
  scope-driven shape. Queue filter expanded to include `review` (autopilot
  has handled review autonomously since v0.3.x; the doc was stale).

The throughput motivation: with stories defaulting to the orchestrator, a
ready story from feature A and a ready story from feature B can pack into the
same 3-agent wave instead of running sequentially. Single-feature scopes
behave exactly like before — only multi-feature or `--all` scopes see the new
fan-out.

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
