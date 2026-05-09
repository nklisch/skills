# Scoring Rubric

Calibrated 1-10 definitions per dimension. Use these to ensure consistent scoring
across evaluations. A "normal, competent" codebase scores 5-6. Most well-maintained
projects score 7-8. Scores of 9-10 are rare and require exceptional evidence.

## General Scale

| Score | Meaning |
|-------|---------|
| 1-2   | Absent or fundamentally broken |
| 3-4   | Present but seriously deficient — major gaps or anti-patterns |
| 5-6   | Adequate — works, follows basic conventions, nothing exceptional |
| 7-8   | Strong — thoughtful design, consistent quality, few gaps |
| 9-10  | Exceptional — best-in-class for the project's scale and domain |

## 1. Architecture & Design

| Score | Evidence |
|-------|----------|
| 3 | Monolithic, no module boundaries, circular dependencies, god objects |
| 5 | Reasonable file organization, some separation of concerns, minor coupling issues |
| 7 | Clean dependency graph, well-defined module boundaries, abstractions match domain |
| 9 | Layered architecture with zero circular deps, feature-gated optional components, clear public API surface, dependency inversion at boundaries |

## 2. Code Quality

| Score | Evidence |
|-------|----------|
| 3 | Inconsistent style, frequent unwrap/panic in library code, no type safety beyond primitives |
| 5 | Consistent formatting, basic types, occasional anti-patterns, reasonable naming |
| 7 | Idiomatic for the language, domain types encode semantics, traits/interfaces for abstraction, no panics in library code |
| 9 | Newtypes for all domain concepts, exhaustive enums, zero unsafe in app code, consistent patterns across entire codebase |

## 3. Error Handling

| Score | Evidence |
|-------|----------|
| 3 | Panics or ignores errors, generic error strings, no custom types |
| 5 | Result/Exception-based, some custom errors, basic propagation |
| 7 | Typed error hierarchy, context-rich messages, proper conversion traits, errors carry actionable info |
| 9 | Layered error strategy (library vs app), all boundaries covered, timeout handling, retry logic, no error swallowing |

## 4. Testing

| Score | Evidence |
|-------|----------|
| 3 | Few or no tests, tests only verify happy path, no test infrastructure |
| 5 | Unit tests for core logic, basic assertions, some test utilities |
| 7 | Multi-layer testing (unit + integration), meaningful fixtures, edge cases covered, tests document behavior |
| 9 | Unit + integration + E2E, custom harnesses, deterministic fixtures, test infrastructure as first-class code, tests catch regressions in CI |

## 5. Documentation

| Score | Evidence |
|-------|----------|
| 3 | No README or stub only, no doc comments, no design docs |
| 5 | README with setup instructions, some doc comments on public APIs |
| 7 | Thorough README, consistent doc comments, architecture docs, examples |
| 9 | Multi-audience docs (quickstart, reference, design), doc freshness enforced, trust levels stated, auto-generated API docs |

## 6. CI/CD & Automation

| Score | Evidence |
|-------|----------|
| 3 | No CI, manual testing and deployment |
| 5 | Basic CI (build + test), manual releases |
| 7 | CI with lint + fmt + test, automated releases, caching, cross-platform builds |
| 9 | CI covers all test layers, dependency auditing, release automation with version sync, deploy previews, coverage reporting |

## 7. Security Posture

| Score | Evidence |
|-------|----------|
| 3 | Hardcoded secrets, no input validation, unsafe everywhere, no dependency auditing |
| 5 | No obvious secrets, basic validation, minimal unsafe, dependencies not audited |
| 7 | Credential handling via env/config, input validation at boundaries, unsafe justified and isolated, dependency audit configured |
| 9 | Zero unsafe in production, auth/authz properly abstracted, supply chain auditing, encrypted transport, security-focused error messages |

## 8. Developer Experience

| Score | Evidence |
|-------|----------|
| 3 | No build instructions, complex undocumented setup, confusing project structure |
| 5 | README has build steps, standard tooling, reasonable project layout |
| 7 | Single-command build, clear entry points, helpful error messages, troubleshooting docs |
| 9 | Interactive setup CLI, contributor guide, pre-commit hooks, editor configs, exemplary onboarding |

## 9. Maintainability

| Score | Evidence |
|-------|----------|
| 3 | Files > 2000 LOC, deep coupling, no naming conventions, version strings scattered |
| 5 | Reasonable file sizes, basic naming, some coupling, manual version management |
| 7 | Cohesive modules < 500 LOC, consistent naming, documented conventions, version automation |
| 9 | Pattern documentation, convention enforcement in CI, clean upgrade paths, archived decision history, no dead code |

## Weighting

Architecture and Code Quality each count 1.5x in the overall score.
All other dimensions count 1x. Formula:

```
overall = (arch*1.5 + quality*1.5 + error + testing + docs + cicd + security + dx + maintain)
        / (1.5 + 1.5 + 1 + 1 + 1 + 1 + 1 + 1 + 1)
```
