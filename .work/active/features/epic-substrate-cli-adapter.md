---
id: epic-substrate-cli-adapter
kind: feature
stage: drafting
tags: [tooling]
parent: epic-substrate-cli
depends_on: [epic-substrate-cli-query-core]
release_binding: null
gate_origin: null
created: 2026-05-30
updated: 2026-05-30
---

# Agent-facing CLI surface (work-view parity)

## Brief

The agent-ergonomic command surface over the query core: terse, parseable,
scriptable. Reaches parity with today's `work-view.sh` — filter flags
(`--stage`, `--tag` repeatable-AND, `--kind`, `--parent`, `--release`, `--gate`,
`--blocking`), output modes (`--paths`, `--cat`, `--count`, default table),
`--help`, and the established exit codes (0 ok / 1 / 2 no-substrate / 3). Owns
the CLI entrypoint and arg-parsing scaffold.

Does NOT include the stage-aware `--ready`/`--blocked` semantic — that's
`epic-substrate-cli-next-actionable`, which plugs its flags into this scaffold.
Does NOT include packaging/installation (`epic-substrate-cli-install-path`).
Output must stay machine-friendly: the design/implement/review/autopilot skills
parse this.

## Epic context
- Parent epic: `epic-substrate-cli`
- Position in epic: the agent surface over the core; parallel with
  `next-actionable` (both depend only on the core). Owns the CLI entrypoint, so
  `next-actionable` builds its flags on this scaffold (see the epic's
  decomposition risks).

## Foundation references
- `docs/ARCHITECTURE.md` — agent-surface half of the substrate-access model.
- `plugins/agile-workflow/docs/SPEC.md` — the `work-view` flag set, output
  contract, and exit codes this must preserve.
