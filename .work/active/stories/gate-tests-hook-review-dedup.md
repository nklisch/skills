---
id: gate-tests-hook-review-dedup
kind: story
stage: implementing
tags: [testing]
parent: null
depends_on: []
release_binding: 0.8.6
gate_origin: tests
created: 2026-05-31
updated: 2026-05-31
---

# Test the hook's review-dedup (no item in both Ready and Review)

## Priority
High

## Spec reference
Item: `epic-substrate-cli-next-actionable` (Unit 4).
Acceptance criterion: "With stage-aware `--ready`, the snapshot does not list a
`review` item in both `Ready` and `Review`."

## Gap type
Missing test for valid partition — Unit 4 changed `build_snapshot` in
`plugins/agile-workflow/hooks/scripts/prompt-context.py` (the dedup
`ready = [p for p in ready_raw if p not in review_paths]` at ~lines 355-361). There
is **no Python test anywhere** in the plugin. Now that `--ready` includes review
items, the double-listing regression is reachable; the item's own Risks section flags
"if Unit 4 is skipped, review items show twice," yet nothing guards a future
regression. Decision-table case: item in `--ready` ∧ stage==review → appears only in
Review.

## Suggested test
```python
# new: plugins/agile-workflow/hooks/scripts/test_prompt_context.py
def test_review_item_not_double_listed_in_ready_and_review(monkeypatch):
    # monkeypatch run_work_view so --ready -> [draft, impl, rev], --stage review -> [rev]
    # assert rev appears under "Review" and NOT under "Ready"
    ...
    assert rev not in ready_section
    assert rev in review_section
```

## Test location (suggested)
`plugins/agile-workflow/hooks/scripts/test_prompt_context.py` (new), wired into CI
alongside the install test.
