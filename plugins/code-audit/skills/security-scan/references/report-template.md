# Security-Scan Report Template

Use this structure for `security-scan-report.md` or the path supplied with `--output`.

```markdown
# Security Scan Report

**Generated**: <ISO-date>
**Scope**: <whole repo | path/glob>
**Files audited**: <N>

## Security surface profile

- Languages / frameworks: <list>
- Public entry points: <routes/CLIs/workers>
- Auth/session approach: <summary>
- Data stores / external services: <list>
- Deployment surface: <Docker/CI/cloud/unknown>
- Secret/config posture: <summary>

## Domain coverage

| Domain | Relevance | Result |
|---|---|---|
| Authentication & Authorization | most/relevant/skip | <counts or skipped reason> |
| Input Validation & Injection | most/relevant/skip | <counts or skipped reason> |
| Secrets & Configuration | most/relevant/skip | <counts or skipped reason> |
| Dependencies & Supply Chain | most/relevant/skip | <counts or skipped reason> |
| Data Protection | most/relevant/skip | <counts or skipped reason> |
| API Security | most/relevant/skip | <counts or skipped reason> |
| Infrastructure & Deployment | most/relevant/skip | <counts or skipped reason> |
| Cryptography | most/relevant/skip | <counts or skipped reason> |
| Error Handling & Logging | most/relevant/skip | <counts or skipped reason> |

## Findings by severity

### Critical (<n>)

#### <title>
- **Domain**: <domain>
- **Location**: `<file:line>`
- **Evidence**:
  ```<lang>
  <1-5 lines>
  ```
- **Attack or exposure path**: <concrete path>
- **Remediation direction**: <direction, not a finished fix>

### High (<n>)

<same shape>

### Medium (<n>)

<same shape>

### Low (<n>)

<same shape; compress to one-liners if many>

## Dependency and supply-chain notes

- <lockfile/audit/dependency finding or "not assessed">

## Scanner gaps

- <domain>: <gap or "none">

## Recommended fix order

1. <Critical/High fix direction>
2. <next fix direction>
3. <hardening follow-up>
```

## Rules

- Every finding needs code evidence and security impact.
- Do not include Info-only observations in the findings list.
- Keep remediation directions implementation-neutral.
