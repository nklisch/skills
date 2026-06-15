---
name: gate-security
description: >
  Security gate that scans items bound to a release and produces items as findings. Delegates the full
  audit to a deep security-audit sub-agent which discovers stack, picks relevant security domains
  (auth, injection, secrets, deps, API, infra, crypto, data protection, error handling), audits the
  bundle's code changes, and returns findings. The orchestrator converts findings into items in
  .work/active/ with gate_origin:security and appropriate tags. Auto-triggers during
  /agile-workflow:release-deploy quality-gate stage. Item-producer, NOT a pass/fail report.
---

# Gate-Security

You orchestrate a security gate over the items bound to a release. The actual
audit runs inside a **deep security-audit sub-agent**; your role is to prepare
the bundle context, dispatch the sub-agent, and convert the findings it returns
into items in the substrate.

Sub-agent strength is explicit: spawn exactly one read-only deep security-audit
sub-agent with the strongest reviewer setting the host exposes. Use extra-high
reasoning only for auth, crypto, data-loss, broad public API, or large/polyglot
release bundles. If the host has no sub-agent path, run the audit inline and
record the reduced isolation in the release body.

This is NOT a standalone audit (for that, use a standalone `repo-eval` skill). This
is a gate over a specific release bundle, producing items the release-deploy
flow can drain to `done` before shipping.

## Trigger

- `/agile-workflow:release-deploy` invokes this during the `quality-gate` stage
- User can invoke manually: `/agile-workflow:gate-security <release-version>`

## Workflow

### Phase 1: Identify the bundle

If a release version was provided:
```bash
# Bound non-release items. `--release` auto-widens to ALL tiers (active + archive + releases).
# Include late-bound archived stubs; their bodies may be pruned, but their item id is still
# present and can recover the bundle commits/files. Ignore only the release orchestration item.
.work/bin/work-view --release <version> --paths | while IFS= read -r item; do
  kind=$(grep -m1 '^kind:' "$item" | awk '{print $2}')
  [ "$kind" = "release" ] && continue
  echo "$item"
done > /tmp/bundle-items-<version>.txt
```

Otherwise, find the active release file (the one at `stage: planned` or
`stage: quality-gate`) and use its version.

If no items are bound (the bundle-items file is empty), halt with: "No items
bound to release `<version>`. Bind items first via
`/agile-workflow:release-deploy`."

Build the union of files changed by the bundle. For archived stubs, the body is pruned on disk by
design; use the item id to find implementation commits instead of treating the missing body as a
skip reason:

```bash
while IFS= read -r item; do
  id=$(grep -m1 '^id:' "$item" | awk '{print $2}')
  git log --grep "$id" --format='%H' | xargs -I{} git diff-tree --no-commit-id --name-only -r {}
done < /tmp/bundle-items-<version>.txt | sort -u > /tmp/bundle-files-<version>.txt
```

### Phase 2: Read existing gate items (idempotency prep)

```bash
.work/bin/work-view --release <version> --gate security --paths
```

Capture the set of `(file:line, severity)` already-tracked findings so the
sub-agent can be told to skip duplicates.

### Phase 3: Dispatch the audit sub-agent

Spawn ONE read-only deep audit sub-agent with the full audit brief. Use the
strongest reviewer setting the host exposes, escalating for auth, crypto,
data-loss, broad public API, or large/polyglot bundles. If sub-agents are
unavailable, run the audit inline and record the reduced isolation in the
release body. The sub-agent does all of the analysis end-to-end —
stack discovery, domain selection, parallel domain audits, severity
classification — and returns structured findings.

**Brief template** (substitute `<version>`, `<bundle-files>`,
`<bound-item-ids>`, `<already-tracked>`):

