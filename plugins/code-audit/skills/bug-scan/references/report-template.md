# Bug-Scan Report Template

Use this structure for `bug-scan-report.md` or the path supplied with `--output`.
Drop empty sections only when explicitly marked optional.

```markdown
# Bug-Scan Report

**Generated**: <ISO-date>
**Scope**: <whole repo | path/glob>
**Files scanned**: <N>
**Overall score**: **<X.X/10>**

## Stack profile

- Languages: <list>
- Frameworks: <list>
- Data layer: <list>
- Concurrency primitives: <list>
- Notable entry points: <list>

## Domain scores

| Domain | Relevance | Score | Findings (C/H/M/L) |
|---|---|---|---|
| Concurrency & races | most/relevant/skip | X/10 | 0/0/0/0 |
| Async / promises | most/relevant/skip | X/10 | 0/0/0/0 |
| State & closures | most/relevant/skip | X/10 | 0/0/0/0 |
| Resource leaks | most/relevant/skip | X/10 | 0/0/0/0 |
| Time & numbers | most/relevant/skip | X/10 | 0/0/0/0 |
| Error handling | most/relevant/skip | X/10 | 0/0/0/0 |
| Data layer | most/relevant/skip | X/10 | 0/0/0/0 |
| Language footguns | most/relevant/skip | X/10 | 0/0/0/0 |

**Overall**: <X.X/10> - weighted average, most-relevant 2x and relevant 1x.

## Top 3 findings

1. **<title>** - `<file:line>` (<domain>, <severity>)
2. **<title>** - `<file:line>` (<domain>, <severity>)
3. **<title>** - `<file:line>` (<domain>, <severity>)

## Findings by severity

### Critical (<n>)

#### <title>
- **Domain**: <domain>
- **Pattern**: <pattern name from reference, or "new">
- **Location**: `<file:line>`
- **Evidence**:
  ```<lang>
  <1-5 lines of offending code>
  ```
- **Why it's a bug**: <specific failure mode>
- **Remediation direction**: <direction, not a finished fix>
- **Also flagged by**: <other domain, optional>

### High (<n>)

<same shape>

### Medium (<n>)

<same shape>

### Low (<n>)

<same shape; compress to one-liners if there are many>

## Domains skipped

| Domain | Why |
|---|---|
| <domain> | <e.g. no async code in scope> |

## Scanner gaps

- <domain>: <what went wrong, or "none">

## Recommended next steps

- <highest-priority repair direction>
- <second repair direction>
- Re-run `bug-scan` after fixes to verify the findings are gone.
```

## Rules

- Always include the stack profile and domain table.
- Group findings by severity, then domain.
- Sort within a severity group by relative file path.
- Do not repeat the same finding under multiple severities.
- Keep remediation as a direction, not implementation instructions.
