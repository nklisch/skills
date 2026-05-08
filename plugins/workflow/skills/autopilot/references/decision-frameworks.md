# Decision Frameworks

Autonomous decision rules for every judgment call in the autopilot loop.
When the workflow would normally ask a human, apply these frameworks instead
and log your reasoning in PROGRESS.md.

## Phase Splitting

**When to split a design into parts (a, b):**
- The phase has more than 15 implementation units
- The phase has clearly independent subsystems (e.g., backend API + frontend UI)
- Estimated total is 20+ new files or 2000+ lines

**How to split:** Along natural dependency boundaries. Part (a) should be
buildable and testable independently. Part (b) depends on (a) being complete.
Cap at 3 parts per phase — if it needs more, something is wrong with the
roadmap's decomposition.

## Refactor Timing

**Default:** Every 3 phases.
**Every 2 phases if:**
- You've noticed significant code duplication during implementation
- The last 2 phases were large (10+ implementation units each)
- Agents reported structural issues or workarounds during implementation

**Every 4 phases if:**
- Phases were small and self-contained (3-5 units each)
- Phases touched different subsystems with minimal overlap
- The last refactor pass found little to improve

**Skip entirely if:** Only 1 phase has been completed since the last refactor
and it was small. Don't refactor for the sake of it.

## Research Trigger

**Run research when:**
- The phase depends on a library/API/tool not already used in the project
- The phase uses a library that's in the project but you haven't seen clear
  usage patterns for the specific features needed
- The roadmap phase explicitly mentions research as a prerequisite

**Skip research when:**
- The library is already well-established in the codebase with clear patterns
- The phase uses only standard language features and internal modules
- A research skill for this library already exists in the project

## Design Ambiguity Resolution

When the design skill would normally ask the user about ambiguities, apply
these rules in order:

1. **Check existing code patterns.** If the codebase already handles a similar
   case, follow that pattern. Consistency beats theoretical perfection.
2. **Check foundation docs.** SPEC.md, ARCHITECTURE.md, or VISION.md may
   have guidance that resolves the ambiguity.
3. **Pick the simpler approach.** Fewer dependencies, fewer abstractions,
   less indirection. You can always refactor later.
4. **Pick the more testable approach.** If one option is easier to verify
   with automated tests, prefer it.
5. **Log the decision.** Write what you chose, what the alternative was,
   and why. The user can override in a future session.

## Architecture Trade-offs

When multiple valid architectural approaches exist:

- **Prefer Ports & Adapters** — separate domain logic from infrastructure
- **Prefer Single Source of Truth** — one canonical location for each piece of data
- **Prefer explicit over implicit** — dependency injection over service locators,
  explicit config over convention-based discovery
- **Prefer boring technology** — well-understood patterns over clever abstractions

## Test Failure Handling

1. **First failure:** Read the error. Diagnose the root cause. Spawn a targeted
   fix agent with specific instructions.
2. **Second failure (same test):** Re-read the design and the failing code.
   Check if the design assumption was wrong. If so, adjust the design and
   re-implement the affected unit.
3. **Third failure (same test):** Log it as a known issue in PROGRESS.md with
   full context. Mark the test as skipped with a TODO comment explaining why.
   Move on. Don't spiral.

## Test Checkpoint Failure

If the phase's ROADMAP.md test checkpoint fails (not individual unit tests,
but the phase-level "can you do X now?" check):

1. Run the failing command and read the full output.
2. Identify which implementation unit is responsible.
3. Spawn a targeted fix agent for that unit.
4. Re-run the checkpoint.
5. If it fails again, log the deviation and move on. Some checkpoints may
   need revision — the roadmap was written before implementation reality.

## Major Boundary Detection (for Testing Passes)

Trigger a deep testing pass (test-quality + e2e-test-design) when ANY of these become true:

- **Backend complete:** Every roadmap phase that produces or modifies API/server code is done,
  and the next phase starts frontend/UI or client work.
- **Subsystem closed:** A named subsystem (auth, billing, search, data pipeline, core domain)
  has all its phases marked done. The subsystem is now testable as a whole.
- **Stack transition:** About to start work that uses a fundamentally different layer than
  what was just built.
- **End of roadmap:** Always. Even if "everything seems fine." That's exactly when the next
  bug ships.

Do NOT run deep testing after every phase — per-phase test checkpoints are sufficient for
incremental verification. Save the deep pass for genuine boundaries where the integrated
system can be evaluated as a whole.

## Context Window Management

- If you estimate you're past ~600k tokens, finish the current phase cleanly.
- Update PROGRESS.md with everything a fresh session needs to continue.
- Commit all work.
- Report to the user that you've reached a natural stopping point.
- A fresh `/autopilot` invocation will resume from PROGRESS.md.

## Scope Decisions

- **Feature creep:** If you notice something that should be built but isn't
  in the roadmap, log it in PROGRESS.md under "Suggested additions." Don't
  build it — scope changes need human judgment.
- **Missing roadmap detail:** If a phase's build items are too vague to design
  from, interpret them using the foundation docs. Log your interpretation.
- **Ordering changes:** If you discover a dependency the roadmap missed
  (Phase 5 actually needs something from Phase 7), reorder. Log the change.
