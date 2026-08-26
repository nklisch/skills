# Verification Rigor

Verification rigor controls which semantic checks a completed research brief
must pass. It does not control source count, investigation breadth, research
duration, or agent fan-out.

Resolve the effective level from an explicit user instruction, then
`.research/CONVENTIONS.md`, then `adaptive`. State the resolved level in the
research reply. `adaptive` selects the lowest level that credibly fits the
decision's relevance, consequence, uncertainty, novelty, source disagreement,
synthesis complexity, and corpus breadth. Do not use fixed source-count or
agent-count thresholds.

## Floor

Apply the grounding discipline, run the deterministic lint and index checks,
and have the lead spot-check each load-bearing conclusion against its cited
attested details. This is the minimum at every level.

## Standard

Apply the floor, then run one semantic source-support pass. Give the reviewer
the final brief, attestations, cited passages, and lint output. For every
load-bearing claim, classify support as supported, partial, unsupported, or
missing. Check qualifier distortion, contradiction smoothing, project
principles presented as evidence, and attestations too thin to justify the
synthesis. Prefer a fresh context when the handoff earns its cost; when the
lead performs the pass inline, disclose that it was not independent.

## Full

Apply standard, then use an isolated evaluator to detect coverage, framing, and
scope drift. Give it only the original question, accepted decision boundary,
declared product constraints, and final synthesis. Do not give it sources,
attestations, orchestration notes, research history, or arbitrary foundation
documents. Ask whether the synthesis answers the actual decision, omits a
material perspective, silently changes scope, hides unresolved contradiction,
or makes claims that appear insufficiently grounded.

True isolation is part of `full`. If no isolated evaluator is available, do
not claim the full gate passed; disclose the limitation and ask the user how to
proceed when it affects the requested outcome.

## Convergence and authority

Revise the brief, rerun deterministic checks, and rerun only the affected
semantic gate after an accepted finding. Stop after the same failure recurs
twice without material progress and surface the blocker instead of looping.

Read repository-wide and applicable scope-owned principles as product and
decision lenses. Principles can reveal a missing question or bad recommendation,
but they are never source evidence and must not be cited as external support.
