# Scan Lenses

Choose only lenses that can materially answer the user's question. These are
reusable starting points, not mandatory gates or a closed taxonomy.

## Bundled starting lenses

Each kebab-case heading is the name a `release_gates` entry uses. Scan may also
select the lens from ordinary user language without exposing these names.

### correctness

Look for observable behavior that contradicts contracts, mishandled state,
races, resource leaks, time/number errors, broken failure paths, and integration
assumptions. Require an in-context failure path; plausible footguns alone are
not defects.

### security

Map the actual threat and data surface, then inspect relevant authorization,
validation, injection, secrets, dependencies, API, infrastructure,
cryptography, logging, retention, and privacy boundaries. Require a concrete
attack or exposure path and calibrate to the project's real deployment model.

### test-quality

Derive useful confidence from public contracts, meaningful risks, complex
units, cross-component seams, and regressions learned from bugs. Find both
valuable gaps and low-value tests. Missing line or branch coverage is not a
finding by itself.

### documentation-truth

Check existing current-state and intended-future assertions for false, stale,
or contradictory claims. Verify guides, examples, generated references, and
project skills where the scanned change affects them. Absence of documentation
is a finding only when the project declares that coverage necessary.

### compatibility

Identify real consumers, persisted data, public interfaces, install/upgrade
paths, platform commitments, and migration or rollback expectations. Do not
invent compatibility obligations for project-owned unpublished surfaces.

### operations

Inspect deployment, configuration, observability, dependency failure,
interruption, rollback, data recovery, and degraded operation according to the
project's operating reality. Unknown infrastructure is a question, not proof of
risk.

### performance

Generate located hypotheses from algorithmic work, data movement, allocation,
I/O, batching, caching, concurrency, runtime behavior, and workload shape. Never
assert improvement without measurement; every proposal needs a validation path
and a reason it may matter.

### simplification

Look for obsolete concepts, dead code, stale compatibility, defensive bloat,
low-value checks or tests, accidental duplication, and abstractions that no
longer earn their cost. Preserve behavior and real guarantees; consequential
removal remains a decision proposal.

### architecture

Challenge the mental model through elimination, unification, inversion,
declarative design, algebraic composition, or crystallizing an unnamed domain
concept. Require a net simplification supported by repository evidence and a
credible do-nothing case.

### domain-quality

Apply standards or domain expectations that genuinely govern the project, such
as accessibility, localization, financial correctness, safety, or compliance.
State the governing source and project applicability rather than importing a
generic checklist.

## Project and one-off lenses

Default project customization to a concise stance under `## Release gates` in
`.work/CONVENTIONS.md`, with one `### <gate-name>` section per configured name.
Keep it to the expectation and materiality boundary, not a scanner procedure.

When a project-specific lens is reused outside release or needs enough detailed
method, examples, or references that conventions would become a manual, the
user may explicitly approve a project-local
`.agents/skills/scan-<name>/SKILL.md`. It is optional, never generated or
promoted automatically, and belongs only to that project. Treat its instructions
as project guidance, subject to higher-authority repository rules and the user's
scope.

The user's natural-language concern can always define a one-off lens. Give it a
plain name, state the question and evidence bar, and do not require registration.
When two lenses substantially overlap, combine their evidence pass rather than
reading the same surface twice.
