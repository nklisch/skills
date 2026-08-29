# Overbuilding patterns in documents

Signals to look for in foundation, spec, architecture, engineering, and operations
documents, with the question to ask and the simpler default. Findings are relative to the
calibration; a pattern is only a finding when the answer to its question is "nobody" or
"nothing yet".

## Contents

1. Proof phrased as requirement
2. Verification layers and matrices
3. Drift rituals
4. Contract commitments without consumers
5. Configurability without configurers
6. Speculative seams
7. Topology sprawl
8. Operations volume ahead of incidents
9. Duplicate gates
10. Altitude leaks
11. Purity rules with hidden cost
12. Narration and enumeration

## 1. Proof phrased as requirement

- **Signal:** "must be proven by", "verified through", "exercised periodically", "recorded
  beside", "compared against" appearing in normative sections.
- **Question:** what is the guarantee underneath, and does the document need to name the
  proof at all?
- **Simpler default:** state the guarantee; let implementation pick the proof and record it
  in an engineering doc or test name.

## 2. Verification layers and matrices

- **Signal:** a table of five to seven test "layers" each with required coverage; a
  permanent failure or chaos matrix (process death, redelivery, shutdown windows).
- **Question:** which of these has caught a real defect here, and which duplicates a
  framework's own suite?
- **Simpler default:** unit plus integration with traits; run failure scenarios once during
  a framework spike; keep a few in-process fault-injection tests.

## 3. Drift rituals

- **Signal:** generated code or contracts committed, regenerated in CI, and "unexplained
  drift" blocking release; post-deployment checks that an artifact matches the build.
- **Question:** who consumes the committed artifact, and what does drift break today?
- **Simpler default:** generate during the build or as a CI artifact; add comparison when an
  external consumer depends on the shape.

## 4. Contract commitments without consumers

- **Signal:** "versioned contract", compatibility windows, deprecation policy, or event
  schema registries with no live consumer.
- **Question:** who would be broken by a change today?
- **Simpler default:** provisional, schema-identified contract; compatibility is earned when
  the first consumer integrates.

## 5. Configurability without configurers

- **Signal:** fine-grained grants, feature profiles, allowlists, retention holds, role
  engines, "the interface accepts a scope for later".
- **Question:** who sets this value, and how many distinct values exist?
- **Simpler default:** a boolean or a fixed bundle; add granularity when a second real value
  appears.

## 6. Speculative seams

- **Signal:** "so that later", "preserves the option", ports with one adapter and no
  isolation need, sibling variants reserved for a future payload.
- **Question:** is there a named second implementation with a date, or a real isolation or
  security boundary?
- **Simpler default:** the concrete implementation; a seam costs nothing to add when the
  second case arrives if the first is kept plain.

## 7. Topology sprawl

- **Signal:** a deployable per job, a project per test kind, several projects for one
  provider adapter, a service per module for one team, minimum instance counts that
  exceed the team.
- **Question:** how many runtime processes actually exist, and could one image with
  different commands serve them?
- **Simpler default:** one codebase with a few entrypoints; jobs share the worker image.

## 8. Operations volume ahead of incidents

- **Signal:** several dashboards, tiered paging, many runbooks, budgets, quotas, drills, and
  named owners "before launch" for a system with no traffic.
- **Question:** which of these would have been written after the first real incident anyway,
  and which is needed to survive the first week?
- **Simpler default:** one flow dashboard, alerts for "intake failing", "work stopped",
  "dead letters present", "service or database down"; runbooks for replay, rollback, and
  credential rotation; grow from incidents.

## 9. Duplicate gates

- **Signal:** the same guarantee required at two stages (local load test plus deployment
  gate; build-time style analyzers plus formatter plus review rule).
- **Question:** which single gate is authoritative?
- **Simpler default:** keep the gate closest to the risk; delete the echo.

## 10. Altitude leaks

- **Signal:** framework names and quirks in a spec; hosting and cloud products in a vision;
  thresholds, retry counts, topic names, or connection-pooling advice in principles.
- **Question:** would this sentence survive a framework or host change?
- **Simpler default:** guarantees in foundation; mechanisms in engineering or provisional
  design; vendor facts in research.

## 11. Purity rules with hidden cost

- **Signal:** bans that require a compensating mechanism — internal identifiers excluded
  from logs plus a correlation resolution query; wall-clock banned everywhere plus clock
  injection through non-decision code; exactly-once language.
- **Question:** what does the rule protect, and is the compensating mechanism cheaper than
  the risk?
- **Simpler default:** exclude what is actually sensitive; allow opaque internal
  identifiers; inject the clock only where a decision depends on time.

## 12. Narration and enumeration

- **Signal:** sentences rebutting a prior proposal ("exploratory designs do not…"), lists
  of cloud products, repeated "software serving X" pedantry.
- **Question:** does a new reader need this to act correctly?
- **Simpler default:** state the rule; keep vendor names to the one place that owns them.
