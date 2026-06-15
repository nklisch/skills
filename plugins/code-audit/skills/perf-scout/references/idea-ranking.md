# Idea Ranking — Perf-Scout

> How the orchestrator ranks candidate ideas in Phase 4 and scores each lens.
> This is a triage tool for **what to investigate first**, not a claim about
> realized gains. Nothing here asserts a speedup is real — the ranking sorts
> *hypotheses* by how worth-chasing they look.

## The three per-idea axes

Each scout already tags every idea on three axes. Use them as the inputs to the
priority tier.

| Axis | Question | Values |
|---|---|---|
| **Leverage** | If this idea pans out, how big is the plausible upside? | High / Medium / Low |
| **Applicability** | How likely is it that this code actually fits the pattern? | Likely / Plausible / Speculative |
| **Cost** | How much work + risk to try it (implementation effort, correctness/behavior risk, memory tradeoff)? | Low / Medium / High |

Note the asymmetry: **Leverage** and **Applicability** are about *upside and fit*;
**Cost** is the *price of finding out*. A cheap experiment with uncertain payoff
can still rank high — the point is to surface what's worth a measurement.

## Priority tiers

Combine the axes into one of three tiers. The spirit: reward high plausible
upside and high fit, discount by cost/risk.

| Tier | Rough rule | Meaning |
|---|---|---|
| **Investigate-first** | High Leverage AND Applicability ≥ Plausible AND Cost ≤ Medium | Strong, well-located bet. Hand to a profiling or benchmark pass to measure now. |
| **Worth-a-look** | (High Leverage with High Cost) OR (Medium Leverage with Applicability ≥ Plausible) | Real candidate; needs a closer look or a cheap experiment before committing. |
| **Long-shot** | Everything else — Low Leverage, or Speculative applicability, or High cost with modest upside | Keep on the deck for completeness; chase only if the obvious wins are exhausted. |

Two tie-breakers, in order:
1. **Cheaper-to-validate wins.** Between two same-tier ideas, rank the one that's
   easier to confirm (a quick benchmark) above the one needing a big rewrite to
   even test.
2. **Borrowed-from novelty.** A non-obvious idea from a different domain (a game
   engine layout trick on a web service) ranks above a generic one of equal
   tier — surfacing the unexpected is this skill's reason to exist.

## "Top 5 to investigate first"

After tiering, pick the five strongest Investigate-first ideas (fall through to
Worth-a-look if fewer than five qualify) for the report's headline callout and
the user summary. Spread them across lenses where possible — five ideas from one
lens is less useful than five angles from five domains.

## Lens opportunity-density score (0-10)

Score each lens for how much *plausible headroom* it surfaced. This is an
**opportunity** signal — high means "lots to chase here," NOT "the code is bad."
A low score is good news (little obvious headroom in that dimension).

| Score | Meaning |
|---|---|
| 0-2 | Lens barely applies, or only Long-shot ideas. Little headroom in this dimension. |
| 3-4 | A few Worth-a-look ideas; no strong bets. Modest headroom. |
| 5-6 | Several Worth-a-look or one Investigate-first. Real headroom worth a pass. |
| 7-8 | Multiple Investigate-first ideas, well-located. Rich headroom — prioritize this lens. |
| 9-10 | Many high-leverage, well-located, cheap-to-validate ideas. Exceptional headroom; likely the highest-value place to dig. |

There is **no overall code score** — unlike bug-scan, a high number here is an
invitation to investigate, not a verdict on quality. Report per-lens densities
and let the Top-5 callout carry the headline.

## Honesty guardrails

- Tiers rank *hypotheses*, not measured wins. The report and summary must keep
  that framing: "ranked candidates to investigate," never "ranked improvements."
- An idea's tier can be high while its Applicability is Speculative — that's fine,
  it just means "high upside if it fits, worth a quick check." Don't launder
  Speculative into Likely to inflate the tier.
- If you can't articulate a validation path for an idea, it doesn't belong on the
  deck at any tier — drop it.
