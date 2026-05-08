# Changelog

## v1.4.0

### Breaking Changes
- **Removed skills** (with replacements): `feature` and `expand` → both replaced by `/extend` (branches on scope in Phase 3); `design-principles` and `implementation-principles` → merged into `/principles` (per-phase subsections); `stylistic-refactor-creator` and `structural-refactor-creator` → merged into `/refactor-conventions-creator` (generates `style/` and `structure/` reference subdirectories)
- Skill references in `tap.json` updated accordingly. Existing installs of the removed skills will continue to work locally but will not receive updates.

### New Skills
- **`/fix`** — diagnose-and-repair workflow: reproduce → bisect → write failing test → minimal fix → confirm. Distinct from a previously deleted `/fix` (that one consumed `VERIFICATION.md` from a since-removed `/verify` skill).
- **`/review`** — flexible-target peer review: branch diff, commit, commit range, working tree, unpushed commits, or PR by number. Produces Blocker / Important / Nit findings.
- **`/extend`** — replaces `/feature` + `/expand` with one skill that branches on scope after exploring the idea.
- **`/principles`** — replaces `/design-principles` + `/implementation-principles` with one skill that has per-phase guidance per principle.
- **`/refactor-conventions-creator`** — replaces the two creator skills with one that interviews about both axes and generates a single project-specific skill.

### Workflow Content Improvements
- **Pre-mortem step** added to `/design` (Phase 5.5), `/bold-refactor` (Phase 4 — softened to execution-planning), and `/refactor-design` (Phase 5 — advisory, acknowledges atomic refactors).
- **`/design` Phase 5 expanded** to require considering 2-3 architectural options and designing the trickiest unit first. Phase 6 (test design) elevated from a single paragraph to a substantive phase covering unit tests, integration points, and test data.
- **`/ideate` attacks the idea**: anti-vision and competitive landscape questions added to Discovery; new Phase 1.5 generates maximalist vs minimalist versions and forces the user to navigate the gap.
- **`/bold-refactor`** quantity target ("3-5 suggestions") removed in favor of "until you've exhausted the lenses." Added explicit "do nothing is valid" option in Phase 3 discussion.
- **`/refactor-design`** sub-agent briefs expanded from 3 to 4: Code Smells (incl. long files, deep nesting, god functions), Missing Abstractions, Pattern Violations & Naming, Dead Weight.
- **`/e2e-test-design`** output replaced with the standard implementation-units format so `/implement` and `/implement-orchestrator` can consume it directly.
- **`/test-quality`** Phase 1.5 audits tautological tests, rewrites recoverable ones as spec-derived tests, deletes the rest. Output report tracks tautological rework separately.
- **`/autopilot`** Phase 5 (Testing Passes) restructured into 5a/5b/5c (test the contract / test against reality / adversarial coverage) with explicit "find real bugs, not green checkmarks" framing. Decision-frameworks major-boundary triggers made concrete.
- **`patterns` skill mention** added to `/e2e-test-design`, `/test-quality`, `/cruft-cleaner` (skills that should conform to project patterns). Deliberately omitted from `/bold-refactor` and `/perf-design` (skills that exist to question or override patterns).

### Canonical Docs Structure (new convention)
Doc-producing skills now default to canonical paths in any project that uses them:
- Foundation docs → `docs/` flat (VISION.md, SPEC.md, ARCHITECTURE.md, ROADMAP.md)
- Feature briefs → `docs/features/{slug}.md` (from `/extend` small mode)
- Design docs → `docs/designs/{name}.md` with type prefixes for non-greenfield (`refactor-`, `perf-`, `bold-`, `e2e-`)
- Completed designs → `docs/designs/completed/` (`/implement` and `/implement-orchestrator` move them after successful verification using `git mv`)

`/update-documentation` gains a Phase 6 (Organize Docs) that audits the project's `docs/` folder against this layout, detects misplaced files, and offers to `git mv` them into the canonical structure.

### Internal
- Deleted `plugins/workflow/skills/repo-eval/repo-eval/` (verbatim duplicate directory)
- All principle-skill references in design, implement, implement-orchestrator, test-quality updated to point at `/principles`
- `tap.json` restructured to align with skilltap-author conventions: workflow + skill-authoring skills moved into inline TapPlugin definitions, all entries gain `trust.verified` metadata

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
