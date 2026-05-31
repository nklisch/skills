---
id: epic-substrate-cli-install-path
kind: feature
stage: drafting
tags: [tooling]
parent: epic-substrate-cli
depends_on: [epic-substrate-cli-adapter, epic-substrate-cli-next-actionable]
release_binding: null
gate_origin: null
created: 2026-05-30
updated: 2026-05-30
---

# Ship & install the compiled binary

## Brief

Get the finished binary into target projects. Implements the per-platform
build/distribution decided by the research feature (e.g. `bun build --compile
--target=...` outputs, or Rust cross-compiled artifacts) so the binary ships
through the Claude Code / Codex marketplaces, and updates `convert`'s install
step to place the right binary in a target project's `.work/bin/work-view`
instead of copying `work-view.sh`. Includes any bash fallback the research
feature decided to keep (e.g. ship `work-view.sh` as a fallback when no
prebuilt binary matches the platform).

Depends on a complete CLI (adapter + next-actionable) existing to package.
Does NOT decide the distribution strategy (that's the research feature) — it
implements it. This is also where `convert`'s Phase 4 ("copy work-view") and
`plugins/agile-workflow/docs/ARCHITECTURE.md`'s install description roll forward.

## Epic context
- Parent epic: `epic-substrate-cli`
- Position in epic: terminal feature — packages and distributes the built CLI;
  depends on `adapter` + `next-actionable`.

## Foundation references
- `docs/SPEC.md` — marketplace distribution + dual-manifest constraints the
  binary ships within.
- `plugins/agile-workflow/docs/ARCHITECTURE.md` — the `convert` install path and
  `.work/bin/work-view` placement this feature changes.
