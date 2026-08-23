# Scanner Postures

Select the posture from the kind of claim a scan should produce. A lens says
where to look; a posture says what evidence makes the result honest.

## Verified defect

Use for bugs, vulnerabilities, broken contracts, and stale truth.

- Cite the authoritative expectation and concrete location.
- Show the failure, contradiction, attack, or exposure path in context.
- Distinguish severity from confidence.
- Drop theoretical concerns that cannot affect this project as described.
- Return an empty result rather than filling a quota.

## Evidence gap

Use when the consequential problem is that behavior, ownership, risk, or an
external dependency cannot be established.

- State what decision the missing evidence prevents.
- Name the smallest investigation, test, source lookup, or prototype that would
  resolve it.
- Do not relabel uncertainty as a defect.

## Improvement hypothesis

Use for performance, maintainability, developer experience, and operational
ideas that need validation.

- Locate the relevant behavior or structure.
- Explain why the idea might help and under what workload or constraint.
- Give a concrete benchmark, trace, experiment, comparison, or observation path.
- State cost, downside, and a credible no-change case.
- Never claim an unmeasured gain.

## Drift verification

Use when comparing an existing authority or expectation with current project
truth.

- Identify the owning source and exact assertion or rule.
- Verify whether it describes current or intended-future state.
- Cite the contradicting implementation or newer authority.
- Missing coverage is not drift unless the authority requires coverage.
- Replace stale truth in place when later selected for work; Git carries history.

## Provocation

Use for bold architectural rethink or deep simplification.

- Generate ambitious alternatives without confusing novelty with value.
- Require concrete repository evidence, the complexity that disappears, the
  hardest migration risk, and the do-nothing case.
- Challenge each proposal — inline, or through a fresh-context pass when
  consequence or uncertainty justifies one — and let that challenge kill or
  narrow it.
- Treat behavior or guarantee changes as human-owned decisions.

## Evaluation

Use when the user wants comparative health, quality, or maturity rather than a
specific defect hunt.

- Establish dimensions from the request and project type.
- Verify both positive and negative claims directly.
- Report verified strengths and weaknesses together; strengths are findings,
  not disposition candidates.
- Calibrate scores or rankings against an explicit rubric if scores are useful;
  do not force scoring when recommendations answer the question better.
- Preserve discrepancies and evidence limits.
- Only actionable weaknesses or improvement opportunities continue into the
  disposition flow.

## Shared dispatch contract

Every scanner receives the full bounded question, relevant project truth,
selected posture and lens, allowed file or subsystem scope, existing findings
to avoid duplicating, and the requested output shape. Scanners read source and
return proposals only. They do not edit files, create reports, write Workbench
state, implement fixes, or spawn nested agents.

The orchestrator verifies and consolidates. Model strength, reasoning depth,
number of passes, source lookup, and tools adapt to consequence and uncertainty;
no fixed topology is part of the posture.
