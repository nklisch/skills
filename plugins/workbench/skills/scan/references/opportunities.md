# Opportunity Consolidation and Disposition

## Opportunity shape

Present each coherent cluster with:

- **Opportunity** — a product or engineering outcome, not a warning title.
- **Type** — confirmed defect, drift, evidence gap, improvement hypothesis,
  architectural provocation, or evaluation weakness.
- **Observed** — the concrete behavior, structure, or uncertainty.
- **Evidence** — authoritative expectation and `file:line` or other resolvable
  pointers; identify inference separately.
- **Confidence and impact** — concise calibrated judgments with reasons.
- **Why it matters** — consequence for this project's users, operation, or
  maintainers.
- **Likely boundary** — the smallest coherent surface that would own a response.
- **Validate by** — required for uncertain claims; omit when already verified.
- **Recommendation** — discard, investigate, park, activate, or accept.

Use severity only where the lens has a meaningful consequence model. Do not
convert scanner vocabulary mechanically across unrelated lenses.

## Consolidation rules

Cluster findings when one outcome would resolve them together. Split when they
have different owners, requirements, risk decisions, or independently valuable
results. A shared file is not enough to merge; repeated symptoms of one root
cause usually are.

Preserve the strongest evidence, representative locations, and material
exceptions. Do not create one opportunity per file, warning, test gap, or
scanner. Separate adjacent discoveries from in-scope findings.

## User disposition

Verified evaluation strengths are reported directly and carry no disposition;
only actionable weaknesses or opportunities enter this flow. Recommend a
disposition, then let the user decide what survives:

- **Discard / non-issue** — evidence does not justify action or the project
  intentionally accepts the current shape.
- **Investigate** — uncertainty is consequential; propose the smallest research,
  prototype, measurement, or focused scan that could resolve it.
- **Park** — useful outcome with enough context to remember, but not current
  scope. Create one `.work/backlog/` stub through `park` only after selection.
- **Activate** — the user wants the outcome worked now. Hand it to `work` or
  `design`; scan itself does not create active remediation.
- **Accepted risk / exception** — record only in a location or authority the
  project has designated for such decisions in `.work/CONVENTIONS.md`. Do not
  invent an exception ledger.

For a large deck, ask about clusters or recommended groups rather than forcing a
question per finding. Preserve custom user dispositions in ordinary language.

## Backlog stubs

A selected backlog item contains the outcome, why it may matter, concrete
evidence, confidence or uncertainty, and any relationship to current work. It
does not invent priority, acceptance criteria, design, estimates, assignment, or
implementation sequence. Low-level findings remain evidence inside the coherent
product-level stub.
