---
facet: authorization-endpoint-ref-policy
campaign: sandboxed-git-auth-patterns
fetched: 2026-07-10
updated: 2026-07-10
provenance: agent-synthesis
status: complete
---

# Authorization, endpoint, and ref policy for agent-initiated Git

## Executive finding

**Recommendation (inference):** use a narrow, privileged Git-push broker outside the model-observable sandbox. Do not inject a reusable Git credential into the sandbox, do not let the agent invoke authenticated `git push` directly, and do not treat a network allowlist or command-prefix rule as authorization. The broker should accept a typed push plan, bind it to an operator-controlled repository identity and exact ref transitions, obtain a repository-scoped short-lived credential just in time, execute without repository-controlled Git configuration or hooks, and emit a tamper-resistant decision log.

Codex cloud documents a split-phase pattern: configured secrets exist only during setup and are removed before the agent phase; the agent returns a diff from which a user opens a pull request [git-auth-policy-codex-cloud-environments]{1} [git-auth-policy-codex-cloud-environments]{3} [git-auth-policy-codex-cloud-environments]{5}. GitHub App installation tokens document a credential pattern narrowed to repositories and permissions and expiring after one hour [git-auth-policy-github-app-token]{3} [git-auth-policy-github-app-token]{4} [git-auth-policy-github-app-token]{5}. No fetched source documents an established coding harness that gives an untrusted model opaque, direct Git transport through a ref-aware credential broker; the proposed composition is therefore an architectural inference, not a copied mechanism.

## Evidence from existing systems

### Harness authorization mechanisms

**Documented:** The fetched permissions documentation describes harness-enforced allow/ask/deny rules, with deny taking precedence over ask and allow, and demonstrates selected Git command allows alongside a `git push` deny [git-auth-policy-claude-code-permissions]{1} [git-auth-policy-claude-code-permissions]{2} [git-auth-policy-claude-code-permissions]{5}. Managed settings can disable bypass modes [git-auth-policy-claude-code-permissions]{3}. This establishes a useful policy vocabulary and provenance model.

**Limitation (inference):** textual Bash patterns are too shallow to authorize a push. Git accepts remote names, URLs, remote groups, arbitrary revision expressions, force markers, matching refs, wildcards, deletions, tags, and mirrors [git-auth-policy-git-push]{1} [git-auth-policy-git-push]{2} [git-auth-policy-git-push]{3} [git-auth-policy-git-push]{4}. A prefix such as `git push origin` does not bind the actual endpoint or complete ref effect.

**Documented:** Codex separates sandbox capability from approval policy, protects `.git` recursively, defaults workspace network off, and treats destructive Git and Git config/output override operations as requiring approval under its untrusted policy [git-auth-policy-codex-security]{1} [git-auth-policy-codex-security]{2} [git-auth-policy-codex-security]{4} [git-auth-policy-codex-security]{6}. This is stronger than prompt-level instructions because enforcement is outside the model.

**Inference:** per-command decisions should be made over a parsed operation object, not a shell command string:

```text
principal, canonical_repo_id, canonical_endpoint,
source_oid, destination_ref, expected_remote_oid,
operation_kind, force_mode, credential_profile, policy_provenance
```

Unknown fields, ambiguous refs, multiple destinations, config overrides, remote helpers, arbitrary Git options, or endpoint redirects should fail closed.

### Credential placement patterns

**Documented counterexample:** Codespaces mints an automatically expiring token scoped according to repository access [git-auth-policy-codespaces-security]{2} [git-auth-policy-codespaces-security]{3}, and ordinary authenticated Git is usable inside the environment [git-auth-cred-codespaces-git-auth]{1} [git-auth-cred-codespaces-git-auth]{2}. Codespaces separately states that development-environment secrets are printable from the terminal [git-auth-policy-codespaces-security]{4}; the fetched evidence does not establish raw Git-token byte readability. Repository-controlled `devcontainer.json` can run arbitrary setup code [git-auth-policy-codespaces-security]{6}. This is suitable for a trusted interactive developer environment, not evidence that authenticated authority remains unavailable to an agent.

**Documented counterexample:** `actions/checkout` persists authentication specifically so later job scripts can execute authenticated Git, with `persist-credentials: false` as the opt-out [git-auth-policy-actions-checkout]{2} [git-auth-policy-actions-checkout]{3}. Moving the token from `.git/config` into `$RUNNER_TEMP` improves storage hygiene but does not make it unavailable to untrusted job code [git-auth-policy-actions-checkout]{1}.

