# Principles

Binding engineering and testing decision rules for this repository. Each
principle carries enough rationale to apply it when trade-offs arise.
Agent operating rules live in `AGENTS.md`; detailed recurring
implementation shapes live in `.agents/skills/patterns/`.

## Proportionate rigor

Prefer short, clear code and context-appropriate rigor over speculative
generality. Not every project needs exhaustive invariants, edge handling,
firm determinism, or universal coverage. Test important interfaces,
complex units, and regressions learned from bugs — not every line.

## Leave it simpler

When touching an area, eliminate unnecessary code, tests, checks,
abstractions, and compatibility paths. Simplicity is measured in durable
concepts and operating cost, not diff size. Ask before removing meaningful
behavior, guarantees, validation, compatibility, or safety.

## Compatibility is earned, not assumed

Absent a project declaration of external consumers, only two things create
compatibility obligations: dependencies outside the repository that are
not owned by the author, and substantial real data that must be preserved
or transformed. Agent tooling, MCP servers, internal services, and
unpublished libraries have no external consumers by default — never
version project-owned schemas or keep compatibility shims for surfaces the
project owns; change them in place. Real-data migrations are planned by
the agent but approved and executed by the user for production data; do
not run production transforms autonomously.

## Contract truth ownership

Code owns the structure of repository-internal contracts; documents own
their semantics, invariants, and rationale. Keep one assertion in one
authoritative location and link across scopes rather than duplicating
contract truth.

## Tests earn their upkeep

Prefer tests at stable interfaces, regression tests for real bugs, and
unit tests for genuinely complex units. Do not add tests merely to cover
every line or surface; remove duplicate, tautological,
implementation-bound, or obsolete tests when they add less confidence than
maintenance cost.

## File real bugs, fix bad tests

When a test failure surfaces an actual product bug — not a stale fixture,
drifted assertion, or broken mock — park it in `.work/backlog/` instead of
silently fixing it mid-pass; the backlog item is the audit trail. Test
debt is repaired in-session so the suite stays meaningful. Once the suite
is green, drain small parked bugs with a full pass; larger ones stay for
prioritization.

## Never game a test

A failing test that documents *why* it fails — an inline comment naming
the bug, a `skip` linked to a backlog id, an `xfail` with a reason — is
more honest than a green test that lies. No vacuous assertions, no
asserting on whatever the code happens to return, no deleting a test as
"flaky" without root-causing first.

## Rolling foundations

Foundation documents describe the system's current state or intended
future state, never the past; git history is the audit trail. Review
existing assertions only: missing coverage and unimplemented future intent
are not drift; flag only false, stale, or contradictory claims.
