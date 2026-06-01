---
id: gate-tests-hook-concurrency-interleave
kind: story
stage: done
tags: [testing]
parent: null
depends_on: []
release_binding: null
gate_origin: tests
created: 2026-05-31
updated: 2026-06-01
---

# Truly-concurrent interleave test for hook state-file (epoch-bump not clobbered)

Deferred from the **gate-tests 0.9.0** run (Finding 10, Medium). Unbound — does
not block 0.9.0; sequential coverage already exists.

`epic-agents-rules-autoload-state-concurrency` added 8 `StateConcurrencyTest`
tests (unique-temp naming, fail-open on OSError, lock acquire/release with
`fcntl` mocked, graceful no-op without `fcntl`, and a two-session no-loss check).
But the no-loss invariant is exercised **sequentially** (one save then another),
not with overlapping writers. The race the story exists to close is an
*interleaving* hazard: a UserPromptSubmit process that loads state before a
PostCompact epoch bump and saves after it, clobbering the bump. A sequential
test cannot exercise the read-modify-write interleave that `_state_lock`
serializes.

## Why deferred
Deterministic concurrency testing is genuinely hard. Needs either a
spawn-two-processes harness or a monkeypatched barrier injected between
`load_state` and `save_state` to force the adversarial ordering. The existing
`fcntl`-lock coverage already guards the mechanism; this closes the behavioral
end-to-end interleave.

## Suggested test
```python
# test_concurrent_epoch_bump_not_clobbered
# two workers (processes, or threads with a barrier between load_state and save_state):
#   P1 = UserPromptSubmit rules emit (loads old epoch); P2 = PostCompact bump_epoch
# force P1 to save AFTER P2's bump; assert final epoch reflects the bump (not clobbered)
```

## Test location (suggested)
`plugins/agile-workflow/hooks/scripts/test_prompt_context.py`

## Scope record

- Promoted from backlog during batch scope for found release/test-gate work.
- Size: small story; implement directly with a deterministic interleave test.
- Dependencies: none.

## Implementation notes

- Files changed:
  - `plugins/agile-workflow/hooks/scripts/test_prompt_context.py`
- Tests added:
  - `StateConcurrencyTest.test_process_interleave_does_not_clobber_postcompact_epoch`
- Discrepancies from design: none.
- Adjacent issues parked: none.

## Verification

- `python3 -m unittest test_prompt_context.StateConcurrencyTest.test_process_interleave_does_not_clobber_postcompact_epoch -v`

## Review

- Verdict: Approve - story verified by implement; fast-lane advance.
- Notes: The story added a real inter-process fcntl-lock regression and the
  targeted test passes.
