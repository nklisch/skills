---
source_handle: git-auth-policy-codespaces-security
fetched: 2026-07-10
source_url: https://docs.github.com/en/codespaces/reference/security-in-github-codespaces
provenance: source-direct
substrate_confidence: source-direct
---

# Security in GitHub Codespaces

## Summary

Codespaces provisions a newly expiring GitHub token at creation or restart and scopes it according to repository access: read/write for writable source repositories, clone-only for read-only sources, and read/write to an automatically created or linked fork after a push attempt. The environment itself can access this token, and user-added development secrets are copied into environment variables that terminal commands can print. GitHub warns that repository-controlled `devcontainer.json` can execute arbitrary setup code and that untrusted contributions do not receive Codespaces secrets in selected cases.

## Key passages

1. **Environment isolation.** Each codespace runs on its own newly built VM and isolated network; outbound internet is allowed.
2. **Authentication.** Creation or restart assigns a new GitHub token with automatic expiry.
3. **Authentication.** Token scope follows repository access: read/write for writable repositories, clone-only for read-only repositories, with automatic fork linkage and token update for writes.
4. **Using development environment secrets.** Secrets are copied to environment variables and can be viewed from the terminal with `echo $SECRET_NAME`.
5. **Working with other people's contributions.** Codespaces does not inject user secrets for specified untrusted fork/PR scenarios.
6. **Understanding `devcontainer.json`.** Repository configuration is parsed during environment creation and may install extensions or run arbitrary `postCreateCommand` code.
7. **Granting access through features.** Commit signing, injected secrets, authenticated registries, and package access are identified as risk-bearing features; restrictive grants are recommended.