**Documented positive pattern:** GitHub Actions OIDC exchanges a job-unique identity carrying repository, ref, SHA, actor, workflow, audience, and issuer claims for a short-lived provider credential [git-auth-policy-github-oidc]{2} [git-auth-policy-github-oidc]{3} [git-auth-policy-github-oidc]{4} [git-auth-policy-github-oidc]{5}. GitHub App installation tokens can separately narrow GitHub access to selected repositories and a subset of app permissions [git-auth-policy-github-app-token]{3} [git-auth-policy-github-app-token]{4}.

**Inference:** GitHub's documented OIDC flow does not itself authorize Git pushes. Its transferable pattern is identity exchange: a broker validates an operator/session assertion and mints or requests a GitHub App installation token in its own trust domain. The App private key and installation token never enter sandbox files, environment variables, process arguments, Git config, logs, or tool results.

## Recommended policy model

### Canonical endpoint and repository binding

1. **Operator registry is authoritative.** Bind a logical repository ID to provider, immutable provider repository ID when available, normalized host, port, owner/path, and installation ID. Project files may request a known repository but may not introduce an endpoint or credential binding.
2. **Ignore repository remotes for authorization.** A remote name is display/context only. Do not trust `.git/config`, `remote.*.url`, `remote.*.pushurl`, `url.*.insteadOf`, credential helpers, `core.sshCommand`, protocol helpers, environment overrides, or global/system Git config. Git itself permits a remote name or URL as the push destination [git-auth-policy-git-push]{1}.
3. **Canonicalize before policy.** Require a provider-specific HTTPS endpoint; reject userinfo, fragments, unexpected ports, alternate host spellings, encoded path separators, redirects, SSH/scp syntax, local/file transports, and remote-helper syntax. Compare immutable repository identity after provider lookup where possible.
4. **Broker owns transport.** Use a library transport with an in-memory credential callback when feasible. If a Git subprocess is unavoidable, run it in a broker-private namespace with sanitized environment, isolated config, hooks disabled, a fixed executable, fixed HTTPS endpoint, no shell, and credentials delivered through a broker-private channel rather than arguments.

### Ref and object scoping

Git refspec breadth is the main reason command-prefix approval is insufficient. An empty source deletes, `+` forces, wildcards affect sets, `--tags` expands tag updates, and `--mirror` force-updates and deletes across all `refs/` [git-auth-policy-git-push]{2} [git-auth-policy-git-push]{3} [git-auth-policy-git-push]{4}.

Recommended defaults:

| Operation | Default | Required binding |
|---|---|---|
| Fetch/ls-refs from registered repo | allow | canonical repo; read credential only; bounded ref namespaces |
| Create/update one non-protected branch, fast-forward | ask | exact source OID, full destination ref, observed old OID |
| Push to operator-designated scratch namespace | operator may pre-allow | exact `refs/heads/<namespace>/...`; one ref; fast-forward/create only |
| Force update | deny by default; ask only when explicitly enabled | exact ref plus explicit expected old OID |
| Delete branch | deny by default; ask only when explicitly enabled | exact ref plus expected old OID |
| Create/update/delete tag | ask or deny | exact tag ref and OIDs; never inherit branch policy |
| `--all`, matching `:`, wildcard refspec, `--prune` | deny | no expansion accepted |
| `--mirror` | deny unconditionally | none |
| Arbitrary `refs/*` outside approved namespaces | deny | none |

**Documented:** `--force-with-lease=<ref>:<expect>` rejects when the remote ref no longer equals the expected value; implicit lease forms rely on mutable tracking refs and can be defeated by background fetches [git-auth-policy-git-push]{5} [git-auth-policy-git-push]{6}. **Recommendation (inference):** bind every human approval, including a normal fast-forward push, to the broker-observed old remote OID. For exceptional force, require the explicit-OID lease form. Re-resolve immediately before execution and fail on drift rather than reprompting with altered semantics.

### Human confirmation

An approval prompt should display normalized facts, not the model's command text:

- authenticated principal and credential profile;
- canonical provider/host/repository identity;
- each full destination ref, old OID, new OID, and fast-forward status;
- explicit badges for force, delete, tag, protected ref, or new ref;
- commit range or diff summary derived by trusted code;
- policy source and whether the approval is one-shot;
- expiry and a hash/nonce identifying the exact plan.

Approval authorizes that immutable plan once. Any endpoint, ref, OID, operation-kind, or credential change invalidates it. Human confirmation is an additional gate, not the parser or sandbox boundary.

### Policy provenance

