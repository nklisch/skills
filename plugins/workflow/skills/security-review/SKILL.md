---
name: security-review
description: >
  Comprehensive security audit for any codebase. Discovers stack, lets user choose focus domains
  (auth, injection, secrets, dependencies, API, infra, crypto, data protection, error handling),
  researches best practices, then produces scored markdown report with severity-classified findings.
  Use when user says "security review", "security audit", "vulnerability check", or "find security issues".
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Agent, WebSearch, WebFetch, Write, AskUserQuestion
model: opus
---

# Security Review

You perform a comprehensive, interactive security audit of a codebase. You discover the tech stack,
let the user choose which security domains to focus on, research current best practices, audit the
code in parallel, and produce a scored markdown report with actionable findings.

The report is designed to be handed to a design or fix skill for remediation.

## Arguments

- No arguments: audit the entire repository
- Path argument (e.g. `src/api/`): scope the audit to that directory

## Phase 1: Codebase Discovery

Map the project's technology stack and attack surface before auditing anything.

### 1.1 Detect the stack

Scan for:
- **Languages** — file extensions, config files (`package.json`, `Cargo.toml`, `go.mod`, `pyproject.toml`, `*.csproj`, etc.)
- **Frameworks** — Express, Django, Rails, Spring, Next.js, FastAPI, etc. (check imports and configs)
- **Package managers** — npm, pip, cargo, go modules, maven, etc.
- **Entry points** — main files, API route definitions, CLI commands, serverless handlers
- **Infrastructure** — Dockerfiles, docker-compose, Terraform, CloudFormation, k8s manifests, CI configs
- **Auth systems** — OAuth libs, JWT usage, session middleware, auth providers

### 1.2 Identify the attack surface

Determine:
- Does the project accept user input? (web forms, API endpoints, CLI args, file uploads)
- Does it store or process sensitive data? (PII, credentials, financial data)
- Does it communicate over networks? (HTTP clients, database connections, message queues)
- Does it run with elevated privileges? (root/admin, cloud IAM roles)
- Is it public-facing or internal?

### 1.3 Present findings

Summarize the stack profile to the user:
- Detected languages, frameworks, and infrastructure
- Attack surface summary
- Which security domains are most relevant (and why)

## Phase 2: Domain Selection

Present the 9 security domains to the user. Sort by relevance to the detected stack (most relevant first).

**AskUserQuestion checkpoint** — multi-select:

### Security Domains

1. **Authentication & Authorization** — auth flows, session management, RBAC/ABAC, token handling, password policies. *Most relevant for: apps with user accounts, APIs with auth.*
2. **Input Validation & Injection** — XSS, SQL injection, command injection, path traversal, template injection, SSRF. *Most relevant for: web apps, APIs accepting user input.*
3. **Secrets & Configuration** — hardcoded secrets, env variable leakage, insecure defaults, exposed config files, `.env` in version control. *Relevant for: all projects.*
4. **Dependencies & Supply Chain** — known CVEs in deps, outdated packages, lockfile integrity, typosquatting risk, unnecessary dependencies. *Relevant for: all projects with external deps.*
5. **Data Protection** — encryption at rest/in transit, PII handling, data sanitization in logs, secure deletion, backup security. *Most relevant for: apps handling user data.*
6. **API Security** — rate limiting, CORS configuration, authentication on all endpoints, mass assignment, response data leakage, API versioning. *Most relevant for: REST/GraphQL APIs.*
7. **Infrastructure & Deployment** — Dockerfile security, CI/CD secret handling, exposed ports, cloud IAM, container hardening, network policies. *Most relevant for: deployed services.*
8. **Cryptography** — weak algorithms, hardcoded keys, improper randomness, certificate validation, key management. *Most relevant for: apps doing encryption/signing.*
9. **Error Handling & Logging** — stack trace leakage, insufficient audit logging, PII in logs, missing error boundaries, verbose error messages in production. *Relevant for: all production apps.*

Tell the user how many domains you recommend selecting (typically 3-5 for a focused review, all 9 for a full audit). If the user doesn't select, default to all domains relevant to the detected stack.

