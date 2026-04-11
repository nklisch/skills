# Changelog

## v1.3.1

### Improvements
- Add emotional tone guidance to orchestrator prompt crafting — implement-orchestrator and update-documentation now instruct the parent to frame sub-agent prompts with craft/pride language, permission to report blockers, and no pressure language

## v1.3.0

### Features
- Add custom Explore agent that overrides the built-in Haiku Explore with a Sonnet-powered version. Synthesizes findings into actionable answers with structured output (answer first, citations, code quotes, not-found items) instead of raw search results. Automatically replaces the built-in for all skills that spawn Explore agents.

## v1.2.8

### Improvements
- Rewrite 10 skills with emotional tone alignment based on Anthropic's emotion research: apply craft/pride framing to design, implement, bold-refactor; anti-desperation design to implement-orchestrator, perf-design, refactor-design; collaboration framing to update-documentation, e2e-test-design, test-quality, implementation-principles
- Rename "Anti-Patterns (CRITICAL)" to "Guardrails" with reasoning across all affected skills
- Replace "You MUST read" mandates with "Ground Yourself First" plus payoff framing
- test-quality and e2e-test-design reframed around finding real bugs as a reward, fixing them when found, and taking pride in delivering a reliable product

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
