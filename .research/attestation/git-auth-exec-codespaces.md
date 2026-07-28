---
source_handle: git-auth-exec-codespaces
fetched: 2026-07-10
source_url: https://docs.github.com/en/codespaces/reference/security-in-github-codespaces
provenance: source-direct
substrate_confidence: source-direct
---

## Summary

GitHub Codespaces' security documentation describes an interactive trusted-development model rather than credential opacity from the environment. Each create or restart assigns an expiring GitHub token scoped according to repository access. Read-only users initially receive clone-only access; on commit or push, Codespaces creates or links a fork and updates the token for write access to that fork. Codespaces secrets are copied into environment variables and can be printed from the terminal, but are withheld when the user lacks write access and in specified untrusted fork/PR scenarios. The repository's `devcontainer.json` is explicitly recognized as an arbitrary-code execution surface.

## Key passages

1. Every codespace creation or restart assigns a new GitHub token with automatic expiry.
   - *Source anchor: token scope discussion, opening paragraph.*
2. Users with write access receive a token scoped read/write to the repository; read-only users initially receive clone-only access.
   - *Source anchor: token scope list.*
3. When a read-only user commits or pushes, Codespaces creates or links a fork and updates the token for read/write access to that fork.
   - *Source anchor: token scope list, read-only case.*
4. Development-environment secrets are copied into environment variables and are readable from the terminal; they are not injected when the user lacks write access.
   - *Source anchor: `Using development environment secrets to access sensitive information`.*
5. For a codespace created from a public repository fork PR, access is limited to the fork and opening PRs on the parent, and codespace secrets are not injected.
   - *Source anchor: `Working with other people's contributions and repositories`.*
6. A repository's `devcontainer.json` can install third-party extensions and run arbitrary code through `postCreateCommand`.
   - *Source anchor: `Understanding a repository's devcontainer.json file`.*

## Structural metadata

- **Publisher:** GitHub
- **Document:** Security in GitHub Codespaces
- **Source class:** public product security documentation
- **Trust model stated by source:** user-controlled development environment with scoped token and scenario-dependent secret withholding
