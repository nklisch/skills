---
id: gate-tests-convert-install-routing
kind: story
stage: drafting
tags: [testing]
parent: null
depends_on: []
release_binding: 0.8.6
gate_origin: tests
created: 2026-05-31
updated: 2026-05-31
---

# Guard the convert→install-work-view.sh seam (no raw `cp` regression)

## Priority
Medium

## Spec reference
Item: `epic-substrate-cli-install-path` (Unit 2).
Acceptance criterion: "Bootstrap and `--update` both route through
`install-work-view.sh`." and "The doctor check + git-add still hold."

## Gap type
Missing test for e2e-seam — `install-work-view.test.sh` tests the helper directly (51
assertions), but the seam (that `convert`'s Phase 4 and Phase S3 actually invoke the
helper, and the resulting `.work/bin/work-view` passes the doctor check + gets
`git add`ed) is verified only by reading `convert/SKILL.md`. A future edit reverting
Phase 4 to `cp work-view.sh` would pass all current tests. Spec is partially silent on
how to test a markdown skill — settle the strategy: either extract the Phase-4 install
snippet into a sourced shell function the test can call, or assert at the SKILL.md
level.

## Suggested test
```bash
# scenario: extract/grep the Phase 4 + Phase S3 blocks from convert/SKILL.md
# assertion target: install-work-view.sh is invoked in BOTH bootstrap and --update;
#                   no `cp .../work-view.sh .work/bin/work-view` survives.
```

## Test location (suggested)
`plugins/agile-workflow/scripts/tests/` (new convert-routing assertion). Note: this
story may resolve as a [documentation] decision (markdown-skill test strategy) rather
than a pure test addition — settle that during design.
