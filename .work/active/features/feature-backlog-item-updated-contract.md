---
id: feature-backlog-item-updated-contract
kind: feature
stage: done
tags: [plugin, tooling]
parent: null
depends_on: []
release_binding: null
gate_origin: null
research_origin: priority-and-grooming-shapes-for-agentic-substrates
created: 2026-06-15
updated: 2026-06-15
---

# Make `updated` (last-touched) a first-class part of the backlog item contract

## Brief

A backlog grooming/hygiene capability (sibling feature `feature-backlog-grooming-skill`) needs a
**last-touched signal** to distinguish "parked long ago and untouched" from "parked recently" —
age-based staleness detection is impossible on a creation date alone. This feature establishes
that the signal is a reliable, documented part of the backlog item contract.

## What grounding revealed (read before designing)

The naive framing — "add an `updated` field" — is wrong; the mechanism mostly already exists, and
the design must start from that:

- The canonical **active item** frontmatter already requires `updated: YYYY-MM-DD`, auto-bumped by
  the PostToolUse hook on every edit (SPEC §frontmatter).
- The PostToolUse hook's activation already covers **backlog** paths — it auto-bumps `updated:` on
  modified `.work/backlog/` files too (SPEC §hook activation/effect).
- BUT the documented **backlog item shape** is leaner — `id, created, tags` only — and does **not**
  declare `updated:`. So: a freshly-parked, never-edited item has no `updated` at all; and the
  schema *contract* a grooming consumer would rely on does not promise the field.

So the actual gap is **contract clarity + query surface**, not net-new plumbing. The design pass
should establish, at minimum:

1. Whether `updated` becomes a declared (optional, defaulting to `created` when absent) field in
   the documented backlog item shape — so a grooming consumer can rely on a last-touched value for
   every backlog item, edited or not.
2. That `work-view` can surface backlog item age / staleness (a `--stale` / age projection, or at
   least exposing `updated` in backlog queries) so grooming has a query path rather than re-parsing
   frontmatter.
3. Confirm the hook actually populates `updated` on backlog items in practice and that the
   leaner backlog shape and the hook behavior are reconciled (today they disagree: shape omits it,
   hook writes it).

## Design constraints (load-bearing)

- **Optional / inert when absent.** A deployment not running grooming must be unaffected; `updated`
  absent behaves as today (treat as `created`).
- **Follow repo conventions.** Schema/contract change → SPEC + the substrate-maintainer; query
  change → the `work-view` Rust crate; both documented in CONVENTIONS extension surface.

## Why this is the precondition, not the work itself

Grooming's staleness face is the consumer; this feature is the contract it stands on. Sequenced
ahead of `feature-backlog-grooming-skill` via that feature's `depends_on`.

## Research grounding

**Source**: `.research/analysis/positions/priority-and-grooming-shapes-for-agentic-substrates.md`
(slug: `priority-and-grooming-shapes-for-agentic-substrates`), Position 2.

The position names a last-touched signal as grooming's hard precondition: "age-based staleness
detection is impossible if items carry only a creation date." Landscape detail (mechanizable
staleness signals; the canonical stale-bot's age/last-update lifecycle) is in the synthesis brief
`workflow-priority-grooming-for-agentic-substrates-landscape` and the
`backlog-grooming-discipline-landscape` facet brief.

## Grounding findings (from the code, before designing)

`updated` is a **stubbed-but-unused field on the backlog tier**, not a missing one:

- `work-view`'s `Item` model already parses `updated: Option<String>`
  (`work-view/crates/core/src/model.rs`) — the field is *known* to the query layer.
- But nothing writes it onto a backlog item: `BACKLOG_REQUIRED = {id, created, tags}`
  (`hooks/scripts/substrate-maintainer.py`) and `park`/scaffold does not emit it.
- The hook's `bump_updated` is **replace-only** — it refreshes an existing `updated:` line but
  **cannot insert a missing one** (`substrate-maintainer.py` ~line 140). So editing a fieldless
  backlog item does not add it.
- Empirically: 0 of the current backlog items carry `updated`.
- No staleness query exists — `work-view` exposes no `--stale` / age flag.

So the work is to **activate a half-present field** (make it reliably present + queryable on the
backlog tier), not build new plumbing.

## Design decisions

- **Activation — `park` writes `updated: == created` at birth**: new backlog items carry
  `updated` from creation; the existing replace-only hook then bumps it on edit. No change to the
  always-on hook. *Rejected alternative: teaching `bump_updated` to insert-when-missing* — it
  would self-heal legacy items but changes behavior in the one component that runs on every item
  edit in every project (larger blast radius, harder bloat story). Revisit if legacy-item
  staleness accuracy proves load-bearing.