Use a fail-closed intersection analogous to externally enforced deny/ask/allow systems: operator policy defines the authority ceiling and initial decision; project policy is evaluated before authorization and may only narrow it. Any deny wins, any ask prevents automatic execution, and auto requires allow at every applicable layer. Claude Code documents deny-before-ask-before-allow and notes that model instructions do not change harness permissions [git-auth-policy-claude-code-permissions]{2}.

Project configuration may:

- request a registered repository alias;
- narrow allowed refs or turn allow into ask/deny;
- add descriptive labels.

Project configuration must not:

- widen permissions;
- suppress confirmation;
- add hosts, repositories, credentials, or redirect rules;
- enable force/delete/tag/mirror;
- replace operator audit destinations.

Workspace trust must be established before reading any project policy. Repository content is attacker-controlled input for authorization purposes.

### Credentials and lifetime

Use a GitHub App installation rather than a personal reusable credential where GitHub is the provider. Mint immediately before the operation, restrict it to the target repository and minimal contents permission, retain it only in broker memory, and discard it after the operation. GitHub guarantees the installation token cannot exceed installation repository access or app permissions and expires after one hour [git-auth-policy-github-app-token]{3} [git-auth-policy-github-app-token]{4} [git-auth-policy-github-app-token]{5}. A shorter broker-side use window and single-operation nonce are local controls, not provider-enforced token properties.

### Audit trail

Record request, normalized plan, policy inputs with provenance, decision, confirmer identity, timestamps, plan hash, canonical repository ID, ref/OID transitions, credential type and installation/principal identifiers, transport result, and provider request IDs. Never log tokens, authorization headers, credential-helper output, or secret-bearing environment.

GitHub exposes `git.push` events, but Enterprise Cloud Git events have special API-only access and seven-day retention [git-auth-policy-github-audit-events]{1} [git-auth-policy-github-audit-events]{4}. Therefore provider audit is corroboration, not the broker's durable authorization ledger.

## Prompt-injection resistance

A GitHub-only domain allowlist does not solve prompt injection: trusted-host issue text can instruct an agent to exfiltrate `git show HEAD`, and OpenAI explicitly uses that example [git-auth-policy-codex-internet-access]{3} [git-auth-policy-codex-internet-access]{5}. Apply these controls:

1. Keep authenticated Git network and credentials outside the agent sandbox.
2. Treat repository content, issues, READMEs, hooks, config, and generated arguments as untrusted data.
3. Expose only a typed broker API; no arbitrary shell, Git options, headers, credential helpers, hooks, remote helpers, or transport URLs.
4. Derive approval facts independently; never let model-authored labels stand in for endpoint/ref/OID data.
5. Restrict agent internet independently of Git authorization; domain and HTTP-method allowlists reduce egress but do not authorize mutation [git-auth-policy-codex-internet-access]{1} [git-auth-policy-codex-internet-access]{2}.
6. Fail closed on parse errors, unknown variants, provider lookup mismatch, audit failure, stale approval, or inability to determine the remote OID.

## Disconfirming analysis

I looked across the attested systems for evidence that the broker recommendation is unnecessarily strict:

- **Codespaces** shows that a hosted isolated VM can provide an automatically expiring, repo-scoped token for interactive development [git-auth-policy-codespaces-security]{1} [git-auth-policy-codespaces-security]{2} [git-auth-policy-codespaces-security]{3}. This weakens any claim that scoped authentication authority must never enter *any* sandbox. Ordinary authenticated Git establishes that code can exercise that authority [git-auth-cred-codespaces-git-auth]{1}; the fetched evidence does not establish raw Git-token byte readability, while separately configured development secrets are printable [git-auth-policy-codespaces-security]{4}.
- **Actions checkout** shows that ephemeral job credentials plus cleanup are an accepted automation pattern [git-auth-policy-actions-checkout]{1} [git-auth-policy-actions-checkout]{2}. It is a counterexample to an absolute ban on credential availability to scripts, but not to the narrower requirement for adversarial or prompt-injectable agent code.
- **Claude Code permissions** show that command-level deny/ask/allow can be harness-enforced and operationally useful [git-auth-policy-claude-code-permissions]{1} [git-auth-policy-claude-code-permissions]{5}. Git's documented refspec and remote semantics disconfirm that these textual rules alone express endpoint/ref authorization [git-auth-policy-git-push]{1} [git-auth-policy-git-push]{2} [git-auth-policy-git-push]{4}.
- **Codex cloud** documents removal of configured secrets before the agent phase and a diff/PR completion handoff [git-auth-policy-codex-cloud-environments]{3} [git-auth-policy-codex-cloud-environments]{5}. The fetched documentation does not establish whether any separate platform-provisioned Git authority exists during that phase. Independently, a local design may choose the simpler alternative of rejecting authenticated agent Git entirely when direct push is not load-bearing.

