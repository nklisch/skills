# Review Lenses

Load this reference for standard and deep review lanes. Walk the applicable
lenses and note any lens skipped with the reason.

## Correctness

- Does the change do what the design, PR description, or commit message says?
- Are edge cases handled: off-by-one, null/undefined, async race, and boundary
  conditions?
- Does the change introduce resource leaks, infinite loops, unbounded growth, or
  stale state?
- If this is a fix, does it address the root cause rather than the symptom?

## Tests

- Are tests included for meaningful logic changes?
- Do tests verify behavior and contract rather than implementation details?
- Are edge cases covered, not only the happy path?
- For bug fixes, is there a regression test that would have caught the bug?

## Design Alignment

- Does the implementation match the design, or are deviations documented?
- Is any new abstraction earned by real repetition or imminent need?
- Could the change be simpler while preserving behavior?
- Does complexity move toward boundaries and away from core domain logic?

## Security

- Does the change touch auth, authorization, input validation, secrets, external
  requests, file paths, or command execution?
- Check only the applicable items. Do not run a full security audit here.
- Look for SQL injection, XSS, command injection, path traversal, unsafe secret
  handling, and SSRF-adjacent outbound request changes.

## Breaking Changes

- Does the change modify a public API, exported signature, schema, CLI, config,
  or generated contract?
- If yes, is the break intentional, documented, and paired with a migration path
  when needed?

## Foundation-Doc Alignment

- Does implementation invalidate any assertion in foundation docs such as
  `docs/VISION.md`, `docs/SPEC.md`, or `docs/ARCHITECTURE.md`?
- If yes, did the implementer roll the doc forward in the same change?
- Foundation-doc drift is a blocker in substrate mode.

## Naming And Comments

- Are new functions, types, and complex logic well named?
- Do comments explain why the code exists, not just what the code says?
- Is anything future maintainers need to understand left implicit?

## Epic Review Focus

For epics, skip per-line correctness, tests, and naming by default. Focus on:

- Design alignment: does the realized decomposition match the brief?
- Foundation-doc alignment: did cumulative work invalidate a foundation
  assertion that children missed?
- Breaking changes: are cross-cutting public API shifts visible only in aggregate?
- Capability completeness: does the promised capability work end to end?

If everything is clean, "Epic delivered as briefed; advancing to done" is a
complete review.
