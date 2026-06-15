---
source_handle: rice-intercom
fetched: 2026-06-15
source_url: https://www.intercom.com/blog/rice-simple-prioritization-for-product-managers/
provenance: source-direct
source_class: blog-post
author: Sean McBride (Intercom)
---

# RICE: Simple Prioritization for Product Managers (Intercom)

## Summary

The canonical introduction of the RICE scoring model by Sean McBride at Intercom. The post defines the four components, the formula, recommended scales, and explicit caveats about when scores should and should not govern decisions.

## Key passages

**Formula:** (Reach × Impact × Confidence) / Effort = RICE score

**Component definitions:**
- **Reach:** Number of people affected within a defined period (e.g., customers per quarter). Intercom used actual product metrics rather than estimates.
- **Impact:** Effect on each individual, on a fixed ordinal scale: 3 (massive), 2 (high), 1 (medium), 0.5 (low), 0.25 (minimal).
- **Confidence:** Certainty in the estimates, as a percentage: 100% (high), 80% (medium), 50% (low); below 50% = moonshot.
- **Effort:** Total person-months across all team members. Use whole numbers or 0.5 minimum.

**Rationale for Confidence:** "curb enthusiasm for exciting but ill-defined ideas." Without it, projects lacking data support receive inflated scores through the Impact component.

**Score interpretation:** Sort projects by RICE number, then "re-evaluate. Are there projects where the score seems too high or too low?" — The article explicitly acknowledges scores are not mechanical; human re-evaluation is part of the workflow.

**Explicit limitation:** "RICE scores shouldn't be used as a hard and fast rule." Dependencies, table stakes, or strategic priorities may justify working on lower-scoring projects first.

**Comparative use:** Scores are meaningful primarily for comparing items sharing a common metric (Intercom's growth team built RICE around a single conversion goal).

## Structural notes

- RICE produces a continuous numeric score, making it comparatively more machine-sortable than categorical methods.
- However, two of the four inputs (Impact, Confidence) use fixed ordinal scales that require human judgment to assign.
- The Confidence component is an explicit hedge against data-poor estimation — a built-in mechanism to dampen score inflation.
- The framework's authors designed it for comparison within a defined product area, not as a universal cross-team currency.
