---
source_handle: git-auth-policy-actions-checkout
fetched: 2026-07-10
source_url: https://github.com/actions/checkout/blob/main/README.md
provenance: source-direct
substrate_confidence: source-direct
---

# actions/checkout README

## Summary

`actions/checkout` intentionally makes authenticated follow-on Git commands possible by persisting the authentication token, then removes it during post-job cleanup. The behavior is optional via `persist-credentials: false`. Current documentation notes improved storage in a separate file under `$RUNNER_TEMP` rather than directly in `.git/config`, but this remains a credential available to job scripts.

## Key passages

1. **What's new / credential security.** The README states that persisted credentials are stored in a separate file under `$RUNNER_TEMP` instead of directly in `.git/config`.
2. **Usage introduction.** By default the auth token is persisted in local Git configuration so scripts can run authenticated Git commands; it is removed in post-job cleanup.
3. **Usage introduction.** `persist-credentials: false` opts out.
4. **Inputs / `token`.** The checkout token input is used to fetch the repository.
5. **Inputs / `persist-credentials`.** Persistence controls whether the token or SSH key remains configured for authenticated Git commands.
6. **Recommended permissions.** The README recommends least `GITHUB_TOKEN` permissions (`contents: read`) unless an alternative token or SSH key is supplied.