No attested source demonstrates that a one-hour installation token is single-use, ref-scoped, or safe when visible to model-run code. No attested source demonstrates GitHub OIDC as a direct Git transport credential. Those stronger properties must come from the broker.

## Contradictions

### In-runtime scoped authority versus configured-secret removal before the agent phase — `tension`

Codespaces makes ordinary authenticated Git available inside the development environment using an expiring, access-scoped token [git-auth-cred-codespaces-git-auth]{1} [git-auth-policy-codespaces-security]{2} [git-auth-policy-codespaces-security]{3}; Codex cloud removes configured secrets before the agent phase [git-auth-policy-codex-cloud-environments]{5}, while the fetched documentation leaves any separate platform-provisioned Git authority unresolved. These are not conflicting factual claims. They express different documented controls and trust assumptions.

### Script convenience versus credential opacity — `contradicts` within the agent-threat frame

`actions/checkout` persists credentials specifically to enable later authenticated Git scripts [git-auth-policy-actions-checkout]{2}; credential opacity requires that model-run scripts cannot obtain those credentials. Both cannot hold in the same execution boundary. The broker places convenience behind a typed port rather than exposing the credential.

### Repo-distributed policy versus operator authority — `tension`

Claude Code permits permission settings checked into version control while also supporting managed constraints [git-auth-policy-claude-code-permissions]{3} [git-auth-policy-claude-code-permissions]{6}. For authenticated mutation, project policy can safely narrow but not widen operator policy; otherwise the repository being acted upon can rewrite its own authorization.

## Revisit if

- The provider offers a genuinely single-use, repository-and-ref-scoped Git credential or signed push-intent API.
- Pi gains a native secret channel proven unavailable to sandbox processes, `/proc`, environment, file reads, logs, and tool outputs.
- The broker must support non-GitHub providers, SSH, submodules, LFS, signed pushes, atomic multi-ref updates, or server-side push options.
- A required workflow needs tag mutation, deletion, force, or mirrors.
- Approval must survive long queues; OID drift and plan-expiry semantics then need redesign.
- Provider audit retention or event detail changes enough to alter the local-ledger requirement.
- Direct push ceases to be necessary; the safer diff/PR handoff should then replace the broker.

## Source-bound acquisition candidates

### GitHub App security best practices

- **Urgency:** `enriching`
- **Source:** GitHub, *Best practices for creating a GitHub App*
- **Class:** `primary-doc`
- **Web availability:** Public web documentation linked by the fetched installation-token guide; not fetched during this facet.
- **Completes:** App private-key custody, rotation, token handling, and least-permission controls for the proposed broker.
- **Grounded-by:** The fetched installation-token guide names this page as its security guidance for keeping installation tokens secure.[git-auth-policy-github-app-token]{6}

### OpenAI Codex security white paper

- **Urgency:** `enriching`
- **Source:** OpenAI, *Codex security white paper*
- **Class:** `portal`
- **Web availability:** OpenAI Trust Portal document linked by the fetched Codex security page; portal interaction may be required.
- **Completes:** Enterprise trust boundaries, control ownership, audit guarantees, and threat-model details not carried by the product page.
- **Grounded-by:** The fetched Codex approvals and security page names this white paper as the broader enterprise security overview.[git-auth-policy-codex-security]{8}

### GitHub Actions OpenID Connect reference

- **Urgency:** `enriching`
- **Source:** GitHub, *OpenID Connect reference*
- **Class:** `primary-doc`
- **Web availability:** Public web documentation linked by the fetched OIDC overview; not fetched during this facet.
- **Completes:** Token-request methods, subject and audience customization, complete claim semantics, and limits needed to assess an identity-exchange service.
- **Grounded-by:** The fetched OIDC overview names this reference for OIDC request methods, claim formats, limits, and reference information.[git-auth-policy-github-oidc]{7}

### Git configuration reference

- **Urgency:** `enriching`
- **Source:** Git project, *git-config(1)*
- **Class:** `primary-doc`
- **Web availability:** Public web documentation cross-referenced by the fetched `git-push` source; not fetched during this facet.
- **Completes:** The exhaustive configuration attack surface that can rewrite push destinations, ref selection, transport, hooks, helpers, and credentials when subprocess transport is considered.
- **Grounded-by:** The fetched `git-push` documentation cross-references `git-config(1)` while identifying configuration that changes push behavior.[git-auth-policy-git-push]{8}
