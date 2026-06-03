---
id: story-work-view-scope-cli
kind: story
stage: done
tags: [tooling]
parent: feature-work-view-scope
depends_on: []
release_binding: null
gate_origin: null
created: 2026-06-03
updated: 2026-06-03
---

# Rust: `--scope` flag, TierScope post-filter, default non-terminal, implicit-widen

## Scope

The Rust binary half of `feature-work-view-scope`. See the feature body for the
locked decisions and overall design.

## Changes

- `crates/cli/src/args.rs`:
  - `enum TierScope { NonTerminal, Active, Backlog, Releases, Archive, All }`,
    `#[default] NonTerminal`, with `pub fn includes(&self, tier: Tier) -> bool`
    (`NonTerminal` = `Active | Backlog`; `All` = every tier; singletons match
    their tier).
  - `CliOptions` gains `scope: TierScope`.
  - Parse `--scope <v>`: map `active|backlog|releases|archive|all`; unknown value
    → `UsageError`. Track `saw_scope` (last-wins like other scalars).
  - After the loop: if (`filter.release` or `filter.gate` is set) and
    `!saw_scope`, set `scope = TierScope::All` (implicit-widen). Explicit
    `--scope` always wins.
  - Add `--scope` to `HELP`.
- `crates/cli/src/scope.rs` (new): `pub fn apply_scope<'a>(items: Vec<&'a Item>,
  scope: TierScope) -> Vec<&'a Item>` filtering on `scope.includes(item.tier)`,
  load order preserved. Mirror the module-doc style of `actionable.rs`.
- `crates/cli/src/main.rs`: `mod scope;` + insert `apply_scope` between
  `query` and `apply_dependency_view`.

## Acceptance criteria

- Default options → `TierScope::NonTerminal`; releases+archive items excluded
  from a bare query and from `--kind`/`--tag`/`--count`/`--cat`.
- `--scope all` includes every tier (byte-identical to pre-change default).
- `--scope archive` / `--scope releases` / `--scope active` / `--scope backlog`
  each select exactly their tier.
- `--scope bogus` → exit 1 usage error.
- `--release X` and `--gate Y` widen to all tiers with no `--scope`; an explicit
  `--scope active` with `--release X` stays active (explicit wins).
- `--ready`/`--blocked` results unchanged (active ⊂ non-terminal).
- Unit tests in `scope.rs` (membership + post-filter, mirroring
  `actionable.rs` tests) and `args.rs` (parse + implicit-widen precedence).
- `cargo test` green; `cargo clippy` clean.

## Implementation notes (done — at review)

- `args.rs`: added `TierScope { NonTerminal(default), Active, Backlog, Releases,
  Archive, All }` + `includes(tier)`; `CliOptions.scope`; `--scope` parse arm
  (unknown → UsageError); `saw_scope` tracking; post-loop implicit-widen
  (`!saw_scope && (release != Any || gate != Any)` → `All`); HELP `Scope`
  section; contract doc-comment lines.
- `scope.rs` (new): `apply_scope(items, scope)` post-filter, `All` short-circuits,
  load order preserved. 9 unit tests (includes + membership + post-filter).
- `main.rs`: `mod scope;`, `use scope::apply_scope;`, inserted between `query`
  and `apply_dependency_view`; pipeline doc-comment updated.
- 11 new `args.rs` tests (parse tokens, invalid/missing value, last-wins,
  release/gate widen, gate-null widen, explicit-over-implicit precedence,
  plain-filters-do-not-widen).
- Suite green: 124 lib + 82+59+31+4 integration = 300 tests pass; clippy 0
  (fixed a `needless_lifetimes` on `apply_scope`).
- Smoke-tested on this repo's substrate: default `--kind feature` 31→1;
  `--scope all` restores 148; `--release 0.9.0` widens to 58 with no `--scope`;
  `--release 0.9.0 --scope active` = 0 (explicit wins); `--scope bogus` exit 1.
- Verified board path untouched (`board/feed.rs` reads `.items()` directly,
  separate `board`/`serve` subcommand, never hits `parse_args`/`apply_scope`).
