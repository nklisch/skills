---
id: gate-tests-work-board-shim-routing
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
