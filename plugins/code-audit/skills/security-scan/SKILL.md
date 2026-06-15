---
name: security-scan
description: >
  Standalone security review and vulnerability scan that writes a markdown report only. Use when the
  user asks for a security review, security scan, vulnerability audit, threat-oriented code review,
  dependency/security hygiene pass, or to inspect auth, injection, secrets, API security,
  infrastructure, cryptography, data protection, or logging risks without adopting agile-workflow.
  Discovers the stack, selects relevant security domains, runs read-only domain audits, classifies
  severity, and writes security-scan-report.md.
---

# Security-Scan

Run a standalone security audit over a repository or scoped path and write a markdown report. This
skill never writes `.work/` items, gates, backlog files, or commits.

## Invocation

- `security-scan` — scan the whole repo.
- `security-scan <path>` — scope to a directory, file, or glob.
- `security-scan --domains auth,injection,secrets` — restrict to named domains.
- `security-scan --output <path>` — write somewhere other than `security-scan-report.md`.

## Security Domains

Select only domains relevant to the stack and scope:

| Domain | What to inspect |
|---|---|
| Authentication & Authorization | Auth flows, sessions, RBAC/ABAC, tokens, password policies, object-level authorization |
| Input Validation & Injection | XSS, SQL injection, command injection, path traversal, template injection, SSRF |
| Secrets & Configuration | Hardcoded secrets, env leakage, insecure defaults, `.env` in VCS, exposed config |
| Dependencies & Supply Chain | Known CVEs, lockfile integrity, typosquatting risk, unnecessary or stale deps |
| Data Protection | PII handling, encryption in transit/at rest, log sanitization, retention/deletion |
| API Security | Rate limits, CORS, auth on endpoints, mass assignment, response leakage |
| Infrastructure & Deployment | Dockerfile, CI/CD secrets, exposed ports, IAM, container hardening, network policy |
| Cryptography | Weak algorithms, RNG, cert validation, hardcoded keys, key management |
| Error Handling & Logging | Stack traces, verbose production errors, PII in logs, audit trail gaps |

## Phase 1: Stack Discovery

Read manifests and deployment/config files: `package.json`, lockfiles, `Cargo.toml`, `go.mod`,
`pyproject.toml`, Dockerfiles, compose files, CI configs, infra files, route registration, auth
middleware, API schemas, and environment/config loaders.

Summarize:
- languages and frameworks;
- deployment surface;
- auth/session model;
- data stores and external services;
- public entry points;
- dependency and secret-management posture.

## Phase 2: Domain Selection

Mark each domain **most relevant**, **relevant**, or **skip** with evidence. If the user did not pass
`--domains`, ask with a structured question tool when available; otherwise default to all domains
with real evidence in the stack.

## Phase 3: Domain Audits

Spawn read-only sub-agents in parallel, one per selected domain, or run inline if no sub-agent path
is available. Use the strongest reviewer setting for auth, crypto, data-loss, broad public API, or
large/polyglot scopes.

Each domain auditor gets:

```markdown
You are a security scanner for the <domain> domain.

Scope - audit ONLY these files:
<file list>

Stack profile:
<summary>

Method:
1. Read the relevant files in scope.
2. Web-search current best practices and common vulnerabilities for this stack/domain when
   version-sensitive.
3. Confirm every finding in code context.
4. Return findings only; do not implement fixes.

For each finding:
- Title
- Severity: Critical | High | Medium | Low
- Domain
- Location: file:line
- Evidence: 1-5 lines
- Attack or exposure path
- Remediation direction
```

## Severity Rubric

| Severity | Meaning |
|---|---|
| Critical | Actively exploitable now, such as secrets in source, missing auth on public endpoints, plaintext credential storage |
| High | Significant missing control, known exploitable CVE in deployed dependency, strong attacker leverage |
| Medium | Hardening gap or vulnerability requiring chained conditions |
| Low | Defense-in-depth, minor information disclosure, stale but not known-vulnerable dependency |

Do not return Info entries as findings.

## Phase 4: Aggregate And Verify

1. Dedupe by `file:line` and root cause.
2. Spot-check every Critical/High and a sample of Medium/Low findings.
3. Drop theoretical findings without a concrete exposure path.
4. Group by severity and domain.

## Phase 5: Write The Report

Write `security-scan-report.md` unless the user supplied `--output`, using
[references/report-template.md](references/report-template.md). Include:
- stack/security surface profile;
- audited domains and skipped-domain reasons;
- findings by severity;
- dependency/security hygiene notes;
- remediation directions;
- scanner gaps;
- recommended fix order.

## Guardrails

- Findings require file:line evidence and a concrete security impact.
- Avoid generic OWASP checklists without code evidence.
- Do not run exploit payloads against live systems.
- Do not edit source code.
- Do not write `.work/`, backlog, release, or tracking artifacts.
