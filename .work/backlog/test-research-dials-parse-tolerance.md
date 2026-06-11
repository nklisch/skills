---
id: test-research-dials-parse-tolerance
created: 2026-06-09
tags: [tooling, testing]
---

# Lock the `research_dials:` parse-tolerance contract with fixtures

The registration-carrying `[research]` work-item contract claims `work-view` "tolerates the
`research_dials:` block harmlessly." This is true today only by serde default — `RawFrontmatter`
in `work-view/crates/core/src/parse.rs` does not set `deny_unknown_fields`, so the nested block
is silently dropped; `hooks/scripts/prompt-context.py`'s frontmatter reader line-skips indented
children. Neither consumer has a test exercising an item that actually carries the block, unlike
`research_refs`/`research_origin` which got dedicated parse tests.

A future parser hardening (adding `deny_unknown_fields`, or a stricter Python frontmatter
parser) would silently break every commissioning item.

- Add a golden fixture item with `tags: [research]` + a nested `research_dials:` block
  (4 fields, including a `[list]`-form `output_kind`).
- Assert clean parse in the work-view core tests and the prompt-context tests.
- While there: a routing-behavior assertion for the `[research]` autopilot rows would close the
  coverage gap noted at PR time (convert-content-integrity does not cover the routing lane).
