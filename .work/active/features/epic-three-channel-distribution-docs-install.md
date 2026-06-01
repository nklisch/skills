---
id: epic-three-channel-distribution-docs-install
kind: feature
stage: done
tags: [docs, plugin]
parent: epic-three-channel-distribution
depends_on: [epic-three-channel-distribution-package-metadata, epic-three-channel-distribution-pi-agile-extension, epic-three-channel-distribution-delegation-policy]
release_binding: 0.9.5
gate_origin: null
created: 2026-06-01
updated: 2026-06-01
---

# Three-Channel Installation And Usage Docs

## Brief

Update the user-facing documentation so Claude Code, OpenAI Codex, and Pi are
presented as equal distribution channels. The docs should show concrete install
paths, explain what is shared across harnesses, call out which native surfaces
exist only in a given harness, and describe Pi's security implications for
packages and extensions.

This feature should land after the package metadata, Pi extension, and
delegation policy features so the docs describe actual behavior rather than an
anticipated surface. It covers the root README, plugin READMEs, guides, and any
foundation-doc cleanup revealed by the implementation.

## Epic context

- Parent epic: `epic-three-channel-distribution`
- Position in epic: final consumer feature. It depends on the runtime and policy
  shape so installation and usage docs match shipped behavior.

## Foundation references

- `README.md` — top-level install and catalog overview
- `docs/agile-workflow-guide.md` — flagship usage guide
- `docs/ux-ui-design-guide.md` — mockup-first UI design guide
- Plugin READMEs under `plugins/*/README.md`

## Codebase Context

- The root README already names Claude Code, Codex, and Pi, but its install
  block is still Claude-only.
- `docs/agile-workflow-guide.md` and `docs/ux-ui-design-guide.md` still show
  Claude-first quick starts and need channel-aware installation notes.
- `plugins/agile-workflow/README.md` still describes `workflow` as a supported
  sibling even though project policy says it is deprecated and should not be
  presented as a new-work option.
- `plugins/ux-ui-design/README.md` has Claude and Codex install sections but no
  Pi package install section.
- `plugins/nates-toolkit/` has channel metadata but no plugin README; adding one
  gives the third supported plugin a matching install surface.
- The Pi extension feature added `plugins/agile-workflow/extensions/agile-workflow.ts`;
  docs should mention `/aw` as a Pi-native convenience layer around the same
  `.work/` substrate.

## Design Decisions

- **Equal channel docs**: Present Claude Code, Codex, and Pi as first-class
  install channels. Keep shared skill behavior described once; put
  harness-specific ergonomics in channel notes.
- **Pi install wording**: Show npm package installs as the published path and
  local `pi install -l ./plugins/<name>` installs as the development path,
  because Pi package docs support npm and local paths and this repo contains the
  package roots.
- **Security wording**: Call out that Pi packages can load executable
  extensions, especially for `agile-workflow`; installing from trusted sources
  matters.
- **Version bump timing**: Run the agile-workflow patch bump after the docs land
  so the prior peer-review version-bump finding covers the full plugin change
  set, including extension and documentation updates.

## Implementation Units

### Unit 1: Root README and public guides

**Files**:
- `README.md`
- `docs/agile-workflow-guide.md`
- `docs/ux-ui-design-guide.md`

**Story**:
`epic-three-channel-distribution-docs-install-root-guides`

Update the top-level user docs so installation and quick-start flows show
Claude Code, Codex, and Pi paths side by side. For `agile-workflow`, include
the Pi `/aw` convenience command and the distinction between shared skills and
native Pi extension behavior.

**Acceptance Criteria**:
- [x] Root README install section includes Claude Code, Codex, and Pi.
- [x] Agile-workflow guide quick starts include a three-channel install block
  and mention `/aw status`, `/aw ready`, and `/aw autopilot` as Pi conveniences.
- [x] UX/UI guide install section includes Pi package installs while keeping the
  mockup-first workflow unchanged.
- [x] Docs distinguish shared SKILL.md behavior from harness-native extension
  surfaces.

### Unit 2: Plugin READMEs and foundation cleanup

**Files**:
- `plugins/agile-workflow/README.md`
- `plugins/ux-ui-design/README.md`
- `plugins/nates-toolkit/README.md`
- `plugins/agile-workflow/docs/VISION.md`

**Story**:
`epic-three-channel-distribution-docs-install-plugin-readmes`

Update plugin-local READMEs so each supported plugin advertises equal
Claude/Codex/Pi distribution. Clean up stale workflow-sibling language in
agile-workflow docs so new work points at agile-workflow and migration points at
`/agile-workflow:convert`.

