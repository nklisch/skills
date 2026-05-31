---
id: gate-tests-exit3-fatal-io
kind: story
stage: done
tags: [testing]
parent: null
depends_on: []
release_binding: 0.8.6
gate_origin: tests
created: 2026-05-31
updated: 2026-05-31
---

# Test exit 3 on fatal traversal IO failure (`LoadError::Io`)

## Priority
Medium

## Spec reference
Item: `epic-substrate-cli-query-core` (Unit 5) / `epic-substrate-cli-adapter` (Unit 3).
Acceptance criterion: query-core Unit 5 — "Only a root-level traversal IO failure is
fatal ... `LoadError::Io` → exit 3." adapter Unit 3 — "Exit 0 success / 1 usage / 2
no-substrate / **3 LoadError::Io**."

## Gap type
Missing test for error case — exits 0, 1, 2 each have integration tests
(`exit_0_on_success`, `exit_1_on_unknown_flag`, `exit_2_when_no_substrate`). **Exit 3
has none** — neither a core unit producing `LoadError::Io` nor a CLI integration test
asserting exit 3. The four-way exit-code decision table has its fatal-IO cell entirely
unverified. Reachable via an unreadable tier dir under a valid `CONVENTIONS.md`.

## Suggested test
```rust
// crates/cli/tests/integration.rs  (skip when running as root — perms bypassed)
#[test]
fn exit_3_on_unreadable_substrate_traversal() {
    // valid .work/CONVENTIONS.md, but .work/active chmod 000
    // assert exit code == 3, stderr mentions the IO failure
}
// + core unit: Substrate::load on an unreadable tier dir -> Err(LoadError::Io)
```

## Test location (suggested)
`plugins/agile-workflow/work-view/crates/cli/tests/integration.rs` +
`crates/core/src/index.rs` tests.
