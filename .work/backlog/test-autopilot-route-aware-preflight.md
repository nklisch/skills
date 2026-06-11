---
id: test-autopilot-route-aware-preflight
created: 2026-06-09
tags: [tooling, testing]
---

# Test the route-aware foundation-doc preflight

The autopilot foundation-doc prerequisite is now route-aware (halts only when the resolved
scope contains design-family routes; ordered after Phase 1 scope resolution). No test asserts
it. Add fixture cases: (a) design-family scope without VISION/SPEC → halt before any
delegation; (b) [research]-only drafting scope without foundation docs → proceeds;
(c) implementing/review-only scope without foundation docs → proceeds; (d) mixed scope
without foundation docs → whole run halts, nothing partially drained.
