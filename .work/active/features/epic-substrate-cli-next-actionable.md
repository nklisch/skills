---
id: epic-substrate-cli-next-actionable
kind: feature
stage: review
tags: [tooling]
parent: epic-substrate-cli
depends_on: [epic-substrate-cli-query-core]
release_binding: null
gate_origin: null
created: 2026-05-30
updated: 2026-05-30
---

# Stage-aware "next actionable" (the `--ready` fix)

## Brief

The headline correctness fix. Today `work-view --ready` is hard-gated to
`stage:implementing` with deps satisfied, so a drafting feature whose
dependencies are all done is invisible — agents repeatedly hit "nothing ready"
when there is in fact design-ready work. This feature delivers a **stage-aware
"next actionable"** computation on the query core's dependency graph: an item is
actionable when its `depends_on` are all terminal AND its stage admits the next
move — design-ready (`drafting` with deps satisfied), implement-ready
(`implementing` with deps satisfied), and review-ready (`review`). It surfaces
through `--ready` (and `--blocked`), wired into the adapter's CLI scaffold, and
should let an agent ask "what can I pick up next, at any stage?".

Does NOT re-implement the core graph (it consumes it) or the standard flag
surface (that's the adapter). Defines what "actionable" means per stage and
exposes it.

## Epic context
- Parent epic: `epic-substrate-cli`
- Position in epic: depends on the core's dependency-graph eval; parallel with
  `adapter` but shares the CLI entrypoint — feature-design should have it plug
  `--ready`/`--blocked` into the adapter's arg-parsing scaffold (see the epic's
  decomposition risks).

## Foundation references
- `docs/VISION.md` — success criterion: the agent tooling answers "what can I do
  next?" correctly at any stage, not just one.
- `plugins/agile-workflow/docs/SPEC.md` — current `--ready` / `--blocked`
  definition and the stage flow per kind (the contract this revises).
- `plugins/agile-workflow/skills/autopilot/SKILL.md` Phase 2 — the EXISTING
  readiness definition this aligns the CLI to (stage ∈ {drafting, implementing,
  review} ∧ all `depends_on` terminal; active items only).
- `epic-substrate-cli-adapter` body — the `CliOptions.dependency_view` +
  `apply_dependency_view` seam this feature fills in.
- `plugins/agile-workflow/scripts/work-view.sh` — the bash fallback that must
  stay in lockstep with the binary's `--ready`/`--blocked`.
- `plugins/agile-workflow/hooks/scripts/prompt-context.py` — consumer of
  `--ready` for the session "Ready" snapshot.

## Design decisions
- **"Actionable" = `tier == Active` ∧ `stage ∈ {drafting, implementing,
  review}` ∧ `deps_satisfied`.** This is exactly autopilot's queue definition —
  the fix aligns the CLI to an existing internal contract rather than inventing
  one. `--ready` keeps such items; `--blocked` keeps `tier == Active` ∧
  `stage ∈ {...}` ∧ `!deps_satisfied`.
- **Active-tier gate (peer catch).** The core loads all four tiers; without the
  `tier == Active` guard a stray archive/releases item with a non-terminal
  stage could leak into `--ready`. Backlog items (no `stage`) are already
  excluded by the allowlist; the tier gate also keeps releases (planned/
  quality-gate, a different axis driven by `release-deploy`) out.
- **`deps_satisfied` uniform across all three stages, incl. `review`.** A review
  item whose dependency regressed or is unknown should report blocked — the
  conservative queue invariant. Empty `depends_on` is vacuously satisfied →
  ready (correct: a drafting item with no deps is design-ready).
- **Implemented as the adapter post-filter `apply_dependency_view` over
  `query()` results** — composes with every normal filter by AND, preserves
  load order, never rewrites `filter.stage`. So `--ready --stage implementing`
  recovers the OLD narrow behavior and `--ready --stage drafting` =
  design-ready only. Composition is the backward-compat story. Correct because
  the core's `deps_satisfied` evaluates against the whole `Substrate`, not the
  filtered subset.
- **No output annotation.** The default table's `stage` column already tells the
  agent the action (design/implement/review). Keep output terse/parseable;
  if richer action labels are wanted later, add a NEW structured mode, don't
  reshape the default. (peer-concurred)
- **`--ready`/`--blocked` mutually exclusive → usage error exit 1** (bash parity).
- **Bash fallback updated in lockstep (no drift).** `work-view.sh`'s
  `--ready`/`--blocked` gate moves from implementing-only to the same
  stage-aware + active-tier predicate, so the fallback and the binary agree
  (substrate-binary mandate).
- **Hook reconciliation.** Once `--ready` includes `review` items, the session
  snapshot's `Ready` + dedicated `Review` sections would double-list review
  items. `prompt-context.py`'s `Ready` section excludes `stage == review`
  (those stay in the `Review` section), preserving a clean snapshot.

## Architectural choice

