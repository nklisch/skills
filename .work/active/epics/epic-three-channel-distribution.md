---
id: epic-three-channel-distribution
kind: epic
stage: review
tags: [plugin, tooling, docs]
parent: null
depends_on: []
release_binding: null
gate_origin: null
created: 2026-06-01
updated: 2026-06-01
---

# Three-channel distribution

## Brief

Make Pi a first-class distribution channel alongside Claude Code and OpenAI
Codex. Each supported plugin should ship to all three harnesses from the same
git tree, with `SKILL.md` remaining the shared source for portable workflow
knowledge and each harness adding native ergonomics through its own metadata and
runtime surfaces.

For Pi, this means package metadata in each supported plugin, shared skills
loaded directly by Pi, and Pi-native extensions or prompt templates where raw
skill loading is not enough. The flagship case is `agile-workflow`: Pi should
surface the `.work/` substrate natively through concise context injection,
`/aw` commands, queue/board tooling, and visible autopilot orchestration.

## Strategic decisions

- **Is Pi a compatibility target or an equal channel?** Equal channel. The repo
  distributes to Claude Code, Codex, and Pi with the same strategic weight.
- **Do we fork skills per harness?** No. `SKILL.md` remains portable procedural
  knowledge. Harness-specific ergonomics live in manifests, package metadata,
  extensions, prompts, hooks, commands, or UI surfaces.
- **How should agile-workflow autopilot delegate in Pi?** Prefer Pi-native
  subagents when an installed package exposes them, keep peeragent as the
  cross-model or cross-harness advisory/review lane, and retain a single-agent
  fallback.
- **Should Pi autopilot default conservative?** No. Pi should support confident
  full-drain ergonomics with visible queue state, child-agent status, interrupt
  paths, review bounce limits, and explicit stops for hard blockers or unsafe
  operations.

## Scope notes

- Add Pi package metadata for each supported plugin: `agile-workflow`,
  `ux-ui-design`, and `nates-toolkit`.
- Extend versioning and validation so Claude manifests, Codex manifests, and Pi
  package metadata stay in lockstep.
- Add Pi-native agile-workflow ergonomics: substrate detection, compact queue
  context, `/aw` commands, work-view/board integration, and a TUI/status surface
  where Pi supports it.
- Add optional Pi subagent integration for agile-workflow orchestration, with
  peeragent retained for cross-model advisory review and a single-agent fallback
  when no delegation adapter is available.
- Update install docs, guides, and plugin READMEs so all three channels are
  presented equally once package implementation lands.

## Research

- `docs/research/pi-package-format.md` captures the current Pi package,
  extension, skills, and subagent surfaces used to ground this epic.

## Decomposition

Split by capability rather than by harness layer. Pi package metadata is the
foundation because every other Pi-facing surface needs a loadable package root.
The agile-workflow extension and delegation policy can then proceed in parallel:
one adds native Pi runtime ergonomics, the other updates the skill guidance that
drives autonomous work. Documentation lands last so it describes implemented
behavior rather than planned behavior.

### Child features

- `epic-three-channel-distribution-package-metadata` — add Pi package metadata
  for supported plugins and extend version lockstep — depends on: `[]`
- `epic-three-channel-distribution-pi-agile-extension` — add the Pi-native
  agile-workflow extension around `.work/`, `/aw`, queue, and board ergonomics
  — depends on: `[epic-three-channel-distribution-package-metadata]`
- `epic-three-channel-distribution-delegation-policy` — update agile-workflow
  skills so Pi subagents are preferred when available, peeragent remains the
  cross-model lane, and single-agent remains the fallback — depends on:
  `[epic-three-channel-distribution-package-metadata]`
- `epic-three-channel-distribution-docs-install` — update install and usage docs
  for Claude Code, Codex, and Pi parity — depends on:
  `[epic-three-channel-distribution-package-metadata, epic-three-channel-distribution-pi-agile-extension, epic-three-channel-distribution-delegation-policy]`

### Decomposition risks

- Pi's extension and package APIs are fast-moving. Feature designs must verify
  the current official Pi docs before committing code shapes.
- The extension should stay thin; putting workflow policy in executable Pi code
  instead of shared skills would fork behavior across harnesses.
- `bump-version.sh` currently auto-commits and pushes. Any package-version
  lockstep changes need tests that exercise failure modes without triggering
  real pushes.

## Implementation Summary

- `epic-three-channel-distribution-package-metadata`: done. Added Pi package
  manifests for `agile-workflow`, `ux-ui-design`, and `nates-toolkit`, and
  extended version lockstep tooling/tests to include Pi package metadata.
- `epic-three-channel-distribution-delegation-policy`: done. Updated
  agile-workflow principles, autopilot, review, implementation, design, gate,
  and scout routing so Pi-native subagents are same-harness delegation adapters
  while peeragent remains the cross-model/cross-harness path.
- `epic-three-channel-distribution-pi-agile-extension`: done. Added the
  agile-workflow Pi extension manifest and `/aw` command surface for
  queue/status inspection plus board/autopilot/scope handoffs.
- `epic-three-channel-distribution-docs-install`: done. Updated public docs and
  plugin READMEs for Claude Code, OpenAI Codex, and Pi parity, removed stale
  workflow-sibling wording, and brought agile-workflow metadata/work-view source
  versions to `0.9.5`.

## Verification

- `bash plugins/agile-workflow/scripts/tests/bump-version.test.sh`
- `bun build plugins/agile-workflow/extensions/agile-workflow.ts --outfile /tmp/agile-workflow-pi-extension.js`
- `jq -r .version plugins/agile-workflow/.claude-plugin/plugin.json plugins/agile-workflow/.codex-plugin/plugin.json plugins/agile-workflow/package.json`
- `plugins/agile-workflow/scripts/work-view.sh --version`
- Cross-model feature reviews passed for package metadata, delegation policy,
  Pi extension, and docs/install after accepted findings were fixed or recorded.

## Notes

- `./scripts/bump-version.sh agile-workflow patch` could not run directly during
  the final version story because unrelated dirty work-view board files already
  existed inside `plugins/agile-workflow/`. The equivalent metadata/source
  version projection was applied manually and the reason is recorded in the
  version-lockstep story.
- Prebuilt work-view dist binaries still need to be rebuilt from the post-bump
  commit before publishing `agile-workflow` `0.9.5`.
