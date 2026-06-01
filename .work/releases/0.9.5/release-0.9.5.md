---
id: release-0.9.5
kind: release
stage: released
tags: []
parent: null
depends_on: []
release_binding: 0.9.5
gate_origin: null
created: 2026-06-01
updated: 2026-06-01
---

# Release 0.9.5

## Bound items

Bound 2026-06-01. This release packages the completed three-channel
distribution work, dependency-board polish and fixes, deferred board JS test
harness coverage, hook concurrency regression coverage, expanded board browsing,
and the Codex PostCompact hook audit.

37 items (1 epic, 6 features, 30 stories).

### Three-channel distribution

- `epic-three-channel-distribution` (epic) — Three-channel distribution
- `epic-three-channel-distribution-delegation-policy` (feature) — Pi Delegation And Subagent Policy
  - `epic-three-channel-distribution-delegation-policy-core` (story) — Add Pi Delegation Core Policy
  - `epic-three-channel-distribution-delegation-policy-implementation-routing` (story) — Add Pi Worker Routing To Implementation Skills
  - `epic-three-channel-distribution-delegation-policy-skill-sweep` (story) — Sweep Design Gate And Scout Runtime Routing
- `epic-three-channel-distribution-docs-install` (feature) — Three-Channel Installation And Usage Docs
  - `epic-three-channel-distribution-docs-install-plugin-readmes` (story) — Update Plugin READMEs For Three Channels
  - `epic-three-channel-distribution-docs-install-root-guides` (story) — Update Root README And Public Guides
  - `epic-three-channel-distribution-docs-install-version-lockstep` (story) — Bump Agile Workflow Version After Three Channel Docs
- `epic-three-channel-distribution-package-metadata` (feature) — Pi Package Metadata And Version Lockstep
  - `epic-three-channel-distribution-package-metadata-pi-manifests` (story) — Add Pi Package Manifests
  - `epic-three-channel-distribution-package-metadata-version-lockstep` (story) — Extend Version Lockstep To Pi Packages
- `epic-three-channel-distribution-pi-agile-extension` (feature) — Agile Workflow Pi Extension
  - `epic-three-channel-distribution-pi-agile-extension-manifest-shell` (story) — Add Pi Extension Manifest And Command Shell
  - `epic-three-channel-distribution-pi-agile-extension-queue-commands` (story) — Add Pi Queue Snapshot Commands
  - `epic-three-channel-distribution-pi-agile-extension-workflow-shortcuts` (story) — Add Pi Workflow Shortcut Handoffs

### Board browsing and dependency canvas

- `feature-work-view-board-expanded-browsing` (feature) — Expanded board browsing surfaces
  - `feature-work-view-board-expanded-browsing-epic-sidebar` (story) — Add expandable epic browsing to the board sidebar
  - `feature-work-view-board-expanded-browsing-tags` (story) — Add expanded tag browsing to the board sidebar
- `story-dependency-canvas-ephemeral-dragging` (story) — Add ephemeral dragging to dependency canvas nodes
- `story-dependency-canvas-layout-buttons` (story) — Add dependency canvas layout buttons
- `story-dependency-canvas-tool-icons-impact-layout` (story) — Clarify dependency canvas tools and add Impact layout
- `story-dependency-canvas-zoom-pan-tools` (story) — Add zoom and hand pan tools to dependency canvas
- `story-dependency-impact-edge-legend-clarity` (story) — Clarify dependency impact counts and edge colors
- `story-dependency-web-layout-compact-nodes` (story) — Add compact Web layout nodes for dependency canvas
- `story-fix-dependency-canvas-resize-edges` (story) — Fix dependency canvas edge drift on resize
- `story-fix-dependency-hand-node-open` (story) — Keep dependency node detail opening available in Hand mode
- `story-fix-dependency-node-click-jitter-swallow` (story) — Prevent small mouse movement from swallowing dependency node clicks
- `story-fix-work-view-board-null-sentinel-import` (story) — Fix work-view board module import failure
- `story-fix-work-view-dependency-canvas-clipping` (story) — Fix dependency canvas clipping in work-view board

