# Design Notes

## Contents

- Using the notes
- Approach
- Adds and retires
- Refusals and hard stops
- Load-bearing assumptions

## Using the notes

Each note covers detail that ordinary designs skip, and each has a trigger.
Record a note in the owning item only when its trigger applies; an item whose
triggers do not apply records none. Notes are ordinary item prose, not required
sections, frontmatter, or a template. Keep each one short and specific to this
change: a generic reminder such as "handle edge cases" or "consider security"
tells the implementer nothing.

## Approach

**Trigger:** a unit's cost or correctness depends mainly on how it computes.
That is the case when the unit sits where the project's calibration says cost is
felt, when a user would notice its cost as latency, stutter, startup delay, or
exhausted memory, or when it uses a specialized technique with known traps, such
as meshing, diffing, scheduling, incremental recomputation, geometric precision,
or concurrent handoff. Without the note, the implementer's first plausible
approach becomes the design by default, and on a hot path that choice decides
the cost. A unit whose obvious implementation is fine needs no note.

Record:

- the chosen algorithm, data structure, or technique, and why its cost fits the
  representative scale or budget. Name every budget the cost lands on: moving
  work to another thread or deferring it shifts the cost to latency or
  throughput rather than removing it;
- the earlier stage that already knows what the unit needs, when one does.
  Identities, grouping, order, and changes are cheapest where they are created;
  carry them forward instead of rediscovering them by hashing, searching,
  sorting, or diffing derived values, such as matching mesh corners by hashing
  final positions the mesher already placed on an integer grid;
- the data shape, when the unit keeps, groups, or looks up data per element:
  what the keys are and how many values they can take, which decides the
  container, since small, bounded, or already-indexed keys can index an array
  directly and a hash map then needs a reason; where working memory lives, and
  whether it is reused across calls and reset cheaply instead of reallocated or
  cleared; and the order the data is walked;
- the naive approach it rejects, when that approach is the trap;
- traps specific to this technique, not generic edge-case reminders;
- the supporting work it brings, such as invalidation for a cache, upkeep for an
  index, or change tracking for incremental updates;
- the work it avoids by skipping, batching, reusing, or recomputing only what
  changed; and
- the evidence that shows it fits, such as a representative workload measured
  against the budget or a check aimed at a named trap.

Load any available domain craft skill or project pattern reference that covers
the technique. When the fit is uncertain or the technique is unfamiliar, use a
small measurement, a prototype under the feasibility lens, or grounded research
instead of a confident guess. Without a budget, a cost users would notice, or a
known trap, add no optimization: "might be slow" is not a trigger, and
speculative tuning costs code and upkeep for a cost nobody measured. Name the
technique, its cost, and its invariants; reserve pseudocode for a genuinely
tricky core rather than pre-writing routine code. When delivery finds a trap the
note missed, amend the note and report the trap as a pattern candidate under
[maintenance](../../work/references/maintenance.md#pattern-lifecycle).

## Adds and retires

**Trigger:** the change adds or removes something beyond private code: anything
users, other code, or future maintainers see or rely on, or anything left behind
at runtime. Private functions and internal types inside the accepted boundary do
not count. Without
the list, implementers leave the new path running beside the old one, let names
drift across files, and leave processes or build output for someone else to
find.

Record:

- **Adds:** public names, commands, flags, and configuration keys; file formats,
  persisted fields, and protocol messages; third-party dependencies; runtime
  resources such as processes, temporary or build directories, caches, and
  sockets, each with the owner that removes it; and new domain terms, with the
  existing term each is distinct from.
- **Retires:** the code paths, options, files, documents, and tests the change
  makes obsolete, deleted in the same change. Keep an old path only for a
  verified consumer, naming that consumer and the condition for its removal.

A public format, protocol, or name and a new third-party dependency are hard to
reverse once shipped. Raise them as the consequential choices the design skill
already asks about, unless the accepted scope or project conventions settle
them. A component that owns changing state still goes through the
[state forecast](../SKILL.md#forecast-new-state-before-the-design-settles).
Delivery compares the final diff with the list; an unlisted addition or a
surviving retired path is a finding for review.

## Refusals and hard stops

**Trigger:** the design makes something refuse to start, run, read, write,
install, or proceed. Examples include a guard, validation that rejects input, a
limit, a blocking lock, and a required capability check. A refusal written
without this reasoning tends to trap legitimate users on real input without
stopping a real attack, and review then has to remove what was already built.

For each one, record:

- the concrete failure or threat it prevents, in one sentence;
- what a legitimate user loses when it fires, including false positives on real
  input; and
- the degraded path, override, or explicit choice offered instead, or why no
  alternative is safe.

When a capability probe is uncertain, prefer a degraded path to a refusal: log
and continue, fall back to a slower path, or mark one surface unavailable.
"Conservative" and "fail closed" name a posture, not a threat. Genuine product
policy, such as a permission product denying an unknown command, and a genuine
capability gap may still stop. Keep justified safety and data-integrity
protections. Review applies the same test to limits and refusals under
[review](../../work/references/review.md); settling it here avoids building a
guard that review then removes.

## Load-bearing assumptions

**Trigger:** the design depends on a fact nobody has confirmed, such as an
external interface's behavior, a library capability, performance at scale, a
file's real format, or a platform behavior, and the design would change
materially if that fact were false. Assumptions the implementer may adjust
locally stay under work's ordinary decision rules and need no note.

For each one, record:

- the assumption, stated as a checkable fact;
- the smallest check that confirms it, run before dependent implementation; and
- what happens if it is false: the implementer returns to the design owner with
  the evidence. Name any fallback that is acceptable in advance; otherwise none
  is.

Do not let a broken assumption turn into an unplanned fallback, stub, mock, or
skipped path: the delivered code then appears to work while the design's premise
is gone, and nobody learns the design needs revisiting. Put the riskiest check
first, consistent with designing the least-known unit first.
