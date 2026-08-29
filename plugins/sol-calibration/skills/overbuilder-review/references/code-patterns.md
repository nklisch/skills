# Overbuilding patterns in codebases

Signals in code, tests, CI/CD, and infrastructure, with the question to ask, the simpler
default, and search hints. Hints are language-agnostic sketches; adapt them to the stack.

## Contents

1. Mapping the surface
2. Abstractions with one implementation
3. Framework wrappers and layers
4. Validation and error handling in triplicate
5. Test machinery
6. Committed generated artifacts and drift jobs
7. Deployment pipelines
8. Flags, options, and tenancy scaffolding
9. Durability and determinism machinery
10. Observability indirection
11. Project and process sprawl

## 1. Mapping the surface

Before judging, count: projects or packages versus runtime processes; entrypoints
(`Program`, `main`, `cmd/`, `bin/`); CI workflows and their matrices; test projects and
their kinds; infrastructure modules versus resources; abstractions with a single
implementer; config keys and flags and how many values each takes; directories of
committed generated code. Ratios are prompts, not verdicts: fourteen projects for three
processes, five test projects for one service, a classifier job for three deploy targets.

## 2. Abstractions with one implementation

- **Signal:** interfaces or ports with exactly one implementer plus a test double; strategy
  or provider abstractions with one strategy; plugin registries with one plugin.
- **Question:** is there a named second implementation with a date, or a real isolation,
  security, or process boundary the interface protects?
- **Simpler default:** the concrete type; extract the interface when the second case is
  real. Hint: list interface declarations, then count implementers per interface.

## 3. Framework wrappers and layers

- **Signal:** a project-owned bus, mediator, dispatcher, or unit-of-work wrapping a framework
  that already provides it; generic repositories over an ORM; `Common`, `Core`,
  `Utilities`, or `Shared` buckets.
- **Question:** what would break if callers used the framework directly?
- **Simpler default:** use the framework's surface; keep shared code only where two real
  callers exist.

## 4. Validation and error handling in triplicate

- **Signal:** the same rule enforced in a DTO validator, a domain guard, and a database
  constraint; result types and exceptions both handling the same expected refusal.
- **Question:** which layer is the authority for this invariant?
- **Simpler default:** validate untrusted input at the boundary once; let the database own
  durable invariants; pick one refusal style per boundary.

## 5. Test machinery

- **Signal:** golden or snapshot files for most outputs; a custom assertion DSL; test
  doubles for infrastructure that a container would cover; permanent process-kill or chaos
  suites; a test project per kind (unit, architecture, integration, contract, failure).
- **Question:** which tests protect a stable interface, a hard state transition, or a
  demonstrated failure — and which assert plumbing?
- **Simpler default:** behavior tests at stable interfaces against real dependencies where
  cheap; a handful of fault-injection tests for the guarantees that matter; traits instead
  of projects.

## 6. Committed generated artifacts and drift jobs

- **Signal:** generated code, OpenAPI documents, or schemas committed to the repository; a
  CI step that regenerates and fails on differences; a release gate on "unexplained drift".
- **Question:** who consumes the committed copy that the build output cannot serve?
- **Simpler default:** generate in the build or publish as a CI artifact; compare contracts
  only once an external consumer depends on them.

## 7. Deployment pipelines

- **Signal:** change classifiers producing verification and deploy matrices; per-target
  "last deployed revision" state; deployment markers and post-deploy artifact verification;
  dependency-closure fan-out rules that must agree with architecture tests.
- **Question:** how many targets and how many teams, and what is the cost of deploying
  everything together?
- **Simpler default:** build every image per merge, deploy enabled targets together with
  immutable digests, path-filter only docs-only changes; add selective deployment when build
  time or blast radius demands it.

## 8. Flags, options, and tenancy scaffolding

- **Signal:** feature flags with one value in every environment; options never overridden;
  tenant or organization columns and middleware with one tenant; profiles and allowlists
  with one entry.
- **Question:** who changes this, and when did it last take a second value?
- **Simpler default:** a constant, or a fixed bundle; introduce the dimension with its
  second real value. Hint: grep config keys and compare values across environment files.

## 9. Durability and determinism machinery

- **Signal:** event sourcing for CRUD; sagas for single-step operations; idempotency tables
  for operations with no external effect; exactly-once claims; canonical ordering and
  hashing where tolerance suffices; clock injection through code that makes no
  time-based decision.
- **Question:** which operation is irreversible or externally visible, and which invariant
  needs replay?
- **Simpler default:** idempotency and frozen payloads only around consequential external
  effects; append-only history only where history is a fact someone relies on; at-least-once
  with idempotent handlers.

## 10. Observability indirection

- **Signal:** internal identifiers banned from logs and a resolution query added to
  compensate; metric dimensions so bounded that investigation needs a second system;
  telemetry envelopes with many required fields before the first alert exists.
- **Question:** what is actually sensitive, and can an operator investigate a failure with
  what remains?
- **Simpler default:** exclude personal, clinical, financial, and secret values; allow opaque
  internal identifiers; a few alerts tied to "work stopped" and "intake failing".

## 11. Project and process sprawl

- **Signal:** a deployable per scheduled job; several projects for one vendor adapter;
  services split along module lines for a single team; minimum instance counts set by
  convention rather than load.
- **Question:** how many distinct runtime processes must exist for correctness or isolation?
- **Simpler default:** one codebase with a few entrypoints; jobs run the worker image with a
  different command; split only along real isolation or scaling boundaries.
