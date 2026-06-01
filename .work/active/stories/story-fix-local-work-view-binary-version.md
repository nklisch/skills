---
id: story-fix-local-work-view-binary-version
kind: story
stage: review
tags: [bug]
parent: null
depends_on: []
release_binding: null
gate_origin: null
created: 2026-06-01
updated: 2026-06-01
---

# Fix stale local work-view binary version

## Symptom
Final peer review found that this repo's tracked `.work/bin/work-view` reported
`work-view 0.9.4` while agile-workflow plugin metadata and shipped dist binaries
reported `0.9.5`.

## Root cause
The GitHub Actions dist refresh updated
`plugins/agile-workflow/work-view/dist/<triple>/work-view`, but this repo's
dogfood substrate binary at `.work/bin/work-view` is a separate tracked install
copy and was not refreshed by the release artifact workflow.

## Fix approach
Add a guard to the dist-version script for the repo dogfood `.work/bin/work-view`
when it exists, then refresh the local copy from the verified Linux x86_64 musl
dist binary.

## Regression test
`plugins/agile-workflow/scripts/tests/work-view-dist-version.test.sh` asserts the
repo dogfood `.work/bin/work-view` reports the current plugin version when the
tracked install exists.

## Implementation notes
- Files changed: `.work/bin/work-view`, `plugins/agile-workflow/scripts/tests/work-view-dist-version.test.sh`
- Test added: dogfood `.work/bin/work-view --version` must match the current agile-workflow plugin version when the tracked install exists.
- Adjacent issues parked: none.
