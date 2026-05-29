---
name: gate-infra
description: >
  Release-time infrastructure-safety gate. Audits the release bundle for
  Terraform state divergence, missing CI-only enforcement, missing
  environment-gated reviewer on production deploys, JSON service-account
  keys in the repo, secrets in .tf/.env files, and migrations applied
  outside CI. Emits findings as items with gate_origin: infra. Like other
  release-deploy gates: idempotent, bundle-scoped, severity-staged
  (Critical/High → stage:implementing; Medium → drafting; Low → backlog).
user-invocable: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Task, AskUserQuestion
model: opus
---

# Gate-Infra

You orchestrate an infrastructure-safety gate over the items bound to a
release. The actual audit runs inside a **deep infra-audit sub-agent**; your
role is to prepare the bundle context, dispatch the sub-agent, and convert
the findings it returns into items in the substrate. Findings get
`gate_origin: infra`, `tags: [infra]`, with severity tier shaping the stage.

Sub-agent strength is explicit:
- **Claude Code / Anthropic:** spawn one Task with `model: "opus"` and
  `subagent_type: "general-purpose"`.
- **Codex / OpenAI:** spawn one analysis sub-agent with `reasoning_effort:
  xhigh` — infrastructure misconfigurations are high-blast-radius and
  warrant the deeper pass.

This is NOT a standalone audit. This is a gate over a specific release
bundle, producing items the release-deploy flow can drain to `done` before
shipping. Critical/High findings BLOCK the release until resolved.

## Trigger

- `/agile-workflow:release-deploy` invokes this during the `quality-gate` stage
- User can invoke manually: `/agile-workflow:gate-infra <release-version>`

## Workflow

### Phase 1: Identify bundle changes

If a release version was provided, use it. Otherwise, find the active
release file (the one at `stage: planned` or `stage: quality-gate`) and use
its version.

```bash
# Bound items
.work/bin/work-view --release <version> --paths
```

If no items are bound, halt with: "No items bound to release `<version>`.
Bind items first via `/agile-workflow:release-deploy`."

Build the union of files changed by the bundle, then filter to
infra-relevant paths:

```bash
for item in $(.work/bin/work-view --release <version> --paths); do
  id=$(grep -m1 '^id:' "$item" | awk '{print $2}')
  git log --grep "$id" --format='%H' | xargs -I{} git diff-tree --no-commit-id --name-only -r {}
done | sort -u > /tmp/bundle-files-<version>.txt

# Infra-relevant subset (sub-agent audits this filtered list)
grep -E '^(terraform/|infra/|\.github/workflows/|migrations/|scripts/.*migrat|\.env|.*\.tf$|.*\.tfvars$|.*\.tflock|.*\.ya?ml$|Dockerfile|docker-compose)' \
  /tmp/bundle-files-<version>.txt > /tmp/bundle-infra-files-<version>.txt || true
```

If the infra-relevant subset is empty, halt with: "Bundle `<version>` has no
infra-relevant changes. Skipping gate-infra." Emit no items.

### Phase 2: Read existing infra findings (idempotency prep)

```bash
.work/bin/work-view --release <version> --gate infra --paths
```

Capture the set of `(rule, file:line)` already-tracked findings so the
sub-agent can be told to skip duplicates.

### Phase 3: Dispatch the infra-audit sub-agent

Spawn ONE deep infra-audit sub-agent with the full audit brief. For Claude
Code, this is `Task(subagent_type=general-purpose, model=opus)`. For Codex,
use `reasoning_effort: xhigh`. The sub-agent does end-to-end stack
discovery, runs all six rule checks, classifies severity, and returns
structured findings.

**Brief template** (substitute `<version>`, `<bundle-infra-files>`,
`<bound-item-ids>`, `<already-tracked>`):

