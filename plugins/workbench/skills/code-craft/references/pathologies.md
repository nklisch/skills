# Readability Pathologies

Named kinds of ceremony that hide algorithms. Each entry gives the symptom, the
fix, and whether the fix is mechanical or needs design care. The names are a
shared review vocabulary: cite them in findings, and file a repository's
examples under them in its catalog (see [the skill](../SKILL.md#the-repository-catalog)).

## Contents

- [Error ladders](#error-ladders)
- [Disguised enums](#disguised-enums)
- [Loose boundary values](#loose-boundary-values)
- [Flag-driven state](#flag-driven-state)
- [Woven instrumentation](#woven-instrumentation)
- [Parameter drilling](#parameter-drilling)
- [Near-copies](#near-copies)
- [God objects](#god-objects)
- [Shared-scratch phases](#shared-scratch-phases)
- [Half-adopted helper](#half-adopted-helper)
- [Hand-copied contracts](#hand-copied-contracts)
- [Test backdoors](#test-backdoors)

## Error ladders

The same five-to-seven-line error construction repeated around small amounts of
real logic, so the reader wades through failure plumbing to find what the code
does.

Fix: inner functions that return a result with one conversion at the boundary,
error-variant constructors, or a small fail-with-context helper. Mechanical.

## Disguised enums

Domain meaning carried by positional tuples, numeric ranges, magic values, or
sentinels such as `-1` or a maximum integer, decoded only by comments.

Fix: enums, small named structs, and identifier types. Mechanical.

## Loose boundary values

Stringly typed operations, placeholder values interpreted deep inside logic,
values unwrapped after ad hoc validation, and several inconsistent reply shapes
at a host, network, or file boundary.

Fix: parse once where the value enters into a typed value, handle it with one
exhaustive match, and build replies and refusals one way. Mostly mechanical;
keep exact user-facing refusal messages.

## Flag-driven state

State reconstructed from combinations of optional fields, booleans, or file
existence probes instead of being classified once, so every caller re-derives
which situation it is in.

Fix: classify once into a named state and pass that. Needs design care when the
state governs persistence or recovery ordering; do not erase competing or
corrupt observations while classifying.

## Woven instrumentation

Test and diagnostic code inside production types: test-only fields and checks,
hook parameters threaded through many signatures, and diagnostic flags inside
closures, so test and release builds take different paths.

Fix: one context value for hooks and limits, test-only code gated so release
builds compile it out, and checks that matter in production made unconditional.
Deciding whether a test-only check belongs in production is an owner decision;
the rest is mechanical.

## Parameter drilling

The same group of context values (limits, trackers, diagnostics, scratch
buffers) passed through long parameter lists, often with lint suppressions
papering over it.

Fix: a reader or context struct that carries the group, or methods on the type
that owns it. Mechanical.

## Near-copies

Near-identical blocks where the text cannot tell you whether a divergence is
intentional, such as a check that runs before a clamp in one copy and after it in
another. This is not a duplication hunt: copies that plainly mean the same thing
belong under half-adopted helper or ordinary extraction.

Fix: decide each divergence first, intended (document it) or accidental (fix
it), then unify. Vocabulary helpers are mechanical; unifying copies whose
behavior matters needs design care.

## God objects

Files, classes, or implementation blocks past reviewability, including large
inline test modules, where unrelated subsystems share one unit.

Fix: split along visible subsystem seams and move interleaved tests out,
keeping public paths stable. Mechanical. Judge the seams with
[structure](structure.md).

## Shared-scratch phases

One driver function mutating shared scratch state across many phases, so
correctness lives in invariants between phases rather than in local logic.

Fix: an owning type per phase whose methods make those invariants enforceable.
Needs design care; preserve behavior the tests pin, including incremental
updates.

## Half-adopted helper

The repository already decided some ceremony is boilerplate and wrote the
helper, but only part of the codebase uses it. The copies differ by adoption,
not meaning.

Fix: finish the rollout, promoting the helper to a shared location if several
private copies exist. Mechanical. Unlike near-copies, nothing needs deciding.

## Hand-copied contracts

A typed, validated contract copied by hand into several parallel
representations (transfer types, mapping functions, decoders, client types)
that cannot be compared mechanically, so they drift one field at a time.

Fix: derive the copies from one schema description, or cross-check them with
shared fixtures that both sides read. The derivation mechanism needs design
care; replacing repeated decoder code with tables is mechanical in the meantime.

## Test backdoors

A seam added so a test, benchmark, or agent could see or steer the inside of a
subsystem, left in the production surface afterwards: a public method whose only
caller is a test, a hidden installer for one fixture, a hook trait threaded
through many signatures, an accessor that exposes internal state for one
assertion. The motive is visibility; the cost is test infrastructure coupled to
the running product.

Fix: drive the scenario through the supported operations and assert on
supported outputs, designing the system so the behavior is observable there.
Wiring needed only while a shape was being proved is removed before landing, or
gated so release builds compile it out. A seam with no supported caller is
deleted with the test that used it, and the test is rewritten at the interface.
Mechanical for callers; needs design care when the interface-level test does not
exist yet, because writing it is the work.
