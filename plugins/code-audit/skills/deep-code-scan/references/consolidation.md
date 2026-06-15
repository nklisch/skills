# Consolidation

Turn reviewed findings into one coherent remediation plan. The deliverable is not a pile of loose
findings; it is a sequenced markdown plan a human or agent can implement later.

## Step 1: Collect And Dedupe

Gather every finding that survived the review gauntlet. Dedupe by `file:line` and root cause:
- Same location from two lanes: keep the higher-severity entry and note the other lane.
- Narrow finding subsumed by a wider module/system finding: keep the wider one and reference the
  narrow evidence.
- Repeated pattern across many files: keep one cluster with all locations.

## Step 2: Cluster

Group findings by the axis that gives the lowest-churn fix:
- **Fix locality**: a shared root cause becomes one cluster.
- **Component**: several findings in one module become one hardening pass.
- **Theme / pattern**: one anti-pattern repeated across files becomes one consistent remedy.
- **Standalone**: an isolated Critical remains its own item in the plan.

Low findings may stay advisory when actioning them would add noise.

## Step 3: Sequence

Order clusters so foundational work comes first. A shared abstraction, validation layer, or contract
change precedes local adoption work. Record dependencies as prose in the markdown plan, not as
tracker metadata.

## Step 4: Write `04-remediation-plan.md`

Use this shape:

```markdown
# Remediation Plan

## Summary

- Findings reviewed: <n>
- Recommended clusters: <m>
- Advisory-only findings: <k>

## Recommended sequence

1. **<cluster title>** - <why first>
2. **<cluster title>** - <why next>

## Clusters

### <cluster title>

- **Severity**: Critical | High | Medium | Low
- **Lanes**: <correctness/performance/security/etc.>
- **Fix locality**: local | module | cross-cutting
- **Depends on**: <cluster title or "none">
- **Findings resolved**:
  - `<file:line>` - <title>
- **Rationale**: <why these findings belong together>
- **Implementation direction**: <direction, not code>
- **Intent constraints**: <documented project choices that must be preserved>
- **Validation**: <tests/profiles/checks to run>

## Advisory findings

- `<file:line>` - <why advisory only>
```

## Step 5: Keep It Neutral

Do not turn clusters into tracker files. Do not write commits. Do not bind recommendations to a
workflow system. The markdown is the artifact.
