---
name: gate-security
description: >
  Security gate that scans items bound to a release and produces items as findings.
  Discovers stack, picks relevant security domains (auth, injection, secrets, deps,
  API, infra, crypto, data protection, error handling), audits the bundle's code
  changes, and creates items in .work/active/ with gate_origin:security and
  appropriate tags. Auto-triggers during /agile-workflow:release-deploy quality-gate
  stage. Item-producer, NOT a pass/fail report.
allowed-tools: Read, Glob, Grep, Bash, Agent, WebSearch, WebFetch, Write, Edit
model: opus
---

# Gate-Security

You scan the items bound to the current release for security concerns and produce
items as findings. Each finding gets a `gate_origin: security` item in
`.work/active/`, properly tagged, with `release_binding` set to the same release.

This is NOT a standalone audit (for that, use `/agile-workflow:repo-eval`). This
is a gate over a specific release bundle, producing items the release-deploy flow
can drain to `done` before shipping.

## Trigger

- `/agile-workflow:release-deploy` invokes this during the `quality-gate` stage
- User can invoke manually: `/agile-workflow:gate-security <release-version>`

## Workflow

### Phase 1: Identify the bundle

If a release version was provided:
```bash
.work/bin/work-view --release <version> --paths
```

Otherwise, find the active release file (the one at `stage: planned` or
`stage: quality-gate`) and use its version.

If no items are bound, halt with: "No items bound to release `<version>`. Bind items
first via `/agile-workflow:release-deploy`."

### Phase 2: Stack discovery

Map the project's security-relevant surface:
- Languages, frameworks, package managers
- Auth systems
- Entry points (API routes, CLI commands, serverless handlers)
- Infrastructure (Dockerfile, CI configs, IaC)

### Phase 3: Domain selection

Pick relevant security domains for the bundle's changes. The nine domains:

1. **Authentication & Authorization** — auth flows, session management, RBAC/ABAC,
   token handling, password policies. *Most relevant for: apps with user accounts,
   APIs with auth.*
2. **Input Validation & Injection** — XSS, SQL injection, command injection, path
   traversal, template injection, SSRF. *Most relevant for: web apps, APIs
   accepting user input.*
3. **Secrets & Configuration** — hardcoded secrets, env variable leakage, insecure
   defaults, exposed config files, `.env` in version control. *Relevant for: all
   projects.*
4. **Dependencies & Supply Chain** — known CVEs in deps, outdated packages,
   lockfile integrity, typosquatting risk, unnecessary dependencies. *Relevant
   for: all projects with external deps.*
5. **Data Protection** — encryption at rest/in transit, PII handling, data
   sanitization in logs, secure deletion, backup security. *Most relevant for:
   apps handling user data.*
6. **API Security** — rate limiting, CORS configuration, authentication on all
   endpoints, mass assignment, response data leakage, API versioning. *Most
   relevant for: REST/GraphQL APIs.*
7. **Infrastructure & Deployment** — Dockerfile security, CI/CD secret handling,
   exposed ports, cloud IAM, container hardening, network policies. *Most
   relevant for: deployed services.*
8. **Cryptography** — weak algorithms, hardcoded keys, improper randomness,
   certificate validation, key management. *Most relevant for: apps doing
   encryption/signing.*
9. **Error Handling & Logging** — stack trace leakage, insufficient audit logging,
   PII in logs, missing error boundaries, verbose error messages in production.
   *Relevant for: all production apps.*

For an automated gate run, default to the domains most relevant to the detected
stack (no user prompt — gates run autonomously during release-deploy). For manual
invocation, ask the user via AskUserQuestion which to focus on.

### Severity definitions

Findings are classified by severity. Sub-agents must use these definitions to
keep gradings comparable across domains and runs.

| Severity | Meaning |
|---|---|
| **Critical** | Actively exploitable now (e.g., secrets in source, no auth on a public endpoint, plaintext password storage). Must be fixed before shipping. |
| **High** | Significant control missing or known CVE in a deployed dep. Strong attacker leverage if exploited. Must be fixed before shipping. |
| **Medium** | Hardening gap or non-obvious vulnerability requiring chained conditions. Should be fixed before shipping; can defer with explicit acknowledgement. |
| **Low** | Defense-in-depth improvement; minor info disclosure; outdated-but-not-vulnerable patterns. Backlog. |
| **Info** | Observation worth noting; not a finding. Don't produce items for these. |

### Phase 4: Parallel domain audits

For each selected domain, spawn an Agent sub-agent (model: sonnet, parallel) with:
- The bundle's changed files (extract from git history of bound items)
- The domain's security checklist
- Instructions to research current best practices via WebSearch
- Instructions to report findings as: file:line, severity, evidence, remediation

The change scope is the union of files changed by the bound items. Find this via:

```bash
# For each bound item, find its implementation commits
for item in $(.work/bin/work-view --release <version> --paths); do
  id=$(grep -m1 '^id:' "$item" | awk '{print $2}')
  git log --grep "$id" --format='%H' | xargs -I{} git diff-tree --no-commit-id --name-only -r {}
done | sort -u
```

### Phase 5: Convert findings to items

For each finding above Info severity:

```yaml
---
id: gate-security-<short-slug>
kind: story
stage: implementing      # high-confidence findings
                         # OR drafting for medium-confidence
                         # OR backlog file for low-confidence
tags: [security]
parent: null
depends_on: []
release_binding: <version>
gate_origin: security
created: YYYY-MM-DD
updated: YYYY-MM-DD
---

# <one-line title>

## Severity
Critical | High | Medium | Low

## Location
`<file>:<line>`

## Evidence
\`\`\`<lang>
<short code snippet, 1-5 lines>
\`\`\`

## Remediation direction
<what should change — direction, not a finished fix>
```

Severity mapping to stage:
- **Critical** / **High** → `stage: implementing` in `.work/active/stories/`
- **Medium** → `stage: drafting` in `.work/active/stories/`
- **Low** → backlog file in `.work/backlog/` (not stage-managed)

### Phase 6: Idempotency check

Before creating any item, check if an equivalent item already exists for this
release:

```bash
.work/bin/work-view --release <version> --gate security --paths
```

If a finding has the same file:line and severity as an existing item, do not duplicate.

### Phase 7: Commit

```bash
git add .work/active/stories/ .work/backlog/
git commit -m "gate-security: <N> findings for <version>"
```

## Output

In conversation:
- **Bundle**: `<version>` — `<N>` items audited
- **Findings**: count by severity (Critical / High / Medium / Low)
- **Items created**: count, with new ids
- **Already-tracked**: count of duplicate findings skipped
- **Next**: gate-security adds to release readiness criteria. Release ships when
  all bound items (including these) reach `stage: done`.

## Guardrails

- Never implement fixes — produce items only.
- Always cite file:line in finding bodies.
- Don't fabricate findings. If you can't find evidence, don't report it.
- Research before judging. WebSearch for current best practices for
  stack+domain combinations.
- Idempotent re-runs: don't duplicate items. Check `gate_origin: security` and
  `release_binding: <version>` before creating.
- Audit only the bundle's changes, not the whole repo. Repo-wide audits are
  `/agile-workflow:repo-eval`'s job, not a release gate's.
