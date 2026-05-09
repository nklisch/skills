# Report Template

Use this structure for the final evaluation output.

## Format

```markdown
# Repository Evaluation: {repo name}

## Summary

{2-3 sentences: what the project is, primary language/framework, overall impression}

{1 sentence: total LOC, crate/package count, test count}

---

## Scorecard

| Dimension | Score | Evidence |
|-----------|-------|----------|
| Architecture & Design | X/10 | {1-line verified finding} |
| Code Quality | X/10 | {1-line verified finding} |
| Error Handling | X/10 | {1-line verified finding} |
| Testing | X/10 | {1-line verified finding} |
| Documentation | X/10 | {1-line verified finding} |
| CI/CD & Automation | X/10 | {1-line verified finding} |
| Security Posture | X/10 | {1-line verified finding} |
| Developer Experience | X/10 | {1-line verified finding} |
| Maintainability | X/10 | {1-line verified finding} |
| **Overall** | **X.X/10** | |

---

## Dimension Details

### 1. Architecture & Design — X/10

**Verified positives:**
- {finding with file path or grep evidence}

**Verified concerns:**
- {finding with file path or grep evidence}

**Verification notes:**
- {any discrepancies between agent claims and direct checks}

{Repeat for each dimension}

---

## Verification Summary

| Check | Result | Notes |
|-------|--------|-------|
| CI exists | PASS/FAIL | {what was found} |
| Test count | {N} verified | Agent claimed {M} |
| ... | ... | ... |

{N of M checks passed. K discrepancies found.}

---

## Top 5 Recommendations

1. **{Title}** (Dimension: {name}, current score: X)
   {1-2 sentences: what to do, why it matters, which files to start with}

2. ...

3. ...

4. ...

5. ...
```

## Notes

- Always include the verification summary table — it's the trust signal
- File paths in evidence should be relative to repo root
- Discrepancies must be called out explicitly, not buried
- Recommendations should be actionable (name files, patterns, tools)
- Overall score uses weighted average per rubric weighting formula
