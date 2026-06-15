---
name: repo-eval
description: >
  Multi-dimensional codebase evaluation with verified scoring that writes a markdown scorecard only.
  Use when the user asks to evaluate, audit, score, grade, or review a repository holistically
  without adopting agile-workflow. Launches parallel exploratory sub-agents, cross-checks claims with
  direct verification, and produces calibrated 1-10 scores across architecture, code quality, error
  handling, testing, documentation, CI/CD, security, developer experience, and maintainability.
---

# Repo Eval

Perform a structured, evidence-backed evaluation of a codebase and write a markdown report. This
standalone variant never files `.work/` items and never commits. It produces `REPO-EVAL.md` by
default, or a user-specified output path.

## Arguments

- No arguments: evaluate the entire repository.
- Path argument such as `src/`: scope evaluation to that subtree.
- Dimension list such as `testing,architecture`: evaluate only named dimensions.
- `--output <path>`: write somewhere other than `REPO-EVAL.md`.

## Dimensions

Score all 9 by default.

| # | Dimension | What it covers |
|---|---|---|
| 1 | Architecture & Design | Dependency graph, separation of concerns, layering, abstraction quality |
| 2 | Code Quality | Idiomatics, type safety, unsafe usage, anti-patterns, consistency |
| 3 | Error Handling | Error types, propagation, panics in library code, edge case coverage |
| 4 | Testing | Test layers, coverage strategy, fixture quality, edge case tests, E2E |
| 5 | Documentation | README, design docs, API docs, inline docs, doc freshness |
| 6 | CI/CD & Automation | Pipelines, linting, formatting, release process, dependency auditing |
| 7 | Security Posture | Unsafe code, validation, secrets, dependency hygiene |
| 8 | Developer Experience | Build ergonomics, onboarding, error messages, tooling |
| 9 | Maintainability | Module boundaries, coupling, file sizes, naming, upgrade path |

## Phase 1: Parallel Exploration

Launch four read-only exploratory sub-agents in parallel. Use the strongest reviewer/explorer setting
the host exposes; use extra-high reasoning for large, polyglot, or architecture-heavy repos.

Each agent receives the repo path and scope restrictions.

### Agent A: Structure & Infrastructure

Investigate repository layout, build system, dependency hygiene, CI/CD, formatter/linter configs,
LOC by language, scripts, and automation.

### Agent B: Code Quality & Error Handling

Investigate error handling, panic safety, unsafe code, type safety, module organization,
logging/tracing, and code smells. Read representative source files and cite examples.

### Agent C: Testing & Quality Assurance

Investigate test layers, test count, distribution, fixture quality, assertions, mocks, E2E, and test
configuration. Count tests and read actual test files.

### Agent D: Documentation & API Design

Investigate README quality, inline docs, design docs, public API consistency, naming, examples, and
doc freshness against code.

## Phase 2: Direct Verification

After agents return, verify key claims yourself. Do not blindly trust summaries. Adapt commands to
the detected language and scope. Use [references/verification-checks.md](references/verification-checks.md).

Run at least 10 verification checks when the repo is large enough:
- CI exists.
- Linter and formatter are configured.
- Panic/unwrap/expect or equivalent risky shortcuts are counted outside tests.
- Unsafe code or equivalent escape hatches are located.
- Logging/println/console usage is checked in source.
- Error type strategy is checked.
- Test count and test layers are verified.
- README and design docs are checked.
- Security secret patterns are searched.
- Dependency auditing is checked.

Cross-reference every important agent claim. Discrepancies must affect scoring and appear in the
report.

## Phase 3: Scoring

Use [references/scoring-rubric.md](references/scoring-rubric.md).

Rules:
- Every score >= 7 cites verified positive evidence.
- Every score <= 5 cites verified deficiency.
- Scores of 9-10 require exceptional evidence.
- A normal competent codebase scores 5-6. Do not inflate.
- Overall score uses the rubric's weighting: architecture and code quality count 1.5x.

## Phase 4: Write The Report

Use [references/report-template.md](references/report-template.md). Write to `REPO-EVAL.md` unless
the user supplied `--output`.

The report must include:
- Summary.
- Scorecard table.
- Overall score.
- Dimension details with verified positives, concerns, and discrepancies.
- Verification summary.
- Top 5 recommendations.

In the final message, summarize the overall score, the weakest dimensions, top recommendations, and
the report path.

## Language Detection

Detect primary languages before launching agents:

| Signal | Language |
|---|---|
| `Cargo.toml`, `*.rs` | Rust |
| `package.json`, `*.ts`, `*.js` | JavaScript/TypeScript |
| `go.mod`, `*.go` | Go |
| `pyproject.toml`, `*.py` | Python |
| `*.csproj`, `*.cs` | C# |

Pass the detected language to sub-agents so their checks use the right terminology.

## Guardrails

- Verify before scoring.
- Treat unverified claims as unverified, not evidence.
- Do not write `.work/`, backlog, release, or tracking artifacts.
- Do not implement recommendations.
