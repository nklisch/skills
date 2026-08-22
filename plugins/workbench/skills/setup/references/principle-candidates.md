# Principle Candidates

Setup uses this catalog when asking whether to establish or extend
`docs/PRINCIPLES.md`. Nothing here is binding on the project until the user
confirms it; Workbench never enforces these principles itself. Wording is a
starting point — the project adapts each adopted principle to its own context.

## Core invariants (always recommend)

These are architecture-neutral, nearly universal, and chronically violated by
agents. Recommend them in every repository unless the user declines.

**Contract truth ownership.** Structure that lives in code is defined once in
a machine-readable artifact and never duplicated in prose. Documents own what
code cannot express: semantics, invariants, conformance rules, and rationale.
A protocol consumed beyond the repository may warrant a standalone or generated
document spec, or a mix — but always with one structural authority, and no
structural definition maintained by hand in two places.

**Compatibility is earned.** Compatibility obligations come only from verified
external consumers and substantial real data — never from the mere existence of
a schema or API. Project-owned surfaces (request/response shapes, config
formats, internal APIs, disposable storage layouts) change in place: no version
prefixes, deprecation shims, or dual-read paths when both sides are yours.
Real-data migrations are planned by the agent and approved and executed by the
user for production data.

**Leave it simpler.** When touching an area, eliminate code, tests, checks,
abstractions, and compatibility paths the current work makes unnecessary.
Preserve behavior, guarantees, validation, compatibility, safety, and measured
performance constraints unless the user explicitly authorizes a change. Avoid
obvious plausible performance regressions. Ask before removing any of those
meaningful properties.

## Optional bootstrap candidates (offer when bootstrapping)

Offer these when the project is new or has no principles document. They are
style choices, not invariants — right for many projects and wrong for some.
Present each as an adopt, adapt, or reject decision; do not recommend the whole
set by default.

**Ports & adapters.** Domain logic stays independent of databases,
filesystems, HTTP, time, and other infrastructure. The domain defines the
ports it needs; adapters implement them; composition roots wire the two
together. Fits domain-heavy systems with swappable infrastructure; usually
overweight for CLIs, plugins, prototypes, and small tools.

**Fail fast where it matters.** Validate untrusted input and required external
contracts at system boundaries. Add internal checks only when the project's
actual risks justify them; do not manufacture defensive layers the product's
scope and consequences do not need.

**Code economy.** Short, direct code is a virtue when it stays clear. Prefer
fewer concepts, layers, branches, and options over speculative generality, and
match rigor to the project's context.

**Tests earn their keep.** Test behavior at stable interfaces, important
behaviors, and regressions learned from real bugs — not every line or branch.
Remove tests whose upkeep exceeds the confidence they add. Setup already
recommends this as a testing convention; adopt it as a principle only when the
project wants it stated as binding engineering posture.

## Subsumed principles

Two common principles need no separate adoption because contract truth
ownership covers them: single source of truth for growing variant sets (one
authoritative registry from which types, validation, and routing derive) and
generated contracts (boundary types derive from the schema rather than
hand-written copies). If the project wants either stated explicitly, fold it
into its adoption of contract truth ownership.

## Derived candidates outrank the menu

Principles derived from repository evidence — an observed hexagonal layout, an
existing testing culture, a documented interoperability promise — always take
priority over this catalog, and may adopt, adapt, or contradict any candidate
here. The catalog exists so a greenfield project bootstraps from something
better than an agent's defaults.
