---
source_handle: git-auth-output-copilot-audit
fetched: 2026-07-10
source_url: https://github.com/github/docs/blob/f19a0135b2fe88a1ca17efbadb1d2bf14eb332b4/content/copilot/responsible-use/agents.md
provenance: source-direct
substrate_confidence: source-direct
---

# GitHub Copilot agents responsible-use documentation

## Summary

GitHub documents Copilot cloud-agent write confinement and traceability: repository-only access, push limited to one PR or `copilot/` branch, signed commits attributed to Copilot with the initiating human as co-author, and permanent links from commit messages to full agent session logs. It separately warns that agent output can expose sensitive information. These controls make privileged operations auditable and constrain refs, but session-log permanence raises the cost of any secret that reaches observable output.

## Key passages

### `Safety components and mitigations` → `Copilot cloud agent`

`Constrained permissions` limits the agent to its repository and a single non-default branch. It has no general Actions organization/repository secrets, only values specifically placed in the `copilot` environment.

`Ensuring traceability` says commits are authored by Copilot, co-authored by the initiating human, signed as Verified, and include a permanent link to full session logs.

`Firewall for data exfiltration prevention` describes a default firewall, while automated analysis includes secret scanning of generated changes.

### `Limitations`

The security-risk entry says cloud-agent generated code and natural language can expose sensitive information and directs reviewers to inspect all output before merging.

## Structural metadata

- Product: GitHub Copilot cloud agent
- Artifact type: first-party responsible-use documentation
- Revision: `f19a0135b2fe88a1ca17efbadb1d2bf14eb332b4`
- Relevant surfaces: branch/ref restriction, commit attribution/signing, permanent session-log linkage, output-risk warning
