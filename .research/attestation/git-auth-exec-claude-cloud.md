---
source_handle: git-auth-exec-claude-cloud
fetched: 2026-07-10
source_url: https://code.claude.com/docs/en/security
provenance: source-direct
substrate_confidence: source-direct
---

## Summary

Anthropic's Claude Code security documentation distinguishes local execution from cloud execution. For Claude Code on the web, it states that each session runs in an isolated Anthropic-managed virtual machine, network access is restricted, and GitHub authentication passes through a secure proxy: a scoped credential is present inside the sandbox and is translated to the user's actual GitHub token. It also states that pushes are restricted to the current working branch, operations are audit logged, and the environment is terminated after the session. The public page does not document the proxy protocol, scoped credential capabilities, Git subprocess environment, effective Git configuration, hook policy, or how repository-local execution features are neutralized.

## Key passages

1. Each Claude Code web session runs in an isolated, Anthropic-managed VM; network access is limited by default and can be disabled or limited to specified domains.
   - *Source anchor: `Cloud execution security`, controls list.*
2. Authentication uses a secure proxy with a scoped credential inside the sandbox that is translated to the user's actual GitHub authentication token.
   - *Source anchor: `Cloud execution security`, `Credential protection`.*
3. Git pushes are restricted to the current working branch.
   - *Source anchor: `Cloud execution security`, `Branch restrictions`.*
4. Cloud operations are audit logged and cloud environments are automatically terminated after a session.
   - *Source anchor: `Cloud execution security`, `Audit logging` and `Automatic cleanup`.*
5. Local Remote Control sessions are explicitly different: execution and file access stay on the local machine and no cloud VM or sandbox is involved.
   - *Source anchor: paragraph immediately after `Cloud execution security`.*

## Structural metadata

- **Publisher:** Anthropic
- **Document:** Claude Code Security
- **Section:** Cloud execution security
- **Source class:** public product security documentation
- **Disclosure limit:** architecture claims above are documented; Git/proxy implementation internals are not disclosed on the fetched page
