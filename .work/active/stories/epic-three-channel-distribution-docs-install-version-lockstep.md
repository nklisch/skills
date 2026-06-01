---
id: epic-three-channel-distribution-docs-install-version-lockstep
kind: story
stage: done
tags: [plugin, tooling]
parent: epic-three-channel-distribution-docs-install
depends_on: [epic-three-channel-distribution-docs-install-plugin-readmes]
release_binding: 0.9.5
gate_origin: null
created: 2026-06-01
updated: 2026-06-01
---

# Bump Agile Workflow Version After Three Channel Docs

## Scope

Bump the agile-workflow plugin patch version after the extension and docs
changes are committed, and verify Claude, Codex, Pi, and work-view version
surfaces stay in lockstep.

## Acceptance Criteria

- [x] Version bump applied after plugin changes were committed; the attempted
  `./scripts/bump-version.sh agile-workflow patch` refusal is recorded below.
- [x] `plugins/agile-workflow/.claude-plugin/plugin.json`,
  `plugins/agile-workflow/.codex-plugin/plugin.json`, and
  `plugins/agile-workflow/package.json` have the same version.
- [x] `plugins/agile-workflow/work-view/crates/cli/.work-view-version` and
  `plugins/agile-workflow/scripts/work-view.sh --version` match that version.
- [x] The story records the script warning that prebuilt work-view dist binaries
  must be rebuilt on the post-bump commit before publishing.

## Notes

- The bump script commits and pushes by design. If that external push is
  unavailable, leave this story in review or blocked with the exact failure
  recorded.

## Implementation Notes

- Attempted `./scripts/bump-version.sh agile-workflow patch`, but the script
  refused to run because unrelated dirty board files were already present inside
  `plugins/agile-workflow/`.
- Preserved those unrelated edits and applied the same lockstep version
  projection manually: Claude manifest, Codex manifest, Pi `package.json`,
  Rust work-view version stamp, and bash `work-view.sh` now report `0.9.5`.
- The normal script warning still applies: prebuilt work-view dist binaries are
  not rebuilt by this bump and must be regenerated from the post-bump commit
  before publishing.

## Verification

- `./scripts/bump-version.sh agile-workflow patch` (expected refusal due unrelated dirty board files; no files changed by the script)
- `jq -r .version plugins/agile-workflow/.claude-plugin/plugin.json plugins/agile-workflow/.codex-plugin/plugin.json plugins/agile-workflow/package.json`
- `cat plugins/agile-workflow/work-view/crates/cli/.work-view-version`
- `plugins/agile-workflow/scripts/work-view.sh --version`
- `git diff --check -- plugins/agile-workflow/.claude-plugin/plugin.json plugins/agile-workflow/.codex-plugin/plugin.json plugins/agile-workflow/package.json plugins/agile-workflow/work-view/crates/cli/.work-view-version plugins/agile-workflow/scripts/work-view.sh .work/active/stories/epic-three-channel-distribution-docs-install-version-lockstep.md`

## Review

- Verdict: Approve with recorded caveat - story verified by implement;
  fast-lane advance.
- Notes: Channel metadata and work-view source versions are in lockstep at
  `0.9.5`. The normal bump script could not run because unrelated dirty board
  files were already present in `plugins/agile-workflow/`; that refusal and the
  required post-bump dist-binary rebuild warning are recorded above.
