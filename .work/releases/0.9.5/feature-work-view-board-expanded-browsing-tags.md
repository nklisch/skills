---
id: feature-work-view-board-expanded-browsing-tags
kind: story
stage: done
tags: [tooling]
parent: feature-work-view-board-expanded-browsing
depends_on: [feature-work-view-board-expanded-browsing-epic-sidebar]
release_binding: 0.9.5
gate_origin: null
created: 2026-06-01
updated: 2026-06-01
---

# Add expanded tag browsing to the board sidebar

## Scope

Add an expanded tag browsing mode to the global filter sidebar so large tag sets
can be scanned and selected without losing the compact default layout.

## Acceptance Criteria

- [ ] Tags use the existing `tags` filter set and preserve AND semantics.
- [ ] The tag group exposes a keyboard-reachable expand/collapse button.
- [ ] Compact and expanded tag layouts have stable CSS constraints and do not
  resize board content incoherently.
- [ ] Asset-contract tests cover the shipped tag expansion controls and CSS.

## Implementation notes

- Files changed:
  - `plugins/agile-workflow/work-view/crates/cli/src/board/assets/filters.js`
  - `plugins/agile-workflow/work-view/crates/cli/src/board/assets/board.css`
  - `plugins/agile-workflow/work-view/crates/cli/tests/integration.rs`
  - `plugins/agile-workflow/work-view/crates/cli/tests/board-js/expanded-browsing.test.mjs`
  - `plugins/agile-workflow/work-view/crates/cli/tests/board-js/harness.mjs`
- Tests added:
  - `tag and epic groups expand in the sidebar without changing filter semantics`
  - Rust asset-contract assertions for the expandable Tags group and dense
    scrollable expanded CSS.
- Discrepancies from design: implemented with the Epic sidebar story in one
  shared filter/sidebar change because both stories own the same rendering path.
- Adjacent issues parked: none.

## Verification

- `node --test plugins/agile-workflow/work-view/crates/cli/tests/board-js/*.test.mjs`
- `cargo test board_embedded_assets_return_expected_content_types --test integration`

## Review

- Verdict: Approve - story verified by implement; fast-lane advance.
- Notes: The expandable Tag sidebar behavior is covered by Node behavior tests
  plus Rust asset-contract checks.
