# Scanner Dispatch

Scanners are source-read-only workers scoped to one lane, one band, and one component. Their only
writes are assigned markdown packets under the campaign scratch directory.

## Dispatch Rules

- Dispatch all component scanners for one band in one parallel wave.
- Scope each scanner to its component file list plus inherited findings from narrower bands.
- If a scanner errors, record a coverage gap; do not blindly retry.
- If a scanner returns more than 25 findings, ask for the top 25 by severity and evidence.
- A scanner must not edit source files or final campaign docs.

## Brief Template

```markdown
You are a source-read-only scanner sub-agent for the <lane> lane at the <band> band.

Goal:
<campaign goal>

References - load FIRST:
<absolute paths from lane catalog>

Scope - scan ONLY these files:
<component file list>

Inherited findings from narrower bands:
<file:line + one-line summary pairs, or "none">

Stack profile:
<languages, frameworks, relevant primitives>

Write ONLY these packets:
- raw: code-audit/scan-<goal>/.artifacts/raw/<lane>/<band>/<component>.md
- candidates: code-audit/scan-<goal>/.artifacts/candidates/<lane>/<band>/<component>.md
- status: code-audit/scan-<goal>/.artifacts/status/<lane>/<band>/<component>.md

Method:
1. Load the references and apply their named patterns.
2. If version-sensitive, web-search 1-3 times for current pitfalls.
3. Apply detection signals; read flagged sites in context.
4. Consider how inherited findings interact with this component.

For each confirmed finding:
- Title
- Lane / band
- Pattern
- Severity: Critical | High | Medium | Low
- Location: file:line
- Evidence: 1-5 lines of code, or expected behavior source for test gaps
- Why it matters
- Remediation direction
- Fix locality: local | module | cross-cutting

Rules:
- Cite file:line.
- Confirm in context; grep hits alone are not findings.
- Empty is valid.
- Do not implement fixes.
- Stay in scope.
- Skip inherited findings unless they compose into a wider issue.

Return only: wrote <raw> <candidates> <status>
```

## Severity Rubric

| Severity | Meaning |
|---|---|
| Critical | Realistic data loss, corruption, hang, wrong outcome, active exploitability, or equivalent severe failure |
| High | Incorrect behavior, crash, serious degradation, or high-risk gap under uncommon-but-real conditions |
| Medium | Real issue with limited blast radius or harder trigger |
| Low | Edge case, latent issue, defensive improvement, or advisory-only finding |

Lane-specific references can refine the meaning, especially performance and tests.

## Recording Findings

The orchestrator spot-checks scanner candidates, drops grep-only or fabricated entries, dedupes
within the band, and appends accepted findings to `02-findings-ledger.md`.

Roll accepted findings up by explicit component membership from `01-component-map.md`; do not rely on
path prefixes alone.
