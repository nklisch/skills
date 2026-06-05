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


## Shipped items

Bodies live in git history — read with `git show <git ref>:<path>`.

| id | title | kind | git ref |
|----|-------|------|---------|
| epic-three-channel-distribution-delegation-policy-core | Add Pi Delegation Core Policy | story | d9233ac |
| epic-three-channel-distribution-delegation-policy-implementation-routing | Add Pi Worker Routing To Implementation Skills | story | d9233ac |
| epic-three-channel-distribution-delegation-policy-skill-sweep | Sweep Design Gate And Scout Runtime Routing | story | d9233ac |
| epic-three-channel-distribution-delegation-policy | Pi Delegation And Subagent Policy | feature | d9233ac |
| epic-three-channel-distribution-docs-install-plugin-readmes | Update Plugin READMEs For Three Channels | story | d9233ac |
| epic-three-channel-distribution-docs-install-root-guides | Update Root README And Public Guides | story | d9233ac |
| epic-three-channel-distribution-docs-install-version-lockstep | Bump Agile Workflow Version After Three Channel Docs | story | d9233ac |
| epic-three-channel-distribution-docs-install | Three-Channel Installation And Usage Docs | feature | d9233ac |
| epic-three-channel-distribution-package-metadata-pi-manifests | Add Pi Package Manifests | story | d9233ac |
| epic-three-channel-distribution-package-metadata-version-lockstep | Extend Version Lockstep To Pi Packages | story | d9233ac |
| epic-three-channel-distribution-package-metadata | Pi Package Metadata And Version Lockstep | feature | d9233ac |
| epic-three-channel-distribution-pi-agile-extension-manifest-shell | Add Pi Extension Manifest And Command Shell | story | d9233ac |
| epic-three-channel-distribution-pi-agile-extension-queue-commands | Add Pi Queue Snapshot Commands | story | d9233ac |
| epic-three-channel-distribution-pi-agile-extension-workflow-shortcuts | Add Pi Workflow Shortcut Handoffs | story | d9233ac |
| epic-three-channel-distribution-pi-agile-extension | Agile Workflow Pi Extension | feature | d9233ac |
| epic-three-channel-distribution | Three-channel distribution | epic | d9233ac |
| feature-work-view-board-expanded-browsing-epic-sidebar | Add expandable epic browsing to the board sidebar | story | d9233ac |
| feature-work-view-board-expanded-browsing-tags | Add expanded tag browsing to the board sidebar | story | d9233ac |
| feature-work-view-board-expanded-browsing | Expanded board browsing surfaces | feature | d9233ac |
| gate-cruft-board-js-cleanup-module-graph | Remove unused board JS harness cleanup helper | story | d9233ac |
| gate-docs-agile-workflow-spec-version-example | Refresh agile-workflow SPEC manifest example | story | d9233ac |
| gate-docs-agile-workflow-vision-current-state | Refresh agile-workflow VISION success state | story | d9233ac |
| gate-docs-board-pattern-line-refs | Refresh board pattern line references | story | d9233ac |
| gate-docs-changelog-0-9-5 | Add changelog entry for 0.9.5 | story | d9233ac |
| gate-docs-public-guide-none-mapping | Document none release mapping in public guide | story | d9233ac |
| gate-docs-release-deploy-none-mapping | Update release-deploy skill for none mapping | story | d9233ac |
| gate-patterns-0.9.5 | Patterns extracted for 0.9.5 | story | d9233ac |
| gate-tests-board-js-harness-dependency-table | Add dependency and table board JS behavior tests | story | d9233ac |
| gate-tests-board-js-harness-kanban-detail | Add kanban and detail board JS behavior tests | story | d9233ac |
| gate-tests-board-js-harness-markdown-filter | Add markdown and filter board JS behavior tests | story | d9233ac |
| gate-tests-board-js-harness-runner | Add board JS behavioral test runner | story | d9233ac |
| gate-tests-board-js-harness | Board-asset behavioral JS test harness + view suites | feature | d9233ac |
| gate-tests-filtered-dependency-stubs | Cover filtered dependency stubs in board JS tests | story | d9233ac |
| gate-tests-hook-concurrency-interleave | Truly-concurrent interleave test for hook state-file (epoch-bump not clobbered) | story | d9233ac |
| gate-tests-pi-extension-handoffs | Add Pi extension workflow handoff tests | story | d9233ac |
| gate-tests-pi-extension-queue-wrappers | Add Pi extension queue command tests | story | d9233ac |
| gate-tests-pi-extension-substrate-errors | Add Pi extension substrate and error behavior tests | story | d9233ac |
| gate-tests-pi-package-metadata | Add Pi package metadata coverage | story | d9233ac |
| gate-tests-tag-expand-keyboard | Cover tag expand keyboard reachability | story | d9233ac |
| gate-tests-work-view-dist-version-refresh | Refresh work-view dist binaries for 0.9.5 | story | d9233ac |
| story-audit-codex-postcompact-hook-output | Audit Codex PostCompact hook output contract | story | d9233ac |
| story-dependency-canvas-ephemeral-dragging | Add ephemeral dragging to dependency canvas nodes | story | d9233ac |
| story-dependency-canvas-layout-buttons | Add dependency canvas layout buttons | story | d9233ac |
| story-dependency-canvas-tool-icons-impact-layout | Clarify dependency canvas tools and add Impact layout | story | d9233ac |
| story-dependency-canvas-zoom-pan-tools | Add zoom and hand pan tools to dependency canvas | story | d9233ac |
| story-dependency-impact-edge-legend-clarity | Clarify dependency impact counts and edge colors | story | d9233ac |
| story-dependency-web-layout-compact-nodes | Add compact Web layout nodes for dependency canvas | story | d9233ac |
| story-fix-dependency-canvas-resize-edges | Fix dependency canvas edge drift on resize | story | d9233ac |
| story-fix-dependency-hand-node-open | Keep dependency node detail opening available in Hand mode | story | d9233ac |
| story-fix-dependency-node-click-jitter-swallow | Prevent small mouse movement from swallowing dependency node clicks | story | d9233ac |
| story-fix-work-view-board-null-sentinel-import | Fix work-view board module import failure | story | d9233ac |
| story-fix-work-view-dependency-canvas-clipping | Fix dependency canvas clipping in work-view board | story | d9233ac |
