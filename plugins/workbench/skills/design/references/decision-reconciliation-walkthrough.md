# Decision Reconciliation Walkthrough

This is an instruction walkthrough, not an observed delivery result. It protects
the whole-item reconciliation rule against the routing-default inconsistency seen
in Voxlar commit `e601c73e` and later reconciled in `56586549`.

## Starting item

Use an item with equivalent content:

```markdown
## Status

Routing preference defaults remain undecided.

## Design

Exact rounding, overflow behavior, and initial routing weights remain to be
selected.

## Proposed decision

All five Road and Channel weights default to 50.

The route-label format is settled and remains unchanged.

## Remaining work

- Select rounding, overflow behavior, tie order, initial weights, and curve
  sampling.
- Select corridor and search-budget defaults.
- Select the still-unresolved preview palette.

## Verification

- Exercise custom routing preferences.
```

The user accepts the all-50 default. No other decision changes.

## Expected reconciliation

The edited item should be equivalent to:

```markdown
## Status

All five Road and Channel weights default to 50. Rounding, overflow behavior,
tie order, curve sampling, corridor defaults, search-budget defaults, and the
preview palette remain unresolved.

## Design

All five Road and Channel weights start at 50. Exact rounding and overflow
behavior remain to be selected.

## Settled decisions

- All five Road and Channel weights default to 50.
- The route-label format is settled and remains unchanged.

## Remaining work

- For the settled all-50 weight preset, select rounding, overflow behavior, tie
  order, and curve sampling.
- Select corridor and search-budget defaults.
- Select the still-unresolved preview palette.

## Verification

- Exercise the all-50 Road and Channel preset.
- Exercise custom routing preferences.

## Reference-only orientation

This reference-only summary records that early planning grouped the routing
defaults together. It does not govern current status or remaining work; use
Settled decisions and Remaining work above.
```

## Check

Read the result as an agent continuing the item and confirm:

1. The accepted all-50 decision is recorded.
2. No statement says weights are undecided, pending, or remain to be selected.
3. Rounding, overflow, tie order, and curve sampling remain unresolved.
4. Corridor and search-budget defaults remain unchanged.
5. Verification includes the all-50 preset case.
6. The unrelated settled route-label decision and unresolved preview-palette
   decision remain untouched.
7. The retained non-authoritative summary is explicitly reference-only, contains
   no mutable status, and points to authoritative current sections.

Exercise this walkthrough manually after changes to acceptance-edit guidance.
Compare the seven semantic outcomes rather than adding keyword-based validation.