- **`updated` is optional on the backlog contract, `created` is the fallback**: absent ⇒ treat as
  `created`. A deployment not grooming is unaffected; legacy fieldless items read as "as old as
  created" — a safe, conservative staleness floor.
- **Staleness query lives in `work-view --stale`, threshold in CONVENTIONS**: opt-in via a
  `backlog_staleness_days:` key; key absent ⇒ feature inert (surfaces nothing). Mirrors the
  `gates_for_release` opt-in pattern. Gives the grooming consumer a reusable query rather than
  re-parsing frontmatter.
- **Single-stride feature, no child stories**: the three units are tightly cohesive and verified
  together; splitting on docs/python/rust is package boundary, not story boundary.

## Architectural choice

**Activate-at-the-edges, keep the always-on hook untouched.** The field becomes reliable by
writing it where items are *born* (`park`) and reading it where staleness is *asked*
(`work-view --stale`), leaving the per-edit hook exactly as-is. This is the minimal-blast-radius
shape and the cleanest optional-by-convention story for upstream: a project that sets no
`backlog_staleness_days:` key sees zero behavior change, and the hook's behavior is identical for
every project regardless.

## Implementation Units

### Unit 1: Backlog item contract — declare `updated` (optional)
**File**: `plugins/agile-workflow/docs/SPEC.md` (backlog item shape section)

Add `updated: YYYY-MM-DD` to the documented backlog frontmatter shape as **optional**, with a
note: written by `park` at creation (`== created`), bumped by the PostToolUse hook on edit,
treated as `created` when absent. Keep `BACKLOG_REQUIRED` unchanged (the field stays optional —
validation already format-checks `updated` only if present, `substrate-maintainer.py` ~line 252,
so no validator change is needed). Document the `backlog_staleness_days:` CONVENTIONS key in the
SPEC §CONVENTIONS schema and the convert-written CONVENTIONS template.

**Acceptance Criteria**:
- [ ] SPEC backlog shape lists `updated` as optional with the "== created at birth, == created
      when absent" semantics.
- [ ] SPEC §CONVENTIONS documents `backlog_staleness_days:` (integer; absent ⇒ `--stale` inert).
- [ ] `BACKLOG_REQUIRED` is unchanged; no new required field.

### Unit 2: `park` populate-path — write `updated` at creation
**File**: the `park` skill scaffold path (`plugins/agile-workflow/skills/park/`) — the backlog
item template/writer.

When `park` creates `.work/backlog/<id>.md`, emit `updated: <today>` alongside `created: <today>`.

**Implementation Notes**:
- Mirror the date source already used for `created` (no new date logic).
- Does not retro-touch existing items; legacy items remain fieldless and read as `created`.

**Acceptance Criteria**:
- [ ] A freshly-parked backlog item contains `updated:` equal to `created:`.
- [ ] The existing replace-only hook bumps that `updated:` on a subsequent edit (no hook change).
- [ ] Existing fieldless backlog items are left untouched.

### Unit 3: `work-view --stale` staleness query
**Files**: `plugins/agile-workflow/work-view/crates/cli/src/args.rs` (flag parse),
`crates/cli/src/actionable.rs` or a sibling (selection), `crates/core/src/filter.rs` (predicate),
help text in `args.rs`.

Add `--stale` to the filter set. Semantics: backlog-tier items where
`(today - (updated ?? created)) > backlog_staleness_days`. The threshold is read from
`.work/CONVENTIONS.md` `backlog_staleness_days:`; **absent key ⇒ `--stale` surfaces nothing and
prints a one-line "no `backlog_staleness_days` configured" notice** (politely inert, not an
error — matches the graceful-skip pattern of opt-in gates).

**Implementation Notes**:
- `updated` and `created` are already `Option<String>` on the model — no parse change.
- Date math against "today": follow the hook's local-time convention for consistency.
- Reuse the existing repeatable-flag parser pattern in `args.rs`; do not add a dependency.
- The bash fallback `work-view.sh` is a frozen degraded fallback — `--stale` is Rust-only
  (consistent with `--scope` being Rust-only, per the args.rs note).

**Acceptance Criteria**:
- [ ] `work-view --stale` with `backlog_staleness_days: N` set lists backlog items older than N
      days by `(updated ?? created)`.
