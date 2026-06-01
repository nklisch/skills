---
id: gate-tests-work-view-dist-version-refresh
kind: story
stage: done
tags: [testing]
parent: null
depends_on: []
release_binding: 0.9.5
gate_origin: tests
created: 2026-06-01
updated: 2026-06-01
---

# Refresh work-view dist binaries for 0.9.5

## Priority
Critical

## Spec reference
Item: `epic-three-channel-distribution-docs-install-version-lockstep`
Acceptance criterion: agile-workflow channel metadata and the generated
`work-view` version surfaces stay in lockstep before a release ships.

## Gap type
test-integrity / release-artifact drift

## Evidence

`bash plugins/agile-workflow/scripts/tests/work-view-dist-version.test.sh`
fails because the committed prebuilt `dist/<triple>/work-view` binaries still
embed/report `0.9.4` while plugin metadata and `.work-view-version` are `0.9.5`.

Failed checks:
- `x86_64-unknown-linux-musl` embeds `0.9.4`
- `aarch64-unknown-linux-musl` embeds `0.9.4`
- `x86_64-apple-darwin` embeds `0.9.4`
- `aarch64-apple-darwin` embeds `0.9.4`
- native Linux x86_64 `--version` reports `work-view 0.9.4`

## Required fix

Refresh the generated `plugins/agile-workflow/work-view/dist/<triple>/work-view`
binaries from the post-bump 0.9.5 source stamp, using the documented manual
refresh path in `.github/workflows/build-work-view.yml` with
`workflow_dispatch` and `commit_binaries=true`.

Do not hand-edit the binary artifacts. The release is not ready until
`work-view-dist-version.test.sh` passes.

## Verification

- [x] `bash plugins/agile-workflow/scripts/tests/work-view-dist-version.test.sh`

## Implementation notes
- Files changed: `plugins/agile-workflow/work-view/dist/<triple>/work-view` refreshed by GitHub Actions run `26743675062`.
- Tests added: none; existing dist-version guard now passes against refreshed generated artifacts.
- Discrepancies from design: followed the documented CI `workflow_dispatch` refresh path instead of hand-editing binaries.
- Adjacent issues parked: none.
