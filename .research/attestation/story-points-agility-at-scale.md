---
source_handle: story-points-agility-at-scale
fetched: 2026-06-15
source_url: https://agility-at-scale.com/principles/agile-planning-story-points/
provenance: source-direct
source_class: blog-post
---

# Agile Planning, Estimation, and the Story Points Illusion (Agility at Scale)

## Summary

A critique of how story points, originally designed as a psychological safety mechanism to decouple estimates from time commitments, become dysfunctional when organizations treat velocity as a performance target or attempt to normalize points across teams.

## Key passages

**Original purpose:** Story points emerged as "a psychological safety mechanism to decouple estimates from time-based commitments" — a relative unit meant to support collaborative planning, not cross-team comparison.

**The illusion mechanism:** "When story points = days, managers often just multiply to get timelines," resurrecting waterfall-style date commitments. This happens when organizations impose "normalized story points" across teams, attempting to create a universal currency.

**Goodhart's Law activation:** "When a measure becomes a target, it ceases to be a good measure." Once teams realize points equal productivity measures, velocity gaming begins: teams inflate estimates to build safety buffers, split stories to optimize for points rather than value, and cut quality corners to hit velocity targets. Management reciprocates by secretly converting points back to hours.

**Prioritization suitability:** The article provides no support for using story points in automated queue ordering. It argues story points are "fundamentally team-specific and context-dependent." Using them as machine-readable priority signals would "amplify the very dysfunctions described — treating relative estimates as absolute, comparable metrics."

**Recommended alternative:** Throughput (stories completed per unit time) and direct value measures are more reliable forecasting tools than point values.

**Ron Jeffries position (cited through):** The article attributes to Jeffries: "I may have invented story points, and if I did, I'm sorry now," and that he "no longer recommend[s] velocity, which means that I also no longer recommend story estimation in points."

## Structural notes

- The velocity-gaming dynamic is a second-order anti-pattern: the score becomes gameable precisely because it becomes the target.
- Normalizing story points across teams (to make them machine-comparable) directly produces the Goodhart's Law failure mode.
- The article's core argument: story points as a signal are meaningful inside the social context that produced them; extracted from that context, they degrade.
