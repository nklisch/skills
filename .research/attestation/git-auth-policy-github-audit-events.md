---
source_handle: git-auth-policy-github-audit-events
fetched: 2026-07-10
source_url: https://docs.github.com/en/organizations/keeping-your-organization-secure/managing-security-settings-for-your-organization/audit-log-events-for-your-organization
provenance: source-direct
substrate_confidence: source-direct
---

# GitHub organization audit-log Git events

## Summary

GitHub organization audit logs define `git.clone`, `git.fetch`, and `git.push` events. Git events have special access and retention constraints; on GitHub Enterprise Cloud they are API-only with seven-day retention, and individual events are exposed via REST API, streaming, or JSON/CSV exports rather than the web interface.

## Key passages

1. **git (lines 838–840).** Git events have special access and retention policy; Enterprise Cloud Git events are REST-API-only with seven-day retention.
2. **`git.clone` (lines 842–846).** Clone events record that a repository was cloned and include fields such as repository visibility and transport protocol.
3. **`git.fetch` (lines 848–852).** Fetch events record repository fetches and are available through REST, streaming, or exports rather than the web interface.
4. **`git.push` (lines 854–858).** Push events record repository pushes and expose transport-related fields through REST, streaming, or exports.