## Phase 3: Deep Audit

For each selected domain, launch a **parallel Agent subagent**. Each subagent independently:

1. **Loads the domain checklist** from [references/domain-checklists.md](references/domain-checklists.md)
2. **Researches current best practices** via WebSearch for the specific stack+domain combination
   (e.g., "Node.js Express authentication security best practices 2025")
3. **Audits the codebase** against the checklist items — use Grep/Glob/Read to find relevant code
4. **Records findings** with:
   - **What**: description of the issue
   - **Where**: file path and line number (`file:line`)
   - **Severity**: Critical / High / Medium / Low / Info (see [references/severity-guide.md](references/severity-guide.md))
   - **Evidence**: the problematic code snippet (keep short — 1-5 lines)
   - **Remediation direction**: what should change (not the fix itself)
5. **Scores the domain** 0-10 using the scoring rubric below

### Subagent prompt template

Brief each subagent with:
- The detected stack profile from Phase 1
- The specific domain name and its checklist
- The severity guide
- Instructions to search the web for current best practices for this stack+domain
- The scoring rubric
- Output format: structured findings list + domain score + rationale

### Handling subagent results

Collect all subagent results. If any subagent reports an error or inconclusive results,
note it in the report rather than re-running (the user can request a deeper dive later).

## Phase 4: Scoring & Report Generation

### 4.1 Aggregate findings

Combine all subagent findings into a single list. Deduplicate where the same code location
appears in multiple domains. Sort by severity (Critical first).

### 4.2 Score each domain

Apply the scoring rubric. Each domain gets a 0-10 score based on what the subagent found.

### 4.3 Compute overall score

Calculate a weighted average:
- Domains detected as "most relevant" to the stack get weight 2
- Domains detected as "relevant" get weight 1
- Round to one decimal place

### 4.4 Write the report

Use the template from [references/report-template.md](references/report-template.md).
Write to `security-review-report.md` in the project root.

### 4.5 Present summary

Show the user:
- Overall score (X/10)
- Domain scores table
- Count of findings by severity
- Top 3 most critical findings

**AskUserQuestion checkpoint:** "Report written to `security-review-report.md`. Want me to
dive deeper into any domain, or hand this off to a fix workflow?"

## Scoring Rubric

| Score | Meaning | Criteria |
|-------|---------|----------|
| 0-1   | Critical failures | Actively exploitable vulnerabilities, secrets in source, no auth on public endpoints |
| 2-3   | Severe gaps | Major security controls missing, known CVEs in deps, plaintext sensitive data |
| 4-5   | Basic hygiene | Some controls in place but inconsistent, outdated patterns, gaps in coverage |
| 6-7   | Solid baseline | Standard security practices followed, minor gaps, some hardening missing |
| 8-9   | Well-hardened | Defense in depth, comprehensive controls, minor best-practice deviations only |
| 10    | Exceptional | Security-first design throughout, all best practices followed, proactive threat mitigation |

**Scoring guidelines:**
- Start at 5 (neutral). Deduct for each finding proportional to severity. Add for proactive measures found.
- A project with zero findings in a domain gets 7 (not 10 — absence of issues ≠ presence of hardening).
- Critical findings cap the domain score at 3 maximum.
- Multiple High findings cap at 5 maximum.

## Important Rules

- **Never implement fixes.** This skill produces a report only. Remediation is for the design/fix skill.
- **Always cite file:line.** Every finding must reference specific code locations.
- **Don't fabricate findings.** If you can't find evidence of an issue, don't report it. Score honestly.
- **Research before judging.** Web search for current best practices before marking something as an issue.
  What was insecure in 2020 may be fine now, and vice versa.
- **Respect scope.** If the user scoped to a directory, don't audit outside it.
- **Keep findings actionable.** "This is insecure" is not a finding. "JWT tokens are signed with HS256
  using a 16-byte key (auth/jwt.ts:42) — upgrade to RS256 or use a 256-bit key minimum" is.
