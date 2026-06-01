---
id: gate-tests-work-board-shim-routing
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

# Test work-board.sh shim routing (no-substrate / missing-binary / board-capable)

## Priority
Medium

## Spec reference
Item: `epic-substrate-board-host-surface`
Acceptance criterion: "`work-board.sh` no longer renders static HTML; it only
shims or reports the compiled-board requirement." + "Headless use prints the
URL; desktop use attempts browser open after the server binds."

## Gap type
missing error case / e2e-seam

## Detail
`work-board.sh` was rewritten into a decision shim with three branches (no
substrate → exit 2; binary absent / not board-capable → actionable message exit
1; board-capable → `exec … board`). Verification was manual (`bash -n`, one
`--help` run). No test in `scripts/tests/` exercises the routing — easily
covered with the existing `install-work-view.test.sh` harness pattern (stub a
`.work/bin/work-view` that does/doesn't accept `board --help`).

## Suggested test
```bash
# scripts/tests/work-board-shim.test.sh
# no .work/CONVENTIONS.md ancestor      => exit 2, stderr mentions no substrate
# .work/bin/work-view missing/not exec  => exit 1, "compiled work-view binary"
# stub work-view that FAILS `board --help` => exit 1 (does NOT exec board)
# stub work-view that PASSES `board --help` => exec'd with `board "$@"`
```

## Test location (suggested)
new `plugins/agile-workflow/scripts/tests/work-board-shim.test.sh`

## Implementation notes

Test file: `plugins/agile-workflow/scripts/tests/work-board-shim.test.sh` (new).

Uses the `install-work-view.test.sh` harness pattern: temp substrate roots and
stub `.work/bin/work-view` binaries. The board-capable stub records its forwarded
args to an arglog so the test can prove the shim exec'd `board "$@"` (and that the
board-incapable stub did NOT).

Assertions (16, exit 0):
- no `.work/CONVENTIONS.md` ancestor -> exit 2, stderr matches "no substrate".
- `.work/bin/work-view` missing -> exit 1, message names "compiled work-view
  binary"; also a present-but-non-executable (mode 0644) copy -> exit 1.
- stub that FAILS `board --help` -> exit 1, message about board unsupported /
  refresh, and NO arglog written (did not exec board).
- stub that PASSES `board --help` -> exit 0, arglog shows `board --port 8181
  --no-open` (forwarded args) and `board ` for the no-arg case.
- `--help` short-circuits before any substrate/binary check (exit 0, prints
  usage even with no substrate).

Run output: `work-board-shim.test.sh: Results: 16 passed, 0 failed`, exit 0.

No production bugs discovered; all three routing branches behave as documented.

## Review (2026-05-31)
Verified by re-running the suite in the release-deploy drain: passes green, no gaming patterns, bump-version isolation confirmed not to touch real manifests. Advanced review -> done.
