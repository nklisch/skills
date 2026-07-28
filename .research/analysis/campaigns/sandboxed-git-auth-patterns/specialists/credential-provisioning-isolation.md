---
provenance: agent-synthesis
updated: 2026-07-10
---

# Credential provisioning and isolation in coding-agent environments

## Scope and evidence posture

This brief compares public documentation and public configuration/source evidence. No harness was executed and no credential-flow behavior was directly observed. Statements labeled **Inference** are architectural conclusions from the attested material rather than vendor claims.

The cases divide into five materially different patterns:

1. direct secret injection into the agent runtime;
2. phase-bound injection that ends before the agent runs;
3. short-lived bearer credentials scoped to an environment or job;
4. forwarding an external signing/authentication capability through a socket or helper; and
5. platform-mediated repository operations in which the agent does not receive ordinary Git command capability.

## Findings by pattern

### 1. Direct injection is common, convenient, and model-observable

GitHub Codespaces development secrets are copied into environment variables and the public documentation explicitly demonstrates that a terminal can print them with `echo $SECRET_NAME`.[git-auth-cred-codespaces-security]{5} [git-auth-cred-codespaces-security]{6} Copilot cloud agent’s dedicated Agents secrets are likewise exposed as environment variables to the agent and its tools; log masking is a presentation control, not a runtime isolation boundary.[git-auth-cred-github-copilot-secrets]{3} [git-auth-cred-github-copilot-secrets]{4} [git-auth-cred-github-copilot-secrets]{5}

Copilot does provide one narrower channel: values prefixed `COPILOT_MCP_` are available only to MCP servers rather than the agent environment.[git-auth-cred-github-copilot-secrets]{3} That is evidence for recipient-specific provisioning, but the cited documentation does not describe whether the MCP process itself is isolated from agent-triggered misuse.

**Inference:** an environment variable, readable file, or credential-helper response delivered to a process controlled by the model cannot meet the stronger goal “usable for Git but not observable by the model/process.” Redaction after capture and masking in logs reduce accidental disclosure but do not change that trust boundary.

The public OpenAI Codex secure-devcontainer configuration provides disconfirming source-code evidence against treating a “secure container” label as credential isolation. It persists GitHub CLI state in a mounted volume, bind-mounts host Git configuration, and forwards `OPENAI_API_KEY` into the container environment.[git-auth-cred-codex-secure-devcontainer]{1} [git-auth-cred-codex-secure-devcontainer]{2} [git-auth-cred-codex-secure-devcontainer]{3} This establishes a convenience-oriented local profile with firewall and inner sandboxing, not a documented credential-concealment boundary.[git-auth-cred-codex-secure-devcontainer]{5} [git-auth-cred-codex-secure-devcontainer]{6}

### 2. Phase separation keeps secrets away from the authoring agent, but cannot directly power agent-phase Git

Codex cloud distinguishes ordinary environment variables, which remain for the full task, from secrets, which are available only during setup and removed before the agent phase.[git-auth-cred-openai-cloud-environments]{2} [git-auth-cred-openai-cloud-environments]{3} Setup and agent execution also use separate Bash sessions, so a setup-time `export` does not accidentally cross the phase boundary.[git-auth-cred-openai-cloud-environments]{4}

This documents withholding configured reusable secret material from the research/authoring process. Its limitation is equally important: a removed setup secret cannot authenticate a later agent-driven `git fetch` or `git push` unless setup leaves behind another credential or delegates a capability to a service. Leaving behind a bearer token merely changes where direct injection occurs.

Codex also separates network phases: setup has internet access, agent internet is off by default, and outbound traffic is proxied.[git-auth-cred-openai-cloud-environments]{1} [git-auth-cred-openai-cloud-environments]{6} **Inference:** phase separation is well suited to dependency acquisition before untrusted authoring begins, but is not by itself an architecture for authenticated Git during authoring.

### 3. Short-lived, narrow bearer tokens reduce blast radius but do not conceal capability

