---
id: gate-tests-bump-version-lockstep
kind: story
stage: done
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

## Implementation notes

Test file: `plugins/agile-workflow/scripts/tests/bump-version.test.sh` (new).

Approach: the test exercises the REAL `scripts/bump-version.sh` projection block
(not a reimplementation) by running the whole script inside a throwaway
`git init` scratch repo whose tree mirrors the paths the script touches
(`plugins/agile-workflow/.claude-plugin/plugin.json`, `.codex-plugin/plugin.json`,
`work-view/crates/cli/.work-view-version`, `scripts/work-view.sh`). To stop the
script's trailing `git commit` / `git push` from escaping, a fake `git` shim is
placed first on PATH that forwards safe subcommands (init/config/add/diff/status)
to the real git but turns `commit`/`push` into no-ops. This still exercises the
real projection AND the real `git add` staging.

Assertions (25, exit 0):
- patch bump: `.work-view-version` == new semver, exactly 5 bytes, last byte is
  NOT 0x0a (no trailing newline); `work-view.sh` `WORK_VIEW_VERSION` literal ==
  new and old literal gone; claude plugin.json bumped; both work-view files
  git-staged.
- non-agile-workflow plugin bump (ux-ui-design): work-view files unchanged AND
  not staged (the `if plugin == agile-workflow` guard is skipped).
- Fail-Fast postcondition: an indented `WORK_VIEW_VERSION` literal makes the
  anchored sed no-op, and the `grep` postcondition exits 1 with
  "failed to project version into"; the literal is not rewritten.
- minor/major bumps project lockstep (1.3.0 / 2.0.0).

Run output: `bump-version.test.sh: Results: 25 passed, 0 failed`, exit 0.

No production bugs discovered; the projection block behaves as documented. (The
item noted the `printf` for `.work-view-version` has no Fail-Fast postcondition
like the bash literal does — that remains true, but it is a pre-existing design
asymmetry, not a bug surfaced by these tests; the printf cannot silently no-op
the way the anchored sed can.)

## Review (2026-05-31)
Verified by re-running the suite in the release-deploy drain: passes green, no gaming patterns, bump-version isolation confirmed not to touch real manifests. Advanced review -> done.
