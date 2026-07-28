---
source_handle: git-auth-policy-codex-security
fetched: 2026-07-10
source_url: https://developers.openai.com/codex/agent-approvals-security
provenance: source-direct
substrate_confidence: source-direct
---

# Codex: Agent approvals and security

## Summary

Codex separates technical sandbox capability from approval policy. Its defaults constrain workspace writes and network access, protect `.git` recursively as read-only, and require approval for network or out-of-workspace actions. Approval policy can be interactive, noninteractive, granular, or auto-reviewed. The documentation treats destructive Git and Git configuration/output override operations as commands that require approval under the `untrusted` policy and warns that prompt injection can exploit network access.

## Key passages

1. **Sandbox and approvals.** Sandbox mode controls what commands can technically do; approval policy controls when execution must stop and ask. Codex cloud uses isolated containers and a two-phase setup/agent runtime.
2. **Network access.** Workspace-write mode has network off by default. A network proxy can apply destination allow/deny rules, but enabling the proxy does not itself grant network access.
3. **Defaults and recommendations.** Version-controlled folders default toward workspace-write with on-request approvals; untrusted or unversioned folders may begin read-only until explicitly trusted.
4. **Protected paths in writable roots.** `<writable_root>/.git` is recursively read-only, including the resolved Git directory when `.git` is a pointer file. `.agents` and `.codex` are also protected.
5. **Run without approval prompts / Automatic approval reviews.** Approval requests normally route to the user. Auto-review evaluates only actions already requiring approval and checks for exfiltration, credential probing, destructive actions, and persistent security weakening; parse/review failures fail closed.
6. **Common sandbox and approval combinations / Configuration.** With `--ask-for-approval untrusted`, only known-safe reads run automatically; destructive Git operations and Git output/config-override flags require approval.
7. **Network and web-search cautions.** The documentation warns that prompt injection can cause retrieval and execution of untrusted instructions.
8. **Introduction.** The page names and links the OpenAI *Codex security white paper* at the OpenAI Trust Portal as the broader enterprise security overview.
