# Bug Diagnosis and Fixing

A bug fix should establish that the reported behavior exists, explain why it
exists, correct the cause, and leave evidence that distinguishes the fix from a
coincidental green run.

## Diagnose before editing

1. State the observed behavior, expected behavior, affected environment, and
   consequence.
2. Reproduce through the narrowest stable interface that still demonstrates the
   real bug. Preserve the exact command, input, fixture, request, or interaction.
3. Reduce the reproduction enough to separate the defect from unrelated system
   state without reducing away the behavior being reported.
4. Inspect the execution path, existing tests, logs, recent relevant changes,
   and boundary assumptions. Identify the root cause rather than patching the
   first visible symptom.

If the report cannot be reproduced, do not make a speculative code change and
call it fixed. Check environmental differences, timing, state, versions, and
observability. Improve diagnostics or ask for the missing evidence when useful;
otherwise record what was attempted and leave the work active or blocked.

## Establish failing evidence

When practical, add or identify a regression test at the stable interface where
the bug is observable. Run it before the fix and confirm that it fails for the
expected reason—not because the fixture, environment, or assertion is broken.

A new automated test is not mandatory when it would be misleading or
prohibitively expensive. Acceptable alternatives include a small executable
reproduction, a browser walkthrough with captured state, a protocol transcript,
a deterministic log assertion, or another repeatable before/after check. Record
why an automated regression test was not the best evidence.

Do not weaken an existing test, rewrite its expectation to match defective
behavior, broadly skip it, or delete it merely to obtain green output. Repair a
stale fixture, broken mock, or incorrect assertion when the product behavior is
already correct, and record why the test—not production—was wrong.

## Fix the cause

Make the smallest coherent change that corrects the root cause and preserves
intended contracts. “Smallest” does not mean adding a local special case when a
boundary or shared invariant is actually wrong. Include cohesive cleanup when it
makes the correction safer or removes the mechanism that produced the bug; park
broader refactoring.

When diagnosis reveals that expected behavior is itself ambiguous or
product-changing, return to requirements rather than choosing a contract under
the label of a bug fix.

## Prove the result

1. Re-run the failing regression evidence and confirm it now passes.
2. Run nearby tests and the project's authoritative checks proportionate to the
   affected surface and effective `rigor` preference.
3. Exercise important adjacent behavior to detect a fix that merely moves the
   failure.
4. Inspect the final diff for symptom patches, accidental scope expansion, test
   gaming, and missing cleanup.
5. Record the reproduction, root cause, fix, and verification concisely in the
   work item when durable context is useful.

A fix is not complete because code changed. It is complete when the original
behavior is reproducibly corrected, required verification is green, and no
known material regression remains.

## Bugs found during other work

If the defect blocks or is caused by the current delivery, fix it within that
scope when the root cause is understood and the change is cohesive. Park an
unrelated defect with reproduction evidence rather than silently expanding the
request. A severe correctness, security, or data-integrity issue may justify
stopping current work and surfacing it immediately.