### Gate follow-ups and audits

- `gate-tests-board-js-harness` (feature) — Board-asset behavioral JS test harness + view suites
  - `gate-tests-board-js-harness-runner` (story) — Add board JS behavioral test runner
  - `gate-tests-board-js-harness-markdown-filter` (story) — Add markdown and filter board JS behavior tests
  - `gate-tests-board-js-harness-dependency-table` (story) — Add dependency and table board JS behavior tests
  - `gate-tests-board-js-harness-kanban-detail` (story) — Add kanban and detail board JS behavior tests
- `gate-tests-hook-concurrency-interleave` (story) — Truly-concurrent interleave test for hook state-file
- `story-audit-codex-postcompact-hook-output` (story) — Audit Codex PostCompact hook output contract

## Gate runs

Gate order (CONVENTIONS.md): tests -> cruft -> docs -> patterns. Each gate
produces items, not pass/fail. Findings recorded below as gates run.

- **gate-tests** (2026-06-01) — 7 findings (6 critical, 0 high, 1 medium, 0 low).
  Six came from the release test-quality audit and one was reproduced locally by
  the dist-version guard. All were bound and drained:
  - `gate-tests-pi-package-metadata` — real Pi package manifest metadata coverage
  - `gate-tests-pi-extension-substrate-errors` — `/aw` substrate discovery/error tests
  - `gate-tests-pi-extension-queue-wrappers` — `/aw` status/parent/blocking/truncation tests
  - `gate-tests-pi-extension-handoffs` — board/autopilot/scope handoff tests
  - `gate-tests-filtered-dependency-stubs` — filtered dependency stub JS coverage
  - `gate-tests-tag-expand-keyboard` — keyboard reachability for tag expansion
  - `gate-tests-work-view-dist-version-refresh` — generated `work-view` dist binaries refreshed by GitHub Actions run `26743675062`
- **gate-cruft** (2026-06-01) — 1 high-confidence finding, drained:
  - `gate-cruft-board-js-cleanup-module-graph` — removed unused board JS harness cleanup helper
- **gate-docs** (2026-06-01) — 7 findings. Six produced docs items and were
  drained; the generated-binary finding was consolidated into
  `gate-tests-work-view-dist-version-refresh` because it required the same
  CI artifact refresh:
  - `gate-docs-changelog-0-9-5`
  - `gate-docs-agile-workflow-spec-version-example`
  - `gate-docs-agile-workflow-vision-current-state`
  - `gate-docs-release-deploy-none-mapping`
  - `gate-docs-public-guide-none-mapping`
  - `gate-docs-board-pattern-line-refs`
- **gate-patterns** (2026-06-01) — 3 new patterns, 0 inconsistencies. Tracking
  item `gate-patterns-0.9.5` is done:
  - `no-build-board-asset-test-harness`
  - `view-local-control-state-full-remount`
  - `pending-focus-restore-after-remount`

## Ship summary

- **Shipped**: 2026-06-01
- **Mapping**: `none` (per CONVENTIONS.md) — release-deploy ran gates and
  archived bound items; publishing/version bumping remains external to
  release-deploy. No tag/branch shipping was performed by release-deploy.
- **Items shipped**: 52 (1 epic, 6 features, 45 stories — including 15
  gate-produced stories).
- **Gate finding totals**: gate-tests 7 (all drained), gate-cruft 1 (drained),
  gate-docs 7 (6 docs items drained + 1 generated-binary finding consolidated
  with gate-tests), gate-patterns 3 new patterns (0 inconsistencies).
- **Verification**: local shell, Bun, Node, Python, and Rust test suites passed;
  GitHub Actions run `26743675062` built and committed the refreshed 0.9.5
  prebuilt `work-view` binaries.
