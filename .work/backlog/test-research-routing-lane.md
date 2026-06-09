---
id: test-research-routing-lane
created: 2026-06-09
tags: [tooling, testing]
---

# Test coverage for the `[research]` routing lane

`convert-content-integrity.test.sh` (the check cited at the lane's PR time) covers the
content-integrity gate and `.agents/rules` grounding — none of the `[research]` routing
behavior has assertions:

- autopilot dispatch rows (drafting → research-orchestrator; implementing → resume;
  degrade-to-plain-item in both rows when agentic-research is absent)
- feature-design's misroute/skip set for `[research]`
- release-deploy's bind-exclusion (the work-view `--tag research` exclusion-set gather)
- convert Phase 6/6.5 conditional `[research]` template content (present with the plugin,
  absent without)

Add fixture-driven assertions for these — likely a new `research-routing.test.sh` beside the
existing suite, with a fixture substrate carrying one `[research]` feature + one consumer.