- [ ] With the key absent, `--stale` surfaces nothing and prints the inert notice (exit 0).
- [ ] Non-backlog tiers are excluded from `--stale`.
- [ ] An item with `updated` newer than `created` is judged by `updated` (last-touched, not birth).

## Implementation Order
1. Unit 1 (SPEC contract — names the field + the CONVENTIONS key the others reference)
2. Unit 2 (`park` populate) and Unit 3 (`work-view --stale`) — independent, either order

## Testing
- **Unit 2**: extend the `park` skill's scaffold test (or add one) asserting a parked backlog
  item carries `updated == created`.
- **Unit 3**: `work-view` integration tests (`crates/cli/tests/integration.rs`) — fixture
  backlog items with varied `created`/`updated`/absent, asserting `--stale` selection at a set
  threshold, the absent-key inert path, tier exclusion, and `updated`-over-`created` precedence.
  Use the existing in-memory substrate test fixture builder pattern.
- **Unit 1**: doc change; covered by the SPEC reconciliation being self-consistent with the
  validator (no validator change) — no code test, but verify `convert`'s CONVENTIONS template
  round-trips the new key if a template test exists.

## Risks
- **Local-time date math drift** (the hook bumps in local time; `--stale` must match or
  off-by-one staleness appears across timezones). Mitigation: reuse the hook's date convention
  explicitly in Unit 3.
- **Optional-key discoverability**: a project that wants grooming must know to set
  `backlog_staleness_days:`. Mitigation: `convert` writes it (commented/defaulted-off) into the
  CONVENTIONS template so the knob is visible but inert until set.

## Implementation notes (landed)

All three units implemented; `cargo build` + `cargo test` green (261 tests, 6 new `--stale`
integration tests), no new dependencies, no new clippy warnings. End-to-end smoke test confirmed
both the inert (no key → notice + exit 0, empty) and active (key=90 → only the >90-day item) paths.

- **Unit 1 (SPEC contract):** `plugins/agile-workflow/docs/SPEC.md` — backlog item shape now lists
  `updated` as optional (== created at birth, == created when absent); `backlog_staleness_days`
  documented in the §CONVENTIONS schema block + explanatory paragraph. `BACKLOG_REQUIRED`
  unchanged (no validator change — validate() already format-checks `updated` only when present).
- **Unit 2 (`park` populate):** `plugins/agile-workflow/skills/park/SKILL.md` — Phase 3 template
  now emits `updated: == created` with a note explaining the replace-only-hook rationale.
- **Unit 3 (`work-view --stale`):** new `crates/cli/src/stale.rs` (staleness logic + minimal
  line-scanner CONVENTIONS reader, std-only); `args.rs` (`--stale` flag + help); `main.rs`
  (pipeline branch); `integration.rs` (6 tests). Local-time date math via POSIX `localtime_r`
  `extern "C"` (no `chrono` dependency); `#[cfg(not(unix))]` UTC fallback. Dateless backlog items
  surface as stale (a dateless item is at least as suspect as an old one). Bash fallback
  `work-view.sh` deliberately untouched (Rust-only, consistent with `--scope`).

**Note for review/release:** the committed binary `.work/bin/work-view` and the crate `dist/` are
NOT rebuilt here — they refresh via the separate `[skip ci]` binary process. Source + tests are
the deliverable.

## Review (2026-06-15)

**Verdict**: Approve

**Blockers**: none
**Important**: none
**Nits**: `stale.rs` `parse_staleness_days` — a malformed/out-of-range/comment-suffixed
`backlog_staleness_days` value fails the `u64` parse and falls through to "not configured"
(inert) rather than surfacing an error. Consistent with inert-by-default and the safer choice
(a typo can't mis-fire staleness), but can mask a config mistake. No action; noted for a future
"why isn't `--stale` working" report.

**Notes**: Substrate mode, deep lane, fresh-context independent reviewer (Opus sub-agent — I
implemented this myself, so review was delegated to fresh context, not self-confirmation). The
reviewer ran `cargo build` + `cargo test` itself (365 tests green: 153 CLI unit incl. 16
`stale::tests`, 100 CLI integration incl. 6 new `--stale`, 77 core, 31 core integration, 4 doc),
ran clippy (no new warnings; `stale.rs` clippy-clean), and verified the local-time date math
independently against a Python `date` reference across leap-year + threshold boundaries. All
Unit 1/2/3 acceptance criteria pass; optional/inert invariant confirmed (no change to the
always-on hook; `bump_updated` still replace-only); no project-boundary leaks. Kept in
`active/` (not archived) because `feature-backlog-grooming-skill` still `depends_on` it and root
release mapping is `none`.
