---
id: feature-work-view-board-expanded-browsing-epic-sidebar
kind: story
stage: done
tags: [tooling]
parent: feature-work-view-board-expanded-browsing
depends_on: []
release_binding: 0.9.5
gate_origin: null
created: 2026-06-01
updated: 2026-06-01
---

# Add expandable epic browsing to the board sidebar

## Scope

Add a global Epic filter to the board sidebar. Selecting an epic should include
the epic and all descendants in the visible item set, while the existing Parent
filter continues to mean exact direct parent.

## Acceptance Criteria

- [ ] `filters.js` supports an `epics` filter set with normalization,
  serialization, options derivation, and matching.
- [ ] Epic matching walks item parent chains safely and includes descendants.
- [ ] The sidebar renders a compact expandable Epic group.
- [ ] Rust asset-contract tests cover the shipped Epic filter contract and CSS
  sizing constraints.

## Implementation notes

- Files changed:
  - `plugins/agile-workflow/work-view/crates/cli/src/board/assets/filters.js`
  - `plugins/agile-workflow/work-view/crates/cli/src/board/assets/state.js`
  - `plugins/agile-workflow/work-view/crates/cli/src/board/assets/board.css`
  - `plugins/agile-workflow/work-view/crates/cli/tests/integration.rs`
  - `plugins/agile-workflow/work-view/crates/cli/tests/board-js/expanded-browsing.test.mjs`
  - `plugins/agile-workflow/work-view/crates/cli/tests/board-js/harness.mjs`
- Tests added:
  - `epic filters match an epic and all descendants through parent chains`
  - Rust asset-contract assertions for shipped Epic filter code and expandable
    sidebar CSS.
- Discrepancies from design: implemented with the tag expansion story in one
  shared filter/sidebar change because both stories own the same rendering path.
- Adjacent issues parked: none.

## Verification

- `node --test plugins/agile-workflow/work-view/crates/cli/tests/board-js/*.test.mjs`
- `cargo test board_embedded_assets_return_expected_content_types --test integration`

## Review

- Verdict: Approve - story verified by implement; fast-lane advance.
- Notes: The ancestor-aware Epic filter and sidebar group are covered by Node
  behavior tests plus Rust asset-contract checks.