> You are conducting an infrastructure-safety gate audit for release
> `<version>`. You have access to Read, Glob, Grep, Bash, Task. Audit ONLY
> the infra-relevant files in the bundle scope — not the whole repo.
>
> **Bundle scope** (audit ONLY these files):
> ```
> <bundle-infra-files>
> ```
>
> **Bound items**: `<bound-item-ids>`
>
> **Already-tracked findings to skip** (do not re-report these):
> ```
> <already-tracked rule / file:line pairs>
> ```
>
> **Methodology**:
>
> 1. **Stack discovery** — read `terraform/` layout (single-dir vs
>    bootstrap/+main/ split), `.github/workflows/*.yml`, `migrations/`
>    layout, any `scripts/apply-*.sh`, `.env*` patterns. Identify the IaC
>    tool (Terraform / Pulumi / CDK), the CI provider, the deploy target
>    (Cloud Run / ECS / k8s / Lambda), and the secrets-management approach
>    (Secret Manager / SSM / Vault / env files).
>
> 2. **Run the six-rule audit against the bundle files**:
>
>    **Rule 1 — No evidence of local terraform apply**
>    The `terraform.tfstate` file should never be committed; state-file
>    mtimes should never be newer than `.terraform.lock.hcl`'s last
>    modification in git history (which would indicate someone applied
>    locally after the last legitimate CI apply).
>    Checks:
>    - `git ls-files | grep -E '\.tfstate(\.backup)?$'` — must be empty
>    - `git log --oneline -- '*.tfstate*'` — must be empty (state never
>      committed in history)
>    - If `terraform.tfstate.backup` shows up in untracked files alongside
>      a fresh `.terraform/` dir, that's evidence of a recent local apply
>      → finding
>    - `.gitignore` MUST include `*.tfstate*`, `.terraform/`,
>      `.terraform.lock.hcl` (lock file optional but encouraged)
>    Severity: **Critical** if state file is committed. **High** if no
>    `.gitignore` protection and local-apply evidence is present.
>
>    **Rule 2 — CI-only enforcement in workflow files**
>    The Terraform apply step in CI workflows MUST be gated to `main`
>    branch (or equivalent default) on `push` events — never on `pull_request`.
>    Checks:
>    - In every `.github/workflows/*.yml` that runs `terraform apply` (or
>      `pulumi up`, `cdk deploy`):
>      - The apply job MUST have `if: github.ref == 'refs/heads/main'` or
>        equivalent (`github.event_name == 'push' && github.ref == ...`)
>      - The apply job MUST NOT trigger on `pull_request` events
>      - Plan-on-PR is OK; apply-on-PR is NEVER OK
>    Severity: **Critical** if apply runs on PRs. **High** if branch gate
>    is missing on push.
>
>    **Rule 3 — Environment-gated reviewer configured on production**
>    Cloud deploys to production MUST be guarded by a GitHub Environment
>    with required reviewers (the human-in-the-loop gate).
>    Checks:
>    - Any apply / deploy job that targets production MUST declare
>      `environment: production` (or equivalent named environment)
>    - Cross-check via `gh api repos/<owner>/<repo>/environments/production`
>      that `protection_rules` includes a `required_reviewers` rule with at
>      least one reviewer (use `gh api` if available; if not, note as a
>      manual check in the finding body)
>    - The environment name MUST be referenced in the workflow file with
>      the exact spelling that exists in GitHub repo settings (typos
>      silently skip the gate)
>   Severity: **High** if environment is declared but reviewers are
>    missing, or environment is not declared at all on a prod-targeting
>    apply job.
>
>    **Rule 4 — No JSON service-account keys checked in**
>    Long-lived JSON service-account keys (GCP) or AWS access-key files
>    are forbidden. WIF / OIDC / IRSA / managed identities are the only
>    acceptable patterns.
>    Checks:
>    - `git ls-files | grep -E '\.json$'` — for each match, grep for
>      `"type": "service_account"` or `"private_key": "-----BEGIN`
>    - `git ls-files | grep -E '(credentials|key|sa-key|service-?account).*\.json$'`
>      — even if the file isn't a key, suspicious filenames warrant a
>      Critical finding for manual confirmation
>    - `.gitignore` SHOULD include `*-key.json`, `service-account*.json`,
>      `credentials.json`
>   Severity: **Critical** for any committed key. **High** for
>    suspicious filenames that warrant manual review.
>
>    **Rule 5 — No secrets in .tf, .env, .yaml, .yml files**
>    Heuristic pattern-matching for secrets accidentally committed.
>    Checks (Grep across bundle files only):
>    - `API_KEY\s*[=:]\s*["']?[A-Za-z0-9_\-]{16,}` — high-entropy assignment
>    - `password\s*[=:]\s*["']?\S{8,}["']?` — case-insensitive
>    - `secret\s*[=:]\s*["']?[A-Za-z0-9_\-]{16,}` — case-insensitive
>    - `token\s*[=:]\s*["']?[A-Za-z0-9_\-]{20,}` — case-insensitive
>    - `-----BEGIN (RSA |EC |OPENSSH |)PRIVATE KEY-----` — private-key
>      block
>    - `AKIA[0-9A-Z]{16}` — AWS access key ID
>    - `xox[abprs]-[0-9a-zA-Z\-]{10,}` — Slack token
>    - `ghp_[A-Za-z0-9]{36,}` / `gho_[A-Za-z0-9]{36,}` / `ghs_[A-Za-z0-9]{36,}`
>      — GitHub tokens
>    - In `.tf` / `.tfvars`: any literal string assigned to a variable
>      named `*password*`, `*secret*`, `*token*`, `*key*` (where value
>      isn't `var.*` / `data.*` / `local.*`)
>    Skip:
>    - Files matching `*.example`, `*.template`, `*.sample`, `*.dist`
>    - Placeholder values: `your-key-here`, `<REPLACE_ME>`,
>      `CHANGE_ME`, `***`, `xxx`, all-zero strings
>    - Comments (`#`, `//`) explaining what the variable is for
>    Severity: **Critical** for any plausible real secret. **High** for
>    ambiguous high-entropy strings that warrant manual review.
>
>    **Rule 6 — Migrations have a CI runner step, not manually-applied**
>    Database migrations (`migrations/*.sql`, `migrations/*.py`,
>    `db/migrate/*.rb`, etc.) MUST be applied by a CI step, never by hand.
>    Checks:
>    - If the bundle includes any `migrations/` change, the CI workflow
>      MUST include a step that runs the migration runner (e.g.
>      `bash scripts/apply-migrations.sh`, `pnpm migrate`, `alembic
>      upgrade head`)
>    - The migration step MUST run on the apply path (post-Terraform apply
>      to main), not on plan-only paths
>    - If no migration runner step is detected in any workflow, that's a
>      finding regardless of which migration was added
>    Severity: **High** if migrations exist but no CI runner step is
>    wired. **Medium** if the runner exists but is gated incorrectly
>    (runs on PRs, runs before infra apply, etc.).
>
> 3. **Severity classification** — every finding gets one of:
>    | Severity | Meaning |
>    |---|---|
>    | Critical | Committed secret, committed state, apply-on-PR, committed SA key. Must fix before shipping. |
>    | High | Missing branch gate, missing required reviewer, missing migration runner. Strong production-risk leverage. Must fix before shipping. |
>    | Medium | Hardening gap: missing `.gitignore` entries, ambiguous secret-shaped string in non-example file, migration runner gated incorrectly. Should fix; can defer with explicit acknowledgement. |
>    | Low | Defense-in-depth: missing `.terraform.lock.hcl`, suggested workflow hardening, missing environment description. Backlog. |
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
> - **Rule**: 1 | 2 | 3 | 4 | 5 | 6
> - **Location**: `<file>:<line>` (or `<file>` if file-level)
> - **Evidence**:
>   ```<lang>
>   <1-5 lines of offending content; redact any actual secret to first/last 4 chars>
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
> - Rules checked: 1-6
> - Files audited: <count>
> - Findings by severity: Critical=<n>, High=<n>, Medium=<n>, Low=<n>
> ```
>
> **Rules**:
> - Audit only the files listed in Bundle scope. Do NOT expand the audit
>   to the whole repo.
> - Cite file:line for every finding (file-only OK if the issue is
>   file-existence rather than file-content).
> - Don't fabricate. If a rule produces no match, don't invent findings.
> - REDACT actual secret values in finding bodies — show first/last 4
>   chars only (e.g. `AKIA****ABCD`). The finding's job is to flag, not
>   to re-leak.
> - Skip findings that match the already-tracked list.
> - Don't implement fixes. Findings only.
> - For Rule 3 (environment-gated reviewer): if `gh api` is unavailable,
>   record the finding as "MANUAL CHECK REQUIRED" rather than skipping.

### Phase 4: Convert findings to items

For each finding the sub-agent returned (above Info severity):

```yaml
---
id: gate-infra-<short-slug>
kind: story
stage: implementing      # Critical or High
                         # OR drafting for Medium
                         # OR backlog file for Low
tags: [infra]
parent: null
depends_on: []
release_binding: <version>
gate_origin: infra
created: YYYY-MM-DD
updated: YYYY-MM-DD
---

# <one-line title>

## Severity
Critical | High | Medium | Low

## Rule
Rule <N> — <rule name>

## Location
`<file>:<line>`

## Evidence
\`\`\`<lang>
<short snippet, 1-5 lines; secrets redacted>
\`\`\`

## Remediation direction
<what should change — direction, not a finished fix>
```

Severity → stage mapping (matches Nathan's other gates exactly):
- **Critical** / **High** → `stage: implementing` in `.work/active/stories/`
  (blocks release)
- **Medium** → `stage: drafting` in `.work/active/stories/` (blocks release)
- **Low** → backlog file in `.work/backlog/` (no `release_binding`; does NOT
  block release)

### Phase 5: Commit

```bash
git add .work/active/stories/ .work/backlog/
git commit -m "gate-infra: <N> findings for <version>"
```

If `<N>` is 0, do NOT create an empty commit. Report "no findings" in
conversation and exit.

## Output

In conversation:
- **Bundle**: `<version>` — `<N>` items audited, `<M>` infra-relevant files
  changed
- **Findings**: count by severity (Critical / High / Medium / Low)
- **Items created**: count, with new ids
- **Already-tracked**: count skipped
- **Next**: gate-infra adds to release readiness criteria. Critical/High/
  Medium items block release until all reach `stage: done`. Low items live
  in backlog and don't block.

## Anti-patterns

- **Expanding the audit to the whole repo.** This is a release gate, not a
  standalone infra-eval. Audit only the bundle's infra-relevant files. If
  the user wants a repo-wide infra sweep, point them at a standalone
  `/agile-workflow:repo-eval` invocation.
- **Replicating the sub-agent's analysis in the orchestrator.** The
  orchestrator preps the bundle, dispatches the sub-agent, and writes
  items. The six-rule audit happens inside the sub-agent.
- **Leaking secrets in finding bodies.** Always redact real secret values
  to first/last 4 chars. The finding is a flag, not a re-leak.
- **Treating Medium as non-blocking.** Per Nathan's convention, Medium →
  drafting in `.work/active/` BLOCKS the release. Only Low goes to backlog
  and doesn't block.
- **Implementing fixes inline.** Never apply a Terraform change, edit a
  workflow file, or remove a committed secret as part of this skill. The
  skill produces items only; implementation happens via
  `/agile-workflow:implement` against those items.
- **Re-reporting already-tracked findings.** Pass the existing-findings
  skip-list into the sub-agent's brief AND double-check at item-write time
  before creating.
- **Reporting on non-infra files.** If a finding cites a file outside the
  infra-relevant filter, the sub-agent went off-piste; drop the finding.

## Guardrails

- **The audit happens in the sub-agent, not here.** Your job is bundle
  prep, dispatch, and item-writing. Don't replicate the six-rule audit.
- **Bundle-scoped.** Audit only the bundle's infra-relevant files, not the
  whole repo, not files outside the infra filter.
- **Idempotent.** Re-running adds only net-new findings. Pass already-
  tracked findings into the sub-agent's brief.
- **Severity → stage mapping is fixed.** Critical/High → implementing.
  Medium → drafting. Low → backlog. Do NOT improvise.
- **Never remove committed secrets in this skill.** Even when found,
  remediation is the item's job — and remediation requires history rewrite
  + key rotation, which the human owns.
- **Commit per batch.** One commit covers all findings for the run:
  `gate-infra: <N> findings for <version>`. No per-finding commits.
- **Halt cleanly on no infra changes.** If the bundle has no infra-relevant
  files, exit without creating items or committing.
