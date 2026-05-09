---
name: repo-eval
description: >
  Multi-dimensional codebase evaluation with verified scoring. Launches parallel
  explore agents, cross-checks findings with direct verification, produces calibrated
  1-10 scorecard across architecture, code quality, testing, documentation, CI/CD,
  error handling, security, DX, and maintainability with prioritized recommendations.
  Use when user asks to evaluate, audit, score, or review a repository holistically.
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Agent, Write, AskUserQuestion
model: opus
---

# Repo Eval

Perform a structured, evidence-backed evaluation of a codebase. Produce a calibrated
scorecard with verified findings and actionable recommendations.

## Arguments

- No arguments: evaluate the entire repository
- Path argument (e.g. `src/`): scope evaluation to that subtree
- Dimension list (e.g. `testing,architecture`): evaluate only named dimensions

## Dimensions

Score all 9 by default. User may opt out via arguments.

| # | Dimension | What it covers |
|---|-----------|----------------|
| 1 | Architecture & Design | Dependency graph, separation of concerns, layering, abstraction quality |
| 2 | Code Quality | Idiomatics, type safety, unsafe usage, anti-patterns, consistency |
| 3 | Error Handling | Error types, propagation, panics in library code, edge case coverage |
| 4 | Testing | Test layers, coverage strategy, fixture quality, edge case tests, E2E |
| 5 | Documentation | Inline docs, README, design docs, API docs, doc freshness |
| 6 | CI/CD & Automation | Pipelines, linting, formatting, release process, dependency auditing |
| 7 | Security Posture | Unsafe code, input validation, secrets handling, dependency hygiene |
| 8 | Developer Experience | Build ergonomics, onboarding clarity, error messages, tooling |
| 9 | Maintainability | Module boundaries, coupling, file sizes, naming, upgrade path |

## Phase 1: Parallel Exploration

Launch 4 explore agents in parallel. Use `model: "opus"` for all agents (minimum
`"sonnet"` — never use haiku for evaluation). Each agent is a `general-purpose` type.

Give each agent a **complete, standalone brief** — they have no conversation context.
Include the repo path and any scope restrictions from the user's arguments.

### Agent A: Structure & Infrastructure

Brief the agent to investigate:
- Repository layout (directories, key files, entry points)
- Build system (Cargo.toml, package.json, go.mod, etc. — workspace structure, members)
- Dependency count and hygiene (version pinning, bloat assessment)
- CI/CD pipelines (workflows, checks, linting, formatting, release automation)
- Configuration files (formatter, linter, editor configs)
- Lines of code by language (use `find ... | xargs wc -l` or similar)
- Scripts and automation tooling

Tell the agent to **read actual config files** and **report specific findings**, not summaries.

### Agent B: Code Quality & Error Handling

Brief the agent to investigate:
- Error handling patterns (custom types, propagation, anyhow/thiserror usage)
- Panic safety (unwrap in library code, assert in production paths)
- Unsafe code (location, justification, test-only vs production)
- Type safety (newtypes, enums, type aliases, generics, trait abstractions)
- Code organization (module structure, file sizes, cohesion)
- Logging/tracing practices
- Anti-patterns and code smells

Tell the agent to **read 5+ representative source files** across different modules and
**quote specific examples** of good and bad patterns.

### Agent C: Testing & Quality Assurance

Brief the agent to investigate:
- Test layers (unit, integration, E2E, property-based, snapshot)
- Test count and distribution across modules
- Test quality — read actual tests, assess: do they test behavior or implementation?
  Do they cover edge cases? Are assertions meaningful?
- Test infrastructure (fixtures, harnesses, mocks, test utilities)
- Test configuration (feature gates, test-only dependencies)

Tell the agent to **count tests** (grep for `#[test]`, `#[tokio::test]`, `it(`, `test(`,
`describe(`, etc.) and **read 3+ test files** to assess quality.

### Agent D: Documentation & API Design

Brief the agent to investigate:
- README quality (onboarding, examples, troubleshooting)
- Inline documentation (doc comments on public APIs, module-level docs)
- Design documents (architecture, specs, ADRs)
- API surface (public interfaces, consistency, naming conventions)
- Documentation freshness (do docs match code?)