Not a new module hierarchy — this feature **fills in the seam** the adapter
designed, touching both substrate surfaces (binary + bash fallback) plus the
one hook that consumes `--ready`. Implementation ordering: the binary units
edit `crates/cli/`, which the adapter creates, so this feature is implemented
**after** the adapter's CLI crate exists. (No `depends_on` edge added — kept
same-layer so implement-orchestrator can bundle adapter→next-actionable into
one sequential agent; ordering is enforced by the bundle, not the graph.)

## Implementation Units

### Unit 1 (trickiest): the actionable predicate + dependency-view post-filter — `crates/cli/src/actionable.rs`
```rust
use work_view_core::{index::Substrate, model::{Item, Tier}};
use crate::args::DependencyView;

/// Autopilot's readiness axis: active-tier work items at a movable stage.
fn is_actionable_candidate(item: &Item) -> bool {
    item.tier == Tier::Active
        && matches!(item.stage.as_deref(), Some("drafting" | "implementing" | "review"))
}

/// Post-filter over `query()` results; preserves input (load) order.
/// Extends the adapter's `All`-only stub with `Ready`/`Blocked`.
pub fn apply_dependency_view<'a>(
    sub: &Substrate,
    items: Vec<&'a Item>,
    view: DependencyView,
) -> Vec<&'a Item> {
    match view {
        DependencyView::All => items,
        DependencyView::Ready =>
            items.into_iter().filter(|i| is_actionable_candidate(i) && sub.deps_satisfied(i)).collect(),
        DependencyView::Blocked =>
            items.into_iter().filter(|i| is_actionable_candidate(i) && !sub.deps_satisfied(i)).collect(),
    }
}
```
**Acceptance**:
- [ ] A drafting active item with all deps terminal → in `--ready`.
- [ ] An implementing active item with all deps terminal → in `--ready`.
- [ ] A review active item with deps terminal → in `--ready`; with an unmet dep
      → in `--blocked`, not `--ready`.
- [ ] An item with empty `depends_on` → ready (vacuously satisfied).
- [ ] A `done`/`released` item, a backlog item, and an archive/releases item are
      NEVER in `--ready` or `--blocked` (tier + stage gate).
- [ ] `--ready --stage implementing` reproduces the old implementing-only set.

### Unit 2: arg wiring — `crates/cli/src/args.rs` (+ `main.rs` call site)
Extend the adapter's `DependencyView` and `parse_args`:
```rust
pub enum DependencyView { #[default] All, Ready, Blocked }
// parse_args: "--ready" => set Ready; "--blocked" => set Blocked;
//             both present => UsageError ("--ready and --blocked are mutually exclusive") => exit 1.
//             Neither touches filter.stage.
// HELP: append the --ready / --blocked lines (stage-aware wording).
```
`main.rs` already calls `apply_dependency_view(&sub, items, opts.dependency_view)`
between `query` and `render` (adapter seam) — no new wiring beyond the enum/arms.
**Acceptance**:
- [ ] `--ready` / `--blocked` set the right `DependencyView`; both → exit 1.
- [ ] `--help` lists `--ready`/`--blocked`.

### Unit 3: bash fallback parity — `plugins/agile-workflow/scripts/work-view.sh`
The `--ready`/`--blocked` block currently gates on `stage == implementing`.
Replace with the stage-aware + active-tier predicate:
```bash
# only active-tier items at a movable stage are actionable
case "$f" in */.work/active/*) ;; *) continue ;; esac
case "${IDX_STAGE[$f]}" in drafting|implementing|review) ;; *) continue ;; esac
if [[ $want_ready -eq 1 ]]; then deps_satisfied "$f" || continue
else deps_satisfied "$f" && continue; fi
```
Update the bash `--help` text for `--ready`/`--blocked` accordingly. Then sync
this repo's installed copy (`.work/bin/work-view`) — check whether it's a
symlink or a copy and update to match.
**Acceptance**:
- [ ] Bash `--ready` returns the same set as the binary `--ready` over a shared
      fixture (the parity test asserts this).
- [ ] `.work/bin/work-view --ready` in this repo reflects the new semantic.

### Unit 4: hook reconciliation — `plugins/agile-workflow/hooks/scripts/prompt-context.py`
The snapshot renders `Ready` (via `--ready`) and a separate `Review` (via
`--stage review`). Filter `stage == review` out of the `Ready` section so review
items appear only under `Review`.
**Acceptance**:
- [ ] With stage-aware `--ready`, the snapshot does not list a `review` item in
      both `Ready` and `Review`.

## Implementation Order
1. (precondition) adapter's `crates/cli` exists — bundle adapter first.
2. Unit 1 (`actionable.rs`) — the predicate + post-filter.
3. Unit 2 (`args.rs`/`main.rs`) — `--ready`/`--blocked` wiring.
4. Unit 3 (`work-view.sh` + `.work/bin/work-view`) — bash fallback lockstep.
5. Unit 4 (`prompt-context.py`) — snapshot reconciliation.

Single implementation pass; **no child stories** (cohesive: one semantic landed
across binary + fallback + hook).

