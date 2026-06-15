---
source_handle: wsjf-blackswanfarming
fetched: 2026-06-15
source_url: https://blackswanfarming.com/wsjf-weighted-shortest-job-first/
provenance: source-direct
source_class: blog-post
---

# WSJF – Weighted Shortest Job First (Black Swan Farming)

## Summary

A practitioner explanation of Weighted Shortest Job First (WSJF) and its CD3 variant, tracing the formulation to Don Reinertsen's *The Principles of Product Development Flow*. The article explains why "CD3" (Cost of Delay Divided by Duration) is preferred as shorthand over the full acronym, since it foregrounds the more important component: Cost of Delay.

## Key passages

**Formula:** WSJF = Cost of Delay ÷ Duration. CD3 is shorthand for this.

**Cost of Delay definition (implicit):** Economic value per unit time — the financial loss incurred when work remains incomplete. Illustrated via weekly monetary costs per feature (e.g., $1,000/week, $4,000/week).

**Economic worked example (FIFO vs. CD3):**
- Three features with varying durations and delay costs.
- FIFO sequencing: total delay cost = $69,000.
- CD3 sequencing (highest score first): total delay cost = $27,000.
- 61% reduction in total delay costs from reordering alone.

**Rationale:** Shorter jobs with high delay costs should execute first because they reduce total opportunity cost across the entire backlog. The opportunity cost of deferring high-CoD short work accumulates for every item behind it in the queue.

**SAFe critique (implicit):** The article critiques SAFe's "simplification" of Cost of Delay, suggesting the framework prioritized ease-of-use over precision, though it does not elaborate the specific mechanism of simplification.

**Score stability:** The article does not address whether WSJF scores remain stable over time or require continuous re-estimation. No discussion of queue resorting frequency or estimation volatility.

## Structural notes

- Primary audience: practitioners wanting a quick economic grounding for CD3.
- Does not distinguish between machine-readable and human-ceremony applications.
- Focuses on mechanics of the initial calculation, not ongoing maintenance of scores.
