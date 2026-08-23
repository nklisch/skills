---
id: epic-workbench-scanning-and-release-gates
kind: epic
status: active
tags: [plugin, release-gates]
parent: null
blocked_by: []
related_to: []
research_refs: []
mock_refs: []
created: 2026-08-23
updated: 2026-08-23
---

# Adaptive scanning and optional release gates

Give Workbench one adaptive opportunity-discovery capability and let projects optionally reuse selected scan lenses at release time. Keep discovery separate from remediation, make release expectations project-owned, and avoid imposing a scanner registry, fixed gate sequence, or transaction machinery.

## Outcomes

- A `scan` feature discovers and verifies coherent opportunities, then creates backlog or active work only through an explicit user-selected handoff.
- A release-gates feature applies configured scan lenses to a release boundary and blocks only unresolved material findings under the project's stated expectation.

## Acceptance

- Natural-language scans scale from focused inline inspection to bounded multi-lane campaigns.
- Bundled lenses are reusable starting points rather than a closed catalog; project skills and `CONVENTIONS.md` may define more.
- `release_gates` is optional, structurally simple, and adaptive to project evidence during setup.
- Scanner unavailability degrades the approach rather than blocking a release by itself.
