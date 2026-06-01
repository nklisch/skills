---
id: gate-tests-bump-version-lockstep
kind: story
stage: implementing
tags: [testing]
parent: null
depends_on: []
release_binding: 0.9.0
gate_origin: tests
created: 2026-05-31
updated: 2026-05-31
---

# Test bump-version.sh projects the new semver into both work-view implementations in lockstep

## Priority
Critical

## Spec reference
Item: `epic-substrate-cli-freshness-versioning-bump-lockstep`
Acceptance criterion: "After `./scripts/bump-version.sh agile-workflow patch`,
`.work-view-version` holds the new semver (no trailing newline), staged and
committed." and "`work-view.sh`'s `WORK_VIEW_VERSION` literal equals the new
semver, staged and committed."

## Gap type
missing test for valid partition / e2e-seam

## Detail
The projection block (`scripts/bump-version.sh:100-124`) is the load-bearing
lockstep mechanism for the entire freshness epic, yet it has zero automated
coverage (the story recorded "Tests added: none"). The Rust
`version_stamp_equals_plugin_json_version` test catches drift *after the fact*
but does not verify the bump script *produces* lockstep, the bash
`WORK_VIEW_VERSION` literal, or the `agile-workflow`-only guard. Asymmetry: the
bash projection has a Fail-Fast `grep` postcondition (line 117) but the
`.work-view-version` `printf` (line 106) has none.

## Suggested test
```bash
# scripts/tests/bump-version.test.sh — exercise projection in a scratch git repo, no push
# seed plugin.json(s) + .work-view-version + work-view.sh, run the projection block
# assert: .work-view-version == new (no trailing \n); work-view.sh WORK_VIEW_VERSION=="new";
#         both git-staged; bumping a NON-agile-workflow plugin leaves work-view files untouched;
#         a renamed/indented WORK_VIEW_VERSION literal makes the script exit 1 (postcondition fires)
```

## Test location (suggested)
new `plugins/agile-workflow/scripts/tests/bump-version.test.sh` (wire into
`build-work-view.yml` alongside the install/convert suites)
