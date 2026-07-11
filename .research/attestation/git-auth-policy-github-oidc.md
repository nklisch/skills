---
source_handle: git-auth-policy-github-oidc
fetched: 2026-07-10
source_url: https://docs.github.com/en/actions/security-for-github-actions/security-hardening-your-deployments/about-security-hardening-with-openid-connect
provenance: source-direct
substrate_confidence: source-direct
---

# GitHub Actions OpenID Connect

## Summary

GitHub Actions OIDC replaces duplicated long-lived cloud secrets with a job-unique identity token exchanged for a short-lived provider credential. Provider trust policies validate token claims such as repository, ref, SHA, actor, workflow, environment, audience, and issuer before issuing access. GitHub describes the resulting cloud access token as valid only for the job duration.

## Key passages

1. **Overview / Benefits.** OIDC avoids long-lived GitHub-stored cloud credentials and instead requests a short-lived provider token.
2. **How OIDC integrates.** The cloud provider is configured to trust selected workflows for a defined role; GitHub generates an OIDC token for each job.
3. **How OIDC integrates.** The provider validates token claims, then returns a short-lived access token available only for the job duration.
4. **Understanding the OIDC token.** The example JWT includes `sub`, `aud`, `ref`, `sha`, `repository`, `actor_id`, `environment`, `job_workflow_ref`, `iss`, and expiration fields.
5. **Understanding the OIDC token.** Provider-side trust conditions compare subject and other claims with preconfigured policy.
6. **Custom properties.** Organization-managed repository properties can become claims for attribute-based access-control policies.
7. **Next steps / reference links.** The overview names and links GitHub's *OpenID Connect reference* for OIDC reference information, token-request methods, claim formats, and limits.
