# Verification Cadence

Use this when several units, agents, or correction rounds deliver into one
target. A check runs once, at the cheapest boundary that can catch what it
protects. Project conventions name the actual commands for each boundary.

## Contents

- Boundaries
- Merges
- Merge first, gate after
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
  closure. A merge owes the unit's loop checks; the integration gate and the
  tests of what depends on the change run after merging.
- **Merge first and gate after when several sessions deliver into one
  repository on one machine** (see Merge first, gate after). The integration
  gate also runs before an epic closes or a release is cut. A unit whose own
  checks are red does not merge.
- **The integration gate includes dependents:** the tests of every crate or
  module that depends on what the batch changed, with the feature combinations
  those dependents build.

## Merges

After merging an updated target, re-verify only what the incoming changes can
affect: the static gate plus tests of the crates or modules both sides touched,
of any crate where a conflict was resolved by hand, and of both units when a
merge auto-resolved files both changed. Re-run end-to-end journeys only when the
merge touched their surfaces. Unrelated upstream commits do not restart the gate.

## Merge first, gate after

When several sessions deliver into one repository on one machine, they merge
into a local integration branch first, and the long gates run afterwards on its
newest head.

- **Before merging**, a unit owes its review and loop checks, plus any fast
  focused contract the project names for the area it touched. No integration,
  boundary, journey, golden or sanitizer run comes first.
- **Merge under one merge lock.** Merge the integration branch into the unit's
  branch, rerun the loop checks only if that merge touched the unit's files,
  fast-forward the integration branch, and record the merged commit, the session
  and the work item in a merge log outside version control. Hold the lock for
  the merge only, never for a gate. A repository with a single merger needs no
  lock.
- **The integration checkout may be the person's working checkout.** Never
  stash, reset or clean it. When a fast-forward refuses because of local
  changes, ask the person.
- **One gate runner per repository** runs the project's post-merge gate on the
  integration branch's newest head. It runs one gate at a time, and only when
  merges have arrived since the last green. It records each result (head, green
  or red, time, failing check) where merging sessions can read it, so a session
  knows when it would inherit a red head.
  - **Green** publishes that head to the shared remote, so the published branch
    holds only gated commits. Merging sessions never publish the integration
    branch themselves; only the gate runner does, apart from the ledger-only
    case below.
  - **Red** bisects the first-parent merges since the last green, using only the
    failing check, and sends the merge commit, the check and its log to the
    owner named in the merge log. A failure that needs two merges together goes
    to both owners.
- **The owner fixes forward within one gate cycle.** Otherwise, or when the
  failure blocks others, the runner reverts that merge and tells the owner.
  Merging continues meanwhile.
- **An item closes only after a green gate on a head that contains its merge.**
- **Ledger-only changes** (work items and docs) need no gate. When everything
  unpublished is ledger-only, it may be published directly.
- **Releases** come from a green head, and timing checks stay in their quiet
  measurement batch.
- **Where the specifics live:** project conventions name the gate's contents
  and how they scale with what changed. Personal machine instructions name the
  lock, log and result paths, the integration checkouts and the gate runners.

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
- A delegated implementer, reviewer, or checker never deletes a worktree,
  branch, or build folder it did not create; it names leftovers for the owner
  to remove.
- Reviews keep their depth. Batch units into one review only when they share no
  files or land together.
