---
id: feature-work-view-scope
kind: feature
stage: done
tags: [tooling]
parent: null
depends_on: []
release_binding: null
gate_origin: null
created: 2026-06-03
updated: 2026-06-03
---

# work-view: default scope to non-terminal tiers + `--scope` flag

## Problem

`work-view` loads all four tiers (`active`, `backlog`, `releases`, `archive`)
and the plain structural filters (`--stage`, `--kind`, `--tag`, `--parent`,
`--blocking`, bare table, `--count`, `--cat`) match across **all** of them. The
archive grows without bound, so over a project's life every all-tier query
degrades: "what features exist?" eventually answers mostly with shipped/dead
items, and agents burn context reading `--cat` output that is largely history.

`--ready`/`--blocked` are already active-tier-gated (`actionable.rs:32`), so the
noise is confined to the plain filters — which is exactly where it hurts.

## Decisions (locked with user)

1. **Cut on tier, not stage.** Default scope = **non-terminal tiers
   (Active + Backlog)**; terminal tiers (Releases + Archive) require opt-in.
   Reuses the existing `is_terminal`-by-tier line (`model.rs:113`). Keeps
   `--stage done` working for *active* items (the common case in implement /
   review / release-deploy), since active items stay active-tier until
   release-deploy `git mv`s them out.
2. **Default lives in the CLI layer**, implemented exactly like `DependencyView`:
   an enum in `args.rs` + a CLI-layer post-filter module. Core `query()` and the
   board (`board/feed.rs:90`, reads `.items()` directly and emits per-tier
   columns) stay **scope-agnostic** — the board must keep showing Done/Shipped.
3. **Implicit-widen for `--release` / `--gate`** (chosen: option a). These are
   lifecycle-spanning selectors — a query keyed on `release_binding` or
   `gate_origin` is inherently a lifetime query, and release-deploy `git mv`s
   bound items into `.work/releases/<version>/` (terminal tier) on ship. So when
   `--release` or `--gate` is present **and `--scope` was not explicitly given**,
   scope widens to `all`. Explicit `--scope` always wins.
4. **Flag shape:** `--scope <active|backlog|releases|archive|all>`. Ship the full
   enum (per-tier cost is one match arm each and the AGENTS note references
   `archive`/`releases`). Default (no flag) = non-terminal (active+backlog); there
   is no user-facing token for the default set.
5. **Mirror into `work-view.sh`.** It is a live byte-parity reference
   (`scripts/work-view.sh`, parity matrix in `crates/cli/tests/integration.rs`)
   and already classifies items by tier for the `--ready`/`--blocked` gate
   (lines 228, 356), so mirroring is cheap. Keep parity honest rather than
   declaring a divergence.
6. **Docs are descriptive, not config.** Convert's AGENTS substrate
   query-patterns block (`convert/SKILL.md:471-476`) gains a one-line note;
   `--help` documents the flag. The binary does **not** read CONVENTIONS.md for a
   configurable default (keeps core config-free, single source of truth).
7. **No SessionStart hook line** — `--help` + the AGENTS query-patterns block are
   the discoverability channels; an empty result is self-correcting once
   `--scope` is documented.

## Design

Pipeline becomes: `query()` (core, all tiers) → **`apply_scope`** (new CLI
post-filter) → `apply_dependency_view` → `render` (`main.rs:137-138`).

- `args.rs`: add `enum TierScope { NonTerminal (default), Active, Backlog,
  Releases, Archive, All }` with `fn includes(&self, tier: Tier) -> bool`. Parse
  `--scope <v>` (unknown value → `UsageError`). Track `saw_scope`. After the
  parse loop, if (`--release` or `--gate` set) and `!saw_scope`, set
  `scope = All`.
- `scope.rs` (new, parallel to `actionable.rs`): `apply_scope<'a>(items, scope)`
  filters by `scope.includes(item.tier)`, preserving load order.
- `main.rs`: insert `apply_scope` between query and dependency_view.
- `HELP` (Rust) + `usage()` (bash) gain the `--scope` line.
- `work-view.sh`: `want_scope` var, parse, implicit-widen, and a tier-membership
  filter in the match loop.
- Parity tests for `--scope all`, default-excludes-terminal, and
  `--release`/`--gate` implicit-widen.

## Story decomposition

- `story-work-view-scope-cli` — Rust: TierScope enum + `--scope` parse +
  `scope.rs` post-filter + `main.rs` wiring + implicit-widen + `HELP` text +
  unit tests. (no deps)
- `story-work-view-scope-bash` — mirror scope + implicit-widen + `usage()` into
  `work-view.sh`; add parity tests. (depends: cli)
- `story-work-view-scope-docs` — convert AGENTS query-patterns note + refresh
  this repo's own substrate doc copy (dogfood). (depends: cli)

## Acceptance

- Default `work-view` / `--kind` / `--tag` / `--count` exclude releases+archive.
- `--scope all` reproduces today's output byte-for-byte.
- `--release <v>` / `--gate <n>` still find bound/gate items after they archive,
  with no explicit `--scope`.
- `--scope active` + explicit-over-implicit precedence covered by tests.
- Board output unchanged. Minor version bump.

## Review outcome (done)

Cross-model review via **Codex** (peeragent, effort high). Verdict: no runtime
correctness blocker in the scope logic; two **should-fix** findings, both fixed:

1. SPEC.md was stale — bash fallback claimed to "preserve the query CLI surface"
   and the flag table omitted `--scope`. Fixed: added `--scope` + default-scope
   docs to the flag table and marked the bash fallback frozen/degraded.
2. No binary-level `--scope` tests — unit tests would still pass if `main.rs`
   stopped wiring `apply_scope`. Fixed: added 9 compiled-binary integration
   tests (default-exclude, `--scope all`, per-tier singletons, invalid-value
   exit 1, `--release`/`--gate` implicit-widen + explicit precedence), backed by
   a new `archive/feat-shipped.md` fixture item.

Codex confirmed: implicit-widen detection is correct/consistent; scope-before-
dependency-view ordering is safe; cut-on-tier keeps active `stage: done` visible;
the `implement` skill's `--stage done` usage is intended live-tier behavior (not
a regression); no other code-path bug.

Also surfaced + parked (pre-existing, not this feature): release-deploy's
`--release ""` unbound-query bug (`bug-release-deploy-unbound-query-empty-string`).

Final: suite 309 green, clippy clean. Rust binary is now canonical work-view;
bash parity retired (full bash retirement parked as `epic-retire-bash-work-view`).
