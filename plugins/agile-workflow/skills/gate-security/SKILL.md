---
name: gate-security
description: >
  Security gate that scans items bound to a release and produces items as findings. Delegates the full
  audit to a deep security scanner agent which discovers stack, picks relevant security domains
  (auth, injection, secrets, deps, API, infra, crypto, data protection, error handling), audits the
  bundle's code changes, and returns findings. The orchestrator converts findings into items in
  .work/active/ with gate_origin:security and appropriate tags. Auto-triggers during
  /agile-workflow:release-deploy quality-gate stage. Item-producer, NOT a pass/fail report.
---

# Gate-Security

You orchestrate a security gate over the items bound to a release. The actual
audit runs inside a **deep security scanner agent** (a generic sub-agent prompted with the scanner posture from `../principles/references/subagents.md`); your role is to prepare the bundle context,
dispatch the scanner, and convert the findings it returns into items in the
substrate.

Scanner strength is explicit: spawn exactly one source-read-only deep security
scanner with the strongest inspection/reviewer setting the host exposes. Use a generic sub-agent prompted with the scanner posture from `../principles/references/subagents.md`. Use extra-high reasoning
only for auth, crypto, data-loss, broad public API, or large/polyglot release
bundles. If the host has no scanner path, run the audit inline and
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
scanner can be told to skip duplicates.

### Phase 3: Dispatch the security scanner

Spawn ONE source-read-only deep scanner agent with the full audit brief. Use a generic sub-agent prompted with the scanner posture from `../principles/references/subagents.md` and the strongest
inspection/reviewer setting the host exposes, escalating for auth, crypto,
data-loss, broad public API, or large/polyglot bundles. If scanner agents
are unavailable, run the audit inline and record the reduced isolation in the
release body. The scanner does all of the analysis end-to-end — stack discovery,
domain selection, domain audit passes, severity classification — and returns
structured findings.

**Brief template** (substitute `<version>`, `<bundle-files>`,
`<bound-item-ids>`, `<already-tracked>`):

> You are conducting a security gate audit for release `<version>` as an
> agile-workflow scanner. Use read/search/shell/current-source lookup tools as
> needed, but do not spawn nested sub-agents or implement fixes.
>
> **Bundle focus** (start here; follow concrete security-relevant call paths,
> dependencies, shared infrastructure, and controls as needed):
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
> 3. **Domain audit passes** — for each selected domain, audit the bundle's
>    changed files against that domain's checklist, following concrete evidence
>    into adjacent security boundaries, dependencies, and shared controls. Use current-source lookup
>    when needed to verify best practices for `<stack>+<domain>` combinations
>    before judging.
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
> - **Relevance**: Release-relevant | Ambient
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
> - Bundle files are the focus, not a hard boundary. Expand only along concrete
>   security-relevant evidence and record why out-of-bundle surfaces were inspected.
> - Cite file:line for every finding.
> - Don't fabricate. If evidence is missing, don't report.
> - Skip findings that match the already-tracked list.
> - Don't implement fixes. Findings only.

### Phase 4: Convert findings to items

For each finding the scanner returned (above Info severity):

Read `gate_finding_routing` from `.work/CONVENTIONS.md` before writing items.
If absent, use the default routing below. Normalize security severity to routing
keys as: `Critical -> critical`, `High -> high`, `Medium -> medium`,
`Low -> low`, and `Info -> info` (Info is not returned as a finding by the
scanner, but the route is reserved for consistency). If a normalized key maps
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
release_binding: <version> | null  # null for ambient findings
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

Release-relevant findings use the normal severity mapping and bind to the
release. Ambient findings discovered outside the release's material risk go to
the unbound backlog regardless of severity; a genuinely critical repository
vulnerability is release-relevant when shipping would expose or perpetuate it.

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

- **The audit happens in the scanner agent, not here.** Your job is bundle
  prep, dispatch, and item-writing. Don't replicate the scanner's analysis in
  the orchestrator's context.
- Never implement fixes — produce items only.
- Always cite file:line in finding bodies.
- Don't fabricate findings. If the scanner returns nothing for a domain, it
  returns nothing. Don't paper that over.
- Idempotent re-runs: pass already-tracked findings into the scanner brief so it
  skips duplicates. Double-check on item-write before creating.
- Release-bound items define focus, not a hard boundary. Follow concrete
  security evidence into adjacent or system-wide controls, but do not perform
  an unfocused whole-repo audit. Route merely ambient findings to the unbound backlog.
