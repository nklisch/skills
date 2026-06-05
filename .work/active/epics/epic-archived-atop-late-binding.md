---
id: epic-archived-atop-late-binding
kind: epic
stage: drafting
tags: [skill, tooling, docs]
parent: null
depends_on: []
release_binding: null
gate_origin: null
created: 2026-06-05
updated: 2026-06-05
---

# Merge `archived_atop` late-binding into bodyless-stub delete-refs

## Why

v0.11 shipped delete-refs (archive = bodyless stub, release = one summary, bodies in git). A
downstream consumer (Silas) had independently built a *richer* archival model that delete-refs
collides with: items archive at `done` decoupled from release, carrying an immutable
`archived_atop: <release | pre-release>` baseline, and release-deploy **late-binds by querying
`archived_atop`** to pull archived work into a release. delete-refs' `release_binding`-only model
can't express "the release a stub was done *on top of*", and its one-summary collapse conflicts with
the consumer's described per-item release semantics.

Rather than downgrade the consumer to the simpler model, **merge the two into one**: keep the
plugin's bodyless-stub good part (frontmatter-only, poison-free, lean) and adopt the consumer's
`archived_atop` good part (rich, immutable late-binding baseline). Strict superset.

## The merged model (one theory)

1. **Archive (review).** A `done` item with no `release_binding` → **bodyless stub** at
   `.work/archive/<id>.md` = frontmatter + `# Title` only. Frontmatter carries:
   - `archived_atop: <release | pre-release>` — latest released tag at archival (or `pre-release`
     before the first release); stamped once, immutable.
   - `release_binding: null` — until a release claims it.
   - `git_ref: <sha>` — commit where the body lives (`git show <git_ref>:<path>` recovers it).
   Body pruned to git. Archiving stays decoupled from release binding.
2. **Late-bind (release-deploy).** A release queries `archived_atop` to gather the stubs it claims
   (everything atop the prior shipped tag; `pre-release` for the first release), sets their
   `release_binding`. **Already-done archived items are NOT re-gated** — they passed gates when
   active; the release records them. Active done items still bind via `release_binding`.
3. **Release = one summary.** All bound items (active done + archived stubs) collapse into one
   `releases/<version>/release-<version>.md` table — id, title, kind, `archived_atop`, `git_ref`.
   No per-item placement; bodies stay in git.

## Surfaces

- `review` — stamp `archived_atop` + `git_ref` on the bodyless stub (extends v0.11 archive-stub).
- `release-deploy` — `archived_atop` late-binding query; no-re-gate-of-done; summary gains an
  `archived_atop` column.
- `convert` + `docs/SPEC.md` — fold "terminal retention" + the consumer's "Done-item archival" into
  ONE merged convention; seed on bootstrap, offer on sync.

## Child features (riskiest first)

- **feature-archived-atop-late-binding-stub-stamp** *(riskiest — design first)* — review stamps
  `archived_atop` + `git_ref` on the bodyless stub; SPEC stub shape gains both fields. Defines the
  `archived_atop` computation (latest released tag vs `pre-release`).
- **feature-archived-atop-late-binding-release** — release-deploy late-binds via `archived_atop`,
  no-re-gate-of-done, summary `archived_atop` column. depends_on stub-stamp.
- **feature-archived-atop-late-binding-convention** — merged convention in SPEC + convert
  (interview/seed + sync offer-to-prune). depends_on stub-stamp, release.

## Downstream (separate, after this ships)

Silas adoption — tracked by Silas backlog `agent-reflection-prune-terminal-work-items`: update Silas
CONVENTIONS `Done-item archival` to the merged model, move its custom in-marker rules (testkit,
date-metadata) to user rule files, prune its 1031 archive bodies → stubs preserving `archived_atop`
+ adding `git_ref`, then a clean convert sync. Blocked until this epic ships.
