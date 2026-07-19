---
source_handle: git-auth-cred-github-actions-oidc
fetched: 2026-07-10
source_url: https://docs.github.com/en/actions/concepts/security/openid-connect
provenance: source-direct
substrate_confidence: source-direct
---

# GitHub Actions OpenID Connect

## Summary

GitHub documents OIDC as an alternative to storing long-lived cloud credentials in repository secrets. A workflow job requests a job-unique OIDC JWT carrying workflow identity claims; a cloud provider validates those claims against configured trust and returns a short-lived access token for the job. The provider controls authorization, and the resulting credential expires automatically. The job or action still requests and presents token material during execution.

## Key passages

{1} The overview contrasts duplicated, hardcoded cloud secrets with an OIDC trust relationship that permits workflows to request short-lived provider tokens.

{2} Under “Benefits,” GitHub says OIDC removes the need to duplicate long-lived cloud credentials as GitHub secrets.

{3} The cloud provider’s authentication and authorization controls can grant granular resource access.

{4} The cloud provider issues a short-lived access token valid for one job, after which it automatically expires.

{5} Each job receives an automatically generated, job-unique OIDC JWT containing claims about the requesting workflow.

{6} A workflow step or action requests the GitHub OIDC token, presents it to the provider, and receives a short-lived provider access token only after claim validation.

{7} The page says custom actions can request OIDC through the Actions toolkit `getIDToken()` method or `curl`.

## Structural metadata

- Publisher: GitHub
- Artifact type: public product documentation
- Subject: workload identity federation and short-lived job credentials
