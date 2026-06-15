---
source_handle: moscow-dsdm-agile-business
fetched: 2026-06-15
source_url: https://www.agilebusiness.org/dsdm-project-framework/moscow-prioritisation.html
provenance: source-direct
source_class: tool-doc
author: Agile Business Consortium (DSDM)
---

# MoSCoW Prioritisation – DSDM Project Framework Handbook (Agile Business Consortium)

## Summary

The canonical DSDM framework definition of MoSCoW, including the four categories, recommended effort allocations, and the three-tier hierarchy (project, increment, timebox) at which MoSCoW classifications apply.

## Key passages

**Category definitions:**
- **Must Have:** "Minimum Usable SubseT (MUST) of requirements which the project guarantees to deliver." Binary test: "Would you cancel the project if this isn't delivered?" If yes, it is Must Have.
- **Should Have:** Important but not vital; viable without them though potentially requiring workarounds.
- **Could Have:** Desirable but less critical; the primary contingency pool when deadlines are at risk.
- **Won't Have (this time):** Explicitly out of scope for current timeframe; prevents scope creep and manages expectations.

**Effort allocation guidance:**
- Must Have: no more than 60% of total effort.
- Could Have: typically around 20% of total effort.
- Should Have: remaining ~20%.
- Exceeding 60% Must Have introduces project failure risk.

**Three-tier hierarchy:**
1. Project-level priorities (overall scope).
2. Project Increment priorities (specific releases).
3. Timebox-level priorities (sprint-level).
A requirement classified Must Have at project level might be Could Have for an early increment.

**Objective criteria (machine-applicable):**
- Binary cancel-test for Must Have.
- Workaround existence test.
- Dependency constraint: Must Haves cannot depend on lower-priority items.

**Subjective/ceremony-dependent elements:**
- Differentiating Should from Could requires agreed business criteria established upfront in stakeholder sessions.
- Team discussion of Must Have justifications ensures shared understanding.
- Regular reprioritization at increment and timebox boundaries requires ongoing human judgment.

## Structural notes

- MoSCoW produces a four-bucket categorical classification, not a continuous score.
- Within each bucket, no ordering is implied — items within "Must Have" are unranked relative to each other.
- The timebox-level re-application of MoSCoW is a scheduled human ceremony, not a property of the item itself.
