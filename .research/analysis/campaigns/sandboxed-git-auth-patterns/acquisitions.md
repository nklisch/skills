---
campaign: sandboxed-git-auth-patterns
authored: 2026-07-11
provenance: agent-synthesis
---

# Acquisition manifest

## GitHub App security best practices

- **Source:** GitHub, *Best practices for creating a GitHub App*
- **Class:** primary-doc
- **Web availability:** web-summary-only
- **Urgency:** enriching
- **Grounded-by:** [git-auth-policy-github-app-token]{6}
- **Completes:** App private-key custody, rotation, installation-token handling, and least-permission controls for a host-side adapter.

## GitHub Actions OpenID Connect reference

- **Source:** GitHub, *OpenID Connect reference*
- **Class:** primary-doc
- **Web availability:** web-summary-only
- **Urgency:** enriching
- **Grounded-by:** [git-auth-policy-github-oidc]{7}
- **Completes:** Token-request methods, claim formats, customization, and limits if workload identity is considered for adapter authentication.

## Git configuration reference

- **Source:** Git project, `git-config(1)`
- **Class:** primary-doc
- **Web availability:** web-summary-only
- **Urgency:** enriching
- **Grounded-by:** [git-auth-policy-git-push]{8}
- **Completes:** Configuration precedence, protected configuration, includes, command overrides, credential helpers, transport rewriting, and the reset burden for any hermetic CLI broker.

## GitHub Agentic Workflows threat detection guide

- **Source:** GitHub, *Agentic Workflows Threat Detection Guide*
- **Class:** primary-doc
- **Web availability:** web-summary-only
- **Urgency:** enriching
- **Grounded-by:** [git-auth-output-ghaw-architecture]{9}
- **Completes:** Verdict failure, timeout, customization, and bypass semantics at the pre-actuation gate.

## GitHub Agentic Workflows cross-repository operations

- **Source:** GitHub, *Agentic Workflows Cross-Repository Operations*
- **Class:** primary-doc
- **Web availability:** web-summary-only
- **Urgency:** enriching
- **Grounded-by:** [git-auth-output-ghaw-safe-outputs]{5}
- **Completes:** Repository canonicalization, allowed-target enforcement, and credential scoping for structured cross-repository writes.