## Testing
- **actionable** unit tests over a fixture with items at every stage and every
  tier: drafting/implementing/review × deps-satisfied/unmet; done/released;
  backlog; archive/releases with odd stages (tier gate); empty `depends_on`.
- **args** tests: `--ready`/`--blocked` → `DependencyView`; mutual exclusion →
  exit 1; `--help` includes them.
- **parity** (strongest): over a shared fixture, assert the built binary's
  `--ready`/`--blocked`/`--ready --stage X` stdout+exit match the UPDATED bash
  `work-view.sh` (guard if bash unavailable).
- **hook**: a small test/asserted run that a review item isn't double-listed.

## Risks
- **Consumer drift**: docs (`docs/ARCHITECTURE.md`, plugin `ARCHITECTURE.md`,
  SPEC) and the board still describe/compute implementing-only readiness. SPEC's
  `--ready` definition is on the epic's "foundation docs to roll forward" list;
  the `docs` gate enforces it at release. The board is a separate epic
  (`epic-substrate-board`) — out of scope here; flagged for that epic.
- **Hook double-listing** (addressed in Unit 4) — if Unit 4 is skipped, review
  items show twice in the session snapshot once the stage-aware bash/binary is
  installed.
- **`.work/bin/work-view` sync** — if it's a tracked copy (not a symlink),
  Unit 3 must update it too or this repo's hook keeps the old semantic.

## Other agent review
Cross-model design consult (Codex, xhigh, advisory; same session as the adapter
consult), 2026-05-30. Accepted and folded in: the **active-tier gate** (core
loads all tiers; autopilot is active-only — without it archive/releases items
with odd stages leak into `--ready`); uniform `deps_satisfied` incl. review;
no output annotation; explicit `{drafting, implementing, review}` allowlist
excluding releases; **bash-fallback lockstep** (Unit 3) and **hook
reconciliation** (Unit 4) to prevent surface drift / double-listing; post-filter
correctness (deps evaluated over the whole substrate). No blockers raised.

## Implementation notes

### What was built

Four units, all delivered:

**Unit 1 — `crates/cli/src/actionable.rs`** (replaced the adapter stub):
- `is_actionable_candidate(item)`: `tier == Active && stage ∈ {drafting, implementing, review}`
- `apply_dependency_view(sub, items, view)`: `All`→passthrough; `Ready`→candidate && `deps_satisfied`; `Blocked`→candidate && `!deps_satisfied`. Preserves input order.

**Unit 2 — `crates/cli/src/args.rs`**: No changes needed — `DependencyView::Ready`/`Blocked` and `--ready`/`--blocked` arms were already declared in item 1 (the adapter). `main.rs` already calls `apply_dependency_view` with `opts.dependency_view`. The `HELP` text already includes `--ready`/`--blocked` with stage-aware wording.

**Unit 3 — `plugins/agile-workflow/scripts/work-view.sh`**: `--ready`/`--blocked` block updated from `stage == implementing` only to active-tier gate (`case "$f" in */.work/active/*`) + stage allowlist (`case "${IDX_STAGE[$f]}" in drafting|implementing|review`). Help text updated. `.work/bin/work-view` (a tracked copy, not a symlink) synced via `install`.

**Unit 4 — `plugins/agile-workflow/hooks/scripts/prompt-context.py`**: `build_snapshot` now excludes `stage: review` paths from the `Ready` section (those are already in `Review`). Implemented by path-set exclusion: `ready = [p for p in ready_raw if p not in review_paths]`.

### Parity verification

Six bash-parity integration tests (`parity_*`) run the binary and bash against
the same fixture and assert identical stdout + exit code:
- `parity_ready_paths_matches_bash` — PASS
- `parity_ready_count_matches_bash` — PASS
- `parity_blocked_paths_matches_bash` — PASS
- `parity_blocked_count_matches_bash` — PASS
- `parity_ready_stage_implementing_matches_bash` — PASS (old narrow set reproduced)
- `parity_paths_matches_bash` / `parity_count_matches_bash` — PASS

Known and accepted table-mode cosmetic diff (documented in adapter Risks): bash
renders missing `parent` field as `""` while Rust renders `None`→`"-"` for
backlog items. Excluded from parity assertions per spec.

### Verification

`cargo build && cargo test && cargo clippy --all-targets -- -D warnings && cargo fmt --check`
all pass from `plugins/agile-workflow/work-view/`.

Test counts: 70 unit tests (actionable: 24, args: 33, render: 13) + 45 integration
= 115 CLI tests; plus 58 core unit + 31 core integration + 4 doc tests = 208 total.

### `.work/bin/work-view` status
Was a tracked copy (not a symlink). Synced with `install` to reflect the updated
stage-aware `--ready`/`--blocked` logic.

### Deviations from spec
None. `DependencyView::Ready`/`Blocked` were declared in item 1 rather than item 2,
making this item's arg-wiring a no-op (the seam was already filled by the adapter).
This is a benign ordering difference within the bundle, not a spec deviation.