Codespaces assigns a new automatically expiring GitHub token on creation or restart and scopes it according to repository access.[git-auth-cred-codespaces-security]{2} [git-auth-cred-codespaces-security]{3} Its default Git path is HTTPS with a `GITHUB_TOKEN` usually limited to the source repository; GitHub recommends this over a user SSH key that may span many repositories.[git-auth-cred-codespaces-git-auth]{2} [git-auth-cred-codespaces-git-auth]{3} Access to additional repositories requires explicit authorization or a separately provisioned fine-grained token.[git-auth-cred-codespaces-git-auth]{4} [git-auth-cred-codespaces-git-auth]{5}

GitHub Actions OIDC generalizes the short-lived approach: a job requests a unique identity JWT, the cloud provider validates workflow claims, and the provider returns a job-lifetime token that expires automatically.[git-auth-cred-github-actions-oidc]{4} [git-auth-cred-github-actions-oidc]{5} [git-auth-cred-github-actions-oidc]{6} This eliminates long-lived cloud secrets and moves authorization policy to the provider.[git-auth-cred-github-actions-oidc]{2} [git-auth-cred-github-actions-oidc]{3}

However, OIDC is federation, not concealment. The workflow step obtains and presents token material, including through `curl`.[git-auth-cred-github-actions-oidc]{7} **Inference:** a short-lived Git credential minted for the sandbox improves rotation and revocation characteristics, but remains stealable during its validity if the sandbox process can read it. Duration, audience, repository, operation, and ref restrictions therefore matter, but they do not substitute for holding the credential outside the runtime.

Codespaces documents a concrete failure mode for fallback personal tokens: embedding one in a clone URL stores it visibly in Git configuration.[git-auth-cred-codespaces-git-auth]{7}

### 4. Agent/socket forwarding withholds key bytes but forwards authentication power

VS Code Dev Containers reuses host HTTPS credential helpers and forwards a running host SSH agent into the container; it does not instruct users to copy SSH private-key files into the container.[git-auth-cred-vscode-devcontainers]{3} [git-auth-cred-vscode-devcontainers]{4} [git-auth-cred-vscode-devcontainers]{5}

OpenSSH precisely states the resulting boundary: a forwarded client cannot extract private key material, but can invoke operations with loaded keys that authenticate as the user.[git-auth-cred-openssh-agent-forwarding]{3} [git-auth-cred-openssh-agent-forwarding]{4} [git-auth-cred-openssh-agent-forwarding]{5}

**Inference:** socket forwarding satisfies “private key bytes remain outside” but not “the sandbox cannot exercise reusable authority.” A model-controlled process that can reach an unrestricted agent socket may authenticate repeatedly and potentially to destinations beyond the intended repository. Safe use therefore needs controls outside the sandbox: destination/repository binding, operation binding, expiry or single-use state, and optionally human confirmation. Merely mounting `SSH_AUTH_SOCK` is insufficient.

The VS Code page says credentials entered locally are reused in the container and vice versa.[git-auth-cred-vscode-devcontainers]{3} It does not document whether every supported HTTPS helper keeps raw bearer values outside the container, so that stronger property should not be inferred from the product-level description.

### 5. Platform-mediated repository writes provide a credential-separating capability shape

GitHub’s Copilot cloud agent documentation describes a materially narrower repository-write capability than ordinary Git. The agent may push only to one designated pull-request or `copilot/` branch and remains subject to branch protection.[git-auth-cred-github-copilot-controls]{3} GitHub states that its credentials permit only simple push operations and that the agent cannot directly run `git push` or other Git commands.[git-auth-cred-github-copilot-controls]{4} Human review is required before merge.[git-auth-cred-github-copilot-controls]{5}

The campaign's public hooks evidence records `GITHUB_COPILOT_GIT_TOKEN` inside the cloud sandbox [git-auth-output-copilot-hooks]{1}. The fetched documentation does not establish that token's raw-byte observability, protocol, lifetime, revocation mechanics, or the enforcement seam that constrains its use. It therefore does not prove a particular broker implementation. It does show a constrained repository-transition outcome while leaving credential transport and enforcement unresolved.

