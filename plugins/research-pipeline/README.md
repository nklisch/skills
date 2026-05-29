# research-pipeline

Research-grounded pipeline plugin for projects using the `agile-workflow` substrate. Adds research-first planning, architecture rigor, knowledge-index integration, and cascading doc review.

This plugin is **additive**: it does not modify `agile-workflow`. It layers research/planning skills on top of the substrate so work hits the `.work/` queue with research grounding already done.

## What's in here

| Layer | Skills |
|---|---|
| **Research family** (three scales) | `/research` (question, ~$3-5), `/deep-research` (domain, ~$12-15), `/research-program` (megatopic, ~$35-75) |
| **Prior art** | `/scout` |
| **Foundation docs** | `/ideate` (super-layer: produces VISION/SPEC/ARCHITECTURE + research-plan + PRINCIPLES), `/architecture` |
| **Substrate planning** | `/epicize`, `/epic-design`, `/feature-design`, `/update-epicize`, `/brief` |
| **Quality** | `/doc-review` (cascading), `/quality-checkpoint` (orchestrates 7 gates), `/test-quality`, `/security-review` |
| **Lifecycle** | `/init-project`, `/expand`, `/update-documentation`, `/knowledge-index` |
| **Auto-loaded** | `/engineering-principles` (code-design), `/build-process` (methodology) |

## Skill catalog

See the [top-level README](../../README.md) for the full catalog.

## Compatibility with agile-workflow

This plugin operates on Nathan Klisch's `agile-workflow` substrate. Same `.work/` format, same frontmatter schema, same `work-view` query tool. On shared projects, our skills check tags (`[needs-brief]`, `[needs-research]`) to decide when to run; his skills ignore them.

**Where we extend his skills**: `gate-infra` is added in `plugins/agile-workflow/` (his namespace), and our `quality-checkpoint` orchestrator invokes his gates with optional extension policies (cascading doc-review on top of his `gate-docs`, spec-driven coverage on top of his `gate-tests`).

**Where we don't duplicate**: `implement`, `implement-orchestrator`, `cruft-cleaner`, `bold-refactor`, `repo-eval`, `e2e-test-design`, `extract-patterns`, `refactor-design`, `feature`, `release` — defer to his.

## Naming collisions

Two skills exist in both plugins:
- `/ideate` — ours is the canonical entry for our workflow (produces all Nathan's foundation docs + research-plan + auto-`/scout`). His `/agile-workflow:ideate` remains available but is redundant for our users.
- `/research` — ours has three tiers (`/research`, `/deep-research`, `/research-program`); his is a single-shot reference helper. Use ours for substantive investigation.

Disambiguate via namespace when needed: `/research-pipeline:ideate` vs `/agile-workflow:ideate`.
