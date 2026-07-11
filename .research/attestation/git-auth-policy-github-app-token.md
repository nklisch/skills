---
source_handle: git-auth-policy-github-app-token
fetched: 2026-07-10
source_url: https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-an-installation-access-token-for-a-github-app
provenance: source-direct
substrate_confidence: source-direct
---

# GitHub App installation access tokens

## Summary

GitHub App installation access tokens are minted from an installation identity. At mint time, the requester can narrow the token to named repositories or repository IDs and a subset of the app's granted permissions. A token cannot exceed the installation's repository access or the app's permissions, and it expires after one hour.

## Key passages

1. **About installation access tokens.** An app installation must generate an installation access token; SDKs can generate and refresh these tokens.
2. **Generating an installation access token, steps 1–3.** A GitHub App JWT and installation ID authorize `POST /app/installations/INSTALLATION_ID/access_tokens`.
3. **Generating an installation access token, repository selection.** `repositories` or `repository_ids` may select up to 500 individual repositories. The token cannot gain access to repositories not granted to the installation.
4. **Generating an installation access token, permission selection.** `permissions` may narrow the token; it cannot gain permissions not granted to the app.
5. **Generating an installation access token, response.** The response states expiry, permissions, and repositories; installation access tokens expire after one hour.
6. **About installation access tokens.** The page directs readers to GitHub's *Best practices for creating a GitHub App* for guidance on keeping installation access tokens secure.
