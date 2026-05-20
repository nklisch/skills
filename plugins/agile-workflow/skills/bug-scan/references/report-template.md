# Bug-Scan Report Template

> Used by `bug-scan` in **standalone mode** to write `bug-scan-report.md` at repo root.
> Fill the placeholders. Drop sections with zero entries.

```markdown
# Bug-Scan Report

**Generated**: <ISO-date>
**Scope**: <"whole repo" OR path glob>
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
| Concurrency & races | most | X/10 | 0/1/2/3 |
| Async / promises | most | X/10 | 0/0/1/2 |
| State & closures | relevant | X/10 | 0/0/0/1 |
| Resource leaks | most | X/10 | 1/0/1/0 |
| Time & numbers | relevant | X/10 | 0/0/0/2 |
| Error handling | most | X/10 | 0/2/1/0 |
| Data layer | most | X/10 | 0/1/3/1 |
| Language footguns | relevant | X/10 | 0/0/2/4 |

**Overall**: <X.X/10> — weighted average (most-relevant 2x, relevant 1x).

## Top 3 critical findings

1. **<title>** — `<file:line>` (<domain>, <severity>)
2. **<title>** — `<file:line>` (<domain>, <severity>)
3. **<title>** — `<file:line>` (<domain>, <severity>)

## Findings by severity

### Critical (<n>)

#### <title>
- **Domain**: <domain>
- **Pattern**: <pattern name from reference, or "new">
- **Location**: `<file:line>`
- **Parked**: `bug-scan-<slug>` *(or `not parked: --no-park` / `not parked: no substrate` /
  `duplicate of bug-scan-<slug>` if skipped via idempotency)*
- **Evidence**:
  ```<lang>
  <1-5 lines of offending code>
  ```
- **Why it's a bug**: <1-2 sentences — the specific failure mode>
- **Remediation direction**: <direction, not finished fix>
- *Also flagged by*: <other domain, if duplicate>

<repeat for each Critical>

### High (<n>)

<same shape>

### Medium (<n>)

<same shape>

### Low (<n>)

<same shape — can be compressed to one-liners if many>

## Domains skipped

| Domain | Why |
|---|---|
| <domain> | <e.g. "no async code in scope", "no DB usage detected"> |

## Backlog parking summary

| Metric | Count |
|---|---|
| Findings parked this run | <n> |
| Duplicates skipped (already in backlog) | <n> |
| Refreshed (existing item, still applies, `created` updated to today) | <n> |
| Opt-out (`--no-park`) | true / false |
| Substrate present | true / false |

> All parked items live at `.work/backlog/bug-scan-*.md` with `bug_origin: scan`. Elevate any
> of them to active stories via `/agile-workflow:scope <id>`. Find them all with:
> `grep -l '^bug_origin: scan$' .work/backlog/*.md`.

## Scanner gaps

> If any scanner returned an error or inconclusive results, list it here.
> The user can re-run that domain alone if they want.

- <domain>: <what went wrong, or "—" if all clean>

## Next steps

- Hand the Criticals to `/agile-workflow:fix <id>` for immediate repair.
- `/agile-workflow:scope` to promote findings into tracked items.
- Re-run after fixes to verify resolution.
```

## Rules

- Always include the stack profile even if short.
- Show the domain table even when most rows are zero — empty rows signal coverage.
- Group findings by severity, then by domain within each severity.
- Sort within a severity group by file path (predictable diff-friendly).
- Don't repeat the same finding under multiple severities — pick the highest and cross-link.
