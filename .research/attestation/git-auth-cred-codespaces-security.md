---
source_handle: git-auth-cred-codespaces-security
fetched: 2026-07-10
source_url: https://docs.github.com/en/codespaces/reference/security-in-github-codespaces
provenance: source-direct
substrate_confidence: source-direct
---

# Security in GitHub Codespaces

## Summary

GitHub documents each codespace as receiving a new, automatically expiring GitHub token when created or restarted. Its repository scope reflects the user’s access, and authorization can extend to explicitly approved additional repositories. Codespaces development secrets are copied into environment variables and can be printed from the terminal. Fork/PR scenarios reduce token scope and may withhold secrets, but the standard codespace remains an interactive trusted-user environment with outbound internet access.

## Key passages

{1} Under “Isolated networking,” codespaces have isolated virtual networks and blocked inbound/inter-codespace traffic, while outbound internet connections are allowed.

{2} Under “Authentication,” every codespace creation or restart receives a new GitHub token with automatic expiry.

{3} For a user with source-repository write access, the token has repository read/write scope; for read-only access, GitHub initially limits it and may redirect writes to a fork.

{4} Access to additional repositories is included only after the user authorizes those repositories.

{5} Under “Using development environment secrets,” secrets are environment variables available in the terminal, and the documentation gives `echo $SECRET_NAME` as a way to view the value.

{6} Secret values are copied into environment variables on creation or resume and synchronized when changed.

{7} For a codespace created from a fork pull-request branch, GitHub narrows repository access and does not inject codespace secrets in the described protected scenarios.

## Structural metadata

- Publisher: GitHub
- Artifact type: public product documentation
- Subject: Codespaces token lifecycle, scope, network posture, and secret observability
