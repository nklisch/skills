# Verification Checks

Language-aware checks the orchestrator runs directly after agents report.
Adapt patterns to detected language. Run at least 10 checks per evaluation.

## Rust

| # | Check | Tool | Pattern / Command | Affects |
|---|-------|------|-------------------|---------|
| 1 | Unwrap in library code | Grep | `unwrap()` in `src/` excluding `test` modules | Code Quality, Error Handling |
| 2 | Unsafe blocks | Grep | `unsafe \{` or `unsafe fn` in `src/` | Security, Code Quality |
| 3 | println! in library | Grep | `println!` in `src/` (should use tracing/log) | Code Quality |
| 4 | Test count | Grep | `#\[test\]` and `#\[tokio::test\]` — count total | Testing |
| 5 | Error type exists | Grep | `thiserror` or `impl.*Error` or `anyhow` in Cargo.toml/src | Error Handling |
| 6 | Clippy in CI | Grep | `clippy` in `.github/workflows/` | CI/CD |
| 7 | Fmt check in CI | Grep | `cargo fmt` or `rustfmt` in CI files | CI/CD |
| 8 | Doc comments | Grep | `///` in `src/` — count vs file count for density | Documentation |

## JavaScript / TypeScript

| # | Check | Tool | Pattern / Command | Affects |
|---|-------|------|-------------------|---------|
| 1 | Console.log in src | Grep | `console\.log` in `src/` | Code Quality |
| 2 | Any type usage | Grep | `: any` in `*.ts` files | Code Quality |
| 3 | Test count | Grep | `it\(` or `test\(` or `describe\(` in test files | Testing |
| 4 | ESLint configured | Glob | `.eslintrc*` or `eslint.config.*` | CI/CD |
| 5 | TypeScript strict | Grep | `"strict": true` in `tsconfig.json` | Code Quality |
| 6 | Error handling | Grep | `catch` blocks, custom Error classes | Error Handling |

## Python

| # | Check | Tool | Pattern / Command | Affects |
|---|-------|------|-------------------|---------|
| 1 | Bare except | Grep | `except:` (no exception type) | Error Handling |
| 2 | Print in src | Grep | `print(` in `src/` (should use logging) | Code Quality |
| 3 | Test count | Grep | `def test_` or `async def test_` | Testing |
| 4 | Type hints | Grep | `-> ` in `*.py` — density check | Code Quality |
| 5 | Linter configured | Glob | `pyproject.toml` section `[tool.ruff]` or `.flake8` | CI/CD |

## Go

| # | Check | Tool | Pattern / Command | Affects |
|---|-------|------|-------------------|---------|
| 1 | Error ignored | Grep | `_ = .*err` or unchecked error returns | Error Handling |
| 2 | Test count | Grep | `func Test` in `*_test.go` | Testing |
| 3 | Lint in CI | Grep | `golangci-lint` in CI files | CI/CD |
| 4 | Doc comments | Grep | `// [A-Z]` on exported funcs | Documentation |

## Universal (all languages)

| # | Check | Tool | Pattern / Command | Affects |
|---|-------|------|-------------------|---------|
| 1 | CI exists | Glob | `.github/workflows/*.yml`, `.gitlab-ci.yml`, `Jenkinsfile` | CI/CD |
| 2 | README exists | Read | `README.md` — verify non-stub (> 20 lines) | Documentation, DX |
| 3 | License exists | Glob | `LICENSE*`, `COPYING*` | Maintainability |
| 4 | Secrets in code | Grep | `password\s*=\s*"`, `api_key\s*=\s*"`, `secret\s*=\s*"` in src | Security |
| 5 | Dependency audit | Grep | `cargo-deny`, `npm audit`, `safety`, `snyk`, `dependabot` | Security |
| 6 | Lock file exists | Glob | `Cargo.lock`, `package-lock.json`, `yarn.lock`, `go.sum` | Maintainability |
| 7 | E2E tests exist | Glob | `tests/e2e/`, `e2e/`, `**/e2e_*`, `cypress/`, `playwright/` | Testing |
| 8 | Design docs | Glob | `docs/`, `doc/`, `docs/design/`, `docs/adr/` | Documentation |
| 9 | Git ignore | Read | `.gitignore` — verify exists and covers build artifacts | DX |
| 10 | Editor config | Glob | `.editorconfig`, `.vscode/settings.json`, `.idea/` | DX |

## Interpreting results

**Discrepancy handling**: If a check contradicts an agent's claim, note it in the
dimension detail section and adjust the score accordingly. Example:

> Agent B claimed "no unwrap in library code." Verification found 23 instances
> of `unwrap()` in `src/` outside test modules. Score adjusted from 8 to 6.

**Tolerance**: Test counts should match within 20%. File existence claims must be exact.
Quality characterizations (e.g., "well-structured") are verified by reading 2-3 claimed
files and making an independent assessment.
