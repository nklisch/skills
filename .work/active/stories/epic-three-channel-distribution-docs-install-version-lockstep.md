---
id: epic-three-channel-distribution-docs-install-version-lockstep
kind: story
stage: implementing
tags: [plugin, tooling]
parent: epic-three-channel-distribution-docs-install
depends_on: [epic-three-channel-distribution-docs-install-plugin-readmes]
release_binding: null
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

- [ ] `./scripts/bump-version.sh agile-workflow patch` runs after plugin changes
  are committed, or this story records a blocker if the script cannot run.
- [ ] `plugins/agile-workflow/.claude-plugin/plugin.json`,
  `plugins/agile-workflow/.codex-plugin/plugin.json`, and
  `plugins/agile-workflow/package.json` have the same version.
- [ ] `plugins/agile-workflow/work-view/crates/cli/.work-view-version` and
  `plugins/agile-workflow/scripts/work-view.sh --version` match that version.
- [ ] The story records the script warning that prebuilt work-view dist binaries
  must be rebuilt on the post-bump commit before publishing.

## Notes

- The bump script commits and pushes by design. If that external push is
  unavailable, leave this story in review or blocked with the exact failure
  recorded.