**Acceptance Criteria**:
- [x] `plugins/agile-workflow/README.md` shows Claude, Codex, and Pi installs,
  mentions the Pi `/aw` command surface, and no longer recommends `workflow` for
  new projects.
- [x] `plugins/ux-ui-design/README.md` includes a Pi install path and notes that
  Pi consumes the same shared skills.
- [x] `plugins/nates-toolkit/README.md` exists and includes all three install
  channels.
- [x] `plugins/agile-workflow/docs/VISION.md` no longer says the deprecated
  `workflow` plugin remains a supported new-work sibling.

### Unit 3: Version bump and channel verification

**Files**:
- `plugins/agile-workflow/.claude-plugin/plugin.json`
- `plugins/agile-workflow/.codex-plugin/plugin.json`
- `plugins/agile-workflow/package.json`
- `plugins/agile-workflow/work-view/crates/cli/.work-view-version`
- `plugins/agile-workflow/scripts/work-view.sh`

**Story**:
`epic-three-channel-distribution-docs-install-version-lockstep`

After the docs stories land, bump the agile-workflow plugin patch version and
verify all three channel metadata files stay in lockstep. This addresses the
Pi-extension feature review finding that the new distributable extension needs
a version bump before shipping.

- [x] `./scripts/bump-version.sh agile-workflow patch` runs after plugin docs
  and extension changes are committed, or the story records a hard blocker if
  push/version automation cannot run in this environment.
- [x] Claude, Codex, and Pi package metadata report the same agile-workflow
  version.
- [x] `work-view` source version stamp and bash fallback version match the
  plugin metadata.
- [x] The story records the follow-up warning that prebuilt work-view dist
  binaries must be rebuilt on the post-bump commit before publishing.

## Implementation Order

1. `epic-three-channel-distribution-docs-install-root-guides`
2. `epic-three-channel-distribution-docs-install-plugin-readmes`
3. `epic-three-channel-distribution-docs-install-version-lockstep`

## Verification Plan

- `rg -n "Claude Code|Codex|Pi|pi install|/aw" README.md docs plugins/agile-workflow/README.md plugins/ux-ui-design/README.md plugins/nates-toolkit/README.md`
- `jq -r .version plugins/agile-workflow/.claude-plugin/plugin.json plugins/agile-workflow/.codex-plugin/plugin.json plugins/agile-workflow/package.json`
- `plugins/agile-workflow/scripts/work-view.sh --version`
- `cat plugins/agile-workflow/work-view/crates/cli/.work-view-version`

## Implementation Summary

- `epic-three-channel-distribution-docs-install-root-guides`: done. Root README
  and public guides now show Claude Code, Codex, and Pi install paths and Pi
  `/aw` conveniences.
- `epic-three-channel-distribution-docs-install-plugin-readmes`: done. Plugin
  READMEs now cover all three channels, and agile-workflow docs describe
  deprecated `workflow` only as a migration source.
- `epic-three-channel-distribution-docs-install-version-lockstep`: done with
  caveat. Agile-workflow metadata and work-view source versions are in lockstep
  at `0.9.5`. The bump script refused because unrelated dirty board files were
  already present under `plugins/agile-workflow/`, so the version projection was
  applied manually and the dist-binary rebuild warning was recorded.

## Verification

- `rg -n "Claude Code|OpenAI Codex|Pi|pi install|/aw" README.md docs/agile-workflow-guide.md docs/ux-ui-design-guide.md plugins/agile-workflow/README.md plugins/ux-ui-design/README.md plugins/nates-toolkit/README.md`
- `jq -r .version plugins/agile-workflow/.claude-plugin/plugin.json plugins/agile-workflow/.codex-plugin/plugin.json plugins/agile-workflow/package.json`
- `plugins/agile-workflow/scripts/work-view.sh --version`
- `cat plugins/agile-workflow/work-view/crates/cli/.work-view-version`

## Review

- Verdict: Approve after fixes - cross-model feature review found one blocker
  and one important issue, both resolved in `370ef60 review-fix: docs install
  peer findings`.
- Reviewer: Claude Sonnet via peeragent (`--effort high`).
- Fixed findings:
  - Replaced the invalid Claude Code install command in
    `plugins/ux-ui-design/README.md` with the marketplace-add/install pattern
    used elsewhere.
  - Removed stale "Sibling to workflow" wording from agile-workflow Claude and
    Codex marketplace metadata.
- Notes: Version metadata remains in lockstep at `0.9.5`. The recorded caveat
  about rebuilding prebuilt work-view dist binaries before publishing still
  applies.
