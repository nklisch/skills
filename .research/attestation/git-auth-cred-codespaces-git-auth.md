---
source_handle: git-auth-cred-codespaces-git-auth
fetched: 2026-07-10
source_url: https://docs.github.com/en/codespaces/troubleshooting/troubleshooting-authentication-to-a-repository
provenance: source-direct
substrate_confidence: source-direct
---

# Git authentication in GitHub Codespaces

## Summary

GitHub documents Codespaces’ default Git path as HTTPS authenticated by a `GITHUB_TOKEN` with generally one-repository read/write scope. It recommends that scoped token over SSH because an exposed SSH key may span repositories. Access to other repositories requires explicit devcontainer permissions or a separately provisioned fine-grained personal access token. The latter may be passed through an environment variable or Codespaces secret; embedding it in a clone URL stores it visibly in Git configuration.

## Key passages

{1} For the source repository, `git pull` and `git push` usually work without additional authentication.

{2} Codespaces uses HTTPS by default with a `GITHUB_TOKEN` configured for source-repository read/write access.

{3} GitHub says this token is usually limited to one repository and recommends it over SSH, whose key may authorize many repositories if exposed.

{4} The default token does not access other repositories; additional repository permissions can be requested in devcontainer configuration and authorized by the user.

{5} For ad hoc additional access, GitHub recommends a fine-grained personal access token limited to needed repositories and `Contents` permissions.

{6} That personal token can be added as an environment variable or Codespaces secret, and a `GH_TOKEN` variable is automatically used by GitHub CLI operations.

{7} Cloning with a token-bearing URL stores the token in repository Git configuration; the page warns that the token is then visible and recommends trusting the repository and minimizing scope.

## Structural metadata

- Publisher: GitHub
- Artifact type: public troubleshooting documentation
- Subject: Codespaces HTTPS Git authentication and fallback token handling
