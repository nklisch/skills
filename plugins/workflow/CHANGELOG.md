# Changelog

## v1.3.4

### Improvements
- Autopilot watchdog now runs as two plain-text loops instead of one slash-command loop: a 30-minute "continue with autopilot run" nudge plus a 3-hour full re-engagement prompt. Both use natural-language prompts rather than re-firing `/autopilot`, avoiding redundant SKILL.md reloads when already in context.
- Autopilot now checks for existing watchdog loops before scheduling new ones, preventing duplicate stacked loops from hammering the session with redundant prompts.

## v1.3.2

### Features
- Add `autopilot` skill: autonomously executes a full project roadmap end-to-end, looping design → implement-orchestrator → test for each phase, with judgment-driven refactoring passes every 2-4 phases, testing passes at major boundaries, and update-documentation at the end. Tracks progress in PROGRESS.md for cross-session resumption. Includes decision frameworks and progress file format as reference files.

### Internal
- Remove `disable-model-invocation` from design, implement-orchestrator, refactor-design, extract-patterns, and test-quality so they can be invoked by autopilot via the Skill tool

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