**Inference:** for authenticated Git without model-readable reusable credentials, an outside-the-sandbox operation adapter is stronger than passing any bearer credential inward. The adapter can validate a fixed repository, remote host, operation, branch/ref namespace, expected old object ID, and session lifetime, then perform the authenticated network operation with credentials held by the host. The sandbox receives results and an opaque capability endpoint, not a token.

## Comparative matrix

| Pattern | Credential enters agent runtime? | What the process can observe/use | Rotation/revocation posture | Explicit limitation |
|---|---|---|---|---|
| Codespaces `GITHUB_TOKEN` | Token is provisioned to the codespace; exact storage path is not established here | Ordinary HTTPS Git works; repository scope is usually narrow | New automatically expiring token on create/restart | Additional repositories require authorization; interactive environment is trusted-user oriented |
| Codespaces/Copilot secrets | Yes, as environment variables (except MCP-prefixed values) | Raw value is process-readable; Codespaces explicitly documents terminal printing | Admin update/delete and repository selection; no per-operation isolation documented | Log masking does not prevent runtime access |
| Codex cloud setup secret | Setup only; removed before agent phase | Agent cannot directly use the secret after removal | Cache invalidated on secret changes | Cannot directly authenticate agent-phase Git |
| Actions OIDC | Short-lived JWT/access token enters the job | Job can request and present bearer material | One-job lifetime and automatic expiry | Limits persistence, not in-job theft |
| Dev Containers SSH forwarding | Private key does not enter; socket capability does | Process can request authentications with loaded keys | Host agent controls key loading; no forwarded-session restriction documented | Remote socket access enables authentication operations |
| Copilot platform-mediated push | Public docs do not expose credential mechanics | Agent has a constrained push outcome, not ordinary `git push` | Not publicly specified in fetched material | Only one branch/simple push; details are opaque |

## Architecture implication for `feature-pi-sandbox-git-egress`

The fetched cases support rejecting these as the primary design:

- mounting `~/.git-credentials`, GitHub CLI auth state, or a general credential-helper store;
- injecting a PAT, OAuth token, or `GITHUB_TOKEN` into environment variables;
- relying on output redaction or session-log masking;
- forwarding an unrestricted SSH agent socket;
- treating a short TTL alone as concealment.

GitHub Copilot documents a platform-mediated, branch-constrained write capability; OIDC and Codespaces separately document narrow scope and expiry controls. A candidate design combines those properties in a host-held Git operation port outside the bwrap runtime. The sandbox side should possess only an opaque session endpoint; the host side should authenticate and authorize each operation against an immutable policy.

Minimum policy dimensions suggested by the comparison:

- exact remote host and repository identity;
- allowed operation (`fetch`, or a narrowly defined push), never arbitrary Git argv;
- allowed destination ref namespace and prohibited force/delete behavior by default;
- expected old object ID for race-safe push authorization;
- bounded session lifetime and immediate host-side revocation;
- no credential material in sandbox environment, filesystem, Git configuration, command line, or helper response;
- audit record of requested operation, validated repository/ref, result, and denial reason;
- outbound network policy that prevents bypassing the adapter with independently supplied credentials.

This does not require claiming that GitHub uses the same implementation. It adopts the documented capability shape while keeping the credential boundary explicit.

## Disconfirming analysis

I searched the attested cases for evidence against the outside-broker conclusion:

