# Verification Cadence

Use this when several units, agents, or correction rounds deliver into one
target. A check runs once, at the cheapest boundary that can catch what it
protects. Project conventions name the actual commands for each boundary.

## Contents

- Boundaries
- Merges
- Expensive lanes
- Timing
- Builds and tests
- Delegated units

## Boundaries

- **Implementers and correction rounds run implementation-loop checks:** the
  touched crates' or modules' tests and the project's static gate (formatting
  and lint). They do not run the integration gate. When a unit changes a check
  or test harness, that harness's own tests are its touched tests.
- **Most verification waits for the epic boundary.** Journeys, expensive lanes,
  cross-platform runs, and measurement belong to integration points and epic
  closure. A landing owes the static gate plus the tests of what it touched and
  of what depends on it.
- **Batch integration gates across parallel deliveries.** When several agents
  deliver into one target on one machine, each unit lands after its own loop
  checks and static gate. The outcome owner runs the full integration gate once
  per batch of landings, sized to the number of sessions delivering in parallel
  (about one gate per round of landings across them), and always before an epic
  closes or a release is cut. Bisect a failing batch gate through the landing
  commits. A unit whose own checks are red does not land.
- **The integration gate includes dependents:** the tests of every crate or
  module that depends on what the batch changed, with the feature combinations
  those dependents build.

## Merges

After merging an updated target, re-verify only what the incoming changes can
affect: the static gate plus tests of the crates or modules both sides touched,
of any crate where a conflict was resolved by hand, and of both units when a
merge auto-resolved files both changed. Re-run end-to-end journeys only when the
merge touched their surfaces. Unrelated upstream commits do not restart the gate.

## Expensive lanes

- Sanitizer lanes, full test or doctest suites, cross-platform and emulation
  runs, fuzzing, formal-model mutation sets, rendered comparisons, and container
  journeys run once per integration or proof boundary, on one shared build.
- A unit runs a lane's focused cases only when its change is in the class the
  lane protects: memory lifetime, untrusted or damaged input, and threading for
  sanitizers; platform code or widely included headers for cross-platform runs.
  A unit outside that class runs none of the lane.
- A lane is green or has its known failures written down, each with an owner,
  in the run's existing coordination record. A run compares against that list:
  known failures are not re-triaged, and a new failure goes to its owner the same
  day.
- A check that cannot fail is not a gate. Noise-floor alarms and comparisons
  that only say "look deeper" run during performance work, not before merges.

## Timing

- Timing is never a unit, merge, or integration check. Units report
  code-derived counts such as allocations, work counters, or operations. A
  project's benchmarks lane belongs to the measurement batch.
- Run timing as one measurement batch per checkpoint or epic end, on a quiet
  machine, against preserved baseline commits, with load recorded per run.
- Never gate on a whole-application benchmark. When one is owed as one-off
  evidence, check its inputs cheaply first (the scenario still fits the world it
  runs in, the build identity is right), make the run prove the change engaged
  (a session with a fix on reports itself invalid when the fix did nothing), run
  one matched pair on a quiet machine, set tolerances from a same-configuration
  pair rather than one session's spread, and require enough samples for the
  decision before running.
- A measurement runner checks only what stays true of what it measures. A change
  that alters a payload's layout on purpose updates the runner's sanity checks in
  the same change.

## Builds and tests

- A unit keeps its build folder from first build until it lands or is abandoned.
  Repeated lanes such as smoke builds, fuzz targets, and engine templates use
  persistent warm folders, and a build whose inputs are unchanged is reused.
- Property and stress tests run at their default size in the loop and at full
  size once before landing. The full size must take effect: a test that fixes its
  case count in code ignores the environment switch, so leave the count to the
  framework default or read the switch explicitly, and check the reported case
  count before claiming a size.

## Delegated units

- A brief names the loop checks the implementer runs and states that the owner
  runs the integration gate. It tells the implementer to keep its build folder
  for the unit's life and never to run timed measurements.
- Implementers take the smallest correction that keeps the contract's rules and
  report it, instead of stopping on a small gap. A real design conflict still
  stops the unit, reported with evidence: two contract texts that contradict each
  other, a requirement the design makes impossible, or a write-surface widening
  that changes behavior.
- Returned evidence, and the notes written into work items, are the verdict, the
  commit, and one log path. Add tables, per-run figures, or load records only
  when a check failed or alarmed, or when the item's question is a measurement.
- A reviewer or checker never deletes a build folder or worktree it did not
  create; it names leftovers for the owner to remove.
- Reviews keep their depth. Batch units into one review only when they share no
  files or land together.