> You are conducting a security gate audit for release `<version>`. You have
> access to the full toolset (Read, Glob, Grep, Bash, WebSearch, WebFetch,
> Task) and may spawn parallel sub-tasks for per-domain audits.
>
> **Bundle scope** (audit ONLY these files; this is a release gate, not a
> repo-wide audit):
> ```
> <bundle-files>
> ```
>
> **Bound items** (an archived stub's body is pruned on disk — hydrate it from
> the stub's `git_ref` frontmatter via `git show <git_ref>:<path>`, trying the
> item's former `.work/active/` path at that ref): `<bound-item-ids>`
>
> **Already-tracked findings to skip** (do not re-report these):
> ```
> <already-tracked file:line / severity pairs>
> ```
>
> **Methodology**:
>
> 1. **Stack discovery** — read `package.json`, `tsconfig.json`, `Cargo.toml`,
>    `go.mod`, `pyproject.toml`, `Dockerfile`, CI configs. Identify languages,
>    frameworks, package managers, auth systems, entry points (API routes, CLI,
>    serverless), infrastructure.
>
> 2. **Domain selection** — pick the relevant domains for this stack and the
>    bundle's surface. The nine domains:
>    1. Authentication & Authorization — auth flows, sessions, RBAC/ABAC,
>       tokens, password policies. Apps with user accounts; APIs with auth.
>    2. Input Validation & Injection — XSS, SQLi, command injection, path
>       traversal, template injection, SSRF. Web apps, APIs.
>    3. Secrets & Configuration — hardcoded secrets, env leakage, insecure
>       defaults, exposed config, `.env` in VCS. All projects.
>    4. Dependencies & Supply Chain — known CVEs, outdated packages, lockfile
>       integrity, typosquatting risk, unnecessary deps. All projects with
>       external deps.
>    5. Data Protection — encryption at rest/in transit, PII handling, log
>       sanitization, secure deletion, backup security. Apps handling user
>       data.
>    6. API Security — rate limiting, CORS, auth on all endpoints, mass
>       assignment, response leakage, versioning. REST/GraphQL APIs.
>    7. Infrastructure & Deployment — Dockerfile security, CI/CD secrets,
>       exposed ports, cloud IAM, container hardening, network policies.
>       Deployed services.
>    8. Cryptography — weak algorithms, hardcoded keys, RNG, cert validation,
>       key management. Apps doing encryption/signing.
>    9. Error Handling & Logging — stack trace leakage, audit gaps, PII in
>       logs, missing error boundaries, verbose prod errors. All prod apps.
>
> 3. **Parallel domain audits** — for each selected domain, spawn a parallel
>    sub-task (Task tool) that audits the bundle's changed files for that
>    domain's checklist. Use WebSearch to verify current best practices for
>    `<stack>+<domain>` combinations before judging.
>
> 4. **Severity classification** — every finding gets one of:
>    | Severity | Meaning |
>    |---|---|
>    | Critical | Actively exploitable now (secrets in source, no auth on a public endpoint, plaintext password storage). Must fix before shipping. |
>    | High | Significant control missing or known CVE in a deployed dep. Strong attacker leverage. Must fix before shipping. |
>    | Medium | Hardening gap or non-obvious vuln requiring chained conditions. Should fix; can defer with explicit acknowledgement. |
>    | Low | Defense-in-depth; minor info disclosure; outdated-but-not-vulnerable. Backlog. |
>    | Info | Observation; not a finding. Don't return Info entries. |
>
> **Output format** — return a single markdown document with:
>
> ```
> ## Findings
>
> ### Finding 1
> - **Title**: <one-line>
> - **Severity**: Critical | High | Medium | Low
> - **Domain**: <domain name>
> - **Location**: `<file>:<line>`
> - **Evidence**:
>   ```<lang>
>   <1-5 lines of offending code>
>   ```
> - **Remediation direction**: <direction, not finished fix>
>
> ### Finding 2
> ...
> ```
>
> Followed by:
>
> ```
> ## Audit summary
> - Stack: <one-line>
> - Domains audited: <list>
> - Files audited: <count>
> - Findings by severity: Critical=<n>, High=<n>, Medium=<n>, Low=<n>
> ```
>
> **Rules**:
> - Audit only the files listed in Bundle scope. Do NOT expand the audit.
> - Cite file:line for every finding.
> - Don't fabricate. If evidence is missing, don't report.
> - Skip findings that match the already-tracked list.
> - Don't implement fixes. Findings only.

### Phase 4: Convert findings to items

For each finding the sub-agent returned (above Info severity):

Read `gate_finding_routing` from `.work/CONVENTIONS.md` before writing items.
If absent, use the default routing below. Normalize security severity to routing
keys as: `Critical -> critical`, `High -> high`, `Medium -> medium`,
`Low -> low`, and `Info -> info` (Info is not returned as a finding by the
sub-agent, but the route is reserved for consistency). If a normalized key maps
to `skip`, do not emit an item for that finding; include the skipped count in
the gate output. If it maps to `backlog`, write a `.work/backlog/` item instead
of an active story.

```yaml
---
id: gate-security-<short-slug>
kind: story
stage: implementing      # Critical or High
                         # OR drafting for Medium
                         # OR backlog file for Low
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

## Domain
<domain>

## Location
`<file>:<line>`

## Evidence
\`\`\`<lang>
<short code snippet, 1-5 lines>
\`\`\`

## Remediation direction
<what should change — direction, not a finished fix>
```

Default severity -> placement mapping:
- **Critical** / **High** → `stage: implementing` in `.work/active/stories/`
- **Medium** → `stage: drafting` in `.work/active/stories/`
- **Low** → backlog file in `.work/backlog/` (not stage-managed)
- **Info** → skipped (no item emitted)

### Phase 5: Commit

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

- **The audit happens in the sub-agent, not here.** Your job is bundle prep,
  dispatch, and item-writing. Don't replicate the sub-agent's analysis in
  the orchestrator's context.
- Never implement fixes — produce items only.
- Always cite file:line in finding bodies.
- Don't fabricate findings. If the sub-agent returns nothing for a domain, it
  returns nothing. Don't paper that over.
- Idempotent re-runs: pass already-tracked findings into the sub-agent's brief
  so it skips duplicates. Double-check on item-write before creating.
- Audit only the bundle's changes, not the whole repo. Repo-wide audits are
  a standalone `repo-eval`'s job, not a release gate's.
