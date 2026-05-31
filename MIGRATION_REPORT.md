# Migration Report — agile-workflow bootstrap

Bootstrapped the `.work/` substrate into the skills meta-repo on 2026-05-30.

## Source shape

`workflow-plugin` (signal: `docs/designs/`). In practice the repo is a
plugin/skill distribution monorepo; the only `docs/designs/` content was three
finished designs for the now-deprecated `workflow` plugin.

## Foundation docs (read-only, preserved)

Detected and left untouched as the substrate's foundation:

- `docs/VISION.md`
- `docs/SPEC.md`
- `docs/ARCHITECTURE.md`

These were authored via `/agile-workflow:ideate` immediately before this
bootstrap and are committed alongside it.

## Items seeded

| Tier | Count | Items |
|---|---|---|
| Archive (`done`) | 3 | `feature-workflow-plugin-design`, `feature-workflow-suite-improvements-design`, `feature-workflow-content-overhaul` |
| Active (epics/features/stories) | 0 | — seeded later via `epicize` / `scope` |
| Backlog | 0 | — |
| Releases | 0 | release mapping is `none` |

The 3 completed designs were classified `done-archived` (the `workflow` plugin
shipped long ago and is now deprecated/frozen — not a live `v0` release). Each
archived item's body is the original design content, with substrate frontmatter
prepended; `created` is set to the date they were moved to `completed/`
(2026-05-08).

## Classified artifact inventory (Phase 1.7 sweep)

- **Legacy tracking docs:** `docs/designs/completed/` (3 designs). No
  `ROADMAP.md`, `PROGRESS.md`, `TODO.md`, `BACKLOG.md`, `NOTES.md`, or `tasks/`.
- **Agent entrypoints:** `.claude/CLAUDE.md` (regular file, 90 lines). No
  `AGENTS.md` anywhere, no root `CLAUDE.md` — a Claude-native repo.
- **Skill roots:** `.agents/skills/` holds 18 standalone reference skills
  (zod-v4, hono-v4, drizzle-v0, the tanstack family, bun, biome-v2, smol-toml,
  citty, clack-prompts, schemars, claude-cli-sdk, clean-memory, design-pages,
  claude-code-marketplace, codex-plugin-format, zustand-v5, tanstack-table-v8,
  tanstack-router-v1). No `.claude/skills/`, no `.claude/rules/`.
- **Classification:** all 18 standalone skills are `unrelated` — distributed
  product skills, none hand-rolling an agile-workflow concept (patterns,
  refactor-conventions, plan-doc generators). Left untouched.
- **Convergence candidates:** none. No bespoke overlaps, no divergent mirrors.

## Entrypoint model

`agents-canonical`. Created root `AGENTS.md` as the single source of truth
(migrated `.claude/CLAUDE.md` content verbatim + the agile-workflow managed
section between markers). Replaced `.claude/CLAUDE.md` with a relative symlink
`→ ../AGENTS.md` so Claude Code and Codex read identical content.

## Bespoke overlaps converged

None — no convergence candidates were found.

## Reference-integrity actions

Grepped the repo for inbound references before any move/replace:

- **To the 3 designs:** no live pointers from the active system. Matches were
  intra-archive prose (one design references another by name) and generic
  convention mentions inside `plugins/` source (about target projects'
  `docs/designs/completed/`, not these files). The intra-archive prose
  references were left as historical content.
- **To `.claude/CLAUDE.md`:** matches were historical (inside an archived
  design) or generic plugin-source mentions about target projects. The symlink
  keeps the `.claude/CLAUDE.md` path resolvable, so no reference was stranded.

No reference rewrites or redirect shims were required.

## Cleanup scope and actions

`cleanup_scope: legacy-cleanup` (includes generated cleanup).

- **Generated cleanup:** `.claude/CLAUDE.md` regular file → symlink to
  `AGENTS.md`.
- **Legacy cleanup (confirmed action):** the 3 completed designs were moved
  out of `docs/designs/completed/` into `.work/archive/` via `git mv`
  (history-preserving). `docs/designs/` is now empty.

### Files left in place

- All foundation docs in `docs/` (read-only).
- All other `docs/` content (`agile-workflow-guide.md`, `ux-ui-design-guide.md`,
  `workflow-guide.md`, `workflow-suite-evaluation.md`, `research/`).
- The 18 standalone skills under `.agents/skills/`.
- `tap.json` — untouched here (its removal is tracked as forward work; see
  Next steps).

## Conventions chosen

- **Release mapping:** `none` (shipping stays with `scripts/bump-version.sh`).
- **Tag taxonomy:** `refactor`, `perf` (load-bearing routing) + `skill`,
  `plugin`, `tooling`, `docs`.
- **Gates for release:** `tests → cruft → docs → patterns` (security dropped).
- **Slug convention:** kebab-case, parent-prefixed children.
- **Stage overrides:** none.

## Next steps

1. **Scope the substrate-tooling initiative** — `/agile-workflow:epicize` or
   `/agile-workflow:scope` to seed the epic: unify `work-view` + `work-board`
   behind one compiled binary (agent CLI + interactive human web board over one
   `.work/`), and fix `work-view --ready` to be stage-aware ("next actionable"
   across drafting/implementing/review, not just `stage:implementing`).
2. **Skilltap removal** — delete `tap.json` and strip skilltap references from
   `AGENTS.md` (migrated verbatim here) and the `docs/` guides, so the tree
   reconverges with what `docs/SPEC.md` asserts (two channels only).

Revert this bootstrap with `git revert HEAD` if anything looks wrong.