Tell the agent to **read doc files** and **cross-reference claims against actual code**.

## Phase 2: Verification

This is the critical phase. After agents return, **you** (the orchestrator) run direct
checks to verify key claims. Do not blindly trust agent summaries.

### Required verification checks

Run these checks yourself using Grep, Glob, Read, and Bash. Adapt patterns to the
detected language. See [references/verification-checks.md](references/verification-checks.md)
for the full check catalog.

**Minimum 10 checks must pass.** If agents claimed something you can't verify, note it
as "unverified" in the report.

#### Structural checks
1. **CI exists**: Glob for `.github/workflows/*.yml`, `.gitlab-ci.yml`, `Jenkinsfile`, etc.
2. **Linter configured**: Glob for linter configs (`.eslintrc*`, `clippy.toml`, `.flake8`, etc.)
   or grep CI files for lint commands
3. **Formatter configured**: Grep CI or configs for fmt/prettier/black/gofmt

#### Code quality checks
4. **Panic safety**: Grep for `unwrap()`, `.expect(` outside test modules — count occurrences
5. **Unsafe audit**: Grep for `unsafe {` or `unsafe fn` — verify locations match agent claims
6. **No println in libraries**: Grep for `println!` in src/ (Rust) or `console.log` in src/ (JS/TS)
7. **Error types exist**: Grep for `thiserror`, `anyhow`, custom `Error` impl, or equivalent

#### Testing checks
8. **Test count**: Grep for test markers (`#[test]`, `#[tokio::test]`, `it(`, `test(`) — compare
   count against agent's claim (within 20% tolerance)
9. **Test layers exist**: Glob for `tests/` directories, `*_test.go`, `*.test.ts`, etc.
10. **E2E infrastructure**: Grep for E2E markers, fixture files, test harness code

#### Documentation checks
11. **README exists and has content**: Read README.md, verify it's not a stub
12. **Doc comments density**: Grep for `///` or `/**` — rough count vs file count
13. **Design docs exist**: Glob for `docs/`, `doc/`, `*.md` in common locations

#### Security checks
14. **No hardcoded secrets**: Grep for `password =`, `api_key =`, `secret =` in source
15. **Dependency audit configured**: Grep for `cargo-deny`, `npm audit`, `safety`, `snyk`

### Cross-referencing

After running checks, compare results against agent claims:
- If an agent said "no unwrap in library code" but you found 15 instances — flag it
- If an agent said "comprehensive E2E tests" but you found 0 E2E markers — flag it
- If an agent claimed 500 tests but you counted 50 — flag it

Discrepancies **must** affect scoring. Note them explicitly in the report.

## Phase 3: Scoring & Report

### Score each dimension

Use the calibrated rubric in [references/scoring-rubric.md](references/scoring-rubric.md).

Rules:
- Every score >= 7 must cite at least one **verified** positive finding
- Every score <= 5 must cite at least one **verified** deficiency
- Scores of 9-10 require exceptional evidence — most mature codebases score 7-8
- Do not inflate scores. A "normal, adequate" codebase scores 5-6.

### Produce the report

Use the template in [references/report-template.md](references/report-template.md).

The report must include:
1. **Summary** — 2-3 sentence overview of the codebase
2. **Scorecard table** — all dimensions with scores and 1-line evidence summaries
3. **Overall score** — weighted average (architecture and code quality count 1.5x)
4. **Dimension details** — for each dimension: score, verified evidence (positive and negative),
   any discrepancies found during verification
5. **Top 5 recommendations** — prioritized by impact, each tied to a specific dimension,
   referencing specific files or patterns

### Output

Present the full report in conversation. Then:

**AskUserQuestion checkpoint**: Ask whether to save the report to a markdown file.
If yes, write to `REPO-EVAL.md` in the project root (or user-specified path).

## Language Detection

Before launching agents, detect the primary language(s) to tailor verification checks:

```
Cargo.toml / *.rs          → Rust
package.json / *.ts / *.js → JavaScript/TypeScript
go.mod / *.go              → Go
pyproject.toml / *.py      → Python
*.csproj / *.cs            → C#
```

Pass the detected language to agents so they use appropriate terminology and patterns.
