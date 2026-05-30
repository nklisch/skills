# Triggering & Evaluation

How to produce a trigger-test plan and behavioral test scenarios for a skill, and what to recommend
for measuring it. The auditor *designs* these tests; the author *runs* them. This mirrors the current
evaluation-first practice: a skill's evals are the source of truth for whether it works.

## Contents

- [Why evaluation-first](#why-evaluation-first)
- [Description pushiness (anti-undertrigger)](#description-pushiness-anti-undertrigger)
- [Trigger-test protocol](#trigger-test-protocol)
- [Behavioral scenarios](#behavioral-scenarios)
- [Baseline & capability obsolescence](#baseline--capability-obsolescence)
- [Cross-model testing](#cross-model-testing)
- [Variance pathologies to watch](#variance-pathologies-to-watch)
- [Sources](#sources)

## Why evaluation-first

The strongest current guidance is to build evaluations **before** polishing documentation: run the
model on representative tasks *without* the skill, document where it fails, write at least three test
scenarios, establish a no-skill baseline, then add the minimum instructions needed to pass. Evals are
the source of truth — the auditor's job is to hand the author a runnable test plan, not just opinions.

## Description pushiness (anti-undertrigger)

Claude tends to **under-trigger** skills — to not reach for them when they'd help. A good description
counteracts that by naming the situations to use it in, including ones where the user won't say the
skill's name. Score this explicitly under Activation Reliability.

- **Weak:** "Creates data dashboards."
- **Pushy (good):** "Creates data dashboards. Use this whenever the user mentions dashboards, metrics,
  KPIs, or internal reporting — even if they don't explicitly ask for a 'dashboard'."

Pushy is not vague: keep the keywords specific so it doesn't *over*-trigger on adjacent domains.

## Trigger-test protocol

Generate a query set that proves the skill fires when it should and stays silent when it shouldn't.

- **8-10 should-trigger queries** — realistic, concrete, multi-step tasks where the skill genuinely
  helps (include file paths, names, backstory).
- **8-10 should-NOT-trigger queries** — **near-misses**: they share keywords or domain with the skill
  but need something different, or are adjacent/ambiguous. These are what catch over-triggering.
- **Run each query 3×** and record the trigger rate (triggering is probabilistic).
- **Hold out ~40%** of the queries as a test set; if iterating on the description, optimize on the
  train split and select the best description by the **held-out** score to avoid overfitting.
- Keep queries **substantive** — trivial one-step prompts ("read this file") may not trigger any skill
  regardless of description, so they produce false negatives.

## Behavioral scenarios

Beyond triggering, test what the skill *does* once loaded. 3-5 scenarios:

```
### Scenario N: {name}
**What to test:** {dimension being tested — a stated capability or a type-specific failure mode}
**Prompt:** "{exact text to paste into a fresh session}"
**Expected behavior:** {what a well-functioning skill should do}
**Failure signal:** {what indicates the skill isn't working}
```

Draw scenarios from the skill's stated purpose, the type-specific failure modes in the matching
rubric, and edge cases (unusual inputs, partial information, conflicting instructions).

## Baseline & capability obsolescence

Always recommend running each behavioral scenario **with the skill and against a no-skill baseline**.
Two outcomes matter:

- If the model **fails** without the skill and **passes** with it, the skill is earning its keep.
- If the model **already passes** without the skill, flag possible **capability obsolescence** — the
  skill's technique may no longer be necessary as base models improve.

For real pass-rate and variance numbers, point the author at a benchmark harness (for example, the
`skill-creator` skill's Eval and Benchmark modes), which run with-skill and baseline together and
report mean ± stddev with a delta.

## Cross-model testing

Recommend testing across the models the skill will run on (e.g. Haiku, Sonnet, Opus). What is
sufficient for a stronger model may need more explicit detail for a smaller one.

## Variance pathologies to watch

When the author runs a benchmark, these patterns hide in the aggregate — call them out so the author
looks for them:

- **Non-discriminating assertions** — pass whether or not the skill is loaded (they test nothing).
- **High-variance / flaky evals** — large run-to-run swings signal **ambiguous skill instructions**;
  persistent ambiguity that rewording can't fix is a signal to split the skill.
- **Time/token trade-offs** — a skill that is slower but more accurate (or the reverse); make the
  trade-off explicit rather than hidden.

## Sources

- Claude platform docs — Agent Skills best practices (evaluation-first, Claude A/B, cross-model): https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices
- anthropics/skills — skill-creator SKILL.md (trigger-test protocol, pushiness): https://github.com/anthropics/skills/blob/main/skills/skill-creator/SKILL.md
- Anthropic — Improving skill-creator: test, measure, and refine: https://claude.com/blog/improving-skill-creator-test-measure-and-refine-agent-skills
- Anthropic — Equipping agents for the real world with Agent Skills: https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills
