---
provenance: agent-synthesis
authored: 2026-07-10
updated: 2026-07-11
campaign: sandboxed-git-auth-patterns
facet: execution-boundary-repository-risk
---

# Git execution boundary and repository-controlled execution risk

## Scope and evidence boundary

This facet examined public Git documentation and public documentation or implementation from Anthropic Claude Code, GitHub Copilot cloud agent, GitHub Codespaces, Visual Studio Code Dev Containers, and `actions/checkout`. The evidence distinguishes three questions that are often collapsed:

1. **Where does the Git process run?** In the model-facing sandbox/VM/container, in a pre-agent setup phase, or outside it.
2. **Where does authentication occur?** In Git config or environment, through a forwarded helper/agent, or at a credential-translation proxy.
3. **Who controls Git's executable inputs?** The platform, the checked-out repository, or the model through writable `.git` state.

`[Observed]` marks direct source description. `[Inference]` marks a security consequence derived from attested mechanics. `[Gap]` marks an implementation detail not publicly established by the fetched source.

## Findings

### 1. A disclosed model combines in-sandbox Git with out-of-sandbox credential translation

**Claude Code on the web.** `[Observed]` Anthropic documents an isolated managed VM per cloud session and restricted network access [git-auth-exec-claude-cloud]{1}. A secure authentication proxy translates a scoped credential inside the sandbox to the user's actual GitHub token [git-auth-exec-claude-cloud]{2}. It separately documents current-branch-only pushes [git-auth-exec-claude-cloud]{3}, audit logging, and teardown after the session [git-auth-exec-claude-cloud]{4}. In this fetched design, the reusable upstream token is not the credential placed in the model's VM.

`[Gap]` The public page does not say whether the model invokes an ordinary Git binary directly, how the scoped credential reaches Git, what requests the proxy accepts, whether repository/ref checks occur in the proxy or elsewhere, or whether Git config, hooks, helpers, filters, merge drivers, submodules, and environment variables are neutralized. “Scoped credential” and “current branch” establish outcomes, not the enforcement seam.

**GitHub Copilot cloud agent.** `[Observed]` Copilot works in an ephemeral GitHub Actions-powered environment [git-auth-exec-github-copilot-cloud]{1} and automates branch creation, commits, and pushes [git-auth-exec-github-copilot-cloud]{2} while operating on one branch for one task [git-auth-exec-github-copilot-cloud]{3}. Repository rulesets and branch protections can block incompatible agent behavior [git-auth-exec-github-copilot-cloud]{4}. `[Observed]` A distinct repository-owned setup workflow runs before the agent [git-auth-exec-github-copilot-setup]{1}, only when present on the default branch [git-auth-exec-github-copilot-setup]{2}; its Actions permissions are separately minimized, and GitHub says Copilot receives its own token for later operations [git-auth-exec-github-copilot-setup]{3}.

`[Inference]` Copilot's split phase is a useful trust pattern: privileged or dependency-establishing setup is selected from a trusted branch before model execution, rather than from the task's mutable branch. The agent's later Git identity is separate from the setup job token. `[Gap]` Public docs do not disclose whether later authenticated Git is a direct CLI operation with a readable credential, a platform service, or a broker, and do not document repository-local Git execution defenses.

### 2. Established developer and CI patterns often expose a reusable capability to the sandboxed process

**GitHub Actions checkout.** `[Observed]` `actions/checkout` intentionally persists an HTTPS token in local Git config by default so arbitrary later workflow scripts can authenticate; post-job cleanup removes it [git-auth-exec-actions-checkout]{1}. The implementation masks the encoded token in logs [git-auth-exec-actions-checkout]{2} and writes a placeholder before directly replacing config-file content, avoiding command-line process-audit capture [git-auth-exec-actions-checkout]{3}. SSH mode writes a private key under `RUNNER_TEMP`, exports `GIT_SSH_COMMAND`, and may persist `core.sshCommand` [git-auth-exec-actions-checkout]{4}. Submodule auth is propagated into submodule configs [git-auth-exec-actions-checkout]{5}. Git-unavailable checkout can fall back to a GitHub REST download, but that fallback excludes submodules and SSH-key checkout [git-auth-exec-actions-checkout]{7}.

`[Inference]` This is process-log hygiene, not credential opacity from an adversarial job. A model able to read `.git/config`, its environment, or the temporary SSH key can recover or reuse the same capability. The REST fallback demonstrates that an API path can avoid Git for initial materialization, but it is not a drop-in authenticated Git transport and does not cover push.

**VS Code Dev Containers.** `[Observed]` Dev Containers copies the host `.gitconfig` into the container [git-auth-exec-vscode-devcontainers]{2}, reuses the host HTTPS credential helper bidirectionally [git-auth-exec-vscode-devcontainers]{3}, and forwards the host SSH agent [git-auth-exec-vscode-devcontainers]{4}. `[Inference]` This keeps some long-lived key material on the host, but it does not by itself make the capability non-reusable by arbitrary container processes: a process can ask a credential helper for credentials or ask a forwarded agent to sign. No endpoint, repository, ref, or operation policy is documented at this seam.

**GitHub Codespaces.** `[Observed]` Codespaces assigns a new expiring GitHub token when a codespace is created or restarted [git-auth-exec-codespaces]{1}; users with repository write access receive read/write scope, while read-only users initially receive clone-only access [git-auth-exec-codespaces]{2} and are shifted to write access on a fork when they commit or push [git-auth-exec-codespaces]{3}. Codespaces secrets are environment variables readable from the terminal and are withheld without repository write access [git-auth-exec-codespaces]{4} and in named untrusted fork scenarios [git-auth-exec-codespaces]{5}. GitHub also warns that `devcontainer.json` can run arbitrary repository-provided setup code [git-auth-exec-codespaces]{6}.

`[Inference]` Codespaces controls blast radius primarily through token scope, expiry, fork routing, and trust classification. The fetched evidence establishes that code in the codespace can exercise authenticated Git authority, but not that it can read the Git token's raw bytes. This still prevents treating “short-lived and scoped” as equivalent to “authority unavailable to model-run code.”

### 3. A privileged Git process pointed at agent-writable repository state is a code-execution bridge

#### Hooks

`[Observed]` Git executes enabled hooks [git-auth-exec-git-hooks]{1} from `$GIT_DIR/hooks` unless `core.hooksPath` redirects lookup [git-auth-exec-git-hooks]{2}. Git invokes hooks from the worktree or Git directory [git-auth-exec-git-hooks]{3} with repository environment variables [git-auth-exec-git-hooks]{4}. `post-checkout` runs after checkout or switch, after clone unless checkout is suppressed, and after worktree creation unless checkout is suppressed [git-auth-exec-git-hooks]{5}; `pre-push` runs before transmission and can abort the push [git-auth-exec-git-hooks]{6}.

`[Inference]` A broker that merely runs `git push` outside the sandbox against an agent-writable `.git` directory grants the agent a path to execute code with broker privileges: write `.git/hooks/pre-push`, or alter effective `core.hooksPath`, then request a push. The same bridge exists for any privileged Git operation whose hook fires. Per-command `git -c core.hooksPath=/dev/null …` is necessary for a CLI broker but not sufficient for the other command-bearing surfaces below.

#### Filters, external diffs, and merge drivers

`[Observed]` Tracked attributes select named filter drivers whose clean and smudge commands run on check-in and checkout [git-auth-exec-git-config-exec]{1}; the command definitions can live in `.git/config` [git-auth-exec-git-config-exec]{3}. Process filters can live for a whole Git command [git-auth-exec-git-config-exec]{2}. Named external diff commands execute for matching paths [git-auth-exec-git-config-exec]{4}, and custom merge-driver commands run during merge-like operations [git-auth-exec-git-config-exec]{5}.

`[Inference]` If the agent can mutate `.git/config`, a later privileged `git add`, `git diff`, `git log`, `git merge`, `git cherry-pick`, or checkout can execute agent-selected commands. Even if local config is broker-owned, repository-controlled `.gitattributes` can select a preconfigured dangerous driver. A safe broker must start from a known config and either reject command-bearing driver configuration or avoid commands that consult those mechanisms.

#### SSH command, helpers, and inherited environment

`[Observed]` `actions/checkout` uses both `GIT_SSH_COMMAND` and `core.sshCommand` [git-auth-exec-actions-checkout]{4}, persists HTTPS authentication in local Git config [git-auth-exec-actions-checkout]{1}, and temporarily configures global authentication for submodule operations [git-auth-exec-actions-checkout]{5}. `[Observed]` Dev Containers forwards credential-helper [git-auth-exec-vscode-devcontainers]{3} and SSH-agent capabilities into the container [git-auth-exec-vscode-devcontainers]{4}.

`[Inference]` A privileged Git adapter must not inherit agent-controlled `HOME`, `XDG_CONFIG_HOME`, `GIT_CONFIG_*`, `GIT_SSH`, `GIT_SSH_COMMAND`, `SSH_AUTH_SOCK`, askpass variables, proxy variables, or credential-helper configuration. Otherwise the repository or model can redirect the privileged process to an executable helper, a different config graph, or a signing/authentication oracle. A narrow environment allowlist is safer than deleting a remembered denylist.

#### Submodules and protocol expansion

`[Observed]` `.gitmodules` supplies repository-controlled URLs [git-auth-exec-git-submodules]{1} that initialization copies into local config [git-auth-exec-git-submodules]{2}. Git deliberately refuses to copy a tracked custom submodule update command “for security reasons” [git-auth-exec-git-submodules]{3}, but local submodule config can contain an arbitrary `!command` [git-auth-exec-git-submodules]{4}. Synchronization can copy changed tracked URLs into initialized submodule remotes [git-auth-exec-git-submodules]{5}.

`[Inference]` This is both disconfirming evidence and a warning. Git already prevents one direct tracked-file-to-command escalation, so not every submodule operation blindly executes repository content. But recursive or synchronized submodule operations still expand the endpoint set and can consume local command-bearing config. A Git egress broker should reject recursion and submodule commands by default; enabling them requires per-submodule endpoint and ref validation plus sanitized local config.

#### Worktrees

`[Observed]` Linked worktrees share most refs [git-auth-exec-git-worktrees]{2} and repository config by default [git-auth-exec-git-worktrees]{3}. Optional worktree config is read after common `.git/config` [git-auth-exec-git-worktrees]{4}.

`[Inference]` A worktree path is not a self-contained policy scope. Validating only the requested working-directory path misses its common Git directory, shared refs, shared hooks/config, and later-read `config.worktree`. A broker must resolve and authorize the common directory and all effective config paths, or reject linked worktrees.

#### `safe.directory` is not config sanitization

`[Observed]` `actions/checkout` adds `safe.directory` through temporary global config when a container job uses a different user [git-auth-exec-actions-checkout]{6}. `[Inference]` This makes Git willing to treat the path as owned/trusted for Git's ownership check. It does not establish that hooks, local config, helpers, or drivers are trusted. Automatically adding an agent-writable repository to `safe.directory` before privileged Git expands trust; it does not contain it.

## Architecture implications

### Candidate A — ordinary Git entirely inside the sandbox with forwarded credentials

**Evidence:** Dev Containers forwards a credential helper [git-auth-exec-vscode-devcontainers]{3} or SSH agent [git-auth-exec-vscode-devcontainers]{4}; Codespaces assigns expiring tokens with access-dependent scope [git-auth-exec-codespaces]{1} [git-auth-exec-codespaces]{2}; Actions persists auth in Git config [git-auth-exec-actions-checkout]{1}.

**Assessment:** Reject for the stated “not model-observable/reusable” requirement. It can be acceptable only if the credential itself is intentionally expendable, narrowly scoped, short-lived, endpoint-bound, and the operator accepts model reuse within that scope. SSH-agent forwarding is not enough: key bytes remain hidden, but signing authority remains available.

### Candidate B — ordinary Git in the sandbox, credential translation at an egress proxy

**Evidence:** Claude Code on the web publicly describes a scoped in-sandbox credential translated by a secure proxy to the actual GitHub token [git-auth-exec-claude-cloud]{2}, with branch restrictions [git-auth-exec-claude-cloud]{3} and audit logging [git-auth-exec-claude-cloud]{4}.

**Assessment:** Preferred pattern if the proxy authenticates structured operation intent, not merely arbitrary HTTP/SSH byte streams. The in-sandbox capability should be session-bound, repository-bound, endpoint-bound, operation-bound, ref-bound, short-lived, non-exportable beyond the current process/session where feasible, and replay-audited. A generic CONNECT proxy plus a reusable bearer token would not establish these properties.

### Candidate C — privileged out-of-sandbox Git CLI broker pointed at the live repository

**Assessment:** Reject unless the broker builds a hermetic Git execution environment. Running host Git against the live agent-writable `.git` state turns hooks [git-auth-exec-git-hooks]{1} [git-auth-exec-git-hooks]{2} [git-auth-exec-git-hooks]{6}, configured filters and merge drivers [git-auth-exec-git-config-exec]{1} [git-auth-exec-git-config-exec]{2} [git-auth-exec-git-config-exec]{4} [git-auth-exec-git-config-exec]{5}, local submodule commands and synchronized URLs [git-auth-exec-git-submodules]{4} [git-auth-exec-git-submodules]{5}, and shared worktree refs/config [git-auth-exec-git-worktrees]{2} [git-auth-exec-git-worktrees]{3} [git-auth-exec-git-worktrees]{4} into privileged execution inputs. A command allowlist alone is insufficient.

If retained, the minimum defensible shape is:

- execute with a clean environment and broker-owned `HOME`/global/system config;
- disable hooks per command;
- reject or override command-bearing filters, diffs, merge drivers, credential helpers, SSH commands, and external protocols;
- reject linked worktrees unless common-dir policy is explicit;
- reject submodule recursion/sync/update unless every URL and config path is validated;
- validate repository identity, remote endpoint, expected old/new object IDs, and destination ref immediately before transport;
- never expose raw stdout/stderr containing credentials;
- run as an unprivileged service identity with no broader filesystem or network authority than needed.

Even then, proving all Git config surfaces are closed is a continuing burden.

### Candidate D — structured transport service or library outside the sandbox

**Evidence:** `actions/checkout` uses a REST API fallback for initial download when Git is unavailable, with explicit feature loss [git-auth-exec-actions-checkout]{7}. Copilot separates default-branch setup from later agent work [git-auth-exec-github-copilot-setup]{1} [git-auth-exec-github-copilot-setup]{2} and gives the agent its own operation token [git-auth-exec-github-copilot-setup]{3}.

**Assessment:** Prefer over a host Git CLI broker for push/fetch if the service accepts structured inputs: repository ID, allowed endpoint, operation, expected object IDs, destination ref, and object data. It should construct requests without reading live repository Git config or executing repository-provided programs. Trade-offs are protocol implementation complexity, pack/object validation, and feature gaps such as submodules, LFS, partial clone, alternate object databases, and custom transports.

## Recommended decision for `feature-pi-sandbox-git-egress`

**Recommendation:** Do not run authenticated host Git against the agent's live repository. Choose one of two bounded architectures:

1. **In-sandbox Git with a Claude-cloud-like translation proxy** when compatibility with normal Git is essential. Give the sandbox only a session-scoped surrogate and enforce repository/endpoint/operation/ref policy at the proxy. Keep the actual reusable credential outside model-observable state.
2. **A structured hosting-service adapter** when the initial scope can be limited to named operations (for example, fetch a known repository/ref or push the current branch with an expected old OID). This avoids repository-controlled Git execution on the privileged side because it need not parse live `.git/config` or execute Git hooks/helpers/drivers.

If neither can enforce ref and endpoint semantics independently of the sandbox, reject the feature rather than shipping credential forwarding under a stronger security label.

## Disconfirming analysis

The load-bearing claim tested was: **authenticated Git must move outside the sandbox to keep reusable credentials safe.** The fetched evidence qualifies that claim:

1. **Proxy translation permits Git to remain inside.** Claude Code on the web documents an in-sandbox scoped credential translated to the real GitHub token, showing that Git execution and real-credential custody need not share a boundary [git-auth-exec-claude-cloud]{2}.
2. **Codespaces combines scoped tokens with observable development secrets.** Codespaces assigns expiring tokens [git-auth-exec-codespaces]{1}, varies their scope by repository access [git-auth-exec-codespaces]{2}, and routes users lacking repository write access to fork-scoped write access when they commit or push [git-auth-exec-codespaces]{3}. It separately makes development-environment secrets terminal-readable while withholding them in specified trust scenarios [git-auth-exec-codespaces]{4} [git-auth-exec-codespaces]{5}. This weakens any universal claim that all environment-visible credentials are categorically unacceptable, but it does not establish that the Codespaces GitHub token itself is terminal-readable or satisfy this engagement's stricter non-reuse requirement.
3. **Forwarded agents/helpers avoid copying key material.** Dev Containers reuses a host credential helper [git-auth-exec-vscode-devcontainers]{3} and forwards the host SSH agent [git-auth-exec-vscode-devcontainers]{4}. However, it forwards an authentication capability and does not document operation/ref restrictions, so it disconfirms only “secret bytes must be copied,” not “the model cannot reuse authority.”
4. **Git contains selective defenses.** Submodule initialization refuses to promote a tracked custom update command into local config [git-auth-exec-git-submodules]{3}. Therefore, repository-controlled execution risk must be evaluated surface by surface rather than asserted as “Git executes every tracked setting.”
5. **API fallback has real compatibility loss.** Actions' REST fallback cannot handle submodules or SSH-key checkout [git-auth-exec-actions-checkout]{7}. A structured adapter reduces execution risk but is not behaviorally equivalent to Git.

