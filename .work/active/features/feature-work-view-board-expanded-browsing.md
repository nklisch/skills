---
id: feature-work-view-board-expanded-browsing
kind: feature
stage: done
tags: [tooling]
parent: null
depends_on: []
release_binding: null
gate_origin: null
created: 2026-06-01
updated: 2026-06-01
---

# Expanded board browsing surfaces

## Brief

The work-view board needs denser expandable browsing surfaces for larger
substrates. The left sidebar epic list should expand into a display that better
matches the existing board mocks and can show a larger set of epics without
feeling cramped. The tag display should also offer an expanded view so larger
tag sets can be browsed and scanned beyond the compact filter treatment.

## Source ideas

- `idea-expandable-epic-sidebar`
- `idea-expandable-tags-view`

## Scope record

- Promoted from backlog during batch scope for found board UI work.
- Size: medium feature; design should choose the board interaction surfaces and
  split sidebar/tag work into implementable stories.
- Dependencies: none.

## Design decisions

- **Epic browsing behavior**: add an explicit Epic filter backed by ancestor
  lookup rather than overloading the exact Parent filter — users expect an epic
  selection to include the epic and all visible descendants, not only direct
  children.
- **Expanded tag behavior**: keep tags in the global filter panel and add a
  local expand/collapse affordance for scanning large tag sets — this preserves
  existing filter semantics and avoids a new view.
- **Persistence**: persist selected filter values through the existing board
  store, but keep expand/collapse UI state in the current render only — the
  expansion is an ergonomic display state, not part of the substrate query.

## UI alignment

No mockup fallback is needed. This is a compact composition over the existing
board shell, filter chips, and sidebar panel rather than a net-new screen or
multi-screen flow.

## Architectural choice

Extend the existing filter panel in `filters.js` and `board.css`.

Other options considered:
- Add a new dedicated Tags or Epics view. That would make scanning possible,
  but it would split query controls away from the global filters that already
  affect Kanban, Dependency, and Table views.
- Reuse only the existing Parent and Tags groups with a taller scroll box. This
  is simple, but it does not solve epic-descendant focus and still makes large
  tag sets feel like a cramped chip pile.

The chosen approach keeps the board's global filtering model as the single
source of truth while adding denser browsing controls where users already look
for them.

## Implementation Units

### Unit 1: Expandable epic browser
**File**: `plugins/agile-workflow/work-view/crates/cli/src/board/assets/filters.js`
**File**: `plugins/agile-workflow/work-view/crates/cli/src/board/assets/state.js`
**File**: `plugins/agile-workflow/work-view/crates/cli/src/board/assets/board.css`
**Story**: `feature-work-view-board-expanded-browsing-epic-sidebar`

```javascript
// filters.js
const SET_FILTERS = new Set(["kinds", "stages", "parents", "tags", "epics"]);
export function epicIdForItem(item, itemsById) { /* walk parent chain to top-level epic */ }
export function deriveFilterOptions(snapshot) {
  return { /* existing options */, epics: ordered epic ids };
}
```

**Implementation Notes**:
- Add `epics` to filter normalization, serialization, and matching.
- `matchesFilters` should build or receive enough ancestry context to include
  the selected epic, its features, and descendant stories. Keep no-selection as
  pass-through.
- Render an Epic group in the sidebar with compact chips and a local
  expand/collapse button. The group must remain usable when many epics exist:
  stable max height, internal scroll, no sidebar layout shift.
- Keep the exact Parent filter available for direct-parent debugging.

**Acceptance Criteria**:
- [ ] Selecting an epic filter shows the epic and descendants across all board
  views.
- [ ] The Epic group has compact expandable presentation and stable dimensions.
- [ ] Existing kind/stage/parent/tag filter semantics remain unchanged.

---

### Unit 2: Expanded tag browser
**File**: `plugins/agile-workflow/work-view/crates/cli/src/board/assets/filters.js`
**File**: `plugins/agile-workflow/work-view/crates/cli/src/board/assets/board.css`
**Story**: `feature-work-view-board-expanded-browsing-tags`

```javascript
// filters.js
function expandableFilterGroup(title, child, options) { /* local expanded state */ }
```

**Implementation Notes**:
- Add a reusable expandable group helper for long option sets. Apply it to Tags
  and, if useful, Epic. Keep expansion state module-local and re-render through
  the existing filter UI sync path.
- In compact mode, cap tags to a scannable height. In expanded mode, use a
  denser grid/scroll surface sized to the sidebar, not a floating card or modal.
- Preserve tag AND semantics in `matchesFilters`.

**Acceptance Criteria**:
- [ ] Large tag sets can be expanded and scanned in the sidebar without
  distorting the appbar or board content.
- [ ] Tag chip selection still updates the existing `tags` filter set and keeps
  AND semantics.
- [ ] The expanded view is keyboard reachable through normal buttons.

## Implementation Order

1. `feature-work-view-board-expanded-browsing-epic-sidebar`
2. `feature-work-view-board-expanded-browsing-tags`

## Testing

- Add Rust asset-contract tests in
  `plugins/agile-workflow/work-view/crates/cli/tests/integration.rs` for the new
  shipped filter contracts and CSS constraints.
- If the board JS harness is available in the same run, add or update JS
  behavior tests for epic ancestor matching and tag expansion.
- Run `cargo test` in `plugins/agile-workflow/work-view`.

## Risks

- Epic filtering needs ancestor lookup, not exact parent matching. Guard against
  cycles and missing parents by stopping on repeated ids and falling back to no
  epic match.
- Sidebar expansion can make mobile layouts cramped. Keep responsive CSS that
  collapses the sidebar above the board as it does today.

## Implementation summary

- `feature-work-view-board-expanded-browsing-epic-sidebar`: added an
  ancestor-aware `epics` filter set, Epic sidebar group, state-store matching
  integration, and tests for descendant matching.
- `feature-work-view-board-expanded-browsing-tags`: added reusable expandable
  sidebar groups and applied them to Tags with dense scrollable expanded CSS.

## Verification

- `node --test plugins/agile-workflow/work-view/crates/cli/tests/board-js/*.test.mjs`
- `cargo test board_embedded_assets_return_expected_content_types --test integration`

## Review

- Verdict: Approve - cross-model feature review found no blockers or important
  issues.
- Reviewer: Claude Sonnet via peeragent (`--effort xhigh`).
- Notes: The review confirmed the ancestor-aware Epic filter includes the epic
  itself plus descendants, cycle guards avoid hangs, expandable sidebar controls
  are correctly separated by `expandKey`, CSS constraints are stable, and Rust
  plus Node tests cover the feature acceptance criteria.