- **Direct secrets are an intentional supported feature, not universally rejected.** Codespaces and Copilot cloud agent deliberately expose secrets to tools for private registries and MCP integration.[git-auth-cred-github-copilot-secrets]{2} [git-auth-cred-codespaces-security]{5} This weakens any claim that established harnesses universally conceal credentials. It does not satisfy the engagement’s stronger non-observability requirement.
- **Short-lived in-runtime tokens can be operationally adequate.** Codespaces uses an expiring, repository-scoped token for normal Git.[git-auth-cred-codespaces-security]{2} [git-auth-cred-codespaces-git-auth]{2} For a trusted interactive workspace, reduced scope and lifetime may be a sufficient trade. A hostile/model-controlled process changes the threat model.
- **Agent forwarding is a real no-key-copy pattern.** Dev Containers forwards a host SSH agent.[git-auth-cred-vscode-devcontainers]{4} OpenSSH nevertheless confirms that the forwarded capability can authenticate even though key bytes remain hidden.[git-auth-cred-openssh-agent-forwarding]{4} [git-auth-cred-openssh-agent-forwarding]{5}
- **Network filtering is useful but incomplete.** Copilot’s firewall reduces exfiltration risk, yet GitHub says it excludes MCP/setup processes and may be bypassed.[git-auth-cred-github-copilot-firewall]{4} [git-auth-cred-github-copilot-firewall]{6} It should be defense in depth, not the credential boundary.
- **The constrained-push case is underspecified.** Copilot’s constrained push semantics are documented, but its credential transport and revocation are not. The recommendation is therefore an inference from capability shape, not a reverse-engineered vendor architecture.

## Contradictions

### Secret availability to the authoring agent

- OpenAI Codex cloud removes configured secrets before the agent phase.[git-auth-cred-openai-cloud-environments]{3}
- GitHub Copilot cloud agent exposes dedicated Agents secrets as environment variables to the agent and its tools.[git-auth-cred-github-copilot-secrets]{3} [git-auth-cred-github-copilot-secrets]{4}

Relationship: `contradicts` within the shared question “are configured secrets available during authoring?” The products choose different policies; they should not be averaged into a generic cloud-agent rule.

### Ordinary Git command capability

- Codespaces is designed so ordinary `git pull` and `git push` work with its scoped token.[git-auth-cred-codespaces-git-auth]{1} [git-auth-cred-codespaces-git-auth]{2}
- Copilot cloud agent cannot directly run `git push` or other Git commands and is limited to simple, branch-constrained pushes.[git-auth-cred-github-copilot-controls]{3} [git-auth-cred-github-copilot-controls]{4}

Relationship: `incommensurable` as security controls because Codespaces is an interactive user environment while Copilot is an autonomous agent environment. The contrast is still decision-relevant: conventional developer-environment authentication should not be imported unchanged into an autonomous sandbox.

## Source-bound acquisition candidates

### GitHub credential caching / credential-manager documentation

- **Urgency:** `enriching`
- **Source:** GitHub credential caching documentation
- **Class:** `primary-doc`
- **Web availability:** Public web URL linked by the fetched VS Code Dev Containers documentation; not fetched during this engagement.
- **Completes:** Clarifies which credential-helper variants return bearer material to container-side Git and which broker credential storage on the host.
- **Named by fetched source:** The Dev Containers page links this documentation from its HTTPS credential-helper guidance.[git-auth-cred-vscode-devcontainers]{3}

### Dev Containers known limitations

- **Urgency:** `enriching`
- **Source:** Dev Containers known limitations
- **Class:** `primary-doc`
- **Web availability:** Public web URL linked by the fetched VS Code Dev Containers documentation; not fetched during this engagement.
- **Completes:** May identify platform-specific limitations affecting forwarded sockets and credential-helper reuse.
- **Named by fetched source:** The Dev Containers credential-sharing page explicitly directs readers to this limitations section.[git-auth-cred-vscode-devcontainers]{6}

## Revisit if

- GitHub publishes Copilot cloud agent’s Git credential protocol, token lifetime, or revocation model.
- The intended pi-sandbox threat model changes from “model-controlled process may inspect all same-UID state” to a trusted interactive developer process.
- The implementation can constrain an SSH agent by destination, repository, ref, operation, and lifetime outside the sandbox.
- Git smart-HTTP transport requirements make an operation adapter unable to preserve required fetch/push semantics without exposing bearer material.
- A supported Git provider offers workload-identity exchange directly for repository-scoped, single-operation credentials.