**Search outcome:** No fetched source showed a public, complete implementation that simultaneously (a) supports general authenticated Git, (b) keeps reusable upstream credentials outside model-observable state, and (c) documents neutralization of hooks, local config, helpers, filters, merge drivers, submodules, worktrees, and inherited environment. Claude Code web documents a translation proxy, while the fetched page leaves its Git/proxy implementation internals undisclosed.

## Contradictions

| Relationship | Sources | Positions |
|---|---|---|
| `tension` | [git-auth-exec-actions-checkout]{1} / [git-auth-exec-vscode-devcontainers]{3} [git-auth-exec-vscode-devcontainers]{4} vs. [git-auth-exec-claude-cloud]{2} | Actions makes persisted authentication usable by later job processes, and Dev Containers forwards helper/agent authentication capability. Claude Code web keeps the upstream GitHub token behind translation from a scoped sandbox credential, but the scoped capability's process exposure and replay behavior are not documented. These positions differ on upstream-token custody while leaving delegated-capability reuse incommensurate. |
| `tension` | [git-auth-exec-codespaces]{1} [git-auth-exec-codespaces]{2} [git-auth-exec-codespaces]{4} vs. [git-auth-exec-claude-cloud]{2} | Codespaces assigns expiring access-scoped tokens and separately makes development secrets environment-readable; Claude web documents credential translation for GitHub authentication. One product accepts environment observability for development secrets, while the other documents a proxy boundary for its GitHub token. The fetched Codespaces attestation does not establish whether its GitHub token is itself environment-readable. |
| `qualifies` | [git-auth-exec-git-submodules]{3} [git-auth-exec-git-submodules]{4} / [git-auth-exec-git-hooks]{1} [git-auth-exec-git-hooks]{2} [git-auth-exec-git-hooks]{6} | Git's refusal to copy a tracked custom submodule command narrows the repository-code-execution claim; hook execution and local custom submodule commands show that writable Git state remains executable input. |
| `incommensurable` | [git-auth-exec-github-copilot-setup]{1} [git-auth-exec-github-copilot-setup]{2} [git-auth-exec-github-copilot-setup]{3} / [git-auth-exec-git-config-exec]{1} [git-auth-exec-git-config-exec]{4} [git-auth-exec-git-config-exec]{5} | Copilot's default-branch pre-agent setup is a platform trust-phase rule; Git's driver behavior is a local execution mechanism. The setup rule reduces one repository-controlled path but does not by itself answer whether later Git driver/config surfaces are sanitized. |

No merger is asserted: the patterns reflect different trust assumptions rather than a single industry consensus.

## Revisit if

- Anthropic publishes the Claude Code web Git proxy protocol, surrogate-token scope, or hook/config sanitization details.
- GitHub publishes Copilot cloud agent's Git credential transport or its effective Git configuration and hook policy.
- The feature scope expands beyond GitHub HTTPS to SSH, arbitrary remotes, Git LFS, partial clone, alternates, submodules, or linked worktrees.
- Pi's sandbox makes `.git` read-only or separates Git metadata into a broker-owned directory; that would materially reduce, but not eliminate, live-repository execution inputs.
- A chosen library or service can validate pack/object reachability and enforce expected-old-OID plus destination-ref atomically.
- The threat model changes to accept short-lived, repository-scoped authority that model-run code can exercise—and, in some implementations, read as credential material; Codespaces and Actions then become more relevant precedents.

## Revisions

- **2026-07-11 — Correction:** Replaced source-order-like citation numbers with attestation passage anchors, split omnibus citations by factual specific, neutralized corpus-wide `closest` language, clarified the Codespaces token-versus-secret evidence boundary, and removed acquisition candidates whose names and exact URLs were not recorded in the cited attestations. The architecture position is unchanged.
