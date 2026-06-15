# Lane Catalog

A lane is a scan domain selected at kickoff. In a campaign, lanes load references and dispatch
scoped scanners. Do not invoke specialist skills mid-campaign.

## correctness

- **References**: `../bug-scan/references/` domain files.
- **Fan-out**: `bug-domain x component`, filtered by relevance.
- **Findings**: confirmed correctness bugs with severity, evidence, and remediation direction.
- **Standalone alternative**: `bug-scan <path>`.

## performance

- **References**: `../perf-scout/references/`, especially strategy lens files and
  `idea-ranking.md`.
- **Findings**: speculative optimization hypotheses, ranked as Investigate-first, Worth-a-look, or
  Long-shot. Never claim measured speedups.
- **Standalone alternative**: `perf-scout <path>`.

## quality / holistic

- **References**: `../repo-eval/references/`.
- **Findings**: dimension scores, verified deficiencies, and recommendations. Best at subsystem and
  system altitudes.
- **Standalone alternative**: `repo-eval <path>`.

## architecture / bold

- **References**: `../bold-refactor/SKILL.md` conceptual lenses and anti-patterns.
- **Findings**: bold reconceptions, not routine cleanup.
- **Altitude**: subsystem and system only.
- **Standalone alternative**: `bold-refactor <path>`.

## tests

- **Method**: derive expected behavior from specs, public contracts, docs, signatures, or observable
  behavior. If no source of expected behavior exists, report a documentation/spec gap rather than
  inventing a test expectation.
- **Findings**: missing coverage, weak assertions, over-mocking, stale fixtures, flaky timing, order
  dependence, missing harnesses, property/fuzz opportunities.
- **Standalone alternative**: `test-scan <path>`.
- **Severity**:
  - Critical: required behavior has no meaningful test.
  - High: boundary/error behavior is untested.
  - Medium: valid partition or rule combination is missing.
  - Low: complementary coverage or quality improvement.

## security

- **Method**: choose domains relevant to the stack: auth, authorization, injection, secrets,
  dependency hygiene, API exposure, crypto, transport, data protection, error leakage.
- **Findings**: cite concrete file:line evidence and exploitability or exposure path.
- **Guardrail**: do not report generic vulnerability classes without code evidence.
- **Standalone alternative**: `security-scan <path>`.

## structure / refactor

- **Method**: hunt behavior-preserving structural issues: duplication, misplaced responsibilities,
  dependency direction, god modules, repeated conditionals, naming drift, dead abstractions.
- **Hard rule**: apply the black-box test. If the recommended change would alter public behavior or
  caller contracts, classify it as behavior work, not refactor.
- **Intent guard**: documented project patterns are not findings unless the code is violating them.

## custom

Build a bespoke scanner brief from the user's goal. Name the concrete signal to hunt, list detection
heuristics, and require in-context confirmation like every other lane.

## Choosing Bands By Lane

| Lane | Typical bands |
|---|---|
| correctness | leaf -> module -> subsystem -> system |
| security | leaf -> module -> subsystem -> system |
| tests | module -> subsystem -> system |
| performance | module -> subsystem -> system |
| quality / holistic | subsystem -> system |
| structure / refactor | leaf -> module, with subsystem if cross-cutting |
| architecture / bold | subsystem -> system |

Confirm the actual band set with the user in the plan.
