# Changelog

## v1.2.7

### Features
- Add repo-eval skill: multi-dimensional codebase evaluation with calibrated scoring

### Changes
- Upgrade Explore sub-agent model from haiku to sonnet minimum (opus for large/complex codebases) across all skills that spawn explore agents
- Add repo-eval, design-principles, and implementation-principles to workflow guide

## v1.2.5

### Features
- Add security-review skill: comprehensive security audit with domain-focused scoring

### Internal
- Add re-align step to design, implement, implement-orchestrator, refactor-design, and e2e-test-design — re-reads CLAUDE.md and `.claude/rules/` before output phases to improve adherence via recency
